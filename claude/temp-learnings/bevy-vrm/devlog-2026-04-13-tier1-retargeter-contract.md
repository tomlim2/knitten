---
date: 2026-04-13
project: bevy-vrm
session: tier1-retargeter-contract
tags: [rust, trait-design, rubric, retargeting, naming]
---

# Tier 1 Retargeter Contract + C1.3 Residual + Naming Rename

오늘 두 번째 세션. 오전 세션(Phase 2-3 랜딩)과 독립. shotloom 포팅 대비 Tier 1 계약을 박는 것이 목표였고, 계약 설계 의사결정 + C1.3 residual 재설계 + Tier 1.5 리네이밍까지 한 세션에 묶여 들어감.

## 세션 결과

커밋 3개, origin/main push 완료.

- `c645528` feat(humanoid_retarget): Tier 1 Retargeter trait contract
- `b37511e` fix(rubric_c): C1.3 Stability is input→output residual, not output-in-isolation
- `d3496bd` refactor: rename pipeline types to source/target domain vocabulary

cargo test -p humanoid_retarget: 35 passed / 0 failed / **0 ignored** (이전 1 ignored — 골든 모순 테스트 해제됨).

원래 예산 3h → 실제 ~5h. 초과분은 Tier 1.5 리네이밍이 원래 다음 세션 예정이었는데 같은 세션에 들어갔기 때문.

## 계약 설계 의사결정

세션 전반부는 "어떤 trait 모양이냐"에 대한 재검토였음. 이게 일지의 진짜 값어치.

### 처음 plan의 컴파일 불가 발견

원래 계획:
```rust
pub trait Retargeter { ... }
pub struct ArpRetargeter { ... }  // 기존 Retargeter 리네임
pub type Retargeter = ArpRetargeter;  // 호출부 보호
```

**이름 충돌**: `pub trait Retargeter`와 `pub type Retargeter = ...`는 같은 scope에 공존 불가. `lib.rs`의 `pub use`가 한 이름에 두 export를 걸어서 빌드 실패. 계획이 내부적으로 일관되지 않았음.

### ArpRetargeter 생성자 비대칭 발견

단일 trait `fn retarget(&self, src: &FbxData, rest: &VrmRestPose)`에 두 impl을 맞추려다 비대칭 발견:

- **ArpRetargeter 현재 모양:** `::new(vrm_rest, fbx_skeleton, anim, ...)` + `.apply(&RetargetedAnimation)`. 생성자가 mapping **후**의 `RetargetedAnimation`을 받아 `BoneData`/`descendants`/`correction_pairs` 300줄 precompute. "post-mapping stateful object".
- **IdentityRetargeter (build_c_inputs 로직):** raw `FbxData` 받아서 ARP 트랙을 VRM 슬롯에 그대로 복사. Stateless.

같은 trait 시그니처에 맞추려면 ArpRetargeter 생성자를 "anim을 `retarget()` 호출에서 받도록" 뒤집어야 함 → 150줄짜리 초기화 로직이 전부 움직이는 작업, 3h 예산 초과.

### 사용자 프레임이 설계를 결정했음

중간에 사용자가 던진 한 문장이 계약 모양을 결정함:
> "결국 리타겟은 검증된 fbx와 검증된 vrm이 있어야 검증된 리타게터가 만들어지는겁니다"

이게 그대로 rubric A/B/C 구조였음:
```
rubric-A-validated FBX  +  rubric-B-validated VRM rest
                        ↓
             impl Retargeter::retarget()
                        ↓
              TargetAnimation (scored by rubric C)
```

이 프레임이 박히자:
- 단일 trait이 맞음 (A·B를 합쳐서 C를 만드는 축이 하나)
- ArpRetargeter를 **재편하는 게 맞음** — 그게 rubric 구조에 맞는 형태
- IdentityRetargeter는 "rubric C의 baseline 구현" — C가 identity를 통과 못 시키면 C가 거짓말하는 것

### 최종 구조

