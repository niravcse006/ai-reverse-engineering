# Upstream parity

Date: 2026-10-30.
This is the live feature-by-feature comparison. Older notes:
[FEATURE_PARITY.md](FEATURE_PARITY.md),
[FEATURE_COMPARISON.md](FEATURE_COMPARISON.md),
[UPSTREAM_COMPARISON.md](UPSTREAM_COMPARISON.md).
Implementation order: [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md).

Pinned compatible release: **rea-agents 6.8.0**
tag `160d821ac9a0310afcb8d1fc427862dd6508add5` (2026-10-25).

Imported snapshot in this tree: `17ceb77ca5f2632faab8de01da4babff680eac48`.

This fork HEAD when recorded: `1fa70495874a90144fab7ffca9971bb390641626`.

Upstream `main` from `npm run upstream:drift` on 2026-10-30:

`b1ff7cdacc03110d51bcac33da3cbb7850ac27fc` (**ahead 56**, behind 0).

Compare: GitHub `17ceb77...b1ff7cd`. This is not a moving comparison without a
SHA.

Statuses: **MATCHED** present here with tests · **PARTIAL** present with
limits · **MISSING** absent · **BROKEN** present but failing · **NOT TESTED**
code exists, this increment did not prove it · **NOT APPLICABLE** excluded on
purpose.

`npm run upstream:drift` reprints the unported commit list. It does not merge.

The inventory increment recorded the 56-commit gap and a sequenced plan. This
increment ports Wave A item 1 (`guidance`) only. Do not read this document as
“this fork is better than upstream.”

## Command inventory

Compared `src/cliCommandNames.ts` on this tree vs upstream
`b1ff7cdacc03110d51bcac33da3cbb7850ac27fc`.

| Set                      | Count                    |
| ------------------------ | ------------------------ |
| Shared one-shot commands | 180                      |
| Only this tree           | 8 investigation commands |
| Only upstream            | 0                        |

Only this tree: `init-project`, `import-target`, `inspect-target`,
`analyze-project`, `generate-report`, `resume-job`, `list-plugins`,
`project-status`.

Guidance (`rea guidance`, MCP `search_guidance` / `read_guidance_section`) is
implemented and verified in this tree.

Package identity is **not independent**: both trees publish as `rea-agents`
`6.8.0` / `mcpName` `io.github.morluto/rea`. Engines match
`^22.23.4 \|\| ^24.22.1 \|\| >=26.12.1`.

Test-file counts (`.test.ts` / `.test.mts`, excluding `node_modules` / `dist`):

| Tree               | Test files |
| ------------------ | ---------- |
| This repository    | 2830       |
| Upstream `b1ff7cd` | 2872       |

File count is not mutation score, branch coverage, or scenario quality.

## Capability matrix

