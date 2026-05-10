# LOOKUP — caol-ila goal-to-doc

Goal-to-doc lookup. Read this when the question is **"where is X?"** — start here, not by scanning the tree.

For "what exists in this repo?" use [`README.md`](README.md). For system terms see [`docs/reference/system-glossary.md`](docs/reference/system-glossary.md). For the policy stance see [`agent/standards/policy/llm-first-policy.md`](agent/standards/policy/llm-first-policy.md).

---

## Editing or creating an artifact

| Goal | Read in this order |
|------|---------------------|
| Look up canonical system terminology | [`docs/reference/system-glossary.md`](docs/reference/system-glossary.md) |
| Edit any LLM-read doc (rule, standard, skill, command, README) | [`agent/standards/policy/llm-first-docs.md`](agent/standards/policy/llm-first-docs.md) |
| Design a new layer (rule / standard / skill category / validator) | [`agent/standards/policy/llm-first-policy.md`](agent/standards/policy/llm-first-policy.md) |
| Explain why platform-neutral entry documents use canonical policy | [`docs/decisions/0001-platform-neutral-agent-system.md`](docs/decisions/0001-platform-neutral-agent-system.md) |
| Design caol-ila as an agent hub | [`docs/plans/agent-hub.md`](docs/plans/agent-hub.md) |
| Inspect current agent hub manifest | [`AGENT-HUB.md`](AGENT-HUB.md) → [`agent/config/agent-hub.json`](agent/config/agent-hub.json) |
| Route context for domain-specific tasks | [`agent/rules/task-context-routing.md`](agent/rules/task-context-routing.md) → [`AGENT-HUB.md`](AGENT-HUB.md) → [`agent/config/context-routing.json`](agent/config/context-routing.json) |
| Run a structural / garden review | [`agent/standards/policy/garden-review.md`](agent/standards/policy/garden-review.md) |
| Recall why a principle exists | [`agent/standards/policy/principles.md`](agent/standards/policy/principles.md) |
| Name a new rule / standard / command / skill / plan | [`agent/standards/policy/naming.md`](agent/standards/policy/naming.md) |
| Change a managed value, enum, category, or audit threshold | [`docs/plans/harden-system-drift.md`](docs/plans/harden-system-drift.md) → [`agent/config/README.md`](agent/config/README.md) |
| Create a new slash command | [`agent/rules/author-naming.md`](agent/rules/author-naming.md) → [`agent/rules/author-frontmatter.md`](agent/rules/author-frontmatter.md) → [`agent/standards/authoring/slash-commands.md`](agent/standards/authoring/slash-commands.md) |
| Create a new skill | [`agent/rules/author-naming.md`](agent/rules/author-naming.md) → [`agent/standards/authoring/slash-commands.md`](agent/standards/authoring/slash-commands.md) |
| Create a new rule | [`agent/rules/index.md`](agent/rules/index.md) (frontmatter pattern) → [`agent/standards/policy/llm-first-docs.md`](agent/standards/policy/llm-first-docs.md) |
| Create a new standard | [`agent/standards/index.md`](agent/standards/index.md) → [`agent/standards/policy/llm-first-docs.md`](agent/standards/policy/llm-first-docs.md) |
| Tag an Obsidian note | [`agent/standards/obsidian/obsidian-tag-taxonomy.md`](agent/standards/obsidian/obsidian-tag-taxonomy.md) |
| Write an Obsidian note (any folder) | [`agent/standards/obsidian/vault-audience.md`](agent/standards/obsidian/vault-audience.md) → [`agent/rules/obsidian.md`](agent/rules/obsidian.md) → [`agent/standards/obsidian/obsidian-format.md`](agent/standards/obsidian/obsidian-format.md) |
| Write a code review | [`agent/standards/review/review-template.md`](agent/standards/review/review-template.md) → language-specific `review-code-*.md` |

---

## Operating in a repo

| Goal | Read |
|------|------|
| Work in shotloom repo | [`agent/rules/shotloom.md`](agent/rules/shotloom.md) |
| Git op in a CINEV repo | [`agent/rules/cinev-git.md`](agent/rules/cinev-git.md) → [`agent/standards/cinev/cinev-git-workflow.md`](agent/standards/cinev/cinev-git-workflow.md) |
| Set up a new machine | [`README.md`](README.md) "Setup" section |
| Resolve a doc storage path | `agent/skills/caol-resolve-doc-path/SKILL.md` |

---

## Reviewing

| Goal | Read |
|------|------|
| Review JS / CSS code | [`agent/standards/review/review-code-javascript.md`](agent/standards/review/review-code-javascript.md), [`agent/standards/review/review-code-css.md`](agent/standards/review/review-code-css.md) |
| Review UE C++ / Python | [`agent/standards/review/review-code-unreal-cpp.md`](agent/standards/review/review-code-unreal-cpp.md), [`agent/standards/review/review-code-unreal-python.md`](agent/standards/review/review-code-unreal-python.md) |
| Review TSL shaders | [`agent/standards/review/review-code-tsl.md`](agent/standards/review/review-code-tsl.md) |
| Review UX / UX writing | [`agent/standards/review/review-ux.md`](agent/standards/review/review-ux.md), [`agent/standards/review/review-ux-writing.md`](agent/standards/review/review-ux-writing.md) |
| Review AI motion (FBX) | [`agent/standards/review/review-ai-motion.md`](agent/standards/review/review-ai-motion.md) |
| Review 3D rendering | [`agent/standards/review/review-3d-rendering.md`](agent/standards/review/review-3d-rendering.md) |
| Review a spec doc | [`agent/standards/review/review-spec-doc.md`](agent/standards/review/review-spec-doc.md) |

---

## Reference (raw lookup)

- All commands: [`agent/commands/`](agent/commands/)
- All skills: [`agent/skills/`](agent/skills/)
- All standards: [`agent/standards/index.md`](agent/standards/index.md)
- All rules: [`agent/rules/index.md`](agent/rules/index.md)
- System glossary: [`docs/reference/system-glossary.md`](docs/reference/system-glossary.md)
- Agent hub overview: [`AGENT-HUB.md`](AGENT-HUB.md)
- Task context routing rule: [`agent/rules/task-context-routing.md`](agent/rules/task-context-routing.md)
- Task context routing plan: [`docs/plans/task-context-routing.md`](docs/plans/task-context-routing.md)
- Completed LLM-first migration plan: [`docs/plans/migrate-to-llm-first.md`](docs/plans/migrate-to-llm-first.md)
- Agent hub plan: [`docs/plans/agent-hub.md`](docs/plans/agent-hub.md)
- Vault folder split plan: [`docs/plans/split-vault-folders.md`](docs/plans/split-vault-folders.md)
