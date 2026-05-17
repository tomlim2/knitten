# Vendor Skills

Local upstream skill checkouts used by thin wrapper skills.

## Contract

| Path | Owner | Git policy |
|------|-------|------------|
| `agent/vendor/skills.json` | Knitten | tracked registry |
| `agent/vendor/sync.sh` | Knitten | tracked sync helper |
| `agent/vendor/<vendor>/` | upstream repos | gitignored local checkout |

Wrapper skills import upstream files through `@~/.claude/vendor/...`. On this
machine, `~/.claude` points at `agent/`, so the import resolves to this folder.

Run:

```bash
bash ~/.claude/vendor/sync.sh
```
