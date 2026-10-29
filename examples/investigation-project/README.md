# Investigation project example

Safe, synthetic inputs only. The ELF bytes are a parser header plus the ASCII
string `HelloREA`. They are not a real program and are never executed.

## Prerequisites

- Node 22.23.4 or 24.22.1 from this repository's engine range
- Dependencies installed (`npm install`)
- No Ghidra/Hopper required

## Commands

These match the CLI adapter test. After a full build they can be run as
`node scripts/rea.mjs ...`.

```text
rea init-project ./demo-project --name example --json
rea import-target ./sample.so --project ./demo-project --json
rea inspect-target ./sample.so --project ./demo-project --json
rea analyze-project --project ./demo-project --target tgt_... --json
rea project-status --project ./demo-project --json
```

Create `sample.so` with the ELF fixture used in tests, or copy any file you are
authorized to inspect.

Expected results:

- Format `elf` or the registry diagnostic for your file
- A Markdown report under `demo-project/reports/`
- `angr` listed unavailable unless you later add that backend
- No process launch of the target

Related examples already in this repository:

- JavaScript/Electron notes app: `website/public/examples/notes-electron/`
- GitHub Actions analysis: `examples/github-actions/rea-analysis.yml`
