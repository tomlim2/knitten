---
description: Poll a Shotloom PR for check status, new comments, and state changes
argument-hint: "<pr-number-or-url>"
allowed-tools: Bash(gh:*), Read, CronCreate, CronDelete, CronList
---

# shotloom-watch-pr

Poll-based PR watcher for CINEV/shotloom. Monitors check runs, review comments, and PR state on a 1-minute interval until the PR is merged or closed.

## Arguments

- `<pr-number-or-url>` - PR number (e.g. `83`) or full URL (e.g. `https://github.com/CINEV/shotloom/pull/83`)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/shotloom-watch-pr <pr-number-or-url>`

## Purpose

Acts as a "PR waiting room" — sit on a PR after pushing and get notified of:

- CI check failures or completions
- New review comments or review threads
- PR state changes (merged, closed, changes requested)

This is **polling-based** (not webhook), checking every ~1 minute via `gh` CLI.

## Workflow

### Step 1: Parse argument

Extract PR number from `$ARGUMENTS`. Accept both:
- Bare number: `83`
- Full URL: `https://github.com/CINEV/shotloom/pull/83` — extract the trailing number

If invalid, show usage and stop.

### Step 2: Capture initial snapshot

```bash
# Check status
gh pr checks 83 2>&1

# PR state + metadata
gh pr view 83 --json state,title,reviewDecision,statusCheckRollup 2>&1

# Existing comments count
gh api repos/CINEV/shotloom/pulls/83/comments --jq 'length' 2>&1

# Existing review comments count
gh api repos/CINEV/shotloom/pulls/83/reviews --jq 'length' 2>&1
```

Store these values as the baseline:
- `check_summary` — pass/fail/pending counts
- `comment_count` — number of PR comments
- `review_count` — number of reviews
- `pr_state` — OPEN / MERGED / CLOSED
- `review_decision` — APPROVED / CHANGES_REQUESTED / REVIEW_REQUIRED / null

Report initial status to user.

### Step 3: Start polling via CronCreate

Create a cron job that fires every 1 minute:

```
CronCreate: cron "*/1 * * * *", recurring true
```

The cron prompt should instruct Claude to:

1. **Check PR state:**
   ```bash
   gh pr view <number> --json state,reviewDecision 2>&1
   ```
   - If state changed (MERGED or CLOSED) — report and stop watching (CronDelete)

2. **Check CI status:**
   ```bash
   gh pr checks <number> 2>&1
   ```
   - Compare against last known check summary
   - If any check flipped to fail — report immediately
   - If all checks pass (were pending before) — report success

3. **Check new comments:**
   ```bash
   gh api repos/CINEV/shotloom/pulls/<number>/comments --jq 'length' 2>&1
   gh api repos/CINEV/shotloom/pulls/<number>/reviews --jq 'length' 2>&1
   ```
   - If comment or review count increased — fetch new ones and summarize
   - For new review comments, show the body text so user can respond

4. **On new review comments — hand off, do NOT switch into code-fix mode:**
   - Show the comment content (delta only, no rewriting / framing).
   - State the explicit handoff options without taking either:
     - "Run `/shotloom-respond-pr <N>` to fix manually with batch reply approval."
     - "Run `/shotloom-auto-pr start <N>` to enable autonomous responder."
   - This skill is **read-only by design** — it polls and reports. Editing files, committing, pushing, or posting replies all belong to the actor skills (`shotloom-respond-pr` / `shotloom-auto-pr`). Mixing watcher + actor in one tool muddied the passive/active boundary in earlier versions.

### Step 4: Report changes

On each poll cycle, only report if something changed. Format:

```
[PR #83 watch] <timestamp>
- Checks: 3/3 pass (was 2 pending)
- New comment from @reviewer: "..."
- State: OPEN (unchanged)
```

Silent if nothing changed — no spam.

### Step 5: Stop conditions

Stop watching (CronDelete) when:
- PR is merged
- PR is closed
- User explicitly says to stop (`/stop`, "stop watching", etc.)
- 7-day CronCreate auto-expiry

Report final status on stop.

## Notes

- This is **not real-time** — 1-minute polling. There will be up to 60s delay.
- `gh` CLI must be authenticated as `tomlim2` (same as all shotloom ops).
- The cron job lives only in the current session — exits when Claude exits.
- Multiple PRs can be watched simultaneously by invoking multiple times.
- **Reports stay terse.** This is a polling skill; output is delta-only status updates ("Checks: 3/3 pass", "New comment from @reviewer"). The lower-resolution Korean briefing rule used in `shotloom-respond-pr` does NOT apply here — watchers must stay scannable, not narrative. When `auto-pr` is the right fit (long sessions, autonomous reactor), prefer it over this skill.

## When to use this skill vs `shotloom-auto-pr`

| Scenario | Pick |
|---|---|
| Short session, want passive notifications | `shotloom-watch-pr` (this skill) |
| Long-running PR, want autonomous CI fixes + review responses | `shotloom-auto-pr start <N>` |
| Want to merge gh-CLI fail-fast checks into Claude reactor | `shotloom-auto-pr` |

`shotloom-auto-pr` superseded the active half of this skill (PR reaction). Watch-pr remains for short-lived, attended monitoring where you don't want a background watcher process.

## Related

- `shotloom-make-pr` — creates the PR this skill watches
- `shotloom-review-before-pr` — pre-PR self-review
