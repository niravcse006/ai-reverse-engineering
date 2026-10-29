# Troubleshooting

## Node version errors

REA requires `^22.23.4 || ^24.22.1 || >=26.12.1`. This machine's default
`node` was 18.20.8. Use:

```text
nvm use 22.23.4
```

`.nvmrc` pins `24.22.1` for the published package; 22.23.4 is accepted by
`engines`.

## `init-project` or `analyze-project` is unknown

The packaged `rea` from npm 6.8.0 does not include these commands until this
working copy is built and installed. Run them from this checkout through the
source CLI (as the adapter test does) or after `npm run build`.

## Empty file refused

`import-target` rejects zero-byte files. That is intentional.

## Backend listed as unavailable

`project-status` probes PATH and environment only. Install Ghidra/Hopper/JADX
and set the absolute path variables. The workflow still completes using
built-in static inspection.

## AI did nothing

`REA_AI_PROVIDER` defaults to `none`. Missing keys or endpoints are reported
as unavailable. This is not a silent success.

## Generated catalog checks fail

Adding CLI commands changes `CLI_COMMAND_NAMES`. After a full compile, rerun
the catalog generators. This workspace did not rerun those generators.

## Upstream `npm test` is slow or needs dist/

Use the focused investigation tests first. The complete suite needs
`test:prepare` artifacts and a large Vitest run.

More recovery steps for agent setup live in [installation.md](installation.md).
