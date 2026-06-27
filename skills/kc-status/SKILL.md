---
name: kc-status
description: Check Knitten Core installation health.
activation-check: normal
---

# KC Status

Use for: checking Knitten Core source and installed plugin health.

Use this skill when the user asks whether Knitten is installed, registered, or
healthy as a Codex plugin.

## Step 0: Activation Check

- Continue only when the request asks to check Knitten Core installation,
  registration, copied plugin state, or repository health.
- Resolve the active Knitten Core checkout before running diagnostics.
- Stop if the user wants to modify, materialize, reinstall, or repair the
  plugin; name the requested mutation separately before proceeding.
- Do not run diagnostics or follow later steps until this check passes.

## Steps

1. Run:

   ```bash
   node <knitten-plugin-root>/scripts/doctor.mjs
   ```

   Resolve `<knitten-plugin-root>` as the plugin checkout containing this
   `skills/kc-status/SKILL.md` file.

2. Report whether `ok` is true.
3. If any check failed, report the failed check ids and details.
4. Do not edit files, materialize the plugin, or change marketplace state unless
   the user explicitly asks.

For path debugging, run:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output
```
