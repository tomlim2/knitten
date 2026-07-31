# Daily Visual Story Three-Engine Boundary

## Status

Accepted and implemented locally on 2026-07-29 by the user's explicit
`그럼 실시`.

- Three-engine cutover: `creative-deck-v5` on `2026-07-31`.
- Historical `creative-deck-v1` through `creative-deck-v4` outputs remain
  unchanged.
- Implemented surfaces: closed engine validators and fingerprints, independent
  `adaptationVariant`, Adaptation-owned storyboard approval gate, Output's
  exact two-key input, gallery schema v2 provenance, and the thin
  `shotloom-today` pass-through.

## Goal

Define one enforceable three-engine boundary for daily visual storytelling:
`Narrative → Adaptation (Storyboard included) → Output`.

The Narrative Engine completes what happens, the Adaptation Engine proves how
the chosen format can show it, and the Output Engine renders only the approved
blueprint into the actual deliverable.

## Problem

The current `daily-visual-story` workflow describes four consecutive stages:
`Story → Adaptation → Storyboard → Output`. That sequence is useful
operationally, but it leaves ownership unclear:

- Story selection, writing, editing, and source provenance are not named as one
  Narrative Engine contract.
- Adaptation can appear complete before the rough storyboard proves that the
  adapted action is spatially and temporally legible.
- Storyboard can be mistaken for an independent creative owner even though it
  is the executable proof of adaptation.
- Output can accidentally recover story meaning from conversation memory or
  provenance instead of rendering the approved blueprint as a closed input.
- Adding formats other than the current four-panel comic could duplicate
  narrative logic, visual validation, or output rules.

The desired system has three owners, not four. Storyboard generation and
validation belong inside Adaptation, and a successful storyboard handoff is the
only way Adaptation completes.

## Boundary

In scope:

- Define Narrative, Adaptation, and Output as three isolated engine contracts.
- Define one durable artifact and one closed downstream projection at every
  boundary.
- Treat the target format as an Adaptation input, never a Narrative input.
- Treat the rough storyboard and its visible validation as the Adaptation
  output and completion proof.
- Keep final style and raster finish inside Output.
- Keep `daily-visual-story` as the orchestrator of all three engines.
- Preserve the existing four-panel workflow as the first format adapter.
- Define extension rules for later single-frame, page, sequence, motion, or
  other visual formats without implementing them in the first pass.
- Preserve historical gallery provenance and deterministic seed results.
- Record the effective Narrative author model without pinning a model name.
- Permit a future legend, novel, or other authored source to replace the
  current model-written Narrative while preserving the same NarrativeSpec
  boundary.

Out of scope:

- Implementing the engines in this spec-writing pass.
- Adding a second output format in the first implementation pass.
- Changing `shotloom-today` work, PR, disk, or final disk-question behavior.
- Making Output rewrite Narrative or Adaptation decisions.
- Making Narrative know panel count, camera, layout, medium, or final render
  constraints.
- Letting Adaptation choose final artistic style, texture, lighting, or finish.
- Publishing gallery artifacts or adding external mutations.
- Pinning a concrete model id in a skill or engine contract.
- Supporting audio, prose-only, or other nonvisual adaptation targets.

## Resolved Decisions

The user resolved these boundary questions on 2026-07-29:

1. Narrative currently means an original story written by the active Codex
   model. It does not adapt an existing legend or novel in the first pass.
2. Narrative production is replaceable. A future legend, another person's
   novel, or another story source may supply the same NarrativeSpec boundary.
3. The user selects the target format. Adaptation never chooses it.
4. The current selected format is `four-panel-comic`; the first implementation
   concentrates only on that adapter.
5. Adaptation is allowed to invent new visible actions and bridging events. It
   must record them and preserve Narrative invariants rather than pretending
   they came from Narrative.
6. Adaptation may offer a separately seeded, more challenging alternative
   interpretation. It never rerolls silently.
7. Storyboard and Adaptation are visual-media-only contracts.

## Match Check Decision

The owning `daily-visual-story` skill remains `match-check: normal`.

- It generates local image artifacts and copies successful results into the
  registered local Knitten gallery.
- It does not push, publish, message, deploy, delete, or mutate GitHub/Linear.
- Step 0 must confirm the creative request, target date, narrativeVariant,
  adaptationVariant, local gallery boundary, and whether the skill is
  standalone or delegated.
- The skill must stop before generation when the request or target is
  ambiguous.
