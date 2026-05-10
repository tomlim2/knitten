---
status: accepted
---
# 3D Rendering Performance Review Checklist

Static code audit checklist for detecting 3D rendering performance issues in Chromium-based browsers (WebGPU / WebGL / Three.js).

---

## Purpose

**Review checklist** for 3D rendering performance audits. This is a companion to:

- `review-code-javascript.md` — JS coding standards checklist
- `review-ux.md` — UX/UI code audit checklist
- `three-shader-language.md` — TSL coding standards
- `review-template.md` — Output format (for **structuring** review feedback)

This document defines **what to check** from a 3D rendering performance perspective. Use `review-template.md` for how to format findings.

---

## How to Use

### Markers

| Marker | Meaning |
|--------|---------|
| 🔧 | **Automatable** — Linters, grep, or static analysis can catch this. |
| 👁 | **Human review required** — Requires understanding of rendering intent or runtime profiling. |

### Severity

| Icon | Level | Meaning |
|------|-------|---------|
| 🔒 | Critical | Causes visible stalls, crashes, or order-of-magnitude waste. Must fix. |
| ⚠️ | Error | Significant performance degradation. Should fix before ship. |
| 💡 | Suggestion | Improvement opportunity. Recommended but not blocking. |

### Conditional Sections

Sections marked **(if applicable)** only apply when the codebase uses that pattern. Skip if not relevant.

---

## 1. Draw Calls & Batching

> Minimize CPU-to-GPU draw call overhead — the most common bottleneck in web 3D.

- 🔒 👁 **Use InstancedMesh for repeated geometry** — Identical meshes (trees, particles, furniture) rendered as separate `Mesh` objects should use `InstancedMesh`. Individual meshes cap at ~7,000 at 60fps; instancing handles 100,000+
  - *DRAW-01*

- 🔒 👁 **Use BatchedMesh for mixed geometry, same material** — Objects sharing a material but with different geometries should use `BatchedMesh` (Three.js r155+) to collapse N draw calls into 1
  - *DRAW-02*

- ⚠️ 👁 **Merge static geometry** — Fully static scene elements (terrain, buildings) that never move should be merged via `mergeGeometries()` into a single `BufferGeometry` to eliminate per-object draw overhead
  - *DRAW-03*

- ⚠️ 👁 **Minimize material count** — Each unique material forces a separate draw call. Use texture atlases or array textures to share one material across visually distinct objects
  - *DRAW-04*

- ⚠️ 🔧 **No per-frame object creation** — `new Mesh()`, `new BufferGeometry()`, or `new Material()` should never appear inside the render loop. Pre-allocate and reuse via object pooling
  - *DRAW-05*

- 💡 👁 **Consolidate indirect draw buffers (WebGPU)** — All indirect draw arguments packed into a single `GPUBuffer` rather than one buffer per draw. Consolidation reduces Chrome/D3D12 validation overhead by ~300x
  - *DRAW-06*

- 💡 👁 **Use render bundles for static scenes (WebGPU)** — Pre-record render commands for objects that don't change frame-to-frame. Eliminates JavaScript-side API call overhead (~40% JS time reduction)
  - *DRAW-07*

---

## 2. GPU Pipeline & State

> Avoid shader compilation stalls and redundant state changes.

- 🔒 👁 **No synchronous pipeline creation during rendering** — `createRenderPipeline()` blocks the GPU queue during compilation. Use `createRenderPipelineAsync()` and warm up all pipelines during loading, before the first frame
  - *PIPE-01*

- 🔒 🔧 **material.needsUpdate only when swapping node graphs** — Setting `material.needsUpdate = true` per frame triggers full shader recompilation. Only set it when the material's node structure actually changes, not when uniform values change
  - *PIPE-02*

- ⚠️ 👁 **Use explicit pipeline layouts (WebGPU)** — Never use `layout: 'auto'` for pipelines that share bind groups. Auto-layouts produce non-reusable bind group layouts, preventing sharing across pipelines and causing silent recompilation
  - *PIPE-03*

- ⚠️ 👁 **Organize bind groups by update frequency** — `@group(0)` for per-frame data (camera), `@group(1)` for per-material data, `@group(2)` for per-object data. Minimizes `setBindGroup()` calls per frame
  - *PIPE-04*

