import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { elf, fat } from "../../domain/binaryTarget.fixture.js";
import { validatePluginManifest } from "../../domain/pluginContract.js";
import { interpretEvidenceWithAi } from "./AiProvider.js";
import { probeAnalysisBackends } from "./BackendProbe.js";
import {
  createInvestigationProject,
  saveInvestigationJob,
} from "./ProjectStore.js";
import {
  importInvestigationTarget,
  inspectInvestigationTarget,
  runInvestigationWorkflow,
} from "./Workflow.js";

const projectRoot = async (): Promise<string> =>
  mkdtemp(join(tmpdir(), "rea-project-"));

describe("investigation project workflow", () => {
  it("creates a project, imports an ELF target, and writes reports", async () => {
    const root = await projectRoot();
    const created = await createInvestigationProject(root, "demo");
    expect(created.ok).toBe(true);
    const targetPath = join(root, "sample.so");
    await writeFile(
      targetPath,
      Buffer.concat([elf(2, 1, 183), Buffer.from("HelloREA")]),
    );
    const imported = await importInvestigationTarget(root, targetPath);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error.message);
    expect(imported.value.format.format).toBe("elf");
    const analyzed = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      { environment: {} },
    );
    expect(analyzed.ok).toBe(true);
    if (!analyzed.ok) throw new Error(analyzed.error.message);
    expect(analyzed.value.job.status).toBe("completed");
    expect(analyzed.value.job.report_paths.markdown).toMatch(/\.md$/u);
    expect(
      analyzed.value.job.findings.some((finding) => finding.kind === "string"),
    ).toBe(true);
    expect(analyzed.value.job.limitations.join(" ")).toContain(
      "never executed",
    );
    expect(
      analyzed.value.report?.remaining_workflows.some((item) => item.usable),
    ).toBe(true);
    expect(analyzed.value.report?.provenance.node_version).toMatch(/^v/u);
    expect(analyzed.value.report?.ai_disclosure?.provider).toBe("none");
    expect(analyzed.value.report?.ai_disclosure?.attempted).toBe(false);
    const storedReport = JSON.parse(
      await readFile(analyzed.value.job.report_paths.json ?? "", "utf8"),
    ) as { job: { status: string } };
    expect(storedReport.job.status).toBe("completed");
    const evidencePath = join(
      root,
      "evidence",
      `${analyzed.value.job.findings[0]?.finding_id ?? "missing"}.json`,
    );
    const storedEvidence = JSON.parse(await readFile(evidencePath, "utf8")) as {
      finding_id: string;
      target_sha256?: string;
    };
    expect(storedEvidence.finding_id).toBe("ev_format");
    expect(storedEvidence.target_sha256).toBe(imported.value.target.sha256);
    expect(
      analyzed.value.job.findings.some(
        (finding) =>
          finding.finding_id === "ev_next_commands" &&
          finding.confidence === "inferred" &&
          finding.details.includes("inspect-elf-notes"),
      ),
    ).toBe(true);
    expect(
      analyzed.value.job.findings.every(
        (finding) =>
          finding.target_id === imported.value.target.target_id &&
          finding.target_sha256 === imported.value.target.sha256 &&
          finding.provider === "builtin-static",
      ),
    ).toBe(true);
    const again = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        environment: {},
      },
    );
    expect(again.ok && again.value.reused_job).toBe(true);
    const regenerated = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        resumeJobId: analyzed.value.job.job_id,
        regenerateReport: true,
        environment: {},
      },
    );
    expect(regenerated.ok).toBe(true);
    if (!regenerated.ok) throw new Error(regenerated.error.message);
    expect(regenerated.value.job.job_id).toBe(analyzed.value.job.job_id);
    expect(
      regenerated.value.job.findings.map((finding) => finding.finding_id),
    ).toEqual(analyzed.value.job.findings.map((finding) => finding.finding_id));
  });

  it("inspects a target without executing it and keeps empty files out of import", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "inspect");
    const targetPath = join(root, "sample.so");
    await writeFile(targetPath, elf(2, 1, 183));
    const inspected = await inspectInvestigationTarget(root, targetPath);
    expect(inspected.ok && inspected.value.format.format).toBe("elf");
    const emptyPath = join(root, "empty.bin");
    await writeFile(emptyPath, Buffer.alloc(0));
    const imported = await importInvestigationTarget(root, emptyPath);
    expect(imported.ok).toBe(false);
  });

  it("reuses a duplicate target and rejects a corrupted project document", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "dupes");
    const targetPath = join(root, "sample.so");
    await writeFile(targetPath, elf(2, 1, 183));
    const first = await importInvestigationTarget(root, targetPath);
    const second = await importInvestigationTarget(root, targetPath);
    expect(first.ok && second.ok && first.value.target.target_id).toBe(
      second.ok ? second.value.target.target_id : "",
    );
    await writeFile(join(root, "project.json"), "{not-json");
    const reloaded = await importInvestigationTarget(root, targetPath);
    expect(reloaded.ok).toBe(false);
  });
});

