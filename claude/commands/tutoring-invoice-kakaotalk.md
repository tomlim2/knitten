---
description: Generate KakaoTalk message from invoice PDF path
argument-hint: "<invoice_pdf_path>"
allowed-tools: Bash(python:*)
---

# Tutoring Invoice KakaoTalk Message

Generate a KakaoTalk message for sending tuition invoice to parents.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `tutoring-invoice-kakaotalk`

## Arguments

`$ARGUMENTS` = PDF invoice path

**If no argument is provided, show usage and ask the user for the path. NEVER auto-execute.**

```
Usage: /tutoring-invoice-kakaotalk <pdf-path>
```

## Execution

1. Read PDF to extract:
   - Student name (학생이름)
   - Month (월)
   - Total amount (총액)
   - Lesson dates with duration (수업일정)

2. Generate message using template (leave `[수업내용]` as placeholder for user to fill in):

```
안녕하세요, [학생이름]이 어머님!
[월]월 수업료 청구드립니다.

* 총 청구액: [금액]원
* 입금 계좌: 하나은행 58191011723307 (임연수)
* 수업 기간: [수업일정]
* 수업 내용: [수업내용]

자세한 수업 내역은 별도 PDF로 보내드려요!
```

3. Copy to clipboard

## Bank Info (fixed)

- Bank: 하나은행
- Account: 58191011723307
- Holder: 임연수
