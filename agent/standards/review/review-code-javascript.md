---
status: accepted
domains: web
repo-keys: caol-ila,mmd-anju,ta-portfolio
languages: javascript,typescript
task-types: review
context-profile: web-review
exclude-when: unreal,obsidian
---
# JavaScript & Node.js Code Review Checklist

**Version:** 0.1.0

## Changelog

- **0.1.0** - Initial release based on research from 48 sources (OWASP, CWE, Node.js docs, IEEE papers, industry guides)

---

## Purpose

**Review checklist** for JavaScript/Node.js code reviews. This is a companion to:

- `javascript.md` — Coding standards (for **generating** code)
- `review-template.md` — Output format (for **structuring** review feedback)

This document defines **what to check**. Use `review-template.md` for how to format findings.

---

## How to Use

### Markers

| Marker | Meaning |
|--------|---------|
| 🔧 | **Automatable** — ESLint/tools can catch this. Only check manually if tooling is missing. |
| 👁 | **Human review required** — Tools cannot reliably detect this. Always check manually. |

### Severity

| Icon | Level | Meaning |
|------|-------|---------|
| 🔒 | Critical | Security vulnerability. Must fix before merge. |
| ⚠️ | Error | Reliability/performance issue. Must fix before merge. |
| 💡 | Suggestion | Maintainability improvement. Recommended but not blocking. |

### Conditional Sections

Sections marked **(if applicable)** only apply when the codebase uses that technology. Skip if not relevant.

---

## Security

> Every item here maps to OWASP, CWE, or Node.js official security guidance.

- 🔒 👁 **Input validation** — Every `req.body`, `req.query`, `req.params`, `req.headers` entry point is validated against expected type/format before processing
  - *SEC-01 · OWASP Node.js Cheat Sheet*

- 🔒 👁 **Prototype pollution** — Object merge/assign functions filter `__proto__`, `constructor`, `prototype` keys. Use `Object.create(null)` for dictionary objects
  - *SEC-02 · CWE-1321 · CVE-2019-10744 (lodash)*

- 🔒 🔧 **Dangerous functions** — No `eval()`, `Function()`, `setTimeout(string)`, `child_process.exec()` with user input. Use `execFile()` / `spawn()` with argument arrays
  - *SEC-03 · OWASP · eslint-plugin-security: detect-eval-with-expression, detect-child-process*

- 🔒 👁 **Path traversal** — User input never directly concatenated into file paths. Resolved paths checked against intended base directory with `path.resolve()` + prefix check
  - *SEC-04 · eslint-plugin-security: detect-non-literal-fs-filename*

- 🔒 👁 **SSRF** — Outbound HTTP requests (`fetch`, `axios`, `http.request`) based on user input validate target against an allowlist of permitted hosts
  - *SEC-05 · OWASP*

- 🔒 🔧 **ReDoS** — No nested quantifiers `(a+)*` or overlapping alternation on user input. Use `safe-regex` or `node-re2` for user-facing patterns. Bound input length before regex
  - *SEC-09 · Node.js Official Docs · eslint-plugin-security: detect-unsafe-regex, detect-non-literal-regexp*

- 🔒 👁 **Cookie flags** — Session cookies set `httpOnly: true`, `secure: true`, `sameSite: 'strict'` (or `'lax'` with justification)
  - *SEC-06 · OWASP*

- 🔒 👁 **Security headers** — `helmet` middleware or manual headers (HSTS, X-Frame-Options, CSP, X-Content-Type-Options). No `'unsafe-inline'`/`'unsafe-eval'` in CSP without justification. `X-Powered-By` removed
  - *SEC-07 · OWASP*

- 🔒 👁 **Request size limits** — `express.json({ limit })` and `express.urlencoded({ limit })` configured with explicit values appropriate per endpoint
  - *SEC-08 · OWASP*

- 🔒 👁 **Data exposure** — `res.json()` never receives raw DB/ORM objects. Explicit allowlist serialization for user-facing responses. No stack traces in production error responses
  - *SEC-12 · OWASP*

