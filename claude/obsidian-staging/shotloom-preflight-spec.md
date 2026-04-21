---
title: "Shotloom Preflight Session — Spec Draft"
tags:
  - shotloom
  - claude-code
  - spec
  - preflight
date: 2026-04-21
source: claude
---

# Shotloom Preflight Session — Spec Draft

Session fork 기반 preflight 컨텍스트 재활용 설계. 베이스 세션에 규칙/컨벤션을 로드해두고, 포크 세션은 신선도 체크만 수행해 반복 비용을 절감한다.

---

## Problem

Shotloom 작업은 매 세션마다 preflight(`/shotloom-start-code`)가 수천 토큰의 규칙/컨벤션/ADR을 재로드한다. LLM stateless 특성상 불가피하지만, Claude Code 앱의 **세션 포크** 기능을 쓰면 규칙 레이어만 따로 떼어 재활용할 수 있다.

## Goals

- 규칙/표준 로드를 하루 1회로 축소
- 포크 세션의 신선도(freshness)를 자동 검증
- Stale base로 인한 CHANGES_REQUESTED 방지

## Non-Goals

- Linear 이슈별 컨텍스트 캐싱 (매번 fresh fetch)
- 코드 diff / 작업 상태 캐싱 (작업 오염 방지)
- 전체 preflight 재활용 — 규칙 레이어만

---

## Architecture

```
[Base Session: preflight-base]
  └── 규칙/표준/ADR 전부 로드
  └── manifest.json 생성
  └── "Ready for fork" 마커 출력
        │
        ├── fork → [Work Session A — STL-123]
        │           └── check-preflight 실행
        │           └── Linear fetch + 작업
        │
        └── fork → [Work Session B — STL-124]
                    └── check-preflight 실행
                    └── Linear fetch + 작업
```

---

## Component 1 — `shotloom-make-preflight`

베이스 세션 생성. 이 세션을 실제 작업에 쓰지 말고, 포크 원본으로만 보존한다.

### When to Run

