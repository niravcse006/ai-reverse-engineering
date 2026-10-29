# Security audit

Date: 2026-10-29.
Scope: investigation-project layer plus a review of AI, MCP, and filesystem
boundaries that those commands touch. This is not a full-repo penetration test.

## Findings

| ID | Severity | Status | Evidence | Fix / residual |
| --- | --- | --- | --- | --- |
| S1 | Medium | **Fixed this increment** | `hashLocalFile` / format / strings used `readFile` of the whole target | Streamed SHA-256; prefix reads of 8 KiB / 64 KiB |
| S2 | Medium | **Fixed this increment** | Job ids were only checked with `isPathWithinRoot` after `join` | Job ids must match `^[A-Za-z0-9_]+$` before any write/read |
| S3 | Medium | **Fixed this increment** | Analyze used the imported hash even if the file changed | Re-hash at analyze; refuse with an actionable error |
| S4 | Low | **Fixed this increment** | Target sidecar used non-atomic `writeFile` | `writeFileAtomic` + containment check |
| S5 | Low | **Fixed this increment** | `EACCES` was reported as “does not exist” | Distinct permission-denied message |
| S6 | Low | **Fixed this increment** | Unsupported `project.json` version used a generic Zod error | Explicit “unsupported schema version N” |
| S7 | Medium | Open | Optional `REA_AI_*` sends **findings JSON** (strings from the target) via `globalThis.fetch` when `ai_enabled` and a provider are ready | Default is off. Live HTTP not tested. See [PRIVACY.md](PRIVACY.md) |
| S8 | Medium | Open | Publishing this tree as npm `rea-agents` would impersonate upstream | Do not publish. Identity decision is the owner’s |
| S9 | Low | Open | MCP `--http` / client registrations were not re-tested here | Prefer local stdio; do not bind an unauthenticated public interface |
| S10 | Low | Open | `listInvestigationJobs` still skips unreadable job files | Diagnose via `resume-job`; no silent success of a missing job |
| S11 | Info | Accepted | Investigation import records the caller path; it does not copy target bytes into the project | Prevents overwrite of `project.json` by import |
| S12 | Info | Accepted | Deep engines / Frida / browser see the target as the current OS user when those commands are used | Not launched by `analyze-project` |

No critical (RCE, auth bypass, or unauthenticated remote write) finding was
confirmed in the investigation-project path.

## AI data flow (implementation)

| Question | Answer |
| --- | --- |
| Disabled by default? | Yes. `config.ai_enabled` defaults false; `REA_AI_PROVIDER` defaults `none` |
| What enables it? | Project `ai_enabled` **and** a ready provider |
| What may leave the machine? | Findings JSON + prompts, not the raw binary |
| Credentials | `REA_AI_API_KEY` from the environment; not written to reports |
| How to stay local | Leave AI unset, or `REA_AI_SPENDING_LIMIT_USD=0` |

## Responsible use

Authorized research, interoperability, education, preservation, and analysis of
software the user owns or may examine. This increment did not add access-control
bypass, credential theft, or security-product evasion features.

## Residual risk

Unported upstream process-ownership and session-cancellation fixes on `main`
were **not** merged. Treat those as unknown relative to current `morluto/rea`
`main`, not as verified local defects.
