---
title: "JFA — Jump Flood Algorithm"
tags:
  - type/learning
  - project/shotloom
  - area/rendering
  - area/algorithm
date: 2026-05-06
source: claude-code
---

# JFA — Jump Flood Algorithm

각 픽셀이 *가장 가까운 mask 픽셀까지의 거리*를 GPU 에서 `log₂(width)` 패스로 계산하는 알고리즘. Rong & Tan 2006 발표 (보로노이 다이어그램 GPU 화). screen-space outline / distance field text / soft shadow / pathfinding heuristic 등 광범위하게 쓰임.

## 직관

mask texture 에 흰 점 몇 개:

```
. . . . . . . . . .
. . . W . . . . . .
. . . . . . . . . .
. . . . . . . W . .
. . . . . . . . . .
```

**목표**: 각 검은 픽셀이 *가장 가까운 흰 픽셀의 좌표*를 알게 만들기.

순진한 방법: 각 픽셀이 모든 흰 픽셀 검사 → O(N²). 1080p 면 2백만² 연산 → 절망.

JFA: **`log₂(width)` 패스만**. 1080p 면 11 패스.

## 동작

각 패스에서 픽셀이 *간격 `k` 떨어진 8 이웃* 을 살펴봄. `k` 는 매 패스 절반:

```
Pass 1: k = width/2   (예: 540)
Pass 2: k = 270
Pass 3: k = 135
...
Pass 11: k = 1
```

각 픽셀이 자기 + 8 이웃 9개가 보유한 "가장 가까운 mask 좌표 후보" 중 *실제로 가장 가까운 것* 만 채택.

비유: 첫 패스는 *대륙급* 으로 멀리 봐서 "어느 대륙 쪽인가" 확정 → 다음 패스는 *국가급* → *도시급* → 마지막 패스는 *옆 픽셀급*. 매번 정밀도 두 배.

```
초기 mask:              Pass 1 (k=대륙):           Pass 11 (k=1):
. . . . . W . . . .    각 픽셀이 "대륙 어디"      각 픽셀이 "정확한
. . . . . . . . . .      만 확정                    가장 가까운 mask 픽셀"
. . . . . . . . . .                                 좌표 보유
. . . . . . . . . .
```

최종 결과: 각 픽셀이 **가장 가까운 mask 픽셀 좌표 (u, v)** 보유. 거리 = 자기 좌표와의 유클리드 차이.

## Pseudocode

```glsl
// JFA pass — 한 패스씩 호출, k 값만 외부에서 변경
uniform int k;            // 현재 jump 거리
uniform sampler2D src;    // 이전 패스 결과 (RG = 가장 가까운 mask 좌표)
out vec2 nearest;         // 이번 픽셀의 가장 가까운 mask 좌표

void main() {
    vec2 self = gl_FragCoord.xy;
    vec2 best = texture(src, self / resolution).rg;
    float best_d2 = dot(self - best, self - best);

    for (int dy = -1; dy <= 1; dy++) {
        for (int dx = -1; dx <= 1; dx++) {
            if (dx == 0 && dy == 0) continue;
            vec2 sample_pos = self + vec2(dx, dy) * k;
            vec2 candidate = texture(src, sample_pos / resolution).rg;
            float d2 = dot(self - candidate, self - candidate);
            if (d2 < best_d2) {
                best = candidate;
                best_d2 = d2;
            }
        }
    }
    nearest = best;
}
```

## Outline 에 활용

```
mask 에 selected 캐릭터 silhouette 있음
   ↓ JFA log₂(width) pass
각 픽셀이 mask edge 까지의 거리 d 보유
   ↓ outline shader
if d == 0:                 캐릭터 안쪽 → 안 그림 (메인 렌더가 이미)
elif d < thickness:        outline 영역
    color = outline_color
    alpha = 1 - d/thickness    // fade out
else:                      outline 밖
    discard
```

장점:

- **두께 control 무료** — thickness uniform 한 줄로 조정
- **두께 무관 비용 일정** — 항상 log 패스
- **gradient / glow / fade 가능** — 거리 정보 그대로 사용
- **둥근 모서리 자연스러움** — distance field 라 stair-step 없음

