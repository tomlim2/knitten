---
description: "Depth-first audit of a single skill against LLM-first standards + workflow logic gaps (env vars, step deps, path claims, idempotency, cross-machine portability)."
argument-hint: "<skill-name>"
allowed-tools: Read, Bash(jq:*), Bash(grep:*), Bash(git:*), Bash(rg:*), Bash(test:*), Bash(ls:*), Bash(wc:*), Glob
---

# caol-audit-skill

Depth-first audit of one named skill (commands or skills/) against the LLM-first stack and workflow-logic gaps that batch reviewers (`/caol-review-skills`) miss. Reports defects; does NOT auto-fix.

## Arguments

- `<skill-name>` — skill folder name (e.g. `caol-manage-config`) or command stem (e.g. `caol-review-skills`).

**If no argument provided, show usage and stop. NEVER auto-execute.**

```
Usage: /caol-audit-skill <name>
Examples:
  /caol-audit-skill caol-manage-config
  /caol-audit-skill shotloom-make-pr
```

## Sources of truth (re-read every invocation)

| File | Used for |
|------|----------|
| `~/.claude/standards/policy/llm-first-docs.md` | 7 writing rules + length budget + self-audit list |
| `~/.claude/standards/policy/llm-first-policy.md` | Layer assignment + duplication + cross-layer reference |
| `~/.claude/rules/author-naming.md` | Naming convention for skill / command |
| `~/.claude/rules/author-frontmatter.md` | Required frontmatter fields, field order |
| `~/.claude/rules/author-permissions.md` | `allowed-tools` specificity |

## Resolve target

```bash
name="$ARGUMENTS"
skill="$HOME/.claude/skills/$name/SKILL.md"
cmd="$HOME/.claude/commands/$name.md"
[ -f "$skill" ] && target="$skill"
[ -f "$cmd" ] && target="$cmd"
[ -z "${target:-}" ] && { echo "ERROR: $name not found in skills/ or commands/"; exit 1; }
```

## Checklist (each hit = one finding row)

### W. LLM-first writing (from llm-first-docs.md §7 rules + §8 Extreme-S)

| ID | Check | Detection |
|----|-------|-----------|
| W1 | Actionability — banned hedges | `rg -nw 'consider\|usually\|typically\|may\|should probably\|might want to'` |
| W2 | Explicit enumeration — no `etc.` / `…` ending a list | `rg -n 'etc\.\|…\|\.\.\.\s*$'` (excluding code blocks) |
| W3 | Decision-tree structure | Branches use `If X → Y` or `if/else` headers, not prose `"when …, you usually …"` |
| W4 | Self-contained | Rules that say "follow X standard" without inline summary |
| W5 | Paired examples | For boundary-setting rules (naming, format), Bad+Good both shown |
| W6 | No duplication | Content not copy-pasted from another auto-loaded rule/standard |
| W7 | No rhetoric | `rg -nw 'powerful\|elegant\|comprehensive\|world-class\|seamless\|robust'` |
| W8 | Extreme-S — no N-language | `rg -n 'will support\|going to\|aims to\|goal is to\|could\|probably\|in theory\|might\|this represents\|in essence'` |

### B. Length budget (llm-first-docs.md §Length budget)

| ID | Check |
|----|-------|
| B1 | SKILL.md ≤ 200 lines, command ≤ 100 lines. Over budget → split to `reference.md`. |

### F. Frontmatter (rules/author-frontmatter.md, author-permissions.md)

| ID | Check |
|----|-------|
| F1 | `description` present and one sentence |
| F2 | `argument-hint` present iff skill accepts `$ARGUMENTS` |
| F3 | Field order: `description` → `argument-hint` → `allowed-tools` |
| F4 | `allowed-tools` patterns specific — no bare `Bash` |

### N. Naming (rules/author-naming.md)

| ID | Check |
|----|-------|
| N1 | Folder/file name matches `{category}-{verb}-{subject}` |
| N2 | Lowercase + hyphens only, ≤ 64 chars |
| N3 | Category from approved list (`cci`, `ue`, `dev`, `review`, `git`, `tutoring`, `writing`, `drink`, `design`, `consulting`, `learn`, `pmx`, `vrm`, `image`, `video`, `project`, `system`, `caol`) |

### A. Argument hygiene

