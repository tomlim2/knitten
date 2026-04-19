---
description: 오늘 할 일 / 오늘 한 일 브리핑 (KST 시간대 자동 분기)
argument-hint: "[--mode morning|midday|evening] [--context 회사|개인|부업]"
allowed-tools: Read, Write, Glob, Grep, Bash(git:*), Bash(date:*), Bash(find:*), Bash(gh:*), Bash(ls:*), Bash(diff:*), AskUserQuestion, mcp__claude_ai_Linear__list_issues
---

# caol-brief-today

Morning / evening briefing for the currently active `caol` context (회사/개인/부업). Time-aware: morning mode plans the day, evening mode recaps, midday is a tight status line.

## Purpose

- **Morning (05:00–12:00 KST)**: 오늘 뭐해야 하는지 — 어제부터 남은 것, 내게 온 리뷰, 열린 Linear 이슈, uncommitted WIP 목록.
- **Midday (12:00–16:00 KST)**: 점심 전후 한 줄 요약. 지금까지 뭐했고 오후 포커스는 뭔지만.
- **Evening (16:00–23:59 KST)**: 오늘 뭐했나 회고 + 일지 임시저장소(obsidian-staging) 정리 후보 + 중복 문서 감지.
- **Weekend**: relaxed 모드 — 업무 레포는 건너뛰고 개인 레포만, 짧게.

활성 컨텍스트는 `caol-switch-context` 가 설정한 값을 사용. 회사 컨텍스트면 shotloom + CINEV 레포만 대상.

## Arguments

- `--mode morning|midday|evening` — 시간대 자동 감지를 덮어쓸 때만
- `--context 회사|개인|부업` — 활성 컨텍스트를 덮어쓸 때만

**No mandatory args.** 빈 호출이 정상 동작. 플래그는 디버그/수동 지정용.

## Execution

### Step 1: Detect KST time and mode

```bash
TZ=Asia/Seoul date +"%Y-%m-%d %H:%M %A"
```

Parse hour → route:

| Hour (KST) | Mode |
|------------|------|
| 05:00–11:59 | `morning` |
| 12:00–15:59 | `midday` |
| 16:00–23:59 | `evening` |
| 00:00–04:59 | `evening` (야근으로 간주, 전날 종합) |

`$ARGUMENTS` 에 `--mode` 있으면 강제.

**요일 체크**: `%A` 가 `Saturday` / `Sunday` → `weekend: true` 플래그. 이후 Step 3 에서 회사 레포 스킵 규칙에 사용.

### Step 2: Resolve active context + Obsidian availability

1. **Obsidian 가용성 체크** — `repo-paths.json` 의 `obsidian` 키 확인:
   - 키 있음 + 경로 존재 → `obsidianAvailable = true`, `obsidianClaudeDir = {obsidian}/claude`
   - 키 없음 OR 경로 없음 → `obsidianAvailable = false`
   - **이건 정상 상태다**. 회사 머신은 iCloud 동기화가 없어서 vault 자체가 없음. 에러 / 경고로 표시하지 말 것. obsidian 의존 섹션은 조용히 스킵.
2. Active context 결정:
   - `obsidianAvailable` 이면 `{obsidianClaudeDir}/contexts.json` 의 `active` 필드
   - 아니면 `~/.claude/private/active-context.json` 의 `active` 필드 (fallback)
   - 둘 다 없으면 `회사` (default)
3. `--context` 인자 있으면 덮어씀
4. 컨텍스트별 대상 레포 결정:
   - **회사**: `shotloom`, `cinev-studio`, `cinev-engine`, `cinev-ta-tools` (존재하는 것만)
   - **개인**: `anju`, `bevy-vrm`, `ta-portfolio`, `mmd-anju` 등 `repo-paths.json` 에서 CINEV 소속 아닌 레포
   - **부업**: Obsidian vault 의 `tutoring/lessons/`, `consulting/` 스캔. `obsidianAvailable == false` 면 부업 컨텍스트는 "vault 없어서 스킵" 한 줄만 표시.

### Step 3: Run mode-specific checks

---

## Morning Mode

**목표**: 책상 앉자마자 오늘 진입점 찾게.

### 3M.1 어제부터 남은 것

대상 레포 각각:

```bash
git -C "{repo}" status --short
git -C "{repo}" stash list
git -C "{repo}" log --since="yesterday" --author="{user.email}" --oneline
```

