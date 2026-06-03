# Plugin Boundary PR Check

Use this guide before creating a PR or making a commit for Knitten or Knitten
All Skills changes.

## Core Boundary

- Knitten owns generic runtime, output/path routing, shared config, shared
  document templates, public core overlays, and plugin diagnostics.
- Knitten All Skills is a payload plugin. Keep domain skills, skill-local
  references, and skill-local support files there.
- Do not add root-level `agent/config`, `document-templates`, durable planning
  docs, or generic output resolver policy to Knitten All Skills.
- If a payload skill needs a generic output path, call the Knitten runtime
  instead of copying path policy into the payload plugin.
- Keep private repo-key lookup out of Knitten unless a separate core repository
  locator contract is accepted.

## Local And Installed Copies

- Validate both the source checkout and the materialized plugin copy when
  changing plugin runtime, config, templates, or diagnostics.
- Materialization must preserve `.agent-local`; local workflow output is never a
  durable source artifact.
- Do not commit `.agent-local` files.

## Commit And PR Check

Run the smallest relevant checks, then include any skipped coverage in the
handoff:

```bash
node scripts/validate-repository-shell.mjs
node scripts/doctor.mjs
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
git diff --check
```

For Knitten All Skills boundary work, also run:

```bash
node scripts/validate-boundary.mjs --warn-only
node scripts/doctor.mjs
```
