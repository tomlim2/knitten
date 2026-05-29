#!/usr/bin/env bash
# Source this file from a Knitten checkout to prepare local helper wrappers and
# put .agent-local/bin on PATH for the current shell.

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo "source this script: source agent/lib/activate-local-bin.sh" >&2
  exit 2
fi

_knitten_activate_root="${KNITTEN_ROOT:-$(git -C "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)" rev-parse --show-toplevel)}"
node "$_knitten_activate_root/agent/lib/prepare-local-bin.mjs" --root "$_knitten_activate_root" >/dev/null

case ":$PATH:" in
  *":$_knitten_activate_root/.agent-local/bin:"*) ;;
  *) export PATH="$_knitten_activate_root/.agent-local/bin:$PATH" ;;
esac

export KNITTEN_ROOT="$_knitten_activate_root"
unset _knitten_activate_root
