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
  saveInvestigationJob,
} from "./ProjectStore.js";
import { remainingWorkflowsFor } from "./RemainingWorkflows.js";
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
  const handle = await readFile(resolved);
  const detected = detectRegisteredFormat({
    bytes: handle.subarray(0, MAX_PROBE_BYTES),
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
    });
  }
  const limitations = [
    "Project analysis performs bounded static inspection only. Deep decompilation requires an installed Hopper, Ghidra, IDA, or Kuna provider.",
    "Unknown binaries are never executed during inspect-target or analyze-project.",
  ];
  if (!format.supported)
    limitations.push("The detected format is unsupported or empty.");
  if (target.size_bytes > 0 && format.format !== "source-repository") {
    const bytes = await readFile(resolve(target.path));
    const strings = extractPrintableStrings(
      bytes.subarray(0, Math.min(bytes.length, MAX_STRING_SCAN_BYTES)),
    );
    if (strings.length > 0) {
      findings.push({
        finding_id: "ev_strings",
        title: "Printable strings",
        kind: "string",
        confidence: "observed",
        evidence_ids: ["ev_strings"],
        details: strings.slice(0, 32).join("\n"),
        verified: true,
      });
    }
    if (bytes.length > MAX_STRING_SCAN_BYTES)
      limitations.push(
        `String extraction scanned the first ${String(MAX_STRING_SCAN_BYTES)} bytes only.`,
      );
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

  const collected = await collectStaticFindings(target, format.value);
  job = {
    ...updateStage(job, "static_analysis", "completed", {
      summary: `${String(collected.findings.length)} findings`,
    }),
    findings: collected.findings,
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

  job = updateStage(job, "normalize_evidence", "completed", {
    summary: "Findings retained with evidence identifiers.",
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

  const remaining = remainingWorkflowsFor(format.value.format, backends);
  job.limitations.push(
    ...remaining
      .filter((workflow) => !workflow.usable)
      .map((workflow) => `${workflow.command}: ${workflow.reason}`),
  );
  const report: InvestigationReport = {
    schema: "rea.investigation-report.v1",
    generated_at: new Date().toISOString(),
    project_name: project.value.name,
    job,
    target: {
      target_id: target.target_id,
      display_name: target.display_name,
      sha256: target.sha256,
      format: target.format,
      architecture: target.architecture,
      size_bytes: target.size_bytes,
    },
    format: format.value,
    backends: backends.map((backend) => ({
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
    findings: job.findings,
    ai,
    ai_disclosure: aiDisclosure,
    limitations: job.limitations,
  };
  const written = await writeInvestigationReports(projectRoot, job.job_id, {
    json: renderInvestigationReportJson(report),
    markdown: renderInvestigationReportMarkdown(report),
  });
  if (!written.ok) return fail("generate_report", written.error.userMessage ?? written.error.message, {
    format: format.value,
    backends,
    report,
  });
  job = {
    ...updateStage(job, "generate_report", "completed", {
      summary: written.value.markdown,
    }),
    report_paths: written.value,
    status: "completed",
  };
  job = updateStage(job, "persist_job", "completed", {
    summary: job.job_id,
  });
  const persisted = await saveInvestigationJob(projectRoot, job);
  if (!persisted.ok) return persisted;
  const reloaded = await loadInvestigationProject(projectRoot);
  if (!reloaded.ok) return reloaded;
  return ok({
    project: reloaded.value,
    target,
    job: persisted.value,
    format: format.value,
    backends,
    report: { ...report, job: persisted.value },
    plugins: await loadPlugins(projectRoot),
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
