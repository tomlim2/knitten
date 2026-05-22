---
title: "Checker Texture Shimmer"
tags:
  - type/learning
  - project/shotloom
  - area/rendering
date: 2026-05-22
updated: 2026-05-22
source: agent
---

# Checker Texture Shimmer

---

## What Worked

### Make the checker asset larger before tuning filters

- **Date** — 2026-05-22
- **Context** — Shotloom void-stage ground plane uses `assets/default/checker.png` through `PlaceholderMaterial`.
- **Problem** — A tiny high-contrast checker tile became hard to read and visually noisy when repeated across a large ground plane. Linear filtering reduced shimmer but made the checker pattern too soft.
- **Solution** — Replace the tiny checker with a larger grayscale texture, keep the authored checker cells explicit, reduce contrast, and use repeat addressing with nearest magnification plus linear minification/mipmap filtering.
- **Why it worked** — The larger source texture gives the sampler more pixels to choose from before minification. Muted contrast lowers high-frequency aliasing. Nearest magnification keeps close-range cells readable, while linear minification smooths distant repeats.

> [!abstract] Rule
> For a large repeated floor checker, fix readability at the texture-design level first, then tune sampler filters; sampler changes alone can trade shimmer for unreadable blur. #rule

---

## What Failed

### All-linear filtering for the checker

- **Date** — 2026-05-22
- **Context** — The placeholder checker was tested with linear magnification, linear minification, and linear mipmap filtering.
- **Problem** — The distant shimmer improved, but the checker became visually mushy and harder to read at normal inspection distance.

> [!abstract] Rule
> Do not make checker magnification linear by default when the checker is a visual scale cue; keep close-range edges readable unless the asset itself is designed for soft display. #rule

---

## Gotcha

### Checker cell size is an authoring contract, not only a texture property

- **Date** — 2026-05-22
- **Context** — The ground checker cell was set to 2m while the texture contains an 8x8 checker-cell layout.
- **Problem** — Changing only texture resolution does not define world scale. The UV tiling code must still encode how many world meters each checker cell represents.
- **Solution** — Keep a separate world-cell constant and derive ground UV repeats from ground size, cell size, and checker cells per texture axis.

> [!abstract] Rule
> Store checker world scale in code or data separately from bitmap resolution; bitmap pixels control sampling quality, not the real-world cell size. #rule
