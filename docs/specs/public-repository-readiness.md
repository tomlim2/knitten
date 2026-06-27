# Public Repository Readiness

## Status

Implemented.

## Goal

Make Knitten understandable and useful to a new external Codex user without
requiring private context. The repository should explain the problem, show a
measured proof point, provide a short try path, and document how to copy the
domain-plugin pattern.

## Problem

Knitten now has a cleaner core/domain-plugin naming model, but the repository
still reads like an internal operating repo in several places:

- The README explains the architecture before it proves why a reader should
  care.
- The token-efficiency claim is present, but the measured proof is not visible
  in the first screen.
- The install path exists, but a new user does not yet have a short "try this"
  path with expected output.
- The domain-plugin model is described, but there is no minimal external-facing
  example that someone can copy.
- GitHub-facing metadata such as About text, topics, and release wording is not
  recorded as a durable checklist.

This makes the project harder to star, evaluate, or adopt even if the core idea
is useful.

## Boundary

In scope:

- README first-screen rewrite for public adoption.
- A measured proof block using current source-level exposure and the
  context-load smoke eval.
- Copy-paste quickstart for local validation.
- A minimal domain-plugin example.
- GitHub About/topics/release wording recommendation recorded in the repo.
- Validation that public claims cite recorded measurements.

Out of scope:

- Changing Codex skill discovery semantics.
- Promising universal token reduction.
- Publishing GitHub releases or editing GitHub repository settings in this
  implementation pass.
- Moving private Shotloom, KAS, or Unreal details into the public core README.
- Adding broad marketing copy that is not backed by current repository behavior.
- Rewriting historical specs solely to remove old terminology.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `README.md` | Yes | Main public landing surface. |
| `.codex-plugin/plugin.json` | Yes | Plugin About text and marketplace-facing summary. |
| `MILESTONE.md` | Yes | Priority source of truth for current work. |
| `docs/specs/context-load-smoke-eval.md` | Yes | Current token/context experiment contract. |
| `scripts/measure-skill-exposure.mjs` | Yes | Repeatable source-level exposure measurement. |
| `scripts/run-context-load-smoke-eval.mjs` | Yes | Repeatable context-load smoke eval. |
| `scripts/doctor.mjs` | Yes | Local installation and copied-plugin health proof. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Adoption-ready README | durable | First screen, proof, quickstart, and fit guidance for external readers. |
| Minimal domain-plugin example | durable | Copyable example plugin with a short skill plus deferred reference. |
| Public metadata note | durable | Recommended GitHub About text, topics, and release wording, with clear applied/not-applied status. |
| Validation evidence | local | Commands proving README claims and plugin health remain current. |

## Contract

- The first README screen must answer: what Knitten is, what problem it solves,
  and what evidence exists.
- Public token-efficiency wording must say "avoids unnecessary context/work"
  rather than "always uses fewer tokens."
- Numeric claims must cite commands or recorded outputs that can be re-run from
  this repository.
- The first proof block must include current source-level KC exposure and the
  20-case context-load smoke eval result.
- The current measured values at spec acceptance are:
  - KC skill list: about `117` tokens from `node scripts/measure-skill-exposure.mjs .`.
  - KC `SKILL.md` bodies: about `3290` tokens from the same command.
  - Context-load smoke eval: `20/20` match accuracy and `63.1%` average savings
    from `node scripts/run-context-load-smoke-eval.mjs`.
  These values must be refreshed before public README claims are changed.
- The quickstart must be copy-pasteable and include expected success signals.
- The example must not depend on private repositories, private paths, or
  Shotloom/KAS-specific knowledge.
- The example lives under `examples/minimal-domain-plugin/` and is validated as
  a domain plugin example.
- Repository-shell validation must be updated intentionally to allow
  `examples/minimal-domain-plugin/**`.
- GitHub settings that cannot be changed by repo files are recorded in
  `docs/guidelines/public-metadata.md` as recommendations, not silently assumed
  done.
- Existing legacy CLI compatibility aliases may stay if they are explicitly
  labeled as compatibility surfaces.

## Validation

- `python3 <plugin-validator-path> .`
- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `node scripts/measure-skill-exposure.mjs .`
- `node scripts/run-context-load-smoke-eval.mjs`
- `node scripts/validate-domain-plugin-boundary.mjs --domain-plugin examples/minimal-domain-plugin --warn-only`
- `! rg -n "always fewer|guaranteed token|universal token" README.md .codex-plugin/plugin.json docs/guidelines/public-metadata.md examples/minimal-domain-plugin`
- `! rg -n "Shotloom|KAS|Unreal|CINEV|/Users/" README.md .codex-plugin/plugin.json docs/guidelines/public-metadata.md examples/minimal-domain-plugin`
- `git diff --check`

## Acceptance Criteria

- README first viewport states the lightweight Codex workflow core claim in one
  or two sentences.
