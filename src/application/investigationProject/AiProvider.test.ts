import { createServer, type IncomingMessage } from "node:http";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { elf } from "../../domain/binaryTarget.fixture.js";
import { createInvestigationProject } from "./ProjectStore.js";
import { interpretEvidenceWithAi } from "./AiProvider.js";
import {
  importInvestigationTarget,
  runInvestigationWorkflow,
} from "./Workflow.js";

const listen = async (): Promise<{
  url: string;
  requests: { authorization: string | undefined; body: string }[];
  close: () => Promise<void>;
}> => {
  const requests: { authorization: string | undefined; body: string }[] = [];
  const server = createServer((request: IncomingMessage, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on("end", () => {
      requests.push({
        authorization: request.headers.authorization,
        body: Buffer.concat(chunks).toString("utf8"),
      });
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  function_notes: [],
                  security_notes: [],
                  hypotheses: ["Local fixture interpretation."],
                  uncertainties: [],
                }),
              },
            },
          ],
        }),
      );
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve();
    });
  });
  const address = server.address();
  if (address === null || typeof address === "string")
    throw new Error("expected a TCP listen address");
  return {
    url: `http://127.0.0.1:${String(address.port)}/v1/chat`,
    requests,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) =>
          error === undefined ? resolve() : reject(error),
        );
      }),
  };
};

describe("AI outbound requests", () => {
  it("does not send HTTP when the provider is none", async () => {
    let called = false;
    const result = await interpretEvidenceWithAi({
      question: "summarize",
      evidence: JSON.stringify([{ finding_id: "ev_format" }]),
      settings: {
        provider: "none",
        model: null,
        endpoint: "http://127.0.0.1:9/v1",
        timeoutMs: 1000,
        retries: 0,
        tokenLimit: 16,
        spendingLimitUsd: null,
      },
      fetchImpl: async () => {
        called = true;
        throw new Error("fetch must not run");
      },
    });
    expect(called).toBe(false);
    expect(result.ok).toBe(false);
  });

  it("posts findings JSON to a local endpoint and keeps the API key out of the body", async () => {
    const server = await listen();
    try {
      const evidence = JSON.stringify([
        {
          finding_id: "ev_format",
          details: "ELF header observed",
          target_id: "tgt_1",
        },
      ]);
      const result = await interpretEvidenceWithAi(
        {
          question:
            "Summarize the observed findings without claiming exploitability.",
          evidence,
          fetchImpl: globalThis.fetch,
        },
        {
          REA_AI_PROVIDER: "openai-compatible",
          REA_AI_ENDPOINT: server.url,
          REA_AI_API_KEY: "test-secret-key",
          REA_AI_MODEL: "fixture-model",
        },
      );
      expect(result.ok).toBe(true);
      expect(server.requests).toHaveLength(1);
      const sent = server.requests[0];
      if (sent === undefined) throw new Error("expected one request");
      expect(sent.authorization).toBe("Bearer test-secret-key");
      expect(sent.body).toContain("ev_format");
      expect(sent.body).toContain("ELF header observed");
      expect(sent.body).toContain("UNTRUSTED_TARGET_CONTENT");
      expect(sent.body).not.toContain("test-secret-key");
      const payload = JSON.parse(sent.body) as {
        model: string;
        max_tokens: number;
      };
      expect(payload.model).toBe("fixture-model");
      expect(payload.max_tokens).toBeLessThanOrEqual(4096);
    } finally {
      await server.close();
    }
  });

  it("keeps a completed investigation job when the local AI endpoint fails", async () => {
    const root = await mkdtemp(join(tmpdir(), "rea-ai-fail-"));
    await createInvestigationProject(root, "ai-fail", {
      backends: ["auto"],
      authorize_dynamic: false,
      ai_enabled: true,
    });
    const targetPath = join(root, "sample.so");
    await writeFile(
      targetPath,
      Buffer.concat([elf(2, 1, 183), Buffer.from("HelloREA")]),
    );
    const imported = await importInvestigationTarget(root, targetPath);
    expect(imported.ok).toBe(true);
    if (!imported.ok) throw new Error(imported.error.message);
    const previousFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error("controlled local refusal");
    }) as typeof fetch;
    try {
      const analyzed = await runInvestigationWorkflow(
        root,
        imported.value.target.target_id,
        {
          environment: {
            REA_AI_PROVIDER: "openai-compatible",
            REA_AI_ENDPOINT: "http://127.0.0.1:9/v1",
            REA_AI_API_KEY: "test-secret-key",
          },
        },
      );
      expect(analyzed.ok).toBe(true);
      if (!analyzed.ok) throw new Error(analyzed.error.message);
      expect(analyzed.value.job.status).toBe("completed");
      expect(
        analyzed.value.job.stages.some(
          (stage) => stage.id === "optional_ai" && stage.status === "failed",
        ),
      ).toBe(true);
      expect(analyzed.value.job.limitations.join(" ")).toContain(
        "controlled local refusal",
      );
      expect(
        analyzed.value.job.findings.some(
          (finding) => finding.finding_id === "ev_format",
        ),
      ).toBe(true);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
