---
status: accepted
platforms: pi
portability: harness-specific
---
# File System Boundaries Rule

You operate within a sandboxed file system enforced by an interceptor extension (`sandbox-crud.ts`).

## Rules

1. **Allowed Zones**: You may only read, edit, or write files in:
   - The current working directory (the active project).
   - The `caol-ila/agent/` durable source directories (e.g., `skills`, `commands`, `rules`, `standards`, `config`).
2. **Hard Block**: Any attempt to modify system files, SSH keys, or projects outside of the designated scope will be programmatically blocked by the `tool_call` interceptor.
3. **Bash Restrictions**: Do not attempt to bypass the sandbox via bash commands (e.g., `cd ..`, `cd /`, or absolute paths to unauthorized folders). If blocked, acknowledge the boundary and adjust your approach.