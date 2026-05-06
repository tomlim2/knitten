---
title: "Selection highlight system — umbrella issue draft"
tags:
  - type/spec
  - project/shotloom
  - area/rendering
  - lib/bevy
  - status/draft
date: 2026-05-06
source: claude-code
---

# Selection highlight system — umbrella issue draft

Linear umbrella issue 등록 전 draft. 본문은 Linear 에 그대로 붙여넣을 형태로 보존. 등록 후 이 파일은 `status/draft` → 제거 또는 `status/published` 로 변경.

## Linear metadata

| 필드 | 값 |
|---|---|
| Title | `feat(render): selection highlight system (umbrella)` |
| Team | Shotloom |
| Project | Shotloom - alpha |
| Priority | Medium (alpha selection UX 개선, blocking 아님) |
| Parent | 없음 — top-level umbrella. selection state sync (별도 우산) 와 sibling 관계. 추후 user 판단으로 child 로 옮길 수 있음 |
| Assignee | me (deemo) |
| State | Backlog |

## Body

```markdown
## Context

뷰포트 캐릭터 picking / 선택 동기화 인프라 (selection state, viewport picking 작업) 가 selection state 를 제공하지만, 시각적 피드백이 없어 사용자가 어느 캐릭터가 selected 인지 즉시 파악 어려움.

본 umbrella 는 *selection state 의 시각 표현* 전반을 다룸 — outline 만이 아니라 fill / glow / pulse 까지 같은 시스템 위에서 확장 가능하도록 처음부터 *future-proof 한 아키텍처* 로 설계.

`selection highlight` 는 art outline (MToon material 자체의 NPR outline) 과 직교 — engine 이 동적으로 그리는 system-level visual feedback.

## Goal

selected / hovered / target 등 selection state 별 시각 피드백 시스템 land.

성공 조건:
- selected 캐릭터의 silhouette 외곽선이 화면에 보임
- 멀티 상태 (selected / hovered / target) 의 색 / 두께 / 효과 분기 가능
- VRM (MToon) + 변환된 PMX 메쉬 모두 동작
- *모바일 환경 budget 통과* (target platform 포함)
- PP 효과 (bloom / DoF / vignette / motion blur) 영향 받지 않음 (UI/feedback 영역 보호)

## Architecture

```
[메인 카메라]    →  scene 정상 렌더 (모든 PP 거침)
[부캐 카메라]    →  selected 만 offscreen mask texture (R8 또는 R16, ID color)
[Distance field 단계]  →  binary 4-tap edge (1차) 또는 JFA (2차+) 로 distance 계산
[Outline composite]    →  *모든 PP / 업스케일 후, output 직전* 에 main color 위에 합성
```

핵심: mask producing 단계 / distance 단계 / composite 단계 분리. *composite backend 만 교체* 가능한 아키텍처 — binary edge → JFA → fill / glow 확장 모두 mask + RenderLayers 인프라 재사용.

## Bevy 생태계 reuse 검토

| Plugin | 상태 | 우리 의도 매치? |
|---|---|---|
| `bevy_mod_outline` 0.12.0 | maintained, Bevy 0.18 | ✗ inverted hull (안쪽 노이즈). JFA mode experimental. selection state 관리 없음 |
| `bevy_outliner` | abandoned | ✗ |
| `bevy_mod_picking` | Bevy 0.18 core | △ picking 만, outline 안 그림 |
| 자체 JFA outline crate | 없음 | ✗ |

→ **production-ready selection highlight crate 없음**. Bevy 철학상 *low-level plumbing* (RenderLayers, RenderGraph, Material, FullscreenMaterial) 만 native 제공, *high-level feature* 는 user 책임. Unity URP / UE 의 "Selection Outline 체크박스" 같은 건 부재.

작업량 vs Unity / UE 비교:

| 엔진 | "Selection outline" 작업 시간 |
|---|---|
| Unity URP | Renderer Feature + Outline shader graph → 1-2일 |
| UE 5 | PostProcess Material + Custom Stencil → 1일 |
| **Bevy 0.18** | 자체 구현 → 3-5일 |

Bevy 선택의 trade-off — high-level feature 부재의 비용 약 3-5배. 보상은 *모든 코드 우리 소유 + 디자인 자유 + 모바일 최적화 자체 결정*.

## Plugin 패키징

위치: `crates/shotloom-engine/src/render/selection_highlight/` 모듈로 시작. `SelectionHighlightPlugin` Bevy plugin trait 으로 노출. workspace 안에서 `add_plugins(SelectionHighlightPlugin)` 한 줄로 활성화.

향후 재사용 가치 명확해지면 별도 crate 분리 (`shotloom-selection-highlight`). 외부 공개는 그 다음 단계 — *현재 PR 범위 외*.

API 외형:

```rust
App::new()
    .add_plugins(DefaultPlugins)
    .add_plugins(SelectionHighlightPlugin)
    .run();

