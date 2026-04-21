---
description: Post a blocker or progress note to the current Shotloom Linear issue as a comment
argument-hint: "<blocker description>"
allowed-tools: Read, Bash(git:*)
---

# shotloom-blocker-to-linear

When you hit a blocker or want to leave a progress breadcrumb mid-work, post a comment to the Linear issue tied to the current branch. Keeps the Linear history truthful without context-switching to the web app.

## Arguments

- `<blocker description>` — free text. This becomes the Linear comment body.

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/shotloom-blocker-to-linear Blocked on upstream bevy wgpu regression — waiting on 0.17 release`

## Workflow

### Step 1: Resolve Linear issue ID

Priority order:
1. Current branch name matches Linear's own `deemo/stl-NN-…` hint → extract NN
2. Last commit body contains `Related to STL-NN` or `Resolves STL-NN`
3. Worktree path `.worktrees/stl-NN-…` → extract NN
4. If none → ask user for STL-NN explicitly. Do not guess.

### Step 2: Format comment

Prepend a compact header so the comment is scannable in Linear:

```
**[PROGRESS]** <YYYY-MM-DD HH:MM KST> — <branch>

<user's message>

---
Posted from `shotloom-blocker-to-linear`.
```

If the user's message starts with "blocker" / "blocked" / "stuck" / "막혔" (ko), use `**[BLOCKER]**` header instead. If starts with "done" / "완료", use `**[DONE]**`.

### Step 3: Show draft + confirm

Draft goes to user first. Wait for explicit approval before posting. This is per-comment approval per `rules/git.md` — this skill is NOT in the auto-pr exemption.

### Step 4: Post via Linear MCP

Fetch schema if needed:
```
ToolSearch query="select:mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__save_comment"
```

Call `save_comment` with `issueId = STL-NN` and the approved body.

### Step 5: Report

```
✅ Posted to STL-NN:
  https://linear.app/.../issue/STL-NN
```

## Notes

- If Linear MCP returns auth error, surface it — user may need to re-authenticate. Do not retry silently.
- Do NOT auto-transition the issue state (In Progress → Blocked etc.) — just the comment. State transitions are a separate deliberate action.
- Language: write comment in the language the user typed (Korean OK, Linear allows it per `CONTRIBUTING.md`).
