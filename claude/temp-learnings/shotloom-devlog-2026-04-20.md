---
title: "Shotloom devlog — 2026-04-20"
tags:
  - devlog
  - shotloom
  - stl-106
date: 2026-04-20
source: claude
---

# Shotloom devlog — 2026-04-20

STL-106 VRM 1.x backward-root 대응 + 리뷰 피드백 반영. Claude Code 스킬 네임스페이스도 `meta-*` → `caol-*` 로 정리.

---

## Shotloom — STL-106 (PR #111)

VRM 1.x 입력에서 backward-facing 캐릭터가 180도 돌아간 채로 로드되던 문제 수정.

### 커밋

- `a4e1918` feat(gltf): normalize backward root on VRM 1.x sources
  - `normalize_vrm_bones_180y` 를 VRM 1.x 브랜치에도 적용
  - 새 진단 코드: `normalized_backward_root_180y_vrm1` (0.x 와 구분)
  - normalized cache v2 → v3 (stale 아티팩트 재생성)
  - 합성 unit test + `minjoon-1x-backward.vrm` fixture 회귀 테스트
- `b1d8191` docs(vrm): backward-root audit policy 확장
  - `review-code-rust.md` A2/G6/G5 셀프리뷰 대응
  - 잘못된 fixture 경로 주석 수정, 0.x-only 설명 제거, 두 코드의 severity 분리 가능성 명시
- `47e3e9e` feat(retarget): viewer VRM bytes → `normalize_vrm` 경유
  - `examples/viewer.rs` 가 raw bytes 를 직접 넘기던 걸 runtime 과 동일한 normalize 경로로 라우팅
  - 실패 시 raw fallback 유지 (smoke tool 성격)
  - 신규 crate 의존성 없음 (`shotloom-gltf` 이미 존재)
- `25be39f` test(gltf): vrm1 forward passthrough byte-identity + fixture 주석
  - PR #111 nit 대응: forward VRM1 passthrough 를 진단 부재가 아니라 byte-identity 로 직접 검증
  - cross-crate fixture resolver 의도 주석화
  - audit policy 문서의 "single diagnostic" → "pair of diagnostics"

### 다음

- PR #111 리뷰 대기 / 머지 후 stale 캐시 이슈 없는지 확인
- backward-root audit policy 에서 두 진단 코드 severity 정책 최종 결정

---

## caol-ila — 스킬 카테고리 리네임

- `meta-*` → `caol-*` (16 개 스킬). cross-ref 전체 업데이트.
- 신규 스킬: `caol-brief-today` (아침/점심/저녁 브리핑, obsidianAvailable gating 포함)
- `shotloom-open-web` 스킬 초안 (WASM + Vite 런처)
- `standards/slash-commands.md` 에 Frontmatter Reference (전체 필드 테이블) + 스킬/커맨드 precedence + 문자열 치환 + dynamic shell 주입 섹션 추가
- `caol-make-skill` reference.md 분리

---

## 메모

- **Obsidian 미등록 머신** 이라 devlog 는 `caol-ila/claude/temp-learnings/` 에 저장 후 push. 나중에 vault 있는 머신에서 `claude/projects/shotloom/` 로 이관.
