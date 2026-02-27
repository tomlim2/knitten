---
description: "Unified art branch manager. Auto-suggests next action based on day-of-week and branch state."
argument-hint: "[create|merge-prep|merge-notice|merge-result|cleanup|status]"
---

# cocv-manage-art-branch

Unified orchestrator for CINEV art branch lifecycle. Run daily — it reads the current state and day-of-week, then suggests or executes the right action.

## Purpose

Replaces the need to remember which of 5+ separate commands to run. One entry point (`/cocv-manage-art-branch`) handles routing, state tracking, and action suggestion.

Existing individual commands (`/cocv-art-create-branch`, `/cocv-art-prepare-merge`, etc.) remain untouched and functional.

---

## Usage

```
/cocv-manage-art-branch                  # Auto-suggest based on day + state
/cocv-manage-art-branch create           # Create new art branch
/cocv-manage-art-branch merge-prep       # Prepare merge branch + rebase
/cocv-manage-art-branch merge-notice     # 머지 예고 (사전 알림, 머지 전)
/cocv-manage-art-branch merge-result     # 머지 결과 (완료 통보, 머지 후)
/cocv-manage-art-branch cleanup          # Cherry-pick remnants + delete old branch
/cocv-manage-art-branch status           # Show current state + next action
```

### Naming Clarification

| Command | 한국어 | Timing | 목적 |
|---------|--------|--------|------|
| `merge-notice` | 머지 **예고** | 머지 **전** | "내일 아침 8시 30분에 머지합니다" |
| `merge-result` | 머지 **결과** | 머지 **후** | "머지 완료되었습니다 + 내역" |

`merge-notice`는 advance notice(사전 예고)이지 notification(결과 알림)이 아님.
혼동 시 상태를 확인: `merge_prepared` → 예고 전, `merge_noticed` → 결과 전.

---

## Configuration

Read repo path via `config.json` → `repo_key`, then look up the actual path from `~/.claude/private/repo-paths.json`.

All git commands run against the resolved repo path.

---

## State Machine

Each history entry in `art-branches.json` has a `state` field:

```
created → merge_prepared → merge_noticed → merged/created → archived
                                              ↑
                                   mid-week: back to created
                                   regular (Fri): → archived
```

### State Transitions

| Action | From State | To State |
|--------|-----------|----------|
| `create` | (none / archived) | `created` |
| `merge-prep` | `created` | `merge_prepared` |
| `merge-notice` | `merge_prepared` | `merge_noticed` |
| `merge-result (mid-week)` | `merge_noticed` | `created` |
| `merge-result (regular)` | `merge_noticed` | `merged` |
| `cleanup` | `merged` | `archived` |

### Multi-Merge Support

A single art branch can be merged multiple times per week.

- **Mid-week merge**: state returns to `created` after merge-result
- **Regular merge (Friday)**: state goes to `merged` → `archived`

Merges are tracked in a `merges[]` array:

```json
{
  "branch": "art/art-main-1.5.0-r5",
  "state": "created",
  "merges": [
    {
      "number": 1,
      "type": "mid-week",
      "merge_branch": "art/merge/art-main-1.5.0-r5",
      "merge_branch_head": "28ecdab9...",
      "merged_at": "2026-02-26T08:00:00+09:00"
    }
  ]
}
```

- `type`: `"mid-week"` or `"regular"`
- `number`: sequential merge count per branch (1, 2, 3...)
- Merge branch naming for #2+: `art/merge/art-main-1.5.0-r5-2`

### Slack Broadcast Convention

| Type | Broadcast message suffix |
|------|-------------------------|
| Regular | (없음) |
| Mid-week | `(중간 머지 #N)` |

### Legacy Data Inference

If a history entry has no `state` field, infer it:

| Condition | Inferred State |
|-----------|---------------|
| Is `current` AND no `merges` (or empty) | `created` |
| Is `current` AND has `merges` but old format `merge_branch` field | migrate to `merges[]` |
| Is NOT `current` | `archived` |

When inferring state, write it back to `art-branches.json` so future reads are clean.

---

## Auto-Suggestion Matrix

When `/cocv-manage-art-branch` runs with no arguments:

1. Read `~/.claude/private/art-branches.json`
2. Determine current branch and its state
3. Check day-of-week (KST)
4. Suggest the next action:

| Day | State | Suggestion |
|-----|-------|------------|
| Mon | merged / archived / none | `create` — new weekly branch |
| Mon | created | `status` — already created this week |
| Tue-Wed | created | `status` — work in progress |
| Thu | created | `merge-prep` then `merge-notice` |
| Thu | merge_prepared | `merge-notice` |
| Fri | merge_noticed | `merge-result` (after MR is merged) |
| Fri | merged | `status` — cycle complete |
| Any | * | Show state + list available actions |

### Display Format

```
Art Branch Status
─────────────────
Branch:  art/art-main-1.5.0-r5
State:   created (since 2026-02-24)
Day:     Monday

→ Suggested: status (branch already created this week)

Available actions: create, merge-prep, merge-notice, merge-result, cleanup, status
```

If the user confirms the suggestion, execute the corresponding sub-command.

---

## Sub-Commands Overview

Each sub-command follows the detailed procedure in [reference.md](reference.md).

### `create`
Create new art branch from `origin/develop`, cherry-pick weekend commits from current branch, push, send Slack announcement, update `art-branches.json`.

### `merge-prep`
Checkout art branch, create `art/merge/<versioning>` branch, rebase on `origin/develop`, push, update `art-branches.json` with merge info, generate MR description.

### `merge-notice` (머지 예고 — 머지 **전**)
머지 **하기 전** 사전 알림. "내일 아침 8시 30분에 머지합니다" 형태의 예고를 Slack 스레드에 전송. 머지 시간을 사용자에게 확인 후 전송.

### `merge-result` (머지 결과 — 머지 **후**)
머지 **완료 후** 결과 통보. 머지된 커밋 분석, 한국어 PM 요약 생성, Slack broadcast + 스레드 상세 전송.

### `cleanup`
Find remnant commits after merge branch tip, cherry-pick into current branch, delete old branch from remote.

### `status`
Display current branch, state, creation date, recent commits, and day-based next action suggestion.

---

## Slack Rules

1. **Always use existing `send.py` scripts** from the respective skill directories. NEVER use Claude AI Slack MCP tools.
2. **Always `--dry-run` first** → show preview → get user confirmation → send.
3. **Thread info** is loaded from `~/.claude/private/slack_threads.json`.
4. **MCP tools** (`slack_post_message`, `thread_save`, etc.) are used only for `create` sub-command (matches existing `cocv-art-create-branch` behavior).

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

## Files

```
cocv-manage-art-branch/
├── SKILL.md        # This document (orchestrator, routing, state machine)
├── reference.md    # Detailed sub-command procedures
└── config.json     # repo_key configuration
```

---

## Related Skills

| Skill | Still works independently |
|-------|--------------------------|
| `cocv-art-create-branch` | Yes — `/cocv-art-create-branch` unchanged |
| `cocv-art-prepare-merge` | Yes — `/cocv-art-prepare-merge` unchanged |
| `cocv-art-send-merge-notice` | Yes — `/cocv-art-send-merge-notice` unchanged |
| `cocv-art-send-merge-result` | Yes — `/cocv-art-send-merge-result` unchanged |
| `cocv-art-remove-branch` | Yes — `/cocv-art-remove-branch` unchanged |
