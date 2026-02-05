# caol-ila Learnings

Last updated: 2026-02-05

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

