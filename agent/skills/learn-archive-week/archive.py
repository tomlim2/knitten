#!/usr/bin/env python3
"""Archive this week's obsidian-staging + ~/.codex docs into Obsidian vault.

Idempotent: skips files with existing valid frontmatter if already at destination.
See SKILL.md for full spec.

Machine-specific absolute paths are loaded from
``~/.claude/private/caol-config/machine-paths.json``. Writers use
``obsidian-agent-root`` and fall back to the legacy ``obsidian-vault-claude``
key only while older machines migrate.
"""
from __future__ import annotations
import json
import os
import re
import sys
import shutil
from pathlib import Path
from datetime import datetime, date

HOME = Path.home()

# ---------- load machine-specific paths ----------
_PATHS_FILE = HOME / ".claude" / "private" / "caol-config" / "machine-paths.json"
try:
    _PATHS = json.loads(_PATHS_FILE.read_text(encoding="utf-8"))
except FileNotFoundError:
    sys.exit(f"archive.py: missing {_PATHS_FILE}. Populate it with obsidian-staging / codex-home / obsidian-agent-root keys.")
except json.JSONDecodeError as e:
    sys.exit(f"archive.py: invalid JSON in {_PATHS_FILE}: {e}")


def _require(key: str) -> Path:
    val = _PATHS.get(key)
    if not val:
        sys.exit(f"archive.py: machine-paths.json missing required key '{key}'.")
    return Path(val)


def _agent_root() -> Path:
    val = _PATHS.get("obsidian-agent-root") or _PATHS.get("obsidian-vault-claude")
    if not val:
        sys.exit("archive.py: machine-paths.json missing 'obsidian-agent-root' (legacy fallback: 'obsidian-vault-claude').")
    return Path(val)


TEMP = _require("obsidian-staging")
CODEX = _require("codex-home")
VAULT = _agent_root()

DRY_RUN = "--dry-run" in sys.argv

# (src_rel_from_base, base, dest_rel_from_vault, tags, source_value, delete_source)
MAPPING: list[tuple[Path, Path, Path, list[str], str, bool]] = []

def infer_destination(rel: Path) -> tuple[Path, list[str]]:
    """Infer vault destination and coarse tags from the staging path."""
    parts = rel.parts
    name = rel.name

    if name.startswith("shotloom-devlog-"):
        return Path("projects/shotloom/days") / name, ["shotloom", "devlog"]

    if len(parts) >= 3 and parts[0] == "projects":
        project = parts[1]
        bucket = parts[2]
        kind_by_bucket = {
            "days": "devlog",
            "learnings": "learning",
            "specs": "spec",
            "topics": "reference",
            "ops": "ops",
        }
        return rel, [project, kind_by_bucket.get(bucket, "reference")]

    if len(parts) >= 2 and parts[0] == "agent" and parts[1] == "learnings":
        return rel, ["_cross-project", "learning"]

    if parts and parts[0] == "private-learnings":
        return Path("agent/learnings") / name, ["_cross-project", "learning"]

    if parts and parts[0] == "private-ops":
        return Path("agent/ops") / name, ["_cross-project", "ops"]

    return Path("agent/_inbox") / rel, ["_cross-project", "reference"]


def build_mapping() -> list[tuple[Path, Path, Path, list[str], str, bool]]:
    if not TEMP.exists():
        return []
    entries = []
    for src in sorted(TEMP.rglob("*.md")):
        if any(part in {".obsidian", ".trash"} for part in src.parts):
            continue
        rel = src.relative_to(TEMP)
        dest_rel, tags = infer_destination(rel)
        entries.append((rel, TEMP, dest_rel, tags, "agent", True))
    return entries


MAPPING.extend(build_mapping())


FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?\n)---\s*\n", re.DOTALL)
H1_RE = re.compile(r"^#\s+(.+?)\s*$", re.MULTILINE)


def derive_title(content: str, filename: str) -> str:
    """Derive title from first H1 in body, else filename slug."""
    # strip existing frontmatter first
    m = FRONTMATTER_RE.match(content)
    body = content[m.end():] if m else content
    h1 = H1_RE.search(body)
    if h1:
        return h1.group(1).strip()
    stem = Path(filename).stem
    # Clean slug: remove date prefix, replace hyphens with spaces
    cleaned = re.sub(r"^(devlog|learning|shotloom-devlog)-", "", stem)
    cleaned = re.sub(r"^\d{4}-\d{2}-\d{2}-?", "", cleaned)
    cleaned = cleaned.replace("-", " ").strip()
    return cleaned.title() if cleaned else stem


def derive_date(filename: str, src: Path) -> str:
    m = re.search(r"(\d{4}-\d{2}-\d{2})", filename)
    if m:
        return m.group(1)
    # fallback: mtime
    ts = src.stat().st_mtime
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d")


def build_frontmatter(title: str, tags: list[str], date_str: str, source: str) -> str:
    tags_yaml = "\n".join(f"  - {t}" for t in tags)
    # Escape double quotes in title
    safe_title = title.replace('"', '\\"')
    return (
        "---\n"
        f'title: "{safe_title}"\n'
        "tags:\n"
        f"{tags_yaml}\n"
        f"date: {date_str}\n"
        f"source: {source}\n"
        "---\n\n"
    )


def has_valid_frontmatter(content: str) -> bool:
    m = FRONTMATTER_RE.match(content)
    if not m:
        return False
    fm = m.group(1)
    return all(f"{k}:" in fm for k in ("title", "tags", "date", "source"))


