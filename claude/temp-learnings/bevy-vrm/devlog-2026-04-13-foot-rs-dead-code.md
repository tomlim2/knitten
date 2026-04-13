# 2026-04-13 — `foot.rs` 506 LOC 감사 결과

Tier1 세션의 미래 작업 #3 (`quality/foot.rs` 감사). **결론: 파일 전체가 dead code, 삭제 완료.**

## 감사

파일 구조 (506 LOC):

| 항목 | LOC | 내용 |
|------|-----|------|
| `FootScore` struct | 38 | 23개 필드 (sole min/max, contact tilt, bounce, body_bounce, height, forward_dot, warnings) |
| `validate_vrm_rest()` | 72 | VRM rest pose 검증 (sole offset, root 180°Y, hips/feet 위치, 좌우 대칭, foot_contact 일관성) |
| `VRM_HUMANOID_BONES` const | 17 | 51 humanoid bone 이름 리스트 |
| `BoneCoverage` + `check_bone_coverage()` | 65 | retarget output ↔ VRM rest bone matching diagnostics |
| `score_foot()` | 267 | FK + 5종 metric (ground/tilt/bounce/body_bounce/height) + forward facing 검증 |
| `Display for FootScore` | 29 | log 출력 |

## Caller 분석

`grep -r "score_foot\|FootScore\|validate_vrm_rest\|check_bone_coverage" --include='*.rs'` 결과:

- `quality/mod.rs` — `pub use foot::{...}` 재수출만
- `lib.rs` — `pub use quality::{..., FootScore, score_foot, validate_vrm_rest, ..., BoneCoverage, check_bone_coverage}` 재수출만
- `quality/foot.rs` — 자기 자신 (`score_foot`이 `validate_vrm_rest` 호출하는 한 줄)

**외부 caller 0건.** `src/`, `crates/humanoid_retarget/src/bin/`, `tests/`, 다른 quality 모듈, retargeter 어디에서도 호출 없음.

## 왜 dead code인가

`docs/devlog.md`와 `learnings-index.md` 타임라인을 보면:
- 2026-04-09: `FootScore`/`score_foot` 도입 (sole plane IK 작업)
- 2026-04-13 phase2-3 landing: rubric A/B/C 시스템이 본격 가동, `rubric_c.rs::C1.2_GroundContact`가 ground contact 채점 인계받음
- `score_foot`은 호출자를 못 만든 채로 남아있음

`validate_vrm_rest`은 `learnings-index.md`에 "validation으로 버그 자동 감지" 항목으로 기록되어 있지만, 실제 코드에서는 `score_foot` 내부 호출 외에 사용처 없음. 문서가 코드보다 살아있음.

## 검증

1. `pub mod foot;` + 두 곳의 `pub use` 제거
2. `crates/humanoid_retarget/src/quality/foot.rs` 삭제
3. `cargo check -p humanoid_retarget` → clean
4. `cargo check --workspace` → clean
5. `cargo test -p humanoid_retarget` → 14 lib + 13 integration = 27 pass
6. **Real sweep 209 pairings 재실행** → 등급 분포 baseline과 완전 동일

```
BEFORE: graded=190  A=9 B=75 C=66 F=40
AFTER:  graded=190  A=9 B=75 C=66 F=40
```

## 결과

| 항목 | 값 |
|------|------|
| 삭제 LOC | -506 |
| 변경 파일 | 3 (foot.rs 삭제, mod.rs/lib.rs 재수출 정리) |
| 등급 regression | 없음 |
| 테스트 | 27/27 pass |

커밋: `b15c4b1`

## 교훈

- 파일이 크다고 무조건 "감사 별도 세션"으로 미룰 게 아님. **call site grep을 먼저 하면 5분 안에 dead code 여부 판명**됨
- `pub use` 재수출은 dead_code warning을 가림 — 외부 user가 있을지도 모른다는 가정으로 컴파일러가 침묵. workspace 내부에서만 쓰는 코드라면 `pub use` 제거 후 warning 보고 판단할 것
- 새 시스템(rubric A/B/C) 도입 시 기존 코드의 인계 여부를 명시적으로 추적하지 않으면 dead code가 누적됨. 향후 큰 리팩토링 시 "이전 시스템의 각 함수가 새 시스템의 어떤 함수로 인계됐는가" 표를 만들어두면 청소하기 쉬움
- 문서가 코드보다 오래 살 수 있음 — `learnings-index.md`의 `validate_vrm_rest` 언급은 04-09 시점 사실이었지만, 04-13 이후엔 dead. 주말 sweep 시 동기화 필요

## 다음

#4 (Three-axis purity 리뷰)로 진행. fixture 설계 원칙 재평가, 가장 애매한 항목.
