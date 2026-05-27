# Agent Hub

**LLM-first agent hub.** System docs, config, routing, skills, rules, and
standards use `agent-hub`. Agent configuration — skills, standards,
rules, and machine config — is optimized for LLM efficiency, accuracy, and
clarity. Harness install scripts link deploy targets to this checkout.

Canonical policy: [`SYSTEM.md`](SYSTEM.md). Agent hub overview: [`AGENT-HUB.md`](AGENT-HUB.md). Changelog: [`CHANGELOG.md`](CHANGELOG.md). System terms: [`docs/reference/system-glossary.md`](docs/reference/system-glossary.md). Deploy entry templates: [`agent/CLAUDE.md`](agent/CLAUDE.md) for Claude Code, [`agent/AGENTS.md`](agent/AGENTS.md) for Codex. Editing standard: [`agent/standards/policy/llm-first-docs.md`](agent/standards/policy/llm-first-docs.md). Human-readable output is delivered only on explicit user request.

Goal-to-doc lookup: [`LOOKUP.md`](LOOKUP.md). When the question is "where is X?" — start there.

---

## Layout

```
<agent-hub-checkout>/
├── SYSTEM.md                 # Shared agent-agnostic policy
├── AGENT-HUB.md              # Generated hub overview
├── docs/
│   ├── decisions/            # Accepted policy decisions and rationale
│   ├── plans/                # Lifecycle-managed specs, plans, and reports
│   └── reference/            # Lookup docs such as system glossary
├── agent/                    # Durable shared agent source
│   ├── CLAUDE.md             # Claude Code deploy entry template
│   ├── AGENTS.md             # Codex deploy entry template
│   ├── rules/                # Always-applied constraints
│   ├── standards/            # Reference docs, on-demand
│   ├── skills/               # Skill directories with SKILL.md
│   ├── config/               # Shared registries and service config
│   └── private/              # Gitignored — machine config, secrets
│       └── agent-hub-config/      # Per-machine paths and specs (JSON)
└── README.md
```

Counts are validated by `scripts/validate-llm-first.mjs`.

---

## Setup

```bash
# Inspect the planned harness links first.
node scripts/link-harnesses.mjs --dry-run

# Apply after reviewing the dry run.
node scripts/link-harnesses.mjs
```

For one harness only:

```bash
node scripts/link-harnesses.mjs --dry-run --harness codex
node scripts/link-harnesses.mjs --harness codex
```

The installer links `agent/CLAUDE.md` to `~/.claude/CLAUDE.md` and `agent/AGENTS.md` to `~/.codex/AGENTS.md`; do not create root entry documents by hand.

After linking, initialize machine config:

```text
/ah-manage-config setup
```

This populates `~/.claude/private/agent-hub-config/` from templates in `agent/skills/ah-manage-config/*.template.json`.

---

<!-- generated:readme-inventory -->
## Skills (148)

| Category | Count |
|----------|------:|
| `shotloom-*` | 32 |
| `ah-*` | 27 |
| `dev-*` | 24 |
| `cci-*` | 10 |
| `review-*` | 7 |
| `ue-*` | 7 |
| `obsidian-*` | 6 |
| `video-*` | 5 |
| `learn-*` | 4 |
| `design-*` | 3 |
| `vrm-*` | 3 |
| `writing-*` | 3 |
| `git-*` | 2 |
| `image-*` | 2 |
| `pmx-*` | 2 |
| `tutoring-*` | 2 |
| `algorithmic-*` | 1 |
| `brand-*` | 1 |
| `canvas-*` | 1 |
| `claude-*` | 1 |
| `consulting-*` | 1 |
| `drink-*` | 1 |
| `frontend-*` | 1 |
| `hatch-*` | 1 |
| `system-*` | 1 |

---

## Standards (47)

Reference docs in `agent/standards/`. Loaded on-demand, never auto.

