#!/usr/bin/env bash
# Obsidian vault format fixer.
# Usage:
#   fix.sh           — dry run (list offenders)
#   fix.sh --apply   — rewrite in place

set -euo pipefail

VAULT="$(jq -r '."obsidian"' ~/.claude/private/caol-config/machine-paths.json)"
if [[ -z "$VAULT" || ! -d "$VAULT" ]]; then
  echo "vault path not found: $VAULT" >&2
  exit 1
fi

APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

cd "$VAULT"

scan() {
  local label="$1" regex="$2"
  local hits
  hits=$(grep -rlE "$regex" . 2>/dev/null || true)
  if [[ -z "$hits" ]]; then
    echo "[$label] clean"
    return
  fi
  echo "[$label] offenders:"
  echo "$hits" | sed 's/^/  /'
  if (( APPLY )); then
    while IFS= read -r f; do
      perl -i -pe 's/^---(#+)(.*)$/---\n$1$2/' "$f"
    done <<< "$hits"
    echo "[$label] fixed"
  fi
}

# All `---` (frontmatter close) glued to a heading on the same line.
scan "frontmatter-heading-glued" '^---#+'

if (( APPLY == 0 )); then
  echo
  echo "(dry run — pass --apply to rewrite)"
fi
