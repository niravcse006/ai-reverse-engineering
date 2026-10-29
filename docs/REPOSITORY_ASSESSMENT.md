# Repository assessment

Assessment date: 2026-10-29. Updated the same day after the investigation-report
increment. Current comparison: [UPSTREAM_COMPARISON.md](UPSTREAM_COMPARISON.md).

This working copy was created from the published GitHub archive of
[morluto/rea](https://github.com/morluto/rea) `main`. Git clone into a sibling
directory was blocked by the local sandbox, so the archive
`https://github.com/morluto/rea/archive/refs/heads/main.tar.gz` was extracted
instead.

## Recorded Git state

| Item | Value | Verification |
| --- | --- | --- |
| Upstream repository | https://github.com/morluto/rea | Fetched README, installation docs, and GitHub commit API |
| Upstream commit | `17ceb77ca5f2632faab8de01da4babff680eac48` | GitHub commits API for `main` |
| Upstream commit date | 2026-10-29T07:39:10Z | Same API response |
| Upstream subject | `fix(mcp): preserve input validation issue attribution (#7981)` | Same API response |
| Published package | `rea-agents@6.8.0` | `package.json` and `src/generatedPackageMetadata.ts` |
| Local repository | `/Users/niravsoni/Projects/rea` | Created with an empty `main` branch, then populated from the archive |
| Local HEAD | none at import time | `git log` reported no commits |
| Working-tree origin | archive snapshot plus later local edits | No upstream `.git` history was imported |

## How the original application works

REA is a local CLI and MCP server. Agents call tools; REA does not call an LLM
in production. CLI and MCP share one composition root.

Verified from source:

- Entry: `scripts/rea.mjs` → `src/main.ts` / `src/cli.ts`
- Domain contracts live in `src/domain/` (Evidence, formats, errors, provider selection)
- Application workflows live in `src/application/`
- Deep engines implement `AnalysisProvider` and are wired in `src/composition/binary.ts`
- MCP registration lives in `src/server/`
- Evidence identity is a digest of semantic content (`src/domain/evidence.ts`)

### Component relationships

```text
CLI / MCP
    ↓
composition factories
    ↓
application workflows (BinarySession, Evidence ledger, setup/doctor)
    ↓
engine adapters (ghidra, hopper, ida, kuna, android, frida, ...)
    ↓
owned processes, private runtimes, bounded I/O
```

The published layer map is `docs/architecture.mermaid`.

## Current functionality

Verified by reading implementation, not only README claims:

- Native header admission for ELF, Mach-O, PE, and DOS MZ (`src/domain/binaryTarget.ts`)
- Artifact inventory for ZIP families, ASAR, firmware, model artifacts, and more
- Deep providers: Hopper, Ghidra, IDA, Kuna
- Auxiliary/optional: JADX, apktool, Cutter, Rizin, objdump, GDB, Frida, JEB MCP, browser/Electron observation
- JavaScript/Electron static analysis with no native engine
- Evidence bundles, analysis snapshots, guided workflow prompts
- Setup/doctor/update for agent MCP registration
- Extensive Vitest suite (`tests/`, colocated `src/**/*.test.ts`)

Not present in the original tree:

- A named investigation project / job-history store. `src/cli/projectCliAnalysisResult.ts` only remaps CLI error field names.
- An in-process LLM client
- A third-party plugin loader
- A dedicated investigation report builder beyond CLI formatters and analysis views
- angr

## Dependencies

- Runtime: Node `^22.23.4 \|\| ^24.22.1 \|\| >=26.12.1` (`package.json`, `.nvmrc` is `24.22.1`)
- Package manager: npm 11 is declared; Node 22.23.4 was used here with npm 10.9.9
- Core libraries: Zod, Incur, MCP SDK, Pino, Playwright core, zip.js, and others listed in `package.json`
- Optional: `frida@17.23.2`
- External engines are BYO. Missing tools must be reported, not assumed.

This environment at assessment time:

| Tool | Result |
| --- | --- |
| Node 22.23.4 via nvm | Available and used |
| Default shell Node | 18.20.8, below REA's engines range |
| Ghidra, radare2, rizin | Not on PATH |
| Python 3.9.6 | Present; used by some bridge tests when invoked |

## Test baseline

Commands that were actually executed in this workspace:

1. `npm install --ignore-scripts` with Node 22.23.4 — succeeded (730 packages, 0 known vulnerabilities reported by npm).
2. New investigation-layer tests — 21 passed. See [TESTING.md](TESTING.md).
3. CLI adapter test `src/cliInvestigationProject.test.ts` — passed.
4. The complete upstream `npm test` / `npm run check` suite was **not** executed. It requires a full compile, generated catalogs, and substantial time/memory. Do not treat that suite as verified here.

A representative existing domain test file, `src/domain/binaryTarget.test.ts`, was used as a fixture source and remains the parser baseline for ELF/PE/Mach-O detection.

## Strengths

- Strict Evidence and error contracts
- Process ownership and private runtime roots
- Deterministic provider selection with no silent fallback
- Format-specific readers instead of one universal parser
- Agent-skill publication and MCP schema budgets
- Real-toolchain verification lanes documented in `docs/testing.md`

## Technical debt and gaps addressed here

| Gap | Decision |
| --- | --- |
| No project/job persistence | Added `src/application/investigationProject/` |
| No report dossier | Added Markdown/JSON investigation reports |
| AI lives only outside REA | Added an optional, disabled-by-default provider interface |
| Plugin ABI | Rejected a loader; added metadata validation only |
| angr / FLOSS / RetDec / MobSF | Documented; not vendored |

## Features that must remain unchanged

- MCP tool contracts and Evidence digest identity
- Existing CLI command names and one-shot process model
- Fail-closed configuration and NUL rejection
- Explicit authorization for Hopper install and dynamic/runtime tools
- License and third-party notices

## Recommended next improvements

See [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md). Highest remaining
P0 work is importing the 8 upstream commits after snapshot `17ceb77`, then
regenerating catalogs and running the upstream test suite on Node 22+. Do not
declare this fork superior until that comparison and those tests exist.
