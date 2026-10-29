import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, it } from "vitest";

import { elf } from "./domain/binaryTarget.fixture.js";
import { createCli } from "./cli.js";

const runCli = async (
  arguments_: string[],
): Promise<{ readonly text: string; readonly parsed: unknown }> => {
  const cli = createCli({ REA_LOG_LEVEL: "silent" });
  let text = "";
  await cli.serve(arguments_, {
    env: {},
    exit: () => undefined,
    stdout: (chunk: string) => {
      text += chunk;
    },
  });
  return { text, parsed: JSON.parse(text) };
};

it("exposes investigation-project commands and completes a static workflow", async () => {
  const helpCli = createCli({ REA_LOG_LEVEL: "silent" });
  let help = "";
  await helpCli.serve(["init-project", "--help"], {
    env: {},
    exit: () => undefined,
    stdout: (chunk: string) => {
      help += chunk;
    },
  });
  expect(help).toContain("Create a local investigation project directory");

  const root = await mkdtemp(join(tmpdir(), "rea-cli-project-"));
  const created = await runCli([
    "init-project",
    root,
    "--name",
    "cli-demo",
    "--json",
  ]);
  expect(created.parsed).toMatchObject({ name: "cli-demo" });

  const targetPath = join(root, "sample.so");
  await writeFile(targetPath, Buffer.concat([elf(2, 1, 183), Buffer.from("CliREA")]));
  const imported = await runCli([
    "import-target",
    targetPath,
    "--project",
    root,
    "--json",
  ]);
  const targetId = (imported.parsed as { target: { target_id: string } }).target
    .target_id;
  expect(targetId).toMatch(/^tgt_/u);

  const analyzed = await runCli([
    "analyze-project",
    "--project",
    root,
    "--target",
    targetId,
    "--json",
  ]);
  expect(analyzed.parsed).toMatchObject({
    job: { status: "completed" },
  });
});
