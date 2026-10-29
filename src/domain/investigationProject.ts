import { z } from "zod";

import { analysisProviderSelectorSchema } from "./providerSelection.js";
import { err, ok, type Result } from "./result.js";

/** Schema version for persisted investigation project documents. */
export const INVESTIGATION_PROJECT_VERSION = 1;

/** Workflow implementation version included in cache keys and job receipts. */
export const INVESTIGATION_WORKFLOW_VERSION = "1.0.0";

export const INVESTIGATION_JOB_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "interrupted",
  "cancelled",
] as const;

export type InvestigationJobStatus = (typeof INVESTIGATION_JOB_STATUSES)[number];

export const INVESTIGATION_STAGE_IDS = [
  "validate_input",
  "hash_target",
  "detect_format",
  "probe_backends",
  "static_analysis",
  "optional_dynamic",
  "normalize_evidence",
  "optional_ai",
  "generate_report",
  "persist_job",
] as const;

export type InvestigationStageId = (typeof INVESTIGATION_STAGE_IDS)[number];

export const INVESTIGATION_STAGE_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
] as const;

export type InvestigationStageStatus =
  (typeof INVESTIGATION_STAGE_STATUSES)[number];

const isoDateTimeSchema = z.string().min(1);

export const investigationTargetSchema = z.object({
  target_id: z.string().min(1),
  path: z.string().min(1),
  display_name: z.string().min(1),
  sha256: z.string().regex(/^[0-9a-f]{64}$/u),
  size_bytes: z.number().int().nonnegative(),
  format: z.string().min(1),
  architecture: z.string().nullable(),
  imported_at: isoDateTimeSchema,
  notes: z.string().optional(),
});

export type InvestigationTarget = z.infer<typeof investigationTargetSchema>;

export const investigationStageSchema = z.object({
  id: z.enum(INVESTIGATION_STAGE_IDS),
  status: z.enum(INVESTIGATION_STAGE_STATUSES),
  started_at: isoDateTimeSchema.optional(),
  finished_at: isoDateTimeSchema.optional(),
  error: z.string().optional(),
  summary: z.string().optional(),
});

export type InvestigationStage = z.infer<typeof investigationStageSchema>;

export const investigationFindingSchema = z.object({
  finding_id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum([
    "metadata",
    "string",
    "symbol",
    "import",
    "export",
    "function",
    "dependency",
    "security_note",
    "limitation",
  ]),
  confidence: z.enum(["observed", "derived", "inferred"]),
  evidence_ids: z.array(z.string().min(1)),
  details: z.string().min(1),
  verified: z.boolean(),
});

export type InvestigationFinding = z.infer<typeof investigationFindingSchema>;

export const investigationJobSchema = z.object({
  job_id: z.string().min(1),
  target_id: z.string().min(1),
  status: z.enum(INVESTIGATION_JOB_STATUSES),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  workflow_version: z.string().min(1),
  cache_key: z.string().min(1),
  selected_backends: z.array(z.string().min(1)),
  authorize_dynamic: z.boolean(),
  ai_enabled: z.boolean(),
  stages: z.array(investigationStageSchema),
  findings: z.array(investigationFindingSchema),
  limitations: z.array(z.string().min(1)),
  report_paths: z.object({
    json: z.string().optional(),
    markdown: z.string().optional(),
  }),
  error: z.string().optional(),
});

export type InvestigationJob = z.infer<typeof investigationJobSchema>;

export const investigationProjectConfigSchema = z.object({
  backends: z.array(analysisProviderSelectorSchema).min(1),
  authorize_dynamic: z.boolean(),
  ai_enabled: z.boolean(),
  ai_spending_limit_usd: z.number().nonnegative().optional(),
  ai_token_limit: z.number().int().positive().optional(),
});

export type InvestigationProjectConfig = z.infer<
  typeof investigationProjectConfigSchema
>;

export const investigationProjectSchema = z.object({
  version: z.literal(INVESTIGATION_PROJECT_VERSION),
  name: z.string().min(1),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  config: investigationProjectConfigSchema,
  targets: z.array(investigationTargetSchema),
  jobs: z.array(
    z.object({
      job_id: z.string().min(1),
      target_id: z.string().min(1),
      status: z.enum(INVESTIGATION_JOB_STATUSES),
      created_at: isoDateTimeSchema,
      updated_at: isoDateTimeSchema,
    }),
  ),
});

export type InvestigationProject = z.infer<typeof investigationProjectSchema>;

export const defaultInvestigationProjectConfig =
  (): InvestigationProjectConfig => ({
    backends: ["auto"],
    authorize_dynamic: false,
    ai_enabled: false,
  });

/** Parse a persisted project document without performing I/O. */
export const parseInvestigationProject = (
  value: unknown,
): Result<InvestigationProject, string> => {
  const parsed = investigationProjectSchema.safeParse(value);
  return parsed.success
    ? ok(parsed.data)
    : err(parsed.error.issues.map((issue) => issue.message).join("; "));
};

/** Parse a persisted job document without performing I/O. */
export const parseInvestigationJob = (
  value: unknown,
): Result<InvestigationJob, string> => {
  const parsed = investigationJobSchema.safeParse(value);
  return parsed.success
    ? ok(parsed.data)
    : err(parsed.error.issues.map((issue) => issue.message).join("; "));
};

/** Create the initial pending stage list for a new investigation job. */
export const createPendingStages = (): InvestigationStage[] =>
  INVESTIGATION_STAGE_IDS.map((id) => ({ id, status: "pending" }));

/** True when later stages should stop after a non-recoverable failure. */
export const isTerminalJobStatus = (status: InvestigationJobStatus): boolean =>
  status === "completed" || status === "cancelled";

/**
 * Build a cache key from inputs that change analysis results. Callers must
 * include backend versions when those versions are known.
 */
export const investigationCacheKey = (input: {
  readonly targetSha256: string;
  readonly workflowVersion: string;
  readonly backends: readonly string[];
  readonly authorizeDynamic: boolean;
  readonly aiEnabled: boolean;
  readonly backendVersions?: Readonly<Record<string, string>>;
}): string => {
  const versions = input.backendVersions ?? {};
  const versionEntries = Object.keys(versions)
    .sort()
    .map((name) => `${name}=${versions[name] ?? ""}`);
  return [
    input.targetSha256,
    input.workflowVersion,
    [...input.backends].sort().join(","),
    input.authorizeDynamic ? "dyn=1" : "dyn=0",
    input.aiEnabled ? "ai=1" : "ai=0",
    versionEntries.join(","),
  ].join("|");
};