// entity 에 SelectionHighlight component 만 붙이면 자동 동작
commands.entity(character).insert(SelectionHighlight {
    fill: Some(FillSpec { ... }),
    outline: Some(OutlineSpec { ... }),
    glow: None,
});
```

## Phase plan (각 단계가 별도 child issue)

### Phase 1 — Selection outline (first variant)

**총 작업량**: ~5일 (4 PR 로 분할 권장).

#### PR 분할 (각 PR 이 독립 시각 검증)

| PR | Scope | LOC | 작업일 |
|---|---|---|---|
| **1-1: Mask 인프라 (binary)** | `SelectionHighlight` component, RenderLayers propagation, 부캐 카메라, mask texture 자원 관리, 단순 mask material (R=1.0), composite shader (binary 4-tap edge), render graph 노드 등록, `SelectionHighlightPlugin` 골격 | ~500-700 | 2-3일 |
| **1-2: ID encoding 업그레이드** | `SelectionMaskId(u32)` component, mask material 이 ID/255 출력, composite shader 가 ID 디코드 (현재는 selected 만 분기) | ~150-200 | 1일 |
| **1-3: STYLES uniform + spec API** | `OutlineSpec` + `ThicknessMode` enum, `FillSpec` / `GlowSpec` stub, STYLES storage buffer, composite shader spec lookup, runtime 색 / 두께 변경 | ~200-300 | 1-2일 |
| **1-4: Hovered / Target state binding** | `update_mask_id` 우선순위 로직, STYLES 에 hovered / target 슬롯, composite ID 별 분기 | ~100-150 | 1일 |

각 PR 의 *독립 시각 검증*:
- 1-1: selected character 단색 binary outline
- 1-2: 동일 시각 (내부 ID 인프라 준비)
- 1-3: outline 색 / 두께 runtime 변경 작동
- 1-4: 세 상태 동시 / 전환 정상

#### 분할 장점

- 각 PR 독립 시각 검증 — 회귀 / 스크린샷 baseline 박기 쉬움
- 모바일 budget 측정 *각 단계 누적* — 비용 폭발 추적
- Reviewer 부담 분산 (~300-500 LOC 가 1500 LOC 보다 훨씬 덜 부담)
- 디자인 의도 *재평가 기회* — 1-2 이후 멀티 상태 불필요 결정 시 1-3, 1-4 안 해도 됨

#### Phase 1 전체 Scope (모든 PR 합산)

- `SelectionHighlight` + 관련 component / spec API
- `FillSpec` / `GlowSpec` enum stub (구현 안 함, 이름 reserve)
- RenderLayers 자동 propagate 시스템 (자식 mesh 까지)
- 부캐 카메라 + offscreen mask + binary edge composite 파이프라인
- `ThicknessMode` 3종 (FixedPixels / WorldUnit / Clamped)
- 멀티 상태 (selected / hovered / target) 분기 인프라
- 모바일 / WebGPU / desktop 환경 측정 baseline
- 자체 구현 (외부 outline crate 의존 0)

**Out of scope of Phase 1**:
- JFA distance field (Phase 2)
- Inside fill / glow (Phase 3, 4)
- Through-wall 옵션 (Phase 5)

### Phase 2 — JFA distance field (필요 시)

**언제**: 디자인이 두께 5px+ / 가변 두께 / 둥근 모서리 / fade 요구 시.

**Scope**:
- JFA pass 구현 (log₂(width) 회 ping-pong)
- half-res JFA + bilinear upscale (모바일 default)
- composite shader 가 binary edge → distance field 기반으로 교체
- 측정 — 모바일 budget 통과 확인

### Phase 3 — Inside fill

**Scope**:
- `FillSpec` 구현 (color / alpha / inward_falloff)
- composite shader 에 inside 분기 추가
- inward gradient (edge 진하고 안쪽 fade) — JFA distance 활용

### Phase 4 — Glow band

**Scope**:
- `GlowSpec` 구현 (color / radius / intensity)
- composite shader 에 glow 분기 추가
- outline_thickness < d < glow_radius 영역 fade out

### Phase 5 — Through-wall option

**Scope**:
- main depth vs selected depth 비교
- 가려진 영역에도 outline / fill 그릴지 toggle
- desktop opt-in, 모바일 default off (cost 회피)

## Cost / Performance Plan

target platform 포함:
- Desktop (Windows / Mac discrete) — full feature
- Mac M1 / M2 (integrated) — half-res 권장
- WebGPU on Chrome — half-res 필수
- Mobile (Snapdragon 8+, Apple A-series) — half-res 필수, partial mask 권장
- iGPU (Intel UHD) — binary edge 만

각 Phase 별로 *모든 환경에서 측정* — `RenderDiagnosticsPlugin` baseline 필수. 모바일 fail 시 *모바일은 fallback path*, desktop 만 full feature.

자세한 비용 산정 plan: `obsidian-staging/projects/shotloom/learnings/selection-highlight-cost-estimation.md`

## Out of Scope (전체 umbrella)

- **Bone selection visualization** — 별도 시스템 (gizmo: sphere + axis at bone). character outline 시스템과 직교. 별도 이슈
- **Art outline (MToon NPR outline)** — character material 의 일부, 본 시스템과 직교
- **Stencil-based pipeline** — Bevy 0.18 의 stock 3D pipeline 에서 per-object stencil ref workflow 미숙. RenderLayers + mask 가 idiomatic
- **Custom outline crate dependency** (`bevy_mod_outline` 등) — experimental mode 의존성 회피, 자체 구현
- **TAA / DLSS / FSR 아래에서 outline 처리** — outline 은 모든 업스케일 *후* 합성 (UI 영역)

## Dependencies

- selection state component (`Selected` / `Hovered` / `Target`) — selection state sync 작업이 제공
- viewport picking — picking + 기즈모 작업이 selection state 트리거

## Acceptance Criteria (umbrella 종료 조건)

Phase 1 land 만으로 umbrella close 가능 (확장은 별도 후속). Phase 1 의 AC:

- [ ] `SelectionHighlight` + 관련 API 도입
- [ ] RenderLayers propagation 시스템
- [ ] Mask + composite 파이프라인 land
- [ ] VRM + PMX 캐릭터 시각 검증 (스크린샷)
- [ ] 모바일 / WebGPU / desktop 측정 baseline 보존
- [ ] 외부 outline crate dependency 0
- [ ] cargo fmt / clippy / test / doc-paths 통과

각 후속 Phase 는 자체 child issue 의 AC 가짐.

## References

- 설계 / 의사결정 흐름 (private learnings):
  - `obsidian-staging/projects/shotloom/learnings/character-outline-render-layers-mask-boundary.md` — 4가지 후보 비교 + RenderLayers + mask boundary 선정
  - `obsidian-staging/projects/shotloom/learnings/jump-flood-algorithm.md` — JFA 동작 + 렌더 파이프라인 위치 + PP 차단
  - `obsidian-staging/projects/shotloom/learnings/selection-highlight-system.md` — outline + fill + glow 통합 설계
  - `obsidian-staging/projects/shotloom/learnings/selection-highlight-cost-estimation.md` — 비용 산정 plan (모바일 포함)
- Bevy 0.18 release notes — `FullscreenMaterial`, RenderLayers
- `RenderLayers` API docs
- 자매 작업: selection state sync (parent 후보), viewport picking (selection state 트리거)
- Codex / Claude opus 검증 통과 — RenderLayers + mask + composite 가 Bevy 0.18 idiomatic, JFA 처음부터 안 가는 게 saner default
```

