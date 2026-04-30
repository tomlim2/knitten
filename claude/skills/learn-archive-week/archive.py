#!/usr/bin/env python3
"""Archive this week's obsidian-staging + ~/.codex docs into Obsidian vault.

Idempotent: skips files with existing valid frontmatter if already at destination.
See SKILL.md for full spec.

Machine-specific absolute paths are loaded from
``~/.claude/private/caol-config/machine-paths.json`` (keys: ``obsidian-staging``,
``codex-home``, ``obsidian-vault-claude``). Missing keys abort the run with a
clear message — on machines without an Obsidian vault (e.g. the work Mac) this
script is not meant to run.
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
    sys.exit(f"archive.py: missing {_PATHS_FILE}. Populate it with obsidian-staging / codex-home / obsidian-vault-claude keys.")
except json.JSONDecodeError as e:
    sys.exit(f"archive.py: invalid JSON in {_PATHS_FILE}: {e}")


def _require(key: str) -> Path:
    val = _PATHS.get(key)
    if not val:
        sys.exit(f"archive.py: machine-paths.json missing required key '{key}'.")
    return Path(val)


TEMP = _require("obsidian-staging")
CODEX = _require("codex-home")
VAULT = _require("obsidian-vault-claude")

WEEK_START = datetime(2026, 4, 27)
WEEK_END = datetime(2026, 5, 4)  # exclusive

DRY_RUN = "--dry-run" in sys.argv

# (src_rel_from_base, base, dest_rel_from_vault, tags, source_value, delete_source)
MAPPING: list[tuple[Path, Path, Path, list[str], str, bool]] = []

# ---------- shotloom devlogs (this week, in obsidian-staging root) ----------
SHOTLOOM_DEVLOGS = [
    "shotloom-devlog-2026-04-27.md",
    "shotloom-devlog-2026-04-28.md",
    "shotloom-devlog-2026-04-29.md",
    "shotloom-devlog-2026-04-30.md",
]
for fn in SHOTLOOM_DEVLOGS:
    tags = ["shotloom", "devlog", "rust", "retarget"]
    MAPPING.append((
        Path(fn), TEMP,
        Path("projects/shotloom-rd/days") / fn,
        tags, "claude", True,
    ))

# ---------- caol-ila personal todo ----------
MAPPING.append((
    Path("todo-at-home-2026-04-21.md"), TEMP,
    Path("projects/caol-ila/todo-at-home-2026-04-21.md"),
    ["caol-ila", "todo"], "claude", True,
))

# ---------- codex-runs (this week) -> shotloom ops ----------
MAPPING.append((
    Path("codex-runs/2026-04-29/audit-pr-body-091709.md"), TEMP,
    Path("projects/shotloom-rd/ops/codex-runs/2026-04-29/audit-pr-body-091709.md"),
    ["shotloom", "reference", "codex-base"], "codex-base", True,
))

# ---------- carry-over sweep: shotloom devlogs from prior weeks ----------
MAPPING.append((
    Path("shotloom-devlog-2026-04-20.md"), TEMP,
    Path("projects/shotloom-rd/days/shotloom-devlog-2026-04-20.md"),
    ["shotloom", "devlog"], "claude", True,
))
MAPPING.append((
    Path("shotloom-devlog-2026-04-21.md"), TEMP,
    Path("projects/shotloom-rd/days/shotloom-devlog-2026-04-21.md"),
    ["shotloom", "devlog", "workflow"], "claude", True,
))
# 04-22 collision: vault root has different shotloom-devlog-2026-04-22.md (8.5K)
# staging is 16K different content. Rename to coexist.
MAPPING.append((
    Path("shotloom-devlog-2026-04-22.md"), TEMP,
    Path("projects/shotloom-rd/days/shotloom-devlog-2026-04-22-vrm-normalization.md"),
    ["shotloom", "devlog", "vrm", "normalizer"], "claude", True,
))
MAPPING.append((
    Path("shotloom-devlog-2026-04-23.md"), TEMP,
    Path("projects/shotloom-rd/days/shotloom-devlog-2026-04-23.md"),
    ["shotloom", "devlog", "fixtures"], "claude", True,
))
# 04-24 collision: vault has /days/devlog-2026-04-24.md (3.4K, learn-log-day)
# staging is 5.4K Claude session log. Rename to coexist.
MAPPING.append((
    Path("shotloom-devlog-2026-04-24.md"), TEMP,
    Path("projects/shotloom-rd/days/shotloom-devlog-2026-04-24-stl172-crate-rename.md"),
    ["shotloom", "devlog", "stl-172"], "claude", True,
))

# ---------- carry-over: shotloom specs / ops / handoffs ----------
MAPPING.append((
    Path("shotloom-adr-pmx-import-placeholder-draft.md"), TEMP,
    Path("projects/shotloom-rd/specs/shotloom-adr-pmx-import-placeholder-draft.md"),
    ["shotloom", "adr", "draft"], "claude", True,
))
MAPPING.append((
    Path("shotloom-pr-journal.md"), TEMP,
    Path("projects/shotloom-rd/ops/shotloom-pr-journal.md"),
    ["shotloom", "ops"], "claude", True,
))
MAPPING.append((
    Path("shotloom-preflight-spec.md"), TEMP,
    Path("projects/shotloom-rd/specs/shotloom-preflight-spec.md"),
    ["shotloom", "spec"], "claude", True,
))
MAPPING.append((
    Path("shotloom-stl-154-handoff.md"), TEMP,
    Path("projects/shotloom-rd/ops/shotloom-stl-154-handoff.md"),
    ["shotloom", "handoff", "stl-154"], "claude", True,
))

# ---------- carry-over: projects/shotloom/* learnings + daily ----------
MAPPING.append((
    Path("projects/shotloom/finger-rest-align-glossary.md"), TEMP,
    Path("projects/shotloom-rd/learnings/finger-rest-align-glossary.md"),
    ["shotloom", "learnings", "retarget", "finger"], "claude", True,
))
MAPPING.append((
    Path("projects/shotloom/finger-retarget-scalar-rationale.md"), TEMP,
    Path("projects/shotloom-rd/learnings/finger-retarget-scalar-rationale.md"),
    ["shotloom", "learnings", "retarget", "finger"], "claude", True,
))
MAPPING.append((
    Path("projects/shotloom/import-normalize-retarget-pipeline.md"), TEMP,
    Path("projects/shotloom-rd/learnings/import-normalize-retarget-pipeline.md"),
    ["shotloom", "learnings", "architecture", "pipeline"], "claude", True,
))
# Daily ops logs — rename to shotloom-daily-* to distinguish from full devlogs.
MAPPING.append((
    Path("projects/shotloom/daily/2026-04-21.md"), TEMP,
    Path("projects/shotloom-rd/days/shotloom-daily-2026-04-21.md"),
    ["shotloom", "devlog"], "claude", True,
))
MAPPING.append((
    Path("projects/shotloom/daily/2026-04-27.md"), TEMP,
    Path("projects/shotloom-rd/days/shotloom-daily-2026-04-27.md"),
    ["shotloom", "devlog"], "claude", True,
))
# 2026-04-30 daily is duplicate of vault shotloom-devlog-2026-04-30.md — handled
# as staging-only delete after archive.py run (see Stage 1.5 below).

# ---------- carry-over: bevy-vrm + plain devlogs + codex-runs(04-24) ----------
MAPPING.append((
    Path("bevy-vrm/devlog-2026-04-18.md"), TEMP,
    Path("projects/bevy-vrm/days/devlog-2026-04-18.md"),
    ["bevy-vrm", "devlog", "oss"], "claude", True,
))
# 04-21 plain devlog — primary topic Shotloom PR review, secondary cci skill.
# Rename to disambiguate from #shotloom-devlog-2026-04-21 already in MAPPING.
MAPPING.append((
    Path("devlog-2026-04-21.md"), TEMP,
    Path("projects/shotloom-rd/days/devlog-2026-04-21-pr-review.md"),
    ["shotloom", "devlog", "pr-review"], "claude", True,
))
MAPPING.append((
    Path("devlog-2026-04-23.md"), TEMP,
    Path("projects/caol-ila/devlog-2026-04-23.md"),
    ["caol-ila", "devlog", "hyperframes"], "claude", True,
))
MAPPING.append((
    Path("codex-runs/2026-04-24/review-rust-195535.md"), TEMP,
    Path("projects/shotloom-rd/ops/codex-runs/2026-04-24/review-rust-195535.md"),
    ["shotloom", "reference", "codex-base", "stl-179"], "codex-base", True,
))

# ---------- carry-over: learnings + references + personal ----------
MAPPING.append((
    Path("learning-upstream-contribution.md"), TEMP,
    Path("learnings/learning-upstream-contribution.md"),
    ["learnings", "oss", "workflow"], "claude", True,
))
MAPPING.append((
    Path("learnings/_template.md"), TEMP,
    Path("learnings/_template.md"),
    ["learnings", "template"], "claude", True,
))
MAPPING.append((
    Path("learnings/projects/cinev.md"), TEMP,
    Path("learnings/projects/cinev.md"),
    ["learnings", "cinev"], "claude", True,
))
# OVERWRITE: staging is superset of vault learnings/projects/shotloom.md.
# archive.py creates .bak of the vault version automatically.
MAPPING.append((
    Path("learnings/projects/shotloom.md"), TEMP,
    Path("learnings/projects/shotloom.md"),
    ["learnings", "shotloom"], "claude", True,
))
MAPPING.append((
    Path("references/image-prompts/character-pose-grid-4x4.md"), TEMP,
    Path("references/image-prompts/character-pose-grid-4x4.md"),
    ["reference", "image-prompt"], "claude", True,
))
MAPPING.append((
    Path("monthly-subscriptions.md"), TEMP,
    Path("notes/monthly-subscriptions.md"),
    ["personal", "subscriptions"], "claude", True,
))


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
