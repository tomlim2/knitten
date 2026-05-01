# LOOKUP — caol-ila goal-to-doc

Goal-to-doc lookup. Read this when the question is **"where is X?"** — start here, not by scanning the tree.

For "what exists in this repo?" use [`README.md`](README.md). For the policy stance see [`claude/standards/policy/agent-first-policy.md`](claude/standards/policy/agent-first-policy.md).

---

## Editing or creating an artifact

| Goal | Read in this order |
|------|---------------------|
| Edit any LLM-read doc (rule, standard, skill, command, README) | [`claude/standards/policy/llm-first-docs.md`](claude/standards/policy/llm-first-docs.md) |
| Design a new layer (rule / standard / skill category / validator) | [`claude/standards/policy/agent-first-policy.md`](claude/standards/policy/agent-first-policy.md) |
| Run a structural / garden review | [`claude/standards/policy/garden-review.md`](claude/standards/policy/garden-review.md) |
| Create a new slash command | [`claude/rules/naming.md`](claude/rules/naming.md) → [`claude/rules/command-frontmatter.md`](claude/rules/command-frontmatter.md) → [`claude/standards/authoring/slash-commands.md`](claude/standards/authoring/slash-commands.md) |
| Create a new skill | [`claude/rules/naming.md`](claude/rules/naming.md) → [`claude/standards/authoring/slash-commands.md`](claude/standards/authoring/slash-commands.md) |
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
| Multi-agent dispatch (1호기) | [`claude/rules/multi-agent.md`](claude/rules/multi-agent.md) → [`claude/standards/multi-agent/multi-agent-ops.md`](claude/standards/multi-agent/multi-agent-ops.md) |
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
- Active migration plan: [`docs/plans/migrate-to-llm-first.md`](docs/plans/migrate-to-llm-first.md)
- Vault folder split plan: [`docs/plans/split-vault-folders.md`](docs/plans/split-vault-folders.md)
