import { describe, expect, it } from "vitest";

import type { BackendAvailability } from "./BackendProbe.js";
import { remainingWorkflowsFor } from "./RemainingWorkflows.js";

const backends = (
  availableIds: readonly string[],
): BackendAvailability[] =>
  ["builtin-static", "ghidra", "ida", "jadx"].map((id) => ({
    id,
    family: id === "jadx" ? "auxiliary" : "deep",
    available: availableIds.includes(id),
    configured: availableIds.includes(id),
    reason: availableIds.includes(id) ? "present" : "missing",
  }));

describe("remaining workflows", () => {
  it("keeps builtin analysis usable when Ghidra and IDA are missing", () => {
    const remaining = remainingWorkflowsFor("elf", backends(["builtin-static"]));
    expect(
      remaining.find((item) => item.command === "inspect-target / analyze-project")
        ?.usable,
    ).toBe(true);
    expect(
      remaining.find((item) => item.command === "inspect / analyze / decompile")
        ?.usable,
    ).toBe(false);
  });

  it("does not treat Frida as part of analyze-project", () => {
    const remaining = remainingWorkflowsFor("elf", backends(["builtin-static", "ghidra"]));
    expect(
      remaining.find((item) => item.command.startsWith("instrument-with-frida"))
        ?.usable,
    ).toBe(false);
  });
});
