---
status: accepted
domains: obsidian
repo-keys: caol-ila
languages: markdown,yaml
task-types: authoring,implementation,review
context-profile: obsidian-vault
exclude-when: rust,web,unreal
---
# Obsidian Tag Taxonomy

3-axis structured tagging system for all Obsidian vault documents. Replaces ad-hoc flat tags with a predictable, filterable hierarchy.

---

## Design Principles

- **Tag what you filter by**, not what describes content (links handle content relationships)
- **Nested `/` hierarchy** — visible in tag pane, composable in queries
- **Lowercase kebab-case only** — `project/bevy-vrm`, never `Project/BeVrm`
- **Singular nouns** — `area/shader` not `area/shaders`
- **Max 5 tags per note** — more signals the taxonomy is wrong, not the note

---

## Axes

### `type/` — What kind of note

Always required. Exactly one per note.

| Tag | Use when |
|-----|----------|
| `type/devlog` | Dated work diary entry (hub or day file) |
| `type/learning` | Extracted lesson — worked, failed, gotcha |
| `type/reference` | How-to guide, lookup table, workflow recipe, external resource |
| `type/brief` | Project/task orientation doc — "read this first" context, handoff |
| `type/spec` | Technical specification document (system design, module contract) |
| `type/plan` | Next-session / execution plan for a specific task or ticket |
| `type/analysis` | Structured investigation, audit, or proof — no hypothesis cycle |
| `type/experiment` | Hypothesis → test → measure → conclude cycle |
| `type/glossary` | Term / vocabulary collection you look things up in |
| `type/decision` | ADR-style decision record (why we chose X over Y) |
| `type/profile` | Structured personal career record (resume data, role summaries) |
| `type/note` | Freeform personal note, hobby log, inbox capture — no formal structure |
| `type/review` | Code or asset review document |

---

### `project/` — Which project

Always required. Exactly one per note.

| Tag | Project |
|-----|---------|
| `project/shotloom` | Shotloom — Cinamon company project |
| `project/cinev` | cinev — Cinamon company project (everything except shotloom) |
| `project/hsa` | HSA — external client work |
| `project/bevy-vrm` | bevy-vrm renderer |
| `project/mmd-anju` | MMD Anju player |
| `project/codex-base` | Codex base workspace |
| `project/caol-ila` | agent hub / skills repo |
| `project/personal` | Personal notes, journal, passwords, hobby lists |
| `project/graphics-study` | Standalone graphics/3D/shader study notes (Blender, GLSL, Three.js, rendering theory) |
| `project/cross-project` | Cross-project agent learnings and conventions |
| `project/project-weekend` | Weekend project and studio-weekend docs |

Add new rows here as new projects appear. Do not invent a new tag mid-session without adding it to this table.

---

### `area/` — Domain / feature area

Optional. Use when the note is scoped to a sub-domain that you'll want to filter across projects or across time. File formats, named software, and libraries have dedicated axes — do not put them in `area/`.

Full list: see the `area/` section in **Live Tag Inventory** below. Before adding a new `area/` tag, search the inventory; reuse if present.

---

### `fmt/` — File format / spec

Use when the note is specifically about a file format, interchange spec, or material spec.

| Tag | Format |
|-----|--------|
| `fmt/vrm` | VRM character format |
| `fmt/vrma` | VRM Animation format |
| `fmt/fbx` | FBX exchange format |
| `fmt/pmx` | PMX (MikuMikuDance) format |
| `fmt/gltf` | glTF 2.0 |
| `fmt/mtoon` | MToon material spec |

---

### `lang/` — Programming language / shader language

Use for the core language a note is written in or about. Does not include libraries or frameworks (use `lib/`).

| Tag | Language |
|-----|---------|
| `lang/rust` | Rust |
| `lang/cpp` | C++ |
| `lang/python` | Python |
| `lang/javascript` | JavaScript |
| `lang/glsl` | GLSL |
| `lang/hlsl` | HLSL |
| `lang/webgpu` | WebGPU API / WGSL |

---

### `lib/` — Library / framework

Use for named libraries and frameworks (not languages, not standalone software).

Full list: see the `lib/` section in **Live Tag Inventory** below. Before adding a new `lib/` tag, search the inventory; reuse if present.

---

### `sys/` — Named software / engine subsystem

Use for standalone DCC tools and named engine subsystems that are proper nouns, not domain concepts.

