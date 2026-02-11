# Three.js TSL (Three.js Shading Language) Research

**Date:** 2026-02-11

---

## What is TSL?

TSL은 JavaScript로 셰이더를 작성하는 Three.js의 노드 기반 추상화. GLSL 문자열 대신 JS 함수를 체이닝해서 셰이더 그래프를 만들면, 런타임에 GLSL(WebGL2) 또는 WGSL(WebGPU)로 자동 컴파일됨.

r171(2025년 9월)부터 production-ready. 기존 ShaderMaterial/onBeforeCompile 방식은 deprecated 예정.

---

## Import Pattern

```javascript
import * as THREE from 'three/webgpu';  // renderer, materials, lights
import { uniform, color, vec3, uv, time, Fn } from 'three/tsl';  // TSL functions
```

---

## Core Concepts

### Node Materials

기존 Material의 Node 버전:
- `MeshBasicMaterial` → `MeshBasicNodeMaterial`
- `MeshStandardMaterial` → `MeshStandardNodeMaterial`
- `MeshPhysicalMaterial` → `MeshPhysicalNodeMaterial`

### Material Slots

| Slot | Type | Description |
|------|------|-------------|
| `colorNode` | vec4 | Base color (조명 유지) |
| `emissiveNode` | color | Self-illumination |
| `positionNode` | vec3 | Vertex displacement |
| `normalNode` | vec3 | Normal mapping |
| `roughnessNode` | float | PBR roughness |
| `metalnessNode` | float | PBR metalness |
| `opacityNode` | float | Transparency |
| `aoNode` | float | Ambient occlusion |
| `fragmentNode` | vec4 | **전체 대체** (조명 없음) |
| `vertexNode` | vec4 | **전체 대체** |

**핵심**: `colorNode` 사용 시 조명/그림자 유지. `fragmentNode`는 전부 덮어씀.

### Fn() Function Declaration

```javascript
const myShader = Fn(([param]) => {
    return param.mul(2.0).add(time);
})();  // 반드시 ()로 즉시 호출
```

### Uniforms

```javascript
const myColor = uniform(new THREE.Color(0x0066FF));
material.colorNode = myColor;
myColor.value.set(0x00ff00);  // 런타임 업데이트
```

---

## Type Constructors

| Function | Returns | Example |
|----------|---------|---------|
| `float(value)` | float | `float(1.0)` |
| `color(hex)` | color | `color(0xff0000)` |
| `vec2(x, y)` | vec2 | `vec2(1.0, 0.5)` |
| `vec3(x, y, z)` | vec3 | `vec3(1, 0, 0)` |
| `vec4(x, y, z, w)` | vec4 | `vec4(1, 0, 0, 1)` |

변환: `.toFloat()`, `.toInt()`, `.toVec3()` 등

---

## Operators

**산술**: `.add()`, `.sub()`, `.mul()`, `.div()`, `.mod()`
**비교**: `.equal()`, `.greaterThan()`, `.lessThan()`
**할당**: `.assign()`, `.addAssign()`, `.subAssign()`

체이닝: `positionLocal.y.mul(3.0).add(time).sin()`

---

## Built-in Nodes

**Position**: `positionGeometry`, `positionLocal`, `positionWorld`, `positionView`
**Normal**: `normalGeometry`, `normalLocal`, `normalView`, `normalWorld`
**UV**: `uv()`, `vertexColor()`
**Camera**: `cameraNear`, `cameraFar`, `cameraPosition`
**Screen**: `screenUV`, `screenSize`, `viewportUV`
**Time**: `time`, `deltaTime`
**Oscillators**: `oscSine()`, `oscSquare()`, `oscTriangle()`, `oscSawtooth()`

---

## Math Functions

