---
description: Apply human writing voice to content
argument-hint: "[content type] for [audience] about [topic]"
allowed-tools: Read
---

# writing-apply-voice

Apply a human writing style to avoid generic AI output.
## Instructions

Read the skill documentation:
!`cat ~/.claude/skills/writing-apply-voice/SKILL.md`

## User Request

$ARGUMENTS

## Task

Based on the user's request, apply the writing voice template:

1. Identify the content type and audience from the arguments
2. Select the appropriate preset (portfolio, blog, linkedin, readme) or create custom voice settings
3. Generate content following the template constraints:
   - No AI clichés (delve, leverage, robust)
   - No generic openings
   - Mix sentence lengths
   - Strong hook first sentence
4. Review output - if it sounds like AI, rewrite it

If no arguments provided, show the available presets and ask what the user wants to write.