```
pub trait Retargeter {
    fn retarget(&self, src: &SourceAsset, vrm_rest: &VrmRestPose)
        -> Result<TargetAnimation, RetargetError>;
}

pub struct ArpRetargeter { config, vrm_version, options }
impl Retargeter for ArpRetargeter { /* mapping → skeleton → Inner → apply */ }

pub struct ArpRetargeterInner { /* 기존 로직, 내부 전용 */ }

pub struct IdentityRetargeter { bone_map }
impl Retargeter for IdentityRetargeter { /* 1:1 트랙 복사 */ }
```

ArpRetargeterInner로 격하된 기존 struct는 `validate.rs`, bin, outer crate `src/retarget.rs`에서 계속 사용됨. 호출부 churn 최소화.

## 네이밍 결정 (후보 B 승리)

내가 처음엔 후보 C (`ImportedFbx` / `MappedAnimation` / `RetargetedAnimation` — 단계 기반)를 추천했는데, 사용자가 "b가 더 나아보이는데요?"로 재고 요청.

후보 B의 진짜 장점을 재평가:
- **도메인 네이티브 어휘**: UE IK Retargeter, Blender Rigify, Maya HIK 전부 "source rig / target rig"로 말함
- **좌표 공간이 이름에 박힘**: 3D 좌표 버그의 대부분이 "어느 공간의 벡터인지 까먹어서" 생기는데, 이름이 공간을 들고 다니면 타입 시스템이 잡아줌
- **발명된 중립 이름보다 도메인 이름이 우선**

최종 rename:
- `FbxData` → `SourceAsset` (canonical in fbx_rig)
- `RetargetedAnimation` → `MappedAnimation` (중간물, 거짓말하던 이름 교정)
- `RetargetResult` → `TargetAnimation` (SourceAsset과 짝)

`SourceAnimation`은 "asset 전체"를 담기엔 부정확해서 의도적으로 제외. `SourceAsset`이 정확하고, "애니만 뽑은 뷰"가 필요하면 미래에 `SourceAsset.animation_tracks()` 접근자 추가.

## C1.3 Residual 재설계

### 기존 bug 본질

C1.3 Stability가 `vrm_fk.bone_rotations`만 읽고 출력 스파이크를 채점 → "output-in-isolation 금지" 공리 위반 → rubric A 질문을 C가 중복으로 물은 것.

증거: identity retargeter (입력 = 출력)가 입력에 30° 팝이 있는 fixture에서 C1.3 grade B를 받음. retargeter는 아무것도 안 했는데 채점당함. `rubric_c_identity_passthrough_c13_should_not_flag_input_spikes`가 `#[ignore]`로 이 모순을 잠가놓고 있었음.

### 재설계 공식

```
for each vrm bone matched to a source track:
    output_deltas[f] = angle(out_rot[f], out_rot[f-1])
    input_deltas[f]  = angle(src_rot[f], src_rot[f-1])
    residual[f]      = |output_deltas[f] - input_deltas[f]|
spike_rate_from_deltas(residual) → per-bone rate
grade on max per-bone rate
```

Identity retargeter → residual 전부 0 → grade A. 30° 팝을 retargeter가 **추가로** 넣으면 30° residual이 잡힘. 원래 rubric C가 묻고 싶었던 질문.

### 구현 메모

- `rubric_c::evaluate`에 새 파라미터 `src_rotations_by_vrm: Option<&HashMap<String, Vec<Quat>>>` 추가. 없으면 C1.3 스킵 (mirrors C1.4 Fidelity의 src_fk 패턴). 가중치 재분배도 일반화.
- Test harness는 `ARP_TO_VRM`으로 src map 빌드. Real sweep bin은 `anim.bone_tracks`의 (vrm, src) 쌍으로 빌드 — fbx를 한 번 더 파싱해야 함 (sweep bin은 skeleton만 들고 있고 raw tracks 없음).
- `rubric_c_single_discontinuity` 테스트 어서션 `!= A` → `== A`로 뒤집음. 같은 사실의 양면 (identity가 A를 받으면 discontinuity fixture도 A).

### quality/detector.rs 승격

