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
| Registries | 9 | `claude/config/agent-hub.json` `registries` |
| Generated documents | 5 | `claude/config/agent-hub.json` `generatedDocuments` |
| Runtime path policies | 7 | `claude/config/agent-hub.json` `runtimePathPolicies` |
| Validators | 15 | `claude/config/agent-hub.json` `validators` |

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
| `context-routing` | `claude/config/context-routing.json` | task route axes, context profiles, pilot files, and routing fixtures |
| `doc-budgets` | `claude/config/doc-budgets.json` | document length budgets |
| `frontmatter-schema` | `claude/config/frontmatter-schema.json` | frontmatter enums and platform metadata pilot files |
| `taxonomy` | `claude/config/taxonomy.json` | categories, standard groups, and naming patterns |
| `audit-policy` | `claude/config/audit-policy.json` | audit thresholds and severity tiers |
| `exceptions` | `claude/config/exceptions.json` | grandfathered exceptions |
| `slack` | `claude/config/slack.json` | non-secret Slack channel IDs and message templates |
| `doc-paths` | `claude/private/caol-config/doc-paths.json` | shared document routing |
<!-- /generated:agent-hub-inventory -->

<!-- routing:start -->
## Task Routing

Load route-domain bodies only after a profile matches. Keep discovery in this compact index.

| Profile | Route domains | Repo keys | Frameworks | Task types | Max bytes |
|---------|---------------|-----------|------------|------------|----------:|
| `rust-bevy` | `rust` | `anju`, `shotloom`, `vrm2u-bevy` | `bevy`, `wgpu` | `implementation` | 25000 |
| `shotloom-review` | `rust` | `shotloom` | `bevy`, `wgpu` | `review` | 25000 |
| `shotloom-deploy` | `rust`, `web` | `shotloom` | `bevy`, `wgpu` | `deploy` | 25000 |
| `unreal-engine` | `unreal` | `anju`, `mega-melange` | - | `implementation`, `review` | 25000 |
| `web-frontend` | `web` | `caol-ila`, `mmd-anju`, `ta-portfolio` | `astro`, `three` | `implementation` | 25000 |
| `web-review` | `web` | `caol-ila`, `mmd-anju`, `ta-portfolio` | `astro`, `three` | `review` | 25000 |
| `obsidian-vault` | `obsidian` | `caol-ila` | - | `authoring`, `implementation`, `review` | 25000 |

## Pilot Files

| File | Profile | Cost |
|------|---------|------|
| `claude/skills/cci-codex-port-bevy/SKILL.md` | `rust-bevy` | `medium` |
| `claude/skills/dev-open-vrm-bevy/SKILL.md` | `rust-bevy` | `medium` |
| `claude/skills/shotloom-deploy-web/SKILL.md` | `shotloom-deploy` | `high` |
| `claude/skills/shotloom-respond-pr/SKILL.md` | `shotloom-review` | `high` |
| `claude/skills/shotloom-review-before-pr/SKILL.md` | `shotloom-review` | `high` |
| `claude/skills/ue-analyze-material/SKILL.md` | `unreal-engine` | `medium` |
| `claude/skills/obsidian-json-canvas/SKILL.md` | `obsidian-vault` | `medium` |
| `claude/skills/obsidian-obsidian-bases/SKILL.md` | `obsidian-vault` | `high` |
| `claude/skills/obsidian-obsidian-markdown/SKILL.md` | `obsidian-vault` | `medium` |
| `claude/standards/unreal/unreal-engine-asset.md` | `unreal-engine` | `high` |
| `claude/standards/unreal/unreal-engine-cpp.md` | `unreal-engine` | `medium` |
| `claude/standards/review/review-code-unreal-cpp.md` | `unreal-engine` | `low` |
| `claude/standards/review/review-code-unreal-python.md` | `unreal-engine` | `medium` |
| `claude/standards/language/css.md` | `web-frontend` | `medium` |
| `claude/standards/language/javascript.md` | `web-frontend` | `medium` |
| `claude/standards/language/three-shader-language.md` | `web-frontend` | `high` |
| `claude/standards/review/review-code-astro.md` | `web-review` | `high` |
| `claude/standards/review/review-code-css.md` | `web-review` | `medium` |
| `claude/standards/review/review-code-javascript.md` | `web-review` | `high` |
| `claude/standards/review/review-code-tsl.md` | `web-review` | `medium` |
| `claude/standards/obsidian/note-inspection-checklist.md` | `obsidian-vault` | `medium` |
| `claude/standards/obsidian/obsidian-format.md` | `obsidian-vault` | `medium` |
| `claude/standards/obsidian/obsidian-tag-taxonomy.md` | `obsidian-vault` | `high` |
| `claude/standards/obsidian/vault-audience.md` | `obsidian-vault` | `medium` |

## Route Fixtures

| Task | Must load | Must not load | Max bytes |
|------|-----------|---------------|----------:|
| Implement Rust Bevy ECS in shotloom | `rust-bevy` | `shotloom-review`, `shotloom-deploy`, `unreal-engine`, `web-frontend`, `web-review`, `obsidian-vault` | 25000 |
| Review Shotloom Rust PR before opening | `shotloom-review` | `shotloom-deploy`, `unreal-engine`, `web-frontend`, `web-review`, `obsidian-vault` | 25000 |
| Deploy Shotloom web image | `shotloom-deploy` | `rust-bevy`, `shotloom-review`, `unreal-engine`, `obsidian-vault` | 25000 |
| Unreal material graph in anju | `unreal-engine` | `rust-bevy`, `shotloom-review`, `shotloom-deploy`, `web-frontend`, `web-review`, `obsidian-vault` | 25000 |
| Review Astro island hydration bug | `web-review` | `rust-bevy`, `shotloom-review`, `shotloom-deploy`, `unreal-engine`, `obsidian-vault` | 25000 |
| Implement Three.js shader | `web-frontend` | `rust-bevy`, `shotloom-review`, `shotloom-deploy`, `unreal-engine`, `obsidian-vault` | 25000 |
| Obsidian note cleanup | `obsidian-vault` | `rust-bevy`, `shotloom-review`, `shotloom-deploy`, `unreal-engine`, `web-frontend`, `web-review` | 25000 |
<!-- routing:end -->
