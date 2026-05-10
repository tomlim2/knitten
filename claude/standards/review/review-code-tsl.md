---
status: proposed
domains: web
repo-keys: caol-ila,mmd-anju,ta-portfolio
languages: javascript,typescript
frameworks: three
task-types: review
context-profile: web-review
exclude-when: unreal,obsidian
---
# Three.js TSL Code Review Checklist

---

## Purpose

**Review checklist** for Three.js TSL (Three.js Shading Language) code reviews. This is a companion to:

- `three-shader-language.md` — Coding standards (for **generating** TSL code)
- `review-template.md` — Output format (for **structuring** review feedback)

This document defines **what to check**. Use `review-template.md` for how to format findings.

---

## How to Use

### Markers

| Marker | Meaning |
|--------|---------|
| 🔧 | **Automatable** — ESLint/static analysis can catch this. Only check manually if tooling is missing. |
| 👁 | **Human review required** — Tools cannot reliably detect this. Always check manually. |

### Severity

| Icon | Level | Meaning |
|------|-------|---------|
| 🔒 | Critical | Runtime crash or silent rendering failure. Must fix before merge. |
| ⚠️ | Error | Performance issue or incorrect visual output. Must fix before merge. |
| 💡 | Suggestion | Maintainability or readability improvement. Recommended but not blocking. |

### Conditional Sections

Sections marked **(if applicable)** only apply when the codebase uses that feature. Skip if not relevant.

---

## Setup & Initialization

> Silent failures are TSL's biggest trap. These checks prevent "black screen, no errors" situations.

- 🔒 🔧 **Import path** — Three.js imported from `three/webgpu`, TSL functions from `three/tsl`. Never from bare `three`
  - *INIT-01 · three-shader-language.md: Setup & Imports*

- 🔒 👁 **Renderer initialization** — `await renderer.init()` called before any `renderer.render()` or `renderer.compute()`. Missing init produces black screen with no error
  - *INIT-02 · Three.js TSL Wiki: Common Gotchas*

- 🔒 🔧 **Node material type** — Using `MeshStandardNodeMaterial` / `MeshPhysicalNodeMaterial` / `MeshBasicNodeMaterial`, not legacy `MeshStandardMaterial`
  - *INIT-03 · three-shader-language.md: Node Materials*

---

## Material Slots

> Slot selection determines whether lighting is preserved or discarded.

- 🔒 👁 **fragmentNode vs colorNode** — `fragmentNode` used only when full fragment override is intentional. Accidental use discards all lighting, shadows, and PBR calculations
  - *SLOT-01 · three-shader-language.md: Material Slot Selection*

- ⚠️ 👁 **vertexNode vs positionNode** — `positionNode` preserves the projection pipeline. `vertexNode` replaces the entire vertex output. Verify override is intentional
  - *SLOT-02 · three-shader-language.md: Material Slot Selection*

- ⚠️ 👁 **Slot type match** — Node output type matches slot expectation (e.g., `colorNode` expects vec4, `roughnessNode` expects float, `normalNode` expects vec3)
  - *SLOT-03 · Three.js TSL Wiki: Material Slots*

---

## Fn() & Node Construction

> Most "nothing renders" bugs trace back to Fn() misuse.

- 🔒 🔧 **Fn() invocation** — Every `Fn(() => {...})` assigned to a material slot or used as a node has trailing `()` to invoke it. Without `()`, it's a function definition, not a node
  - *FN-01 · three-shader-language.md: Fn() Functions*

- ⚠️ 👁 **Fn() parameter destructuring** — Parameters passed as array destructuring `([paramA, paramB])`, not plain arguments `(paramA, paramB)`
  - *FN-02 · three-shader-language.md: Parameters*

- ⚠️ 👁 **Return value** — `Fn()` body returns a node value. Missing return produces undefined behavior in the shader graph
  - *FN-03*

---

## Immutability & Assignment

> TSL nodes are immutable by default. Direct JS assignment on node properties is a silent no-op.

- 🔒 👁 **No JS assignment on nodes** — No `pos.y = value` patterns. Node properties require `.toVar()` then `.assign()` or `.addAssign()`.
  - *MUT-01 · three-shader-language.md: Assignment*

- ⚠️ 👁 **toVar() before mutation** — Any node that needs `.assign()`, `.addAssign()`, `.subAssign()` is first wrapped with `.toVar()`
  - *MUT-02 · three-shader-language.md: Assignment*

- ⚠️ 🔧 **No JS arithmetic on nodes** — No `a + b`, `a * b`, `Math.sin(x)` on TSL nodes. Must use `.add()`, `.mul()`, TSL `sin()`.
  - *MUT-03 · three-shader-language.md: Method Chaining*

---

## Control Flow

> JavaScript control flow runs once at graph build time, not per-pixel/vertex.

- 🔒 👁 **TSL If, not JS if** — Shader-time branching uses `If()` (capital I), `select()`, or conditional node operations. JavaScript `if` evaluates once at setup and creates a static graph
  - *FLOW-01 · three-shader-language.md: Control Flow*

