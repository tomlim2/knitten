---
load: triggered
trigger: git op in a CINEV repo
---

- **Check UE first** — Before ANY git op on a CINEV project, detect running `UnrealEditor.exe` and which project it has locked
- **Never operate on locked project** — If UE is on `cinev-studio` use `cinev-engine`, and vice versa. NEVER run git commands on the project where Unreal Editor is running
- **Commit dangling changes first** — Always `git status` before the intended op. If there are uncommitted changes, commit them first (with user-approved message) before proceeding
- **Applies to:** All `cci-*` skills and commands that touch git, including art-branch prepare, create, and remove operations.
- Full workflow + wmic commands (Read on demand): `~/.claude/skills/cci-manage-art-branch/references/CINEV-GIT-WORKFLOW.md`
