---
load: triggered
trigger: selecting task-specific context or loading route-domain skills, standards, rules, or references
---

# Task Context Routing

Use this rule before loading a high-cost route-domain body.

## Contract

| Step | Action |
|------|--------|
| Classify | Use user words, cwd, repo key, file extensions, named skill, referenced file, and frontmatter. |
| Confirm | If confidence is low, read only the `AGENT-HUB.md` routing block or ask one short question. |
| Select | Load only artifacts whose routing metadata matches the task route. |
| Exclude | Do not load sibling route-domain bodies named in `exclude-when`. |
| Escalate | Broaden context only after the narrow route lacks needed evidence. |

## Canonical Inputs

| Input | Owner |
|-------|-------|
| Routing axes and profiles | `agent/config/context-routing.json` |
| Repo keys | `agent/private/agent-hub-config/repo-paths.json` |
| Compact route index | `AGENT-HUB.md` between `<!-- routing:start -->` and `<!-- routing:end -->` |
| Regression fixtures | `tests/routing-fixtures.json` |

## Work Mode

Classify work mode before state-changing work:

| Evidence | Work mode |
|----------|-----------|
| personal project, local-only repo, no company issue source | `personal` |
| company repo key, Linear/GitHub PR workflow, company wording | `company` |
| prototype, spike, throwaway test, benchmark, comparison | `experiment` |

If evidence selects more than one work mode, ask one question before editing.

## Metadata Shape

Use comma-separated scalar values in frontmatter:

```yaml
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
work-modes: company,personal
exclude-when: unreal,obsidian
```

Omit optional axes when absent. Do not write empty arrays in markdown frontmatter.

## Fallback

If the route is ambiguous, stop before reading route-domain bodies. Ask for the repo or domain, or read the compact route index and pick the smallest matching context profile.
