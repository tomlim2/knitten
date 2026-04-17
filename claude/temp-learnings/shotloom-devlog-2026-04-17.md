---
title: 'Shotloom devlog 2026-04-17: STL-97 merge + STL-112 fix + STL-113 overhaul'
tags: [shotloom, devlog, stl-97, stl-112, stl-113, gltf, retarget]
date: 2026-04-17
---

# 2026-04-17: STL-97 머지 + STL-112 accessor 가드 + STL-113 VrmRestError 개편

## PR #85 — STL-97 vrm_extract boundary refactor (MERGED 14:17)

전날(2026-04-16) 오픈했던 PR. 오늘 머지 완료.

### 머지 직전 추가 커밋
- `1f279d6` — `ExtractedVrmRestData` pub 필드 rustdoc 추가. 자매 타입 `VrmRestPose`(shotloom-retarget)의 스타일과 맞춤. 좌표 프레임(post-normalization), bone-name keying, synthetic `VRMC_vrm.root_bone` 항목 설명.

총 9 commits, 최종 머지. STL-110 round-2 리뷰 P0/P1/P2 follow-up은 별도 이슈(STL-112/113)로 분리.

---

## PR #95 — STL-112 VRM accessor out-of-bounds 가드 (MERGED 16:36)

STL-110 follow-up 리뷰에서 ryumiel이 지적한 3개 항목을 STL-112로 분리.

### 대응 내역
- **P0 (5abada1)** — `compute_foot_contact`, `extract_mesh_min_y`의 `&accessors[i]` unchecked 인덱싱을 `accessors.get(i)?`로 교체. 악성 VRM(POSITION/JOINTS_0/WEIGHTS_0에 범위 초과 인덱스)이 panic 유발하지 않도록. 이미 `compute_foot_sole_offset_skinned`에서 쓰이던 안전 패턴 맞춰서 통일.
- **Minor (016844c)** — `docs/tech-debt/vrm-backward-facing-audit-policy.md`의 STL-97 포인터를 크레이트 이동 반영해서 업데이트.
- **nit (ba88599, 2719bfc)** — `extract_vrm_rest_data`의 parent-chain walk에 `resolve_global_mats` cycle-rejection invariant를 명시하는 load-bearing 주석 추가. 첫 번째 walk만 적고 올렸더니 리뷰어가 두 번째 walk(root-from-hips)에도 동일하게 달라고 해서 mirror.
- **test (fb137e0)** — accessor out-of-bounds 입력에 대한 회귀 테스트.
- **style (3ed7768)** — checked-access 체인 rustfmt 적용.

4 single-concern 커밋으로 분할. STL-112 완료, STL-110은 follow-up 계속.

---

## PR #97 — STL-113 VrmRestError 개편 (OPEN, CHANGES_REQUESTED)

14:47 KST 오픈. +210 / -64. ryumiel 리뷰 `CHANGES_REQUESTED` 상태.

### 대응 내역
- **76d7115** — stringly `VrmRestError` variant들을 typed wrapper로 교체. 에러 카테고리별로 명확한 타입화.
- **683894b** — mesh offset 산술을 `checked_mul` / `checked_add`로 가드. overflow 방지.
- **249869a** — `Normalize`, `MissingHumanoid` 에러 variant에 대한 테스트 커버.
- **64ef3bc** — PR #97 리뷰 피드백 대응 1차.

상태: 2차 리뷰 대기 중(ryumiel COMMENTED 07:13 + CHANGES_REQUESTED 07:16).

---

## caol-ila 설정 / 스킬

### `71ad8b8` (11:03) — review-ai-motion skill + standard
AI 생성 모션(FBX) 품질 평가 스킬. 7개 메트릭(foot skate, penetration, jitter, contact accuracy, pose plausibility, root correlation, loop gap)과 결함 귀속 매트릭스(Generator / Rig / Retarget / Physics / Viewer).

### `eb6515d` (16:34) — Group G structural review + auto-extend workflow
`review-code-rust.md`에 Group G(구조 컨벤션) 패턴 추가. 총 22개 패턴 → 확장. Shotloom PR #85 라운드 2 리뷰에서 학습한 패턴들을 복제-방지용 체크리스트에 반영.

### `7330507` (17:01) — private docs 이전
`~/.claude/private/`의 `learnings/`, `ops/`, shotloom-plans/ 하위 문서를 모두 `caol-ila/claude/temp-learnings/`로 이동. `hardware.json`, `repo-paths.json`만 private에 남김. 시스템 설정과 문서 성격 분리.

### `8a11a8d` (17:02) — shotloom-watch-pr skill 정리
어제(2026-04-16) 만든 스킬 및 devlog를 캐주얼 커밋으로 편입.

---

## STL-99 start gate

- PR #95 머지됨 ✅ → STL-99 착수 조건 충족.
- 남은 블로커: 리뷰어 큐 ≤ 2 조건. 현재 PR #97 1개 오픈 → 정상 범위.
- STL-99 plan(v2)은 `temp-learnings/stl-99-plan.md`에 이전 완료.

---

## 요약

- **머지 2건**: STL-97 (PR #85), STL-112 (PR #95)
- **오픈 1건**: STL-113 (PR #97) — changes requested, 2차 대응 대기
- **STL-110 follow-up 분할**: P0는 STL-112에서, 나머지는 STL-113에서 처리 중
- **개인 환경 정리**: review-ai-motion skill 추가, private → caol-ila 문서 이전
- **내일 예정**: STL-99 착수 (PR #97 2차 리뷰 대응 후 또는 병행)
