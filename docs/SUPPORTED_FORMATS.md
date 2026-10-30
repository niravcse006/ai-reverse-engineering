# Supported formats

Two layers exist. Do not treat a detection label as a complete analysis path.

## Project registry (`detectRegisteredFormat`)

Source: `src/domain/formatRegistry.ts`. Probe is 8 KiB. Tests:
`src/domain/formatRegistry.test.ts`.

| Format                      | Detection                                  | Project analysis                 | Deep / family command                                          |
| --------------------------- | ------------------------------------------ | -------------------------------- | -------------------------------------------------------------- |
| ELF / PE / Mach-O / DOS MZ  | Executable header parser                   | Hash, arch, strings              | `inspect` / `analyze` / `decompile` if a provider is installed |
| ZIP / APK / IPA / JAR / HAP | ZIP magic + name helpers                   | Hash + format name               | `inspect-android-package`, resource commands                   |
| WASM                        | `\0asm` magic                              | Hash + format name               | `inspect-wasm-artifact`                                        |
| DEX                         | `dex\n` magic                              | Hash + format name               | Android commands                                               |
| JS / TS                     | Extension plus source-repository directory | Hash; strings if a file          | `analyze-javascript-application`                               |
| empty / unknown             | Size or unrecognized prefix                | Import of empty files is refused | —                                                              |

## Upstream family inspectors (snapshot)

These commands exist in `src/cliCommandNames.ts`. They were **not** re-verified
against real samples in this increment:

ELF notes, PE imports/certs, Go/Rust binaries, IL2CPP, Godot PCK, GPU objects,
model artifacts, Electron, HAR/SAZ, firmware, APK signatures, .NET assemblies,
and others listed in [cli.md](cli.md).

## Gaps

- `analyze-project` does not call those family inspectors.
- Filename extensions are used only after magic/header checks fail or for
  source text.
- Firmware “support” in the project path is not a dedicated format id; use the
  firmware commands.
