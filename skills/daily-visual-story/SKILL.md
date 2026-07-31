---
name: daily-visual-story
description: Create and archive a deterministic daily four-panel story through isolated Narrative, Adaptation-owned Storyboard, and Output engines.
match-check: normal
---

# Daily Visual Story

Use for: making the daily creative result independently of any work dashboard,
issue tracker, pull request, or disk-cleanup workflow.

## Step 0: Match Check

- Continue for an explicit daily visual story, emotional image, daily joke
  image, or four-panel creative-output request.
- Also continue when an owning skill explicitly delegates its daily creative
  section to this skill and passes through the exact `--joke-variant` and
  `--adaptation-variant` values.
- The default is the current Asia/Seoul date, Narrative variant `0`,
  Adaptation variant `0`, and the user-selected `four-panel-comic` format.
  Different variants must be explicit non-negative integers; never reroll
  silently.
- Allowed local mutation is limited to copying a successfully generated image
  and its exact prompt metadata into the registered Knitten gallery.
- Do not use private work context, software development, issue trackers, pull
  requests, or disk cleanup as creative material.

If the request does not match, stop before loading references or generating
images.

Do not read detailed references until Step 0 passes.

## After Match

Read [references/engine-contracts.md](references/engine-contracts.md), then
[references/flow.md](references/flow.md), and execute the flow. The Narrative
domain
owns
[references/story-legacy-deck.json](references/story-legacy-deck.json) and
[references/story-theme-reservoir.json](references/story-theme-reservoir.json).
The Output domain owns
[references/visual-style-core-deck.json](references/visual-style-core-deck.json)
and
[references/visual-style-reservoir.json](references/visual-style-reservoir.json).
Adaptation owns Storyboard generation and visible validation; it loads neither
raw domain reservoir. For the rough Storyboard proof, Adaptation also reads
[references/storyboard-style-research.md](references/storyboard-style-research.md)
as visual-language guidance only.
