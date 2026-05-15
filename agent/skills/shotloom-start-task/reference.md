# shotloom-start-task reference

Expanded detail for the shotloom-start-task skill. SKILL.md holds the required
flow; this file holds the worktree plumbing, Ready-briefing template, and
worked examples.

---

## Linear connector discovery

Linear MCP server names vary by harness. Do not hard-code a server UUID.

```
ToolSearch query="Linear get_issue list_issue_statuses save_issue"
```

Use the discovered `get_issue`, `list_issue_statuses`, and `save_issue` tools.
In Codex sessions these often appear under `mcp__codex_apps__linear.*`; in
Claude sessions the MCP server prefix can differ.

---

## Step 2.5 — worktree base detection (full script)

```bash
repo_root="$(bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo shotloom)"
repo_root="${repo_root#RESOLVED_PATH=}"
if grep -qE '^\.worktrees/?$' "$repo_root/.gitignore" 2>/dev/null; then
  worktree_base="$repo_root/.worktrees"
else
  worktree_base="$(dirname "$repo_root")/shotloom-worktrees"
  mkdir -p "$worktree_base"
fi
```

For Shotloom today this resolves to `<shotloom>/.worktrees/`.

## Branch-name derivation example

Pattern: `<type>/<scope>-<verb>-<subject>` (≤50 chars, lowercase + hyphens, no STL-NN).

Linear title `test(retarget): 4-finger alignment baseline — xiao + yoya`:
- type → `feat` (test→chore mapping; here `feat` because the work also touches `finger_axis_map.rs` source)
- scope → `retarget`
- verb → `verify`
- subject → `finger-baseline-xiao-yoya`

Branch: `feat/retarget-verify-finger-baseline-xiao-yoya` (45 chars).
Worktree dir: `.worktrees/retarget-verify-finger-baseline-xiao-yoya/` (same body as branch, **no `stl-NN-` prefix** — Linear IDs appear in neither branch nor local worktree paths).

## Create worktree — single-branch fallback

```bash
cd "$repo_root"
git fetch origin main
git worktree add "<worktree_dir>" -b "<branch>" origin/main
# If the branch already exists locally:
git worktree add "<worktree_dir>" "<branch>"
```

---

## AC primitive precedent

PR #208 (STL-247) is the defect class. AC #2 cited "ADR template Usage Notes
canonical amendment style (`Accepted (amended YYYY-MM-DD)`)", but
`docs/guidelines/adr-template.md` did not codify that form. The author noticed
the gap and applied the form in one ADR anyway; review blocked and forced a
revert. Correct briefing verdict: AC wrong-shape, split primitive-codification
before application.

## Intent-vs-literal AC precedent

STL-437 is the counter-shape. The AC named repeated
`spawn -> clear -> spawn`, but Linear/user intent was GPU asset leak
prevention for stage debug cubes. `clear_background_props` was absent on
`origin/main` and owned by STL-424. Correct briefing verdict:

| Field | Value |
|---|---|
| Intent lens | Prevent repeated debug cube spawn from growing Bevy `Assets<Mesh>` / `Assets<StandardMaterial>` in proportion to cube count. |
| Literal AC wording | `spawn -> clear -> spawn` stability. |
| Primitive status | `clear_background_props` sibling-owned by STL-424, absent on current base. |
| Start-task action | Do not block STL-437 on clear. Seed equivalent proof: repeated debug cube spawn batches keep mesh/material counts stable after cache warm-up. |
| Ask-first only if | The implementation would need to add or edit `clear_background_props`, TypeScript mirrors, or bridge contract scope. |

## Spec-risk seed taxonomy

| Priority | Seed type | Examples |
|---|---|---|
| P1 | Likely implementation rework if not locked in the spec contract. | Requirements trace, API signatures, caller-owned inputs, existing helper removal, diagnostic message ownership, event ordering, public surface area, old path replacement. |
| P2 | Likely validation ambiguity if omitted. | Edge cases, negative tests, snapshots, fixture coverage, manual repro details, invariant preservation, docs updates, out-of-scope boundaries. |
| P3 | Cheap nits that reduce review churn. | Test layout, naming, markdown rendering, precedent references, future telemetry notes. |

For each seed, record priority, evidence path or `rg` hit, exact spec question,
and AC-trace. If no AC line, ADR, or precedent demands the seed, move it to a
follow-up note instead of spec-risk handoff.

