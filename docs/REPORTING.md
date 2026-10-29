# Reporting

Investigation reports are written by `writeInvestigationReports` from
`src/domain/investigationReport.ts`.

Schema: `rea.investigation-report.v1`.

## Fields that are always present after a successful `analyze-project`

- Target id, display name, SHA-256, format, architecture, size
- Job id, status, workflow version, cache key, stages
- Backend availability and reasons
- `remaining_workflows` (usable or not, with the next command)
- `provenance`: Node version, platform, arch, workflow version
- Findings with `evidence_ids`, `confidence`, and `verified`
- `ai_disclosure` (provider/host/bytes; never the API key)
- Limitations

## Finding classes

| Kind in the document | Meaning |
| --- | --- |
| `confidence: observed` and `verified: true` | Directly observed from headers, hashes, or scanned strings |
| `confidence: derived` / `inferred` | Computed from those observations |
| `ai` section | Interpretation. Not observed fact. `verified` on security notes is always `false` |

The renderer labels the AI section **AI interpretation (unverified)**.

## Reconstruction

This project workflow does **not** emit C/C++ drafts, symbol maps, or tests.
Those remain upstream reconstruction-ledger commands. Generated code elsewhere
must be treated as reconstructed, not original source, and not safe to run
without independent review.

## Regeneration

`generate-report` rewrites Markdown/JSON from a stored job. It does not re-hash
the target. If the file on disk changed, import it again.
