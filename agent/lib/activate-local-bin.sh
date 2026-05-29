#!/usr/bin/env bash
# Source this file from a Knitten checkout to prepare local helper wrappers and
# put .agent-local/bin on PATH for the current shell. Supports bash and zsh.

if [ -n "${ZSH_VERSION:-}" ]; then
  _knitten_activate_script="${(%):-%N}"
elif [ -n "${BASH_VERSION:-}" ]; then
  _knitten_activate_script="${BASH_SOURCE[0]}"
else
  _knitten_activate_script="$0"
fi

if [ -n "${ZSH_VERSION:-}" ]; then
  case ":${ZSH_EVAL_CONTEXT:-}:" in
    *:file:*) _knitten_activate_sourced=1 ;;
    *) _knitten_activate_sourced=0 ;;
  esac
elif [ "$_knitten_activate_script" = "$0" ]; then
  _knitten_activate_sourced=0
else
  _knitten_activate_sourced=1
fi

if [ "$_knitten_activate_sourced" != "1" ]; then
  echo "source this script: source agent/lib/activate-local-bin.sh" >&2
  exit 2
fi

_knitten_activate_root="${KNITTEN_ROOT:-$(git -C "$(cd "$(dirname "$_knitten_activate_script")/../.." && pwd)" rev-parse --show-toplevel)}"
node "$_knitten_activate_root/agent/lib/prepare-local-bin.mjs" --root "$_knitten_activate_root" >/dev/null

case ":$PATH:" in
  *":$_knitten_activate_root/.agent-local/bin:"*) ;;
  *) export PATH="$_knitten_activate_root/.agent-local/bin:$PATH" ;;
esac

export KNITTEN_ROOT="$_knitten_activate_root"
unset _knitten_activate_script
unset _knitten_activate_sourced
unset _knitten_activate_root