`STATIC_MEDIAN_FLOOR_DEG` / `STATIC_SPIKE_THRESHOLD_DEG` / `ACTIVE_MULTIPLIER` / `quat_angle_between` / `is_non_deformation_bone` / `spike_rate_from_deltas`를 `rubric_a.rs`에서 `quality/detector.rs`로 이동. A와 C가 같은 math 파일 import. shotloom-common::quality_detector로 1:1 포팅 준비.

## 교훈

### 계약 설계는 "입력이 파이프라인 어디서 들어오나"부터 그려라

Trait 시그니처 쓰기 전에 각 impl의 **입력 경계**가 파이프라인의 어느 지점인지 먼저 파악. ArpRetargeter는 mapping 후, IdentityRetargeter는 mapping 전 — 이 비대칭을 시그니처로 밀어붙이면 생성자 재편이 따라붙음. 30분 작업이 2h가 됨.

`Plan mode에서 먼저 impl 후보들의 "construction preconditions"를 표로 정리`하는 습관을 들일 것.

### 도메인 어휘 > 발명된 중립 이름

네이밍 후보 고를 때, 도메인(리타겟팅, 쉐이딩, 물리 등)이 이미 쓰는 어휘가 있으면 그걸 우선. `MappedAnimation`(발명) vs `SourceAnimation`(도메인) — 내가 처음엔 "중간물 담을 자리가 없다"는 이유로 도메인 안을 제외했는데, 중간물은 **외부 노출 안 해도 됨**이 정답이었음. 도메인 어휘로 외부 API를 짜고, 중간물은 구현 디테일로 숨김.

### Trait은 impl이 2개 이상일 때만 값어치를 함

구현체가 하나뿐인데 trait을 먼저 만들면 "미래를 위한 껍데기"가 되어 일 안 함. 이번 세션은 IdentityRetargeter라는 두 번째 impl이 생기는 시점이라 trait이 자연스럽게 나옴. 그 전에 만들었으면 과잉 추상화였음.

### JS 백그라운드 → Rust trait 매핑

사용자가 세션 중에 "내가 여지껏 쓴건 JS style?" 질문함. 답: 그렇다. `struct X; impl X { ... }`는 JS의 class 스타일이고, `trait I` + `impl I for X`는 TS의 interface/implements 패턴. Rust trait의 진짜 힘은 (1) orphan rule 내에서 남의 타입에 내 trait 붙일 수 있음, (2) 제네릭 제약으로 쓸 수 있음.

다음 세션에서도 설명할 일 있으면 **class vs interface 프레임**으로 가면 빠름.

## 미래 작업 (이번 세션에서 의도적으로 제외)

- **`foot.rs` 감사** — 506 LOC, 별도 세션 필요
- **Rubric B (B1.2/B1.3/B1.4)** — 제자리 수정, crate-boundary tier 대기
- **Rubric C C1.1/C1.2 재설계** — Phase 4, positional fixture 필요 (현재 fixture는 bone_positions가 static)
- **Real retarget sweep (132 pairings) 재실행** — 이번 세션 skip (바이너리 args 없어서). 다음 세션에서 fbx/vrm 디렉토리 경로 받으면 `cargo run -p humanoid_retarget --bin retarget-test <models> <fbx> <config>` 돌릴 것.
- **`SourceAsset.animation_tracks()` 뷰 접근자** — 미래에 "애니만 필요한" 컨슈머가 생길 때만. 지금은 불필요.
- **`ArpRetargeterInner` 정리** — 현재 `validate.rs`, bin, outer crate `src/retarget.rs`가 여전히 사용. 이들을 새 `ArpRetargeter` 계약으로 이관하면 Inner를 `pub(crate)`로 강등 가능. 단 그 전에 각 호출부가 왜 Inner를 직접 쓰는지(= mapping 없이 pre-computed anim을 쓰는 이유) 각각 확인 필요.

## Session bookkeeping

- main이 origin보다 0 커밋 앞섬 (push 완료)
- 8개 task 작성/완료 (session 중 1 repurpose, 0 drop)
- 중간 push / force push 없음, clean linear history
- Opus 4.6 [1m] 세션
