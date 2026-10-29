import { readFile, readdir, stat } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { AnalysisInputError } from "../../domain/analysisErrorCore.js";
import {
  detectRegisteredFormat,
  extractPrintableStrings,
  type FormatDetection,
} from "../../domain/formatRegistry.js";
import {
  validatePluginManifest,
  type PluginManifest,
} from "../../domain/pluginContract.js";
import {
  INVESTIGATION_WORKFLOW_VERSION,
  createPendingStages,
  isResumableJobStatus,
  type InvestigationFinding,
  type InvestigationJob,
  type InvestigationProject,
  type InvestigationStage,
  type InvestigationStageId,
  type InvestigationTarget,
} from "../../domain/investigationProject.js";
import {
  createAiDisclosure,
  parseAiInterpretation,
  parseAiProviderSettings,
  type AiDisclosure,
  type AiInterpretation,
} from "../../domain/aiProviderContract.js";
import { err, ok, type Result } from "../../domain/result.js";
import {
  renderInvestigationReportJson,
  renderInvestigationReportMarkdown,
  type InvestigationReport,
} from "../../domain/investigationReport.js";
import { aiProviderStatus, interpretEvidenceWithAi } from "./AiProvider.js";
import { probeAnalysisBackends, type BackendAvailability } from "./BackendProbe.js";
import {
  addProjectTarget,
  createInvestigationJob,
  findReusableCompletedJob,
  hashLocalFile,
  investigationProjectPaths,
  loadInvestigationJob,
  loadInvestigationProject,
  readLocalFilePrefix,
  saveInvestigationJob,
  writeInvestigationEvidence,
} from "./ProjectStore.js";
import {
  nextAnalysisCommandsFor,
  remainingWorkflowsFor,
} from "./RemainingWorkflows.js";
import { writeInvestigationReports } from "./ReportWriter.js";

const MAX_PROBE_BYTES = 8 * 1024;
const MAX_STRING_SCAN_BYTES = 64 * 1024;

const inputError = (operation: string, message: string): AnalysisInputError =>
  new AnalysisInputError(operation, { userMessage: message }, [
    { path: [], reason: "invalid_value", message },
  ]);

const updateStage = (
  job: InvestigationJob,
  id: InvestigationStageId,
  status: InvestigationStage["status"],
  extra: Partial<InvestigationStage> = {},
): InvestigationJob => ({
  ...job,
  updated_at: new Date().toISOString(),
  stages: job.stages.map((stage) =>
    stage.id === id
      ? {
          ...stage,
          ...extra,
          status,
          ...(status === "running"
            ? { started_at: extra.started_at ?? new Date().toISOString() }
            : {}),
          ...(status === "completed" || status === "failed" || status === "skipped"
            ? { finished_at: extra.finished_at ?? new Date().toISOString() }
            : {}),
        }
      : stage,
  ),
});

export interface InvestigationWorkflowResult {
  readonly project: InvestigationProject;
  readonly target: InvestigationTarget;
  readonly job: InvestigationJob;
  readonly format: FormatDetection;
  readonly backends: readonly BackendAvailability[];
  readonly report: InvestigationReport | null;
  readonly plugins: readonly PluginManifest[];
  readonly reused_job?: boolean;
}

const detectTargetFormat = async (
  path: string,
): Promise<Result<FormatDetection, AnalysisInputError>> => {
  const resolved = resolve(path);
  const info = await stat(resolved);
  if (info.isDirectory()) {
    const detected = detectRegisteredFormat({
      bytes: new Uint8Array(),
      fileName: basename(resolved),
      fileSize: 0,
      directory: true,
    });
    return detected.ok
      ? ok(detected.value)
      : err(inputError("detect_format", detected.error));
  }
  const prefix = await readLocalFilePrefix(resolved, MAX_PROBE_BYTES);
  if (!prefix.ok) return prefix;
  const detected = detectRegisteredFormat({
    bytes: prefix.value,
    fileName: basename(resolved),
    fileSize: info.size,
    hostArchitecture: process.arch,
  });
  return detected.ok
    ? ok(detected.value)
    : err(inputError("detect_format", detected.error));
};

