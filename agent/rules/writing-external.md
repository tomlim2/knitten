---
load: triggered
trigger: writing external-facing prose (blog posts, social posts, public docs)
---

- **External pipeline** — `/writing-draft-human` → `/writing-fix-ai` → final.
- **Internal content exempt** — Code comments, commit messages, PR bodies, internal docs, vault notes do NOT route through this pipeline.
- **Trigger boundary** — "External" = anyone outside the user's own machine reads it. If unsure, ask.
