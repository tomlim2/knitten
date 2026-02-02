# art-merge-notice

**Version:** 0.1.0

Send merge notification as a threaded reply to an art branch announcement.

## Changelog

- **0.1.0** - Initial release

## Overview

When an art branch is ready to be merged into develop, this skill sends a threaded reply to the original branch announcement on Slack.

## Usage

```bash
python merge_notice.py <branch_name>
python merge_notice.py --list
```

## Options

- `<branch_name>` - The branch to send merge notice for
- `--list` - List all branches with saved thread info

## Example

```bash
python merge_notice.py art/art-main-1.5.0-r2
```

## Message Format

```
{branch_name} 아트 브렌치 디벨롭에 머지합니다.

반드시 리다이렉터 업데이트, 커밋, 푸시 및 언락 부탁드립니다!
```

## Dependencies

- Requires `/create-art-branch` to be run first (saves thread info)
- Thread info stored in `~/.claude/private/slack_threads.json`

## Configuration

Uses shared Slack config from `~/.claude/config/slack.json`:
- `bot_username` - Bot display name
