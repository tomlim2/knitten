# Doctor And Status Skill

## Status

Draft.

## Goal

Add the first runtime utility and first skill to the minimal Knitten plugin.

This milestone should prove that Knitten is not only registered as a local
Codex plugin, but also exposes one small useful skill and can check its own
personal-marketplace installation state.

## Scope

Add:

- `scripts/doctor.mjs`
- `skills/knitten-status/SKILL.md`

Update:

- `.codex-plugin/plugin.json`
- `.github/workflows/validate.yml`
- `README.md`

## Doctor Contract

`node scripts/doctor.mjs` checks the source checkout.

`node scripts/doctor.mjs --marketplace-root=<path>` checks a selected
marketplace root.

It reports JSON:

```json
{
  "ok": true,
  "checks": [
    {
      "id": "source-manifest",
      "ok": true,
      "detail": ".codex-plugin/plugin.json"
    }
  ]
}
```

Required checks:

- source manifest exists and has `name: "knitten"`
- source skill exists at `skills/knitten-status/SKILL.md`
- marketplace file exists
- marketplace has a `knitten` entry
- entry path is `./plugins/knitten`
- copied plugin manifest exists
- copied plugin manifest has `name: "knitten"`
- copied plugin version contains `+codex.` unless `--allow-source-version` is set

## Skill Contract

`knitten-status` is a minimal status/readiness skill.

It should tell the agent to:

1. Run `node scripts/doctor.mjs`.
2. Report whether the source checkout and personal marketplace copy are valid.
3. Avoid changing files unless the user explicitly asks.

The skill must not introduce payload behavior, domain workflows, or legacy path
requirements.

## Acceptance Criteria

- `python3 <validate_plugin.py> .` passes.
- `node --check scripts/doctor.mjs` passes.
- `node scripts/doctor.mjs` passes after local materialization.
- `node scripts/materialize-local-plugin.mjs` refreshes the personal marketplace
  copy.
- `python3 <validate_plugin.py> ~/plugins/knitten` passes.
- CI allowlist includes only the minimal shell plus this doctor/status surface.
- Active runtime docs contain no legacy harness, domain, or private path
  assumptions.
