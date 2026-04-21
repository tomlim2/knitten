#!/usr/bin/env bash
# resolve.sh <mode> <key> [subkey]
#
# Modes:
#   doc  <purpose> [project]  — document storage path (from doc-paths.json)
#   repo <key>                — git repo path (from repo-paths.json)
#   tool <key>                — machine tool/app path (from machine-paths.json)
#
# Legacy: resolve.sh <purpose> [project] — treated as doc mode

set -euo pipefail

PRIVATE="$HOME/.claude/private"
REPO_PATHS="$PRIVATE/repo-paths.json"
MACHINE_PATHS="$PRIVATE/machine-paths.json"
DOC_PATHS="$PRIVATE/doc-paths.json"

MODE="${1:-}"
ARG1="${2:-}"
ARG2="${3:-}"

# Legacy compat: if mode is not doc/repo/tool, treat as doc purpose
if [[ "$MODE" != "doc" && "$MODE" != "repo" && "$MODE" != "tool" ]]; then
  ARG2="$ARG1"
  ARG1="$MODE"
  MODE="doc"
fi

if [[ -z "$ARG1" ]]; then
  echo "Usage:" >&2
  echo "  resolve.sh doc <purpose> [project]" >&2
  echo "  resolve.sh repo <key>" >&2
  echo "  resolve.sh tool <key>" >&2
  exit 1
fi

# ── repo mode ────────────────────────────────────────────────────────────────
if [[ "$MODE" == "repo" ]]; then
  if [[ ! -f "$REPO_PATHS" ]]; then
    echo "ERROR: repo-paths.json not found" >&2; exit 1
  fi
  val=$(jq -r --arg k "$ARG1" '.[$k] // empty' "$REPO_PATHS")
  if [[ -z "$val" ]]; then
    echo "ERROR: repo key '$ARG1' not found in repo-paths.json" >&2; exit 1
  fi
  # Support object with .path
  if echo "$val" | jq -e 'type == "object"' &>/dev/null 2>&1; then
    val=$(echo "$val" | jq -r '.path')
  fi
  val="${val/#\~/$HOME}"
  echo "RESOLVED_PATH=$val"
  exit 0
fi

# ── tool mode ─────────────────────────────────────────────────────────────────
if [[ "$MODE" == "tool" ]]; then
  if [[ ! -f "$MACHINE_PATHS" ]]; then
    echo "ERROR: machine-paths.json not found" >&2; exit 1
  fi
  val=$(jq -r --arg k "$ARG1" '.[$k] // empty' "$MACHINE_PATHS")
  if [[ -z "$val" ]]; then
    echo "ERROR: tool key '$ARG1' not found in machine-paths.json" >&2; exit 1
  fi
  val="${val/#\~/$HOME}"
  echo "RESOLVED_PATH=$val"
  exit 0
fi

# ── doc mode ──────────────────────────────────────────────────────────────────
PURPOSE="$ARG1"
PROJECT="$ARG2"

# Read roots
OBSIDIAN_ROOT=""
STAGING_ROOT=""
CAOL_ILA_ROOT=""

if [[ -f "$REPO_PATHS" ]]; then
  val=$(jq -r '.obsidian // empty' "$REPO_PATHS")
  if echo "$val" | jq -e 'type == "object"' &>/dev/null 2>&1; then
    OBSIDIAN_ROOT=$(echo "$val" | jq -r '.path // empty')
  else
    OBSIDIAN_ROOT="$val"
  fi

  val=$(jq -r '."caol-ila" // empty' "$REPO_PATHS")
  if echo "$val" | jq -e 'type == "object"' &>/dev/null 2>&1; then
    CAOL_ILA_ROOT=$(echo "$val" | jq -r '.path // empty')
  else
    CAOL_ILA_ROOT="$val"
  fi
fi

if [[ -f "$MACHINE_PATHS" ]]; then
  STAGING_ROOT=$(jq -r '."obsidian-staging" // empty' "$MACHINE_PATHS")
fi

VAULT_AVAILABLE="false"
if [[ -n "$OBSIDIAN_ROOT" && -d "$OBSIDIAN_ROOT" ]]; then
  VAULT_AVAILABLE="true"
fi

DOW=$(date +%u)
WEEKDAY="false"
[[ "$DOW" -le 5 ]] && WEEKDAY="true"

if [[ "$WEEKDAY" == "true" ]]; then
  SLOT=$(jq -r --arg p "$PURPOSE" '.purposes[$p].weekday // .purposes[$p].default // empty' "$DOC_PATHS")
elif [[ "$VAULT_AVAILABLE" == "false" ]]; then
  SLOT=$(jq -r --arg p "$PURPOSE" '.purposes[$p]["no-vault"] // .purposes[$p].default // empty' "$DOC_PATHS")
else
  SLOT=$(jq -r --arg p "$PURPOSE" '.purposes[$p].default // empty' "$DOC_PATHS")
fi

if [[ -z "$SLOT" ]]; then
  echo "ERROR: unknown doc purpose '$PURPOSE'" >&2; exit 1
fi

ROOT_KEY="${SLOT%%:*}"
REL_PATH="${SLOT#*:}"

[[ -n "$PROJECT" ]] && REL_PATH="${REL_PATH//\{project\}/$PROJECT}"

case "$ROOT_KEY" in
  obsidian) BASE="$OBSIDIAN_ROOT" ;;
  staging)  BASE="$STAGING_ROOT" ;;
  caol-ila) BASE="$CAOL_ILA_ROOT" ;;
  ops)      BASE="$HOME/.claude/ops" ;;
  private)  BASE="$HOME/.claude/private" ;;
  *)        BASE="" ;;
esac

BASE="${BASE/#\~/$HOME}"
RESOLVED="$BASE${REL_PATH:+/$REL_PATH}"

FORMAT=$(jq -r --arg k "$ROOT_KEY" '.format[$k] // "free"' "$DOC_PATHS")

echo "RESOLVED_PATH=$RESOLVED"
echo "FORMAT=$FORMAT"
echo "WEEKDAY=$WEEKDAY"
echo "VAULT_AVAILABLE=$VAULT_AVAILABLE"
