# 2026-04-14 — fbx_rig → fbx_animation_importer 대전환

bevy-vrm의 `fbx_rig` 크레이트를 **하드닝 + 스코프 락다운 + 모듈 split + rename**까지 한 세션에 끝냄. 5 커밋 `origin/main` 푸시 완료. 내일 shotloom으로 이식 예정 (STL-76).

## 뿌듯 포인트 (세션 막판에 깨달은 것)

`fbx_animation_importer`는 **내가 Claude를 지휘해서 만든 1188 LOC pure-Rust 스켈레탈 FBX 파서**. 실제 코드 라인은 Claude가 쳤지만, 생태계 공백을 발견하고 / 구조 결정하고 / 방향 잡고 / 유지보수까지 가져가는 건 내 몫이다. Git author가 `tomlim2`로 찍히는 건 commit identity 설정일 뿐, literal authorship은 다른 얘기 — 이 점은 정직하게 적어둠.

그래도 결과물은 Bevy/Rust 생태계에서 skeletal animation + bind pose 추출을 제대로 하는 거의 유일한 크레이트. 대안 현황:

| 옵션 | 상태 | skeletal 지원 |
|---|---|---|
| `bevy_mod_fbx` | 사실상 방치, 메쉬 위주 | 부실 |
| `fbxcel` 단독 | 저수준 바이너리 리더만 | 없음 |
| `fbxcel-dom` | DOM, 정체 | 빈약 |
| Bevy 공식 | **없음** | - |
| **`fbx_animation_importer` (본인)** | 2026-04-12 split out, 적극 유지보수 | **skeletal + bind pose + anim curves + DCC detection + quat continuity + blendshape** |

특별한 점:
1. **bind pose 복원** — `Deformer::Cluster.TransformLink` 읽어서 진짜 bind rotation 추출 (다른 Rust FBX 파서들은 Euler 재구성만)
2. **DCC 툴 자동 감지** — Creator header + PreRotation identity 휴리스틱
3. **Quat continuity / hemisphere correction** — Euler → quat 컨버전에서 hemisphere flip 잡음
4. **ARP 대응** — Auto-Rig Pro 구조에 튜닝된 finger axis map / rest align
5. **블렌드셰이프 트랙** — facial 애니메이션까지 추출

**Bevy에 쓸만한 스켈레탈 FBX 파서가 없어서 Claude에 지시해서 만든 것.** 세션 내내 "남의 크레이트 이식하는 작업"인 줄 알고 있었는데, 리뷰 중에 git log 찍어보니 author가 `tomlim2` 본인 identity. 2026-04-12 `2e3e0b2 refactor: split FBX parsing into fbx_rig crate` — 원래 `humanoid_retarget` 안에 섞여 있던 걸 본인 지시로 Claude가 별도 크레이트로 분리한 시점.

이 워크플로우 자체가 capability다: (a) 생태계 공백 발견 → (b) 해결책 설계 → (c) AI에 구현 지시 → (d) 레이어별 유지보수. 각 단계가 서로 다른 종류의 판단을 요구하고, literal typing은 그 중 가장 기계적인 부분이다.

---

## 오늘 한 일 (5 커밋)

모두 `origin/main`에 푸시 (`09580ad..f3050b9`).

### 1. `01d4451 refactor(fbx_rig): harden parser and lock animation-only scope`

Codex 전면 리뷰 결과 🔴 Block 4건 + 🟡 Should 6건 발견. 이 커밋에서 처리한 것:

**Parser hardening (P0):**
- `collect_attrs` / `drain_attrs` 헬퍼 도입. 7개 `while let Ok(Some(a)) = reader.load_next(DirectLoader)` 루프를 전부 교체. malformed FBX가 partial/defaulted 데이터로 silent 통과하던 경로 차단
- `parse_anim_curve_pull` 배열 길이 검증 — `key_times.len() != key_values.len()` 면 `Err`. 이전엔 `sample_curve`가 짧은 쪽 너머 인덱싱해서 panic
- `parse_anim_curve_pull` non-finite sample rejection
- `inpaint_outliers` NaN guard + `f32::total_cmp`. 이전 `partial_cmp().unwrap()`은 NaN 유입 시 panic
- `parse_cluster_pull` nested `a` TransformLink fallback 구현 — 주석은 지원한다고 써놨는데 실제 코드는 direct attr만 읽던 버그. depth-scoped `awaiting_nested_transform_link` 플래그로 sibling의 `a`와 misattribute되는 것 방지

