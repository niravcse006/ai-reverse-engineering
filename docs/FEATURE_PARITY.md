# Feature parity

> **Historical.** Use [UPSTREAM_PARITY.md](UPSTREAM_PARITY.md) for the current
> pinned comparison. This page kept older wording and is not the live matrix.

Current comparison, including Mach-O encryption and Linux process-ownership on upstream `main`: [FINAL_AUDIT.md](FINAL_AUDIT.md).

Statuses use the required vocabulary. File paths are the evidence for each row.

| Feature | Status | This tree | Upstream | Tests |
| --- | --- | --- | --- | --- |
| CLI one-shot commands (inspect/analyze/decompile and family inspectors) | Implemented but not yet verified | `src/cli.ts`, `src/cliCommandNames.ts` | Same snapshot plus later `guidance` | Upstream suite not run here |
| MCP server | Implemented but not yet verified | `src/server/`, `scripts/rea.mjs mcp` | Same | MCP boundary suite not run in this increment |
| Evidence contract | Implemented but not yet verified | `src/domain/evidence.ts` | Same | Existing Evidence tests not re-run here |
| Hopper / Ghidra / IDA / Kuna adapters | Implemented but not yet verified | `src/hopper`, `src/ghidra`, `src/ida`, `src/kuna` | Same | Real-provider lanes not run |
| JADX / apktool / Frida / Rizin / objdump / GDB | Implemented but not yet verified | matching `src/*` adapters | Same | Not run |
| ADB screencap PNG header check | Implemented and verified at source | `src/adb/AdbProvider.ts` uses `src/domain/pngHeader.ts` | `f7cd4e5` | `src/domain/pngHeader.test.ts` (16 passed). Full `AdbProvider.test.ts` not re-run |
| Guidance search (`rea guidance`) | Missing | — | `src/application/GuidanceAccess.ts`, `src/cli/guidanceCommands.ts` | — |
| Environment varied-member writes | Missing | — | `src/application/environment/environmentStateVariedCallsAnswer.test.ts` | — |
| BinarySession cancellation-during-retirement | Regressed relative to upstream | `src/application/binary/BinarySession.ts` older | `3503578` | Not ported |
| Native bookmark / dispatch fixes | Regressed relative to upstream | older native files | `2b85a4a`, `e3d8d20` | Not ported |
| Investigation projects | Implemented and verified | `src/application/investigationProject/` | Not applicable | `Workflow.test.ts`, `cliInvestigationProject.test.ts` |
| Duplicate target reuse | Implemented and verified | `ProjectStore.addProjectTarget` | Not applicable | `Workflow.test.ts` |
| Completed-job cache reuse | Implemented and verified | `findReusableCompletedJob` | Not applicable | `Workflow.test.ts` |
| Corrupted `project.json` | Implemented and verified | `loadInvestigationProject` | Not applicable | `Workflow.test.ts` |
| Remaining-workflow listing | Implemented and verified | `RemainingWorkflows.ts` | Not applicable | `RemainingWorkflows.test.ts` |
| Report provenance + AI disclosure | Implemented and verified | `investigationReport.ts`, `aiProviderContract.ts` | Not applicable | report + AI contract tests |
| Optional `REA_AI_*` | Partially implemented | `AiProvider.ts`; live HTTP untested | External agent via MCP | Unit tests only; no live provider |
| angr | Missing | Probe reports unavailable | Also not a core provider | Probe test |
| Plugin code loading | Not applicable | Metadata only, by design | Skills + bridges, not a JS plugin host | `pluginContract` tests |
| Package rename to a new npm name | Blocked | Keep `rea-agents` | `rea-agents` | Rename would collide with or impersonate the official package |

## Intentional differences

- This repository’s README describes the fork, not rea.tools marketing.
- Investigation-project commands are additive and do not replace `inspect` / `analyze`.
- `analyze-project` never launches the target or a deep engine.
