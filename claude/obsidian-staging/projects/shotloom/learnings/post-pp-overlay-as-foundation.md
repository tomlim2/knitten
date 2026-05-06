---
title: "Post-PP overlay = foundation, selection highlight = consumer (priority inversion)"
tags:
  - type/learning
  - project/shotloom
  - area/rendering
  - area/architecture
date: 2026-05-06
source: claude-code
---

# Post-PP overlay = foundation, selection highlight = consumer (priority inversion)

shotloom selection highlight system 설계 중 발견한 *architecture priority inversion* 사례. 처음엔 selection highlight 가 메인 작업으로 보였지만, *post-PP overlay 단계 자체가 foundation* 임을 인식하고 우선순위 재정렬.

## 발생한 priority inversion

### 처음 framing (잘못된 우선순위)

```
Main task:        selection highlight system
Implementation:    RenderLayers + offscreen mask + JFA + composite
                   ↑
                   "composite 를 모든 PP 다음에 둔다" 가 implementation detail 처럼 보였음
```

### 사용자 통찰 후 (올바른 우선순위)

```
Foundation:       post-PP overlay infrastructure  ← 진짜 1순위
Consumer 1:        selection highlight
Consumer 2:        bone gizmo
Consumer 3:        transform gizmo (이미 존재, audit 필요)
Consumer 4:        debug overlay (frustum, bounding box, wireframe)
Consumer 5:        3D world-space text / 라벨
Consumer N:        ...
```

→ 모든 consumer 가 *공통 요구사항* (PP 영향 회피, output 직전 합성, pixel-perfect) 가짐. 인프라 primitive 가 부재하면 각자 자기식으로 → 컨벤션 drift / 중복 / 통합 어려움.

## Priority inversion 발견 패턴

내가 *implementation detail* 인 줄 알았던 한 단계가 *사실 foundation* 일 때 보이는 신호:

| 신호 | 의미 |
|---|---|
| 그 단계가 *여러 미래 consumer* 에 의해 동일하게 필요 | foundation 후보 |
| 그 단계의 비용이 *실제 main task 와 분리 가능* | 별도 PR / issue 가치 |
| 그 단계의 *컨벤션 결정* 이 ADR 가치 있음 | architecture 영역 |
| consumer 가 둘 이상 명확히 보임 | 일반화 정당화 |
| 한 consumer 만 짜는 비용 ≈ foundation + 첫 consumer 비용 | 어차피 분리 비용 0 |

shotloom 의 post-PP overlay 가 *5가지 모두* 만족 → foundation 분리 명확.

## 비슷한 패턴 (도메인 무관)

| 분야 | "implementation detail 인 줄 알았는데 foundation" 사례 |
|---|---|
| **Networking** | TCP / UDP 의 "패킷 순서 보장" 은 구체 protocol 에 박을 일 아니라 transport layer 자체 |
| **DB** | "트랜잭션 isolation" 이 한 query 의 detail 같지만 *DBMS 전체 architecture* |
| **Bevy ECS** | 한 system 의 "component query filter" 는 detail, *system ordering / set 컨벤션* 은 foundation |
| **Web** | 한 endpoint 의 "auth check" 는 detail, *middleware layer / auth context* 는 foundation |
| **shotloom** | selection highlight 의 "composite at post-PP" 는 detail, *post-PP overlay infrastructure* 는 foundation |

→ 한 task 가 *이미 다른 영역에서도 같은 작업 반복* 한다 신호 보이면 그게 foundation.

## 추가 발견 — 기존 구현이 부분적으로 cover 하기도 함

본 작업 중 *현재 shotloom 에 이미 selection 시각이 존재* 함을 코드 검색으로 발견:

- `crates/shotloom-engine/src/gizmo/mod.rs::SelectionOutline`
- Annulus mesh + StandardMaterial 로 *Maya / RTS 식 바닥 ring* 그림
- 캐릭터 발 밑에 노란 도넛 (지름 ~1.7m, 살짝 띄움)

새로 짜려던 *UE / Unity Editor 식 silhouette outline* 과 *완전 다른 시각*:
- 현재: 바닥 위치 마커 (RTS 게임 스타일)
- 계획: 캐릭터 mesh 윤곽선 (UE editor 스타일)