- An orchestrating caller may forward an already resolved date,
  narrativeVariant, adaptationVariant, and target format without asking again.

## System Shape

```text
creative references, research, recent-story memory
                         │
                         ▼
┌──────────────────────────────────────────────┐
│ Narrative Engine                             │
│ brief → active model → review → NarrativeSpec│
└──────────────────────────────────────────────┘
                         │
                         │ NarrativeSpec
                         ▼
             User-selected Target Format
                         │
                         ▼
┌────────────────────────────────────────────┐
│ Adaptation Engine                          │
│ format adaptation → rough storyboard       │
│ → visible validation → StoryboardPackage   │
└────────────────────────────────────────────┘
                         │
                         │ closed StoryboardHandoff
                         ▼
┌────────────────────────────────────────────┐
│ Output Engine                              │
│ approved blueprint + OutputStyle → render  │
└────────────────────────────────────────────┘
                         │
                         ▼
                  RenderedArtifact
```

`daily-visual-story` owns orchestration, artifact correlation, final response
composition, and gallery follow-up. It does not merge the three engines'
private inputs into one prompt.

## Inputs

| Input | Required | Owner | Meaning |
|-------|----------|-------|---------|
| `StoryBrief` | Yes | Narrative | Creative commission used by the active Codex model to write the current original story. |
| `NarrativeSourceAdapter` | No; future | Narrative | Replacement producer for a legend, novel, or other authored source that can emit the same NarrativeSpec. |
| Narrative references | No | Narrative | Story-only worlds, tensions, structures, research sources, and recent-story exclusions. |
| `NarrativeAuthor` | Yes | Narrative | The active Codex model in the first pass; recorded by effective model id rather than pinned by the skill. |
| `narrativeVariant` | Yes | Narrative | Existing explicit `--joke-variant` value for the daily Narrative seed; defaults to `0`. |
| `FormatContract` | Yes after Narrative | Adaptation | User-selected target visual form; initially the exact four-panel 2×2 comic. |
| `StoryboardPolicy` | Yes | Adaptation | Rough-board rendering and visible validation requirements. |
| `adaptationVariant` | Yes | Adaptation | Explicit non-negative integer for an independently seeded visual interpretation; defaults to `0`. |
| `OutputStyle` | Yes after Adaptation | Output | Medium, palette, lighting, material, finish, resolution, and permitted surface rule. |
| Gallery contract | Yes after successful render | Orchestrator | Local provenance and copied-image persistence rules. |

## Outputs

| Output | Persistence | Owner | Meaning |
|--------|-------------|-------|---------|
| `NarrativeSpec` | run artifact and gallery provenance | Narrative | Format-neutral, causally complete story contract. |
| `NarrativeReview` | run artifact and gallery provenance | Narrative | Authoring pass evidence that the story is coherent, sufficiently novel, and ready for the user's format selection. |
| `StoryboardPackage` | run artifact and gallery provenance | Adaptation | Full adaptation record, rough board, validation, change ledger, and sealed handoff. |
| `StoryboardHandoff` | closed in-memory projection | Adaptation | Only the approved visible blueprint that Output may consume. |
| `RenderedArtifact` | generated cache plus local gallery copy | Output | Actual final visual output. |
| `OutputProof` | gallery provenance | Output | Evidence that the render preserved the handoff and used only permitted finish decisions. |

## Contract

### 1. Narrative Engine

#### Responsibility

Narrative completes the story without knowing how it will be displayed.

It may:

- select a compact set of story anchors from the story-only reservoir;
- ground a current-world story in verified primary-source research;
- have the active Codex model create the original story;
- run a separate authoring review pass for causality, depth, repetition, and
  unresolved residue without requiring a separately pinned model;
- choose the suitable narrative structure rather than forcing every story
  through one desire-obstacle template;
- distinguish source facts, supported inference, invention, and intentionally
  preserved ambiguity;
- revise and refreeze the story until its own contract is coherent.

The first implementation is a story creator, not a source adapter. A later
legend, novel, or external story producer replaces only the Narrative producer;
it must still emit the same closed NarrativeSpec and may not bypass provenance
or invariant fields.

It must support at least these structure families without reducing them to one
universal skeleton:

- goal pursuit;
- relationship change;
- discovery or revelation;
- transformation or passage;
- accumulation and threshold;
- circular or dream logic;
- communal or distributed action;
- observational change.

#### Forbidden knowledge

