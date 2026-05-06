---
title: "Selected 캐릭터 outline — RenderLayers + mask boundary 패턴"
tags:
  - type/learning
  - project/shotloom
  - area/rendering
  - lib/bevy
date: 2026-05-06
source: claude-code
---

# Selected 캐릭터 outline — RenderLayers + mask boundary 패턴

Bevy 0.18 에서 selected 상태 캐릭터에 silhouette-only outline 그리는 방법. 4가지 후보 (inverted hull, stencil + PP, RenderLayers + PP, JFA) 중 inverted hull 안쪽 noise 문제와 stencil 의 over-engineering 위험을 고려하면 **RenderLayers + mask boundary** 가 가장 idiomatic.

## 두 개념 분리

### RenderLayers — entity 시각 필터

Bevy 가 entity 를 카메라가 그릴지 안 그릴지 *라벨* 로 거르는 시스템.

```rust
commands.spawn((
    Mesh3d(character_mesh),
    RenderLayers::from_layers(&[0, 1]),  // layer 0 + layer 1 둘 다 속함
));

Camera { render_layers: RenderLayers::layer(0), ... }  // 메인
Camera { render_layers: RenderLayers::layer(1), ... }  // 부캐 (마스크용)
```

비유: 학생들에게 색깔 스티커. 빨간 스티커만 찍는 카메라가 따로 있음.

**0.18 함정**:

- 부모 entity 에만 RenderLayers 붙이면 자식 mesh 에 *자동 상속 안 됨*. VRM/glTF/PMX 처럼 mesh entity 가 깊게 spawn 되면 모든 `Mesh3d` 까지 propagate 필요.
- 기본 layer 0. 마스크 카메라가 layer 0 도 보면 전체 씬 잡힘.
- gizmo / debug draw / fullscreen PP / UI 가 RenderLayers 무시할 수 있음.
- transparent / alpha-cutout (머리카락) 정책 따로 — 알파 무시하면 구멍 메워지고, 존중하면 얇은 내부 edge 생김.

### Mask boundary — 실루엣 외곽선만 추출

부캐 카메라가 만든 offscreen texture 는 selected 캐릭터 영역만 흰색으로 찍힌 그림.

```
  검 검 검 검 검 검 검
  검 검 흰 흰 흰 검 검   ← 흰 영역 = selected 캐릭터
  검 흰 흰 흰 흰 흰 검   ← 검 영역 = 그 외
  검 흰 흰 흰 흰 흰 검
  검 검 흰 흰 흰 검 검
  검 검 검 검 검 검 검
```

각 픽셀에서 "내가 흰데 이웃 중 하나라도 검?" 체크 → 그렇다면 *경계 픽셀*. 그 픽셀만 outline 색으로 출력.

```
  . . . . . . .
  . . X X X . .   ← 경계 픽셀
  . X X . X X .
  . X . . . X .
  . . X X X . .
  . . . . . . .
```

**핵심 특성**: mask 안쪽은 같은 흰색이라 *내부 경계 없음*. 캐릭터 옷 사이, 머리카락 안쪽, 겹친 파츠 — 모두 노이즈 0. Inverted hull 의 "안쪽에도 outline" 과 depth-edge 의 "내부 discontinuity 잡힘" 둘 다 회피.

## 합쳐진 파이프라인

```
[메인 카메라]
   캐릭터 N명 정상 렌더
   
[부캐 카메라 (layer = MASK_LAYER)]
   selected 캐릭터만 흰색 단색으로 offscreen texture 에 그림
   
[Post-process]
   offscreen texture 의 흰↔검 경계 픽셀을 outline 색으로 찍음
   
[Composite]
   메인 화면 위에 outline 덧그림
   
[최종]
   ✓ silhouette 외곽선만, 안쪽 노이즈 없음
```

## 멀티-상태 확장

mask 에 흰색 대신 *상태별 ID* 쓰면 한 번에 분기. 카메라 수 안 늘림.

- selected → mask color/id = 1
- hovered → 2
- target → 3

PP 가 픽셀 ID 보고 색 / 두께 / 우선순위 분기.

## 다른 방식이 진 이유

| 방식 | 왜 졌나 |
|---|---|
| **Inverted hull** | 메쉬 복제 + back-face 그려서 *안쪽 내부 경계도 outline 됨* (옷 사이, 머리카락 안쪽). silhouette-only 가 아님. |
| **Depth-edge PP** | depth discontinuity 잡으면 *내부 파츠 경계* 도 다시 노이즈로 부활. silhouette-only 가 아님. |
| **Stencil + PP** | Bevy 의 stock 3D pipeline 은 per-object stencil ref workflow 가 product 화 안 됨 (Unreal 만큼). custom pipeline / specialization / render graph 개입 필요. RenderLayers + mask 가 ECS 모델에 더 잘 맞고 디버깅 쉬움. Stencil 의 우위 (한 패스 안 다중 분기) 는 멀티 상태 1-3개 수준에선 발휘 안 됨. |
| **JFA** | 두꺼운 / 둥근 / glow outline 필요 시 정답. 단 처음부터 직접 짜면 ping-pong texture + log2(width) pass + 디버깅 비용 큼. 1차 outline 으로는 over-engineering. |

## Escalation path

1. **MVP**: binary mask + boundary dilation. VRM + PMX clothing overlap 으로 silhouette-only 검증.
2. **상태 분기**: ID mask 로 selected / hovered / target 색 / 두께 / 우선순위 분기.
3. **품질 개선**: JFA 로 일정 픽셀 두께, 둥근 stroke, 부드러운 외곽.
4. **성능 최적화**: half-res mask + 적절한 upscale, scissor / partial mask, selected bounds 기반 영역 축소.
5. **최후**: stencil / custom pipeline. 외부 컨벤션 강제 또는 mask pass 비용 병목 시.

> [!tip] 가장 중요한 배운 것 — silhouette-only 면 geometry expansion 계열 (inverted hull) 이나 depth-edge 가 아니라 *screen-space mask* 계열로 가야 함
> 안쪽 노이즈를 0 으로 만드는 유일한 길은 "selected 영역 자체를 binary/id mask 로 단색 표현 → 경계만 stroke". Bevy 0.18 에서 그 mask 만드는 가장 자연스러운 필터가 `RenderLayers`.

> [!abstract] Rule
> Bevy 에서 selection visualization 용 outline 은 *RenderLayers + mask boundary* 가 default. inverted hull / stencil 은 mask 방식이 안 통할 때만 escalate. #rule

> [!warning] RenderLayers 는 자동 상속 안 됨
> VRM / PMX 처럼 mesh entity 가 root 아래 깊이 spawn 되는 구조에선 부모에만 RenderLayers 붙이면 자식들이 뺀다. 모든 `Mesh3d` 까지 propagate 하는 system 필요. **교훈:** "component 붙이면 자식도 따라온다" 는 가정은 ECS 에서 체크 필수.

## 참고

- Bevy 0.18 release notes
- `RenderLayers` API docs
- Bevy custom post-processing example (공식)
- `bevy_mod_outline 0.12.0` — Bevy 0.18 지원, JFA experimental mode 보유 (PoC reference)

### 사이드 노트

- 자매 Unreal 프로젝트의 stencil ref 컨벤션 (20-24 selection states) 은 엔진 자체가 다르니 코드 호환 0. 컨벤션 공유 의미가 약함 — Bevy 측은 mask color/id 로 자체 컨벤션 도입이 자연스러움.
- 본 선택은 outline 와 무관 — bone gizmo (sphere + axis) 로 별도 처리. character outline 시스템과 직교.
