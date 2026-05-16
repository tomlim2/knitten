---
description: 오늘 할 일 / 오늘 한 일 브리핑 (KST 시간대 자동 분기)
argument-hint: "[--mode morning|midday|evening] [--context 회사|개인|부업]"
allowed-tools: Read, Write, Glob, Grep, Bash(git:*), Bash(date:*), Bash(find:*), Bash(gh:*), Bash(ls:*), Bash(diff:*), AskUserQuestion, mcp__claude_ai_Linear__list_issues
---

# caol-brief-today

Morning / evening briefing for the currently active `caol` context (회사/개인/부업). Time-aware: morning mode plans the day, evening mode recaps, midday is a tight status line.

## Purpose

- **Morning (05:00–12:00 KST)**: 오늘 뭐해야 하는지 — 어제 WIP, 리뷰, 열린 Linear, uncommitted.
- **Midday (12:00–16:00 KST)**: 점심 전후 한 줄 요약.
- **Evening (16:00–23:59 KST)**: 오늘 회고 + obsidian-staging 정리 + 중복 감지.
- **Weekend**: relaxed 모드 — 업무 레포 스킵, 개인 레포만, 짧게.

활성 컨텍스트는 `caol-switch-context`가 설정한 값. 회사 컨텍스트면 shotloom + CINEV 레포만.

## Arguments

- `--mode morning|midday|evening` — 시간대 자동 감지 덮어쓰기
- `--context 회사|개인|부업` — 활성 컨텍스트 덮어쓰기

**No mandatory args.** 빈 호출이 정상. 플래그는 디버그용.

## Execution

### Step 1: Detect KST time and mode

```bash
TZ=Asia/Seoul date +"%Y-%m-%d %H:%M %A"
```

Hour → mode:

| Hour (KST) | Mode |
|------------|------|
| 05:00–11:59 | `morning` |
| 12:00–15:59 | `midday` |
| 16:00–23:59 | `evening` |
| 00:00–04:59 | `evening` (야근, 전날 종합) |

`%A`가 `Saturday`/`Sunday` → `weekend: true`.

### Step 2: Resolve active context + Obsidian availability

1. **Obsidian 가용성** — `~/.claude/private/caol-config/machine-paths.json`의 `obsidian` 키:
   - 존재 → `obsidianAvailable = true`
   - 없음 → `obsidianAvailable = false`. **정상 상태** (회사 머신은 iCloud 없음). 에러 띄우지 말 것.
2. Active context:
   - `~/.claude/private/active-context.json` → `active`
   - 없으면 `회사` default.
3. `--context`가 있으면 덮어씀.
4. 대상 레포:
   - **회사**: shotloom, cinev-studio, cinev-engine, cinev-ta-tools (존재하는 것만)
   - **개인**: CINEV 소속 아닌 레포 (anju, bevy-vrm, ta-portfolio, mmd-anju 등)
   - **부업**: `resolve.sh doc tutoring` and `resolve.sh doc consulting` destinations. `obsidianAvailable == false`면 "vault 없어서 스킵" 한 줄.

### Step 3: Run mode-specific checks

See mode sections below. Output templates live in [reference.md](reference.md).

---

## Morning Mode

**목표**: 책상 앉자마자 오늘 진입점 찾게.

1. **어제부터 남은 것** — 레포별 `git status`, `git stash list`, `git log --since="yesterday"`. WIP/stash/local-only 브랜치 각각 emoji 표시.
2. **내게 온 PR/CI** (회사+평일 only): `gh pr list --author "@me" --state open --json ...`. 각 PR 한 줄.
3. **할당된 Linear** — `mcp__claude_ai_Linear__list_issues` assignee=me, state!=Done, priority 높은 순 5개. MCP 없으면 "Linear: unavailable".
4. **미정리 어제 일지** — `obsidian-staging` configured in `machine-paths.json`를 `find -mtime -2`. staging이 없으면 섹션 완전 생략.

---

## Midday Mode

**목표**: 짧게.

- **오전 커밋 요약**: `git log --since="today 00:00" --author=<user.email>` — 레포별 커밋 수 합계.
- **Output 3줄 이내.** 길면 의미 없음.

---

## Evening Mode

**목표**: 회고 + 정리.

1. **오늘 커밋 & PR** — `git log --since="today 00:00"` per repo. PR: `gh pr list --author "@me" --state all --search "updated:>=<today>"`.
2. **Gate (3E.2/3/4)**: `obsidian-staging`가 있을 때만 staging 섹션 실행. vault가 없으면 3E.1만 + "obsidian 없는 머신" 각주.
3. **obsidian-staging 승격 후보** — configured `obsidian-staging`에서 `find -newermt "<today>"`. H1 추출, 프로젝트 추측, 승격 경로 제안.
4. **중복 문서 감지** — `obsidianAvailable == true`일 때 최근 7일 vault 문서 파일명 normalize 비교 (1차), H1 Levenshtein ≤3 비교 (2차 필요 시). 본문 diff 안 함.
5. **오래된 staging** — configured `obsidian-staging`에서 `find -mtime +7` → `/learn-archive-week` 또는 삭제 제안.

---

## Weekend Mode Override

토/일:
- 회사 컨텍스트라도 업무 레포 스킵
- 개인 레포만
- PR / Linear 섹션 생략
- evening에 "이번 주 회고" (월~오늘 커밋 합계) 추가

---

## Output File (Optional)

**`obsidianAvailable == true`일 때만.** false면 저장 비활성.

저장 경로: `bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc daily`로 얻은 `daily/` 아래 `{YYYY-MM-DD}.md`.

같은 날짜 파일 있으면 **append** (덮어쓰지 말 것). Morning/Midday/Evening 각각 `## Morning`/`## Midday`/`## Evening` 섹션으로 누적.

`--no-save` 플래그로 저장 스킵.

---

## Related

- `caol-switch-context` — active context 결정
- `caol-check-status` — skill server 상태
- `learn-archive-week` — obsidian-staging 주간 아카이브
- `cci-summarize-commit` — CINEV 커밋 요약 (evening 일부 중복)
- `learn-log-day` — Obsidian projects 일일 로그

---

## Notes (CRITICAL)

- **KST 고정** — `TZ=Asia/Seoul` 모든 date 호출에 강제. 시스템 TZ 의존 금지.
- **시간 경계 조정 가능** — `~/.claude/private/brief-config.json`에서 덮어쓰기.
- **중복 감지는 보수적** — 파일명 + H1만. 본문 임베딩 비교 X (token 비용).
- **Linear / gh 실패 허용** — 네트워크 없으면 해당 섹션 skip.
- **Obsidian 없는 머신이 normal** — 회사 머신은 iCloud 동기화 없음. vault 중복 감지 / briefings 저장 스킵은 정상. "등록 필요"/"미비점" 같은 경고 띄우지 말 것.

## Additional Resources

For the full morning/midday/evening output templates with example emoji-decorated summaries, the gh/Linear fetch JSON schemas, and the normalize-filename/H1-Levenshtein duplicate detection logic, see [reference.md](reference.md).
