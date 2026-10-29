# AI providers

REA's production design keeps reasoning in the external coding agent. This
working copy adds an optional outbound interface for evidence-scoped notes.

## Status

| Path | Status |
| --- | --- |
| External agent through MCP | Implemented (upstream) |
| `REA_AI_PROVIDER=none` | Implemented and verified |
| Live OpenAI/Anthropic/Ollama HTTP calls | Implemented in code; **not** verified against a real service in this workspace |
| Exploitability claims in model JSON | Rejected by `parseAiInterpretation` (verified in unit tests) |

## Setup

1. Copy `.env.example` to `.env`.
2. Set `REA_AI_PROVIDER`, `REA_AI_ENDPOINT`, and `REA_AI_MODEL`.
3. Set `REA_AI_API_KEY` only in the local environment. Do not commit it.
4. Run `analyze-project` with project `config.ai_enabled` true, or keep AI
   disabled and use MCP from your coding agent.

## Untrusted content

`wrapUntrustedTargetContent` labels recovered bytes as data. The application
client sends that block in the user message. This is not a guarantee against
prompt injection; it is a contract and a label. See [SECURITY.md](SECURITY.md).

## What the model may return

The schema allows function notes, unverified security notes with evidence ids,
hypotheses, and uncertainties. `verified` on security notes must be `false`.
`exploitability_claimed` must be `false`. Responses that mention exploitability
are discarded.

## Spending and tokens

`REA_AI_TOKEN_LIMIT` is passed to the provider request. A spending-limit
environment variable is recorded for later enforcement; this increment does
not contact a billing API.
