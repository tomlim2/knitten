---
description: HTML-native prototypes, slide decks, infographics, and motion (MP4/GIF) via Huashu Design — no Figma or AE needed.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(npx:*)
domains: web
repo-keys: agent-hub,mmd-anju,ta-portfolio
languages: css,javascript,typescript
frameworks: astro,three
task-types: implementation
context-profile: web-frontend
exclude-when: rust,unreal,obsidian
name: design-huashu-make-prototype
when_to_use: |
  YES when the user asks for any of:
    - 5-axis design critique / radar-chart review
    - Applying Anthropic brand colors/type — use brand-guidelines
    - Clickable interactive prototype (phone frame, screen transitions)
    - Design direction exploration ("show me 3 visual directions")
    - Editable slide deck (browser + PPTX export)
    - Infographic with print-quality typography
    - Production web UI component code — use frontend-design
    - Restyling an existing artifact with preset themes — use design-make-theme
    - Seeded p5.js generative art — use algorithmic-art
    - Short motion piece (MP4 or GIF, optional BGM)
    - Static PNG / PDF art (algorithmic or print) — use canvas-design
    - Timeline-based video or narrative — use video-hyperframes-make-composition
  NO when:
---

# design-huashu-make-prototype

agent-hub wrapper for the upstream Huashu Design skill (alchaincyf/huashu-design).

## Upstream skill

@~/.claude/vendor/huashu-design/SKILL.md
