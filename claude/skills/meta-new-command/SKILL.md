# meta-new-command

**Version:** 0.1.0

Command and skill creation generator for Claude Code with comprehensive naming rules.

---

## Changelog

- **0.1.0** - Initial release with naming convention rules

---

## Purpose

This skill helps create new Claude Code commands and skills following the standardized naming convention and structure. It serves as the authoritative rulebook for command/skill creation.

---

## Naming Convention

**MANDATORY: All commands and skills MUST follow this pattern.**

```
{category}-{verb}-{subject}
```

### Pattern Structure

Each name consists of three parts separated by hyphens:

1. **`category`**: Domain or project namespace
   - Lowercase, single word
   - Groups related functionality
   - Examples: `git`, `tutoring`, `cinev`, `ue`, `learn`, `art`, `meta`

2. **`verb`**: Action performed
   - Present tense, active voice
   - Describes what the command does
   - Examples: `make`, `collect`, `open`, `add`, `move`, `analyze`, `validate`, `create`, `new`

3. **`subject`**: Target object or resource
   - Noun or noun phrase (use hyphen for multi-word)
   - What the verb acts upon
   - Examples: `message`, `commits`, `invoice`, `log`, `material`, `creator-launcher`, `command`, `skill`

---

## Naming Rules

1. **Always use lowercase** - No capitals, no camelCase
2. **Use hyphens as separators** - Never underscores or spaces
3. **Be specific** - `tutoring-open-invoice` not just `open-invoice`
4. **Be consistent** - Same category for related commands
5. **Keep verbs simple** - `make` not `generate`, `add` not `append`
6. **Avoid redundancy** - `git-make-message` not `git-make-commit-message`
7. **Multi-word subjects** - Use hyphens: `creator-launcher`, `asset-name`

---

## Standard Categories

### Project-Specific

- **`cinev-*`**: CINEV project tools (creator, shipper, downloader, review)
  - Example: `cinev-open-creator-launcher`, `cinev-review-cpp`, `cinev-zo-downloader`

- **`ue-*`**: Unreal Engine tools (analyze, validate, export, new)
  - Example: `ue-analyze-material`, `ue-validate-asset-name`, `ue-new-skill`

- **`art-*`**: Art branch workflows (create, prepare, merge, send)
  - Example: `art-create-branch`, `art-send-notice`, `art-prepare-merge`

### Domain-Specific

- **`git-*`**: Git operations (commits, messages, branches, diffs)
  - Example: `git-collect-commits`, `git-make-message`

- **`tutoring-*`**: Tutoring business operations (invoices, logs, payments)
  - Example: `tutoring-open-invoice`, `tutoring-move-invoice`, `tutoring-log`, `tutoring-paid`

- **`learn-*`**: Learning and documentation (add, browse, export)
  - Example: `learn-add-log`

- **`drink-*`**: Drink tracking (wine, whisky)
  - Example: `drink-log`

### Meta-System

- **`meta-*`**: System tools for creating/managing commands and skills
  - Example: `meta-new-command`, `meta-new-skill`

- **`review-*`**: Code and skill review tools
  - Example: `review-skills`

### General (Special Cases)

- **`clean-up`**: Maintenance and housekeeping (standalone, no verb-subject split)
- **`design-sync`**: Design system sync (standalone)
- **`explore`**: Codebase exploration (standalone verb)
- **`consult`**: Read-only analysis (standalone verb)
- **`research`**: Deep web research (standalone verb)
- **`ultrawork`**: Maximum intensity mode (standalone concept)
- **`spec`**: Generate specification (standalone)
- **`site-map`**: Generate site map (standalone)
- **`bug-fix`**: Fix bugs with test-first pattern (standalone)

---

## Examples by Category

| Command | Category | Verb | Subject | Purpose |
|---------|----------|------|---------|---------|
| `git-collect-commits` | git | collect | commits | Extract commit history |
| `git-make-message` | git | make | message | Generate commit message |
| `tutoring-open-invoice` | tutoring | open | invoice | Open invoice generator |
| `tutoring-move-invoice` | tutoring | move | invoice | Move PDF to storage |
| `tutoring-invoice-kakaotalk` | tutoring | invoice | kakaotalk | Generate KakaoTalk message |
| `tutoring-log` | tutoring | log | (implicit) | Log tutoring lesson |
| `tutoring-paid` | tutoring | paid | (implicit) | Mark lessons as paid |
| `learn-add-log` | learn | add | log | Add learning entry |
| `cinev-open-creator-launcher` | cinev | open | creator-launcher | Open CINEV launcher |
| `cinev-open-creator-shipper` | cinev | open | creator-shipper | Open CINEV shipper |
| `cinev-review-cpp` | cinev | review | cpp | Review C++ code |
| `cinev-zo-downloader` | cinev | zo | downloader | Open ZO downloader |
| `ue-analyze-material` | ue | analyze | material | Analyze UE material |
| `ue-validate-asset-name` | ue | validate | asset-name | Validate UE naming |
| `ue-new-skill` | ue | new | skill | Generate UE skill |
| `art-create-branch` | art | create | branch | Create art branch |
| `art-send-notice` | art | send | notice | Send Slack notice |
| `art-send-merge-notice` | art | send | merge-notice | Send merge notice |
| `art-send-merge-result` | art | send | merge-result | Send merge result |
| `art-prepare-merge` | art | prepare | merge | Prepare art merge |
| `art-remove-branch` | art | remove | branch | Remove old art branch |
| `meta-new-command` | meta | new | command | Generate new command |
| `review-skills` | review | skills | (implicit) | Review skill files |
| `drink-log` | drink | log | (implicit) | Log wine/whisky |

