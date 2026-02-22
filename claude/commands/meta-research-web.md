---
description: Deep web research on technical topics with structured findings
argument-hint: "<topic or concept>"
allowed-tools: Task, WebSearch, WebFetch, Read, Write, Glob
---

# meta-research-web

Multi-angle web research with source verification and structured compilation.

**Standards**: Follow `~/.claude/standards/research-methodology.md` for search strategies and source evaluation.
## Target

$ARGUMENTS

**If no argument is provided, show usage and ask the user for the topic. NEVER auto-execute.**
```
Usage: /research <topic or concept>
Example: /research Unreal Engine material instancing best practices
Example: /research WebAssembly SIMD performance 2025
```

## Execution Strategy

Launch **two agents in parallel** for comprehensive coverage:

### Agent 1: Official Documentation & Authority
Research official sources, specifications, and authoritative content.

**Task**: Search for and analyze:
- Official documentation (docs sites, API references)
- Authoritative blogs (Mozilla, Google Developers, AWS, etc.)
- Specifications and standards
- Recent version updates and changelogs

**Output**: Return official guidance, key concepts, and authoritative best practices with source URLs.

### Agent 2: Practical Implementation & Community
Research real-world usage, gotchas, and implementation examples.

**Task**: Search for and analyze:
- Tutorials and implementation guides
- Production usage examples and case studies
- Common gotchas and mistakes (Stack Overflow, forums, GitHub issues)
- Code examples and demos
- Comparative analysis (X vs Y articles)

**Output**: Return practical insights, common pitfalls, implementation patterns, and real-world examples with source URLs.

## Search Strategy (for agents)

Execute searches from **multiple angles** to get comprehensive coverage:

### 1. Official Documentation
- Search for official docs, specifications, API references
- Look for authoritative sources (e.g., mozilla.org for web APIs, unrealengine.com for UE)
- Prefer sites with established authority in the domain

### 2. Recent Best Practices
- Include current year in query when relevant (e.g., "2025", "2026")
- Look for "best practices", "guidelines", "conventions"
- Find "what's new" or changelog information

### 3. Real-World Usage
- Search for tutorials, case studies, production usage
- Look for "lessons learned", "gotchas", "common mistakes"
- Find community discussions (but verify claims)

### 4. Comparative Analysis
- Search "X vs Y" for competing approaches
- Look for benchmarks, performance comparisons
- Find "when to use X" decision guides

### 5. Implementation Examples
- Search for code examples, samples, demos
- Look for GitHub repositories with real implementations
- Find "getting started" or "quick start" guides

## Search Rules

### Query Construction
- **Be specific**: "Unreal Engine material instancing" > "UE materials"
- **Include context**: Add domain/version when relevant
- **Use quotes**: For exact phrases like "zero-copy networking"
- **Add qualifiers**: Include "tutorial", "guide", "documentation" when needed

### Source Evaluation
- Prefer **official documentation** over blog posts
- Check **publication date** - prefer recent for rapidly evolving topics
- **Cross-reference** - verify claims across multiple sources
- Avoid **listicles** and low-quality aggregators

### Domain Filtering
For specific topics, prefer authoritative domains:
- UE/Unity: developer.unreal.com, docs.unity3d.com
- Web APIs: developer.mozilla.org, web.dev
- Languages: official language docs (python.org, rust-lang.org)
- Cloud: aws.amazon.com/docs, cloud.google.com/docs

## Synthesis Process

After both agents complete:

1. **Combine findings** from both agents
2. **Cross-reference** official guidance with practical implementation
3. **Resolve conflicts** if official docs and community practice differ
4. **Identify gaps** where more research is needed

## Output Format

### Topic Overview
[1-2 paragraphs explaining what this is and why it matters]

### Official Guidance
- **Source**: [URLs from Agent 1]
- **Key Concepts**: [Core principles from official docs]
- **Current Status**: [Latest version, recent updates]

### Best Practices
- **Pattern 1**: [Description with rationale from both agents]
- **Pattern 2**: [Description with rationale from both agents]
- [Continue as needed]

### Common Gotchas
- **Issue 1**: [What to watch out for - cite source]
- **Issue 2**: [What to watch out for - cite source]
- [Continue as needed]

### When to Use
[Decision framework - when this approach makes sense vs alternatives]

### Implementation Guide
[Step-by-step approach combining official guidance and practical examples]

### Sources Consulted
#### Official & Authoritative
1. [Title] - [URL]
2. [Title] - [URL]

#### Practical & Community
1. [Title] - [URL]
2. [Title] - [URL]

### Related Topics
[Topics to explore next that came up during research]

### Confidence Assessment
- **High**: Verified across official docs and multiple authoritative sources
- **Medium**: Found in tutorials/blogs but not explicitly in official docs
- **Low**: Limited sources, conflicting information, or rapidly evolving area
- **Note any conflicts** between official and community sources

## Optional: Save to Private

If the research is valuable for future reference, offer to save to `~/.claude/private/research/`.

Format: `~/.claude/private/research/{topic-slug}.md`

Only create the file if the user explicitly requests it.

## Context

Today's date: 2026-02-05 (use this to prioritize recent information)
