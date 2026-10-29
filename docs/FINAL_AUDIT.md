# Final audit

Date: 2026-10-29.
Workspace: `/Users/niravsoni/Projects/rea`.
Repository: https://github.com/niravcse006/ai-reverse-engineering
HEAD at start of this increment: `b612da9` (matched `origin/main`, clean tree).

This report distinguishes **code changes made here** from **checks that only
ran**. It does not claim complete upstream parity or production readiness.

## 1. Baseline

| Item | Value |
| --- | --- |
| Local / GitHub `main` at start | `b612da9` |
| Compatible upstream release | rea-agents **6.8.0** `160d821ac9a0310afcb8d1fc427862dd6508add5` |
| Imported snapshot | `17ceb77ca5f2632faab8de01da4babff680eac48` |
| Upstream `main` recorded | `1ef5918179d3cb77b8868bd117de662cbd7099ab` (`npm run upstream:drift`, ahead 12) |
| Node used | v22.23.4 (`.nvmrc` 24.22.1 not installed) |
| Identity | `rea-agents`, `io.github.morluto/rea`, bins `rea` / `rea-agents` — **not renamed** |

Custom layer: `src/domain/investigationProject.ts`, `investigationReport.ts`,
`aiProviderContract.ts`, `formatRegistry.ts` (investigation registry),
`src/application/investigationProject/*`, `src/cli/investigationProjectCommands.ts`.
Everything else is the REA 6.8.0 snapshot plus earlier local ports (ADB PNG).

## 2. Verified and passing

- Investigation source tests after the fixes: **9 files, 47 passed**.
- `npm run check:fast`: typecheck + lint **passed** (after the test-file split).
- Schema version 2 refused with an actionable message.
- Stale target bytes after import refused, including after a completed job
  would otherwise have been reused.
- ELF classified from bytes when named `样本 notes.txt`.
- Missing file and `../project` job id refused.
- Pre-aborted analyze persisted `interrupted`.
- Findings carry `target_id`, `target_sha256`, `provider: builtin-static`.
- `generate-report` on a completed job rewrites reports without changing finding ids.
- CLI `project-status` and `list-plugins` exercised in `cliInvestigationProject.test.ts`.

## 3. Fixed and regression-tested

| Change | Tests |
| --- | --- |
| Streaming SHA-256; 8 KiB / 64 KiB prefix reads | Workflow + existing hash/format tests |
| Job-id charset + containment | Workflow safety test |
| Stale-hash refusal | Workflow safety test |
| Atomic target sidecar | Import path in Workflow.test |
| Actionable schema version | investigationProject.test |
| Completed-job resume is idempotent; generate-report regenerates only | Workflow.test |
| Failed/interrupted resume resets stages | Covered by interrupted persist + resume types |
| `EACCES` vs missing file messaging | Code path; dedicated chmod case not run on this host |

## 4. Partially implemented

- Optional `REA_AI_*`: unit refusals only; no live HTTP.
- ADB PNG helper tests passed; provider test not re-run.
- CLI investigation commands exist; they are **not** MCP tools.
- Builtin-static analyze-project; deep engines remain separate commands.

## 5. Not tested this increment

- `npm test`, `npm run check:pr`, `npm run test:mcp`, `npm run docs:check`
- Real Ghidra / Hopper / IDA / Kuna / JADX / Frida / browser / ADB
- Clean-install from a packed tarball (`npm run verify:package` not run)
- Dependency audit (`npm audit` not run)
- MCP `--http` bind addresses

## 6. Blocked / owner decision

- Independent npm/MCP rename: names `@niravcse006/ai-reverse-engineering` and
  `ai-reverse-engineering` were unpublished when last checked; `rea-agents` is
  taken. **No rename and no publish** until the owner chooses option 1/2/3
  (personal fork vs compatible names vs independent product).
- Porting seven remaining `main` commits needs those tests and a merge review.
- Live AI needs an endpoint and key the owner controls.

## 7. Deliberately excluded

- Copying all of upstream `main` over this tree.
- Launching the target or Frida from `analyze-project`.
- Loading third-party plugin JavaScript.
- Claiming this fork is better than `morluto/rea`.

## 8. Remaining security risks

See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) S7–S10. Highest practical risks:
optional AI exfiltrates findings when enabled; publishing as `rea-agents`;
untested MCP HTTP.

## 9. Runtime commands (this increment)

| Command | Exit |
| --- | --- |
| `npm run test:local --` (9 investigation files) | 0 (47 tests) |
| `npm run check:fast` | 0 after lint fix; first lint run failed on `max-lines-per-function` |
| `npm run build:cached` | 0 (compile warnings only) |
| CLI smoke init→import→analyze→status→report→resume | 0; stored findings `provider: builtin-static` |
| CLI analyze after mutating imported bytes | Exit 1: `Target contents changed after import` |
| `npm run upstream:drift` | 0; ahead 12 vs `17ceb77` |
| `npm test` / `check:pr` / `test:mcp` | **not run** |

## 10. Files changed (this increment)

Production:

- `src/domain/investigationProject.ts`
- `src/application/investigationProject/ProjectStore.ts`
- `src/application/investigationProject/Workflow.ts`
- `src/cli/investigationProjectCommands.ts`

Tests:

- `src/domain/investigationProject.test.ts`
- `src/application/investigationProject/Workflow.test.ts`
- `src/cliInvestigationProject.test.ts`

Tooling / docs:

- `scripts/report-upstream-drift.mjs`, `package.json` (`upstream:drift`)
- `docs/UPSTREAM_PARITY.md`, `docs/SECURITY_AUDIT.md`, `docs/FINAL_AUDIT.md`
- `docs/testing.md`, `README.md`

## 11. Conclusion

The investigation lifecycle is more robust than the previous snapshot and has
new regression tests. Upstream feature completeness is **not** achieved. The
project is **not** production-ready for an independent npm release.
