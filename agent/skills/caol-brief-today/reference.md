# caol-brief-today reference

Output templates and detail commands for the caol-brief-today skill. SKILL.md holds the workflow skeleton and critical rules (KST, obsidian gate); this file holds the concrete commands and example output blocks.

---

## Morning mode — commands

### 3M.1 어제부터 남은 것

```bash
git -C "{repo}" status --short
git -C "{repo}" stash list
git -C "{repo}" log --since="yesterday" --author="{user.email}" --oneline
```

- **uncommitted changes** → ⚠️ (어제 WIP)
- **stash 있음** → 📦 + stash message
- **local-only 브랜치** (no upstream, not `main`) → 🌱 (push 안 됨)

### 3M.2 PR/CI (회사 + 평일)

```bash
gh pr list --author "@me" --state open \
  --json number,title,url,reviewDecision,statusCheckRollup,headRefName \
  --repo CINEV/shotloom
```

Per PR 한 줄:
- `#97 feat/foo — APPROVED ✅ ready to merge`
- `#98 feat/bar — CHANGES_REQUESTED 🔴 2 comments`
- `#99 fix/baz — CI FAILING ⚠️`

### 3M.3 Linear

`mcp__claude_ai_Linear__list_issues` filter: `assignee=me, state!=Done, team=Shotloom (회사) OR TA (회사+CINEV)`. Priority 순 5개. MCP 미연결이면 "Linear: unavailable".

### 3M.4 미정리 어제 일지 (obsidianAvailable gate)

```bash
find "{obsidianClaudeDir}/obsidian-staging" -type f -name "*.md" -mtime -2
```

### Morning output template

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

## Midday mode — commands

```bash
for repo in {active_repos}; do
  git -C "$repo" log --since="today 00:00" --author="{user.email}" --oneline
done
```

### Midday output template

```
🕐 Midday check (12:34 KST)

오전 작업
  shotloom  3 commits (PR #97 rebase + conflict resolve)
  anju      0 commits

오후 추천 포커스
  - PR #97 review 대기 → 다른 이슈 픽업
  - STL-115 bundle-format 시작?
```

3줄 넘지 말 것.

---

## Evening mode — commands

### 3E.1 오늘 커밋 & PR

```bash
for repo in {active_repos}; do
  git -C "$repo" log --since="today 00:00" --author="{user.email}" --format="%h %s (%ar)"
done

gh pr list --author "@me" --state all \
  --search "updated:>=$(TZ=Asia/Seoul date +%Y-%m-%d)" \
  --json number,title,state,url --repo CINEV/shotloom
```

### 3E.2 승격 후보 (obsidianAvailable gate)

```bash
find "{obsidianClaudeDir}/obsidian-staging" -type f -name "*.md" \
  -newermt "$(TZ=Asia/Seoul date +%Y-%m-%d)"
```

각 파일: 첫 줄 H1 추출 + 프로젝트 추측 + 승격 경로 제안 `agent/projects/{project}/{filename}`.

### 3E.3 중복 감지

```bash
find "{obsidianClaudeDir}" -type f -name "*.md" \
  -newermt "$(TZ=Asia/Seoul date -v-7d +%Y-%m-%d)"
```

- **1차 (빠름)**: 파일명 normalize (`YYYY-MM-DD` prefix 제거, `-`/`_` 정규화, lowercase)
- **2차 (의심될 때만)**: H1 Levenshtein ≤ 3
- 3차 본문 diff 는 안 함 (token 비용)

같은 정규화 이름 2+ 또는 H1 일치 → "중복 후보". 판정은 user.

### 3E.4 오래된 staging

```bash
find "{obsidianClaudeDir}/obsidian-staging" -type f -name "*.md" -mtime +7
```

7일+ → `/learn-archive-week` 또는 삭제 제안.

### Evening output template

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
    → agent/projects/shotloom/shotloom-devlog-2026-04-20.md

🪞 중복 후보
  - shotloom-devlog-2026-04-17.md ↔ shotloom-devlog-2026-04-20.md
    (H1 유사: "Shotloom devlog" — 날짜만 다름, 의도적이면 OK)

🗑️  오래된 (7일+)
  - stl-99-plan.md  (last touched 2026-04-12)

👉 다음: obsidian-staging 승격 / archive 명령 실행?
```
