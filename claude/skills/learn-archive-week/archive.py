#!/usr/bin/env python3
"""Archive this week's temp-learnings + ~/.codex docs into Obsidian vault.

Idempotent: skips files with existing valid frontmatter if already at destination.
See SKILL.md for full spec.
"""
from __future__ import annotations
import os
import re
import sys
import shutil
from pathlib import Path
from datetime import datetime, date

HOME = Path.home()
TEMP = HOME / "Desktop/www/caol-ila/claude/temp-learnings"
CODEX = HOME / ".codex"
VAULT = Path("/Users/younsoolim/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/claude")

WEEK_START = datetime(2026, 4, 13)
WEEK_END = datetime(2026, 4, 18)  # exclusive

DRY_RUN = "--dry-run" in sys.argv

# (src_rel_from_base, base, dest_rel_from_vault, tags, source_value, delete_source)
MAPPING: list[tuple[Path, Path, Path, list[str], str, bool]] = []

# ---------- temp-learnings/bevy-vrm/*.md -> projects/bevy-vrm/days/ ----------
BEVY_DEVLOGS = [
    "devlog-2026-04-13-arp-retargeter-inner-finding.md",
    "devlog-2026-04-13-diagnostic-layer.md",
    "devlog-2026-04-13-foot-rs-dead-code.md",
    "devlog-2026-04-13-hand-dir-alignment.md",
    "devlog-2026-04-13-metric-assumption-mismatch.md",
    "devlog-2026-04-13-orchestrator.md",
    "devlog-2026-04-13-phase2-3-landing-plus-axis-realization.md",
    "devlog-2026-04-13-pipeline-gating.md",
    "devlog-2026-04-13-postprocess-promotion.md",
    "devlog-2026-04-13-rubric-b12-fix.md",
    "devlog-2026-04-13-rubric-c12-fix.md",
    "devlog-2026-04-13-source-anim-split.md",
    "devlog-2026-04-13-sweep-baseline.md",
    "devlog-2026-04-13-sweep-bin-pipeline-entry.md",
    "devlog-2026-04-13-tier1-retargeter-contract.md",
    "devlog-2026-04-14-c11-c14-residual.md",
    "devlog-2026-04-14-fbx-animation-importer-rename.md",
]
for fn in BEVY_DEVLOGS:
    tags = ["bevy-vrm", "devlog"]
    # topic inference from slug
    slug = fn.replace(".md", "").lower()
    if "retarget" in slug or "rubric" in slug or "phase" in slug or "tier1" in slug or "pipeline-gat" in slug:
        tags.append("retarget")
    elif "fbx" in slug or "importer" in slug:
        tags.append("rust")
    elif "hand-dir" in slug or "foot" in slug:
        tags.append("retarget")
    elif "diagnostic" in slug or "orchestrator" in slug or "sweep" in slug or "metric" in slug:
        tags.append("retarget")
    elif "postprocess" in slug or "source-anim" in slug:
        tags.append("retarget")
    MAPPING.append((
        Path(fn), TEMP / "bevy-vrm",
        Path("projects/bevy-vrm/days") / fn,
        tags, "claude", True,
    ))

# ---------- shotloom devlogs (in temp-learnings root) ----------
SHOTLOOM_DEVLOGS = [
    "devlog-2026-04-14-stl74-pr-open.md",
    "devlog-2026-04-14-stl74-revision.md",
    "devlog-2026-04-15-stl78-fbx-importer-planning.md",
    "devlog-2026-04-15-stl78-merge-stl89-prep.md",
    "devlog-2026-04-15-stl78-port-handoff.md",
    "devlog-2026-04-15-stl78-pr-flow.md",
    "shotloom-devlog-2026-04-16.md",
    "shotloom-devlog-2026-04-17.md",
]
for fn in SHOTLOOM_DEVLOGS:
    tags = ["shotloom", "devlog", "rust"]
    MAPPING.append((
        Path(fn), TEMP,
        Path("projects/shotloom-rd/days") / fn,
        tags, "claude", True,
    ))

# ---------- shotloom plans ----------
for fn in ["stl-99-plan.md", "stl-114-plan.md"]:
    MAPPING.append((
        Path(fn), TEMP,
        Path("projects/shotloom-rd/plans") / fn,
        ["shotloom", "spec"], "claude", True,
    ))

