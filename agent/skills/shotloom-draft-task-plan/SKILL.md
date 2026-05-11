---
description: Draft a per-ticket execution plan doc at caol-ila/docs/plans/<slug>.md after /shotloom-start-task briefing OK, then STOP. Implementation needs a separate go-ahead.
argument-hint: "[slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(jq:*), Bash(ls:*), Bash(stat:*)
---

# shotloom-draft-task-plan

Plan-phase companion to `/shotloom-start-task`. Writes a durable execution plan to `caol-ila/docs/plans/<slug>.md`, commits, pushes, **then stops**. Implementation begins only after a separate user go-ahead.

## Why this is its own skill

`plan ↔ implementation` are two distinct decision gates. The user reviews the plan (Codex/Gemini/sub-agent cross-check or human re-read) **before** any worktree-side diff lands. Splitting the gate out of `/shotloom-start-task` keeps each invocation single-purpose and makes the "stop and wait" point unambiguous.

## Arguments

- `[slug]` — kebab-case slug for the plan file. Optional; default = current worktree branch body (strip `<type>/` prefix).

**If no argument is provided and no shotloom worktree branch is active, show usage and ask the user. NEVER auto-execute.**

Usage:
- `/shotloom-draft-task-plan` inside an active worktree (e.g. `fix/gltf-normalize-extended-collider` → slug `gltf-normalize-extended-collider`)
- `/shotloom-draft-task-plan gltf-normalize-extended-collider` explicit

## Preconditions

- `/shotloom-start-task` has run in this session and the user OK'd the Step 6 Ready briefing. (The briefing supplies Intent, Decisions, Acceptance, File map, Verification — this skill formats them into the plan doc.)
- Current cwd is inside a shotloom worktree (`$shotloom_root/.worktrees/...` or `$shotloom_root/.claude/worktrees/...`).
- `caol-ila` repo path is resolvable via `jq -r '.["caol-ila"] // empty' ~/.claude/private/caol-config/repo-paths.json` (fall back to `.caol_ila` if shaped differently).

If a precondition fails, surface the failure and stop — do not invent a slug or path.

## Workflow

### Step 1: Resolve inputs

```bash
branch=$(git rev-parse --abbrev-ref HEAD)             # e.g. fix/gltf-normalize-extended-collider
slug=${1:-${branch#*/}}                                # strip leading <type>/
caol_ila=$(jq -r '."caol-ila" // .caol_ila // empty' ~/.claude/private/caol-config/repo-paths.json)
plan_path="$caol_ila/docs/plans/$slug.md"
```

Verify:
- `slug` is non-empty, kebab-case, no `<type>/` prefix.
- `$caol_ila/docs/plans/` exists.
- Surface to the user: "plan slug = `<slug>`, target = `<plan_path>`".

### Step 2: Detect create vs update mode

If `$plan_path` exists, read it and treat the run as an update. Otherwise create from scratch.

For updates: show the user the existing frontmatter `status` field and ask whether to amend in-place (default) or start a new revision section.

### Step 3: Draft the plan body

Match the existing `caol-ila/docs/plans/` shape. Frontmatter convention (from sibling docs `agent-symlink-followup.md`, `harden-system-drift.md`, etc.):

```yaml
---
status: open
created: YYYY-MM-DD
load: triggered
trigger: <one-line phrase that captures when to re-read>
repo: shotloom
linear: STL-NN
---
```

Body sections (in order):

| Section | Content |
|---------|---------|
| `# <Title>` | One-line title derived from the Linear issue (English) |
| `## Intent` | One paragraph — what the work changes, why, what stays unchanged. |
| `## Decisions (locked)` | Numbered list. Each entry: decision · rationale · rejected alternatives. Lift from Step 6 briefing's "Design (locked)" block. |
| `## Acceptance` | Verbatim Linear AC as `- [ ]` checklist (or derived if Linear had none). |
| `## File map` | Each file the work expects to touch with a one-line kind note (add / modify / move / delete). |
| `## Verification` | How to confirm acceptance — manual repro, gate commands (`cargo test -p <crate>`, `pnpm validate:rust`), CI signal, follow-up issues. |
| `## Open questions` | Anything still ambiguous after briefing — flagged for early checkpoint, not silent guessing. Empty section if none. |

**Do not** restate the Linear description verbatim. The plan is *your interpretation* of the work — future-you / sub-agent reviewers read it to spot where your interpretation diverges from the diff.

### Step 4: Write + commit + push (no separate approval gate)

The user's Step 6 briefing OK + invoking this skill IS the approval to land the plan. Do NOT add another "show draft and wait for OK" gate inside the skill — it duplicates the briefing approval and adds friction. Skill scope ends at file creation + commit/push.

1. `Write` the drafted body directly to `$plan_path`.
2. From the **caol-ila** working directory (not the shotloom worktree):
   - `git add docs/plans/<slug>.md`
   - `git commit -m "plan(shotloom): <slug>"` (single-line message; body optional)
   - `git push`
3. Verify identity: caol-ila uses `tomlim2 <tomandlim@gmail.com>` (personal repo); confirm with `git log -1 --format="%an <%ae>"` before push.
4. Hooks (markdown lint, link check) may run during commit — if any fail, surface the error and fix before retry. Never `--no-verify`.

`docs/plans/*.md` is tracked caol-ila state, NOT obsidian-staging — the obsidian auto-commit exception (`~/.claude/rules/obsidian.md`) does **not** apply, but commit + push are routine for caol-ila docs and do not need per-commit user approval. Only PR-mutating ops on caol-ila need approval (none here).

**Exception — explicit user revision request.** If the user asks for changes ("이 부분 수정해서 다시", "revise X") AFTER the file lands, treat it as an update-mode re-invocation: amend the file, commit a follow-up (`plan(shotloom): <slug> — <revision summary>`), push. Do NOT pre-emptively ask for revisions before the initial Write.

### Step 5: Report + STOP

Emit a single short line:

```
plan doc landed at <plan_path>
구현 시작하려면 말씀주세요.
```

Then end the turn. **Do not** start code edits in the shotloom worktree. **Do not** read the worktree source files in the same turn. Wait for an explicit user message ("구현 시작", "implement", "go", etc.).

## Binding rules

- **One artifact, one stop.** This skill writes exactly one plan doc and stops. It never touches shotloom worktree source files.
- **No mid-skill approval gate.** Briefing OK + skill invocation = land the plan. Do not pause to ask "OK to write?" between draft and Write.
- **Never commit caol-ila with `--no-verify`.** If a pre-commit hook fails, fix the underlying issue.
- **Plan ≠ implementation.** Reading worktree source for the file-map section is allowed during draft authoring. Editing worktree source is not.

## Related

- `/shotloom-start-task` — Step 1–6 pre-flight + Ready briefing. After briefing OK, the user (or this skill called next) takes over.
- `~/.claude/rules/shotloom.md` — shotloom-side gates and approval matrix.
- `caol-ila/docs/plans/` — destination folder; see sibling plans for shape reference.
- `caol-ila/LOOKUP.md` "Design a new layer" row — canonical pointer to this folder.
