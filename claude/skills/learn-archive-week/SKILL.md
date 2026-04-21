---
description: "Weekly Obsidian maintenance — archive obsidian-staging + ~/.codex into vault, consolidate duplicate tags, fill missing tags from filenames. Three-stage pipeline: archive.py → tag_consolidate.py → fill_tags_from_name.py. Use on weekends."
argument-hint: "[--dry-run] [--stage archive|consolidate|fill|all]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(python3:*), Bash(find:*), Bash(ls:*), Bash(mkdir:*), Bash(rm:*)
user-invocable: true
---

# IMPORTANT: Permission gotcha

Sub-agents spawned via the `Agent` tool do **NOT** have write access to the iCloud Obsidian vault path (resolved via `obsidian-vault-claude` in `~/.claude/private/caol-config/machine-paths.json`). Only the main Claude Code session does.

**Therefore: run `archive.py` directly in the main session — do NOT delegate to subagents.**

# learn-archive-week

주간 Obsidian vault 정비 파이프라인. 평일에 `claude/obsidian-staging/`에 쌓인 devlog/learning/ops 문서와 `~/.codex/`에 업데이트된 문서를 주말에 vault로 정돈.

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
| `{obsidian-staging}/codex-runs/**/*.md` | 삭제 |
| `{obsidian-staging}/private-learnings/**/*.md` | 삭제 |
| `{obsidian-staging}/private-ops/**/*.md` | 삭제 |
| `{codex-home}/memories/*.md`, `{codex-home}/order/*.md`, `{codex-home}/rules/**/*.md`, `{codex-home}/AGENTS.md` | **복사만** (런타임 설정이라 삭제 금지) |

### Destination (Obsidian vault)

`{obsidian-vault-claude}/` 아래. 경로는 `~/.claude/private/caol-config/machine-paths.json` 의 `obsidian-vault-claude` 키에서 읽음.

| 분류 | 목적지 |
|------|--------|
| devlog (프로젝트 + 날짜) | `claude/projects/{project}/days/devlog-YYYY-MM-DD[-slug].md` |
| learning (범용 기술/개념) | `claude/learnings/{topic}.md` |
| learning (프로젝트 특화) | `claude/learnings/projects/{project}.md` |
| research/resource | `claude/research/{slug}.md` or `claude/references/{slug}.md` |
| ops (dispatch/result, task 기록) | `claude/projects/{project}/ops/{task-id}-{kind}.md` |
| stl-*-plan.md, shotloom-conventions | `claude/projects/shotloom-rd/` 아래 적절 위치 |
| codex-base (memories/order/rules/AGENTS) | `claude/references/codex-base/{path-preserved}.md` |
| word-of-the-day | `claude/learnings/word-of-the-day/YYYY-MM-DD.md` |

---

## Workflow

### 전체 실행 (주말 루틴)

```bash
cd ~/.claude/skills/learn-archive-week
python3 archive.py            # 1. 이번 주 파일 아카이빙 (MAPPING 업데이트 필요)
python3 tag_consolidate.py    # 2. 태그 통합 + 우산 적용
python3 fill_tags_from_name.py # 3. 파일명 기반 태그 보충
```

<<<<<<< HEAD
스크립트가 하는 일:
1. Hardcoded MAPPING (source → destination + tags) 기반 파일 처리
2. Frontmatter 자동 부여 (title H1에서 추출, date 파일명/mtime에서)
3. 기존 frontmatter 있으면 tag merge
4. 중복 H1을 H2로 강등
5. 목적지 덮어쓰기 전 `.bak` 백업
6. obsidian-staging 파일 삭제, ~/.codex 파일은 복사만
=======
### Stage 1: archive.py
>>>>>>> 273b30c (feat(skills): expand learn-archive-week to 3-stage pipeline)

이번 주 `{obsidian-staging}/*.md` + `{codex-home}/{memories,order,rules}/*.md` 을 vault로 이동 (경로는 `~/.claude/private/caol-config/machine-paths.json`에서).

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

