---
description: Build a drink-themed isometric mini-city diorama prompt
argument-hint: "<drink_name> [variant] [--prompt-only]"
allowed-tools: WebSearch, WebFetch, Read
---

# image-make-drink-iso

Turn any drink (wine, whiskey, cocktail, sake, ...) into a Gemini image-generation **prompt** for an isometric 3D miniature city diorama. The prompt is themed by the drink's actual bottle label — colors are pulled from the real label, motifs come from the label illustration. After the user confirms the prompt, dispatch `dev-run-t2i` to generate the image.

This skill is the **prompt builder**. It does NOT call the Gemini API itself — that's `dev-run-t2i`'s job. Keeping the two separate means the same prompt-building logic can be reused (e.g., to email it, save it, A/B compare with another generator).

## Arguments

- `<drink_name>` — Required. Brand + name (e.g., `"Knitten Sauvignon Blanc"`, `"Lagavulin 16"`, `"Aperol Spritz"`)
- `[variant]` — Optional. `iso-city` (default) — reserved for future style variants
- `[--prompt-only]` — Optional. If present, **stop after Step 4** (print the final prompt and exit). If absent (default), dispatch to `dev-run-t2i` and generate the image.

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage:
- `/image-make-drink-iso "Knitten Sauvignon Blanc"` — research label, build prompt, generate image
- `/image-make-drink-iso "Knitten Sauvignon Blanc" --prompt-only` — research label, build prompt, print it, stop

When to use `--prompt-only`:
- You want to copy the prompt into a different image generator (Midjourney, DALL-E, Imagen Ultra)
- You want to save the prompt to a file or share it before spending an API call
- You're iterating on the prompt structure itself (not the image output)

## Workflow

### Step 1: Validate input + parse flags
- Confirm `$ARGUMENTS` is non-empty.
- If empty, show usage and stop. Do not invent a drink.
- Detect `--prompt-only` flag — strip it from `$ARGUMENTS` before treating the rest as the drink name.
- Set `PROMPT_ONLY = true` if the flag was present, else `false`.

### Step 2: Research the label
Goal: get the actual label image so the color palette is real, not guessed.

1. WebSearch: `"<drink_name>" wine label OR bottle illustration`
2. If a candidate page is found (Vivino, official site, retailer), `WebFetch` it.
   - Vivino returns 403 — try the producer's official site first.
   - **Important:** even when WebFetch's text reply says "this is just CSS / I can't see the label", it often **silently downloads images** to `tool-results/webfetch-*.jpg`. Check the message body for `[Binary content (image/jpeg, ... saved to ...]`.
3. Use the `Read` tool on the saved image path. The multimodal model will SEE the label.
4. Extract from what you see:
   - 2–4 dominant colors (background, ink/text, highlights, accent) — guess hex codes
   - Illustration style (line art, watercolor, photo, vintage, minimal)
   - Key motifs (animal, object, pattern, typography quirks)
   - Region / origin (e.g., "Marlborough New Zealand")
   - **Typography** — this carries the label's 감성, capture it precisely:
     - Classification: serif / slab serif / sans / script / blackletter / hand-lettered / art-nouveau / art-deco / grotesque / humanist / display
     - Weight & width: thin / regular / bold / ultra-bold, condensed / regular / extended
     - Case & layout: all caps / small caps / mixed, centered / stacked / arched / circular
     - Character quirks: swashes, ligatures, drop caps, ornamental flourishes, stencil cuts, letterpress imprint, gold foil, embossing
     - Vibe in 2–3 words (e.g., "1920s apothecary", "French children's book", "Scottish distillery crest", "minimalist Scandinavian")

If after 2–3 search attempts you still have no label image, ask the user to:
- Describe the label colors in one line, OR
- Send a photo path you can `Read`, OR
- Authorize a generic palette inspired by the drink type

### Step 2b: Research the region — landmarks, specialties, traditions
Goal: ground the diorama in the drink's **actual hometown** so it feels specific, not generic "wine village". Once you know the region from Step 2, WebSearch for:

1. `"<region>" famous landmarks OR iconic buildings` — pick 1 hero landmark (clock tower, cathedral, lighthouse, bridge, mountain silhouette) for the Step 3 `{landmark}` slot
2. `"<region>" local specialties OR traditional food` — 2–3 items to scatter as miniature props (cheese wheels, oysters, chocolate, bread, mussels)
3. `"<region>" traditional craft OR folk culture` — textile patterns, pottery, festivals, signage styles (these enrich the hand-painted signage from the typography block)
4. Native flora/fauna specific to the region — trees, birds, animals beyond generic grape vines

Keep it tight: 3–5 concrete nouns total. Prefer **specific** ("Pohutukawa trees, greenshell mussels, Marlborough Sounds lighthouse") over **generic** ("trees, seafood, coast"). Drop these into Step 3's City contents and `{landmark}` slot.

If the region is unknown or the drink has no real hometown (e.g., generic cocktails), skip this step — fall back to the drink's archetype (e.g., tiki for rum cocktails).

### Step 3: Draft the prompt
Fill this template (keep the structure — strict palette, iso 35°, clay-line hybrid is the signature look):