const collectStaticFindings = async (
  target: InvestigationTarget,
  format: FormatDetection,
): Promise<{
  findings: InvestigationFinding[];
  limitations: string[];
}> => {
  const findings: InvestigationFinding[] = [
    {
      finding_id: "ev_format",
      title: `Detected format ${format.format}`,
      kind: "metadata",
      confidence: format.confidence,
      evidence_ids: ["ev_format"],
      details: format.diagnostic,
      verified: format.confidence === "observed",
      target_id: target.target_id,
      target_sha256: target.sha256,
      provider: "builtin-static",
    },
  ];
  if (format.architecture !== null) {
    findings.push({
      finding_id: "ev_arch",
      title: `Architecture ${format.architecture}`,
      kind: "metadata",
      confidence: "observed",
      evidence_ids: ["ev_arch"],
      details: `Header parsing recovered architecture ${format.architecture}.`,
      verified: true,
      target_id: target.target_id,
      target_sha256: target.sha256,
      provider: "builtin-static",
    });
  }
  const limitations = [
    "Project analysis performs bounded static inspection only. Deep decompilation requires an installed Hopper, Ghidra, IDA, or Kuna provider.",
    "Unknown binaries are never executed during inspect-target or analyze-project.",
  ];
  if (!format.supported)
    limitations.push("The detected format is unsupported or empty.");
  if (target.size_bytes > 0 && format.format !== "source-repository") {
    const prefix = await readLocalFilePrefix(target.path, MAX_STRING_SCAN_BYTES);
    if (prefix.ok) {
      const strings = extractPrintableStrings(prefix.value);
      if (strings.length > 0) {
        findings.push({
          finding_id: "ev_strings",
          title: "Printable strings",
          kind: "string",
          confidence: "observed",
          evidence_ids: ["ev_strings"],
          details: strings.slice(0, 32).join("\n"),
          verified: true,
          target_id: target.target_id,
          target_sha256: target.sha256,
          provider: "builtin-static",
        });
      }
      if (target.size_bytes > MAX_STRING_SCAN_BYTES)
        limitations.push(
          `String extraction scanned the first ${String(MAX_STRING_SCAN_BYTES)} bytes only.`,
        );
    }
  }
  return { findings, limitations };
};

export const importInvestigationTarget = async (
  projectRoot: string,
  targetPath: string,
  signal?: AbortSignal,
): Promise<Result<InvestigationWorkflowResult, AnalysisInputError>> => {
  const project = await loadInvestigationProject(projectRoot);
  if (!project.ok) return project;
  const hashed = await hashLocalFile(targetPath, signal);
  if (!hashed.ok) return hashed;
  const format = await detectTargetFormat(targetPath);
  if (!format.ok) return format;
  const added = await addProjectTarget(projectRoot, {
    path: resolve(targetPath),
    display_name: basename(resolve(targetPath)),
    sha256: hashed.value.sha256,
    size_bytes: hashed.value.sizeBytes,
    format: format.value.format,
    architecture: format.value.architecture,
  });
  if (!added.ok) return added;
  const reloaded = await loadInvestigationProject(projectRoot);
  if (!reloaded.ok) return reloaded;
  return ok({
    project: reloaded.value,
    target: added.value,
    job: createInvestigationJob(added.value, reloaded.value.config),
    format: format.value,
    backends: await probeAnalysisBackends(),
    report: null,
    plugins: [],
  });
};

const loadPlugins = async (
  projectRoot: string,
): Promise<readonly PluginManifest[]> => {
  const directory = investigationProjectPaths(projectRoot).plugins;
  let entries: string[] = [];
  try {
    entries = await readdir(directory);
  } catch {
    return [];
  }
  const manifests: PluginManifest[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    try {
      const parsed = JSON.parse(await readFile(join(directory, entry), "utf8"));
      const validated = validatePluginManifest(parsed);
      if (validated.ok) manifests.push(validated.value);
    } catch {
      // Invalid plugin documents are ignored and reported by list-plugins.
    }
  }
  return manifests;
};

