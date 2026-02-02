# art-merge-done

**Version:** 0.1.0

Check if art branch was merged to develop and send completion notifications.

## Changelog

- **0.1.0** - Initial release

## Overview

After an art branch is merged to develop, this skill:
1. Checks if the branch was merged (by looking at develop commits this week)
2. Sends "디벨롭에 머지 완료되었습니다!" as a thread reply
3. Sends merge details as a second thread reply

## Usage

```bash
python merge_done.py <branch_name>
python merge_done.py --list
```

## Options

- `<branch_name>` - The branch to check merge status for
- `--list` - List all branches with saved thread info

## Example

```bash
python merge_done.py art/art-main-1.5.0-r2
```

## Messages Sent

1. First reply:
   ```
   디벨롭에 머지 완료되었습니다!
   ```

2. Second reply:
   ```
   **머지 내역:**
   [commit details]
   ```

## Dependencies

- Requires `/art-create` to be run first (saves thread info)
- Thread info stored in `~/.claude/private/slack_threads.json`
- Uses repo path from `art-create/config.json`

## Configuration

Uses shared Slack config from `~/.claude/config/slack.json`:
- `bot_username` - Bot display name
