---
description: Text-to-image generation with Gemini API
argument-hint: "<prompt> [--aspect 1:1|16:9|9:16|4:3] [--out path]"
allowed-tools: Bash(curl:*), Bash(python3:*), Bash(open:*), Read, Write
---

# dev-run-t2i

Generate images from text prompts using Gemini native image generation.

## Arguments

- `<prompt>` - Text description of the image to generate
- `[--aspect ratio]` - Aspect ratio: 1:1 (default), 16:9, 9:16, 4:3, 3:4
- `[--out path]` - Output file path (default: ~/Desktop/t2i_{timestamp}.png)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-run-t2i <prompt> [--aspect 16:9] [--out ~/Desktop/output.png]

## Workflow

### Step 1: Parse Arguments
- Extract prompt text from $ARGUMENTS
- Extract --aspect if provided (default: 1:1)
- Extract --out if provided (default: ~/Desktop/t2i_{timestamp}.png)

### Step 2: Get API Key
- Read GEMINI_API_KEY from environment: `echo $GEMINI_API_KEY`
- If empty, ask user to set it

### Step 3: Generate Image
Run this Python script to call Gemini API and save the image:

```bash
python3 -c "
import json, base64, urllib.request, sys, os, time

API_KEY = os.environ.get('GEMINI_API_KEY', '')
PROMPT = sys.argv[1]
ASPECT = sys.argv[2] if len(sys.argv) > 2 else '1:1'
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.expanduser(f'~/Desktop/t2i_{int(time.time())}.png')

MODEL = 'gemini-2.0-flash-exp-image-generation'
URL = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}'

body = json.dumps({
    'contents': [{'parts': [{'text': PROMPT}]}],
    'generationConfig': {
        'responseModalities': ['TEXT', 'IMAGE'],
        'imageConfig': {'aspectRatio': ASPECT}
    }
}).encode()

req = urllib.request.Request(URL, data=body, headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
data = json.loads(res.read())

# Token usage
meta = data.get('usageMetadata', {})
in_tok = meta.get('promptTokenCount', 0)
out_tok = meta.get('candidatesTokenCount', 0)

parts = data['candidates'][0]['content']['parts']
img_part = next((p for p in parts if 'inlineData' in p), None)
txt_part = next((p for p in parts if 'text' in p), None)

if img_part:
    img_bytes = base64.b64decode(img_part['inlineData']['data'])
    with open(OUT, 'wb') as f:
        f.write(img_bytes)
    print(f'Saved: {OUT}')
    print(f'Tokens: {in_tok} in / {out_tok} out')
    if txt_part:
        print(f'Note: {txt_part[\"text\"]}')

    # Report usage to skill server
    try:
        usage_body = json.dumps({'inputTokens': in_tok, 'outputTokens': out_tok, 'model': MODEL, 'type': 't2i'}).encode()
        usage_req = urllib.request.Request('http://localhost:9720/api/gemini-usage', data=usage_body, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(usage_req)
    except: pass
else:
    print('Error: No image in response')
    if txt_part:
        print(txt_part['text'])
    sys.exit(1)
" "PROMPT_HERE" "ASPECT_HERE" "OUTPUT_PATH_HERE"
```

Replace PROMPT_HERE, ASPECT_HERE, OUTPUT_PATH_HERE with the parsed values.

### Step 4: Show Result
- Confirm the file was saved
- Show token usage
- Open the image: `open <output_path>`

### Web UI
For interactive use with preview: `open http://localhost:9720/skills/dev-run-t2i`
