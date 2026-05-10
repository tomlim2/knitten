# config/

Shared JSON registries and public service configuration.

## Contents

| File | Purpose | Git status |
|------|---------|------------|
| `agent-hub.json` | Harness, shared layer, registry, generated document, runtime path, and validator manifest | committed |
| `context-routing.json` | Task route axes, context profiles, pilot files, generated block markers, and fixture path | committed |
| `doc-budgets.json` | Document length budgets consumed by `validate-llm-first.mjs` | committed |
| `frontmatter-schema.json` | Frontmatter enum values and pilot metadata file list | committed |
| `taxonomy.json` | Skill/command categories, standard groups, naming regexes | committed |
| `audit-policy.json` | Garden/audit thresholds and severity tiers | committed |
| `exceptions.json` | Grandfathered exceptions with reason, decision, review date | committed |
| `.env` | All secret tokens (bot tokens, API keys) | gitignored |
| `.env.example` | Template — which keys exist, no values | committed |
| `slack.json` | Slack channels, bot name, message templates with no tokens | committed |
| `slack.json.example` | Template | committed |

## Rules

- **Committed registry JSON files are canonical inputs for validators.** If a rule, standard, or skill repeats a value from this folder, add a validator check or a generated block before relying on the duplication.
- **Tokens go ONLY in `.env`.** Never embed tokens in skill bodies, JSON files, or `private/`.
- **Per-service env key convention:** `{SERVICE}_{KEY}` — e.g. `SLACK_BOT_TOKEN`, `SHOTLOOM_SLACK_BOT_TOKEN`, `GEMINI_API_KEY`.
- **Service-specific config** (channels, bot names, endpoints) goes in its own JSON file such as `slack.json` or `gemini.json`. These may contain non-secret IDs.
- **Machine-specific paths and specs stay gitignored under `agent/private/caol-config/` and deploy through `~/.claude/private/caol-config/`.** Use that folder for repo paths, machine paths, and hardware specs.

## Skills that read from here

- `cci-*` Slack skills read `.env` + `slack.json` via helper (see [cci-slack standard](../standards/cinev/cci-slack.md)).
- Route-domain skills and standards use `context-routing.json` through the validator and the `AGENT-HUB.md` routing block.

## Adding a new service

1. Add keys to `.env.example` with blank values
2. Add actual tokens to `.env` (gitignored)
3. If service has non-secret config (channels, endpoints), create `service.json` + `service.json.example`
4. Document the env key convention in the skill's SKILL.md

## Adding a registry value

1. Pick the purpose-specific JSON file. Do not add a generic catch-all file.
2. Update the validator in `scripts/validate-llm-first.mjs` in the same commit.
3. Update the owning rule or standard to reference the registry instead of duplicating the value.
4. Run `node scripts/validate-llm-first.mjs`.
