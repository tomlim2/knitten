---
description: "Pre-publication audit for web apps targeting GitHub Pages or static hosting. Use when deploying a web project publicly for the first time, or after significant changes before re-deployment."
---

# dev-check-publish

Audit a web app for public deployment readiness.

## Purpose

Checks for common deployment blockers and quality issues before publishing a web app to GitHub Pages or other static hosting. Produces a structured report with blocking issues, warnings, and recommendations.

---

## Usage

```
/dev-check-publish [path]
```

- `/dev-check-publish` — Audit current working directory
- `/dev-check-publish web/matcap-painter` — Audit a specific subdirectory

---

## Checklist

Run all checks against the target directory. For each check, report one of:
- `PASS` — No issues found
- `FAIL` — Blocking issue that will break deployment
- `WARN` — Non-blocking but should be addressed
- `SKIP` — Check not applicable (explain why)

| # | Check | Focus |
|---|-------|-------|
| 1 | PATH | Asset path resolution (absolute vs relative paths) |
| 2 | DEPS | Dependency availability (node_modules, CDN URLs) |
| 3 | SECRET | Secrets and privacy (API keys, local paths, .env) |
| 4 | META | HTML meta tags (title, description, OG, favicon) |
| 5 | LEGAL | License and attribution for third-party assets |
| 6 | SIZE | File size and performance (GitHub limits, images) |
| 7 | COMPAT | Browser compatibility (WebGPU, ES modules) |
| 8 | CONSOLE | Debug output (console.log, debugger, alert) |

---

## Workflow

1. **Identify target directory** — from argument or cwd
2. **Scan all files** — glob for html, js, css, json, images, models
3. **Run 8 checks** in parallel where possible
4. **Compile report** with findings grouped by severity
5. **Output verdict** — READY, BLOCKED, or NEEDS ATTENTION

## Additional Resources

For full checklist details with severity tables, fix patterns, output format template, and related files, see [reference.md](reference.md).
