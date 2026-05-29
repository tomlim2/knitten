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

### Review UI placement docs by action family

- Source: `docs/briefings/operational-findings/reports/20260529-reviewer-found-that-a-durable-persistence-spec-partially-neutralized-new.md`
- Trigger: a PR moves menu, toolbar, topbar, overlay, or persistence actions between UI surfaces.
- Check: sweep the full action family in specs and operator docs instead of updating only the action named in the implementation diff.
- Fix Shape: update every sibling action reference in the owning spec, including stale menu, topbar, export, import, and new-bundle wording, or record an explicit exception.
- Status: active

### Match durable grammar prose to concrete validators

- Source: `docs/briefings/operational-findings/reports/20260529-reviewer-found-that-adr-0060-described-stage-import-map-id-document-id.md`
- Trigger: an ADR, IPC doc, or spec describes identifier grammar for bridge-visible payload fields.
- Check: compare each named field against the exact validator branch, including structural prefixes, separators, character sets, and field-specific differences.
- Fix Shape: split prose by validator or defer to the owning bridge contract instead of collapsing distinct validators under one grammar label.
- Status: active

### Keep bridge rejection narratives and tables synchronized

- Source: `docs/briefings/operational-findings/reports/20260529-reviewer-found-that-import-stage-map-documentation-mentioned-the-4096.md`
- Trigger: bridge command docs mention producer-visible failure cases, caps, skipped-item behavior, or terminal rejection paths.
- Check: verify each narrative failure case has a matching rejection-code or diagnostic table row at the public command boundary.
- Fix Shape: add explicit rows for caps, all-skipped terminal paths, malformed ids, and other producer-visible branches, or remove unsupported narrative claims.
- Status: active

### Record deferred runtime diagnostics in repo-owned debt docs

- Source: `docs/briefings/operational-findings/reports/20260529-reviewer-found-that-scene-load-skip-diagnostics-were-named-as-a-follow.md`
- Trigger: a PR defers runtime diagnostic surfacing, loader failure handling, or production follow-up behavior.
- Check: verify the deferred work is captured in a repo-owned tech-debt entry with affected module, impact, reason, cleanup trigger, and local template shape.
- Fix Shape: add or update the tech-debt document before relying on PR-body tracker mentions, and validate it against the repository's tech-debt template.
- Status: active