| Tag | System |
|-----|--------|
| `sys/blender` | Blender DCC |
| `sys/blueprint` | UE Blueprint visual scripting |
| `sys/nanite` | UE Nanite virtualized geometry |
| `sys/niagara` | UE Niagara particle system |
| `sys/vrm4u` | VRM4U UE plugin |
| `sys/arp` | Auto-Rig Pro (Blender) |
| `sys/claude-code` | Claude Code runtime/tooling |

---

### `llm/` — AI model / service

Use on `type/reference` notes that document a prompt, workflow, or output from an AI model. Format: `llm/{provider-or-model}-{version}` in kebab-case.

Full list: see the `llm/` section in **Live Tag Inventory** below. Before adding a new `llm/` tag, search the inventory to avoid naming drift; prefer specific model+version over broad provider name.

---

### `tech/` — Rendering technique / algorithm

Use when the note is specifically about a technique or algorithm as a concept — not just a file that happens to use it. The distinction from `area/`:

- `area/shader` — you're working in the shader domain
- `tech/sdf` — you're specifically studying or documenting the SDF technique itself

A note can carry both: a toon-shader file that digs into SDF face shadow gets `area/shader` + `tech/sdf`.

Do **not** use `tech/` as a substitute for `area/` on domain notes. If in doubt, use `area/`.

Full list: see the `tech/` section in **Live Tag Inventory** below.

---

### `hobby/` — Personal hobby / interest

Use for notes about personal hobbies and interests outside work. Replaces drink/leisure tags that were incorrectly placed in `area/`.

Full list: see the `hobby/` section in **Live Tag Inventory** below (when present), or search the vault for existing `hobby/` tags before adding a new one.

---

### `status/` — Workflow state (optional, actionable notes only)

Use only when the note is an active work item (experiment, decision, investigation). Omit for completed historical records.

| Tag | Meaning |
|-----|---------|
| `status/draft` | Work-in-progress document not yet ready for use |
| `status/active` | In-progress work item |
| `status/blocked` | Waiting on something external |
| `status/done` | Resolved / concluded |
| `status/backlog` | Planned but not active |
| `status/in-review` | Awaiting review |

---

## Per-file-type tag sets

### devlog day (`days/YYYY-MM-DD.md`)

```yaml
tags:
  - type/devlog
  - project/shotloom
  - area/retarget        # only if day is scoped to one area
```

### learning (`learnings/{slug}.md`)

```yaml
tags:
  - type/learning
  - project/shotloom
  - lang/rust            # if code-heavy
```

### analysis / decision (`topics/{slug}.md` or `specs/{slug}.md`)

```yaml
tags:
  - type/analysis        # or type/decision for ADR-style
  - project/shotloom
  - area/shader          # the note's domain
  - lang/rust            # if code-heavy
```

### reference — AI prompt/workflow

```yaml
tags:
  - type/reference
  - area/ui              # subject domain
  - llm/gpt-image-2
  - llm/seedance-2-0     # all models used, not just one
```

### reference — code snippet / library

```yaml
tags:
  - type/reference
  - area/animation
  - lang/rust
  - lib/bevy
```

---

## Migration from flat tags

Old flat tags map to the new axes as follows:

| Old tag | New tag |
|---------|---------|
| `devlog` | `type/devlog` |
| `learnings` | `type/learning` |
| `reference` | `type/reference` |
| `topic` / `type/topic` | **eliminated** — reclassify as `type/analysis`, `type/spec`, `type/brief`, `type/note`, or `type/decision` based on content |
| `image-prompt` | `type/reference` + `area/image-gen` (or domain) |
| `cinev` | `project/cinev` |
| `bevy-vrm` | `project/bevy-vrm` |
| `retarget` | `area/retarget` |
| `shader` | `area/shader` |
| `rust` | `lang/rust` |
| `rule` | inline `#rule` in learnings body — not a frontmatter axis |
| `failed` | inline `#failed` in learnings body — not a frontmatter axis |
| `gotcha` | inline `#gotcha` in learnings body — not a frontmatter axis |

**Migrate progressively** — apply new tags when editing a note, not in a big-bang pass.

---

## Inline tags (body)

Inline `#tag` is reserved for learnings-specific semantic markers inside the note body only:

- `#rule` — inside `> [!abstract] Rule` callouts
- `#failed` — marking a failed approach
- `#gotcha` — marking a non-obvious trap

Do not add any other inline tags. All filterable metadata lives in frontmatter.

---

## Live Tag Inventory

Full vault as of 2026-05-01. 160 unique tags, 2201 usages, 0 flat tags. Axes: type/ project/ area/ fmt/ lang/ lib/ sys/ tech/ llm/ hobby/ status/.
Update counts when adding or retiring a tag. Count=1 tags are candidates for consolidation.

