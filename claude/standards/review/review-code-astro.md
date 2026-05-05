---
status: accepted
---
# Astro Framework Code Review Checklist

**Version:** 0.1.0

## Changelog

- **0.1.0** — Initial release. Astro 4–6 SSR/SSG hybrid model, islands hydration, content collections, endpoints. Sourced from Astro official docs (docs.astro.build), MDN, OWASP front-end guidance, and the caol-hq dashboard postmortem (`OpenPRsWidget` 7.2s → 0.22s perf fix).

---

## Purpose

**Review checklist** for `.astro` components, page routes, endpoints, and `astro.config.mjs`. Companion to:

- `review-code-javascript.md` — for plain JS/TS files in `src/lib/`, `src/pages/api/`
- `review-code-css.md` — for `<style>` blocks and global CSS
- `review-template.md` — output format

This document defines **what to check that is Astro-specific**. For generic JS/TS rules, defer to `review-code-javascript.md`.

---

## How to Use

### Markers

| Marker | Meaning |
|--------|---------|
| 🔧 | **Automatable** — `astro check`, ESLint plugins, `tsc --noEmit`, or build-time errors catch this |
| 👁 | **Human review required** — Tools cannot reliably detect; check manually |

### Severity

| Icon | Level | Meaning |
|------|-------|---------|
| 🔒 | Critical | Security vulnerability or secret leak. Must fix before merge |
| ⚠️ | Error | Reliability/perf/correctness issue. Must fix before merge |
| 💡 | Suggestion | Maintainability improvement. Recommended, not blocking |

### Conditional Sections

Sections marked **(if applicable)** apply only when the codebase uses that feature. Skip if irrelevant.

---

## Security

> Astro renders on the server (SSR) by default in `output: 'server'`. Frontmatter runs with full Node privileges; client bundle exposes anything `import`-ed at the top level of an island component.

- 🔒 👁 **No secrets in client islands** — Any module imported by a `client:*` directive island is shipped to the browser. API keys, DB credentials, and `process.env.SECRET_*` must never be referenced in island scripts. Frontmatter (`---` block) is server-only and safe
  - *SEC-A01 · Astro: "Server vs Client" docs*

- 🔒 👁 **Env var prefix discipline** — Only variables prefixed `PUBLIC_` are exposed via `import.meta.env.PUBLIC_*` to the client. Anything sensitive must lack the prefix and be read only inside frontmatter or `src/pages/api/**`
  - *SEC-A02 · Astro: "Environment Variables" docs*

- 🔒 👁 **`set:html` xss** — `<div set:html={value} />` bypasses Astro's auto-escaping. Value must be either a static literal, output of a sanitiser (DOMPurify, sanitize-html), or a renderer (`marked`, `mdast-util-to-html`) configured to strip script/event handlers. Never pass raw user/external input
  - *SEC-A03 · OWASP XSS · Astro: "Template Directives" docs*

- 🔒 👁 **Endpoint input validation** — `src/pages/api/**.ts` `POST`/`PUT`/`DELETE` handlers validate `request.json()` / `request.formData()` payloads against a schema (zod, valibot, manual type guard) before use. Same rule for dynamic route params (`Astro.params`)
  - *SEC-A04 · OWASP API Security Top 10*

- 🔒 👁 **No shell injection in frontmatter** — `execSync('cmd ' + userInput)` is forbidden. Use `execFile`/`spawn` with arg arrays. Same applies inside endpoint handlers
  - *SEC-A05 · CWE-78 · javascript review SEC-03*

- 🔒 👁 **CSRF on stateful endpoints** — POST/PUT/DELETE endpoints that change server state verify a CSRF token, `Origin` header, or `SameSite=Strict` session cookie. `Astro.cookies` set with `httpOnly: true, secure: true, sameSite: 'strict'`
  - *SEC-A06 · OWASP CSRF · Astro: "Cookies" docs*

- 🔒 👁 **No raw `Astro.request.headers` echo** — Reflecting headers (User-Agent, Referer, custom) into rendered HTML must escape via Astro's default interpolation `{value}` — not `set:html`. Watch for log lines that interpolate untrusted headers into markup
  - *SEC-A07 · OWASP Reflected XSS*

---

## SSR / SSG Correctness

- ⚠️ 👁 **Output mode matches usage** — `astro.config.mjs` `output` is one of `'static'` (default), `'server'`, or `'hybrid'`. If any page uses `Astro.request`, `Astro.cookies`, or `export const prerender = false`, output must be `'server'` or `'hybrid'`. If 100% of pages are `prerender: true`, prefer `'static'` for cheaper hosting
  - *ASTRO-01 · Astro: "Output modes" docs*

