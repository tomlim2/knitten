# Ready-for-review follow-up

Run this only after `shotloom-make-pr` creates a non-draft PR because the user
approved `ready-for-review`.

## Inputs

- `<pr-number>` - new PR number from `gh pr view --json number --jq .number`
- `<pr-url>` - new PR URL from `gh pr view --json url --jq .url`

## Workflow

### Step 1: Confirm CI checks have appeared

Poll briefly until GitHub exposes at least one PR check. Treat pending, queued,
in-progress, passed, or failed checks as "CI has appeared"; this step only
confirms CI is running or visible, not that it passed.

```bash
check_count=0
for attempt in 1 2 3 4 5 6 7 8; do
  checks_output=$(gh pr checks <pr-number> --json name --jq 'length' 2>/dev/null || true)
  case "$checks_output" in
    ''|*[!0-9]*) check_count=0 ;;
    *) check_count="$checks_output" ;;
  esac
  [ "$check_count" -gt 0 ] && break
  sleep 15
done

[ "$check_count" -gt 0 ] || {
  echo "ERROR: CI checks did not appear for PR #<pr-number>"
  exit 1
}

gh pr checks <pr-number>
```

If checks cannot be read or never appear, stop before `/claude-review` and
report that the ready-for-review follow-up is blocked.

### Step 2: Request Claude review

Post the slash command as a PR comment through a temporary body file.

```bash
comment_file=$(mktemp)
printf '%s\n' '/claude-review' > "$comment_file"
gh pr comment <pr-number> --body-file "$comment_file"
rm -f "$comment_file"
```

### Step 3: Confirm Claude review activity is visible

Check comments and reviews until a Claude-related activity appears. Use manual
judgement on the output; the goal is to see that the slash command is being
handled, not to wait for the review to finish.

```bash
for attempt in 1 2 3 4 5 6 7 8; do
  gh pr view <pr-number> --json comments,reviews
  sleep 15
done
```

If Claude activity is not visible after polling, report that `/claude-review`
was posted but the run is not yet visible. Do not ask for a human reviewer yet.

### Step 4: Ask for the human reviewer

After Claude review activity is visible, ask:

> `/claude-review` 도는 것 확인했습니다. 리뷰어 누구 달까요? GitHub login으로 알려주세요.

Wait for the user. When they provide one or more GitHub logins, request those
reviewers with `gh pr edit <pr-number> --add-reviewer <login>`.
