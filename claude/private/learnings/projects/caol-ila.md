# caol-ila Learnings

Last updated: 2026-02-11

---

## Conventions Discovered

Patterns specific to this codebase.

| Pattern | Why It Matters |
|---------|----------------|
| Design system is source of truth | All tools/skills must conform to `standards/design-system.md` |
| **New UIs must have versioning from day 1** | Add VERSION constant, display in footer, create CHANGELOG.md from the start |
| Skills/commands are now a unified system | Official docs merged them. Skill takes precedence if both exist with same name. Skills are recommended format |
| `standards/` ≠ `rules/` — different roles | `rules/` = auto-loaded every session (short rules). `standards/` = read on-demand (long reference docs). Don't mix them |
| CLAUDE.md should be concise (context budget) | Loaded every session. 402→160줄 trim worked well. Move verbose content to `@import` or supporting files |
| Use `~/.claude` not hardcoded OS paths | Cross-platform (Windows work + macOS home). Never hardcode `D:\` or `/Users/` paths in shared config |
| Official frontmatter has 10 fields | `name`, `description`, `argument-hint`, `allowed-tools`, `disable-model-invocation`, `user-invocable`, `context`, `agent`, `model`, `hooks` |

---

## What Worked

Approaches worth repeating.

### UE MaterialFunction expression extraction via ObjectIterator
- **Date**: 2026-02-05
- **Context**: `MaterialFunction` doesn't expose `function_expressions` as a Python editor property (unlike `Material` which exposes `expressions`). `MaterialEditingLibrary` methods like `get_inputs_for_material_expression` also reject `MaterialFunction` (expects `Material` type). `get_num_material_expressions_in_function` confirms expressions exist but provides no way to list them.
- **Solution**: Use `unreal.ObjectIterator(unreal.MaterialExpression)` and filter by `obj.get_outer().get_path_name() == mf.get_path_name()`. This finds all expression objects whose outer is the target MaterialFunction. Filter by exact path (not just name) to avoid CDO duplicates.
- **Why it worked**: UE stores expressions as sub-objects of the MaterialFunction. ObjectIterator walks all loaded UObjects, and the outer chain correctly identifies ownership. Path-based filtering (vs name-based) eliminates the 2x duplicate issue from default objects.

### UE Python Remote Execution for Claude Code integration
- **Date**: 2026-02-05
- **Context**: Needed to trigger UE Editor Python scripts from Claude Code terminal without manual copy-paste into UE console.
- **Solution**: Use UE's built-in `remote_execution.py` module (at `Engine/Plugins/Experimental/PythonScriptPlugin/Content/Python/`). UDP multicast discovery on port 6766, TCP commands on port 6776. Send the **file path** (not content) with `MODE_EXEC_FILE` - UE loads the file directly.
- **Why it worked**: CINEVStudio already has `bRemoteExecution=True` in DefaultEngine.ini. Sending file path avoids the issue where `ExecuteFile` mode tries to interpret the first line of code content as a file path.

### CLAUDE.md review against official docs (402→160 lines)
- **Date**: 2026-02-09
- **Context**: CLAUDE.md had grown to 402 lines with philosophy sections, FAQ, outdated architecture tree, and Windows-hardcoded paths. Every session loaded all of it into context.
- **Solution**: Reviewed against official Claude Code docs (code.claude.com/docs/en/skills, /memory). Removed non-actionable content (Philosophy verbose, FAQ, "What Is This?", "Final Thought"). Reflected skills/commands merge. Updated frontmatter field table to official 10 fields. Used `@import` syntax for references. Compressed Architecture tree and Domain Standards to tables.
- **Why it worked**: Official best practice: "Be specific", use structured bullet points. CLAUDE.md is user memory (`~/.claude/CLAUDE.md`) loaded every session — context budget matters. 60% reduction means faster session starts and more room for actual work context.

### review-skills expanded to cover both commands and skills
- **Date**: 2026-02-09
- **Context**: `/review-skills` only reviewed command files (11 checks). Skills (SKILL.md) were not covered at all.
- **Solution**: Added scope argument (`commands|skills|all`), added 13-check skill checklist (Structure S1-S4, Content SC1-SC4, Frontmatter SF1-SF3, Compatibility SX1-SX2). Absorbed 4 checks from official spec: description recommended (SF1), valid frontmatter fields only (SF2), name format max 64 chars (SF3), SKILL.md under 500 lines (SC4).
- **Why it worked**: Selective absorption — took only the useful parts from official spec rather than adopting everything. Official spec is intentionally minimal; our internal standards (Version, Changelog, Usage) add value on top.

### Background execution for command pre-execution tracking (570x faster)
- **Date**: 2026-02-08
- **Context**: Every slash command tracks usage via `curl` POST to skill server (port 972) for statistics. Original synchronous implementation blocked command execution for 0.571 seconds, making all commands feel sluggish.
- **Solution**: Run `curl` in background with `&`, add `--max-time 0.3` timeout, keep `2>/dev/null` for silent errors.

  **Command:**
  ```bash
  curl -X POST http://localhost:972/api/usage/track \
    -H "Content-Type: application/json" \
    -d '{"type":"commands","id":"$COMMAND_NAME"}' \
    --max-time 0.3 2>/dev/null &
  ```
- **Why it worked (570x performance gain)**:
  - **Blocking vs Non-blocking I/O**: Original synchronous `curl` forced the parent process to wait for HTTP request completion (TCP handshake, request send, response receive, connection close). With `&`, the parent process continues immediately after forking, taking only ~0.001s (fork overhead). The child process handles network I/O independently.
  - **Network latency elimination**: The 0.571s was almost entirely network I/O wait time (even on localhost, HTTP protocol overhead adds up). By backgrounding, this wait time is moved out of the critical path - the command starts while tracking happens in parallel.
  - **Fast failure with timeout**: `--max-time 0.3` ensures that if the skill server is down, the background process dies quickly (0.3s) instead of hanging indefinitely or waiting for TCP timeout (~30s default). This prevents zombie processes.
  - **Process lifecycle**: The `&` operator forks a child process that inherits the parent's file descriptors but runs independently. The parent (Claude Code command) doesn't wait for the child to exit (`wait()` is not called). The child either succeeds (tracking recorded) or fails silently (server down), both without impacting command execution.
  - **Shell job control**: The shell manages the background job. `2>/dev/null` redirects stderr to prevent error messages from appearing in the user's terminal if the server is unreachable.
- **Result**: Commands execute instantly (0.001s overhead instead of 0.571s). User experience improved significantly - no perceived delay when running commands. Tracking still works when server is running, fails silently when not.

### Claude Code 확장 시스템 전체 아키텍처 정리
- **Date**: 2026-02-10
- **Context**: Claude Code의 확장 메커니즘이 여러 레벨에 걸쳐 있어서 각각의 역할과 차이를 명확히 정리할 필요가 있었음.
- **Solution**: 4가지 확장 레벨로 분류:
  - **레벨 1: Skills/Commands** — 프롬프트(지시문). 메인 대화에서 실행. `skills/`, `commands/`에 저장.
  - **레벨 2: Subagents** — 독립 컨텍스트의 작업자. 별도 시스템 프롬프트, 도구 제한, 모델 선택 가능. 결과만 메인에 반환. 최대 7개 병렬. `agents/`에 저장.
  - **레벨 3: Agent Teams** — 여러 세션이 서로 메시지를 주고받으며 협업. 실험적 기능(기본 비활성). 대규모 병렬, 토론, 경쟁 가설에 적합.
  - **레벨 4: Agent SDK** — 프로그래밍으로 오케스트레이션. TypeScript/Python에서 Claude를 프로그래밍적으로 제어.
- **핵심 차이 — Skill vs Subagent**:
  - Skill = 지시문. 메인 대화 안에서 실행. Claude가 자동 로드하거나 `/name`으로 호출.
  - Subagent = 별도 두뇌. 자체 시스템 프롬프트, 도구 제한, 모델 선택. 결과만 메인에 반환.
  - 접점: Skill에 `context: fork` + `agent: Explore` 설정하면 Skill이 Subagent 안에서 실행됨.
- **실용적 판단 기준**: 순차 워크플로우 + 사용자 확인 필요 → Skill. 무거운 탐색/리뷰 → Subagent (`context: fork`). 대규모 병렬 토론 → Agent Teams.
- **Sources**: code.claude.com/docs/en/skills, /sub-agents, /agent-teams

### Art 스킬 MCP 서버 전환 (Python 4개 → MCP 1개)
- **Date**: 2026-02-11
- **Context**: Art 스킬 4개(`create_art_branch.py`, `send_notice.py`, `merge_notice.py`, `merge_done.py`)에 `load_env()`, `load_slack_config()`, `send_thread_reply()` 등 6개 함수가 2~4개 파일에 중복. `_shared/` 패턴은 Claude Code 비공식. 총 ~800줄의 중복 인프라 코드.
- **Solution**: FastMCP 서버 1개(`art-mcp-server/server.py`, ~120줄)로 통합. 5개 도구 제공: `slack_post_message`, `thread_save`, `thread_get`, `thread_list`, `get_art_config`. 커맨드는 `MCP(art)` + `Bash(git:*)` 조합으로 전환. Python 스크립트 4개 + `.env.example` 2개 삭제.
- **Why it worked**:
  - **역할 분리**: 인프라(Slack API, 스레드 저장) → MCP 서버. 비즈니스 로직(시간 계산, 메시지 포맷팅) → command.md. 오케스트레이션 → Claude.
  - **MCP가 공식 패턴**: `_shared/` Python import는 Claude Code에서 비공식. MCP는 도구 확장 공식 메커니즘. `claude mcp add art --scope user`로 등록.
  - **Claude가 오케스트레이터**: 기존에는 Python이 블랙박스로 처리 → 에러 시 스크립트 에러 메시지만 전달. 이제 Claude가 각 단계를 이해하고 직접 판단/대응.
  - **크로스 플랫폼**: Windows 하드코딩 경로(`C:\Users\TA_yeonsu\...`) 제거. `Path.home()` 사용.
  - **확장 가능**: `slack_post_message`에 `channel` 파라미터 추가하면 art 외 다른 도메인에서도 재사용 가능.
- **Result**: 17 files changed, +404 / -956. 순감소 552줄. 중복 코드 제거 + 유지보수 포인트 1곳으로 통합.

---

## What Failed

Approaches that seemed good but weren't.

---

## Gotchas

Non-obvious issues that cause problems.

| Issue | How to Handle |
|-------|---------------|
| **NEVER update design-system.md without permission** | Always ask user first before making any changes to `standards/design-system.md`. Propose changes verbally, get approval, then implement. |
| **Version bumps only on request** | Never bump versions (tags, VERSION constants) unless user explicitly asks. |
| **Symlink causes duplicate skills in caol-ila** | `~/.claude` → `caol-ila/claude` means Claude Code reads skills from both global and project paths. Duplicates only appear when working inside caol-ila itself. Expected behavior, no fix needed. |
| **learn-add-log has hardcoded Windows paths** | Command references `D:\vs\caol-ila\...` — should use `~/.claude/private/learnings/` for cross-platform. |

