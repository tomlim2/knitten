---
description: Move latest PDF from Downloads to Obsidian tutoring/invoices
argument-hint: "<student_name>"
allowed-tools: Bash(mv:*), Bash(ls:*)
---

# Move Invoice

Move the latest invoice PDF from Downloads folder to Obsidian `claude/tutoring/invoices/` with proper naming.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `tutoring-move-invoice`

## Arguments

User provides: $ARGUMENTS (student name)

**If no argument is provided, show usage and stop. NEVER auto-execute.**
```
Usage: /tutoring-move-invoice <student_name>
```

## What it does

1. Finds the latest PDF in ~/Downloads
2. Renames it to `YYYY-MM_StudentName.pdf` format
3. Moves to Obsidian `claude/tutoring/invoices/`
4. Reports the new location

## Execution

```bash
STUDENT_NAME="$ARGUMENTS"

if [ -z "$STUDENT_NAME" ]; then
  echo "❌ 에러: 학생 이름이 필요합니다."
  echo "사용법: /tutoring-move-invoice <학생이름>"
  exit 1
fi

# Find latest PDF in Downloads
LATEST_PDF=$(ls -t ~/Downloads/*.pdf 2>/dev/null | head -1)

if [ -z "$LATEST_PDF" ]; then
  echo "❌ 에러: Downloads 폴더에 PDF 파일을 찾을 수 없습니다."
  exit 1
fi

# Get current month
MONTH=$(date +"%Y-%m")

# Create target directory
TARGET_DIR="$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/claude/tutoring/invoices"
mkdir -p "$TARGET_DIR"

# New filename
NEW_NAME="${MONTH}_${STUDENT_NAME}.pdf"
TARGET_PATH="$TARGET_DIR/$NEW_NAME"

# Move file
mv "$LATEST_PDF" "$TARGET_PATH"

echo "✅ Invoice moved successfully!"
echo "   From: $(basename "$LATEST_PDF")"
echo "   To: $TARGET_PATH"
```

## Example

```
/tutoring-move-invoice 학생1
→ Downloads/학생1_1월_수업료청구서.pdf
→ Obsidian/claude/tutoring/invoices/2026-01_학생1.pdf
```

## Typical Workflow

1. `/open-invoice 학생1` - Open web app
2. Add lesson dates → Click "PDF로 저장"
3. Alert shows: "명령이 클립보드에 복사되었습니다"
4. `Cmd+V` to paste: `/tutoring-move-invoice 학생1`
5. Done!
