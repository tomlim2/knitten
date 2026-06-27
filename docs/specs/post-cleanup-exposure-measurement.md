# Post-Cleanup Exposure Measurement

## Status

Measured 2026-06-27.

## Method

Command:

```bash
node scripts/measure-skill-exposure.mjs \
  /Users/younsoolim/Desktop/www/knitten \
  /Users/younsoolim/Desktop/www/knitten-sl \
  /Users/younsoolim/Desktop/www/knitten-all-skills
```

Approximation:

- `list approx tokens` counts exposed skill name plus frontmatter
  `description`, using `ceil(chars / 4)`.
- `SKILL.md approx tokens` counts the whole active `SKILL.md`, using
  `ceil(chars / 4)`.
- This is a fresh source-level estimate, not the already-loaded current Codex
  session. It does not count unrelated system/OpenAI skills.
- References, flows, and scripts are not default list exposure. They count only
  after a selected skill instructs Codex to read them.

## Summary

| Plugin | Skills | List chars | List approx tokens | SKILL.md chars | SKILL.md approx tokens |
|---|---:|---:|---:|---:|---:|
| `knitten` | 7 | 720 | 183 | 11307 | 2829 |
| `knitten-sl` | 27 | 2338 | 595 | 22573 | 5656 |
| `knitten-all-skills` | 21 | 1674 | 426 | 43311 | 10837 |
| Total | 55 | 4732 | 1204 | 77191 | 19322 |

Interpretation:

- Default Knitten Core/KSL/KAS skill-list exposure is now roughly `1.2k` tokens.
- KAS is no longer large at the shallow list layer: about `426` tokens for
  21 exposed skills.
- The remaining size is mostly selected-skill body size, especially KAS Unreal
  and CINEV helpers.
- The old `~157.6k` KAS number is no longer comparable to the current source
  state because KAS has been split and trimmed. Under this measurement, KAS
  shallow list exposure is about `99.7%` lower than `157.6k`; KAS active
  `SKILL.md` body total is about `93.1%` lower. The exact old method likely
  included broader bodies/references, so treat this as a directional
  comparison, not a strict same-method delta.

## Largest Description Metadata

| Plugin | Skill | Description chars | List approx tokens |
|---|---|---:|---:|
| `knitten` | `log-usage` | 274 | 74 |
| `knitten` | `review-fix-loop` | 72 | 25 |
| `knitten` | `review` | 58 | 19 |
| `knitten-sl` | `shotloom-triad-rca` | 218 | 62 |
| `knitten-sl` | `shotloom-goal-orchestrator` | 156 | 49 |
| `knitten-sl` | `shotloom-frontend-dev-mode` | 112 | 38 |
| `knitten-all-skills` | `image-make-drink-iso` | 95 | 34 |
| `knitten-all-skills` | `system-save-hardware` | 48 | 22 |
| `knitten-all-skills` | `cci-validate-character-mat-slot-names` | 45 | 26 |
| `knitten-all-skills` | `dev-log-experiment` | 44 | 21 |

## Largest Active Skill Bodies

| Plugin | Skill | SKILL.md chars | Approx tokens |
|---|---|---:|---:|
| `knitten` | `log-usage` | 2497 | 625 |
| `knitten` | `draft-spec` | 2403 | 601 |
| `knitten` | `review` | 1694 | 424 |
| `knitten-sl` | `shotloom-review-asset-library-pr` | 1158 | 290 |
| `knitten-sl` | `shotloom-frontend-dev-mode` | 1090 | 273 |
| `knitten-sl` | `shotloom-triad-rca` | 1074 | 269 |
| `knitten-all-skills` | `ue-analyze-material` | 3857 | 965 |
| `knitten-all-skills` | `cci-validate-character-mat-slot-names` | 3521 | 881 |
| `knitten-all-skills` | `dev-generate-spec` | 3285 | 822 |
| `knitten-all-skills` | `ue-generate-spritesheet` | 2894 | 724 |

## KAS Audit

Measured facts:

- KAS default list exposure is small enough that description trimming is now a
  minor win.
- KAS selected-body exposure is concentrated in Unreal/CINEV helpers:
  `ue-analyze-material`, `cci-validate-character-mat-slot-names`,
  `dev-generate-spec`, `ue-generate-spritesheet`, `ue-cleanup-assets`,
  `ue-check-redirectors`, `cci-deploy-pmx-character`, `ue-show-template`, and
  `cci-rename-mat-slot`.
- KAS still carries several skill bodies above `600` approximate tokens.

Recommended next actions:

- Do not delete KAS skills based only on shallow list exposure; the measurable
  default cost is already low.
- For token savings during real work, slim the largest KAS `SKILL.md` bodies
  by moving detailed procedures into `flow.md` or scripts and keeping only
  activation, safety gates, and exact read instructions in `SKILL.md`.
- Treat Unreal/CINEV as the next candidate for a separate payload only if those
  skills are not needed in ordinary KAS sessions. The bigger gain would be
  avoiding accidental body reads, not shrinking descriptions.
- `log-usage` is the only Knitten Core description that stands out at the list layer;
  trim it if Knitten Core default exposure needs another tiny cut.

## Review

No blocker found in the current exposure shape. The new direction is mostly
working: Knitten Core/KSL/KAS default metadata exposure is small, and remaining cost is
task-triggered body/reference loading.
