---
description: Ask Gemini AI a question
argument-hint: "<question>"
allowed-tools: Bash(gemini:*)
---

# dev-ask-gemini

Ask Gemini a question via CLI and return the response. Uses locally installed `gemini` CLI with Google account auth (Pro subscription).

## Arguments

- `<question>` - The question to ask Gemini

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-ask-gemini <question>

## Workflow

### Step 1: Validate
- Check if `$ARGUMENTS` is provided
- Check if `gemini` CLI is available (`which gemini`)

### Step 2: Call Gemini CLI

```bash
gemini -p "QUESTION_HERE" -m gemini-2.5-flash -o text
```

Replace QUESTION_HERE with the user's question from $ARGUMENTS.

### Step 3: Show Response
- Display the CLI output directly
