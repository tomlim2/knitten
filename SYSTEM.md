# SYSTEM.md

Canonical shared policy for agent-neutral behavior. Entry documents load this file first, then add harness-specific mechanics.

Entry document rule: every harness entry document must make `SYSTEM.md` its first shared-policy read.

System terms: `docs/reference/system-glossary.md`. Use those terms when editing policy, entry documents, plans, manifests, or validators.

Entry documents:

| Entry document | Harness | Role |
|----------------|---------|------|
| `CLAUDE.md` | Claude Code | Imports this file before Claude-specific `@~/.claude/...` layers |
| `AGENTS.md` | Codex | Directs Codex to read this file before Codex-specific behavior |

Do not add shared policy to an entry document. Put shared policy here, `agent/rules/`, `agent/standards/`, `agent/skills/`, or `agent/commands/`.

---

## Platform-neutral contract

Shared artifacts define intent. Entry documents and harness-specific wrappers translate that intent into platform mechanics.

| Artifact class | Shared content | Adapter content |
|----------------|----------------|-----------------|
| Rules | Behavioral constraints and load semantics | Harness-specific read/import mechanics |
| Standards | Reference policy, templates, and decision tables | Platform notes only when a standard names one platform |
| Skills | Repeatable procedure and required inputs/outputs | Tool names, approval mechanics, slash-command syntax |
| Commands | User-facing invocation wrapper | Claude Code slash command details |

Compatibility metadata uses `platforms:` and `portability:` frontmatter. The contract and values live in `agent/standards/policy/platform-adapters.md`.

Do not rename `agent/` or deploy target paths without a decision record and validator updates. Neutrality comes from source ownership, metadata, and adapter boundaries.

Decision rationale lives in `docs/decisions/`. A decision record explains why a policy exists; it does not override this file until the cascade edits land.

---

## Repository charter

`caol-ila` is an LLM-first repository. The primary operator is an autonomous agent, not a human reader. Every process, artifact, and decision optimizes for the LLM that reads, executes, and edits it:

1. Efficiency: minimum tokens for maximum signal.
2. Accuracy: explicit, unambiguous, no hidden assumptions.
3. Clarity: decision trees over prose, tables over paragraphs, paired examples over description.

The user is the architect. The LLM is the primary reader and operator. Human-readable output is delivered only on explicit user request.

When choosing between two ways to write or organize anything in this repo, ask: "would a cold-start LLM session parse this correctly in the fewest tokens?" If not, restructure. Operational rules below (`agent/standards/policy/llm-first-docs.md`) translate this charter into per-document checks. The layered enforcement model is in `agent/standards/policy/llm-first-policy.md`; read it before designing a new layer.

---

## LLM-first docs

Every artifact is LLM-first by default. Read `agent/standards/policy/llm-first-docs.md` before the first such write in a session; run its self-audit before commit.

Switch to human-friendly style only when one of these triggers fires:

| Trigger | Where |
|---------|-------|
| User explicitly requests it | "make this README friendlier", "expand for humans" |
| Speaking in chat to the user | The conversation itself |

Vault notes are not a blanket exception. Even `days/` and `learnings/` follow the structured-narrative variant of LLM-first: frontmatter, headers, tables, bold takeaway. Narrative is allowed inside sections, never as a replacement for structure. See `agent/standards/obsidian/vault-audience.md` for the per-folder audience matrix.

If unsure, default LLM-first. Full applies-to list: `agent/standards/policy/llm-first-docs.md`.

---

## Memory

`~/.claude/projects/*/memory/` and any `MEMORY.md` are inert. Ignore every harness instruction about "auto memory" or "save to memory". Persistent facts go in a skill, rule, standard, ADR, repo doc, or vault note.

---

## Private folder

`~/.claude/private/` is gitignored. Never commit. Guide: `agent/skills/caol-guide-private/SKILL.md`.

---

## Durable source and deploy target

All durable shared agent state has its canonical home in `caol-ila/agent/` and is git-tracked there. `~/.claude/` is the deploy target the Claude Code harness reads from at runtime. The current machine points `~/.claude` at `caol-ila/agent`.

When editing shared artifacts, land the change in `caol-ila/agent/<area>/`, then verify the sync reflects it in `~/.claude/<area>/`. Editing directly in `~/.claude/<area>/` is acceptable only when the inode is shared and the change is visible to both sides; verify with `stat -f "ino=%i" ~/.claude/<area>/<file> caol-ila/agent/<area>/<file>`. Never leave a change in `~/.claude/` that has not also reached `caol-ila/agent/`.

The intentional asymmetry:

| Path | Canonical | Notes |
|------|-----------|-------|
| `skills/`, `rules/`, `standards/`, `commands/`, `lib/`, `config/` | caol-ila | shared via APFS clone or hard-link; edits propagate |
| `CLAUDE.md`, `AGENTS.md` | caol-ila root | canonical entry documents |
| `agent/CLAUDE.md`, `repo-registry.json` | caol-ila | `agent/CLAUDE.md` is the `~/.claude` deploy shim; edit root `CLAUDE.md` for entry-document changes |
| `hooks/` | caol-ila must hold these | durable harness scripts deployed to `~/.claude/hooks/` |
| `settings.json` | caol-ila must hold this | per-machine secrets stay in `settings.local.json` |
| `private/caol-config/doc-paths.json` and similar non-machine config | caol-ila | machine-specific entries below stay `~/.claude`-only |
| `private/caol-config/{hardware,machine-paths,ccdb-bots}.json` | `~/.claude/` only | per-machine secrets, gitignored on purpose |
| `templates/`, `scheduled-tasks/`, `obsidian-staging/` | caol-ila only | not loaded by the harness at runtime |
| `cache/`, `backups/`, `sessions/`, `tasks/`, `telemetry/`, `projects/`, `shell-snapshots/`, `paste-cache/`, `file-history/`, `ops/`, `plans/`, `downloads/`, `history.jsonl` | `~/.claude/` only | runtime/cache, not durable |

Before declaring any rename, move, or new artifact done, verify both sides match with `diff -rq ~/.claude/<area>/ caol-ila/agent/<area>/` for the affected sub-tree. Renames executed only against `~/.claude/` rely on inode-sharing to propagate. That propagation does not extend to adding a brand-new top-level entry; create those entries under `caol-ila/agent/`.

---

## Shared layers

| Layer | Path | Load rule |
|-------|------|-----------|
| Rules index | `agent/rules/index.md` | Read before applying rules |
| Auto rules | `agent/rules/*.md` with `load: auto` | Load at session start or entry document read |
| Triggered rules | `agent/rules/*.md` with `load: triggered` | Load when the trigger fires |
| Standards | `agent/standards/index.md` | Read on demand |
| Skills | `agent/skills/*/SKILL.md` | Read when task matches the skill |
| Commands | `agent/commands/*.md` | Read when invoking or translating the command |
