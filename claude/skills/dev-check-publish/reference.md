# dev-check-publish Reference

Full checklist details with severity tables, fix patterns, and output format template.

---

## Checklist Details

### 1. PATH — Asset Path Resolution

**Why it breaks:** GitHub Pages serves from a subpath (e.g., `/repo-name/`). Absolute paths starting with `/` resolve to the domain root, not the app root.

| Check | Severity |
|-------|----------|
| Importmap paths reference `/node_modules/` | FAIL |
| Any `src`, `href`, or `url()` starts with `/` (non-CDN) | FAIL |
| Scripts use `fetch()` or `new URL()` with absolute local paths | FAIL |
| All local asset refs are relative (`./` or bare) | PASS condition |

**Fix pattern:** Use CDN URLs for dependencies, relative paths for local assets.

### 2. DEPS — Dependency Availability

**Why it breaks:** `node_modules/` is gitignored. Local dependencies won't exist on the deployed server.

| Check | Severity |
|-------|----------|
| Importmap or script tags reference `node_modules/` | FAIL |
| External CDN URLs use unversioned paths | WARN |
| CDN URLs use pinned versions | PASS condition |

**Fix pattern:** Replace with versioned CDN URLs (jsdelivr, unpkg, esm.sh) or bundle into `assets/`.

### 3. SECRET — Secrets and Privacy

| Check | Severity |
|-------|----------|
| API keys, tokens, credentials in source | FAIL |
| Internal/local filesystem paths in code | WARN |
| `.env` files in deploy directory | FAIL |
| Hardcoded localhost URLs (non-development) | WARN |

**Scan patterns:** `API_KEY`, `SECRET`, `TOKEN`, `password`, `credential`, `/Users/`, `/home/`, `C:\\`, `D:\\`, `localhost`

### 4. META — HTML Meta Tags

| Check | Severity |
|-------|----------|
| Missing `<title>` | WARN |
| Missing `<meta name="description">` | WARN |
| Missing Open Graph tags (og:title, og:description, og:image) | WARN |
| Missing favicon | WARN |
| Has viewport meta tag | PASS condition |

### 5. LEGAL — License and Attribution

| Check | Severity |
|-------|----------|
| Third-party assets without attribution | WARN |
| Source comments reference external repos/authors | INFO — verify license |
| No LICENSE file in project | WARN |

**Scan for:** URL patterns in comments, `from`, `source:`, `credit`, `license`, known asset repos.

### 6. SIZE — File Size and Performance

| Check | Severity |
|-------|----------|
| Any single file > 50MB | FAIL (GitHub hard limit is 100MB) |
| Total deploy size > 500MB | WARN |
| Uncompressed images > 2MB each | WARN |
| No lazy loading for image-heavy content | WARN |

**Report:** Total file count, total size, top 5 largest files.

### 7. COMPAT — Browser Compatibility

| Check | Severity |
|-------|----------|
| Uses WebGPU without fallback or notice | WARN |
| Uses bleeding-edge APIs (check for: WebGPU, WebXR, WebTransport) | WARN |
| No `<noscript>` fallback | INFO |
| ES module scripts without `type="module"` | FAIL |

### 8. CONSOLE — Debug Output

| Check | Severity |
|-------|----------|
| `console.log` in production code (non-error) | WARN |
| `console.debug` or `console.trace` | WARN |
| `debugger` statements | FAIL |
| `alert()` calls | WARN |
| `console.warn` / `console.error` in catch blocks | PASS (acceptable) |

---

## Output Format

```markdown
## Publish Readiness: {project-name}

**Target:** {path}
**Files:** {count} files, {total-size}
**Verdict:** READY / BLOCKED / NEEDS ATTENTION

### Results

| # | Check   | Status | Issues |
|---|---------|--------|--------|
| 1 | PATH    | FAIL   | 4 absolute paths in importmap |
| 2 | DEPS    | FAIL   | node_modules referenced |
| 3 | SECRET  | PASS   | — |
| 4 | META    | WARN   | Missing og:image, description |
| 5 | LEGAL   | WARN   | Matcap source needs attribution |
| 6 | SIZE    | PASS   | 79MB total |
| 7 | COMPAT  | WARN   | WebGPU required, no fallback notice |
| 8 | CONSOLE | PASS   | Error handling only |

### FAIL — Must Fix

#### PATH-01: Importmap uses absolute /node_modules/ paths
- **File:** index.html:12-15
- **Fix:** Replace with CDN URLs:
  ```
  "three": "https://cdn.jsdelivr.net/npm/three@0.172.0/build/three.core.js"
  ```

### WARN — Recommended

#### META-01: Missing Open Graph tags
...

### Verdict

{Summary sentence. If any FAIL exists: "Blocked — fix N issues before deploying."}
{If WARN only: "Ready with N recommendations."}
{If all PASS: "Ready to publish."}
```

---

## Related

- `standards/javascript.md` — JS coding standards
- `standards/css.md` — CSS coding standards
- `skills/review-audit-web/` — Code quality review (different focus: code standards vs deploy readiness)