```
An isometric 3D miniature city diorama inspired by {drink_name} from {region},
infused with {drink_type} atmosphere and {ingredient_keywords}.

Floating square island viewed from a 35-degree isometric angle, no enclosure,
no glass dome, open to the air on a soft seamless {bg_color_name} background.

Strict 3-color palette ONLY:
- {color1_name} {color1_hex} (background, base, foliage)
- {color2_name} {color2_hex} (line work, outlines, characters, text-like details)
- {color3_name} {color3_hex} (highlights, walls, accents, liquid)

Style: vintage pen-and-ink illustration translated into 3D, matte clay-render
look with crisp black outlines, line-art 3D hybrid, miniature pop-up book
diorama. Soft flat lighting, no harsh shadows, no gradients beyond the
three colors.

Typographic soul of the label ({type_vibe}): the diorama carries the same
lettering spirit — {type_classification}, {type_weight_width}, {type_quirks}.
Reflect this through hand-painted signage on shop fronts, café chalkboards,
barrel stamps, banner ribbons, and awning text — all shaped in that exact
lettering style (but with no readable words, just the *shape and rhythm* of
the letters). Street signs, posters, and crate markings should feel like
they were printed from the same font family as the bottle label.

City contents:
- {production building — winery / distillery / brewery / bar with cellar}
- {label motif characters — e.g. cats, animals, mascots, miniature people}
- {drink ingredients as objects — e.g. apples, citrus, grain, herbs, grapes}
- {label accessories — e.g. yarn balls, copper still, oak barrels, hop sacks}
- A small market square, cobblestone streets, lampposts, planters, café tables
- A small bottle of {drink_name} and a glass on one of the café tables (witty)
- **One signature landmark** — the visual anchor of the island ({landmark}).
  Pick ONE that fits the drink's region/motif: e.g. clock tower, lighthouse,
  windmill, pagoda, chapel spire, observatory dome, giant oak tree, stone
  arch bridge, carousel, watermill. Taller than everything else, placed
  off-center (rule of thirds), so the eye lands on it first.

Composition: perfect square 1:1, centered floating island, ultra-detailed
miniature, hyperreal 3D render with vintage illustration character, in the
spirit of Wes Anderson meets old French children's book illustration.
{mood adjective} mood. No text, no logo, no watermark.
```

### Step 4: Show the prompt
Print the rendered prompt + the extracted palette as a markdown code block so the user can read or copy it cleanly.

**If `PROMPT_ONLY = true`:** STOP HERE. Do not ask for confirmation, do not dispatch anything. The prompt is the deliverable.

**If `PROMPT_ONLY = false`:** Ask "OK to generate? (or tweak palette / elements / mood first)"

Iterate freely **before** spending an API call. Common pre-generation tweaks:

| User says | Do |
|-----------|----|
| "색이 틀렸어" | Re-extract from label or ask for hexes, rewrite palette block |
| "고양이 빼" | Remove characters from City contents |
| "더 코지" | Change `{mood adjective}` to `cozy warm` |
| "더 청량" | Change to `crisp fresh zesty` |
| "더 어둡게" | Change to `moody nocturnal` (and use darker palette) |

### Step 5: Dispatch to dev-run-t2i
**Skip this step entirely if `PROMPT_ONLY = true`.**

Once the user confirms, invoke the `dev-run-t2i` skill via the **Skill tool** with these arguments:

- **prompt:** the final one-line version of Step 3 (collapse newlines to spaces)
- **--aspect 1:1** (the iso-city composition is square)
- **--out** `~/Desktop/gemini-out/<slug>.png`

**Slug rules:** lowercase the drink name, hyphenate, append `-iso-city`. For follow-ups, increment: `<slug>-v2.png`, `-v3.png`. Never overwrite previous versions — the user wants to compare.

Examples:
- `"Knitten Sauvignon Blanc"` → `knitten-sauv-blanc-iso-city.png`
- `"Lagavulin 16"` → `lagavulin-16-iso-city.png`

If you can't invoke `dev-run-t2i` automatically (e.g., Skill tool unavailable in this context), print the exact slash command for the user to copy:

```
/dev-run-t2i "<full prompt here>" --aspect 1:1 --out ~/Desktop/gemini-out/<slug>.png
```

### Step 6: Iterate after viewing
**Skip this step entirely if `PROMPT_ONLY = true`.**

After the image is generated, ask for feedback. Common post-generation iterations and how to fix them in the prompt:

| User says | Fix |
|-----------|-----|
| "고양이가 이상해" | Drop all characters, rebuild with architecture only, dispatch v2 |
| "색이 새어나갔어" | Re-emphasize "Strict 3-color palette ONLY" + restate hexes, dispatch v2 |
| "더 가까이" | Add `tight close-up framing, fills frame` |
| "더 위에서" | Change angle to `top-down 90-degree view` |
| "다른 무드" | Swap mood adjective |
| "더 디테일" | Add more named objects to City contents |

For each iteration, build a fresh prompt and dispatch `dev-run-t2i` again with an incremented `-v2` / `-v3` slug.

## Notes

- **Signature style is non-negotiable:** strict 3-color palette + iso 35° + clay-line hybrid + Wes Anderson mood. Photoreal, anime, watercolor are different styles — use a different skill for those.
- **Why prompt-building is its own skill:** the hard part is *not* the API call (dev-run-t2i handles that in 30 lines). The hard part is researching the label, extracting real colors, and structuring a prompt that survives Gemini's tendency to drift. That logic is what's worth saving.
- **Output dir:** `~/Desktop/gemini-out/` is the convention shared with other Gemini image skills. Keep it consistent so the user has one folder to check.
