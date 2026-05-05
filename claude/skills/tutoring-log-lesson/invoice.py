#!/usr/bin/env python3
"""Generate invoice from pending lesson files."""

import sys
import argparse
import webbrowser
import urllib.parse
from datetime import datetime

from utils import (
    get_pending_lessons,
    parse_lesson_file,
    format_duration,
    get_invoices_dir,
)


def list_pending_lessons(student: str) -> list[dict]:
    """Get and parse all pending lessons for a student."""
    files = get_pending_lessons(student)
    lessons = []

    for f in files:
        parsed = parse_lesson_file(f)
        if parsed["date"]:
            lessons.append(parsed)

    return sorted(lessons, key=lambda x: x["date"])


def generate_invoice_summary(student: str, hourly_rate: int = 150000) -> dict:
    """Generate invoice summary from pending lessons."""
    lessons = list_pending_lessons(student)

    if not lessons:
        return None

    total_hours = sum(l["duration_hours"] for l in lessons)
    total_amount = int(total_hours * hourly_rate)

    return {
        "student": student,
        "lessons": lessons,
        "total_hours": total_hours,
        "hourly_rate": hourly_rate,
        "total_amount": total_amount,
        "lesson_count": len(lessons),
    }


def print_summary(summary: dict) -> None:
    """Print invoice summary to console."""
    print(f"\n{'='*60}")
    print(f"INVOICE SUMMARY - {summary['student']}")
    print(f"{'='*60}\n")

    print("Pending Lessons:")
    for l in summary["lessons"]:
        duration = format_duration(l["duration_hours"])
        print(f"  {l['date']} | {duration} | {l['location']} | {l['topic']}")

    print(f"\n{'-'*60}")
    print(f"Total Lessons: {summary['lesson_count']}")
    print(f"Total Hours: {summary['total_hours']:.1f}h")
    print(f"Hourly Rate: {summary['hourly_rate']:,} KRW")
    print(f"Total Amount: {summary['total_amount']:,} KRW")
    print(f"{'='*60}\n")


def open_invoice_generator(summary: dict) -> None:
    """Open invoice generator web app with pre-filled data."""
    import json

    import re
    lessons_data = []
    for l in summary["lessons"]:
        hours = int(l["duration_hours"])
        minutes = int((l["duration_hours"] - hours) * 60)
        entry = {"date": l["date"], "hours": hours, "minutes": minutes}
        if l.get("topic"):
            note = re.sub(r"\s*\(참고:\s*\[\[[^\]]+\]\]\)\s*$", "", l["topic"]).strip()
            if note:
                entry["note"] = note
        lessons_data.append(entry)

    params = {
        "student": summary["student"],
        "rate": str(summary["hourly_rate"]),
        "lessons": json.dumps(lessons_data, ensure_ascii=False),
        "auto": "1",
    }
    query = urllib.parse.urlencode(params)

    # /invoice was hosted by caol-serve-skills (port 972), now removed.
    # Until caol-hq (port 9720) provides a replacement route, --open is a no-op
    # and we just print the query string the future endpoint would consume.
    query_str = "&".join(f"{k}={v}" for k, v in params.items())
    print("[--open disabled] caol-hq /invoice route not yet implemented.")
    print(f"Query (for future endpoint): {query_str}")
    _ = webbrowser  # silence unused-import lint until route returns


def main():
    parser = argparse.ArgumentParser(description="Generate invoice from pending lessons")
    parser.add_argument("student", help="Student name")
    parser.add_argument("--rate", "-r", type=int, default=150000, help="Hourly rate (default: 150000)")
    parser.add_argument("--open", "-o", action="store_true", help="Open invoice generator web app")

    args = parser.parse_args()

    summary = generate_invoice_summary(args.student, args.rate)

    if not summary:
        print(f"[WARN] No pending lessons found for {args.student}")
        sys.exit(1)

    print_summary(summary)

    if args.open:
        open_invoice_generator(summary)
    else:
        print("Run with --open to open the invoice generator web app")
        print("Or use the summary above to create an invoice manually")


if __name__ == "__main__":
    main()
