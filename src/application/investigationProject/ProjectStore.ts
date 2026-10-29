import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import writeFileAtomic from "write-file-atomic";

import { isPathWithinRoot } from "../../domain/localPath.js";
import {
  INVESTIGATION_PROJECT_VERSION,
  INVESTIGATION_WORKFLOW_VERSION,
  createPendingStages,
  defaultInvestigationProjectConfig,
  investigationCacheKey,
  parseInvestigationJob,
  parseInvestigationProject,
  type InvestigationJob,
  type InvestigationProject,
  type InvestigationProjectConfig,
  type InvestigationTarget,
} from "../../domain/investigationProject.js";
import { AnalysisInputError } from "../../domain/analysisErrorCore.js";
import { err, ok, type Result } from "../../domain/result.js";

const PROJECT_FILE = "project.json";
const JOBS_DIRECTORY = "jobs";
const REPORTS_DIRECTORY = "reports";
const TARGETS_DIRECTORY = "targets";
const PLUGINS_DIRECTORY = "plugins";

export interface InvestigationProjectPaths {
  readonly root: string;
  readonly projectFile: string;
  readonly jobs: string;
  readonly reports: string;
  readonly targets: string;
  readonly plugins: string;
}

export const investigationProjectPaths = (
  root: string,
): InvestigationProjectPaths => {
  const resolved = resolve(root);
  return {
    root: resolved,
    projectFile: join(resolved, PROJECT_FILE),
    jobs: join(resolved, JOBS_DIRECTORY),
    reports: join(resolved, REPORTS_DIRECTORY),
    targets: join(resolved, TARGETS_DIRECTORY),
    plugins: join(resolved, PLUGINS_DIRECTORY),
  };
};

const now = (): string => new Date().toISOString();

const inputError = (
  operation: string,
  message: string,
  path: readonly (string | number)[] = [],
): AnalysisInputError =>
  new AnalysisInputError(
    operation,
    { userMessage: message },
    [{ path, reason: "invalid_value", message }],
  );

