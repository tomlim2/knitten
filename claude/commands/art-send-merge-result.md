---
description: Send merge completion with Korean MR summary as thread reply
argument-hint: "<branch_name> | --list"
allowed-tools: Bash(git:*), Bash(python:*)
---

# Art Send Merge Result

Send merge completion notification with a Korean MR summary
as a thread reply to the original art branch announcement.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `art-send-merge-result`

## Usage

```
/art-send-merge-result <branch_name>
/art-send-merge-result --list
```

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

**If `--list`, run:**
```bash
python ~/.claude/skills/art-send-merge-result/merge_done.py --list
```

## Arguments

$ARGUMENTS

## 실행

### Step 1: Analyze changes

Run git commands to understand what was merged:

```bash
git fetch --all
git log develop..origin/<branch_name> --oneline
git diff develop...origin/<branch_name> --stat
```

If the merge branch `art/merge/...` exists, use that instead.

### Step 2: Generate Korean MR summary

Based on the git analysis, generate a Korean summary following
this format:

```
<branch_name> 디벨롭에 머지 완료되었습니다!

## 요약
[1-2줄 변경사항 요약]

## 변경 내용
- [주요 변경사항 1]
- [주요 변경사항 2]
- ...
```

Guidelines:
- Write in Korean
- Keep it concise but informative (like the MR description
  from `/art-prepare-merge`, but in Korean)
- Group changes by category (캐릭터, 맵, 셰이더, etc.)
- Include file count and commit count

### Step 3: Show message and confirm

**Show the user the full Slack message and ask for confirmation:**

> **채널:** art 채널 (thread reply, broadcast)
> **메시지:**
> ```
> [the Korean summary generated above]
> ```

**NEVER send without user confirmation.**

### Step 4: Send via script

Send the Korean summary as a custom message:

```bash
python ~/.claude/skills/art-send-merge-result/merge_done.py <branch_name> -m "<THE KOREAN SUMMARY>"
```

Replace `<branch_name>` and `<THE KOREAN SUMMARY>` with actual values.

## Example

```
/art-send-merge-result art/art-main-1.5.0-r2
```

Example Korean summary:

```
art/art-main-1.5.0-r2 디벨롭에 머지 완료되었습니다!

## 요약
캐릭터 의상 9벌, 헤어 5종, 맵 환경 업데이트,
VRM 셰이더 개선 등 155개 파일 변경

## 변경 내용
- 여성 의상: F_DL003, F_NU001, F_PJ001/002, F_Police001
- 남성 의상: M_DL004, M_DcT001, M_DM002, M_Police001
- 헤어: Freyja, Marron, Azul (리네이밍 포함)
- 맵: 뒷골목 수정, ParkLake 벤치 교체, fixture mark
- 셰이더: VRM 시간대 반응, 머테리얼 색상 보정
```
