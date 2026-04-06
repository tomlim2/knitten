---
title: "다음 세션: Finger twist 근본 해결"
tags: [bevy-vrm, retarget, finger, todo]
created: 2026-04-06
---

# 다음 세션: Finger Twist 근본 해결

## 현재 상태 (2026-04-06 기준)

- 여자 VRM (xiao) + female_standing: 손가락 자연스러움 ✅
- 남자 VRM (c_normal) + male_standing: **손가락 뒤로 꺾임** ❌ (특히 오른손)
- Thumb: 한 평면은 OK, 다른 평면에서 방향 틀림 (twist 문제)

## 근본 원인

**Rotation의 3번째 자유도 (twist) 미제어.**

- `rotation_arc` / retargeter three-quat → 방향(swing 2 DOF) 맞춤
- twist(bone axis roll) → 제어 안 함, shortest path에 맡김
- 모델마다 rest orientation 다름 → 같은 formula가 다른 twist 생성
- xiao에서 잘 된 건 우연히 twist가 맞았을 뿐

## 해결 방향

1. **Swing-twist 분리** — correction을 swing + twist로 분해, 각각 제어
2. **FBX bone roll 추출** — FBX의 bone roll 정보로 twist 명시적 적용
3. **Per-model rest orientation 감지** — VRM 모델의 finger rest 방향 자동 감지 후 adaptation
4. **virtual_rest_global 검증** — 남자 VRM에서 virtual_rest_global이 다르게 계산되는지 확인

## 관련 파일

- `crates/cinev_retarget/src/retargeter.rs` — three-quat formula, virtual_rest_global
- `crates/cinev_retarget/src/vrm_rest.rs` — compute_virtual_rest_global
- `crates/cinev_retarget/src/ik/mod.rs` — finger_bind_pose (thumb only)
- `crates/cinev_retarget/src/ik/solver.rs` — swing_twist decomposition (이미 존재)

## 시작 명령

```
cd ~/Desktop/www/bevy-vrm && cargo run --bin bevy-vrm
```

- F7: 여자 프리셋 (xiao + female_standing) — 비교 기준
- F8: 남자 프리셋 (c_normal + male_standing) — 문제 확인
- G: bone gizmo, F4: log

## 오늘 커밋 이력

| Hash | 내용 |
|------|------|
| 420d1fc | finger bind pose 5-bug fix |
| f05e9a2 | finger_bind non-thumb disabled |
| e830409 | gizmo mode 3, FBX labels |
| 7de9890 | shoulder width compensation |
| 3b6b6a6 | male preset default |
| 119d45f | clean studio view, leg IK revert |
| 6c2c00d | white studio (tonemapping off) |
| 76e4f8b | remove diagnostics plugins |
