import { describe, expect, it } from "vitest";

import type { BackendAvailability } from "./BackendProbe.js";
import {
  nextAnalysisCommandsFor,
  remainingWorkflowsFor,
} from "./RemainingWorkflows.js";

const backends = (availableIds: readonly string[]): BackendAvailability[] =>
  ["builtin-static", "ghidra", "ida", "jadx"].map((id) => ({
    id,
    family: id === "jadx" ? "auxiliary" : "deep",
    available: availableIds.includes(id),
    configured: availableIds.includes(id),
    reason: availableIds.includes(id) ? "present" : "missing",
  }));

describe("remaining workflows", () => {
  it("keeps builtin analysis usable when Ghidra and IDA are missing", () => {
    const remaining = remainingWorkflowsFor(
      "elf",
      backends(["builtin-static"]),
    );
    expect(
      remaining.find(
        (item) => item.command === "inspect-target / analyze-project",
      )?.usable,
    ).toBe(true);
    expect(
      remaining.find((item) => item.command === "inspect / analyze / decompile")
        ?.usable,
    ).toBe(false);
  });

  it("does not treat Frida as part of analyze-project", () => {
    const remaining = remainingWorkflowsFor(
      "elf",
      backends(["builtin-static", "ghidra"]),
    );
    expect(
      remaining.find((item) => item.command.startsWith("instrument-with-frida"))
        ?.usable,
    ).toBe(false);
  });

  it("names inspect-macho for universal images without a deep provider", () => {
    const remaining = remainingWorkflowsFor(
      "mach-o-universal",
      backends(["builtin-static"]),
    );
    expect(
      remaining.find((item) => item.command === "inspect-macho")?.usable,
    ).toBe(true);
    expect(nextAnalysisCommandsFor("/usr/bin/true", remaining)).toContain(
      "rea inspect-macho /usr/bin/true",
    );
  });

  it("names existing ELF inspectors without requiring a deep provider", () => {
    const remaining = remainingWorkflowsFor(
      "elf",
      backends(["builtin-static"]),
    );
    expect(
      remaining.find((item) => item.command === "inspect-elf-notes")?.usable,
    ).toBe(true);
    expect(
      remaining.find((item) => item.command === "inspect-macho")?.usable,
    ).toBe(false);
    expect(
      remaining.find((item) => item.command === "inspect / analyze / decompile")
        ?.usable,
    ).toBe(false);
  });

  it("marks inspect/analyze/decompile usable only when a deep provider is present", () => {
    const remaining = remainingWorkflowsFor(
      "elf",
      backends(["builtin-static", "ghidra"]),
    );
    expect(
      remaining.find((item) => item.command === "inspect / analyze / decompile")
        ?.usable,
    ).toBe(true);
  });

  it("renders the first existing command for an imported path", () => {
    const remaining = remainingWorkflowsFor(
      "elf",
      backends(["builtin-static"]),
    );
    expect(nextAnalysisCommandsFor("/tmp/sample.so", remaining)).toContain(
      "rea inspect-elf-notes /tmp/sample.so",
    );
    expect(nextAnalysisCommandsFor("/tmp/sample.so", remaining)).not.toContain(
      "rea inspect /tmp/sample.so",
    );
  });
});
