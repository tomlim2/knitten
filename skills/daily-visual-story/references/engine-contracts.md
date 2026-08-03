# Daily Visual Story Engine Contracts

This reference is loaded only after `daily-visual-story` matches. The
authoritative executable schemas are in
`../scripts/engine-contracts.mjs`; this file defines engine ownership and
runtime handoffs.

## Contents

- [Pipeline](#pipeline)
- [Narrative](#narrative)
- [Adaptation](#adaptation)
- [Output](#output)
- [Fingerprints](#fingerprints)

## Pipeline

```text
StoryBrief
  → Narrative Engine
  → frozen NarrativeSpec
  → Adaptation Engine + user-selected FormatContract + adaptationVariant
  → validated StoryboardPackage
  → closed StoryboardHandoff
  → Output Engine + OutputStyle
  → RenderedArtifact
```

There are exactly three engines. Storyboard generation and visible inspection
belong to Adaptation; Storyboard is not a fourth engine.

## Narrative

Narrative creates only the story. The active Codex model is the first producer,
and its effective runtime model is recorded without pinning a model name. A
future legend, novel, or other source adapter may replace that producer only if
it emits the same validated `NarrativeSpec`.

Narrative receives StoryBrief and story-only references. It must not receive or
emit target format, unit count, camera, blocking, layout, storyboard, medium,
palette, lighting, texture, or rendering decisions.

The closed top-level fields are:

```text
schemaVersion, narrativeId, sourceContract, structureMode, premise,
focalization, charactersAndRoles, characterStateTransitions, eventGraph,
emotionalMovement, worldRules, motifsAndCausalObjects, consequence, residue,
jokeMeaning, provenance
```

`sourceContract` distinguishes facts, supported inferences, inventions,
preserved ambiguities, and invariants. `provenance` records the brief
fingerprint, reference ids, author kind and role, effective author model, and
the authoring review pass.

`structureMode` is a story movement family, not a synonym for
problem-solving. Narrative must vary the repertoire before Adaptation begins.
Supported structure families include misread/reveal/residue,
accumulation/threshold/aftertaste, exchange/reframe/quiet cost,
expectation/deflation/reinterpretation, parallel actions that converge late,
loss of control/acceptance, and the explicit repair-chain family. The
blocked-problem → cause clue → corrective action → resolved consequence loop is
allowed only when `structureMode` explicitly selects repair-chain; otherwise it
is a failed collapse of the selected family.

Validate the frozen JSON:

```bash
node <skill-root>/scripts/validate-engine-packet.mjs \
  --type narrative \
  --input <NarrativeSpec.json>
```

## Adaptation

Adaptation receives exactly:

```text
NarrativeSpec + FormatContract + adaptationVariant
```

The user or authorized parent selects the format. The implemented contract is
`four-panel-comic`; Adaptation may reject an unsupported format but may not
infer or replace it.

Adaptation may retain, omit, compress, merge, externalize, reorder for format,
clarify within an invariant, or invent a visible action, bridging event,
counterpoint, or visual consequence. Every change must appear in the closed
change ledger with its source element, target unit, reason, and preserved
invariant. Invention must explain why the existing event graph was
insufficient and why the story's consequence, residue, world rule, relationship,
and joke meaning remain unchanged.

Before writing the storyboard prompt, Adaptation must prove the adapted beats
as visible logic for a first-time viewer. Build a compact causality plan:

- one beat purpose per unit derived from `NarrativeSpec.structureMode`, not a
  default problem/cause/action/result template;
- a state-timing table for each repeated object or path token, showing what it
  knows before, during, and after the visible turn that changes or
  recontextualizes it;
- a prop-to-prop mechanism chain for every consequential object, showing how
  each prop affects the next visible prop and which unrelated props must stay
  visibly inactive;
- an actor-to-object relation map for every visible action, using sight-lines,
  contact points, pull-lines, or object alignment rather than relying on prose;
- a before/after contrast, preferably with the first and final units rhyming
  in camera and layout when the format allows.

Never let the final meaning appear as a finished visual state before the unit
whose visible turn causes it. In a repair-chain, a safe path must not already
form before the sign, gate, bridge, or other causal object is repaired or
moved. In non-repair families, recognition, reinterpretation, residue,
acceptance, or changed relation must likewise appear only after its visible
turn.

`adaptationVariant` is independent of `narrativeVariant`. Repair attempts keep
both variants fixed. A creative reroll requires explicit user approval and
increments only `adaptationVariant`.

### Storyboard completion proof

Adaptation renders one deliberately unfinished storyboard:

- one equal 2×2 raster in canonical reading order;
- black, white, and neutral gray only;
- rough hand-drawn thumbnail or underdrawing lines;
- action-token positions, causal-object movement, screen direction, and minimum
  orientation geometry only;
- no finished people, humanoid silhouettes, faces, hair, hands, fingers, feet,
  clothing, costume, character design, body outline, muscle detail, or
  silhouette fill;
- visible human actors use sparse human construction armatures as underdrawing,
  not finished people and not purely abstract tokens;
- nonhuman, object, crowd, or impersonal actors may use geometric blocking
  tokens such as circles, squares, flat ovals, rectangles, or dots;
- human construction armatures stay as scaffolds with blank head circles,
  simple ribcage/pelvis marks, shoulder/hip axes, joint dots, and single-stroke
  limb lines;
- no final medium, color, decorative detail, lighting polish, texture, text,
  branding, signature, or watermark.

Inspect the raster, not merely its prompt. Record evidence for camera angle and
distance, movement direction, causal order, spatial relationships, Narrative
invariant preservation, all four panels being present exactly once, first-time
reader causality, state timing without anticipation, prop mechanism-chain
legibility, and actor/object relationship legibility. A storyboard fails when
props are merely present but their visible contact, tension, alignment,
handoff, or before/after relation does not explain why the next prop moves.
Adaptation gets at most two storyboard attempts. If the second fails, return
`blocked: storyboard-validation-failed`; Output must not run.

Validate all visible gates and retain the returned validation fingerprint:

```bash
node <skill-root>/scripts/validate-engine-packet.mjs \
  --type storyboard-approval \
  --input <StoryboardApproval.json>
```

The full `StoryboardPackage` remains provenance. Output receives only the
closed `StoryboardHandoff` fields exported by `engine-contracts.mjs`. Validate
the handoff:

```bash
node <skill-root>/scripts/validate-engine-packet.mjs \
  --type storyboard-handoff \
  --input <StoryboardHandoff.json>
```

## Output

Output receives exactly:

```text
StoryboardHandoff + OutputStyle
```

Treat the handoff like a UI specification passed to a GUI styling pass.
Adaptation owns the UI-like structure: the approved rough storyboard raster,
visible subjects, environment facts, per-unit states, continuity tokens,
causal carrier, camera/movement/order/spatial locks, visible emotional state,
final residue, and permitted finish flex. Output owns only the GUI-like finish:
medium, palette, lighting, material, texture, surface treatment, and raster
resolution.

The approved storyboard raster is a locked layout proof, not a final visual
style reference. Output must not trace, colorize, or preserve storyboard
scaffolding as finish. Convert rough marks into diegetic final cues:
construction armatures become simple finished human marks when people are
present, motion arrows become visible causes such as wind, rope tension, flag
flutter, pulley motion, hand positions, or material deformation, and placeholder
geometry becomes finished subject/background material. If the final raster still
shows storyboard arrows, joint dots, skeletal stick limbs, exposed construction
lines, or rough thumbnail language as visible finish, OutputProof fails and
Output must regenerate from the same validated packet.

It owns medium, palette, lighting, material, texture, finish, resolution, and
permitted surface treatment. It preserves locked geometry, camera, blocking,
movement, order, spatial relationships, continuity tokens, state transitions,
final residue, and text restrictions.

Create a fresh Output prompt from the validated two-key input packet. Do not
quote, summarize, inspect, or recover NarrativeSpec, AdaptationSpec, the change
ledger, story references, rationales, or discarded alternatives from
conversation memory.

Validate the exact packet before image generation:

```bash
node <skill-root>/scripts/validate-engine-packet.mjs \
  --type output-input \
  --input <OutputInput.json>
```

If OutputStyle conflicts with a locked field, preserve the handoff and record
`storyboard-lock override`. Output never invents, removes, reorders, or rewrites
an event.

## Fingerprints

The invalidation graph is:

- Narrative change → invalidate Adaptation and Output.
- Format change → invalidate Adaptation and Output, not Narrative.
- adaptationVariant change → invalidate Adaptation and Output, not Narrative.
- StoryboardHandoff change → invalidate Output.
- OutputStyle change → invalidate Output only.

Historical `creative-deck-v1` through `creative-deck-v4` results remain frozen.
The three-engine contract is `creative-deck-v5`, starting `2026-07-31`.