Narrative must not contain or inspect:

- `formatId`, panel count, page count, shot count, or duration target;
- camera distance, camera angle, crop, lens, blocking, or screen direction;
- layout, gutters, aspect ratio, reading order, or storyboard instructions;
- medium, palette, texture, lighting, composition style, or render resolution;
- Adaptation alternatives or Output implementation details.

The Narrative schema and stage projection must reject these fields rather than
merely instructing an agent to ignore them.

#### `NarrativeSpec`

The minimum closed shape is:

```text
NarrativeSpec
├── schemaVersion
├── narrativeId
├── sourceContract
│   ├── sourceFacts
│   ├── supportedInferences
│   ├── inventions
│   ├── preservedAmbiguities
│   └── invariants
├── structureMode
├── premise
├── focalization
├── charactersAndRoles
├── characterStateTransitions
├── eventGraph
├── emotionalMovement
├── worldRules
├── motifsAndCausalObjects
├── consequence
├── residue
├── jokeMeaning
└── provenance
    ├── briefFingerprint
    ├── referenceIds
    ├── authorKind
    ├── authorRole
    ├── effectiveAuthorModel
    └── reviewPass
```

`authorKind` is `active-codex-model` in the first implementation and may later
identify a source adapter. Concrete effective models are recorded for
provenance but are never selected or pinned by this schema.

#### Completion condition

Narrative completes only when:

- the event graph has no unexplained required causal edge;
- the focal subject or focal system changes state;
- the emotional movement is supported by an event, choice, gesture, object, or
  consequence;
- world rules required for comprehension are explicit;
- invariants and preserved ambiguities are distinguishable from omissions;
- the authoring review pass finds no unsupported causal gap or recent-result
  imitation;
- the result remains understandable with every format and rendering term
  removed.

### 2. Adaptation Engine

#### Responsibility

Adaptation receives exactly
`NarrativeSpec + user-selected FormatContract + adaptationVariant`. It decides
how the completed narrative becomes a visible, target-format-specific
blueprint. It owns both textual adaptation and storyboard proof.

It may:

- retain, omit, compress, merge, externalize, or target-format-reorder events;
- invent a new visible action, bridging event, counterpoint, or visual
  consequence when it creates a stronger target-format interpretation;
- convert internal state into visible action, spatial relation, or a causal
  object;
- assign narrative events to target units such as panels, frames, pages, or
  shots;
- define camera, blocking, screen direction, reading order, layout, and spatial
  continuity;
- generate a deliberately unfinished rough storyboard;
- revise the adaptation and regenerate the storyboard when visible validation
  fails.

It must not:

- change a Narrative invariant or joke meaning;
- silently add, delete, or replace a causal event;
- present an invented action or event as if it came from Narrative;
- use final medium, palette, material, lighting, texture, or finish to hide an
  unclear adaptation;
- declare success from the text prompt without inspecting the generated rough
  board;
- pass the full NarrativeSpec, rationale, discarded alternatives, or change
  ledger to Output.

#### `FormatContract`

Every format is a separately registered closed contract. Its minimum shape is:

```text
FormatContract
├── formatId
├── formatVersion
├── unitKind
├── unitCount
├── canvasOrSequenceGeometry
├── canonicalOrder
├── continuityRequirements
├── textPolicy
├── storyboardBlueprintType
└── formatSpecificValidation
```

The first implementation preserves the existing format:

```text
formatId: four-panel-comic
unitKind: panel
unitCount: 4
canvasOrSequenceGeometry: one raster, clean equal 2×2 grid
canonicalOrder: top-left → top-right → bottom-left → bottom-right
textPolicy: no dialogue, captions, panel numbers, or sound effects in raster
storyboardBlueprintType: monochrome rough four-panel board
```

Adding a later format requires a new `FormatContract` and adapter. It must not
add format branches to Narrative.

The user or an authorized parent caller selects `formatId`. Adaptation may
reject an unsupported contract but must not recommend, infer, substitute, or
silently change the selected format. During the first implementation,
`four-panel-comic` is the only supported and already selected format.

#### Adaptation change ledger

Every source-to-format decision uses one of these operations:

- `retained`;
- `omitted`;
- `compressed`;
- `merged`;
- `externalized`;
- `reordered-for-format`;
- `clarified-within-invariant`;
- `invented-visible-action`;
- `invented-bridging-event`;
- `invented-counterpoint`;
- `invented-visual-consequence`.

