# config/

Service credentials and public service configuration.

## Contents

| File | Purpose | Git status |
|------|---------|------------|
| `.env` | All secret tokens (bot tokens, API keys) | gitignored |
| `.env.example` | Template — which keys exist, no values | committed |
| `slack.json` | Slack channels, bot name, message templates | gitignored |
| `slack.json.example` | Template | committed |

## Rules

- **Tokens go ONLY in `.env`.** Never embed tokens in skill bodies, JSON files, or `private/`.
- **Per-service env key convention:** `{SERVICE}_{KEY}` — e.g. `SLACK_BOT_TOKEN`, `SHOTLOOM_SLACK_BOT_TOKEN`, `GEMINI_API_KEY`.
- **Service-specific config** (channels, bot names, endpoints) goes in its own JSON file: `slack.json`, `gemini.json`, etc. These may contain non-secret IDs.
- **This dir is for credentials + service config only.** Skill data, repo paths, machine specs belong in `~/.claude/private/`.

## Skills that read from here

- `cci-*` Slack skills read `.env` + `slack.json` via helper (see [cci-slack standard](../standards/cci-slack.md)).

## Adding a new service

1. Add keys to `.env.example` with blank values
2. Add actual tokens to `.env` (gitignored)
3. If service has non-secret config (channels, endpoints), create `service.json` + `service.json.example`
4. Document the env key convention in the skill's SKILL.md