export const runInvestigationWorkflow = async (
  projectRoot: string,
  targetId: string,
  options: {
    readonly resumeJobId?: string;
    readonly regenerateReport?: boolean;
    readonly authorizeDynamic?: boolean;
    readonly environment?: Readonly<Record<string, string | undefined>>;
    readonly signal?: AbortSignal;
  } = {},
): Promise<Result<InvestigationWorkflowResult, AnalysisInputError>> => {
  const project = await loadInvestigationProject(projectRoot);
  if (!project.ok) return project;
  const target = project.value.targets.find((entry) => entry.target_id === targetId);
  if (target === undefined)
    return err(inputError("analyze_project", `Unknown target ${targetId}.`));
  const environment = options.environment ?? process.env;
  if (options.signal?.aborted) {
    const interrupted = {
      ...createInvestigationJob(target, {
        ...project.value.config,
        authorize_dynamic:
          options.authorizeDynamic ?? project.value.config.authorize_dynamic,
      }),
      status: "interrupted" as const,
      error: "Investigation was cancelled.",
    };
    await saveInvestigationJob(projectRoot, interrupted);
    return err(inputError("analyze_project", "Investigation was cancelled."));
  }
  const currentHash = await hashLocalFile(target.path, options.signal);
  if (!currentHash.ok) return currentHash;
  if (currentHash.value.sha256 !== target.sha256)
    return err(
      inputError(
        "hash_target",
        "Target contents changed after import. Re-import the file to analyze the new bytes.",
      ),
    );
  let job: InvestigationJob;
  if (options.resumeJobId === undefined) {
    const candidate = createInvestigationJob(target, {
      ...project.value.config,
      authorize_dynamic:
        options.authorizeDynamic ?? project.value.config.authorize_dynamic,
    });
    const reusable = await findReusableCompletedJob(projectRoot, candidate.cache_key);
    if (!reusable.ok) return reusable;
    if (reusable.value !== null) {
      const format = await detectTargetFormat(target.path);
      if (!format.ok)
        return err(inputError("analyze_project", format.error.userMessage ?? format.error.message));
      const backends = await probeAnalysisBackends(environment);
      return ok({
        project: project.value,
        target,
        job: reusable.value,
        format: format.value,
        backends,
        report: null,
        plugins: await loadPlugins(projectRoot),
        reused_job: true,
      });
    }
    job = candidate;
  } else {
    const resumed = await loadInvestigationJob(projectRoot, options.resumeJobId);
    if (!resumed.ok) return resumed;
    job = resumed.value;
    if (job.status === "completed" && options.regenerateReport !== true) {
      const format = await detectTargetFormat(target.path);
      if (!format.ok)
        return err(inputError("analyze_project", format.error.userMessage ?? format.error.message));
      return ok({
        project: project.value,
        target,
        job,
        format: format.value,
        backends: await probeAnalysisBackends(environment),
        report: null,
        plugins: await loadPlugins(projectRoot),
        reused_job: true,
      });
    }
    if (job.status === "cancelled")
      return err(inputError("resume_job", "Cancelled jobs cannot be resumed."));
    if (job.status === "completed" && options.regenerateReport === true) {
      const format = await detectTargetFormat(target.path);
      if (!format.ok)
        return err(inputError("analyze_project", format.error.userMessage ?? format.error.message));
      const backends = await probeAnalysisBackends(environment);
      return writeCompletedReports(projectRoot, project.value, target, job, format.value, backends);
    }
    if (!isResumableJobStatus(job.status))
      return err(
        inputError("resume_job", `Job ${job.job_id} is ${job.status} and is not resumable.`),
      );
    job = {
      ...job,
      status: "queued",
      findings: [],
      limitations: [],
      error: undefined,
      stages: createPendingStages(),
      report_paths: {},
    };
  }
  const fail = async (
    stage: InvestigationStageId,
    message: string,
    extras: Partial<InvestigationWorkflowResult> = {},
  ): Promise<Result<InvestigationWorkflowResult, AnalysisInputError>> => {
    const failed = updateStage(
      { ...job, status: "failed", error: message },
      stage,
      "failed",
      { error: message },
    );
    await saveInvestigationJob(projectRoot, failed);
    return extras.format === undefined
      ? err(inputError(stage, message))
      : ok({
          project: project.value,
          target,
          job: failed,
          format: extras.format,
          backends: extras.backends ?? [],
          report: extras.report ?? null,
          plugins: extras.plugins ?? [],
        });
  };

  job = { ...job, status: "running" };
  job = updateStage(job, "validate_input", "completed", {
    summary: `Validated target ${target.display_name}`,
  });
  if (options.signal?.aborted) {
    job = { ...job, status: "interrupted" };
    await saveInvestigationJob(projectRoot, job);
    return err(inputError("analyze_project", "Investigation was cancelled."));
  }

  job = updateStage(job, "hash_target", "completed", {
    summary: target.sha256,
  });
  const format = await detectTargetFormat(target.path);
  if (!format.ok) return fail("detect_format", format.error.userMessage ?? format.error.message);
  job = updateStage(job, "detect_format", "completed", {
    summary: format.value.format,
  });

  const backends = await probeAnalysisBackends(environment);
  job = updateStage(job, "probe_backends", "completed", {
    summary: backends
      .filter((backend) => backend.available)
      .map((backend) => backend.id)
      .join(", "),
  });

  const remaining = remainingWorkflowsFor(format.value.format, backends);
  const collected = await collectStaticFindings(target, format.value);
  const nextCommands = nextAnalysisCommandsFor(target.path, remaining);
  const findings = nextCommands
    ? [
        ...collected.findings,
        {
          finding_id: "ev_next_commands",
          title: "Existing analysis commands for this imported target",
          kind: "metadata" as const,
          confidence: "inferred" as const,
          evidence_ids: ["ev_next_commands"],
          details: nextCommands,
          verified: false,
          target_id: target.target_id,
          target_sha256: target.sha256,
          provider: "builtin-static",
        },
      ]
    : collected.findings;
  job = {
    ...updateStage(job, "static_analysis", "completed", {
      summary: `${String(findings.length)} findings`,
    }),
    findings,
    limitations: collected.limitations,
  };

  if (job.authorize_dynamic) {
    job = updateStage(job, "optional_dynamic", "skipped", {
      summary:
        "Dynamic analysis is authorized but not launched by analyze-project. Use an explicit Frida, GDB, or process-capture command.",
    });
    job.limitations.push(
      "Authorized dynamic analysis remains opt-in through dedicated runtime commands.",
    );
  } else {
    job = updateStage(job, "optional_dynamic", "skipped", {
      summary: "Dynamic analysis was not authorized.",
    });
  }

  const evidence = await writeInvestigationEvidence(projectRoot, job.findings);
  if (!evidence.ok)
    return fail(
      "normalize_evidence",
      evidence.error.userMessage ?? evidence.error.message,
    );
  job = updateStage(job, "normalize_evidence", "completed", {
    summary: `${String(evidence.value.length)} evidence records written.`,
  });

  let ai: AiInterpretation | null = null;
  const aiStatus = aiProviderStatus(environment);
  const evidenceBytes = Buffer.byteLength(JSON.stringify(job.findings), "utf8");
  let aiDisclosure: AiDisclosure = createAiDisclosure({
    settings: aiStatus.settings,
    bytesOffered: evidenceBytes,
    operatorAuthorized: job.ai_enabled,
    reason: "AI interpretation is skipped unless a provider is configured and the job enables it.",
  });
  if (job.ai_enabled && aiStatus.ready) {
    aiDisclosure = createAiDisclosure({
      settings: aiStatus.settings,
      bytesOffered: evidenceBytes,
      operatorAuthorized: true,
      attempted: true,
      reason:
        "Operator enabled project AI. Evidence JSON is sent to the configured endpoint. The API key is not included in this report.",
    });
    const interpreted = await interpretEvidenceWithAi({
      question: "Summarize the observed findings without claiming exploitability.",
      evidence: JSON.stringify(job.findings),
      settings: parseAiProviderSettings(environment),
      fetchImpl: globalThis.fetch,
    });
    if (interpreted.ok) {
      ai = interpreted.value;
      job = updateStage(job, "optional_ai", "completed", {
        summary: `Interpreted by ${ai.provider}`,
      });
    } else {
      job = updateStage(job, "optional_ai", "failed", { error: interpreted.error });
      job.limitations.push(interpreted.error);
    }
  } else {
    const skipped = parseAiInterpretation({
      provider: "none",
      model: null,
      uncertainties: ["No AI provider was configured."],
    });
    ai = skipped.ok ? skipped.value : null;
    job = updateStage(job, "optional_ai", "skipped", {
      summary: "AI interpretation skipped because no provider is configured.",
    });
  }

  job.limitations.push(
    ...remaining
      .filter((workflow) => !workflow.usable)
      .map((workflow) => `${workflow.command}: ${workflow.reason}`),
  );
  return persistCompletedInvestigation({
    projectRoot,
    project: project.value,
    target,
    job,
    format: format.value,
    backends,
    ai,
    aiDisclosure,
  });
};