Each entry identifies its source Narrative element, target storyboard unit,
reason, and preserved invariant. Invented operations must also state why the
existing Narrative event graph was insufficient for the visual target and why
the addition does not rewrite its consequence, residue, relationship, world
rule, or joke meaning. An operation outside this set fails closed until the
contract is deliberately revised.

#### Challenging adaptation variants

Narrative randomness and Adaptation randomness are independent:

- the daily Narrative seed and frozen NarrativeSpec remain unchanged;
- `adaptationVariant` defaults to `0`;
- the same Narrative fingerprint, FormatContract, and adaptationVariant
  reproduce the same adaptation seed;
- an explicit reroll increments only `adaptationVariant`;
- every variant creates a complete alternative AdaptationSpec and storyboard;
- every alternative must pass the same visual validation gates;
- prior approved variants remain available for comparison and are never
  overwritten;
- changing adaptationVariant invalidates only Adaptation and Output artifacts.

After the current variant has produced its completed RenderedArtifact, the
standalone skill may offer `각색 시드를 더 굴려보겠습니까?` and show the exact
next variant. This offer does not delay or replace the default final render.
When embedded in `shotloom-today`, it appears inside the creative block and
never after the required final disk line. Only an explicit affirmative response
authorizes the new variant; the engine never increments it silently.

#### Storyboard policy

The rough storyboard is a camera, composition, and movement blueprint rather
than a final artwork:

- one raster using the geometry required by `FormatContract`;
- strict black, white, and neutral gray only;
- rough hand-drawn sketch, thumbnail, or underdrawing lines;
- character pose and movement plus minimum environmental orientation;
- simple nonverbal movement arrows only when necessary;
- no final medium, decorative detail, polished lighting, finished texture,
  dialogue, captions, branding, signature, or watermark.

At minimum, visible inspection records `pass` or `fail` plus evidence for:

1. intended camera angle and distance;
2. character or causal-object movement direction;
3. target-unit order and causal readability;
4. within-frame and cross-frame spatial relationships;
5. narrative invariant preservation;
6. every required target-format unit being present exactly once.

The first implementation keeps the existing limit of two storyboard attempts.
If the second attempt fails, Adaptation returns
`blocked: storyboard-validation-failed`; Output must not run.

#### `StoryboardPackage`

The full Adaptation output is:

```text
StoryboardPackage
├── schemaVersion
├── narrativeRef
├── formatContract
├── adaptationVariant
├── adaptationSeedFingerprint
├── adaptationSpec
├── changeLedger
├── outputBrief
├── storyboardPrompt
├── storyboardRaster
├── attemptCount
├── validationEvidence
└── storyboardHandoff
```

`StoryboardPackage` is provenance. Output receives only its sealed
`storyboardHandoff` projection:

```text
StoryboardHandoff
├── handoffVersion
├── approvedStoryboardRaster
├── formatGeometry
├── visibleSubjects
├── environmentFacts
├── unitStates
├── continuityTokens
├── causalCarrier
├── lockedCamera
├── lockedMovement
├── lockedOrder
├── lockedSpatialRelationships
├── emotionalTrajectoryAsVisibleState
├── finalVisualResidue
├── permittedFinishFlex
└── validationFingerprint
```

The handoff contains no source prose, Narrative abstractions, Adaptation
rationale, omissions, alternatives, joke explanation, or raw reference data.

#### Completion condition

Adaptation completes only when:

- `NarrativeSpec` and `FormatContract` were frozen before adaptation;
- every change is represented in the closed change ledger;
- the target format contains a distinct, causally valid state in every required
  unit;
- all visible storyboard gates pass from raster inspection;
- the handoff fingerprint corresponds to the approved storyboard raster;
- the closed `StoryboardHandoff` alone is sufficient for faithful rendering.

### 3. Output Engine

#### Responsibility

Output receives exactly `StoryboardHandoff + OutputStyle`. It turns the
approved blueprint into the actual visual deliverable.

It owns:

- medium and material;
- palette and color temperature;
- lighting;
- texture and mark making;
- permitted surface rhythm or emphasis;
- resolution, encoding, and final raster finish.

It must preserve:

- format geometry and unit count;
- camera, crop, blocking, and subject positions;
- movement direction and causal-object travel;
- canonical unit order;
- continuity tokens and visible state transitions;
- the final visual residue;
- any no-text or branding restrictions.

It must not inspect:

