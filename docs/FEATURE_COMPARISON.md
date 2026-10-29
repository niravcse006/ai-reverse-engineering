# Feature comparison

> **Historical.** Current statuses and pinned SHAs are in
> [UPSTREAM_PARITY.md](UPSTREAM_PARITY.md) and [FINAL_AUDIT.md](FINAL_AUDIT.md).
> Do not use the counts or upstream SHAs below as the live scorecard.

Comparison of original REA 6.8.0, this working copy, and selected external
projects. Ratings use demonstrated value in this repository, not marketing
pages.

This working copy is **not** declared better than
[morluto/rea](https://github.com/morluto/rea). On 2026-10-29 upstream `main`
(`d3ecf68`) was 8 commits ahead of the imported snapshot `17ceb77`. Use
[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md) as the scorecard.

Legend: **Y** implemented here or in upstream REA, **O** optional backend,
**P** planned/deferred, **N** absent or rejected.

| Capability | Upstream REA | This working copy | Ghidra | radare2/Rizin | angr | JADX |
| --- | --- | --- | --- | --- | --- | --- |
| AI reasoning / code explanation | External agent via MCP | Optional `REA_AI_*` plus MCP | N | Experimental plugins | N | N |
| File-format detection | Y | Y + project registry facade | Y | Y | Y | APK/DEX |
| Disassembly / decompilation | O | O | Y | Y | Limited | Java/Smali |
| Function discovery | O | P in builtin path | Y | Y | Y | Y |
| Symbol recovery | O | P | Y | Y | Partial | Partial |
| String extraction | O / format readers | Y builtin bounded scan | Y | Y | Y | Y |
| Imports / exports | Y for several formats | Uses existing readers when those commands run | Y | Y | Y | Y |
| Call / control-flow graphs | O | P | Y | Y | Y | Partial |
| Data-flow analysis | Limited / O | P | Y | Partial | Y | Partial |
| Dependency mapping | Y (JS, native, managed) | Y metadata only in project path | Partial | Partial | Partial | Y |
| Static analysis | Y | Y | Y | Y | Y | Y |
| Dynamic analysis | O explicit | O explicit, never automatic | N | Y | Y | N |
| Runtime instrumentation | Frida / browser / Electron | Unchanged | N | Partial | N | N |
| Automation | CLI + MCP | CLI + MCP + project jobs | Headless | Scripts | Python | CLI |
| Plugin architecture | Skills + engine bridges | Metadata validation only | Y | Y | Python | Gradle-like |
| CLI / API | Y | Y + project commands | Y | Y | Library | Y |
| Error recovery / partial results | Y | Y job persistence | Partial | Partial | Partial | Partial |
| Performance controls | Budgets, workers | Same + 8–64 KiB probes | Project DB | Varies | Heavy | Varies |
| Security controls | Process ownership, tokens | Same + no auto-exec, untrusted AI wrap | User-managed | User-managed | Executes IR | User-managed |
| Testing | Very large Vitest suite | Suite preserved + 22 new tests | Java | C | Python | Java |
| Documentation | Extensive | Extended with assessment/research | Y | Y | Y | Y |
| License | MIT | MIT | Apache-2.0 | LGPL/GPL mix | BSD-2 | Apache-2.0 |
| Integration feasibility | Native | Native | Already done | Partial | High cost | Already done |

## Decisions

| Capability | Action | Why |
| --- | --- | --- |
| Investigation project + reports | **Integrated** | Highest-value gap; no license conflict |
| Optional AI interface | **Integrated** | Requested; default off; no secrets in repo |
| Ghidra/Hopper/IDA/Kuna/JADX/Frida | **Keep as backends** | Already implemented |
| Rizin/Cutter/objdump/GDB | **Keep as backends** | Already implemented |
| angr | **Deferred** | Heavy Python stack, not in current architecture |
| FLOSS | **Deferred** | Useful later as BYO string engine |
| RetDec | **Deferred** | Limited maintenance |
| MobSF | **Rejected** | Separate GPL product, poor fit as a library |
| Plugin code loading | **Rejected for now** | Untrusted code risk; metadata validation is enough |
| Automatic dynamic execution | **Rejected** | Safety requirement |

See [INTEGRATION_MATRIX.md](INTEGRATION_MATRIX.md) for interfaces and
[roadmap.md](roadmap.md) for priorities.
