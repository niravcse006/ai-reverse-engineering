# Upstream parity

Date: 2026-10-29.
This is the current feature-by-feature comparison. Older comparison notes are
historical: [FEATURE_PARITY.md](FEATURE_PARITY.md),
[FEATURE_COMPARISON.md](FEATURE_COMPARISON.md),
[UPSTREAM_COMPARISON.md](UPSTREAM_COMPARISON.md).

Pinned compatible release: **rea-agents 6.8.0**
tag `160d821ac9a0310afcb8d1fc427862dd6508add5` (2026-10-25).

Imported snapshot in this tree: `17ceb77ca5f2632faab8de01da4babff680eac48`.

Upstream `main` recorded by `npm run upstream:drift`: `1ef5918179d3cb77b8868bd117de662cbd7099ab`.
Compare: GitHub `17ceb77...main` (ahead 12). This is not a moving comparison
without a SHA.

Statuses: **PASS** implemented and verified here · **PARTIAL** present with
limits · **MISSING** absent · **BROKEN** present but failing · **NOT TESTED**
code exists, this increment did not prove it · **NOT APPLICABLE** excluded on
purpose.

`npm run upstream:drift` reprints the unported commit list. It does not merge.

## Matrix

| Capability                                                                | Upstream                                                        | This tree                                                                  | Difference / impact                                                                   | Test                                                                                                                                | Status         |
| ------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| CLI one-shot inspect/analyze/decompile                                    | `src/cli.ts`, `src/cliCommandNames.ts`                          | Same snapshot                                                              | Investigation commands are additive                                                   | Investigation CLI tested; full upstream CLI family **NOT TESTED** this increment                                                    | PARTIAL        |
| MCP tool catalog / stdio                                                  | `src/server/`                                                   | Same snapshot                                                              | Investigation-project commands are CLI-only                                           | Sandboxed full `test:mcp` exit 1 (139 failed). Unsandboxed focused re-run of 8 files: **72 passed**. Other failing files not re-run | PARTIAL        |
| Evidence contract                                                         | `src/domain/evidence.ts`                                        | Same                                                                       | Unchanged                                                                             | Existing Evidence suite **not re-run**                                                                                              | NOT TESTED     |
| Hopper / Ghidra / IDA / Kuna                                              | `src/hopper`, `src/ghidra`, `src/ida`, `src/kuna`               | Same                                                                       | BYO engines; missing path is reported                                                 | Live lanes **not run**                                                                                                              | NOT TESTED     |
| JADX / apktool / Frida / Rizin / objdump                                  | matching `src/*`                                                | Same                                                                       | Optional                                                                              | Live lanes **not run**; objdump PATH probe only                                                                                     | NOT TESTED     |
| ADB PNG header check                                                      | `f7cd4e5`                                                       | `AdbProvider` + `pngHeader.ts`                                             | Ported earlier                                                                        | `pngHeader.test.ts` 16 passed. `AdbProvider.test.ts` not run                                                                        | PARTIAL        |
| Guidance search                                                           | `c88e1b0` `GuidanceAccess.ts`                                   | Absent                                                                     | `rea guidance` missing                                                                | —                                                                                                                                   | MISSING        |
| Environment varied-member writes                                          | `131fbe0`                                                       | Absent                                                                     | Environment write views incomplete vs main                                            | —                                                                                                                                   | MISSING        |
| BinarySession cancel during retirement                                    | `3503578`                                                       | Older `BinarySession.ts`                                                   | Cancellation edge vs main                                                             | —                                                                                                                                   | MISSING        |
| Native bookmark uncertainty                                               | `2b85a4a`                                                       | `AnalysisContextQueries.ts`                                                | Exact string match, then offset+space, else unavailable                               | `AnalysisContextQueries.test.ts` 23 passed                                                                                          | PASS           |
| Native dispatch format refusals                                           | `e3d8d20`                                                       | `AppleDispatchMetadata.ts` + Mach-O/ObjC/Swift facets                      | Misaligned sections throw `BinaryFormatFailure` then `AnalysisUnsupportedTargetError` | `AppleDispatchMetadata.failure.test.ts` 9 passed; `nativeDispatchFormatFailures.test.ts` added                                      | PASS           |
| Mach-O per-slice encryption                                               | `860fdd8`                                                       | Absent `MachoEncryptionReader.ts`                                          | `inspect_macho` lacks slice encryption                                                | —                                                                                                                                   | MISSING        |
| Linux process-ownership on exit                                           | `01e00da`                                                       | Older `ProcessOwnership.ts`                                                | Exiting Linux ownership weaker vs main                                                | —                                                                                                                                   | MISSING        |
| Environment sorted creates/toggles                                        | `51ad845`                                                       | Absent                                                                     | Environment write views incomplete vs main                                            | —                                                                                                                                   | MISSING        |
| Browser source-map declaration uncertainty                                | `1ef5918`                                                       | Older browser code                                                         | Source-map unknowns may be dropped                                                    | `sourceToBundleViewsMcp.test.ts` failed in this `test:mcp` run                                                                      | MISSING        |
| Skill pause-deadline docs                                                 | `bd37925`                                                       | Older skill docs                                                           | Doc only                                                                              | —                                                                                                                                   | NOT APPLICABLE |
| rea.tools website setup docs                                              | `d3ecf68`                                                       | Product README is this repo                                                | Intentional                                                                           | —                                                                                                                                   | NOT APPLICABLE |
| Investigation projects                                                    | Not upstream                                                    | `src/application/investigationProject/`                                    | Fork-only                                                                             | Workflow + remaining-workflow source tests passed                                                                                   | PASS           |
| Next-command findings                                                     | Not upstream                                                    | `RemainingWorkflows.ts` names existing CLI commands                        | Reports inferred next `rea …` invocations; does not launch them                       | RemainingWorkflows + Workflow tests                                                                                                 | PASS           |
| Duplicate target reuse                                                    | —                                                               | `addProjectTarget`                                                         | Fork-only                                                                             | Workflow.test                                                                                                                       | PASS           |
| Completed-job cache reuse                                                 | —                                                               | `investigationCacheKey` includes `det=` and `fmt=`                         | Older keys do not match; `ev_format` must agree                                       | Workflow cache-identity tests                                                                                                       | PASS           |
| Stale-hash after import                                                   | —                                                               | `runInvestigationWorkflow`                                                 | Fork-only                                                                             | Workflow safety test                                                                                                                | PASS           |
| Schema version refusal                                                    | —                                                               | `parseInvestigationProject`                                                | Fork-only                                                                             | investigationProject.test                                                                                                           | PASS           |
| Evidence file persistence                                                 | —                                                               | `writeInvestigationEvidence`                                               | Fork-only                                                                             | Workflow.test writes `evidence/*.json`                                                                                              | PASS           |
| FAT prefix classification                                                 | `parseExecutableHeader` fails when slices are outside the probe | `formatRegistry.ts` names `mach-o-universal` and points at `inspect-macho` | 8 KiB probe no longer reports `/usr/bin/true` as unknown                              | `formatRegistry.test.ts` + CLI import of `/usr/bin/true`                                                                            | PASS           |
| Optional `REA_AI_*`                                                       | External agent via MCP upstream                                 | `AiProvider.ts` + Workflow env pass-through                                | Findings JSON to caller endpoint when enabled; key not in body                        | Local 127.0.0.1 HTTP + failure path                                                                                                 | PARTIAL        |
| Package name `rea-agents`                                                 | Official npm                                                    | Same runtime name                                                          | README says not official publication                                                  | Collision check (npm 6.8.0 taken)                                                                                                   | NOT APPLICABLE |
| JS / Electron / .NET / Android / firmware / web / pcap / process / Python | Upstream adapters in `src/`                                     | Same snapshot                                                              | Prerequisites optional                                                                | Real lanes **not run**; several MCP files failed in this environment                                                                | NOT TESTED     |

