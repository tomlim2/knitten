---
title: "Selection highlight system — outline + inside fill 통합 설계"
tags:
  - type/learning
  - project/shotloom
  - area/rendering
  - lib/bevy
date: 2026-05-06
source: claude-code
---

# Selection highlight system — outline + inside fill 통합 설계

> [!info] 2026-05-06 업데이트
> 디자인 의도 확정 결과 *glow 효과* 는 제외. 이 노트는 *outline + fill 의 distance-field 기반 통합 설계* 를 다룸. glow 관련 절은 *향후 필요 시 추가 가능한 reference* 로 보존 (현재 scope 외).

JFA 기반 outline 파이프라인 (RenderLayers + offscreen mask + JFA distance field + composite) 위에서 **outline / inside fill / glow** 를 한 system 으로 묶는 설계. 첫 PR 은 outline 만 land 하더라도 *처음부터 확장성 염두* 에 두면 추후 디자인 변경 시 plumbing 재작업 0.

## 핵심 아이디어

JFA 가 만든 *distance field* 는 한 픽셀의 "가장 가까운 mask edge 까지 거리" 를 담음. 원본 *mask texture* 와 함께 composite shader 로 보내면, 한 shader 안에서:

- **inside fill** (mask=1 영역) — uniform tint 또는 edge 에서 진하고 안쪽 fade
- **outline band** (mask=0 + d < outline_thickness) — 외곽선
- **glow band** (mask=0 + outline_thickness < d < glow_radius) — 바깥 fade

세 효과 모두 distance + mask 두 텍스처 만으로 분기 가능. **JFA pass 수 / mask 패스 변함 없음** — 추가 비용은 composite shader 분기 (~0.1 ms).

## 영역 분류 도식

```
거리 0  ───────  outline_thickness  ──────  glow_radius
       │                          │
   안쪽 픽셀 (mask>0)              │              바깥쪽 픽셀 (mask=0)
       │                          │
   ┌───┴────────┐  ┌────────┐  ┌──┴─────┐
   │ 인너 fill  │  │ outline │  │  glow  │
   │ + 인워드   │  │  band   │  │  band  │
   │ gradient   │  │         │  │ (fade) │
   └────────────┘  └─────────┘  └────────┘
```

## Composite shader 골격

```glsl
sampler2D mask;            // 0 외부, >0 selected (또는 ID 색)
sampler2D distance_field;  // 가장 가까운 edge 거리 (px)
sampler2D scene_color;

struct HighlightStyle {
    bool  fill_enabled;
    vec3  fill_color;
    float fill_alpha;
    float fill_inward_falloff;   // 0 uniform, >0 edge 진하고 중심 fade

    bool  outline_enabled;
    vec3  outline_color;
    float outline_thickness_px;

    bool  glow_enabled;
    vec3  glow_color;
    float glow_radius_px;
    float glow_intensity;
};

void main() {
    vec3 base = texture(scene_color, uv).rgb;
    float mask_v = texture(mask, uv).r;
    float d = texture(distance_field, uv).r;

    bool inside = mask_v > 0.0;
    int state_id = decode_state_id(mask_v);   // 0=none, 1=selected, 2=hovered, 3=target
    HighlightStyle s = STYLES[state_id];

    vec3 color = base;

    // 1. Inside fill
    if (inside && s.fill_enabled) {
        float falloff = (s.fill_inward_falloff > 0.0)
            ? exp(-d * s.fill_inward_falloff)
            : 1.0;
        color = mix(color, s.fill_color, s.fill_alpha * falloff);
    }

    // 2. Outline band
    if (!inside && s.outline_enabled && d < s.outline_thickness_px) {
        float t = d / s.outline_thickness_px;
        color = mix(s.outline_color, color, smoothstep(0.7, 1.0, t));
    }

    // 3. Glow band
    if (!inside && s.glow_enabled
        && d > s.outline_thickness_px
        && d < s.glow_radius_px) {
        float t = (d - s.outline_thickness_px) / (s.glow_radius_px - s.outline_thickness_px);
        color = mix(color, s.glow_color, (1.0 - t) * s.glow_intensity);
    }

    out_color = vec4(color, 1.0);
}
```

## API 설계 (Bevy 측)

