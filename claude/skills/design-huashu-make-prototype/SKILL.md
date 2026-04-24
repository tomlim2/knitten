---
name: design-huashu-make-prototype
description: HTML-native interactive prototypes, editable slide decks, infographics, and motion (MP4/GIF) via Huashu Design. 20 design philosophies + 5-axis design review + "3 directions" exploration. Outputs ship in 3-30 minutes without Figma or AE.
when_to_use: |
  YES when the user asks for any of:
    - Clickable interactive prototype (phone frame, screen transitions)
    - Editable slide deck (browser + PPTX export)
    - Infographic with print-quality typography
    - Short motion piece (MP4 or GIF, optional BGM)
    - Design direction exploration ("show me 3 visual directions")
    - 5-axis design critique / radar-chart review

  NO when:
    - Timeline-based video or narrative — use video-hyperframes-make-composition
    - Static PNG / PDF art (algorithmic or print) — use canvas-design
    - Production web UI component code — use frontend-design
    - Restyling an existing artifact with preset themes — use design-make-theme
    - Seeded p5.js generative art — use algorithmic-art
    - Applying Anthropic brand colors/type — use brand-guidelines
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx:*)
---

# design-huashu-make-prototype

caol-ila wrapper for the upstream Huashu Design skill (alchaincyf/huashu-design).

## Upstream skill

@~/Desktop/www/knitten/vendor/huashu-design/SKILL.md
