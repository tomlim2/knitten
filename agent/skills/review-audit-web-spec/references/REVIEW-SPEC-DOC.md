---
status: accepted
---
# Spec Document Review Checklist

Static review checklist for auditing technical specifications, PRDs, and website specs across four perspectives.

---

## Purpose

**Review checklist** for spec document audits. This is a companion to:

- `../review-audit-ux/references/REVIEW-UX.md` — UX/UI code audit checklist
- `../review-audit-web/references/REVIEW-CODE-JAVASCRIPT.md` — JS coding standards checklist
- `review-template.md` — Output format (for **structuring** review feedback)

This document defines **what to check** from engineering, design, brand, audience, and document quality perspectives. Use `review-template.md` for how to format findings.

---

## How to Use

### Markers

| Marker | Meaning |
|--------|---------|
| 🔧 | **Automatable** — Can be verified by searching the document for keywords/sections. Check mechanically. |
| 👁 | **Human review required** — Requires judgment about quality, clarity, or appropriateness. Always check manually. |

### Severity

| Icon | Level | Meaning |
|------|-------|---------|
| 🔒 | Critical | Missing section that makes the spec unimplementable. Must address before development. |
| ⚠️ | Error | Gap or inconsistency that will cause problems during implementation. Should fix before development. |
| 💡 | Suggestion | Improvement that strengthens the spec. Recommended but not blocking. |

### Conditional Sections

Sections marked **(if applicable)** only apply when the spec covers that domain. Skip if not relevant.

---

## 1. Engineering Review

> Technical feasibility and implementability of the specification.

- ⚠️ 👁 **Tech stack specified** — Programming languages, frameworks, libraries, and infrastructure are explicitly named with versions where relevant
  - *ENGR-01*

- 🔒 👁 **Functional requirements are measurable** — Each feature requirement is specific and testable. No vague qualifiers ("fast", "user-friendly", "seamless", "intuitive") without measurable criteria
  - *ENGR-02*

- ⚠️ 👁 **Non-functional requirements included** — Performance targets, security requirements, scalability expectations, and reliability standards are defined with specific metrics (response time < 200ms, uptime 99.9%)
  - *ENGR-03*

- 💡 🔧 **File/directory structure defined** — Project structure, folder organization, or component hierarchy is documented
  - *ENGR-04*

- ⚠️ 👁 **External dependencies listed** — Third-party services, APIs, databases, CDNs, and integration points are explicitly named with their roles
  - *ENGR-05*

- 💡 👁 **Deployment strategy specified** — Hosting, CI/CD, environment setup, and deployment process are described
  - *ENGR-06*

- 🔒 👁 **No technically infeasible requirements** — All requirements are achievable within the stated tech stack and constraints. No contradictory or physically impossible demands
  - *ENGR-07*

- ⚠️ 👁 **No scope-creep-inducing ambiguity** — Requirements use precise language. Phrases like `"and more"`, `"etc."`, `"as needed"`, `"all necessary"` are flagged as potential scope creep
  - *ENGR-08*

---

## 2. Design Review

> UI/UX completeness and design system alignment.

- ⚠️ 👁 **Design system or style guide referenced** — A design system, component library, or visual style guide is specified or included
  - *DSGN-01*

- ⚠️ 👁 **Responsive strategy defined** — Breakpoints, mobile-first vs desktop-first approach, and layout behavior per viewport are documented
  - *DSGN-02*

- 💡 👁 **Accessibility requirements stated** — WCAG conformance level (A/AA/AAA) and specific accessibility features are mentioned
  - *DSGN-03*

- ⚠️ 👁 **Navigation and information architecture clear** — Site map, page hierarchy, or navigation flow is documented. Users can understand how to move between sections
  - *DSGN-04*

- 💡 👁 **Interaction patterns defined** — Hover states, transitions, animations, loading states, and micro-interactions are specified where relevant
  - *DSGN-05*

