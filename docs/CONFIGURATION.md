# Configuration

Upstream environment parsing lives in `src/config/environment.ts` and is
documented across [installation.md](installation.md) and provider guides.
This page lists variables used by the investigation-project layer and the
safe example file.

## Example file

Copy [`.env.example`](../.env.example) to `.env`. The example contains names
and empty placeholders only.

`.env` and `.env.local` are gitignored.

## Investigation AI settings

These are read by `parseAiProviderSettings`. They are **not** part of the
strict startup `parseConfig` schema, so omitting them cannot fail process
boot.

| Variable                    | Purpose                                            | Default |
| --------------------------- | -------------------------------------------------- | ------- |
| `REA_AI_PROVIDER`           | `none`, `openai-compatible`, `anthropic`, `ollama` | `none`  |
| `REA_AI_MODEL`              | Model name                                         | unset   |
| `REA_AI_ENDPOINT`           | HTTPS or local endpoint                            | unset   |
| `REA_AI_API_KEY`            | Secret; never logged or written to reports         | unset   |
| `REA_AI_TIMEOUT_MS`         | Request timeout                                    | 30000   |
| `REA_AI_RETRIES`            | Reserved for later retry policy                    | 1       |
| `REA_AI_TOKEN_LIMIT`        | Max tokens advertised to the provider              | 4096    |
| `REA_AI_SPENDING_LIMIT_USD` | Optional budget marker                             | unset   |

A provider is ready only when `REA_AI_PROVIDER` is not `none`, an endpoint is
set, and a key is present (Ollama may omit the key).

## Existing provider settings

Use absolute paths:

- `REA_ANALYSIS_PROVIDER`
- `HOPPER_LAUNCHER_PATH`
- `GHIDRA_INSTALL_DIR`, `JAVA_HOME`
- `REA_IDA_MCP_CONFIG`
- `REA_KUNA_COMMAND`
- `REA_JADX_COMMAND`, `REA_APKTOOL_COMMAND`, `REA_RIZIN_COMMAND`

See [BACKENDS.md](BACKENDS.md) and [AI_PROVIDERS.md](AI_PROVIDERS.md).
