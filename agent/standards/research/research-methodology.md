---
status: accepted
---
# Research Methodology

**Version:** 0.2.0

Standards for conducting web research on technical topics.

## Changelog

- **0.2.0** - Add dual-agent parallel execution model
- **0.1.0** - Initial release

---

## Purpose

This document defines the approach to researching technical concepts, tools, and best practices via web search. Use these standards when executing `/research` commands or conducting any systematic investigation.

---

## Core Principles

### 1. Multi-Source Verification
**Never rely on a single source.** Cross-reference claims across:
- Official documentation
- Authoritative tutorials
- Real-world implementations
- Community discussions

If sources conflict, note the disagreement and investigate why.

### 2. Source Hierarchy
Not all sources carry equal weight. Prefer in order:

1. **Official Documentation** - language specs, API docs, official guides
2. **Authoritative Blogs** - Mozilla, Google Developers, AWS, Microsoft
3. **Established Publications** - A List Apart, CSS-Tricks, Smashing Magazine
4. **GitHub Discussions** - in official project repos
5. **Stack Overflow** - for specific implementation questions
6. **Personal Blogs** - only if author has demonstrable expertise
7. **Reddit/Forums** - for community sentiment, verify claims elsewhere

Avoid:
- Content farms (low-quality aggregators)
- Listicles without sources
- SEO-optimized fluff with no substance
- Outdated information (check publication dates)

### 3. Recency Bias
For **rapidly evolving topics** (web APIs, cloud services, framework features):
- Prioritize content from the last 1-2 years
- Explicitly check "what's new" in recent versions
- Include current year in search queries when relevant

For **stable concepts** (algorithms, design patterns, foundational CS):
- Classic resources remain valuable
- Look for "evergreen" content
- Prefer depth over novelty

### 4. Context Matters
Always consider:
- **Version specificity** - What version does this apply to?
- **Platform constraints** - Does this work on all platforms?
- **Scale considerations** - Does this hold at production scale?
- **Trade-offs** - What are you sacrificing for this benefit?

---

## Search Strategies

### Query Construction

**Bad Query**: `material optimization`
- Too vague, could mean anything

**Good Query**: `Unreal Engine 5 material instancing performance best practices`
- Specific tool, specific feature, specific concern

**Rules**:
1. **Name the technology** - Include version if relevant
2. **Specify the concern** - performance, security, maintainability
3. **Use domain terminology** - "material instancing" not "material copying"
4. **Add qualifiers** - "best practices", "production", "2025"

### Search Patterns

#### Pattern 1: Documentation First
```
"[Technology] [Feature] official documentation"
site:developer.mozilla.org [web API name]
site:docs.unrealengine.com [UE feature]
```

#### Pattern 2: Best Practices
```
"[Technology] [Feature] best practices"
"[Technology] [Feature] guidelines"
"[Technology] production usage"
```

#### Pattern 3: Gotchas and Pitfalls
```
"[Technology] [Feature] gotchas"
"[Technology] [Feature] common mistakes"
"[Technology] [Feature] things to know"
```

#### Pattern 4: Comparative Analysis
```
"[Approach A] vs [Approach B]"
"when to use [Technology]"
"[Technology] alternatives"
```

#### Pattern 5: Real-World Implementation
```
"[Technology] tutorial"
"[Technology] example code"
site:github.com [Technology] production
```

### Domain-Specific Searches

#### Unreal Engine
- Prefer: `site:docs.unrealengine.com`, `site:dev.epicgames.com`
- Forums: `site:forums.unrealengine.com` (but verify claims)
- GitHub: Look for Epic's official samples

#### Web APIs
- Prefer: `site:developer.mozilla.org`, `site:web.dev`
- Specs: `site:w3.org`, `site:whatwg.org`
- Can I Use: `caniuse.com` for browser support

#### Cloud Services (AWS/GCP/Azure)
- Prefer: Official docs (`aws.amazon.com/docs`, `cloud.google.com/docs`)
- Look for "Well-Architected Framework" (AWS) or equivalent
- Check service limits and pricing docs

#### Programming Languages
- Prefer: Official language docs (e.g. rust-lang.org, python.org)
- RFCs/PEPs/Proposals for language evolution
- Look for "idiomatic [language]" or "[language] style guide"

---

## Evaluation Checklist

Before accepting information as valid:

- [ ] **Source authority** - Is this an authoritative source?
- [ ] **Publication date** - Is this recent enough for the topic?
- [ ] **Cross-reference** - Can I verify this elsewhere?
- [ ] **Context** - What version/platform does this apply to?
- [ ] **Trade-offs** - Are downsides mentioned, or is this all upsides?
- [ ] **Evidence** - Are claims backed by data, examples, or reasoning?

