#!/usr/bin/env bash
# Stop the nohup background watcher for a single PR.
# Usage: stop.sh <pr-number>
set -euo pipefail

PR="${1:?usage: stop.sh <pr-number>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KNITTEN_ROOT="${KNITTEN_ROOT:-$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)}"
HELPER_RESOLVER="$KNITTEN_ROOT/agent/lib/resolve-helper-path.mjs"
LOCAL_RESOLVER="$(
  node "$HELPER_RESOLVER" --root "$KNITTEN_ROOT" resolve-local-artifact-path \
    | jq -r '.absolutePath'
)"
OPS_DIR="$(
  node "$LOCAL_RESOLVER" --root "$KNITTEN_ROOT" --create shotloom pr "$PR" cache \
    | jq -r '.absolutePath'
)"
PID_FILE="$OPS_DIR/watcher.pid"

# Legacy launchd cleanup (in case a prior version loaded a plist)
PLIST="$HOME/Library/LaunchAgents/com.shotloom.autopr.$PR.plist"
if [[ -f "$PLIST" ]]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
fi

if [[ -f "$PID_FILE" ]]; then
  PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
  if [[ -n "$PID" ]] && kill -0 "$PID" 2>/dev/null; then
    # kill the whole process group so the sleep child dies too
    kill -- -"$PID" 2>/dev/null || kill "$PID" 2>/dev/null || true
    echo "killed watcher PID $PID"
  else
    echo "pid file stale, cleaning"
  fi
  rm -f "$PID_FILE"
else
  echo "no watcher for PR $PR"
fi
