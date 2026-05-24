# Operational Findings Inbox

Canonical Knitten-wide intake index for operational findings.

Detailed report context lives under `docs/briefings/operational-findings/reports/`.

| Date | Report | Initial Source | Area | Context | Summary | Status |
|------|--------|----------------|------|---------|---------|--------|
| 2026-05-24 | `operational-findings/reports/20260524-operational-findings-lifecycle-smoke-test.md` | smoke-test | workflow | operational-findings smoke test 2026-05-24 | Operational findings lifecycle needs an actual end-to-end smoke test so we know prepare, report capture, inbox update, commit, and push work outside dry-run validation. | captured |
| 2026-05-24 | `operational-findings/reports/20260524-status-porcelain-parsing-damaged-changed.md` | smoke-test | validator | operational-findings smoke test 2026-05-24 | Operational findings capture initially parsed git status porcelain lines with a fixed slice and damaged modified paths, causing docs paths to be read as ocs paths and valid report/index changes to be rejected. | captured |
| 2026-05-24 | `operational-findings/reports/20260524-findings-branch-inherited-origin-main.md` | smoke-test | workflow | operational-findings smoke test 2026-05-24 | The first operational-findings branch was created from origin/main and inherited origin/main as upstream, which made a plain git push unsafe for a long-lived findings branch. | captured |
| 2026-05-24 | `operational-findings/reports/20260524-long-lived-findings-branch-can.md` | smoke-test | workflow | operational-findings usability test 2026-05-24 | Operational findings capture should run scripts from the current Knitten checkout rather than from the long-lived findings worktree, because the findings branch may intentionally lag main and carry stale script logic. | captured |
