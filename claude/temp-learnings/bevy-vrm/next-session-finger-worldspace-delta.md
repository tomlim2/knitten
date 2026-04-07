---
title: "다음 세션: Finger world-space delta retarget (Wicked Engine 방식)"
tags: [bevy-vrm, retarget, finger, todo]
created: 2026-04-07
---

# 다음 세션: Finger World-Space Delta Retarget

## 현재 상태 (2026-04-07 기준)

- Three-quat formula의 finger curl: 크기 ~80% 전달되지만 **방향(축)이 틀림**
- 원인: FBX A-pose arm orientation ↔ VRM T-pose arm orientation 차이
  - parentRestWorld가 다르니까 curl이 다른 축으로 매핑됨
- Swing-twist(X축) 분해로 twist 제거 중이지만 curl 축 자체가 잘못됨
- Default curl (15°/20°/10° + splay) 은 잘 작동

## 근본 해결: Wicked Engine 방식

Three-quat formula를 finger에는 우회. 대신 world-space delta 방식:

```
1. FBX finger world rotation (per frame) 계산
   - FBX skeleton의 parent chain으로 world rot 누적
2. src_diff = anim_world × tpose_world⁻¹
   - T-pose 대비 순수 animation delta (world space)
3. Swing-twist(bone axis) → twist 제거, curl만
4. tgt_world = src_diff × vrm_tpose_world
   - VRM T-pose에 delta 적용
5. tgt_local = vrm_parent_world⁻¹ × tgt_world
   - VRM parent inverse → local rotation
```

핵심: bone별 자신의 rest 기준 delta → parent rest 차이 누적 안 됨

## 필요한 데이터

- FBX finger bone world rotations per frame → `FbxSkeletonFrames`에 있음 (bone_positions)
  - 단 rotation은 없고 position만 있음 → rotation 계산 필요
  - 또는 FBX bone hierarchy에서 local rotation 누적해서 world rotation 계산
- FBX finger T-pose world rotation → frame 0 또는 rest_rotation_euler + parent chain
- VRM finger T-pose world rotation → `bone_rest_global`
- VRM finger parent world rotation → parent chain FK

## 구현 위치

- `retargeter.rs`의 `compute_rotations()`에서 finger bone일 때 분기
- 또는 별도 `compute_finger_rotations()` 함수

## 관련 파일

- `crates/cinev_retarget/src/retargeter.rs` — compute_rotations, three-quat
- `crates/cinev_retarget/src/mapping.rs` — BoneTrack, src_rest_global
- `crates/cinev_retarget/src/fbx.rs` — FBX parsing, global_rest 계산
- `crates/cinev_retarget/src/ik/mod.rs` — finger_bind_pose, default curl

## 참고 자료

- [Wicked Engine — Animation Retargeting](https://wickedengine.net/2022/09/animation-retargeting/)
- [Allen Chou — Swing-Twist Decomposition](https://allenchou.net/2018/05/game-math-swing-twist-interpolation-sterp/)

## 시작 명령

```
cd ~/Desktop/www/bevy-vrm && cargo run --bin bevy-vrm
```

- F7: 여자 프리셋, F8: 남자 standing, F9: 남자 wave
- G: bone gizmo, F4: log

## 오늘 커밋 이력

| Hash | 내용 |
|------|------|
| 0c1cb27 | finger curl-only extraction, default pose, F9 wave preset |
| 75d6430 | timeline readability + bolder gizmo labels |
| cee7816 | brighter bone colors and FBX label readability |
| 7d47022 | swing-twist curl filter + bind-pose curl-only for non-thumb |