---

## Command File Structure

### Frontmatter (YAML)

**Standard field order:**
1. `description` - One-line summary
2. `argument-hint` - Argument placeholder (optional)
3. `allowed-tools` - Tool whitelist

```yaml
---
description: Brief description of what this command does
argument-hint: "<required_arg> [optional_arg]"
allowed-tools: Read, Write, Bash(git:*), Grep
---
```

### Frontmatter Rules

**F1. Field Order**
- Must follow: `description` → `argument-hint` → `allowed-tools`

**F2. Bash Specificity**
- NEVER use bare `Bash`
- ALWAYS use specific patterns:
  - `Bash(git:*)` - Git commands
  - `Bash(python:*)` - Python scripts
  - `Bash(open:*)` - App launchers
  - `Bash(mv:*), Bash(ls:*)` - File operations
  - `Bash(mkdir:*)` - Directory creation
  - `Bash(npm:*)` - NPM commands

**F3. Argument Hint**
- Include if command accepts arguments
- Use `<required>` and `[optional]` notation

**F4. Heading Structure**
- H1 = Title
- H2+ = Sections (Arguments, Execution, Output, etc.)

### Content Rules

**C1. Missing-Argument Guard**
- If command uses `$ARGUMENTS`, must include guard:
```markdown
**If no argument is provided, show usage and ask the user. NEVER auto-execute.**
```

**C2. Usage Example**
- Show how to invoke the command:
```markdown
Usage: /command-name <argument>
```

**C3. Output Structure**
- Define what the command outputs/produces

**C4. Multi-Step Workflows**
- Use numbered steps for clear execution flow

### Compatibility Rules

**X1. Valid Shell Commands**
- `!backtick` expressions must be valid shell commands

**X2. Argument Syntax**
- Use `$ARGUMENTS` (preferred) or `{{input}}` (for Handlebars)
- Don't mix both

**X3. External References**
- File references must point to existing files

---

## Skills Directory Structure

```
skills/{category}-{verb}-{subject}/
├── SKILL.md              # Skill documentation
├── script.py             # Main implementation
└── config.json           # Optional configuration
```

### SKILL.md Structure

```markdown
# {category}-{verb}-{subject}

**Version:** 0.1.0

Brief description of what this skill does.

---

## Changelog

- **0.1.0** - Initial release

---

## Purpose

Detailed explanation of what this skill does and why it exists.

---

## Usage

How to use this skill, with examples.

---

## Files

- `script.py` - Description of main script
- `config.json` - Description of config (if applicable)
```

---

## Common Mistakes to Avoid

❌ **Wrong:**
- `open-invoice` - Missing category
- `TutoringInvoice` - Uses camelCase
- `tutoring_open_invoice` - Uses underscores
- `tutoring-generate-invoice` - Verb too complex (use `make` or `create`)
- `git-commit-message` - Missing verb
- `Bash` in allowed-tools - Not specific enough

✅ **Correct:**
- `tutoring-open-invoice` - Has category, verb, subject
- `tutoring-open-invoice` - Lowercase with hyphens
- `tutoring-open-invoice` - Uses hyphens
- `tutoring-make-invoice` - Simple verb
- `git-make-message` - Has verb
- `Bash(git:*)` - Specific pattern

---

## Creation Workflow

### For Commands

1. **Identify domain/project** → Choose category
2. **Identify action** → Choose verb
3. **Identify target** → Choose subject
4. **Combine**: `{category}-{verb}-{subject}`
5. **Create file**: `commands/{category}-{verb}-{subject}.md`
6. **Write frontmatter**: description → argument-hint → allowed-tools
7. **Add content**: Title, Arguments, Execution, Examples
8. **Include guard**: If using `$ARGUMENTS`
9. **Test**: Verify command works as expected

### For Skills

1. **Follow same naming pattern** for directory
2. **Create**: `skills/{category}-{verb}-{subject}/`
3. **Write SKILL.md**: Version, changelog, purpose, usage, files
4. **Implement scripts**: With descriptive filenames
5. **Add config** (if needed)
6. **Document dependencies**: In SKILL.md
7. **Test**: Verify skill works standalone

---

## Why This Convention?

1. **Discoverability**
   - Type category prefix to see all related commands
   - `/tutoring-` shows all tutoring commands
   - `/git-` shows all git commands
   - `/ue-` shows all Unreal Engine tools

2. **Consistency**
   - Clear pattern for creating new commands
   - No guessing about naming
   - Enforces structure

3. **Namespace Isolation**
   - Prevents command name collisions
   - `tutoring-open-invoice` vs `cinev-open-creator-launcher`
   - Both "open" something but clearly different

4. **Self-Documenting**
   - Name reveals purpose at a glance
   - `git-collect-commits` = collects git commits
   - `ue-validate-asset-name` = validates UE asset naming

5. **Scalability**
   - Easy to add new categories as projects grow
   - Add new project → Add new category prefix
   - All commands grouped logically

---

## Related Files

- `commands/meta-new-command.md` - Command wrapper for this skill
- `CLAUDE.md` - Main workflow guidance (points to this skill)
