---
title: "2026-05-06 — worktree housekeeping"
tags:
  - type/devlog
  - project/shotloom
  - area/ops
date: 2026-05-06
source: claude-code
---

# 2026-05-06 — worktree housekeeping

shotloom 워크트리 정리. main checkout upstream 정리 + merged worktree 두 개 제거.

## 11:00 — main checkout upstream cleanup

main checkout 이 삭제된 remote 브랜치 (`chore/retarget-add-curl-composition-tests`, PR #225 squash-merged 후 정리됨) 를 추적 중이었음. `git fetch --prune` + `git checkout main` + `git pull --ff-only` 로 정상화. 7 commit fast-forward.

## 11:10 — four-finger ScalarCurl + 4-finger baseline 두 작업 close

| | four-finger ScalarCurl impl | 4-finger baseline verification |
|---|---|---|
| PR | #220 MERGED | #216 MERGED |
| Linear | 이미 Done | 이미 Done |
| Worktree 제거 | ✓ | ✓ |
| Branch `-d` | refused (squash-merged 라 normal) | refused (동일) |

worktree 둘 다 clean 상태에서 안전하게 제거. local branch 는 squash-merge 라 `-d` 가 거부 — 본 skill 정책상 `-D` 강제 삭제 금지하므로 보존. 다음 정리 사이클에 일괄 prune 가능.

## 남은 worktree

- `feat/retarget-add-calibration-mode` — 현재 작업 (calibration mode + 진단 도구 + canonical-world 실험 checkpoint, 커밋 53c9ba8)
- `feat/retarget-canonicalize-thumb-chain` — PR #228 OPEN
- `feat/retarget-align-thumb-carpometacarpal` — uncommitted 10개 파일, no PR. PR #228 의 superseded 작업 가능성 있음. 별도 확인 필요해 보존

> [!tip] squash-merge 후 `-d` 거부는 정상
> shotloom 의 PR 관행이 squash 라 local branch 가 fully-merged 로 인식 안 됨. `-d` 거부는 스킵하고 다음 정리 때 한꺼번에 보내는 게 안전.

> [!abstract] Rule
> close-task 의 branch -d refusal 은 squash-merge 신호. 강제 삭제 (`-D`) 는 user 명시 승인 필요 — 자동화에 넣지 말 것. #rule
