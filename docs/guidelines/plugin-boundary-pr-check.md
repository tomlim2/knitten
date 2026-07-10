# Plugin Boundary PR Check

Use this guide before creating a PR or making a commit for Knitten or domain
plugin changes.

## Core Boundary

- Knitten owns generic runtime, output/path resolution, shared config, shared
  document templates, and plugin diagnostics.
- Domain plugins own concrete skills. Keep domain skills, skill-local
  references, and skill-local support files there.
- Do not add root-level `agent/config`, `document-templates`, durable planning
  docs, or generic output resolver policy to domain plugins.
- If a domain skill needs a generic output path, call the Knitten runtime
  instead of copying path policy into the domain plugin.
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

For domain plugin boundary work, also run the domain repository's boundary
checks when present, for example:

```bash
node <knitten-root>/scripts/validate-domain-plugin-boundary.mjs \
  --domain-plugin <domain-plugin-root> \
  --warn-only
cd <domain-plugin-root> && node scripts/doctor.mjs
```
