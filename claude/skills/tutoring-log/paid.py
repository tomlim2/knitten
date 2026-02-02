#!/usr/bin/env python3
"""Mark pending lessons as paid by renaming files with _done suffix."""

import sys
import argparse
from pathlib import Path

from utils import get_pending_lessons, parse_lesson_file, format_duration


def mark_lessons_paid(student: str, dry_run: bool = False) -> list[tuple[Path, Path]]:
    """Mark all pending lessons as paid by renaming with _done suffix."""
    files = get_pending_lessons(student)

    if not files:
        return []

    renamed = []
    for f in files:
        # Add _done before .md extension
        new_name = f.stem + "_done" + f.suffix
        new_path = f.parent / new_name

        if dry_run:
            print(f"  [DRY] {f.name} -> {new_name}")
        else:
            f.rename(new_path)
            print(f"  [OK] {f.name} -> {new_name}")

        renamed.append((f, new_path))

    return renamed


def list_pending(student: str) -> None:
    """List all pending lessons for a student."""
    files = get_pending_lessons(student)

    if not files:
        print(f"No pending lessons for {student}")
        return

    print(f"\nPending lessons for {student}:")
    total_hours = 0
    for f in files:
        parsed = parse_lesson_file(f)
        duration = format_duration(parsed["duration_hours"])
        total_hours += parsed["duration_hours"]
        print(f"  {f.name} | {duration}")

    print(f"\nTotal: {len(files)} lessons, {total_hours:.1f}h")


def main():
    parser = argparse.ArgumentParser(description="Mark pending lessons as paid")
    parser.add_argument("student", help="Student name")
    parser.add_argument("--dry-run", "-n", action="store_true", help="Show what would be renamed")
    parser.add_argument("--list", "-l", action="store_true", help="List pending lessons only")

    args = parser.parse_args()

    if args.list:
        list_pending(args.student)
        return

    files = get_pending_lessons(args.student)
    if not files:
        print(f"[WARN] No pending lessons for {args.student}")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"MARKING LESSONS AS PAID - {args.student}")
    print(f"{'='*60}\n")

    if args.dry_run:
        print("[DRY RUN MODE - no files will be renamed]\n")

    renamed = mark_lessons_paid(args.student, dry_run=args.dry_run)

    print(f"\n{'-'*60}")
    if args.dry_run:
        print(f"Would mark {len(renamed)} lessons as paid")
        print("Run without --dry-run to apply changes")
    else:
        print(f"Marked {len(renamed)} lessons as paid")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
