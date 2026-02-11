# cocv-art-send-merge-result

**Version:** 0.2.0

Send merge completion notification with Korean MR summary as a thread reply.

## Changelog

- **0.2.0** - Migrate to MCP server (`art`). Python script removed, uses `thread_get()` + `slack_post_message()` tools. Claude generates Korean summary from git analysis
- **0.1.0** - Initial release

## Overview

After an art branch is merged to develop, this skill:
1. Gets thread info via `thread_get()`
2. Analyzes git changes via `Bash(git:*)`
3. Claude generates Korean MR summary
4. Sends summary as thread reply via `slack_post_message()`

## 사용법

```
/cocv-art-send-merge-result <branch_name>
/cocv-art-send-merge-result --list
```

## Dependencies

- Requires `/cocv-art-create-branch` to be run first (saves thread info)
- Thread info stored in `~/.claude/private/slack_threads.json`
- Uses repo path from `get_art_config()`

## 구현

MCP 서버 `cocv`의 `thread_get()` + `get_art_config()` + `slack_post_message()` 도구 조합. Git 분석은 `Bash(git:*)`.

## 파일 구조

```
cocv-art-send-merge-result/
└── SKILL.md    # 이 문서
```