## 등록 전 체크

- [ ] Title / scope 본인 의도와 일치 확인
- [ ] Phase plan 5단계 합리적인지 검토 (Phase 1 = PR 4개 분할) — Phase 합치기 / 쪼개기 의견 있는지
- [ ] Priority Medium 적정한지 (alpha 우선순위에 따라 High / Low 조정 가능)
- [ ] Parent 결정 — top-level umbrella vs selection state sync child
- [ ] AC Phase 1 종료 기준 동의

## 다음 액션

1. 위 체크 통과 시 — Linear 에 등록 (`mcp__claude_ai_Linear__save_issue`)
2. 등록 후 — Phase 1 child issue 별도 작성 (이 spec 의 Phase 1 절을 별도 이슈로 분리, parent = 본 umbrella)
3. 본 spec 파일 — `status/draft` → `status/published` 로 frontmatter 업데이트, 또는 *Linear 등록 후 spec 파일 삭제* (umbrella 본문 = SSOT)

### 사이드 노트

- spec 파일 자체는 Linear 등록 후 *삭제* 해도 됨 — Linear umbrella 가 SSOT 가 되니 vault 측 spec 은 중복. 단 *linkable 한 url* 이 필요한 디자인 / 기획 협업 단계에선 vault 에도 두는 게 편할 수 있음
- Phase 가 5단계 (Phase 1 = PR 4개 분할) — Phase 1 만 land 해도 umbrella close 가능. 후속 Phase 는 디자인 의도 / 모바일 측정 결과 따라 *조건부 진행*
