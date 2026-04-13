# 2026-04-13 — SourceAnim Body/Facial Split (shotloom 포팅 1번 차단 항목)

devlog 04-13 오후 엔트리에 "SourceAnim 설계 결정 (미구현, 다음 세션)"으로 박혔던 첫 번째 작업. 오늘 야간 세션에 처리.

## 시작 전 상황

`fbx_rig::SourceAsset`이 body + facial 모두 한 struct에 묶여 있음:
```rust
pub struct SourceAsset {
    pub bones: HashMap<String, FbxBone>,           // body
    pub tracks: HashMap<String, FbxBoneTrack>,     // body
    pub bind_world: HashMap<String, Mat4>,         // body
    pub blend_shape_tracks: HashMap<String, Vec<f32>>,  // facial
    pub frame_count: usize,                         // common
    pub duration: f32,                              // common
    pub creator: Option<String>,                    // common
    pub detected_source_type: FbxSourceType,        // body-side metadata
}
```

`mapping::retarget()` 단일 함수 300+ LOC가 둘 다 처리 — 마지막 8줄만 facial:
```rust
// Lines 137-411: body retargeting (bone tracks)
// Lines 413-421: facial retargeting (expression tracks)
```

shotloom 포팅 시 문제: shotloom-t2m이 body를, 별도 facial 크레이트가 blendshape를 owns. 한 함수에서 둘 다 처리하면 mechanical port 불가.

## 결정 — Option B (minimal split with borrowing views)

**하지 않을 것:**
- `fbx_rig::SourceAsset` 자체 분리 (X) — 파일 포맷 레벨 struct는 fbx_rig 내부에 그대로 유지
- 호출 사이트 role-level rename (X) — 별개 작업
- 새 bin `source-anim-score` (X) — 별개 작업

**할 것:**
1. `humanoid_retarget::source_anim` 모듈 신설
2. `SourceAnimBody<'a>` + `SourceAnimFacial<'a>` borrow view struct
3. `SourceFormat` enum (Fbx 한 variant, future Glb/Bvh 대비)
4. `from_source_asset` 생성자 (zero-cost borrow)
5. `mapping::retarget_body()` + `mapping::retarget_facial()` 분리
6. `mapping::retarget()`은 thin wrapper로 backwards compat 유지

## 구현

### `crates/humanoid_retarget/src/source_anim.rs` (신설, 115 LOC)

```rust
pub enum SourceFormat { #[default] Fbx }

pub struct SourceAnimBody<'a> {
    pub format: SourceFormat,
    pub bones: &'a HashMap<String, FbxBone>,
    pub tracks: &'a HashMap<String, FbxBoneTrack>,
    pub bind_world: &'a HashMap<String, Mat4>,
    pub frame_count: usize,
    pub duration: f32,
    pub detected_source_type: FbxSourceType,
}

impl<'a> SourceAnimBody<'a> {
    pub fn from_source_asset(asset: &'a SourceAsset) -> Self { ... }
    pub fn is_empty(&self) -> bool { self.tracks.is_empty() }
}

pub struct SourceAnimFacial<'a> {
    pub format: SourceFormat,
    pub blend_shape_tracks: &'a HashMap<String, Vec<f32>>,
    pub frame_count: usize,
    pub duration: f32,
}

impl<'a> SourceAnimFacial<'a> {
    pub fn from_source_asset(asset: &'a SourceAsset) -> Self { ... }
    pub fn is_empty(&self) -> bool { self.blend_shape_tracks.is_empty() }
}
```

핵심: **borrow view**. `from_source_asset`은 zero-cost reference 생성. 별도 allocation 없음. 라이프타임 `'a`로 caller가 SourceAsset 살아있는 동안만 view 사용.

### `mapping.rs` 분할

기존:
```rust
pub fn retarget(fbx: &SourceAsset, config, vrm_version) -> Result<MappedAnimation>
```

분할 후:
```rust
pub fn retarget_body(body: &SourceAnimBody, config, vrm_version) -> Result<Vec<BoneTrack>>
pub fn retarget_facial(facial: &SourceAnimFacial, config) -> Vec<ExpressionTrack>
pub fn retarget(fbx: &SourceAsset, config, vrm_version) -> Result<MappedAnimation> {
    let body = SourceAnimBody::from_source_asset(fbx);
    let facial = SourceAnimFacial::from_source_asset(fbx);
    let bone_tracks = retarget_body(&body, config, vrm_version)?;
    let expression_tracks = retarget_facial(&facial, config);
    // ... assemble MappedAnimation
}
```