## 두께 mode — 카메라 거리에 어떻게 반응할까

JFA 결과 `d` 는 *screen 픽셀 단위 거리*. composite shader 에서 mode 분기 한 줄.

### Mode 0 — 카메라 거리 무관 (고정 픽셀 두께, 기본)

```glsl
uniform float thickness_px;
if (d < thickness_px) → outline
```

가까이든 멀리든 화면상 항상 같은 px. UE / Unity 의 selection outline 표준. 시인성 일정.

### Mode 1 — 카메라 거리 비례 (월드 단위 두께)

```glsl
uniform float thickness_world;
float view_depth = linearize(texture(depth_tex, uv).r);
float pixels_per_world_unit = projection_scale_y / view_depth;
float thickness_px = thickness_world * pixels_per_world_unit;
if (d < thickness_px) → outline
```

physical 한 두께. NPR / 셀 셰이딩 outline 이 보통 이 방식. 가까울수록 굵어짐, 멀어질수록 얇아짐.

### Mode 2 — Hybrid (clamp)

```glsl
float thickness_px = clamp(thickness_world * pixels_per_world_unit, min_px, max_px);
```

가까워서 화면 덮는 것 방지 (max), 멀어서 안 보이는 것 방지 (min). 가장 실용적.

### Mode 3 — 비선형 (sqrt / power)

```glsl
// 멀어져도 너무 빨리 안 줄어듦 — 가독성
float thickness_px = thickness_base * sqrt(reference_depth / view_depth);

// 또는 가까울 때만 굵어지고 중간 거리부터 평탄
float t = clamp(reference_depth / view_depth, 0.0, 1.0);
float thickness_px = mix(min_px, max_px, pow(t, 2.0));
```

### Mode 변경 비용

JFA 패스 자체는 *모드 무관* — 동일하게 distance field 만 만든다. 두께 mode 결정은 *마지막 composite shader* 안 분기:

```glsl
uniform int thickness_mode;  // 0 fixed, 1 world, 2 hybrid, 3 nonlinear
uniform float param_a, param_b;

float thickness_px;
if (thickness_mode == 0)      thickness_px = param_a;
else if (thickness_mode == 1) thickness_px = param_a * pixels_per_world_unit;
else if (thickness_mode == 2) thickness_px = clamp(param_a * pixels_per_world_unit, param_b, param_b * 4.0);
else                          thickness_px = param_a * sqrt(param_b / view_depth);
```

→ runtime 에 mode toggle 무료. JFA 다시 안 돌려도 됨. mask ID 별 mode 다른 정책도 가능 (selected = fixed, hovered = world unit 등).

### 원근감 강조 응용

거리 fade + 두께 변화 결합:

```glsl
float depth_factor = clamp(reference_depth / view_depth, 0.0, 1.0);
float thickness_px = mix(1.0, 5.0, depth_factor);
float alpha       = mix(0.3, 1.0, depth_factor);
```

가까우면 진하고 굵음, 멀면 얇고 흐림. 시네마 카메라 깊이감 표현 가능.

## 비용 분석

- Ping-pong texture 2개 (서로 읽기 / 쓰기 번갈아)
- `log₂(width)` 회 fullscreen pass
- 각 pass 에서 픽셀당 9 sample (자기 + 8 이웃)

1080p 면 11 × 9 = ~100 samples per pixel. half-res 면 ~50. 모던 GPU 에선 보통 1 ms 이하.

**완화 기법**:

- Half-res / quarter-res mask + bilinear upscale → pass 수 절반-쿼터
- Selected entity bounds 기반 partial mask → screen 일부만 처리
- Mip-mapping 활용 — 일부 변형이 mip pyramid 로 동등 효과

## 렌더 파이프라인 어디에 들어가나 (Bevy 0.18)

Bevy 의 render graph 는 카메라마다 서브그래프를 가짐. 메인 카메라의 표준 3D 서브그래프 순서:

