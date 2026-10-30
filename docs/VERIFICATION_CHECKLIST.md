# Implementation and verification checklist

> **Historical scorecard.** Current evidence is [FINAL_AUDIT.md](FINAL_AUDIT.md)
> and [UPSTREAM_PARITY.md](UPSTREAM_PARITY.md).

Date observed: 2026-10-29.
This document is a plan and scorecard. It is not a claim that this fork is
better than [morluto/rea](https://github.com/morluto/rea).

Legend for **Status**:

- **Pass** — implemented here and checked in this workspace
- **Partial** — code exists; required outcome is incomplete or unverified
- **Gap** — missing, weaker than the required outcome, or not run
- **Blocked** — needs a maintainer scope decision or a real backend

## Baseline (observed)

| Item                                  | Value                                                  | Kind                             |
| ------------------------------------- | ------------------------------------------------------ | -------------------------------- |
| This repository                       | https://github.com/niravcse006/ai-reverse-engineering  | Observation                      |
| This HEAD                             | `3c0b9b388fc12b34b896b284a41dae088e1b3556`             | Observation                      |
| Snapshot imported from upstream       | `17ceb77ca5f2632faab8de01da4babff680eac48` (REA 6.8.0) | Observation                      |
| Upstream `main` on 2026-10-29         | `d3ecf6800015f2183a298d78ffb30a266a9efd2a`             | Observation (GitHub compare API) |
| Upstream vs snapshot                  | 8 commits / 107 files ahead; 0 behind                  | Observation                      |
| Full `npm test` / `npm run check:pr`  | Not executed in this workspace                         | Observation                      |
| Real Ghidra / IDA / Hopper / JADX run | Not executed in this workspace                         | Observation                      |
| Live `REA_AI_*` HTTP call             | Not executed in this workspace                         | Observation                      |

### Upstream commits not in this tree

Recorded from `17ceb77...morluto/rea@main`:

| Commit    | Subject                                                            |
| --------- | ------------------------------------------------------------------ |
| `c88e1b0` | feat(guidance): search installed workflow sections                 |
| `131fbe0` | feat(environment): serve writes whose calls send different members |
| `3503578` | fix(session): preserve cancellation during mutation retirement     |
| `bd37925` | docs(skill): clarify scenario pause deadlines                      |
| `f7cd4e5` | fix(adb): validate screen capture PNG headers                      |
| `2b85a4a` | fix(native): preserve bookmark address uncertainty                 |
| `e3d8d20` | fix(native): preserve dispatch metadata format refusals            |
| `d3ecf68` | docs(website): clarify platform setup requirements                 |

Additive work that exists only here: investigation projects, format-registry
facade, backend probe used by those projects, optional `REA_AI_*` client,
Markdown/JSON investigation reports, and this repository's product README.

## Verdict

Do not declare this repository superior to upstream. The snapshot is behind
current `morluto/rea` `main`. New project commands are additive and covered by
a small local test set. The original CLI/MCP suite and real analysis engines
were not re-verified here.

The goal is tested capabilities, safer workflows, and clearer usability—not a
longer feature list.

## P0 — required before any superiority claim

| ID   | Area                      | Required outcome                                                                                   | Status  | Evidence                                                                                                                                                                                                                               | Acceptance criteria                                                                                                                                                                                               | Next increment                                                                                                      |
| ---- | ------------------------- | -------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| P0-1 | Upstream parity           | Compare this tree to `morluto/rea`; list missing features and regressions                          | Partial | GitHub compare `17ceb77...d3ecf68` is 8 commits / 107 files ahead. Those commits are not merged here.                                                                                                                                  | `git merge` or cherry-pick of the 8 commits, or a written skip with reason. Focused tests for guidance, environment writes, session cancellation, ADB PNG, and native bookmark/dispatch.                          | Import the 8 commits in a dedicated branch. Do not rewrite Evidence or CLI names while merging.                     |
| P0-2 | Multi-engine architecture | Standard interfaces for Ghidra, IDA, and other backends; graceful when tools are missing           | Partial | `AnalysisProvider` / `AnalysisProviderCandidate` in `src/application/AnalysisProvider.ts`. Project probe in `src/application/investigationProject/BackendProbe.ts` uses PATH/config only. Silent deep-provider fallback is disallowed. | `rea providers` and `analyze-project` still succeed when Ghidra/IDA/Hopper are unset. Deep commands fail closed with a usable reason. No silent provider swap.                                                    | Keep the existing interface. Do not add another engine until P0-1 and real-provider lanes exist.                    |
| P0-3 | Evidence-first AI         | Every important conclusion traces to functions, addresses, strings, call graphs, or other evidence | Partial | Upstream Evidence remains the native/JS/Android contract. Project findings carry `evidence_ids`. `analyze-project` currently records hash, format, and bounded strings—not functions, addresses, or call graphs.                       | Project reports that cite decompiled functions or call graphs must reuse existing `inspect` / `analyze` / `decompile` Evidence, not free-text AI. AI notes must keep `verified: false` and refuse exploitability. | Wire selected existing analysis-view / inspect results into the job receipt. Do not invent a second evidence model. |
| P0-4 | Security and privacy      | Local-first analysis, safe untrusted-file handling, explicit disclosure before external AI         | Partial | Project workflow does not execute the target. AI defaults to `none`. Keys stay in the environment. `wrapUntrustedTargetContent` labels recovered bytes. No interactive “about to send N bytes to provider X” prompt exists.            | `analyze-project` never launches the target. External AI runs only after a recorded operator choice (config or prompt) that names provider, endpoint, and byte budget. Keys never appear in reports.              | Add a disclosure record to the job before `interpretEvidenceWithAi`. Keep fetch injection explicit.                 |

## P1 — high value after P0

| ID   | Area                     | Required outcome                                                                | Status  | Evidence                                                                                                                                                           | Acceptance criteria                                                                                                                                | Next increment                                                                                                                 |
| ---- | ------------------------ | ------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| P1-1 | Artifact coverage        | Native, Android, Electron, web, firmware, archives where appropriate            | Partial | Those families already have dedicated CLI/MCP commands from the snapshot. `analyze-project` uses an 8 KiB header registry and does not call those commands.        | A project can import each family and either run the existing family command or report “use command X; project workflow is header-only.”            | Document the hand-off per family. Optionally attach one existing inspect result to the job. Do not duplicate parsers.          |
| P1-2 | Automated reconstruction | Reviewable drafts, types, symbol maps, and tests with confidence and provenance | Gap     | Reconstruction ledgers exist upstream. The project workflow does not emit code, types, maps, or tests.                                                             | Any generated draft cites Evidence ids, confidence, and “not original source.” No README claim that AI output equals the original program.         | Reuse `build-reconstruction-obligation-ledger` / coverage commands. Do not add a second reconstruction stack.                  |
| P1-3 | Setup and recovery       | Dependency diagnostics, install checks, config validation, resumable workflows  | Partial | `setup` and `doctor` exist. `resume-job` exists. Upstream added guidance search after the snapshot. Catalogs were not proven current after every local edit.       | `rea doctor` names missing Node, provider, and agent pieces. `resume-job` restores a failed static job. Generated catalogs match the compiled CLI. | After P0-1, run `npm run build:cached` and catalog checks. Add doctor output to project-status.                                |
| P1-4 | Automated testing        | Fixtures, regressions, backend integration, documented OS compatibility         | Partial | Large Vitest tree is present. New project tests passed earlier in this workspace. Full suite and real-provider lanes were not run here. No OS matrix was executed. | Record which commands actually ran, on which OS/Node, and what was skipped. Real Ghidra/IDA/Hopper claims require the lanes in `docs/testing.md`.  | Run `npm run test:local` on the project tests after each increment. Schedule `check:pr` and one real-provider lane separately. |

## P2 — documentation and performance

| ID   | Area          | Required outcome                                                                                           | Status  | Evidence                                                                                                                                                                | Acceptance criteria                                                                                                                                    | Next increment                                                                                    |
| ---- | ------------- | ---------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| P2-1 | Documentation | README, architecture, install, config, backend matrix, examples, troubleshooting, roadmap, responsible-use | Partial | Those pages exist. README now describes this repository. Roadmap still pointed at upstream trackers. This checklist is the current scorecard.                           | Docs match implemented commands. No 400k-star, Trendshift, or “better than REA” claims. Attribution to the snapshot remains.                           | Update docs only when a checked increment lands.                                                  |
| P2-2 | Performance   | Caching, resumable analysis, resource limits, controlled AI cost                                           | Partial | Upstream budgets and workers remain. Project probes 8–64 KiB. `REA_AI_SPENDING_LIMIT_USD` is recorded, not enforced. No production token/CPU/memory measurement exists. | Cache keys cover result-affecting inputs. AI calls honor a documented token/spend stop. Publish measurements only from completed representative tasks. | Enforce the spend/token stop in `AiProvider` before any live call. Do not add speculative caches. |

## Overlooked requirements

| ID  | Requirement                | Status        | Evidence                                                                                                                                                                                                                           | Acceptance criteria                                                                                                                                                                 |
| --- | -------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O-1 | Capability-based fallbacks | Partial       | Backend probe lists available/unavailable tools and `analyze-project` continues with builtin-static. It does not name the remaining deep commands (`inspect`, `decompile`, JADX, Frida) when Ghidra or IDA is missing.             | When a selected backend is unavailable, the report lists the workflows that still work and the exact command to run next. Failure of one optional tool is not a project failure.    |
| O-2 | Reproducible reports       | Partial       | Reports include timestamp, job id, target SHA-256, format diagnostic, backend availability, findings, and limitations. They omit host OS, Node version, backend tool versions, and AI model/endpoint metadata on the skipped path. | JSON/Markdown reports record tool versions when known, configuration used, timestamps, evidence ids, and AI provider/model when AI ran. Missing versions stay `unknown`, not empty. |
| O-3 | Honest quality metrics     | Pass (policy) | [BENCHMARKS.md](BENCHMARKS.md) refuses accuracy and performance numbers without ground truth. No fixture-scored precision/recall exists.                                                                                           | Do not publish reconstruction-equals-source claims. Any later benchmark must name fixture, OS, command, and unmeasured costs.                                                       |

## Implementation sequence

Work in this order. Each step is a small, testable increment. Do not start a
later step by adding a new engine or AI provider.

1. **Baseline freeze** — keep this document’s SHAs until P0-1 updates them.
2. **Parity import** — merge or cherry-pick the 8 upstream commits; run the
   focused tests that belong to those commits.
3. **Capability fallback copy** — extend `analyze-project` / `project-status`
   with remaining-workflow text (O-1). No new backends.
4. **Report provenance** — add Node, OS, and known tool versions to the report
   schema (O-2). Update report tests.
5. **AI disclosure record** — persist provider, endpoint host, byte budget, and
   operator choice before any fetch (P0-4).
6. **Evidence hand-off** — optional attach of one existing inspect/decompile
   Evidence id onto a job (P0-3, P1-1). Reuse owners; do not reparse.
7. **Verification lanes** — run project tests on every increment; run
   `check:pr` and one real-provider lane when a human owns that machine.
8. **Docs last** — README and this checklist change only to match what landed.

## Checks that were run for this document

| Check                                                                                    | Result                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------ |
| GitHub compare `17ceb77...morluto/rea@main`                                              | 8 commits, 107 files, ahead                |
| Local `git rev-parse HEAD`                                                               | `3c0b9b388fc12b34b896b284a41dae088e1b3556` |
| Read `AnalysisProvider`, `BackendProbe`, `Workflow`, `AiProvider`, `investigationReport` | Used for status ratings above              |
| Full upstream test suite                                                                 | Not run                                    |
| Real analysis backends                                                                   | Not run                                    |

Related pages: [FEATURE_COMPARISON.md](FEATURE_COMPARISON.md),
[INTEGRATION_MATRIX.md](INTEGRATION_MATRIX.md),
[REPOSITORY_ASSESSMENT.md](REPOSITORY_ASSESSMENT.md),
[BENCHMARKS.md](BENCHMARKS.md),
[roadmap.md](roadmap.md),
[testing.md](testing.md).