- ⚠️ 👁 **Typography and color system specified** — Font families, sizes, weights, and color palette are defined or referenced from a design system
  - *DSGN-06*

- 💡 👁 **Media strategy defined** — Image formats, video handling, lazy loading behavior, and asset optimization approach are documented
  - *DSGN-07*

---

## 3. Brand Voice Review

> Tone, messaging consistency, and brand alignment.

- ⚠️ 👁 **Brand positioning clear** — Core brand message, mission, or value proposition is explicitly stated in the spec
  - *BRND-01*

- ⚠️ 👁 **Tone and voice consistent throughout** — Writing style, formality level, and personality are consistent across all content sections of the spec. No jarring shifts between formal and casual
  - *BRND-02*

- 💡 👁 **Value proposition differentiated** — What makes this product/service unique is clearly articulated and distinguished from competitors
  - *BRND-03*

- 💡 👁 **Unified voice from headline to microcopy** — Headlines, body text, button labels, error messages, and CTAs all share the same brand voice
  - *BRND-04*

- 🔒 🔧 **No placeholder text remaining** — No "Lorem ipsum", "[TBD]", "[TODO]", "placeholder", or "sample text" left in the spec
  - *BRND-05*

- ⚠️ 👁 **Language and culture fit** — Messaging matches the target audience's language, cultural norms, and communication expectations
  - *BRND-06*

---

## 4. Target Audience Review

> Persona alignment and audience appropriateness.

- 🔒 👁 **Target audience defined** — Specific user personas, demographics, or audience segments are described with their goals and pain points
  - *AUDC-01*

- ⚠️ 👁 **Content addresses persona needs** — Each major content section or feature maps to a specific persona need or user story
  - *AUDC-02*

- ⚠️ 👁 **CTAs match decision stage** — Calls-to-action are appropriate for the user's awareness/consideration/decision stage in the funnel
  - *AUDC-03*

- 💡 👁 **Information architecture matches user mental model** — Content is organized the way the target audience thinks, not the way the organization is structured internally
  - *AUDC-04*

- 💡 👁 **Competitive alternatives acknowledged** — The spec demonstrates awareness of what users might compare this to, and differentiates accordingly
  - *AUDC-05*

- ⚠️ 👁 **Language matches audience technical level** — Jargon, complexity, and assumed knowledge are appropriate for the defined audience. Technical specs for developers can be technical; consumer-facing content should be accessible
  - *AUDC-06*

---

## 5. Document Quality

> Structural quality of the spec document itself.

- ⚠️ 🔧 **Complete coverage** — Every page, feature, or component mentioned in the scope has corresponding requirements. No sections listed in the table of contents but missing content
  - *DOCQ-01*

- 💡 🔧 **Internal references accurate** — Cross-references between sections, links to external resources, and content source mappings are correct and resolvable
  - *DOCQ-02*

- ⚠️ 👁 **No conflicting requirements** — Requirements do not contradict each other. If the spec says "minimal design" in one section and "rich animations" in another, that's a conflict
  - *DOCQ-03*

- 💡 🔧 **Requirements are uniquely identifiable** — Each requirement can be individually referenced and tracked (numbered lists, IDs, or clear section headers)
  - *DOCQ-04*

- 💡 👁 **Implementation priority or phases indicated** — Requirements are ordered by priority, grouped into phases, or tagged with importance levels (must-have, nice-to-have)
  - *DOCQ-05*

---

## Sources

### Key References

1. [Brainhub: Website Spec Sections](https://brainhub.eu/library/website-specification) — 9-section spec structure
2. [aqua cloud: INCOSE Requirements Quality](https://aqua-cloud.io/requirements-quality/) — Requirements engineering standards
3. [Capgemini: 8-Point Design Review](https://www.capgemini.com/) — Design audit methodology
4. [IEEE 830 / ISO 29148](https://standards.ieee.org/) — Software requirements specification standards
5. [Grammarly: Tone Profiles](https://www.grammarly.com/business) — Brand voice consistency framework
6. [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/) — Accessibility guidelines
