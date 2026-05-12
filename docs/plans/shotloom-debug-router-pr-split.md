---
status: open
created: 2026-05-12
load: triggered
trigger: "before splitting Shotloom debug router / retargeter / env work into PRs"
repo: shotloom
linear: none
---

# Shotloom Debug Router PR Split Plan

## Intent

Split the current `feat/editor-add-router-dev-surface` work into small,
reviewable PRs before continuing. The branch already contains useful router,
retargeter debug, and environment debug experiments, but the full
`origin/main..HEAD` diff is too broad for one review. The goal is to preserve
the work while rebuilding it on top of current `main` as focused PRs.

Do not start implementation from this document automatically. Use it as a
branch-reconstruction plan when the user explicitly resumes the split.

## Current Branch Snapshot

Source branch:

```text
feat/editor-add-router-dev-surface
```

Pushed remote backup:

```text
origin/feat/editor-add-router-dev-surface
```

Useful commits on the branch:

```text
db0d2696 feat(editor): add minimal route shell
6a49f09c feat(retarget): add retargeter debug overlay
e2627ef2 feat(env): add environment debug floor color
1ab1f52c feat(editor): add environment placeholder debug controls
```

Important caveat: the full branch diff against `origin/main` currently includes
many unrelated-looking deletes/moves from later `main` history. Rebuild the
split branches from fresh `origin/main`, not by opening the current branch as a
single PR.

## Target PR Stack

### PR 1 — Router Shell

Title:

```text
feat(editor): add debug route shell
```

Base: `main`

Source commit:

```text
db0d2696
```

Scope:

- add the route shell for `/`, `/debug`, `/debug/retargeter`, and `/debug/env`
- keep the Bevy viewport mounted while route panels change
- add routing tests for viewport mount stability

Review question:

- Does the editor shell route between debug surfaces without remounting the
  viewport or changing runtime state?

This PR should land first. Later debug PRs should be based on this route shell.

### PR 2 — VRM Skeleton Debug Overlay

Title:

```text
feat(retarget): add VRM skeleton debug overlay
```

Base: PR 1 branch, or `main` after PR 1 merges.

Scope:

- add the `/debug/retargeter` panel shell
- add Rust-side VRM bone visualization
- add VRM mesh visibility toggle
- wire only the bridge fields needed for VRM overlay state
- add focused bridge/UI/Rust tests

Review question:

- Does the engine expose the evaluated VRM bone and mesh state in a debug-only
  way without leaking retargeter internals into production authoring UI?

Keep FBX source animation visualization out of this PR.

### PR 3 — FBX Source Animation Debug Overlay

Title:

```text
feat(retarget): add FBX source animation debug overlay
```

Base: PR 2 if the UI state is shared, otherwise PR 1.

Scope:

- add FBX/source skeleton visualization
- add source animation sampling for the debug overlay
- add the FBX/source toggle to the retargeter debug panel
- add tests around bridge shape and source-viz state

Review question:

- What coordinate frame and sampled pose does the FBX source overlay represent,
  and is that clear enough for retarget debugging?

VRM and FBX should stay separate because their failure modes differ. VRM viz is
runtime scene/bone hierarchy; FBX viz is source animation data, sampling, and
coordinate interpretation.

### PR 4 — Environment Debug Color Controls

Title:

```text
feat(env): add environment debug color controls
```

Base: PR 1 branch, or `main` after PR 1 merges.

Source commit starting point:

```text
e2627ef2
```

Scope:

- add the `/debug/env` panel
- add floor color control
- move or add dome/clear-color randomization into the env panel
- wire minimal `set_debug_floor_color`
- keep Rust-side changes limited to live debug floor material color

Review question:

- Can the debug env surface change simple viewport colors without affecting
  authored stage data?

Keep placeholder checker material, UV tiling, and dome sphere out of this PR.

### PR 5 — Placeholder Checker Ground

Title:

```text
feat(env): add placeholder checker ground controls
```

Base: PR 4.

Source commit starting point:

```text
1ab1f52c
```

Scope:

