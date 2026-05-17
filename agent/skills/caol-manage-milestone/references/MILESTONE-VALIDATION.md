---
status: accepted
---

# Milestone Validation

## Base Commands

Run after every milestone change:

```bash
git diff --check
node scripts/validate-llm-first.mjs
git status --short --branch
```

## File Checks

```bash
test -f docs/milestones/<slug>.md
rg -n "^status:|^created:|^updated:|^owner:" docs/milestones/<slug>.md
```

## Attach Checks

```bash
rg -n "^milestone: <slug>$" docs/plans/<spec>.md
rg -n "\\.\\./plans/<spec>\\.md|docs/plans/<spec>\\.md" docs/milestones/<slug>.md
```

## Detach Checks

```bash
! rg -n "\\.\\./plans/<spec>\\.md|docs/plans/<spec>\\.md" docs/milestones/<slug>.md
! rg -n "^milestone: <slug>$" docs/plans/<spec>.md
```

If a shell does not support leading `!` in a copied command, run the `rg`
command and require zero matches.

## Review Checks

| Area | Command or inspection |
|------|-----------------------|
| milestone links | read every `../plans/*.md` link in the `## Specs` table |
| spec existence | `test -f docs/plans/<spec>.md` |
| backlink | `rg -n "^milestone: <slug>$" docs/plans/<spec>.md` |
| status | compare spec frontmatter `status:` with milestone row status |
| progress evidence | each progress row has a concrete file, command, or status phrase |
| blocker currency | each blocker names the dependency or decision |

## Future Validator Checks

Add script checks after the pilot proves the format:

1. every `docs/plans/*.md` `milestone:` maps to `docs/milestones/<slug>.md`;
2. every milestone `## Specs` link resolves or is marked `todo`;
3. linked spec status and milestone row status match or document a reason;
4. completed milestones have no unresolved blockers.
