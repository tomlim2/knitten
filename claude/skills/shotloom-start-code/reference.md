# shotloom-start-code reference

Expanded detail for the shotloom-start-code skill. SKILL.md holds the happy path and the critical Step 7 auto-review rule; this file holds the worktree plumbing, the Ready-briefing template, and the worked examples.

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
repo_root=$(jq -r '.shotloom' ~/.claude/private/caol-config/repo-paths.json)
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

Linear title: `feat(retarget): ARP 스켈레톤 표준 적용`

1. Strip type prefix → `ARP 스켈레톤 표준 적용`
2. Translate Korean → English → `ARP skeleton standard apply`
3. Reorder for English idiom → `arp skeleton standard`
4. Kebab-case, lowercase, ≤50 chars → `arp-skeleton-standard`

Final branch: `feat/arp-skeleton-standard`
Worktree dir: `.worktrees/stl-99-arp-skeleton-standard/` (STL-NN included for local path clarity — NOT in the branch name)

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

**Standards loaded:** programming.md §<list>, review-code-rust.md (ready on pre-PR)
**ADRs to honor:** <list>
**Ask-first triggers for this task:** <filtered from §16>

**Pre-write checklist passed:**
- [x] gh auth: tomlim2
- [x] commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: <category>
- [x] targeted sections loaded

Ready. State the first code change you plan to make.
```

Emit exactly this. No code, no plan, no extra prose until the user confirms.
