---
title: "다음 세션: Finger retarget 개선 — splay, magnitude, Intermediate direction"
tags: [bevy-vrm, retarget, finger, todo]
created: 2026-04-07
updated: 2026-04-07
---

# 다음 세션: Finger Retarget 개선

## 현재 상태 (2026-04-07 완료)

- **Backward curl: 0/0 해결** ✅ (muscle-space scalar curl)
- Magnitude: 60-90% (curl axis projection 손실)
- Right Proximal direction: 8-23° rest, 17-41° peak
- Right Intermediate direction: 33-62° peak (FK 누적)
- Left static Ring/Little Intermediate: 47-62° (finger_bind_pose 한계)
- Splay: 미구현 (curl only)

## 해결된 것

1. Backward curl — muscle-space curl (scalar angle 추출 + VRM axis 적용)
2. Thumb — hand radial axis (index→pinky) 사용, Proximal rest 0.1°
3. DOF constraints — non-thumb X-twist 제거, thumb은 제외

## 남은 과제 우선순위

### 1. Splay 추가 (Proximal MCP)
현재 curl만 전달. MCP 관절은 splay(벌어짐)도 필요.
- FBX splay axis = bone_dir × curl_axis
- VRM splay axis = 같은 공식
- splay angle 추출 + curl과 합성

### 2. Magnitude 개선 (60-90% → 목표 90%+)
FBX curl axis와 VRM curl axis 차이(palm normal 6.5° 오차)로 projection 손실.
- FBX curl axis를 더 정확하게 계산 (position 기반 대신 FBX bone orientation 직접 사용?)
- 또는 axis 보정 계수 적용

### 3. Intermediate direction (33-62°)
Proximal의 direction error가 FK로 누적.
- Proximal direction 자체를 줄여야 (현재 17-41° peak)
- 또는 Intermediate에서도 world-space 보정

### 4. Left static Ring/Little Intermediate (47-62°)
finger_bind_pose가 이 bone들을 제대로 잡지 못함.
- finger_bind_pose correction 공식 검토
- 또는 muscle-space를 static에도 적용 (FBX bind pose curl 추출)

### 5. Thumb Metacarpal (18°)
Rebasis 결과 유지 중. Muscle-space 적용 시 29°로 악화.
- Thumb-specific metacarpal correction 필요
- 또는 현재 18° 수용

## CLI 검증

```bash
cd ~/Desktop/www/bevy-vrm/crates/cinev_retarget
cargo run --bin finger-diag -- \
  ../../assets/models/vroid_1x_m_c_normal.vrm \
  ../../assets/fbx/t2m_m_wave.fbx \
  ../../assets/retarget/cinev_blender_male.json
```

## 관련 파일

- `crates/cinev_retarget/src/retargeter.rs` — three-vrm + rebasis + DOF
- `crates/cinev_retarget/src/ik/mod.rs` — muscle-space curl, thumb radial, finger_bind_pose
- `crates/cinev_retarget/src/bin/finger_diag.rs` — backward detection + direction + magnitude
- `crates/cinev_retarget/src/bin/palm_check.rs` — palm normal survey
