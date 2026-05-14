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
| Install caol-ila as Codex global context | [`docs/plans/link-codex-context.md`](docs/plans/link-codex-context.md) |
| Inspect current agent hub manifest | [`AGENT-HUB.md`](AGENT-HUB.md) → [`agent/config/agent-hub.json`](agent/config/agent-hub.json) |
| Route context for domain-specific tasks | [`agent/rules/task-context-routing.md`](agent/rules/task-context-routing.md) → [`AGENT-HUB.md`](AGENT-HUB.md) → [`agent/config/context-routing.json`](agent/config/context-routing.json) |
| Run a structural / garden review | [`agent/standards/policy/garden-review.md`](agent/standards/policy/garden-review.md) |
| Recall why a principle exists | [`agent/standards/policy/principles.md`](agent/standards/policy/principles.md) |
| Name a new rule / standard / command / skill / plan | [`agent/standards/policy/naming.md`](agent/standards/policy/naming.md) |
| Change a managed value, enum, category, or audit threshold | [`docs/plans/harden-system-drift.md`](docs/plans/harden-system-drift.md) → [`agent/config/README.md`](agent/config/README.md) |
| Create a new slash command | [`agent/rules/author.md`](agent/rules/author.md) → [`agent/standards/authoring/slash-commands.md`](agent/standards/authoring/slash-commands.md) |
| Create a new skill | [`agent/skills/caol-make-skill/SKILL.md`](agent/skills/caol-make-skill/SKILL.md) |
| Edit an existing skill | [`agent/skills/caol-edit-skill/SKILL.md`](agent/skills/caol-edit-skill/SKILL.md) |
| Update an existing skill | [`agent/skills/caol-update-skill/SKILL.md`](agent/skills/caol-update-skill/SKILL.md) |
| Delete an existing skill | [`agent/skills/caol-delete-skill/SKILL.md`](agent/skills/caol-delete-skill/SKILL.md) |
| Create a new rule | [`agent/rules/index.md`](agent/rules/index.md) (frontmatter pattern) → [`agent/standards/policy/llm-first-docs.md`](agent/standards/policy/llm-first-docs.md) |
| Create a new standard | [`agent/standards/index.md`](agent/standards/index.md) → [`agent/standards/policy/llm-first-docs.md`](agent/standards/policy/llm-first-docs.md) |
| Tag an Obsidian note | [`agent/skills/obsidian-obsidian-markdown/SKILL.md`](agent/skills/obsidian-obsidian-markdown/SKILL.md) → `references/TAG-TAXONOMY.md` |
| Write an Obsidian note (any folder) | [`agent/skills/obsidian-obsidian-markdown/SKILL.md`](agent/skills/obsidian-obsidian-markdown/SKILL.md) → `references/VAULT-AUDIENCE.md` → `references/OBSIDIAN-FORMAT.md` |
| Write a code review | [`agent/standards/review/review-template.md`](agent/standards/review/review-template.md) → language-specific `review-code-*.md` |

---

## Operating in a repo

| Goal | Read |
|------|------|
| Work in shotloom repo | [`agent/rules/shotloom.md`](agent/rules/shotloom.md) |
| Git op in a CINEV repo | [`agent/rules/cinev-git.md`](agent/rules/cinev-git.md) → [`agent/standards/cinev/cinev-git-workflow.md`](agent/standards/cinev/cinev-git-workflow.md) |
| Validate UE asset names | [`agent/skills/ue-validate-asset-name/SKILL.md`](agent/skills/ue-validate-asset-name/SKILL.md) → `references/UNREAL-ENGINE-ASSET.md` |
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
