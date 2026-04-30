---
title: Shotloom devlog 2026-04-30
tags:
  - shotloom
  - devlog
  - retarget
date: 2026-04-30
source: claude
---

# Shotloom devlog 2026-04-30

## STL-246 verification PR ([#216](https://github.com/CINEV/shotloom/pull/216))

Retarget 파이프라인의 캐릭터-모델 측 4-finger curl baseline 을 세 컨벤션 대표 fixture (1.x VRoid 표준 / 1.x backward / 0.x VRoid 표준) 에서 동시 검증하는 verification 트랙. 하루 종일 한 작업의 결과로 STL-260 산하 4-finger 트랙 (재활용된 STL-221) 의 verification anchor 가 [#216](https://github.com/CINEV/shotloom/pull/216) 으로 land 직전. 구현 본체는 별도 PR (STL-215) 로 분리.

### 큰 그림

normalize → align → retarget 파이프라인 중 character-model 단계의 finger 정합성. STL-127 normalizer 추출 이후 VRoid 1.x 표준 (xiao) 만 암묵적으로 동작 가정 + 회귀 가드 0. yoya backward 와 vrm0x-vroid-f-a 가 production retarget pipeline 에 통과시 normalize_vrm_bones_180y 가 root 180Y 를 잘 벗기는지 자동 가드 + 시각 가드 둘 다 부재. 이 PR 이 그 두 가드를 박음.

### Why

- xiao 만 가정 동작이라 다른 두 컨벤션 (yoya backward, vrm0x) 에서 손가락이 어색하게 굽거나 손목이 비틀려도 알 길이 없었음.
- normalize_vrm_bones_180y 가 backward / 0.x forward 180Y 를 둘 다 처리한다는 사실이 코드에는 있지만 회귀 테스트로 박힌 적 없음 — 누군가 normalizer 변경하면 silent regression 가능.
- `compute_axis_map` / `align_full_body_rest` 가 production retarget pipeline 에 wired-in 되어 있지 않다는 사실이 모듈 doc 에 명시되어 있지 않아 다음 사람이 "왜 안 굽지?" 추적할 때 시간 잡아먹음.

### How

1. 기존 작업 브랜치 (`feat/retarget-verify-finger-baseline-xiao-yoya`) 에 verification + 구현 8 커밋 섞여 있던 걸, 구현 4 커밋을 별도 브랜치 (`feat/retarget-four-finger-impl`) 로 분리해서 푸시 후 verification 브랜치는 reset --hard 로 verification-only 로 좁힘.
2. `tests/finger_axis_yoya_xiao.rs` 에 vrm0x-vroid-f-a 케이스 + 헬퍼 추출 + 모듈 doc 확장.
3. `examples/finger_compare.rs` (792줄) 를 fixtures.json preset 컨벤션 + ACTORS 슬라이스로 리팩토링 — 3-way 트리플 중복 (Snapshot 필드 / spawn 호출 / 매치 arms) 을 단일 슬라이스 + HashMap<VrmActor, ActorSnapshot> 으로 통합.
4. `review-audit-docs` 라는 새 스킬 (Explore subagent 디스패치) 만들어서 stale 코멘트 / 미래시제 / 깨진 cross-ref 등 doc-side 결함 자동 검출.
5. 위 스킬 1차 실행에서 `crates/shotloom-character-model-normalizer/src/finger_axis_map.rs:319` 의 `// Tests moved to crates/humanoid_retarget/...` (해당 path 미존재) 발견 → drive-by 로 정리.
6. 게이트 (fmt / clippy / test / doc-paths / ci-rust-coverage) 통과 → push → review-before-pr 클린 → PR draft 생성.

### What

- [#216](https://github.com/CINEV/shotloom/pull/216) — STL-246 verification PR, draft. 7 커밋, 5 파일, +1049/-3.
  - finger_compare visualizer (3 캐릭터 side-by-side, fixtures.json preset 1/8/13 사용)
  - wrist rest pose regression (yoya, vrm0x-vroid-f-a 둘 다 xiao 와 30° 이내)
  - finger_axis_map.rs 모듈 doc — backward-fixture handling + production-pipeline status 섹션 추가
  - drive-by: stale humanoid_retarget 코멘트 삭제
- 구현 보존 브랜치: `origin/feat/retarget-four-finger-impl` (4커밋, 미PR). STL-215 작업 시 cherry-pick 베이스.
- Linear 재구조화:
  - STL-221 재활용 → 4-finger 트랙 부모 (Backlog).
  - STL-215 재활용 → 4-finger 구현 자식 (Todo, parent=STL-221).
  - STL-246 → STL-221 자식으로 re-parent + 제목 확장 ("1x, 1x backward, 0x").
  - STL-261 → STL-260 자식으로 re-parent (4-finger 트랙 밖, 손목 별도 트랙).
- 새 스킬: `~/.claude/skills/review-audit-docs/SKILL.md` — pre-PR doc 감사 (subagent dispatch + 본인 verify + provenance 체크).

### 사이드 노트

- Linear MCP 의 `save_issue` 가 description bullet 안에 em-dash + backtick 조합이 들어가면 일부 bullet 을 silently drop 하는 패턴이 또 재현. 우회: bullet 을 평문 문장 (em-dash 대신 마침표) 으로 풀어 쓰면 통과. STL-221 / STL-215 description rewrite 한 번 더 해야 했음.
- `cargo clippy --workspace -- -D warnings` 가 examples 를 컴파일하지 않음 (default features 에 `examples` 포함 안 됨). examples 도 strict clippy 통과시키려면 `--features examples --all-targets` 명시 필요. 현 CI gate 는 안 거니 sibling fbx_viz 도 strict clippy 위반 보유 — 본 PR 은 같은 기준 유지.
- 구현 4 커밋 분리할 때 `git push -u origin feat/retarget-four-finger-impl` 후 `git reset --hard 6fc58fe` + `git push --force-with-lease` 순서로 처리 — 구현 보존 먼저, verification 브랜치 좁힘은 그 뒤. 역순이면 force-push 사고 시 구현 commit hash 분실 위험.
