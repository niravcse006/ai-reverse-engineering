import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { elf } from "../../domain/binaryTarget.fixture.js";
import { validatePluginManifest } from "../../domain/pluginContract.js";
import { interpretEvidenceWithAi } from "./AiProvider.js";
import { probeAnalysisBackends } from "./BackendProbe.js";
import { createInvestigationProject } from "./ProjectStore.js";
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
    await writeFile(targetPath, Buffer.concat([elf(2, 1, 183), Buffer.from("HelloREA")]));
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
    expect(analyzed.value.job.findings.some((finding) => finding.kind === "string")).toBe(
      true,
    );
    expect(analyzed.value.job.limitations.join(" ")).toContain("never executed");
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

  it("reports angr as unavailable and does not invent a ready AI provider", async () => {
    const backends = await probeAnalysisBackends({});
    expect(backends.find((backend) => backend.id === "angr")?.available).toBe(false);
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
