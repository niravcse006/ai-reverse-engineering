import { describe, expect, it } from "vitest";

import {
  createPendingStages,
  investigationCacheKey,
  parseInvestigationProject,
  INVESTIGATION_PROJECT_VERSION,
  INVESTIGATION_STAGE_IDS,
} from "./investigationProject.js";

describe("investigation project model", () => {
  it("creates one pending stage for every workflow step", () => {
    const stages = createPendingStages();
    expect(stages.map((stage) => stage.id)).toEqual([...INVESTIGATION_STAGE_IDS]);
    expect(stages.every((stage) => stage.status === "pending")).toBe(true);
  });

  it("changes the cache key when the target hash or backend set changes", () => {
    const base = {
      targetSha256: "a".repeat(64),
      workflowVersion: "1.0.0",
      backends: ["auto"],
      authorizeDynamic: false,
      aiEnabled: false,
    };
    expect(investigationCacheKey(base)).not.toBe(
      investigationCacheKey({ ...base, targetSha256: "b".repeat(64) }),
    );
    expect(investigationCacheKey(base)).not.toBe(
      investigationCacheKey({
        ...base,
        backendVersions: { ghidra: "12.1.4" },
      }),
    );
  });

  it("rejects a malformed project document", () => {
    const unsupported = parseInvestigationProject({ version: 2 });
    expect(unsupported.ok).toBe(false);
    if (!unsupported.ok)
      expect(unsupported.error).toContain("Unsupported project schema version 2");
    expect(
      parseInvestigationProject({
        version: INVESTIGATION_PROJECT_VERSION,
        name: "demo",
        created_at: "2026-10-29T00:00:00.000Z",
        updated_at: "2026-10-29T00:00:00.000Z",
        config: {
          backends: ["auto"],
          authorize_dynamic: false,
          ai_enabled: false,
        },
        targets: [],
        jobs: [],
      }).ok,
    ).toBe(true);
  });
});
