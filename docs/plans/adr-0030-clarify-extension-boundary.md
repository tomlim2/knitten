---
status: open
created: 2026-05-12
load: triggered
trigger: working STL-369 — ADR-0030 VRM extension JSON repair boundary
repo: shotloom
linear: STL-369
---

# Clarify VRM extension JSON repair boundary in ADR-0030

## Intent

ADR-0030 ("Extract Three Normalizer Crates") names three normalizer
crates and their canonical targets, but it does not say which crate is
allowed to perform in-place repair of the VRM extension JSON (humanoid
map slot canonicalization, metadata normalization, similar byte-level
edits to extension blocks inside the GLB artifact). STL-291 Phase 1
introduces `shotloom-gltf` private code that does exactly this kind of
repair, which would otherwise look like a dep-direction violation
against ADR-0030. Add a short subsection inside §Decision making the
boundary explicit: `shotloom-gltf::normalize_vrm` owns VRM-shaped GLB
artifact normalization, including VRM extension JSON repair;
`shotloom-character-model-normalizer` keeps its canonical-rest /
mesh-derived canonical responsibility and does not perform extension
JSON byte-level repair. ADR-0030 is still Proposed, so the edit lands
in place — no amendment block needed.

## Decisions (locked)

1. **Insertion location: new `### Pre-normalize boundary` subsection
   inside §Decision, after `### Canonical targets` (before
   `### Why ARKit 52 for face`).**
   *Rationale:* the boundary is a decision (where the normalizer-layer
   responsibility starts), not a deferral. It sits at the same
   altitude as "Canonical targets" — both define what each crate owns.
   *Rejected:* §Out of scope. That section is for items deferred to
   future ADRs; this is a present-tense ownership statement, not a
   deferral.
   *Rejected:* inline paragraph inside the "Each owns the logic …"
   block. Less discoverable; readers grepping for "boundary" or
   "extension" miss it.

2. **Boundary text: two short prose sentences, no code block, no
   table.** Code/table form would over-specify what is a one-line
   ownership claim. Match the §Canonical targets / §Why three prose
   register.

3. **`shotloom-gltf` is named explicitly as the layer below the
   normalizer crates.** Naming the sibling crate is allowed by the
   ADR template (the Decision's *primary subject* is the three
   normalizer crates; `shotloom-gltf` is a load-bearing reference
   crate, not a passing mention of an unrelated module).
   *Rationale:* the boundary is meaningless without naming both
   sides.

4. **No example list (humanoid map slot, metadata canonicalization,
   ...) inside the new subsection — keep one parenthetical only.**
   The ADR template anti-pattern §1 ("Concrete type-name lists")
   warns against enumerating concrete members. A short
   "(e.g. humanoid map slot canonicalization)" parenthetical
   anchors meaning without becoming an inventory that ages with
   STL-291 Phase 1 / 2 work.

5. **Status edit: Proposed → in place, no amendment block.** Per
   `~/.claude/rules/shotloom.md` H10 and ADR template Usage Notes,
   Proposed ADRs are edited in place. Amendment blocks belong to
   Accepted ADRs only. ADR-0030 Status line ("Proposed") stays
   unchanged.

6. **No update to ADR-0030 Related section.** STL-369 / STL-291 are
   Linear IDs; the ADR template Linear-identifier rule forbids
   in-body Linear ID references. The new boundary subsection
   names `shotloom-gltf` and `shotloom-character-model-normalizer`
   directly; no tracker link needed.

## Acceptance

- [ ] ADR-0030 에 VRM extension JSON repair boundary 단락이 추가된다.
- [ ] Boundary 단락이 `shotloom-gltf` 와 `shotloom-character-model-normalizer` 의 책임 분리를 명시한다.
- [ ] ADR-0030 Status 가 적절히 갱신 (Accepted 면 amendment block + date, Proposed 면 in-place).
- [ ] `node scripts/validate-doc-paths.mjs` 통과.

## File map

| Path | Kind | Note |
|------|------|------|
| `docs/adr/adr-0030-normalizer-crate-extraction.md` | modify | Insert new `### Pre-normalize boundary` subsection inside §Decision, between `### Canonical targets` and `### Why ARKit 52 for face`. Subsection body: two short prose sentences naming the boundary (one for what `shotloom-gltf` owns, one for what `shotloom-character-model-normalizer` does not own). No code block, no table. Status line stays `Proposed`. |

## Verification

- `node scripts/validate-doc-paths.mjs` — clean (no new markdown link targets).
- `pnpm check:md` (markdownlint) — clean.
- Re-read ADR after edit: §Decision flow stays coherent (Decision body → Canonical targets → **new boundary subsection** → Why ARKit 52 → Why three).
- `/shotloom-review-before-pr` after push — md-only diff, Pattern G + H groups apply.

## Open questions

None. ADR Status confirmed (`Proposed`), template rules confirmed, sibling crate names confirmed against `crates/` tree.
