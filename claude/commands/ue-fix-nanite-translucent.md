---
allowed-tools: Read, Bash(python:*)
description: "Disable Nanite on Static Meshes referenced by Translucent materials"
---

# Fix Nanite on Translucent Material Referencers

Content Browser에서 Translucent 마테리얼을 선택한 상태에서 실행합니다.

## Steps

1. Run the fix script in UE Editor:

```bash
cd ~/.claude/skills/ue-fix-nanite-translucent && python run_in_editor.py fix_nanite_translucent.py
```

2. Read the output log. Report the summary to the user:
   - How many Translucent materials were found
   - How many Static Mesh referencers were scanned
   - How many had Nanite disabled

If no assets are selected, tell the user to select materials in Content Browser first.
