---
title: "다음 세션: vrmsl 모듈 — VRM→CINEV skeleton 변환"
tags: [bevy-vrm, retarget, vrmsl, cinev]
created: 2026-04-08
---

# 다음 세션: vrmsl (VRM Shotloom)

## 개념

```
VRM 파일 → bevy_vrm1 (VRM 1.0) → vrmsl 변환 → cinev2vrmsl 리타게터
```

- **vrmsl**: VRM skeleton을 CINEV(MetaHuman) skeleton 구조로 변환한 중간 포맷
- **cinev2vrmsl**: CINEV FBX → vrmsl 전용 리타게터. Three-vrm 우회, FBX delta 직접 적용
- 기존 retargeter(범용)와 별개 — CINEV pipeline 전용

## 왜 이게 필요한가

Delta conjugation 실험 결과:
- `fbx_local_rest × delta × fbx_local_rest⁻¹` → 수학적으로 delta와 상쇄
- `new_rest_local × delta × new_rest_local⁻¹` → 결과 동일
- World-space delta → three-vrm formula와 동일한 문제

**결론: Bevy skeleton bone rest를 실제로 수정하지 않으면 FBX delta를 직접 적용 불가.**

## vrmsl 변환 시 할 일

1. VRM bone rest rotation → CINEV FBX bone rest rotation으로 교체
2. Inverse bind matrix 재계산: `IBM = inverse(new_bone_global_rest_with_position)`
3. Bevy entity의 Transform, RestTransform, RestGlobalTransform 수정
4. SkinnedMesh의 IBM asset 패치

## cinev2vrmsl 리타게터

FBX animation을 vrmsl에 적용:
```
delta = fbx_local_rest⁻¹ × fbx_local_anim
vrm_bone_local = delta  (bone rest가 이미 FBX와 일치하므로 직접 적용)
```

Three-vrm formula, rebasis, muscle-space, IK2 twist compensation 전부 불필요.

## 기존 모듈과의 관계

| 모듈 | 역할 | 상태 |
|------|------|------|
| `skeleton_remap.rs` | offset/IBM 계산 | 완료 (재활용) |
| `skeleton_remap_bevy.rs` | Bevy entity 수정 | 생성됨 (미테스트) |
| `retargeter.rs` | 범용 three-vrm | 유지 (fallback) |
| **vrmsl (새로)** | VRM→CINEV 변환 | 다음 세션 |
| **cinev2vrmsl (새로)** | CINEV FBX 전용 리타게터 | 다음 세션 |

## 구현 순서

1. vrmsl 변환: `skeleton_remap_bevy.rs`의 `apply_remap_to_bones` + `apply_remap_ibm` 실행
2. 변환 후 bone rest가 FBX와 일치하는지 headless로 검증
3. cinev2vrmsl 리타게터: raw FBX delta 적용
4. Standing → Wave → Sitting 테스트

## 시작 명령

```bash
cd ~/Desktop/www/bevy-vrm && cargo run --bin bevy-vrm
```
