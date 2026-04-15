# Shotloom Review Patterns — MOVED

> **This file has been merged into [`review-code-rust.md`](review-code-rust.md).** It is kept as a redirect stub so historical links (devlogs, old PRs, search bookmarks) still resolve.

## Why

Until 2026-04-15 there were two parallel Rust review checklists:

- `shotloom-review-patterns.md` — 17 flat patterns, embedded by `cci-codex-review-rust`
- `review-code-rust.md` — 16 grouped patterns (A–E), embedded by `shotloom-review-before-pr`

Both derived from the same PR #66 Copilot review plus PR #72 self-review findings, and diverged over time. A single source of truth is now maintained in **`review-code-rust.md`** with 22 patterns across groups A–F:

| Group | Scope |
|-------|-------|
| A | Doc ↔ code coherence (A1–A6) |
| B | Classifier / dispatch asymmetry (B1–B2) |
| C | Silent fallback in the hot path (C1–C3) |
| D | Library hygiene (D1–D4) |
| E | Build / platform regressions (E1–E3) |
| F | Cross-crate & inherited-pattern hygiene (F1–F3) |

The mapping from the old flat numbering:

| Old (this file) | New (`review-code-rust.md`) |
|-----------------|------------------------------|
| 1  Stale doc vs current state        | A3 |
| 2  Comment contradicts code          | A1 (identifier) / A3 (state) |
| 3  Dead / tautological guard         | C2 |
| 4  Dangling doc/path reference       | A2 |
| 5  Language consistency              | D3 |
| 6  Library side effects              | D1 |
| 7  Silent default on missing data    | C1 |
| 8  Early return disables stage       | B2 |
| 9  Computed-but-unused classification| B1 |
| 10 Silent catch-all in config parse  | C3 |
| 11 Test setup / comment mismatch     | A5 |
| 12 PR description / commit drift     | A4 |
| 13 Cross-layer silent fallback       | F1 |
| 14 Architectural invariant drift     | F2 |
| 15 Mirrored-pattern inheritance      | F3 |
| 16 Quantitative comment accuracy     | A6 |
| 17 Platform portability              | E3 |

## What to do

- **Reading:** go to [`review-code-rust.md`](review-code-rust.md).
- **Dispatching a review:** both `/shotloom-review-before-pr` and `/cci-codex-review-rust` already load `review-code-rust.md`. Nothing to change on your end.
- **Updating patterns:** edit `review-code-rust.md` only. Do **not** re-populate this stub.
