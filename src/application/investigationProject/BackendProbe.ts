import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { delimiter } from "node:path";

export interface BackendAvailability {
  readonly id: string;
  readonly family: "deep" | "auxiliary" | "optional";
  readonly available: boolean;
  readonly configured: boolean;
  readonly reason: string;
}

const executableOnPath = async (
  command: string,
  environment: Readonly<Record<string, string | undefined>>,
): Promise<boolean> => {
  if (command.includes("/") || command.includes("\\")) {
    try {
      await access(command, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  const pathValue = environment.PATH ?? environment.Path ?? "";
  for (const directory of pathValue.split(delimiter)) {
    if (directory.length === 0) continue;
    try {
      await access(`${directory}/${command}`, constants.X_OK);
      return true;
    } catch {
      // Try the next PATH entry.
    }
  }
  return false;
};

const configuredPath = async (value: string | undefined): Promise<boolean> => {
  if (value === undefined || value.length === 0) return false;
  try {
    await access(value, constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

/**
 * Report optional backend availability from configuration and PATH. This does
 * not launch engines or treat a missing tool as a workflow failure.
 */
export const probeAnalysisBackends = async (
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Promise<readonly BackendAvailability[]> => {
  const hopperConfigured = await configuredPath(
    environment.HOPPER_LAUNCHER_PATH,
  );
  const ghidraConfigured = await configuredPath(environment.GHIDRA_INSTALL_DIR);
  const idaConfigured = await configuredPath(environment.REA_IDA_MCP_CONFIG);
  const kunaCommand = environment.REA_KUNA_COMMAND;
  const kunaAvailable =
    kunaCommand !== undefined &&
    (await executableOnPath(kunaCommand, environment));
  const jadxCommand = environment.REA_JADX_COMMAND ?? environment.REA_JADX_PATH;
  const jadxAvailable =
    jadxCommand !== undefined &&
    (await executableOnPath(jadxCommand, environment));
  const rizinCommand = environment.REA_RIZIN_COMMAND ?? "rizin";
  const rizinAvailable = await executableOnPath(rizinCommand, environment);
  const radareAvailable = await executableOnPath("r2", environment);
  const apktoolCommand = environment.REA_APKTOOL_COMMAND ?? "apktool";
  const apktoolAvailable = await executableOnPath(apktoolCommand, environment);
  const objdumpCommand = environment.REA_OBJDUMP_COMMAND ?? "objdump";
  const objdumpAvailable = await executableOnPath(objdumpCommand, environment);
  return [
    {
      id: "builtin-static",
      family: "deep",
      available: true,
      configured: true,
      reason:
        "Header parsing, hashing, and string extraction are always available.",
    },
    {
      id: "hopper",
      family: "deep",
      available: hopperConfigured,
      configured: hopperConfigured,
      reason: hopperConfigured
        ? "HOPPER_LAUNCHER_PATH points to an existing launcher."
        : "HOPPER_LAUNCHER_PATH is unset or missing.",
    },
    {
      id: "ghidra",
      family: "deep",
      available: ghidraConfigured,
      configured: ghidraConfigured,
      reason: ghidraConfigured
        ? "GHIDRA_INSTALL_DIR points to an existing installation."
        : "GHIDRA_INSTALL_DIR is unset or missing.",
    },
    {
      id: "ida",
      family: "deep",
      available: idaConfigured,
      configured: idaConfigured,
      reason: idaConfigured
        ? "REA_IDA_MCP_CONFIG points to an existing registration."
        : "REA_IDA_MCP_CONFIG is unset or missing.",
    },
    {
      id: "kuna",
      family: "deep",
      available: kunaAvailable,
      configured: kunaCommand !== undefined,
      reason: kunaAvailable
        ? "REA_KUNA_COMMAND is executable."
        : "REA_KUNA_COMMAND is unset or not executable.",
    },
    {
      id: "jadx",
      family: "auxiliary",
      available: jadxAvailable,
      configured: jadxCommand !== undefined,
      reason: jadxAvailable
        ? "JADX command is executable."
        : "JADX is not configured.",
    },
    {
      id: "rizin",
      family: "optional",
      available: rizinAvailable,
      configured: environment.REA_RIZIN_COMMAND !== undefined || rizinAvailable,
      reason: rizinAvailable
        ? "rizin is on PATH or REA_RIZIN_COMMAND."
        : "rizin is not available.",
    },
    {
      id: "radare2",
      family: "optional",
      available: radareAvailable,
      configured: radareAvailable,
      reason: radareAvailable
        ? "r2 is on PATH."
        : "radare2 is not installed; REA does not vendor it.",
    },
    {
      id: "apktool",
      family: "auxiliary",
      available: apktoolAvailable,
      configured:
        environment.REA_APKTOOL_COMMAND !== undefined || apktoolAvailable,
      reason: apktoolAvailable
        ? "apktool is available."
        : "apktool is not available.",
    },
    {
      id: "objdump",
      family: "optional",
      available: objdumpAvailable,
      configured:
        environment.REA_OBJDUMP_COMMAND !== undefined || objdumpAvailable,
      reason: objdumpAvailable
        ? "objdump is available."
        : "objdump is not available.",
    },
    {
      id: "angr",
      family: "optional",
      available: false,
      configured: false,
      reason: "angr is not integrated. Symbolic execution remains deferred.",
    },
    {
      id: "frida",
      family: "optional",
      available: false,
      configured: false,
      reason:
        "Frida is optional and never selected by project analysis unless an existing Frida command is used with explicit authorization.",
    },
  ];
};
