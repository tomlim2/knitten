---
description: "Depth-first audit of a single skill or command against LLM-first standards and workflow logic gaps."
argument-hint: "<skill-or-command-name|path>"
allowed-tools: Read, Bash(bash:*), Bash(jq:*), Bash(grep:*), Bash(git:*), Bash(rg:*), Bash(test:*), Bash(ls:*), Bash(wc:*), Glob
platforms: all
portability: adapter
---

# ah-audit-skill

Depth-first audit of one named skill or command against the LLM-first stack and
workflow-logic gaps that batch reviewers miss. Reports defects; does not
auto-fix.

## Arguments

- `<skill-or-command-name|path>` — skill folder name, command stem, or direct file path.

**If no argument provided, show usage and stop. NEVER auto-execute.**

```
Usage: /ah-audit-skill <name-or-path>
Examples:
  /ah-audit-skill ah-manage-config
  /ah-audit-skill shotloom-make-pr
```

## Canonical references (re-read every invocation)

| File | Used for |
|------|----------|
| `agent/standards/policy/llm-first-docs.md`, else installed `llm-first-docs.md` | Writing rules, length budget, self-audit list |
| `agent/standards/policy/llm-first-policy.md`, else installed `llm-first-policy.md` | Layer assignment, duplication, cross-layer reference |
| `agent/rules/author.md`, else installed `author.md` | Naming, frontmatter, `allowed-tools` |
| `references/AUDIT-CHECKS.md` | Audit check matrix, status rules, and report template |

## Resolve target

```bash
input="$ARGUMENTS"
repo=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
case "$input" in
  /*) candidates=("$input") ;;
  ./*|../*|*/*) candidates=("$input" "$repo/$input") ;;
  *) candidates=(
    "$repo/agent/skills/$input/SKILL.md"
    "$repo/agent/commands/$input.md"
    "$HOME/.claude/skills/$input/SKILL.md"
    "$HOME/.claude/commands/$input.md"
  ) ;;
esac
for candidate in "${candidates[@]}"; do
  [ -f "$candidate" ] && { printf '%s\n' "$candidate"; exit 0; }
done
echo "ERROR: $input not found as a file, repo-local skill/command, or installed skill/command" >&2
exit 1
```

Run the block with `bash -lc`, capture the printed path as `target`, then read
that file. Resolve canonical references repo-local first, installed fallback
second. If a reference cannot be found, mark affected checks `SKIPPED`.

## Workflow

### Step 1: Resolve target

Run the resolve block above with `bash -lc`, assign stdout to `target`, and read
that file in full.

### Step 2: Load audit checks

Read `references/AUDIT-CHECKS.md`.

### Step 3: Sweep and judge

For each class (W, B, F, N, A, L, D):

1. Run validator-backed sweeps first: `banned-terms`, `length-caps`,
   `skill-command-mechanics`, `taxonomy`, and `tracked-user-paths`; if the
   target is outside validator scope, use the reference sweeps instead.
2. Run only the listed manual sweeps for checks not covered by validators.
3. Semantically judge hits before creating findings.
4. Use `test -e`, `git ls-files --error-unmatch`, or `git check-ignore` based
   on the path claim.

Record each check as `PASS`, `WARN`, `FAIL`, or `SKIPPED` with file:line
evidence.

### Step 4: Report

Use the report template in `references/AUDIT-CHECKS.md`.

If a class is fully clean, list its IDs in the **Clean classes** line — do not pad the table.

### Step 5: Recommend next action

| Condition | Action |
|-----------|--------|
| 0 FAIL, 0 WARN | "Skill audit clean." Stop. |
| 0 FAIL, ≥1 WARN | List warnings, ask user whether to accept, file follow-up, or start a separate fix workflow. |
| ≥1 FAIL | Report + stop. Ask whether to start `ah-edit-skill`, file follow-up, or ignore. |

## Binding rules

- **Read-only audit.** Never modify the audited target during this skill. If the
  user requests fixes, hand off to `ah-edit-skill` or a separate fix workflow.
- **Re-read canonical references every invocation.** Do not summarize from memory.
- **One target per invocation.** Batch sweeps belong to the batch review workflow.
- **No silent skips.** If a class can't be evaluated, write `SKIPPED — <reason>` for the IDs.
