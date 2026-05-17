#!/usr/bin/env python3
"""Find files where filename/path contains a known tag keyword but the tag is missing from frontmatter. Add the missing tag."""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

_PATHS_FILE = Path.home() / ".claude" / "private" / "agent-hub-config" / "machine-paths.json"
try:
    _PATHS = json.loads(_PATHS_FILE.read_text(encoding="utf-8"))
except FileNotFoundError:
    sys.exit(f"fill_tags_from_name.py: missing {_PATHS_FILE}")
except json.JSONDecodeError as e:
    sys.exit(f"fill_tags_from_name.py: invalid JSON in {_PATHS_FILE}: {e}")

_VAULT = _PATHS.get("obsidian")
if not _VAULT:
    print("obsidian not configured on this machine — nothing to do")
    sys.exit(0)

VAULT = Path(_VAULT)
EXCLUDE_DIRS = {".trash", ".obsidian"}  # config only — all user docs included
DRY_RUN = False

# Filename/path tokens → tags to ensure present
# Order: longer/more-specific keys first so e.g. "bevy-vrm" matches before "vrm"
# Each entry: (regex_pattern, tags_to_add)
# The pattern is searched against path (relative from vault root) + filename stem.
# Match ONLY on filename stem (not path), with strong signal only.
# Project tags inferred from path separately below.
RULES: list[tuple[str, list[str]]] = [
    # git family — strong signal
    (r"\bstash\b", ["git", "stash"]),
    (r"\blfs\b", ["git", "lfs"]),
    (r"\bpr[-_](flow|open|review|workflow|prep|api)", ["git", "pr-workflow"]),
    (r"\bgithub[-_]api\b", ["git", "github-api"]),
    (r"\bgithub\b", ["git"]),
    (r"\bmerge[-_](prep|notice|result)", ["git"]),
    (r"^git[-_]", ["git"]),
    (r"[-_]git$", ["git"]),

    # workflow/meta (filename-level)
    (r"\binterview\b", ["interview", "job-search"]),
    (r"\bresume\b", ["job-search"]),

    # drinks (filename-level)
    (r"\bwine\b", ["drinks", "wine"]),
    (r"\bwhisky\b", ["drinks", "whisky"]),
    (r"\bchampagne\b", ["drinks", "champagne"]),

    # 3d-genai (filename-level)
    (r"\bhyper3d\b", ["3d-genai", "hyper3d"]),
    (r"\bnvidia\b", ["3d-genai", "nvidia"]),
    (r"\bmesh[-_]generation\b", ["3d-genai"]),
    (r"\bworld[-_]generation\b", ["3d-genai"]),

    # shader specific (filename-level)
    (r"\bmtoon\b", ["mtoon", "shader"]),
    (r"\bwebgpu\b", ["webgpu"]),

    # linear tickets
    (r"\bstl[-_]?\d+", ["shotloom"]),

    # codex base
    (r"\bcodex[-_]base\b", ["codex-base", "reference"]),
    (r"\bAGENTS$", ["reference"]),

    # devlog/learning filename prefixes
    (r"^devlog[-_]", ["devlog"]),
    (r"^shotloom[-_]devlog[-_]", ["devlog", "shotloom"]),
    (r"^learning[-_]", ["learnings"]),
    (r"^word[-_]of[-_]the[-_]day", ["learnings"]),
]

# Project tag from path (directory name under projects/)
PROJECT_DIR_TAG = {
    "bevy-vrm": "bevy-vrm",
    "shotloom-rd": "shotloom",
    "mmd-player-anju": "mmd-anju",
    "mmd-anju": "mmd-anju",
    "matcap-painter": "matcap-painter",
    "krafton-hackathon": "krafton-hackathon",
    "cinev-studio": "cinev",
    "megamelange": "megamelange",
    "job-search-2026": "job-search",
}

FM_RE = re.compile(r"\A(---\s*\n)(.*?\n)(---\s*\n)", re.DOTALL)


def extract_tags(fm_body: str) -> list[str]:
    tags = []
    in_tags = False
    for line in fm_body.splitlines():
        if line.strip().startswith("tags:"):
            after = line.strip()[5:].strip()
            if after:
                # inline list
                for v in after.strip("[]").split(","):
                    v = v.strip().strip('"').strip("'")
                    if v:
                        tags.append(v)
                in_tags = False
            else:
                in_tags = True
            continue
        if in_tags and line.startswith("  - "):
            tags.append(line[4:].strip())
            continue
        if in_tags and not line.startswith("  "):
            in_tags = False
    return tags


def add_tags_to_fm(fm_body: str, new_tags: list[str]) -> str:
    """Insert new_tags at the end of the tags block."""
    out = []
    in_tags = False
    inserted = False
    for line in fm_body.splitlines():
        if line.strip().startswith("tags:"):
            out.append(line)
            in_tags = True
            continue
        if in_tags and line.startswith("  - "):
            out.append(line)
            continue
        if in_tags and not inserted:
            for t in new_tags:
                out.append(f"  - {t}")
            inserted = True
            in_tags = False
        out.append(line)
    if in_tags and not inserted:
        for t in new_tags:
            out.append(f"  - {t}")
    return "\n".join(out) + "\n"


def infer_tags(rel_path: Path) -> set[str]:
    """Infer tags from filename stem (RULES) + project directory (PROJECT_DIR_TAG)."""
    candidates = set()
    stem = rel_path.stem.lower()
    for pattern, tags in RULES:
        if re.search(pattern, stem, re.IGNORECASE):
            for t in tags:
                candidates.add(t)
    # Project tag from path parts
    for part in rel_path.parts:
        if part in PROJECT_DIR_TAG:
            candidates.add(PROJECT_DIR_TAG[part])
    return candidates


def main():
    changed = 0
    scanned = 0
    changes_log = []

    for fp in VAULT.rglob("*.md"):
        if any(part in EXCLUDE_DIRS for part in fp.relative_to(VAULT).parts):
            continue
        scanned += 1
        rel = fp.relative_to(VAULT)
        rel_str = str(rel)

        text = fp.read_text(encoding="utf-8")
        m = FM_RE.match(text)
        if not m:
            continue

        fm_body = m.group(2)
        existing = extract_tags(fm_body)
        existing_set = set(existing)

        inferred = infer_tags(rel)
        missing = inferred - existing_set
        if not missing:
            continue

        # keep insertion order: sort for stable diff
        missing_list = sorted(missing)

        if DRY_RUN:
            changes_log.append(f"{rel_str}: +{','.join(missing_list)}")
            changed += 1
            continue

        new_body = add_tags_to_fm(fm_body, missing_list)
        new_text = m.group(1) + new_body + m.group(3) + text[m.end():]
        fp.write_text(new_text, encoding="utf-8")
        changes_log.append(f"{rel_str}: +{','.join(missing_list)}")
        changed += 1

    print(f"Scanned {scanned} files, changed {changed}")
    for c in changes_log:
        print(f"  {c}")


if __name__ == "__main__":
    main()
