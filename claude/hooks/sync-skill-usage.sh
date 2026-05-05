#!/bin/bash
# Periodic sync of claude/private/skill-usage/ to caol-ila origin.
# Triggered by launchd (com.caol.skill-usage-sync). Silent on no-op.

set -u

PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"
GIT=/usr/bin/git

caol_root=$(jq -r '.["caol-ila"].path' "$HOME/.claude/private/caol-config/repo-paths.json" 2>/dev/null) || exit 0
caol_root="${caol_root/#\~/$HOME}"
[ -d "$caol_root/.git" ] || exit 0

cd "$caol_root" || exit 0

machine_id=$(jq -r '.machine_id // "unknown"' "$HOME/.claude/private/caol-config/hardware.json" 2>/dev/null)
target="claude/private/skill-usage/$machine_id"
[ -d "$target" ] || exit 0

# Pull first; ignore failures (offline, conflict — retry next tick).
$GIT pull --rebase --autostash origin main >/dev/null 2>&1 || {
  $GIT rebase --abort >/dev/null 2>&1
  exit 0
}

$GIT add "$target" >/dev/null 2>&1
$GIT diff --quiet --cached -- "$target" && exit 0

$GIT -c user.name=tomlim2 -c user.email=tomandlim@gmail.com \
  commit -m "skill-usage: $machine_id auto" -- "$target" >/dev/null 2>&1 || exit 0

$GIT push origin main >/dev/null 2>&1
exit 0