- ⚠️ 👁 **Use unified uniform buffer with offsets** — Replace individual per-object uniform buffers with a single large buffer using aligned offsets. Enables a single `writeBuffer` call per frame instead of thousands (~2x throughput for large scenes)
  - *PIPE-05*

- 💡 👁 **Declare minBindingSize in buffer layouts (WebGPU)** — Moves buffer size validation from per-draw to `createBindGroup` time, reducing repeated checks across thousands of draw calls
  - *PIPE-06*

---

## 3. Texture & Memory

> GPU memory is finite and uploads are expensive. Compress, reuse, and dispose.

- 🔒 🔧 **Dispose textures, geometries, and materials when done** — Three.js does not garbage-collect GPU resources. Call `.dispose()` on removed objects. For GLTF `ImageBitmap` textures, also call `texture.source.data.close()`
  - *TEX-01*

- 🔒 🔧 **No unbounded texture/geometry growth** — Monitor `renderer.info.memory.textures` and `renderer.info.memory.geometries` over time. Growing counts indicate a memory leak
  - *TEX-02*

- ⚠️ 👁 **Use GPU-compressed texture formats (KTX2 / Basis Universal)** — Uncompressed PNG textures expand to full VRAM size (a 200KB PNG = 20MB+ VRAM). KTX2 with Basis Universal transcodes to BC7/ASTC/ETC2 at runtime — ~10x VRAM reduction
  - *TEX-03*

- ⚠️ 👁 **Power-of-two texture dimensions** — Non-POT textures cannot be mipmapped in WebGL and waste memory. Use 256, 512, 1024, or 2048
  - *TEX-04*

- ⚠️ 👁 **Appropriate texture resolution** — A 4096x4096 texture uses 64MB+ VRAM uncompressed. Use the smallest practical size. Reuse textures across materials
  - *TEX-05*

- 💡 👁 **Use interleaved vertex buffers** — Combine position, normal, and UV into a single interleaved buffer to reduce `setVertexBuffer` calls from 3 to 1 per model
  - *TEX-06*

- 💡 👁 **Dispose render targets** — `WebGLRenderTarget` / `WebGPURenderTarget` instances leak framebuffers if not disposed. Ensure `renderTarget.dispose()` on cleanup
  - *TEX-07*

---

## 4. Shader & Fill Rate

> Fragment shader runs per pixel per layer. Overdraw and complexity multiply cost.

- 🔒 👁 **Avoid `discard` in high-coverage shaders** — `discard` disables early-Z testing on most hardware. All fragments run the full shader even if hidden. Use `material.alphaTest` instead to keep the opaque render path
  - *SHADE-01*

- ⚠️ 👁 **Minimize transparent objects** — Transparent objects require back-to-front sorting, disable early-Z, and can't be batched. Use `alphaTest` with `transparent: false` for cutout geometry (foliage, fences)
  - *SHADE-02*

- ⚠️ 👁 **Reuse computed values with .toVar()** — In TSL node materials, intermediate computations referenced multiple times should use `.toVar()` to avoid duplicate shader calculations. The compiler does CSE but explicit `toVar()` helps in loops and conditionals
  - *SHADE-03*

- ⚠️ 👁 **Use uniformArray for batched values** — Batch many scalar uniforms into `uniformArray(Float32Array, length)` to reduce per-uniform binding overhead. Access via `.element(index)`
  - *SHADE-04*

- 💡 👁 **Move computation to vertex shader when possible** — Calculations that vary per-vertex (not per-pixel) should run in the vertex stage and pass results via `varying()`. Fragment shader runs orders of magnitude more often than vertex shader
  - *SHADE-05*

- 💡 👁 **Depth prepass for complex shaders** — When fragment shaders are expensive (PBR, many lights), render depth-only first, then shade with `depthFunc: EqualDepth` for zero overdraw on opaque geometry
  - *SHADE-06*

- 💡 👁 **Use MeshBasicNodeMaterial when lighting not needed** — Matcap, unlit, and preview materials don't need PBR lighting. Use basic node material to avoid unnecessary shader complexity
  - *SHADE-07*

---

## 5. Geometry & Culling

> Don't render what the camera can't see. Reduce polygon count for distant objects.

