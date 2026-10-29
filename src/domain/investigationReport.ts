import type { InvestigationFinding, InvestigationJob } from "./investigationProject.js";
import type { FormatDetection } from "./formatRegistry.js";
import type { AiDisclosure, AiInterpretation } from "./aiProviderContract.js";

export interface InvestigationReportProvenance {
  readonly node_version: string;
  readonly platform: string;
  readonly arch: string;
  readonly workflow_version: string;
}

export interface RemainingWorkflowRecord {
  readonly command: string;
  readonly usable: boolean;
  readonly reason: string;
}

export interface InvestigationReport {
  readonly schema: "rea.investigation-report.v1";
  readonly generated_at: string;
  readonly project_name: string;
  readonly job: InvestigationJob;
  readonly target: {
    readonly target_id: string;
    readonly display_name: string;
    readonly sha256: string;
    readonly format: string;
    readonly architecture: string | null;
    readonly size_bytes: number;
  };
  readonly format: FormatDetection;
  readonly backends: readonly {
    readonly id: string;
    readonly available: boolean;
    readonly reason: string;
  }[];
  readonly remaining_workflows: readonly RemainingWorkflowRecord[];
  readonly provenance: InvestigationReportProvenance;
  readonly findings: readonly InvestigationFinding[];
  readonly ai: AiInterpretation | null;
  readonly ai_disclosure: AiDisclosure | null;
  readonly limitations: readonly string[];
}

const escapeMarkdown = (value: string): string =>
  value.replaceAll(/[`<>]/gu, (character) => `\\${character}`);

/** Render a machine-readable investigation report. */
export const renderInvestigationReportJson = (
  report: InvestigationReport,
): string => `${JSON.stringify(report, null, 2)}\n`;

/** Render an evidence-linked Markdown investigation report. */
export const renderInvestigationReportMarkdown = (
  report: InvestigationReport,
): string => {
  const lines = [
    `# Investigation report: ${escapeMarkdown(report.project_name)}`,
    "",
    `- Generated: ${escapeMarkdown(report.generated_at)}`,
    `- Job: \`${escapeMarkdown(report.job.job_id)}\``,
    `- Status: ${escapeMarkdown(report.job.status)}`,
    `- Target: ${escapeMarkdown(report.target.display_name)}`,
    `- SHA-256: \`${escapeMarkdown(report.target.sha256)}\``,
    `- Format: ${escapeMarkdown(report.format.format)} (${escapeMarkdown(report.format.diagnostic)})`,
    `- Architecture: ${escapeMarkdown(report.target.architecture ?? "unknown")}`,
    "",
    "## Backends",
    "",
  ];
  for (const backend of report.backends) {
    lines.push(
      `- ${escapeMarkdown(backend.id)}: ${backend.available ? "available" : "unavailable"} — ${escapeMarkdown(backend.reason)}`,
    );
  }
  lines.push("", "## Findings", "");
  if (report.findings.length === 0) lines.push("No findings were recorded.");
  for (const finding of report.findings) {
    lines.push(
      `### ${escapeMarkdown(finding.title)}`,
      "",
      `- Kind: ${finding.kind}`,
      `- Confidence: ${finding.confidence}`,
      `- Verified: ${finding.verified ? "yes" : "no"}`,
      `- Evidence: ${finding.evidence_ids.map((id) => `\`${escapeMarkdown(id)}\``).join(", ") || "none"}`,
      "",
      escapeMarkdown(finding.details),
      "",
    );
  }
  lines.push("## Workflow stages", "");
  for (const stage of report.job.stages) {
    const extra = stage.summary ?? stage.error ?? stage.status;
    lines.push(`- ${stage.id}: ${stage.status} — ${escapeMarkdown(extra)}`);
  }
  lines.push("", "## Remaining workflows", "");
  for (const workflow of report.remaining_workflows) {
    lines.push(
      `- \`${escapeMarkdown(workflow.command)}\`: ${workflow.usable ? "usable" : "not usable"} — ${escapeMarkdown(workflow.reason)}`,
    );
  }
  lines.push("", "## Provenance", "");
  lines.push(
    `- Node: ${escapeMarkdown(report.provenance.node_version)}`,
    `- Platform: ${escapeMarkdown(report.provenance.platform)}/${escapeMarkdown(report.provenance.arch)}`,
    `- Workflow: ${escapeMarkdown(report.provenance.workflow_version)}`,
  );
  if (report.ai_disclosure) {
    lines.push(
      `- AI disclosure: provider \`${escapeMarkdown(report.ai_disclosure.provider)}\`, host \`${escapeMarkdown(report.ai_disclosure.endpoint_host ?? "none")}\`, bytes offered ${String(report.ai_disclosure.bytes_offered)}, attempted ${report.ai_disclosure.attempted ? "yes" : "no"} — ${escapeMarkdown(report.ai_disclosure.reason)}`,
    );
  }
  if (report.ai) {
    lines.push("", "## AI interpretation (unverified)", "");
    lines.push(
      `Provider \`${escapeMarkdown(report.ai.provider)}\` produced interpretations, not observed facts. Target content was labeled untrusted.`,
      "",
    );
    for (const note of report.ai.function_notes) {
      lines.push(`- ${escapeMarkdown(note.function_id)}: ${escapeMarkdown(note.explanation)}`);
    }
    for (const note of report.ai.security_notes) {
      lines.push(
        `- Unverified security note: ${escapeMarkdown(note.title)} (evidence ${note.evidence_ids.join(", ")})`,
      );
    }
    for (const hypothesis of report.ai.hypotheses) {
      lines.push(`- Hypothesis: ${escapeMarkdown(hypothesis)}`);
    }
  }
  lines.push("", "## Limitations", "");
  for (const limitation of report.limitations)
    lines.push(`- ${escapeMarkdown(limitation)}`);
  lines.push("");
  return lines.join("\n");
};
