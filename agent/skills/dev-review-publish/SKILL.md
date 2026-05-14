---
description: "Final publish review — parallel code quality, UX/UI, UX writing, and deploy readiness checks with auto-fix."
argument-hint: "[directory or file]"
allowed-tools: Read, Write, Edit, Glob, Grep, Task, Bash(npx:*)
domains: web
repo-keys: caol-ila,mmd-anju,ta-portfolio
languages: css,javascript,typescript
frameworks: astro,three
task-types: review
context-profile: web-review
exclude-when: rust,unreal,obsidian
---

# dev-review-publish

Pre-publish review orchestrator that runs code quality, UX/UI, UX writing, and deploy readiness checks, auto-fixes critical issues, and produces a unified report.

---

## Arguments

- `[directory]` — Target directory to review. Defaults to current working directory.

---

## Workflow

### Pass 0: Detect 3D Stack

Check if the target directory contains 3D-related code (Three.js, WebGL, WebGPU, GLSL, WGSL). Determines whether the 3D rendering review runs in Pass 1.

### Pass 1: Review (fan-out, 3-4 parallel subagents)

Launch parallel Task subagents, each reading its relevant skill-owned reference and auditing all files:

- **A. Code Quality** — JS/CSS audit against `review-audit-web/references/REVIEW-CODE-JAVASCRIPT.md` and `review-audit-web/references/REVIEW-CODE-CSS.md`
- **B. UX/UI Audit** — HTML/JS/CSS audit against `review-audit-ux/references/REVIEW-UX.md`
- **C. UX Writing** — HTML/JS audit against `review-ux-writing.md`
- **D. 3D Rendering** *(only if has3D)* — JS/TS/GLSL/WGSL audit against `review-audit-3d/references/REVIEW-3D-RENDERING.md`

### Pass 2: Publish Check

Run `dev-check-publish` 8-category checklist (PATH, DEPS, SECRET, META, LEGAL, SIZE, COMPAT, CONSOLE).

### Pass 3: Auto-Fix (criticals only)

Select all critical/FAIL items from Pass 1 + Pass 2. Apply auto-fixable edits; skip items requiring design decisions.

### Pass 4: Report

Output the final unified report with auto-fixed items, remaining issues, publish readiness table, and verdict.

## Additional Resources

For full pass details with subagent specs, output format template, notes, and related standards, see [reference.md](reference.md).
