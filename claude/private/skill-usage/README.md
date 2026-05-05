# skill-usage

Per-machine append-only logs of Claude Code skill invocations. The Caol HQ
dashboard aggregates these across every machine the user works on.

## Layout

```
skill-usage/
├── README.md                                # this file
└── <machine_id>/                            # ULID/UUID from hardware.json
    ├── 2026-05.jsonl                        # one file per month
    ├── 2026-06.jsonl
    └── ...
```

`machine_id` is the durable identifier (UUID/ULID written into
`hardware.json` once per machine). The display `name`
(`macbook-pro-personal`, `desktop-company`) is rename-safe and lives
only in `hardware.json`.

## Schema (one row per Skill invocation)

```jsonc
{
  "ts": "2026-05-05T05:30:00Z",   // ISO UTC
  "utc_offset_min": 540,           // local offset at capture time (KST = +540)
  "sid": "session-xxxxx",          // Claude Code session_id from the hook payload
  "skill": "shotloom-make-pr",     // matches the SKILL.md directory name
  "source": "slash"                // present only for user-typed slash commands;
                                   // omitted when the model called the Skill tool
}
```

`cwd` and `args` are intentionally omitted to keep durable git history
free of incidental sensitive data. If a future analysis needs them they
should be added behind an explicit allowlist.

## Capture (two hooks, one schema)

| Hook                          | Script                | Catches                                           |
|-------------------------------|-----------------------|---------------------------------------------------|
| `PreToolUse` matcher=`Skill`  | `log-skill-usage.sh`  | Model-initiated `Skill` tool calls                |
| `UserPromptSubmit`            | `log-slash-usage.sh`  | User-typed `/skill-name` slash commands           |

Both are needed: Claude Code expands user slashes inline (`<command-name>`
block injected into the model context) without firing a tool-use event,
so `PreToolUse` alone misses the overwhelming majority of real usage.
Background and verification: `claude/learnings/learning-claude-code-hooks.md`.

No buffering — one row per invocation, OS-atomic for typed payloads (≤4KB).

## Sync

`launchd` timer pushes the repo every 30 minutes:

1. `git pull --rebase` (no-op when nothing remote)
2. `git add claude/private/skill-usage`
3. `git diff --quiet --cached || git commit -m "skill-usage: <machine> auto"`
4. `git push` (retry next tick on failure)

The dashboard `git pull --quiet` (5s timeout) before reading; offline
falls back to stale data.

## Conflict semantics

Each machine writes only to its own `<machine_id>/` directory, so two
machines never modify the same file. Concurrent runs on the same
machine append to the same JSONL — POSIX guarantees atomic writes
≤PIPE_BUF (4KB), and rows are well under that.

## Rotation

Monthly file. Last day of December rolls into next year. Annual
squash/archive is possible later (rewriting history of
`<machine_id>/2026-*` into `<machine_id>/2026.tar.zst`) without
touching newer months.
