# Daily Visual Story Flow

This file is loaded only after `daily-visual-story` Step 0 passes. Read
[`engine-contracts.md`](engine-contracts.md) before generation.

## Contents

- [Role](#role)
- [Arguments](#arguments)
- [Shared setup](#shared-setup)
- [Engine 1: Narrative](#engine-1-narrative)
- [Engine 2: Adaptation](#engine-2-adaptation)
- [Engine 3: Output](#engine-3-output)
- [Gallery](#gallery)
- [Return](#return)
- [Binding rules](#binding-rules)

## Role

Create one deterministic daily visual story through exactly three isolated
engines:

```text
Narrative → Adaptation (rough Storyboard and validation included) → Output
```

Archive the final image and all three engines' exact provenance in the local
Knitten gallery. Never combine the engines' private records into one prompt.
Storyboard generation and visible inspection belong to Adaptation.

## Arguments

- Omitted: current Asia/Seoul date, `narrativeVariant=0`,
  `adaptationVariant=0`, `formatId=four-panel-comic`.
- `--joke-variant N`: set `narrativeVariant` to the explicit non-negative
  integer.
- `--adaptation-variant N`: set the independently seeded visual interpretation.
- `--format four-panel-comic`: the currently supported user-selected format.
- Reject unknown arguments before generation or gallery mutation.
- Never increment either variant silently.

An authorized parent may pass already resolved values without asking again. It
must return this skill's creative result unchanged and must not expose private
work, issue, pull-request, or disk context to any engine.

## Shared setup

Resolve `<skill-root>` from the installed `daily-visual-story` skill. Request
only one stage projection at a time:

```bash
node <skill-root>/scripts/daily-creative-seed.mjs \
  --date <Asia/Seoul-YYYY-MM-DD> \
  --narrative-variant <N> \
  --adaptation-variant <N> \
  --format four-panel-comic \
  --stage <narrative|adaptation|output> \
  --print-json
```

For dates from `2026-07-31`, require `creative-deck-v5`. The stage is mandatory.
Do not request an unprojected full deck. Existing v1–v4 results are historical
contracts: do not regenerate, migrate, or reinterpret their fingerprints.

Keep references under disjoint ownership:

- Narrative alone may load
  [`story-legacy-deck.json`](story-legacy-deck.json) and
  [`story-theme-reservoir.json`](story-theme-reservoir.json).
- Output alone may load
  [`visual-style-core-deck.json`](visual-style-core-deck.json) and
  [`visual-style-reservoir.json`](visual-style-reservoir.json).
- Adaptation loads neither reservoir. It may load
  [`storyboard-style-research.md`](storyboard-style-research.md) for
  production-storyboard visual language only, and otherwise receives frozen
  contracts only.

The deterministic deck supplies range, not the finished story. Use the complete
world, tension, cast, scale, and motion combination. Do not collapse dream,
fairy-tale, mythic, communal, expedition, conservation, nonhuman, or
distributed stories into a recurring two-person reconciliation scene.

Do not use software development, GitHub, Linear, disk cleanup, or the user's
live work as creative material. Do not include private work data in prompts.

## Engine 1: Narrative

### 1. Select the StoryBrief

Request `--stage narrative`. Keep its `narrativeSeedFingerprint` and
`narrativeVariant`. Do not request Adaptation or Output yet.

The selected emotional movement is not a broad `희·노·애·락` label. Name one
specific mixed movement supported by the events: tenderness after fatigue,
relief that arrives late, affectionate loneliness, embarrassment after
anticipation, nostalgia interrupted by ordinary life, or another precise
movement that belongs to the selected brief.

Vary people, worlds, and scales according to the returned cast contract. A
story may center on one person, a pair, a trio, an ensemble, a
multigenerational community, distributed people, humans with nonhuman agents,
or no people. Treat cultural identity as context and agency, never costume.

When `storyBrief.world.researchMode` is `current-primary-source`, browse before
writing:

- prefer a current primary source from the responsible scientific, cultural,
  public, mission, conservation, or community institution;
- select a recently documented action with concrete story and visual evidence;
- retain source title, institution, date, and URL as Narrative provenance;
- invent anonymous characters and clearly mark invention;
- avoid war, casualty, disaster, crime, private-person suffering, and any
  tragedy turned into a joke;
- preserve community ownership for living heritage;
- fall back to the evergreen setting and label it invented if no source is
  verifiable.

Do not browse for `researchMode: none`.

### 2. Author and review NarrativeSpec

The active Codex model writes the original story. Record its effective runtime
model under `provenance.effectiveAuthorModel`; never pin a model name in the
skill. A future source adapter may replace the producer only at this same
contract boundary.

Build a closed NarrativeSpec with:

- source facts, supported inferences, inventions, preserved ambiguities, and
  invariants;
- a suitable structure family rather than one forced skeleton;
- premise, focalization, characters and roles, state transitions, event graph,
  emotional movement, world rules, motifs and causal objects;
- consequence, residue, and the joke's meaning;
- Narrative prompt and authoring review provenance.

Use the `StoryBrief.structureFamily` selection as the first guard against
repertoire collapse. The structure family may be misread/reveal/residue,
accumulation/threshold/aftertaste, exchange/reframe/quiet cost,
expectation/deflation/reinterpretation, parallel convergence, loss of
control/acceptance, or explicit repair-chain. Only repair-chain should read as
`안됐다 → 문제를 발견했다 → 다 같이 해결한다 → 해결했다`. For every other
family, the final movement should be recognition, reinterpretation, residue,
acceptance, or changed relation, not a fixed external problem.

Write one original Korean joke of one or two short sentences. Let the emotion
land before a gentle comic turn. Use no humiliation, cruelty, sexual content,
political provocation, or exploitation of trauma.

Run a separate authoring review pass. It must verify causal completeness, state
change, event-supported emotion, sufficient world rules, deliberate ambiguity,
selected structure-family fidelity, non-collapse into the repair loop, and
distance from recent results. Revise within Narrative until it passes.

Narrative must remain understandable after every target-format and rendering
term is removed. Save the frozen JSON and validate it:

```bash
node <skill-root>/scripts/validate-engine-packet.mjs \
  --type narrative \
  --input <NarrativeSpec.json>
```

Stop on validation failure. Freeze NarrativeSpec and its fingerprint before
requesting Adaptation.

## Engine 2: Adaptation

### 3. Select the registered format and adaptation seed

The user-selected format is `four-panel-comic`. Request `--stage adaptation`
with the same date and `narrativeVariant`, plus the explicit
`adaptationVariant`. Confirm the returned `FormatContract` is unchanged.
Adaptation does not choose, recommend, or replace the format.

Create and validate an input packet containing exactly:

```text
NarrativeSpec, FormatContract, adaptationVariant
```

### 4. Adapt visibly

Create four distinct causal states in canonical 2×2 reading order. Preserve
Narrative invariants while choosing what to retain, omit, compress, merge,
externalize, or reorder for the format.

Adaptation may invent a visible action, bridging event, counterpoint, or visual
consequence. Record every decision in the closed change ledger. An invented
entry must say why the existing event graph was visually insufficient and why
the addition preserves consequence, residue, relationship, world rule, and
joke meaning. Never present an invention as a Narrative fact.

Build:

- an AdaptationSpec;
- four unit states with one causal carrier;
- continuity invariants and visible emotional movement;
- omissions and externalizations;
- a self-contained visible output brief;
- a Causal Legibility Plan;
- the exact rough-storyboard prompt.

The Causal Legibility Plan is a compact preflight for the storyboard prompt.
It must include:

- one first-time-viewer beat purpose per unit derived from
  `NarrativeSpec.structureMode`;
- an explicit statement when the unit progression is not
  problem/cause/action/result, and a rejection if the adapted board silently
  collapses into that template;
- a state-timing table for each repeated visual token or causal object,
  especially paths, queues, doors, signs, tools, keys, shadows, or residue;
- a prop-to-prop mechanism chain for every consequential object, with the
  visible contact, tension, alignment, handoff, or before/after relation that
  explains why the next prop changes;
- explicit actor-to-object relationships for every action, with the intended
  sight-line, contact point, pull-line, or alignment named;
- a before/after contrast plan, preferably using the same or rhymed camera
  layout for the first and final unit.

Do not let the final meaning appear before the visible turn that causes it. In
a repair-chain, this means the solved state must not appear early: if a route,
queue, door, bridge, shadow, sign, or other token changes because a panel-3
action fixes it, the finished changed state may appear only in that action
panel as a partial, ghost, or intent mark, or in the resolved panel as a solid
state. In non-repair families, the equivalent rule applies to recognition,
reinterpretation, residue, acceptance, or changed relation. A first-time viewer
must be able to read the selected structure movement without knowing the
Narrative prose.

Do not choose medium, palette, lighting, texture, or final finish here.

### 5. Generate and inspect the rough storyboard

Before image generation, read
[`storyboard-style-research.md`](storyboard-style-research.md). Use it only to
shape the rough production-thumbnail visual language. Do not import its sources,
example imagery, or style notes into Narrative or Output.

Generate one storyboard raster as Adaptation's completion proof:

- exact equal 2×2 grid and canonical reading order;
- strict black, white, and neutral gray only; color is forbidden;
- rough hand-drawn thumbnail or underdrawing construction lines;
- action-token positions, causal-object movement, screen direction, and
  minimum background geometry only;
- a small number of consequential props arranged as one readable mechanism
  chain from cause to result; avoid decorative or parallel props whose relation
  to the next prop is not visually connected;
- no finished human figures, humanoid silhouettes, faces, hair, hands,
  fingers, feet, clothing, costume, character designs, body outlines, muscle
  detail, or silhouette fill;
- visible human actors must use sparse human construction armatures as
  underdrawing, not finished people and not purely abstract tokens;
- nonhuman, object, crowd, or impersonal actors may use geometric blocking
  tokens such as circles, squares, flat ovals, rectangles, or dots;
- human construction armatures must remain scaffolds with blank head circles,
  simple ribcage/pelvis marks, shoulder/hip axes, joint dots, and single-stroke
  limb lines;
- simple nonverbal movement arrows only when needed;
- no final medium, decorative detail, polished lighting, finished texture,
  dialogue, captions, panel numbers, branding, signature, or watermark.

Visually inspect the raster itself and record `pass` or `fail` with evidence:

1. intended camera angle and distance;
2. action-token or causal-object movement direction;
3. four-panel order and causal readability;
4. within-panel and cross-panel spatial relationships;
5. Narrative invariant preservation;
6. all four panels present exactly once.
7. first-time viewer causal readability;
8. state timing, with no final meaning state shown before its visible turn;
9. prop-mechanism chain legibility, with consequential props visibly connected
   by contact, tension, alignment, handoff, or before/after relation;
10. actor/token-to-object relationship legibility.

All storyboard gates must pass. A failed prompt is not evidence and finish
cannot hide an unclear board. Revise AdaptationSpec, Causal Legibility Plan, or
visible brief and regenerate with the same `adaptationVariant`. Allow at most two storyboard attempts. If attempt two fails, return
`blocked: storyboard-validation-failed` and do not request Output.

Save the attempt count, storyboard SHA-256, and all evidence records, then run:

```bash
node <skill-root>/scripts/validate-engine-packet.mjs \
  --type storyboard-approval \
  --input <StoryboardApproval.json>
```

Freeze a full StoryboardPackage for provenance. Project only its
StoryboardHandoff, including the approved raster hash and validation
fingerprint. Validate:

```bash
node <skill-root>/scripts/validate-engine-packet.mjs \
  --type storyboard-handoff \
  --input <StoryboardHandoff.json>
```

The handoff must contain no Narrative prose, abstract story rationale,
AdaptationSpec, change ledger, discarded alternatives, joke explanation, or
raw references.

Think of this handoff as Adaptation's UI specification for the Styling/GUI
pass. It must organize what Styling receives into:

- approved storyboard raster and hash;
- visible subjects: approximate people, object actors, nonhuman actors, and
  important props;
- environment facts: approximate background, spatial setting, and fixed scene
  anchors;
- per-unit states: what each panel/shot visibly contains at that moment;
- continuity and causality: repeated tokens, causal carrier, and visible
  before/action/after state changes;
- locks: camera, movement, order, and spatial relationships Styling must not
  rewrite;
- visible emotional state and final residue;
- permitted finish flex: exactly what Styling may change while applying medium,
  palette, lighting, material, texture, and surface treatment.

## Engine 3: Output

### 6. Resolve OutputStyle

Only after the handoff passes, request `--stage output`. Use its Output-owned
medium and treatment selection to resolve the complete closed OutputStyle:
medium, palette, lighting, material, texture, finish, resolution, and surface
rule.

The seven-day nonrepeat window restarts at the v5 cutover and excludes recent
exact medium cards. Reservoir additions remain process-based,
non-artist-specific, visually concrete, and broadly reusable. Never imitate a
named living artist.

If a style rule conflicts with a storyboard lock, preserve the handoff and
record `storyboard-lock override`.

### 7. Render from the closed packet

Start a fresh Output call with exactly:

```text
StoryboardHandoff + OutputStyle
```

Save that two-key JSON packet and validate it:

```bash
node <skill-root>/scripts/validate-engine-packet.mjs \
  --type output-input \
  --input <OutputInput.json>
```

Use only that validated packet to form the exact final image-generation prompt.
Do not quote, summarize, inspect, or reconstruct NarrativeSpec, StoryBrief,
AdaptationSpec, change ledger, omitted material, references, or alternatives
from conversation memory.

Treat the approved storyboard raster as a UI wireframe and visible-lock proof,
not as final visual language. The Output prompt must explicitly convert
storyboard scaffolding into final visual elements: armature people into simple
finished amateur human marks, arrows into diegetic motion or cause evidence,
and placeholder shapes into finished subjects, materials, and background facts.
Do not ask the image model to colorize or trace the storyboard.

Generate one high-resolution raster with exactly four panels, preserving locked
geometry, camera, crop, positions, movement, order, continuity, visible state
changes, and final residue. Output may change only permitted finish fields.
Include no dialogue, captions, panel numbers, sound effects, logo, brand,
signature, or watermark.

Inspect the result and record OutputProof: handoff fingerprint, style id,
effective generation model, exact final prompt, visible lock-preservation
checks, and artifact SHA-256. Any new, removed, reordered, or substituted event
fails Output. A result that still reads as a colored storyboard also fails
Output: reject visible arrows, construction circles, joint dots, skeletal stick
limbs, rough thumbnail marks, wireframe bodies, or placeholder geometry left as
final finish, then regenerate from the same validated packet.

If image generation is unavailable, return the story and joke with both images
marked `unavailable`. Do not substitute stock art or claim validation passed.

## Gallery

After successful final generation, copy the image into the Core-owned local
gallery. Use metadata schema v2 and this id:

```text
<date>-v<narrativeVariant>-a<adaptationVariant>-<narrativeSeedFingerprint>
```

Preserve:

- exact Narrative, Adaptation+Storyboard, and Output prompts;
- all three schema versions, input and artifact fingerprints;
- Narrative author kind, role, effective model, and review pass;
- narrativeVariant, adaptationVariant, selected format;
- storyboard attempt count, raster hash, validation evidence and fingerprint;
- Output style id, effective model, exact two-payload final prompt and final
  artifact hash;
- final Korean joke, story summary, rationale, and all existing display fields.
- `sourceSkill: "daily-visual-story"`.

The gallery manager copies rather than moves the final image. Identical
metadata and image are idempotent; a conflicting entry stops without overwrite:

```bash
node <knitten-core-root>/skills/gallery/scripts/manage-gallery.mjs add \
  --image <generated-image-path> \
  --metadata <metadata-v2.json-path>
```

Keep generated previews outside repositories. Gallery recording is an allowed
local follow-up and requires no separate approval.

## Return

Return one self-contained block:

```text
## 오늘의 네 컷 감정선 — <specific emotional movement>
**스토리보드 검증:** <approved or blocked; storyboard visible gates summarized>
<approved monochrome rough storyboard, or unavailable>
**최종 출력:**
<generated image, or unavailable>
**오늘의 농담:** <one or two short Korean sentences>
**Narrative:** <story change, consequence, and residue in one short line>
**Adaptation:** <four visible states and any recorded invention in one short line>
**Storyboard:** <locked camera, movement, order, and spatial plan in one short line>
**Output:** <medium, surface rule, and preservation result in one short line>
**갤러리:** <local index and entry links, or unavailable>
**다음 각색:** 각색 시드를 더 굴려보겠습니까? (`--adaptation-variant <current+1>`)
```

The next-variant line is an offer, never approval. If the user explicitly
accepts, keep the date, Narrative variant, NarrativeSpec, format, and
OutputStyle fixed; increment only `adaptationVariant`, then rerun Adaptation,
Storyboard validation, and Output as a separate gallery entry.

When invoked by a parent, return this block unchanged. A parent with a required
final line, such as Shotloom's disk-cleanup question, places that line after the
creative block.

## Binding rules

- Do not publish, push, message, deploy, delete, or mutate external services.
- Do not store gallery images in repository source.
- Do not relax engine isolation because prior-stage data remains in context.
- Do not silently reroll, overwrite a prior variant, or bypass visible
  storyboard inspection.
