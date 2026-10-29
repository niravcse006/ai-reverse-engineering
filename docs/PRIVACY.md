# Privacy

This page describes **actual** data movement in this checkout. It is not a
vendor privacy policy for third-party models.

## Local by default

- `inspect-target` and `analyze-project` read the target from disk, hash it, and
  write project files under the project directory. They do not execute the
  target and do not call a network AI API unless AI is enabled.
- Deep engines (Ghidra, Hopper, IDA, JADX, Frida) run only when you invoke
  their commands. Those tools see the target as the current OS user.

## When data can leave the machine

| Path | Leaves the machine? | What is sent | Control |
| --- | --- | --- | --- |
| Builtin project analysis | No | — | Always local |
| `REA_AI_PROVIDER=none` (default) | No | — | Default |
| Configured `REA_AI_*` with `ai_enabled` | Yes, to `REA_AI_ENDPOINT` | Evidence JSON (findings), plus the system/user prompt | Job must enable AI; spend limit `0` refuses the call; report records host, provider, model, and byte count — not the API key |
| External coding agent over MCP | Depends on that agent | Tool results the agent already received | The agent vendor’s policy |
| Browser / ADB / Frida commands | Possibly | Whatever those tools contact | Explicit command only |

## Disclosure record

When a project job considers AI, the report’s `ai_disclosure` field records
provider, model, endpoint **host**, bytes offered, and whether a request was
attempted. API keys and full endpoint query strings are not written.

## Secrets

Do not put API keys in `.env` files that you commit. `.env` is gitignored.
Reports, job JSON, and project JSON are treated as untrusted-adjacent artifacts:
they may contain strings extracted from the target.

## Operator responsibility

You choose the endpoint. This project does not audit that host. Treat extracted
strings as untrusted data, not as instructions to a model. See
[SECURITY.md](SECURITY.md) and [AI_PROVIDERS.md](AI_PROVIDERS.md).
