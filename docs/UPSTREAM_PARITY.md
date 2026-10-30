# Upstream parity

Date: 2026-10-29.
This is the current feature-by-feature comparison. Older comparison notes are
historical: [FEATURE_PARITY.md](FEATURE_PARITY.md),
[FEATURE_COMPARISON.md](FEATURE_COMPARISON.md),
[UPSTREAM_COMPARISON.md](UPSTREAM_COMPARISON.md).

Pinned compatible release: **rea-agents 6.8.0**
tag `160d821ac9a0310afcb8d1fc427862dd6508add5` (2026-10-25).

Imported snapshot in this tree: `17ceb77ca5f2632faab8de01da4babff680eac48`.

Previous pinned upstream tips:

- `1ef5918179d3cb77b8868bd117de662cbd7099ab` (ahead 12)
- `34577eb1cc264000a176ded68e5ebf8aba430edd` (ahead 17)

Upstream `main` recorded by `npm run upstream:drift` this increment:
`317bf3fe235e655b2d752d3be261cc0da7d00f2b` (ahead 40).
Compare: GitHub `17ceb77...main`. This is not a moving comparison without a SHA.

New commits after `34577eb` were inspected by title and file list only. None
were ported this increment. Highest-priority unported items: evidence
publication limits (`bf115be`), debugger cleanup typing (`a108a1b`), Mach-O
BOM/selection (`da5ec6b`, `c0c3902`), ADB long-path pushes (`1da304b`), Bun
standalone graphs (`8188497`). Large contract/admission refactors are not
automatic ports.

Statuses: **PASS** implemented and verified here · **PARTIAL** present with
limits · **MISSING** absent · **BROKEN** present but failing · **NOT TESTED**
code exists, this increment did not prove it · **NOT APPLICABLE** excluded on
purpose.

`npm run upstream:drift` reprints the unported commit list. It does not merge.

## Matrix

