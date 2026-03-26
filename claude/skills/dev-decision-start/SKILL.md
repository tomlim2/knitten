---
description: Ask Gemini, GPT-4o, Opus in parallel, then build an implementation plan
argument-hint: "<question>"
allowed-tools: Bash(python3:*)
---

# dev-decision-start

Send a question to **Gemini**, **GPT-4o** (GitHub Models), and **Claude Opus** in parallel, synthesize all three answers, and produce a **step-by-step implementation plan**. The skill ends after presenting the plan — it does NOT execute anything.

Use this when you need to decide on an approach before starting implementation.

## Arguments

- `<question>` - The problem or task to plan for

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-decision-start <question>

## Workflow

### Step 1: Validate
- Check if `$ARGUMENTS` is provided
- Check if `GEMINI_API_KEY` env var exists
- Check if `ANTHROPIC_API_KEY` env var exists

### Step 2: Rewrite the question as a consultation

Before calling the APIs, YOU (Claude) must:

1. **Identify the domain** of the question (e.g. "3D rendering", "database design", "Rust async", "Unreal Engine animation")
2. **Craft a role description** — a senior expert in that specific domain (e.g. "You are a senior 3D graphics engineer with 20+ years of experience in real-time rendering pipelines.")
3. **Rewrite the raw question** into a polished consultation request — as if a mid-level engineer is asking this domain expert for guidance. The rewritten question should:
   - Clearly state the problem context and what has been tried
   - Be respectful and concise, like asking a tech lead you trust
   - End with: "Please suggest an implementation approach with concrete steps."

Use the role description as ROLE_HERE and the rewritten question as QUESTION_HERE in Step 3.

### Step 3: Call all three models in parallel

Run this Python script with the role and rewritten question as arguments:

```bash
python3 -c "
import json, urllib.request, sys, os, concurrent.futures

ROLE = sys.argv[1]
QUESTION = sys.argv[2]

def ask_gemini(role, q):
    api_key = os.environ.get('GEMINI_API_KEY', '')
    model = 'gemini-2.5-flash'
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
    system = role + ' A colleague is asking for your expert guidance on planning an implementation. Give a concrete, step-by-step approach. Be specific and opinionated — do not hedge.'
    body = json.dumps({
        'system_instruction': {'parts': [{'text': system}]},
        'contents': [{'parts': [{'text': q}]}],
        'generationConfig': {'maxOutputTokens': 8192}
    }).encode()
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    parts = data['candidates'][0]['content']['parts']
    text = ''.join(p.get('text', '') for p in parts)
    meta = data.get('usageMetadata', {})
    return text, meta.get('promptTokenCount', 0), meta.get('candidatesTokenCount', 0), model

def ask_github(role, q):
    import subprocess
    token = subprocess.check_output(['gh', 'auth', 'token']).decode().strip()
    model = 'gpt-4o'
    url = 'https://models.inference.ai.azure.com/chat/completions'
    system = role + ' A colleague is asking for your expert guidance on planning an implementation. Give a concrete, step-by-step approach. Be specific and opinionated — do not hedge.'
    body = json.dumps({
        'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': q}],
        'model': model
    }).encode()
    req = urllib.request.Request(url, data=body, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    })
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    text = data['choices'][0]['message']['content']
    usage = data.get('usage', {})
    return text, usage.get('prompt_tokens', 0), usage.get('completion_tokens', 0), model

def ask_opus(role, q):
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    model = 'claude-opus-4-20250514'
    url = 'https://api.anthropic.com/v1/messages'
    system = role + ' A colleague is asking for your expert guidance on planning an implementation. Give a concrete, step-by-step approach. Be specific and opinionated — do not hedge.'
    body = json.dumps({
        'model': model,
        'max_tokens': 8192,
        'system': system,
        'messages': [{'role': 'user', 'content': q}]
    }).encode()
    req = urllib.request.Request(url, data=body, headers={
        'Content-Type': 'application/json',
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01'
    })
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    text = ''.join(b.get('text', '') for b in data['content'] if b['type'] == 'text')
    usage = data.get('usage', {})
    return text, usage.get('input_tokens', 0), usage.get('output_tokens', 0), model

with concurrent.futures.ThreadPoolExecutor() as ex:
    f_gemini = ex.submit(ask_gemini, ROLE, QUESTION)
    f_github = ex.submit(ask_github, ROLE, QUESTION)
    f_opus = ex.submit(ask_opus, ROLE, QUESTION)

g_text, g_in, g_out, g_model = f_gemini.result()
o_text, o_in, o_out, o_model = f_github.result()
a_text, a_in, a_out, a_model = f_opus.result()

print('## Gemini Response')
print(f'Model: {g_model} | Tokens: {g_in} in / {g_out} out')
print()
print(g_text)
print()
print('---')
print()
print('## GPT-4o Response')
print(f'Model: {o_model} | Tokens: {o_in} in / {o_out} out')
print()
print(o_text)
print()
print('---')
print()
print('## Opus Response')
print(f'Model: {a_model} | Tokens: {a_in} in / {a_out} out')
print()
print(a_text)

try:
    usage_body = json.dumps({'inputTokens': g_in, 'outputTokens': g_out, 'model': g_model, 'type': 'consult'}).encode()
    usage_req = urllib.request.Request('http://localhost:972/api/gemini-usage', data=usage_body, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(usage_req)
except: pass
" "ROLE_HERE" "QUESTION_HERE"
```

Replace ROLE_HERE with the role description and QUESTION_HERE with the rewritten question from Step 2.

### Step 4: Synthesize into a Plan (Claude's job)

After receiving all three responses, YOU (Claude) must synthesize them into a single implementation plan. Do NOT blindly adopt any answer — be the critical judge.

Present the plan in this format:

```
## Plan: <one-line title>

### Context
<1-2 sentences on the problem and key constraints>

### Approach
<Which strategy was chosen and why, noting where the models agreed/disagreed>

### Steps
1. **Step title** — what to do and why
2. **Step title** — what to do and why
3. ...

### Risks
- <potential issue and mitigation>

### Alternatives
- <fallback approach if the main plan doesn't work>
```

**This is where the skill ends.** Present the plan and stop. Do NOT begin implementation.
