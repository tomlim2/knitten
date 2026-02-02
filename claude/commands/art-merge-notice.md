---
allowed-tools: Bash(python:*)
description: Send merge notice as thread reply to art branch announcement
argument-hint: "<branch_name> | --list"
---

# Art Merge Notice

Send a threaded reply to an art branch announcement notifying that the branch will be merged.

## Usage

```
/art-merge-notice <branch_name>
/art-merge-notice --list
```

## Execute

Run the merge notice script:

```bash
cd ~/.claude/skills/art-merge-notice && python merge_notice.py $ARGUMENTS
```

## Options

- `<branch_name>` - Branch to send merge notice for
- `--list` - List available branches with saved thread info

## Example

```
/art-merge-notice art/art-main-1.5.0-r2
```

## Message Sent

```
{branch_name} 아트 브렌치 디벨롭에 머지합니다.

반드시 리다이렉터 업데이트, 커밋, 푸시 및 언락 부탁드립니다!
```