- ⚠️ 🔧 **Adapter present when SSR** — `output: 'server'` or `'hybrid'` requires an `adapter` (`@astrojs/node`, `@astrojs/vercel`, `@astrojs/cloudflare`, etc.). Build fails without one
  - *ASTRO-02 · Astro: "Adapters" docs*

- ⚠️ 👁 **`prerender` per-page is intentional** — In `'hybrid'` mode, every page declares `export const prerender = true|false` consciously. A page that calls `Astro.cookies` or `Astro.request.headers.get(...)` but is `prerender: true` will throw at build (or worse, return stale snapshot)
  - *ASTRO-03 · Astro: "On-demand Rendering" docs*

- ⚠️ 👁 **No browser globals in frontmatter** — `window`, `document`, `localStorage`, `navigator` are undefined in SSR. Move such code into `<script>` blocks or `client:only` islands
  - *ASTRO-04 · Astro: "Server vs Client" docs*

- ⚠️ 👁 **No Node-only modules in islands** — `node:fs`, `node:child_process`, `node:os`, native bindings are server-only. Importing them from a component that ships to the browser breaks the build or pollutes the client bundle
  - *ASTRO-05 · Astro: "Server vs Client" docs*

- ⚠️ 👁 **`Astro.glob` / `import.meta.glob` paths are static literals** — Astro evaluates the glob pattern at build time. Dynamic strings produce empty results silently
  - *ASTRO-06 · Vite: `import.meta.glob` docs*

---

## Performance — Frontmatter

> Frontmatter (`---` block) runs **once per request** in SSR mode (no implicit cache). Slow frontmatter blocks the entire response.

- ⚠️ 👁 **Parallel async work** — Sequential `await` over a list (`for ... await execAsync(...)` across N items) blocks for N×latency. Use `await Promise.all(items.map(async ...))` for independent calls. Specifically applies to `gh`, `git`, `fetch`, file reads across many paths
  - *PERF-A01 · Caol HQ postmortem: OpenPRsWidget 7.2s → 0.22s, commit `83c4ed5`*

- ⚠️ 👁 **TTL cache for slow upstream calls** — Frontmatter that fetches from a flaky/slow source (gh API, GraphQL, image OCR, LLM) memoises on `globalThis` (or a Map keyed by request signature) with explicit TTL. Document the TTL in a comment
  - *PERF-A02 · Same postmortem*

- ⚠️ 👁 **No sync I/O when async exists** — Prefer `fs.promises.readFile` over `readFileSync`, `execAsync` over `execSync`. The Astro renderer is async; sync calls block the request thread
  - *PERF-A03 · Node.js perf docs*

- 💡 👁 **Frontmatter weight** — Frontmatter > 50 lines or > 3 distinct data sources is a smell. Extract to `src/lib/<domain>.ts` so the same logic is reusable across widgets and unit-testable
  - *PERF-A04 · Astro: "Components" docs*

- ⚠️ 👁 **Timeout on every external call** — Every `execAsync`/`fetch` in frontmatter passes an explicit timeout (default `gh`/`git` is unbounded). One slow repo must not hang the entire page
  - *PERF-A05 · Caol HQ postmortem*

---

## Performance — Islands & Hydration

- ⚠️ 👁 **Hydration directive is the cheapest sufficient one** — Order: no directive (zero JS) → `client:visible` → `client:idle` → `client:media` → `client:load` → `client:only`. Use `client:load` only when the component must be interactive immediately (above-the-fold form, header). `client:only` skips SSR entirely — only for components that genuinely cannot render server-side
  - *PERF-A06 · Astro: "Client Directives" docs*

- ⚠️ 👁 **Island prop payload size** — Props passed to a `client:*` component are JSON-serialised into the HTML. Passing an entire dataset (1000-row table, large JSON tree) inflates first byte. Pass only the IDs the island needs and fetch the rest from an endpoint
  - *PERF-A07 · Astro: "Sharing State" docs*

- 💡 👁 **`client:only` framework specified** — Always `client:only="react"` (or vue/svelte/solid), never bare `client:only`. The framework name is required for Astro to pick the right runtime
  - *PERF-A08 · Astro: "Client Directives" docs*

- 💡 👁 **No unused frameworks** — `astro.config.mjs` `integrations` includes only frameworks actually used by an island. Each adds ~30-50KB runtime to the build
  - *PERF-A09 · Astro: "Framework integrations" docs*

