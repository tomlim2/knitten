# 2026-04-13 — retarget_test bin → evaluate_pipeline 통합 + C1.4 sanity (shotloom 포팅 #5a 마무리)

sweep bin이 이제 `humanoid_retarget::orchestrate::evaluate_pipeline`을 호출. inline A/B/C 배선 제거. shotloom 포팅 차단 5a가 실질적으로 끝남 (stub이 실제 entry로 전환됨).

## What

### 1. retarget_test bin 리팩터

`crates/humanoid_retarget/src/bin/retarget_test.rs`

Before: C-loop이 직접
- `retarget_with_skeleton(fbx_bytes, config_json, version)` 호출
- vrm_to_fbx 맵 빌드, fbx_root/fbx_hips 추출
- `ArpRetargeterInner::new` 인스턴스화 + `.apply(&anim)`
- `fk_evaluate::evaluate(...)`
- FBX 재파싱 → `src_rotations_by_vrm` 맵 수동 구성
- `rubric_c::evaluate(vrm_fk, fbx_skeleton, ..., Some(&src_rot_map))`

After:
```rust
let config = RetargetConfig::from_json(&config_json)?;  // 루프 밖 1회
...
let fbx_parsed = humanoid_retarget::fbx::parse(&fbx_bytes)?;
let pipeline = evaluate_pipeline(&fbx_parsed, vrm_rest, &config, *vrm_version);
match pipeline.gated_reason / .error / .rubric_c { ... }
```

### 2. Pre-gate 최적화

evaluate_pipeline이 내부에서 A/B 재계산 + gating 하지만, 이전 bin은 A/B를 각각 별도 loop에서 캐싱함. 캐시가 있는데 파일을 읽는 건 낭비라, C-loop 진입 시:
- `rubric_a_cache` 미스면 "GATED — rubric_a missing (upstream parse fail)" 행만 찍고 continue (파일 I/O 스킵)
- `score_b.first_hard_fail()` 있으면 "GATED — rubric_b hard fail" 행 찍고 continue

이 두 경우엔 evaluate_pipeline 호출 자체를 생략. 하드-페일 row가 제일 많이 찍히는 곳이라 I/O 절약 효과가 큼.

### 3. 검증

```
cargo test -p humanoid_retarget
→ 48 pass (lib 13 + bin/lib 13 + fixtures 14 + 기타)
```

```
cargo run --bin retarget-test -- assets/models assets/fbx assets/retarget/arp_body.json
→ Total: 209  Pass: 190  Fail: 0  Gated: 19
```

Pre-refactor sweep과 동일한 숫자 (regression 0).

## C1.4 sanity check (부수 수확)

Sweep 출력에 path_ratio detail이 그대로 찍혀서, 5b 준비용 데이터가 공짜로 들어옴.

### Observed path_ratio

- **vroid_1x_f_xiao / vroid_1x_m_c_normal** (표준 proportion)
  - `18271_F_AIDepressed` → 1.378 F (둘 다)
  - `18360_F_AIGracefulArms` → 1.20-1.21 C
  - `21353_F_AiHappy03C` → 1.21 C
  - `25_04206_F_AIStndMoveLocal` → 1.24 C
  - 나머지 대부분 A/B

- **vroid_1x_m_g_small** — path_ratio 전범위 0.69-0.78 → C/F 거의 고정

- **zepeto_1x_m_001** — path_ratio 0.27-0.63 → F 고정

### 해석

C1.4는 retargeter 품질이 아니라 **model proportion (Rubric B 영역)** 을 재고 있음. 오염 경로 두 개:

1. **Proportion 오염**: small 모델은 arm/leg가 짧아 effector path 길이도 짧음 → ratio 자동 <1 → F. retargeter가 뭘 해도 F.
2. **Denominator sensitivity**: source motion이 작을 때 (AIDepressed처럼) 분모가 작아서 VRM 측의 작은 변동이 ratio를 크게 흔듦 → 표준 모델인데도 1.378.

→ 둘 다 "retargeter가 얼마나 잘 매핑했는가"와 무관. Rubric C의 axis rule 위반 (input-output residual only).

### 재설계 방향 (5b에서 다룸)

옵션 A: size-normalize — path 길이 대신 direction-only. per-frame effector unit-vector를 src/vrm 양쪽에서 뽑아 correlation 측정.

옵션 B: path-shape 비교 — 각 side에서 path를 [0,1]로 arc-length 정규화 후 shape 유사도.

옵션 C: 아예 path 관점 버리고 joint-angle residual. 각 effector의 상위 조인트 회전각을 src/vrm에서 비교.

positional fixture 필요: 현재 fixture의 `bone_positions`가 static (rest-only)이라 어떤 residual metric이든 테스트 불가.

## TODO-scoring.md 동기화

`docs/TODO-scoring.md`가 pre-rubric RetargetScore/FootScore 시절에 멈춰있어서 전면 갱신:

- Completed: C1.2 sole_offset, C1.3 residual, orchestrate entry, postprocess module, body/facial split, sweep bin 통합
- Active (shotloom 포팅 잔여): C1.1/C1.4 redesign, positional fixture
- Archived: 구버전 RetargetScore/FootScore 시스템
- C1.4 진단 결과 캡처 (위 section)

## Commits

- `7d8f850` feat(retarget_test): route sweep bin through evaluate_pipeline
- `36178ac` docs(TODO-scoring): sync with rubric A/B/C state

Pushed to origin/main.

## 오늘 shotloom 포팅 상태

| # | 차단 | 상태 |
|---|------|------|
| 1 | SourceAnim body/facial split | ✅ 143e0ba |
| 2 | EXP-006 → postprocess module | ✅ 478f685 |
| 3 | Diagnostic conversion layer | ✅ 3302fa5 |
| 4 | A/B/C pipeline gating + rubric rename | ✅ ab2c175 |
| 5a | orchestrate::evaluate_pipeline stub | ✅ 82cda9d |
| 5a' | sweep bin이 stub 소비 | ✅ 7d8f850 (오늘) |
| 5b | C1.1/C1.4 residual 재설계 | ⬜ 다음 세션 |

5b만 남음. shotloom 포팅 차단 6개 중 5.5개 해제.

## Next session

1. **C1.1 residual 재설계** — output joint flex vs input joint flex 비교, `excess = max(0, out - max(limit, in))` 형태
2. **C1.4 residual 재설계** — 위 옵션 A/B/C 중 택일, identity retarget contract (rubric_c_identity_passthrough)로 검증
3. **positional fixture 추가** — per-frame `bone_positions` track이 있는 fixture. 없으면 residual metric 단위 테스트 의미 없음
4. 검증: 표준 vroid 모델이 C1.1/C1.4 모두 A 받아야 함
