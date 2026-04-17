# R-017 Blender-specific retarget config — Result

**Branch:** `feat/blender-source-type` (bevy-vrm)
**Date:** 2026-03-31
**Agent:** 2호기

---

## cargo test

```
26 passed, 0 failed
```

- integration.rs: 21 tests (기존 15 + 신규 6)
- rq_diagnostics.rs: 5 tests (기존 5, source_detected 검증 추가)

신규 테스트:
1. `config_parse_blender_female` — Blender config 파싱, source_type=Blender, slerp=0.55, twist_fold 비어있음
2. `config_backward_compat_no_source_type` — 기존 config에 source_type 없어도 Auto/0.55 기본값
3. `source_detection_t2m_is_blender` — T2M FBX → Blender 감지
4. `source_detection_rush_is_maya` — Rush FBX → Maya 감지
5. `retarget_blender_config_t2m` — Blender config + T2M female FBX retarget 성공
6. `retarget_blender_config_t2m_male` — Blender config + T2M male FBX retarget 성공

## cargo clippy

```
0 warnings (with -D warnings)
```

## Detection 결과

| FBX 파일 | Creator | detected_source_type | 감지 근거 |
|----------|---------|---------------------|----------|
| t2m_f_walk.fbx | (Blender 또는 identity PreRotation) | **Blender** | Creator string 또는 전체 PreRotation identity fallback |
| t2m_m_walk.fbx | (동일) | **Blender** | 동일 |
| t2m_m_wave.fbx | (동일) | **Blender** | 동일 |
| 25_06672_F_*Rush*.fbx | Maya/FBX SDK | **Maya** | Creator에 "Maya" 또는 "FBX SDK" 포함, 또는 PreRotation 비-identity |
| FC_00078_F_*Flutter*.fbx | (facial-only) | (테스트 미포함) | — |

## 변경 파일 목록

### Rust 소스
1. `crates/cinev_retarget/src/config.rs` — `FbxSourceType` enum, `source_type` + `shoulder_slerp_factor` 필드
2. `crates/cinev_retarget/src/fbx.rs` — `FbxData`에 `creator`, `detected_source_type` 추가. FBXHeaderExtension Creator 파싱. `detect_source_type()` 함수
3. `crates/cinev_retarget/src/retargeter.rs` — `Retargeter`에 `shoulder_slerp_factor`, `source_detected`, `source_config`. `RetargetQuality`에 source 필드. 하드코딩 0.55 → `self.shoulder_slerp_factor`. RQ 로그에 source info 출력
4. `crates/cinev_retarget/src/lib.rs` — `FbxDiagnostics`에 `source_detected`, `source_resolved`, `creator`. `resolve_source_type()`. `FbxSourceType` re-export
5. `crates/cinev_retarget/src/bin/headless.rs` — `new_with_unmatched` 호출 시그니처 업데이트

### Config JSON
6. `assets/retarget/cinev_blender_female.json` — Blender female config (twist_fold 빈 object)
7. `assets/retarget/cinev_blender_male.json` — Blender male config (twist_fold 빈 object)

### 테스트
8. `crates/cinev_retarget/tests/integration.rs` — 신규 6개 테스트
9. `crates/cinev_retarget/tests/rq_diagnostics.rs` — RqRow에 source_detected 추가, T2M→Blender/Rush→Maya 검증

## 알려진 이슈

1. **Creator 파싱 미검증**: Creator string이 실제로 파싱되는지 unit test 수준에서 직접 확인하지 않음. Detection이 fallback (PreRotation identity 체크)으로도 올바르게 동작하므로 테스트는 통과하지만, Creator 파싱 자체가 정상인지는 FBX hex dump로 별도 확인 필요.
2. **Blender config의 source_prefix**: `"DHIbody:"` 프리픽스를 그대로 복사했으나, T2M Blender FBX에는 이 프리픽스가 없을 수 있음. T2M FBX의 bone name에 프리픽스가 없으면 direct_map 매칭에 영향 없음 (프리픽스 없이도 매칭됨).
3. **shoulder_slerp_factor 실제 효과 미확인**: 이번 변경은 config 분리만 수행. Blender FBX에 최적인 slerp factor 값 튜닝은 별도 실험 필요 (현재 Maya와 동일한 0.55 사용).
4. **`Retargeter::new()` 기본값**: `new()`는 source_detected/source_config를 Auto/Auto로 설정. Bevy 런타임 (main.rs)에서는 아직 FbxDiagnostics의 source 정보를 Retargeter에 전달하지 않음. headless.rs만 업데이트됨.