---

## Routing & Endpoints

- ⚠️ 👁 **`getStaticPaths` returns deterministic set** — In `'static'` or `prerender: true` pages with `[param]` routes, every reachable URL must be in the returned array. Add a CI check that the array is non-empty for production builds
  - *ROUTE-A01 · Astro: "Dynamic Routes" docs*

- ⚠️ 👁 **404/500 pages exist for SSR** — `output: 'server'` builds need explicit `src/pages/404.astro` and `src/pages/500.astro`. Default fallbacks expose stack traces in some adapters
  - *ROUTE-A02 · Astro: "Custom 404/500 Pages" docs*

- ⚠️ 👁 **Endpoint method handler completeness** — An API route exporting `GET` only will return 404 for `POST`. Either export every method the client uses, or export a handler that returns 405 for unsupported methods with `Allow` header set
  - *ROUTE-A03 · MDN: HTTP 405*

- ⚠️ 👁 **Endpoint return is a `Response`** — `src/pages/api/**.ts` handlers return `new Response(body, { status, headers })` (or use `Astro.* helper`s). Returning bare strings/objects is undefined behaviour
  - *ROUTE-A04 · Astro: "Endpoints" docs*

- ⚠️ 👁 **Catch-all params (`[...slug]`) sanitised** — Splat params can include `..`, `/`, encoded null. Validate against an allow-list of known slugs or sanitise before any filesystem/db lookup
  - *ROUTE-A05 · CWE-22 path traversal*

---

## Content Collections (if applicable)

- ⚠️ 👁 **Schema declared in `src/content/config.ts`** — Every collection has a `defineCollection({ schema: z.object({...}) })`. Untyped collections silently allow malformed entries
  - *CC-A01 · Astro: "Content Collections" docs*

- ⚠️ 🔧 **`astro sync` run after schema change** — Type generation (`.astro/types.d.ts`) is required for `getCollection` / `getEntry` to typecheck. Add to CI or pre-build hook
  - *CC-A02 · Astro: "Content Collections" docs*

- 💡 👁 **`getCollection` filter pushes to schema** — `getCollection('blog', e => e.data.draft !== true)` is fine, but if every consumer applies the same filter, encode it in the schema (`draft: z.boolean().default(false)`) and refine at query time
  - *CC-A03 · Astro: "Content Collections" docs*

---

## Styles

- ⚠️ 👁 **Scoped by default; `is:global` is explicit** — `<style>` blocks are scoped to the component. `<style is:global>` leaks to the whole page — use only for resets, design tokens, or third-party overrides. Document why in a comment above the block
  - *STYLE-A01 · Astro: "Styles" docs*

- 💡 👁 **No CSS-in-frontmatter strings** — Generating style strings in frontmatter (`const css = \`...\``) and injecting via `set:html` defeats scoping and breaks vendor prefixing. Use `<style define:vars={...}>` for dynamic values instead
  - *STYLE-A02 · Astro: "Styles → CSS variables" docs*

- 💡 👁 **Tailwind utility duplication** — If the same utility cluster appears 3+ times in one file, extract to a `@apply` rule in a `.css` file or a small Astro component
  - *STYLE-A03 · Tailwind docs*

---

## Build & Config

- ⚠️ 👁 **`astro.config.mjs` typed** — `import { defineConfig } from 'astro/config'` and the export uses `defineConfig(...)` so options are validated and autocompleted
  - *CONF-A01 · Astro: "Configuration" docs*

- ⚠️ 👁 **Vite `server.host` / `port` aware of conflicts** — Hardcoded port should be in a non-privileged range (>1024). If the project ships with a registered port, document it in the SKILL.md / README so multiple servers don't collide
  - *CONF-A02 · Caol HQ port migration: 972 (privileged, brittle) → 9720*

- ⚠️ 👁 **Server `host: 'localhost'`** for local dev — Binding to `0.0.0.0` exposes the dev server to LAN. Use `localhost` unless cross-device testing is the explicit purpose
  - *CONF-A03 · OWASP*

- 💡 👁 **`vite.server.watch.ignored`** — Large noisy dirs (`**/node_modules/**`, `**/target/**`, `**/.git/**`) explicitly ignored to prevent fs watcher saturation on M-series Macs
  - *CONF-A04 · Vite docs*

- ⚠️ 🔧 **`astro check` and `tsc --noEmit` in CI** — Both run on every PR. `astro check` catches frontmatter type errors and `Astro.props` mismatches that `tsc` alone misses
  - *CONF-A05 · Astro: "TypeScript" docs*

