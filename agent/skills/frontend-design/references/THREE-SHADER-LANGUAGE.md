---
status: accepted
domains: web
repo-keys: agent-hub,mmd-anju,ta-portfolio
languages: javascript,typescript
frameworks: three
task-types: implementation
context-profile: web-frontend
exclude-when: unreal,obsidian
---
# Three.js Shading Language (TSL) Coding Standards

**Based on:** Three.js TSL Wiki + sbcode.net TSL Lessons + Maxime Heckel's Field Guide + Three.js Source

---

## Philosophy

### Core Principles

1. **Nodes, Not Strings** - TSL is a shader graph in JavaScript. Think in data flow, not GLSL text
2. **Immutability by Default** - Nodes are immutable. Use `.toVar()` only when mutation is required
3. **Slots Over Fragments** - Use material slots (`colorNode`, `positionNode`) to preserve lighting. Reserve `fragmentNode` for full override
4. **Performance Is Visual** - A dropped frame is visible. Profile GPU, minimize overdraw, reuse nodes
5. **Renderer Agnostic** - TSL compiles to GLSL (WebGL2) or WGSL (WebGPU). Never assume one backend

**Inspired by:**
- [Three.js TSL Wiki](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- [sbcode.net TSL (28 lessons)](https://sbcode.net/tsl/)
- [Maxime Heckel's Field Guide to TSL](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)

---

## Setup & Imports

### Renderer Initialization

Always use `WebGPURenderer` with explicit `await init()`.

```javascript
// ✅ Good
import * as THREE from 'three/webgpu';

const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init();

// ❌ Bad — renders nothing, no error
const renderer = new THREE.WebGPURenderer();
// forgot await renderer.init()
renderer.render(scene, camera);
```

### Import Paths

TSL functions come from `three/tsl`, not `three`.

```javascript
// ✅ Good
import * as THREE from 'three/webgpu';
import { uniform, color, vec3, uv, time, Fn } from 'three/tsl';

// ❌ Bad — wrong import path
import * as THREE from 'three';
import { uniform } from 'three';
```

### Import Organization

Group imports by purpose.

```javascript
// ✅ Good
// 1. Renderer & scene objects
import * as THREE from 'three/webgpu';

// 2. TSL type constructors
import { float, vec2, vec3, vec4, color } from 'three/tsl';

// 3. TSL functions & nodes
import { Fn, uniform, time, uv, positionLocal, normalLocal } from 'three/tsl';

// 4. TSL math & utilities
import { sin, cos, mix, smoothstep, clamp } from 'three/tsl';

// 5. Post-processing (if used)
import { pass, bloom, fxaa } from 'three/tsl';
```

---

## Node Materials

### Use Node Material Variants

Always use Node material variants for TSL compatibility.

```javascript
// ✅ Good
const material = new THREE.MeshStandardNodeMaterial();
const material = new THREE.MeshPhysicalNodeMaterial();
const material = new THREE.MeshBasicNodeMaterial();

// ❌ Bad — no node slots available
const material = new THREE.MeshStandardMaterial();
```

### Material Slot Selection

Choose the correct slot based on intent.

| Slot | Use When | Lighting |
|------|----------|----------|
| `colorNode` | Modifying base color | Preserved |
| `emissiveNode` | Self-illumination effects | N/A (additive) |
| `positionNode` | Vertex displacement | Preserved |
| `normalNode` | Custom normal mapping | Preserved |
| `roughnessNode` | Dynamic roughness | Preserved |
| `metalnessNode` | Dynamic metalness | Preserved |
| `opacityNode` | Transparency effects | Preserved |
| `fragmentNode` | Full fragment override | **Discarded** |
| `vertexNode` | Full vertex override | **Discarded** |

```javascript
// ✅ Good — lighting preserved
material.colorNode = vec4(uv(), 0.5, 1.0);

// ⚠️ Intentional — only when you want unlit output
material.fragmentNode = vec4(uv(), 0.5, 1.0);

// ❌ Bad — accidentally using fragmentNode, losing all lighting
material.fragmentNode = myColorEffect;  // should be colorNode
```

---

## Type Constructors

### Use Explicit Types

Always use TSL type constructors for shader values.

```javascript
// ✅ Good
const intensity = float(1.0);
const offset = vec2(0.5, 0.5);
const direction = vec3(0, 1, 0);
const finalColor = vec4(1, 0, 0, 1);
const tint = color(0xff0000);

// ❌ Bad — raw JS numbers in shader expressions
material.colorNode = vec4(0.5, 0.5, 0.5, 1);  // works but inconsistent
```

### Type Conversion

Use explicit conversion methods.

```javascript
// ✅ Good
const expanded = myFloat.toVec3();
const truncated = myVec3.toFloat();
const asInt = myFloat.toInt();

// ❌ Bad — implicit conversion assumptions
const result = myFloat + anotherFloat;  // JS addition, not TSL
```

---

## Operators & Expressions

### Method Chaining

Use TSL methods for arithmetic. JavaScript operators do not work on nodes.

```javascript
// ✅ Good — TSL operators
const result = a.add(b).mul(c);
const wave = positionLocal.y.mul(3.0).add(time).sin();
const clamped = value.clamp(0.0, 1.0);

// ❌ Bad — JavaScript operators (produces NaN or wrong results)
const result = a + b * c;
const wave = Math.sin(positionLocal.y * 3.0 + time);
```

### Assignment

Use `.assign()` for mutable variables. Never use `=` on node properties.

```javascript
// ✅ Good
const pos = positionLocal.toVar();
pos.y.addAssign(sin(time));

// ❌ Bad — JavaScript assignment on node
pos.y = pos.y.add(sin(time));  // does nothing, silently fails
```

---

## Fn() Functions

### Always Invoke Fn()

`Fn()` creates a function. It must be called `()` to produce a node.

```javascript
// ✅ Good — Fn() invoked with ()
const myShader = Fn(([param]) => {
    return param.mul(2.0).add(time);
})();

material.colorNode = myShader;

// ❌ Bad — missing () invocation
const myShader = Fn(([param]) => {
    return param.mul(2.0).add(time);
});
// myShader is a function, not a node — nothing renders
material.colorNode = myShader;
```

### Parameters

Pass parameters as array destructuring.

```javascript
// ✅ Good
const blend = Fn(([colorA, colorB, factor]) => {
    return mix(colorA, colorB, factor);
});

// Use with arguments
material.colorNode = blend(color1, color2, mixFactor);

// ✅ Also good — no parameters, immediate invocation
material.colorNode = Fn(() => {
    return vec4(uv(), 0.5, 1.0);
})();
```

---

## Uniforms

### Declaration & Update

Use `uniform()` for values that change at runtime.

```javascript
// ✅ Good
const speed = uniform(1.0);
const tint = uniform(new THREE.Color(0x0066ff));
const resolution = uniform(new THREE.Vector2(window.innerWidth, window.innerHeight));

// Update at runtime (no needsUpdate required)
speed.value = 2.0;
tint.value.set(0xff0000);
resolution.value.set(newWidth, newHeight);
```

### Uniform vs Constant

Use uniforms for dynamic values. Use type constructors for constants.

```javascript
// ✅ Good — constant (baked into shader)
const PI2 = float(Math.PI * 2);
const UP = vec3(0, 1, 0);

// ✅ Good — uniform (changeable at runtime)
const amplitude = uniform(0.5);
const baseColor = uniform(new THREE.Color(0x00ff00));

// ❌ Bad — using uniform for a constant wastes a GPU register
const pi = uniform(Math.PI);  // never changes, should be float()
```

---

## Control Flow

### TSL Control Flow

Use TSL control flow constructs, not JavaScript.

```javascript
// ✅ Good — TSL If (capital I)
const result = float(0).toVar();
If(a.greaterThan(b), () => {
    result.assign(a);
}).Else(() => {
    result.assign(b);
});

// ✅ Good — select for ternary
const clamped = select(value.greaterThan(1.0), float(1.0), value);

// ✅ Good — TSL Loop
Loop(10, ({ i }) => {
    sum.addAssign(float(i).mul(0.1));
});

// ❌ Bad — JavaScript if (not part of shader graph)
if (a > b) {  // evaluated once at build time, not per-pixel
    material.colorNode = colorA;
}

// ❌ Bad — JavaScript for loop
for (let i = 0; i < 10; i++) {  // runs at build time only
    sum += i * 0.1;
}
```

### Comparison Operators

```javascript
// ✅ Good — TSL comparison methods
a.equal(b)
a.greaterThan(b)
a.lessThan(b)
a.greaterThanEqual(b)
a.lessThanEqual(b)

// ❌ Bad — JavaScript comparisons
a === b    // returns boolean, not shader node
a > b      // same problem
```

---

## Built-in Nodes

### Position Nodes

Choose the correct coordinate space.

| Node | Space | Use Case |
|------|-------|----------|
| `positionGeometry` | Object (pre-transform) | UV-like patterns |
| `positionLocal` | Object (post-transform) | Vertex displacement |
| `positionWorld` | World | World-space effects |
| `positionView` | Camera/View | View-dependent effects |

```javascript
// ✅ Good — vertex displacement in local space
material.positionNode = Fn(() => {
    const pos = positionLocal.toVar();
    const displacement = sin(time.mul(3.0).add(pos.y.mul(5.0))).mul(0.075);
    return pos.add(normalLocal.mul(displacement));
})();
```

### UV & Screen Nodes

```javascript
// ✅ Good
const texCoord = uv();                // mesh UV coordinates
const screenPos = screenUV;           // screen-space position
const viewportPos = viewportUV;       // viewport position
```

### Time & Animation

```javascript
// ✅ Good — TSL time (auto-increments)
const wave = sin(time.mul(2.0));
const pulse = oscSine(time.mul(0.5));  // 0..1 range

// ❌ Bad — manual time tracking
let elapsed = 0;
function animate() {
    elapsed += 0.016;  // unnecessary, use time node
}
```

---

## Textures

### Sampling

```javascript
// ✅ Good
import { texture, cubeTexture } from 'three/tsl';

const sampled = texture(myTexture, uv());
const cubeSampled = cubeTexture(envMap, normalWorld);

// With LOD level
const blurred = texture(myTexture, uv(), float(3.0));
```

---

## Post-Processing

### Setup Pattern

```javascript
// ✅ Good
import { pass, bloom, fxaa } from 'three/tsl';

const postProcessing = new THREE.PostProcessing(renderer);
const scenePass = pass(scene, camera);

// Chain effects
postProcessing.outputNode = bloom(scenePass, {
    threshold: 0.8,
    strength: 0.4
});
```

### Available Effects

`fxaa`, `smaa`, `bloom`, `gaussianBlur`, `dof`, `motionBlur`, `chromaticAberration`, `grayscale`, `sepia`, `sobel`, `ao`, `ssr`

---

## Compute Shaders (WebGPU Only)

### Pattern

```javascript
// ✅ Good
import { Fn, instancedArray, instanceIndex, deltaTime } from 'three/tsl';

const COUNT = 1000;
const positions = instancedArray(COUNT, 'vec3');

const computeShader = Fn(() => {
    const pos = positions.element(instanceIndex);
    pos.x.addAssign(deltaTime.mul(0.1));
})().compute(COUNT);

// In render loop
renderer.compute(computeShader);
```

---

## Performance

### Minimize Node Graph Complexity

```javascript
// ✅ Good — reuse computed values
const wave = sin(time.mul(3.0)).toVar();
material.colorNode = vec4(wave, wave.mul(0.5), float(0), 1.0);

// ❌ Bad — same sin() computed three times
material.colorNode = vec4(
    sin(time.mul(3.0)),
    sin(time.mul(3.0)).mul(0.5),  // duplicate computation
    float(0),
    1.0
);
```

### Material Updates

```javascript
// ✅ Good — set needsUpdate when swapping node graphs
material.colorNode = newNodeGraph;
material.needsUpdate = true;

// ✅ Good — uniform updates do NOT need needsUpdate
myUniform.value = newValue;  // just works

// ❌ Bad — calling needsUpdate on every frame
function animate() {
    material.needsUpdate = true;  // forces shader recompile every frame
}
```

### Overdraw & Draw Calls

- Prefer instanced rendering (`InstancedMesh` + compute shaders) over many individual meshes
- Use `MeshBasicNodeMaterial` when lighting is not needed
- Avoid transparent materials when possible (breaks depth sorting)

---

## Common Patterns

### Animated Gradient

```javascript
import { uniform, sin, mix, positionLocal, time, color } from 'three/tsl';

const c1 = uniform(new THREE.Color(0x6366f1));
const c2 = uniform(new THREE.Color(0xec4899));
const factor = sin(positionLocal.length().mul(3.0).add(time)).mul(-0.5).add(0.5);

material.emissiveNode = mix(c1, c2, factor);
```

### UV-based Color

```javascript
import { Fn, uv, vec4 } from 'three/tsl';

material.colorNode = Fn(() => {
    return vec4(uv(), 0.5, 1.0);
})();
```

### Vertex Displacement

```javascript
import { Fn, positionLocal, normalLocal, sin, time } from 'three/tsl';

material.positionNode = Fn(() => {
    const pos = positionLocal;
    const displacement = sin(time.mul(3.0).add(pos.y.mul(5.0))).mul(0.075);
    return pos.add(normalLocal.mul(displacement));
})();
```

---

## GLSL → TSL Migration

| GLSL | TSL |
|------|-----|
| `position` | `positionGeometry` |
| `transformed` | `positionLocal` |
| `vUv` | `uv()` |
| `vNormal` | `normalView` |
| `gl_FragColor` | `material.fragmentNode` |
| `modelMatrix` | `modelWorldMatrix` |
| `viewMatrix` | `cameraViewMatrix` |
| `projectionMatrix` | `cameraProjectionMatrix` |

---

## Common Gotchas

| Issue | Symptom | Fix |
|-------|---------|-----|
| `import from 'three'` | TSL functions undefined | Use `three/webgpu` and `three/tsl` |
| Missing `await renderer.init()` | Black screen, no errors | Always await initialization |
| `Fn(() => {...})` without `()` | Nothing renders | Add `()` to invoke: `Fn(() => {...})()` |
| `pos.y = pos.y.add(1)` | No effect | Use `.toVar()` then `.assign()` |
| JavaScript `if` in shader | Static behavior | Use `If()` (capital I) or `select()` |
| `material.needsUpdate` every frame | Stuttering | Only set when swapping node graphs |
| `Math.sin()` instead of `sin()` | Constant value | Use TSL `sin()` from `three/tsl` |
| Missing `needsUpdate` on node swap | Old shader persists | Set `material.needsUpdate = true` |

---

## Quick Reference

### Math Functions

| Category | Functions |
|----------|-----------|
| Constants | `EPSILON`, `INFINITY`, `PI`, `TWO_PI`, `HALF_PI` |
| Core | `abs`, `sign`, `floor`, `ceil`, `round`, `fract`, `sqrt`, `pow`, `exp`, `log` |
| Trig | `sin`, `cos`, `tan`, `asin`, `acos`, `atan` |
| Range | `min`, `max`, `clamp`, `saturate` |
| Interpolation | `mix`, `smoothstep`, `step`, `remap`, `remapClamp` |
| Vector | `length`, `distance`, `dot`, `cross`, `normalize`, `reflect`, `refract` |
| Oscillators | `oscSine`, `oscSquare`, `oscTriangle`, `oscSawtooth` |

### Built-in Nodes

| Category | Nodes |
|----------|-------|
| Position | `positionGeometry`, `positionLocal`, `positionWorld`, `positionView` |
| Normal | `normalGeometry`, `normalLocal`, `normalView`, `normalWorld` |
| UV/Color | `uv()`, `vertexColor()` |
| Camera | `cameraNear`, `cameraFar`, `cameraPosition` |
| Screen | `screenUV`, `screenSize`, `viewportUV` |
| Time | `time`, `deltaTime` |

---

## Sources

### Official
- [Three.js TSL Wiki](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- [TSL Roadmap](https://github.com/mrdoob/three.js/issues/30849)
- [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide)

### Tutorials
- [TSL: A Better Way to Write Shaders](https://threejsroadmap.com/blog/tsl-a-better-way-to-write-shaders-in-threejs)
- [sbcode.net TSL (28 lessons)](https://sbcode.net/tsl/)
- [Maxime Heckel's Field Guide](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [GoodTSL.com](https://www.goodtsl.com/)
- [tsl-textures](https://github.com/boytchev/tsl-textures)

### Full Research
`~/.claude/private/research/threejs-tsl.md`
