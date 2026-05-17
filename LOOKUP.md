# LOOKUP — agent-hub goal-to-doc

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
| Design the agent-hub | [`docs/plans/completed/agent-hub.md`](docs/plans/completed/agent-hub.md) |
| Install the agent-hub as Codex global context | [`docs/plans/completed/link-codex-context.md`](docs/plans/completed/link-codex-context.md) |
| Inspect current agent hub manifest | [`AGENT-HUB.md`](AGENT-HUB.md) → [`agent/config/agent-hub.json`](agent/config/agent-hub.json) |
| Route context for domain-specific tasks | [`agent/rules/task-context-routing.md`](agent/rules/task-context-routing.md) → [`AGENT-HUB.md`](AGENT-HUB.md) → [`agent/config/context-routing.json`](agent/config/context-routing.json) |
| Run a structural / garden review | [`agent/standards/policy/garden-review.md`](agent/standards/policy/garden-review.md) |
| Recall why a principle exists | [`agent/standards/policy/principles.md`](agent/standards/policy/principles.md) |
| Name a new rule / standard / command / skill / plan | [`agent/standards/policy/naming.md`](agent/standards/policy/naming.md) |
| Change a managed value, enum, category, or audit threshold | [`docs/plans/completed/harden-system-drift.md`](docs/plans/completed/harden-system-drift.md) → [`agent/config/README.md`](agent/config/README.md) |
| Route CRUD for skill / rule / standard / command / plan artifacts | [`agent/skills/ah-manage-artifact/SKILL.md`](agent/skills/ah-manage-artifact/SKILL.md) |
| Create a new slash command | [`agent/skills/ah-make-command/SKILL.md`](agent/skills/ah-make-command/SKILL.md) → `references/SLASH-COMMANDS.md` |
| Create a new skill | [`agent/skills/ah-make-skill/SKILL.md`](agent/skills/ah-make-skill/SKILL.md) |
| Edit an existing skill | [`agent/skills/ah-edit-skill/SKILL.md`](agent/skills/ah-edit-skill/SKILL.md) |
| Update an existing skill | [`agent/skills/ah-update-skill/SKILL.md`](agent/skills/ah-update-skill/SKILL.md) |
| Delete an existing skill | [`agent/skills/ah-delete-skill/SKILL.md`](agent/skills/ah-delete-skill/SKILL.md) |
| Create a new rule | [`agent/rules/index.md`](agent/rules/index.md) (frontmatter pattern) → [`agent/standards/policy/llm-first-docs.md`](agent/standards/policy/llm-first-docs.md) |
| Create a new standard | [`agent/standards/index.md`](agent/standards/index.md) → [`agent/standards/policy/llm-first-docs.md`](agent/standards/policy/llm-first-docs.md) |
| Tag an Obsidian note | [`agent/skills/obsidian-obsidian-markdown/SKILL.md`](agent/skills/obsidian-obsidian-markdown/SKILL.md) → `references/TAG-TAXONOMY.md` |
| Write an Obsidian note (any folder) | [`agent/skills/obsidian-obsidian-markdown/SKILL.md`](agent/skills/obsidian-obsidian-markdown/SKILL.md) → `references/VAULT-AUDIENCE.md` → `references/OBSIDIAN-FORMAT.md` |
| Write a code review | [`agent/standards/review/review-template.md`](agent/standards/review/review-template.md) → relevant `review-audit-*` skill reference |

---

## Operating in a repo

| Goal | Read |
|------|------|
| Work in shotloom repo | [`agent/rules/shotloom.md`](agent/rules/shotloom.md) |
| Git op in a CINEV repo | [`agent/rules/cinev-git.md`](agent/rules/cinev-git.md) → [`agent/skills/cci-manage-art-branch/SKILL.md`](agent/skills/cci-manage-art-branch/SKILL.md) → `references/CINEV-GIT-WORKFLOW.md` |
| Validate UE asset names | [`agent/skills/ue-validate-asset-name/SKILL.md`](agent/skills/ue-validate-asset-name/SKILL.md) → `references/UNREAL-ENGINE-ASSET.md` |
| Set up a new machine | [`README.md`](README.md) "Setup" section |
| Resolve a doc storage path | `agent/skills/ah-resolve-doc-path/SKILL.md` |

---

## Reviewing

| Goal | Read |
|------|------|
| Review JS / CSS code | [`agent/skills/review-audit-web/SKILL.md`](agent/skills/review-audit-web/SKILL.md) → `references/REVIEW-CODE-JAVASCRIPT.md` or `references/REVIEW-CODE-CSS.md` |
| Review UE C++ / Python | [`agent/standards/review/review-code-unreal-cpp.md`](agent/standards/review/review-code-unreal-cpp.md), [`agent/standards/review/review-code-unreal-python.md`](agent/standards/review/review-code-unreal-python.md) |
| Review TSL shaders | [`agent/skills/review-audit-3d/SKILL.md`](agent/skills/review-audit-3d/SKILL.md) → `references/REVIEW-CODE-TSL.md` |
| Review UX / UX writing | [`agent/skills/review-audit-ux/SKILL.md`](agent/skills/review-audit-ux/SKILL.md) → `references/REVIEW-UX.md` or `references/REVIEW-UX-WRITING.md` |
| Review AI motion (FBX) | [`agent/skills/review-audit-ai-motion/SKILL.md`](agent/skills/review-audit-ai-motion/SKILL.md) → `references/REVIEW-AI-MOTION.md` |
| Review 3D rendering | [`agent/skills/review-audit-3d/SKILL.md`](agent/skills/review-audit-3d/SKILL.md) → `references/REVIEW-3D-RENDERING.md` |
| Review a spec doc | [`agent/skills/review-audit-web-spec/SKILL.md`](agent/skills/review-audit-web-spec/SKILL.md) → `references/REVIEW-SPEC-DOC.md` |

---

## Reference (raw lookup)

- All commands: [`agent/commands/`](agent/commands)
- All skills: [`agent/skills/`](agent/skills)
- All standards: [`agent/standards/index.md`](agent/standards/index.md)
- All rules: [`agent/rules/index.md`](agent/rules/index.md)
- System glossary: [`docs/reference/system-glossary.md`](docs/reference/system-glossary.md)
- Agent hub overview: [`AGENT-HUB.md`](AGENT-HUB.md)
- Task context routing rule: [`agent/rules/task-context-routing.md`](agent/rules/task-context-routing.md)
- Task context routing plan: [`docs/plans/completed/task-context-routing.md`](docs/plans/completed/task-context-routing.md)
- Completed LLM-first migration plan: [`docs/plans/completed/migrate-to-llm-first.md`](docs/plans/completed/migrate-to-llm-first.md)
- Agent hub plan: [`docs/plans/completed/agent-hub.md`](docs/plans/completed/agent-hub.md)
- Vault folder split plan: [`docs/plans/completed/split-vault-folders.md`](docs/plans/completed/split-vault-folders.md)
