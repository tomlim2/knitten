# AGENT-HUB.md

Thin root hub overview.

Canonical policy: [SYSTEM.md](SYSTEM.md). Manifest: [claude/config/agent-hub.json](claude/config/agent-hub.json). System terms: [docs/reference/system-glossary.md](docs/reference/system-glossary.md).

Do not add policy here. Put policy in `SYSTEM.md` or the owning shared layer.

<!-- generated:agent-hub-inventory -->
## Hub Inventory

| Area | Count | Canonical owner |
|------|------:|-----------------|
| Harnesses | 2 | `claude/config/agent-hub.json` `harnesses` |
| Shared layers | 6 | `claude/config/agent-hub.json` `sharedLayers` |
| Registries | 8 | `claude/config/agent-hub.json` `registries` |
| Generated documents | 4 | `claude/config/agent-hub.json` `generatedDocuments` |
| Runtime path policies | 7 | `claude/config/agent-hub.json` `runtimePathPolicies` |
| Validators | 14 | `claude/config/agent-hub.json` `validators` |

## Harnesses

| ID | Entry document | Deploy target |
|----|----------------|---------------|
| `claude-code` | `CLAUDE.md` | `~/.claude/CLAUDE.md` |
| `codex` | `AGENTS.md` | `AGENTS.md` |

## Shared Layers

| ID | Path | Load mode |
|----|------|-----------|
| `rules` | `claude/rules` | `entry` |
| `standards` | `claude/standards` | `on-demand` |
| `skills` | `claude/skills` | `triggered` |
| `commands` | `claude/commands` | `invoked` |
| `lib` | `claude/lib` | `library` |
| `config` | `claude/config` | `config` |

## Registries

| ID | Path | Domain |
|----|------|--------|
| `agent-hub` | `claude/config/agent-hub.json` | agent hub routing and validation metadata |
| `doc-budgets` | `claude/config/doc-budgets.json` | document length budgets |
| `frontmatter-schema` | `claude/config/frontmatter-schema.json` | frontmatter enums and platform metadata pilot files |
| `taxonomy` | `claude/config/taxonomy.json` | categories, standard groups, and naming patterns |
| `audit-policy` | `claude/config/audit-policy.json` | audit thresholds and severity tiers |
| `exceptions` | `claude/config/exceptions.json` | grandfathered exceptions |
| `slack` | `claude/config/slack.json` | non-secret Slack channel IDs and message templates |
| `doc-paths` | `claude/private/caol-config/doc-paths.json` | shared document routing |
<!-- /generated:agent-hub-inventory -->
