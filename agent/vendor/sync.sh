#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REGISTRY="$ROOT/skills.json"

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 1
fi

if [ ! -f "$REGISTRY" ]; then
  echo "ERROR: missing vendor registry: $REGISTRY" >&2
  exit 1
fi

jq -c '.vendors[]' "$REGISTRY" | while IFS= read -r vendor; do
  name="$(jq -r '.name' <<<"$vendor")"
  repo="$(jq -r '.repo' <<<"$vendor")"
  branch="$(jq -r '.branch' <<<"$vendor")"
  dest="$ROOT/$name"

  if [ ! -d "$dest/.git" ]; then
    rm -rf "$dest"
    git clone --depth 1 --branch "$branch" "$repo" "$dest"
  else
    git -C "$dest" fetch --depth 1 origin "$branch"
    git -C "$dest" reset --hard "origin/$branch"
  fi

  rev="$(git -C "$dest" rev-parse --short HEAD)"
  echo "synced $name@$rev"
done