Each seed must name the spec section it should affect: `Requirements`,
`Locked Decisions`, `Non-Goals`, `Implementation Spec`, `Verification`, or
`Traps`.

### Coupled artifact atomicity seed

Add this seed whenever the affected code can write more than one representation
of the same logical artifact in one operation:

| Field | Value |
|---|---|
| Priority | `P1` if partial persistence can corrupt runtime behavior or cache; otherwise `P2`. |
| Evidence | The first mutation site and the later validation/write site, or cache/persistence boundary. |
| Spec question | "Can any later failure persist only one side of the artifact? If yes, does the spec pre-validate, rollback, or skip the whole operation?" |
| Required verification | Assert final persisted bytes/state/event order, not just internal stats or one unchanged buffer. |

Examples that trigger this seed: GLB JSON + BIN rebake, bundle model + manifest
index, command state + emitted event, cache artifact + version key, thumbnail
bytes + catalog entry.

Search examples:

```bash
rg -n "<command/event/type/helper/function names>" crates apps docs contracts MAP.md
rg -n "<diagnostic/rejection/error names>" crates/shotloom-core crates/shotloom-engine apps/editor/src/bridge
rg -n "<fixture/snapshot/test names>" crates apps assets docs
rg -n "rebuild|cache|persist|write|rebake|inverseBind|manifest|emit|changed_artifact" crates apps docs contracts
```

## Sibling spec scan

Match liberally: scope, subject, Linear ID, and obvious slug stems. Siblings can
carry suffixes (`-codex`, `-gemini`, `-v2`) or live one folder above
`docs/plans/`. For every working-tree, staged, HEAD, or recently-deleted match,
read the full body and record: slug, status, stance summary, and disagreement
signal.

```bash
caol_ila="$(bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo caol-ila)"
caol_ila="${caol_ila#RESOLVED_PATH=}"
ls "$caol_ila/docs/plans/" 2>/dev/null | rg -i "<scope>|<subject>|<linear-id>"
ls "$caol_ila/docs/" 2>/dev/null | rg -i "<scope>|<subject>|<linear-id>"
git -C "$caol_ila" log --diff-filter=D --name-only --pretty=format: -- \
  "docs/plans/" | rg -i "<scope>|<subject>" | head -5
```

---

## Step 6 — Ready briefing artifact template

Path: `docs/briefings/shotloom/<slug>.md`

```markdown
---
status: ready
created: YYYY-MM-DD
updated: YYYY-MM-DD
load: triggered
trigger: STL-NN
repo: shotloom
linear: STL-NN
spec: ../../plans/<slug>.md
---

### Shotloom coding mode — <category>

**Issue:** STL-NN "<title>"
  Problem: <one-line>
  Acceptance: <bulleted>
  Affected: <crate/module list>
  Linked: <ADR-XXXX, spec-YYY>

**Branch:** <current-branch>  (base: <base>)  <N> commits ahead, <clean|N dirty files>

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, <category additions>
**ADRs to honor:** <list>
**Ask-first triggers for this task:** <filtered from §16>
**Intent lens:** <failure mode to prevent; note any user clarification that overrides literal AC wording>

**AC primitive cross-check:**
- <AC id>: <codified | wrong-shape | verification-example | sibling-owned> - <path/section evidence, equivalent proof, sibling owner, or split needed>

**Spec-risk handoff for `/shotloom-draft-task-plan`:**
- P1: <question to lock before implementation> - evidence: <path or rg hit> - AC-trace: <AC line / ADR / precedent that demands this>
- P2: <ambiguity/test/doc gap to resolve in the spec> - evidence: <path or rg hit> - AC-trace: <AC line / ADR / precedent>
- P3: <cheap nit or precedent to review> - evidence: <path or rg hit> - AC-trace: <AC line / ADR / precedent, or related-follow-up>

**Sibling specs (caol-ila/docs/plans/):**
- <slug>.md - <working-tree | staged | HEAD | deleted> - stance: <one-line scope summary> - <agrees | disagrees> with this briefing
- (or: "none found" if Step 5d scan returned empty)

**Pre-write checklist passed:**
- [x] gh auth: tomlim2
- [x] commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: <category>
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (caol-ila/docs/plans/, full body via Read tool for every match)

Ready. If this briefing is OK, next step is `/shotloom-draft-task-plan`.
```

Write exactly this artifact and emit the same briefing in chat with the
briefing path. No code, no spec, no extra prose until the user confirms.
