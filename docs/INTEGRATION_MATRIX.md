# Integration matrix

How candidate tools relate to this working copy.

| Tool | Decision | Interface | Mandatory? | License fit | Complexity | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Built-in static inspect | Integrated | `formatRegistry` + workflow | Yes | MIT | Done | Hash, magic, strings |
| Investigation project | Integrated | `ProjectStore` / CLI | No, additive | MIT | Done | Does not replace snapshots |
| Ghidra | External backend | Existing `src/ghidra` | No | Apache-2.0 | Already done | Needs `GHIDRA_INSTALL_DIR` |
| Hopper | External backend | Existing `src/hopper` | No | Proprietary | Already done | Needs licensed install |
| IDA | External backend | Existing `src/ida` | No | Proprietary | Already done | Read-only MCP |
| Kuna | External backend | Existing `src/kuna` | No | Caller license | Already done | BYO CLI |
| JADX | External backend | Existing `src/android` | No | Apache-2.0 | Already done | Android/DEX |
| apktool | External backend | Existing apktool commands | No | Apache-2.0 | Already done | Resources |
| Rizin | External backend | Existing `src/rizin` | No | LGPL-3.0 | Already done | Commands can execute foreign code |
| Cutter | External backend | Live Python bridge | No | GPL-3.0 GUI | Already done | Requires open Cutter |
| radare2 | Probe only | PATH `r2` | No | LGPL + plugin mix | Low | Not a deep provider |
| Frida | External backend | Existing `src/frida` | No | wxWindows / LGPL family | Already done | Explicit instrumentation commands |
| objdump / GDB | External backend | Existing reverse-engineering commands | No | Host toolchain | Already done | BYO |
| OpenAI-compatible / Anthropic / Ollama | Optional AI | `REA_AI_*` + fetch | No | Caller ToS | Done (offline-safe) | No live provider tested here |
| angr | Deferred | Would be a Python worker | No | BSD-2 | High | Not implemented |
| FLOSS | Deferred | Would be BYO CLI | No | Apache-2.0 | Medium | Not implemented |
| RetDec | Deferred | Would be BYO CLI | No | MIT, limited maintenance | High | Not implemented |
| MobSF | Rejected | n/a | No | GPL-3.0 (docs repo) | High | Separate product |
| JEB | External backend | Existing MCP client | No | Proprietary | Already done | Caller endpoint |

## Compatibility with existing REA architecture

Allowed integration shapes:

1. Domain-pure helpers (format, report, plugin schema).
2. Application workflows that persist files and probe PATH.
3. Existing `AnalysisProviderCandidate` for another deep engine.
4. New `register*Tools.ts` + composition factory for a specialized reader.

Disallowed shapes for this increment:

- Silent fallback from one deep provider to another.
- Loading third-party JavaScript/Python plugins in-process.
- Executing the target during `inspect-target` or `analyze-project`.
- Shipping proprietary engines or license keys.