### type/ (13 tags, 600 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `type/reference` | 215 | |
| `type/devlog` | 188 | |
| `type/learning` | 102 | |
| `type/review` | 19 | |
| `type/brief` | 14 | project/task orientation, handoff docs |
| `type/analysis` | 13 | structured investigation/audit/proof |
| `type/spec` | 11 | technical specification documents |
| `type/note` | 11 | freeform personal note / hobby log |
| `type/profile` | 8 | personal career records |
| `type/plan` | 7 | next-session / execution plans |
| `type/decision` | 7 | |
| `type/glossary` | 3 | |
| `type/experiment` | 1 | |

### project/ (28 tags, 600 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `project/cinev` | 146 | Cinamon company project |
| `project/bevy-vrm` | 139 | |
| `project/shotloom` | 74 | Cinamon company project |
| `project/job-search` | 36 | |
| `project/ue-live-scene-bridge` | 31 | |
| `project/graphics-study` | 25 | Blender·GLSL·Three.js·rendering theory |
| `project/personal` | 24 | personal notes, journal, hobby lists |
| `project/caol-ila` | 21 | |
| `project/mmd-anju` | 15 | |
| `project/studio-weekend` | 14 | |
| `project/tutoring` | 12 | |
| `project/codex-base` | 11 | |
| `project/krafton-hackathon` | 8 | |
| `project/nestcc` | 5 | |
| `project/roblox` | 5 | |
| `project/consulting` | 7 | |
| `project/drinks` | 4 | |
| `project/tycoon` | 4 | |
| `project/hsa` | 3 | external client |
| `project/oss` | 3 | |
| `project/just-wander` | 2 | |
| `project/megamelange` | 2 | |
| `project/second-raid` | 2 | |
| `project/chzzk` | 1 | Chzzk — Naver streaming platform (Twitch-like), hobby |
| `project/hyper3d` | 1 | consolidate if no new docs |
| `project/hyperframes` | 1 | consolidate if no new docs |
| `project/matcap-painter` | 1 | consolidate if no new docs |
| `project/minecraft` | 1 | consolidate if no new docs |
| `project/weekend-survivor` | 1 | consolidate if no new docs |
| `project/cross-project` | 4 | Cross-project agent learnings and conventions |
| `project/project-weekend` | 19 | Weekend project and studio-weekend docs |

### area/ (77 tags, 716 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `area/unreal-engine` | 114 | |
| `area/retarget` | 99 | |
| `area/shader` | 92 | |
| `area/skeleton` | 58 | |
| `area/animation` | 21 | |
| `area/character` | 20 | |
| `area/material` | 17 | |
| `area/ai` | 16 | |
| `area/toon-rendering` | 16 | |
| `area/ux` | 15 | |
| `area/backend` | 14 | |
| `area/llm` | 13 | |
| `area/texture` | 13 | |
| `area/git` | 12 | |
| `area/optimization` | 11 | |
| `area/build` | 9 | |
| `area/mcp` | 9 | |
| `area/web-graphics` | 9 | |
| `area/graphics` | 8 | |
| `area/normalizer` | 8 | |
| `area/game-dev` | 7 | |
| `area/pr` | 7 | |
| `area/adr` | 6 | |
| `area/architecture` | 6 | |
| `area/environment` | 6 | |
| `area/skin-color` | 6 | |
| `area/automation` | 5 | |
| `area/design` | 5 | |
| `area/profiling` | 5 | |
| `area/troubleshooting` | 5 | |
| `area/web` | 5 | |
| `area/interaction` | 4 | |
| `area/lighting` | 4 | |
| `area/prompt` | 4 | |
| `area/conventions` | 3 | |
| `area/finger` | 3 | |
| `area/fixtures` | 3 | |
| `area/quaternion` | 3 | |
| `area/workflow` | 3 | |
| `area/algorithm` | 2 | |
| `area/camera` | 2 | |
| `area/ci` | 2 | |
| `area/cocktail` | 2 | |
| `area/color` | 2 | |
| `area/geometry` | 2 | |
| `area/landscape` | 2 | |
| `area/math` | 2 | |
| `area/pipeline` | 2 | |
| `area/plugin` | 2 | |
| `area/prompt-engineering` | 2 | |
| `area/rubric` | 2 | |
| `area/vegetation` | 2 | |
| `area/wine` | 2 | |
| `area/ai-behavior` | 1 | |
| `area/champagne` | 1 | merge into `area/wine`? |
| `area/decal` | 1 | |
| `area/file-formats` | 1 | |
| `area/frontend` | 1 | |
| `area/image-gen` | 1 | |
| `area/infra` | 1 | |
| `area/level-design` | 1 | |
| `area/linear` | 1 | |
| `area/metrics` | 1 | |
| `area/packaging` | 1 | |
| `area/pose` | 1 | |
| `area/refactor` | 1 | |
| `area/shadow` | 1 | |
| `area/skills` | 1 | |
| `area/slack` | 1 | |
| `area/ta` | 1 | |
| `area/tasting` | 1 | |
| `area/testing` | 1 | |
| `area/trait-design` | 1 | |
| `area/travel` | 1 | |
| `area/video` | 1 | |
| `area/weather` | 1 | |
| `area/whisky` | 1 | |
| `area/agent-system` | 1 | agent hub, harness, and shared agent system design |
| `area/context` | 1 | context loading, routing, and budget design |
| `area/deploy` | 1 | deployment docs and deployment workflows |
| `area/docs` | 3 | documentation systems and doc maintenance |
| `area/editor-shell` | 2 | editor-shell UX and command surfaces |
| `area/harness` | 1 | agent runtime adapters and harness behavior |
| `area/interview` | 2 | interview notes and interview preparation |
| `area/learning` | 1 | learning workflows and learning-note organization |
| `area/observability` | 2 | logs, hooks, traces, and operational visibility |
| `area/obsidian` | 16 | Obsidian vault structure and note policy |
| `area/ops` | 2 | operational runbooks and recurring ops |
| `area/performance` | 1 | performance analysis and tuning |
| `area/rendering` | 8 | rendering systems and rendering research |
| `area/router` | 1 | route selection and routing registries |
| `area/vocab` | 1 | vocabulary and language-learning notes |