- **uncommitted changes** 있는 레포 → ⚠️ 표시 (어제 작업 중 멈춘 WIP)
- **stash 있는 레포** → 📦 표시 + stash message
- **local-only 브랜치** (no upstream, not `main`) → 🌱 표시 (push 안 된 작업)

### 3M.2 내게 온 PR 리뷰 / CI 상태

회사 컨텍스트 + 평일일 때만:

```bash
gh pr list --author "@me" --state open --json number,title,url,reviewDecision,statusCheckRollup,headRefName --repo CINEV/shotloom
```

각 PR 에 대해 한 줄:
- `#97 feat/foo — APPROVED ✅ ready to merge`
- `#98 feat/bar — CHANGES_REQUESTED 🔴 2 comments`
- `#99 fix/baz — CI FAILING ⚠️`

### 3M.3 할당된 Linear 이슈

`mcp__claude_ai_Linear__list_issues` 에 filter:
- assignee=me, state!=Done, team=Shotloom (회사) 혹은 TA (회사 + CINEV 쪽)
- Priority 높은 순 5개

MCP 미연결이면 "Linear: unavailable" 한 줄로 스킵.

### 3M.4 미정리 어제 일지

**Gate**: `obsidianAvailable == true` 일 때만 실행. false 면 이 섹션 완전 생략 (출력에서 헤더도 빼라 — "스킵됨" 같은 줄도 불필요).

```bash
find "{obsidianClaudeDir}/obsidian-staging" -type f -name "*.md" -mtime -2
```

2일 내 추가/수정된 obsidian-staging 파일 목록. "정리 대기" 섹션에 표시.

### 3M.5 Output

```
══ 오늘 (2026-04-20 Mon, 회사) ═════════════════

🌅 Morning brief

⚠️ WIP 남은 것
  shotloom  feat/viewer-1x-backward-load  modified: 4 files, 1 stash
  anju      main                           clean

📣 리뷰/CI 대기
  #97 refactor(gltf): VrmRestError ─ MERGEABLE ✅ (just rebased)

📋 Linear (상위 5)
  [STL-115] bundle-format: camera_preset 타입 정의  P2
  [STL-113] VrmRestError overhaul                   P3 (in review)
  ...

📝 정리 대기 (obsidian-staging)
  - shotloom-devlog-2026-04-17.md
  - stl-114-plan.md

👉 오늘 시작: STL-115 부터? (WIP stash 복원 먼저 권장)
```

---

## Midday Mode

**목표**: 점심 전후 상황 체크. 짧게.

### 3D.1 오전 커밋 요약

```bash
for repo in {active_repos}; do
  git -C "$repo" log --since="today 00:00" --author="{user.email}" --oneline
done
```

레포별 오늘 커밋 수 합계 한 줄.

### 3D.2 Output

```
🕐 Midday check (12:34 KST)

오전 작업
  shotloom  3 commits (PR #97 rebase + conflict resolve)
  anju      0 commits

오후 추천 포커스
  - PR #97 review 대기 → 다른 이슈 픽업
  - STL-115 bundle-format 시작?
```

※ midday 는 3줄을 넘지 마라. 길면 의미 없음.

---

## Evening Mode

**목표**: 오늘 뭐했는지 회고 + obsidian-staging 정리 + 중복 문서 감지.

### 3E.1 오늘 커밋 & PR

```bash
for repo in {active_repos}; do
  git -C "$repo" log --since="today 00:00" --author="{user.email}" --format="%h %s (%ar)"
done
```

```bash
gh pr list --author "@me" --state all --search "updated:>=$(TZ=Asia/Seoul date +%Y-%m-%d)" --json number,title,state,url --repo CINEV/shotloom
```

**Gate (3E.2 / 3E.3 / 3E.4)**: `obsidianAvailable == true` 일 때만 실행. false 면 3개 섹션 완전 생략. 대신 3E.1 결과만 보여주고 "obsidian 없는 머신 — 오늘 커밋 요약만 제공" 한 줄 각주.

### 3E.2 오늘 추가된 obsidian-staging → 승격 후보

```bash
find "{obsidianClaudeDir}/obsidian-staging" -type f -name "*.md" -newermt "$(TZ=Asia/Seoul date +%Y-%m-%d)"
```

각 파일에 대해:
- 첫 줄 H1 추출
- 관련 프로젝트 추측 (파일명 / frontmatter tags 에서)
- 승격 대상 경로 제안: `claude/projects/{project}/{filename}`