def merge_tags(existing_tags: list[str], new_tags: list[str]) -> list[str]:
    seen = set()
    out = []
    for t in existing_tags + new_tags:
        if t and t not in seen:
            seen.add(t)
            out.append(t)
    return out


def extract_existing_fm(content: str) -> tuple[dict, str]:
    """Returns (fm_dict, body_without_fm)."""
    m = FRONTMATTER_RE.match(content)
    if not m:
        return {}, content
    fm_text = m.group(1)
    body = content[m.end():]
    fm = {}
    current_key = None
    tags: list[str] = []
    in_tags = False
    for line in fm_text.splitlines():
        if line.startswith("  - ") and in_tags:
            tags.append(line[4:].strip())
            continue
        if ":" in line and not line.startswith(" "):
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip()
            if key == "tags":
                in_tags = True
                if val:
                    # inline list `tags: [a, b]` or single `tags: foo`
                    v = val.strip().lstrip("[").rstrip("]")
                    tags = [t.strip().strip('"').strip("'") for t in v.split(",") if t.strip()]
                    in_tags = False
            else:
                in_tags = False
                fm[key] = val.strip('"')
    fm["tags"] = tags  # always a list
    return fm, body


def format_content(src_content: str, title: str, tags: list[str], date_str: str, source: str) -> str:
    """Build final content with correct frontmatter + single H1."""
    existing_fm, body = extract_existing_fm(src_content)
    # Merge tags from existing if any
    final_tags = tags
    if existing_fm.get("tags"):
        final_tags = merge_tags(existing_fm["tags"], tags)
    # Prefer existing title if present
    final_title = existing_fm.get("title") or title
    final_date = existing_fm.get("date") or date_str
    final_source = existing_fm.get("source") or source

    fm = build_frontmatter(final_title, final_tags, final_date, final_source)

    # Ensure body starts cleanly (strip leading blank lines)
    body = body.lstrip("\n")

    # Check for existing H1 — dedup if body doesn't start with H1 matching title
    # Policy: keep body as-is (H1 if present stays). Skill spec says "exactly 1 H1"
    # We only strip duplicate consecutive H1s with same text.
    lines = body.splitlines()
    new_lines = []
    seen_first_h1 = False
    for line in lines:
        if line.startswith("# ") and not line.startswith("## "):
            if seen_first_h1:
                # skip additional top-level H1? Actually convert to H2 to preserve content
                new_lines.append("#" + line)
                continue
            seen_first_h1 = True
        new_lines.append(line)

    # If no H1 at all, inject one derived from title
    if not seen_first_h1:
        new_lines = [f"# {final_title}", ""] + new_lines

    return fm + "\n".join(new_lines).rstrip() + "\n"


def process(entry):
    src_rel, base, dest_rel, tags, source_value, delete_source = entry
    src = base / src_rel
    dest = VAULT / dest_rel
    filename = src.name
    status = {"src": str(src), "dest": str(dest), "result": "", "tags": tags}

    if not src.exists():
        status["result"] = "MISSING"
        return status

    try:
        content = src.read_text(encoding="utf-8")
    except Exception as e:
        status["result"] = f"READ_ERR: {e}"
        return status

    title = derive_title(content, filename)
    date_str = derive_date(filename, src)
    final = format_content(content, title, tags, date_str, source_value)

    if DRY_RUN:
        status["result"] = "DRY"
        return status

    dest.parent.mkdir(parents=True, exist_ok=True)

    if dest.exists():
        existing = dest.read_text(encoding="utf-8")
        if existing == final:
            status["result"] = "UNCHANGED"
        else:
            # Back up and overwrite
            bak = dest.with_suffix(dest.suffix + ".bak")
            bak.write_text(existing, encoding="utf-8")
            dest.write_text(final, encoding="utf-8")
            status["result"] = "UPDATED (bak saved)"
    else:
        dest.write_text(final, encoding="utf-8")
        status["result"] = "WROTE"

    if delete_source:
        src.unlink()
        status["result"] += " + DELETED"
    else:
        status["result"] += " + COPIED (source kept)"

    return status


def main():
    results = []
    for entry in MAPPING:
        results.append(process(entry))

    # Summary
    print(f"{'DRY RUN' if DRY_RUN else 'ARCHIVE'}: {len(results)} entries\n")
    for r in results:
        marker = "OK" if "WROTE" in r["result"] or "UPDATED" in r["result"] or "COPIED" in r["result"] or "DRY" in r["result"] else "??"
        print(f"[{marker}] {r['src']}\n       -> {r['dest']}\n       {r['result']} | tags: {','.join(r['tags'])}")

    # Counts
    wrote = sum(1 for r in results if "WROTE" in r["result"])
    updated = sum(1 for r in results if "UPDATED" in r["result"])
    unchanged = sum(1 for r in results if "UNCHANGED" in r["result"])
    deleted = sum(1 for r in results if "DELETED" in r["result"])
    copied = sum(1 for r in results if "COPIED" in r["result"])
    missing = sum(1 for r in results if r["result"] == "MISSING")
    errors = sum(1 for r in results if "ERR" in r["result"])

    print(f"\n=== Summary ===")
    print(f"wrote: {wrote}, updated: {updated}, unchanged: {unchanged}")
    print(f"deleted: {deleted}, copied-kept: {copied}")
    print(f"missing: {missing}, errors: {errors}")


if __name__ == "__main__":
    main()
