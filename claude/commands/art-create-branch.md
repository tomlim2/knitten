---
description: Create art branch from develop with cherry-picked commits
argument-hint: "<new_branch> [source_branch]"
allowed-tools: MCP(art), Bash(git:*)
---

# Create Art Branch

CINEV 아트팀용 브랜치 생성 자동화.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `art-create-branch`

## 사용법

**If $ARGUMENTS is empty, show usage and ask the user for the branch name. NEVER auto-execute.**
```
Usage: /art-create-branch <new_branch> [source_branch]
Example: /art-create-branch art/art-main-1.5.0-r1 art/art-main-1.5.0
```

## Branch Naming

- Art branch: `art/<art-versioning>` (e.g., `art/art-main-1.5.0-r1`)
- Merge branch: `art/merge/<art-versioning>` (created by `/art-prepare-merge`)

## 실행

### Step 1: Get config

```
get_art_config()
```

Use the returned `repo_path` for all git commands below.

### Step 2: Fetch and prepare

```bash
git -C <repo_path> fetch --all
git -C <repo_path> checkout develop
git -C <repo_path> pull --ff-only origin develop
```

### Step 3: Create branch

```bash
git -C <repo_path> checkout -b <new_branch>
```

If branch already exists, report error and stop.

### Step 4: Cherry-pick commits (if source_branch provided)

Calculate time window: previous Friday 8AM KST ~ this Monday 8AM KST.

```bash
git -C <repo_path> log origin/<source_branch> --since="<friday 8AM>" --until="<monday 8AM>" --reverse --format=%H
```

Cherry-pick each commit in order:

```bash
git -C <repo_path> cherry-pick <commit_hash>
```

**컨플릭트 발생 시 즉시 중단하고 사용자에게 보고.**
- 컨플릭트 발생 커밋 해시와 순서 표시
- 해결 방법 안내: `git cherry-pick --continue` 또는 `--abort`

If no source_branch, skip this step.

### Step 5: Push

```bash
git -C <repo_path> push -u origin <new_branch>
```

### Step 6: 실행 전 확인 (Slack)

**Before sending Slack notification, show the user the message and ask for confirmation:**

> **채널:** art 채널
> **메시지:** Use the `art_notice_message` template from `get_art_config()`, replacing `{branch_name}` with the actual branch name.

Only proceed after user confirms.

### Step 7: Send Slack notification

```
slack_post_message(text=<formatted notification message>)
```

### Step 8: Save thread info

Save the returned `ts` and `channel` for future thread replies:

```
thread_save(branch_name=<new_branch>, channel=<channel from step 7>, ts=<ts from step 7>)
```

## 프로세스 요약

1. `git fetch --all`
2. `git checkout develop && git pull --ff-only` (fast-forward)
3. `git checkout -b <새브랜치>` (develop에서 분기)
4. 소스 브랜치에서 커밋 체리픽 (전주 금요일 8AM ~ 이번주 월요일 8AM KST)
5. 푸시 및 Slack art 채널 알림 + 스레드 정보 저장

**컨플릭트 발생 시 즉시 중단되고 해당 단계가 표시됩니다.**