| Group | Count | Files |
|-------|------:|-------|
| `authoring/` | 1 | `document-templates.md` |
| `cinev/` | 4 | `cci-slack.md`, `cinev-character-asset-naming.md`, `cinev-git-workflow.md`, `cinev-vrm-shading.md` |
| `language/` | 7 | `css-reference.md`, `css.md`, `design-system.md`, `javascript-reference.md`, `javascript.md`, `three-shader-language.md`, `ui-design.md` |
| `multi-agent/` | 2 | `agent-workflow.md`, `delegation.md` |
| `obsidian/` | 4 | `note-inspection-checklist.md`, `obsidian-format.md`, `obsidian-tag-taxonomy.md`, `vault-audience.md` |
| `policy/` | 9 | `garden-review.md`, `harness-deployment-plan.md`, `harness-deployment.md`, `llm-first-docs.md`, `llm-first-policy.md`, `metaphor-style.md`, `naming.md`, `platform-adapters.md`, `principles.md` |
| `research/` | 2 | `research-methodology.md`, `tech-spec-template.md` |
| `review/` | 13 | `review-3d-rendering.md`, `review-ai-motion.md`, `review-code-astro.md`, `review-code-css.md`, `review-code-javascript.md`, `review-code-tsl.md`, `review-code-unreal-cpp.md`, `review-code-unreal-python.md`, `review-spec-doc.md`, `review-template.md`, `review-ux-python-gui.md`, `review-ux-writing.md`, `review-ux.md` |
| `system/` | 1 | `repo-paths-keys.md` |
| `unreal/` | 3 | `arp-skeleton.md`, `unreal-engine-asset.md`, `unreal-engine-cpp.md` |
| `root` | 1 | `index.md` |

---

## Rules (25)

Rules in `agent/rules/`. Auto rules load every session via entry documents; triggered rules load on demand.

| Load | Count | Files |
|------|------:|-------|
| `auto` | 7 | `ambiguity-scoring.md`, `behavior.md`, `canonical-first.md`, `git-defaults.md`, `security.md`, `session-start.md`, `verify-before-report.md` |
| `triggered` | 17 | `author.md`, `cinev-git.md`, `code-write.md`, `doc-write.md`, `main-chore-lane.md`, `metaphor-style.md`, `obsidian.md`, `pr-comment.md`, `pr-create.md`, `pr-mutate.md`, `reread-repo-conventions.md`, `shotloom-docs-lane.md`, `shotloom.md`, `slack.md`, `task-context-routing.md`, `test-write.md`, `writing-external.md` |
| `index` | 1 | `index.md` |
<!-- /generated:readme-inventory -->

---

## Machine config (`private/agent-hub-config/`)

Gitignored. Per-machine paths and specs.

| File | Content |
|------|---------|
| `repo-paths.json` | Git repo locations keyed by project name |
| `machine-paths.json` | Tool/app paths (`obsidian`, `blender`, `unreal-editor`, fonts) |
| `doc-paths.json` | Document routing (Obsidian vault → purpose mapping) |
| `hardware.json` | Hardware specs — populated by `/system-save-hardware` |

Manage with `/ah-manage-config` (subcommands: `show`, `validate`, `add`, `remove`, `setup`).

## Shared registries (`agent/config/`)

| File | Content |
|------|---------|
| `agent-hub.json` | Harness, shared layer, registry, generated document, runtime path, and validator manifest |
| `context-routing.json` | Task route axes, context profiles, pilot files, and routing fixtures |
| `doc-budgets.json` | Document length budgets used by validator checks |
| `frontmatter-schema.json` | Frontmatter enum values and pilot metadata files |
| `taxonomy.json` | Skill categories, standard groups, naming patterns |
| `audit-policy.json` | Garden review thresholds and severity tiers |
| `exceptions.json` | Grandfathered exceptions with reason, decision, review date |

---

For authoring new shared skills and related artifacts, start at [`SYSTEM.md`](SYSTEM.md), then read `agent/skills/ah-manage-artifact/SKILL.md` and `agent/skills/ah-make-skill/SKILL.md`.
