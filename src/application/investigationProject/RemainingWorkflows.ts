import type { BackendAvailability } from "./BackendProbe.js";

export interface RemainingWorkflow {
  readonly command: string;
  readonly usable: boolean;
  readonly reason: string;
}

const available = (
  backends: readonly BackendAvailability[],
  id: string,
): boolean => backends.some((backend) => backend.id === id && backend.available);

/**
 * Name the commands that still produce evidence when a selected backend is
 * missing. This is not a silent provider fallback.
 */
export const remainingWorkflowsFor = (
  format: string,
  backends: readonly BackendAvailability[],
): readonly RemainingWorkflow[] => {
  const deep =
    available(backends, "ghidra") ||
    available(backends, "hopper") ||
    available(backends, "ida") ||
    available(backends, "kuna");
  const workflows: RemainingWorkflow[] = [
    {
      command: "inspect-target / analyze-project",
      usable: true,
      reason:
        "Bounded hashing, format detection, and string extraction always run and never execute the target.",
    },
    {
      command: "inspect / analyze / decompile",
      usable: deep,
      reason: deep
        ? "A configured deep provider can decompile native code."
        : "No Ghidra, Hopper, IDA, or Kuna path is configured. Install one of those tools or keep using builtin-static.",
    },
    {
      command: "analyze-javascript-application",
      usable:
        format === "javascript" ||
        format === "typescript" ||
        format === "source-repository",
      reason:
        format === "javascript" ||
        format === "typescript" ||
        format === "source-repository"
          ? "Static JavaScript/TypeScript inspection does not need a native decompiler."
          : "Use this command for unpacked JavaScript or Electron trees, not for this header-detected format.",
    },
    {
      command: "inspect-android-package",
      usable: format === "apk" || format === "dex" || format === "jar",
      reason:
        format === "apk" || format === "dex" || format === "jar"
          ? available(backends, "jadx")
            ? "JADX is available for class and method inspection."
            : "APK/DEX/JAR headers were detected. Install JADX for decompilation; inspect-apk-signature remains static."
          : "Android package commands apply to APK, DEX, or JAR inputs.",
    },
    {
      command: "inspect-wasm-artifact",
      usable: format === "wasm",
      reason:
        format === "wasm"
          ? "Use the WASM inspector for section and import/export facts."
          : "This command applies to WebAssembly modules.",
    },
    {
      command: "instrument-with-frida / debug-with-gdb",
      usable: false,
      reason:
        "Runtime instrumentation is opt-in and is never selected by analyze-project.",
    },
  ];
  return workflows;
};
