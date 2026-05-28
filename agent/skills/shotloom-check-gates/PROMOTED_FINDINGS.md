# Promoted Findings: Gate Layer

This ledger contains operational findings promoted into Shotloom local gate and
validator candidates. Entries here are not active gate policy until a helper or
Shotloom repo guideline implements them.

## Active Entries

### Keep fast and full gate policy aligned with repo guidance

- Source: `docs/briefings/operational-findings/reports/20260527-align-shotloom-commit-and-check-gates-default-gate-policy.md`
- Trigger: a skill describes commit, push, PR, or manual validation gates.
- Check: verify the skill treats Shotloom repo guidance as the policy source and
  treats helper-local gates as additive evidence.
- Fix Shape: keep `/shotloom-check-gates --fast` for manual iteration,
  `/shotloom-check-gates --full` for push or PR evidence, and document helper
  rationale in the gate layer.
- Status: active

### Candidate: validate provider response budgets before projection

- Source: `docs/briefings/operational-findings/reports/20260528-provider-payload-projection-needs-local-response-bounds.md`
- Trigger: Shotloom adds or edits provider adapters that project external
  response payloads.
- Check: candidate validator scans for provider projection paths without local
  candidate-count and payload-size tests.
- Fix Shape: add adapter-level tests or a helper check once the provider module
  shape is stable enough to inspect mechanically.
- Status: candidate

### Candidate: preserve typed errors across partial malformed diagnostics

- Source: `docs/briefings/operational-findings/reports/20260528-provider-error-classification-should-tolerate-partial-malformed.md`
- Trigger: Shotloom adds or edits provider validation-error parsers.
- Check: candidate validator scans for tests with mixed valid and malformed
  diagnostic entries.
- Fix Shape: require test coverage that proves valid diagnostics survive
  item-local malformed optional fields.
- Status: candidate
