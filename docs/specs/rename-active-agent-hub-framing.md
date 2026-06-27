# Rename Active Agent Hub Framing

## Status

Accepted.

## Goal

Update active Knitten Core entry documents so Knitten is described as a core Codex
adapter and path/output contract owner, not as an Agent Hub routing system.

## Problem

The current plugin direction avoids selling routing as the main product claim,
but active documents still use routing-shaped phrasing:

- `agent/AGENTS.md` calls Knitten an "Agent Hub routing system".
- `agent/AGENTS.md` says Knitten "routes generic Agent Hub workflow intent".
- `docs/public-core/agent/config/agent-hub.json` labels the agent-hub registry
  as "plugin core routing metadata".
- `SYSTEM.md` says new primary storage should "route to the target workspace".

These are read by humans and agents as current framing, so they should use the
same adapter/path-output language as the rest of the cleanup.

## Boundary

In scope:

- Active entry/documentation wording in `SYSTEM.md`.
- Active adapter wording in `agent/AGENTS.md`.
- Public-core registry domain wording in
  `docs/public-core/agent/config/agent-hub.json`.

Out of scope:

- Historical specs and legacy migration guides.
- Skill behavior, skill names, and activation rules.
- Registry schemas or resolver behavior.
- Compatibility wrappers that intentionally retain old `routing` names.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `SYSTEM.md` | Yes | Shared system contract read by Knitten Core users and agents. |
| `agent/AGENTS.md` | Yes | Codex adapter entry document. |
| `docs/public-core/agent/config/agent-hub.json` | Yes | Public-core metadata copy. |
| `docs/guidelines/skill-authoring.md` | No | Boundary reference proving router language is already legacy-only. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Updated active wording | durable | Entry documents describe Knitten Core as adapter/path-output core. |
| Validation evidence | local | Commands proving docs/config stay valid. |

## Contract

- Active entry documents must not describe Knitten as a request routing system.
- Knitten may still be described as owning generic AH workflow contracts,
  path/output resolution, validation, and plugin boundaries.
- The wording must not imply that payload plugins live in Knitten Core or that Knitten Core owns
  domain behavior.
- JSON syntax and plugin validation must remain valid.
- Historical and legacy-router documents may keep router language when the
  context is explicitly legacy.

## Validation

- `node --check scripts/doctor.mjs`
- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `python3 /Users/younsoolim/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .`
- `git diff --check`
- `! rg -n 'routing system|routes generic Agent Hub|plugin core routing metadata|route to the target workspace' SYSTEM.md agent/AGENTS.md docs/public-core/agent/config/agent-hub.json`

## Acceptance Criteria

- `agent/AGENTS.md` describes Knitten as a Codex adapter entry for Knitten
  Agent Hub core contracts.
- `agent/AGENTS.md` says Knitten Core handles generic AH workflow contracts,
  path/output destinations, validation, and plugin boundaries without using
  route/routing wording.
- `SYSTEM.md` uses "resolve" or equivalent path/output wording for primary
  task storage.
- `docs/public-core/agent/config/agent-hub.json` uses a non-routing domain
  label.
- The validation scan for old active framing returns no matches.
- No active behavior changes.

## Open Questions

- None.

## Design Plan

### Inputs

- `SYSTEM.md`
- `agent/AGENTS.md`
- `docs/public-core/agent/config/agent-hub.json`

### Outputs

- Updated active wording in the three files above.
- Validation output from shell, doctor, plugin validation, and diff check.

### Implementation Sequence

#### 1. Update Entry Documents

Files:

- `SYSTEM.md`
- `agent/AGENTS.md`

Changes:

- Replace request-router phrasing with adapter/path-output/contract phrasing.
- Preserve the payload boundary statement.

Risk:

- Overcorrecting could hide that Knitten Core still owns generic workflow contracts.

Proof:

- `! rg -n 'routing system|routes generic Agent Hub|route to the target workspace' SYSTEM.md agent/AGENTS.md`

#### 2. Update Public-Core Metadata

Files:

- `docs/public-core/agent/config/agent-hub.json`

Changes:

- Rename the `agent-hub` registry domain from routing metadata to core adapter
  metadata.

Risk:

- JSON syntax breakage.

Proof:

- `node scripts/validate-repository-shell.mjs`

### Review Plan

- Contract: active files no longer present Knitten Core as a routing system.
- Boundary: payload/domain ownership remains separate from Knitten Core.
- Validation: JSON and repository/plugin checks pass.