```rust
#[derive(Component, Clone)]
pub struct SelectionHighlight {
    pub fill: Option<FillSpec>,
    pub outline: Option<OutlineSpec>,
    pub glow: Option<GlowSpec>,
}

pub struct FillSpec {
    pub color: Color,
    pub alpha: f32,
    pub inward_falloff: f32,    // 0 = uniform tint
}

pub struct OutlineSpec {
    pub color: Color,
    pub thickness: ThicknessMode,
}

pub enum ThicknessMode {
    FixedPixels(f32),
    WorldUnit(f32),
    Clamped { world: f32, min_px: f32, max_px: f32 },
}

pub struct GlowSpec {
    pub color: Color,
    pub radius: f32,
    pub intensity: f32,
}
```

→ entity 에 `SelectionHighlight { fill: Some(...), outline: Some(...), glow: None }` 같이 붙임. state component (`Selected` / `Hovered` / `Target`) 가 어느 spec 셋이 적용될지 결정.

## 멀티 상태 분기

mask 에 *상태별 ID* 박음:

| 상태 | mask ID | 일반적 highlight prefab |
|---|---|---|
| Selected | 1 | outline (white, 3px) + 약한 fill (white, alpha 0.05) |
| Hovered | 2 | outline (yellow, 2px) only |
| Target | 3 | outline (red, 4px) + fill (red, alpha 0.15) + glow (red, radius 8px) |
| Deselected | 0 | (no highlight) |

composite shader 가 mask ID 보고 STYLES[id] 에서 spec 가져옴. 카메라 수 안 늘림.

## 비용

| 항목 | 비용 |
|---|---|
| JFA pass | 동일 (log₂(width)) |
| Mask pass | 동일 (binary 또는 ID color) |
| Composite shader | ~0.1 ms 추가 (분기 3개 + mix 3회) |
| 추가 GPU 메모리 | STYLES storage buffer (4-16 styles × ~64 bytes) |

→ outline 만 vs 모든 효과 켠 경우 비용 차이 무시 가능.

## 단계적 도입 (escalation)

1. **MVP**: outline 만 (mask + JFA + composite). fill / glow 는 enum stub
2. **+ inside fill**: composite shader 분기 추가. ID mask 와 함께
3. **+ glow band**: glow 분기 추가
4. **+ inward falloff**: distance 기반 안쪽 fade
5. **+ through-wall option**: depth test on/off toggle

각 단계가 *기존 파이프라인 변경 없이 composite shader 한 줄 추가*. JFA / mask / RenderLayers 까지 갖추면 그 위에 시각 표현은 자유.

## Through-wall 처리

캐릭터가 다른 mesh 에 가려졌을 때:

- **fill 만**: depth test 로 자연스럽게 잘림 (가려진 부분 안 그림)
- **outline / glow**: through-wall 표현 원하면 main depth vs selected depth 비교 끔 — composite 가 occluded 영역에도 그림. 디자인 의도에 따라 toggle

이것도 composite shader 한 줄 분기.

> [!tip] JFA distance field + 원본 mask 두 장이면 거의 모든 selection visual 효과 가능
> outline / fill / glow / inward fade / pulse / through-wall 모두 같은 두 텍스처에서 derive. 새 효과 추가 비용 = composite shader 분기 한 두 줄. 처음부터 이런 확장성 두고 설계하면 디자인 자유도 최대.

> [!abstract] Rule
> Selection visual feedback 시스템은 *outline 으로 좁히지 말고* "selection highlight" 같은 우산 이름으로 시작 — outline / fill / glow / pulse 모두 같은 distance field + mask 위에서 derive 가능하므로. #rule

> [!warning] mask 가 binary 면 멀티 상태 못 함
> 첫 PR 에서 mask 를 단일 채널 binary 로 짜면 hovered / target 추가 시 mask 패스 다시 짜야 함. 처음부터 *single-channel ID color* (R 에 1 / 2 / 3 등) 로 하면 멀티 상태 무료. **교훈:** "지금은 selected 하나만 필요" 라도 데이터 형식은 확장 가능하게.

## 참고

- Bevy 0.18 RenderLayers
- Bevy custom post-processing example
- `bevy_mod_outline 0.12.0` — JFA mode 가 reference 가치 있음
- Unity URP Renderer Feature 의 outline / overlay 패턴

### 사이드 노트

- shotloom 의 selection 상태 component (`Selected`, `Hovered`, `Target`) 와 mask ID 를 1:1 매핑하면 ECS 변경 시 shader 수정 0.
- `inward_falloff` 가 fill 강도를 *edge 진하고 중심 fade* 시키는 효과 — Unity Editor 의 selection prop 하이라이트가 이 패턴.
- art outline (MToon material 자체의 NPR outline) 과 system highlight 는 *완전 직교* — 동시에 켜져도 공간이 다름 (art outline 은 메쉬 자체 일부, system highlight 은 PP composite). 명명도 분리 권장.
