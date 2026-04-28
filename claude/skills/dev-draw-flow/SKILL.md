---
name: dev-draw-flow
description: ASCII data-flow / module-architecture diagram generator. Single connected top-to-bottom flow, module boxes with IN / OUT / fn / notes, type-labeled arrows, fan-in / fan-out / bypass-lane support. Use when documenting pipeline structure, crate-to-crate data flow, or multi-stage processing with asymmetric paths.
when_to_use: User asks to "draw a pipeline diagram", "make a flow chart", "show data flow", "diagram the modules", "그림 그려줘", "다이어그램 만들어줘", or wants to update an existing flow diagram. Also useful when explaining architecture and a visual would beat prose.
allowed-tools: Read, Write, Edit, Bash(cat:*), Bash(ls:*), Bash(rg:*), Bash(grep:*)
argument-hint: "[topic] or [path-to-existing-diagram-md]"
---

# dev-draw-flow

ASCII pipeline diagram generator. Produces a **single connected top-to-bottom flow** showing modules (boxes with IN / OUT / fn / notes) and the typed data flowing between them. Designed for software architecture docs (Obsidian topic files, ADRs, README crate diagrams, etc.).

## Output style — what makes this distinct

The diagrams produced by this skill follow a specific style. Don't deviate without reason.

1. **Single continuous flow** — NO stage-header boxes (`┌── STAGE 1 ──┐`). Top-to-bottom, all arrows connect from start to end without segmenting.
2. **Module boxes** with consistent internal layout:
   ```
   ┌─────────────────────────────────────┐
   │ {module-name} — {one-line role}     │
   │                                     │
   │ IN:  {input types, indented body}   │
   │ OUT: {output types, indented body}  │
   │                                     │
   │ fn:  {driver fn names}              │
   │                                     │
   │ {notes / status / canonical / ADR}  │
   └─────────────────────────────────────┘
   ```
3. **Type labels on arrows** — every arrow between modules carries the type name flowing through it (e.g. `ImportedVrmAsset`, `Vec<BoneTrack>`).
4. **Fan-in / fan-out** — when one module feeds multiple, branch the arrow with `┬` / `┴`. When multiple feed one, merge with the same.
5. **Bypass lanes** — when one path skips a stage that another goes through, draw the bypass as a parallel vertical line that re-joins later. Don't split into separate diagrams.
6. **Width ~80 columns** — wide enough that important type names don't wrap brutally. Module boxes 50–76 char wide depending on content density.
7. **Status callout above** — `> [!info] Status (date)` listing the transitional / completed steps if relevant.
8. **Asymmetry explanation below** — if the diagram has bypass lanes or asymmetric paths, add a `> [!info]` callout below the diagram explaining why.

## Workflow

### Step 1: Gather

Ask the user (or extract from context) for each module:

- **Name** — crate / module / service name
- **Role** — one-line role description
- **IN types** — input types and constraints
- **OUT types** — output types
- **Driver fn(s)** — public entry point(s)
- **Notes** — canonical target, transitional state, ADR refs, status (✓ / ⚠ / ⏳)

And for connections:

- Which module's OUT feeds which module's IN
- The exact type name on each arrow
- Bypass paths (modules skipped on certain branches)
- Fan-in (multiple producers → one consumer) / fan-out (one producer → multiple consumers)

If the user provides a code repo or existing markdown, extract this from `pub use`, `pub fn`, `pub struct`, doc comments, and ADR references via `rg` / `grep`.

### Step 2: Plan layout

1. **Draw the dependency tree top-to-bottom.** Sources at top, final consumer at bottom.
2. **Identify fan points.** Where does flow split (fan-out)? Where does it merge (fan-in)?
3. **Identify bypass lanes.** Which paths skip which modules?
4. **Decide column width.** Default 80. If content rich, 84 max. Don't go past terminal width.
5. **Plan box widths.** Single-row modules ~50 char. Three-up parallel modules ~25 each. Wide engine/runtime boxes ~76.

### Step 3: Render

Use the templates in [reference.md](reference.md). Key patterns:

- Single module → single module: arrow with type label
- Single module → N modules (fan-out): tree branch with type labels per branch
- N modules → single module (fan-in): merge with type labels per branch
- Bypass lane: parallel vertical line that re-joins later

### Step 4: Wrap with context

- Above diagram: optional `> [!info] Status` callout listing transitional / completed steps
- Below diagram: optional `> [!info]` callout explaining asymmetric paths or bypass reasons
- Section heading: `## 다이어그램` or `## Diagram` depending on doc language

### Step 5: Sanity check

Before delivering:

- Every arrow has a type label
- Every module box has IN / OUT / fn at minimum
- No stage-header boxes
- Width consistent (no random wide / narrow drift)
- Fan-in / fan-out merges align vertically
- Bypass lane reaches its rejoin point cleanly

## Argument handling

`/dev-draw-flow [topic]`:
- No arg → ask the user what to draw
- Topic name → assume new diagram, gather modules interactively
- Path to existing `.md` → read it, identify the existing diagram, ask what to change

If the existing diagram doesn't follow this style, offer to redraw in this style.

## Common variants

The skill produces three core layouts:

1. **Linear pipeline** — single column, top-to-bottom, no branches. (rare for real architecture)
2. **Fan-out / fan-in pipeline** — like the Shotloom import → normalize → retarget → engine flow. Most common.
3. **Mesh** — multiple fan-outs and fan-ins with cross-connections. Use sparingly; if too tangled, split into multiple diagrams.

For dependency graphs (no data flow, just import direction), use a simpler pattern — see [reference.md](reference.md).

## Templates and full examples

See [reference.md](reference.md) for:

- ASCII box templates (module, three-up, wide-runtime)
- Fan-out / fan-in / bypass-lane patterns
- Worked example: Shotloom import → animation track flow
- Worked example: simple linear pipeline
- Worked example: dependency graph

## Related

- `obsidian-obsidian-markdown` — wikilink / callout syntax for embedding in Obsidian
- `dev-generate-spec` — spec doc generator (use when prose, not diagram, is the goal)
- `learn-log-day` — topic file creator (good destination for finished diagrams)
