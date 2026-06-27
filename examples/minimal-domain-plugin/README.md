# Minimal Domain Plugin Example

This example shows the smallest useful domain-plugin shape:

- one plugin manifest,
- one exposed skill,
- a Step 0 match check in `SKILL.md`,
- one deferred flow file under `references/`.

The core idea is that the exposed skill stays cheap to discover. Detailed
workflow instructions live in the reference and are read only after the request
matches the skill.

## Files

| Path | Purpose |
|------|---------|
| `.codex-plugin/plugin.json` | Example plugin manifest. |
| `skills/example-note/SKILL.md` | Short exposed skill file. |
| `skills/example-note/references/flow.md` | Detailed flow loaded after Step 0. |

## Validate From The Knitten Checkout

```bash
node scripts/validate-domain-plugin-boundary.mjs --domain-plugin examples/minimal-domain-plugin --warn-only
```

Expected result: JSON with `"ok": true`.

## Copy Pattern

For a real domain plugin:

1. Rename the plugin and skill.
2. Keep the `SKILL.md` short.
3. Put long steps, examples, checklists, and command recipes in skill-local
   references.
4. Keep shared workflow contracts and generic output/path helpers in Knitten
   Core.
