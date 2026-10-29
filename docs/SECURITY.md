# Security and threat model

This document complements the root [SECURITY.md](../SECURITY.md) reporting
policy. It describes risks that apply to local reverse-engineering workflows
and the controls implemented or still residual in this working copy.

## Threats

| Threat | Risk | Control | Residual |
| --- | --- | --- | --- |
| Malicious binaries | Parser or provider crash, unexpected execution | Inspection never launches the target. Deep engines run only when the user runs a provider command | Same-user process compromise if a provider is launched |
| Archive bombs | Disk/CPU exhaustion | Detection does not extract archives. Upstream expansion budget is 256 MiB floor / 500× encoded size | Extraction commands can still be invoked deliberately |
| Path traversal | Write outside the project | Job/report paths checked with `isPathWithinRoot`; plugin entries reject `..` | Symlink races are not fully solved here |
| Command injection | Shell metacharacters | Backend probe uses `fs.access`, not a shell. Existing REA process helpers avoid shell evaluation | Misconfigured BYO commands remain the operator's risk |
| Unsafe subprocesses | Attacker-controlled argv | Project workflow does not spawn analysis engines | Dedicated backend commands still spawn owned processes |
| Malicious plugins | Arbitrary code | Manifests are validated only; `trusted` cannot be true; entry is not imported | A future loader would reopen this risk |
| Compromised tools | Hostile Ghidra/JADX/Rizin | BYO tools run as the current user; capability tokens bind Hopper/Ghidra bridges | Not a sandbox |
| Prompt injection | Model follows target strings | Untrusted wrappers + JSON schema + exploitability rejection | Labels are not a complete defense |
| Unauthorized network | Unexpected callbacks | AI HTTP runs only when endpoint/key are set and fetch is supplied | Operator-configured endpoints are trusted |
| Secret leakage | API keys in reports/logs | Keys are read from env and not persisted in project JSON or reports | Process environment can still be dumped by the OS user |
| Resource exhaustion | Large files | 8 KiB format probe, 64 KiB string scan, file hashing of the real file | Hashing a huge file still reads it |
| Unsafe dynamic execution | Running malware | `optional_dynamic` is skipped unless authorized, and still does not execute | Other CLI commands can instrument or debug if the user asks |

## Implemented controls that were tested

- Empty-file import refusal (`Workflow.test.ts`)
- Plugin path traversal rejection (`pluginContract.test.ts`)
- AI exploitability rejection (`aiProviderContract.test.ts`)
- Report writer rejects unsafe job ids
- CLI workflow completes on a synthetic ELF without executing it
- Duplicate-target reuse and corrupted `project.json` refusal (`Workflow.test.ts`)
- AI disclosure omits endpoint query secrets (`aiProviderContract.test.ts`)
- Spend limit `0` refuses fetch (`Workflow.test.ts`)

## Residual risks

A container or Job Object does not make Ghidra, Rizin, or Frida safe against a
malicious target once those tools are launched. Windows Ghidra P0 and POSIX
socket tokens reduce accidental cross-session use; they do not isolate a
hostile binary from the current user.

Do not analyze software you are not authorized to examine. See
[DISCLAIMER.md](../DISCLAIMER.md).
