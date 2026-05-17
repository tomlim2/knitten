---
status: completed
created: 2026-05-11
updated: 2026-05-17
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
`rotate_vec3_180y_value` helper, materializes the non-invariant `plane.normal`
default when omitted on an odd-parity node, adds unit tests, and updates two
documentation passages that currently declare extended collider as out of
scope. No behavior changes for VRMs that do not use the extension.

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
7. **Materialize `plane.normal` default when omitted on an odd-parity node.**
   Per the extended-collider spec, `plane.normal` defaults to `[0, 0, -1]`
   when omitted. Unlike the base-schema defaults (sphere/capsule offset =
   `[0, 0, 0]`, gravityDir = `[0, -1, 0]`, all 180Y-invariant), this default
   is NOT invariant under 180Y — the rotated form is `[0, 0, 1]`. A presence-
   only check would leave such a plane unrotated and silently off-axis. So
   when a plane shape exists on a parity-odd collider AND its `normal` field
   is missing, write `[0, 0, 1]` (the rotated default) explicitly before
   continuing. `plane.offset`, `sphere.offset`, `capsule.offset`, and
   `capsule.tail` all have `[0, 0, 0]` defaults that are 180Y-invariant, so
   presence-only checks remain correct for them — no materialization needed.
   *Rejected:* failing with a typed error on omitted normal — pushes the
   burden to upstream tooling and breaks valid assets. *Rejected:* always
   materializing every default — unnecessary churn for the invariant ones.
8. **Doc-location for the field inventory: rustdoc, not spec doc.**
   The full field list of vector pointers lives in the rustdoc above
   `normalize_spring_bone_180y` (co-located with the implementation per
   AFDS v2 §5.13 — "Put tricky algorithms, non-obvious invariants, and
   implementation constraints here when one module clearly owns them").
   `docs/specs/vrm-character-validation.md` carries a one-line coverage
   declaration with a cross-link to the rustdoc; `docs/tech-debt/vrm-
   backward-facing-audit-policy.md` carries the same one-line coverage
   declaration. *Rejected:* duplicating the field list in the spec doc —
   it would drift from the rustdoc as the spec evolves.

## Acceptance

- [ ] Rustdoc above `normalize_spring_bone_180y` lists every
      `VRMC_springBone_extended_collider` vec3 field the normalizer rotates
      (plane offset, plane normal, inside sphere offset, inside capsule
      offset, inside capsule tail) AND the `plane.normal` default
      materialization behavior. The two doc passages below (spec + tech-
      debt) carry only a one-line coverage declaration + cross-link, not
      a duplicate field list.
- [ ] `normalize_spring_bone_180y` handles the extension branch with the
      same odd-parity gate as the base collider path.
- [ ] When a plane shape on a parity-odd collider has no `normal` field,
      the normalizer writes `[0, 0, 1]` (the rotated default) before
      continuing.
- [ ] Regression tests (synthetic JSON):
      - plane offset + plane normal rotation when collider node parity odd.
      - plane offset rotation + `normal` materialized to `[0, 0, 1]` when
        collider parity is odd and the input omitted `normal`.
      - inside sphere offset rotation when parity odd.
      - inside capsule offset + tail rotation when parity odd.
      - parity-even nodes leave extension shape untouched (including no
        materialization of an omitted `normal`).
      - malformed extended-collider vec3 propagates `MalformedVec3` with a
        correct pointer.
- [ ] `docs/specs/vrm-character-validation.md` and
      `docs/tech-debt/vrm-backward-facing-audit-policy.md` no longer claim
      "base schema only" / "extended collider not yet handled"; both
      cross-link to the rustdoc field list.
- [ ] `cargo test -p shotloom-gltf` green.
- [ ] PR body declares behavior change only for backward-facing VRMs that
      use `VRMC_springBone_extended_collider`; forward-facing VRMs and
      backward-facing VRMs without the extension are unchanged.

## File map

| Path | Kind | Note |
|------|------|------|
| `crates/shotloom-gltf/src/vrm_normalization.rs` | modify | Add extended-collider branch inside `normalize_spring_bone_180y`; materialize `plane.normal = [0, 0, 1]` when omitted on parity-odd collider; update rustdoc to drop the "intentionally not touched" caveat and add the full extension-field inventory (Decision #8); add 6 unit tests in the existing `#[cfg(test)] mod tests` block following the `normalize_spring_bone_180y_extended_collider_*` naming convention. |
| `docs/specs/vrm-character-validation.md` | modify | Lines ~128-144: replace the "base schema only" paragraph with a one-line coverage declaration + cross-link to the `normalize_spring_bone_180y` rustdoc. No duplicate field list. |
| `docs/tech-debt/vrm-backward-facing-audit-policy.md` | modify | Lines ~22-28: remove the "extended collider extension is not yet rewritten — see STL-227" sentence; replace with a one-line coverage declaration + cross-link to the rustdoc. |

## Verification

- `pnpm test:rust` — wraps the CI form `cargo test --workspace $CARGO_WORKSPACE_EXCLUDES`
  (where `CARGO_WORKSPACE_EXCLUDES = --exclude shotloom-desktop --exclude shotloom-tauri`,
  per `.github/workflows/code.yml` line 19 and `package.json` line 37). The new
  tests are `normalize_spring_bone_180y_extended_collider_*`.
- Narrow form during iteration: `cargo test -p shotloom-gltf`.
- `pnpm lint:rust` — wraps `cargo clippy --workspace $CARGO_WORKSPACE_EXCLUDES -- -D warnings`
  (same exclude pair). Do NOT use `--exclude shotloom-desktop` alone — that
  is stricter than CI and will fail on `shotloom-tauri` issues that CI
  ignores.
- `cargo fmt --check` — clean.
- `node scripts/validate-doc-paths.mjs` — clean (doc edits do not break
  cross-refs).
- `node scripts/validate-mermaid.mjs` — N/A (no mermaid).
- `/shotloom-review-before-pr` after push — must run before opening PR.
- **Fixture discovery** (run once before manual sanity):
  ```bash
  find crates -path '*/target' -prune -o \
    \( -name '*.vrm' -o -name '*.glb' -o -name '*.gltf' \) -print | head
  ```
  Then for any hit, grep the asset JSON / glTF for
  `VRMC_springBone_extended_collider` to confirm extension presence. If
  zero hits, skip the manual sanity step and declare the gap in the PR
  body (Decision #6).
- **Conditional manual sanity** (only if fixture discovery returned a
  matching asset): load the VRM 1.x asset with a backward-facing root,
  confirm extended collider geometry sits on the corrected axis after
  normalization.

## Open questions

None remaining — Decisions #7 (default materialization) and #8 (doc
location) closed during round-1 plan review.
