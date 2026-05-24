# Operational Findings Fast Track Manual

Use this only when the user explicitly says a finding needs urgent handling.

## Steps

1. Capture the finding first, preserving the initial report.
2. Mark the report as urgent:
   - frontmatter `urgent: true`
   - body `Fast Track: yes`
3. Decide the immediate owner:
   - skill edit
   - rule or standard update
   - validator fix
   - spec or milestone item
   - docs/config/workflow correction
4. Implement the urgent fix in a normal task branch or worktree, not directly
   in the findings worktree.
5. Link the fix back in the report and update status to `promoted`, `parked`,
   `merged`, or `discarded`.

Fast track changes still require normal validation for the target artifact.