- README includes a measured proof block with the latest KC skill-list exposure
  and context-load smoke eval result.
- README includes a short quickstart that runs local validation and explains the
  expected success output.
- README has "When to use" and "When not to use" sections to avoid over-selling.
- A minimal domain-plugin example exists and can be understood without private
  repo context.
- GitHub About/topics recommendations are recorded in
  `docs/guidelines/public-metadata.md`, and the file says they are recommended
  unless applied outside the repo.
- Plugin About text matches the README's public positioning.
- Validation passes after materializing the local plugin copy.

## Open Questions

- None.

## Design Plan

### Inputs

- This spec.
- `MILESTONE.md`.
- Current `README.md`.
- Current `.codex-plugin/plugin.json`.
- Current exposure and smoke-eval commands.

### Outputs

- Updated README and plugin About text.
- Minimal domain-plugin example under `examples/minimal-domain-plugin/`.
- Public metadata recommendation under `docs/guidelines/public-metadata.md`.
- Validation evidence.

### Implementation Sequence

#### 1. Rewrite The README First Screen

Files:

- `README.md`

Changes:

- Start with a short external-facing claim:
  "Knitten is a lightweight Codex workflow core that keeps shared skills small
  and loads domain-specific context only after a clear match."
- Add a compact proof block near the top:
  - KC skill-list exposure from `measure-skill-exposure.mjs`.
  - Context-load smoke eval result from `run-context-load-smoke-eval.mjs`.
- Move deeper architecture detail below quickstart.

Risk:

- Over-compressing the README can hide important safety and boundary rules.

Proof:

- A reader can understand the project from the first screen without reading
  `MILESTONE.md`.
- Numeric claims match the current command output.

#### 2. Add A Copy-Paste Quickstart

Files:

- `README.md`

Changes:

- Add a short local validation path:
  - validate plugin manifest,
  - run repository shell validation,
  - run doctor,
  - run exposure measurement,
  - run context-load smoke eval.
- Include expected success signals such as `Plugin validation passed`,
  `repository shell ok`, `doctor ok`, and context eval pass metrics.

Risk:

- Hardcoding machine-specific paths can make the quickstart look private.

Proof:

- Quickstart uses placeholders or repo-local commands where possible.
- The commands pass in the active checkout.

#### 3. Add Minimal Domain-Plugin Example

Files:

- `examples/minimal-domain-plugin/.codex-plugin/plugin.json`
- `examples/minimal-domain-plugin/README.md`
- `examples/minimal-domain-plugin/skills/example-note/SKILL.md`
- `examples/minimal-domain-plugin/skills/example-note/references/flow.md`
- `scripts/validate-repository-shell.mjs`

Changes:

- Show a tiny domain plugin with:
  - one `SKILL.md`,
  - `match-check`,
  - Step 0,
  - one deferred `references/flow.md`,
  - no private paths.
- Explain how it differs from Knitten Core.
- Keep the example intentionally non-published: it demonstrates the file shape
  and validation path, not a new official plugin package.

Risk:

- A full scaffold can distract from the core repo or imply a supported template
  generator that does not exist yet.

Proof:

- The example is short enough to copy by hand.
- Repository shell validation intentionally allows any new example path.
- `node scripts/validate-domain-plugin-boundary.mjs --domain-plugin examples/minimal-domain-plugin --warn-only`

#### 4. Record GitHub Discoverability Metadata

Files:

- `docs/guidelines/public-metadata.md`
- `.codex-plugin/plugin.json`
- `CHANGELOG.md`

Changes:

- Record recommended GitHub About text:
  "Lightweight Codex workflow core for small shared skills and domain plugins."
- Record recommended topics:
  - `codex`
  - `codex-plugin`
  - `ai-agent`
  - `developer-tools`
  - `workflow-automation`
  - `prompt-engineering`
  - `token-optimization`
- Align plugin manifest description and interface text with the same wording.
- State that topics/About must be applied manually through GitHub settings or a
  later authenticated `gh repo edit` task.

Risk:

- GitHub topics may be mistaken as applied if only documented.

Proof:

- The docs clearly say whether metadata is recommended or applied.

#### 5. Validate And Review Public Claims

Files:

- `README.md`
- `.codex-plugin/plugin.json`
- `examples/minimal-domain-plugin/**`
- `docs/guidelines/public-metadata.md`

Changes:

- Run validation.
- Scan for over-claims and private context.
- Refresh the local plugin copy if manifest or installed-copy surfaces changed.

Risk:

- A true current measurement can become stale later.

Proof:

- Commands listed under `Validation` pass.
- README says measurements are current as of the run or points to commands to
  refresh them.

### Review Plan

- Contract: verify the public-facing README proves the claim without
  over-promising token savings.
- Boundary: verify no private Shotloom/KAS details become required to understand
  or copy the public pattern.
- Validation: require plugin validation, repository shell validation, doctor,
  exposure measurement, context-load smoke eval, and diff whitespace checks.
