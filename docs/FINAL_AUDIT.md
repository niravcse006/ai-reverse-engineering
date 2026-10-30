# Final audit

Date: 2026-10-30.
Workspace: `/Users/niravsoni/Projects/rea`.
Repository: https://github.com/niravcse006/ai-reverse-engineering
HEAD at start of this increment: `6b769aabe56851923633be18ea6acd7f9a3f3d6f`
(matched `origin/main`; this increment is uncommitted).

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
| Local / GitHub `main` at start | `6b769aabe56851923633be18ea6acd7f9a3f3d6f`                             |
| Compatible upstream release    | rea-agents **6.8.0** `160d821ac9a0310afcb8d1fc427862dd6508add5`        |
| Imported snapshot              | `17ceb77ca5f2632faab8de01da4babff680eac48`                             |
| Previous pinned upstream tip   | `34577eb1cc264000a176ded68e5ebf8aba430edd` (ahead 17)                  |
| Upstream `main` this increment | `317bf3fe235e655b2d752d3be261cc0da7d00f2b` (ahead 40)                  |
| Node used                      | v22.23.4 Darwin arm64 (`.nvmrc` 24.22.1 is not installed)              |
| Identity                       | `rea-agents`, `io.github.morluto/rea` — **not renamed, not published** |

`npm run upstream:drift` compared GitHub `17ceb77...main` and does not merge.

## 2. Defects fixed this increment

| Defect                                                         | Files                                                | Tests                                                                                |
| -------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `listInvestigationJobs` skipped unreadable job files           | `ProjectStore.ts`, `investigationProjectCommands.ts` | Workflow + CLI investigation tests (15 passed). `unreadable_jobs` uses `userMessage` |
| README rewrite dropped required MCP catalog / agent fact links | `README.md`                                          | `docs:check` + 9 readme-consistency tests                                            |

Prior increment (already on `6b769aa`): JSON-cancellation unwrap, BinarySession
retirement cancel, Linux ownership corroboration, browser source-map
uncertainty. Those remain in the tree and were not rewritten.

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
| Test files  | **4 failed / 244 passed / 2 skipped** (250)                    |
| Tests       | **5 failed / 1612 passed / 13 skipped** (1630)                 |
| Duration    | 1758.23 s (vitest); wall ~1766.9 s including pretest compile   |
| Skipped     | `firmwareMcp.test.ts` (1), `javascriptRecoveryMcp.test.ts` (3) |

The previous product defect, `bundleComparisonCancellation`, **passed** in this
full re-run (432 ms). The five failures this run:

| File / test                                         | Classification                          | Evidence                                                            | Focused retest            |
| --------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- | ------------------------- |
| `artifactMcp.inlineInventory` full + compact        | **2. Environment / suite-load timeout** | Vitest 30s timeout. Same cases took 12.6s and 11.4s focused         | **4 passed** in that file |
| `nativeInventoryViewsMcp` complete/summary identity | **2. Environment / suite-load timeout** | Vitest 30s timeout during `connectGhidraMcp`. Focused: 10.0s        | **4 passed** in that file |
| `webBundleViewsMcp` evidence-file paging            | **2. Environment / suite-load timeout** | Vitest 30s timeout. Focused: 10.0s                                  | **2 passed** in that file |
| `contractPresentation` reversed catalog             | **2. Environment / suite-load**         | Child `execFile` failed under the 20s fixture budget. Focused: 8.5s | **1 passed**              |

Focused command (exit 0): 4 files, **11 passed**, 38.46 s.

Do not treat the full suite as green. Timeouts were not weakened to force a
pass. No new product defect was confirmed after focused reproduction.

The +7 test count versus the prior 1623-test run is
`gdbRetirementCancellation.test.ts`, which passed in this full run.

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

| Command                                                    | Exit                             | Result                                                                                           |
| ---------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `npm run test:local --` Workflow + cliInvestigationProject | 0                                | 15 passed after unreadable-job reason fix                                                        |
| `npm run check:fast`                                       | 0                                | typecheck + lint                                                                                 |
| `npm run docs:check`                                       | 0 after README fact-link restore | generated-doc validation + 9 readme-consistency tests                                            |
| `npm audit --omit=dev`                                     | 0                                | 0 production vulnerabilities                                                                     |
| `npm pack --dry-run`                                       | 0                                | `rea-agents-6.8.0.tgz` (husky could not write `.git/config` in the sandbox; pack still listed)   |
| `npm pack --pack-destination /tmp/rea-pack-verify-*`       | 0                                | 11.4 MB, 2626 files, shasum `167662072efdb328edc5141b90e9341f0738edb8`                           |
| Clean `npm install` of that tarball                        | 0                                | 176 packages                                                                                     |
| Packed `rea --help`                                        | 0                                | CLI banner `rea@6.8.0`                                                                           |
| Packed `rea mcp doctor --json`                             | 0                                | healthy; 231 tools; 6 prompts                                                                    |
| Checkout `rea --help` / `rea mcp --help`                   | 0                                | Investigation commands listed                                                                    |
| Checkout `rea mcp doctor --json`                           | 0                                | healthy; 231 tools                                                                               |
| Checkout stdio `initialize`                                | 0                                | `rea@6.8.0`                                                                                      |
| Investigation smoke (`/usr/bin/true`)                      | 0                                | init → import → inspect → analyze → report → status; evidence mode `0600`; `unreadable_jobs: []` |
| `npm run test:mcp` (unsandboxed)                           | 1                                | 5 failed / 1612 passed / 13 skipped; prior JSON-cancel case passed                               |
| `npm run test:focused --` the four failing MCP files       | 0                                | 11 passed                                                                                        |
| `npm test`                                                 | —                                | **NOT RUN**                                                                                      |
| `npm run check:pr`                                         | —                                | **NOT RUN** (complete local gate)                                                                |
| `npm run verify:package`                                   | 0                                | CLI/MCP/skill/setup checks; 231 tools; 6 prompts. Still advertises `npx -y rea-agents@6.8.0 mcp` |
| Live Ghidra / Hopper / IDA / JADX / Frida / external AI    | —                                | **NOT RUN**                                                                                      |

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
  traces, .NET single-file bundles, CLI Markdown literals, undecodable
  symlink targets, evidence publication limits, debugger cleanup typing, and
  Bun standalone graphs remain unported.
- Full `npm run test:mcp` still exits 1 under load (30s timeouts). A quiet
  machine re-run would be needed before claiming a green suite.
- `npm test` and `check:pr` remain outstanding.
- Owner decision before any package rename or publish.

## 9. Conclusion

Public GitHub source materials (README, attribution, security reporting,
investigation listing honesty) are in this working tree. The previous
JSON-cancellation product defect passed in the full MCP re-run. Five
full-suite failures reproduced as load timeouts and passed focused.
Upstream feature completeness is **not** achieved. The project is **not**
production-ready and must not be published as `rea-agents`.

Release recommendation: **READY FOR PUBLIC GITHUB SOURCE**. Not ready for
community-testing claims that require a green full MCP suite, beta packaging,
npm publication, or production use.
