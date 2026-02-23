# cocv-art-branch Reference

Detailed procedures for each sub-command. The orchestrator (SKILL.md) routes here.

---

## Common Setup

### Resolve Repo Path

1. Read `config.json` → get `repo_key`
2. Read `~/.claude/private/repo-paths.json` → look up path by key
3. All git commands use `git -C <repo_path>`

### Read State

1. Read `~/.claude/private/art-branches.json`
2. Find the `current` branch entry in `history`
3. Determine `state` (or infer if missing — see SKILL.md State Machine)

---

## `create`

Create a new weekly art branch from `origin/develop`.

### Step 1: Read art-branches.json

```bash
# Read current branch info
cat ~/.claude/private/art-branches.json
```

- Parse `current` branch name
- Auto-suggest next name: increment `-rN` suffix (e.g., `r4` → `r5`)
- Show suggestion, ask user to confirm or override

### Step 2: Fetch

```bash
git -C <repo_path> fetch --all
```

### Step 3: Create branch from remote develop

```bash
git -C <repo_path> checkout -b <new_branch> origin/develop
```

If branch already exists, report error and stop.

### Step 4: Cherry-pick weekend commits

Calculate time window: previous Friday 08:00 KST ~ this Monday 08:00 KST.

```bash
git -C <repo_path> log origin/<current_branch> --since="<friday_8am_kst>" --until="<monday_8am_kst>" --reverse --format=%H
```

Cherry-pick each commit in order:

```bash
git -C <repo_path> cherry-pick <commit_hash>
```

**Conflict**: stop immediately, show conflicting commit hash and files, ask user.

If no current branch or no commits in range, skip this step.

### Step 5: Push

```bash
git -C <repo_path> push -u origin <new_branch>
```

### Step 6: Delete previous art branch from remote

Check for remnant commits first (commits after merge branch tip):

```bash
# If merge_branch_head exists in art-branches.json
git -C <repo_path> log <merge_branch_head>..origin/<current_branch> --oneline --no-merges
```

If remnants exist, cherry-pick them first (with user confirmation).

Then delete (with user confirmation):

```bash
git -C <repo_path> push origin --delete <current_branch>
```

### Step 7: Slack notification

Use the existing `cocv-art-create-branch` send.py:

```bash
# Preview
python ~/.claude/skills/cocv-art-create-branch/send.py <new_branch> --dry-run

# Send (after user confirmation)
python ~/.claude/skills/cocv-art-create-branch/send.py <new_branch>
```

Thread info is auto-saved to `~/.claude/private/slack_threads.json` by the script.

### Step 8: Update art-branches.json

1. Set `current` to new branch name
2. Add new entry to `history`:

```json
{
  "branch": "<new_branch>",
  "created_at": "2026-02-24",
  "state": "created",
  "merge_branch": null,
  "merge_branch_head": null,
  "merge_created_at": null
}
```

3. Update old current branch entry: set `state` to `archived`

---

## `merge-prep`

Prepare the current art branch for merging into develop.

### Step 1: Fetch

```bash
git -C <repo_path> fetch --all
```

### Step 2: Checkout art branch

```bash
git -C <repo_path> checkout <current_branch>
git -C <repo_path> pull origin <current_branch>
```

### Step 3: Create merge branch

Derive name: `art/<versioning>` → `art/merge/<versioning>`

Example: `art/art-main-1.5.0-r5` → `art/merge/art-main-1.5.0-r5`

```bash
git -C <repo_path> checkout -b <merge_branch>
```

If branch already exists, ask user: delete and recreate, or abort.

### Step 4: Rebase on origin/develop

```bash
git -C <repo_path> rebase origin/develop
```

If conflicts: show conflicting files, ask user, do NOT auto-resolve.

### Step 5: Push

```bash
# First push
git -C <repo_path> push -u origin <merge_branch>

# After rebase (force needed)
git -C <repo_path> push --force origin <merge_branch>
```

**LFS lock error handling:**

If push fails due to LFS locks:
1. Extract locked file paths from error
2. Unlock: `git -C <repo_path> lfs unlock --force <locked_file_path>`
3. Retry push
4. If still fails, stop and report

### Step 6: Update art-branches.json

Update the current branch entry:

```json
{
  "merge_branch": "<merge_branch>",
  "merge_branch_head": "<HEAD commit hash>",
  "merge_created_at": "<ISO 8601 KST>",
  "state": "merge_prepared"
}
```

Get HEAD hash:

```bash
git -C <repo_path> rev-parse HEAD
```

### Step 7: Generate MR description

Run `/cocv-make-mr develop` to generate the MR description.

Show result to user for copy-paste into GitLab MR.

### Summary output

```
Merge branch ready:
  Branch:     <merge_branch>
  Based on:   <current_branch>
  Rebased on: origin/develop
  Pushed to:  origin/<merge_branch>
  State:      merge_prepared
```

---

## `merge-notice`

Send pre-merge notification as threaded Slack reply.

### Step 1: Load thread info

Read `~/.claude/private/slack_threads.json` for the current branch.

If no thread info found, show error and list available branches.

### Step 2: Confirm merge time

Ask user for the merge time (e.g., "내일 아침 8시 30분", "오늘 오후 3시").

### Step 3: Preview and send

