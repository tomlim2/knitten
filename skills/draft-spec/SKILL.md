---
name: draft-spec
description: Draft a compact implementation spec.
match-check: normal
allowed-tools: Read, Write, Agent, Bash
---

# Draft Spec

Use for: drafting compact spec artifacts.

Use when the user asks for a spec, plan, design plan, implementation contract,
or pre-work document before editing.

## Step 0: Match Check

- Continue only when the request asks for a written spec artifact, design plan,
  implementation contract, or pre-work document.
- Confirm the active workspace and intended durable spec location before
  writing.
- If the workspace or spec path is unclear, ask before writing.
- Stop before implementation unless the user separately asks to implement after
  the spec is accepted.
- If the request is generic or better handled by another skill, stop and name
  the better matching skill.
- Do not read templates, create files, or follow later steps until this check
  passes.

## Mode Contract

Do not require or invoke Codex `/plan` mode. Perform planning as this skill's
workflow in the current session mode, write the spec artifact, and stop before
implementation. If scope or correctness remains uncertain, ask the user before
locking the spec.

Do not read detailed references until Step 0 passes.

## After Match

Read [`references/flow.md`](references/flow.md), then write the compact spec
artifact and stop before implementation.