- ⚠️ 👁 **TSL Loop, not JS loop** — Per-pixel/vertex iteration uses `Loop()`. JavaScript `for`/`while` runs at graph build time only
  - *FLOW-02 · three-shader-language.md: Control Flow*

- ⚠️ 👁 **TSL comparison methods** — Conditionals use `.equal()`, `.greaterThan()`, `.lessThan()`. JavaScript `===`, `>`, `<` return JS booleans, not shader nodes
  - *FLOW-03 · three-shader-language.md: Comparison Operators*

---

## Uniforms

> Uniforms bridge CPU and GPU. Misuse wastes GPU registers or causes unnecessary recompilation.

- ⚠️ 👁 **Uniform vs constant** — `uniform()` used only for values that change at runtime. Static values use type constructors (`float()`, `vec3()`, `color()`) which bake into the shader
  - *UNI-01 · three-shader-language.md: Uniform vs Constant*

- ⚠️ 👁 **Uniform update pattern** — Runtime updates use `.value` assignment (`myUniform.value = newVal`), not creating new uniform instances
  - *UNI-02 · three-shader-language.md: Uniforms*

- ⚠️ 👁 **No needsUpdate for uniform changes** — `material.needsUpdate` is NOT set when only uniform values change. Only set when swapping node graphs
  - *UNI-03 · three-shader-language.md: Material Updates*

---

## Performance

> Shader performance is measured in milliseconds per frame. Problems are immediately visible as frame drops.

- ⚠️ 👁 **Duplicate node computation** — Identical expressions (e.g., same `sin(time.mul(3.0))`) used multiple times are extracted to a `.toVar()` variable to avoid GPU recomputation
  - *PERF-01 · three-shader-language.md: Minimize Node Graph Complexity*

- ⚠️ 👁 **No per-frame needsUpdate** — `material.needsUpdate = true` is not called inside the animation loop. Each call triggers a full shader recompile
  - *PERF-02 · three-shader-language.md: Material Updates*

- ⚠️ 👁 **Appropriate material type** — `MeshBasicNodeMaterial` used when lighting is not needed. Not using `MeshStandardNodeMaterial` with `fragmentNode` that overrides lighting anyway
  - *PERF-03 · three-shader-language.md: Performance*

- 💡 👁 **Instanced rendering** — Large numbers of similar objects use `InstancedMesh` + compute shaders instead of individual mesh objects
  - *PERF-04 · three-shader-language.md: Overdraw & Draw Calls*

- 💡 👁 **Transparent material minimization** — Transparent materials used sparingly. Each transparent object breaks depth sorting and increases overdraw
  - *PERF-05 · three-shader-language.md: Overdraw & Draw Calls*

---

## Post-Processing (if applicable)

- ⚠️ 👁 **Pass setup order** — `pass(scene, camera)` called before effect application. Effects chained correctly (each effect receives previous pass output)
  - *POST-01 · three-shader-language.md: Post-Processing*

- 💡 👁 **Effect performance impact** — Heavy effects (bloom, SSR, motion blur) tested for frame budget impact. Multiple effects compound GPU cost
  - *POST-02*

---

## Compute Shaders (if applicable, WebGPU only)

- 🔒 👁 **WebGPU availability** — Compute shaders only work with WebGPU backend. Fallback or feature detection exists for WebGL2 environments
  - *COMP-01 · three-shader-language.md: Compute Shaders*

- ⚠️ 👁 **Buffer sizing** — `instancedArray()` count matches the `.compute()` dispatch count. Mismatched sizes cause out-of-bounds access
  - *COMP-02*

- ⚠️ 👁 **Compute call placement** — `renderer.compute()` called at appropriate frequency (every frame vs on-demand). Unnecessary compute dispatches waste GPU time
  - *COMP-03*

---

## Maintainability

- 💡 👁 **Coordinate space documentation** — Comments clarify which coordinate space is being used when mixing `positionLocal`, `positionWorld`, `positionView` in the same shader
  - *MAINT-01 · three-shader-language.md: Position Nodes*

- 💡 👁 **Magic numbers** — Bare numeric literals in shader expressions extracted to named constants or uniforms with descriptive names
  - *MAINT-02*

- 💡 👁 **Shader function reuse** — Repeated shader logic extracted into named `Fn()` functions instead of duplicating node graph construction
  - *MAINT-03*

- 💡 👁 **Import organization** — TSL imports grouped by purpose: type constructors, functions/nodes, math, post-processing
  - *MAINT-04 · three-shader-language.md: Import Organization*

---

## Sources

### Key References

1. [Three.js TSL Wiki](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
2. [Three.js Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)
3. [sbcode.net TSL (28 lessons)](https://sbcode.net/tsl/)
4. [Maxime Heckel's Field Guide to TSL](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
5. [GoodTSL.com](https://www.goodtsl.com/)
6. [Getting AI to Write TSL](https://threejsroadmap.com/blog/getting-ai-to-write-tsl-that-works)

### Full Research

`~/.claude/private/research/threejs-tsl.md`