| Capability                                                          | Upstream                                          | This tree                                                      | Test                                                                            | Status         |
| ------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------- |
| CLI one-shot inspect/analyze/decompile                              | 180 named commands                                | 180 shared + 8 investigation                                   | Guidance CLI tested; full CLI family not re-run this increment                  | PARTIAL        |
| `rea guidance` workflow search                                      | `c88e1b0`                                         | Present: CLI + MCP `search_guidance` / `read_guidance_section` | GuidanceAccess, CLI, MCP registration, packaged-bundle search                   | MATCHED        |
| MCP tool catalog / stdio                                            | `src/server/`                                     | Same snapshot + later cancellation/JSON fixes                  | Prior unsandboxed `test:mcp` had load-timeout flakes; not re-run this increment | PARTIAL        |
| Evidence contract                                                   | `src/domain/evidence.ts` + later `bf115be` limits | Snapshot Evidence; publication-limit change absent             | Existing Evidence suite not re-run                                              | PARTIAL        |
| Hopper / Ghidra / IDA / Kuna                                        | BYO engines                                       | Same snapshot                                                  | Live engines not run. Hopper later commits `ec4a0a0`, `b1ff7cd` unported        | NOT TESTED     |
| JADX / apktool / Frida / Rizin / objdump                            | matching `src/*`                                  | Same snapshot                                                  | Live lanes not run                                                              | NOT TESTED     |
| ADB PNG header + dash-safe fixture                                  | `f7cd4e5`                                         | Ported; Ubuntu `dash` stub writes owned PNG bytes              | `pngHeader`, `AdbProvider`, `adbSelectedLocalPaths` (incl. dash)                | MATCHED        |
| ADB long-path push verify                                           | `1da304b`                                         | Absent                                                         | —                                                                               | MISSING        |
| BinarySession cancel during retirement                              | `3503578`                                         | Ported                                                         | `gdbRetirementCancellation.test.ts`                                             | MATCHED        |
| Native bookmark uncertainty                                         | `2b85a4a`                                         | Ported                                                         | `AnalysisContextQueries.test.ts`                                                | MATCHED        |
| Native dispatch format refusals                                     | `e3d8d20`                                         | Ported                                                         | `AppleDispatchMetadata.failure.test.ts`                                         | MATCHED        |
| Linux process-ownership on exit                                     | `01e00da`                                         | Ported                                                         | Linux live spawn skipped on Darwin                                              | MATCHED        |
| Browser source-map declaration uncertainty                          | `1ef5918`                                         | Ported                                                         | CDP / `webCaptureDiff` tests                                                    | MATCHED        |
| Mach-O per-slice encryption                                         | `860fdd8` `MachoEncryptionReader.ts`              | Absent                                                         | —                                                                               | MISSING        |
| Mach-O literal segment name BOMs                                    | `da5ec6b`                                         | Absent                                                         | —                                                                               | MISSING        |
| Mach-O target selection in macOS tools                              | `c0c3902`                                         | Absent                                                         | —                                                                               | MISSING        |
| Native bundle directories (appex/framework/XPC)                     | `37342ec`                                         | Absent                                                         | —                                                                               | MISSING        |
| .NET single-file bundle inspect/extract                             | `22cab82`                                         | Absent                                                         | —                                                                               | MISSING        |
| Bun standalone module graphs                                        | `8188497`                                         | Absent                                                         | —                                                                               | MISSING        |
| JS semantic-trace operator influence                                | `5c05eb8` breaking                                | Absent                                                         | —                                                                               | MISSING        |
| Undecodable symlink target bytes                                    | `34577eb`                                         | Absent                                                         | —                                                                               | MISSING        |
| CLI literal Markdown rendering                                      | `e124bdf`                                         | Absent                                                         | —                                                                               | MISSING        |
| Evidence storage publication limits                                 | `bf115be` breaking                                | Absent                                                         | —                                                                               | MISSING        |
| Debugger incomplete-cleanup typing                                  | `a108a1b`                                         | Absent                                                         | —                                                                               | MISSING        |
| Debugger shared GDB/Rizin caps as `REA_` settings                   | `4a8d8f7`                                         | Absent                                                         | —                                                                               | MISSING        |
| Environment write views (varied members, sorted creates)            | `131fbe0` `51ad845`                               | Absent                                                         | —                                                                               | MISSING        |
| Environment MIME uncertainty                                        | `72039ec`                                         | Absent                                                         | —                                                                               | MISSING        |
| CLI/MCP family-id registration                                      | `1c14f66`                                         | Snapshot registration                                          | Large contract refactor                                                         | MISSING        |
| Unified artifact format registry                                    | `5f9187c`                                         | Snapshot registry + fork FAT prefix                            | Large refactor                                                                  | PARTIAL        |
| Typed provider/admission/NativeAOT/Kuna codes                       | `b894be6` `317bf3f` `3b64713` `395b598`           | Snapshot codes                                                 | Breaking / large                                                                | MISSING        |
| Analysis-view inferred confidence                                   | `bfa082f`                                         | Snapshot                                                       | —                                                                               | MISSING        |
| Flattened framework Info.plist                                      | `6d19649`                                         | Absent                                                         | —                                                                               | MISSING        |
| Source-map empty `sourceRoot`                                       | `24398a8`                                         | Absent                                                         | —                                                                               | MISSING        |
| HAR browser-serialized request URLs                                 | `c5f50e8`                                         | Absent                                                         | —                                                                               | MISSING        |
| Electron IPC send ambiguity                                         | `81378ef`                                         | Absent                                                         | —                                                                               | MISSING        |
| FIT leading U+FEFF property strings                                 | `d77104d`                                         | Absent                                                         | —                                                                               | MISSING        |
| Apple XML plist decoder DOM charge                                  | `cce3314`                                         | Absent                                                         | —                                                                               | MISSING        |
| Desktop retained-row charging                                       | `0ce76e7`                                         | Absent                                                         | —                                                                               | MISSING        |
| JS self-defaulted receivers / member-effect index                   | `9d68aac` `a47dcca` `767f6af`                     | Absent                                                         | —                                                                               | MISSING        |
| Hopper caller reconcile / demo-dialog                               | `ec4a0a0` `b1ff7cd`                               | Absent                                                         | Needs Hopper                                                                    | MISSING        |
| Investigation projects                                              | Not upstream                                      | `src/application/investigationProject/`                        | Workflow + CLI tests                                                            | MATCHED        |
| Job lifecycle queued/running/completed/failed/interrupted/cancelled | Not upstream                                      | `INVESTIGATION_JOB_STATUSES`                                   | Workflow tests                                                                  | PARTIAL        |
| Reports Markdown + JSON                                             | Not upstream                                      | `ReportWriter.ts`                                              | Workflow tests                                                                  | PARTIAL        |
| Reports HTML/PDF/CSV/version-diff/timeline                          | Not upstream                                      | Absent                                                         | —                                                                               | MISSING        |
| Project import/export, backup/restore, versioning                   | Not upstream                                      | Absent                                                         | —                                                                               | MISSING        |
| Multi-hash targets, target compare, evidence graph                  | Not upstream                                      | SHA-256 + duplicate reuse only                                 | Workflow tests                                                                  | PARTIAL        |
| Optional `REA_AI_*`                                                 | External agent via MCP                            | `AiProvider.ts`                                                | Local HTTP tests                                                                | PARTIAL        |
| Independent npm / MCP identity                                      | Official `rea-agents`                             | Same identifiers; release proposal blocked off `morluto/rea`   | Authority unit test                                                             | NOT APPLICABLE |

