# Upstream parity

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

| Capability | Upstream | This tree | Difference / impact | Test | Status |
| --- | --- | --- | --- | --- | --- |
| CLI one-shot inspect/analyze/decompile | `src/cli.ts`, `src/cliCommandNames.ts` | Same snapshot | Investigation commands are additive | Investigation CLI tested; upstream family **NOT TESTED** this increment | PARTIAL |
| MCP tool catalog / stdio | `src/server/` | Same snapshot | Investigation-project commands are CLI-only | `npm run test:mcp` **not run** this increment | NOT TESTED |
| Evidence contract | `src/domain/evidence.ts` | Same | Unchanged | Existing Evidence suite **not re-run** | NOT TESTED |
| Hopper / Ghidra / IDA / Kuna | `src/hopper`, `src/ghidra`, `src/ida`, `src/kuna` | Same | BYO engines; missing path is reported | Live lanes **not run** | NOT TESTED |
| JADX / apktool / Frida / Rizin / objdump | matching `src/*` | Same | Optional | Live lanes **not run**; objdump seen available in earlier smoke | NOT TESTED |
| ADB PNG header check | `f7cd4e5` | `AdbProvider` + `pngHeader.ts` | Ported | `pngHeader.test.ts` 16 passed. `AdbProvider.test.ts` not run | PARTIAL |
| Guidance search | `c88e1b0` `GuidanceAccess.ts` | Absent | `rea guidance` missing | — | MISSING |
| Environment varied-member writes | `131fbe0` | Absent | Environment write views incomplete vs main | — | MISSING |
| BinarySession cancel during retirement | `3503578` | Older `BinarySession.ts` | Cancellation edge vs main | — | MISSING |
| Native bookmark uncertainty | `2b85a4a` | Older native | Bookmark unknowns may be dropped | — | MISSING |
| Native dispatch format refusals | `e3d8d20` | Older native | Format refusals may be lost | — | MISSING |
| Mach-O per-slice encryption | `860fdd8` | Absent `MachoEncryptionReader.ts` | `inspect_macho` lacks slice encryption | — | MISSING |
| Linux process-ownership on exit | `01e00da` | Older `ProcessOwnership.ts` | Exiting Linux ownership weaker vs main | — | MISSING |
| Environment sorted creates/toggles | `51ad845` | Absent | Environment write views incomplete vs main | — | MISSING |
| Browser source-map declaration uncertainty | `1ef5918` | Older browser code | Source-map unknowns may be dropped | — | MISSING |
| Skill pause-deadline docs | `bd37925` | Older skill docs | Doc only | — | NOT APPLICABLE |
| rea.tools website setup docs | `d3ecf68` | Product README is this repo | Intentional | — | NOT APPLICABLE |
| Investigation projects | Not upstream | `src/application/investigationProject/` | Fork-only | Workflow + CLI tests 47 passed | PASS |
| Duplicate target reuse | — | `addProjectTarget` | Fork-only | Workflow.test | PASS |
| Completed-job cache reuse | — | `findReusableCompletedJob` | Fork-only | Workflow.test | PASS |
| Stale-hash after import | — | `runInvestigationWorkflow` | Fork-only | Workflow safety test | PASS |
| Schema version refusal | — | `parseInvestigationProject` | Fork-only | investigationProject.test | PASS |
| Optional `REA_AI_*` | External agent via MCP upstream | `AiProvider.ts` | Host-only disclosure; live HTTP untested | Spend-limit unit test | PARTIAL |
| Package name `rea-agents` | Official npm | Same runtime name | README says not official publication | Collision check (npm 6.8.0 taken) | NOT APPLICABLE |
| JS / Electron / .NET / Android / firmware / web / pcap / process / Python | Upstream adapters in `src/` | Same snapshot | Prerequisites optional | Real lanes **not run** | NOT TESTED |

## Counts (this matrix)

| Status | Count |
| --- | --- |
| PASS | 5 |
| PARTIAL | 3 |
| MISSING | 9 |
| BROKEN | 0 |
| NOT TESTED | 5 |
| NOT APPLICABLE | 3 |

Do not read these counts as “this fork is better than upstream.” The PASS rows
are mostly fork-only investigation features. Upstream `main` still has nine
unported functional commits after the ADB PNG port.

## Intentional differences

- Product README describes this GitHub repository, not rea.tools.
- Investigation CLI does not launch deep engines or the target.
- Runtime identifiers stay `rea-agents` / `io.github.morluto/rea` until the
  owner chooses an independent distribution name.
