---
description: Ask Gemini and GPT-4o in parallel, then synthesize
argument-hint: "<question>"
allowed-tools: Bash(python3:*)
---

# dev-consult-models

Send a question to **Gemini** and **GPT-4o** (GitHub Models) in parallel, then critically compare both answers to produce actionable approaches.

Use this when you're stuck in a loop or need a second/third opinion on a technical problem.

## Arguments

- `<question>` - The question or problem description to consult on

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-consult-models <question>

## Workflow

### Step 1: Validate
- Check if `$ARGUMENTS` is provided
- Check if `GEMINI_API_KEY` env var exists

### Step 2: Rewrite the question as a consultation

Before calling the APIs, YOU (Claude) must rewrite the raw question into a **polished consultation request** — as if a mid-level engineer is asking a respected senior expert for guidance. The rewritten question should:

- Clearly state the problem context and what has been tried
- Be respectful and concise, like asking a tech lead you trust
- End with a specific, actionable question

Use this rewritten question as the QUESTION_HERE in Step 3.

### Step 3: Call both models in parallel

Run this Python script with the rewritten question as argument:

```bash
python3 -c "
import json, urllib.request, sys, os, concurrent.futures

QUESTION = sys.argv[1]

def ask_gemini(q):
    api_key = os.environ.get('GEMINI_API_KEY', '')
    model = 'gemini-2.5-flash'
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}'
    system = 'You are a senior software architect with 20+ years of experience. A colleague is asking for your expert guidance. Give direct, practical advice based on real-world experience. Be specific and opinionated — do not hedge.'
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

def ask_github(q):
    import subprocess
    token = subprocess.check_output(['gh', 'auth', 'token']).decode().strip()
    model = 'gpt-4o'
    url = 'https://models.inference.ai.azure.com/chat/completions'
    system = 'You are a senior software architect with 20+ years of experience. A colleague is asking for your expert guidance. Give direct, practical advice based on real-world experience. Be specific and opinionated — do not hedge.'
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

with concurrent.futures.ThreadPoolExecutor() as ex:
    f_gemini = ex.submit(ask_gemini, QUESTION)
    f_github = ex.submit(ask_github, QUESTION)

g_text, g_in, g_out, g_model = f_gemini.result()
o_text, o_in, o_out, o_model = f_github.result()

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

try:
    usage_body = json.dumps({'inputTokens': g_in, 'outputTokens': g_out, 'model': g_model, 'type': 'consult'}).encode()
    usage_req = urllib.request.Request('http://localhost:972/api/gemini-usage', data=usage_body, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(usage_req)
except: pass
" "QUESTION_HERE"
```

Replace QUESTION_HERE with the user's question from $ARGUMENTS.

### Step 3: Synthesize (Claude's job)

After receiving both responses, YOU (Claude) must:

1. **Compare** — Where do they agree? Where do they contradict?
2. **Evaluate** — Which reasoning is stronger and why?
3. **Extract** — List concrete approaches worth trying, ranked by confidence
4. **Decide** — Pick the most promising approach and explain your rationale

Do NOT blindly adopt either answer. Be the critical judge.

### Step 4: Report to user

Present a concise summary:
- Key consensus points between the two models
- Notable disagreements and your assessment
- **Recommended approach** with reasoning
- Alternative approaches if the first one fails