```
camera 시작
  ↓
prepass  (depth-only / normal-only — optional)
  ↓
main 3D pass
  - opaque
  - alpha-mask
  - transparent
  ↓
tonemapping
  ↓
post-processing (custom 노드 삽입 위치)
  ↓
upscaling (만약 dynamic resolution)
  ↓
output (swap chain 또는 render target)
```

JFA outline system 은 **세 단계의 노드**로 분해되어 graph 에 삽입됨:

```
[메인 카메라 서브그래프]
    ┌────────────────────────┐
    │  prepass               │
    │  main 3D pass          │
    │  tonemapping           │
    │                        │   ┌─────────────────────────────┐
    │  outline composite ◄───┼───┤  jfa pass (n 회)            │◄──┐
    │                        │   │  (별도 render-graph 노드)   │   │
    │  upscaling             │   └─────────────────────────────┘   │
    │  output                │                                      │
    └────────────────────────┘                                      │
                                                                    │
[부캐 카메라 서브그래프]                                            │
    ┌────────────────────────┐                                      │
    │  mask pass             │                                      │
    │  (RenderLayers 필터,   ├──────────────────────────────────────┘
    │   selected 만 단색 또는│  mask texture 전달
    │   ID color 로 그림)    │
    └────────────────────────┘
```

### 단계별 위치

| 단계 | 그래프 위치 | 역할 |
|---|---|---|
| **(1) Mask pass** | 부캐 카메라 서브그래프. 메인 카메라보다 앞 또는 병렬 | RenderLayers 로 selected entity 만 필터, offscreen render target 에 단색/ID 로 그림 |
| **(2) JFA passes** | 메인 카메라 서브그래프 *바깥*, mask pass 후 / outline composite 전. 별도 노드 묶음 | mask 입력 → distance field 출력. log₂(width) 회 ping-pong |
| **(3) Outline composite** | 메인 카메라 서브그래프, **tonemapping 직후 / upscaling 직전** 권장 | scene color + mask + distance field 읽고 outline 합성 후 main color 텍스처에 다시 씀 |

### 왜 tonemapping 직후인가

- **tonemapping 전에 합성**: outline 색이 tonemap 영향 받음. HDR 색 그라데이션 의도 시 자연스러운 통합. 단 outline 색이 의도한 LDR 색과 약간 달라질 수 있음.
- **tonemapping 후에 합성** (권장): outline 이 LDR 공간에서 정확한 색. UI / 디버그 visual 처럼 *시각 강조* 가 의도면 이쪽이 깔끔.
- shotloom 같은 *editor / 시네마 viewer* 는 후자 권장 — selected outline 은 디자인 컬러 그대로 보여야 함.

### Bevy API 측면

```rust
// 1) Mask 카메라 spawn — 메인 카메라와 동일 transform/projection 추적, 별도 layer
commands.spawn(Camera3d {
    target: RenderTarget::Image(mask_texture.clone()),
    render_layers: RenderLayers::layer(SELECTION_MASK_LAYER),
    // order: -1 → 메인 카메라보다 먼저 실행
    order: -1,
    ...
});

// 2) JFA 노드 — 별도 sub-graph 또는 메인 그래프의 노드들로 추가
render_graph.add_node(node::JFA_PASSES, JfaNode::new(11)); // 11 회
render_graph.add_node_edge(node::MASK_PASS, node::JFA_PASSES);

// 3) Composite 노드 — 메인 카메라의 PP 단계로 삽입
core_3d_subgraph.add_node(node::OUTLINE_COMPOSITE, OutlineCompositeNode);
core_3d_subgraph.add_node_edge(core_3d::TONEMAPPING, node::OUTLINE_COMPOSITE);
core_3d_subgraph.add_node_edge(node::OUTLINE_COMPOSITE, core_3d::UPSCALING);
core_3d_subgraph.add_node_edge(node::JFA_PASSES, node::OUTLINE_COMPOSITE);
```

(Bevy 0.18 의 새 `FullscreenMaterial` API 가 이 fullscreen PP 노드 작성을 더 짧게 만들어줌.)

