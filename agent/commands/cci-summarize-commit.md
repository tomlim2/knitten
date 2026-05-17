---
description: "Summarize today's local commits across CINEVStudio repos"
argument-hint: "[date: YYYY-MM-DD]"
allowed-tools: "Bash(git:*), Read, Grep, Glob, Write, Edit"
---

# CINEV Daily Commit Summary

Summarize local commits from today (or a specified date) across
CINEVStudio repositories, providing a clear overview of the day's work.
## Repositories

Read paths from `~/.claude/private/agent-hub-config/repo-paths.json` (use `entry.path`):

- `cinev-studio` (main)
- `cinev-engine` (second)

## Instructions

### Step 1: Determine Date

{{#if input}}
Target date: {{input}}
{{else}}
Target date: today
{{/if}}

Use the target date to filter commits by author date.

### Step 2: Gather Commits

For each repository, run:
```bash
git -C "<repo-path>/<subfolder>" log \
  --all \
  --after="<date> 00:00" --before="<date> 23:59" \
  --author="$(git -C "<repo-path>/<subfolder>" config user.name)" \
  --format="%h %s (%an, %ai)" \
  --no-merges
```

Also gather merge commits separately:
```bash
git -C "<repo-path>/<subfolder>" log \
  --all \
  --after="<date> 00:00" --before="<date> 23:59" \
  --author="$(git -C "<repo-path>/<subfolder>" config user.name)" \
  --format="%h %s (%an, %ai)" \
  --merges
```

Note: The actual git working directory may be a subfolder (e.g.,
`CINEVStudio/` inside the repo root). Check with `git rev-parse
--show-toplevel` to find the correct path.

### Step 3: Get Change Details

For each non-merge commit, get the diff stat:
```bash
git -C "<repo-path>" show <hash> --stat --format=""
```

For commits with unclear messages, read the actual diff to understand
what changed:
```bash
git -C "<repo-path>" show <hash> --format=""
```

### Step 4: Classify and Summarize

Classify each commit into categories:
- **Feature**: New functionality (`feat`)
- **Fix**: Bug fixes (`fix`)
- **Refactor**: Code restructuring (`refactor`)
- **CI/CD**: Pipeline changes (`ci`, `chore`)
- **Content**: Art/asset changes (`content`)
- **Merge**: Branch merges

### Step 5: Special Handling for Art Branch Merges

For commits matching these patterns, **only note the merge fact**:
- `Merge branch 'art/*' into 'develop'`
- `content(art): merge art-*`
- Any merge from an art branch

Do NOT list individual art changes. These contain work from multiple
team members, not just the author.

Example output for art merges:
```
- art/art-main-1.5.0-r2 → develop 머지 완료
```

### Step 6: Output Format

```markdown
# Daily Work Summary — YYYY-MM-DD

## cinev-studio (main)

### [Category]
- [commit hash] [description of what was done and why]
  - [key files changed, if meaningful]

### Merges
- [branch] → [target] 머지 완료

## cinev-engine (second)

### [Category]
- [commit hash] [description of what was done and why]
  - [key files changed, if meaningful]

---

**Total: N commits (M features, F fixes, R refactors, ...)**
```

Guidelines:
- Write in Korean
- Focus on "what was accomplished" not just "what was committed"
- Group related commits together
- For small/trivial commits, keep descriptions brief
- For significant changes, explain the impact
- Omit empty categories
- If a repository has no commits for the day, note "커밋 없음"

### Step 7: Save to File

After displaying the summary to the user, save it to:
```
resolver `daily` destination + `/YYYY-MM-DD.md`
```

- If the file already exists, append the new summary with a separator
- Use the Write tool to create or Edit tool to append