---

## TypeScript

- ⚠️ 👁 **`Astro.props` typed via `interface Props`** — Every `.astro` component that takes props declares `interface Props { ... }` in the frontmatter; consumers get autocomplete and rename refactors work
  - *TS-A01 · Astro: "Component Props" docs*

- ⚠️ 👁 **No `any` in frontmatter** — Replace with `unknown` + type narrowing. `any` silently disables checking inside the template too (since the template is typed)
  - *TS-A02 · javascript review TS-01*

- 💡 👁 **`extends` Astro tsconfig preset** — `tsconfig.json` extends `astro/tsconfigs/strict` (or `strictest`). The default `base` preset is too lenient for production
  - *TS-A03 · Astro: "TypeScript" docs*

---

## Accessibility & SEO

- ⚠️ 👁 **`<html lang="...">` set** — Either in a `BaseLayout.astro` or per-page. Missing `lang` breaks screen readers and translation tools
  - *A11Y-A01 · WCAG 3.1.1*

- ⚠️ 👁 **Per-page `<title>` and `<meta name="description">`** — Layout passes title/description as props; pages override with concrete values. Default placeholders shipped to production are a defect
  - *SEO-A01 · Google Search Central*

- ⚠️ 👁 **Image `alt` mandatory** — `<img>` and `<Image>` (from `astro:assets`) must have `alt`. Decorative images use `alt=""` explicitly, never omit
  - *A11Y-A02 · WCAG 1.1.1*

- 💡 👁 **`<Image />` over raw `<img>`** — `astro:assets` `<Image />` generates `width`/`height`, format negotiation (avif/webp), and lazy loading by default
  - *PERF-A10 · Astro: "Images" docs*

---

## Maintainability

- 💡 👁 **One responsibility per `.astro` file** — A component that fetches data, transforms it, computes derived state, AND renders is a smell. Extract data layer to `src/lib/<domain>.ts`. Threshold: > 100 lines of frontmatter or > 3 separate data sources
  - *MAINT-A01 · Astro: "Components" docs*

- 💡 👁 **Slot names match component intent** — Named slots (`<slot name="meta" />`) over positional `<slot />` for any non-trivial wrapper. Future readers should know what each slot is for from the consumer's `<Component>` block
  - *MAINT-A02 · Astro: "Slots" docs*

- 💡 👁 **No business logic in templates** — Computations, formatting, and derivations belong in the frontmatter (or `src/lib/`). Templates contain only `{value}` interpolation and structural directives (`{items.map(...)}`, `{cond && ...}`)
  - *MAINT-A03 · Astro: "Components" docs*

- 💡 👁 **Component naming = file location** — `src/components/widgets/SkillUsageWidget.astro` exports a `SkillUsageWidget` (PascalCase, matches filename). Avoid generic names like `Widget.astro`, `List.astro` at deep paths — they confuse imports
  - *MAINT-A04 · Astro: "Components" docs*

---

## Anti-Patterns (reject in review)

- ❌ Storing secrets in `PUBLIC_*` env vars
- ❌ `set:html` on user-controlled or fetched-from-network strings without sanitiser
- ❌ Sequential `await execAsync` over a list of repos/files (use `Promise.all`)
- ❌ Sync I/O (`readFileSync`, `execSync`) in SSR frontmatter
- ❌ `client:load` on every island "to be safe"
- ❌ Passing entire fetched datasets as props to a `client:*` island
- ❌ `prerender: true` on a page that calls `Astro.cookies` or `Astro.request.*`
- ❌ Catch-all `[...slug]` routes that interpolate the param into a filesystem path without sanitisation
- ❌ `output: 'static'` with an SSR-only feature in any page (silently breaks at build)
- ❌ Generic component names at deep paths (`widgets/Widget.astro`)

---

## Quick Reference Map

| File pattern | Primary checklist sections |
|--------------|----------------------------|
| `src/pages/index.astro` | SSR Correctness · Perf-Frontmatter · Routing |
| `src/pages/api/**.ts` | Security · Routing-Endpoints · review-code-javascript.md |
| `src/components/widgets/*.astro` | Perf-Frontmatter · Maintainability · Styles |
| `src/components/**Island.{astro,jsx,vue,svelte}` | Perf-Islands · Security (no secrets) |
| `src/layouts/*.astro` | Accessibility · SEO · Styles (`is:global`) |
| `src/content/config.ts` | Content Collections |
| `astro.config.mjs` | Build & Config |
| `src/lib/**.ts` | Defer to `review-code-javascript.md` |
