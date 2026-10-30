# Release readiness

This checklist separates **public GitHub source** from **npm publication**.
Nothing here authorizes a GitHub Release or an npm publish.

## Public GitHub source

| Item                                          | Status                                            |
| --------------------------------------------- | ------------------------------------------------- |
| README names this repository and upstream REA | Done                                              |
| Installation from clone is documented         | Done                                              |
| MIT license and attribution preserved         | Done                                              |
| Security reporting documented                 | Done; fork contact still uses GitHub Security tab |
| Known limitations stated                      | Done                                              |
| Contribution instructions                     | Done                                              |
| Honest readiness label                        | **READY FOR PUBLIC GITHUB SOURCE**                |

A public clone is allowed while the package identity remains upstream's, as
long as the README says not to publish.

## Independent package release

| Item                                          | Status                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| Independent npm / MCP identity                | Blocked — owner decision; see [PACKAGE_IDENTITY.md](PACKAGE_IDENTITY.md)   |
| Clean packed-tarball install                  | Done this increment — `/tmp/rea-pack-verify-*`, 176 packages               |
| CLI and MCP startup from the tarball          | Done — `rea --help` and `rea mcp doctor` healthy (231 tools)               |
| `npm run verify:package`                      | Done this increment — exit 0; still names `npx -y rea-agents@6.8.0 mcp`    |
| Full `npm test` / `check:pr`                  | Not completed this increment                                               |
| Full unsandboxed `test:mcp` after latest fix  | Ran; exit 1. Prior JSON-cancel case passed. 5 load timeouts passed focused |
| Security review                               | Focused review recorded; not a certification                               |
| Changelog / versioning for a distinct package | Not started                                                                |

## Status labels

| Label                          | This repository                                                            |
| ------------------------------ | -------------------------------------------------------------------------- |
| READY FOR PUBLIC GITHUB SOURCE | **Yes**, with honest limitations                                           |
| READY FOR COMMUNITY TESTING    | **Not yet** — full `test:mcp` still exits 1 under load; `check:pr` not run |
| READY FOR BETA RELEASE         | No                                                                         |
| READY FOR PRODUCTION           | No                                                                         |
| NOT READY                      | For npm publication and production                                         |

## Do not

- Publish to npm as `rea-agents`.
- Create a GitHub Release that implies official REA 6.8.0.
- Claim CI green without a completed workflow run on this fork.