`apply_bind_overrides` / `build_prefix_map` 헬퍼도 view 받도록 `_view` 접미사 버전으로 변경 (`apply_bind_overrides_view`, `build_prefix_map_view`).

기존 `retarget` 함수의 모든 `fbx.bones` / `fbx.tracks` → `body.bones` / `body.tracks`로 치환 (5군데).

## 호출 사이트 영향

**0개**. 기존 caller (`lib.rs::retarget_with_skeleton`, `retargeter.rs::ArpRetargeter::retarget_pipeline`)는 `mapping::retarget(fbx, ...)` 호출 그대로. wrapper가 새 함수들을 내부적으로 호출하므로 외부 변화 0.

## 검증

- `cargo check -p humanoid_retarget`: clean
- `cargo check --workspace`: clean
- `cargo test -p humanoid_retarget`: 35/35 pass (3 + 5 + 13 + 14 = 35)
- **Real sweep 190 graded pairings**:

| | A | B | C | F |
|---|---|---|---|---|
| M1 only (split 전) | 12 | 65 | 75 | 38 |
| M1 + split (split 후) | 12 | 65 | 75 | 38 |

**byte-identical**. Pure refactoring 성공 — 동작 변화 0, 회귀 0.

## LOC 변화

| 파일 | Δ |
|------|----|
| `source_anim.rs` (new) | +115 |
| `mapping.rs` | +71 (분할 + wrapper) |
| `lib.rs` | +2 (mod + re-export) |
| **Total** | +188 |

## 결과

이제 다음이 가능:
- shotloom-t2m 같은 body 전용 caller가 `humanoid_retarget::mapping::retarget_body(&body_view, ...)` 호출
- shotloom 쪽 facial caller가 `mapping::retarget_facial(&facial_view, ...)` 호출
- 각각 독립적으로 unit test 가능
- 두 함수가 서로의 데이터에 접근 못 함 (view가 강제 분리)

`SourceAsset`는 fbx_rig 내부에 그대로 — 파일 포맷 layer로서 의미 유지. View는 humanoid_retarget 내부에서만 정의. 미래에 `SourceAnimGlb`, `SourceAnimBvh` 등이 추가될 때도 동일 패턴 (view → mapping fn) 적용 가능.

## 교훈

### borrow view가 trait보다 가볍다

처음엔 `trait SourceAnimSource { ... }` 정의하고 SourceAsset가 impl하는 식을 고려했지만, 구현체 1개일 땐 trait이 부담만 됨. 그냥 borrow view struct가 zero-cost + 더 명시적. tier1 devlog의 "trait은 impl 2개 이상일 때만" 교훈 그대로.

### Wrapper로 backwards compat 유지하면 caller churn 0

`mapping::retarget()`을 wrapper로 두면 기존 호출자 코드 수정 0. 새 호출자만 새 함수 사용. risk-free 마이그레이션.

### Pure refactoring은 sweep으로 정확히 검증

뷰어/시각으로 검증하면 미세한 차이 놓침. real sweep 190 페어링이 byte-identical 분포면 진짜 refactor 성공.

### 헬퍼 fn rename은 명확한 신호

`apply_bind_overrides` → `apply_bind_overrides_view`, `build_prefix_map` → `build_prefix_map_view`로 rename. 시그니처가 SourceAsset에서 SourceAnimBody로 바뀌는 순간 다른 함수가 됨. 같은 이름으로 두면 미래 reader가 헷갈림. `_view` 접미사로 분명히.

## 다음 단계 (shotloom 포팅 차단 항목)

오늘 1번 항목 처리. 남은 차단 항목:

| # | 항목 | 작업 분량 |
|---|------|----------|
| 1 | ✅ SourceAnim body/facial split | 1 세션 (오늘 완료) |
| 2 | EXP-006 → `humanoid_retarget::postprocess::wrist_twist` 모듈화 | ~30분 (작은 작업) |
| 3 | A/B/C pipeline gating in retargeter wrapper | 1 세션 |
| 4 | Diagnostic 변환 layer (Grade A/B/C/F → severity) | 0.5 세션 |
| 5 | C1.1, C1.4 residual-based 재설계 | 1-2 세션 |

5 세션 추정에서 1 세션 완료. 약 20% 진척.

## 커밋

- bevy-vrm `143e0ba` feat(source_anim): split body/facial views — shotloom port path
