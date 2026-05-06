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

main checkout 이 삭제된 remote 브랜치 (`chore/retarget-add-curl-composition-tests`, finger-curl composition tests PR squash-merged 후 정리됨) 를 추적 중이었음. `git fetch --prune` + `git checkout main` + `git pull --ff-only` 로 정상화. 7 commit fast-forward.

## 11:10 — four-finger ScalarCurl + 4-finger baseline 두 작업 close

| | four-finger ScalarCurl impl | 4-finger baseline verification |
|---|---|---|
| PR | MERGED | MERGED |
| Linear | 이미 Done | 이미 Done |
| Worktree 제거 | ✓ | ✓ |
| Branch `-d` | refused (squash-merged 라 normal) | refused (동일) |

worktree 둘 다 clean 상태에서 안전하게 제거. local branch 는 squash-merge 라 `-d` 가 거부 — 본 skill 정책상 `-D` 강제 삭제 금지하므로 보존. 다음 정리 사이클에 일괄 prune 가능.

## 남은 worktree

- `feat/retarget-add-calibration-mode` — 현재 작업 (calibration mode + 진단 도구 + canonical-world 실험 checkpoint, 커밋 53c9ba8)
- `feat/retarget-canonicalize-thumb-chain` — thumb chain naming canonicalization PR OPEN
- `feat/retarget-align-thumb-carpometacarpal` — uncommitted 10개 파일, no PR. canonicalization PR 의 superseded 작업 가능성 있음. 별도 확인 필요해 보존

> [!tip] squash-merge 후 `-d` 거부는 정상
> shotloom 의 PR 관행이 squash 라 local branch 가 fully-merged 로 인식 안 됨. `-d` 거부는 스킵하고 다음 정리 때 한꺼번에 보내는 게 안전.

> [!abstract] Rule
> close-task 의 branch -d refusal 은 squash-merge 신호. 강제 삭제 (`-D`) 는 user 명시 승인 필요 — 자동화에 넣지 말 것. #rule

## 오후 — selection highlight system umbrella 설계

Bevy 0.18 selection highlight (선택 캐릭터 시각 피드백) 시스템 umbrella 이슈 작성. 디자인 단계에서 끝까지 고민 + Codex / Opus 검증 거쳐 *production-grade* plan 도출.

### 거친 단계

1. *4가지 후보 비교* — inverted hull / stencil / RenderLayers + mask / JFA. inverted hull 안쪽 노이즈 문제 + stencil 의 Bevy 0.18 비ergonomic 으로 *RenderLayers + mask + composite* 선정
2. *PP 영향 회피* — outline 은 *모든 PP / 업스케일 후, output 직전* 위치. bloom / DoF / vignette / motion blur 영향 없음
3. *비용 산정 plan* — 모바일 target 포함이 ceiling. half-res JFA + partial mask 가 모바일 default. 측정 도구 (RenderDiagnosticsPlugin) baseline 필수
4. *작업 분할* — Phase 1 을 PR 4개로 (단색 outline 인프라 → ID encoding → spec API → multi-state 활성화). 각 PR 독립 시각 검증
5. *Plugin 패키징* — `shotloom-engine` 내부 module + `SelectionHighlightPlugin`. 향후 별도 crate 분리 여지
6. *명명 정리* — 모든 phase / PR 이름을 *user / design 관점 capability* 우선으로 reframe (기술 어휘는 보조)
7. *Glow 효과 제외* — 디자인 의도 확인 결과 빛 효과 불필요. Phase 4 (was glow) 제거, through-wall 이 새 Phase 4

### 산출물

- Linear umbrella issue (priority Medium, Backlog)
- Spec draft (`obsidian-staging/projects/shotloom/specs/selection-highlight-system-umbrella.md`)
- Learning notes 5개:
  - `character-outline-render-layers-mask-boundary.md` — 4 후보 비교
  - `jump-flood-algorithm.md` — JFA 동작 + 파이프라인 위치 + PP 차단 + 두께 mode
  - `selection-highlight-system.md` — outline + fill 통합 설계
  - `selection-highlight-cost-estimation.md` — 모바일 포함 비용 산정
  - `selection-highlight-qa.md` — 구현 의문점 FAQ
- ADR draft 예정 (architecture 결정 영구 기록)

### 핵심 학습

- *Bevy 의 high-level feature 부재* — selection outline 같은 feature 가 native 부재. 직접 구축. Unity / UE 의 1-2일 작업이 Bevy 에선 3-5일. 보상은 자유도 + 코드 소유권.
- *디자인 의도 확정 → 비용 산정 → 작업 분할 순서* — naming / 단계 결정은 의도 확정 후. 처음에 inverted hull / stencil / JFA 우선 가정한 게 의도 명확화 후 모두 정정됨.
- *모바일 포함 = ceiling* — desktop 측정만으로 결정 금지. 처음부터 모바일 친화 default.

> [!tip] umbrella 이슈 작성은 *디자인 의도 → 측정 가능한 phase → 명명* 순서로
> 기술적으로 그럴싸한 plan 짜놓고 명명을 마지막에 손보면 *user 관점 의미* 가 드러남. shotloom 의 selection highlight 는 4 phase 모두 *user capability* 한 줄로 표현 가능 — 이게 명확하면 reviewer / 디자인팀 모두 즉시 이해.

> [!abstract] Rule
> umbrella 이슈의 phase / PR 이름은 *기술 용어가 아닌 user / design 관점의 capability* 우선. 기술 어휘는 괄호 보조. *"이 단계 후 무엇이 가능해지는가"* 한 줄로 표현 안 되면 단계 자체가 미정의. #rule

### 사이드 노트

- glow 효과 dropping 도 *디자인 의도 한 번 확인* 으로 작업량 ~1일 줄임. *추측 design 으로 Phase 짜는 위험* 의 명확한 사례
- Codex 질문 패턴 정립 — 짧고 *project-agnostic* 한 질문 + `--sandbox read-only --skip-git-repo-check` flag + `cd /tmp` 로 1분 내 응답. dev-ask-codex skill 에 정식화
