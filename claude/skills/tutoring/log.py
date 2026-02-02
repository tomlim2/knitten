#!/usr/bin/env python3
"""Create a lesson log file."""

import sys
import argparse
from datetime import datetime
from pathlib import Path

from utils import ensure_dirs, get_student_dir, sanitize_filename


WEEKDAYS_KR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def create_lesson_file(
    student: str,
    date: str,
    start_time: str,
    end_time: str,
    location: str,
    topic: str,
    content: str = "",
    next_steps: str = "",
) -> Path:
    """Create a lesson markdown file."""
    ensure_dirs(student)

    # Parse date to get weekday
    dt = datetime.strptime(date, "%Y-%m-%d")
    weekday = WEEKDAYS_KR[dt.weekday()]

    # Create filename: YYYY-MM-DD_topic.md
    safe_topic = sanitize_filename(topic)
    filename = f"{date}_{safe_topic}.md"
    filepath = get_student_dir(student) / filename

    # Create markdown content
    md_content = f"""# {student} - Lesson Log

## {date} ({weekday}) {start_time}-{end_time} | {location}

**Topic**: {topic}

### Content
{content if content else "- "}

### Next Steps
{next_steps if next_steps else "- [ ] "}
"""

    filepath.write_text(md_content, encoding="utf-8")
    return filepath


def main():
    parser = argparse.ArgumentParser(description="Log a tutoring lesson")
    parser.add_argument("student", help="Student name")
    parser.add_argument("--date", "-d", help="Date (YYYY-MM-DD), default: today")
    parser.add_argument("--start", "-s", required=True, help="Start time (HH:MM)")
    parser.add_argument("--end", "-e", required=True, help="End time (HH:MM)")
    parser.add_argument("--location", "-l", required=True, help="Location")
    parser.add_argument("--topic", "-t", required=True, help="Lesson topic")
    parser.add_argument("--content", "-c", default="", help="Lesson content")
    parser.add_argument("--next", "-n", default="", help="Next steps")

    args = parser.parse_args()

    # Default date to today
    date = args.date or datetime.now().strftime("%Y-%m-%d")

    filepath = create_lesson_file(
        student=args.student,
        date=date,
        start_time=args.start,
        end_time=args.end,
        location=args.location,
        topic=args.topic,
        content=args.content,
        next_steps=args.next,
    )

    print(f"[OK] Lesson logged: {filepath}")
    print(f"     Student: {args.student}")
    print(f"     Date: {date} {args.start}-{args.end}")
    print(f"     Location: {args.location}")
    print(f"     Topic: {args.topic}")


if __name__ == "__main__":
    main()
