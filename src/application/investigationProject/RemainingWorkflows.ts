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

const nativeFormat = (format: string): boolean =>
  format === "elf" ||
  format === "pe" ||
  format === "mach-o" ||
  format === "mach-o-universal" ||
  format === "dos-mz";

/**
 * Name the existing CLI commands that still produce evidence for this format.
 * This is not a silent provider fallback and does not launch those commands.
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
  const javascript =
    format === "javascript" ||
    format === "typescript" ||
    format === "source-repository";
  const android = format === "apk" || format === "dex" || format === "jar";
  const workflows: RemainingWorkflow[] = [
    {
      command: "inspect-target / analyze-project",
      usable: true,
      reason:
        "Bounded hashing, format detection, and string extraction always run and never execute the target.",
    },
    {
      command: "inspect / analyze / decompile",
      usable: deep && nativeFormat(format),
      reason:
        deep && nativeFormat(format)
          ? "A configured deep provider can inspect, analyze, or decompile this native target."
          : nativeFormat(format)
            ? "No Ghidra, Hopper, IDA, or Kuna path is configured. Install one of those tools or keep using builtin-static."
            : "The one-shot inspect/analyze/decompile lane applies to native binaries after a deep provider is configured.",
    },
    {
      command: "inspect-elf-notes",
      usable: format === "elf",
      reason:
        format === "elf"
          ? "Existing ELF note inspection reads the imported file without a deep provider."
          : "This command applies to ELF images.",
    },
    {
      command: "inspect-macho",
      usable: format === "mach-o" || format === "mach-o-universal",
      reason:
        format === "mach-o" || format === "mach-o-universal"
          ? "Existing Mach-O inspection reads the imported file without a deep provider."
          : "This command applies to Mach-O images.",
    },
    {
      command: "inspect-native-exports",
      usable: nativeFormat(format),
      reason: nativeFormat(format)
        ? "Existing export inspection reads PE and ELF images without launching the target."
        : "This command applies to native binaries.",
    },
    {
      command: "inspect-with-objdump",
      usable: available(backends, "objdump") && nativeFormat(format),
      reason: available(backends, "objdump") && nativeFormat(format)
        ? "objdump is available for read-only disassembly of the imported path."
        : nativeFormat(format)
          ? "objdump is not available on PATH."
          : "objdump inspection applies to native binaries.",
    },
    {
      command: "analyze-javascript-application",
      usable: javascript,
      reason: javascript
        ? "Static JavaScript/TypeScript inspection does not need a native decompiler."
        : "Use this command for unpacked JavaScript or Electron trees, not for this header-detected format.",
    },
    {
      command: "inspect-android-package",
      usable: android,
      reason: android
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

/** Render the next existing CLI invocations for an imported target path. */
export const nextAnalysisCommandsFor = (
  targetPath: string,
  remaining: readonly RemainingWorkflow[],
): string =>
  remaining
    .filter(
      (workflow) =>
        workflow.usable && workflow.command !== "inspect-target / analyze-project",
    )
    .map((workflow) => `rea ${workflow.command.split(" / ")[0]} ${targetPath}`)
    .join("\n");
