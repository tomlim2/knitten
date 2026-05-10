# learn-archive-week reference

Expanded detail for the learn-archive-week skill. SKILL.md holds the happy path and critical permission gotcha; this file holds the full destination map, tag rules, and fallback heuristics.

---

## Destination path table (full)

| 분류 | 목적지 |
|------|--------|
| devlog (프로젝트 + 날짜) | `agent/projects/{project}/days/devlog-YYYY-MM-DD[-slug].md` |
| learning (범용 기술/개념) | `agent/learnings/{topic}.md` |
| learning (프로젝트 특화) | `agent/learnings/projects/{project}.md` |
| research/resource | `agent/research/{slug}.md` or `agent/references/{slug}.md` |
| ops (dispatch/result, task 기록) | `agent/projects/{project}/ops/{task-id}-{kind}.md` |
| stl-*-plan.md, shotloom-conventions | `agent/projects/shotloom-rd/` 아래 적절 위치 |
| codex-base (memories/order/rules/AGENTS) | `agent/references/codex-base/{path-preserved}.md` |
| word-of-the-day | `agent/learnings/word-of-the-day/YYYY-MM-DD.md` |

---

## Stage 2 — TAG_MAP (교체)

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

## Stage 2 — TAG_ADD (우산)

원본 유지하고 umbrella 태그 추가:
- git 계열: `lfs`/`stash`/`github-api`/`pr-workflow` → +`git`
- drinks 계열: `wine`/`whisky`/`champagne` → +`drinks`
- 3d-genai 계열: `hyper3d`/`nvidia`/`mesh-generation`/`world-generation` → +`3d-genai`
- VRM shader: `mtoon` → +`vrm`, +`toon-rendering`, +`shader`
- job-search: `interview` → +`job-search`
- ai 계열: `llm`/`prompt` → +`ai`

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

본문 H1이나 첫 문단 읽어서 확신 못 하면 파일명 그대로 `_cross-project/`에 둠.

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

## Legacy reference workflow (manual, pre-script)

Retained for historical context — the scripts now automate this flow.

### Step 1: 경로 + 주 범위 확정

1. `~/.claude/private/caol-config/machine-paths.json` 읽어서 `obsidian-vault-claude` 경로 추출
2. 오늘 날짜 기준 이번 주 월요일 00:00 계산 (`--week-start` 있으면 덮어씀)
3. 주 범위 = `[monday 00:00, today 23:59]`

### Step 2: 대상 파일 스캔

`find` 로 mtime 필터 → 분류 버킷으로 나눔: devlog / learning / ops / plan / codex-runs / codex-base / etc.

### Step 3: 기존 Obsidian 태그 조사

서브에이전트로 vault 전체 스캔 → 사용 중인 태그 풀 추출. 결과 캐시: `~/.claude/private/obsidian-tags.json` (7일 TTL).

### Step 4: 파일 변환 + 이동

파일 ≥10개면 서브에이전트로 나눔 (3~4개 병렬). 각 파일: 본문 읽기 → 주제 추론 → 기존 vault 충돌 확인 → frontmatter 작성 → 본문 정리 (H1 1개, 이미지 wikilink, 내부 링크 wikilink) → Write → 원본 삭제 (codex-base는 skip).

### Step 5: 검증 + 리포트

목적지 존재 + frontmatter 유효 + 삭제/복사 목록 + 태그 통계.

---

## 출력 포맷

```
Week: 2026-04-13 Mon ~ 2026-04-17 Fri
Scanned: 56 files (obsidian-staging: 48, codex-base: 8)
Archived: 54 files
  devlog: 22 → agent/projects/{proj}/days/
  learning: 11 → agent/learnings/
  ops: 13 → agent/projects/{proj}/ops/
  plan: 3 → agent/projects/shotloom-rd/
  reference: 5 → agent/references/codex-base/
Skipped: 2 files
  - {reason}
Deleted originals: 46 files (obsidian-staging)
Copied only: 8 files (~/.codex, kept in place)
```