- 🔒 👁 **HTTP parameter pollution** — Handlers account for `req.query` values being arrays when duplicate params are sent. Use `hpp` middleware or explicit type checks
  - *SEC-11 · OWASP*

- 🔒 👁 **dangerouslySetInnerHTML** — Any usage sanitizes content with DOMPurify first. Encapsulated in a dedicated wrapper component
  - *IND-REACT-07 · OWASP*

---

## Reliability

- ⚠️ 🔧 **Promise rejection handling** — Every promise has `.catch()` or is in `try/catch` within async functions. No floating promises
  - *REL-01 · ESLint: no-floating-promises, promise/catch-or-return*

- ⚠️ 🔧 **Missing await** — All async call sites that need their result or error handling use `await`. Special attention to `return asyncFn()` inside `try/catch` (must be `return await`)
  - *REL-04 · ESLint: @typescript-eslint/no-floating-promises*

- ⚠️ 👁 **EventEmitter error listener** — Every `EventEmitter` instance and stream has `.on('error', ...)` registered. Missing listener causes process crash
  - *REL-03 · OWASP*

- ⚠️ 👁 **Event listener memory leak** — No `.on()` / `.addListener()` inside request handlers without corresponding removal. Use `.once()` for one-time listeners
  - *REL-05 · MaxListenersExceededWarning = red flag*

- ⚠️ 👁 **Unbounded cache** — Module-level `Map` / `Object` used as cache has LRU eviction and/or TTL. Plain objects grow unboundedly in long-running processes
  - *REL-06 · "King of memory leak commonness"*

- ⚠️ 👁 **Process-level error handlers** — `uncaughtException` handler logs + exits (never continues). `unhandledRejection` handler logs for safety net
  - *REL-02 · OWASP*

- ⚠️ 👁 **Express async error middleware** — Error-handling middleware `(err, req, res, next)` exists at end of chain. Async handlers wrapped with `try/catch` + `next(error)` or `express-async-errors`
  - *REL-07*

---

## Performance

- ⚠️ 🔧 **No sync APIs** — No `*Sync()` calls (`fs.readFileSync`, `crypto.randomBytes` in blocking mode, `zlib.*Sync`) in server code after startup
  - *PERF-01 · Node.js Official Docs · ESLint: node/no-sync*

- ⚠️ 👁 **Bounded user-controlled iteration** — Loops/recursion driven by user input enforce `Math.min(userValue, MAX)` upper bound
  - *PERF-02 · Node.js Official Docs*

- ⚠️ 👁 **Large JSON operations** — `JSON.parse`/`JSON.stringify` on potentially large objects (>1MB) use streaming alternatives (JSONStream, bfj) or enforce size limits
  - *PERF-03 · Node.js Official Docs (2^21 elements = 0.7s stringify)*

- ⚠️ 👁 **CPU-intensive work offloaded** — Image processing, PDF generation, heavy computation runs in Worker Threads with bounded pool size (not per-request workers)
  - *PERF-04 · Node.js Official Docs*

- ⚠️ 👁 **Independent async operations parallelized** — Sequential `await` on independent calls converted to `Promise.all()`
  - *IND-PERF-01 · javascript.md reference*

- ⚠️ 👁 **Event loop monitoring** — Production has event loop latency monitoring. Overloaded server responds 503 instead of timing out
  - *PERF-05 · OWASP*

---

## Maintainability

> For coding style rules (naming, const/let, ES6+, SRP, nesting, early returns, comments), see **javascript.md**. Below are review-specific checkpoints not covered there.

- 💡 👁 **Descriptive variable names** — No single-letter or cryptic abbreviations (`i`, `j`, `e`, `el`, `btn`, `v`, `cb`). Use full descriptive names: `layerIndex`, `event`, `element`, `button`, `value`, `callback`. Applies to loop indices, callback parameters, and all local variables
  - *MAINT-01 · javascript.md Naming Conventions · Airbnb Style Guide*

- 💡 👁 **Magic values** — Bare numeric/string literals in conditionals, loop bounds, and config extracted to named constants with explanatory names
  - *MAINT-02 · Microsoft Engineering Playbook*

