---
title: 'Shotloom devlog 2026-04-16: STL-96 review + STL-97 boundary refactor'
tags: [shotloom, devlog, stl-96, stl-97, retarget, gltf]
date: 2026-04-16
---

# 2026-04-16: STL-96 review response + STL-97 boundary refactor

## PR #83 — STL-96 180y normalization diagnostics

### 리뷰 대응 (ryumiel)

3개 인라인 코멘트 대응:

1. **L205 retraction** — `corrected_rotation_node_count`를 `corrected_root_count`로 복원. "root 180Y"가 repo 내 확립된 용어 (`has_180y_root` in retargeter.rs).
2. **L296 nit** — `debug_fix_root_180y` dead code 삭제 + lib.rs re-export 제거.
3. **L2664 P2** — negative test 2개 추가: `count_180y == 0` early-return + VRM1 passthrough.

CI: rustfmt 실패 → lib.rs re-export 줄바꿈 재배치 때문. `cargo fmt`으로 해결.

### shotloom-watch-pr skill

PR 대기방 스킬 생성. 1분 폴링으로 CI 체크, 새 코멘트, PR 상태 감시. CronCreate 기반, 세션 종료 시 소멸.

---

## STL-97 — vrm_extract.rs boundary refactor

### 리뷰어 설계 수용

리뷰어(ryumiel)가 큰 그림 제안:
- shotloom-retarget → shotloom-gltf 의존성 역전
- 815줄 monolith를 3개 composable helper로 분해
- retarget에 thin assembler (`build_from_bytes`) 유지

### 구현

**shotloom-gltf 헬퍼 3개 (naming 통일: `extract_*`):**
- `extract_humanoid_map(bytes)` — GLB 파싱 + humanoid bone mapping
- `extract_vrm_rest_data(humanoid)` — rest local/global transforms + parent hierarchy
- `extract_foot_contact_data(bytes, bone_world_position)` — skinned mesh foot contact

**shotloom-retarget:**
- `vrm_extract.rs` 삭제 — `build_from_bytes`를 `vrm_rest.rs`로 이동 (리뷰어 요청대로)
- `build_from_bytes(bytes)` — 3개 gltf 헬퍼 조립 → VrmRestPose
- `From<VrmFootContactData> for FootContactData` impl — boilerplate 제거
- `gltf = "1"` crate를 retarget에서 shotloom-gltf로 이동

**구조 리뷰 (structural review) 수정사항:**
- `HumanoidMap.json` → `pub(crate)` (gltf JSON 내부 노출 방지)
- 모듈 doc에 stage 순서 경고 추가
- `extract_vrm_rest_data` Result rationale doc 추가
- `FootContactData` 타입 미러 설계의도 doc 추가
- 4개 integration test 추가 (56 gltf tests total)

**docs:**
- ADR-0025 public surface table 업데이트
- tech-debt boundary doc → Resolved
- README module layout 업데이트

### 배운 것

**리뷰어 설계를 수용하는 것이 더 나은 결과를 낳는다** — 처음에 viewer 로컬 함수 + dev-dep 이동으로 "순수 transformation library"를 달성했지만, 리뷰어의 3-helper 분해가 더 composable하고 STL-99 (import layer)까지 내다본 설계였음.

**브랜치 정리 중요** — chore/vrm-extract-ownership 브랜치에 STL-96 커밋이 섞여서 혼란 발생. main에서 새 브랜치(`refactor/retarget-extract-boundary`)를 따서 깔끔하게 정리.

**amend 주의** — 큰 작업을 한 커밋에 amend로 쌓으면 리뷰어가 변경 추적 불가. 별도 커밋으로 분리해야 함.

**셀프리뷰는 코드 후, 커밋 전** — 22-pattern 체크리스트 + 구조 리뷰를 별도로 돌려야 모든 레이어 커버됨.

### 현재 상태

| 항목 | 상태 |
|------|------|
| PR #83 (STL-96) | MERGED |
| PR #85 (STL-97) | OPEN — https://github.com/CINEV/shotloom/pull/85 |
| shotloom-watch-pr | skill 생성 완료 |