## Artifact / provider matrix

| Artifact family                 | Implementation                                  | Prerequisites                              | Evidence this increment                                                                                           | Status     |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| Native binaries / decompilation | Snapshot adapters + builtin-static project path | Hopper / Ghidra / IDA / Kuna for decompile | `inspect-macho /usr/bin/true` exit 0 (`native-macos`, `mach-o-universal`, arm64e). Deep decompilers not installed | PARTIAL    |
| JavaScript / Electron           | Snapshot adapters                               | Optional browser / Electron                | MCP JS/Electron files failed in this run                                                                          | NOT TESTED |
| .NET                            | Snapshot managed adapters                       | Optional                                   | MCP managed tests passed in the completed `test:mcp` run                                                          | NOT TESTED |
| Android                         | Snapshot APK/DEX/JADX/ADB                       | JADX / ADB optional                        | ADB MCP tests passed; live device **not used**                                                                    | NOT TESTED |
| Firmware                        | Snapshot ESP/FIT/uImage readers                 | None for static readers                    | ESP MCP tests passed                                                                                              | NOT TESTED |
| Websites                        | Snapshot browser / website adapters             | Playwright / browser                       | Browser MCP files failed                                                                                          | NOT TESTED |
| Network captures                | Snapshot pcap adapters                          | None for static readers                    | Unsandboxed `pcapWorkspaceAllocation.test.ts` 10 passed                                                           | NOT TESTED |
| Runtime observation             | Frida / process / GDB                           | Explicit opt-in tools                      | Frida lifecycle MCP 2 failed                                                                                      | NOT TESTED |
| Packaged Python                 | Snapshot pyc inspector                          | None for static pyc                        | `pythonPycMcp.test.ts` passed                                                                                     | NOT TESTED |
| Mach-O inspect                  | Snapshot `inspect_macho`                        | Host `lipo` / codesign                     | CLI `inspect-macho /usr/bin/true` passed. Unsandboxed `nativeMachoSummaryMcp.test.ts` 4 passed                    | PARTIAL    |

## Counts (this matrix)

| Status         | Count |
| -------------- | ----- |
| PASS           | 10    |
| PARTIAL        | 4     |
| MISSING        | 7     |
| BROKEN         | 0     |
| NOT TESTED     | 4     |
| NOT APPLICABLE | 3     |

Do not read these counts as “this fork is better than upstream.” PASS rows are
mostly fork-only investigation features plus two native ports from `main`.
Upstream `main` still has seven unported functional commits after those ports.

## Intentional differences

- Product README describes this GitHub repository, not rea.tools.
- Investigation CLI does not launch deep engines or the target.
- `analyze-project` records inferred next commands for existing inspectors; it
  does not execute `inspect`, `analyze`, `decompile`, or objdump.
- Runtime identifiers stay `rea-agents` / `io.github.morluto/rea` until the
  owner chooses an independent distribution name.
