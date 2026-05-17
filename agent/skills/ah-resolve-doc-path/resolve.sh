#!/usr/bin/env bash
# resolve.sh <mode> <key> [subkey]
#
# Modes:
#   doc  <purpose> [project]  — document storage path (from doc-paths.json)
#   repo <key>                — git repo path (from repo-paths.json)
#   tool <key>                — machine tool/app path (from machine-paths.json)
#   structure                 — vault folder constants (from vault-structure.json)
#
# Legacy: resolve.sh <purpose> [project] — treated as doc mode

set -euo pipefail

PRIVATE="$HOME/.claude/private"
REPO_PATHS="$PRIVATE/agent-hub-config/repo-paths.json"
MACHINE_PATHS="$PRIVATE/agent-hub-config/machine-paths.json"
DOC_PATHS="$PRIVATE/agent-hub-config/doc-paths.json"
VAULT_STRUCTURE="$PRIVATE/agent-hub-config/vault-structure.json"

MODE="${1:-}"
ARG1="${2:-}"
ARG2="${3:-}"

# Legacy compat: if mode is not doc/repo/tool, treat as doc purpose
if [[ "$MODE" != "doc" && "$MODE" != "repo" && "$MODE" != "tool" && "$MODE" != "structure" ]]; then
  ARG2="$ARG1"
  ARG1="$MODE"
  MODE="doc"
fi

if [[ "$MODE" != "structure" && -z "$ARG1" ]]; then
  echo "Usage:" >&2
  echo "  resolve.sh doc <purpose> [project]" >&2
  echo "  resolve.sh repo <key>" >&2
  echo "  resolve.sh tool <key>" >&2
  echo "  resolve.sh structure [jq-filter]" >&2
  exit 1
fi

# ── structure mode ────────────────────────────────────────────────────────────
if [[ "$MODE" == "structure" ]]; then
  if [[ ! -f "$VAULT_STRUCTURE" ]]; then
    echo "ERROR: vault-structure.json not found" >&2; exit 1
  fi
  FILTER="${ARG1:-.}"
  jq -r "$FILTER" "$VAULT_STRUCTURE"
  exit 0
fi

# ── repo mode ─────────────────────────────────────────────────────────────────
if [[ "$MODE" == "repo" ]]; then
  if [[ ! -f "$REPO_PATHS" ]]; then
    echo "ERROR: repo-paths.json not found" >&2; exit 1
  fi
  val=$(jq -r --arg k "$ARG1" '.[$k] // empty' "$REPO_PATHS")
  if [[ -z "$val" ]]; then
    echo "ERROR: repo key '$ARG1' not found in repo-paths.json" >&2; exit 1
  fi
  if echo "$val" | jq -e 'type == "object"' &>/dev/null 2>&1; then
    val=$(echo "$val" | jq -r '.path')
  fi
  echo "RESOLVED_PATH=${val/#\~/$HOME}"
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
  echo "RESOLVED_PATH=${val/#\~/$HOME}"
  exit 0
fi

# ── doc mode ──────────────────────────────────────────────────────────────────
PURPOSE="$ARG1"
PROJECT="$ARG2"

# Read obsidian root
OBSIDIAN_ROOT=""
if [[ -f "$MACHINE_PATHS" ]]; then
  OBSIDIAN_ROOT=$(jq -r '.obsidian // empty' "$MACHINE_PATHS")
fi

STAGING_ROOT=""
if [[ -f "$MACHINE_PATHS" ]]; then
  STAGING_ROOT=$(jq -r '."obsidian-staging" // empty' "$MACHINE_PATHS")
fi

VAULT_AVAILABLE="false"
if [[ -n "$OBSIDIAN_ROOT" && -d "$OBSIDIAN_ROOT" ]]; then
  VAULT_AVAILABLE="true"
fi

# Pick slot
if [[ "$VAULT_AVAILABLE" == "true" ]]; then
  SLOT=$(jq -r --arg p "$PURPOSE" '.purposes[$p].default // empty' "$DOC_PATHS")
else
  SLOT=$(jq -r --arg p "$PURPOSE" '.purposes[$p]["no-vault"] // .purposes[$p].default // empty' "$DOC_PATHS")
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
  ops)      BASE="$HOME/.claude/ops" ;;
  private)  BASE="$HOME/.claude/private" ;;
  *)        echo "ERROR: unknown root namespace '$ROOT_KEY' for purpose '$PURPOSE' (expected: obsidian|staging|ops|private)" >&2; exit 1 ;;
esac

# Contract validation (structural — not semantic)
if [[ -z "$BASE" ]]; then
  echo "ERROR: namespace '$ROOT_KEY' resolved to empty path (check machine-paths.json for missing key)" >&2
  exit 1
fi
if [[ "$REL_PATH" == *"{project}"* ]]; then
  echo "ERROR: purpose '$PURPOSE' path template contains {project} but no project arg was given" >&2
  exit 1
fi

BASE="${BASE/#\~/$HOME}"
RESOLVED="$BASE${REL_PATH:+/$REL_PATH}"
FORMAT=$(jq -r --arg k "$ROOT_KEY" '.format[$k] // "free"' "$DOC_PATHS")

echo "RESOLVED_PATH=$RESOLVED"
echo "FORMAT=$FORMAT"
echo "VAULT_AVAILABLE=$VAULT_AVAILABLE"