# ---------- shotloom conventions ----------
MAPPING.append((
    Path("shotloom-conventions-summary-2026-04-15.md"), TEMP,
    Path("projects/shotloom-rd/shotloom-conventions-summary-2026-04-15.md"),
    ["shotloom", "reference"], "claude", True,
))

# ---------- codex-runs -> bevy-vrm/ops ----------
for fn in ["analyze-motion-112359.md", "port-bevy-112847.md"]:
    MAPPING.append((
        Path("codex-runs/2026-04-14") / fn, TEMP,
        Path("projects/bevy-vrm/ops/codex-runs/2026-04-14") / fn,
        ["bevy-vrm", "reference"], "claude", True,
    ))

# ---------- learning-* -> learnings/ ----------
LEARNING_FILES = {
    "learning-bootstrap.md": ["learnings", "rust"],
    "learning-contract-surface.md": ["learnings", "rust"],
    "learning-contradiction.md": ["learnings"],
    "learning-entanglement.md": ["learnings"],
    "learning-honest-caveat.md": ["learnings"],
    "learning-minecraft-server-infra.md": ["learnings", "reference"],
    "learning-rust-bin-vs-lib.md": ["learnings", "rust"],
    "learning-rust-crates.md": ["learnings", "rust"],
    "learning-rust-traits.md": ["learnings", "rust"],
    "learning-scaffold.md": ["learnings", "rust"],
    "learning-telemetry.md": ["learnings", "rust"],
}
for fn, tags in LEARNING_FILES.items():
    MAPPING.append((
        Path(fn), TEMP,
        Path("learnings") / fn,
        tags, "claude", True,
    ))

# ---------- resource-* -> references/ ----------
MAPPING.append((
    Path("resource-tegaki.md"), TEMP,
    Path("references/tegaki.md"),
    ["reference"], "claude", True,
))

# ---------- word-of-the-day ----------
MAPPING.append((
    Path("word-of-the-day-2026-04-13.md"), TEMP,
    Path("learnings/word-of-the-day/2026-04-13.md"),
    ["learnings"], "claude", True,
))

# ---------- private-ops -> projects/bevy-vrm/ops/ ----------
PRIVATE_OPS = [
    "R-017-result.md",
    "R-018-dispatch.md", "R-018-result.md",
    "R-019-dispatch.md", "R-019-result.md",
    "R-020-dispatch.md", "R-020-result.md",
    "R-021-dispatch.md", "R-021-result.md",
    "R-022-dispatch.md", "R-022-result.md",
    "R-024-result.md",
]
for fn in PRIVATE_OPS:
    MAPPING.append((
        Path("private-ops") / fn, TEMP,
        Path("projects/bevy-vrm/ops") / fn,
        ["bevy-vrm", "reference"], "claude", True,
    ))

# ---------- private-learnings ----------
MAPPING.append((
    Path("private-learnings/projects/bevy-vrm-fbx-arm-scan.md"), TEMP,
    Path("learnings/projects/bevy-vrm-fbx-arm-scan.md"),
    ["bevy-vrm", "learnings"], "claude", True,
))
MAPPING.append((
    Path("private-learnings/projects/bevy-vrm.md"), TEMP,
    Path("learnings/projects/bevy-vrm.md"),
    ["bevy-vrm", "learnings"], "claude", True,
))

# ---------- ~/.codex/ -> references/codex-base/ (copy only) ----------
CODEX_FILES = [
    ("memories/order-priority-preference.md", ["reference", "codex-base"]),
    ("order/stl-89-retarget-arp-to-vrm-wiring.md", ["reference", "codex-base", "shotloom"]),
    ("order/README.md", ["reference", "codex-base"]),
    ("order/stl-89-next-steps.md", ["reference", "codex-base", "shotloom"]),
    ("rules/README.md", ["reference", "codex-base"]),
    ("rules/shotloom/engineering-guide.md", ["reference", "codex-base", "shotloom"]),
    ("rules/shotloom/README.md", ["reference", "codex-base", "shotloom"]),
    ("AGENTS.md", ["reference", "codex-base"]),
]
for rel, tags in CODEX_FILES:
    MAPPING.append((
        Path(rel), CODEX,
        Path("references/codex-base") / rel,
        tags, "codex-base", False,
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