export const createInvestigationProject = async (
  root: string,
  name: string,
  config: InvestigationProjectConfig = defaultInvestigationProjectConfig(),
): Promise<Result<InvestigationProject, AnalysisInputError>> => {
  const trimmed = name.trim();
  if (trimmed.length === 0)
    return err(inputError("init_project", "Project name cannot be empty.", ["name"]));
  const paths = investigationProjectPaths(root);
  await mkdir(paths.root, { recursive: true, mode: 0o700 });
  await mkdir(paths.jobs, { recursive: true, mode: 0o700 });
  await mkdir(paths.reports, { recursive: true, mode: 0o700 });
  await mkdir(paths.targets, { recursive: true, mode: 0o700 });
  await mkdir(paths.plugins, { recursive: true, mode: 0o700 });
  const created = now();
  const project: InvestigationProject = {
    version: INVESTIGATION_PROJECT_VERSION,
    name: trimmed,
    created_at: created,
    updated_at: created,
    config,
    targets: [],
    jobs: [],
  };
  await writeFileAtomic(paths.projectFile, `${JSON.stringify(project, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  return ok(project);
};

export const loadInvestigationProject = async (
  root: string,
): Promise<Result<InvestigationProject, AnalysisInputError>> => {
  const paths = investigationProjectPaths(root);
  let raw: string;
  try {
    raw = await readFile(paths.projectFile, "utf8");
  } catch {
    return err(
      inputError(
        "load_project",
        `No investigation project exists at ${paths.projectFile}. Run init-project first.`,
        ["path"],
      ),
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err(inputError("load_project", "project.json is not valid JSON.", ["path"]));
  }
  const project = parseInvestigationProject(parsed);
  return project.ok
    ? ok(project.value)
    : err(inputError("load_project", project.error, ["path"]));
};

export const saveInvestigationProject = async (
  root: string,
  project: InvestigationProject,
): Promise<Result<InvestigationProject, AnalysisInputError>> => {
  const paths = investigationProjectPaths(root);
  const next = { ...project, updated_at: now() };
  await writeFileAtomic(paths.projectFile, `${JSON.stringify(next, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  return ok(next);
};

export const hashLocalFile = async (
  path: string,
  signal?: AbortSignal,
): Promise<Result<{ sha256: string; sizeBytes: number }, AnalysisInputError>> => {
  const resolved = resolve(path);
  let info;
  try {
    info = await stat(resolved);
  } catch {
    return err(inputError("import_target", `Target does not exist: ${resolved}`, ["path"]));
  }
  if (!info.isFile() && !info.isDirectory())
    return err(
      inputError("import_target", "Target must be a regular file or directory.", ["path"]),
    );
  if (info.isDirectory()) {
    const digest = createHash("sha256");
    digest.update(`directory:${resolved}:${String(info.mtimeMs)}`);
    return ok({ sha256: digest.digest("hex"), sizeBytes: 0 });
  }
  if (info.size === 0)
    return err(inputError("import_target", "Empty files cannot be imported.", ["path"]));
  const bytes = await readFile(resolved);
  if (signal?.aborted)
    return err(inputError("import_target", "Import was cancelled.", ["path"]));
  return ok({
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: info.size,
  });
};

export const addProjectTarget = async (
  root: string,
  target: Omit<InvestigationTarget, "target_id" | "imported_at">,
): Promise<Result<InvestigationTarget, AnalysisInputError>> => {
  const loaded = await loadInvestigationProject(root);
  if (!loaded.ok) return loaded;
  const imported: InvestigationTarget = {
    ...target,
    target_id: `tgt_${randomUUID().replaceAll("-", "")}`,
    imported_at: now(),
  };
  const project = await saveInvestigationProject(root, {
    ...loaded.value,
    targets: [...loaded.value.targets, imported],
  });
  if (!project.ok) return project;
  await writeFile(
    join(investigationProjectPaths(root).targets, `${imported.target_id}.json`),
    `${JSON.stringify(imported, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  return ok(imported);
};

export const saveInvestigationJob = async (
  root: string,
  job: InvestigationJob,
): Promise<Result<InvestigationJob, AnalysisInputError>> => {
  const loaded = await loadInvestigationProject(root);
  if (!loaded.ok) return loaded;
  const paths = investigationProjectPaths(root);
  if (!isPathWithinRoot(paths.jobs, join(paths.jobs, `${job.job_id}.json`)))
    return err(inputError("persist_job", "Job path escaped the project root.", ["job_id"]));
  await writeFileAtomic(
    join(paths.jobs, `${job.job_id}.json`),
    `${JSON.stringify(job, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  const summaries = loaded.value.jobs.filter((entry) => entry.job_id !== job.job_id);
  summaries.push({
    job_id: job.job_id,
    target_id: job.target_id,
    status: job.status,
    created_at: job.created_at,
    updated_at: job.updated_at,
  });
  const saved = await saveInvestigationProject(root, {
    ...loaded.value,
    jobs: summaries,
  });
  return saved.ok ? ok(job) : saved;
};

export const loadInvestigationJob = async (
  root: string,
  jobId: string,
): Promise<Result<InvestigationJob, AnalysisInputError>> => {
  const paths = investigationProjectPaths(root);
  const jobPath = join(paths.jobs, `${jobId}.json`);
  if (!isPathWithinRoot(paths.jobs, jobPath))
    return err(inputError("resume_job", "Job id is not a safe file name.", ["job_id"]));
  let raw: string;
  try {
    raw = await readFile(jobPath, "utf8");
  } catch {
    return err(inputError("resume_job", `Job ${jobId} was not found.`, ["job_id"]));
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err(inputError("resume_job", "Job document is not valid JSON.", ["job_id"]));
  }
  const job = parseInvestigationJob(parsed);
  return job.ok ? ok(job.value) : err(inputError("resume_job", job.error, ["job_id"]));
};

export const listInvestigationJobs = async (
  root: string,
): Promise<Result<readonly InvestigationJob[], AnalysisInputError>> => {
  const paths = investigationProjectPaths(root);
  let entries: string[];
  try {
    entries = await readdir(paths.jobs);
  } catch {
    return ok([]);
  }
  const jobs: InvestigationJob[] = [];
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    const loaded = await loadInvestigationJob(root, basename(entry, ".json"));
    if (loaded.ok) jobs.push(loaded.value);
  }
  return ok(jobs);
};

export const createInvestigationJob = (
  target: InvestigationTarget,
  config: InvestigationProjectConfig,
  backendVersions: Readonly<Record<string, string>> = {},
): InvestigationJob => {
  const created = now();
  return {
    job_id: `job_${randomUUID().replaceAll("-", "")}`,
    target_id: target.target_id,
    status: "queued",
    created_at: created,
    updated_at: created,
    workflow_version: INVESTIGATION_WORKFLOW_VERSION,
    cache_key: investigationCacheKey({
      targetSha256: target.sha256,
      workflowVersion: INVESTIGATION_WORKFLOW_VERSION,
      backends: config.backends,
      authorizeDynamic: config.authorize_dynamic,
      aiEnabled: config.ai_enabled,
      backendVersions,
    }),
    selected_backends: [...config.backends],
    authorize_dynamic: config.authorize_dynamic,
    ai_enabled: config.ai_enabled,
    stages: createPendingStages(),
    findings: [],
    limitations: [],
    report_paths: {},
  };
};
