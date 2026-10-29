# Architecture

This document describes the architecture as implemented in this working copy.
The original layer map remains in [architecture.mermaid](architecture.mermaid).

## Design rules

- Domain and contracts are pure. They do not construct providers or touch the
  network.
- Application modules may use the filesystem and process environment.
- Composition is the only production wiring layer.
- CLI and MCP call the same application workflows.
- Missing optional backends are reported, not fatal, unless the selected
  command requires that backend.

## Original architecture

```text
src/domain          Evidence, formats, errors, snapshots
src/contracts       MCP/CLI JSON schemas
src/config          Zod environment → AppConfig
src/application     Sessions, setup, doctor, investigations
src/composition     Factories shared by CLI and MCP
src/server          MCP translation
src/cli.ts          One-shot Incur CLI
src/{ghidra,hopper,ida,kuna,android,frida,...}   Engine adapters
src/process         Owned processes and resource limits
```

## Added investigation-project architecture

```text
src/domain/investigationProject.ts     project/job/finding schemas
src/domain/formatRegistry.ts           magic + name detection
src/domain/pluginContract.ts           untrusted plugin metadata
src/domain/aiProviderContract.ts       provider-neutral AI types
src/domain/investigationReport.ts      JSON/Markdown renderers

src/application/investigationProject/ProjectStore.ts
src/application/investigationProject/BackendProbe.ts
src/application/investigationProject/AiProvider.ts
src/application/investigationProject/Workflow.ts
src/application/investigationProject/ReportWriter.ts

src/cli/investigationProjectCommands.ts
```

### A. Project manager

`ProjectStore` creates a directory with `project.json`, `targets/`, `jobs/`,
`reports/`, and `plugins/`. It records hashes, job history, and report paths.
It does not replace analysis snapshots or Evidence bundles.

### B. Format registry

`detectRegisteredFormat` classifies a bounded prefix. It reuses
`parseExecutableHeader` and ZIP family helpers. Unsupported or empty inputs
return diagnostics instead of a fake format.

### C. Analysis backend interface

Existing `AnalysisProvider` remains the deep-engine contract. The new
`probeAnalysisBackends` adapter only checks configuration and PATH. It does
not launch Ghidra, Hopper, IDA, or Frida.

### D. AI provider interface

`parseAiProviderSettings` and `interpretEvidenceWithAi` read `REA_AI_*`.
No API key is hardcoded. Target content is wrapped as untrusted data.
Exploitability claims are rejected during response validation.

### E. Workflow orchestrator

`runInvestigationWorkflow` runs fixed stages: validate, hash, detect, probe,
static analysis, optional dynamic (skipped unless authorized, and still not
executed here), normalize, optional AI, report, persist. A failed stage keeps
earlier findings on disk.

### F. Plugin system

`validatePluginManifest` accepts metadata only. Entries cannot be absolute or
contain `..`. `trusted` must be `false`. Code is not loaded.

### G. Results and evidence manager

Findings carry `evidence_ids`, confidence, and a `verified` flag. Reports
preserve those links. This layer does not rewrite canonical Evidence records.

### H. Report generator

`renderInvestigationReportMarkdown` and `renderInvestigationReportJson` are
pure. `ReportWriter` writes them under `reports/` with atomic replaces.

## Data flow

1. `init-project` writes `project.json`.
2. `import-target` hashes and classifies a file or directory without executing it.
3. `analyze-project` runs the static workflow and writes reports.
4. `resume-job` reloads a job document and reruns remaining work.
5. Existing `inspect`, `analyze`, `decompile`, and MCP tools remain available
   for deep provider work.

## Security boundaries

See [SECURITY.md](SECURITY.md). Dynamic execution is never implied by
inspection. Archive members are not extracted during format detection.