- 🔒 👁 **Frustum culling enabled** — Verify `mesh.frustumCulled` is not set to `false` unless there is a custom culling solution. Frustum culling is built-in and eliminates ~50% of off-screen objects
  - *GEOM-01*

- ⚠️ 👁 **Bounding volumes are accurate** — After modifying geometry, call `geometry.computeBoundingBox()` and `geometry.computeBoundingSphere()`. Stale bounds cause incorrect frustum culling
  - *GEOM-02*

- ⚠️ 👁 **LOD for distant objects** — Large scenes with detailed meshes should use `THREE.LOD` with 2–4 levels. Each level targets ~50% polygon reduction. Impact: 30–60% frame rate improvement in large scenes
  - *GEOM-03*

- 💡 👁 **Spatial partitioning for large object counts** — Scenes with 1000+ objects should use BVH or octree for culling instead of linear frustum checks on all objects. Library: `three-mesh-bvh`
  - *GEOM-04*

- 💡 👁 **Use Draco compression for geometry transfer** — Draco reduces geometry file size by 90–95%. Note: decompression happens on CPU before GPU upload, so it saves network time, not runtime VRAM
  - *GEOM-05*

---

## 6. Frame Budget & Render Loop

> 60fps = 16.67ms per frame. Every millisecond counts.

- 🔒 👁 **Render on demand for interactive/static scenes** — Scenes without continuous animation should not run a continuous `requestAnimationFrame` loop. Trigger renders only on user interaction or state changes
  - *FRAME-01*

- 🔒 🔧 **No heavy computation in the render loop** — CPU-intensive operations (per-pixel image processing, sorting large arrays, JSON parsing) should never run inside `requestAnimationFrame`. Offload to workers or pre-compute
  - *FRAME-02*

- ⚠️ 🔧 **Disable matrixAutoUpdate for static objects** — `mesh.matrixAutoUpdate = false` skips per-frame matrix recalculation. Call `mesh.updateMatrix()` once after positioning. Significant CPU savings with hundreds of static objects
  - *FRAME-03*

- ⚠️ 👁 **Delta-time based animation** — Use `clock.getDelta()` for animation values. Cap delta: `Math.min(delta, 0.05)` prevents single stalled frames from causing animation jumps
  - *FRAME-04*

- 💡 👁 **Pause render loop when tab is hidden** — Use `document.visibilitychange` to pause `requestAnimationFrame` when the tab is background. Prevents mixer drift and saves battery
  - *FRAME-05*

- 💡 👁 **GPU-bound vs CPU-bound diagnosis** — Set `scene.overrideMaterial = new MeshBasicMaterial()`. If FPS jumps significantly → GPU-bound (complex shaders, overdraw). If FPS barely changes → CPU-bound (draw call count, JS logic)
  - *FRAME-06*

---

## 7. Canvas Texture & Upload (if applicable)

> CanvasTexture uploads the entire canvas to GPU every frame it's marked dirty.

- 🔒 🔧 **Gate needsUpdate with dirty flag** — Only set `texture.needsUpdate = true` when canvas content actually changed. A 1024x1024 RGBA canvas uploads 4MB per `needsUpdate`
  - *UPLOAD-01*

- ⚠️ 👁 **Minimize canvas resolution** — Keep the canvas at the minimum resolution the content requires. A 256x256 canvas uploads 16x less data than 1024x1024
  - *UPLOAD-02*

- ⚠️ 👁 **Use OffscreenCanvas in Worker for heavy painting** — Move canvas rendering to a `Worker` using `OffscreenCanvas` + `transferToImageBitmap()` to keep the main thread unblocked
  - *UPLOAD-03*

- 💡 👁 **Use ImageBitmap for texture loading** — `createImageBitmap()` decodes off the main thread and produces GPU-friendly bitmaps. Faster than `Image` + `CanvasTexture` path
  - *UPLOAD-04*

---

## 8. Post-Processing (if applicable)

> Each post-processing pass is a full-screen draw. Keep the chain short and cheap.

- ⚠️ 👁 **Half-resolution for expensive effects** — Bloom, SSAO, DoF, and motion blur should run at half or quarter resolution, then upscale. Reduces fragment count by 4–16x
  - *POST-01*