- configure `PlaceholderMaterial` with repeat + nearest sampling
- give generated `StageGround` tiled UVs
- add checker tiling bridge command and UI
- add ground placeholder material on/off toggle
- add focused engine tests for ground material and UV repeat behavior

Review question:

- Does the debug environment make the checker placeholder material visible and
  adjustable on the ground without changing authored environment data?

Keep the placeholder dome sphere out of this PR if reviewer surface needs to
stay narrow.

### PR 6 — Placeholder Dome Debug Sphere

Title:

```text
feat(env): add placeholder dome debug sphere
```

Base: PR 5.

Source commit starting point:

```text
1ab1f52c
```

Scope:

- add `set_debug_placeholder_dome`
- spawn/despawn one large debug sphere with `PlaceholderMaterial`
- sync sphere UVs with the checker tiling setting
- add the `Placeholder Dome` UI toggle
- add engine tests for spawn, despawn, and tiling updates

Review question:

- Is the debug sphere lifecycle safe inside the stage entity lifecycle, and does
  it avoid unnecessary production-facing behavior?

## Practical Reduced Stack

If six PRs is too much overhead, use this smaller stack:

```text
PR 1  feat(editor): add debug route shell
PR 2  feat(retarget): add VRM skeleton debug overlay
PR 3  feat(retarget): add FBX source animation debug overlay
PR 4  feat(env): add environment debug color controls
PR 5  feat(env): add placeholder checker debug materials
```

In the reduced stack, PR 5 may include both checker ground and placeholder dome
sphere because they share the same rendering concern: making the existing
placeholder checker material visible on debug environment geometry.

## Reconstruction Steps

1. Keep `origin/feat/editor-add-router-dev-surface` as the backup branch.
2. Fetch latest `origin/main`.
3. Create a fresh branch for PR 1 from `origin/main`.
4. Cherry-pick or patch-apply only the router shell changes.
5. Run focused editor router tests.
6. Push PR 1 and merge it first if possible.
7. Build PR 2 through PR 6 from either the prior PR branch or fresh `main`
   after each dependency merges.
8. For each PR, keep the verification narrow and aligned with the review
   question.

Avoid opening the current branch directly as one PR unless the user explicitly
accepts a large review surface.

## Verification Matrix

Router PR:

```text
pnpm --filter @shotloom/editor exec vitest run src/__tests__/App.router.test.tsx
pnpm --filter @shotloom/editor typecheck
```

Retargeter VRM/FBX PRs:

```text
cargo test -p shotloom-core set_debug_retarget_viz
cargo test -p shotloom-engine debug_retarget_viz
pnpm --filter @shotloom/editor exec vitest run src/__tests__/App.router.test.tsx src/bridge/__tests__/types.test.ts
pnpm --filter @shotloom/editor typecheck
pnpm build:wasm
```

Environment color PR:

```text
cargo test -p shotloom-core set_debug_floor_color
cargo test -p shotloom-engine debug_environment
pnpm --filter @shotloom/editor exec vitest run src/__tests__/App.router.test.tsx src/bridge/__tests__/types.test.ts
pnpm --filter @shotloom/editor typecheck
pnpm build:wasm
```

Environment placeholder PRs:

```text
cargo test -p shotloom-core set_debug_placeholder
cargo test -p shotloom-engine debug_environment
cargo clippy -p shotloom-core -p shotloom-engine --all-targets -- -D warnings
pnpm --filter @shotloom/editor exec vitest run src/__tests__/App.router.test.tsx src/bridge/__tests__/types.test.ts
pnpm --filter @shotloom/editor typecheck
pnpm build:wasm
pnpm --filter @shotloom/editor build
```

Run `pnpm build:wasm` after any Rust bridge command change. Otherwise the
browser may send a command that the currently loaded WASM enum does not know.

## Notes

- The user observed that Shotloom heats the machine during web runtime use.
  This is likely because the worker runs a continuous `requestAnimationFrame`
  loop and calls WASM `tick()` even when idle. That performance issue is not
  part of this split plan, but it is useful context for later debug-surface
  work.
- Do not mix render-loop throttling into these split PRs unless the user asks.
- Do not mix STL-89 retarget public-driver work into this branch split.
