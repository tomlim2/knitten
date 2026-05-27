---
status: accepted
---

# Review Brief

Use this reference from `shotloom-review-before-pr` Step 2. Build the Review
Brief after the Review Mode Decision and before launching review agents.

The Review Brief is a source-cited index. It is not a summary verdict. The raw
diff from `git diff origin/main...HEAD` remains the authority for every review
finding.

## Required Views

| View | Content | Source rule |
|---|---|---|
| Diff inventory | commits, files changed, lines changed, name-status rows | Git commands only. |
| Surface map | every changed file mapped to one or more review surfaces | Use `REVIEW_MODE.md` surface rows and direct paths. |
| Risk trigger map | trigger to reviewer question rows | Use `REVIEW_MODE.md` and `LARGE_BOUNDARY_PR_LENSES.md`; write questions, not safety claims. |
| Evidence ledger | goal, acceptance criteria, tests run, non-goals, unknowns | Cite issue, spec, commit, command output, or path. |
| Role slices | Triad role-specific 300-500 token slices | Required only when `needsTriad=true`; use only rows already present in the brief. |

## Source Citation Rules

| Claim type | Allowed source | If source is missing |
|---|---|---|
| Goal | Linear issue, task spec, branch name, commit subject | Write `not found` when absent. |
| Acceptance criteria | Linear issue, task spec, checklist in changed docs | Write `not found`; do not invent. |
| Test result | Command plus observed result | Write `not run`; do not assume. |
| Non-goal | Explicit issue/spec/PR text or user instruction | Move to `Unknowns`; do not infer. |
| Touched surface | Changed path or symbol in diff | Include exact file path. |
| Risk trigger | Trigger rule and changed path evidence | Write as reviewer question. |

## Compression Rules

| Rule | Required behavior |
|---|---|
| Raw diff authority | Review agents verify every finding against `git diff origin/main...HEAD`. |
| No verdict words | Do not write `safe`, `complete`, `well-tested`, `only`, or `low-risk` unless a cited rule proves the exact claim. |
| Full file coverage | Every changed file appears in `Surface Map` or `Excluded Changed Files`. |
| Unknown preservation | If evidence is absent, write `unknown` or `not found`; do not fill gaps with inference. |
| Question form for risk | Write `verify X` or `can Y fail?`; do not write `X is broken` from trigger evidence alone. |
| One source per claim | Each goal, AC, non-goal, test result, and risk row cites a source. |

## Build Commands

Run from the Shotloom worktree:

```bash
git log --oneline origin/main..HEAD
git status --short
git diff --shortstat origin/main...HEAD
git diff --name-status origin/main...HEAD
git diff --name-only origin/main...HEAD
```

Use exact-match `rg` searches only for directly named issue IDs, changed
symbols, commands, events, DTOs, rejection codes, and file names.

## Surface Labels

| Label | Evidence |
|---|---|
| runtime | engine handlers, runtime state, event order, Bevy/wgpu runtime paths |
| contract | Rust bridge, TypeScript mirror, schemas, IPC docs, DTOs, events, commands |
| model | validators, model collections, persistence, import, export, migrate, hydrate |
| test | unit, integration, fixture, snapshot, assertion, test helper |
| docs | markdown docs, comments, rustdoc |
| fixture | snapshots, assets, manifests, generated examples |
| UI | editor UI, bridge consumers, user-visible state |
| infra | build scripts, CI config, package metadata, workspace manifests |

## Review Brief Template

```markdown
## Review Brief - branch <branch>

### Authority
| Item | Value |
|---|---|
| Raw diff | `git diff origin/main...HEAD` |
| Initial status | clean |
| Brief role | source-cited index only |
| needsTriad | true/false |

### Diff Inventory
| Item | Value |
|---|---|
| Commits | <count and subjects> |
| Files changed | <N> |
| Lines changed | +<A>/-<D> |

### Surface Map
| File | Surfaces | Evidence |
|---|---|---|
| <path> | <labels> | <path/status/symbol> |

### Excluded Changed Files
| File | Reason |
|---|---|
| none | none |

### Risk Trigger Map
| Trigger | Reviewer question | Evidence |
|---|---|---|
| <trigger> | verify <risk/question> | <rule + path> |

### Evidence Ledger
| Item | Value | Source |
|---|---|---|
| Goal | <text or not found> | <source> |
| Acceptance criteria | <rows or not found> | <source> |
| Tests run | <command + result or not run> | <source> |
| Intentional non-goals | <rows or not found> | <source> |
| Unknowns | <rows or none> | <source> |

### Role Slices
| Role | Slice |
|---|---|
| Runtime/Contract Engineer | <contract/runtime/event/order rows only> |
| QA/Test Automation Engineer | <tests/negative/no-mutation/fixture rows only> |
| Maintainer/Product Engineer | <scope/readiness-evidence/non-goal/support-cost rows only> |
| none | `needsTriad=false` |
```

## Brief Verifier

Run this check before launching review agents:

```markdown
## Review Brief Verifier - branch <branch>

| Check | Pass/Fail | Evidence |
|---|---|---|
| Every changed file is mapped or excluded | pass/fail | <path list check> |
| Every goal/AC/non-goal/test claim has a source | pass/fail | <row refs> |
| Risk rows are questions, not defect claims | pass/fail | <row refs> |
| Tests list command and result or `not run` | pass/fail | <row refs> |
| Unsupported verdict words are absent | pass/fail | <row refs> |
| Role slices use only brief rows or are empty in Single mode | pass/fail | <row refs> |

Result: pass/fail
Fix before agents:
- <rows to repair, or none>
```

If any verifier row fails, repair the Review Brief before launching agents. If a
row cannot be repaired from direct evidence, move the claim to `Unknowns` and
mark the verifier row `pass`.

## Agent Use

| Agent type | Use |
|---|---|
| Single code | Use the full Review Brief as a navigation index; verify findings against raw diff. |
| Triad role | Use the full Review Brief plus the matching role slice; verify findings against raw diff. |
| Verification pass | Use the latest Review Brief only for changed-surface orientation; verify fixes against current `HEAD`. |
