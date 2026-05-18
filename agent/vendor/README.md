# Vendor Skills

Local upstream skill checkouts used by thin wrapper skills.

## Contract

| Path | Owner | Git policy |
|------|-------|------------|
| `agent/vendor/skills.json` | Agent Hub | tracked registry |
| `agent/vendor/sync.sh` | Agent Hub | tracked sync helper |
| `vendor-skill-vault/vendor/<vendor>/` | upstream repos | gitignored local checkout |

Wrapper skills import upstream files through `@~/.claude/vendor/...`.
On this machine, `~/.claude/vendor` should be a symlink to the canonical
vendor skill vault's `vendor/` directory. Resolve the vault through the
`vendor-skill-vault` machine-path key.

`agent/vendor/` keeps the tracked registry and compatibility sync helper only.

Run:

```bash
cd "$(bash ~/.claude/skills/ah-resolve-doc-path/resolve.sh tool vendor-skill-vault)"
./scripts/sync.sh
```