### fmt/ (7 tags, 89 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `fmt/vrm` | 52 | |
| `fmt/fbx` | 16 | |
| `fmt/pmx` | 9 | |
| `fmt/mtoon` | 5 | |
| `fmt/gltf` | 3 | |
| `fmt/vrm4u` | 3 | VRM4U → consolidate to sys/vrm4u |
| `fmt/vrma` | 1 | |

### lang/ (9 tags, 123 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `lang/rust` | 77 | |
| `lang/glsl` | 12 | |
| `lang/cpp` | 10 | |
| `lang/python` | 9 | |
| `lang/javascript` | 6 | |
| `lang/webgpu` | 4 | |
| `lang/hlsl` | 3 | |
| `lang/wasm` | 1 | |
| `lang/webgl` | 1 | |
| `lang/typescript` | 5 | |

### lib/ (5 tags, 21 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `lib/threejs` | 13 | |
| `lib/p5js` | 5 | |
| `lib/bevy` | 2 | Bevy ECS game engine (Rust) |
| `lib/mermaid` | 1 | |
| `lib/react` | 1 | |
| `lib/wgpu` | 1 | |
| `lib/github-actions` | 2 | GitHub Actions workflow/runtime notes |
| `lib/nginx` | 1 | Nginx server/runtime notes |
| `lib/shotloom-gltf` | 1 | Shotloom glTF helper library |

### sys/ (5 tags, 29 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `sys/blender` | 17 | |
| `sys/blueprint` | 7 | |
| `sys/nanite` | 2 | |
| `sys/niagara` | 2 | |
| `sys/arp` | 1 | |
| `sys/claude-code` | 2 | Claude Code runtime/tooling notes |

### tech/ (10 tags, 15 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `tech/pbr` | 3 | |
| `tech/tonemapping` | 3 | |
| `tech/procedural` | 2 | |
| `tech/gaussian-splatting` | 1 | |
| `tech/gpgpu` | 1 | |
| `tech/masking` | 1 | |
| `tech/mesh-generation` | 1 | |
| `tech/ray-marching` | 1 | |
| `tech/sdf` | 1 | |
| `tech/world-generation` | 1 | |

### hobby/ (2 tags, 3 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `hobby/cocktail` | 2 | cocktail notes |
| `hobby/tasting` | 1 | tasting notes |

### llm/ (7 tags, 9 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `llm/3d-genai` | 2 | rename to specific model when known |
| `llm/gemini` | 2 | |
| `llm/anthropic` | 1 | |
| `llm/gpt-image-2` | 1 | |
| `llm/nvidia` | 1 | too broad — rename to specific model |
| `llm/openai` | 1 | |
| `llm/seedance-2-0` | 1 | |
