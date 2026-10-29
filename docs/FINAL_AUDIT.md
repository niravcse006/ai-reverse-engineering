# Final audit

Date: 2026-10-29.
Workspace: `/Users/niravsoni/Projects/rea`.
Repository: https://github.com/niravcse006/ai-reverse-engineering
HEAD at start of this increment: `b4294d0` (matched `origin/main`, clean tree).

This is the authoritative current-state summary. Historical reports:
[FINAL_IMPLEMENTATION_REPORT.md](FINAL_IMPLEMENTATION_REPORT.md),
[REPOSITORY_ASSESSMENT.md](REPOSITORY_ASSESSMENT.md),
[FEATURE_COMPARISON.md](FEATURE_COMPARISON.md),
[FEATURE_PARITY.md](FEATURE_PARITY.md),
[UPSTREAM_COMPARISON.md](UPSTREAM_COMPARISON.md).

This report distinguishes **code changes made here** from **checks that only
ran**. It does not claim complete upstream parity or production readiness.

## 1. Baseline

| Item | Value |
| --- | --- |
| Local / GitHub `main` at start | `b4294d0` |
| Compatible upstream release | rea-agents **6.8.0** `160d821ac9a0310afcb8d1fc427862dd6508add5` |
| Imported snapshot | `17ceb77ca5f2632faab8de01da4babff680eac48` |
| Upstream `main` recorded | `1ef5918179d3cb77b8868bd117de662cbd7099ab` (`npm run upstream:drift`, ahead 12) |
| Node used | v22.23.4 (`.nvmrc` 24.22.1 not installed) |
| Identity | `rea-agents`, `io.github.morluto/rea`, bins `rea` / `rea-agents` — **not renamed** |

Custom layer: `src/domain/investigationProject.ts`, `investigationReport.ts`,
`aiProviderContract.ts`, `formatRegistry.ts` (investigation registry),
`src/application/investigationProject/*`, `src/cli/investigationProjectCommands.ts`.
Everything else is the REA 6.8.0 snapshot plus local ports (ADB PNG, bookmark
uncertainty, dispatch format refusals).

## 2. Verified and passing

- Native bookmark uncertainty + investigation remaining-workflow source tests:
  **4 files, 48 passed** (`Workflow`, `RemainingWorkflows`,
  `AnalysisContextQueries`, `AppleDispatchMetadata.failure`).
- Format-registry FAT prefix + remaining-workflow tests: **3 files, 23 passed**.
- Focused compiled tests: `addressContextBookmarks` + `nativeDispatchFormatFailures`
  **14 passed**.
- `npm run check:fast`: typecheck + lint **passed** (run after the FAT change).
- `npm audit --omit=dev`: **0** production vulnerabilities, exit 0.
- Real provider: `rea inspect-macho /usr/bin/true` exit 0 (`native-macos`,
  `mach-o-universal`, selected `arm64e`, evidence id returned).
- CLI investigation: init → import `/usr/bin/true` → analyze-project completed
  with `ev_format` (derived), `ev_strings` (observed), `ev_next_commands`
  (inferred: `inspect-macho`, `inspect-native-exports`, `inspect-with-objdump`).
- Schema version 2 refused with an actionable message (prior increment).
- Stale target bytes after import refused (prior increment).
- Evidence files written under `evidence/*.json` with finding provenance.
- Reports list remaining existing CLI commands; ELF analyze writes inferred
  `ev_next_commands` naming `inspect-elf-notes` without launching it.
- `analyze-project` does not execute the target or launch Frida.

## 3. Fixed and regression-tested this increment

| Change | Tests |
| --- | --- |
| Bookmark address comparison keeps unmatched/unparseable identities unavailable | `AnalysisContextQueries.test.ts` |
| Misaligned ObjC/Swift sections and unsupported big-endian CPU become `BinaryFormatFailure` → `AnalysisUnsupportedTargetError` | `AppleDispatchMetadata.failure.test.ts`; added `nativeDispatchFormatFailures.test.ts` |
| Remaining workflows name existing inspectors (`inspect-elf-notes`, `inspect-macho`, `inspect-with-objdump`, …) | `RemainingWorkflows.test.ts` |
| Analyze persists inferred next `rea …` commands as `ev_next_commands` | `Workflow.test.ts` |
| FAT slices outside the 8 KiB probe classify as `mach-o-universal` and name `inspect-macho` | `formatRegistry.test.ts`; CLI import of `/usr/bin/true` |
| Investigation evidence files (prior increment, still passing) | `Workflow.test.ts` |

## 4. Partially implemented

- Optional `REA_AI_*`: unit refusals only; no live HTTP.
- ADB PNG helper tests passed earlier; provider test not re-run.
- CLI investigation commands exist; they are **not** MCP tools.
- Builtin-static `analyze-project`; deep engines remain separate commands.
- Native bookmark/dispatch ports are source-tested. Focused MCP/provider
  files were added but not completed in a green `test:mcp` run.

## 5. Tested and not green

`npm run test:mcp` completed on this checkout. Exit **1**.
`vitest --project mcp-boundary`: **41 failed / 205 passed / 3 skipped** files
(249); **139 failed / 1470 passed / 14 skipped** tests (1623); 1876.50s.
`addressContextBookmarks.test.ts` **7 passed**. Observed failing files include:

