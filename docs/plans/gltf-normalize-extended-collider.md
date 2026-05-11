---
status: open
created: 2026-05-11
load: triggered
trigger: working STL-227 — VRMC_springBone_extended_collider 180Y normalization
repo: shotloom
linear: STL-227
---

# Normalize VRMC_springBone_extended_collider for backward-facing VRMs

## Intent

`shotloom-gltf::normalize_spring_bone_180y` currently rotates only the base
`VRMC_springBone-1.0` schema's vector fields (sphere/capsule offsets, capsule
tail, joint gravityDir). The `VRMC_springBone_extended_collider` extension
adds plane and inside-collider shapes with their own offset/normal vector
fields, which today survive root-180Y normalization in the unrotated frame.
For backward-facing VRM 1.x assets that use extended colliders, this leaves
the simulation off-axis. The work extends the existing normalizer with an
extended-collider branch that reuses the same node-parity gate and the same
`rotate_vec3_180y_value` helper, adds unit tests mirroring the existing
five-case pattern, and updates two documentation passages that currently
declare extended collider as out of scope. No behavior changes for VRMs that
do not use the extension.

## Decisions (locked)

1. **Vector fields to rotate when collider node parity is odd:**
   `colliders[*].extensions.VRMC_springBone_extended_collider.shape.{sphere,capsule,plane}` —
   specifically `sphere.offset`, `capsule.offset`, `capsule.tail`,
   `plane.offset`, `plane.normal`.
   *Rationale:* These are the only vec3 fields in the extension schema; all
   other fields (radius, inside, etc.) are scalars or bools that are
   frame-invariant.
   *Rejected:* applying the normalize step at the spring-joint level — the
   extension is anchored to colliders, not joints, so the parity gate must
   read `collider.node`, same as the base path.
2. **Parity source is the collider's own `node` field, not the extension
   block.** The extension does not carry its own node reference.
   *Rationale:* matches the base-schema behavior and uses the existing
   `node_has_odd_180y_parity` helper unchanged.
   *Rejected:* falling back to the spring's `center` parity — wrong scope
   (center governs gravityDir, not collider geometry).
3. **Reuse `rotate_vec3_180y_value` for all five fields.**
   *Rationale:* the rotation is `[x, y, z] → [-x, y, -z]` regardless of
   whether the vector denotes a position (`offset`, `tail`) or a direction
   (`normal`); 180Y about origin maps both equivalently.
   *Rejected:* a separate "direction-only" helper — would duplicate the same
   transformation under a new name.
4. **Error-propagation parity.** Malformed extended-collider vectors return
   the same `VrmNormalizationError::MalformedVec3 { pointer, reason }` shape
   as the base path, with `pointer` deepened to include the extension prefix.
   *Rationale:* keeps the existing error-handling contract intact; downstream
   call sites do not need to special-case the extended collider.
5. **Doc passages updated, not removed.** Replace "currently base schema
   only" wording with explicit "covers base schema and extended collider"
   language so the audit policy remains a positive declaration of coverage,
   not silence.
6. **Real-fixture test is opportunistic.** AC #5 ("if a real fixture is
   available") — if no backward-facing VRM with extended collider is in
   `tests/` LFS, document the gap in the PR body and rely on synthetic-JSON
   coverage. Do not block the PR on fixture acquisition.

## Acceptance

- [ ] Vector-field inventory section for `VRMC_springBone_extended_collider`
      lives in either the function rustdoc or in the spec doc, citing plane
      offset/normal and inside-collider offsets/tails.
- [ ] `normalize_spring_bone_180y` handles the extension branch with the
      same odd-parity gate as the base collider path.
- [ ] Regression tests (synthetic JSON):
      - plane offset + plane normal rotation when collider node parity odd.
      - inside sphere offset rotation when parity odd.
      - inside capsule offset + tail rotation when parity odd.
      - parity-even nodes leave extension shape untouched.
      - malformed extended-collider vec3 propagates `MalformedVec3` with a
        correct pointer.
- [ ] `docs/specs/vrm-character-validation.md` and
      `docs/tech-debt/vrm-backward-facing-audit-policy.md` no longer claim
      "base schema only" / "extended collider not yet handled".
- [ ] `cargo test -p shotloom-gltf` green.
- [ ] PR body declares behavior change only for backward-facing VRMs that
      use `VRMC_springBone_extended_collider`; forward-facing VRMs and
      backward-facing VRMs without the extension are unchanged.

## File map

| Path | Kind | Note |
|------|------|------|
| `crates/shotloom-gltf/src/vrm_normalization.rs` | modify | add extended-collider branch inside `normalize_spring_bone_180y`; update rustdoc to drop "intentionally not touched" caveat; add 5 unit tests in the existing `#[cfg(test)] mod tests` block following the `normalize_spring_bone_180y_*` naming convention. |
| `docs/specs/vrm-character-validation.md` | modify | lines ~128-144: update "base schema only" prose; add a row or paragraph naming the extension's covered vec3 fields. |
| `docs/tech-debt/vrm-backward-facing-audit-policy.md` | modify | lines ~22-28: remove the "extended collider extension is not yet rewritten — see STL-227" sentence; replace with coverage declaration. |

## Verification

- `cargo test -p shotloom-gltf` — must pass; new tests are
  `normalize_spring_bone_180y_extended_collider_*`.
- `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings` — clean.
- `cargo fmt --check` — clean.
- `node scripts/validate-doc-paths.mjs` — clean (doc edits do not break
  cross-refs).
- `node scripts/validate-mermaid.mjs` — N/A (no mermaid).
- `/shotloom-review-before-pr` after push — must run before opening PR.
- Manual sanity: load a VRM 1.x asset known to use `VRMC_springBone_extended_collider`
  with a backward-facing root. Confirm extended collider geometry sits on
  the corrected axis after normalization. *(See Open questions — fixture
  availability unknown.)*

## Open questions

1. Is there a real backward-facing VRM 1.x asset with
   `VRMC_springBone_extended_collider` in the existing fixture set
   (`tests/`, LFS)? If yes, add a fixture-level integration test against
   it; if no, surface the gap in the PR body and leave the synthetic JSON
   tests as the regression surface.
2. Should the rustdoc above `normalize_spring_bone_180y` carry the full
   extension field list, or should that move to
   `docs/specs/vrm-character-validation.md` and the rustdoc just cross-link?
   Default: list in rustdoc (it changes when the spec changes — co-located
   knowledge per AFDS v2 §5.13) with a one-line pointer to the spec for
   the audit policy.
