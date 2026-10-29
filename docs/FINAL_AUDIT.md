# Final audit

Date: 2026-10-29 (this increment).
Workspace: `/Users/niravsoni/Projects/rea`.
Repository: https://github.com/niravcse006/ai-reverse-engineering

This report records only work that ran in this increment. It does not claim
this fork is better than `morluto/rea`.

## 1. Public snapshot vs local Git

There were **no new pushed commits** after the previous audit landing. Local
`main` and GitHub `main` are the same commit. This increment started from that
snapshot and did not rewrite it.

| Item | Value |
| --- | --- |
| Visible GitHub `main` | [`490a7911674246a7aa08e7a7788fca992125d1d8`](https://github.com/niravcse006/ai-reverse-engineering/commit/490a7911674246a7aa08e7a7788fca992125d1d8) |
| Local `HEAD` | `490a7911674246a7aa08e7a7788fca992125d1d8` |
| `origin/main` vs `HEAD` | Ahead 0, behind 0 |
| Working tree at inspection | Clean |
| GitHub commit date | 2026-10-29T10:39:10Z |
| Subject | Record the upstream 6.8.0 audit and persist completed report snapshots. |
| Commit author recorded by Git | `Chintan Hingarajiya <chintan.hingarajiya@multidots.com>` |

The GitHub snapshot already includes the completed-report snapshot fix and the
previous `FINAL_AUDIT.md`. Newer work in this increment is documentation only
(this file, comparison pointers, and a privacy-table clarification). Production
code was not changed.

## 2. Exact upstream references

Latest compatible official release remains **v6.8.0**. No newer GitHub release
or npm version exists. Upstream `main` moved **one commit** since the previous
audit (`860fdd8` → `01e00da`). That commit is not a release and was not merged.

| Reference | Exact value |
| --- | --- |
| Latest GitHub release | [rea-agents-6.8.0](https://github.com/morluto/rea/releases/tag/rea-agents-6.8.0) |
| Release name | `rea-agents: v6.8.0` |
| Release tag commit | `160d821ac9a0310afcb8d1fc427862dd6508add5` |
| Published | 2026-10-25T08:36:02Z |
| npm `rea-agents` | `6.8.0` (registry `latest`, still updated 2026-10-25T09:07:31.934Z) |
| Snapshot imported into this repository | `17ceb77ca5f2632faab8de01da4babff680eac48` (post-tag 6.8.0 snapshot, not the tag itself) |
| Upstream `main` at this increment | `01e00dae72e1dbac91b2f5d9997d5e0b8091ad3a` |
| `main` commit date | 2026-10-29T10:40:12Z |
| `main` subject | `fix(process): corroborate exiting Linux ownership candidates (#7958)` |
| Previous audit’s `main` | `860fdd8fbeded2ddf9abfac61f6982db7458e94e` |
| Compare used | GitHub compare API `17ceb77ca5f2632faab8de01da4babff680eac48...main` and `860fdd8...main` |
| Delta vs snapshot | Ahead 10 commits, behind 0, 140 files |
| New since previous audit | 1 commit, 8 files (`ProcessOwnership*` plus three bundle-comparison tests) |

Compatibility decision is unchanged: stay on the 6.8.0 line (`17ceb77` snapshot
plus local investigation work). Porting current `main` is a merge of nine
remaining upstream commits and is outside this increment.

## 3. Identity and publishing metadata

Checked again. **No rename was implemented.** A consistent independent
identity is possible later; doing it in this increment would be a breaking
refactor, would not be published (forbidden here), and would leave MCP clients
and conformance tests half-migrated.

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
| `publishConfig.access` | `public` | `public` |
| CLI help banner | Hardcoded upstream slogan in `src/cli.ts` | Same slogan |

Registry collisions (HTTP, this increment):

| Name | npm result |
| --- | --- |
| `rea-agents` | **Taken.** Official package 6.8.0, homepage `morluto/rea`, ~478k weekly downloads |
| `ai-reverse-engineering` | 404 (unpublished) |
| `@niravcse006/ai-reverse-engineering` | 404 (unpublished) |
| `@niravcse006/rea` | 404 (unpublished) |

README already states this repository is **not** the official `rea-agents`
publication and that global install is `npm install --global .` from this tree.
`tests/conformance/releaseConfiguration.test.ts` still expects
`mcpName: "io.github.morluto/rea"`.

Proposed future migration (not executed, not published):

1. Choose `@niravcse006/ai-reverse-engineering` (unpublished; scoped to the GitHub owner).
2. Keep a local `rea` bin alias; add a distinct package-name bin if needed.
3. Change `mcpName` to `io.github.niravcse006/ai-reverse-engineering` only with
   documented MCP client dual-write.
4. Do **not** publish under `rea-agents`. That would impersonate upstream.

## 4. Missing upstream features, regressions, intentional differences

Commits on `morluto/rea` `main` after `17ceb77`:

| Commit | Subject | Status here |
| --- | --- | --- |
| `e3d8d20` | fix(native): preserve dispatch metadata format refusals | Missing / older native code |
| `2b85a4a` | fix(native): preserve bookmark address uncertainty | Missing / older native code |
| `f7cd4e5` | fix(adb): validate screen capture PNG headers | Ported earlier |
| `bd37925` | docs(skill): clarify scenario pause deadlines | Missing skill-doc tweak |
| `3503578` | fix(session): preserve cancellation during mutation retirement | Regressed relative to upstream `BinarySession.ts` |
| `131fbe0` | feat(environment): serve writes whose calls send different members | Missing |
| `c88e1b0` | feat(guidance): search installed workflow sections | Missing |
| `d3ecf68` | docs(website): clarify platform setup requirements | Intentional: this product README is not rea.tools |
| `860fdd8` | feat(macho): report per-slice encryption status | Missing |
| `01e00da` | fix(process): corroborate exiting Linux ownership candidates | **New since last audit. Not ported.** Local `ProcessOwnership.ts` is older |

Intentional fork-only additions (absent from upstream `main`): investigation
projects, reports, optional `REA_AI_*` disclosure, and the product README.

`01e00da` was not ported: it is not in the compatible 6.8.0 release, it touches
process-ownership and large native-exit tests, and no local failing case was
observed. Copying it would be a new merge, not a confirmed defect fix.

## 5. Local-only analysis and AI transmission

Source review of `Workflow.ts` / `AiProvider.ts` / `aiProviderContract.ts`
against [PRIVACY.md](PRIVACY.md) and [AI_PROVIDERS.md](AI_PROVIDERS.md):

| Claim | Verdict |
| --- | --- |
| Builtin `inspect-target` / `analyze-project` stay on disk unless AI is enabled | Confirmed in code and CLI smoke (`ai_disclosure.attempted: false`) |
| Target is not executed by those commands | Confirmed (`optional_dynamic` skipped; limitations say never executed) |
| Default provider is `none` | Confirmed |
| Enabled AI sends findings JSON via `globalThis.fetch` to `REA_AI_ENDPOINT` | Confirmed in `Workflow.ts` (only when `ai_enabled` and provider ready) |
| Spend limit `0` refuses before fetch | Confirmed by `Workflow.test.ts` |
| Disclosure stores host, not API key | Confirmed (`createAiDisclosure`) |
| Untrusted target text is wrapped | Confirmed (`wrapUntrustedTargetContent`) |
| Live HTTP to a real model | **Not run** |

[PRIVACY.md](PRIVACY.md) was updated to say `analyze-project` uses
`globalThis.fetch` only when the job enables AI and a provider is ready. That
matches the implementation. Docs were not claiming a stronger “never leaves
the machine” guarantee.

## 6. Defects in this increment

No new high-priority production defect was confirmed. The stale report snapshot
is already fixed in GitHub `490a791`. Identity rename was **not** treated as a
defect: the current names match upstream runtime identity, and README already
disclaims official npm publication.

## 7. Files changed in this increment

| Path | Change |
| --- | --- |
| `docs/FINAL_AUDIT.md` | This increment’s evidence (GitHub vs local, new `main` `01e00da`, identity collisions) |
| `docs/UPSTREAM_COMPARISON.md` | Pointer updated to `01e00da` |
| `docs/FEATURE_PARITY.md` | Pointer mentions process-ownership on `main` |
| `docs/PRIVACY.md` | Clarify when `globalThis.fetch` runs |

Production source was left untouched.

## 8. Tests and CLI smoke (executed this increment)

Node: **v22.23.4**. `.nvmrc` is `24.22.1` (not installed). v22.23.4 is inside
`package.json#engines`.

### Source tests

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

Result: **9 files, 43 tests passed.** Persistence, duplicate-target reuse,
completed-job reuse, corrupted `project.json`, empty import, stored report
`completed`, spend-limit refusal, and PNG header tests are in that set.

### Typecheck, lint, build

| Command | Result |
| --- | --- |
| `npm run check:fast` | Passed. Turbo `typecheck` + `lint`: 2 successful, **2 cached**, 119ms |
| `npm run build:cached` | Passed. 3 successful, **3 cached**, 118ms. Replay still shows the existing `INEFFECTIVE_DYNAMIC_IMPORT` compile warnings |

Cache hits mean this increment did not recompile; the previous increment’s
successful compile remains the artifact on disk.

### CLI smoke (`/tmp/rea-audit2-L4wtPe`)

Synthetic ELF64 LE arm64 plus ASCII `HelloREA` (72 bytes). SHA-256
`5e9ff4f8114c5edb41b531cc591a76cdd23986006200b5f5859b6d86b62d14dc` matched an
independent digest.

| Check | Result |
| --- | --- |
| `rea --help` | Exit 0 |
| `init-project` | Exit 0 |
| `import-target` | Exit 0. `tgt_647fca65186e4326b3a452d7f3e2aa70`, format elf |
| `inspect-target` | Exit 0. Same hash |
| `analyze-project` | Exit 0. `job_7cbaf1f5ffe4485d9ddb6ac5f745c4a6`, status completed |
| On-disk JSON + Markdown reports | Present. `job.status` completed; all ten stages completed or skipped; 3 findings with `evidence_ids`; AI skipped |
| Second `analyze-project` | Exit 0. Same `job_id` (cache reuse). One job file on disk |
| `resume-job` on that id | Exit 0. Same `job_id`, status completed |
| `generate-report` | Exit 0. Rewrote the same JSON/Markdown paths |
| Empty-file import | Exit 1. `Empty files cannot be imported.` |
| `resume-job` missing id | Exit 1. `Job job_does_not_exist was not found.` |
| `providers` | Exit 0 |
| `doctor` | Exit 1, `healthy: false` (missing engines/skill/registrations; expected) |

`analyze-project` did not execute the fixture.

## 9. Checks not run

- `npm test`
- `npm run check:pr`
- `npm run docs:check`
- Real Ghidra / Hopper / IDA / Kuna / JADX / Frida / ADB lanes
- `src/adb/AdbProvider.test.ts`
- MCP client round-trip
- Live `REA_AI_*` HTTP
- Upstream tests for the nine unported `main` commits, including `01e00da`

Absence of those results is not a pass.

## 10. Remaining risks

1. **Upstream drift.** Nine `main` commits after `17ceb77` are unported. New
   since last audit: Linux process-ownership corroboration (`01e00da`).
   Highest prior risks remain BinarySession cancellation, native
   bookmark/dispatch, and Mach-O per-slice encryption.
2. **Deep engines unverified.**
3. **Optional AI untested against a live endpoint.**
4. **Identity collision if published as `rea-agents`.** Do not publish.
5. **Git author on `490a791`** is still the local `user.name` /
   `user.email` (Chintan Hingarajiya). The GitHub repo owner is niravcse006.
   Rewriting that commit was out of scope.
6. **`doctor` / skill / client registrations** remain unconfigured here.

## 11. Prioritized next steps

1. Port remaining upstream `main` commits when their tests can run here,
   starting with `3503578`, `2b85a4a` / `e3d8d20`, `860fdd8`, then `01e00da`.
2. Run `npm run check:pr` and one real-provider lane when tools exist.
3. If independent distribution is required, execute the scoped rename plan in
   section 3 as its own PR, with conformance-test updates, and do not publish
   under `rea-agents`.
4. If live AI is required, add a bounded integration test that never logs the
   API key.
5. Do not expand `analyze-project` into an undeclared deep-engine launcher.

## 12. Conclusion

GitHub and local `main` are both `490a791`. Latest compatible upstream release
is still **rea-agents 6.8.0** at `160d821ac9a0310afcb8d1fc427862dd6508add5`.
Current upstream `main` is `01e00dae72e1dbac91b2f5d9997d5e0b8091ad3a` (one
commit newer than the previous audit). No production fix was justified. Identity
was left on the upstream runtime names after a collision check. This fork is
not ahead of, and is not claimed to be better than, upstream `main`.
