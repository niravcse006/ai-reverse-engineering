# Benchmarks

No accuracy or performance numbers are claimed without ground truth.

## What was measured in this workspace

| Measurement                              | Result                                        | How                                                                 |
| ---------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| New domain/service tests                 | 21 passed in 574 ms                           | `vitest run --project domain --project services` on 2026-10-29      |
| CLI adapter test                         | 1 passed in 147 ms (13.02 s including import) | `vitest run --project adapters src/cliInvestigationProject.test.ts` |
| npm audit after install                  | 0 vulnerabilities reported                    | `npm install --ignore-scripts`                                      |
| Function identification precision/recall | Not measured                                  | No labeled corpus was run                                           |
| Call-graph accuracy                      | Not measured                                  | Project workflow does not build call graphs                         |
| Finding precision/recall                 | Not measured                                  | Findings are observations, not scored detections                    |
| Memory / token usage                     | Not measured beyond Vitest durations          | No production AI call was made                                      |

## Representative fixtures

Tests generate minimal ELF headers from `src/domain/binaryTarget.fixture.ts`.
Those fixtures are parser-sized, not real applications.

## Reproducibility

Record target SHA-256, workflow version `1.0.0`, backend versions when known,
and configuration in the job `cache_key`. Do not reuse a cached job if those
inputs changed.