const persistCompletedInvestigation = async (input: {
  readonly projectRoot: string;
  readonly project: InvestigationProject;
  readonly target: InvestigationTarget;
  readonly job: InvestigationJob;
  readonly format: FormatDetection;
  readonly backends: readonly BackendAvailability[];
  readonly ai: AiInterpretation | null;
  readonly aiDisclosure: AiDisclosure;
}): Promise<Result<InvestigationWorkflowResult, AnalysisInputError>> => {
  const remaining = remainingWorkflowsFor(input.format.format, input.backends);
  const report: InvestigationReport = {
    schema: "rea.investigation-report.v1",
    generated_at: new Date().toISOString(),
    project_name: input.project.name,
    job: input.job,
    target: {
      target_id: input.target.target_id,
      display_name: input.target.display_name,
      sha256: input.target.sha256,
      format: input.target.format,
      architecture: input.target.architecture,
      size_bytes: input.target.size_bytes,
    },
    format: input.format,
    backends: input.backends.map((backend) => ({
      id: backend.id,
      available: backend.available,
      reason: backend.reason,
    })),
    remaining_workflows: remaining,
    provenance: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      workflow_version: INVESTIGATION_WORKFLOW_VERSION,
    },
    findings: input.job.findings,
    ai: input.ai,
    ai_disclosure: input.aiDisclosure,
    limitations: input.job.limitations,
  };
  const reportsDir = investigationProjectPaths(input.projectRoot).reports;
  const reportPaths = {
    json: join(reportsDir, `${input.job.job_id}.json`),
    markdown: join(reportsDir, `${input.job.job_id}.md`),
  };
  let job: InvestigationJob = {
    ...updateStage(input.job, "generate_report", "completed", {
      summary: reportPaths.markdown,
    }),
    report_paths: reportPaths,
    status: "completed",
  };
  job = updateStage(job, "persist_job", "completed", {
    summary: job.job_id,
  });
  const completedReport = { ...report, job };
  const written = await writeInvestigationReports(input.projectRoot, job.job_id, {
    json: renderInvestigationReportJson(completedReport),
    markdown: renderInvestigationReportMarkdown(completedReport),
  });
  if (!written.ok) {
    const failed = {
      ...job,
      status: "failed" as const,
      error: written.error.userMessage ?? written.error.message,
    };
    await saveInvestigationJob(input.projectRoot, failed);
    return err(
      inputError("generate_report", written.error.userMessage ?? written.error.message),
    );
  }
  const persisted = await saveInvestigationJob(input.projectRoot, job);
  if (!persisted.ok) return persisted;
  const reloaded = await loadInvestigationProject(input.projectRoot);
  if (!reloaded.ok) return reloaded;
  return ok({
    project: reloaded.value,
    target: input.target,
    job: persisted.value,
    format: input.format,
    backends: input.backends,
    report: { ...completedReport, job: persisted.value },
    plugins: await loadPlugins(input.projectRoot),
  });
};

