#!/usr/bin/env bash
# git-pull-repos: pull every repo registered in repo-paths.json in parallel.
# Output is one line per repo: name|status|details
#   status ∈ {ok, error, skipped}
#   details = up-to-date | updated | <short reason>
#
# Designed to be robust against PATH-stripping sandboxes:
#   - all coreutils called via absolute paths (/usr/bin/...)
#   - GIT_SSH_COMMAND auto-set so git's forked children find ssh

set -u

REPO_PATHS="${REPO_PATHS_JSON:-$HOME/.claude/private/agent-hub-config/repo-paths.json}"
GIT_BIN="${GIT_BIN:-/usr/bin/git}"
GREP=/usr/bin/grep
HEAD=/usr/bin/head
CAT=/bin/cat

if [ -z "${GIT_SSH_COMMAND:-}" ]; then
  SSH_BIN=$(/usr/bin/which ssh 2>/dev/null || command -v ssh 2>/dev/null || true)
  [ -n "$SSH_BIN" ] && export GIT_SSH_COMMAND="$SSH_BIN"
fi

if [ ! -f "$REPO_PATHS" ]; then
  echo "config|error|repo-paths.json not found at $REPO_PATHS" >&2
  exit 1
fi

OUT_DIR=$(/usr/bin/mktemp -d -t git-pull-repos.XXXXXX)
trap '/bin/rm -rf "$OUT_DIR"' EXIT

pull_one() {
  local name="$1" path="$2"
  if [ ! -d "$path" ]; then
    /usr/bin/printf '%s|skipped|path not found\n' "$name" > "$OUT_DIR/$name"
    return
  fi
  if [ ! -d "$path/.git" ]; then
    /usr/bin/printf '%s|skipped|no .git directory\n' "$name" > "$OUT_DIR/$name"
    return
  fi
  local out rc first
  # --rebase --autostash: when local changes exist, auto-stash, rebase, then re-apply.
  # When clean, behaves like a fast-forward / rebase pull.
  out=$("$GIT_BIN" -C "$path" pull --rebase --autostash 2>&1)
  rc=$?
  if [ $rc -ne 0 ]; then
    first=$(/usr/bin/printf '%s\n' "$out" | "$GREP" -iE "error|fatal|cannot|conflict|no tracking|gone" | "$HEAD" -1)
    [ -z "$first" ] && first=$(/usr/bin/printf '%s\n' "$out" | "$HEAD" -1)
    /usr/bin/printf '%s|error|%s\n' "$name" "$first" > "$OUT_DIR/$name"
  elif /usr/bin/printf '%s' "$out" | "$GREP" -qi "Already up to date"; then
    /usr/bin/printf '%s|ok|up-to-date\n' "$name" > "$OUT_DIR/$name"
  else
    /usr/bin/printf '%s|ok|updated\n' "$name" > "$OUT_DIR/$name"
  fi
}

# Parse repo-paths.json. Supports both string values and {"path": "..."} objects.
# python3 is preferred (always present on macOS); falls back to a quick jq path.
parse_repos() {
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$REPO_PATHS" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
for name, val in data.items():
    if isinstance(val, dict):
        path = val.get("path", "")
    else:
        path = val
    if path:
        print(f"{name}\t{path}")
PY
  elif command -v jq >/dev/null 2>&1; then
    jq -r 'to_entries[] | "\(.key)\t\(if (.value | type) == "object" then .value.path else .value end)"' "$REPO_PATHS"
  else
    echo "config|error|need python3 or jq to parse repo-paths.json" >&2
    exit 1
  fi
}

while IFS=$'\t' read -r name path; do
  [ -z "$name" ] && continue
  pull_one "$name" "$path" &
done < <(parse_repos)
wait

# Emit results in stable (sorted) order.
for f in "$OUT_DIR"/*; do
  [ -f "$f" ] && "$CAT" "$f"
done | /usr/bin/sort
