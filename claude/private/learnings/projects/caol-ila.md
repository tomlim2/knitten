# caol-ila Learnings

Last updated: 2026-02-08

---

## Conventions Discovered

Patterns specific to this codebase.

| Pattern | Why It Matters |
|---------|----------------|
| Design system is source of truth | All tools/skills must conform to `standards/design-system.md` |
| **New UIs must have versioning from day 1** | Add VERSION constant, display in footer, create CHANGELOG.md from the start |

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

