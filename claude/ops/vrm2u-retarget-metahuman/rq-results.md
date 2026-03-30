# R-005: Male Retarget + RQ Diagnostics Results

## Executive Summary

**RQ (RetargetQuality) 실행 불가** — `Retargeter` 경로는 `VrmRestPose`(Bevy 런타임 VRM 로드) 필요. 현재 headless CLI 없음.

대신 실행 가능한 진단: FBX skeleton dump (`diag`), integration tests (`lib::retarget()` → `FbxDiagnostics`), config parsing.

---

## 1. Integration Tests (15/15 pass)

Male-specific:
- `config_parse_male` — pass. name=cinev_male_body, direct_map 비어있지 않음, prefix=DHIbody:
- `retarget_male_rush` — pass. rush FBX + male config → bone tracks 생성, duration > 0

All 15 tests pass including body v0/v1, facial-only, skeleton, invalid input.

---

## 2. FBX Skeleton Dump — Male vs Female

### GlobalSettings (동일)
```
UpAxis=2(Z) Sign=1 | FrontAxis=1(Y) Sign=-1 | CoordAxis=0(X) Sign=1
UnitScaleFactor=1 | OriginalUpAxis=-1
```
→ Z-up, Y-front(neg), X-right. 표준 Blender FBX export.

### Bone Count
| | Male (t2m_m_walk) | Female (t2m_f_walk) |
|---|---|---|
| Skeleton bones | 84 + Armature + RootMotion = 86 | 84 + Armature + RootMotion = 86 |
| Animated bones | 85 | 85 |
| DHIbody: prefix | yes | yes |

→ **동일한 84-bone MetaHuman skeleton**. 남녀 bone 구조 차이 없음.

### Pelvis Height (rest translation Z)
| | Male | Female |
|---|---|---|
| pelvis t.z | 93.8 | 94.1 |

→ 거의 동일 (~0.3 차이). 단위: centimeters.

### Limb Lengths (rest translation magnitude)
| Bone | Male | Female | 차이 |
|------|------|--------|------|
| upperarm_l | 26.8 (lowerarm t) | 22.9 | male 17% 길다 |
| lowerarm_l → hand | 25.2 | 22.9 | male 10% 길다 |
| thigh_l → calf | 38.6 | 45.0 | **female 17% 길다** |
| calf_l → foot | 43.7 | 39.9 | male 10% 길다 |
| clavicle_l | 16.7 (upperarm t) | 14.4 | male 16% 길다 |

→ 상체는 male이 크고, **대퇴골(thigh→calf)은 female이 더 김**. 비율 차이 있음.

### Spine Chain
| Segment | Male t | Female t |
|---------|--------|----------|
| spine_01 | 2.4 | 2.4 |
| spine_02 | 5.2 | 4.5 |
| spine_03 | 8.5 | 7.4 |
| spine_04 | 8.7 | 6.0 |
| spine_05 | 17.9 | 14.9 |

→ Male torso 전체적으로 더 김. spine_05(chest) 차이 가장 큼 (17.9 vs 14.9).

### Animation First 5 Frames (root, pelvis)
- root: 두 FBX 모두 거의 identity rotation, 미세한 Z-rot + translation
- pelvis: 동일한 ~89.3° rotation (Z-up → Y-up 좌표 변환 내장)
- 패턴 동일 — T2M API가 동일 motion을 남녀 skeleton에 bake한 것

---

## 3. RQ 실행 불가 원인

| RQ 항목 | 필요 데이터 | 현재 상태 |
|---------|------------|----------|
| bone_count | retarget 결과 | ✅ integration test로 확인 가능 |
| scale_ratio | VrmRestPose.hips_height | ❌ VRM 로드 필요 |
| identity test | VRM rest rotations | ❌ VRM 로드 필요 |
| shoulder_ratio | VRM + FBX world positions | ❌ VRM 로드 필요 |
| arm_ratio | VRM + FBX world positions | ❌ VRM 로드 필요 |
| has_180y_root | VRM root_rest_rotation | ❌ VRM 로드 필요 |

**결론:** RQ의 5/6 항목이 VRM rest pose 데이터에 의존. headless VRM loader CLI가 없는 한 실행 불가.

---

## 4. 이상치 / 주의사항

1. **Female thigh가 male보다 17% 김** — retarget scale ratio가 남녀 다를 수 있음
2. **pelvis 89.3° rotation** — FBX Z-up이 bone rotation에 bake됨. retargeter의 coord_rot 변환이 이걸 처리해야 함
3. **RootMotion bone** (`CAS_BaseModel_RootMotion4_Object079`) — DHIbody: prefix 없음, config에서 무시될 것
4. **pre_rotation 전부 identity** — T2M FBX는 pre-rotation 미사용 (good, 처리 단순)

---

*Generated: 2026-03-30 by Agent #2*
