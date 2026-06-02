---
status: accepted
owner: agent-hub
updated: 2026-06-02
---

# Codex Plugin Install

## Purpose

Register Knitten as a local Codex plugin so Codex can discover Knitten skills
through the plugin system, not only through ad-hoc skill roots.

OpenAI describes plugins and skills as Codex extensions available from the
Plugins UI, and skills as playbooks that can be invoked with `$<skill-name>`.
Knitten uses the plugin layer to expose its skill bundle.

## Source Files

| File | Role |
|------|------|
| `.codex-plugin/plugin.json` | Codex plugin manifest. |
| `.agents/plugins/marketplace.json` | Local marketplace that exposes the `knitten` plugin. |
| `agent/skills/` | Skill root exposed by the plugin manifest. |

The manifest exposes all skill directories under `agent/skills/`:

```json
"skills": "./agent/skills/"
```

## Local Install

Add these entries to `~/.codex/config.toml`.

Before this branch is merged, point at the checked-out branch that contains
`.codex-plugin/plugin.json`:

```toml
[plugins."knitten@knitten-local"]
enabled = true

[marketplaces.knitten-local]
source_type = "local"
source = "<knitten-branch-checkout>"
```

After this branch is merged into main, use the stable main checkout instead:

```toml
[plugins."knitten@knitten-local"]
enabled = true

[marketplaces.knitten-local]
source_type = "local"
source = "<knitten-main-checkout>"
```

Restart Codex after editing the config. The plugin should appear as `Knitten`
and its skills should be selectable with `$`.

## Verification

Run:

```bash
test -f .codex-plugin/plugin.json
test -f .agents/plugins/marketplace.json
node -e 'JSON.parse(require("fs").readFileSync(".codex-plugin/plugin.json","utf8")); JSON.parse(require("fs").readFileSync(".agents/plugins/marketplace.json","utf8"))'
node -e 'const fs=require("fs"),p=require("path"); const skills=fs.readdirSync("agent/skills").filter(n=>fs.existsSync(p.join("agent/skills",n,"SKILL.md"))); console.log(skills.length)'
rg 'knitten@knitten-local|marketplaces.knitten-local' ~/.codex/config.toml
```

Expected result:

| Check | Expected |
|-------|----------|
| plugin manifest parses | pass |
| marketplace manifest parses | pass |
| all `agent/skills/*/SKILL.md` directories count | non-zero |
| Codex config contains plugin entry | pass |
| Codex config contains marketplace entry | pass |

## Notes

Use the stable main checkout as the marketplace source after merge. During
branch validation, a worktree source is acceptable only while that worktree
exists.