**Scope lockdown (P1):**
- `pub use fbxcel` 제거 (downstream에서 아무도 `fbx_rig::fbxcel::*` 안 씀 확인)
- Model subtype filter — `LimbNode` / `Limb` / `Null` / `Root` whitelist. 이전엔 모든 Model이 `bones`에 들어가서 `CAS_BaseModel_RootMotion4_Object079`, `BlendShape_g` 같은 비-skeleton 노드가 섞였음
- Crate doc에 "Scope boundary" 블록 추가 — "mesh geometry, materials, textures, vertex skin weights intentionally out of scope"

### 2. `c22cb20 test(fbx_rig): golden regression suite + dev dump utility`

7개 골든 테스트 파일 + `examples/dump_golden.rs` dev utility. codex에 위임해서 실제 parser 돌려서 나온 숫자를 하드코딩. 15 tests pass.

- `golden_basic.rs` — bone count, root, frame, duration
- `golden_hierarchy.rs` — hand.l depth == 8
- `golden_bind_pose.rs` — 3 bones × 2 fixtures 각도 Δ 스냅샷
- `golden_dcc_detect.rs` — 3 fixtures 모두 기대값 검증 (facial은 Maya로 검출됨, "FBX SDK" creator string 때문)
- `golden_quat_continuity.rs` — hemisphere flip == 0
- `golden_blendshape.rs` — 124 channels, stable name 존재
- `error_cases.rs` — empty / random / truncated 전부 panic 없이 `Err` 반환

Fixture: `17857_M_AIStndWide`, `18271_F_AIDepressedID`, `FC_00078_F_SuddenFlutter`.

### 3. `f55c4e2 refactor(fbx_rig): split lib.rs into focused modules`

1275 LOC 단일 lib.rs → 13개 파일 (codex 위임). Pure move refactor.

```
src/
├── lib.rs              (44 LOC)  — crate docs + pub re-exports
├── types.rs            (65 LOC)  — SourceAsset, FbxBone, FbxBoneTrack, FbxSourceType, Error
├── raw.rs              (37 LOC)  — RawModel, RawAnimCurve, ... (pub(crate))
├── parse/
│   ├── mod.rs          (514 LOC) — top-level parse() + outer pull loop
│   ├── attrs.rs        (39 LOC)  — collect_attrs / drain_attrs
│   ├── model.rs        (127 LOC) — parse_model_pull + parse_properties70
│   ├── cluster.rs      (99 LOC)  — parse_cluster_pull (nested a 포함)
│   ├── anim_curve.rs   (141 LOC) — parse_anim_curve_pull + sample_curve
│   └── skip.rs         (29 LOC)
├── post_process.rs     (72 LOC)  — ensure_quat_continuity + inpaint_outliers
├── math.rs             (42 LOC)  — euler_to_quat
├── detect.rs           (37 LOC)  — detect_source_type
└── skeleton.rs         (141 LOC) — FbxSkeletonFrames + compute_fbx_skeleton*
```

Public API 완전 보존. 내부 심볼 11개 `pub` → `pub(crate)` 로 내림. Scope 경계가 파일 경계로 드러남 — "여기에 mesh 넣자" 제안이 오면 `parse/` 하위에 mesh 모듈이 없어서 구조 자체가 reject.

### 4. `341f384 refactor: rename fbx_rig crate to fbx_animation_importer`

Sonnet subagent에 위임. `git mv crates/fbx_rig crates/fbx_animation_importer`. Cargo.toml package name + description 업데이트. 모든 call site 업데이트 (humanoid_retarget, src/bin, tests, examples). alias는 유지: `pub use fbx_animation_importer as fbx;`.

**이름 결정 근거**: `fbx_rig` 는 "rig"에 animation curves가 포함되는지 모호. `fbx_animation_importer` 는 **"importer" 단어가 scope guard** 역할 — "여기 export 넣자", "runtime streaming 넣자", "mesh 넣자" 같은 제안 자동 차단. Shotloom 이식 시 이름은 `shotloom-fbx-animation-importer` (kebab-case 통일).

### 5. `f3050b9 chore: finish rename sweep and untrack stray lockfile`

