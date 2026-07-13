# Knitten

Knitten is a lightweight Codex workflow core for compact, checked agent
workflows.

It keeps the common parts of Codex work small: deciding whether a workflow
matches, drafting a spec, implementing accepted work, reviewing prepared
artifacts, looping on blockers, resolving output paths, and checking plugin
health. The goal is not to use the fewest possible tokens at all costs. The goal
is to avoid loading instructions and doing work that the current request does
not need.

## Why It Exists

Codex skills are useful, but every exposed skill name, description, and eagerly
loaded instruction competes for prompt budget. Knitten keeps its active workflow
surface small and pushes detailed procedure into references that load only after
a match check passes.

Token efficiency here means:

- short active skill files,
- explicit Step 0 match checks,
- deferred references for detailed procedure,
- stable output paths for generated artifacts,
- local validation for source and installed-copy drift,
- no reduction in safety checks, review quality, or required implementation.

## Current Proof

These are source-level measurements from the current checkout. Re-run the
commands before changing public claims.

| Check | Current result | Re-run |
|-------|----------------|--------|
| Discovery surface | 8 skills, about 135 list tokens | `node scripts/measure-skill-exposure.mjs .` |
| Skill bodies | about 3193 `SKILL.md` tokens | `node scripts/measure-skill-exposure.mjs .` |
| Context-load smoke eval | 20/20 match accuracy, 72.8% average savings | `node scripts/run-context-load-smoke-eval.mjs` |

## Included Skills

| Skill | Use it for |
|-------|------------|
| `draft-spec` | Draft compact spec artifacts. |
| `implement` | Implement accepted specs, approved plans, or review findings. |
| `review` | Run read-only single/triad reviews from a prepared packet. |
| `review-fix-loop` | Repeat review, fix, and validation until blockers clear. |
| `report-finding` | Record checked mechanical workflow failures. |
| `log-usage` | Log local Codex usage and cost notes. |
| `status` | Check Knitten source, install, and runtime health. |
| `triad-preflight` | Run a lightweight role-split review preflight. |

## Quickstart

```bash
node scripts/validate-repository-shell.mjs
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
node scripts/measure-skill-exposure.mjs .
node scripts/run-context-load-smoke-eval.mjs
node scripts/run-compact-collector-pilot.mjs --run=knitten-health-pilot
```

Expected success signals:

- `repository shell ok`
- `materialize-local-plugin.mjs` writes or updates the local marketplace entry
- `node scripts/doctor.mjs` returns JSON with `"ok": true`
- `measure-skill-exposure.mjs` prints a `knitten` row with 8 skills
- `run-context-load-smoke-eval.mjs` returns `"ok": true`
- `run-compact-collector-pilot.mjs` prints compact JSON with summary,
  handoff, next-action, and raw artifact paths

If you have the Codex plugin validator available, also run:

```bash
python3 <path-to-validate_plugin.py> .
```

Expected success signal: `Plugin validation passed`.

## When To Use

Use Knitten when you want:

- a small Codex core for shared workflow skills,
- compact specs, reviews, reports, and local task records,
- repeatable output paths for generated workflow artifacts,
- short skill files that load detailed references only after a match,
- local checks for plugin health, output contracts, and stale install state.

## When Not To Use

Do not use Knitten as:

- a replacement for Codex skill discovery semantics,
- a generic guarantee that every task will use fewer tokens,
- a place to hide task-required implementation or review work,
- a reason to skip validation, safety checks, or evidence.

## Design

Knitten's active surface is deliberately small.

- **Match Check**: each skill starts by deciding whether the request actually
  belongs to that workflow.
- **Short Skill File**: active `SKILL.md` files keep the trigger, required
  inputs, safety checks, and reference pointer close to the top.
- **Deferred Context**: detailed flow references are loaded only after the
  request matches.
- **Output Runtime**: `bin/knitten-resolve-output` and `bin/knitten-path`
  provide stable locations for specs, reviews, reports, JSON handoffs, and
  local workflow records.
- **Agent Profiles**: `agent/config/agent-profiles.json` centralizes subagent
  model, reasoning, sandbox, and fallback settings behind
  `knitten-path agent-profile`.
- **Compact Collector Pilot**: `scripts/run-compact-collector-pilot.mjs`
  stores raw command output under a workflow run artifact and returns only
  compact summary, handoff, next-action, and evidence paths.
- **Health Checks**: `doctor`, repository-shell validation, exposure
  measurement, and smoke evals catch broken paths and installed-copy drift.
- **Safety First**: mutation, push, deploy, delete, and external-state checks
  stay in the main skill files.

Current milestone: see [`MILESTONE.md`](MILESTONE.md). Completed milestone
evidence is archived in
[`docs/milestones/completed.md`](docs/milestones/completed.md).

## Layout

| Path | Purpose |
|------|---------|
| `.codex-plugin/plugin.json` | Codex plugin manifest. |
| `MILESTONE.md` | Current focus and success criteria. |
| `docs/milestones/completed.md` | Completed milestone evidence and historical decisions. |
| `SYSTEM.md` | Core workflow and ownership contract. |
| `agent/AGENTS.md` | Codex entry document. |
| `agent/config/agent-profiles.json` | Core-owned semantic subagent profiles. |
| `skills/` | Shared workflow skills. |
| `document-templates/` | Shared workflow document templates. |
| `bin/knitten-resolve-output` | Path/output shim for generated artifacts. |
| `bin/knitten-path` | Stable path lookup surface. |
| `scripts/doctor.mjs` | Check source and local installation health. |
| `scripts/materialize-local-plugin.mjs` | Refresh the local plugin copy and marketplace entry. |
| `scripts/resolve-output.mjs` | Resolve durable docs and local workflow outputs. |
| `scripts/resolve-agent-profile.mjs` | Resolve a semantic subagent profile. |
| `scripts/measure-skill-exposure.mjs` | Estimate skill-list and skill-body exposure. |
| `scripts/run-context-load-smoke-eval.mjs` | Run the context-load smoke eval. |
| `scripts/run-compact-collector-pilot.mjs` | Capture repeated workflow raw output as local artifacts and print a compact summary. |
| `docs/guidelines/skill-authoring.md` | Rules for short, token-conscious skills. |
| `docs/guidelines/public-metadata.md` | Public wording and claim guardrails. |
| `docs/specs/` | Design notes for the core and runtime. |

## Local Codex Install

Knitten is designed for a local Codex marketplace.

```bash
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
```

The materialize script copies this checkout into:

```text
<home-directory>/plugins/knitten
```

It also updates the personal marketplace manifest:

```text
<home-directory>/.agents/plugins/marketplace.json
```

Codex can enable the local plugin with:

```toml
[marketplaces.knitten-local]
source_type = "local"
source = "<home-directory>"

[plugins."knitten@knitten-local"]
enabled = true
```

The materialized copy receives a local `+codex.<timestamp>` version suffix. The
source manifest stays stable.

Restart Codex after refreshing plugin installations. Existing sessions may keep
a cached skill list until a new session starts.

## Path Rules

Active Knitten docs and helper scripts should avoid personal absolute paths.
Use markers such as `<home-directory>` and `<plugins-root>`, or prefer
explicit environment variables before `$HOME` fallbacks in executable helpers.

Archived specs may keep local paths as evidence. Active setup
instructions should not depend on machine-specific paths.

## License

MIT License. See `LICENSE`.
