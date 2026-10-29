# Final audit

Date: 2026-10-29.
Workspace: `/Users/niravsoni/Projects/rea`.
Repository: https://github.com/niravcse006/ai-reverse-engineering

This report records only work that ran in this increment. It does not claim
this fork is better than `morluto/rea`.

## 1. Git baseline

User changes were preserved. No files were discarded.

| Item | Value |
| --- | --- |
| Starting HEAD | `a8c898bc7ca9932890e2f5ac11cd38bee27b4b69` (`Harden investigation reports and port the ADB PNG header check.`) |
| Remote | `git@github.com-niravcse006:niravcse006/ai-reverse-engineering.git` |
| Starting tree | Clean (`main` matched `origin/main`) |
| Ending tree | The two workflow files below plus this document and comparison pointers |

## 2. Exact upstream references

Latest compatible official release remains **v6.8.0**. No newer GitHub release
or npm version exists. Current upstream `main` is newer than that release, but
it is not a published compatible release and was not merged into this tree.

| Reference | Exact value |
| --- | --- |
| Latest GitHub release | [rea-agents-6.8.0](https://github.com/morluto/rea/releases/tag/rea-agents-6.8.0) |
| Release name | `rea-agents: v6.8.0` |
| Release tag commit | `160d821ac9a0310afcb8d1fc427862dd6508add5` (annotated as `target_commitish` and `refs/tags/rea-agents-6.8.0`) |
| Published | 2026-10-25T08:36:02Z |
| npm `rea-agents` | `6.8.0` (registry `latest`, updated 2026-10-25T09:07:31.934Z) |
| Snapshot imported into this repository | `17ceb77ca5f2632faab8de01da4babff680eac48` (post-tag 6.8.0 snapshot, not the tag itself) |
| Upstream `main` at audit time | `860fdd8fbeded2ddf9abfac61f6982db7458e94e` |
| `main` commit date | 2026-10-29T10:19:39Z |
| `main` subject | `feat(macho): report per-slice encryption status in inspect_macho (#5359)` |
| Compare used | GitHub compare API `17ceb77ca5f2632faab8de01da4babff680eac48...main` |
| Delta | Ahead 9 commits, behind 0, 132 files |

This checkout is a snapshot plus local commits, not a git clone that shares
objects with `morluto/rea`. Compatibility decision: stay on the 6.8.0 line
(`17ceb77` snapshot + local investigation work). Porting current `main` would
be a merge of eight remaining upstream commits, which is outside this audit.

## 3. Identity and publishing metadata

No identifiers were renamed. A rename would collide with the published npm
package, break `npx rea-agents`, and invalidate MCP client registrations.
`tests/conformance/releaseConfiguration.test.ts` still expects
`mcpName: "io.github.morluto/rea"`.

| Field | This tree | Upstream 6.8.0 / npm |
| --- | --- | --- |
| `package.json` `name` | `rea-agents` | `rea-agents` |
| `mcpName` | `io.github.morluto/rea` | `io.github.morluto/rea` |
| Bins | `rea`, `rea-agents` | `rea`, `rea-agents` |
| Version | `6.8.0` | `6.8.0` |
| Lockfile name | `rea-agents` | `rea-agents` |
| `PRODUCT_IDENTITY.cliBinary` / `mcpServerKey` | `rea` | `rea` |
| `PRODUCT_IDENTITY.skillName` | `reverse-engineer-anything` | `reverse-engineer-anything` |
| Homepage / bugs / repository | `niravcse006/ai-reverse-engineering` | `morluto/rea` |
| `package.json` description | Fork product text | Upstream slogan |
| CLI help banner | Hardcoded `Reverse engineer anything from your terminal or agent.` in `src/cli.ts` | Same slogan |

The banner mismatch with `package.json#description` is cosmetic. It was left
unchanged because it is not a functional regression and changing it has
distribution/docs implications.

## 4. Missing upstream features, regressions, unverified claims

Commits on `morluto/rea` `main` after `17ceb77`, from the compare API:

| Commit | Subject | Status here |
| --- | --- | --- |
| `e3d8d20` | fix(native): preserve dispatch metadata format refusals | Missing / older native code |
| `2b85a4a` | fix(native): preserve bookmark address uncertainty | Missing / older native code |
| `f7cd4e5` | fix(adb): validate screen capture PNG headers | Ported earlier (`AdbProvider` uses `readPngHeaderDimensions`) |
| `bd37925` | docs(skill): clarify scenario pause deadlines | Missing skill-doc tweak |
| `3503578` | fix(session): preserve cancellation during mutation retirement | Regressed relative to upstream `BinarySession.ts` |
| `131fbe0` | feat(environment): serve writes whose calls send different members | Missing |
| `c88e1b0` | feat(guidance): search installed workflow sections | Missing (`GuidanceAccess.ts` / `rea guidance` absent) |
| `d3ecf68` | docs(website): clarify platform setup requirements | Not applicable to this product README |
| `860fdd8` | feat(macho): report per-slice encryption status | Missing (`MachoEncryptionReader.ts` absent) |

Fork-only additions, absent from upstream `main`: investigation project domain,
store, workflow, report/AI contracts, and CLI (`init-project`, `import-target`,
`inspect-target`, `analyze-project`, report/resume/plugin helpers).

Unverified claims (code exists; this increment did not prove behavior):

- Full `npm test` / `npm run check:pr`
- Real Ghidra, Hopper, IDA, Kuna, JADX, Frida, or ADB provider lanes
- `src/adb/AdbProvider.test.ts` (PNG helper tests ran; the provider test did not)
- Live `REA_AI_*` HTTP to a real endpoint
- MCP stdio/HTTP catalog against a real client
- Upstream guidance, environment-varied-write, BinarySession, native bookmark,
  native dispatch, and Mach-O encryption tests (those files are missing or older)

Do not treat this fork as newer or better than `morluto/rea` `main`. It is
behind those eight unported commits.

## 5. Confirmed bug fixed in this increment

**Stale report job snapshot.** Before this change, `runInvestigationWorkflow`
wrote JSON/Markdown reports while the in-memory job was still `running` and
`generate_report` / `persist_job` were still pending. After persist, CLI output
and `jobs/<id>.json` showed `completed`, but `reports/<id>.json` still said
`running`. Observed in the previous smoke under `/tmp/rea-smoke-HGsc`.

Fix: finalize job status and report paths first, then write the report once
with that completed job, then persist. `Workflow.test.ts` now reads the on-disk
JSON and requires `job.status === "completed"`.

No other high-priority production bug was confirmed. Remaining gaps are missing
upstream ports, unrun suites, or identity/distribution decisions.

## 6. Files changed

| Path | Change |
| --- | --- |
| `src/application/investigationProject/Workflow.ts` | Write reports after the job is marked completed |
| `src/application/investigationProject/Workflow.test.ts` | Assert the stored report snapshot is `completed` |
| `docs/FINAL_AUDIT.md` | This report |
| `docs/UPSTREAM_COMPARISON.md` | Pointer to this current comparison |
| `docs/FEATURE_PARITY.md` | Pointer to this current comparison |

Production code was otherwise left untouched.

## 7. Investigation, privacy, and recovery evidence

Node used: **v22.23.4** (`~/.nvm/versions/node/v22.23.4`). `.nvmrc` pins
`24.22.1`, which is not installed here. v22.23.4 is inside
`package.json#engines` (`^22.23.4 || ^24.22.1 || >=26.12.1`).

### Source tests (executed)

```text
npm run test:local -- \
  src/application/investigationProject/Workflow.test.ts \
  src/application/investigationProject/RemainingWorkflows.test.ts \
  src/domain/formatRegistry.test.ts \
  src/domain/aiProviderContract.test.ts \
  src/domain/investigationReport.test.ts \
  src/domain/investigationProject.test.ts \
  src/domain/pluginContract.test.ts \
  src/domain/pngHeader.test.ts \
  src/cliInvestigationProject.test.ts
```

Result: **9 files, 43 tests passed.** Covers project create/import/inspect,
duplicate-target reuse, completed-job cache reuse, corrupted `project.json`
refusal, empty-file import refusal, stored report `completed` status, remaining
workflows, spend-limit `0` refusal before `fetch`, angr unavailable, plugin
metadata-only validation, and PNG header parsing.

### Typecheck, lint, build (executed)

| Command | Result |
| --- | --- |
| `npm run check:fast` | Passed. Turbo `typecheck` + `lint`: 2 successful, 0 cached, 12.846s |
| `npm run build:cached` | Passed. 3 successful, 1 cached, 9.723s. Compile emitted only existing `INEFFECTIVE_DYNAMIC_IMPORT` warnings |

### CLI smoke (executed after the build)

Fixture: synthetic ELF64 little-endian arm64 plus ASCII `HelloREA` at
`/tmp/rea-final-audit-X9RizB/sample.so` (72 bytes).

| Check | Result |
| --- | --- |
| `rea --help` | Exit 0. Banner `rea@6.8.0 — Reverse engineer anything from your terminal or agent.` Investigation commands listed. |
| `init-project` | Exit 0. Project `audit-smoke`, `ai_enabled: false`, empty targets/jobs. |
| `import-target` | Exit 0. `target_id` `tgt_c4a25b9e3d1e47a8bc2f010ef8e35057`, `format` elf / arm64, `sha256` `5e9ff4f8114c5edb41b531cc591a76cdd23986006200b5f5859b6d86b62d14dc` |
| Independent SHA-256 of the fixture | Same digest |
| `inspect-target` | Exit 0. Same hash. Builtin-static available; Ghidra/Hopper/IDA/Kuna unavailable. Remaining workflows named. |
| `analyze-project` | Exit 0. `job_id` `job_fe817f95fe2a4bbc8c7e56d10ba2b551`, `status` completed, 3 findings with `evidence_ids` (`ev_format`, `ev_arch`, `ev_strings`), `HelloREA` retained, 10 stages completed or skipped as designed |
| On-disk report JSON | `job.status` **completed**; `generate_report` and `persist_job` completed; AI disclosure `attempted: false`, `provider: none`, host omitted; provenance `v22.23.4` / darwin / arm64 |
| Persisted job JSON | `status` completed; `cache_key` starts with the SHA-256 |
| Second `analyze-project` | Exit 0. Same `job_id` (completed-job reuse) |
| Empty-file `import-target` | Exit 1. `Empty files cannot be imported.` |
| `providers` | Exit 0. Catalog printed (native macOS utilities available; deep engines not configured) |
| `doctor` | Exit 1, `healthy: false`, `environment_healthy: false`. Node 22.23.4 healthy. Hopper/Ghidra/IDA/JADX/Kuna missing. Skill identity and client registrations missing. Expected on this machine. |

`analyze-project` did not execute the fixture and did not select Frida/GDB.

### External AI, secrets, untrusted artifacts

Source-level review plus the tests above. No live provider HTTP was sent.

| Control | Evidence |
| --- | --- |
| Local default | Default `REA_AI_PROVIDER` / job `ai_enabled` is off. Smoke report: `attempted: false`, `provider: none` |
| Spend limit 0 | `interpretEvidenceWithAi` returns before `fetchImpl` (`Workflow.test.ts`) |
| Missing fetch client | Production path requires an injected `fetch`; missing client is an unavailable error, not a send |
| Disclosure | `createAiDisclosure` records provider, model, **host only**, bytes, attempted. API keys are not included |
| Secrets | `REA_AI_API_KEY` is read from the environment and used only as a Bearer header. `.env` is gitignored |
| Untrusted target text | `wrapUntrustedTargetContent` wraps evidence before any model prompt |
| Exploitability claims | `parseAiInterpretation` rejects exploit/RCE/0-day wording |
| Empty / corrupt artifacts | Empty import refused; corrupted `project.json` refused |

Live transmission to an operator-chosen `REA_AI_ENDPOINT` remains untested.

## 8. Checks not run

- `npm test`
- `npm run check:pr`
- `npm run docs:check`
- Real deep-engine or ADB provider suites
- MCP client round-trip
- Live AI HTTP
- Upstream tests for the eight unported `main` commits

Absence of those results is not a pass.

## 9. Remaining risks

1. **Upstream drift.** Eight `main` commits after `17ceb77` are still missing.
   The highest functional risks are BinarySession cancellation, native
   bookmark/dispatch refusals, and Mach-O per-slice encryption.
2. **Deep engines unverified.** Builtin-static smoke is not a substitute for
   Ghidra/IDA/Hopper/Kuna/JADX.
3. **Optional AI.** Unit refusals passed; a real endpoint, key handling, and
   timeout/retry path were not exercised.
4. **Identity collision.** Publishing `rea-agents` / `io.github.morluto/rea`
   from this GitHub repository would impersonate upstream. Keep the names until
   a scoped rename is planned.
5. **Investigation depth.** `analyze-project` records builtin findings and
   remaining workflows. It does not attach inspect/decompile Evidence from a
   deep engine, because those engines were not configured here.
6. **Doctor/skill.** `healthy: false` is correct without `rea setup` and BYO
   engines. It is not a product regression.

## 10. Prioritized next steps

1. Port the eight remaining upstream `main` commits, starting with
   `3503578` (session cancellation), `2b85a4a` / `e3d8d20` (native), and
   `860fdd8` (Mach-O encryption). Keep investigation code additive.
2. Run `npm run check:pr` and at least one real-provider lane when those
   tools are available.
3. If a live AI endpoint is required, add a bounded integration test that
   asserts host-only disclosure and never logs the API key.
4. Decide a scoped npm/MCP rename only after documenting client migration.
   Do not publish under `rea-agents`.
5. Keep attaching deep-engine Evidence as a separate workflow, not by expanding
   `analyze-project` into an undeclared engine launcher.

## 11. Conclusion

Latest compatible upstream release: **rea-agents 6.8.0** at
`160d821ac9a0310afcb8d1fc427862dd6508add5`. This tree is the later snapshot
`17ceb77ca5f2632faab8de01da4babff680eac48` plus local investigation work,
compared against current `main` `860fdd8fbeded2ddf9abfac61f6982db7458e94e`.

The only justified production change was the completed-job report snapshot.
Executed investigation, typecheck, lint, build, and CLI smoke checks passed
as recorded above. This fork is not ahead of, and is not claimed to be better
than, upstream `main`.
