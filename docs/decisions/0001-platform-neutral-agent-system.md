---
status: accepted
date: 2026-05-09
---
# Platform-Neutral Agent System

## Decision

`caol-ila` uses one canonical policy document with harness-specific entry documents.

| Layer | Role |
|-------|------|
| `SYSTEM.md` | Current shared policy and top-level contract |
| `CLAUDE.md` | Claude Code entry adapter |
| `AGENTS.md` | Codex entry adapter |
| `claude/{rules,standards,skills,commands}` | Shared source layers, classified by metadata |
| `docs/decisions/` | Accepted rationale for policy choices |

## Context

Claude Code and Codex need the same operating rules without duplicating policy. Duplicating policy in `CLAUDE.md`, `AGENTS.md`, or platform-specific folders creates drift: one harness follows an updated rule while another follows stale text.

The `claude/` directory name is a deploy shape, not a policy boundary. Rename pressure exists because the content now targets multiple harnesses. A big rename breaks imports and runtime paths before the content has compatibility metadata.

## Accepted Rule

| Rule | Effect |
|------|--------|
| One canonical policy | Shared policy lives in `SYSTEM.md` and the owning shared layer |
| Thin entry documents | Entry docs load `SYSTEM.md` first, then add only harness mechanics |
| Metadata before movement | Artifacts get `platforms:` and `portability:` before any neutral path migration |
| Decisions explain, policy executes | Decision records explain why; `SYSTEM.md` and shared layers define what agents do |

## Cascade

When this decision changes:

1. Edit `SYSTEM.md` if the operating contract changes.
2. Edit `claude/standards/policy/platform-adapters.md` if metadata or adapter semantics change.
3. Edit `CLAUDE.md` and `AGENTS.md` if entry behavior changes.
4. Edit `README.md`, `LOOKUP.md`, and indexes if navigation changes.
5. Extend `scripts/validate-llm-first.mjs` for every new mechanically checkable invariant.

## Non-Decisions

| Topic | Status |
|-------|--------|
| Rename `claude/` to a neutral directory | Not accepted |
| Treat `docs/decisions/` as executable policy | Not accepted |
| Give each harness its own copy of shared rules | Not accepted |

## Consequences

- New harnesses add a root entry document and register it in `SYSTEM.md`.
- Shared artifacts use metadata to declare whether they are shared, adapter-backed, or harness-specific.
- Policy changes use decision records when rationale matters across sessions.