- `NarrativeSpec`;
- Story Brief, raw references, writer or editor prompt;
- AdaptationSpec, change ledger, discarded alternatives, or rationale;
- any unprojected full daily creative deck.

Output may vary only fields explicitly listed under
`StoryboardHandoff.permittedFinishFlex`. A conflict between OutputStyle and a
locked handoff field resolves in favor of the handoff and records
`storyboard-lock override`.

#### Completion condition

Output completes only when:

- the generated artifact uses the required format and unit count;
- every locked handoff field is visibly preserved;
- no new, removed, reordered, or substituted event appears;
- text and branding policies pass;
- `OutputProof` records the handoff fingerprint, style id, effective generation
  model, exact final prompt, and visible preservation checks.

### 4. Orchestrator

`daily-visual-story` coordinates the engines but owns no private engine
decision.

Rules:

1. Resolve the Seoul date and explicit `narrativeVariant` from the existing
   `--joke-variant` argument.
2. Run Narrative and freeze `NarrativeSpec`.
3. Receive the user-selected registered `FormatContract`; initially use the
   already selected `four-panel-comic`.
4. Run Adaptation with explicit `adaptationVariant` and freeze the approved
   `StoryboardPackage`.
5. Project only `StoryboardHandoff`.
6. Resolve `OutputStyle` from Output-owned references.
7. Run Output from exactly `StoryboardHandoff + OutputStyle`.
8. Record Narrative, Adaptation, Storyboard, Output, prompts, profile/model
   provenance, and fingerprints as separate gallery records.
9. Never construct one combined prompt containing all three engines' private
   inputs.
10. Offer an exact next adaptationVariant only after a validated result and
    never treat the offer as approval.

When embedded in `shotloom-today`, the parent receives only the finished
creative result block and existing gallery links. It does not receive or
inspect private stage packets.

## Isolation Matrix

| Data | Narrative | Adaptation | Output |
|------|-----------|------------|--------|
| Raw story references | Read | Forbidden | Forbidden |
| Recent-story memory | Read | Forbidden | Forbidden |
| Story Brief | Read | Forbidden | Forbidden |
| NarrativeSpec | Write | Read | Forbidden |
| User-selected FormatContract | Forbidden | Read | Via handoff only |
| adaptationVariant | Forbidden | Read | Via handoff fingerprint only |
| AdaptationSpec | Forbidden | Write | Forbidden |
| ChangeLedger | Forbidden | Write | Forbidden |
| Rough storyboard | Forbidden | Write and inspect | Read through handoff |
| StoryboardHandoff | Forbidden | Write | Read |
| Visual-style reservoir | Forbidden | Forbidden | Read |
| OutputStyle | Forbidden | Forbidden | Read |
| Final generation prompt | Forbidden | Forbidden | Write |
| Gallery provenance | Append own record | Append own record | Append own record |

Conversation memory does not relax this matrix. An engine must behave as if a
forbidden record is unavailable even when an earlier stage remains in context.
Implementation should prefer separate stage projections and fresh agent calls
over instruction-only isolation.

## Failure And Retry Contract

- Narrative failure returns an incomplete field list or editor finding and
  never selects a target format.
- Adaptation failure returns the failed storyboard gates and revises only
  AdaptationSpec or its visible brief.
- Output cannot request a silent Narrative rewrite. A locked-blueprint conflict
  returns to Adaptation with the exact incompatible field.
- A repair retry keeps the same date, Narrative variant, Narrative fingerprint,
  FormatContract, and adaptationVariant.
- A creative reroll is not a repair retry. It requires explicit user approval,
  changes adaptationVariant, and produces a separate candidate.
- Changing an upstream frozen artifact invalidates every downstream fingerprint
  and artifact.
- No stage may reuse a downstream artifact after its upstream fingerprint
  changes.

## Version And Provenance Contract

- Existing `creative-deck-v1` through `creative-deck-v4` results and gallery
  fingerprints remain stable.
- The legacy `shotloom-today` seed namespace remains an immutable provenance
  token; it does not imply current skill ownership.
- The first implemented three-engine contract uses a new contract version and
  an explicit cutover date.
- Historical gallery entries are never regenerated in place.
- Every new entry records stage schema versions, input fingerprints, central
  author role, effective model ids, Narrative variant, adaptationVariant, exact
  prompts, and generated artifact hashes.
- Model replacement changes provenance but not engine ownership or schema.

## Validation

Mechanical:

