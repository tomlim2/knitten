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
node scripts/validate-llm-first.mjs --check spec-lifecycle
```

## Detach Checks

```bash
node scripts/validate-llm-first.mjs --check spec-lifecycle
```

The validator checks resolved spec paths, milestone backlinks, and row status.

## Review Checks

| Area | Command or inspection |
|------|-----------------------|
| milestone links | read every Markdown link in the `## Specs` table |
| spec existence | resolved spec path exists under `docs/plans/` |
| backlink | spec frontmatter has `milestone: <slug>` |
| status | compare spec frontmatter `status:` with milestone row status |
| progress evidence | each progress row has a concrete file, command, or status phrase |
| blocker currency | each blocker names the dependency or decision |

## Future Validator Checks

Add script checks after the pilot proves the format:

1. completed milestones have no unresolved blockers;
2. lifecycle folder root shape matches `docs/plans/` migration rules;
3. Shotloom briefing/spec consistency is covered by a domain-specific check.
