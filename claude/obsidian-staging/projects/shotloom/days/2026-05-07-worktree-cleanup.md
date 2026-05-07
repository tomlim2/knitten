---
title: "2026-05-07 — worktree cleanup"
tags:
  - type/devlog
  - project/shotloom
  - area/ops
date: 2026-05-07
source: claude-code
---

# 2026-05-07 — worktree cleanup

리니어 할일 정리하면서 매칭 안 되는 워크트리 3개 제거.

## 정리 대상

| 워크트리 | 브랜치 | PR | 처리 |
|---|---|---|---|
| `bump-basic-ftp` | `chore/bump-basic-ftp` | #254 MERGED | worktree remove + branch -D |
| `retarget-align-wrist-basis-two-vector` | `fix/retarget-align-wrist-basis-two-vector` | #236 MERGED | worktree remove + branch -D |
| `ci-add-release-web-workflow` | `chore/ci-add-release-web-workflow` | #243 CLOSED | worktree remove --force + branch -D |

세 브랜치 모두 squash-merge 또는 close 상태라 `git branch -d` 가 거부됨. 사용자 승인 후 `-D` 강제 삭제로 진행.

## ci-add-release-web-workflow 의 untracked 파일

PR #243 (closed) 작업 시점에 탐색했던 Caddy 기반 local 컨테이너 구성:

- `apps/editor/Caddyfile` — Caddy MIME / COOP+COEP / 404 handling 설정
- `apps/editor/Containerfile` — `caddy:2-alpine` 기반 단일 stage 이미지

채택된 방식 (PR #253, `chore/ci-web-image-build`) 은 nginx + multi-stage Rust/Node 빌드. 두 파일 다 현재 사용 안 하므로 worktree와 함께 폐기.

## STL-263 worktree + Linear 정리

`retarget-canonicalize-thumb-chain` worktree 도 함께 제거. 추가 발견:

- PR #228 (calibration delta 상수화) 머지됨. 그 위에 doc 커밋 3개 stranded (`9249024`, `5d1e4e0`, `caf18b5` — EXP-NNN 라벨 제거 / 배너 압축 / README 신설 + PR #228 리뷰 응답).
- 현재 main 에 cherry-pick 시 충돌 — squash-merge 결과와 textual divergence 때문.
- Linear STL-263 의 parent STL-291 가 post-alpha 보류 → 자식만 In Progress 진행하던 게 모순.

조치:

1. worktree remove + branch `-D feat/retarget-canonicalize-thumb-chain`
2. STL-263 → Backlog 전환
3. STL-263 description 에 doc cleanup follow-up 항목 추가 (재개 시 같이 처리)

## 결과

```
.worktrees/web-image-build  [chore/ci-web-image-build]  STL-304/306 (PR #253)
```

남은 active feature worktree 1개. claude/* sandbox worktree 2개는 별개.
