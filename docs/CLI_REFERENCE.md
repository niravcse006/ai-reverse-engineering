# CLI reference (investigation projects)

The complete upstream CLI remains documented in [cli.md](cli.md). This page
covers the additive project commands implemented in
`src/cli/investigationProjectCommands.ts`.

These command names were verified against `createCli()` in
`src/cliInvestigationProject.test.ts` on 2026-10-29.

## Prerequisites

- Node `^22.23.4 || ^24.22.1 || >=26.12.1`
- A local checkout with `npm install`
- Commands can be exercised through the source CLI used by tests, or through
  `node scripts/rea.mjs` after `npm run build`

## Commands

### `init-project`

Create `project.json`, `targets/`, `jobs/`, `reports/`, and `plugins/`.

```text
rea init-project /absolute/path/to/project --name demo --json
```

### `import-target`

Hash and classify a file or directory. The target is not executed.

```text
rea import-target /absolute/path/to/target --project /absolute/path/to/project --json
```

Empty files are rejected.

### `inspect-target`

Format detection, hash, and backend availability without creating a job.

```text
rea inspect-target /absolute/path/to/target --project /absolute/path/to/project --json
```

### `analyze-project`

Run the static workflow for an imported target id.

```text
rea analyze-project --project /absolute/path/to/project --target tgt_... --json
```

`--authorize-dynamic` only records later authorization. It does not launch the
target.

### `generate-report` / `resume-job`

Rewrite reports or rerun a stored job.

```text
rea generate-report --project /absolute/path/to/project --job job_... --json
rea resume-job --project /absolute/path/to/project --job job_... --json
```

### `project-status` / `list-plugins`

```text
rea project-status --project /absolute/path/to/project --json
rea list-plugins --project /absolute/path/to/project --json
```

`list-plugins` validates JSON manifests only.

## Exit behavior

Commands return structured JSON when `--json` is supplied. Failures use the
canonical Analysis error projection (`error: "Analysis failed"`). Cancellation
uses the shared CLI interrupt helper.

## Existing commands still preferred for deep work

- `rea inspect`, `rea analyze`, `rea decompile` — native providers
- `rea analyze-javascript-application` — JS/Electron
- `rea inspect-android-package` — APK/DEX
- `rea doctor` — readiness
