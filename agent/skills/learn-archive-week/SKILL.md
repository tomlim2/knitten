---
description: "Weekly Obsidian maintenance — archive obsidian-staging + ~/.codex into vault, consolidate tags, fill missing tags."
argument-hint: "[--dry-run] [--stage archive|consolidate|fill|all]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(python3:*), Bash(find:*), Bash(ls:*), Bash(mkdir:*), Bash(rm:*)
user-invocable: true
---

# IMPORTANT: Permission gotcha

Sub-agents spawned via the `Agent` tool do **NOT** have write access to the iCloud Obsidian vault path (resolved via `obsidian-vault-claude` in `~/.claude/private/caol-config/machine-paths.json`). Only the main Claude Code session does.

**Therefore: run `archive.py` directly in the main session — do NOT delegate to subagents.**

# learn-archive-week

주간 Obsidian vault 정비 파이프라인. 평일에 `agent/obsidian-staging/`에 쌓인 devlog/learning/ops 문서와 `~/.codex/`에 업데이트된 문서를 주말에 vault로 정돈.

## 3단계 파이프라인

| 단계 | 스크립트 | 역할 |
|------|---------|------|
| 1. 아카이빙 | `archive.py` | obsidian-staging + ~/.codex 문서를 vault로 이동 (frontmatter 자동 부여) |
| 2. 태그 통합 | `tag_consolidate.py` | 의미 중복 태그 교체 (TAG_MAP) + 우산 태그 추가 (TAG_ADD). vault 전체 스캔 |
| 3. 태그 보충 | `fill_tags_from_name.py` | 파일명/경로로부터 누락된 태그 추론해서 추가. vault 전체 스캔 |

각 단계는 **idempotent** — 중복 실행해도 문제 없음. `.obsidian/`, `.trash/`만 제외하고 vault 전체가 관리 대상.

> 머신 한정 절대경로(`obsidian-staging`, `codex-home`, `obsidian-vault-claude`)는 `~/.claude/private/caol-config/machine-paths.json`에서 읽어온다. `repo-paths.json`은 기존 git 레포 경로 전용이라 건드리지 않는다.

---

## Arguments

- `[--dry-run]` — 실제 이동 없이 분류 결과만 출력
- `[--week-start YYYY-MM-DD]` — 주 시작일 (기본: 이번 주 월요일 00:00)

**인자 없이 호출 시 바로 실행 (이번 주 월~오늘 기본값). Dry-run 원하면 `--dry-run` 명시.**

---

## Scope

### Source (이번 주 월 00:00 ~ 지금 범위 mtime)

| 경로 | 처리 후 원본 |
|------|--------------|
| `{obsidian-staging}/*.md` (최상위) | 삭제 |
| `{obsidian-staging}/bevy-vrm/**/*.md` | 삭제 |
| `{obsidian-staging}/private-learnings/**/*.md` | 삭제 |
| `{obsidian-staging}/private-ops/**/*.md` | 삭제 |
| `{codex-home}/memories/*.md`, `{codex-home}/order/*.md`, `{codex-home}/rules/**/*.md`, `{codex-home}/AGENTS.md` | **복사만** (런타임 설정이라 삭제 금지) |

### Destination (Obsidian vault)

`{obsidian-vault-claude}/` 아래. 경로는 `machine-paths.json` 의 `obsidian-vault-claude` 키에서 읽음. 분류별 목적지 매핑은 reference.md 참조.

---

## Workflow

### 전체 실행 (주말 루틴)

```bash
cd ~/.claude/skills/learn-archive-week
python3 archive.py            # 1. 이번 주 파일 아카이빙 (MAPPING 업데이트 필요)
python3 tag_consolidate.py    # 2. 태그 통합 + 우산 적용
python3 fill_tags_from_name.py # 3. 파일명 기반 태그 보충
```

### Stage 1: archive.py

이번 주 `{obsidian-staging}/*.md` + `{codex-home}/{memories,order,rules}/*.md` 을 vault로 이동.

- Hardcoded `MAPPING` 리스트 (source → destination + tags) 기반
- Frontmatter 자동 부여 (title H1에서 추출, date 파일명/mtime에서)
- 기존 frontmatter 있으면 tag merge
- 중복 H1을 H2로 강등
- 목적지 덮어쓰기 전 `.bak` 백업
- obsidian-staging 파일 삭제, ~/.codex 파일은 복사만

**매주 돌릴 때**: `MAPPING` 리스트를 그 주 파일에 맞게 업데이트 후 실행.

**Permission gotcha**: iCloud vault 경로는 subagent write 권한 없음. 메인 세션에서만 실행.

### Stage 2: tag_consolidate.py

vault 전체 스캔 → `TAG_MAP` (교체) + `TAG_ADD` (우산 추가) 적용.

현재 규칙은 스크립트의 `TAG_MAP`/`TAG_ADD` 딕셔너리에 정의됨. 새 규칙 추가 시 스크립트 편집. 전체 rule set은 [reference.md](reference.md) 참조.

### Stage 3: fill_tags_from_name.py

vault 전체 스캔 → 파일명/경로 토큰으로 누락 태그 추론 후 추가.

- **RULES (파일명 정규식)**: `stash`, `pr-*`, `lfs`, `github-api` → git 계열. `interview` → `interview`+`job-search`. `mtoon` → `mtoon`+`shader`. `wine`/`whisky`/`champagne` → `drinks`. `stl-NN` → `shotloom` 등.
- **PROJECT_DIR_TAG (경로)**: `projects/bevy-vrm/*` → `bevy-vrm`. shotloom-rd, mmd-anju, matcap-painter, cinev-studio, krafton-hackathon, job-search-2026 등.

이미 태그 있으면 skip (idempotent).

---

## Frontmatter 규격

```yaml
---
title: "간결한 문서 제목"
tags:
  - {project}          # bevy-vrm, shotloom-rd, cinev-studio, matcap-painter 등
  - {kind}             # devlog, learning, ops, plan, reference
  - {topic}            # retarget, rust, skeleton 등 기존 풀에서 매칭
date: YYYY-MM-DD
source: agent
---
```

### 태그 매칭 규칙 (CRITICAL)

- **기존 vault 풀에 있는 태그 우선** — 새 태그 만들지 말고 유사 태그로 매핑
- **필수 태그** — `{project}` + `{kind}` (devlog/learning/ops/plan/reference)
- **선택 태그** — 본문에서 명확히 도출 가능한 주제 1~3개
- **없으면 비워둠** — 억지로 태그 붙이지 말 것

---

## 에러 처리

- **vault 경로 누락** — `machine-paths.json` 업데이트 요청
- **목적지 파일 충돌** — 기존 frontmatter 규약 준수면 skip, 미준수면 `.bak` 백업 후 덮어쓰기
- **분류 실패** — `_cross-project/`에 두고 리포트에 표시

---

## Related

- `learn-log-day` — 주중 일지 기록 (이 스킬이 주말에 sweep)
- `~/.claude/standards/obsidian/obsidian-format.md` — frontmatter/wikilink 규격
- `~/.claude/rules/obsidian.md` — 적용 규칙

## Additional Resources

For the full destination path table, complete `TAG_MAP`/`TAG_ADD` rule set, project-inference heuristics, kind-classification rules, and the output report format, see [reference.md](reference.md).
