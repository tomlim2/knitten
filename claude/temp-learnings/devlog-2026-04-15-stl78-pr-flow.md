---
title: '04-15 (저녁): STL-78 PR #72 — 3회 셀프리뷰도 못잡은 5건, 패턴 13-17 추가'
tags: [devlog, shotloom, stl-78, pr-workflow, self-review, review-patterns]
date: 2026-04-15
---

# 04-15 (저녁): STL-78 PR #72 — 3회 셀프리뷰도 못잡은 5건, 패턴 13-17 추가

## 1. 왜 이 기록을 남기나

3회 Codex 셀프리뷰를 돌렸는데 Copilot이 PR 열리자마자 5건을 추가로 잡았다. 이번 기록은 "왜 3번이나 봤는데도 놓쳤나"를 구조적으로 역추적하고, 그 결과를 review pattern 확장으로 남기기 위한 것.

## 2. 세션 흐름 (요약)

1. STL-78 핸드오프 이어받음
2. Layer 1 scaffold + 13 modules 포팅 + 33 tests
3. Codex background 메커니컬 포팅 silent fail -> 직접 폴백
4. Body/Face mode `modes.rs` + `validate_for_mode`
5. Layer 2 `import_fbx_to_cache` (`import_vrm_to_cache` 미러링)
6. Layer 3 viewer + `fbx_viz` gizmo example
7. ADR-0024 + `MAP.md` + `adr/README.md`
8. Codex 셀프리뷰 round 1 -> BLOCK + SHOULD + NIT -> fixup
9. PR #66 Copilot 16건 역분석 -> 12 패턴 체크리스트 + 스킬 편입
10. Codex 셀프리뷰 round 2 -> BLOCK + SHOULD -> fixup
11. CI Markdown Lint MD051 dead anchor -> fixup
12. Codex 셀프리뷰 round 3 narrow scope -> clean
13. PR #72 open
14. Copilot 5건 (BLOCK 1 + SHOULD 2 + NIT 2)
15. 원인 분석 -> 패턴 13-17 추가

## 3. 놓친 5건 vs 12 패턴

| Copilot 발견 | 관련 패턴 | 왜 fire 안 함 |
|---|---|---|
| `types.rs` 12 MB vs 3.2 MiB | 없음 | 수치 주장 축 부재 |
| cache version misnomer | Pattern 1 변형 | naming은 symbol이라 doc 중심 Pattern 1 fire 안 함 |
| `RotationOrder` `0..=5` range | Pattern 10 cross-crate 변형 | Pattern 10이 해당 파일 안 catch-all만 보고 cross-crate 의존을 못 봄 |
| byte-compare 불필요 | 없음 | content-addressable invariant 위반 축 없음 |
| Windows rename | 없음 | 플랫폼 portability 축 없음 |

## 4. 원인 분석 — 구조적 빈틈 5개

1. Cross-crate silent fallback 블라인드
2. Mirror existing pattern = 상속된 버그
3. Round 3 narrow scope가 묵은 코드를 가림
4. Architectural invariant drift 검증 축 부재
5. 플랫폼 portability blind spot

## 5. 확장한 패턴

- Pattern 13: Cross-layer silent fallback
- Pattern 14: Architectural invariant drift
- Pattern 15: Mirrored-pattern inheritance
- Pattern 16: Quantitative comment accuracy
- Pattern 17: Platform portability
- `cci-codex-review-rust` 스킬이 이미 auto-context로 쓰이므로 다음부터 자동 적용됨.

## 6. Codex 활용 관찰

잘 동작한 것:
- 단일 파일 doc 생성
- 1 commit range review
- reverse-engineer 리스트
- reply draft

실패한 것:
- `run_in_background` + 장문 prompt = silent fail (0 bytes)
- 직접 폴백이 더 빨랐다

다음 룰:
- foreground only
- output 0 bytes면 즉시 silent fail 판정
- 2개 이상 디렉토리 cross-reference는 Codex에 넘기지 말 것

## 7. 프로세스 교훈

- 장기 PR 마지막 라운드는 full-branch 스윕
- Mirroring 결정은 pre-audit 단계 분리
- 체크리스트로 generalist 흉내 불가 — 체크리스트 + generalist 병행
- macOS only 가정 -> Windows Tauri 빌드 깨뜨림

## 8. PR #72 최종 상태

- 5 commits (`eb865fd`, `6c00a7a`, `6e9182d`, `9f6888e`, `3f3650f`)
- 317 tests pass
- `fmt` / `clippy` / `doc-paths` / 17-pattern self-review 모두 clean
- Copilot 5건 reply 포스트 완료

## 9. 후속 이슈

- STL-89 (`evaluate_pipeline` 공개 + ARP->VRM wiring) 올려둠
- 후속 아이디어: VRM 쪽 `import_vrm_to_cache`에도 같은 byte-compare 단순화 적용 (`STL-NN` 후보)

## 10. 참고

- PR #72 URL
- STL-89
- handoff devlog
- STL-74 revision devlog
- `shotloom-review-patterns.md`
- `cci-codex-review-rust` 스킬

#devlog #shotloom #stl-78 #pr-workflow #self-review #review-patterns
