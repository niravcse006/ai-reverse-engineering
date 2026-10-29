# Final audit

Date: 2026-10-29.
Workspace: `/Users/niravsoni/Projects/rea`.
Repository: https://github.com/niravcse006/ai-reverse-engineering
HEAD at start of this increment: `90a56fcd63ca3576679a173bb9fc58ea36b08200`
(matched `origin/main`, clean tree).

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
| Local / GitHub `main` at start | `90a56fcd63ca3576679a173bb9fc58ea36b08200`                             |
| Compatible upstream release    | rea-agents **6.8.0** `160d821ac9a0310afcb8d1fc427862dd6508add5`        |
| Imported snapshot              | `17ceb77ca5f2632faab8de01da4babff680eac48`                             |
| Previous pinned upstream tip   | `1ef5918179d3cb77b8868bd117de662cbd7099ab` (ahead 12)                  |
| Upstream `main` this increment | `34577eb1cc264000a176ded68e5ebf8aba430edd` (ahead 17)                  |
| Node used                      | v22.23.4 Darwin arm64 (`.nvmrc` 24.22.1 is not installed)              |
| Identity                       | `rea-agents`, `io.github.morluto/rea` — **not renamed, not published** |

`npm run upstream:drift` compared GitHub `17ceb77...main` and does not merge.

## 2. Defects fixed this increment

| Defect                                                                                       | Files                                                                                      | Tests                                                                                         |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Cancelled oversized JSON / Evidence-bundle reads were reported as `EvidenceFileError` (`io`) | `JsonFiles.ts`                                                                             | `bundleComparisonCancellation.test.ts`, oversized-read cases in `evidenceBundleFiles.test.ts` |
| BinarySession mutation retirement dropped later cancellation                                 | `BinarySession.ts`, `BinarySessionPort.ts`, `externalMutationAdmission.ts`, Rizin register | `gdbRetirementCancellation.test.ts` (7), new BinarySession composition cases                  |
| Linux token-open ENOENT/ESRCH races could lose ownership corroboration                       | `ProcessOwnership.ts`, `ProcessOwnershipObservation.ts`, `ProcessRunTokenObservations.ts`  | `ProcessOwnership.nativeExit.test.ts` + exit-scope (135 passed, 2 Linux-only skipped)         |
| Browser source-map declaration uncertainty was dropped from capture diffs                    | `CdpCaptureEventHandlers.ts`, `webCaptureDiff.ts`                                          | `cdpCaptureScriptMetadata.test.ts`, `webCaptureDiff.test.ts`, `browserCli.test.ts`            |

Cache invalidation, AI environment pass-through, and FAT-prefix classification
from the previous increment remain in the tree and were not rewritten.

## 3. MCP classification (Priority 1)