| Capability                                                                | Upstream                                                        | This tree                                                                  | Difference / impact                                                                   | Test                                                                                                                                                | Status         |
| ------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| CLI one-shot inspect/analyze/decompile                                    | `src/cli.ts`, `src/cliCommandNames.ts`                          | Same snapshot                                                              | Investigation commands are additive                                                   | Investigation CLI tested; full upstream CLI family **NOT TESTED** this increment                                                                    | PARTIAL        |
| MCP tool catalog / stdio                                                  | `src/server/`                                                   | Same snapshot + cancellation fix                                           | Investigation-project commands are CLI-only                                           | Unsandboxed `test:mcp` exit 1: **5 failed / 1612 passed / 13 skipped**. Prior JSON-cancel case passed. Five load timeouts passed focused (11 tests) | PARTIAL        |
| Evidence contract                                                         | `src/domain/evidence.ts`                                        | Same                                                                       | Unchanged                                                                             | Existing Evidence suite **not re-run**                                                                                                              | NOT TESTED     |
| Hopper / Ghidra / IDA / Kuna                                              | `src/hopper`, `src/ghidra`, `src/ida`, `src/kuna`               | Same                                                                       | BYO engines; missing path is reported                                                 | Live lanes **not run**. Ghidra MCP reopen passed in the unsandboxed suite                                                                           | NOT TESTED     |
| JADX / apktool / Frida / Rizin / objdump                                  | matching `src/*`                                                | Same                                                                       | Optional                                                                              | Live lanes **not run**. Frida and Rizin MCP files passed in the unsandboxed suite                                                                   | NOT TESTED     |
| ADB PNG header check                                                      | `f7cd4e5`                                                       | `AdbProvider` + `pngHeader.ts`                                             | Ported earlier                                                                        | `pngHeader.test.ts` 16 passed. `AdbProvider.test.ts` not run                                                                                        | PARTIAL        |
| Guidance search                                                           | `c88e1b0` `GuidanceAccess.ts`                                   | Absent                                                                     | `rea guidance` missing                                                                | —                                                                                                                                                   | MISSING        |
| Environment varied-member writes                                          | `131fbe0`                                                       | Absent                                                                     | Environment write views incomplete vs main                                            | —                                                                                                                                                   | MISSING        |
| BinarySession cancel during retirement                                    | `3503578`                                                       | Ported                                                                     | Cancellation retained through retirement and cleanup owners                           | `gdbRetirementCancellation.test.ts` 7 passed; BinarySession composition cases                                                                       | PASS           |
| Native bookmark uncertainty                                               | `2b85a4a`                                                       | `AnalysisContextQueries.ts`                                                | Exact string match, then offset+space, else unavailable                               | `AnalysisContextQueries.test.ts` 23 passed                                                                                                          | PASS           |
| Native dispatch format refusals                                           | `e3d8d20`                                                       | `AppleDispatchMetadata.ts` + Mach-O/ObjC/Swift facets                      | Misaligned sections throw `BinaryFormatFailure` then `AnalysisUnsupportedTargetError` | `AppleDispatchMetadata.failure.test.ts` 9 passed; `nativeDispatchFormatFailures.test.ts` added                                                      | PASS           |
| Mach-O per-slice encryption                                               | `860fdd8`                                                       | Absent `MachoEncryptionReader.ts`                                          | `inspect_macho` lacks slice encryption                                                | —                                                                                                                                                   | MISSING        |
| Linux process-ownership on exit                                           | `01e00da`                                                       | Ported                                                                     | Linux ENOENT/ESRCH token races corroborated before signal                             | 135 passed / 2 skipped (Linux live spawn skipped on Darwin)                                                                                         | PASS           |
| Environment sorted creates/toggles                                        | `51ad845`                                                       | Absent                                                                     | Environment write views incomplete vs main                                            | —                                                                                                                                                   | MISSING        |
| Browser source-map declaration uncertainty                                | `1ef5918`                                                       | Ported                                                                     | Invalid/omitted declarations stay unknown; diffs do not treat them as absent          | CDP metadata, `webCaptureDiff`, and browser CLI tests passed                                                                                        | PASS           |
| JavaScript semantic-trace operator influence                              | `5c05eb8`                                                       | Absent                                                                     | Breaking semantic-trace change on main                                                | —                                                                                                                                                   | MISSING        |
| .NET single-file bundle inspect/extract                                   | `22cab82`                                                       | Absent                                                                     | New artifact family on main                                                           | —                                                                                                                                                   | MISSING        |
| CLI literal Markdown rendering                                            | `e124bdf`                                                       | Absent                                                                     | CLI output punctuation/attributes may differ                                          | —                                                                                                                                                   | MISSING        |
| Undecodable symlink target bytes                                          | `34577eb`                                                       | Absent                                                                     | Firmware/Apple dylib symlink bytes may be dropped                                     | —                                                                                                                                                   | MISSING        |
| Evidence storage publication limits                                       | `bf115be`                                                       | Absent                                                                     | Breaking evidence publication change on main                                          | —                                                                                                                                                   | MISSING        |
| Debugger incomplete-cleanup typing                                        | `a108a1b`                                                       | Absent                                                                     | CLI debugger cleanup outcomes may differ                                              | —                                                                                                                                                   | MISSING        |
| Bun standalone module graphs                                              | `8188497`                                                       | Absent                                                                     | New artifact family on main                                                           | —                                                                                                                                                   | MISSING        |
| Skill pause-deadline docs                                                 | `bd37925`                                                       | Older skill docs                                                           | Doc only                                                                              | —                                                                                                                                                   | NOT APPLICABLE |
| rea.tools website setup docs                                              | `d3ecf68`                                                       | Product README is this repo                                                | Intentional                                                                           | —                                                                                                                                                   | NOT APPLICABLE |
| APK rotated-signer docs                                                   | `6fa48f2`                                                       | Product docs are this repo                                                 | Doc only                                                                              | —                                                                                                                                                   | NOT APPLICABLE |
| Investigation projects                                                    | Not upstream                                                    | `src/application/investigationProject/`                                    | Fork-only                                                                             | Workflow + remaining-workflow source tests passed                                                                                                   | PASS           |
| Next-command findings                                                     | Not upstream                                                    | `RemainingWorkflows.ts` names existing CLI commands                        | Reports inferred next `rea …` invocations; does not launch them                       | RemainingWorkflows + Workflow tests                                                                                                                 | PASS           |
| Duplicate target reuse                                                    | —                                                               | `addProjectTarget`                                                         | Fork-only                                                                             | Workflow.test                                                                                                                                       | PASS           |
| Completed-job cache reuse                                                 | —                                                               | `investigationCacheKey` includes `det=` and `fmt=`                         | Older keys do not match; `ev_format` must agree                                       | Workflow cache-identity tests                                                                                                                       | PASS           |
| Stale-hash after import                                                   | —                                                               | `runInvestigationWorkflow`                                                 | Fork-only                                                                             | Workflow safety test                                                                                                                                | PASS           |
| Schema version refusal                                                    | —                                                               | `parseInvestigationProject`                                                | Fork-only                                                                             | investigationProject.test                                                                                                                           | PASS           |
| Evidence file persistence                                                 | —                                                               | `writeInvestigationEvidence`                                               | Fork-only                                                                             | Workflow.test writes `evidence/*.json`                                                                                                              | PASS           |
| FAT prefix classification                                                 | `parseExecutableHeader` fails when slices are outside the probe | `formatRegistry.ts` names `mach-o-universal` and points at `inspect-macho` | 8 KiB probe no longer reports `/usr/bin/true` as unknown                              | `formatRegistry.test.ts` + CLI import of `/usr/bin/true`                                                                                            | PASS           |
| Optional `REA_AI_*`                                                       | External agent via MCP upstream                                 | `AiProvider.ts` + Workflow env pass-through                                | Findings JSON to caller endpoint when enabled; key not in body                        | Local 127.0.0.1 HTTP + failure path (8 passed this increment)                                                                                       | PARTIAL        |
| Package name `rea-agents`                                                 | Official npm                                                    | Same runtime name                                                          | README says not official publication                                                  | Collision check (npm 6.8.0 taken)                                                                                                                   | NOT APPLICABLE |
| JS / Electron / .NET / Android / firmware / web / pcap / process / Python | Upstream adapters in `src/`                                     | Same snapshot                                                              | Prerequisites optional                                                                | Several MCP files passed unsandboxed; live engines still **not run**                                                                                | NOT TESTED     |