→ 디자인 의도 확인 필요. 기존 ring 으로 selection 시각 의도 충족되면 silhouette outline 작업 *불필요*. 둘 다 필요하면 *기존 ring 위에 silhouette 추가*. 의도 확정까지 silhouette 작업 보류.

## 학습

### 1. *"이 단계가 여러 곳에서 같은 일 한다"* 가 foundation 신호

- 한 단계가 *future consumer 도 같은 일 함* 으로 보이면 foundation 후보
- 첫 consumer 만 land 하기 전에 *foundation 으로 분리* 검토. 분리 비용은 보통 작음 (~1일)
- 분리 안 하면 N 번째 consumer 추가 시 redesign 비용 큼

### 2. 명명 / 우선순위 결정은 *consumer 발견 후* 

- 처음에 selection highlight 가 메인이었지만 *consumer 5+개 보이고 나서야* foundation 분리 명확
- consumer 가 한 개일 때 일반화하면 over-engineering 위험
- consumer 가 명확히 둘 이상이 되면 일반화 정당
- shotloom 의 post-PP overlay 는 *consumer 5+ 명백* — 일반화 안전

### 3. 코드베이스 audit 가 framing 바꾼다

- 작업 시작 전 *현재 시스템 audit* 이 framing 정확도 좌우
- shotloom 처럼 *기존 시스템이 부분 cover* 하는 케이스 흔함
- "처음부터 짜는" 가정으로 plan 짜고 나서 audit 하면 *이미 있던 것 반복* 위험
- audit → 의도 확정 → 작업 분할 순서

> [!tip] Implementation detail 인 줄 알았던 한 단계가 *여러 미래 consumer 에 의해 동일하게 필요* 하면 foundation
> 첫 consumer 의 implementation 안에 박지 말고, 별도 primitive 로 분리. 분리 비용은 보통 작음 (sentinel 노드 + 컨벤션 ADR ~100 LOC). 안 분리하면 N 번째 consumer 추가 시 redesign 비용 큼.

> [!abstract] Rule
> 새 시스템 설계 시 *implementation detail 같아 보이는 한 단계* 가 사실 foundation 인지 다음 5 신호로 체크: (1) 여러 미래 consumer 가 같은 일 필요, (2) 비용이 main task 와 분리 가능, (3) 컨벤션 결정이 ADR 가치, (4) consumer 둘 이상 명확, (5) 분리 비용 ≈ baked-in 비용. 모두 또는 다수 만족 시 foundation 으로 분리. #rule

> [!warning] 기존 구현 audit 없이 plan 짜면 redesign 위험
> "처음부터 짜는" 가정으로 plan 짜기 전에 *현재 코드베이스에서 같은 일 하는 시스템 있는지* 검색. shotloom 의 selection highlight 작업 plan 후반에 발견한 `SelectionOutline` (ring 형) 가 디자인 의도 일부 충족 — 일찍 audit 했으면 framing 처음부터 다름. **교훈:** 코드베이스 audit → 디자인 의도 확정 → 작업 분할.

## shotloom 의 적용

이 학습으로 다음 변경:

1. *Post-PP overlay infrastructure* 별도 umbrella 신규 생성 (priority High, foundation)
2. *Selection highlight* umbrella 보류 (디자인 의도 확정 대기)
3. 기존 `SelectionOutline` (ring) 과 transform gizmo 의 PP-immune 상태 audit — foundation umbrella 의 scope
4. Foundation 위에 consumer 들 차례로 land — selection highlight, bone gizmo, debug overlay, 3D 텍스트 등

이 순서가 *cleaner architecture* + *작업량 누적 비슷* (foundation ~1.5일 추가지만 selection highlight 등 후속 작업의 render-graph 부분 ~0.5일씩 줄어듦).

### 사이드 노트

- Bevy 가 *low-level plumbing* (RenderGraph, RenderLayers, FullscreenMaterial) 만 native 제공하는 철학 — *high-level feature* 우산은 user 책임. shotloom 이 그 우산을 짓는 게 일관된 패턴
- post-PP overlay 같은 foundation 들이 모이면 *shotloom 의 architecture style* 이 형성됨 — 향후 신규 시스템 도입 시 "이게 foundation 인가 consumer 인가" 검토가 routine 작업이 됨
- *priority inversion 발견* 도 디자인 / architecture 의 한 art — 매 시스템 설계 시 1-2회는 일어나는 것 같음. 이번 작업도 그 사례.
