---
description: "Validate VRM 0.x files from pmx2vrm pipeline"
argument-hint: "<file_or_dir> [--strict]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(python:*)
---

Run the `cci-validate-vrm` skill with the provided arguments.

## Arguments

$ARGUMENTS

## Behavior

- **No arguments** → Show usage instructions
- **`.vrm` file path** → Run single-file validation, output structured markdown report
- **Directory path** → Glob for `**/*.vrm`, run batch validation, output summary table
- **`--strict`** → Pass strict mode (warnings treated as failures)