- ⚠️ 👁 **Merge compatible effects into one pass** — Use `pmndrs/postprocessing` EffectComposer which merges compatible effects into a single shader. Avoid chaining separate `ShaderPass` instances for each effect
  - *POST-02*

- ⚠️ 👁 **Reuse render targets** — Maintain a pool of render targets instead of creating new `WebGLRenderTarget` per effect. The ping-pong pattern (alternate between two targets) covers most use cases
  - *POST-03*

- 💡 👁 **Choose appropriate AA technique** — Cost hierarchy: No AA < FXAA < SMAA < MSAA 4x < TAA. SMAA is the pragmatic default for post-processing pipelines. Only use TAA if velocity buffer is already available (motion blur)
  - *POST-04*

- 💡 👁 **Disable renderer AA when post-processing handles it** — Set `antialias: false` on the renderer when AA is applied in post. Also disable `stencil` and `depth` on the renderer if managed by render targets
  - *POST-05*

---

## 9. Animation (if applicable)

> AnimationMixer and morph targets are CPU-side costs that scale per character.

- ⚠️ 👁 **Frustum-cull mixer updates** — Only call `mixer.update(delta)` for characters inside the camera frustum. Off-screen character mixers waste CPU on invisible animation
  - *ANIM-01*

- ⚠️ 👁 **Zero inactive morph target influences** — Set `mesh.morphTargetInfluences[i] = 0` for unused blend shapes. Non-zero influences (even tiny values) still incur GPU sampling cost
  - *ANIM-02*

- 💡 👁 **GPU skinning for crowds** — For 10+ animated characters, bake bone matrices into a `DataTexture` and sample per-instance in the vertex shader. Zero CPU cost per character per frame after bake
  - *ANIM-03*

- 💡 👁 **Shader-based animation for mass objects** — Thousands of elements (particles, vegetation, water) should animate in the vertex shader with `uTime` uniform. One draw call animates millions of vertices
  - *ANIM-04*

---

## 10. Profiling & Diagnostics

> Measure before optimizing. Use the right tools for GPU vs CPU bottlenecks.

- ⚠️ 👁 **Verify hardware acceleration is active** — Check `chrome://gpu` for "WebGPU: Hardware accelerated". Software fallback destroys performance silently
  - *DIAG-01*

- ⚠️ 👁 **Use Perfetto with gpu.dawn for WebGPU profiling** — Chrome DevTools Performance panel only shows CPU-side timings. Use Perfetto with the `gpu.dawn` trace category to see actual GPU pass timings and command encoder internals
  - *DIAG-02*

- 💡 👁 **Use timestamp queries for per-pass measurement** — Enable `timestamp-query` feature on device to measure specific render/compute passes with nanosecond precision. Enable `chrome://flags/#enable-webgpu-developer-features` for full resolution during development
  - *DIAG-03*

- 💡 🔧 **Log renderer.info each frame during development** — `renderer.info.render.calls`, `renderer.info.render.triangles`, `renderer.info.memory` expose draw call count, triangle count, and GPU resource counts. Rising numbers per frame indicate leaks
  - *DIAG-04*

---

## Sources

### Key References

1. [WebGPU Best Practices — Toji.dev](https://toji.dev/webgpu-best-practices/)
2. [WebGPU Optimization — webgpufundamentals.org](https://webgpufundamentals.org/webgpu/lessons/webgpu-optimization.html)
3. [Three.js Tips & Tricks — discoverthreejs.com](https://discoverthreejs.com/tips-and-tricks/)
4. [100 Three.js Tips — utsubo.com](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
5. [Field Guide to TSL and WebGPU — Maxime Heckel](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
6. [Choosing Texture Formats for WebGPU — Don McCurdy](https://www.donmccurdy.com/2024/02/11/web-texture-formats)
7. [WebGPU Profiling: Chrome DevTools — Toji.dev](https://toji.dev/webgpu-profiling/chrome-devtools.html)
8. [Rendering 100k Spheres — Daniel Velasquez](https://velasquezdaniel.com/blog/rendering-100k-spheres-instantianing-and-draw-calls/)
9. [Depth Pre-Pass Optimization — cprimozic.net](https://cprimozic.net/blog/threejs-depth-pre-pass-optimization/)
10. [Chrome WebGPU Developer Features](https://developer.chrome.com/docs/web-platform/webgpu/developer-features)
