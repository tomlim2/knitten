# Standards Index

Detailed reference documents — read on-demand, NOT auto-loaded.

For always-applied constraints (one-liners), see [`rules/index.md`](../rules/index.md).
Standards contain the rationale, examples, and templates that rules link back to.

---

## Policy

| Standard | When to read |
|----------|-------------|
| [`agent-first-policy.md`](policy/agent-first-policy.md) | **Always** before designing a new layer (rule, standard, skill category, validator) or resolving a conflict between artifacts |

## Command & Skill Authoring

| Standard | When to read |
|----------|-------------|
| [`llm-first-docs.md`](policy/llm-first-docs.md) | **Always** before editing CLAUDE.md, rules, skills, commands, or standards |
| [`slash-commands.md`](authoring/slash-commands.md) | **Always** before creating commands — frontmatter, patterns, templates |
| [`command-skill-reference.md`](authoring/command-skill-reference.md) | Reference for existing commands and skills |

## Multi-Agent Ops

| Standard | When to read |
|----------|-------------|
| [`multi-agent-ops.md`](multi-agent/multi-agent-ops.md) | **Always** when assigned as 지통실 #1 (1호기) |
| [`agent-workflow.md`](multi-agent/agent-workflow.md) | Multi-pass agent pipelines |
| [`delegation.md`](multi-agent/delegation.md) | Task delegation to subagents |

## Research & Specs

| Standard | When to read |
|----------|-------------|
| [`research-methodology.md`](research/research-methodology.md) | Before research tasks |
| [`tech-spec-template.md`](research/tech-spec-template.md) | Writing technical specifications |
| [`review-spec-doc.md`](review/review-spec-doc.md) | Reviewing spec documents |

## Web / JavaScript / CSS

| Standard | When to read |
|----------|-------------|
| [`javascript.md`](language/javascript.md) | Before writing JavaScript |
| [`javascript-reference.md`](language/javascript-reference.md) | JS API/pattern reference |
| [`css.md`](language/css.md) | Before writing CSS |
| [`css-reference.md`](language/css-reference.md) | CSS property/pattern reference |
| [`design-system.md`](language/design-system.md) | Before creating UI/web pages |
| [`ui-design.md`](language/ui-design.md) | Before designing or reviewing UI (Apple HIG baseline) |
| [`three-shader-language.md`](language/three-shader-language.md) | Before Three.js TSL shaders |

## Unreal Engine

| Standard | When to read |
|----------|-------------|
| [`unreal-engine-cpp.md`](unreal/unreal-engine-cpp.md) | Before UE C++ work |
| [`unreal-engine-asset.md`](unreal/unreal-engine-asset.md) | Before UE asset work |

## Code Review

| Standard | When to read |
|----------|-------------|
| [`review-template.md`](review/review-template.md) | Base review template |
| [`review-ai-motion.md`](review/review-ai-motion.md) | **AI-generated motion** grading — 7 metrics (foot skate, penetration, jitter, contact accuracy, pose plausibility, root correlation, loop gap) + fault attribution matrix (Generator / Rig / Retarget / Physics / Viewer). Paired with `review-audit-ai-motion` skill. |
| [`review-code-javascript.md`](review/review-code-javascript.md) | JS code review |
| [`review-code-css.md`](review/review-code-css.md) | CSS code review |
| [`review-code-tsl.md`](review/review-code-tsl.md) | Three.js TSL shader review |
| [`review-code-unreal-cpp.md`](review/review-code-unreal-cpp.md) | UE C++ review |
| [`review-code-unreal-python.md`](review/review-code-unreal-python.md) | UE Python review |
| [`review-ux.md`](review/review-ux.md) | UX review |
| [`review-ux-python-gui.md`](review/review-ux-python-gui.md) | Python GUI UX review |
| [`review-ux-writing.md`](review/review-ux-writing.md) | UX writing review |
| [`review-3d-rendering.md`](review/review-3d-rendering.md) | 3D rendering review |

## CINEV / Project-Specific

| Standard | When to read |
|----------|-------------|
| [`cinev-git-workflow.md`](cinev/cinev-git-workflow.md) | **Always** before CINEV git ops (see also [`rules/cinev-git.md`](../rules/cinev-git.md)) |
| [`cinev-character-asset-naming.md`](cinev/cinev-character-asset-naming.md) | CINEV character asset naming |
| [`cinev-vrm-shading.md`](cinev/cinev-vrm-shading.md) | CINEV VRM shading work |
| [`cci-slack.md`](cinev/cci-slack.md) | Before Slack operations |
| [`arp-skeleton.md`](unreal/arp-skeleton.md) | ARP (Auto-Rig Pro) skeleton reference |

## Docs & System

| Standard | When to read |
|----------|-------------|
| [`obsidian-format.md`](obsidian/obsidian-format.md) | Before creating or migrating Obsidian documents (see also [`rules/obsidian.md`](../rules/obsidian.md)) |
| [`obsidian-tag-taxonomy.md`](obsidian/obsidian-tag-taxonomy.md) | Before tagging any Obsidian document — 3-axis system (`type/`, `project/`, `area/`, `lang/`, `tool/`) |
| [`repo-paths-keys.md`](system/repo-paths-keys.md) | Before registering repos or setting up a new machine |
