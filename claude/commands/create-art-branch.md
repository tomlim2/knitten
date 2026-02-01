---
allowed-tools: Bash(python:*)
description: Create art branch from develop with cherry-picked commits
argument-hint: "<new_branch> [source_branch]"
---

# Create Art Branch

CINEV 아트팀용 브랜치 생성 자동화.

## 사용법

**If $ARGUMENTS is empty, stop immediately and show:**
```
Usage: /create-art-branch <new_branch> [source_branch]
Example: /create-art-branch art/art-main-1.5.0-r1 art/art-main-1.5.0
```

## 실행

Run the art branch creator script:

```bash
python "C:\Users\TA_yeonsu\.claude\skills\create-art-branch\create_art_branch.py" $ARGUMENTS
```

## 프로세스

1. Git 레포 상태 확인 (`E:\Second\CINEVStudio`)
2. `git reset --hard && git fetch --all`
3. `origin/develop`에서 새 브랜치 생성
4. 새 브랜치 체크아웃
5. 소스 브랜치에서 커밋 체리픽 (전주 금요일 8AM ~ 이번주 월요일 8AM KST)
6. 푸시 및 Slack art 채널 알림

**컨플릭트 발생 시 즉시 중단되고 해당 단계가 표시됩니다.**
