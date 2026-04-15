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

## Agent Operational Docs — `.agent/` Folder

Shotloom has a dedicated Codex agent ("돌쇠") assigned to this repo and
may add more agents over time. To keep agent-specific operational
guidance separate from project truth, shotloom uses an `.agent/` folder
at the repo root:

```
/Users/deemooooooooo/Desktop/www/shotloom-github/.agent/
├── README.md          # Index of what lives in this folder
├── working-rules.md   # Rules the agent follows while working in this repo
├── project-guide.md   # Project structure, reading order, reference docs
└── checklists.md      # Pre-task / post-task checklists
```

### What goes where

| Location | Content | Audience |
|----------|---------|----------|
| `docs/` | Official project documentation — ADRs, specs, guidelines, arch | Humans + all agents, authoritative |
| `.agent/` | Informal operational guidance for whichever agent is running | Agents, advisory |
| Root `AGENTS.md` | High-level agent-facing workflow and ownership | Agents, entry point |

### Rules

- **Project truth → `docs/`.** ADRs, specs, contracts, guidelines,
  roadmap, knowledge base articles — these are all `docs/`. If a new
  convention is "this is how shotloom works," it is `docs/`.
- **Agent operational guidance → `.agent/`.** "How to behave while
  working on shotloom," "what to read first," "what to check before
  committing," "repo-scoped playbooks," "known gotchas an agent should
  remember across sessions" — all `.agent/`.
- **No duplication.** Long, detailed agent guidance lives in
  `.agent/`, and root `AGENTS.md` may reference `.agent/` files by
  relative path without copying their content. `AGENTS.md` remains
  the entry point for any agent that doesn't know where to look.
- **Do not confuse with `~/.claude/`.** The `.agent/` folder is
  **in-repo** and ships with the shotloom checkout; `~/.claude/` is
  per-machine user config for Claude Code. Repo-scoped guidance
  belongs in `.agent/` so every machine and every agent sees the
  same rules. User-scoped preferences stay in `~/.claude/`.
- **Commit `.agent/` like any other tracked file** unless the repo's
  `.gitignore` or `AGENTS.md` says otherwise. It is shared context,
  not scratchpad.

### Recommended starter files

- **`.agent/README.md`** — one-paragraph summary of each file in the
  folder so new agents know the index.
- **`.agent/working-rules.md`** — operational rules the agent must
  follow while working on shotloom. Example rules: "never push to
  `main`," "always run `pnpm check:rust` before opening a PR,"
  "ask before touching `.github/workflows/`." Structured like
  `~/.claude/rules/*.md` — short, enforceable bullets.
- **`.agent/project-guide.md`** — where to start reading for different
  tasks: which ADR covers which subsystem, which `docs/specs/` file
  maps to which crate, recommended skim order for a new agent
  onboarding. Think of it as a navigation map.
- **`.agent/checklists.md`** — pre-task and post-task checklists.
  Example: "Before opening a PR: (1) cargo fmt clean, (2) clippy
  clean, (3) doc-paths validator clean, (4) commit author identity
  matches repo expectation, (5) PR title + body match team pattern."
  Mirrors the pre-PR-open checklist in `rules/git.md` and
  `rules/shotloom-git.md` but may add repo-specific steps.

### When I (Claude) edit this folder

Treat `.agent/` as operational memory for the repo. Update it when:
- A gotcha surfaces that the next agent session should not relearn
  (e.g., "pnpm audit endpoint retirement blocks non-docs PRs —
  tracked in chore PR #NN").
- A workflow convention changes (e.g., new pre-PR validator added).
- A Codex hand-off needs context (e.g., a long-running ops sequence
  whose state lives in `.agent/` instead of chat history).

Do **not** use `.agent/` for:
- Secrets (they belong in environment variables, never in any file).
- Speculative future plans — use `docs/roadmap/` or ADRs instead.
- Personal preferences that belong in `~/.claude/` per-machine config.

## Full Proposal

- English: Obsidian `claude/projects/shotloom/WHY-SHOTLOOM.md`
- Korean: Obsidian `claude/projects/shotloom/WHY-SHOTLOOM-KO.md`
