---
description: "Audit Three.js/WebGPU/WebGL code for 3D rendering performance issues. Use when reviewing draw call overhead, shader efficiency, texture memory, GPU pipeline stalls, and frame budget in Chromium-based web 3D projects."
---

# review-audit-3d

Static 3D rendering performance audit against a 55+ item checklist.

## Purpose

Detect rendering performance issues by reading JavaScript, WGSL, GLSL, and HTML source files without running the application. Covers draw calls, GPU pipeline, textures, shaders, geometry, frame budget, canvas upload, post-processing, animation, and profiling diagnostics.

---

## Usage

```
/review-audit-3d [file, glob, or directory]
```

**Examples:**
- `/review-audit-3d` — Audit all uncommitted changes
- `/review-audit-3d src/` — Audit all files in a directory
- `/review-audit-3d web/matcap-painter/` — Audit a web 3D app directory
- `/review-audit-3d js/preview.js` — Audit a specific file

---

## Standards Applied

| Category | Items | Checklist Section |
|----------|-------|-------------------|
| Draw Calls & Batching | 7 | `review-3d-rendering.md` §1 |
| GPU Pipeline & State | 6 | `review-3d-rendering.md` §2 |
| Texture & Memory | 7 | `review-3d-rendering.md` §3 |
| Shader & Fill Rate | 7 | `review-3d-rendering.md` §4 |
| Geometry & Culling | 5 | `review-3d-rendering.md` §5 |
| Frame Budget & Render Loop | 6 | `review-3d-rendering.md` §6 |
| Canvas Texture & Upload | 4 | `review-3d-rendering.md` §7 |
| Post-Processing | 5 | `review-3d-rendering.md` §8 |
| Animation | 4 | `review-3d-rendering.md` §9 |
| Profiling & Diagnostics | 4 | `review-3d-rendering.md` §10 |

Output follows `review-template.md` format.

---

## Instructions
### Step 1: Determine Review Scope

Parse the argument:
- If it's a file path → audit that specific file
- If it's a directory → audit all `.html`, `.js`, `.jsx`, `.ts`, `.tsx`, `.wgsl`, `.glsl`, `.frag`, `.vert` files in it
- If it's a glob pattern → audit matching files
- If no argument → audit all uncommitted changes, or latest commit if clean

### Step 2: Read the Checklist

Read `~/.claude/standards/review-3d-rendering.md` for the full checklist.

### Step 3: Identify 3D Stack

Before auditing, identify the project's rendering stack:
- **Renderer:** `WebGPURenderer`, `WebGLRenderer`, or raw WebGPU/WebGL
- **Material system:** TSL node materials, ShaderMaterial, or standard materials
- **Dependencies:** Three.js version, post-processing library, physics engine

This determines which conditional sections (§7–§9) apply.

### Step 4: Read Source Files

Read all files in scope. For each file, note:
- Renderer setup and configuration
- Material creation and update patterns
- Geometry creation, instancing, and disposal
- Render loop structure and per-frame operations
- Texture loading, creation, and update patterns
- Animation mixer usage and morph target handling
- Post-processing chain structure

### Step 5: Audit

Apply all 10 checklist sections. Skip sections marked **(if applicable)** if the codebase doesn't use that pattern (e.g., skip Animation if there are no AnimationMixers, skip Canvas Texture if no CanvasTexture).

For each finding, record:
- Severity (Critical / Error / Suggestion)
- File and line number
- Checklist item reference (e.g., DRAW-01, SHADE-03)
- What the code currently does
- What it should do
- Estimated impact (when measurable)

### Step 6: Output

Follow the output format defined in `~/.claude/standards/review-template.md`.

- Use **Standards Applied**: `review-3d-rendering.md` (3D Rendering Performance)
- **Standards Compliance** section shows pass/fail per category (§1–§10)
- Group findings by severity, then by category

---

## Related

- `standards/review-3d-rendering.md` — 3D rendering performance checklist (55+ items)
- `standards/three-shader-language.md` — TSL coding standards
- `standards/review-template.md` — Review output format
- `skills/review-audit-web/SKILL.md` — Code quality review (JS + CSS)
- `skills/review-audit-ux/SKILL.md` — UX/UI review
