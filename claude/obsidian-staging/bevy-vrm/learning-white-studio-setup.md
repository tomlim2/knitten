---
title: "White studio setup in Bevy — tonemapping is the enemy"
tags: [bevy-vrm, rendering, gotcha, rule]
created: 2026-04-06
---

# White Studio Setup in Bevy

## Problem

White background + white floor + directional shadow를 구현하려 했으나 바닥이 항상 회색. illuminance를 200000까지 올려도 순백 안 됨.

## Root Cause

**두 가지 원인:**

1. **PBR diffuse ÷π** — StandardMaterial의 Lambert diffuse는 `base_color × light × NdotL / π`로 계산. 에너지 보존 때문에 입사광의 ~31.8%만 반사. 아무리 밝아도 순백 안 됨.

2. **Tonemapping** — Bevy 기본 tone mapper (Reinhard 등)가 HDR→SDR 변환 시 밝은 영역을 압축. illuminance를 올릴수록 tone mapper가 더 세게 눌러서 효과 상쇄.

## Solution

```rust
// Camera에 tonemapping 끄기
commands.spawn((
    Camera3d::default(),
    bevy::core_pipeline::tonemapping::Tonemapping::None,
    // ...
));

// DirectionalLight — 적당한 illuminance (20000)
DirectionalLight {
    illuminance: 20000.0,
    shadows_enabled: true,
    ..default()
}

// 바닥 — 일반 white StandardMaterial
StandardMaterial {
    base_color: Color::WHITE,
    perceptual_roughness: 1.0,
    reflectance: 0.0,
    ..default()
}
```

**결과:** 바닥 순백 + 그림자 선명 + 캐릭터 밝기 자연스러움.

> [!abstract] Rule
> Bevy에서 흰색 스튜디오 배경을 원하면 `Tonemapping::None` 필수. Tone mapper가 켜져있으면 illuminance를 아무리 올려도 PBR 파이프라인이 흰색을 눌러버림. #rule
