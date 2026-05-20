# Audit Checks

Use this reference after `ah-audit-skill` resolves one target file.

## Validator-Backed Checks

Run these repo validators before manual judgment when the target is in their
scope:

| Check IDs | Validator |
|-----------|-----------|
| W1, W2 | `node scripts/validate-llm-first.mjs --check banned-terms` |
| B1 | `node scripts/validate-llm-first.mjs --check length-caps` |
| F1, F3, F4, N2 | `node scripts/validate-llm-first.mjs --check skill-command-mechanics` |
| N3 | `node scripts/validate-llm-first.mjs --check taxonomy` |
| D5 | `node scripts/validate-llm-first.mjs --check tracked-user-paths` |

Treat validator violations as findings. Do not duplicate these checks manually
unless the target is outside validator scope or the validator result is skipped.

## W. LLM-First Writing

| ID | Check | Detection |
|----|-------|-----------|
| W1 | Actionability banned hedges | Validator-backed |
| W2 | Explicit enumeration; no `etc.` or `...` ending a list | Validator-backed |
| W3 | Decision-tree structure | Branches use `If X -> Y` or `if/else` headers |
| W4 | Self-contained rule text | Rule lines carry enough local context to act |
| W5 | Paired examples | Boundary rules show Bad and Good examples |
| W6 | No duplication | Content is not copied from an auto-loaded rule or standard |
| W7 | No rhetoric | Candidate sweep W7 below |
| W8 | Extreme-S writing | Candidate sweep W8 below |

```bash
rg -nw -e powerful -e elegant -e comprehensive -e world-class -e seamless -e robust "$target"
rg -n -e "will support" -e "going to" -e "aims to" -e "goal is to" -e could -e probably -e "in theory" -e might -e "this represents" -e "in essence" "$target"
```

Candidate sweep hits are not findings by themselves. Ignore hits inside fenced
code, quoted bad examples, regex patterns, or audit output templates unless the
surrounding instruction endorses the bad wording.

## B. Length Budget

| ID | Check |
|----|-------|
| B1 | Validator-backed length budget for rules, standards, skills, and commands. |

If the target exceeds budget, recommend splitting detail to a reference file or
moving it down a layer.

## F. Frontmatter

| ID | Check |
|----|-------|
| F1 | `description` exists; manually judge concision when the validator passes |
| F2 | `argument-hint` exists only when the skill accepts `$ARGUMENTS` |
| F3 | Validator-backed field order: `description`, `argument-hint`, `allowed-tools` |
| F4 | Validator rejects bare `Bash`; manually judge overly broad patterns |

## N. Naming

| ID | Check |
|----|-------|
| N1 | Folder or file name matches `{category}-{verb}-{subject}` |
| N2 | Validator-backed lowercase, hyphen-only, and max-name length |
| N3 | Validator-backed category membership |

## A. Argument Hygiene

| ID | Check |
|----|-------|
| A1 | If `$ARGUMENTS` appears, a missing-argument guard appears too |

## L. Layer Compliance

| ID | Check |
|----|-------|
| L1 | Skill body encodes a procedure, not an always-applied rule |
| L2 | Skill cites standards by path instead of duplicating canonical policy |
| L3 | Every cited path, skill, command, standard, and rule resolves on disk |

Use `test -e` for direct paths.

## D. Workflow Logic

| ID | Check |
|----|-------|
| D1 | For each step, phase, table row, command block, or branch, consumed files/state are created or gated by an earlier unit on that path |
| D2 | Every `$VAR` / `${VAR}` is a documented harness substitution, standard env var, shell local assigned earlier in the same block, or config-derived value |
| D3 | Path claims match reality: use `git ls-files --error-unmatch <path>` for tracked claims and `git check-ignore <path>` for ignored claims |
| D4 | If the skill claims idempotency, each mutating step is guarded or no-op on the second run |
| D5 | Validator-backed for tracked files; manually inspect untracked target paths |
| D6 | Auth, network, and permission steps surface failures or document the silent-fail mode |
| D7 | One skill does one thing; setup plus CRUD plus validation in one file is a split signal |

Flag unresolved names such as `$SKILL_DIR`. Treat `${CLAUDE_SKILL_DIR}` as a
valid Claude Code harness substitution when command/skill references document it.

## Status Rules

| Status | Use when |
|--------|----------|
| `FAIL` | The audit cannot run, a check can false-pass, or the target contains a wrong instruction |
| `WARN` | The check is semantically ambiguous or creates a non-blocking false-positive risk |
| `SKIPPED` | A required reference, command, or target surface is missing |

## Report Template

```markdown
## Audit: <name> (<line-count> lines, target=<path>)

### Findings (N issues)

| ID | Sev | Location | Evidence | Fix direction |
|----|-----|----------|----------|---------------|
| W1 | WARN | `agent/skills/foo/SKILL.md:42` | "consider running cargo test" | imperative: "Run cargo test before commit" |
| D1 | FAIL | `agent/skills/foo/SKILL.md:97` | consumes `hardware.json`; no prior unit creates or gates it | gate-check existence or auto-invoke |

### Skipped Checks

List `ID | reason`; omit only when no checks are skipped.

### Clean Classes

W2 W4 W5 W6 W7 W8 · B1 · F1 F2 F3 F4 · N1 N2 N3 · A1 · L1 L2 · D2 D4 D5 D6 D7
```

If a class is fully clean, list its IDs in `Clean Classes`; do not pad the
findings table.
