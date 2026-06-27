# KC/KAS Hardcoded Path Cleanup

## Status

Draft.

## Goal

Reduce hardcoded machine-local paths in Knitten Core (KC) and Knitten All
Skills (KAS) without removing useful installation contracts or historical
evidence. Active code and active user-facing docs should use configurable
roots, placeholders, or documented platform paths instead of personal absolute
paths.

## Problem

KC and KAS both contain path strings such as `/Users/...`, `~/.claude`,
`~/.codex`, `$HOME/plugins/knitten`, and `/tmp/...`. Some are legitimate
platform or local-config contracts, but others are stale examples, legacy
Claude-era paths, or machine assumptions that make the plugin split feel less
portable.

The cleanup needs a narrow contract. A full rewrite of historical specs and
completed plans would be noisy and low value.

## Boundary

In scope:

- KC active README and public-core docs that show local installation paths.
- KC and KAS executable helper scripts that locate plugin roots, local
  marketplaces, output folders, or temporary files.
- KAS active skill code and active skill instructions that rely on legacy
  `.claude` or machine-local paths.
- Documentation of which path forms are intentional contracts.

Out of scope:

- Historical specs, completed plans, and archived reports unless they are
  presented as current setup instructions.
- Domain-specific private config paths when they are the actual external
  contract, such as `~/.config/cinev/...`.
- Example user input paths such as `~/Downloads/file.exr` when they are clearly
  examples and not runtime defaults.
- Replacing the full output/path runtime.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| KC source checkout | Yes | `<kc-root>`, the active Knitten Core source checkout. |
| KAS source checkout | Yes | `<kas-root>`, the active Knitten All Skills source checkout. |
| Path scan results | Yes | Current `rg` hits for local absolute paths, home paths, plugin install paths, and temp paths. |
| Existing output/path runtime | Yes | KC `bin/knitten-resolve-output`, KC `scripts/resolve-output.mjs`, and KAS forwarding helpers. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| KC doc/code cleanup | durable | KC active docs and helper behavior no longer expose personal absolute paths where placeholders or env vars should be used. |
| KAS doc/code cleanup | durable | KAS active helpers and skills use Knitten-aware or configurable paths where practical. |
| Intentional path contract list | durable | A short rule in docs or README that distinguishes platform paths, private config paths, examples, and forbidden machine paths. |
| Validation evidence | local | Commands proving docs, scripts, and plugin diagnostics still pass. |

## Contract

- KC must not name KAS as a required dependency in active core instructions.
- Payload plugins may know how to attach to KC, including the local marketplace
  plugin id and the KC output/path shim.
- Active docs must avoid personal absolute paths like `/Users/deem...` and
  `/Users/younsoolim...`; use `$HOME`, `<marketplace-root>`,
  `<plugins-root>`, or `<payload-plugin>` instead.
- Executable helpers must prefer explicit env/config inputs before `$HOME`
  fallbacks.
- Legacy `.claude` paths must not be used by active KAS code unless the skill is
  explicitly for Claude runtime compatibility.
- `/tmp/...` defaults should be replaced with plugin-local or configurable
  output locations when the output is part of a skill workflow.
- Historical specs may keep old paths as evidence, but they must not be
  referenced as current install instructions.

## Validation

- `git -C <kc-root> diff --check`
- `git -C <kas-root> diff --check`
- `node <kc-root>/scripts/doctor.mjs`
- `node <kas-root>/scripts/doctor.mjs`
- Targeted `rg` scans showing no personal absolute paths remain in active docs
  or executable path defaults, except allowlisted platform/private-config paths.

## Acceptance Criteria

- KC active README and public-core docs use placeholders or `$HOME` instead of
  personal absolute paths.
- KAS README documents the payload install contract without copying KC policy.
- KAS active code no longer depends on `~/.claude/private/...` for current
  plugin operation.
- KAS temp-producing scripts avoid hardcoded `/tmp/...` when a Knitten-local or
  configurable output location is available.
- `$HOME/plugins/knitten` remains only as a documented fallback after
  `KNITTEN_PLUGINS_ROOT` or an explicit path has been checked.
- The cleanup does not rewrite historical specs just to erase evidence.

## Decisions