### 3E.3 중복 문서 감지

Obsidian vault `claude/` 전체 스캔:

```bash
find "{obsidianClaudeDir}" -type f -name "*.md" -newermt "$(TZ=Asia/Seoul date -v-7d +%Y-%m-%d)"
```

최근 7일 문서끼리 비교:
- **1차 (빠름)**: 파일명 normalize 비교 (`YYYY-MM-DD` prefix 제거, `-` / `_` 정규화, lowercase)
- **2차 (의심될 때만)**: H1 제목 유사도 — 완전 동일 or Levenshtein distance ≤ 3
- 3차 본문 diff 는 안 함 (비용 너무 큼)

같은 정규화 이름이 2개 이상이거나 H1 완전 일치면 "중복 후보" 로 표시. 판정은 user 에게 맡김.

### 3E.4 오래된 obsidian-staging archive 후보

```bash
find "{obsidianClaudeDir}/obsidian-staging" -type f -name "*.md" -mtime +7
```

7일 이상 손 안 댄 파일은 `/learn-archive-week` 로 넘기거나 삭제 제안.

### 3E.5 Output

```
══ 오늘 (2026-04-20 Mon, 회사) ═════════════════

🌇 Evening recap

📝 오늘 작업
  shotloom  3 commits
    6d12885  fix(gltf): address pr #97 review feedback (8h ago)
    9d2d430  test(gltf): cover Normalize / MissingHumanoid (8h ago)
    ...
  PR #97    MERGEABLE → 머지 대기

📤 obsidian-staging 승격 후보 (오늘 추가)
  - shotloom-devlog-2026-04-20.md
    → claude/projects/shotloom/shotloom-devlog-2026-04-20.md

🪞 중복 후보
  - shotloom-devlog-2026-04-17.md ↔ shotloom-devlog-2026-04-20.md
    (H1 유사: "Shotloom devlog" — 날짜만 다름, 의도적이면 OK)

🗑️  오래된 (7일+)
  - stl-99-plan.md  (last touched 2026-04-12)

👉 다음: obsidian-staging 승격 / archive 명령 실행?
```

---

## Weekend Mode Override

요일이 토/일이면:
- 회사 컨텍스트라도 업무 레포 스킵
- 개인 레포만 훑음
- PR / Linear 섹션 생략
- evening 모드에서 "이번 주 회고" 한 블록 추가 (월요일부터 오늘까지 커밋 합계)

## Output File (Optional)

**`obsidianAvailable == true` 일 때만**. false 면 파일 저장 기능 자체가 비활성.

실행 결과를 Obsidian vault 에 저장:

```
{obsidianClaudeDir}/briefings/{YYYY-MM-DD}.md
```

같은 날짜 파일 있으면 append (덮어쓰지 말 것). Morning / Midday / Evening 각각 `## 🌅 Morning` / `## 🕐 Midday` / `## 🌇 Evening` 섹션으로 누적.

`--no-save` 플래그 있으면 저장 스킵.

## Files

- `SKILL.md` — 이 파일. 실행 로직 전부 인라인.

## Related

- `caol-switch-context` — active context 를 결정
- `caol-check-status` — skill server / refs 상태
- `learn-archive-week` — obsidian-staging 주간 아카이브
- `cci-summarize-commit` — CINEV 오늘 커밋 요약 (evening 모드와 일부 중복, 이 스킬이 더 넓음)
- `learn-log-day` — Obsidian projects 에 일일 로그 추가

## Notes

- **KST 고정** — `TZ=Asia/Seoul` 를 모든 date 호출에 강제. 시스템 TZ 에 의존하지 마라.
- **시간 경계는 조정 가능** — 사용자가 "나는 06시 시작" 이면 `~/.claude/private/brief-config.json` 에서 덮어쓰기.
- **중복 문서 감지는 보수적** — 파일명 + H1 만. 본문 임베딩 비교는 token 비용이 커서 제외.
- **Linear / gh 실패 허용** — 네트워크 없으면 해당 섹션 skip, 나머지는 계속 진행.
- **Obsidian 없는 머신이 normal** — 회사 머신은 iCloud 동기화가 없어서 vault 자체가 없음. obsidian-staging / 중복 감지 / briefings 저장 섹션을 건너뛰는 건 에러가 아니라 정상. 사용자에게 "등록 필요" / "미비점" 같은 경고 메시지를 띄우지 말 것.
