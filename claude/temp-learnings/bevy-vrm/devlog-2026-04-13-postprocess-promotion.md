# 2026-04-13 — Postprocess 모듈 promotion (shotloom 포팅 #2)

EXP-006 wrist twist transfer를 `src/retarget.rs` inline에서 `humanoid_retarget::postprocess::wrist_twist` 모듈로 이전. 동작 변화 0, sweep regression 0. 호출부 30 LOC → 1 fn call.

## Why

shotloom 포팅 차단 항목 #2. EXP-006이 `src/retarget.rs`에 inline되어 있었기 때문에:
- 뷰어 전용 — sweep bin, headless에서 사용 불가
- shotloom-side에서 같은 fn 호출 못 함
- 단위 테스트 불가능

이전 후:
- humanoid_retarget crate 일부 → 어디서나 import 가능
- `apply_wrist_twist_transfer(&mut anim, &skel, &vrm_to_fbx)` 한 줄 호출
- shotloom 포팅 시 `humanoid_retarget::postprocess::wrist_twist` 디렉토리 그대로 복사 → `shotloom-retarget::postprocess::wrist_twist`

## 구조

```
crates/humanoid_retarget/src/postprocess/
├── mod.rs                    (38 LOC: 모듈 doc + 사용 가이드 + re-export)
└── wrist_twist.rs            (111 LOC: EXP-006 코드 이전 + 풀 doc)
```

함수 시그니처:
```rust
pub fn apply_wrist_twist_transfer(
    anim: &mut TargetAnimation,
    fbx_skel: &FbxSkeletonFrames,
    vrm_to_fbx: &HashMap<String, String>,
) -> Vec<String>  // log lines
```

`mod.rs`에 added/not-added 가이드라인 박아둠:

**add to postprocess when:**
- Depends on data outside retargeter's `apply()` (FBX skeleton, sole height, IK targets)
- Needs to be available to multiple callers
- Operates on already-retargeted output

**don't add when:**
- Per-frame inside retargeter pipeline → retargeter pass
- Init time on dst_rest_* → adapters/arp_vrm rest sync
- One-off for single VRM → adapters/arp_vrm_user_pose UserCalibrated

**trait 도입은 미루기:**
> "Today every post-process is a free function. When a stateful post-process appears (one that needs pre-computed cache or shared resources between frames), introduce a trait AnimPostprocess then, not before. Tier 1 devlog lesson: traits are only worth it when impls are 2+."

## 호출부 변화

`src/retarget.rs` line 173-200 (이전 30 LOC):
```rust
if let Some(viz) = fbx_viz.as_ref() {
    let skel = &viz.data;
    let coord = Quat::from_rotation_x(-std::f32::consts::FRAC_PI_2);
    let coord_inv = coord.inverse();
    let sides: [(&str, &str); 2] = [...];
    for (vrm_forearm, vrm_hand) in sides {
        // 25 lines of inline math
    }
}
```

이전 후:
```rust
if let Some(viz) = fbx_viz.as_ref() {
    let logs = humanoid_retarget::postprocess::apply_wrist_twist_transfer(
        &mut result, &viz.data, &vrm_to_fbx,
    );
    for line in logs {
        log.push(line);
    }
}
```

30 LOC → 7 LOC. 33-line reduction.

## 검증

- `cargo check`: clean
- `cargo test -p humanoid_retarget`: 35/35 pass
- Real sweep 190 pairings:

| | A | B | C | F |
|---|---|---|---|---|
| Pre-promote | 12 | 65 | 75 | 38 |
| Post-promote | 12 | 65 | 75 | 38 |

**byte-identical**. Pure refactor 성공.

## LOC 변화

| 파일 | Δ |
|------|----|
| `postprocess/mod.rs` (new) | +38 |
| `postprocess/wrist_twist.rs` (new) | +111 |
| `lib.rs` | +1 |
| `src/retarget.rs` | -44 / +7 = -37 |
| **net** | +113 (대부분 doc) |

## 교훈

### 30 LOC inline → 모듈 promotion은 무료 점수

테스트도 통과, sweep 도 동일. 30분 작업으로 shotloom 포팅 차단 1개 해제. 비슷한 inline 코드들이 src/retarget.rs에 더 있을 가능성 → 다음 sweep 때 audit.

### 모듈 doc에 "when not to add"가 핵심

모듈이 잡종 폴더가 되지 않으려면 "여기 안 들어가는 것"을 명시. 4가지 alternative venue 명시 (retargeter pass, adapter rest sync, UserCalibrated, 새 retargeter impl). 미래 contributor가 wristtwist 옆에 random 추가 못 하게 막음.

### Free fn → trait 자동 promotion 금지

mod.rs doc에 "introduce trait AnimPostprocess then, not before" 명시. 구현체 1개일 때 trait 만들면 미래 부채. tier1 devlog 교훈 코드에 박음.

## 차단 항목 진척

| # | 항목 | 상태 |
|---|------|------|
| 1 | SourceAnim body/facial split | ✅ |
| 2 | EXP-006 → postprocess module | ✅ (이번) |
| 3 | A/B/C pipeline gating | ⬜ |
| 4 | Diagnostic 변환 layer | ⬜ |
| 5 | C1.1, C1.4 residual 재설계 | ⬜ |

**2/5 (40%) 진척.**

## 커밋

- bevy-vrm `478f685` refactor(postprocess): promote EXP-006 wrist twist to humanoid_retarget module
