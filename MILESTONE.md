# Knitten Milestone

## Token-Efficient Routing

Status: Draft.

Knitten's lead milestone is to make Codex skill routing cheaper, safer, and
more observable by loading only the context needed for the current request.

## Position

Knitten routes Codex work to the right skill at the lowest useful context cost.

The system should help a large skill library stay usable without turning every
request into a large prompt. The routing layer should decide quickly, reject
wrong matches cheaply, and load detailed instructions only after the selected
skill is confirmed.

## Current Focus

1. **Gated Progressive Loading**
   - Keep `SKILL.md` short and activation-oriented.
   - Add explicit trigger and non-trigger rules.
   - Load detailed references only after activation.

2. **Skill Audit**
   - Find overlong skill bodies.
   - Find ambiguous or overlapping triggers.
   - Find mutation-capable skills without visible Step 0 safety gates.

3. **Routing Registry Health**
   - Keep Knitten core registries generic and reachable.
   - Keep payload-specific routing out of the core plugin.
   - Make `doctor` catch stale or domain-leaking registry entries.

4. **Recorded Experiments**
   - Every routing/token-efficiency experiment must leave a durable record.
   - Record the hypothesis, test set, measurement method, result, and review
     notes before using the result to justify broader migration.

## Deferred

RAG, vector search, and retrieve-and-rerank are not first-round work. They may
be useful later when explicit reference-selection rules become too noisy, but
the immediate milestone is to prove that simple gated loading works first.

## Pilot Batch

| Skill | Surface | Purpose |
|-------|---------|---------|
| `kc-implement` | Scoped implementation | Prove deleted implementation leaves are covered by one practical core skill. |

## Success Criteria

- A top-level README clearly presents Knitten as a token-efficient routing
  system.
- Pilot skills use short activation gates and conditional reference loading.
- Mutation-capable skills keep safety gates in the main skill file.
- `doctor` and shell validation catch stale or domain-specific core routing
  entries.
- Audit guidance exists before broad skill migration.
- Routing/token-efficiency experiments are recorded before their results are
  used to change milestone direction.

## Source Specs

- [`docs/specs/skill-gated-progressive-loading.md`](docs/specs/skill-gated-progressive-loading.md)
- [`docs/specs/token-efficient-routing-smoke-eval.md`](docs/specs/token-efficient-routing-smoke-eval.md)
- [`docs/specs/routing-registry-health-cleanup.md`](docs/specs/routing-registry-health-cleanup.md)
