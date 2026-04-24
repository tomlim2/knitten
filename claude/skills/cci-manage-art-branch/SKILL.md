---
description: "Unified art branch manager. Auto-suggests next action based on day-of-week and branch state."
argument-hint: "[create|merge-prep|merge-notice|merge-result|cleanup|status]"
---

# cci-manage-art-branch

Unified orchestrator for CINEV art branch lifecycle. Run daily — it reads current state and day-of-week, then suggests or executes the right action.

## Purpose

Replaces 5+ separate commands with one entry point. Old commands (`/cci-art-create-branch`, `/cci-art-prepare-merge`, etc.) are thin redirects.

---

## Usage

```
/cci-manage-art-branch                  # Auto-suggest based on day + state
/cci-manage-art-branch create           # Create new art branch
/cci-manage-art-branch merge-prep       # Prepare merge branch + rebase
/cci-manage-art-branch merge-notice     # 머지 예고 (사전 알림, 머지 전)
/cci-manage-art-branch merge-result     # 머지 결과 (완료 통보, 머지 후)
/cci-manage-art-branch cleanup          # Cherry-pick remnants + delete old branch
/cci-manage-art-branch status           # Show current state + next action
```

### Naming Clarification (CRITICAL)

| Command | 한국어 | Timing | 목적 |
|---------|--------|--------|------|
| `merge-notice` | 머지 **예고** | 머지 **전** | "내일 아침 8시 30분에 머지합니다" |
| `merge-result` | 머지 **결과** | 머지 **후** | "머지 완료되었습니다 + 내역" |

`merge-notice`는 advance notice(사전 예고)이지 notification(결과 알림)이 아님.
혼동 시 상태 확인: `created` → 예고 전, `merge_noticed` → prep 전, `merge_prepared` → 결과 전.

---

## Configuration

Read repo path via `config.json` → `repo_key`, look up actual path from `~/.claude/private/caol-config/repo-paths.json`. All git commands run against that path.

---

## State Machine

```
created → merge_noticed → merge_prepared → merged/created → archived
             ↑ (Thu)         ↑ (Fri)           ↑ (Fri)
             예고만          rebase+MR       MR 머지 후 결과
                                   mid-week: back to created
                                   regular (Fri): → archived
```

### State Transitions

| Action | From State | To State |
|--------|-----------|----------|
| `create` | (none / archived / merged) | `created` |
| `merge-notice` | `created` | `merge_noticed` |
| `merge-prep` | `merge_noticed` | `merge_prepared` |
| `merge-result (mid-week)` | `merge_prepared` | `created` |
| `merge-result (regular)` | `merge_prepared` | `merged` |
| `cleanup` | `merged` | `archived` |

A branch can be merged multiple times per week. Mid-week merges return to `created`; regular Friday merge → `merged` → `archived`. See reference.md "Multi-Merge Support" for the `merges[]` JSON shape.

---

## Auto-Suggestion Matrix

When `/cci-manage-art-branch` runs with no args:
1. Read `~/.claude/private/art-branches.json`
2. Determine current branch + state
3. Check day-of-week: `date '+%A'` (system is already KST — do NOT override with `TZ='Asia/Seoul'`)

| Day | State | Suggestion |
|-----|-------|------------|
| Sat-Sun | * | 주말 — "왜 왔어요? 쉬세요!" |
| Mon | merged / archived / none | `create` |
| Mon | created | `status` (already created this week) |
| Tue-Wed | created | `status` (work in progress) |
| Thu | created | `merge-notice` (내일 머지 예고만) |
| Thu | merge_noticed | `status` (예고 완료, 내일 머지 대기) |
| Fri | merge_noticed | `merge-prep` (rebase + MR) |
| Fri | merge_prepared | Auto-verify merge branch, then `merge-result` if merged |
| Fri | merged | `cleanup` |
| Any | * | Show state + available actions |

**Note:** `create`는 `merged` 상태에서도 실행 가능. 새 브랜치 먼저 만들고 이전 브랜치 cleanup은 별도.

