# Promoted Findings: Docs And Workflow Review Layer

This ledger contains operational findings promoted into Shotloom docs, markup,
workflow YAML, and prose-contract review. Read it during `/shotloom-review-docs`
after `reference.md`, and use matching entries as supplemental review lenses.

## Active Entries

### Review release workflows for exact safety semantics

- Source: `docs/briefings/operational-findings/reports/20260528-shotloom-release-workflows-need-exact-safety-gates.md`
- Trigger: a PR changes release, deploy, registry, cache, or published-image
  smoke workflow behavior.
- Check: inspect cancellation semantics, cache exposure, exact negative smoke
  expectations, and workflow contract docs alignment.
- Fix Shape: use cancellation-sensitive conditions, constrained cache exports,
  exact expected status checks, and committed workflow docs for changed release
  contracts.
- Status: active
