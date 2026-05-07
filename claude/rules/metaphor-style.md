---
load: auto
---

# Metaphor style — kitchen or orchestra

When a metaphor helps explain something to the user, draw from one of two domains the user has named (2026-05-07 session):

1. **Cooking / kitchen / restaurant** — flow, prep, plating, ticket orders, mise en place, stock, expediter, contamination.
2. **Music / orchestra / ensemble** — score, conductor, sections, downbeat, tuning, tempo, rest, cue, rehearsal vs. performance, soloist vs. tutti.

Both domains cover most software-engineering concepts. Coordination/timing is *not* an orchestra-only thing — kitchens also have tight synchronization (expediter sequencing tickets, fish doneness windows, components plated together) and perishability (fresh ingredients have freshness budgets, like tokens or cache TTLs). So don't try to pre-assign concept categories to a domain.

Pick instead by **which vocabulary lets the next sentence be more concrete**:

- If your follow-up sentence will say "and then it goes stale / has to be re-fetched / spoils after N minutes" — kitchen (perishable ingredient, mise en place getting cold).
- If your follow-up sentence will say "and these run in parallel but share a downbeat / cue" — orchestra (sections under one conductor).
- If your follow-up sentence will say "this prep step has to finish before the next can start" — either works; kitchen ("you can't plate before the sauce reduces") tends to land tighter for material flow, orchestra ("the strings have to land their phrase before the brass enters") for tempo-locked handoffs.

Either domain can express coordination, timing, resource constraints, failure modes. The deciding question is which next sentence carries less abstraction.

**How to apply:**

- Map to the concept's *role*, not its surface. Example: a CI workflow trigger is the *kitchen ticket order* OR the *conductor's downbeat* — both are "when does work begin." It is not "a button."
- Stay specific. "Like soup" / "like a song" is weak. "Like keeping stock simmering on a back burner so any new order ladles from it without re-cooking" or "like the second violins holding a sustained chord while the first violins take a phrase — same harmonic context, different active voice" carries the same density as the technical fact.
- Don't pile metaphors. One per concept, then drop back to direct technical language. Don't mix kitchen and orchestra in the same paragraph.
- When the metaphor breaks down (every metaphor does at some boundary), say where it breaks rather than stretching it. Honest seam > smooth lie.

**When NOT to use a metaphor:**

- The user is asking for a fix, not an explanation — they want the answer, not a story.
- The technical concept maps trivially to common knowledge; metaphor adds noise.
- Code review reply text on GitHub PRs (per `pr-comment.md` reply discipline — no marketing language, no decoration).

**Why this exists:** the user thinks in concrete physical/operational analogues. Both domains have rich vocabulary for the things software-engineering needs to express:

- Kitchen — the chef's full *process arc* is the richest source: mise en place (set up all ingredients before fire), multi-burner timing (3 components landing on the same plate at the same minute), tasting + adjusting mid-cook (feedback loop), perishability (fish has hours, herbs have days, stock has weeks), substitutions (what you reach for when the right ingredient is out), expediter calling the order in sequence, runner closing the loop to the table. Roles (chef, sous, expediter, runner). Failure modes (overcooked, raw, contaminated, cold by the time it reaches the table, sauce broken). Coordination (ticket flow, pass discipline). Resource constraints (pan space, oven slots, fridge real estate).

**Cuisine variety carries paradigm variety.** Use the cuisine that matches the *philosophy* of the technical concept:

- **Japanese (sushi-grade precision)** — short tolerance windows, raw-material quality dominates, knife technique outweighs heat. Maps to: code paths where input quality determines output (no amount of cooking saves bad data); narrow latency budgets (sashimi-cut response time).
- **Western / French (steak, mother sauces)** — heat and time as the primary control surface, narrow doneness windows (rare → medium-rare → medium-well = 5°C/15s windows; miss it past and it is burnt-irreversible, miss it before and it is raw-untrusted). Maps to: timeout / retry / freshness budgets where there is a target window and both directions of error hurt. Stock reduction (long-running background tasks). Sauce emulsion breaking (state corruption from wrong order of operations).
- **Chinese (wok hei, high heat short time)** — burst throughput, hot pan = warm cache, constant tossing keeps even heat = round-robin scheduling. Maps to: latency-dominated workloads where setup cost is high but per-item cost is low. Cold-wok problem = cold start, first request slow.
- **Korean (fermentation, banchan)** — fermentation arcs (kimchi, doenjang, soy) on weeks-to-years scale = long-running async processes, slowly converging state. Banchan side dishes prepared ahead in parallel = preflight caches, warm pools. Stew (jjigae) reheats well = idempotent re-execution.

**Steak doneness as the canonical narrow-window example:** the temperature-and-time window for medium-rare is roughly 5°C wide and 30s long. Past it = burnt and unrecoverable. Before it = raw and untrusted. This is the right metaphor for **anything where both directions of error hurt and the correct zone is narrow** — token TTLs, rate limits, retry backoff windows, deploy timing relative to a downstream cache invalidation. Don't say "timing matters"; say "this is the medium-rare window — too early and the bridge sees stale config, too late and the cache TTL has lapsed."
- Orchestra — coordination (conductor, downbeat, count-in), parallelism with shared phrasing (sections, voicing), latency (anticipation, lag), failure modes (entering early, sour intonation, dropped cue), rehearsal vs. live (staging vs. production), role hierarchy (conductor → concertmaster → section principal → section player → understudy).

**Role hierarchy is symmetric across both domains** — both have a clear chain of authority that maps cleanly to software ownership / approval / escalation:

| Tier | Kitchen | Orchestra | Software analogue |
|---|---|---|---|
| Top | Executive chef | Conductor | Architect / tech lead |
| Senior | Sous chef | Concertmaster, section principal | Senior engineer / module owner |
| Specialist | Line cook (saucier, grill, etc.) | Section player | Engineer working their area |
| Coordinator | Expediter | Conductor's assistant / stage manager | Release manager / on-call |
| Last mile | Runner / server | Stagehand | Deploy bot / CI runner |

Use this when the concept involves *who decides* / *who executes* / *who hands off* — both domains carry that structure naturally and pick whichever your next sentence wants.

Either domain lands faster than abstract analogies; pick whichever maps the concept more cleanly.

**Examples already used in this user's sessions:**

- CI/CD pipeline = restaurant kitchen flow (ticket comes in → prep → cook → plate → serve = trigger → build → test → package → deploy).
- Concurrency group key = ticket batching policy at the pass.
- COEP `require-corp` = "only display dishes from kitchens that have explicitly OK'd being shown on our menu."
- Bevy `.meta` sidecar 404 with empty body vs text/plain "Not Found" = "the way the waiter says 'we're out of that' matters; some kitchens parse the silence as 'try harder' and dig through the pantry."
- Stale fetch cache between Step 2 and Step 6 in PR review = "checking the chalkboard once when prep starts, then plating an hour later without re-reading — new orders that came in at minute 30 get plated wrong or skipped."
