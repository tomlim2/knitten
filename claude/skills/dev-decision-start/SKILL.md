---
description: Ask Gemini, Codex, Opus in parallel with specialized roles, then synthesize into an implementation plan
argument-hint: "<question>"
allowed-tools: Bash(python3:*), Agent, Read
---

# dev-decision-start

Send a question to **Gemini** (Architect), **Codex** (Implementer), and **Opus** (Critic) in parallel with specialized prompts, then synthesize using a structured framework.

## Arguments

- `<question>` - The problem or task to plan for

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-decision-start <question>

## Workflow

### Step 1: Validate
- Check if `$ARGUMENTS` is provided
- Check if `gemini` CLI is available (`which gemini`)

### Step 2: Prepare (NO rewrite — send raw question)

1. **Identify the domain** of the question
2. **Craft a one-line role description** for domain context (e.g. "You are a senior ML engineer specializing in transformer optimization.")
3. **Read the three frame files:**
   - `~/.claude/skills/dev-decision-start/frames/architect.md` → ARCHITECT_FRAME
   - `~/.claude/skills/dev-decision-start/frames/implementer.md` → IMPLEMENTER_FRAME
   - `~/.claude/skills/dev-decision-start/frames/critic.md` → CRITIC_FRAME

4. Construct three prompts:
   - **Gemini:** `ROLE + ARCHITECT_FRAME + "\n\nQuestion:\n" + RAW_QUESTION`
   - **Codex:** `ROLE + IMPLEMENTER_FRAME + "\n\nQuestion:\n" + RAW_QUESTION`
   - **Opus:** `ROLE + CRITIC_FRAME + "\n\nQuestion:\n" + RAW_QUESTION`

**Do NOT rewrite the user's question.** Send it as-is. The frames provide the expert framing.

### Step 3: Call all three models in parallel

Launch these three calls **simultaneously** (single message, three tool calls):

#### 3a. Gemini + Codex (Python script)

Run this Python script. Pass the Gemini system prompt as arg1, Codex system prompt as arg2, and the raw question as arg3:

```bash
python3 -c "
import sys, subprocess, concurrent.futures

GEMINI_SYSTEM = sys.argv[1]
CODEX_SYSTEM = sys.argv[2]
QUESTION = sys.argv[3]

def ask_gemini(system, q):
    prompt = system + chr(10) + chr(10) + 'Question:' + chr(10) + q
    result = subprocess.run(
        ['npx', '-y', '@google/gemini-cli', '-p', prompt, '-m', 'gemini-2.5-flash', '-o', 'text'],
        capture_output=True, text=True, timeout=120
    )
    return result.stdout.strip(), 'gemini-2.5-flash'

def ask_codex(system, q):
    prompt = system + chr(10) + chr(10) + 'Question:' + chr(10) + q
    result = subprocess.run(
        ['codex', 'exec', '--full-auto', '--color', 'never', prompt],
        capture_output=True, text=True, timeout=120
    )
    return result.stdout.strip(), 'codex-mini'

with concurrent.futures.ThreadPoolExecutor() as ex:
    f_gemini = ex.submit(ask_gemini, GEMINI_SYSTEM, QUESTION)
    f_codex = ex.submit(ask_codex, CODEX_SYSTEM, QUESTION)

g_text, g_model = f_gemini.result()
c_text, c_model = f_codex.result()

print('## Gemini (Architect)')
print(f'Model: {g_model}')
print()
print(g_text)
print()
print('---')
print()
print('## Codex (Implementer)')
print(f'Model: {c_model}')
print()
print(c_text)
" "GEMINI_SYSTEM_HERE" "CODEX_SYSTEM_HERE" "QUESTION_HERE"
```

#### 3b. Opus (subagent — Critic role)

Launch an Agent tool call **in the same message** as the Python script above, with `model: "opus"`:

```
Agent(
  description: "Opus critic consultation",
  model: "opus",
  prompt: "ROLE + CRITIC_FRAME + \n\nQuestion:\n + RAW_QUESTION + \n\nThis is a read-only consultation. Do NOT use any tools. Just provide your expert analysis directly as text, following the response format exactly."
)
```

### Step 4: Synthesize (Structured Framework)

Read `~/.claude/skills/dev-decision-start/synthesis/framework.md` and follow it exactly.

**Quick reference:**

1. **Agreement Check** — Do all 3 recommendations align? (3/3, 2/3, divergent)
2. **Merge Steps** — Union of unique steps. Flag steps all 3 mentioned (core) vs. only 1 (possible noise)
3. **Risk Rollup** — Collect risks + dissent points, weight by mention count
4. **Output:**

```
## Plan: <one-line title>

### Agreement
[3/3 | 2/3 | divergent] — [where they agreed/disagreed]

### Recommended Approach
1. **Step** — what and why
2. ...

### Watch Out For
- [Risks + dissent points, ranked]

### Open Questions
- [Where models diverged without resolution]

### Alternatives
- [Fallback if main approach fails]
```

**Rules:**
- Do NOT blindly pick the majority — if the critic raises a valid showstopper, surface it
- Do NOT average approaches — pick one and note trade-offs
- Keep the final plan under 30 lines
- **This is where the skill ends.** Present the plan and stop. Do NOT begin implementation.
