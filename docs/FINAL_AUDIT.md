# Final audit

Date: 2026-10-29.
Workspace: `/Users/niravsoni/Projects/rea`.
Repository: https://github.com/niravcse006/ai-reverse-engineering
HEAD at start of this increment: `4c06200` (matched `origin/main`, clean tree).

This is the authoritative current-state summary. Historical reports:
[FINAL_IMPLEMENTATION_REPORT.md](FINAL_IMPLEMENTATION_REPORT.md),
[REPOSITORY_ASSESSMENT.md](REPOSITORY_ASSESSMENT.md),
[FEATURE_COMPARISON.md](FEATURE_COMPARISON.md),
[FEATURE_PARITY.md](FEATURE_PARITY.md),
[UPSTREAM_COMPARISON.md](UPSTREAM_COMPARISON.md).

This report distinguishes **code changes made here** from **checks that only
ran**. It does not claim complete upstream parity or production readiness.

## 1. Baseline

| Item                           | Value                                                                  |
| ------------------------------ | ---------------------------------------------------------------------- |
| Local / GitHub `main` at start | `4c06200`                                                              |
| Compatible upstream release    | rea-agents **6.8.0** `160d821ac9a0310afcb8d1fc427862dd6508add5`        |
| Imported snapshot              | `17ceb77ca5f2632faab8de01da4babff680eac48`                             |
| Upstream `main` last recorded  | `1ef5918179d3cb77b8868bd117de662cbd7099ab` (ahead 12)                  |
| Node used                      | v22.23.4 (`.nvmrc` 24.22.1 not installed)                              |
| Identity                       | `rea-agents`, `io.github.morluto/rea` — **not renamed, not published** |

## 2. Defects fixed this increment

| Defect                                                                                                     | Files                                                       | Tests                                                                   |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| Completed jobs reused after detector/format change (`unknown` vs `mach-o-universal`)                       | `investigationProject.ts`, `ProjectStore.ts`, `Workflow.ts` | `investigationProject.test.ts`, `Workflow.test.ts` cache-identity cases |
| `analyze-project` AI used `process.env` for the API key after `aiProviderStatus` read a caller environment | `Workflow.ts`                                               | `AiProvider.test.ts` local HTTP + failure path                          |
| FAT prefix already classified as `mach-o-universal` (prior increment)                                      | `formatRegistry.ts`                                         | still passing                                                           |

Cache identity now includes `det=<INVESTIGATION_DETECTOR_VERSION>` and
`fmt=<detected format>`. Older keys such as
`sha256\|1.0.0\|auto\|dyn=0\|ai=0\|` do not match. Reuse also requires the
stored `ev_format` title to match the live detector. Unchanged inputs still
reuse. Existing projects invalidate safely by key mismatch.

## 3. MCP classification (Priority 1)

Sandboxed `npm run test:mcp` from the previous increment: exit **1**,
**41 failed / 205 passed / 3 skipped** files, **139 failed / 1470 passed /
14 skipped** tests. Diagnostics included `spawn EPERM` and Rizin
`posix_spawnp`.

This increment re-ran **8 files / 72 tests** with `npm run test:focused`
**outside the agent sandbox**. Exit **0**. All 72 passed, including files
that failed in the sandbox:

| File                                     | Prior sandboxed result     | Unsandboxed result | Category              |
| ---------------------------------------- | -------------------------- | ------------------ | --------------------- |
| `pcapWorkspaceAllocation.test.ts`        | 10 failed                  | 10 passed          | Environment / sandbox |
| `sourceToBundleViewsMcp.test.ts`         | 2 failed                   | 2 passed           | Environment / sandbox |
| `nativeMachoSummaryMcp.test.ts`          | 3 failed                   | 4 passed           | Environment / sandbox |
| `rizinPendingOutput.test.ts`             | 21 failed (`posix_spawnp`) | 21 passed          | Environment / sandbox |
| `applicationMutationPresenceMcp.test.ts` | 14 failed                  | 14 passed          | Environment / sandbox |
| `analyzeFunctionDetail.test.ts`          | 1 failed                   | 9 passed           | Environment / sandbox |
| `decompileAllCaveats.test.ts`            | 5 failed                   | 5 passed           | Environment / sandbox |
| `addressContextBookmarks.test.ts`        | 7 passed                   | 7 passed           | Confirmed pass        |

**Confirmed product defects from the MCP suite:** none in the retested set.
**Test defects:** none confirmed.
**Environment / sandbox:** the 7 previously failing files above.
**Missing dependency / platform:** not established for the retested set.
**Undetermined:** the other previously failing files (Frida, Electron, browser,
Ghidra reopen, Rizin output preservation, deferred runtime, snapshot replay,
and others) were **not** re-run this increment.

Full `npm run test:mcp` was **not** re-run unsandboxed here. Do not treat the
sandboxed 139 failures as product defects, and do not treat the full suite as
passing.

## 4. Upstream ports (Priority 3)

No additional `main` commits were ported this increment. Still **MISSING**:
guidance `c88e1b0`, environment writes `131fbe0` / `51ad845`, BinarySession
cancel `3503578`, Mach-O encryption `860fdd8`, Linux process-ownership
`01e00da`, browser source-map `1ef5918`. Those remain the next reviewable
ports.

## 5. AI outbound verification (Priority 4)

Controlled **127.0.0.1** HTTP server + injected `fetch`. No external provider
and no confidential binaries.

| Check                     | Result                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Provider `none`           | No HTTP                                                                                          |
| Enabled openai-compatible | POST findings JSON + untrusted wrapper; `Authorization: Bearer` header; key **absent** from body |
| AI endpoint failure       | Job stays **completed**; `optional_ai` failed; findings preserved                                |
| Disable                   | Leave `REA_AI_PROVIDER` unset/`none`, or `REA_AI_SPENDING_LIMIT_USD=0`                           |

## 6. Commands run this increment

| Command                                                              | Exit                                          |
| -------------------------------------------------------------------- | --------------------------------------------- |
| `npm run test:local --` investigationProject + Workflow + AiProvider | 0 (19 tests)                                  |
| `npm run test:focused --` 8 MCP files listed above                   | 0 (72 tests)                                  |
| `npm run check:fast`                                                 | 0 after splitting the cache-identity describe |
| `npm audit --omit=dev`                                               | 0 (0 production vulnerabilities)              |
| `npm run docs:check`                                                 | 0                                             |
| `npm run verify:package`                                             | 0 (unsandboxed; sandbox `spawn EPERM` first)  |
| `npm test` / `check:pr` / full `test:mcp`                            | **not run**                                   |

## 7. Remaining work

- Unsandboxed full `npm run test:mcp`.
- Incremental ports of the six `main` commits above, starting with
  BinarySession cancellation and Linux process-ownership.
- `npm test` and `check:pr`.
- Owner decision before any package rename or publish.

## 8. Conclusion

Cache invalidation and AI environment pass-through are fixed and tested. MCP
failures that were retested unsandboxed passed and are classified as sandbox
limitations. Upstream feature completeness is **not** achieved. The project is
**not** production-ready.

Release recommendation: **local development**. Broader testing needs an
unsandboxed full MCP run. Not for production release.
