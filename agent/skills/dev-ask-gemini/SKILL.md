---
description: Ask Gemini AI a question
argument-hint: "<question>"
allowed-tools: Bash(npx:*)
---

# dev-ask-gemini

Ask Gemini a question via CLI and return the response.

## Arguments

- `<question>` - The question to ask Gemini

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-ask-gemini <question>

## Workflow

### Step 1: Validate
- Check if `$ARGUMENTS` is provided

### Step 2: Call Gemini CLI

```bash
npx -y @google/gemini-cli -p "QUESTION_HERE" -m gemini-2.5-flash -o text
```

Replace QUESTION_HERE with the user's question from $ARGUMENTS.

**Notes:**
- Uses `npx -y @google/gemini-cli` (no global install needed)
- `-m gemini-2.5-flash` for fast responses. Use `-m gemini-2.5-pro` for deeper analysis
- `-o text` for plain text output
- Auth: Google account via browser login on first use

### Step 3: Show Response
- Display the CLI output directly
