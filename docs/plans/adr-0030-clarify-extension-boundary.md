---
status: open
created: 2026-05-12
updated: 2026-05-12
load: triggered
trigger: working STL-369 — ADR-0030 VRM extension JSON repair boundary
repo: shotloom
linear: STL-369
---

# Clarify VRM extension JSON repair boundary in ADR-0030 + normalizer-pipeline

## Intent

ADR-0030 ("Extract Three Normalizer Crates") names three normalizer
crates and their canonical targets, but does not say which crate is
allowed to perform in-place repair of the VRM extension JSON (humanoid
map slot canonicalization, metadata normalization, similar byte-level
edits to extension blocks inside the GLB artifact). STL-291 Phase 1
introduces `shotloom-gltf` private code that does exactly this kind of
repair, which would otherwise look like a dep-direction violation
against ADR-0030. Add a short boundary subsection inside ADR-0030's
§Decision making the boundary explicit at the decision level, and a
matching one-sentence note in `docs/arch/normalizer-pipeline.md`
making it explicit at the current-architecture level. ADR-0030 is
still Proposed, so its edit lands in place — no amendment block, no
supersession. Function-level surface (`normalize_vrm` and friends)
stays in the crate README, not in the ADR body.

## Decisions (locked)

1. **Insertion location in ADR-0030: new `### Pre-normalize boundary`
   subsection inside §Decision, after `### Canonical targets`
   (before `### Why ARKit 52 for face`).**
   *Rationale:* the boundary is a present-tense ownership claim, not
   a deferral. It sits at the same altitude as "Canonical targets" —
   both define what each crate owns.
   *Rejected:* §Out of scope. That section is for items deferred to
   future ADRs; this is not a deferral.
   *Rejected:* inline paragraph inside the "Each owns the logic …"
   block. Less discoverable; readers grepping for "boundary" or
   "extension" miss it.

2. **Boundary text names crate boundaries, not function/symbol
   names.** Per ADR template Litmus test (§Litmus test, §Anti-
   patterns): only the Decision's primary subject (the three
   normalizer crates) may be named literally; passing references to
   sibling crates become MAP/README-linked rather than function-
   level. So the new subsection names `shotloom-gltf` as the layer
   below the normalizer crates and refers to "the VRM artifact
   normalization surface in shotloom-gltf" — concrete API surface
   (`normalize_vrm`, `finalize_normalized_vrm`, etc.) lives in
   `crates/shotloom-gltf/README.md` and is linked, not restated.
   *Rejected:* literal `shotloom-gltf::normalize_vrm` in the
   subsection. Rename-fragile; the function may be renamed without
   the ADR's decision changing.

3. **`shotloom-character-model-normalizer` is named explicitly as
   the complementary side.** Naming both sides is necessary for the
   boundary to be meaningful. Both are crate-level names, not
   function/symbol names — within the Litmus test allowance.

4. **One short parenthetical for examples, not a list.** "(e.g.
   humanoid map slot canonicalization)" anchors meaning without
   becoming an inventory that ages with STL-291 Phase 1 / 2 work.
   ADR template anti-pattern §1 forbids concrete type-name lists.

5. **Status rule: Proposed ADRs edit in place. No `## Amendment`
   block under any circumstance.** Per
   `docs/guidelines/adr-template.md` §"Editing an Accepted ADR":
   Accepted ADRs allow only **silent in-place edit** (when the
   reader's conclusion is unchanged) or **supersession** (when the
   reader's conclusion changes). The `## Amendment` form is
   explicitly forbidden. ADR-0030 Status is `Proposed` today, so
   this PR is a plain in-place edit — Status line stays `Proposed`.
   *Rejected:* "Accepted → amendment block" framing. That phrasing
   contradicts the template and would re-introduce the forbidden
   path even though ADR-0030 happens to be Proposed today.

6. **Same boundary statement also lands in
   `docs/arch/normalizer-pipeline.md`.** Per the arch doc's own
   opening (lines 3–9): it owns "target topology — crate
   boundaries, dependency direction, and the minimum output contract
   each normalizer must satisfy. The decision rationale … lives in
   the ADR." The new boundary is a crate-boundary fact, which is
   exactly the arch doc's territory. Without the matching note,
   ADR (decision) and arch doc (current shape) diverge.
   *Form:* one short sentence near where the existing crate
   responsibilities table sits — `shotloom-gltf` is named as the
   pre-normalize layer that owns VRM extension JSON repair.
   *Rejected:* ADR-only. Future readers consulting the arch doc
   (the canonical answer to "where is the boundary today") would
   miss the new boundary entirely.
   *Rejected:* arch-doc-only. The decision/why belongs in the ADR;
   silent omission from the ADR weakens the rationale anchor.

7. **No update to ADR-0030 Related section or normalizer-pipeline
   References.** STL-369 / STL-291 are Linear IDs; ADR template
   §"Linear identifiers" forbids in-body Linear references. The
   new boundary text names crates directly; no tracker link
   needed.

## Acceptance

- [ ] ADR-0030 에 VRM extension JSON repair boundary 단락이 추가된다.
- [ ] Boundary 단락이 `shotloom-gltf` 와 `shotloom-character-model-normalizer` 의 책임 분리를 명시한다.
- [ ] ADR-0030 Status 가 `Proposed` 인 채로 유지되고, 본문은 in-place edit 으로 갱신된다 (no `## Amendment` block).
- [ ] `docs/arch/normalizer-pipeline.md` 에 동일 boundary 가 한 줄로 명시된다.
- [ ] `node scripts/validate-doc-paths.mjs` 통과.

## File map

| Path | Kind | Note |
|------|------|------|
| `docs/adr/adr-0030-normalizer-crate-extraction.md` | modify | Insert new `### Pre-normalize boundary` subsection inside §Decision, between `### Canonical targets` and `### Why ARKit 52 for face`. Body: two short prose sentences naming the boundary at the crate level (`shotloom-gltf` owns the pre-normalize VRM artifact surface and its extension JSON repair; `shotloom-character-model-normalizer` does not perform extension JSON byte-level repair). One parenthetical example (humanoid map slot canonicalization). No code block, no table, no function names. Status line stays `Proposed`. |
| `docs/arch/normalizer-pipeline.md` | modify | Add one short sentence near the "Crates and responsibilities" table (or in a short subsection if structurally cleaner — judge at edit time from current doc shape). Sentence form: `shotloom-gltf` owns the pre-normalize VRM artifact surface, including extension JSON repair; the three normalizer crates run on top of that surface. No function names. |

## Verification

- `node scripts/validate-doc-paths.mjs` — clean (no new markdown link targets that don't already exist).
- `pnpm check:md` (markdownlint) — clean.
- Re-read ADR after edit: §Decision flow stays coherent (Decision body → Canonical targets → **new boundary subsection** → Why ARKit 52 → Why three).
- Re-read normalizer-pipeline.md after edit: opening framing line ("target topology — crate boundaries, dependency direction …") and the new sentence are consistent.
- `/shotloom-review-before-pr` after push — md-only diff, Pattern G + H groups apply; Pattern H10 specifically pertains here.

## Open questions

None. ADR Status confirmed (`Proposed`), ADR template Accepted-edit rules verified (silent in-place OR supersession; no Amendment block), sibling crate names verified against `crates/` tree, normalizer-pipeline.md ownership verified.
