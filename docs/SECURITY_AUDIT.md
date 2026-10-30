# Security audit

Date: 2026-10-29.
Scope: investigation-project layer, native dispatch/bookmark ports, BinarySession
cancellation, Linux process-ownership corroboration, browser source-map
uncertainty, AI opt-in, MCP transport defaults observed during unsandboxed
`npm run test:mcp`, and filesystem/subprocess boundaries those paths touch.
This is not a penetration test and is not a security certification.

## Findings

| ID  | Severity | Status                   | Evidence                                                                                                                     | Fix / residual                                                                                                                                                                                                               |
| --- | -------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Medium   | **Fixed**                | `hashLocalFile` / format / strings used `readFile` of the whole target                                                       | Streamed SHA-256; prefix reads of 8 KiB / 64 KiB                                                                                                                                                                             |
| S2  | Medium   | **Fixed**                | Job ids were only checked with `isPathWithinRoot` after `join`                                                               | Job ids must match `^[A-Za-z0-9_]+$` before any write/read                                                                                                                                                                   |
| S3  | Medium   | **Fixed**                | Analyze used the imported hash even if the file changed                                                                      | Re-hash at analyze; refuse with an actionable error                                                                                                                                                                          |
| S4  | Low      | **Fixed**                | Target sidecar used non-atomic `writeFile`                                                                                   | `writeFileAtomic` + containment check                                                                                                                                                                                        |
| S5  | Low      | **Fixed**                | `EACCES` was reported as “does not exist”                                                                                    | Distinct permission-denied message                                                                                                                                                                                           |
| S6  | Low      | **Fixed**                | Unsupported `project.json` version used a generic Zod error                                                                  | Explicit “unsupported schema version N”                                                                                                                                                                                      |
| S7  | Medium   | **Verified locally**     | Optional `REA_AI_*` sends **findings JSON** (strings from the target) via `fetch` when `ai_enabled` and a provider are ready | Confirmed on 127.0.0.1: body has findings + untrusted wrapper; `Authorization` header carries the key; key is absent from the body. Default remains off. External providers were not contacted. See [PRIVACY.md](PRIVACY.md) |
| S15 | Medium   | **Fixed this increment** | `aiProviderStatus` used the caller environment, but `interpretEvidenceWithAi` read `process.env` for the API key             | Workflow now passes the same environment into `interpretEvidenceWithAi`                                                                                                                                                      |
| S8  | Medium   | Open                     | Publishing this tree as npm `rea-agents` would impersonate upstream                                                          | Do not publish. Identity decision is the owner’s                                                                                                                                                                             |
| S9  | Low      | Observed default         | MCP `--http` bind: `mainErrors.test.ts` logged refusal of `0.0.0.0` without `MCP_ALLOWED_HOSTS` / `--allowed-hosts`          | Prefer local stdio. Do not bind an unauthenticated public interface                                                                                                                                                          |
| S10 | Low      | **Fixed this increment** | `listInvestigationJobs` skipped unreadable job files                                                                         | Listing now returns `unreadable` entries; `project-status` reports `unreadable_jobs`                                                                                                                                         |
| S11 | Info     | Accepted                 | Investigation import records the caller path; it does not copy target bytes into the project                                 | Prevents overwrite of `project.json` by import                                                                                                                                                                               |
| S12 | Info     | Accepted                 | Deep engines / Frida / browser see the target as the current OS user when those commands are used                            | Not launched by `analyze-project`                                                                                                                                                                                            |
| S13 | Info     | Observed                 | `writeInvestigationEvidence` writes `evidence/*.json` mode `0o600` under the project root                                    | Finding ids must match `^[A-Za-z0-9_]+$`                                                                                                                                                                                     |
| S14 | Medium   | **Fixed this increment** | Unsandboxed `bundleComparisonCancellation` received `EvidenceFileError` (`io`) for a cancelled oversized JSON read           | `JsonFiles.ts` now unwraps `AbortError` → `JsonInputCancellationFailure` as `AnalysisCancelledError`. BinarySession `3503578` and Linux ownership `01e00da` are ported. Residual: unported `34577eb` symlink-target bytes    |
| S16 | Medium   | Open                     | Unported `main` Mach-O encryption (`860fdd8`) and undecodable symlink targets (`34577eb`)                                    | Not merged. Residual vs current upstream `main` `317bf3f` (ahead 40), not a newly confirmed local RCE                                                                                                                        |

No critical (RCE, auth bypass, or unauthenticated remote write) finding was
confirmed in the investigation-project path.

## AI outbound data (implementation)

| Question                    | Answer                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| Disabled by default?        | Yes. `config.ai_enabled` defaults false; `REA_AI_PROVIDER` defaults `none`                 |
| What enables it?            | Project `ai_enabled` **and** a ready provider                                              |
| What may leave the machine? | Findings JSON + prompts, not the raw binary                                                |
| Credentials                 | `REA_AI_API_KEY` from the environment; not written to reports                              |
| Size limit                  | Spend limit `0` refuses before fetch                                                       |
| How to stay local           | Leave AI unset, or `REA_AI_SPENDING_LIMIT_USD=0`                                           |
| Live send this increment?   | Yes, to a **local 127.0.0.1** test server only. No external host. No confidential binaries |

## MCP observations from `npm run test:mcp`

- Stdio MCP is the intended local transport.
- HTTP listener refused `0.0.0.0` without an operator-declared host allowlist.
- Test logs used `SECRET` placeholders for startup-stack and `EADDRINUSE` text.
- Application JSON logs appeared in the **test runner** output. That does not
  prove stdio MCP frames are mixed with logs in production; the dedicated
  `shutdown.test.ts` file passed.
- Unsandboxed `npm run test:mcp` this increment: 5 failed / 1612 passed /
  13 skipped. The prior cancellation misclassification passed. The five
  failures were 30s/20s suite-load timeouts and passed on focused retest.
- Earlier sandboxed spawn/`posix_spawnp` failures (Frida, Rizin, pcap, Mach-O
  summary, Ghidra reopen) passed in this unsandboxed run and are not product
  defects.

## File handling and subprocesses (investigation path)

| Control           | Behavior                                                             |
| ----------------- | -------------------------------------------------------------------- |
| Target execution  | `analyze-project` / `inspect-target` never execute the imported file |
| Hashing           | Streaming SHA-256                                                    |
| Format / strings  | 8 KiB / 64 KiB prefix reads                                          |
| Job / finding ids | `^[A-Za-z0-9_]+$` before join                                        |
| Evidence writes   | Contained under `evidence/`, atomic write, mode `0o600`              |
| Next commands     | Named only; `inspect` / `objdump` / Frida are not spawned            |
| Deep engines      | Probed by path existence / PATH; not launched                        |

## Responsible use

Authorized research, interoperability, education, preservation, and analysis of
software the user owns or may examine. This increment did not add access-control
bypass, credential theft, or security-product evasion features.

## Residual risk

Session-cancellation (`3503578`) and Linux process-ownership (`01e00da`) from
`main` are now in this tree. Remaining unported safety-adjacent commits include
Mach-O encryption (`860fdd8`) and undecodable symlink targets (`34577eb`).
Treat those as unknown relative to current `morluto/rea` `main`
`34577eb`, not as verified local defects. Optional AI remains an outbound path
when the operator enables it. Publishing as `rea-agents` /
`io.github.morluto/rea` remains an impersonation risk (S8).
