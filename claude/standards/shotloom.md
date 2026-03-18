# Shotloom Standard

Reference for Shotloom — the web-first cinematic scene editor succeeding CINEVStudio.

---

## Overview

Shotloom is a **lightweight, web-first cinematic scene editor** for assembling performances, placing characters, editing camera clips, previewing shots, and exporting rendered output from a browser. It is the successor to CINEVStudio.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Engine / Runtime | Rust + Bevy (WASM + WebGPU) |
| Editor UI | React + TypeScript |
| Bridge | wasm-bindgen (command/event) |
| Rendering | wgpu + WebGPU |
| Asset Formats | glTF 2.0 / VRM |
| Deployment | Web-native (static deploy, no server-side GPU) |

## Architecture

```
Browser (Web-first)
├── React + TypeScript (Timeline / Inspector / Outliner / Asset Browser)
├── wasm-bindgen (Command ↔ Event Bridge)
└── Rust + Bevy WASM (Scene / Camera / Animation / Rendering via wgpu)

Shared Rust Crates
├── shotloom-core (Domain model / Schema / Timeline)
└── shotloom-common (Errors / Math / Utilities)

Native Path
└── Render CLI (Headless export / Deterministic stepping)
```

### Key Principles

- **Decouple what Unreal couples** — UI, renderer, content pipeline are separate layers
- **Invert the content pipeline** — generate lightweight representations first, enhance progressively (vs. handcraft-first)
- **Browser-first** — no installation barrier, native HTTP to AI services
- **Crate boundaries enforce architecture** — domain model has no Bevy dependency

## Content Pipeline (Inverted vs CINEVStudio)

| Layer | CINEVStudio | Shotloom |
|-------|------------|----------|
| Stage | Detailed Unreal Level first → extract metadata | Layout metadata first → lightweight 3D stage → enhance later |
| Props | Handcrafted Unreal assets only | glTF reference library + runtime generation |
| Characters | Custom Unreal rigs | VRM (open standard) → runtime generation → import legacy |

## CINEVStudio Asset Migration

- Existing characters, props, stages → export to glTF → import into Shotloom
- No project-level interoperability between the two products

## Agentic Coding Strategy

Shotloom relies heavily on AI-assisted code generation. Language choices compensate:

- **Rust** — compiler catches null safety, memory safety, thread safety, type safety, and architectural boundary violations at compile time
- **TypeScript** — catches integration errors between React components and wasm-bindgen bridge at build time
- **Crate boundaries** — layer violations are compile errors, not code review findings

## Performance Targets

| Metric | Target | Minimum | Context |
|--------|--------|---------|---------|
| FPS (editor preview) | 60 fps | 30 fps | Interactive editing, camera orbit, timeline scrub |
| FPS (native) | 120 fps | 60 fps | Native build on M2 Max measured 119-120 fps (2026-03-17, VRM single character) |
| Frame time | ≤16.6 ms | ≤33.3 ms | Budget per frame at 60/30 fps |
| Draw calls | Monitor | — | Track as scene complexity grows |

**Reference baselines (Bevy VRM R&D, 2026-03-17):**
- Single VRM character + directional light + orbit camera → 119-120 fps / 8 ms frame time (native, Apple M2 Max)
- Debug overlay: F3 toggle (FpsOverlayPlugin + EntityCountDiagnosticsPlugin)

## Browser Constraints

- Targets WebGPU-capable browsers (Chrome/Edge stable, Safari recent, Firefox behind flag)
- No WebGL2 fallback in V1
- HTTPS required (WebGPU is secure-context-only)
- Minimum: GPU with Vulkan/Metal/D3D12 support
- Native render/export path as escape hatch for heavy workloads

## Full Proposal

- English: Obsidian `claude/projects/shotloom/WHY-SHOTLOOM.md`
- Korean: Obsidian `claude/projects/shotloom/WHY-SHOTLOOM-KO.md`
