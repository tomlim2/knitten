---
name: gallery
description: Collect and show dated Knitten images with their creative intent, joke, and exact generation prompt.
match-check: normal
---

# Knitten Gallery

Use for: viewing, backfilling, or adding daily generated images to the Knitten
gallery.

## Step 0: Match Check

- Continue only for a Knitten gallery request or for an owning skill that has
  just generated an image intended for the daily gallery.
- For `add`, require the image, date, creative direction, rationale, joke, and
  exact final generation prompt. Do not reconstruct a missing prompt and label
  it as exact.
- Include older images only when their daily-gallery provenance is explicit.
  Do not sweep unrelated files from a generated-image cache.
- Gallery writes are local-only. Do not publish, commit generated images, or
  modify the source image.

If the request does not match, stop before loading details or writing files.

Do not read detailed references until Step 0 passes.

## After Match

Read [references/flow.md](references/flow.md), then execute the requested
gallery operation.
