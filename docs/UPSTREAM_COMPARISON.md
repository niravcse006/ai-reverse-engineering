# Upstream comparison

Current comparison, including upstream `main` `01e00da`: [FINAL_AUDIT.md](FINAL_AUDIT.md).

Compared on 2026-10-29 without overwriting this repository.

| Side | Value |
| --- | --- |
| This repository | https://github.com/niravcse006/ai-reverse-engineering @ `092a2aa` plus later local investigation fixes |
| Imported snapshot | `17ceb77ca5f2632faab8de01da4babff680eac48` (REA 6.8.0) |
| Upstream reference | https://github.com/morluto/rea @ `d3ecf6800015f2183a298d78ffb30a266a9efd2a` |
| Comparison method | GitHub compare API `17ceb77...d3ecf68` and a temporary tarball under `/tmp/rea-upstream/` |

## Identity

| Field | This fork (current) | Upstream |
| --- | --- | --- |
| `package.json` name | `rea-agents` | `rea-agents` |
| `mcpName` | `io.github.morluto/rea` | `io.github.morluto/rea` |
| Binaries | `rea`, `rea-agents` | `rea`, `rea-agents` |
| Homepage / bugs | niravcse006/ai-reverse-engineering | morluto/rea |

These runtime identifiers were **not** renamed. A registry/MCP rename would break
`npx rea-agents`, existing agent configs, and the published 6.8.0 name. See
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md#package-identity).

## Upstream commits not present as git history

This checkout is a snapshot plus local commits, not a clone with shared objects.
The following upstream `main` commits after `17ceb77` are absent:

| Commit | Subject | Status here |
| --- | --- | --- |
| `c88e1b0` | feat(guidance): search installed workflow sections | **Missing.** `GuidanceAccess.ts` and `guidance` CLI are not in this tree. |
| `131fbe0` | feat(environment): serve writes whose calls send different members | **Missing.** Varied-call environment files are not in this tree. |
| `3503578` | fix(session): preserve cancellation during mutation retirement | **Regressed relative to upstream.** `BinarySession.ts` differs (152-line diff). Not ported in this increment. |
| `bd37925` | docs(skill): clarify scenario pause deadlines | **Missing** skill-doc tweak. |
| `f7cd4e5` | fix(adb): validate screen capture PNG headers | **Ported.** `AdbProvider` now uses `readPngHeaderDimensions`. |
| `2b85a4a` | fix(native): preserve bookmark address uncertainty | **Not ported.** Needs the matching native tests. |
| `e3d8d20` | fix(native): preserve dispatch metadata format refusals | **Not ported.** Needs the matching native tests. |
| `d3ecf68` | docs(website): clarify platform setup requirements | **Not applicable** to this product README. |

## Fork-only additions

Present here, absent from upstream `d3ecf68`:

- `src/domain/investigationProject.ts` and related report/AI/plugin/format files
- `src/application/investigationProject/*`
- `src/cli/investigationProjectCommands.ts`
- Investigation CLI names in `src/cliCommandNames.ts`
- Product README for this GitHub repository

## Test comparison

| Suite | This workspace |
| --- | --- |
| Investigation-layer source tests after this increment | 15 passed (`Workflow`, report, AI contract, remaining workflows, CLI adapter) plus earlier format/project/pngHeader tests |
| Full `npm test` / `check:pr` | Not run |
| Real Ghidra / IDA / Hopper / JADX | Not run |
| Upstream guidance / environment / BinarySession tests | Not run; those files are missing or diverged |

Do not treat this fork as newer or better than `morluto/rea` `main`.
