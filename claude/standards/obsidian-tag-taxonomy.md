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
| `project/shotloom` | Shotloom (CINEV) |
| `project/bevy-vrm` | bevy-vrm renderer |
| `project/mmd-anju` | MMD Anju player |
| `project/codex-base` | Codex base workspace |
| `project/cinev` | CINEV studio (non-shotloom) |
| `project/caol-ila` | Claude config / skills repo |

Add new rows here as new projects appear. Do not invent a new tag mid-session without adding it to this table.

---

### `area/` — Domain / feature area

Optional. Use when the note is scoped to a sub-domain that you'll want to filter across projects or across time.

| Tag | Domain |
|-----|--------|
| `area/retarget` | Motion retargeting |
| `area/shader` | Shader / material |
| `area/vrm` | VRM format / spec |
| `area/animation` | Animation system |
| `area/joint-limit` | Joint constraint / limit |
| `area/profiling` | Performance profiling |
| `area/nanite` | UE Nanite |
| `area/ecs` | Entity-component-system |
| `area/ui` | UI / frontend |
| `area/ci` | CI / build pipeline |
| `area/auth` | Authentication |

---

### `lang/` — Tech stack (for reference and topic notes)

Optional. Use when the note is language- or library-specific and you want to find all notes for that stack later.

| Tag | Stack |
|-----|-------|
| `lang/rust` | Rust |
| `lang/typescript` | TypeScript / JavaScript |
| `lang/python` | Python |
| `lang/wgsl` | WGSL shader |
| `lang/glsl` | GLSL shader |
| `lang/bevy` | Bevy engine (additive with `lang/rust`) |
| `lang/react` | React (additive with `lang/typescript`) |

Version suffix only when the version is the point of the note: `lang/bevy-0-15`.

---

### `tool/` — AI tools / models (for reference notes only)

Required on `type/reference` notes that document a prompt, workflow, or output from an AI tool. Use alongside `type/reference`.

Format: `tool/{name}-{major-version}` in kebab-case.

Examples: `tool/gpt-image-2`, `tool/midjourney-v7`, `tool/seedance-2-0`, `tool/flux-dev`, `tool/gemini-image-3`, `tool/runway-gen-4`.

Before tagging, search the vault for existing `tool/` tags to avoid `tool/gpt-4o-image` vs `tool/gpt-image-4o` drift.

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