- `python3 <skill-creator-root>/scripts/quick_validate.py skills/daily-visual-story`
- `node --test skills/daily-visual-story/scripts/daily-creative-seed.test.mjs`
- `node skills/gallery/scripts/manage-gallery.test.mjs`
- `node scripts/validate-repository-shell.mjs`
- `node scripts/validate-runtime-contracts.mjs`
- `git diff --check`

Contract fixtures must prove:

- Narrative projections reject format and rendering keys.
- Adaptation receives only
  `NarrativeSpec + user-selected FormatContract + adaptationVariant`.
- The active Codex model can produce NarrativeSpec without a source story.
- A future source adapter can replace Narrative production without changing
  Adaptation.
- Adaptation does not choose or replace the user-selected FormatContract.
- An invented visible event is present in the change ledger and preserves
  Narrative invariants.
- An explicit adaptation reroll changes Adaptation and Output fingerprints but
  not Narrative.
- No reroll occurs without explicit user approval.
- Output receives only `StoryboardHandoff + OutputStyle`.
- Storyboard failure blocks Output.
- Changing Narrative invalidates Adaptation and Output fingerprints.
- Changing FormatContract invalidates Adaptation and Output but not Narrative.
- Changing OutputStyle invalidates only Output.
- Existing legacy date-and-variant seeds remain unchanged.
- An Output prompt cannot contain NarrativeSpec or AdaptationSpec fields.
- A new format can be registered without modifying Narrative code or schema.

Manual forward tests:

- one goal-pursuit story;
- one relationship-change story;
- one dream-logic or circular story;
- one communal or distributed-action story;
- one current-primary-source story;
- one source with deliberate ambiguity;
- one storyboard that fails camera continuity;
- one OutputStyle that conflicts with a locked handoff field;
- one bold adaptation variant that adds a recorded bridging event;
- two adaptation variants from the same frozen NarrativeSpec.

## Acceptance Criteria

- The documented public pipeline has exactly three engines:
  Narrative, Adaptation, and Output.
- Storyboard is explicitly owned by Adaptation and is its completion proof.
- Narrative contains no target-format or output-style knowledge.
- The current active Codex model authors Narrative; later story sources can
  replace that producer at the same NarrativeSpec boundary.
- The user selects FormatContract, and the first implementation supports only
  the already selected four-panel comic.
- Adaptation is visual-only and owns the selected FormatContract, invented
  visual events, visible staging, rough storyboard, and storyboard validation.
- Adaptation can produce an explicitly requested challenging variant without
  changing Narrative.
- Output sees only a closed approved handoff plus OutputStyle.
- Full provenance remains available without leaking private upstream records
  into downstream engine inputs.
- Four-panel output remains behaviorally compatible after the refactor.
- A later format requires a new adapter and contract, not a Narrative branch.
- No skill pins a concrete model id.
- `shotloom-today` remains a thin caller and retains its final disk-line rule.
- All mechanical checks and contract fixtures pass.

## Open Questions

- None. The user resolved Narrative ownership, format selection, Adaptation
  invention authority, reroll behavior, and the visual-only boundary on
  2026-07-29.

## Design Plan

### Inputs

- `skills/daily-visual-story/SKILL.md`
- `skills/daily-visual-story/references/flow.md`
- `skills/daily-visual-story/scripts/daily-creative-seed.mjs`
- `skills/daily-visual-story/scripts/daily-creative-seed.test.mjs`
- Story and visual-style reference reservoirs owned by the skill
- `skills/gallery/`
- `scripts/validate-runtime-contracts.mjs`
- The thin `knitten-sl/skills/shotloom-today` delegation contract

### Outputs

- Three closed engine schemas and stage projections.
- Active-model Narrative authoring and review-pass provenance contracts.
- One four-panel `FormatContract`.
- Adaptation-owned storyboard package and closed handoff.
- Output-only style projection and render proof.
- Updated gallery provenance.
- Mechanical isolation, fingerprint, retry, and legacy stability tests.

### Implementation Sequence

#### 1. Freeze schemas and fingerprints

Files:

- `skills/daily-visual-story/references/engine-contracts.md`
- `skills/daily-visual-story/scripts/daily-creative-seed.mjs`
- `skills/daily-visual-story/scripts/daily-creative-seed.test.mjs`

Changes:

- Add closed NarrativeSpec, FormatContract, StoryboardPackage,
  StoryboardHandoff, OutputStyle, and OutputProof shapes.
