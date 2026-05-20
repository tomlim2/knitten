---
load: triggered
trigger: writing Shotloom docs to Knitten
---

# Shotloom Docs Lane

Use one Knitten docs branch per KST day for every Shotloom document written to
Knitten.

| Field | Rule |
|-------|------|
| Branch | `codex/YYYYMMDD-shotloom-docs` |
| Worktree | `../knitten-worktrees/YYYYMMDD-shotloom-docs` when the primary Knitten checkout is not already on the branch |
| PR title | `chore(shotloom): collect YYYY-MM-DD planning docs` |
| Commit subject | `chore(shotloom): collect planning docs` |

Identity split:

| Surface | Required identity |
|---------|-------------------|
| Shotloom implementation repo | `tomlim2 <deemo@vonvon.me>` |
| Knitten docs lane commits | `tomlim2 <tomandlim@gmail.com>` |

Do not compare the Knitten docs lane identity against the Shotloom
implementation identity. Check the identity in the repo where the commit will be
made.

Applies when a Shotloom flow writes any of these paths in Knitten:

| Path | Examples |
|------|----------|
| `docs/briefings/shotloom/**` | Ready briefings from `/shotloom-start-task` |
| `docs/plans/proposed/**` with `repo: shotloom` | specs from `/shotloom-draft-spec` |
| `docs/plans/drafts/**` with `repo: shotloom` | blocked or partial Shotloom specs |
| `agent/obsidian-staging/projects/shotloom/**` | Shotloom day logs staged in Knitten |

Required behavior:

1. Resolve Knitten with `ah-resolve-doc-path` or repo config before writing.
2. If today's branch exists locally, use it.
3. Else if `origin/codex/YYYYMMDD-shotloom-docs` exists, check it out.
4. Else create it from current `origin/main`.
5. Put every Shotloom Knitten doc for the day on that branch.
6. After commit and push, create or update one PR for that daily branch.

Do not create per-STL Knitten branches for Shotloom docs. Per-STL branches stay
inside the Shotloom repo for implementation work.