## Artifact / provider matrix

| Artifact family                 | Implementation                                  | Prerequisites                              | Evidence this increment                                                                | Status     |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------- | ---------- |
| Native binaries / decompilation | Snapshot adapters + builtin-static project path | Hopper / Ghidra / IDA / Kuna for decompile | Unsandboxed native Mach-O MCP passed. Deep decompilers not installed                   | PARTIAL    |
| JavaScript / Electron           | Snapshot adapters                               | Optional browser / Electron                | Unsandboxed JS MCP files passed. Semantic-trace operator influence still missing       | NOT TESTED |
| .NET                            | Snapshot managed adapters                       | Optional                                   | Managed MCP passed. Single-file bundle extract (`22cab82`) is missing                  | NOT TESTED |
| Android                         | Snapshot APK/DEX/JADX/ADB                       | JADX / ADB optional                        | ADB MCP tests passed in the full suite; live device **not used**                       | NOT TESTED |
| Firmware                        | Snapshot ESP/FIT/uImage readers                 | None for static readers                    | `firmwareMcp.test.ts` skipped in this run                                              | NOT TESTED |
| Websites                        | Snapshot browser / website adapters             | Playwright / browser                       | Source-map uncertainty ported and CLI-tested. Live site capture **not run**            | PARTIAL    |
| Network captures                | Snapshot pcap adapters                          | None for static readers                    | Unsandboxed pcap MCP passed                                                            | NOT TESTED |
| Runtime observation             | Frida / process / GDB                           | Explicit opt-in tools                      | Frida MCP and GDB retirement-cancellation tests passed. Live attach **not run**        | NOT TESTED |
| Packaged Python                 | Snapshot pyc inspector                          | None for static pyc                        | `pythonPycMcp.test.ts` passed in the full suite                                        | NOT TESTED |
| Mach-O inspect                  | Snapshot `inspect_macho`                        | Host `lipo` / codesign                     | Unsandboxed `nativeMachoSummaryMcp.test.ts` passed. Per-slice encryption still missing | PARTIAL    |

## Counts (this matrix)

Previous increment: PASS 13 · PARTIAL 4 · MISSING 8 · BROKEN 0 · NOT TESTED 4 ·
NOT APPLICABLE 4.

| Status         | Count |
| -------------- | ----- |
| PASS           | 13    |
| PARTIAL        | 4     |
| MISSING        | 11    |
| BROKEN         | 0     |
| NOT TESTED     | 4     |
| NOT APPLICABLE | 4     |

Do not read these counts as “this fork is better than upstream.” PASS rows are
mostly fork-only investigation features plus five ports from `main`. Upstream
`main` is now ahead 40. The MISSING count rose because newer functional
commits were recorded, not because previously passing rows regressed.

## Intentional differences

- Product README describes this GitHub repository, not rea.tools.
- Investigation CLI does not launch deep engines or the target.
- `analyze-project` records inferred next commands for existing inspectors; it
  does not execute `inspect`, `analyze`, `decompile`, or objdump.
- Runtime identifiers stay `rea-agents` / `io.github.morluto/rea` until the
  owner chooses an independent distribution name.