- Add stage ownership, allowed-input, forbidden-key, and fingerprint rules.
- Introduce a new contract version without changing legacy results.

Risk:

- A schema that embeds current four-panel assumptions in Narrative will prevent
  later formats.

Proof:

- Closed-key fixtures reject cross-engine fields.
- Legacy date-and-variant snapshot tests remain unchanged.

#### 2. Build the Narrative boundary

Files:

- `skills/daily-visual-story/references/flow.md`
- Story-owned reference files
- Runtime author-provenance capture and tests

Changes:

- Replace the current Story stage label with the Narrative Engine contract.
- Produce Story Brief, active-model story, authoring review evidence, and frozen
  NarrativeSpec.
- Use the active Codex model as author and record its effective model without
  pinning it.
- Keep the producer replaceable by a future legend, novel, or other story
  source adapter.
- Keep all format and rendering vocabulary out of the Narrative projection.

Risk:

- Over-constraining one skeleton can recreate repetitive stories despite a
  larger reference reservoir.

Proof:

- Structure-family forward tests.
- Negative assertions for panel, camera, layout, and style fields.

#### 3. Merge Storyboard into Adaptation

Files:

- `skills/daily-visual-story/references/flow.md`
- `skills/daily-visual-story/scripts/daily-creative-seed.mjs`
- Four-panel format fixtures and storyboard validation tests

Changes:

- Define the four-panel FormatContract.
- Make Adaptation own event mapping, externalization, rough board generation,
  visible inspection, retry, and StoryboardPackage.
- Add recorded invented-event operations and the independently seeded
  adaptationVariant contract.
- Project the closed StoryboardHandoff only after every gate passes.

Risk:

- Treating prompt compliance as visible proof would let unusable boards pass.

Proof:

- Failing board fixtures block handoff and Output.
- Passed packages carry raster-linked validation fingerprints.
- Two variants preserve one Narrative fingerprint while producing distinct,
  independently validated StoryboardPackages.

#### 4. Close the Output boundary

Files:

- `skills/daily-visual-story/references/flow.md`
- Output-owned reference files
- Final prompt and render-proof fixtures

Changes:

- Build the final prompt from exactly StoryboardHandoff and OutputStyle.
- Reject Narrative, Adaptation, raw reference, and discarded-alternative keys.
- Record handoff preservation and storyboard-lock overrides.

Risk:

- Conversation memory can reintroduce upstream story knowledge even when the
  serialized prompt is clean.

Proof:

- Fresh closed-input Output call.
- Prompt and stage-projection negative assertions.

#### 5. Update orchestration and gallery provenance

Files:

- `skills/daily-visual-story/SKILL.md`
- `skills/daily-visual-story/references/flow.md`
- `skills/gallery/references/flow.md`
- `skills/gallery/scripts/manage-gallery.mjs`
- `skills/gallery/scripts/manage-gallery.test.mjs`
- `knitten-sl/skills/shotloom-today/flow.md` only if its invocation contract
  needs a compatibility adjustment

Changes:

- Expose the three-engine sequence in the skill surface.
- Store separate stage records and fingerprints while keeping the final prompt
  closed.
- Preserve the self-contained result block consumed by `shotloom-today`.

Risk:

- Gallery schema expansion can make old entries unreadable or non-idempotent.

Proof:

- Existing gallery fixtures still render.
- New entries round-trip with all three stage records.
- Thin Shotloom delegation validation remains green.

#### 6. Promote mechanical boundary checks

Files:

- `scripts/validate-runtime-contracts.mjs`
- Engine contract fixtures
- `README.md`

Changes:

- Add isolation-matrix, invalidation, and format-extension checks.
- Update the included-skill description without expanding unrelated routing.

Risk:

- Regex-only validation may prove wording rather than executable isolation.

Proof:

- Executable schema and projection tests are authoritative.
- Documentation regex checks remain supplemental.

### Review Plan

- Contract: verify that each engine has exactly one owner, closed input, durable
  artifact, completion condition, and downstream projection.
- Boundary: verify Storyboard belongs to Adaptation; Narrative has no format
  knowledge; Output has no upstream story or adaptation knowledge.
- Compatibility: verify historical seeds, gallery entries, and thin
  `shotloom-today` composition.
- Validation: require executable forbidden-key, fingerprint invalidation,
  storyboard-blocking, legacy stability, and gallery round-trip evidence.