- 💡 👁 **Comments explain "why"** — Comments describe reasoning and intent, not what the code does. Complex business rules have rationale documented
  - *MAINT-06 · javascript.md reference*

- 💡 👁 **Separation of concerns** — Business logic, data access, and API/presentation layers are in separate modules. Controllers are thin
  - *IND-CQ-13*

- 💡 👁 **Resource cleanup** — DB connections, file handles, streams closed after use. Timers/intervals cancelled on teardown
  - *IND-CQ-14*

---

## Testing

> Check test quality, not just coverage percentage.

- 💡 👁 **AAA pattern** — Tests structured as Arrange (setup) / Act (execute) / Assert (verify) with clear visual separation
  - *MAINT-03 · IND-TEST-01 · Microsoft Engineering Playbook*

- 💡 👁 **Test behavior, not implementation** — Tests verify public API and observable outcomes. They survive internal refactoring without changes
  - *IND-TEST-03*

- 💡 👁 **Test independence** — No shared mutable state between tests. Each test creates its own data. No dependency on execution order
  - *IND-TEST-04*

- 💡 👁 **No logic in tests** — No conditionals, loops, or try/catch in test bodies. Tests are flat and declarative
  - *IND-TEST-05*

- 💡 👁 **Edge case coverage** — Tests cover null, undefined, empty arrays/strings, boundary values, error responses, and timeouts — not just happy path
  - *IND-TEST-07*

- 💡 🔧 **Async assertions** — Async test methods properly `await` assertions. Missing `await` causes tests to pass without executing assertions
  - *IND-TEST-09 · ESLint: jest/valid-expect-in-promise*

---

## Dependencies & Supply Chain

- 🔒 🔧 **Lockfile committed** — `package-lock.json` (or `pnpm-lock.yaml`) is in version control. CI uses `npm ci`, not `npm install`
  - *IND-DEP-01 · OpenSSF*

- 🔒 🔧 **npm audit in CI** — `npm audit` runs automatically. Critical/high severity vulnerabilities block merge
  - *IND-DEP-02 · OWASP*

- 🔒 👁 **New dependency evaluation** — New packages assessed for: maintenance activity, last publish date, download count, license, bundle size impact, whether native JS suffices
  - *IND-DEP-03 · Endor Labs*

- 🔒 🔧 **Unused dependencies removed** — `package.json` contains no packages not imported in the codebase
  - *IND-DEP-04 · depcheck, npm-check*

- 🔒 👁 **Install scripts audited** — Packages with `preinstall`/`install`/`postinstall` scripts reviewed for arbitrary code execution
  - *IND-DEP-05 · npm Security Best Practices*

- 🔒 👁 **Lockfile diff reviewed** — When `package-lock.json` changes, diff reviewed for unexpected package additions, version changes, or registry changes
  - *IND-DEP-07 · lockfile-lint*

---

## React & Frontend (if applicable)

- ⚠️ 🔧 **Hook dependency arrays** — `useEffect`/`useMemo`/`useCallback` have correct dependency arrays. Missing deps cause stale closures; extra deps cause unnecessary re-runs
  - *IND-REACT-02 · ESLint: react-hooks/exhaustive-deps*

- ⚠️ 👁 **useEffect cleanup** — Effects that create subscriptions, timers, event listeners, or async operations return cleanup functions. `AbortController` used for fetch
  - *IND-REACT-03*

- ⚠️ 🔧 **List key props** — List-rendered elements have stable, unique `key` props. Array index not used as key when items can reorder/insert/delete
  - *IND-REACT-08 · ESLint: react/no-array-index-key*

- 💡 👁 **Memoization appropriateness** — `React.memo`, `useMemo`, `useCallback` used where profiling shows benefit. Not applied prematurely everywhere
  - *IND-REACT-05*

- 💡 👁 **Component single responsibility** — Each component does one thing. Data fetching and rendering separated
  - *IND-REACT-01*

---

## Node.js Production (if applicable)

- ⚠️ 👁 **Process manager** — Production uses PM2, systemd, Docker restart policy, or container orchestrator. Never bare `node app.js`
  - *IND-PROD-01*

