# Domain Exposure Audit Plan

## Status

Measured 2026-07-07.

This note closes the current Knitten Core milestone item for KSL/KAS exposure.
It is a measurement and target-selection plan, not approval to migrate or edit
domain plugin skills.

Follow-up: the first target list,
[`kas-unreal-cinev-body-extraction-target-list.md`](kas-unreal-cinev-body-extraction-target-list.md),
was accepted and implemented on 2026-07-07.

## Scope

Measured source roots:

```text
/Users/deemooooooooo/Desktop/www/plugins/knitten
/Users/deemooooooooo/Desktop/www/plugins/knitten-sl
/Users/deemooooooooo/Desktop/www/plugins/knitten-all-skills
```

Knitten Core records the audit because the milestone is about core/domain
discipline. KSL and KAS remain the owners of their domain skills and support
files.

## Method

Command:

```bash
node scripts/measure-skill-exposure.mjs \
  /Users/deemooooooooo/Desktop/www/plugins/knitten \
  /Users/deemooooooooo/Desktop/www/plugins/knitten-sl \
  /Users/deemooooooooo/Desktop/www/plugins/knitten-all-skills
```

Approximation:

- `list approx tokens` counts exposed plugin skill name plus frontmatter
  `description`, using `ceil(chars / 4)`.
- `SKILL.md approx tokens` counts active `SKILL.md` body text, using
  `ceil(chars / 4)`.
- References, flows, scripts, and promoted references are not counted as default
  list exposure. They count only when a selected skill tells the agent to load
  them.

## Baseline Measurement Summary

These numbers are the baseline that selected the follow-up target list. The
implemented KAS Unreal/CINEV extraction result is recorded in
[`kas-unreal-cinev-body-extraction-target-list.md`](kas-unreal-cinev-body-extraction-target-list.md).

| Plugin | Skills | List chars | List approx tokens | SKILL.md chars | SKILL.md approx tokens |
|---|---:|---:|---:|---:|---:|
| `knitten` | 8 | 527 | 135 | 15702 | 3929 |
| `knitten-sl` | 28 | 1920 | 493 | 23076 | 5778 |
| `knitten-all-skills` | 21 | 1674 | 426 | 41759 | 10448 |
| Total | 57 | 4121 | 1054 | 80537 | 20155 |

Interpretation:

- KSL and KAS together add about `919` default list tokens. That is not large
  enough to justify broad skill deletion, plugin splitting, or description-only
  trimming in this batch.
- Remaining exposure is mostly selected-skill body size, not always-loaded list
  metadata.
- KAS has the largest selected-body concentration. KSL's largest active
  `SKILL.md` bodies are smaller and already defer most detailed flow to
  `flow.md` or references.

## Largest KSL/KAS Metadata

| Plugin | Skill | Description chars | Approx list tokens |
|---|---|---:|---:|
| `knitten-sl` | `shotloom-reclaim-disk` | 88 | 31 |
| `knitten-sl` | `shotloom-goal-orchestrator` | 47 | 22 |
| `knitten-sl` | `shotloom-prepare-task` | 45 | 20 |
| `knitten-sl` | `shotloom-review-asset-library-pr` | 45 | 23 |
| `knitten-sl` | `shotloom-implement-code` | 44 | 20 |
| `knitten-all-skills` | `image-make-drink-iso` | 95 | 34 |
| `knitten-all-skills` | `system-save-hardware` | 48 | 22 |
| `knitten-all-skills` | `cci-validate-character-mat-slot-names` | 45 | 26 |
| `knitten-all-skills` | `dev-log-experiment` | 44 | 21 |
| `knitten-all-skills` | `dev-draw-flow` | 43 | 19 |

Finding: no description is large enough to be the next useful cleanup target on
its own.

## Largest KSL/KAS Skill Bodies

