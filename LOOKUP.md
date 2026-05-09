# LOOKUP — caol-ila goal-to-doc

Goal-to-doc lookup. Read this when the question is **"where is X?"** — start here, not by scanning the tree.

For "what exists in this repo?" use [`README.md`](README.md). For system terms see [`docs/reference/system-glossary.md`](docs/reference/system-glossary.md). For the policy stance see [`claude/standards/policy/llm-first-policy.md`](claude/standards/policy/llm-first-policy.md).

---

## Editing or creating an artifact

| Goal | Read in this order |
|------|---------------------|
| Look up canonical system terminology | [`docs/reference/system-glossary.md`](docs/reference/system-glossary.md) |
| Edit any LLM-read doc (rule, standard, skill, command, README) | [`claude/standards/policy/llm-first-docs.md`](claude/standards/policy/llm-first-docs.md) |
| Design a new layer (rule / standard / skill category / validator) | [`claude/standards/policy/llm-first-policy.md`](claude/standards/policy/llm-first-policy.md) |
| Explain why platform-neutral entry documents use canonical policy | [`docs/decisions/0001-platform-neutral-agent-system.md`](docs/decisions/0001-platform-neutral-agent-system.md) |
| Design caol-ila as an agent hub | [`docs/plans/agent-hub.md`](docs/plans/agent-hub.md) |
| Inspect current agent hub manifest | [`AGENT-HUB.md`](AGENT-HUB.md) → [`claude/config/agent-hub.json`](claude/config/agent-hub.json) |
| Run a structural / garden review | [`claude/standards/policy/garden-review.md`](claude/standards/policy/garden-review.md) |
| Recall why a principle exists | [`claude/standards/policy/principles.md`](claude/standards/policy/principles.md) |
| Name a new rule / standard / command / skill / plan | [`claude/standards/policy/naming.md`](claude/standards/policy/naming.md) |
| Change a managed value, enum, category, or audit threshold | [`docs/plans/harden-system-drift.md`](docs/plans/harden-system-drift.md) → [`claude/config/README.md`](claude/config/README.md) |
| Create a new slash command | [`claude/rules/author-naming.md`](claude/rules/author-naming.md) → [`claude/rules/author-frontmatter.md`](claude/rules/author-frontmatter.md) → [`claude/standards/authoring/slash-commands.md`](claude/standards/authoring/slash-commands.md) |
| Create a new skill | [`claude/rules/author-naming.md`](claude/rules/author-naming.md) → [`claude/standards/authoring/slash-commands.md`](claude/standards/authoring/slash-commands.md) |
| Create a new rule | [`claude/rules/index.md`](claude/rules/index.md) (frontmatter pattern) → [`claude/standards/policy/llm-first-docs.md`](claude/standards/policy/llm-first-docs.md) |
| Create a new standard | [`claude/standards/index.md`](claude/standards/index.md) → [`claude/standards/policy/llm-first-docs.md`](claude/standards/policy/llm-first-docs.md) |
| Tag an Obsidian note | [`claude/standards/obsidian/obsidian-tag-taxonomy.md`](claude/standards/obsidian/obsidian-tag-taxonomy.md) |
| Write an Obsidian note (any folder) | [`claude/standards/obsidian/vault-audience.md`](claude/standards/obsidian/vault-audience.md) → [`claude/rules/obsidian.md`](claude/rules/obsidian.md) → [`claude/standards/obsidian/obsidian-format.md`](claude/standards/obsidian/obsidian-format.md) |
| Write a code review | [`claude/standards/review/review-template.md`](claude/standards/review/review-template.md) → language-specific `review-code-*.md` |

---

## Operating in a repo

| Goal | Read |
|------|------|
| Work in shotloom repo | [`claude/rules/shotloom.md`](claude/rules/shotloom.md) |
| Git op in a CINEV repo | [`claude/rules/cinev-git.md`](claude/rules/cinev-git.md) → [`claude/standards/cinev/cinev-git-workflow.md`](claude/standards/cinev/cinev-git-workflow.md) |
| Set up a new machine | [`README.md`](README.md) "Setup" section |
| Resolve a doc storage path | `claude/skills/caol-resolve-doc-path/SKILL.md` |

---

## Reviewing

| Goal | Read |
|------|------|
| Review JS / CSS code | [`claude/standards/review/review-code-javascript.md`](claude/standards/review/review-code-javascript.md), [`claude/standards/review/review-code-css.md`](claude/standards/review/review-code-css.md) |
| Review UE C++ / Python | [`claude/standards/review/review-code-unreal-cpp.md`](claude/standards/review/review-code-unreal-cpp.md), [`claude/standards/review/review-code-unreal-python.md`](claude/standards/review/review-code-unreal-python.md) |
| Review TSL shaders | [`claude/standards/review/review-code-tsl.md`](claude/standards/review/review-code-tsl.md) |
| Review UX / UX writing | [`claude/standards/review/review-ux.md`](claude/standards/review/review-ux.md), [`claude/standards/review/review-ux-writing.md`](claude/standards/review/review-ux-writing.md) |
| Review AI motion (FBX) | [`claude/standards/review/review-ai-motion.md`](claude/standards/review/review-ai-motion.md) |
| Review 3D rendering | [`claude/standards/review/review-3d-rendering.md`](claude/standards/review/review-3d-rendering.md) |
| Review a spec doc | [`claude/standards/review/review-spec-doc.md`](claude/standards/review/review-spec-doc.md) |

---

## Reference (raw lookup)

- All commands: [`claude/commands/`](claude/commands/)
- All skills: [`claude/skills/`](claude/skills/)
- All standards: [`claude/standards/index.md`](claude/standards/index.md)
- All rules: [`claude/rules/index.md`](claude/rules/index.md)
- System glossary: [`docs/reference/system-glossary.md`](docs/reference/system-glossary.md)
- Agent hub overview: [`AGENT-HUB.md`](AGENT-HUB.md)
- Completed LLM-first migration plan: [`docs/plans/migrate-to-llm-first.md`](docs/plans/migrate-to-llm-first.md)
- Agent hub plan: [`docs/plans/agent-hub.md`](docs/plans/agent-hub.md)
- Vault folder split plan: [`docs/plans/split-vault-folders.md`](docs/plans/split-vault-folders.md)