### Forward / Deferred 의존성

- JFA 노드와 outline composite 는 **메인 파이프라인 종류 무관**. forward / deferred 어느 쪽이든 *최종 color 텍스처와 mask texture 만 있으면* 작동
- mask pass 도 forward / deferred 무관 — 단순 mesh 그리기, 단색 출력
- 메인 파이프라인이 deferred 로 바뀌어도 outline 코드 0줄 변경

### 멀티 카메라 / split-screen

각 카메라가 자기 mask + JFA + composite 의 사본을 가짐. 카메라마다 selected entity 가 다를 수 있음 (예: viewport 와 inspector preview). 단 비용은 카메라 수 × JFA 비용 → split-screen 에서 부담 크면 mask + JFA 공유 후 composite 만 카메라별 분리하는 최적화 가능.

## 어디서 쓰이나

- **Outline** — Unity Quick Outline, Unreal Niagara outline material, Bevy `bevy_mod_outline` `OutlineMode::FloodFlat`
- **Distance field text** — TextMesh Pro / SDF font 의 SDF 텍스처 사전 계산
- **보로노이 / 셀룰러 패턴**
- **Soft shadow approximation** (mask edge → soft penumbra)
- **AI pathfinding heuristic** — 정적 장애물에 대한 distance map
- **지형 erosion 시뮬레이션**

## 다른 distance field 방식과 비교

| 방식 | 정확도 | 비용 | runtime | 용도 |
|---|---|---|---|---|
| **Brute force (모든 점 비교)** | 정확 | O(N²) | 못 씀 | 이론용 |
| **JFA** | 거의 정확 (작은 오차 가능) | O(N log N) | 실시간 가능 | outline / SDF / soft shadow |
| **JFA+1** | 정확 | JFA + 추가 1 pass | 거의 같음 | 정밀 SDF |
| **CPU sweep** (e.g. Felzenszwalb) | 정확 | O(N) | 정적 데이터에 적합 | offline SDF baking |

대부분 outline / soft mask 용도엔 vanilla JFA 면 충분. SDF 텍스트처럼 정확도 critical 하면 JFA+1.

> [!tip] JFA 의 본질은 "절반씩 좁혀가는 정밀화"
> 매 pass 가 정밀도 2배 → 합쳐서 log 회 패스로 끝. 단순한 reduce 패턴이지만 GPU 의 fullscreen pass 친화적이라 빠름. 이 패턴은 다른 문제 (거리 변환, 보로노이, dilation) 에 일반화 가능.

> [!abstract] Rule
> 두께 / fade / glow / 둥근 모서리가 한 번이라도 필요한 outline 작업이면 처음부터 JFA 가 결국 빠르다. 단순 dilation 으로 시작했다 디자인 변경 들어오면 재구현 비용이 더 큼. #rule

> [!warning] Mask 정밀도 = JFA 정밀도
> JFA 는 입력 mask 의 anti-alias / sub-pixel 정확도 이상으로 좋아질 수 없음. mask 가 jagged 면 outline 도 jagged. mask pass 에서 MSAA 또는 alpha-cutout 정책을 먼저 정해야 함. **교훈:** 분리된 패스의 품질이 다음 패스의 상한.

## 참고

- Rong & Tan 2006 — "Jump Flooding in GPU with Applications to Voronoi Diagram and Distance Transform"
- Bevy `bevy_mod_outline 0.12.0` — `OutlineMode::FloodFlat` (experimental)
- Unity Quick Outline 류 패키지
- TextMesh Pro SDF 폰트 — JFA 로 사전 계산된 distance field

### 사이드 노트

- shotloom 의 selected 캐릭터 outline 작업에서 두께 / 색 / fade 디자인 자유도 검토 중 등장. binary mask + boundary detection 으로는 두께 1-2px / 단색만 가능, 디자인 의도가 그 이상이면 JFA 부터 시작이 결국 빠름.
- `log₂(width)` 라 1080p ↔ 4K 패스 수 차이 크지 않음 (11 vs 12). 해상도 sensitive 하지 않은 게 장점.
