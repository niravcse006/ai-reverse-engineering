# REA roadmap

The [platform tracker](https://github.com/morluto/rea/issues/32),
[process/Hopper tracker](https://github.com/morluto/rea/issues/48), and
[browser tracker](https://github.com/morluto/rea/issues/39) track capability and
verification work. Available tools and setup are documented in the
[investigation guides](https://rea.tools/guides/),
[installation guide](installation.md), and
[generated catalog](mcp-contracts.md#generated-catalog).

This working copy adds a local investigation-project track. Priorities below
include that track and the original upstream work.

## Working-copy priorities

### P0 — essential (in progress / remaining)

| Item | Status | Acceptance | Dependencies | Risks |
| --- | --- | --- | --- | --- |
| Preserve upstream CLI/MCP/Evidence | Preserved | Existing commands still registered | None | Catalog generators not rerun |
| Investigation project + static workflow | Implemented | `analyze-project` writes reports; tests pass | Node 22+ | Full upstream suite not run here |
| Format diagnostics for empty/unknown | Implemented | Tests cover empty, ELF, PE, ZIP, WASM, JS | Domain parsers | Header-only probe |
| Backend unavailable reporting | Implemented | angr/Ghidra report unavailable when missing | PATH/env | Probe does not execute tools |
| Security docs and no auto-exec | Implemented | Dynamic stage skipped without authorization | None | Residual same-user process risk |
| Regenerate catalogs after compile | Remaining | `npm run metadata:check` and docs checks pass | `npm run compile` | Large build |

### P1 — high value

- Wire `--snapshot` / Evidence-bundle export into project job receipts.
- Live AI provider tests against a local Ollama fixture, not the public internet.
- Decompile/function pages through existing analysis-view commands.

### P2 — advanced

- FLOSS as an optional string backend.
- Richer PE/ELF import tables inside the project workflow (reuse existing inspectors).
- Authorized dynamic job stage that only records the dedicated command to run.

### P3 — experimental

- angr worker.
- RetDec worker.
- In-process plugin sandbox.

## Upstream priorities

- Expand native architecture, type, and indirect-call verification.
- Connect static findings and runtime observations across application layers.
- Improve obfuscated managed-code comparisons and verified native links.
- Extend process, protocol, filesystem, reconnect, and build-comparison coverage.
- Evaluate additional providers and targets when an analyst workflow demonstrates
  a capability gap.

## Admission criteria

New capabilities must return useful evidence through shared CLI/MCP workflows,
preserve observations and unknowns, and declare actual authority and lifecycle
constraints. Agents compose experiments using ordinary commands, scripts, and
fixture servers; custom orchestration needs a demonstrated requirement.

Provider and platform claims require their corresponding
[real verification lanes](testing.md#real-toolchain-verification-lanes).
See [tool design](tool-design.md) for choosing a tool boundary and
[Ghidra semantics](ghidra-provider.md) for the existing deep-provider contract.

Setup remains additive, reuses existing tools, and requires approval for disclosed
configuration and Hopper installation changes. Additional installer choices need
an implemented toolchain and explicit scope; setup does not install or upgrade
unrelated runtimes or dependencies.
