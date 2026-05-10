#!/usr/bin/env bash
# Obsidian vault format auditor + fixer.
# Usage:
#   fix.sh                  — full audit (dry run)
#   fix.sh --apply          — apply auto-fixable rewrites
#   fix.sh --check <name>   — run a single check by name
#
# Checks:
#   frontmatter-heading-glued  (auto-fixable) — `---#` etc on same line
#   missing-h1                 (report only)  — no `# Title` in first 30 lines
#   missing-readme             (report only)  — folders without README.md
#   empty-dirs                 (auto-fixable) — empty directories under vault

set -euo pipefail

VAULT="$(jq -r '."obsidian"' ~/.claude/private/caol-config/machine-paths.json)"
if [[ -z "$VAULT" || ! -d "$VAULT" ]]; then
  echo "vault path not found: $VAULT" >&2
  exit 1
fi

APPLY=0
ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --check) ONLY="${2:-}"; shift ;;
  esac
  shift
done

cd "$VAULT"

want() { [[ -z "$ONLY" || "$ONLY" == "$1" ]]; }

# --- frontmatter-heading-glued (auto-fix) ---
if want frontmatter-heading-glued; then
  hits=$(grep -rlE '^---#+' . 2>/dev/null || true)
  if [[ -z "$hits" ]]; then
    echo "[frontmatter-heading-glued] clean"
  else
    echo "[frontmatter-heading-glued] offenders:"
    echo "$hits" | sed 's/^/  /'
    if (( APPLY )); then
      while IFS= read -r f; do
        perl -i -pe 's/^---(#+)(.*)$/---\n$1$2/' "$f"
      done <<< "$hits"
      echo "[frontmatter-heading-glued] fixed"
    fi
  fi
fi

# --- missing-h1 (report only) ---
if want missing-h1; then
  count=0
  declare -a missing=()
  while IFS= read -r f; do
    if ! head -30 "$f" | grep -q '^# '; then
      missing+=("$f")
      count=$((count+1))
    fi
  done < <(find . -name '*.md' -not -path './.trash/*' -not -path './.obsidian/*' -not -path './attachments/*')
  if (( count == 0 )); then
    echo "[missing-h1] clean"
  else
    echo "[missing-h1] offenders ($count):"
    printf '  %s\n' "${missing[@]}" | head -20
    (( count > 20 )) && echo "  ... +$((count-20)) more"
    echo "  (report only — not auto-fixed; review filenames before backfill)"
  fi
fi

# --- missing-readme under agent/projects/* ---
# Policy: README required only for project roots (depth=3) OR folders with 10+ notes.
# Thin folders skip per note-inspection-checklist.md (maintenance cost > value).
if want missing-readme; then
  count=0
  declare -a missing=()
  while IFS= read -r d; do
    [[ -f "$d/README.md" ]] && continue
    depth=$(awk -F/ '{print NF}' <<< "$d")
    notes=$(find "$d" -maxdepth 1 -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
    # Project root = depth 3 (agent/projects/<proj>)
    if (( depth == 3 || notes >= 10 )); then
      missing+=("$d ($notes notes)")
      count=$((count+1))
    fi
  done < <(find agent/projects -mindepth 1 -maxdepth 2 -type d 2>/dev/null)
  if (( count == 0 )); then
    echo "[missing-readme] clean (per policy: project roots + 10+note folders only)"
  else
    echo "[missing-readme] offenders ($count):"
    printf '  %s\n' "${missing[@]}" | head -20
    (( count > 20 )) && echo "  ... +$((count-20)) more"
  fi
fi

# --- empty-dirs (auto-fix) ---
if want empty-dirs; then
  hits=$(find . -type d -empty -not -path './.trash/*' -not -path './.obsidian/*' -not -path './attachments*' 2>/dev/null || true)
  if [[ -z "$hits" ]]; then
    echo "[empty-dirs] clean"
  else
    echo "[empty-dirs] offenders:"
    echo "$hits" | sed 's/^/  /'
    if (( APPLY )); then
      echo "$hits" | while IFS= read -r d; do rmdir "$d" 2>/dev/null || true; done
      echo "[empty-dirs] removed"
    fi
  fi
fi

if (( APPLY == 0 )); then
  echo
  echo "(dry run — pass --apply to rewrite auto-fixable checks)"
fi