describe("investigation project refusals", () => {
  it("refuses a zero spend limit before sending evidence", async () => {
    const interpreted = await interpretEvidenceWithAi({
      question: "explain",
      evidence: "unused",
      settings: {
        provider: "openai-compatible",
        model: "x",
        endpoint: "https://example.test/v1",
        timeoutMs: 1000,
        retries: 0,
        tokenLimit: 16,
        spendingLimitUsd: 0,
      },
      fetchImpl: async () => {
        throw new Error("fetch must not run");
      },
    });
    expect(interpreted.ok).toBe(false);
    if (interpreted.ok) throw new Error("expected refusal");
    expect(interpreted.error).toContain("REA_AI_SPENDING_LIMIT_USD is 0");
  });

  it("reports angr as unavailable and does not invent a ready AI provider", async () => {
    const backends = await probeAnalysisBackends({});
    expect(backends.find((backend) => backend.id === "angr")?.available).toBe(
      false,
    );
    const interpreted = await interpretEvidenceWithAi({
      question: "explain",
      evidence: "unused",
    });
    expect(interpreted.ok).toBe(false);
  });

  it("validates plugin metadata without executing an entry", () => {
    expect(
      validatePluginManifest({
        name: "demo-report",
        version: "1.2.3",
        kind: "report-generator",
        description: "Writes extra report sections.",
        entry: "reports/extra.js",
        permissions: ["write-artifacts"],
        trusted: false,
      }).ok,
    ).toBe(true);
  });
});

describe("investigation project safety", () => {
  it("refuses analysis after the imported bytes change", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "stale");
    const targetPath = join(root, "sample.so");
    await writeFile(
      targetPath,
      Buffer.concat([elf(2, 1, 183), Buffer.from("HelloREA")]),
    );
    const imported = await importInvestigationTarget(root, targetPath);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error.message);
    await writeFile(
      targetPath,
      Buffer.concat([elf(2, 1, 183), Buffer.from("Changed")]),
    );
    const analyzed = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        environment: {},
      },
    );
    expect(analyzed.ok).toBe(false);
    if (analyzed.ok) throw new Error("expected stale-hash refusal");
    expect(analyzed.error.userMessage ?? analyzed.error.message).toContain(
      "changed after import",
    );
  });

  it("does not reuse a completed job after the imported bytes change", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "reuse-stale");
    const targetPath = join(root, "sample.so");
    await writeFile(
      targetPath,
      Buffer.concat([elf(2, 1, 183), Buffer.from("HelloREA")]),
    );
    const imported = await importInvestigationTarget(root, targetPath);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error.message);
    const first = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        environment: {},
      },
    );
    expect(first.ok).toBe(true);
    await writeFile(
      targetPath,
      Buffer.concat([elf(2, 1, 183), Buffer.from("Changed")]),
    );
    const second = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        environment: {},
      },
    );
    expect(second.ok).toBe(false);
    if (second.ok) throw new Error("expected stale-hash refusal after reuse");
    expect(second.error.userMessage ?? second.error.message).toContain(
      "changed after import",
    );
  });

  it("classifies from bytes when the extension disagrees and accepts unicode names", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "names");
    const targetPath = join(root, "样本 notes.txt");
    await writeFile(
      targetPath,
      Buffer.concat([elf(2, 1, 183), Buffer.from("HelloREA")]),
    );
    const imported = await importInvestigationTarget(root, targetPath);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error.message);
    expect(imported.value.format.format).toBe("elf");
    expect(imported.value.target.display_name).toContain("样本");
  });

  it("lists unreadable job files instead of skipping them", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "unreadable");
    const { listInvestigationJobs } = await import("./ProjectStore.js");
    await writeFile(join(root, "jobs", "job_corrupt.json"), "{not-json");
    const listed = await listInvestigationJobs(root);
    expect(listed.ok).toBe(true);
    if (!listed.ok) throw new Error(listed.error.message);
    expect(listed.value.jobs).toEqual([]);
    expect(listed.value.unreadable).toEqual([
      {
        job_id: "job_corrupt",
        reason: "Job document is not valid JSON.",
      },
    ]);
  });

  it("refuses a missing target and a path-escaping job id", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "safety");
    const missing = await importInvestigationTarget(
      root,
      join(root, "gone.bin"),
    );
    expect(missing.ok).toBe(false);
    const { loadInvestigationJob } = await import("./ProjectStore.js");
    const escaped = await loadInvestigationJob(root, "../project");
    expect(escaped.ok).toBe(false);
    if (escaped.ok) throw new Error("expected unsafe job id refusal");
    expect(escaped.error.userMessage ?? escaped.error.message).toContain(
      "unsupported characters",
    );
  });
});

