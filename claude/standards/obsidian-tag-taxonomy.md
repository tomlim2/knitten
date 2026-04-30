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
| `type/devlog` | Daily work log (hub or day file) |
| `type/learning` | Extracted lesson — worked, failed, gotcha |
| `type/topic` | Self-contained reference on one concept |
| `type/reference` | External resource — prompt, snippet, workflow |
| `type/decision` | ADR-style decision record |
| `type/experiment` | Hypothesis → measure → conclude cycle |

---

### `project/` — Which project

Always required (unless note is cross-project). Exactly one per note.

| Tag | Project |
|-----|---------|
| `project/shotloom` | Shotloom — 시나몬(Cinamon) 회사 프로젝트 |
| `project/cinev` | cinev — 시나몬 회사 프로젝트 (shotloom 외 전반) |
| `project/hsa` | HSA — 외부 회사 클라이언트 작업 |
| `project/bevy-vrm` | bevy-vrm renderer |
| `project/mmd-anju` | MMD Anju player |
| `project/codex-base` | Codex base workspace |
| `project/caol-ila` | Claude config / skills repo |

Add new rows here as new projects appear. Do not invent a new tag mid-session without adding it to this table.

---

### `area/` — Domain / feature area

Optional. Use when the note is scoped to a sub-domain that you'll want to filter across projects or across time. File formats, named software, and libraries have dedicated axes — do not put them in `area/`.

Examples: `area/retarget`, `area/shader`, `area/animation`, `area/skeleton`, `area/toon-rendering`, `area/optimization`, `area/unreal-engine`.

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

Examples: `lib/threejs`, `lib/p5js`, `lib/react`, `lib/wgpu`, `lib/bevy`, `lib/mermaid`.

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

---

### `llm/` — AI model / service

Use on `type/reference` notes that document a prompt, workflow, or output from an AI model. Format: `llm/{provider-or-model}-{version}` in kebab-case.

Examples: `llm/gpt-image-2`, `llm/gemini`, `llm/seedance-2-0`, `llm/flux-dev`, `llm/runway-gen-4`.

Before tagging, search existing `llm/` tags to avoid naming drift.

---

### `tech/` — Rendering technique / algorithm

Use when the note is specifically about a technique or algorithm as a concept — not just a file that happens to use it. The distinction from `area/`:

- `area/shader` — you're working in the shader domain
- `tech/sdf` — you're specifically studying or documenting the SDF technique itself

A note can carry both: a toon-shader file that digs into SDF face shadow gets `area/shader` + `tech/sdf`.

Do **not** use `tech/` as a substitute for `area/` on domain notes. If in doubt, use `area/`.

Examples: `tech/sdf`, `tech/pbr`, `tech/ray-marching`, `tech/gaussian-splatting`, `tech/tonemapping`, `tech/procedural`, `tech/gpgpu`.

---

### `hobby/` — Personal hobby / interest

Use for notes about personal hobbies and interests outside work. Replaces drink/leisure tags that were incorrectly placed in `area/`.

Examples: `hobby/wine`, `hobby/whisky`, `hobby/champagne`, `hobby/cocktail`, `hobby/tasting`, `hobby/travel`, `hobby/gaming`.

---

### `status/` — Workflow state (optional, actionable notes only)

Use only when the note is an active work item (experiment, decision, investigation). Omit for completed historical records.

| Tag | Meaning |
|-----|---------|
| `status/active` | In-progress |
| `status/blocked` | Waiting on something external |
| `status/done` | Resolved / concluded |

---

## Per-file-type tag sets

### devlog hub (`devlog.md`)

```yaml
tags:
  - type/devlog
  - project/shotloom
```

### devlog day (`days/day-NN.md`)

```yaml
tags:
  - type/devlog
  - project/shotloom
  - area/retarget        # only if day is scoped to one area
```

### learnings-index (`learnings-index.md`)

```yaml
tags:
  - type/learning
  - project/shotloom
```

### topic file (`{name}.md`)

```yaml
tags:
  - type/topic
  - project/shotloom
  - area/shader          # the concept's domain
  - lang/rust            # if code-heavy
```

### reference — AI prompt/workflow

```yaml
tags:
  - type/reference
  - area/ui              # subject domain
  - tool/gpt-image-2
  - tool/seedance-2-0    # all tools used, not just one
```

### reference — code snippet / library

```yaml
tags:
  - type/reference
  - area/animation
  - lang/rust
  - lang/bevy-0-15
```

---

## Migration from flat tags

Old flat tags map to the new axes as follows:

| Old tag | New tag |
|---------|---------|
| `devlog` | `type/devlog` |
| `learnings` | `type/learning` |
| `reference` | `type/reference` |
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

Full vault as of 2026-05-01. 154 unique tags, 2201 usages, 0 flat tags. Axes: type/ project/ area/ fmt/ lang/ lib/ sys/ tech/ llm/ hobby/ status/.
Update counts when adding or retiring a tag. Count=1 tags are candidates for consolidation.

### type/ (6 tags, 599 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `type/devlog` | 181 | |
| `type/reference` | 165 | |
| `type/topic` | 131 | |
| `type/learning` | 96 | |
| `type/review` | 19 | |
| `type/decision` | 7 | |

### project/ (28 tags, 600 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `project/cinev` | 133 | 시나몬 회사 프로젝트 |
| `project/bevy-vrm` | 127 | |
| `project/cross-project` | 106 | |
| `project/shotloom` | 62 | 시나몬 회사 프로젝트 |
| `project/job-search` | 33 | |
| `project/ue-live-scene-bridge` | 31 | |
| `project/mmd-anju` | 15 | |
| `project/studio-weekend` | 13 | |
| `project/tutoring` | 12 | |
| `project/codex-base` | 11 | |
| `project/caol-ila` | 9 | |
| `project/krafton-hackathon` | 8 | |
| `project/nestcc` | 5 | |
| `project/roblox` | 5 | |
| `project/consulting` | 4 | |
| `project/drinks` | 4 | |
| `project/tycoon` | 4 | |
| `project/hsa` | 3 | 외부 회사 클라이언트 |
| `project/oss` | 3 | |
| `project/just-wander` | 2 | |
| `project/megamelange` | 2 | |
| `project/second-raid` | 2 | |
| `project/chzzk` | 1 | consolidate if no new docs |
| `project/hyper3d` | 1 | consolidate if no new docs |
| `project/hyperframes` | 1 | consolidate if no new docs |
| `project/matcap-painter` | 1 | consolidate if no new docs |
| `project/minecraft` | 1 | consolidate if no new docs |
| `project/weekend-survivor` | 1 | consolidate if no new docs |

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

### fmt/ (7 tags, 89 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `fmt/vrm` | 52 | |
| `fmt/fbx` | 16 | |
| `fmt/pmx` | 9 | |
| `fmt/mtoon` | 5 | |
| `fmt/gltf` | 3 | |
| `fmt/vrm4u` | 3 | VRM4U → sys/vrm4u 정리 필요 |
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

### lib/ (5 tags, 21 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `lib/threejs` | 13 | |
| `lib/p5js` | 5 | |
| `lib/mermaid` | 1 | |
| `lib/react` | 1 | |
| `lib/wgpu` | 1 | |

### sys/ (5 tags, 29 usages)

| Tag | Count | Notes |
|-----|------:|-------|
| `sys/blender` | 17 | |
| `sys/blueprint` | 7 | |
| `sys/nanite` | 2 | |
| `sys/niagara` | 2 | |
| `sys/arp` | 1 | |

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
