# Implementation plan

Order of work after the 2026-10-29 audit. Do not add engines or publish packages
until the open P0 items below are closed.

## Package identity

**Decision: do not rename `rea-agents` or `io.github.morluto/rea` in this
increment.**

Observed values in `package.json`:

- `name`: `rea-agents` (also the official npm package)
- `mcpName`: `io.github.morluto/rea`
- bins: `rea`, `rea-agents`

A distinct name (`ai-reverse-engineering` or `@niravcse006/rea`) would be
correct for an independent release, but it is a breaking change for every
agent config and for anyone following upstream docs. The name `rea-agents` is
already taken on npm by upstream. Publishing this fork under that name would
be a collision.

Migration plan (future, not executed):

1. Choose a scoped npm name that `npm view` shows as unpublished.
2. Keep `rea` as a local bin alias; add a new bin if needed.
3. Change `mcpName` to `io.github.niravcse006/ai-reverse-engineering` only after
   MCP clients are documented.
4. Dual-write docs for one release, then drop the old identifiers.

## Completed in this increment

1. Audit docs: this file, [UPSTREAM_COMPARISON.md](UPSTREAM_COMPARISON.md),
   [FEATURE_PARITY.md](FEATURE_PARITY.md).
2. Port ADB PNG header validation from upstream `f7cd4e5`.
3. Investigation remaining-workflow text (O-1).
4. Report provenance and AI disclosure (O-2, P0-4).
5. Duplicate target and completed-job reuse.
6. Zero spend limit refuses the HTTP call.
7. Tests for the above.

## Next increments (still open)

| Priority | Item                                                               | Why it is still open                                        |
| -------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| P0       | Import guidance + environment-write + BinarySession + native fixes | Large, needs their tests; not copied blindly                |
| P0       | Attach existing inspect/decompile Evidence to jobs                 | Requires a documented hand-off, not a second evidence model |
| P1       | Real-provider lanes                                                | No Ghidra/IDA/Hopper in this workspace                      |
| P1       | Full `npm run check:pr`                                            | Time/memory; not claimed                                    |
| P2       | Enforce live token accounting against a real provider              | No live call was made                                       |

## Acceptance for later PRs

Each increment must name the test command that ran and must not claim
superiority over `morluto/rea` `main`.
