# shotloom-start-task reference

Expanded detail for the shotloom-start-task skill. SKILL.md holds the happy path and the critical Step 7 auto-review rule; this file holds the worktree plumbing, the Ready-briefing template, and the worked examples.

---

## Linear MCP schema fetch

The tool id `mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__get_issue` is deferred in most sessions. Before calling it, fetch the schema:

```
ToolSearch query="select:mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__get_issue"
```

Call signature takes `{ id: "STL-NN" }`. The issue body is returned in markdown — parse for "Problem", "Acceptance criteria", "Affected", "ADR".

---

## Step 2.5 — worktree base detection (full script)

```bash
repo_root=$(jq -re '.shotloom.path // .shotloom // empty' ~/.claude/private/caol-config/repo-paths.json)
if grep -qE '^\.?worktrees/?$' "$repo_root/.gitignore" 2>/dev/null; then
  # prefer the convention already in .gitignore
  entry=$(grep -oE '^\.?worktrees/?' "$repo_root/.gitignore" | head -1 | tr -d '/')
  worktree_base="$repo_root/$entry"
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

## Step 6 — Ready briefing template

```
### Shotloom coding mode — <category>

**Issue:** STL-NN "<title>"
  Problem: <one-line>
  Acceptance: <bulleted>
  Affected: <crate/module list>
  Linked: <ADR-XXXX, spec-YYY>

**Branch:** <current-branch>  (base: <base>)  <N> commits ahead, <clean|N dirty files>

**Standards loaded:** programming.md §<list>, docs/guidelines/review-rust.md (ready on pre-PR)
**ADRs to honor:** <list>
**Ask-first triggers for this task:** <filtered from §16>

**AC primitive cross-check:**
- <AC id>: <codified | wrong-shape> - <path/section evidence or split needed>

**Plan-risk handoff for `/shotloom-draft-task-plan`:**
- P1: <question to lock before implementation> - evidence: <path or rg hit> - AC-trace: <AC line / ADR / precedent that demands this>
- P2: <ambiguity/test/doc gap to resolve in the plan> - evidence: <path or rg hit> - AC-trace: <AC line / ADR / precedent>
- P3: <cheap nit or precedent to consider> - evidence: <path or rg hit>

**Sibling drafts (caol-ila/docs/plans/):**
- <slug>.md - <working-tree | staged | HEAD | deleted> - stance: <one-line scope summary> - <agrees | disagrees> with this briefing
- (or: "none found" if Step 5d scan returned empty)

**Pre-write checklist passed:**
- [x] gh auth: tomlim2
- [x] commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: <category>
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] plan-risk handoff seeded
- [x] sibling-draft scan run (caol-ila/docs/plans/, full body via Read tool for every match)

Ready. If this briefing is OK, next step is `/shotloom-draft-task-plan`.
```

Emit exactly this. No code, no plan, no extra prose until the user confirms.