- KAS `resolve-repo-path.mjs` keeps the `~/Desktop/www/<repo-key>` fallback only
  behind `KNITTEN_ENABLE_DESKTOP_REPO_FALLBACK=1`.
- KAS domain-private config paths such as `~/.config/cinev/...` remain domain
  contracts in this pass.

## Design Plan

### Inputs

- KC and KAS path scan output.
- Current KC/KAS README installation sections.
- KAS helper files under `scripts/` and `agent/lib/`.
- Active KAS skill code with legacy `.claude` or `/tmp` defaults.

### Outputs

- Updated KC docs.
- Updated KAS docs and targeted helper/skill code.
- Validation output from KC and KAS.
- A short residual-risk note for intentional paths left in place.

### Implementation Sequence

#### 1. Classify Path Hits

Files:

- `README.md`
- `docs/public-core/README.md`
- `scripts/**`
- `bin/**`
- `agent/lib/**`
- `skills/**/SKILL.md`
- `skills/**/*.py`
- `skills/**/*.mjs`

Changes:

- Mark each hit as `personal-absolute`, `platform-contract`,
  `private-config-contract`, `example-input`, `legacy-evidence`, or
  `runtime-fallback`.
- Do not edit historical specs during classification.

Risk:

- Over-classifying examples as defects could create noisy churn.

Proof:

- `rg` scan grouped by repository and category.

#### 2. Clean KC Active Docs

Files:

- `README.md`
- `docs/public-core/README.md`

Changes:

- Replace personal absolute paths with `$HOME`, `<marketplace-root>`,
  `<plugins-root>`, and `<payload-plugin>`.
- Keep KC/KAS dependency direction clear: KC knows payload plugins generally;
  payload plugins document their KC attachment.

Risk:

- Too much abstraction can make local install instructions less usable.

Proof:

- `rg -n "/Users/|/Users/deem|/Users/younsoolim" README.md docs/public-core/README.md`
  returns no active install examples.

#### 3. Clean KAS Active Runtime Paths

Files:

- `scripts/resolve-knitten-output`
- `agent/lib/resolve-output.mjs`
- `agent/lib/resolve-local-artifact-path.mjs`
- `agent/lib/prepare-local-bin.mjs`
- `agent/lib/resolve-helper-path.mjs`
- `agent/lib/resolve-repo-path.mjs`
- `skills/tutoring-log-lesson/utils.py`
- `skills/review-audit-ai-motion/analyze.py`

Changes:

- Keep `KNITTEN_PLUGINS_ROOT` as the first-class KC locator.
- Keep `$HOME/plugins/knitten` only as a fallback where the local marketplace
  contract requires it.
- Replace legacy `.claude/private/...` active config lookup with a current
  plugin/private config location or environment variable.
- Replace hardcoded `/tmp/motion-audit` with a configurable or Knitten-local
  output directory.
- Avoid broad rewrites of domain skill examples.

Risk:

- Some private skills may depend on legacy paths in existing local data.

Proof:

- Targeted tests or script smoke checks for changed helpers.
- KAS `node scripts/doctor.mjs`.

#### 4. Document Intentional Path Rules

Files:

- KC boundary or README documentation.
- KAS README when the rule is payload-specific.

Changes:

- Add a short rule that active docs/code should not commit personal absolute
  paths.
- Explicitly allow platform paths, private config contracts, examples, and
  historical evidence when labeled.

Risk:

- Duplicating policy in KAS could make the payload plugin own KC policy.

Proof:

- KAS refers back to KC for boundary policy and only documents payload-local
  install needs.

#### 5. Validate And Review

Files:

- Changed files only.

Changes:

- Run KC and KAS diagnostics.
- Run path scans after cleanup and list intentional leftovers.

Risk:

- `doctor.mjs` may pass while a specific skill path remains stale.

Proof:

- KC `node scripts/doctor.mjs`
- KAS `node scripts/doctor.mjs`
- `git diff --check` in both repositories.
- Targeted `rg` scans for personal absolute paths in active surfaces.

### Review Plan

- Contract: verify KC remains generic and KAS owns only payload install
  attachment details.
- Boundary: verify historical docs are not rewritten without value.
- Validation: verify both repositories pass diagnostics and path scans have
  reviewed leftovers only.