```bash
# Preview
python ~/.claude/skills/cocv-art-send-merge-notice/send.py <current_branch> --time "<time>" --dry-run

# Show preview to user, get confirmation

# Send
python ~/.claude/skills/cocv-art-send-merge-notice/send.py <current_branch> --time "<time>"
```

### Step 4: Update state

Update `art-branches.json`: set current branch `state` → `merge_noticed`

---

## `merge-result`

Send post-merge completion notification with Korean summary.

### Step 1: Load thread info

Read `~/.claude/private/slack_threads.json` for the current branch.

### Step 2: Analyze merged commits

```bash
git -C <repo_path> fetch --all
git -C <repo_path> log origin/develop..origin/<current_branch> --oneline --no-merges
git -C <repo_path> diff origin/develop...origin/<current_branch> --stat
```

If merge branch exists, use that for comparison instead.

### Step 3: Generate Korean PM summary

Categorize commits:
- **아트**: Asset additions/updates (textures, materials, meshes, maps)
- **수정**: Bug fixes, corrections
- **기타**: Config changes, cleanup

Format:

```
머지 내역

[아트]
- F_CL001 텍스처 및 머티리얼 업데이트
- 캐릭터 프리셋 추가 (5건)

[수정]
- 머티리얼 슬롯 이름 수정

[기타]
- 설정 파일 정리
```

Omit empty categories. No contributor info.

### Step 4: Save merge stats

Save to `~/.claude/private/art-merge-stats/<branch-slug>.json`:

```json
{
  "branch": "<current_branch>",
  "merged_at": "2026-02-28",
  "total_commits": 37,
  "changes": {
    "art": ["description 1", "description 2"],
    "fix": ["description"],
    "chore": ["description"]
  }
}
```

Branch slug: replace `/` with `-` (e.g., `art-art-main-1.5.0-r5.json`).

### Step 5: Send broadcast message

Write broadcast message to tmp file:

```
`<current_branch>` 디벨롭 머지 완료되었습니다.
```

```bash
# Preview
python ~/.claude/skills/cocv-art-send-merge-result/send.py <current_branch> --broadcast --file tmp_broadcast.txt --dry-run

# Send (after user confirmation)
python ~/.claude/skills/cocv-art-send-merge-result/send.py <current_branch> --broadcast --file tmp_broadcast.txt
```

### Step 6: Send thread-only detail

Write Korean PM summary from Step 3 to tmp file.

```bash
# Preview
python ~/.claude/skills/cocv-art-send-merge-result/send.py <current_branch> --file tmp_detail.txt --dry-run

# Send (after user confirmation)
python ~/.claude/skills/cocv-art-send-merge-result/send.py <current_branch> --file tmp_detail.txt
```

### Step 7: Update state

Update `art-branches.json`: set current branch `state` → `merged`

---

## `cleanup`

Cherry-pick remnant commits and delete old branch.

### Step 1: Identify old and current branches

Read `art-branches.json`:
- Current branch = `current`
- Old branch = the one being cleaned up (ask user if ambiguous, or use the previous `current` from history)

### Step 2: Find merge branch tip

Look up `merge_branch_head` from the old branch's history entry.

Fallback sources (in order):
1. `art-branches.json` → `merge_branch_head`
2. Local/remote branch: `git branch -a | grep art/merge/`
3. Ask user for commit hash

### Step 3: Find remnant commits

```bash
git -C <repo_path> fetch --all
git -C <repo_path> checkout <current_branch>
git -C <repo_path> pull origin <current_branch>
git -C <repo_path> log <merge_branch_tip>..origin/<old_branch> --oneline --no-merges
```

Show list and count. If none, skip to Step 5.

### Step 4: Cherry-pick remnants

Show commits and ask for confirmation:

```
Cherry-pick할 잔여 커밋 N건:
- abc1234 commit message 1
- def5678 commit message 2

진행할까요?
```

Cherry-pick each (oldest first):

```bash
git -C <repo_path> cherry-pick <commit_hash>
```

On conflict: stop, show files, ask user.

After all cherry-picks:

```bash
git -C <repo_path> push origin <current_branch>
```

### Step 5: Delete old branch from remote

Show and confirm:

```
삭제 대상:
- Remote: origin/<old_branch>

진행할까요?
```

```bash
git -C <repo_path> push origin --delete <old_branch>
```

### Step 6: Update state

Update old branch entry in `art-branches.json`: set `state` → `archived`

### Summary output

```
Cleanup complete:
  Remnant commits: N cherry-picked
  Deleted remote:  <old_branch>
  Updated remote:  <current_branch>
  State:           archived
```

---

## `status`

Display current state and suggest next action.

### Step 1: Read state

Read `art-branches.json`, resolve current branch and state.

### Step 2: Show info

```
Art Branch Status
─────────────────
Branch:   <current_branch>
State:    <state> (since <created_at>)
Day:      <day_of_week>
```

### Step 3: Recent commits

```bash
git -C <repo_path> fetch --all 2>/dev/null
git -C <repo_path> log origin/<current_branch> --oneline -5
```

### Step 4: Suggest next action

Use the auto-suggestion matrix from SKILL.md to recommend the next step.

```
→ Suggested: <action> — <reason>

Available actions: create, merge-prep, merge-notice, merge-result, cleanup, status
```
