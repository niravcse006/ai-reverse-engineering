# Plugin development

## Status

A runtime plugin loader is **not implemented**. Plugins are treated as
untrusted metadata.

Place a JSON manifest in `<project>/plugins/*.json`. `list-plugins` validates
it and never imports the `entry` file.

## Manifest

```json
{
  "name": "example-strings",
  "version": "1.0.0",
  "kind": "format-handler",
  "description": "Extract strings from a registered format.",
  "entry": "handlers/strings.js",
  "permissions": ["read-target"],
  "trusted": false
}
```

Rules verified by `src/domain/pluginContract.test.ts`:

- `name` is lowercase kebab-case
- `version` is MAJOR.MINOR.PATCH
- `entry` is a relative path without `..` or NUL
- `trusted` must be `false`
- Permissions are from a closed list

Dangerous permissions (`network`, `spawn-backend`, `dynamic-analysis`) are
reported but do not grant those capabilities.

## Adding a real capability

Follow the existing REA contribution model instead of a plugin ABI:

1. Domain contract
2. Application workflow
3. Composition factory
4. CLI/MCP registration
5. Tests

See [CONTRIBUTING.md](../CONTRIBUTING.md) and [tool-design.md](tool-design.md).