const writeCompletedReports = async (
  projectRoot: string,
  project: InvestigationProject,
  target: InvestigationTarget,
  job: InvestigationJob,
  format: FormatDetection,
  backends: readonly BackendAvailability[],
): Promise<Result<InvestigationWorkflowResult, AnalysisInputError>> => {
  const aiStatus = aiProviderStatus();
  return persistCompletedInvestigation({
    projectRoot,
    project,
    target,
    job,
    format,
    backends,
    ai: null,
    aiDisclosure: createAiDisclosure({
      settings: aiStatus.settings,
      bytesOffered: 0,
      operatorAuthorized: false,
      reason: "Report regenerated from stored findings. No new AI request was sent.",
    }),
  });
};

export const inspectInvestigationTarget = async (
  projectRoot: string,
  targetPath: string,
): Promise<
  Result<
    {
      readonly path: string;
      readonly sha256: string | null;
      readonly size_bytes: number;
      readonly format: FormatDetection;
      readonly backends: readonly BackendAvailability[];
      readonly remaining_workflows: ReturnType<typeof remainingWorkflowsFor>;
      readonly workflow_version: string;
    },
    AnalysisInputError
  >
> => {
  const project = await loadInvestigationProject(projectRoot);
  if (!project.ok) return project;
  const resolved = resolve(targetPath);
  const hashed = await hashLocalFile(resolved);
  const format = await detectTargetFormat(resolved);
  if (!format.ok) return format;
  const backends = await probeAnalysisBackends();
  return ok({
    path: resolved,
    sha256: hashed.ok ? hashed.value.sha256 : null,
    size_bytes: hashed.ok ? hashed.value.sizeBytes : 0,
    format: format.value,
    backends,
    remaining_workflows: remainingWorkflowsFor(format.value.format, backends),
    workflow_version: INVESTIGATION_WORKFLOW_VERSION,
  });
};
