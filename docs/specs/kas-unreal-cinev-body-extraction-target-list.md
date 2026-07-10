# KAS Unreal/CINEV Body Extraction Target List

## Status

Accepted and implemented 2026-07-07.

This was the separate target list required by
[`domain-exposure-audit-plan.md`](domain-exposure-audit-plan.md) before editing
KAS domain plugin skills. It approved only the scoped body extraction described
below, not broad migration.

## Target Plugin

```text
/Users/deemooooooooo/Desktop/www/plugins/knitten-all-skills
```

## Goal

Reduce selected-skill body exposure for KAS Unreal/CINEV helpers while keeping
the same skill names, activation gates, safety rules, scripts, and user-facing
behavior.

Default list exposure is not the target. The measured list metadata for KAS is
already small at about `426` tokens.

## Exact Skill Targets

| Skill | Current SKILL.md approx tokens | Keep In SKILL.md | Move Out Of SKILL.md |
|---|---:|---|---|
| `ue-analyze-material` | 920 | frontmatter, Step 0 activation check, owned standard pointers, short responsibility, after-activation read instruction | detailed export/analyze procedure, usage walkthrough, output interpretation |
| `cci-validate-character-mat-slot-names` | 865 | frontmatter, Step 0 activation check, required standard pointer, short responsibility, after-activation read instruction | two-step workflow details, validation report shape, usage examples |
| `ue-generate-spritesheet` | 662 | frontmatter, Step 0 activation check, short responsibility, after-activation read instruction | generation procedure, parameter details, output workflow |
| `ue-cleanup-assets` | 652 | frontmatter, Step 0 activation check, destructive safety gate, short responsibility, after-activation read instruction | discovery/deletion procedure, detailed command flow, reporting shape |
| `ue-check-redirectors` | 651 | frontmatter, Step 0 activation check, short responsibility, after-activation read instruction | redirector scan/fix procedure, usage examples |
| `cci-deploy-pmx-character` | 632 | frontmatter, Step 0 activation check, mutation/build safety gate, short responsibility, after-activation read instruction | PMX-to-UE pipeline steps, argument details, troubleshooting |
| `cci-rename-mat-slot` | 608 | frontmatter, Step 0 activation check, destructive safety gate, short responsibility, after-activation read instruction | rename procedure, validation pairing details, usage examples |
| `ue-show-template` | 574 | frontmatter, Step 0 activation check, short responsibility, after-activation read instruction | template reference detail and examples |

## Expected Reduction

Current selected-body exposure for the eight target skills is about `5564`
approximate tokens.

Target budget:

- keep each active `SKILL.md` body at or below about `350` approximate tokens,
- keep default list exposure unchanged except for incidental wording cleanup,
- avoid adding a shared mega-reference that every target skill must load.

If all target skills reach the budget, selected-body exposure for this target
set should fall to about `2800` tokens or less. That is a rough target for
selected-skill context only, not a promise about total session tokens.

## Behavior That Must Stay Unchanged

- Skill directory names and frontmatter `name` values remain unchanged.
- Activation checks remain strict for Unreal/CINEV asset mutation workflows.
- Mutation, deletion, Unreal Editor execution, and build/deploy steps still
  require the same explicit user intent as before.
- Existing script entry points remain in the same skill directories.
- Existing standards references stay owned by their current skill directories.
- No KAS skill is deleted, moved to Knitten Core, or split into a new plugin in
  this target list.

## Implementation Shape

For each target skill:

1. Keep `SKILL.md` as the activation and safety surface.
2. Create or reuse a skill-local `flow.md` when the detailed procedure is more
   than a short after-activation instruction.
3. Keep standards or long examples in skill-local `references/` only when the
   current skill already owns that context or clearly needs a reusable document.
4. Prefer existing scripts over rewriting procedural detail into prose.
5. Do not consolidate unrelated Unreal/CINEV procedures into one shared flow
   unless the duplication is real and the shared document would be loaded only
   after activation.

## Validation Commands

Run from `/Users/deemooooooooo/Desktop/www/plugins/knitten-all-skills`:

```bash
git diff --check
node scripts/validate-activation.mjs
node scripts/check-skill-links.mjs
node scripts/doctor.mjs
```

Run from `/Users/deemooooooooo/Desktop/www/plugins/knitten`:

```bash
node scripts/measure-skill-exposure.mjs \
  /Users/deemooooooooo/Desktop/www/plugins/knitten-all-skills
```

Record the before/after KAS skill-body measurement in the implementation
summary or a follow-up result note.

## Excluded From This Target List

- `dev-generate-spec`: measured and useful, but it is not Unreal/CINEV. Handle
  it in a second target list.
- KSL skills: current KSL selected bodies are modest and already use deferred
  flow references.
- Description-only cleanup: measured default list exposure is low enough that
  trimming descriptions is not useful as a standalone cycle.
- Broad domain-plugin migration, skill deletion, plugin split, or manifest
  reshaping.

## Acceptance Gate

This target list was accepted by the user before KAS source edits started.

## Implementation Result

Implemented in `/Users/deemooooooooo/Desktop/www/plugins/knitten-all-skills`.

Changed:

- `SKILL.md` bodies for the eight target skills now keep activation, safety,
  short responsibility, and after-activation read instructions.
- Detailed procedures moved into skill-local `flow.md` files for seven target
  skills.
- `ue-show-template` now points directly to its existing `reference.md`.
- The local installed `knitten-all-skills` plugin copy was refreshed with
  `node scripts/materialize-local-plugin.mjs` so `doctor` can verify source and
  copied files match.

Measured result:

| Measurement | Before | After |
|---|---:|---:|
| KAS default list exposure | 426 tokens | 426 tokens |
| KAS total `SKILL.md` body exposure | 10448 tokens | 7026 tokens |
| Target skill selected-body exposure | about 5564 tokens | 2142 tokens |

Each target `SKILL.md` is now below the target budget of about `350` tokens:

| Skill | After approx tokens |
|---|---:|
| `ue-analyze-material` | 286 |
| `cci-validate-character-mat-slot-names` | 290 |
| `ue-generate-spritesheet` | 231 |
| `ue-cleanup-assets` | 256 |
| `ue-check-redirectors` | 239 |
| `cci-deploy-pmx-character` | 318 |
| `cci-rename-mat-slot` | 262 |
| `ue-show-template` | 260 |

Validation passed:

```bash
git diff --check
node scripts/validate-activation.mjs
node scripts/check-skill-links.mjs
node scripts/doctor.mjs
node /Users/deemooooooooo/Desktop/www/plugins/knitten/scripts/measure-skill-exposure.mjs \
  /Users/deemooooooooo/Desktop/www/plugins/knitten-all-skills
```