### Emergency Merge (긴급)

`merge-notice` 생략 후 바로 `merge-prep` 가능. 상태가 `created`인데 `merge-prep` 요청 시:
1. 경고 표시: "현재 상태가 `created`입니다. `merge-notice` 없이 진행합니다."
2. 사용자 확인 후 진행
3. 상태를 `merge_prepared`로 직접 전환

### Merge Branch Auto-Verification (state=merge_prepared)

Do NOT ask — check programmatically:

```bash
git -C <repo_path> fetch --all
git -C <repo_path> branch -r --list "origin/<merge_branch>"
git -C <repo_path> log origin/develop --oneline -20 --grep="<merge_branch>"
```

| Remote branch | Develop log | Result |
|---------------|-------------|--------|
| Gone | Contains merge | **Merged** — proceed to `merge-result` |
| Still exists | — | **Not merged** — show "MR 아직 머지되지 않음" and stop |
| Gone | No match | **Ambiguous** — ask user |

When verified as merged, skip confirmation and execute `merge-result` immediately.

---

## Sub-Commands Overview

Each sub-command follows the detailed procedure in [reference.md](reference.md).

- **`create`** — new branch from `origin/develop`, cherry-pick remnants (**date-based** `--after="<merge_created_at>"`, NOT SHA-based diff), push, Slack, update JSON.
- **`merge-prep`** — checkout art branch, create `art/merge/<versioning>`, rebase on `origin/develop`, push, update JSON with merge info, generate MR description.
- **`merge-notice` (머지 예고, 머지 전)** — "내일 아침 8시 30분에 머지합니다" 형태 사전 알림 to Slack thread. 머지 시간 사용자 확인 후 전송.
- **`merge-result` (머지 결과, 머지 후)** — 커밋 분석, 한국어 PM 요약, Slack broadcast + 스레드 상세.
- **`cleanup`** — remnant 커밋 cherry-pick, 이전 브랜치 삭제.
- **`status`** — 현재 브랜치, state, 생성일, 최근 커밋, next action suggestion.

---

## Slack Rules (CRITICAL)

1. **Always use `send.py` scripts** from `scripts/`. NEVER use Claude AI Slack MCP tools.
2. **Always `--dry-run` first** → preview → user confirmation → send.
3. **Thread info** from `~/.claude/private/slack_threads.json`.

Script paths (relative to `~/.claude/skills/cci-manage-art-branch/`):
- `scripts/send_create.py <branch> [--dry-run]`
- `scripts/send_notice.py <branch> --time "<time>" [--dry-run]`
- `scripts/send_result.py <branch> --file <path> [--broadcast] [--dry-run]`
- `--list` on each to show thread info.

---

## Data Files

| File | Purpose |
|------|---------|
| `~/.claude/private/art-branches.json` | Branch history, current branch, state |
| `~/.claude/private/slack_threads.json` | Slack thread metadata per branch |
| `~/.claude/private/art-merge-stats/*.json` | Merge summaries (Korean PM format) |
| `~/.claude/config/slack.json` | Channel IDs, message templates |
| `~/.claude/config/.env` | `SLACK_BOT_TOKEN` |

---

## Legacy Commands

| Old Command | Redirects To |
|-------------|-------------|
| `/cci-art-create-branch` | `/cci-manage-art-branch create` |
| `/cci-art-prepare-merge` | `/cci-manage-art-branch merge-prep` |
| `/cci-art-send-merge-notice` | `/cci-manage-art-branch merge-notice` |
| `/cci-art-send-merge-result` | `/cci-manage-art-branch merge-result` |
| `/cci-art-remove-branch` | `/cci-manage-art-branch cleanup` |

`/cci-art-send-notice` remains independent (general-purpose Slack message, not part of the state machine).

## Additional Resources

For sub-command step-by-step procedures, the `merges[]` JSON shape, multi-merge broadcast conventions, legacy-data inference rules, display format examples, and Slack broadcast message templates, see [reference.md](reference.md).
