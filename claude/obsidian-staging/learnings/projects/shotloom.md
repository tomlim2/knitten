---
title: "Shotloom — Learnings"
tags:
  - learnings
  - shotloom
  - gotcha
  - graphics
  - webgpu
  - wgpu
  - bevy
  - srgb
  - gamma-correction
  - color-management
  - texture-format
  - file-formats
  - vrm
  - vrma
  - animation
  - retargeting
  - normalizer
  - adr-0030
  - crate-architecture
date: 2026-04-27
source: claude
---

# Shotloom — Learnings

Project wisdom vault for Shotloom (CINEV's web-first cinematic scene editor). Each entry captures one durable insight — the kind of thing that would cost an afternoon if the next person had to rediscover it.

---

## Convention

### 2026-04-27 — Three normalizer crates: input/output/canonical separation (ADR-0030)

**Definition.** Shotloom의 import → retarget 파이프라인에서 normalization 책임은 세 개의 독립 crate로 분리된다 — `shotloom-character-model-normalizer`, `shotloom-body-anim-normalizer`, `shotloom-facial-anim-normalizer`. 세 crate는 서로 의존하지 않고, 각자 다른 입력/출력/canonical target을 가진다. 합류는 caller (retarget driver) 가 한다. 이 패턴이 "왜 세 개여야 하는가"의 답이 되는 동시에 "왜 한 crate / 두 crate 안 되는가"의 답이기도 하다.

**Three-way contract.**

| Crate | 입력 | 출력 | Canonical target | Cadence |
|---|---|---|---|---|
| `character-model-normalizer` | `ImportedVrmAsset` (VRM 파일) | rest pose 정렬 + foot contact / sole offset + per-character VRM expression binding | **CR rest pose** (CINEV ARP rig, 임시 — A-pose 마이그레이션은 후속 ADR) | VRM importer 따라감 |
| `body-anim-normalizer` | `ImportedFbxAnimation` (Body 모드) | source 본 이름 → canonical 본 이름 매핑 + 좌표 변환된 skeletal motion | **CR rest pose** (임시) | DCC source 따라감 |
| `facial-anim-normalizer` | `ImportedFbxAnimation` (Face 모드) | ARKit 52 채널 이름으로 매핑된 blendshape weight track | **ARKit 52 baseline + 확장 registry** (안정) | AI 모델 변화 따라감 |

`ImportedFbxAnimation` 은 cache descriptor (artifact path + content hash + mode + diagnostics) 이지 parsed bone graph 가 아니다. body / face normalizer 가 descriptor 의 artifact path 에 대해 `shotloom_fbx_anim::parse_with_config` 를 다시 호출해서 parsed graph 을 얻는다.

**Data flow.**

```
[VRM 파일]               [Body FBX]              [Face FBX]
    │                       │                       │
    ▼ shotloom-import       ▼                       ▼
ImportedVrmAsset        ImportedFbxAnimation    ImportedFbxAnimation
    │                       │ (mode=Body)           │ (mode=Face)
    ▼                       ▼                       ▼
character-model-       body-anim-              facial-anim-
normalizer             normalizer              normalizer
    │                       │                       │
    │ (rest pose +          │ (canonical 본 +       │ (ARKit 52 ch +
    │  foot contact +       │  좌표 변환된           │  per-character
    │  per-char binding)    │  skeletal motion)      │  VRM expression
    │                       │                        │  binding)
    └─────────┬─────────────┴───────────┬────────────┘
              │                         │
              ▼                         ▼
         [retarget]                [face binding/playback]
              │                         │
              └─────────┬───────────────┘
                        ▼
                  shotloom-engine
                  (Bevy AnimationClip 재생)
```

**Why three (not one, not two).** 세 도메인이 공유 surface 0:
- 입력 의미론: 정적 본 hierarchy + skin mesh / 시간축 본 회전·위치 track / 시간축 blendshape weight track
- Validation 규칙: VRM humanoid 본 매핑 완전성 / ARP marker 존재성 / blendshape track 존재성
- Canonical 미래: A-pose 마이그레이션 / A-pose 마이그레이션 / ARKit 52 안정 + 확장 registry
- 다운스트림: retarget math / retarget math / per-character VRM expression binding (retarget math 안 탐)

→ 한 crate에 묶으면 한쪽 변경이 항상 세쪽 다 rebuild + API 변경이 다른 쪽 review burden. 공유 surface 0인데 묶으면 결합만 늘고 이득 없음.

**Sibling 의존 금지.** Cargo.toml 에서 sibling normalizer 의존 X. 각자 독립 컴파일·테스트·버저닝. 합류 지점은 caller.

**Direction invariant.** `parsers → import → normalizer → retarget → engine` 단방향. 위쪽만 의존, 아래쪽 의존 금지 (오늘은 types-only transitional 허용 — `BoneTrack`/`RetargetConfig`/`VrmRestPose` 등 retarget 내부 타입을 normalizer 가 시그니처에 사용하는 경우. STL-183에서 `SourceAsset`/`SourceFormat` 분리 후 완전히 끊을 예정).

**Why ARKit 52 for face canonical.** AI generation 호환성 (Audio2Face, MediaPipe, ElevenLabs lip-sync, EMO, SadTalker 모두 ARKit 52 native), render-ready (named blendshapes, FLAME/FACS 와 달리 solver 불필요), VRM-compatible (per-character binding table 로 매핑), superset extensibility (MetaHuman 236 이 strict superset). VRM 1.x Expression Manifest (~15 그룹) 는 너무 coarse — canonical 이 아니라 per-character binding target 으로만 사용.

**Tools/experience.** ADR-0030 이 패턴 제정 (2026-04-22 proposed). PR [#153](https://github.com/CINEV/shotloom/pull/153) review 에서 Step 1 의 call-site 4 종 (RestAlignOverride 타입 / align_finger_rest re-export / retargeter.rs:193 호출 site / arp_vrm_user_pose.rs disposition) 으로 scope 확정. 첫 구현은 STL-127 umbrella 아래 STL-195 (character normalizer scaffold).

**Trip-wires for next time.**
- "이거 어느 normalizer 에 들어가지?" → 입력 형식 + canonical target 매트릭스 보고 결정. character vs anim 헷갈리면: **character = 정적 (한번 import 시 산출)**, **anim = 시간축 (애니 클립별 산출)**.
- 새 source 형식 (PMX character, alternative DCC) 추가 → exactly one normalizer 만 건드린다. retarget / engine / 다른 normalizer 손대면 layer violation.
- normalizer 가 `shotloom-retarget` 함수를 호출하려는 코드 → reject. types-only 의존만 허용.
- 두 normalizer 가 서로 import 하려는 코드 → reject. caller 가 합쳐야 함.

---

## Worked

---

## Failed

---

## Gotcha

### 2026-04-21 — WebGPU offscreen render target renders ~60 bytes darker than Native (STL-141)

**Symptom.** The Shotloom browser preview (Chrome WebGPU) rendered the entire scene noticeably darker than the Native (Metal) preview, even with tonemapping and unlit both disabled. Constant-color test: a linear `0.5` clear produced byte `128` on the web surface but byte `188` on Native — a ~60-byte gap that tracks `sRGB(linear 0.5) ≈ 0.735 × 255 ≈ 188`.

**Root cause.** WebGPU's spec forbids sRGB surface formats. `Surface::get_default_config` on a browser WebGPU backend returns `Bgra8Unorm` (linear). Bevy writes linear values into the attachment, the browser compositor displays that texture as if it were sRGB, and the eye sees `linear 0.5` rendered at the brightness of `linear 0.22`. Native runtimes (Metal / D3D12 / Vulkan) let you request `Bgra8UnormSrgb` directly, so the hardware performs linear → sRGB encoding at write time and the problem never surfaces.

**Why Shotloom's bypass made it worse.** The engine's default-surface path in Bevy inserts a `view_formats` sRGB override when the surface is `Bgra8Unorm`. Shotloom's web runtime uses `RenderTarget::TextureView` (offscreen), which bypasses that default-surface wiring — so the override was never applied.

**Fix.** Surface-level `view_formats` override, matching Native semantics exactly:

```rust
// crates/shotloom-web/src/runtime.rs
let mut surface_config = surface.get_default_config(&adapter, w, h).expect(...);
surface_config.view_formats = vec![wgpu::TextureFormat::Bgra8UnormSrgb];
surface.configure(&device, &surface_config);

// every frame
let view = frame.texture.create_view(&wgpu::TextureViewDescriptor {
    format: Some(wgpu::TextureFormat::Bgra8UnormSrgb),
    ..Default::default()
});
// ExternalSurfacePlugin.format and ManualTextureView.view_format also use sRGB.
```

The base surface stays `Bgra8Unorm` (WebGPU requirement), but every view the engine writes through is the sRGB variant, so the hardware encodes on store. No shader changes, no blit pass, no platform-branch uniform, no double-gamma when tonemapping is re-enabled.

**Diagnostic probe.** Isolate the format-storage behaviour from every other pipeline variable with a pure wgpu example — clear two textures (`Bgra8UnormSrgb` vs `Bgra8Unorm`) with identical `linear 0.5`, read back the center pixel, print the byte values:

```
[ srgb] Bgra8UnormSrgb  center = 188   (hardware sRGB encode of linear 0.5)
[unorm] Bgra8Unorm      center = 128   (linear value stored as-is)
```

See `crates/shotloom-engine/examples/gamma_probe.rs`. Ships with the STL-141 Phase 1 PR. Run natively to re-verify the property whenever you suspect gamma regression.

**Rejected fixes.**

- **Manual `pow(color, 1/2.2)` in a final blit shader with a platform-branch uniform (Native skip).** Works but adds a full blit pass, a WGSL shader, a bind group, and a correctness trap when tonemapping is re-enabled (double-gamma). The `view_formats` path matches Native bit-for-bit with zero new moving parts.
- **Symlinks or XDG env vars** for surface routing. Not applicable here — this is render-pipeline config, not filesystem path indirection.

**Tripwire for next time.** A visual regression test (STL-141 Acceptance #3, follow-up work) boots the engine, renders a known color, reads the surface pixel, and asserts byte values. Without it, a refactor that drops `view_formats` or the `TextureViewDescriptor.format` override silently re-darkens the preview. Until that test lands, manual verification via `pnpm dev:web` + brightness comparison with `cargo run -p shotloom-native` is the tripwire.

#### Format types reference (wgpu / WebGPU)

| Format | Bytes/pixel | Color space | Typical use in Shotloom |
|---|---|---|---|
| `Bgra8Unorm` | 4 | linear | **WebGPU surface** (only linear 8-bit BGRA allowed) |
| `Bgra8UnormSrgb` | 4 | sRGB (HW encode on write) | **Native surface**, offscreen targets that should look right |
| `Rgba8Unorm` | 4 | linear | general-purpose linear 8-bit, texture atlases |
| `Rgba8UnormSrgb` | 4 | sRGB | albedo / color textures imported from sRGB source |
| `Rgba16Float` | 8 | linear (HDR) | tonemapping intermediate, HDR render targets |
| `Rg11b10Ufloat` | 4 | linear (HDR) | compact HDR target (no alpha) |
| `Depth24Plus` / `Depth32Float` | 4 | — | depth buffer |
| `Bc7RgbaUnorm` / `Astc4x4RgbaUnorm` | block-compressed | linear | compressed textures (not supported on all WebGPU browsers yet) |

**Key property: `is_srgb()`.** `wgpu::TextureFormat::is_srgb()` returns `true` for formats that carry hardware sRGB encoding. Use this in capability selection: `caps.formats.iter().find(|f| f.is_srgb())` is the canonical Native-surface picker (see `shotloom-native/src/runner.rs`).

**`view_formats` mechanism.** When a texture is created with `view_formats: &[...]`, views of that texture may use any format in that list AS LONG AS it's in the same "compatibility family" (bit layout + channel mapping). For `Bgra8Unorm`, the only compatible non-identity view format is `Bgra8UnormSrgb` — the hardware treats stored bytes as sRGB-encoded on read and encodes to sRGB on write. This is how WebGPU lets you opt into hardware sRGB conversion without a sRGB-format surface.

**Per-backend surface sRGB support.**

| Backend | sRGB surface format allowed? | What Shotloom picks |
|---|---|---|
| Metal (macOS, iOS native) | yes | `Bgra8UnormSrgb` via `find(is_srgb)` |
| D3D12 (Windows native) | yes | `Bgra8UnormSrgb` via `find(is_srgb)` |
| Vulkan (Linux/Windows native) | yes | `Bgra8UnormSrgb` via `find(is_srgb)` |
| WebGPU (Chrome/Edge/Safari) | **no** | `Bgra8Unorm` + `view_formats: [Bgra8UnormSrgb]` override |

The `shotloom-tauri` build path uses a native wgpu window surface, not the webview's WebGPU, so it follows the Native row — the darkness bug never hit Tauri desktop.

**Related artefacts.**

- [Linear STL-141](https://linear.app/cinamon-corp/issue/STL-141) — original ticket.
- [Shotloom PR #119](https://github.com/CINEV/shotloom/pull/119) — Phase 1 diagnostic (`gamma_probe`).
- Shotloom PR on `fix/webgpu-gamma-render-path` — Phase 2 actual fix (surface `view_formats` override).
- [wgpu `TextureFormat` docs](https://docs.rs/wgpu/latest/wgpu/enum.TextureFormat.html) — canonical format table.
- [WebGPU spec §6.4 "GPUTextureFormat"](https://www.w3.org/TR/webgpu/#texture-formats) — authoritative on which formats are allowed where.

### 2026-04-21 — `.vrm` vs `.vrma` — "VRM" as a file extension is ambiguous

**Core confusion.** "VRM 파일 줘" / "VRM 애니메이션 있어?" conflates two separate file formats that both live under the VRM umbrella. Treating them interchangeably leads to pipeline wiring that expects the wrong payload — e.g. assuming an animation library ships `.vrm` files when it actually ships `.vrma`.

**`.vrm` — model package.** A `.glb` (binary glTF) carrying a humanoid avatar: mesh, skeleton with VRM humanoid bone mapping, materials (often MToon), textures, BlendShape expressions, spring bones for secondary animation, LookAt config, first-person rendering rules, and metadata (author, license, avatar usage permissions). Two spec versions live in the wild: **VRM 0.x** (`VRM` extension root) and **VRM 1.0** (`VRMC_vrm` extension plus split sub-extensions `VRMC_springBone`, `VRMC_node_constraint`, `VRMC_materials_mtoon`). Shotloom targets VRM 1.0 and normalizes 0.x inputs via `shotloom-gltf::normalize_vrm` at import time.

**`.vrma` — animation-only payload.** A `.glb` carrying only animation tracks (humanoid bones, expressions, LookAt), **no mesh, no materials**. Declared via the `VRMC_vrm_animation` extension. **VRM 1.0 exclusive** — there is no VRMA equivalent in VRM 0.x; a 0.x source must be migrated or re-authored. Tracks are keyed against the VRM humanoid bone vocabulary (`hips`, `leftUpperLeg`, `spine`, ...), not against a specific rig, which is what makes `.vrma` cross-avatar portable by construction.

**Why the distinction matters — portability.** The VRM humanoid spec standardizes bone names, orientations, and hierarchy. A `.vrma` authored for one VRM 1.0 avatar applies "for free" to any other VRM 1.0 avatar, because both ends agree on the skeleton semantics. This is the opposite of FBX: an FBX animation is rig-specific, and applying it to a different skeleton requires explicit retargeting with bone-name maps, axis conversions, and rest-pose alignment — which is exactly what `shotloom-retarget` exists to do for the ARP → VRM path.

**Shotloom pipeline today.**

- **Character import:** `.vrm` only. Enters through `shotloom-import`, normalized via `shotloom-gltf`, rendered via `bevy_vrm1`.
- **Motion import:** FBX (typically ARP / Auto-Rig Pro) → `shotloom-fbx-anim-importer` → `shotloom-retarget` → `TargetAnimation` on the VRM skeleton.
- **VRMA route:** not wired. If the source motion is already `.vrma`, the retarget step is architecturally redundant — the animation is already in VRM humanoid coordinates — but we have no VRMA reader yet.

**When a VRMA path would earn its keep.**

- Importing community motion libraries (VRoid Hub, niconi-solid, etc.) that publish `.vrma` directly — skipping ARP export round-trips.
- Letting an AI motion generator output VRMA natively, eliminating the FBX + ARP rig step entirely.
- Exporting Shotloom-authored motion for reuse by third parties, without leaking a specific character rig.

**Ecosystem caveat (why VRMA isn't a slam dunk yet).**

- Spec is newer than VRM 1.0; tooling lags. Blender VRM addon, VRoid Studio, Three-VRM, and `bevy_vrm1` have varying degrees of support.
- Many published `.vrma` files were authored by MMD → VRMA or Mixamo → VRMA converters with uneven quality (frame-rate assumptions, rest-pose mismatches, foot-IK omissions).
- VRMA covers humanoid tracks only. Costume joints, hair/skirt spring bone drivers beyond the standard set, and face BlendShape variants outside the VRM expression catalogue are out of scope — those still need per-character data.

**Tripwire for next time.** When someone says "VRM 애니메이션", clarify upfront: is the payload `.vrm` (model with embedded animation) or `.vrma` (animation-only)? The pipeline wiring, rig assumption, and retarget need are all different. If in doubt: `file --mime-type <path>` returns `application/octet-stream` for both (they're just GLBs), but `jq '.extensionsUsed' <(gltf-extract-json <file>)` reveals whether `VRMC_vrm_animation` is present.
