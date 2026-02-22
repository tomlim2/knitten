---
description: Log a tutoring lesson
argument-hint: "<student> --start HH:MM --end HH:MM --location \"place\" --topic \"topic\""
allowed-tools: Bash(python:*)
---

# tutoring-log-lesson

Log a new tutoring lesson.
## Usage

```
/tutoring-log <student> --start HH:MM --end HH:MM --location "place" --topic "topic"
```

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

## Execute

Run the tutoring log script:

```bash
cd ~/.claude/skills/tutoring-log-lesson && python log.py $ARGUMENTS
```

## Options

- `--date, -d` - Date (YYYY-MM-DD), default: today
- `--start, -s` - Start time (HH:MM) [required]
- `--end, -e` - End time (HH:MM) [required]
- `--location, -l` - Location [required]
- `--topic, -t` - Lesson topic [required]
- `--content, -c` - Lesson content notes
- `--next, -n` - Next steps / homework

## Example

```
/tutoring-log John --start 14:00 --end 16:00 --location "Starbucks Gangnam" --topic "Blender Rigging"
```
