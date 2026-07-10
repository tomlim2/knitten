# Context-Load Smoke Eval Result

## Status

Accepted for pilot evidence.

## Run

| Field | Value |
|-------|-------|
| Command | `node scripts/run-context-load-smoke-eval.mjs --report` |
| Raw report | `.agent-local/workflow/evals/context-load-smoke/latest.json` |

## Metrics

| Metric | Result | Threshold |
|--------|--------|-----------|
| Match accuracy | `20/20` | `>= 18/20` |
| Reject accuracy | `4/4` | `4/4` |
| Reference precision | `20/20` (`1.0`) | `>= 0.8` |
| Safety miss count | `0` | `0` |
| Average estimated savings rate | `0.734` | `>= 0.3` |

## Decision

The deterministic smoke eval passed with no blockers. This supports continuing
the Knitten Core pilot audit and migration work. It does not justify broad skill
migration or claims about live model match accuracy.

## Notes

- Token estimates use `ceil(character_count / 4)`.
- The eager baseline includes all pilot `SKILL.md` bodies and their referenced
  detail; the matched path includes match surfaces plus only the selected skill
  and its references.
- The raw report is local and may be regenerated.
- This result is reviewed summary evidence for the first context-load smoke run.
