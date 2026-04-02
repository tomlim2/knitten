---
description: Ask OpenAI Codex a question
argument-hint: "<question>"
allowed-tools: Bash(codex:*)
---

# dev-ask-codex

Ask Codex a question via CLI and return the response. Uses locally installed `codex` CLI.

## Arguments

- `<question>` - The question to ask Codex

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-ask-codex <question>

## Workflow

### Step 1: Validate
- Check if `$ARGUMENTS` is provided
- Check if `codex` CLI is available (`which codex`)

### Step 2: Call Codex CLI

```bash
codex exec --full-auto --color never "QUESTION_HERE"
```

Replace QUESTION_HERE with the user's question from $ARGUMENTS.

### Step 3: Show Response
- Display the CLI output directly