| Plugin | Skill | SKILL.md chars | Approx body tokens |
|---|---|---:|---:|
| `knitten-sl` | `shotloom-reclaim-disk` | 1381 | 346 |
| `knitten-sl` | `shotloom-review-asset-library-pr` | 1146 | 287 |
| `knitten-sl` | `shotloom-clean-unused-worktrees` | 1123 | 281 |
| `knitten-sl` | `shotloom-deploy-web` | 1020 | 255 |
| `knitten-sl` | `shotloom-implement-code` | 962 | 241 |
| `knitten-all-skills` | `ue-analyze-material` | 3680 | 920 |
| `knitten-all-skills` | `cci-validate-character-mat-slot-names` | 3457 | 865 |
| `knitten-all-skills` | `dev-generate-spec` | 3293 | 824 |
| `knitten-all-skills` | `ue-generate-spritesheet` | 2647 | 662 |
| `knitten-all-skills` | `ue-cleanup-assets` | 2607 | 652 |
| `knitten-all-skills` | `ue-check-redirectors` | 2603 | 651 |
| `knitten-all-skills` | `cci-deploy-pmx-character` | 2526 | 632 |
| `knitten-all-skills` | `cci-rename-mat-slot` | 2429 | 608 |
| `knitten-all-skills` | `ue-show-template` | 2295 | 574 |
| `knitten-all-skills` | `consulting-log-session` | 1925 | 482 |

## Ranked Candidates

| Rank | Candidate | Measured Exposure | Usefulness | Recommended Action |
|---:|---|---|---|---|
| 1 | KAS Unreal/CINEV procedural skills: `ue-analyze-material`, `cci-validate-character-mat-slot-names`, `ue-generate-spritesheet`, `ue-cleanup-assets`, `ue-check-redirectors`, `cci-deploy-pmx-character`, `cci-rename-mat-slot`, `ue-show-template` | High selected-body exposure: the listed top bodies range from about 574 to 920 tokens each. | High. These are concrete workflows with scripts and strict activation checks. | Keep the skills. If this becomes accepted work, move procedure details from `SKILL.md` into skill-local `flow.md`, references, or scripts while keeping activation and safety gates in `SKILL.md`. |
| 2 | KAS `dev-generate-spec` | High selected-body exposure: about 824 tokens. | Medium-high. Useful utility, but body text is procedural and can be deferred. | Add a skill-local flow/reference in KAS if this skill is selected as a target. Do not fold it into Knitten Core. |
| 3 | KSL local ops utilities: `shotloom-reclaim-disk`, `shotloom-clean-unused-worktrees`, `shotloom-deploy-web` | Low-to-medium selected-body exposure: about 255 to 346 tokens each. | High for Shotloom operations. | No immediate migration. Only trim opportunistically when editing those skills for functional reasons. |
| 4 | KSL review/implementation workflow skills | Low selected-body exposure compared with KAS; largest examples are around 205 to 287 tokens. | High for active Shotloom work. | No broad consolidation. Current deferred `flow.md` pattern is already working. |
| 5 | KSL/KAS description metadata | Low default list exposure: about 919 tokens combined for KSL and KAS. | Mixed. Descriptions are the discovery surface, so aggressive trimming can hurt matching. | No description-only cleanup in this batch. |

## Gate For Future Work

No domain plugin migration starts from this note alone.

Before editing KSL or KAS, create or accept a separate target list that names:

- target plugin,
- exact skills to change,
- expected body/list exposure reduction,
- behavior that must stay unchanged,
- validation commands for that domain plugin.

Recommended target lists:

1. KAS Unreal/CINEV body extraction for the top body-size skills - implemented:
   [`kas-unreal-cinev-body-extraction-target-list.md`](kas-unreal-cinev-body-extraction-target-list.md).
2. KAS `dev-generate-spec` flow extraction.
3. KSL opportunistic trims only when a KSL skill is already being edited for
   functional reasons.

## Decision

The next useful work is not a broad domain-plugin migration. The measured data
supports a narrow KAS target list focused on selected-body exposure, with KSL
left as-is for now.
