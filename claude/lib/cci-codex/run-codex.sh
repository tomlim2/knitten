#!/usr/bin/env bash
# cci-codex shared wrapper — call codex with high reasoning, archive result.
#
# Usage:
#   run-codex.sh <skill-name> <prompt>
#
# Example:
#   run-codex.sh review-rust "Review the following Rust diff: ..."
#
# Behavior:
#   - Forces reasoning_effort=high (회사 토큰 적극 사용)
#   - Forces Korean output via prompt prefix
#   - Archives result to Obsidian (if available) or caol-ila/claude/temp-learnings/codex-runs/
#   - Logs a one-line summary on completion
#
# Output destination resolution:
#   1. If repo-paths.json has 'obsidian' key AND that path exists → <obsidian>/claude/codex-runs/YYYY-MM-DD/
#   2. Else → ~/Desktop/www/caol-ila/claude/temp-learnings/codex-runs/YYYY-MM-DD/

set -euo pipefail

SKILL="${1:-}"
PROMPT="${2:-}"

if [ -z "$SKILL" ] || [ -z "$PROMPT" ]; then
  echo "usage: run-codex.sh <skill-name> <prompt>" >&2
  exit 2
fi

# Resolve archive directory
REPO_PATHS="$HOME/.claude/private/repo-paths.json"
OBSIDIAN=""
if [ -f "$REPO_PATHS" ]; then
  OBSIDIAN=$(jq -r '.obsidian // empty' "$REPO_PATHS" 2>/dev/null || echo "")
fi

DATE=$(date +%Y-%m-%d)
TIME=$(date +%H%M%S)
if [ -n "$OBSIDIAN" ] && [ -d "$OBSIDIAN" ]; then
  OUT_DIR="$OBSIDIAN/claude/codex-runs/$DATE"
else
  OUT_DIR="$HOME/Desktop/www/caol-ila/claude/temp-learnings/codex-runs/$DATE"
fi
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/${SKILL}-${TIME}.md"
LAST_MSG_FILE="$OUT_DIR/.last-${SKILL}-${TIME}.txt"

# Korean output prefix prepended to every prompt
KOREAN_PREFIX="중요: 모든 답변은 **한국어**로. 코드 블록은 영어로 두되 설명·결론·요약·권장사항은 한국어. 마크다운으로. 결론은 굵게."

FULL_PROMPT="${KOREAN_PREFIX}

---

${PROMPT}"

# Write run header to archive file
{
  echo "---"
  echo "skill: cci-codex-${SKILL}"
  echo "timestamp: $(date -Iseconds)"
  echo "cwd: $(pwd)"
  echo "model: gpt-5.4"
  echo "reasoning_effort: high"
  echo "---"
  echo ""
  echo "## Prompt"
  echo ""
  echo '```'
  echo "$PROMPT"
  echo '```'
  echo ""
  echo "## Response"
  echo ""
} > "$OUT_FILE"

# Run codex; tee both to terminal and append to archive
codex exec --full-auto --color never \
  -c reasoning_effort='"high"' \
  --output-last-message "$LAST_MSG_FILE" \
  "$FULL_PROMPT" 2>&1 | tee -a "$OUT_FILE"

# One-line summary
echo ""
echo "📝 Archived: $OUT_FILE"
if [ -n "$OBSIDIAN" ] && [ -d "$OBSIDIAN" ]; then
  echo "   (Obsidian)"
else
  echo "   (caol-ila temp-learnings — Obsidian not configured)"
fi