- 하루 시작 (morning refresh)
- `docs/guidelines/**`, `docs/adr/**`, `AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `.agent/**` 변경 merge 직후
- `~/.claude/standards/shotloom-programming.md` 또는 `review-code-rust.md` 업데이트 직후

### Workflow

1. **Pre-flight 기본 체크** (shotloom-start-code Step 1 재활용)
   - cwd, gh auth, commit identity
2. **컨벤션 전체 읽기**
   - `AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `docs/adr/README.md`
   - `docs/guidelines/*.md` 전부
   - `.agent/*.md` 전부
3. **표준 전체 읽기**
   - `~/.claude/standards/shotloom-programming.md`
   - `~/.claude/standards/review-code-rust.md`
   - `~/.claude/standards/shotloom.md`
4. **Manifest 생성** → `.agent/preflight-manifest.json`
   ```json
   {
     "created_at": "2026-04-21T10:00:00+09:00",
     "git_head": "957a629",
     "files": {
       "AGENTS.md": { "hash": "sha256:...", "mtime": "..." },
       "docs/guidelines/review-rust.md": { "hash": "...", "mtime": "..." },
       ...
     },
     "external_files": {
       "~/.claude/standards/shotloom-programming.md": { "hash": "...", "mtime": "..." }
     }
   }
   ```
5. **Marker 출력**
   ```
   ✓ Preflight base ready — <timestamp>
   ✓ N files manifested
   → Fork this session for work. Do NOT edit here.
   ```
6. **STOP** — 코드 편집 금지. 사용자가 포크를 떠야 함.

### Output

- `.agent/preflight-manifest.json` (gitignored)

---

## Component 2 — `shotloom-check-preflight`

포크 세션에서 첫 호출. 신선도 확인.

### When to Run

- 포크 세션 시작 직후 (자동, hook으로 강제 가능)
- `/shotloom-start-code` 내부에서 base 세션 감지 시 자동 호출

### Workflow

1. `.agent/preflight-manifest.json` Read
2. 각 파일 현재 hash 계산 → 비교
3. 분기:

   | 상태 | 조건 | Action |
   |------|------|--------|
   | **Fresh** | 모든 hash 일치 | `✓ preflight fresh` 출력, 작업 진행 |
   | **Minor drift** | ADR index / docs 주석 / non-rule 변경만 | ⚠ 경고, 변경 파일 목록 출력, 계속 진행 |
   | **Major drift** | guidelines/*, review-rust.md, shotloom-programming.md, AGENTS.md, CLAUDE.md 변경 | 🛑 STOP. 베이스 폐기 + 새 베이스 생성 요구 |
   | **Age drift** | manifest age > 24h | ⚠ 경고, 사용자 확인 |

4. **Stale 감지 시 행동**
   - Major → `/shotloom-make-preflight` 재실행 요구, 현 세션 중단
   - Minor → 변경된 파일만 다시 Read (부분 refresh)
   - Fresh → skip, 바로 Step 2 (Linear fetch)로

### Classification Rules

**Major drift 파일 목록** (규칙 변경에 해당):
- `AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`
- `docs/guidelines/*.md`
- `docs/adr/0*.md` (number-prefixed ADR 본문)
- `~/.claude/standards/shotloom-programming.md`
- `~/.claude/standards/review-code-rust.md`
- `~/.claude/rules/shotloom*.md`

**Minor drift** (그 외 docs 변경)

---

## Component 3 — Documentation

### `.agent/preflight.md` (repo 내)

베이스 세션 운영 규칙 명시:

- 베이스 유효기간: 24시간 OR 주요 문서 변경까지 (둘 중 먼저 도래)
- 포크 후 첫 작업은 반드시 `shotloom-check-preflight`
- Stale 감지 시 강제 재생성
- Manifest는 `.gitignore`에 추가 (로컬 상태)

### `~/.claude/rules/shotloom.md` 업데이트

"Skill entry points" 섹션에 추가:
- `/shotloom-make-preflight` — 베이스 세션 생성 (하루 1회)
- `/shotloom-check-preflight` — 포크 세션 신선도 확인

---

## Open Questions

1. **Hook 자동화 범위**
   - `UserPromptSubmit` hook에서 `.agent/preflight-manifest.json` 존재 + stale 여부만 체크해 경고?
   - 아니면 `shotloom-start-code`가 manifest 감지 시 check-preflight 먼저 실행?
   - → 후자 추천 (hook 체인 복잡도 축소)

2. **Manifest gitignore vs commit**
   - 개인 베이스 상태 → gitignore 기본
   - 팀 공유 필요 시 `.agent/preflight-manifest.shared.json` 별도 트래킹?
   - → 일단 gitignore만

3. **Linear 이슈 캐싱 여부**
   - 같은 STL-NN 반복 작업 시 캐시?
   - → NO. Linear 상태는 자주 바뀜. 항상 fresh fetch.

4. **Base session 식별**
   - 세션이 "base"인지 "fork"인지 어떻게 구분?
   - manifest 생성 여부로 판단? 아니면 세션 메타데이터?
   - → manifest 파일 존재 + "DO NOT EDIT" 마커 파일 병행

5. **자동 재생성 (Cron?)**
   - 매일 오전 9시 자동 base 생성?
   - → 수동 실행 권장. 자동화는 v2.

---

## Implementation Plan

- [ ] Phase 1: `.agent/preflight.md` 문서 작성 (이 spec 기반)
- [ ] Phase 2: `shotloom-make-preflight` skill 작성
- [ ] Phase 3: `shotloom-check-preflight` skill 작성
- [ ] Phase 4: `shotloom-start-code`에 check-preflight 통합
- [ ] Phase 5: `~/.claude/rules/shotloom.md` 업데이트
- [ ] Phase 6: `.gitignore`에 `.agent/preflight-manifest.json` 추가

---

## Cost Estimate

- Base 생성: ~15k tokens (현재 preflight과 동일)
- Check: ~500 tokens (manifest read + hash 비교)
- Fork 세션당 절감: ~12k tokens (컨벤션 재로드 skip)
- 하루 3회 작업 가정: 약 **36k tokens/day 절감**

---

## Risks

- **False Fresh**: hash 같은데 의미 변경 (예: file mode change) — 실질적 영향 없음, 수용
- **Base 오염**: 누군가 base 세션에서 편집 시도 — "DO NOT EDIT" 마커로 경고, 강제 막기는 불가
- **Fork tree 혼동**: 포크의 포크 → stale 누적 — 1단계 포크만 권장, 문서화

#shotloom #claude-code #spec
