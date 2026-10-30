# Analysis backends

## Built-in (always available)

The investigation workflow can hash a target, detect registered formats, and
extract printable strings without Hopper, Ghidra, or JADX. That path never
executes the file.

## Deep providers (optional)

| Id     | Configuration          | Notes                                                      |
| ------ | ---------------------- | ---------------------------------------------------------- |
| hopper | `HOPPER_LAUNCHER_PATH` | Proprietary; see [installation.md](installation.md#hopper) |
| ghidra | `GHIDRA_INSTALL_DIR`   | See [ghidra-provider.md](ghidra-provider.md)               |
| ida    | `REA_IDA_MCP_CONFIG`   | See [ida-provider.md](ida-provider.md)                     |
| kuna   | `REA_KUNA_COMMAND`     | See [kuna-provider.md](kuna-provider.md)                   |

`probeAnalysisBackends` only checks that configured paths exist. It does not
start those programs. A missing path is reported as unavailable.

## Auxiliary / optional

JADX, apktool, Rizin, radare2 (`r2`), objdump, Frida, Cutter, JEB, GDB, and
browser/Electron tools remain the existing REA commands. The project workflow
does not substitute for them.

## Unavailable in this environment

On 2026-10-29 this machine had no `ghidra`, `r2`, or `rizin` on PATH. Tests
assert that `angr` is reported unavailable. Do not treat those integrations as
verified here.
