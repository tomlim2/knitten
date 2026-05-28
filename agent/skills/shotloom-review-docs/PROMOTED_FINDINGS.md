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

### Require workflow operational contract proof

- Source: recent approved Shotloom PR dry-run, 2026-05-28.
- Trigger: a PR adds or changes CI jobs, required gates, smoke tests, workflow
  permissions, cache topology, or package scripts.
- Check: verify each new required job executes meaningful coverage, each smoke
  test asserts the exact failure contract it claims, permissions are scoped to
  the workflow action, and workflow docs describe operator-facing behavior.
- Fix Shape: add a workflow contract matrix or validator that records job
  purpose, command proof, zero-test rejection, permission surface, cache scope,
  and exact smoke expectations.
- Status: active

### Cross-check durable contract docs with ADR and schema sources

- Source: recent approved Shotloom PR dry-run, 2026-05-28.
- Trigger: a PR changes durable bundle, asset, bridge, import, export, or
  persisted metadata contract docs.
- Check: verify ADR coverage, schema terminology, deferred-behavior wording,
  examples, TypeScript/Rust contract references, and rejection semantics agree
  with the durable owner documents.
- Fix Shape: update the owning ADR, schema docs, contract examples, and
  validation notes in the same PR, or mark the mismatch as an explicit blocked
  contract decision.
- Status: active
