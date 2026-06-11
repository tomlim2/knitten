---
status: accepted
---

# HTML-Like Skill Template

Experimental Markdown template for tag-structured skill authoring. This is an
asset for comparison and future parser experiments, not the default skill
authoring style.

## Generated Body

```markdown
---
description: <one sentence trigger-facing summary>
argument-hint: "<mode-or-args>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(node:*)
domains: agent-hub
repo-keys: agent-hub
languages: markdown,json
task-types: authoring,review,implementation
context-profile: <context-profile-id>
context-standards: <comma-separated standards or blank>
context-references: <comma-separated references or blank>
---

# <skill-name>

<skill>
  <purpose>
    Use this skill when <trigger condition>.
  </purpose>

  <inputs>
    <input name="<input>" required="true">
      <meaning>...</meaning>
    </input>
  </inputs>

  <workflow>
    <step order="1">...</step>
    <step order="2">...</step>
    <step order="3">...</step>
  </workflow>

  <outputs>
    <output id="<output-id-or-name>">
      <contract>...</contract>
    </output>
  </outputs>

  <validation>
    <command>...</command>
  </validation>

  <handoff>
    <item>Report changed files.</item>
    <item>Report validation evidence.</item>
    <item>Name any remaining blocker or next owner.</item>
  </handoff>
</skill>
```

## Fill Rules

- Keep this as Markdown with constrained tags, not raw HTML UI.
- Use lowercase tag names.
- Keep tag nesting shallow and predictable.
- Prefer attributes for stable machine fields such as `name`, `required`, and `id`.
- Do not make this the default style until a small usability comparison proves it helps.
