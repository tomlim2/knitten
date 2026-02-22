---
description: "Create GitLab merge request description for CINEV projects"
argument-hint: "<base-branch> [optional context]"
allowed-tools: "Bash(git:*), Read, Grep, Glob"
---

# cocv-make-mr

Analyze current branch changes and commits to generate a merge request
description for CINEV projects.
## Arguments

- Format: $ARGUMENTS
- First argument (required): Base branch name
- Remaining arguments (optional): Additional context

**If $ARGUMENTS is empty, show usage and stop. NEVER auto-execute.**
```
Usage: /cocv-mr <base-branch> [optional context]

Examples:
  /cocv-mr develop
  /cocv-mr release/v1.2.0
  /cocv-mr develop Fix duplicate prop attach tracks
```

## Instructions

### 1. Parse Arguments

- Split $ARGUMENTS by whitespace
- First token = base branch (e.g., `develop`, `release/v1.2.0`)
- Everything after first token = user context

### 2. Validate Base Branch

- Verify base branch exists:
  `git rev-parse --verify <base-branch>`
- If fails, try with origin/ prefix:
  `git rev-parse --verify origin/<base-branch>`
- Branch priority: local first, then remote (origin/)
- If both fail: list available branches and stop
- If current branch equals base branch: stop and inform user

### 3. Analyze Git History

Execute in order:
```bash
git log <base>..HEAD --oneline
git log <base>..HEAD
git diff <base>...HEAD --stat
git diff <base>...HEAD
```

- Use triple-dot (...) for diff to compare from merge base
- Analyze commit messages for problem/solution context
- Note patterns and related changes

### 4. Generate MR Title

Format: `type(scope): description` (50-72 characters)

- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`
- Scope: affected module/component
- Use imperative mood ("add" not "added")
- Focus on main achievement, not implementation details
- If multiple commits, identify the overarching theme

Examples:
- `feat(context): integrate shot manager for frame evaluation`
- `fix(attachment): resolve duplicate prop attach tracks`
- `perf(renderer): optimize character mesh LOD calculation`

### 5. Generate MR Description

All lines under 100 characters. Structure:

```markdown
## Summary
[1-2 concise sentences explaining what this MR accomplishes]

## Problem
[Describe the issue, bug, or feature being addressed]
[Include impact on users/system]
[Reference related tickets if mentioned in commits]

## Solution
[Explain the approach taken]
[Justify key decisions]
[Mention alternatives considered if applicable]

## Additional Notes
[ONLY include if there are breaking changes or significant
performance impacts. Otherwise omit this entire section.]
```

### 6. Handle Large-Scale Changes

- Over 500 lines or 20+ files:
  Group changes by category, provide a roadmap, highlight review areas
- Over 1000 lines:
  Suggest breaking into smaller MRs, focus on architecture

### 7. Quality Checks

- All lines under 100 characters
- Explain "why" not just "what"
- Be specific and measurable
- Use active voice
- Anticipate reviewer questions

### 8. Output Format

Present MR title as plain text, then description in markdown code block:

```
**MR Title:**
type(scope): description
```

Then description in triple-backtick markdown block, ready to copy-paste
into GitLab.

### 9. Create GitLab MR with glab CLI (Optional)

After generating, offer to create automatically:

1. Check: `glab auth status`
2. If authenticated, ask user for confirmation
3. If confirmed:
   ```bash
   glab mr create \
     --title "<generated-title>" \
     --description "<generated-description>" \
     --target-branch "<base-branch>" \
     --push \
     --yes
   ```
4. Handle errors: auth issues, unpushed branch, existing MR

## Error Handling

### Missing Base Branch
```
Error: Base branch argument is required.
Usage: /cocv-mr <base-branch> [optional context]
```

### Base Branch Not Found
```
Error: Base branch '<branch>' not found.
```
List available branches and stop.

### Same Branch
```
Error: Current branch is the same as base branch.
```

### No Changes
```
Error: No changes found between branches.
```
Suggest checking `git status` for uncommitted changes.
