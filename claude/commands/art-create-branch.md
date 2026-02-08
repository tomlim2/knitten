---
description: Create art branch from develop with cherry-picked commits
argument-hint: "<new_branch> [source_branch]"
allowed-tools: Bash(python:*)
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

## 실행 전 확인

**Before executing, show the user the Slack message that will be sent and ask for confirmation:**

> **채널:** art 채널
> **메시지:** `@here 아트 새브렌치가 나왔습니다~ {branch_name}`

Only proceed after user confirms.

## 실행

Run the art branch creator script:

```bash
python "C:\Users\TA_yeonsu\.claude\skills\art-create-branch\create_art_branch.py" $ARGUMENTS
```

## 프로세스

1. `git fetch --all`
2. `git checkout develop && git pull --ff-only` (fast-forward)
3. `git checkout -b <새브랜치>` (develop에서 분기)
4. 소스 브랜치에서 커밋 체리픽 (전주 금요일 8AM ~ 이번주 월요일 8AM KST)
5. 푸시 및 Slack art 채널 알림

**컨플릭트 발생 시 즉시 중단되고 해당 단계가 표시됩니다.**
