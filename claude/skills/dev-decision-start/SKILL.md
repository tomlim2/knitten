---
description: Ask Gemini, GPT-4o, Opus in parallel with specialized roles, then synthesize into an implementation plan
argument-hint: "<question>"
allowed-tools: Bash(python3:*), Agent, Read
---

# dev-decision-start

Send a question to **Gemini** (Architect), **GPT-4o** (Implementer), and **Opus** (Critic) in parallel with specialized prompts, then synthesize using a structured framework.

## Arguments

- `<question>` - The problem or task to plan for

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-decision-start <question>

## Workflow

### Step 1: Validate
- Check if `$ARGUMENTS` is provided
- Check if `GEMINI_API_KEY` env var exists

### Step 2: Prepare (NO rewrite — send raw question)

1. **Identify the domain** of the question
2. **Craft a one-line role description** for domain context (e.g. "You are a senior ML engineer specializing in transformer optimization.")
3. **Read the three frame files:**
   - `~/.claude/skills/dev-decision-start/frames/architect.md` → ARCHITECT_FRAME
   - `~/.claude/skills/dev-decision-start/frames/implementer.md` → IMPLEMENTER_FRAME
   - `~/.claude/skills/dev-decision-start/frames/critic.md` → CRITIC_FRAME

4. Construct three prompts:
   - **Gemini:** `ROLE + ARCHITECT_FRAME + "\n\nQuestion:\n" + RAW_QUESTION`
   - **GPT-4o:** `ROLE + IMPLEMENTER_FRAME + "\n\nQuestion:\n" + RAW_QUESTION`
   - **Opus:** `ROLE + CRITIC_FRAME + "\n\nQuestion:\n" + RAW_QUESTION`

**Do NOT rewrite the user's question.** Send it as-is. The frames provide the expert framing.

### Step 3: Call all three models in parallel

Launch these three calls **simultaneously** (single message, three tool calls):

#### 3a. Gemini + GPT-4o (Python script)

Run this Python script. Pass the Gemini system prompt as arg1, GPT-4o system prompt as arg2, and the raw question as arg3:

```bash
python3 -c "
import json, urllib.request, sys, os, concurrent.futures

GEMINI_SYSTEM = sys.argv[1]
GPT4O_SYSTEM = sys.argv[2]
QUESTION = sys.argv[3]

def ask_gemini(system, q):
    api_key = os.environ.get('GEMINI_API_KEY', '')
    model = 'gemini-2.5-flash'
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
    body = json.dumps({
        'system_instruction': {'parts': [{'text': system}]},
        'contents': [{'parts': [{'text': q}]}],
        'generationConfig': {'maxOutputTokens': 4096}
    }).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req, timeout=120)
    data = json.loads(res.read())
    parts = data['candidates'][0]['content']['parts']
    text = ''.join(p.get('text', '') for p in parts)
    meta = data.get('usageMetadata', {})
    return text, meta.get('promptTokenCount', 0), meta.get('candidatesTokenCount', 0), model

def ask_github(system, q):
    import subprocess
    token = subprocess.check_output(['gh', 'auth', 'token']).decode().strip()
    model = 'gpt-4o'
    url = 'https://models.inference.ai.azure.com/chat/completions'
    body = json.dumps({
        'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': q}],
        'model': model
    }).encode()
    req = urllib.request.Request(url, data=body, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    })
    res = urllib.request.urlopen(req, timeout=120)
    data = json.loads(res.read())
    text = data['choices'][0]['message']['content']
    usage = data.get('usage', {})
    return text, usage.get('prompt_tokens', 0), usage.get('completion_tokens', 0), model

with concurrent.futures.ThreadPoolExecutor() as ex:
    f_gemini = ex.submit(ask_gemini, GEMINI_SYSTEM, QUESTION)
    f_github = ex.submit(ask_github, GPT4O_SYSTEM, QUESTION)

g_text, g_in, g_out, g_model = f_gemini.result()
o_text, o_in, o_out, o_model = f_github.result()

print('## Gemini (Architect)')
print(f'Model: {g_model} | Tokens: {g_in} in / {g_out} out')
print()
print(g_text)
print()
print('---')
print()
print('## GPT-4o (Implementer)')
print(f'Model: {o_model} | Tokens: {o_in} in / {o_out} out')
print()
print(o_text)

try:
    usage_body = json.dumps({'inputTokens': g_in, 'outputTokens': g_out, 'model': g_model, 'type': 'consult'}).encode()
    usage_req = urllib.request.Request('http://localhost:972/api/gemini-usage', data=usage_body, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(usage_req)
except: pass
" "GEMINI_SYSTEM_HERE" "GPT4O_SYSTEM_HERE" "QUESTION_HERE"
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
