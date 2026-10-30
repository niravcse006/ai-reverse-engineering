# Test coverage comparison

Date: 2026-10-30.
Live feature statuses: [UPSTREAM_PARITY.md](UPSTREAM_PARITY.md).

This is a file-count inventory, not a coverage or mutation scorecard.

| Measure                                             | This tree `1fa7049`                             | Upstream `b1ff7cd`          | Notes                              |
| --------------------------------------------------- | ----------------------------------------------- | --------------------------- | ---------------------------------- |
| `*.test.ts` / `*.test.mts` files                    | 2830                                            | 2872                        | Excludes `node_modules` and `dist` |
| Investigation-project tests                         | Present (`Workflow`, `RemainingWorkflows`, CLI) | Absent                      | Fork-only                          |
| Guidance / Bun standalone / Mach-O encryption tests | Guidance present; Bun/Mach-O encryption absent  | Present                     | Guidance ported this increment     |
| Statement / branch / function coverage %            | Not measured this increment                     | Not measured this increment | Do not invent percentages          |
| Mutation score                                      | Not measured this increment                     | Not measured this increment | Use later on critical modules      |
| Cross-platform live engines                         | Documented as BYO; not run here                 | Same model                  | Hopper/Ghidra/IDA remain unproven  |

Do not treat 2830 vs 2872 as quality. Upstream added tests with the 56-commit
gap. This tree added investigation and CI-regression tests and has not ported
those suites.

A later increment may record `npm run test:fast` totals and a focused mutation
run. Until those commands are executed, this document must not claim better
coverage than upstream.
