---
description: Send merge completion with Korean MR summary as thread reply
argument-hint: "<branch_name> | --list"
allowed-tools: MCP(cocv), Bash(git:*)
---

# Art Send Merge Result

Send merge completion notification with a Korean MR summary
as a thread reply to the original art branch announcement.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-art-send-merge-result`

## Usage

```
/cocv-art-send-merge-result <branch_name>
/cocv-art-send-merge-result --list
```

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

**If `--list`**, call `thread_list()` and display results.

## Arguments

$ARGUMENTS

## 실행

### Step 1: Get thread info

```
thread_get(branch_name=$ARGUMENTS)
```

If `found: false`, show error and call `thread_list()` to display available branches.

### Step 2: Get repo path

```
get_art_config()
```

Use the returned `repo_path` for git commands.

### Step 3: Analyze changes

Run git commands in the repo to understand what was merged:

```bash
git -C <repo_path> fetch --all
git -C <repo_path> log develop..origin/<branch_name> --oneline
git -C <repo_path> diff develop...origin/<branch_name> --stat
```

If the merge branch `art/merge/...` exists, use that instead.

### Step 4: Generate Korean MR summary

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
  from `/cocv-art-prepare-merge`, but in Korean)
- Group changes by category (캐릭터, 맵, 셰이더, etc.)
- Include file count and commit count

### Step 5: Show message and confirm

**Show the user the full Slack message and ask for confirmation:**

> **채널:** art 채널 (thread reply, broadcast)
> **메시지:**
> ```
> [the Korean summary generated above]
> ```

**NEVER send without user confirmation.**

### Step 6: Send via MCP

```
slack_post_message(text=<Korean summary>, thread_ts=<ts from step 1>, broadcast=true)
```

## Example

```
/cocv-art-send-merge-result art/art-main-1.5.0-r2
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
