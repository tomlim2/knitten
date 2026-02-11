# cocv-art-send-merge-notice

**Version:** 0.2.0

Send merge notification as a threaded reply to an art branch announcement.

## Changelog

- **0.2.0** - Migrate to MCP server (`art`). Python script removed, uses `thread_get()` + `slack_post_message()` tools
- **0.1.0** - Initial release

## Overview

When an art branch is ready to be merged into develop, this skill sends a threaded reply to the original branch announcement on Slack.

## 사용법

```
/cocv-art-send-merge-notice <branch_name>
/cocv-art-send-merge-notice --list
```

## Message Format

```
{branch_name} 아트 브렌치 디벨롭에 머지합니다.

반드시 리다이렉터 업데이트, 커밋, 푸시 및 언락 부탁드립니다!
```

## Dependencies

- Requires `/cocv-art-create-branch` to be run first (saves thread info)
- Thread info stored in `~/.claude/private/slack_threads.json`

## 구현

MCP 서버 `cocv`의 `thread_get()` → `slack_post_message()` 도구 조합.

## 파일 구조

```
cocv-art-send-merge-notice/
└── SKILL.md    # 이 문서
```
