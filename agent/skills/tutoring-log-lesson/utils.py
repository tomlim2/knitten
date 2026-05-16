#!/usr/bin/env python3
"""Shared utilities for tutoring skill."""

import json
import os
import re
import sys
from pathlib import Path
from datetime import datetime

_MACHINE_PATHS = Path.home() / ".claude" / "private" / "caol-config" / "machine-paths.json"


def get_obsidian_vault_dir() -> Path:
    """Resolve the Obsidian vault directory from machine-paths.json.

    Falls back to obsidian-staging on machines without an iCloud vault. Exits
    with a clear message if neither key is configured.
    """
    try:
        paths = json.loads(_MACHINE_PATHS.read_text(encoding="utf-8"))
    except FileNotFoundError:
        sys.exit(f"tutoring/utils.py: missing {_MACHINE_PATHS} — populate obsidian-vault-claude or obsidian-staging.")
    target = paths.get("obsidian-vault-claude") or paths.get("obsidian-staging")
    if not target:
        sys.exit("tutoring/utils.py: machine-paths.json has neither 'obsidian-vault-claude' nor 'obsidian-staging'.")
    return Path(target)


def get_lessons_dir() -> Path:
    """Get the lessons directory path."""
    return get_obsidian_vault_dir() / "tutoring" / "lessons"


def get_invoices_dir() -> Path:
    """Get the invoices directory path."""
    return get_obsidian_vault_dir() / "tutoring" / "invoices"


def get_student_dir(student_name: str) -> Path:
    """Get the student's lesson directory."""
    return get_lessons_dir() / student_name


def ensure_dirs(student_name: str) -> None:
    """Ensure required directories exist."""
    get_student_dir(student_name).mkdir(parents=True, exist_ok=True)
    get_invoices_dir().mkdir(parents=True, exist_ok=True)


def get_pending_lessons(student_name: str) -> list[Path]:
    """Get lessons not yet on an invoice (no _invoiced or _done suffix)."""
    student_dir = get_student_dir(student_name)
    if not student_dir.exists():
        return []

    lessons = []
    for f in student_dir.glob("*.md"):
        stem = f.stem
        if not (stem.endswith("_done") or stem.endswith("_invoiced")):
            lessons.append(f)

    return sorted(lessons)


def get_invoiced_lessons(student_name: str) -> list[Path]:
    """Get lessons billed but not yet paid (_invoiced suffix)."""
    student_dir = get_student_dir(student_name)
    if not student_dir.exists():
        return []

    return sorted(student_dir.glob("*_invoiced.md"))


def get_done_lessons(student_name: str) -> list[Path]:
    """Get all completed lesson files for a student."""
    student_dir = get_student_dir(student_name)
    if not student_dir.exists():
        return []

    lessons = []
    for f in student_dir.glob("*_done.md"):
        lessons.append(f)

    return sorted(lessons)


def parse_lesson_file(filepath: Path) -> dict:
    """Parse a lesson markdown file and extract metadata."""
    content = filepath.read_text(encoding="utf-8")

    result = {
        "filepath": filepath,
        "filename": filepath.stem,
        "date": None,
        "start_time": None,
        "end_time": None,
        "duration_hours": 0,
        "location": None,
        "topic": None,
        "content": None,
        "next_steps": None,
    }

    # Parse header line: ## YYYY-MM-DD (day) HH:MM-HH:MM | Location
    header_match = re.search(
        r"^## (\d{4}-\d{2}-\d{2}) \([^)]+\) (\d{2}:\d{2})-(\d{2}:\d{2}) \| (.+)$",
        content,
        re.MULTILINE
    )
    if header_match:
        result["date"] = header_match.group(1)
        result["start_time"] = header_match.group(2)
        result["end_time"] = header_match.group(3)
        result["location"] = header_match.group(4).strip()

        # Calculate duration
        start = datetime.strptime(header_match.group(2), "%H:%M")
        end = datetime.strptime(header_match.group(3), "%H:%M")
        delta = end - start
        result["duration_hours"] = delta.seconds / 3600

    # Parse topic
    topic_match = re.search(r"^\*\*Topic\*\*:\s*(.+)$", content, re.MULTILINE)
    if topic_match:
        result["topic"] = topic_match.group(1).strip()

    # Parse content section
    content_match = re.search(
        r"### Content\n(.*?)(?=\n### |$)",
        content,
        re.DOTALL
    )
    if content_match:
        result["content"] = content_match.group(1).strip()

    # Parse next steps
    next_match = re.search(
        r"### Next Steps\n(.*?)(?=\n### |$)",
        content,
        re.DOTALL
    )
    if next_match:
        result["next_steps"] = next_match.group(1).strip()

    return result


def format_duration(hours: float) -> str:
    """Format duration in hours to human readable string."""
    h = int(hours)
    m = int((hours - h) * 60)

    if m == 0:
        return f"{h}h"
    elif h == 0:
        return f"{m}m"
    else:
        return f"{h}h {m}m"


def sanitize_filename(name: str) -> str:
    """Sanitize a string to be used as filename."""
    # Remove or replace invalid characters
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    return name.strip()
