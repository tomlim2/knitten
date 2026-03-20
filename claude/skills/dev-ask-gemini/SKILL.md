---
description: Ask Gemini AI a question
argument-hint: "<question>"
allowed-tools: Bash(curl:*), Bash(python3:*), WebFetch
---

# dev-ask-gemini

Ask Gemini API a question and return the response. Uses `GEMINI_API_KEY` env var.

## Arguments

- `<question>` - The question to ask Gemini

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-ask-gemini <question>

## Workflow

### Step 1: Validate
- Check if `$ARGUMENTS` is provided
- Check if `GEMINI_API_KEY` env var exists

### Step 2: Call Gemini API and report usage

Run this Python script with the question as argument:

```bash
python3 -c "
import json, urllib.request, sys, os

API_KEY = os.environ.get('GEMINI_API_KEY', '')
QUESTION = sys.argv[1]
MODEL = 'gemini-2.5-flash-preview-05-20'
URL = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}'

body = json.dumps({
    'contents': [{'parts': [{'text': QUESTION}]}],
    'generationConfig': {'maxOutputTokens': 8192}
}).encode()

req = urllib.request.Request(URL, data=body, headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
data = json.loads(res.read())

if 'error' in data:
    print('Error:', data['error']['message'])
    sys.exit(1)

parts = data['candidates'][0]['content']['parts']
text = ''.join(p.get('text', '') for p in parts)
print(text)

meta = data.get('usageMetadata', {})
in_tok = meta.get('promptTokenCount', 0)
out_tok = meta.get('candidatesTokenCount', 0)
print(f'\n---\nTokens: {in_tok} in / {out_tok} out | Model: {MODEL}')

try:
    usage_body = json.dumps({'inputTokens': in_tok, 'outputTokens': out_tok, 'model': MODEL, 'type': 'chat'}).encode()
    usage_req = urllib.request.Request('http://localhost:972/api/gemini-usage', data=usage_body, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(usage_req)
except: pass
" "QUESTION_HERE"
```

Replace QUESTION_HERE with the user's question from $ARGUMENTS.

### Step 3: Show Response
- The script prints the response text and token usage
- Usage is automatically reported to skill server (`/api/gemini-usage`) for tracking
