# Investigation workflow

Date: 2026-10-30.

The owning description of storage and commands is
[INVESTIGATION_PROJECTS.md](INVESTIGATION_PROJECTS.md). This page records the
report contract and the Phase 3/4 gaps.

## Reports

`analyze-project` and `generate-report` write
`reports/{job_id}.json` and `reports/{job_id}.md` from
`InvestigationReport` (`schema: rea.investigation-report.v1`).

The JSON includes project name, job, target identity and SHA-256, format
detection, backend probe, findings classified `observed` / `derived` /
`inferred`, limitations, host provenance, and optional AI disclosure. AI text
is not stored as an observed fact.

HTML, PDF, CSV, timeline, version-diff, and evidence-only exports are **not
implemented**.

Evidence receipts also persist under `evidence/` (see `ProjectStore`).

## Not implemented

Project backup/restore and versioning, multi-algorithm hashes, evidence search
index, hypothesis store, concurrent scheduler. Sequencing:
[IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md) Phase 3–4.