| ID | Check |
|----|-------|
| A1 | If `$ARGUMENTS` referenced, missing-argument guard ("If no argument provided, show usage and stop") present |

### L. Layer compliance (llm-first-policy.md §Layered enforcement)

| ID | Check |
|----|-------|
| L1 | Skill body encodes a procedure (Layer 6), not an always-applied constraint (Layer 3/5). Constraints belong in `rules/`. |
| L2 | Skill cites standards by path instead of duplicating them. |
| L3 | Cross-references resolve — every cited path/skill/command exists on disk. Run `Glob`/`test -e` on each. |

### D. Workflow logic — the gap batch reviewers miss

| ID | Check |
|----|-------|
| D1 | **Step dependency** — for each "Step N", scan whether it requires a file/state Step N−1 produces. Either Step N gates on existence, or Step N−1 actually creates it (not just "prompt user"). |
| D2 | **Env var existence** — every `$VAR` / `${VAR}` referenced must be a real env. Banned phantoms: `$CLAUDE_SKILL_DIR`, `$SKILL_DIR`. Hard-code instead. |
| D3 | **Path claim accuracy** — phrases like "managed in repo", "tracked", "auto-installed" must match reality. Cross-check with `git check-ignore` for tracked claims. |
| D4 | **Idempotency claim** — if skill claims "safe to re-run", verify each mutating step (write, launchctl load, git push) is guarded or no-op on second run. |
| D5 | **Cross-machine portability** — no hardcoded `/Users/<name>/`. All paths via `~`, `$HOME`, or config lookup. |
| D6 | **Silent-failure surface** — auth/network/perms steps surface failures (not just `... 2>/dev/null \|\| true`) or document the silent-fail mode. |
| D7 | **Mixed responsibility** — one skill does one thing. Setup + CRUD + validate in one file is a smell; flag for split. |

## Workflow

### Step 1: Resolve target

Run the resolve block above. Read `$target` in full.

### Step 2: Sweep each class

For each class (W, B, F, N, A, L, D):

1. Run the listed `rg`/`grep` sweep where applicable.
2. For checks that need semantic reading (W3, W5, L1, L2, D1, D4, D7), read the file and judge.
3. For path/file-existence checks (L3, D3), `test -e` or `git check-ignore` each cited path.

Record per check: `PASS` / `WARN` / `FAIL` with file:line + one-line evidence.

### Step 3: Report

```
## Audit: <name> (<line-count> lines, target=<path>)

### Findings (N issues)

| ID | Sev | Location | Evidence | Fix direction |
|----|-----|----------|----------|---------------|
| W1 | WARN | line 42 | "consider running cargo test" | imperative: "Run cargo test before commit" |
| D1 | FAIL | Step 7 | requires hardware.json from Step 6 (prompt-only) | gate-check existence or auto-invoke |
| L3 | FAIL | line 188 | cites `${CLAUDE_SKILL_DIR}/foo.json` — env var doesn't exist | hard-code `~/.claude/skills/<name>/foo.json` |

### Clean classes

W2 W4 W5 W6 W7 W8 · B1 · F1 F2 F3 F4 · N1 N2 N3 · A1 · L1 L2 · D2 D4 D5 D6 D7
```

If a class is fully clean, list its IDs in the **Clean classes** line — do not pad the table.

### Step 4: Recommend next action

| Condition | Action |
|-----------|--------|
| 0 FAIL, 0 WARN | "Skill audit clean." Stop. |
| 0 FAIL, ≥1 WARN | List warnings, ask user whether to fix or accept. |
| ≥1 FAIL | Report + stop. **Do NOT auto-fix.** Ask user how to proceed (fix in this session, file follow-up, ignore). |

## Binding rules

- **Read-only.** Never modify the audited skill. The user fixes.
- **Re-read sources of truth every invocation.** Do not summarize from memory.
- **One target per invocation.** Batch sweeps belong to `/caol-review-skills`.
- **No silent skips.** If a class can't be evaluated, write `SKIPPED — <reason>` for the IDs.

## Related

- `/caol-review-skills` — breadth-first batch audit (12+11+6 structural checks)
- `~/.claude/standards/policy/llm-first-docs.md` — writing rules SSOT
- `~/.claude/standards/policy/llm-first-policy.md` — layer model SSOT
