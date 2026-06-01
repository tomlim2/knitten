---
name: knitten-status
description: Check the Knitten plugin source and local personal-marketplace installation status.
---

# Knitten Status

Use this skill when the user asks whether Knitten is installed, registered, or
healthy as a Codex plugin.

## Steps

1. Run:

   ```bash
   node <knitten-plugin-root>/scripts/doctor.mjs
   ```

   Resolve `<knitten-plugin-root>` as the plugin checkout containing this
   `skills/knitten-status/SKILL.md` file.

2. Report whether `ok` is true.
3. If any check failed, report the failed check ids and details.
4. Do not edit files, materialize the plugin, or change marketplace state unless
   the user explicitly asks.

For path debugging, run:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output
```