- ⚠️ 👁 **Graceful shutdown** — On SIGTERM/SIGINT: stop accepting connections, drain requests, close DB connections, flush logs, then exit
  - *IND-PROD-02*

- ⚠️ 👁 **Structured logging** — Uses Pino/Winston/Bunyan with appropriate log levels. Includes request IDs. Logs to stdout. Never logs passwords/tokens/PII
  - *IND-PROD-04 · OWASP*

- 🔒 👁 **Non-root execution** — Node.js process does not run as root. Docker containers specify `USER` directive
  - *IND-PROD-07*

---

## TypeScript (if applicable)

- ⚠️ 🔧 **strict: true** — `tsconfig.json` has `strict: true` enabled (activates strictNullChecks, noImplicitAny, strictFunctionTypes)
  - *TS-04 · CircleCI*

- ⚠️ 🔧 **Minimal any** — `any` type usage is minimal and justified. No `// @ts-ignore` without documented reason
  - *TS-03 · Kodus*

- 💡 👁 **Type accuracy** — Interfaces accurately describe data shape. Generics properly constrained. Union types comprehensive. Optional parameters reflect actual optionality
  - *TS-03 · TypeScript prevents ~15% of committed bugs (Gao et al., ICSE 2017)*

---

## Automation Reference

### ESLint Plugin Mapping

Rules marked 🔧 can be automated. Key plugins:

| Plugin | Covers |
|--------|--------|
| `eslint-plugin-security` | eval, child_process, regex, fs, buffer, timing attacks (14 rules) |
| `@typescript-eslint` | no-floating-promises, strict types, no-explicit-any |
| `eslint-plugin-react-hooks` | exhaustive-deps, rules-of-hooks |
| `eslint-plugin-jsx-a11y` | Accessibility checks |
| `eslint-plugin-jest` | Test assertion patterns |
| `eslint-plugin-node` | No sync APIs, no deprecated APIs |

### eslint-plugin-security Rules (14 total)

| Rule | Detects | Severity |
|------|---------|----------|
| `detect-bidi-characters` | Trojan source attacks (unicode) | High |
| `detect-buffer-noassert` | Buffer noAssert flag | Medium |
| `detect-child-process` | child_process + non-literal exec() | High |
| `detect-disable-mustache-escape` | Disabled HTML escaping | High |
| `detect-eval-with-expression` | eval() with variables | Critical |
| `detect-new-buffer` | new Buffer() with variables | Medium |
| `detect-no-csrf-before-method-override` | CSRF middleware ordering | High |
| `detect-non-literal-fs-filename` | fs with variable filenames | High |
| `detect-non-literal-regexp` | RegExp() with variables (ReDoS) | High |
| `detect-non-literal-require` | require() with variables | High |
| `detect-object-injection` | Bracket notation injection | Medium |
| `detect-possible-timing-attacks` | Sequential comparison timing | Medium |
| `detect-pseudoRandomBytes` | Weak randomness | Medium |
| `detect-unsafe-regex` | Expensive regex (event loop block) | High |

---

## Sources

### Key References

1. [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
2. [Node.js Official - Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)
3. [CWE-1321: Prototype Pollution](https://cwe.mitre.org/data/definitions/1321.html)
4. [Microsoft Engineering Playbook - JS/TS Reviews](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)
5. [Gao et al. - To Type or Not to Type (ICSE 2017)](https://dl.acm.org/doi/10.1109/ICSE.2017.75)
6. [Node.js Best Practices (goldbergyoni)](https://github.com/goldbergyoni/nodebestpractices)
7. [JavaScript Testing Best Practices (goldbergyoni)](https://github.com/goldbergyoni/javascript-testing-best-practices)
8. [eslint-plugin-security](https://www.npmjs.com/package/eslint-plugin-security)
9. [OpenSSF npm Best Practices for Supply Chain](https://openssf.org/blog/2022/09/01/npm-best-practices-for-the-supply-chain/)
10. [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

### Full Research

All 48 sources with detailed rule extraction:
`~/.claude/private/research/javascript-code-review-criteria.md`
