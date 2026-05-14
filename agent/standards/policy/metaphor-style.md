---
status: accepted
title: Metaphor style — kitchen or orchestra
description: Reference for picking metaphor domain when explaining technical concepts to this user.
platforms: all
portability: shared
---

# Metaphor style — kitchen or orchestra

Origin: 2026-05-07 session. The user thinks in concrete physical/operational analogues. Two domains cover most software-engineering concepts:

1. **Cooking / kitchen / restaurant** — flow, prep, plating, ticket orders, mise en place, stock, expediter, contamination.
2. **Music / orchestra / ensemble** — score, conductor, sections, downbeat, tuning, tempo, rest, cue, rehearsal vs. performance, soloist vs. tutti.

Both domains cover coordination, timing, resource constraints, and failure modes. Coordination/timing is *not* an orchestra-only thing — kitchens also have tight synchronization (expediter sequencing tickets, fish doneness windows, components plated together) and perishability (fresh ingredients have freshness budgets, like tokens or cache TTLs).

## Picking domain

Pick by **which vocabulary lets the next sentence be more concrete**:

| Next sentence pattern | Domain |
|------------------------|--------|
| "and then it goes stale / has to be re-fetched / spoils after N minutes" | kitchen (perishable ingredient, mise en place getting cold) |
| "and these run in parallel but share a downbeat / cue" | orchestra (sections under one conductor) |
| "this prep step has to finish before the next can start" | either; kitchen for material flow ("can't plate before the sauce reduces"), orchestra for tempo-locked handoffs ("strings land their phrase before the brass enters") |

The deciding question is which next sentence carries less abstraction.

## How to apply

- Map to the concept's *role*, not its surface. A CI workflow trigger is the *kitchen ticket order* OR the *conductor's downbeat* — both are "when does work begin." It is not "a button."
- Stay specific. "Like soup" / "like a song" is weak. "Like keeping stock simmering on a back burner so any new order ladles from it without re-cooking" carries the same density as the technical fact.
- One metaphor per concept, then drop back to direct technical language. Don't mix kitchen and orchestra in the same paragraph.
- When the metaphor breaks down (every metaphor does at some boundary), say where it breaks rather than stretching it. Honest seam > smooth lie.

## When NOT to use a metaphor

- User is asking for a fix, not an explanation — they want the answer, not a story.
- The technical concept maps trivially to common knowledge; metaphor adds noise.
- Code review reply text on GitHub PRs (per `pr-comment.md` reply discipline — no marketing language, no decoration).

## Kitchen — paradigm depth

The chef's full *process arc* is the richest source: mise en place (set up all ingredients before fire), multi-burner timing (3 components landing on the same plate at the same minute), tasting + adjusting mid-cook (feedback loop), perishability (fish has hours, herbs have days, stock has weeks), substitutions (what you reach for when the right ingredient is out), expediter calling the order in sequence, runner closing the loop to the table. Roles (chef, sous, expediter, runner). Failure modes (overcooked, raw, contaminated, cold by the time it reaches the table, sauce broken). Coordination (ticket flow, pass discipline). Resource constraints (pan space, oven slots, fridge real estate).

### Cuisine variety carries paradigm variety

Use the cuisine that matches the *philosophy* of the technical concept:

| Cuisine | Paradigm | Maps to |
|---------|----------|---------|
| **Japanese** (sushi-grade precision) | short tolerance windows, raw-material quality dominates, knife technique outweighs heat | code paths where input quality determines output (no amount of cooking saves bad data); narrow latency budgets (sashimi-cut response time) |
| **Western / French** (steak, mother sauces) | heat and time as primary control surface, narrow doneness windows (rare → medium-rare → medium-well = 5°C/15s windows) | timeout / retry / freshness budgets where there is a target window and both directions of error hurt; stock reduction (long-running background tasks); sauce emulsion breaking (state corruption from wrong order) |
| **Chinese** (wok hei) | burst throughput, hot pan = warm cache, constant tossing = round-robin scheduling | latency-dominated workloads where setup cost is high but per-item cost is low; cold-wok problem = cold start, first request slow |
| **Korean** (fermentation, banchan) | fermentation arcs (weeks to years) = long-running async processes; banchan parallel prep = preflight caches; stew reheats well = idempotent re-execution | slowly converging state, warm pools, idempotent retry |

**Steak doneness as canonical narrow-window example:** medium-rare is ~5°C wide and ~30s long. Past it = burnt and unrecoverable. Before it = raw and untrusted. Right metaphor for **anything where both directions of error hurt and the correct zone is narrow** — token TTLs, rate limits, retry backoff windows, deploy timing relative to downstream cache invalidation. Don't say "timing matters"; say "this is the medium-rare window — too early and the bridge sees stale config, too late and the cache TTL has lapsed."

## Orchestra — paradigm depth

Coordination (conductor, downbeat, count-in), parallelism with shared phrasing (sections, voicing), latency (anticipation, lag), failure modes (entering early, sour intonation, dropped cue), rehearsal vs. live (staging vs. production), role hierarchy.

## Role hierarchy — symmetric across both domains

| Tier | Kitchen | Orchestra | Software analogue |
|------|---------|-----------|-------------------|
| Top | Executive chef | Conductor | Architect / tech lead |
| Senior | Sous chef | Concertmaster, section principal | Senior engineer / module owner |
| Specialist | Line cook (saucier, grill, pastry) | Section player | Engineer working their area |
| Coordinator | Expediter | Conductor's assistant / stage manager | Release manager / on-call |
| Last mile | Runner / server | Stagehand | Deploy bot / CI runner |

Use this when the concept involves *who decides* / *who executes* / *who hands off* — both domains carry that structure naturally; pick whichever the next sentence wants.

## Examples used in past sessions

- CI/CD pipeline = restaurant kitchen flow (ticket → prep → cook → plate → serve = trigger → build → test → package → deploy).
- Concurrency group key = ticket batching policy at the pass.
- COEP `require-corp` = "only display dishes from kitchens that have explicitly OK'd being shown on our menu."
- Bevy `.meta` sidecar 404 with empty body vs `text/plain` "Not Found" = "the way the waiter says 'we're out of that' matters; some kitchens parse silence as 'try harder' and dig through the pantry."
- Stale fetch cache between Step 2 and Step 6 in PR review = "checking the chalkboard once when prep starts, then plating an hour later without re-reading — new orders that came in at minute 30 get plated wrong or skipped."
