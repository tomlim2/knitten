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

## 최종 결정 — alpha 시점 두 작업 모두 defer

코드 audit + 디자인 의도 / alpha scope 재검토 결과:

| Issue | 상태 | 결정 근거 |
|---|---|---|
| selection highlight (silhouette outline) | Backlog Low priority, alpha 후 재검토 | 현재 ring 형 `SelectionOutline` 으로 alpha selection UX 충족. silhouette outline 은 alpha 의도 외 |
| post-PP overlay infrastructure | Backlog Low priority, alpha 후 재검토 | alpha 시점 PP 효과 활성화 제한적. transform gizmo + ring 이 *시각적으로 동작은 함* — alpha scope 에서 PP-immune 미보장 미감내 가능. silhouette / 3D 텍스트 같은 진짜 PP-immune consumer 가 들어올 때 도입 |

→ 둘 다 *alpha 차단 요소 아님*. alpha 후 *진짜 필요해질 때* 진행. 그동안:
- 디자인팀이 ring 만으로 selection 시각 충분한지 사용 후 재평가
- alpha 진행하며 PP 효과 활성화 후 transform gizmo / ring 시각 깨지는지 모니터
- 진짜 필요 신호 보이면 priority 재상향

**오늘 작업 산출물**:
- 코드 audit 으로 *기존 SelectionOutline (ring) 발견* — framing 정정
- *Priority inversion* 학습 (post-pp-overlay-as-foundation.md)
- 두 umbrella issue 등록 (보류 / Low priority 상태)
- 5+ learnings + spec draft 보존 — alpha 후 재개 시 즉시 사용 가능

> [!tip] alpha scope 결정의 핵심 질문 — *"이거 없으면 alpha 가 동작 안 하는가?"*
> 동작하는데 *덜 좋은 정도* 면 보통 defer 가능. 실제 동작 차단 요소만 alpha 우선순위. 본 작업처럼 silhouette outline + post-PP overlay 둘 다 *현재 ring + transform gizmo 로 동작은 하니* defer 가능. alpha 후 *진짜 필요* 가 명확해지면 빠르게 재개.

### Alpha scope 정식 확인 — `docs/specs/product-requirements-alpha.md`

repo 의 alpha PRD 가 이 결정을 뒷받침:

In scope (selection / 시각 관련):
- React + TypeScript editor shell
- Up to 3 VRM 1.0 characters on void stage
- Multicam 카메라 클립 편집
- Real-time preview / scrubbing
- Chrome stable + WebGPU
- "void stage with stable spatial reference and mood-lighting baseline"

Non-Goals:
- Particle / VFX systems
- Unreal-quality render parity
- (PP 효과 / bloom / DoF / motion blur 명시 없음 — alpha scope 외)
- (Selection highlight silhouette / outline 명시 없음 — alpha scope 외)

→ silhouette outline + post-PP overlay 둘 다 *알파 PRD 와 일치하지 않음*. 현재 ring + transform gizmo 가 alpha selection UX 충족. **PP 효과 자체가 alpha in-scope 가 아니라 PP-immune 보장도 alpha 에 무관**. 두 issue defer 결정 정합.

> [!abstract] Rule
> alpha / 마일스톤 scope 결정 시 *그 마일스톤의 PRD / 스펙 문서를 SSOT* 로. issue 작성자의 직관 / 추측이 아니라 명시 문서가 결정 기준. PRD 에 있어야 in scope, 명시 없으면 defer 안전. shotloom 의 `docs/specs/product-requirements-alpha.md` 가 그 SSOT. #rule

## 마감 — 알파 시점 retarget 작업 사실상 종료

Linear 점검 결과:

| 입장 | 상태 |
|---|---|
| In Progress | STL-260 (parent), STL-276 (PR #228 작업) |
| Open PR | #228 (STL-276), #236 (wrist basis correction) — 둘 다 mergeable |
| Backlog 의 알파 이슈 | 없음. 전부 alpha 후 / Low priority refactor / doc |

→ **남은 알파 retarget 작업 = PR #228 + PR #236 land 만**. 그 두 PR 머지되면 alpha retarget scope 완료. 다른 deemo 알파 차단 요소 없음.

오늘 한 일 압축:

1. 워크트리 / 브랜치 29개 정리 (오전)
2. Selection highlight 심층 설계 + 알파 PRD 정합 확인 → 알파 후 defer 확정 (오후)
3. Post-PP overlay foundation 발견 + priority inversion 학습 정리
4. Learnings 6개 + spec draft 1개 + skill (`dev-ask-codex`) 패턴 정립
5. Linear 두 umbrella 등록 (둘 다 alpha 후 Low priority Backlog)

> [!tip] *알파 차단 요소 없는 시점* 이 발견되면 우선 휴식 / 컨텍스트 리셋이 정답
> 무리한 추가 작업으로 backlog 늘리기보단 *진행 중인 PR 응대 + 휴식* 이 다음 work session 의 처리량을 더 크게 만든다. 오늘 작업도 architecture 결정 / learning 정리 위주라 머리 많이 쓴 날 — 이런 날은 휴식의 가치 큼.

다음 session 진입 시: PR #228 / #236 review 응대로 시작 → alpha retarget 완료.
