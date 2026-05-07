---
description: Library of ad-hoc Rust analysis scripts for the shotloom retarget pipeline — VRM rest dump, ARP source rest dump, FBX finger-animation activity scan, Option B world-transport derivation. Drop into a worktree's `tests/` directory, run, capture data, delete.
allowed-tools: Read, Bash(cargo:*), Bash(cp:*), Bash(rm:*), Bash(ls:*), Bash(mkdir:*), Write
argument-hint: "[script-name]  (omit to list available scripts)"
---

# shotloom-analyze-rig

Templates for one-off analysis tests that probe shotloom retarget internals — bone rest poses, axis derivations, animation magnitudes, world-transport math. Each script is a standalone Rust integration test designed to be **dropped into a shotloom worktree, run once for data capture, then deleted**. They are not committed to the shotloom repo (analysis is ephemeral; permanent regression tests live alongside production code).

## Available scripts

Scripts live under `~/.claude/skills/shotloom-analyze-rig/scripts/`. Each is a self-contained `tests/*.rs` file.

| Script | Purpose |
|--------|---------|
| `thumb_rest_analysis.rs` | Dump VRM `leftThumb*` / `rightThumb*` local + global rest for xiao + yoya, alongside Index/Middle as 4-finger reference. Also dumps ARP `c_thumb*` source rest from a chosen FBX, walks the source FK chain to compute global rests, and runs the `derive_vrm_axis_option_b` math (mirrors `finger_axis_map.rs`) for thumb bones, comparing derived VRM-local axis against the hardcoded ±Z. Used during STL-263 to characterize thumb rest decomposition (swing-twist, carpometacarpal opposition). |
| `finger_activity_scan.rs` | Walks `assets/anims/body/*.fbx`, parses each FBX, and reports max angular delta from rest across all frames for every finger bone (`c_thumb1.l`/`.r` … `c_pinky3.l`/`.r`). Output is sorted by total finger activity Σ — pick the top entry to use as the visual-verification fixture. Used during STL-263 to confirm `21566_AiFigureEightRun` had the strongest finger animation in the committed fixture set. |

## Workflow

### Step 1: Resolve the shotloom worktree

```bash
shotloom_root=$(jq -r '.shotloom' ~/.claude/private/caol-config/repo-paths.json)
# Scripts go into a worktree, not the main checkout. Either pass an explicit
# worktree path or use the worktree the conversation is currently in
# (`git rev-parse --show-toplevel`).
```

### Step 2: Copy the script into the worktree

```bash
cp ~/.claude/skills/shotloom-analyze-rig/scripts/<script>.rs \
   <worktree>/crates/shotloom-retarget/tests/<script>.rs
```

The `shotloom-retarget` crate already has `shotloom-source-anim`, `shotloom-fbx-anim`, and `shotloom-common` as dev-dependencies, so the scripts compile without `Cargo.toml` edits.

### Step 3: Run the script (it is a `#[test]` that prints to stderr)

```bash
cargo test -p shotloom-retarget --test <script-name> -- --nocapture
```

The test always passes (it asserts nothing — it just dumps data). The interesting output is in stderr.

### Step 4: Capture the data, then delete the script

The scripts are not regression tests. After capturing the dump:

```bash
rm <worktree>/crates/shotloom-retarget/tests/<script>.rs
```

Pre-PR gates (`cargo fmt --check`, clippy) won't accept ad-hoc scripts; the trailing analysis-test must not land in the PR. If insight from the analysis is durable enough to merit a permanent test, factor it into a focused regression test (e.g. `thumb_retarget_regression.rs` pattern from STL-263) instead.

## Adding a new script to the library

When a new analysis script proves useful in the same session it was written:

1. Save the final version under `~/.claude/skills/shotloom-analyze-rig/scripts/<purpose>.rs`.
2. Add a row to the **Available scripts** table above with a one-line purpose.
3. Note the Linear issue + commit-or-PR that motivated it in the script's `//!` doc header so future readers can trace the context.

Keep each script self-contained — no shared helpers across scripts. Duplication is fine; each script must run independently after a `cp`.

## Why a skill, not a committed test in the repo

These scripts are **probes**, not assertions. They have no oracle: they just dump numbers for a human to interpret. Committing them as `#[test]` files would either (a) clutter the test suite with always-passing data dumps that slow CI, or (b) require turning them into assertions that pin specific numerical output — which defeats the point of "look at the data and decide what's interesting."

The skill keeps them reusable across sessions without leaving them in the shotloom repo's test suite.