- `fridaLifecycleMcp.test.ts` (2)
- `electronMcp.test.ts` (4)
- `browserMcp.test.ts` (4)
- `deferredRuntime.test.ts` (2)
- `workflowSnapshotReplayMcp.test.ts` (1)
- `rizinPendingOutput.test.ts` (21)
- `nativeMachoSummaryMcp.test.ts` (3)
- `javascriptFactsViewMcp.test.ts` (1)
- `javascriptAnalysisResources.test.ts` (1)
- `ghidraReopen.test.ts` (3)
- `sourceToBundleViewsMcp.test.ts` (2)
- `analyzeFunctionDetail.test.ts` (1)
- `applicationMutationPresenceMcp.test.ts` (14)
- `decompileAllCaveats.test.ts` (5)
- `pcapWorkspaceAllocation.test.ts` (10)
- `rizinOutputPreservation.test.ts` (17)
- `androidLateCompletionMcp.test.ts` (1)

These failures were **not** hidden or weakened. Repeated diagnostics include
`process table could not be inspected: spawn EPERM` (agent sandbox) and
`posix_spawnp failed` in the Rizin PTY helper. They are not claimed as
investigation-layer regressions. See [testing.md](testing.md).

A parallel CLI smoke after `pretest:mcp` failed with
`Cannot find module '…/dist/cli-runtime/cliResultOutput.js'` because compile
cleaned `dist/` mid-run.

## 6. Not tested this increment

- `npm test`, `npm run check:pr`, `npm run docs:check`, `npm run verify:package`
- Real Ghidra / Hopper / IDA / Kuna / JADX / Frida / browser / ADB device
- Live AI HTTP
- Clean-install from a packed tarball

## 7. Blocked / owner decision

- Independent npm/MCP rename: `rea-agents` is taken. **No rename and no
  publish** until the owner chooses personal-fork vs compatible names vs
  independent product.
- Seven remaining `main` functional commits (guidance, environment writes,
  BinarySession cancel, Mach-O encryption, Linux process ownership,
  environment sorted writes, browser source-map) were not ported. They are
  large or need their own merge review.
- Live AI needs an endpoint and key the owner controls.

## 8. Deliberately excluded

- Copying all of upstream `main` over this tree.
- Launching the target or Frida from `analyze-project`.
- Loading third-party plugin JavaScript.
- Claiming this fork is better than `morluto/rea`.
- Publishing the package.

## 9. Remaining security risks

See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) S7–S10 and S14. Highest practical
risks: optional AI exfiltrates findings when enabled; publishing as
`rea-agents`; unported session-cancellation / process-ownership vs `main`.

## 10. Runtime commands (this increment)

| Command | Exit |
| --- | --- |
| `npm run test:local --` (4 files listed above) | 0 (48 tests) |
| `npm run test:local --` formatRegistry + RemainingWorkflows + Workflow | 0 (23 tests) |
| `npm run test:focused --` bookmark + dispatch files | 0 (14 tests) |
| `npm run check:fast` | 0 |
| `npm audit --omit=dev` | 0 |
| `npm run test:mcp` | 1 (41 files failed / 205 passed) |
| `npm run build:cached` | 0 |
| CLI investigation smoke (fresh project, `/usr/bin/true`) | 0; format `mach-o-universal` |
| `rea inspect-macho /usr/bin/true` | 0 |
| `npm pack --dry-run` | 0; listed `rea-agents-6.8.0.tgz` |
| `npm test` / `check:pr` / `verify:package` / `docs:check` | **not run** |

## 11. Files changed (this increment)

Production:

- `src/application/AnalysisContextQueries.ts`
- `src/application/investigationProject/Workflow.ts`
- `src/application/investigationProject/ProjectStore.ts`
- `src/application/investigationProject/RemainingWorkflows.ts`
- `src/domain/formatRegistry.ts`
- `src/native/AppleDispatchMetadata.ts`
- `src/native/AppleMachoSelection.ts`
- `src/native/AppleObjcCategories.ts`
- `src/native/AppleObjcDispatchFacets.ts`
- `src/native/AppleSwiftDispatchFacets.ts`

Tests:

- `src/application/AnalysisContextQueries.test.ts`
- `src/application/investigationProject/Workflow.test.ts`
- `src/application/investigationProject/RemainingWorkflows.test.ts`
- `src/domain/formatRegistry.test.ts`
- `src/native/AppleDispatchMetadata.failure.test.ts`
- `tests/boundary/mcp/addressContextBookmarks.test.ts` (added)
- `tests/boundary/providers/native/nativeDispatchFormatFailures.test.ts` (added)

Docs:

- `docs/UPSTREAM_PARITY.md`, `docs/SECURITY_AUDIT.md`, `docs/FINAL_AUDIT.md`,
  `docs/testing.md`
- Historical banners on comparison/assessment reports

## 12. Conclusion

The investigation lifecycle now persists evidence, refuses stale hashes, and
names existing analysis commands without launching them. Two small native
ports from upstream `main` are source-tested. Upstream feature completeness
is **not** achieved. `test:mcp` is **not** green. The project is **not**
production-ready for an independent npm release.

Release recommendation: **development / local testing only**.