Full unsandboxed command:

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.4/bin:/usr/local/bin:$PATH"
npm run test:mcp
```

| Item        | Value                                                          |
| ----------- | -------------------------------------------------------------- |
| Environment | Unrestricted local machine, not the agent sandbox              |
| Node / OS   | v22.23.4 Darwin arm64                                          |
| Exit code   | **1**                                                          |
| Test files  | **1 failed / 246 passed / 2 skipped** (249)                    |
| Tests       | **1 failed / 1609 passed / 13 skipped** (1623)                 |
| Duration    | 1074.83 s (vitest); wall ~1218.9 s including pretest compile   |
| Skipped     | `firmwareMcp.test.ts` (1), `javascriptRecoveryMcp.test.ts` (3) |

The single failure, classified from the stack and a focused reproduction:

| File / test                                                                              | Classification                  | Evidence                                                                                                                                    | Outcome this increment                                         |
| ---------------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `bundleComparisonCancellation.test.ts` — leaves the session unchanged after cancellation | **1. Confirmed product defect** | Expected `AnalysisCancelledError`; received `EvidenceFileError` (`io`) whose cause was `AbortError` wrapping `JsonInputCancellationFailure` | Fixed in `JsonFiles.ts`. Focused retest: **1 passed** (109 ms) |

Not classified as environmental: the test spawned no restricted helper, ran
unsandboxed in 30 ms, and reproduced as a typed-error mismatch.

Files that previously failed in the sandbox and passed in this full unsandboxed
run include Ghidra reopen, Rizin pending output and output preservation, pcap
allocation, Frida MCP, Flutter MCP, environment serve writes, native Mach-O
summary, and the earlier 8-file focused set. Those prior sandbox failures are
**environment / sandbox**, not product defects.

**Confirmed product defects remaining in the full MCP suite:** none observed
after the focused retest of the one failure. The full suite was **not**
re-run after that fix. Do not treat the suite as green.

## 4. Upstream ports (Priority 3 / 4)

Inspected actual GitHub patches against `34577eb`, then ported the smallest
coherent behavior.

| Commit    | Feature                                       | Status this increment                                      |
| --------- | --------------------------------------------- | ---------------------------------------------------------- |
| `3503578` | BinarySession cancellation during retirement  | **Ported and tested**                                      |
| `01e00da` | Linux exiting-process ownership corroboration | **Ported and tested** (live Linux spawn skipped on Darwin) |
| `1ef5918` | Browser source-map declaration uncertainty    | **Ported and tested**                                      |
| `131fbe0` | Environment varied-member writes              | **Not ported** (24 files, +1474). Too large for this pass  |
| `51ad845` | Environment sorted creates / toggles          | **Not ported** (25 files)                                  |
| `860fdd8` | Mach-O per-slice encryption                   | **Not ported** (27 files, includes load-command refactor)  |
| `c88e1b0` | Guidance search                               | **Not ported** (33 files, +2117)                           |

New commits after the previous pinned tip `1ef5918`, inspected but not ported:

| Commit    | Subject                                      | Classification                         |
| --------- | -------------------------------------------- | -------------------------------------- |
| `6fa48f2` | APK signer-agreement docs                    | Not applicable (docs / test assertion) |
| `5c05eb8` | JavaScript semantic-trace operator influence | Missing (breaking, 24 files)           |
| `22cab82` | .NET single-file bundle inspect/extract      | Missing (new capability, 27 files)     |
| `e124bdf` | CLI literal Markdown rendering               | Missing (small, not taken this pass)   |
| `34577eb` | Undecodable symlink target bytes             | Missing (safety, 16 files)             |

Investigation-project workflow and public interfaces were not renamed.

## 5. AI outbound verification (Priority 5)

Controlled **127.0.0.1** HTTP server + injected `fetch`. No external provider
and no confidential binaries. Re-ran this increment:

`npm run test:local -- src/domain/aiProviderContract.test.ts src/application/investigationProject/AiProvider.test.ts` — exit 0, **8 passed**.

| Check                     | Result                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Provider `none`           | No HTTP                                                                                          |
| Enabled openai-compatible | POST findings JSON + untrusted wrapper; `Authorization: Bearer` header; key **absent** from body |
| AI endpoint failure       | Job stays **completed**; `optional_ai` failed; findings preserved                                |
| Disable                   | Leave `REA_AI_PROVIDER` unset/`none`, or `REA_AI_SPENDING_LIMIT_USD=0`                           |

## 6. Commands run this increment

| Command                                                                                        | Exit | Result                                                            |
| ---------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------- |
| `npm run upstream:drift`                                                                       | 0    | Tip `34577eb`, ahead 17                                           |
| `npm run test:mcp` (unsandboxed)                                                               | 1    | 1 failed / 1609 passed / 13 skipped                               |
| `npm run test:focused --` bundleComparisonCancellation + evidenceBundleFiles + gdb + browser   | 0    | 5 files, **100 passed** (includes the previous MCP failure)       |
| `npm run test:focused -- tests/boundary/cli/browserCli.test.ts`                                | 0    | 14 passed, including source-map omission CLI                      |
| `npm run test:local --` BinarySession + restoration/status/liveness                            | 0    | 4 files, **82 passed**                                            |
| `npm run test:local --` ProcessOwnership nativeExit/exitScope/test/exiting/validation/identity | 0    | 6 files, **135 passed / 2 skipped**                               |
| `npm run test:local --` AiProvider + aiProviderContract                                        | 0    | 2 files, **8 passed**                                             |
| `npm run check:fast`                                                                           | 0    | typecheck + lint                                                  |
| `npm run docs:check`                                                                           | 0    | generated-doc validation + 9 readme-consistency tests             |
| `npm audit --omit=dev`                                                                         | 0    | 0 production vulnerabilities                                      |
| `npm pack --dry-run`                                                                           | 0    | `rea-agents-6.8.0.tgz` listed                                     |
| `npm test`                                                                                     | —    | **NOT RUN**                                                       |
| `npm run check:pr`                                                                             | —    | **NOT RUN** (complete local gate)                                 |
| `npm run verify:package`                                                                       | —    | **NOT RUN** this increment. Previous increment passed unsandboxed |
| Clean temporary install of the packed tarball                                                  | —    | **NOT RUN**                                                       |
| Live Ghidra / Hopper / IDA / JADX / Frida / external AI                                        | —    | **NOT RUN**                                                       |

## 7. Package identity and distribution

The package still identifies itself as `rea-agents` with MCP identity
`io.github.morluto/rea`. Those names belong to upstream. Publishing this fork
under them would impersonate the official release.

No rename was applied. Proposed independent identifiers for owner approval
(not implemented):

- npm package: `ai-reverse-engineering` or `@niravcse006/rea`
- MCP identity: `io.github.niravcse006/ai-reverse-engineering`

Do not publish until the owner chooses names and the package metadata is
changed. Homepage/bugs already point at
https://github.com/niravcse006/ai-reverse-engineering.

## 8. Remaining work

- Guidance, environment write views, Mach-O encryption, JavaScript semantic
  traces, .NET single-file bundles, CLI Markdown literals, and undecodable
  symlink targets remain unported.
- Re-run full unsandboxed `npm run test:mcp` after the JSON-cancellation fix
  if a green-suite claim is needed.
- `npm test`, `check:pr`, and a clean packed-install smoke remain outstanding.
- Owner decision before any package rename or publish.

## 9. Conclusion

Three previously missing `main` behaviors are now in this tree with tests.
The full unsandboxed MCP suite found one product defect; that defect is fixed
and retested, but the suite was not re-run. Upstream feature completeness is
**not** achieved. The project is **not** production-ready.

Release recommendation: **local development**. Broader beta testing would
still require a post-fix full MCP re-run plus `check:pr`. Not for production
release.
