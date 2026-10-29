import { describe, expect, it } from "vitest";

import { createPendingStages } from "./investigationProject.js";
import {
  renderInvestigationReportJson,
  renderInvestigationReportMarkdown,
  type InvestigationReport,
} from "./investigationReport.js";

const report = (): InvestigationReport => ({
  schema: "rea.investigation-report.v1",
  generated_at: "2026-10-29T00:00:00.000Z",
  project_name: "demo",
  job: {
    job_id: "job_1",
    target_id: "tgt_1",
    status: "completed",
    created_at: "2026-10-29T00:00:00.000Z",
    updated_at: "2026-10-29T00:00:00.000Z",
    workflow_version: "1.0.0",
    cache_key: "cache",
    selected_backends: ["auto"],
    authorize_dynamic: false,
    ai_enabled: false,
    stages: createPendingStages(),
    findings: [
      {
        finding_id: "ev_format",
        title: "Detected format elf",
        kind: "metadata",
        confidence: "observed",
        evidence_ids: ["ev_format"],
        details: "Executable header facts were recovered.",
        verified: true,
      },
    ],
    limitations: ["Unknown binaries are never executed."],
    report_paths: {},
  },
  target: {
    target_id: "tgt_1",
    display_name: "lib.so",
    sha256: "a".repeat(64),
    format: "elf",
    architecture: "arm64",
    size_bytes: 64,
  },
  format: {
    format: "elf",
    architecture: "arm64",
    executable: true,
    managed: false,
    confidence: "observed",
    diagnostic: "Executable header facts were recovered.",
    supported: true,
  },
  backends: [
    {
      id: "builtin-static",
      available: true,
      reason: "always available",
    },
  ],
  findings: [],
  ai: null,
  limitations: ["Unknown binaries are never executed."],
});

describe("investigation reports", () => {
  it("renders JSON and Markdown with evidence identifiers", () => {
    const value = report();
    const json = JSON.parse(renderInvestigationReportJson(value));
    expect(json.schema).toBe("rea.investigation-report.v1");
    const markdown = renderInvestigationReportMarkdown({
      ...value,
      findings: value.job.findings,
    });
    expect(markdown).toContain("ev_format");
    expect(markdown).toContain("Unknown binaries are never executed");
  });
});
