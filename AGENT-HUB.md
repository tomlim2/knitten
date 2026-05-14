# AGENT-HUB.md

Thin root hub overview.

Canonical policy: [SYSTEM.md](SYSTEM.md). Manifest: [agent/config/agent-hub.json](agent/config/agent-hub.json). System terms: [docs/reference/system-glossary.md](docs/reference/system-glossary.md).

Do not add policy here. Put policy in `SYSTEM.md` or the owning shared layer.

<!-- generated:agent-hub-inventory -->
## Hub Inventory

| Area | Count | Canonical owner |
|------|------:|-----------------|
| Harnesses | 3 | `agent/config/agent-hub.json` `harnesses` |
| Shared layers | 6 | `agent/config/agent-hub.json` `sharedLayers` |
| Registries | 9 | `agent/config/agent-hub.json` `registries` |
| Generated documents | 5 | `agent/config/agent-hub.json` `generatedDocuments` |
| Runtime path policies | 7 | `agent/config/agent-hub.json` `runtimePathPolicies` |
| Validators | 16 | `agent/config/agent-hub.json` `validators` |

## Harnesses

| ID | Entry document | Deploy target |
|----|----------------|---------------|
| `claude-code` | `CLAUDE.md` | `~/.claude` |
| `codex` | `AGENTS.md` | `~/.codex` |
| `pi` | `SYSTEM.md` | `~/.pi/agent/settings.json` |

## Shared Layers

| ID | Path | Load mode |
|----|------|-----------|
| `rules` | `agent/rules` | `entry` |
| `standards` | `agent/standards` | `on-demand` |
| `skills` | `agent/skills` | `triggered` |
| `commands` | `agent/commands` | `invoked` |
| `lib` | `agent/lib` | `library` |
| `config` | `agent/config` | `config` |

## Registries

| ID | Path | Domain |
|----|------|--------|
| `agent-hub` | `agent/config/agent-hub.json` | agent hub routing and validation metadata |
| `context-routing` | `agent/config/context-routing.json` | task route axes, context profiles, pilot files, and routing fixtures |
| `doc-budgets` | `agent/config/doc-budgets.json` | document length budgets |
| `frontmatter-schema` | `agent/config/frontmatter-schema.json` | frontmatter enums and platform metadata pilot files |
| `taxonomy` | `agent/config/taxonomy.json` | categories, standard groups, and naming patterns |
| `audit-policy` | `agent/config/audit-policy.json` | audit thresholds and severity tiers |
| `exceptions` | `agent/config/exceptions.json` | grandfathered exceptions |
| `slack` | `agent/config/slack.json` | non-secret Slack channel IDs and message templates |
| `doc-paths` | `agent/private/caol-config/doc-paths.json` | shared document routing |
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
| `agent/skills/obsidian-defuddle/SKILL.md` | `obsidian-vault` | `low` |
| `agent/skills/obsidian-fix-format/SKILL.md` | `obsidian-vault` | `low` |
| `agent/skills/obsidian-json-canvas/SKILL.md` | `obsidian-vault` | `medium` |
| `agent/skills/obsidian-obsidian-bases/SKILL.md` | `obsidian-vault` | `high` |
| `agent/skills/obsidian-obsidian-cli/SKILL.md` | `obsidian-vault` | `medium` |
| `agent/skills/obsidian-obsidian-markdown/SKILL.md` | `obsidian-vault` | `medium` |
| `agent/skills/dev-open-vrm-bevy/SKILL.md` | `rust-bevy` | `medium` |
| `agent/skills/shotloom-deploy-web/SKILL.md` | `shotloom-deploy` | `high` |
| `agent/skills/shotloom-send-deploy-status/SKILL.md` | `shotloom-deploy` | `medium` |
| `agent/skills/shotloom-auto-pr/SKILL.md` | `shotloom-review` | `high` |
| `agent/skills/shotloom-make-pr/SKILL.md` | `shotloom-review` | `medium` |
| `agent/skills/shotloom-make-preflight/SKILL.md` | `shotloom-review` | `medium` |
| `agent/skills/shotloom-respond-pr/SKILL.md` | `shotloom-review` | `high` |
| `agent/skills/shotloom-review-before-pr/SKILL.md` | `shotloom-review` | `high` |
| `agent/skills/shotloom-review-code/SKILL.md` | `shotloom-review` | `high` |
| `agent/skills/shotloom-review-docs/SKILL.md` | `shotloom-review` | `high` |
| `agent/skills/shotloom-review-task-plan/SKILL.md` | `shotloom-review` | `medium` |
| `agent/skills/shotloom-verify-review/SKILL.md` | `shotloom-review` | `medium` |
| `agent/skills/shotloom-watch-pr/SKILL.md` | `shotloom-review` | `medium` |
| `agent/skills/ue-analyze-material/SKILL.md` | `unreal-engine` | `medium` |
| `agent/skills/ue-check-redirectors/SKILL.md` | `unreal-engine` | `medium` |
| `agent/skills/ue-cleanup-assets/SKILL.md` | `unreal-engine` | `medium` |
| `agent/skills/ue-fix-nanite-translucent/SKILL.md` | `unreal-engine` | `low` |
| `agent/skills/ue-generate-spritesheet/SKILL.md` | `unreal-engine` | `medium` |
| `agent/skills/ue-show-template/SKILL.md` | `unreal-engine` | `low` |
| `agent/skills/ue-validate-asset-name/SKILL.md` | `unreal-engine` | `medium` |
| `agent/standards/review/review-code-unreal-cpp.md` | `unreal-engine` | `low` |
| `agent/standards/review/review-code-unreal-python.md` | `unreal-engine` | `medium` |
| `agent/standards/unreal/unreal-engine-cpp.md` | `unreal-engine` | `medium` |
| `agent/skills/claude-seo/SKILL.md` | `web-frontend` | `medium` |
| `agent/skills/design-huashu-make-prototype/SKILL.md` | `web-frontend` | `low` |
| `agent/skills/design-make-theme/SKILL.md` | `web-frontend` | `medium` |
| `agent/skills/design-show-components/SKILL.md` | `web-frontend` | `low` |
| `agent/skills/dev-check-publish/SKILL.md` | `web-frontend` | `medium` |
| `agent/skills/dev-open-matcap-painter/SKILL.md` | `web-frontend` | `low` |
| `agent/skills/dev-open-mmd-anju/SKILL.md` | `web-frontend` | `medium` |
| `agent/skills/dev-show-design-status/SKILL.md` | `web-frontend` | `low` |
| `agent/skills/frontend-design/SKILL.md` | `web-frontend` | `medium` |
| `agent/standards/language/css.md` | `web-frontend` | `medium` |
| `agent/standards/language/javascript.md` | `web-frontend` | `medium` |
| `agent/standards/language/three-shader-language.md` | `web-frontend` | `high` |
| `agent/skills/dev-review-publish/SKILL.md` | `web-review` | `medium` |
| `agent/skills/review-audit-ux/SKILL.md` | `web-review` | `medium` |
| `agent/skills/review-audit-web-spec/SKILL.md` | `web-review` | `medium` |
| `agent/skills/review-audit-web/SKILL.md` | `web-review` | `low` |
| `agent/standards/review/review-code-astro.md` | `web-review` | `high` |
| `agent/standards/review/review-code-tsl.md` | `web-review` | `medium` |

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
