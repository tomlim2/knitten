#!/usr/bin/env bash
# Start a nohup background watcher for a single PR.
# Uses a plain bash sleep-loop (not launchd) to avoid macOS TCC restrictions
# on ~/.claude/. Dies on reboot; user must re-run after boot.
#
# Usage: start.sh <pr-number> [interval-seconds]
set -euo pipefail

PR="${1:?usage: start.sh <pr-number> [interval-seconds]}"
INTERVAL="${2:-120}"
SKILL_DIR="$HOME/.claude/skills/shotloom-auto-pr"
OPS_DIR="$HOME/.claude/ops/pr-$PR"
PID_FILE="$OPS_DIR/watcher.pid"
LOOP_LOG="$OPS_DIR/watcher.log"
MKDIR_LOCK="$OPS_DIR/watch.lock.d"

mkdir -p "$OPS_DIR"

# kill prior watcher if any
if [[ -f "$PID_FILE" ]]; then
  OLD_PID=$(cat "$PID_FILE" 2>/dev/null || echo "")
  if [[ -n "$OLD_PID" ]] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
    sleep 0.3
  fi
  rm -f "$PID_FILE"
fi

# The mkdir lock fallback can be left behind if a prior watcher is killed
# mid-tick. Starting a new watcher is an explicit reset, so clear only the
# stale fallback lock before booting the loop.
rmdir "$MKDIR_LOCK" 2>/dev/null || true

# launch loop in background, fully detached
nohup bash -c "
  while true; do
    bash '$SKILL_DIR/watch.sh' '$PR' >> '$LOOP_LOG' 2>&1 || true
    # If bootstrap failed before state.json was written, keep the watcher alive
    # and retry on the next tick instead of silently disabling auto-pr.
    if [[ ! -f '$OPS_DIR/state.json' ]]; then
      echo \"[\$(date -u +%Y-%m-%dT%H:%M:%SZ)] watcher tick produced no state; retrying\" >> '$LOOP_LOG'
      sleep $INTERVAL
      continue
    fi
    # exit loop if PR state terminal
    STATE=\$(jq -r '.state // \"\"' '$OPS_DIR/state.json' 2>/dev/null || echo '')
    if [[ \"\$STATE\" == \"MERGED\" || \"\$STATE\" == \"CLOSED\" ]]; then
      echo \"[\$(date -u +%Y-%m-%dT%H:%M:%SZ)] watcher exit: PR \$STATE\" >> '$LOOP_LOG'
      break
    fi
    sleep $INTERVAL
  done
  rm -f '$PID_FILE'
" >/dev/null 2>&1 &
PID=$!
disown "$PID" 2>/dev/null || true
echo "$PID" > "$PID_FILE"

echo "watcher started: PID $PID, interval ${INTERVAL}s"
echo "pid file: $PID_FILE"
echo "loop log: $LOOP_LOG"
echo "state:    $OPS_DIR/state.json"
echo "pause:    $OPS_DIR/watcher.paused"
