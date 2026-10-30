# Implementation roadmap

Date: 2026-10-30.
Authority for live statuses: [UPSTREAM_PARITY.md](UPSTREAM_PARITY.md).
This plan does not authorize merging upstream or renaming the package.

Pinned upstream tip: `b1ff7cdacc03110d51bcac33da3cbb7850ac27fc` (ahead 56 of
snapshot `17ceb77ca5f2632faab8de01da4babff680eac48`).

## Rules

- Port by contract, not by copying trees.
- Skip commits that only change `rea.tools` docs, CI of `morluto/rea`, or
  skill-pause wording.
- Breaking contract commits stay behind a written migration note.
- Large admission/registry refactors need a maintainer scope decision before
  integration ([CONTRIBUTING.md](../CONTRIBUTING.md#contribution-scope)).
- Investigation architecture stays; do not replace it with upstream one-shot
  sessions.
- Do not publish, do not claim official `rea-agents`, do not auto-execute
  targets.

## Phase 1 — Exhaustive upstream parity (current)

**Done this increment:** fetch tip, CLI/MCP name diff, 56-commit classification,
test-file counts, six-category snapshot.

**Not done:** no relevant MISSING remaining. That is the Phase 1 exit criterion
and it is **open**.

### Port wave A — isolated, testable, non-breaking

Implement only when each item can keep Evidence, cancellation, and malformed
input ownership.

1. `rea guidance` + MCP guidance tools (`c88e1b0`) — **done this increment**;
   see [UPSTREAM_PARITY.md](UPSTREAM_PARITY.md).
2. Mach-O per-slice encryption (`860fdd8`).
3. Mach-O segment-name BOM preservation (`da5ec6b`).
4. Mach-O target selection for macOS tools (`c0c3902`).
5. Native appex/framework/XPC/plug-in directories (`37342ec`).
6. Undecodable symlink target bytes (`34577eb`).
7. ADB long-path push verification (`1da304b`).
8. Flattened framework `Info.plist` (`6d19649`).
9. Source-map empty `sourceRoot` (`24398a8`).
10. HAR browser-serialized request URLs (`c5f50e8`).
11. FIT leading U+FEFF (`d77104d`).
12. Apple XML plist decoder budget (`cce3314`).

### Port wave B — new artifact families

13. .NET single-file bundle inspect/extract (`22cab82`).
14. Bun standalone module graphs (`8188497`).

### Port wave C — breaking or cross-cutting (scope decision first)

15. Evidence publication limits (`bf115be`).
16. JS semantic-trace operator influence (`5c05eb8`).
17. Debugger cleanup typing + `REA_` session caps (`a108a1b`, `4a8d8f7`).
18. Environment write/MIME views (`131fbe0`, `51ad845`, `72039ec`).
19. CLI literal Markdown (`e124bdf`).
20. Typed admission/NativeAOT/Kuna/parser codes and family-id registration
    (`1c14f66`, `5f9187c`, `b894be6`, `317bf3f`, `395b598`, others).
21. Hopper-only caller/demo-dialog (`ec4a0a0`, `b1ff7cd`) — only with a Hopper
    host or recorded fixtures.

After each wave: `npm run test:focused` on touched files, then the smallest CI
lane that covers the adapter. Update [UPSTREAM_PARITY.md](UPSTREAM_PARITY.md)
with the SHA actually ported.

## Phase 2 — Specialized reverse engineering beyond parity

Only after wave A/B reduce MISSING for artifact families we already ship.

Candidates that can stay static and local:

- Stronger ELF/PE/Mach-O metadata already owned by existing inspectors.
- Android DEX/native library facts already reachable from JADX/ADB commands.
- Wasm, Electron, SQLite, pcap, GPU objects: deepen existing commands; do not
  add angr/MobSF/RetDec.

Reject for now: automatic dynamic execution, untrusted plugin code loading.

## Phase 3 — Persistent investigation (differentiator)

Present today: project directory, SHA-256 import, format detection, job
lifecycle, cache keys, evidence JSON, resume, unreadable-job listing, Markdown

- JSON reports, optional AI with disclosure.

Not present (do not fake them):

- Project versioning, import/export, backup/restore.
- Multi-algorithm hashes, target-to-target compare UI.
- Evidence relationship graph, search index.
- Timeline, hypotheses store, analyst notes store.
- Concurrent job scheduler / resource meters.

Next investigation slices, in order:

1. Project archive export/import with integrity hash (reuse Evidence digest
   rules).
2. Target compare that calls existing `compare` / `compare-artifacts` and stores
   the receipt.
3. Evidence listing/filter over `evidence/*.json` without reinterpretation.
4. Job timeline derived from persisted stage timestamps.

## Phase 4 — Reporting

Present: `schema: rea.investigation-report.v1` JSON and Markdown.

Deferred until Phase 3 export exists: HTML, PDF, CSV, evidence-only export,
version-diff report, executive summary. PDF especially needs a scoped renderer
decision (no silent HTML-to-PDF dependency).

## Phase 5 — Test quality

Do not inflate counts. Upstream currently has **more** test files (2872 vs
2830). After each port, bring the matching upstream tests or write equivalent
boundary tests that use this tree’s owners.

Measure later, only when a change targets coverage: `test:fast` totals, then
focused mutation on `investigationProject` and `zstdFrame`.

## Phase 6 — Release maturity

Blocked on an explicit identity decision. Until then:

- Keep `rea-agents` runtime name.
- Keep the release-please authority guard.
- Do not publish.
- Do not create official-looking tags.

## Immediate next action

Wave A item 1 (`guidance`) is implemented in this increment. Next isolated
item is Mach-O per-slice encryption (`860fdd8`). Do not start it in the
same change. No commit or push unless the owner asks.