---

## Output Structure

When compiling research findings:

### 1. Executive Summary
1-2 paragraphs: What is this, why does it matter, when to use it.

### 2. Key Findings by Category
Organize by:
- **Official stance** - What do the docs say?
- **Best practices** - What do experts recommend?
- **Gotchas** - What are the pitfalls?
- **Alternatives** - What else could you use?

### 3. Implementation Guidance
Concrete steps or decision framework.

### 4. Sources
Cite everything. Format:
```
- [Title] - URL (Type: Official/Tutorial/Discussion) - Date
```

### 5. Confidence Assessment
Rate your confidence:
- **High** - Multiple authoritative sources agree, official docs confirm
- **Medium** - Consistent info from tutorials, but not explicit in official docs
- **Low** - Limited sources, conflicting info, or rapidly changing area

### 6. Related Topics
What else should be explored based on what you found?

---

## Red Flags

Watch out for:

### Content Farm Indicators
- No author byline or vague "admin" author
- Excessive ads, popups, intrusive UI
- Thin content padded with fluff
- No publication date or outdated date
- Generic stock photos unrelated to content

### Dubious Claims
- "Always use X" or "Never use Y" (absolutes are rare in engineering)
- Benchmarks with no methodology or source code
- "This one weird trick..." style promises
- Claims with no citations or examples
- Contradicts official documentation without explanation

### Outdated Information
- Article about React without mentioning hooks (pre-2019)
- Web API article ignoring modern browser support
- Framework tutorial for a version 3+ major releases old
- Cloud service article before major pricing/architecture changes

When you encounter these, **discard and search for better sources**.

---

## Saving Research

Research findings worth keeping should be saved to `~/.claude/private/research/`.

**Format**: `~/.claude/private/research/{topic-slug}.md`

**Structure**:
```markdown
# [Topic]

**Researched**: [Date]
**Context**: [Why this was researched]

## Summary
[Executive summary]

## Key Findings
[Structured findings from research]

## Sources
[All sources consulted with URLs]

## Related Topics
[Topics to explore next]
```

Only save research that:
- Required significant time investment
- Will be referenced in the future
- Contains non-obvious insights or gotchas
- Includes hard-to-find information

Don't save:
- Basic "what is X" lookups
- Information easily found in official docs
- Trivial or well-known facts

---

## Integration with Commands

### `/research <topic>`
Primary research command. Uses all strategies in this document.

**Execution model**: Launches two agents in parallel:
- **Agent 1**: Official documentation and authoritative sources
- **Agent 2**: Practical implementation and community insights

After both agents complete, synthesize findings by:
1. Combining results from both perspectives
2. Cross-referencing official guidance with real-world practice
3. Resolving conflicts (e.g., official docs vs community consensus)
4. Identifying gaps for further investigation

**Benefits of dual-agent approach**:
- **Speed**: Parallel execution reduces research time
- **Coverage**: Official and practical perspectives covered simultaneously
- **Quality**: Cross-referencing reveals discrepancies and validates claims
- **Depth**: Each agent can focus on their domain expertise

### `/consult <question>`
For codebase questions, but can include web research if needed.

### `/explore <pattern>`
Codebase exploration only. Does NOT do web research.

---

## Examples

### Good Research Process

**Query**: "Unreal Engine Nanite performance cost vs traditional static mesh"

**Searches executed**:
1. `site:docs.unrealengine.com Nanite performance`
2. `Unreal Engine 5 Nanite vs static mesh benchmark`
3. `Nanite production usage gotchas`
4. `when to use Nanite UE5`

**Sources found**:
- Official docs explain Nanite's GPU-driven approach
- GDC talk by Epic shows production metrics
- Community forum discusses streaming cost edge cases
- Multiple tutorials confirm shader complexity matters more than polycount

**Confidence**: High - Official docs + real-world production data

### Bad Research Process

**Query**: "optimize game performance"

**Problem**: Too vague. What game? What engine? What type of performance?

**Better**: "Unreal Engine 5 CPU optimization techniques for large open worlds"

---

**Query**: "React best practices"

**Problem**: React evolves quickly. Without date filtering, you'll get outdated class component advice.

**Better**: "React 18 best practices 2025" or "modern React patterns hooks"

---

## Related Files

- Command: `~/.claude/commands/caol-research-web.md`
- Output: `~/.claude/private/research/`

---

## Versioning

This standard evolves as research practices improve. Update the version and changelog when making significant changes.