describe("investigation cache identity", () => {
  it("does not reuse a completed unknown-format job after FAT classification changes", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "detector-stale");
    const targetPath = join(root, "true.bin");
    await writeFile(targetPath, fat([0x0100000c]));
    const imported = await importInvestigationTarget(root, targetPath);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error.message);
    expect(imported.value.format.format).toBe("mach-o-universal");
    const first = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        environment: {},
      },
    );
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.error.message);
    const stale = {
      ...first.value.job,
      cache_key: `${imported.value.target.sha256}|1.0.0|auto|dyn=0|ai=0|`,
      findings: first.value.job.findings.map((finding) =>
        finding.finding_id === "ev_format"
          ? {
              ...finding,
              title: "Detected format unknown",
              details:
                "Bytes claim an executable header family, but parsing failed: FAT slice identity is outside the bounded prefix",
            }
          : finding,
      ),
    };
    const saved = await saveInvestigationJob(root, stale);
    expect(saved.ok).toBe(true);
    const second = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        environment: {},
      },
    );
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error(second.error.message);
    expect(second.value.reused_job).not.toBe(true);
    expect(second.value.job.job_id).not.toBe(first.value.job.job_id);
    expect(
      second.value.job.findings.some(
        (finding) =>
          finding.finding_id === "ev_format" &&
          finding.title === "Detected format mach-o-universal",
      ),
    ).toBe(true);
    expect(second.value.job.cache_key).toContain("fmt=mach-o-universal");
    expect(second.value.job.cache_key).toContain("det=2");
  });

  it("does not reuse a completed job when authorize-dynamic changes", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "options");
    const targetPath = join(root, "sample.so");
    await writeFile(
      targetPath,
      Buffer.concat([elf(2, 1, 183), Buffer.from("HelloREA")]),
    );
    const imported = await importInvestigationTarget(root, targetPath);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error.message);
    const first = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        environment: {},
      },
    );
    expect(first.ok).toBe(true);
    const second = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        environment: {},
        authorizeDynamic: true,
      },
    );
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok)
      throw new Error("expected both analyses to succeed");
    expect(second.value.reused_job).not.toBe(true);
    expect(second.value.job.job_id).not.toBe(first.value.job.job_id);
    expect(second.value.job.cache_key).toContain("dyn=1");
  });

  it("persists an interrupted job when the caller cancels", async () => {
    const root = await projectRoot();
    await createInvestigationProject(root, "cancel");
    const targetPath = join(root, "sample.so");
    await writeFile(targetPath, elf(2, 1, 183));
    const imported = await importInvestigationTarget(root, targetPath);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error.message);
    const controller = new AbortController();
    controller.abort();
    const analyzed = await runInvestigationWorkflow(
      root,
      imported.value.target.target_id,
      {
        environment: {},
        signal: controller.signal,
      },
    );
    expect(analyzed.ok).toBe(false);
    const { listInvestigationJobs } = await import("./ProjectStore.js");
    const jobs = await listInvestigationJobs(root);
    expect(
      jobs.ok && jobs.value.jobs.some((job) => job.status === "interrupted"),
    ).toBe(true);
  });
});