**현재 TAG_MAP (교체)**
- `retargeting`, `shotloom-retarget` → `retarget`
- `bevy`, `bevy_vrm1` → `bevy-vrm`
- `daily-summary` → `devlog`
- `pr-review` → `pr-workflow`
- `codex-cli` → `codex-base`
- `naming`, `privacy-rule` → `conventions`
- `review-patterns` → `skill-review`
- `self-review` → `pr-workflow`
- `server` → `infra`
- `rendering` → `shader`
- `world-space` → `skeleton`
- `project/ue-live-scene-bridge` → `ue-live-scene-bridge`
- `www` → `web`
- `ue` → `unreal-engine` (버전 태그 `ue5`/`ue4`/`ue5d3`/`ue5d7`은 유지)
- `unreal5d3` → `ue5d3`, `unreal5d7` → `ue5d7`
- `npr` → `toon-rendering`

**현재 TAG_ADD (우산 — 원본 유지하고 umbrella 태그 추가)**
- git 계열: `lfs`/`stash`/`github-api`/`pr-workflow` → +`git`
- drinks 계열: `wine`/`whisky`/`champagne` → +`drinks`
- 3d-genai 계열: `hyper3d`/`nvidia`/`mesh-generation`/`world-generation` → +`3d-genai`
- VRM shader: `mtoon` → +`vrm`, +`toon-rendering`, +`shader`
- job-search: `interview` → +`job-search`
- ai 계열: `llm`/`prompt` → +`ai`

새 규칙 추가 시 스크립트의 `TAG_MAP`/`TAG_ADD` 딕셔너리 편집.

### Stage 3: fill_tags_from_name.py

vault 전체 스캔 → 파일명/경로 토큰으로 누락 태그 추론 후 추가.

- **RULES (파일명 정규식)**: `stash`/`pr-*`/`lfs`/`github-api` 등 → git 계열 태그 추가. `interview` → `interview`+`job-search`. `mtoon` → `mtoon`+`shader`. `wine`/`whisky`/`champagne` → `drinks`. `stl-NN` → `shotloom`. etc.
- **PROJECT_DIR_TAG (경로 디렉토리)**: `projects/bevy-vrm/*` → `bevy-vrm` 태그 자동 추가. shotloom-rd, mmd-anju, matcap-painter, cinev-studio, krafton-hackathon, job-search-2026 등 매핑.

이미 태그 있으면 skip (idempotent).

---

### (레퍼런스) 원칙

### Step 1: 경로 + 주 범위 확정

1. `~/.claude/private/caol-config/repo-paths.json` 읽어서 `obsidian` 경로 추출
2. 오늘 날짜 기준 이번 주 월요일 00:00 계산 (`--week-start` 있으면 덮어씀)
3. 주 범위 = `[monday 00:00, today 23:59]`

### Step 2: 대상 파일 스캔 (병렬)

`find` 로 mtime 필터 → 분류 버킷으로 나눔:

- **devlog** — 파일명에 `devlog-YYYY-MM-DD` 패턴
- **learning** — 파일명에 `learning-` 접두사
- **ops** — `private-ops/R-*.md`, `private-ops/T-*.md` 등
- **plan** — `stl-*-plan.md`, `shotloom-conventions-*.md`
- **codex-runs** — `codex-runs/**/*.md`
- **codex-base** — `~/.codex/memories|order|rules|AGENTS.md`
- **etc** — `word-of-the-day-*`, `resource-*`, `monthly-*`

### Step 3: 기존 Obsidian 태그 조사

서브에이전트로 Obsidian vault 전체 스캔 → 사용 중인 태그 풀 추출.

```
Agent(Explore): "grep -rE '^  - ' {vault}/claude/**/*.md frontmatter tags 모아서 빈도순 상위 50개"
```

결과는 `~/.claude/private/obsidian-tags.json` 에 캐시 (7일 TTL).

### Step 4: 파일 변환 + 이동 (병렬, 서브에이전트)

파일 ≥10개면 서브에이전트로 나눔 (`Agent(general-purpose)` 3~4개 병렬).
각 서브에이전트에 전달:

- 대상 파일 경로 목록 (5~15개)
- 기존 태그 풀 (Step 3 결과)
- 목적지 매핑 규칙
- 변환 규칙 (아래 Frontmatter/본문)

각 에이전트는 파일별로:

1. 본문 읽기 → 주제/프로젝트 추론
2. 기존 vault 에 동일 파일명 있는지 확인:
   - **있으면** frontmatter 검사 → 규약 미준수면 보강 (title/tags/date/source)
   - **없으면** 신규 파일 생성
3. Frontmatter 작성 (아래 규격)
4. 본문 정리:
   - H1은 frontmatter 직후 1개
   - 이미지 `![...](...)` → `![[...]]` wikilink 변환 (vault 내부 자산일 때)
   - 내부 참조 `{project}/...` → `[[노트명]]` wikilink
   - `---` 섹션 구분 유지
5. 목적지 경로에 Write
6. 원본 삭제 (codex-base는 skip)

### Step 5: 검증 + 리포트

1. 목적지에 모두 존재하는지 체크
2. 각 파일 frontmatter 유효 (title/tags/date/source)
3. 삭제된 원본 목록 출력
4. Skip된 codex-base 복사본 목록 출력
5. 태그 통계 (몇 개 파일이 어떤 태그 받았는지)

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
source: claude
---
```

### 태그 매칭 규칙

- **기존 vault 풀에 있는 태그 우선** — 새 태그 만들지 말고 유사 태그로 매핑
- **필수 태그** — `{project}` + `{kind}` (devlog/learning/ops/plan/reference)
- **선택 태그** — 본문에서 명확히 도출 가능한 주제 (`retarget`, `rust`, `skeleton` 등) 1~3개
- **없으면 비워둠** — 억지로 태그 붙이지 말 것

---

## 분류 휴리스틱

### Project 추론

| 파일명 힌트 | project |
|-------------|---------|
| `stl-*`, `shotloom-*` | `shotloom-rd` |
| `devlog-YYYY-MM-DD-*.md` in `bevy-vrm/` | `bevy-vrm` |
| `arp-*`, `retarget-*`, `fbx-*` | `bevy-vrm` (context 확인) |
| `minecraft-*` | `minecraft-server` 또는 `_cross-project` |
| `word-of-the-day-*` | word-of-the-day (learnings/ 아래) |

본문 H1이나 첫 문단 읽어서 확신 못 하면 파일명 그대로 `_cross-project/` 에 둠.

### Kind 분류

| 파일명/내용 힌트 | kind |
|-----------------|------|
| `devlog-` 접두사 + 날짜 | devlog |
| `learning-` 접두사 | learning |
| `R-NNN-dispatch/result`, `T-NNN-*` | ops |
| `stl-NNN-plan`, `*-conventions-*` | plan |
| `resource-`, 외부 리소스 링크집 | reference |
| `word-of-the-day-` | learning (word-of-the-day subdir) |

---

## 에러 처리

- **vault 경로 누락** — repo-paths.json 업데이트 요청 메시지
- **목적지 파일 충돌** — 기존 파일 frontmatter 검사 → 규약 준수면 skip, 미준수면 백업(`.bak`) 후 덮어쓰기
- **분류 실패** — 해당 파일은 `_cross-project/` 에 두고 리포트에 표시

---

## 출력 포맷

```
Week: 2026-04-13 Mon ~ 2026-04-17 Fri
Scanned: 56 files (obsidian-staging: 48, codex-base: 8)
Archived: 54 files
  devlog: 22 → claude/projects/{proj}/days/
  learning: 11 → claude/learnings/
  ops: 13 → claude/projects/{proj}/ops/
  plan: 3 → claude/projects/shotloom-rd/
  reference: 5 → claude/references/codex-base/
Skipped: 2 files
  - {reason}
Deleted originals: 46 files (obsidian-staging)
Copied only: 8 files (~/.codex, kept in place)
```

---

## Related

- `learn-log-day` — 주중 일지 기록 (이 스킬이 주말에 sweep)
- `~/.claude/standards/obsidian-format.md` — frontmatter/wikilink 규격
- `~/.claude/rules/obsidian.md` — 적용 규칙
