---
title: "Day 8 (05-15): PR #340 wrapup"
tags:
  - type/devlog
  - project/shotloom
  - area/game-dev
date: 2026-05-15
day: 8
source: agent
---

# Day 8 (05-15): PR #340 wrapup

## [PR #340](https://github.com/CINEV/shotloom/pull/340)

1. 지적 — exact string assertion은 invariant와 wording을 한 줄에 묶는다.
   리뷰는 `rest_align_invariant.rs`의
   `"[STAGE-4.UserCalibrated] 10 bones synced"` exact match가 count
   invariant와 log wording을 동시에 고정한다고 봤다. Count는 별도
   `overrides.len()` assertion이 이미 소유하므로, 메시지 wording은 stable
   prefix만 검증하는 쪽이 맞다. → `4ebc0ef5`에서 Stage 4 assertion을
   UserCalibrated prefix check로 낮추고 cardinality pin은 별도 assertion에
   남겼다.

2. 지적 — fixture matrix는 선택 기준을 call site에 둬야 한다.
   리뷰는 `default_pose_recalibration.rs`의 preset list가 14개 fixture 중
   왜 6개인지 설명하지 않는다고 지적했다. Coverage matrix는 테스트 이름만
   보고 복원되면 안 되고, 새 fixture가 추가될 때 포함 여부를 판단할 기준이
   옆에 있어야 한다. → `4ebc0ef5`에서 preset list 위에 set/version bucket
   rationale을 추가했다.

3. 지적 — shared fixture loader를 복제할 때는 mirror임을 표시한다.
   리뷰는 `fixture_presets.rs`와 같은 fixture shape/helper가 통합 테스트에
   다시 생기면서 duplicate source of truth가 된다고 지적했다. 구조를 바로
   공통 모듈로 올리지 않을 때도, 복제임을 표시해야 다음 field 추가 시 두
   call site가 같이 보인다. 이 원칙은
   `docs/guidelines/documentation-standard.md`의 duplicate-source 경고와
   같은 방향이다. → `4ebc0ef5`에서 local fixture subset mirror comment를
   추가했다.

4. 지적 — matrix loop 하나는 실패 가시성을 숨긴다.
   리뷰는 6개 preset을 한 `#[test]` loop로 돌리면 첫 실패 뒤의 preset
   regressions가 같은 run에서 보이지 않는다고 봤다. Failure message에
   label이 있어도 cargo의 per-test reporting과 parallelism은 잃는다. →
   `4ebc0ef5`에서 macro-backed helper로 preset별 test를 분리했다.

5. 지적 — integration test는 topology presence만으로 behavior survival을
   주장하면 약하다. 리뷰는 DEFAULT_POSE bone 이름이 output에 있다는
   assertion만으로는 rotation frame이 실제로 살아났는지 확인하지 못한다고
   지적했다. End-to-end pin은 최소한 output bone이 retarget rotation을
   가진다는 점까지 확인해야 한다. → `4ebc0ef5`에서 각 DEFAULT_POSE output
   bone의 rotation count를 검증했다.

6. 지적 — README의 strategy 이름은 cold reader가 grep하지 않게 풀어 쓴다.
   리뷰는 `ScalarCurl`이 code enum 이름인데 새 문서 문장 안에서 설명 없이
   등장한다고 지적했다. `docs/guidelines/documentation-standard.md`의
   독자 중심 문서 원칙상, implementation term은 처음 등장할 때 역할을
   붙여야 한다. → `4ebc0ef5`에서 ScalarCurl을 Stage 3 finger-axis
   derivation으로 풀어 썼다.

> [!abstract] Rule
> Test PR에서 invariant는 한 assertion에 하나의 책임만 둔다. Count,
> message shape, behavior survival을 한 줄에 묶으면 다음 calibration
> 변경이 실제 회귀인지 wording drift인지 구분하기 어렵다. #rule

> [!tip] fixture matrix
> Curated fixture list는 "왜 이 fixture들인가"를 list 근처에 적는다. Matrix
> rationale이 PR body에만 있으면 다음 fixture 추가자가 테스트 파일 안에서
> coverage policy를 복원할 수 없다.
