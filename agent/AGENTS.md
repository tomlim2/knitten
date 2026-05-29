# AGENTS.md

Codex deploy entry document. Installed at `~/.codex/AGENTS.md` by `scripts/link-harnesses.mjs`.

First shared-policy read: `SYSTEM.md`.
System terms: [`docs/reference/system-glossary.md`](../docs/reference/system-glossary.md).

## Load Order

1. Read `SYSTEM.md` before any other repository convention.
2. Read `docs/reference/system-glossary.md` when editing system policy, entry documents, plans, manifests, or validators.
3. Read `agent/rules/index.md`.
4. Read every auto rule listed by `agent/rules/index.md`.
5. Read triggered rules, standards, and skills when the task matches them.

## Shared Layer Paths

| Shorthand | Repo path |
|-----------|-----------|
| `rules/` | `agent/rules/` |
| `standards/` | `agent/standards/` |
| `skills/` | `agent/skills/` |

## Codex Adapter

Shared rules, standards, and skills are binding repository conventions for Codex unless they depend on another harness's runtime features.

When a user names a shared skill or the task matches one, read `agent/skills/<name>/SKILL.md` directly even if the Codex runtime does not list it in the native available-skills block.

If a shared instruction uses another harness's mechanics, translate the intent into Codex behavior and follow higher-priority Codex platform instructions.

If frontmatter declares another platform, treat the artifact as reference unless the user asks about that platform or the task edits that artifact.

If frontmatter declares `portability: adapter`, preserve the shared intent and substitute Codex tools, approval flow, and file-read mechanics.

Do not duplicate shared policy here. Put shared policy in `SYSTEM.md` or the owning shared layer.
