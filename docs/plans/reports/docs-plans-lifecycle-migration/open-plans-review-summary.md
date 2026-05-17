---
status: report
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
spec: ../../completed/docs-plans-lifecycle-migration.md
---

# Open Plans Review Summary

## Purpose

This report records the 2026-05-17 review of the 26 legacy top-level `open` specs that Batch C intentionally held.

## Result

| Result | Count |
|---|---:|
| moved to `completed/` | 25 |
| moved to `active/` | 1 |
| deleted | 0 |

No file was deleted in this pass. Every reviewed file still carries useful implementation history, machine-state evidence, or follow-up context.

## Classification

| Spec | Target | Evidence |
|---|---|---|
| `adr-0030-clarify-extension-boundary` | `docs/plans/completed/adr-0030-clarify-extension-boundary.md` | Shotloom history contains ADR-0030 clarification work (`438222bb docs(adr): tighten ADR-0030 dependency invariant and fix crate attribution`). |
| `agent-symlink-followup` | `docs/plans/completed/agent-symlink-followup.md` | `~/.claude` now resolves as a symlink to `caol-ila/agent`; no local `caol-ila/claude/` stub was found during review. |
| `bridge-add-background-prop-batch-spawn` | `docs/plans/completed/bridge-add-background-prop-batch-spawn.md` | Shotloom history contains `03eb9aa9 feat(bridge): add background prop batch spawn (#342)`. |
| `bridge-clear-background-props` | `docs/plans/completed/bridge-clear-background-props.md` | Shotloom history contains `de948e44 feat(bridge): clear background props` plus follow-up clear-background docs/tests. |
| `ci-add-containerfile-smoke` | `docs/plans/completed/ci-add-containerfile-smoke.md` | Shotloom history contains `46f97aec chore(ci): add Containerfile build smoke workflow (#280)`. |
| `docs-add-toast-modal-guidelines` | `docs/plans/completed/docs-add-toast-modal-guidelines.md` | Shotloom history contains UI feedback/toast docs work including `9aa2a85b docs(specs): add ui feedback surface spec (#316)` and toast follow-ups. |
| `editor-add-debug-sidebar-nav` | `docs/plans/completed/editor-add-debug-sidebar-nav.md` | Shotloom history contains `/debug` parent route and panel registry work (`f943753e feat(editor): add /debug parent route and panel registry (#309)`). |
| `editor-add-debug-surface-layout` | `docs/plans/completed/editor-add-debug-surface-layout.md` | Shotloom history contains router/debug surface groundwork (`fc37b694 feat(editor): adopt React Router route shell (#295)`, `f943753e feat(editor): add /debug parent route and panel registry (#309)`). |
| `engine-reuse-debug-cube-assets` | `docs/plans/completed/engine-reuse-debug-cube-assets.md` | Shotloom history contains debug prop fixture/rendering follow-ups (`da0dc0a9 fix(assets): replace debug prop fixture (#339)`, `6cc5c76d fix(engine): keep box prop above floor (#344)`). |
| `gltf-add-axis-correction-calculator` | `docs/plans/completed/gltf-add-axis-correction-calculator.md` | Shotloom history contains `7bdd959b feat(gltf): add axis-bake correction calculator (#321)`. |
| `gltf-add-axis-primary-child-picker` | `docs/plans/completed/gltf-add-axis-primary-child-picker.md` | Shotloom history contains `0fb6a504 feat(gltf): add axis-bake primary-child picker (#317)`. |
| `gltf-apply-vrm-axis-bake-rest-pose` | `docs/plans/completed/gltf-apply-vrm-axis-bake-rest-pose.md` | Shotloom history contains `32e05f82 feat(gltf): apply vrm axis-bake rest pose (#327)`. |
| `gltf-normalize-extended-collider` | `docs/plans/completed/gltf-normalize-extended-collider.md` | Shotloom history contains `640c8915 fix(gltf): normalize VRMC_springBone_extended_collider vectors for backward VRMs (#289)`. |
| `gltf-rebake-axis-bind-matrices` | `docs/plans/completed/gltf-rebake-axis-bind-matrices.md` | Shotloom history contains `19fd02d9 feat(gltf): rebake axis-bake inverse binds (#331)`. |
| `gltf-repair-vrm1-thumb-slots` | `docs/plans/completed/gltf-repair-vrm1-thumb-slots.md` | Shotloom history contains `2cd3f8f4 feat(gltf): warn on noncanonical VRM thumb slots (#312)`. |
| `gltf-wire-axis-bake-normalize-vrm` | `docs/plans/completed/gltf-wire-axis-bake-normalize-vrm.md` | Shotloom history contains `29fff5a9 feat(gltf): wire axis bake into vrm normalization (#335)`. |
| `import-add-prop-gltf` | `docs/plans/completed/import-add-prop-gltf.md` | Shotloom history contains `af076083 feat(gltf): add prop GLB preflight (#326)`. |
| `link-codex-context` | `docs/plans/completed/link-codex-context.md` | `~/.codex/SYSTEM.md`, `AGENT-HUB.md`, `agent`, `docs`, `rules`, `standards`, and `commands` all resolve to `caol-ila`; `~/.codex/skills/.system` remains real. |
| `placeholder-material-checker-sampler` | `docs/plans/completed/placeholder-material-checker-sampler.md` | Shotloom history contains `da05071f fix(placeholder-material): load checker with Repeat+Nearest sampler (#296)`. |
| `retarget-cleanup-rig-branches` | `docs/plans/completed/retarget-cleanup-rig-branches.md` | Shotloom history contains `90933ee9 refactor(retarget): remove default rig thumb overrides`. |
| `retarget-recalibrate-default-pose` | `docs/plans/completed/retarget-recalibrate-default-pose.md` | Shotloom history contains `9ed656db test(retarget): pin default pose recalibration (#340)`. |
| `shotloom-debug-router-pr-split` | `docs/plans/completed/shotloom-debug-router-pr-split.md` | The planned split landed across router/debug PR history (`fc37b694`, `f943753e`, and related follow-ups). |
| `shotloom-plan-skills-risk-map` | `docs/plans/active/shotloom-plan-skills-risk-map.md` | Skill bodies exist, but no canonical Risk Map template or plan registry implementation evidence was found; keep active. |
| `stage-add-map-document-parser` | `docs/plans/completed/stage-add-map-document-parser.md` | Shotloom history contains `bda00c20 feat(stage): add map document parser (#341)`. |
| `stage-define-map-document-bundle-layout` | `docs/plans/completed/stage-define-map-document-bundle-layout.md` | Shotloom history contains `4b36257f docs(stage): define map document contract (#337)`. |
| `workspace-unify-thiserror-deps` | `docs/plans/completed/workspace-unify-thiserror-deps.md` | Shotloom history contains `9542b4fb chore(workspace): inherit thiserror dependency` and `38617df8 docs(fbx-anim): align thiserror dependency note`. |
