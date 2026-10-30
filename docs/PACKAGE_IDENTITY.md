# Package identity migration plan

Status: **proposal only**. This document does not rename anything.

## Current identity

| Surface         | Current value                        | Owner                     |
| --------------- | ------------------------------------ | ------------------------- |
| npm `name`      | `rea-agents`                         | Upstream official package |
| `mcpName`       | `io.github.morluto/rea`              | Upstream MCP identity     |
| CLI bins        | `rea`, `rea-agents`                  | Shared with upstream      |
| Homepage / bugs | `niravcse006/ai-reverse-engineering` | This repository           |

Publishing the current `package.json` to npm would impersonate
[rea-agents](https://www.npmjs.com/package/rea-agents). Do not publish.

## Proposed independent identity

For owner approval:

| Surface     | Proposed value                                                   |
| ----------- | ---------------------------------------------------------------- |
| npm `name`  | `ai-reverse-engineering` or `@niravcse006/rea`                   |
| `mcpName`   | `io.github.niravcse006/ai-reverse-engineering`                   |
| CLI bins    | keep `rea` locally; add a distinct bin only if collisions matter |
| MCP clients | update `setup` templates after the rename                        |

## Consumers that would break on a silent rename

- Global `npm install -g rea-agents` / `npx rea-agents`
- Agent MCP configs written by `rea setup` under `io.github.morluto/rea`
- Internal tests and generated catalogs that assert `package.json#name`
- Plugin metadata (`.claude-plugin`, `.codex-plugin`)
- Documentation that still says `rea-agents` as the runtime command

Internal TypeScript imports do not use the npm name; they use relative modules.

## Safe migration steps (not executed)

1. Owner chooses the npm name and MCP identity.
2. Add the new names beside the old bins for one release, or document a
   breaking rename in CHANGELOG.
3. Update `package.json`, plugin manifests, setup templates, and tests.
4. Verify `npm pack --dry-run` and a clean temporary install.
5. Publish only under the new name. Never publish as `rea-agents`.

Until that decision, this working copy may stay public on GitHub while npm
publication remains blocked.