## Artifact / provider matrix

| Artifact family                 | Implementation                                    | Prerequisites                | Status     |
| ------------------------------- | ------------------------------------------------- | ---------------------------- | ---------- |
| Native binaries / decompilation | Snapshot adapters + builtin-static project path   | Hopper / Ghidra / IDA / Kuna | PARTIAL    |
| JavaScript / Electron           | Snapshot adapters                                 | Optional browser / Electron  | PARTIAL    |
| .NET                            | Snapshot managed adapters; no single-file bundles | Optional                     | PARTIAL    |
| Android                         | Snapshot APK/DEX/JADX/ADB                         | JADX / ADB optional          | PARTIAL    |
| Firmware                        | Snapshot ESP/FIT/uImage readers                   | None for static readers      | PARTIAL    |
| Websites                        | Snapshot browser adapters                         | Playwright / browser         | PARTIAL    |
| Network captures                | Snapshot pcap adapters                            | None for static readers      | NOT TESTED |
| Runtime observation             | Frida / process / GDB                             | Explicit opt-in              | NOT TESTED |
| Packaged Python                 | Snapshot pyc inspector                            | None for static pyc          | NOT TESTED |
| Mach-O inspect                  | Snapshot `inspect_macho`; no slice encryption     | Host `lipo` / codesign       | PARTIAL    |
| Bun standalone                  | Upstream only                                     | None for static reader       | MISSING    |

## Counts (this matrix)

| Status         | Count |
| -------------- | ----- |
| MATCHED        | 7     |
| PARTIAL        | 16    |
| MISSING        | 32    |
| BROKEN         | 0     |
| NOT TESTED     | 5     |
| NOT APPLICABLE | 1     |

MISSING rose because upstream moved from 40 to 56 commits ahead, not because
previously MATCHED rows regressed. Phase 1 acceptance (“no relevant MISSING”)
is **not met**.

## Intentional differences

- Product README describes this GitHub repository, not rea.tools.
- Investigation CLI does not launch deep engines or the target.
- `analyze-project` records inferred next commands; it does not execute
  `inspect`, `analyze`, `decompile`, or objdump.
- Runtime identifiers stay `rea-agents` / `io.github.morluto/rea` until the
  owner chooses an independent distribution name.
- Official `rea-agents` release-please proposals are blocked unless
  `GITHUB_REPOSITORY` is `morluto/rea`.
- Website-only and skill-pause documentation commits are not copied.

## Six-category snapshot (not a win declaration)

| Category                    | Upstream                                      | This tree                                         | Result                                                 |
| --------------------------- | --------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| 1. Feature breadth          | 56 commits ahead; remaining artifact families | 8 investigation commands + `guidance`             | **Upstream ahead**                                     |
| 2. Specialized RE           | New Mach-O/Bun/.NET/JS/Apple/HAR/FIT work     | Snapshot + ADB/Zstd/CI fixes                      | **Upstream ahead**                                     |
| 3. Persistent investigation | None                                          | Projects, jobs, evidence files, resume            | **This tree ahead**                                    |
| 4. Report workflow          | Evidence export tools                         | JSON + Markdown only                              | **This tree ahead, incomplete**                        |
| 5. Release maturity         | Official package + provenance                 | Same identity; public-source docs; proposal guard | **Neither production-ready as an independent package** |
| 6. Test coverage            | 2872 test files; newer scenario tests         | 2830 files + investigation tests                  | **Upstream ahead on file count; quality not measured** |
