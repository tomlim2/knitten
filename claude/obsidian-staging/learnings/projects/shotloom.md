---
title: "Shotloom — Learnings"
tags:
  - learnings
  - shotloom
date: 2026-04-21
source: claude
---

# Shotloom — Learnings

Project wisdom vault for Shotloom (CINEV's web-first cinematic scene editor). Each entry captures one durable insight — the kind of thing that would cost an afternoon if the next person had to rediscover it.

---

## Convention

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
