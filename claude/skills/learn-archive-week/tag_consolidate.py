#!/usr/bin/env python3
"""Consolidate semantic-duplicate tags in Obsidian vault.

Vault path is loaded from ``~/.claude/private/machine-paths.json``
(key ``obsidian-vault-claude``). On machines without the vault this script
exits early — there is nothing to consolidate.
"""
import json
import re
import sys
from pathlib import Path

_PATHS_FILE = Path.home() / ".claude" / "private" / "machine-paths.json"
try:
    _PATHS = json.loads(_PATHS_FILE.read_text(encoding="utf-8"))
except FileNotFoundError:
    sys.exit(f"tag_consolidate.py: missing {_PATHS_FILE}.")
except json.JSONDecodeError as e:
    sys.exit(f"tag_consolidate.py: invalid JSON in {_PATHS_FILE}: {e}")

_VAULT = _PATHS.get("obsidian-vault-claude")
if not _VAULT:
    sys.exit("tag_consolidate.py: machine-paths.json missing 'obsidian-vault-claude' — no vault on this machine, nothing to consolidate.")

# obsidian-vault-claude points at {vault}/claude. Walk the whole vault for tag
# consolidation, so broaden to the parent and exclude config directories.
VAULT = Path(_VAULT).parent
EXCLUDE_DIRS = {".trash", ".obsidian"}  # config only — all user docs included

TAG_MAP = {
    "retargeting": "retarget",
    "shotloom-retarget": "retarget",
    "bevy_vrm1": "bevy-vrm",
    "bevy": "bevy-vrm",
    "daily-summary": "devlog",
    "pr-review": "pr-workflow",
    "codex-cli": "codex-base",
    # 2026-04-18 additions
    "naming": "conventions",
    "privacy-rule": "conventions",
    "review-patterns": "skill-review",
    "self-review": "pr-workflow",
    "server": "infra",
    "rendering": "shader",
    "world-space": "skeleton",
    # 2026-04-18 (full vault pass)
    "project/ue-live-scene-bridge": "ue-live-scene-bridge",
    "www": "web",
    "ue": "unreal-engine",  # non-versioned → umbrella
    "unreal5d3": "ue5d3",   # normalize to ue<major>d<minor>
    "unreal5d7": "ue5d7",
    "npr": "toon-rendering",
    "resources": "reference",  # plural → singular (vault convention)
}

# Umbrella tags: if file has any of keys, also add ALL values (doesn't replace).
# Value can be a single string or a list.
TAG_ADD: dict[str, list[str]] = {
    # git
    "lfs": ["git"],
    "stash": ["git"],
    "github-api": ["git"],
    "pr-workflow": ["git"],
    # drinks
    "wine": ["drinks"],
    "whisky": ["drinks"],
    "champagne": ["drinks"],
    # 3d-genai
    "hyper3d": ["3d-genai"],
    "nvidia": ["3d-genai"],
    "mesh-generation": ["3d-genai"],
    "world-generation": ["3d-genai"],
    # mtoon → vrm + toon-rendering (MToon is VRM-spec toon shader)
    "mtoon": ["vrm", "toon-rendering", "shader"],
    # job-search
    "interview": ["job-search"],
    # ai umbrella
    "llm": ["ai"],
    "prompt": ["ai"],
}

FM_RE = re.compile(r"\A(---\s*\n)(.*?\n)(---\s*\n)", re.DOTALL)

def process_file(fp: Path) -> tuple[bool, list[str]]:
    text = fp.read_text(encoding="utf-8")
    m = FM_RE.match(text)
    if not m:
        return False, []
    fm_open, fm_body, fm_close = m.group(1), m.group(2), m.group(3)
    rest = text[m.end():]

    lines = fm_body.splitlines()
    out_lines = []
    in_tags = False
    seen_tags = []
    changes = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("tags:"):
            # inline form: tags: [a, b]   or   tags: foo
            after = stripped[5:].strip()
            if after:
                # inline list
                vals = after.strip("[]").split(",")
                new_vals = []
                seen = set()
                for v in vals:
                    v = v.strip().strip('"').strip("'")
                    if not v:
                        continue
                    mapped = TAG_MAP.get(v, v)
                    if mapped != v:
                        changes.append(f"{v} -> {mapped}")
                    if mapped not in seen:
                        seen.add(mapped)
                        new_vals.append(mapped)
                out_lines.append(f"tags: [{', '.join(new_vals)}]")
                in_tags = False
            else:
                out_lines.append("tags:")
                in_tags = True
                seen_tags = []
            continue

        if in_tags and line.startswith("  - "):
            tag = line[4:].strip().strip('"').strip("'")
            mapped = TAG_MAP.get(tag, tag)
            if mapped != tag:
                changes.append(f"{tag} -> {mapped}")
            if mapped not in seen_tags:
                seen_tags.append(mapped)
                out_lines.append(f"  - {mapped}")
            # else: drop duplicate
            continue

        if in_tags and not line.startswith("  "):
            # left tags block — before leaving, apply TAG_ADD umbrellas
            for trigger, umbrellas in TAG_ADD.items():
                if trigger in seen_tags:
                    for umbrella in umbrellas:
                        if umbrella not in seen_tags:
                            seen_tags.append(umbrella)
                            out_lines.append(f"  - {umbrella}")
                            changes.append(f"+{umbrella} (from {trigger})")
            in_tags = False

        out_lines.append(line)

    # if tags block extends to end of FM, still apply TAG_ADD
    if in_tags:
        for trigger, umbrellas in TAG_ADD.items():
            if trigger in seen_tags:
                for umbrella in umbrellas:
                    if umbrella not in seen_tags:
                        seen_tags.append(umbrella)
                        out_lines.append(f"  - {umbrella}")
                        changes.append(f"+{umbrella} (from {trigger})")

    if not changes:
        return False, []

    new_fm = "\n".join(out_lines) + "\n"
    fp.write_text(fm_open + new_fm + fm_close + rest, encoding="utf-8")
    return True, changes


def main():
    total_files = 0
    changed_files = 0
    all_changes = []
    for fp in VAULT.rglob("*.md"):
        if any(part in EXCLUDE_DIRS for part in fp.relative_to(VAULT).parts):
            continue
        total_files += 1
        changed, changes = process_file(fp)
        if changed:
            changed_files += 1
            rel = fp.relative_to(VAULT)
            all_changes.append((str(rel), changes))

    print(f"Scanned {total_files} files, changed {changed_files}")
    for rel, changes in all_changes:
        print(f"  {rel}: {', '.join(changes)}")


if __name__ == "__main__":
    main()
