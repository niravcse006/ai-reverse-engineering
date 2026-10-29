<div align="center">

# AI Reverse Engineering

**Local CLI and MCP platform for binary analysis, decompilation, program understanding, and evidence-backed investigation.**

Inspect software you own or are authorized to examine. Work from the terminal or from a coding agent. Analysis stays on your machine.

[![GitHub repo](https://img.shields.io/badge/GitHub-niravcse006%2Fai--reverse--engineering-181717?style=flat-square&logo=github)](https://github.com/niravcse006/ai-reverse-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22.23.4%20%7C%2024.22.1%2B%20%7C%2026.12.1%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](docs/installation.md)
[![MCP tool catalog](https://img.shields.io/badge/MCP-tool_catalog-5c4ee5?style=flat-square)](docs/mcp-contracts.md#generated-catalog)
[![Issues](https://img.shields.io/github/issues/niravcse006/ai-reverse-engineering?style=flat-square)](https://github.com/niravcse006/ai-reverse-engineering/issues)
[![Last commit](https://img.shields.io/github/last-commit/niravcse006/ai-reverse-engineering?style=flat-square)](https://github.com/niravcse006/ai-reverse-engineering/commits/main)

`reverse engineering` · `binary analysis` · `decompiler` · `Ghidra` · `IDA` · `Hopper` · `MCP` · `static analysis` · `malware research`

[Quick start](#quick-start) · [Investigation projects](#investigation-projects) · [What you can analyze](#what-you-can-analyze) · [Architecture](#architecture) · [Verification](#verification) · [Documentation](#documentation)

</div>

## Why this repository

This checkout is **niravcse006/ai-reverse-engineering**. The public page, issues, and source of truth are here:

https://github.com/niravcse006/ai-reverse-engineering

It keeps the local reverse-engineering CLI and MCP server, then adds a project layer that this tree actually implements:

- persistent investigation projects (`project.json`, targets, jobs, reports, plugins)
- format detection and hashing before any deep engine starts
- backend availability probes (missing Ghidra, Hopper, IDA, or Frida is reported, not fatal)
- optional AI notes through `REA_AI_*` (off unless you configure them)
- Markdown and JSON reports with evidence identifiers

Deep native work still uses the existing `inspect`, `analyze`, and `decompile` commands. The project commands do not replace them.

## Quick start

Requires Node.js `^22.23.4 || ^24.22.1 || >=26.12.1` and npm.

```bash
git clone https://github.com/niravcse006/ai-reverse-engineering.git
cd ai-reverse-engineering
npm install
npm run build:cached
node scripts/rea.mjs --help
```

Register the MCP server with a supported agent after you review the planned file writes:

```bash
node scripts/rea.mjs setup
```

Setup supports [supported agents](docs/installation.md#supported-agents). Other clients can use [manual MCP registration](docs/installation.md#mcp-registry). The generated [tool catalog](docs/mcp-contracts.md#generated-catalog) lists CLI and MCP operations.

Optional global command (this tree still ships the `rea` / `rea-agents` binaries):

```bash
npm install --global .
rea doctor
```

## Investigation projects

Create a local project, import a file you are authorized to inspect, then produce a report. The target is hashed and classified. It is not executed.

```bash
node scripts/rea.mjs init-project /absolute/path/to/project --name demo --json
node scripts/rea.mjs import-target /absolute/path/to/target --project /absolute/path/to/project --json
node scripts/rea.mjs inspect-target /absolute/path/to/target --project /absolute/path/to/project --json
node scripts/rea.mjs analyze-project --project /absolute/path/to/project --target tgt_... --json
node scripts/rea.mjs generate-report --project /absolute/path/to/project --job job_... --json
node scripts/rea.mjs project-status --project /absolute/path/to/project --json
```

| Command | What it does |
| --- | --- |
| `init-project` | Creates `project.json`, `targets/`, `jobs/`, `reports/`, and `plugins/` |
| `import-target` | Records hash and format. Empty files are rejected |
| `inspect-target` | Format, hash, and backend availability without opening a job |
| `analyze-project` | Static workflow for an imported target id |
| `generate-report` / `resume-job` | Rewrite reports or rerun a stored job |
| `project-status` / `list-plugins` | Project summary; plugin JSON manifests only |

`--authorize-dynamic` only records later authorization. It does not launch the target. Plugin files are validated as metadata; this tree does not load plugin code.

A safe walkthrough lives in [examples/investigation-project](examples/investigation-project/README.md). Command details are in [CLI reference](docs/CLI_REFERENCE.md).

## Optional AI interpretation

Keep analysis offline by default:

```text
REA_AI_PROVIDER=none
```

To attach evidence-scoped notes, copy [`.env.example`](.env.example) to `.env` and set `REA_AI_PROVIDER`, `REA_AI_ENDPOINT`, and `REA_AI_MODEL`. Put `REA_AI_API_KEY` in the environment, not in git.

The client wraps recovered bytes as untrusted data and rejects exploitability claims. Live HTTP providers are implemented in code and are not treated as verified here. See [AI providers](docs/AI_PROVIDERS.md) and [configuration](docs/CONFIGURATION.md).

## What you can analyze

Use a backend only when the command needs it. Built-in readers work without Ghidra, Hopper, or IDA.

| Target | Typical commands | Notes |
| --- | --- | --- |
| Native binaries (ELF, PE, Mach-O) | `inspect`, `analyze`, `decompile`, `inspect-target` | Hopper, Ghidra, IDA, or Kuna for deep work |
| JavaScript / Electron | `analyze-javascript-application` | Static; no native engine required |
| .NET assemblies | `inspect-managed-artifact` | Static metadata and CIL |
| Android APK / DEX | `inspect-android-package`, `inspect-apk-signature` | JADX / Apktool when installed |
| Firmware, WASM, GPU objects, models | matching `inspect-*` commands | Built-in or caller-supplied tools |
| Web pages and HAR/SAZ captures | `inspect-web-page`, `inspect-web-network-capture` | Browser or saved capture |
| Process / Frida / GDB | dedicated commands | Opt-in only; not part of `analyze-project` |

Readiness:

```bash
node scripts/rea.mjs doctor
node scripts/rea.mjs providers
```

Provider setup: [installation](docs/installation.md), [backends](docs/BACKENDS.md), [native investigation](docs/native-investigation.md), [CLI](docs/cli.md).

## Architecture

```text
CLI / MCP
  → composition
    → application workflows and investigation projects
      → domain contracts (Evidence, formats, jobs, reports)
        → optional adapters (Ghidra, Hopper, IDA, Kuna, JADX, Frida)
```

Investigation-project modules in this tree:

- `src/domain/investigationProject.ts`, `formatRegistry.ts`, `pluginContract.ts`, `aiProviderContract.ts`, `investigationReport.ts`
- `src/application/investigationProject/` (`ProjectStore`, `BackendProbe`, `AiProvider`, `Workflow`, `ReportWriter`)
- `src/cli/investigationProjectCommands.ts`

Domain code does not launch engines or call the network. Missing optional backends stay unavailable instead of being treated as absent when the probe cannot prove that. See [architecture](docs/ARCHITECTURE.md).

## Status

| Capability | In this repository |
| --- | --- |
| CLI and MCP analysis from REA 6.8.0 | Present; use `rea --help` and the MCP catalog |
| Investigation projects and reports | Implemented and covered by project tests |
| Format detection, hashing, string scan | Implemented |
| Optional `REA_AI_*` notes | Implemented; live providers not verified here |
| Dynamic analysis inside `analyze-project` | Unsupported by design |
| angr symbolic execution | Not integrated |
| Third-party plugin code loading | Unsupported; metadata validation only |

## Verification

This repository is a working copy of REA 6.8.0 plus a local investigation-project
layer. It is **not** claimed to be better than [morluto/rea](https://github.com/morluto/rea).
On 2026-10-29 upstream `main` was 8 commits ahead of the imported snapshot.

The scorecard is [docs/VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md).
P0 work is parity, multi-engine interfaces, evidence-linked conclusions, and
local-first AI disclosure. New engines or a longer feature list are not next.

## Documentation

- [Verification checklist](docs/VERIFICATION_CHECKLIST.md)
- [Installation and agent setup](docs/installation.md)
- [CLI](docs/cli.md) and [investigation CLI](docs/CLI_REFERENCE.md)
- [MCP contracts](docs/mcp-contracts.md) and [tool catalog](docs/mcp-contracts.md#generated-catalog)
- [Configuration](docs/CONFIGURATION.md), [AI providers](docs/AI_PROVIDERS.md), [backends](docs/BACKENDS.md)
- [Architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), [troubleshooting](docs/TROUBLESHOOTING.md)
- [Repository assessment](docs/REPOSITORY_ASSESSMENT.md), [research](docs/RESEARCH_REPORT.md), [feature comparison](docs/FEATURE_COMPARISON.md)
- [Implementation report](docs/FINAL_IMPLEMENTATION_REPORT.md), [disclaimer](DISCLAIMER.md)

## Responsible use

Use this software for lawful research, education, interoperability, preservation, and analysis of software you own or are authorized to examine. Commercial engines (IDA, Hopper, JEB) are bring-your-own. This repository grants no vendor license.

Report security issues through [SECURITY.md](SECURITY.md).

## Attribution and license

[MIT](LICENSE). Copyright 2026 morluto and niravcse006.

CLI, MCP, Evidence, and provider workflows come from the [REA 6.8.0](https://github.com/morluto/rea) snapshot `17ceb77ca5f2632faab8de01da4babff680eac48`. This repository is not the official `rea-agents` npm publication or the rea.tools website. See [license and attribution](docs/LICENSE_AND_ATTRIBUTION.md) and [third-party notices](THIRD_PARTY_NOTICES.md).

Issues and pull requests for this checkout: https://github.com/niravcse006/ai-reverse-engineering
