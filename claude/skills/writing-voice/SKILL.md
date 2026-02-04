# writing-voice

**Version:** 1.0.0

Writing style prompt to avoid generic AI output.

## Usage

Use this skill when writing content that needs a human voice. Provide the content type, audience, and topic.

```
/writing-voice blog post for developers about git workflows
```

## Template

```
You are writing [CONTENT TYPE] for [AUDIENCE].

VOICE & TONE:
- [Describe voice: conversational, authoritative, casual, etc.]
- [Describe tone: humorous, serious, empathetic, etc.]
- [Key phrase: e.g., "Write like you're texting a smart friend"]

CONSTRAINTS:
- No AI clichés: delve, landscape, robust, leverage, utilize
- No generic openings: "In today's world..." "It's important to note..."
- No excessive transitions: "moreover," "furthermore," "additionally"
- Sentence variety: Mix short punchy sentences with longer explanatory ones

STRUCTURE:
- Hook that creates pattern interrupt (first sentence must stop scrolling)
- [Specific structure based on content type]
- Call-to-action or thought-provoking closer

CONTENT:
[Provide topic, key points, or outline]

OUTPUT:
[Specify length, format, or any special requirements]

Read your output twice before responding. If it sounds like AI wrote it, rewrite it.
```

## Presets

### Portfolio Project Summary
```
VOICE: Conversational but competent
TONE: Confident without bragging
KEY PHRASE: "Explaining to a senior engineer at coffee"
STRUCTURE: Problem → Solution → Result (1 sentence each)
OUTPUT: 3-4 sentences max
```

### Technical Blog
```
VOICE: Authoritative but accessible
TONE: Helpful, practical
KEY PHRASE: "Teaching a colleague who's smart but unfamiliar"
STRUCTURE: Hook → Context → Steps → Gotchas → Takeaway
OUTPUT: 800-1200 words
```

### LinkedIn Post
```
VOICE: Professional but human
TONE: Insightful, not preachy
KEY PHRASE: "Sharing a lesson learned, not lecturing"
STRUCTURE: Hook line → Story → Insight → Question
OUTPUT: 150-250 words
```

### README
```
VOICE: Direct, scannable
TONE: Practical, no fluff
KEY PHRASE: "Just tell me what it does and how to use it"
STRUCTURE: What → Why → How → Examples
OUTPUT: As short as possible while complete
```

## Banned Words

- delve, landscape, robust, leverage, utilize
- seamless, cutting-edge, game-changer
- In today's world, It's important to note
- Moreover, Furthermore, Additionally
- As [role], I...
