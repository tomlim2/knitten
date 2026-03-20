---
description: Image-to-image editing with Gemini API
argument-hint: "<source_image> <edit_instruction> [--out path]"
allowed-tools: Bash(curl:*), Bash(python3:*), Bash(open:*), Read, Write
---

# dev-run-i2i

Edit images with text instructions using Gemini native image generation.

## Arguments

- `<source_image>` - Path to the source image file
- `<edit_instruction>` - Text describing how to edit the image
- `[--out path]` - Output file path (default: ~/Desktop/i2i_{timestamp}.png)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-run-i2i <source_image> <edit_instruction> [--out ~/Desktop/edited.png]

## Workflow

### Step 1: Parse Arguments
- Extract source image path from $ARGUMENTS
- Extract edit instruction text
- Extract --out if provided (default: ~/Desktop/i2i_{timestamp}.png)
- Verify source image exists

### Step 2: Get API Key
- Read GEMINI_API_KEY from environment: `echo $GEMINI_API_KEY`
- If empty, ask user to set it

### Step 3: Edit Image
Run this Python script to call Gemini API with the source image:

```bash
python3 -c "
import json, base64, urllib.request, sys, os, time, mimetypes

API_KEY = os.environ.get('GEMINI_API_KEY', '')
SRC = sys.argv[1]
INSTRUCTION = sys.argv[2]
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.expanduser(f'~/Desktop/i2i_{int(time.time())}.png')

MODEL = 'gemini-2.0-flash-exp-image-generation'
URL = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}'

mime = mimetypes.guess_type(SRC)[0] or 'image/png'
with open(SRC, 'rb') as f:
    img_b64 = base64.b64encode(f.read()).decode()

body = json.dumps({
    'contents': [{'parts': [
        {'text': INSTRUCTION},
        {'inline_data': {'mime_type': mime, 'data': img_b64}}
    ]}],
    'generationConfig': {
        'responseModalities': ['TEXT', 'IMAGE']
    }
}).encode()

req = urllib.request.Request(URL, data=body, headers={'Content-Type': 'application/json'})
res = urllib.request.urlopen(req)
data = json.loads(res.read())

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

    try:
        usage_body = json.dumps({'inputTokens': in_tok, 'outputTokens': out_tok, 'model': MODEL, 'type': 'i2i'}).encode()
        usage_req = urllib.request.Request('http://localhost:972/api/gemini-usage', data=usage_body, headers={'Content-Type': 'application/json'})
        urllib.request.urlopen(usage_req)
    except: pass
else:
    print('Error: No image in response')
    if txt_part:
        print(txt_part['text'])
    sys.exit(1)
" "SOURCE_PATH" "INSTRUCTION_HERE" "OUTPUT_PATH_HERE"
```

Replace SOURCE_PATH, INSTRUCTION_HERE, OUTPUT_PATH_HERE with the parsed values.

### Step 4: Show Result
- Confirm the file was saved
- Show token usage
- Open the image: `open <output_path>`

### Web UI
For interactive use with preview: `open http://localhost:972/skills/dev-run-i2i`