**Constants**: `EPSILON`, `INFINITY`, `PI`, `TWO_PI`, `HALF_PI`
**Core**: `abs`, `sign`, `floor`, `ceil`, `round`, `fract`, `sqrt`, `pow`, `exp`, `log`
**Trig**: `sin`, `cos`, `tan`, `asin`, `acos`, `atan`
**Range**: `min`, `max`, `clamp`, `saturate`
**Interpolation**: `mix`, `smoothstep`, `step`, `remap`, `remapClamp`
**Vector**: `length`, `distance`, `dot`, `cross`, `normalize`, `reflect`, `refract`

---

## Control Flow

```javascript
If(a.greaterThan(b), () => {
    result.assign(a);
}).Else(() => {
    result.assign(b);
});

const result = select(value.greaterThan(1), 1.0, value);  // 삼항

Loop(10, ({ i }) => { /* 0..9 */ });
```

---

## Textures

```javascript
texture(tex, uv, level)     // Sample
textureLoad(tex, uv, level) // Fetch without interpolation
cubeTexture(tex, uvw, level) // Cube map
triplanarTexture(...)        // Triplanar projection
```

---

## Post-Processing

```javascript
import { pass, bloom, gaussianBlur, fxaa } from 'three/tsl';

const postProcessing = new THREE.PostProcessing(renderer);
const scenePass = pass(scene, camera);
postProcessing.outputNode = bloom(scenePass, { threshold: 0.8 });
```

Available: `fxaa`, `smaa`, `bloom`, `gaussianBlur`, `dof`, `motionBlur`, `chromaticAberration`, `grayscale`, `sepia`, `sobel`, `ao`, `ssr`

---

## Compute Shaders (WebGPU only)

```javascript
const positionBuffer = instancedArray(COUNT, 'vec3');

const computeShader = Fn(() => {
    const pos = positionBuffer.element(instanceIndex);
    pos.x.addAssign(deltaTime);
})().compute(COUNT);

renderer.compute(computeShader);
```

---

## Common Gotchas

| Issue | Fix |
|-------|-----|
| `import from 'three'` | `three/webgpu` 사용 |
| `await renderer.init()` 누락 | 렌더링 안됨, 에러도 없음 |
| `Fn(() => {...})` 뒤 `()` 빠짐 | 함수만 생성, 실행 안됨 |
| `pos.y = pos.y.add(1)` | `.toVar()` 후 `.assign()` |
| JS `if` 사용 | `If()` (대문자) 사용 |
| `material.needsUpdate` 안함 | 런타임 노드 교체 시 필수 |

---

## GLSL → TSL Mapping

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

## Code Examples

### Animated Gradient

```javascript
import { uniform, sin, mix, positionLocal, time, color } from 'three/tsl';

const c1 = uniform(new THREE.Color(0x6366f1));
const c2 = uniform(new THREE.Color(0xec4899));
const factor = sin(positionLocal.length().mul(3.0).add(time)).mul(-0.5).add(0.5);

material.emissiveNode = mix(c1, c2, factor);
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

### UV-based Color

```javascript
import { Fn, uv, vec4 } from 'three/tsl';

material.colorNode = Fn(() => {
    return vec4(uv(), 0.5, 1.0);
})();
```

---

## Learning Path

1. Setup: `three/webgpu` + `WebGPURenderer` + `await renderer.init()`
2. 첫 셰이더: `colorNode = positionLocal`
3. Uniform & 애니메이션: `uniform()`, `time`, `sin()`, `mix()`
4. UV & 텍스처: `uv()`, `texture()`
5. Fn() 함수: 재사용 가능한 셰이더 함수
6. Vertex Displacement: `positionNode`
7. 포스트 프로세싱: `pass()` + `bloom()`
8. Compute Shader: `instancedArray()`, `compute()`

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
- [Bruno Simon's TSL Sandbox](https://github.com/brunosimon/three.js-tsl-sandbox)
- [Getting AI to Write TSL](https://threejsroadmap.com/blog/getting-ai-to-write-tsl-that-works)