Codex final review 결과 BLOCK 2건:
- `humanoid_retarget/src/source_anim.rs:3` 모듈 doc에 `fbx_rig` 잔존 → 업데이트
- `humanoid_retarget/Cargo.lock` tracked. pre-existing (2026-04-13 `ae18341`). `git rm --cached` + gitignore 추가

341f384의 "zero tracked-file hits" 주장은 off-by-one이었음. 이 커밋에서 정정 (amend 안 하고 새 커밋으로 이력 정직하게 유지).

---

## Gates 최종

- `cargo check --workspace` clean
- `cargo test -p fbx_animation_importer` — **15 passed** / 0 failed
- `cargo test -p humanoid_retarget` — **50 passed** / 0 failed
- `cargo clippy -p fbx_animation_importer -p humanoid_retarget -- -D warnings` clean
- `cargo fmt --check` clean

남은 `fbx_rig` grep 힛: `docs/devlog.md`, `docs/learnings-index.md`, `docs/retarget-refactor-proposal.md` — historical context, 변경 대상 아님.

---

## Codex / Sonnet 위임 흐름 (작업 메타)

이번 세션에서 배운 점: **Opus 메인 컨텍스트는 판단/합성에만, 나머지는 전부 위임**.

| 작업 | 위임 대상 | 이유 |
|---|---|---|
| 1188 LOC `lib.rs` 전면 코드 리뷰 | Codex | 긴 파일 전체 읽기 — 토큰 무거움 |
| 테스트 작성 (실제 값 캡처 + 7파일) | Codex | `cargo run` 으로 값 뽑아야 함 |
| 1275 LOC → 13 모듈 split | Codex | mechanical move, API 경계 유지 |
| Crate rename + 전체 call site 업데이트 | Sonnet subagent | 다파일 mechanical rename, light judgment |
| Final sanity review | Codex | 4커밋 sequence 검증, git grep sweep |
| P0 버그 수정 4건 | **Claude Opus 직접** | fix 위치 + 방향이 이미 명확, round-trip 오버헤드 > 직접 |
| 커밋 메시지 작성 | **Claude Opus 직접** | 판단 + 합성 필요 |

Memory에 `maximize-codex-sonnet` feedback 저장. 앞으로 default policy.

---

## 내일/다음 세션 할 일

### P4 — Shotloom 이식 (`shotloom-fbx-animation-importer`)

대기 중인 유일한 블록. 작업:

1. Shotloom 레포에 STL-76 Linear 이슈 생성 (초안 이미 준비돼 있음 — rename 반영 업데이트 필요)
2. `feat/shotloom-fbx-animation-importer` 브랜치 분기 (main from STL-74 머지 후)
3. `crates/shotloom-fbx-animation-importer/` 신설 — bevy-vrm 최신 13-file 구조 그대로 복사
4. `crates/shotloom-retarget/src/source_data.rs` 타입들을 신 크레이트로 이동 또는 re-export
5. Fixture 결정 — shotloom LFS에 올릴지 별도 fixture 쓸지 (9 MB 3개)
6. 동일 15 golden tests 실행해서 값 완벽 일치 검증 → migration 안전 확인

예상 시간: 2~3시간. Codex/Sonnet에 분담 가능.

### 잔류 bevy-vrm 스테일 4건 (codex 2번째 리뷰에서 나온 것)

- `rubric_c.rs:20` "C1.3 currently violates" — 2026-04-13 residual 재설계 이후 stale
- `TODO-scoring.md:19` C1.4 "size-normalized or direction-only" — 실제 landing은 "widen threshold"
- `metric_fixtures.rs:581` — 주석에 "size_ratio" normalization 언급, 실제 reject됨
- `adapters/mod.rs:6` + `metric_fixtures.rs:252` — 삭제된 `Retargeter` trait 언급

단일 chore 커밋으로 정리 가능. 급하지 않음.

---

## Commits

```
f3050b9 chore(fbx_animation_importer): finish rename sweep and untrack stray lockfile
341f384 refactor: rename fbx_rig crate to fbx_animation_importer
f55c4e2 refactor(fbx_rig): split lib.rs into focused modules
c22cb20 test(fbx_rig): golden regression suite + dev dump utility
01d4451 refactor(fbx_rig): harden parser and lock animation-only scope
```

Range: `09580ad..f3050b9` on `origin/main`.
