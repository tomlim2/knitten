---
project: bevy-vrm
topic: thumb-bind-pose
started: 2026-04-03
baseline-commit: 58baf72
---

# Experiments: bevy-vrm / thumb bind pose curl

## Goal

4 curl fingers (index~little)의 bind pose correction은 동작함.
Thumb만 방향이 틀림 — 안쪽(palm 쪽)으로 꺾여야 하는데 바깥으로 나감.
`from_rotation_arc(vrm_local_dir, fbx_local)` 이 thumb에서 올바른 curl 방향을 못 잡는 원인 찾기.

## Problem Report

### 현상
- **4 curl fingers**: bind pose curl 정상 ✅ (FBX standing bind pose와 일치)
- **Thumb**: bind pose correction이 바깥으로 꺾임 ❌
- `conjugate()` 시도 → 역시 틀림 (다른 방향으로 잘못됨)

### 원인 후보
1. **Thumb 축이 ~90° 다름** — 다른 finger는 palm plane에서 curl, thumb은 palm에 수직인 축으로도 회전
2. **from_rotation_arc shortest arc** — vrm→fbx 최단 호가 thumb curl 방향과 안 맞을 수 있음
3. **VRM rest_translation 방향** — thumb metacarpal의 rest_translation이 다른 finger와 다른 방향
4. **parent_world 누적 오차** — hand→thumbMetacarpal에서 parent_world가 부정확

### 현재 코드 (ik/mod.rs ~line 448-464)
```rust
let corr = Quat::from_rotation_arc(vrm_local_dir, fbx_local);
if finger == "Thumb" {
    // Skip — update parent_world and continue
}
```

## Baseline

| Metric | Value |
|--------|-------|
| 4 finger bind pose | ✅ working |
| Thumb bind pose | ❌ skipped (wrong direction) |
| ThumbMetacarpal correction | 41.2° (was applied, direction wrong) |
| ThumbProximal correction | 23.8° (was applied, direction wrong) |

---

## EXP-001: Thumb direction vectors 분석

- **Status**: `planned`
- **Hypothesis**: Thumb의 vrm_local_dir과 fbx_local 벡터를 직접 출력해서 어떤 방향인지 확인. 4 finger와 비교하여 thumb만 다른 패턴 찾기.
- **Method**: thumb correction 계산 시 vrm_local_dir, fbx_local, corr axis/angle 로그 출력
- **Fail threshold**: 벡터가 합리적으로 보이면 → 문제는 rotation_arc가 아닌 다른 곳

### Params
| What | Action |
|------|--------|
| ik/mod.rs thumb skip 전 | vrm_local_dir, fbx_local, corr axis+angle 출력 |

### Metrics

| Bone | vrm_local | fbx_local | corr_axis | corr_angle |
|------|-----------|-----------|-----------|------------|
| leftThumbMetacarpal | (1.000, 0.016, -0.001) | (0.759, -0.360, 0.543) | (0.012, -0.826, -0.564) | 41.2° |
| leftThumbProximal | (1.000, 0.015, -0.001) | (0.925, -0.020, 0.379) | (0.015, -0.996, -0.090) | 22.4° |
| leftMiddleIntermediate (비교용) | (1.000, 0.000, 0.000) | (0.860, -0.490, -0.142) | (0.000, 0.279, -0.960) | 30.7° |

### Conclusion
- 일반 finger: curl axis ≈ -Z (단일 축, 아래로 구부러짐)
- Thumb: corr axis ≈ (0, -0.83, -0.56) — multi-axis, Y성분이 커서 바깥으로 꺾임
- Thumb fbx_local Z=0.54 → palm 쪽으로 들어와야 하는데 from_rotation_arc shortest arc가 Y성분을 과하게 포함
- **핵심: thumb correction의 rotation axis를 palm normal (또는 -Z) 로 제한해야 함**

---

## EXP-002: Thumb에 다른 curl axis 사용

- **Status**: `planned`
- **Hypothesis**: Thumb curl axis를 palm normal (hand cross product) 기준으로 계산하면 올바른 방향
- **Method**: thumb correction 시 from_rotation_arc 대신, palm normal 축 기준으로 signed angle 계산 후 적용
- **Fail threshold**: palm normal 기반도 방향 틀림 → 근본적으로 다른 접근 필요

---

## CLI 명령어

```bash
# Viewer (F키로 standing FBX 로드)
cargo run --bin bevy-vrm

# Headless (finger diagnostics)
cargo run --manifest-path crates/cinev_retarget/Cargo.toml --bin headless -- \
  assets/models/vroid_1x_f_xiao.vrm \
  assets/fbx/bind-pose/female_standing.fbx \
  assets/retarget/cinev_blender_female.json
```

## 코드 위치

| 파일 | 위치 | 내용 |
|------|------|------|
| `ik/mod.rs:~340` | `apply_finger_bind_pose()` | finger bind pose 전체 |
| `ik/mod.rs:~448` | thumb skip | 현재 thumb 건너뜀 |
| `ik/mod.rs:~345` | `finger_defs` | thumb=3seg, others=4seg 정의 |
