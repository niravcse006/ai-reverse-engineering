import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { createTestTempDirectory } from "../../fixtures/temporaryDirectory.js";

import { documentationFactIssues } from "../../../scripts/lib/docs-facts.mjs";
import type { ProductCatalog } from "../../../scripts/lib/product-catalog.mjs";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const temporaryRoots: string[] = [];

const README_FACT_FIXTURE_PATHS = [
  "README.md",
  "docs/installation.md",
  "AGENTS.md",
  ".github/pull_request_template.md",
] as const;

const README_REQUIRED_FACTS = [
  "MCP-tool_catalog",
  "(docs/installation.md#supported-agents)",
  "(docs/installation.md#mcp-registry)",
  "(docs/mcp-contracts.md#generated-catalog)",
] as const;

const seedReadmeFactFixture = async (directory: string) => {
  for (const path of README_FACT_FIXTURE_PATHS) {
    const destination = join(directory, path);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(root, path), destination);
  }
  await mkdir(join(directory, "skills/reverse-engineer-anything"), {
    recursive: true,
  });
};

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("product README facts", () => {
  it("keeps the English README linked to setup and the tool catalog", async () => {
    const directory = await createTestTempDirectory("rea-readme-facts-");
    temporaryRoots.push(directory);
    await seedReadmeFactFixture(directory);
    const catalog: ProductCatalog = JSON.parse(
      await readFile(join(root, "docs/public/product-catalog.json"), "utf8"),
    );
    await expect(documentationFactIssues(directory, catalog)).resolves.toEqual(
      [],
    );
    const readmePath = join(directory, "README.md");
    const readme = await readFile(readmePath, "utf8");
    for (const fact of README_REQUIRED_FACTS) {
      expect(readme).toContain(fact);
      await writeFile(readmePath, readme.replaceAll(fact, ""), "utf8");
      await expect(documentationFactIssues(directory, catalog)).resolves.toEqual(
        [`README.md: missing ${fact}`],
      );
      await writeFile(readmePath, readme, "utf8");
    }
  });
});
