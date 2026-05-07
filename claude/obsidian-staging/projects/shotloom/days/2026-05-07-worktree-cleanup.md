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

## 결과

```
.worktrees/retarget-canonicalize-thumb-chain  [feat/retarget-canonicalize-thumb-chain]   STL-263
.worktrees/web-image-build                    [chore/ci-web-image-build]                 STL-304/306 (PR #253)
```

남은 active worktree 2개 모두 Linear In Progress / In Review 와 1:1 매칭.
