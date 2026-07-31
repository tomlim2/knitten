# Storyboard Style Research

This reference belongs to Adaptation. Load it before generating the rough
Storyboard completion proof. It supplies storyboard visual language only. It
does not supply Narrative content, Output medium, palette, lighting, material,
texture, or final finish.

## Sources Checked

- Disney Animation, "Story": story artists begin with script thumbnails, then
  move from rough to fine while solving staging, framing, timing, expression,
  and emotion.
  https://disneyanimation.com/process/story/
- StoryboardArt, "Thumbnails VS Storyboards": thumbnails are fast, rough
  sketches for testing shot choices and composition before detail; roughs
  should block in shapes and remain clear rather than polished.
  https://storyboardart.org/storyboard-tutorials/thumbnails-vs-storyboards/
- StudioBinder, "Storyboard Arrows": arrows communicate camera and subject
  movement in a static board and act as production notation.
  https://www.studiobinder.com/blog/storyboard-arrows-meaning/
- StudioBinder, "Storyboard Camera Movement": pan, tilt, zoom, and tracking
  moves are encoded with simple directional arrows.
  https://www.studiobinder.com/blog/storyboard-camera-movement/
- Toon Boom Storyboard Pro: professional storyboard workflow includes a first
  thumbnailing pass, visual storytelling refinement, pitching boards, and
  timing camera moves in an animatic.
  https://www.toonboom.com/products/storyboard-pro
- Creative Bloq, "17 expert storyboard tips for TV animation": horizon line and
  camera placement are early panel decisions that should serve the story.
  https://www.creativebloq.com/advice/storyboard-tips
- Adobe, "How to storyboard for animation": rough thumbnails should be drawn
  from the viewer's screen perspective, with shot changes made when the viewer
  would need a new view.
  https://www.adobe.com/uk/creativecloud/animation/discover/animation-storyboarding.html
- Vancouver Film School, "Storyboard Artist": storyboard work tests
  compositions, preserves screen-direction continuity, and notes effects or
  camera moves.
  https://vfs.edu/content/storyboard-artist

Visual examples may be used only as category references for rough production
thumbnail language, never as artists to imitate:

- Design Observer, "Saul Bass and the shower scene in Psycho": abstract
  thumbnail panels with bold movement marks and arrows.
  https://designobserver.com/reassessing-the-saul-bass-and-alfred-hitchcock-collaboration/
- D'Source, "Thumbnailing": rough animation layout thumbnails with directional
  arrows and fast composition exploration.
  https://www.dsource.in/course/layout-design-animation-part-i/thumbnailing
- Andy Gray Art, "Storyboards": rough grayscale panel sequences with movement
  arrows and minimal red markup.
  https://www.andygrayart.com/storyboards.html
- Omari The Animator, "Pitch Bible & Character Designs": small thumbnail sheet
  structure with repeated rough panels, arrows, and staging notes.
  https://omaritheanimator.blogspot.com/2012/11/pitch-bible-character-designs.html

## Working Synthesis

The target is a professional production thumbnail sheet, not a clean diagram
and not concept art.

Use:

- small framed panels in a sheet;
- hand-drawn frame boxes with slight wobble;
- loose pencil or marker construction lines;
- horizon lines, ground planes, crop guides, and simple perspective guides;
- arrows, path lines, and repeated positions for movement;
- simple grey value blocks only when needed for readability;
- clearly separated screen-direction and spatial relationships;
- rough, disposable marks that are still legible.

Avoid:

- finished illustration;
- cinematic concept art;
- character design;
- emotional acting pose;
- clothing, hair, faces, hands, fingers, feet, body outlines, or silhouettes;
- decorative lighting;
- final material, texture, palette, or named visual style;
- text, labels, panel numbers, captions, logos, signatures, or watermarks.

## Actor Notation Rule

For this skill, the storyboard raster must not show finished people, humanoid
silhouettes, costumes, acting detail, or character designs. Pick the simplest
actor notation that keeps the action legible.

Human actor notation is sparse construction armature. Use it whenever the
adapted beat visibly includes people:

- line of action;
- blank head circle or oval;
- ribcage bean or box;
- pelvis wedge or box;
- shoulder and hip axes;
- joint dots;
- single-stroke limb lines with unfinished dot ends.

Nonhuman, object, crowd, or impersonal actor notation is geometric blocking
tokens:

- circles;
- squares;
- flat ovals;
- rectangles;
- dots;
- directional arrows;
- repeated token positions.

Do not hide a visible human beat behind a purely abstract token when the story
depends on human attention, contact, bracing, pulling, recoil, or looking.
Construction armatures must not become finished stick figures. Do not draw
faces, hair, hands, fingers, feet, shoes, clothing, skin outline, costume,
muscles, or silhouette fill. If a viewer reads a mark as a designed character
rather than pose scaffolding, the storyboard attempt fails.

Use environment and causal objects to carry story readability: sign anchors,
doors, cracks, paths, tools, props, queues, thresholds, and residue marks.

## Causal Legibility Rule

The storyboard is a visual logic test. Before prompting image generation,
Adaptation must know how a first-time viewer will read each beat without
Narrative prose.

Use a small state-timing table for repeated visual tokens and causal objects.
For each route, queue, shadow, door, sign, bridge, key, tool, or residue mark,
decide what state it has before, during, and after the visible action that
changes it.

Do not show future solved state early. If a path changes because an object is
fixed in panel 3, the path must remain blocked or ambiguous before panel 3,
may appear as a ghost or partial intent during panel 3, and may become a solid
resolved path only in panel 4.

Every actor mark must relate to the scene through a visible mechanism:

- sight-line from actor to problem or result;
- contact point from actor to causal object;
- pull-line, cord, lever, hinge, or tool that connects action to effect;
- before/after object alignment;
- first/final panel rhyme that makes the changed state obvious.

If a first-time viewer can identify the objects but not why the state changes,
the storyboard fails even if the sketch style is attractive.

## Image Generation Prompt Shape

Prefer wording like:

```text
professional rough storyboard thumbnail sheet, pre-production blocking board,
loose pencil construction lines, hand-drawn frame boxes, horizon lines,
camera/action arrows, movement paths, human actors as sparse construction
armatures, nonhuman/object actors as simple geometric tokens, black/white/gray,
rough but readable, functional production planning image
```

Add the story-specific blocking after that.

Always include:

```text
no finished human figures, no humanoid silhouettes, no faces, no hair, no
hands, no fingers, no feet, no clothing, no body outline, no costume, no
character design, no rendering, no lighting, no texture, no palette, no
concept art, no final illustration, no text
```

If the model drifts toward a clean diagram, ask for more hand-drawn production
thumbnail marks, wobbling panel borders, construction lines, and value blocks.
If the model drifts toward finished people or character design, fail the
attempt and regenerate within the two-attempt limit. If the model shows the
solved state before its cause, fail the attempt even when the drawing is clear.
