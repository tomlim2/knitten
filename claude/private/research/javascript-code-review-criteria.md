# JavaScript/Node.js Code Review Criteria: Research Findings

**Generated:** 2026-02-10
**Updated:** 2026-02-10 (added industry practice findings)
**Purpose:** Structured rules extracted from academic papers, OWASP, CWE, formal studies, and industry practice

---

## Table of Contents

1. [Security Rules](#1-security-rules)
2. [Reliability Rules](#2-reliability-rules)
3. [Performance Rules](#3-performance-rules)
4. [Maintainability Rules](#4-maintainability-rules)
5. [Automated vs Manual Review](#5-automated-vs-manual-review)
6. [TypeScript and Type Safety](#6-typescript-and-type-safety)
7. [Sources Bibliography](#7-sources-bibliography)

---

## 1. Security Rules

### SEC-01: Validate and Sanitize All User Input

- **Rule:** Never trust user-provided data. Validate against an allowlist of accepted input schemas. Sanitize all input before use in queries, file paths, or shell commands.
- **Category:** Security
- **Evidence:** OWASP Node.js Security Cheat Sheet identifies injection (SQL, XSS, command, LDAP, directory traversal) as the top category of vulnerabilities in Node.js applications. CWE-79 (XSS) was the most commonly found CWE in open-source projects in 2020 (FOSSA State of Open Source Vulnerabilities report).
- **Specific Check:** Review every point where user input enters the system (req.body, req.query, req.params, req.headers). Confirm each is validated against expected type and format before processing.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html), [CWE-79](https://cwe.mitre.org/data/definitions/79.html)

### SEC-02: Prevent Prototype Pollution

- **Rule:** Block `__proto__`, `constructor`, and `prototype` keys when merging or assigning user-controlled data to objects. Use `Object.create(null)` for dictionary-style objects. Consider `Object.freeze(Object.prototype)` for critical applications.
- **Category:** Security
- **Evidence:** CWE-1321 documents prototype pollution as a distinct vulnerability class. Real-world CVEs include CVE-2018-3721 (lodash), CVE-2019-10744 (lodash), CVE-2019-11358 (jQuery), CVE-2020-8203 (lodash). Prototype pollution can lead to remote code execution, privilege escalation, and DoS.
- **Specific Check:** Any function that recursively merges objects (deep merge, defaults assignment, configuration loading) must filter prototype-polluting keys. Review uses of `Object.assign()`, spread operators with dynamic keys, and any custom merge utilities.
- **Source:** [CWE-1321](https://cwe.mitre.org/data/definitions/1321.html), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### SEC-03: Avoid Dangerous Functions

- **Rule:** Never use `eval()`, `Function()` constructor, `setTimeout(string)`, or `setInterval(string)` with user-controlled input. Avoid `child_process.exec()` with unsanitized input; prefer `child_process.execFile()` or `child_process.spawn()` with explicit argument arrays.
- **Category:** Security
- **Evidence:** OWASP classifies `eval()` and `child_process.exec()` as dangerous functions. `exec()` passes arguments through `/bin/sh`, enabling command injection. These are the most direct paths to remote code execution in Node.js.
- **Specific Check:** Search for all uses of `eval`, `Function(`, `child_process.exec(`, `execSync(`. Verify none receive user-controlled strings.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### SEC-04: Guard Against Path Traversal

- **Rule:** Never directly concatenate user input into file paths before passing to `path.join()` or `path.resolve()`. Validate that resolved paths remain within expected directories using `path.resolve()` + prefix check.
- **Category:** Security
- **Evidence:** Path traversal allows attackers to read, modify, or execute arbitrary files via `../` sequences. Node.js `path.join('/uploads', '../../../etc/passwd')` resolves to `/etc/passwd`.
- **Specific Check:** Review all `fs.*` calls that accept user-influenced path arguments. Confirm the final resolved path is checked against the intended base directory.
- **Source:** [Node.js Secure Coding - Path Traversal](https://www.nodejs-security.com/book/path-traversal), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### SEC-05: Prevent Server-Side Request Forgery (SSRF)

- **Rule:** Never make outbound HTTP requests based on unvalidated user input. If outbound requests based on user input are required, validate target addresses against an allowlist of permitted hosts/URLs.
- **Category:** Security
- **Evidence:** SSRF allows attackers to make requests from the server, bypassing firewalls and accessing internal services (cloud metadata endpoints, internal APIs). Node.js applications frequently make HTTP requests, making this a common attack surface.
- **Specific Check:** Review all `http.request()`, `https.request()`, `fetch()`, `axios()`, and similar calls. If the URL or hostname is derived from user input, confirm it is validated against an allowlist.
- **Source:** [Node.js Vulnerability Cheatsheet](https://qwiet.ai/node-js-vulnerability-cheatsheet/)

### SEC-06: Set Secure Cookie Flags

- **Rule:** All session cookies must set `httpOnly: true`, `secure: true`, and `sameSite: 'strict'` (or `'lax'` with justification).
- **Category:** Security
- **Evidence:** OWASP mandates these flags to prevent XSS-based session theft (httpOnly), man-in-the-middle attacks (secure), and CSRF (sameSite).
- **Specific Check:** Review all `res.cookie()` and session middleware configuration. Confirm all three flags are set.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### SEC-07: Apply Security Headers

- **Rule:** Use `helmet` middleware or manually set: Strict-Transport-Security, X-Frame-Options, Content-Security-Policy, X-Content-Type-Options, Cache-Control. Remove `X-Powered-By`.
- **Category:** Security
- **Evidence:** OWASP recommends these headers to prevent clickjacking, MIME sniffing, XSS, and information disclosure. The `helmet` package implements 14 security-related middleware functions.
- **Specific Check:** Confirm the application configures security headers early in the middleware chain. Verify CSP is restrictive (no `'unsafe-inline'` or `'unsafe-eval'` without justification).
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### SEC-08: Set Request Size Limits

- **Rule:** Configure body parser limits on all endpoints. Example: `express.json({ limit: '1kb' })` for JSON, `express.urlencoded({ limit: '1kb' })` for form data.
- **Category:** Security
- **Evidence:** Without size limits, attackers can send extremely large request bodies causing memory exhaustion and DoS. OWASP lists this as a required mitigation.
- **Specific Check:** Review body parser middleware configuration. Confirm explicit `limit` values are set and are appropriate for the endpoint's purpose.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### SEC-09: Avoid Vulnerable Regular Expressions (ReDoS)

- **Rule:** Avoid regex patterns with nested quantifiers (`(a+)*`), overlapping alternation (`(a|a)*`), or backreferences on untrusted input. Use `safe-regex` or `node-re2` for user-facing regex validation.
- **Category:** Security
- **Evidence:** Node.js official documentation specifically warns about ReDoS. A single vulnerable regex like `/(\/.+)+$/` tested against a crafted input of 100 forward slashes + newline can block the event loop "effectively forever." This is a DoS vulnerability.
- **Specific Check:** Review all `RegExp` constructors and regex literals that operate on user input. Test with `safe-regex` library. Consider bounding input length before regex evaluation.
- **Source:** [Node.js Official Docs - Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

### SEC-10: Keep Dependencies Updated and Audited

- **Rule:** Run `npm audit` regularly. Pin dependency versions. Review transitive dependencies. Do not use packages with known critical vulnerabilities.
- **Category:** Security
- **Evidence:** OWASP Top 10 includes "Using Components with Known Vulnerabilities." The Node.js ecosystem's deep dependency trees amplify supply-chain risk. Prototype pollution CVEs in lodash and jQuery demonstrate how widely-used packages can introduce critical vulnerabilities.
- **Specific Check:** Confirm `npm audit` runs in CI. Review `package-lock.json` changes for new dependencies. Verify no packages with critical/high severity vulnerabilities are included.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### SEC-11: Prevent HTTP Parameter Pollution

- **Rule:** Use the `hpp` middleware or equivalent to handle duplicate HTTP parameters consistently. Be explicit about which parameter value to use when multiple are provided.
- **Category:** Security
- **Evidence:** When Express receives multiple query parameters with the same name, it creates an array. This can bypass validation logic that expects a single value. OWASP identifies this as a distinct vulnerability class for Node.js.
- **Specific Check:** Review request handlers that access `req.query` or `req.body`. Check for assumptions about parameter types (string vs array).
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### SEC-12: Return Only Necessary Data

- **Rule:** API responses must not leak sensitive fields (passwords, tokens, internal IDs, PII). Create explicit sanitization/serialization functions for user-facing responses.
- **Category:** Security
- **Evidence:** OWASP recommends explicit allowlists for returned fields rather than returning full database objects. Accidental data exposure is a common vulnerability in Node.js APIs that pass ORM objects directly to `res.json()`.
- **Specific Check:** Review all `res.json()` and `res.send()` calls. Confirm that database/model objects are transformed before being sent to clients. Check that error responses do not include stack traces in production.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### SEC-13: Use Strict Mode

- **Rule:** Enable `"use strict"` or use ES modules (which are strict by default). TypeScript transpilation should target strict mode output.
- **Category:** Security
- **Evidence:** OWASP recommends strict mode to prevent accidental global variable creation, silent error suppression, and other unsafe legacy JavaScript behaviors. Without strict mode, assignments to undeclared variables create globals, and errors in property assignments fail silently.
- **Specific Check:** Verify that entry points include `"use strict"` or that the project uses ES modules/TypeScript.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html), [Microsoft Engineering Playbook](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)

---

## 2. Reliability Rules

### REL-01: Handle All Promise Rejections

- **Rule:** Every promise must have a `.catch()` handler or be used with `try/catch` in an `async` function. Use ESLint's `no-floating-promises` rule. Register a global `process.on('unhandledRejection')` handler as a safety net only.
- **Category:** Reliability
- **Evidence:** Since Node.js 15, unhandled promise rejections crash the process by default. Before v15, they produced warnings that masked real bugs. In production, an unhandled rejection causes a 502 error during process restart. ESLint's `no-floating-promises` rule can statically detect forgotten `await` or `.catch()` calls.
- **Specific Check:** Search for promise-returning function calls that are not `await`ed or `.catch()`ed. Verify that Express route handlers using async/await either wrap with error-catching middleware or use `try/catch`. Confirm the existence of a global `unhandledRejection` handler.
- **Source:** [Node.js 15 Release Notes](https://maximorlov.com/node-js-15-is-out-what-does-it-mean-for-you/), [DZone - Unhandled Rejections](https://dzone.com/articles/unhandled-promise-rejections-nodejs-crash)

### REL-02: Handle uncaughtException Correctly

- **Rule:** Register a `process.on('uncaughtException')` handler that logs the error, cleans up resources, and exits the process. Never continue execution after an uncaught exception.
- **Category:** Reliability
- **Evidence:** OWASP states that resuming after uncaught exceptions puts the application in an unknown state and may lead to undefined behavior. The handler exists for cleanup before exit, not for recovery.
- **Specific Check:** Confirm an `uncaughtException` handler exists. Verify it calls `process.exit()` after cleanup. Ensure error stack traces are logged but not exposed to end users.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### REL-03: Always Attach Error Listeners to EventEmitters

- **Rule:** Every `EventEmitter` instance must have an `'error'` event listener. Without one, an emitted error crashes the process.
- **Category:** Reliability
- **Evidence:** OWASP identifies this as a mandatory error-handling practice. Node.js EventEmitter throws if an `'error'` event is emitted with no listener registered. This is a frequent cause of unexpected production crashes.
- **Specific Check:** Search for `new EventEmitter()`, `extends EventEmitter`, and stream creation. Verify each instance has `.on('error', ...)` registered.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### REL-04: Avoid Missing `await` Keywords

- **Rule:** When calling an async function whose result is needed or whose errors must be caught, always use `await`. Missing `await` causes the function to run fire-and-forget, losing error handling and execution order guarantees.
- **Category:** Reliability
- **Evidence:** Missing `await` is one of the most common async/await mistakes in production. It causes silent failures, lost error handling, and race conditions. The return value is a Promise object rather than the resolved value, leading to subtle type errors. Stack traces are also lost for unawaited async errors, making debugging harder.
- **Specific Check:** Review all async function call sites. Use TypeScript strict mode or ESLint `@typescript-eslint/no-floating-promises` to catch these statically. Pay special attention to `return asyncFunction()` inside `try/catch` blocks (must be `return await asyncFunction()` for the catch to work).
- **Source:** [CatchJS - Async/Await Error Handling](https://catchjs.com/Docs/AsyncAwait), [Common Async/Await Errors](https://brandnexusstudios.co.za/blog/common-async-await-errors-proven-fixes/)

### REL-05: Prevent Memory Leaks from Event Listeners

- **Rule:** Do not attach event listeners inside request handlers without corresponding removal. Use `once()` for one-time listeners. Set `emitter.setMaxListeners()` appropriately and investigate warnings.
- **Category:** Reliability
- **Evidence:** Attaching `connector.on()` inside a request handler creates a new listener per request without removal, a classic memory leak pattern. In stress tests, event emitter leaks caused memory to reach 600 MB with event loop delays exceeding 10 seconds, causing server timeouts and 502 errors.
- **Specific Check:** Search for `.on(` or `.addListener(` inside Express/Koa/Fastify route handlers or middleware. Verify corresponding `.off()` or `.removeListener()` calls exist. Look for `MaxListenersExceededWarning` in logs.
- **Source:** [Better Stack - Node.js Memory Leaks](https://betterstack.com/community/guides/scaling-nodejs/high-performance-nodejs/nodejs-memory-leaks/), [Sematext - Memory Leak Detection](https://sematext.com/blog/nodejs-memory-leaks/)

### REL-06: Prevent Memory Leaks from Caches

- **Rule:** Use bounded caches with eviction policies (LRU, TTL). Never use plain objects or Maps as unbounded caches in long-running server processes.
- **Category:** Reliability
- **Evidence:** Cached objects are described as "the king of the commonness of memory leaks" in Node.js. In production, unbounded caches cause continuously increasing memory usage until the process crashes and restarts. A leak that is harmless during development destroys production uptime.
- **Specific Check:** Search for module-level `const cache = {}` or `new Map()` patterns. Verify eviction logic exists. Prefer LRU-cache libraries with configurable max size and TTL.
- **Source:** [LogRocket - Understanding Memory Leaks](https://blog.logrocket.com/understanding-memory-leaks-node-js-apps/), [AppSignal - Avoiding Memory Leaks](https://blog.appsignal.com/2020/05/06/avoiding-memory-leaks-in-nodejs-best-practices-for-performance.html)

### REL-07: Centralize Error Handling in Express/HTTP Frameworks

- **Rule:** Use error-handling middleware (`app.use((err, req, res, next) => {...})`) and wrap async route handlers with a utility function (e.g., `asyncHandler` or `express-async-errors`). Do not rely on individual try/catch in every handler.
- **Category:** Reliability
- **Evidence:** Express does not catch async errors by default. If an async route handler throws without `try/catch`, the promise rejection is unhandled. The `express-async-errors` package or a `wrapAsync` pattern provides centralized handling, reducing the chance of a developer forgetting to catch an error in one of dozens of routes.
- **Specific Check:** Review the middleware chain for an error-handling middleware at the end. Verify async route handlers are wrapped or that `express-async-errors` is imported. Check that error middleware returns appropriate status codes and does not leak stack traces.
- **Source:** [Express Issue #6917](https://github.com/expressjs/express/issues/6917), [Honeybadger Error Handling Guide](https://www.honeybadger.io/blog/errors-nodejs/)

---

## 3. Performance Rules

### PERF-01: Do Not Block the Event Loop

- **Rule:** Never use synchronous APIs in server code: `fs.*Sync()`, `crypto.*Sync()`, `zlib.*Sync()`, `child_process.*Sync()`. Use async alternatives or Worker Threads for CPU-intensive work.
- **Category:** Performance
- **Evidence:** Node.js official documentation states "if any callback or task takes a long time, the thread running it becomes blocked" which leads to "degraded throughput (clients/second) at best, and complete denial of service at worst." All synchronous versions of crypto, compression, and file system APIs block the event loop.
- **Specific Check:** Search for `Sync(` across the codebase. Flag any synchronous API usage in request handlers, middleware, or server initialization code (after startup, sync calls in initialization are acceptable in some cases).
- **Source:** [Node.js Official - Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

### PERF-02: Bound User-Controlled Iteration

- **Rule:** Any loop, array operation, or recursive computation whose iteration count depends on user input must have an upper bound. Apply `Math.min(userValue, MAX_VALUE)` before use.
- **Category:** Performance
- **Evidence:** Node.js documentation demonstrates that O(n) callbacks are safe only for small n, and O(n^2) callbacks are dangerous. An endpoint like `/countToN?n=1000000000` can block the event loop indefinitely if n is not bounded.
- **Specific Check:** Review all loops and recursive functions in request handlers. If the iteration count is derived from `req.query`, `req.body`, or `req.params`, confirm an upper bound is enforced.
- **Source:** [Node.js Official - Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

### PERF-03: Be Cautious with JSON.parse/JSON.stringify on Large Objects

- **Rule:** JSON.parse and JSON.stringify are O(n) but can take seconds for large objects. For user-controlled JSON, limit request body size. For large internal data, consider streaming JSON parsers (JSONStream, bfj).
- **Category:** Performance
- **Evidence:** Node.js documentation provides benchmarks: `JSON.stringify` on a 2^21-element nested object takes 0.7 seconds; `JSON.parse` takes 1.3 seconds. This blocks the event loop for the entire duration.
- **Specific Check:** Review JSON operations on potentially large datasets. Confirm request body size limits are enforced. For internal batch processing, verify that streaming alternatives are used when processing more than a few MB.
- **Source:** [Node.js Official - Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

### PERF-04: Use Worker Threads for CPU-Intensive Tasks

- **Rule:** Offload CPU-intensive operations (image processing, data parsing, cryptographic computations, complex calculations) to Worker Threads. Use worker pools, not per-request worker creation.
- **Category:** Performance
- **Evidence:** Worker threads run in separate threads, preventing CPU-intensive operations from blocking the event loop. Node.js documentation recommends worker pools to amortize creation overhead. Creating a worker per request is explicitly warned against (fork bomb risk).
- **Specific Check:** Identify any CPU-intensive code in request handlers (image resizing, PDF generation, heavy computation). Verify it runs in a Worker Thread or separate process. Confirm worker pool size is bounded.
- **Source:** [Node.js Official - Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop), [OneUptime - Worker Threads Guide](https://oneuptime.com/blog/post/2026-01-06-nodejs-worker-threads-cpu-intensive/view)

### PERF-05: Monitor Event Loop Lag

- **Rule:** Instrument event loop latency monitoring in production. Use `toobusy-js` or equivalent to respond with 503 when the server is overloaded rather than accepting requests it cannot serve.
- **Category:** Performance
- **Evidence:** OWASP recommends monitoring event loop health for DoS prevention. Memory leaks cause event loop blocking through heavy garbage collection cycles. Responding with 503 under load is better than timeout errors.
- **Specific Check:** Verify production deployments include event loop monitoring. Confirm health check endpoints exist. Review backpressure handling for stream-based processing.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### PERF-06: Partition Long-Running Worker Pool Tasks

- **Rule:** Break large I/O and crypto operations into smaller chunks. Use streaming APIs (`ReadStream`) instead of bulk reads (`fs.readFile`). Partition `crypto.randomBytes()` into smaller requests.
- **Category:** Performance
- **Evidence:** Node.js documentation warns that a single `fs.readFile()` on a very large file, or `crypto.randomBytes(1000000000)`, submits one massive task to the worker pool, starving other workers. The documentation specifically warns about `fs.readFile('/dev/random')` which never completes.
- **Specific Check:** Review `fs.readFile()` calls to ensure they operate on bounded, known-size files. Verify crypto operations use reasonable chunk sizes. Prefer streaming APIs for large files.
- **Source:** [Node.js Official - Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

### PERF-07: Audit npm Module Performance Costs

- **Rule:** For any third-party API call that may process user input of arbitrary size, verify it does not block the event loop. Check documentation and source code for computational complexity.
- **Category:** Performance
- **Evidence:** Node.js documentation identifies two concerns with npm modules: (1) does it honor its APIs, and (2) does it block the event loop or worker pool? The documentation notes this second concern is "frequently overlooked" and warns that "even async APIs may spend O(n) time per partition."
- **Specific Check:** When reviewing new dependency additions, check the library's source for synchronous operations or unbounded loops. Test with representative production-scale input sizes.
- **Source:** [Node.js Official - Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

---

## 4. Maintainability Rules

### MAINT-01: Use Linting and Formatting Consistently

- **Rule:** Configure and enforce ESLint and Prettier. Code must pass linting with zero warnings or errors. Use AirBnB style guide or equivalent as a base configuration.
- **Category:** Maintainability
- **Evidence:** Microsoft Engineering Fundamentals Playbook requires Prettier for formatting and ESLint for static analysis in all JavaScript/TypeScript projects. Consistent formatting eliminates style-related review comments, letting reviewers focus on logic.
- **Specific Check:** Verify `.eslintrc` and `.prettierrc` exist and are configured. Confirm linting runs in CI and blocks merges on failures.
- **Source:** [Microsoft Engineering Playbook - JS/TS Code Reviews](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)

### MAINT-02: Replace Magic Values with Named Constants

- **Rule:** Numeric or string literals that carry meaning must be extracted to named constants or enums with explanatory comments.
- **Category:** Maintainability
- **Evidence:** Microsoft Engineering Playbook requires that "numeric or string literals have explanatory comments or are extracted to named constants/enums." Magic values are a top maintainability issue in code reviews.
- **Specific Check:** Search for bare numeric/string literals in conditionals, loop bounds, and configuration. Verify each has either an explanatory comment or is referenced via a named constant.
- **Source:** [Microsoft Engineering Playbook - JS/TS Code Reviews](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)

### MAINT-03: Write Tests with Arrange/Act/Assert Pattern

- **Rule:** Unit tests should follow the Arrange/Act/Assert pattern. Focus on test quality over coverage percentage. A single test validating a complex edge case is more valuable than multiple trivial tests.
- **Category:** Maintainability
- **Evidence:** Microsoft Engineering Playbook mandates the AAA pattern for test structure. Recent (2025) code review guidance emphasizes that reviewers should focus on test quality rather than coverage metrics.
- **Specific Check:** Review test files for clear AAA structure. Check that tests validate behavior, not implementation. Verify edge cases and error paths are tested.
- **Source:** [Microsoft Engineering Playbook](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/), [Code Review Checklist 2025](https://javascript.plainenglish.io/code-review-checklist-b0f6b41b9738)

### MAINT-04: Prefer Existing Modules Over Reimplementation

- **Rule:** Before writing custom utility code, evaluate whether an established npm package or standard library API provides the functionality. Do not reinvent well-solved problems.
- **Category:** Maintainability
- **Evidence:** Microsoft Engineering Playbook specifically asks reviewers to "evaluate whether changes reimplements functionality better solved by established ecosystem packages."
- **Specific Check:** When reviewing new utility functions, search npm for established alternatives. Balance between avoiding unnecessary dependencies and avoiding unnecessary reimplementation.
- **Source:** [Microsoft Engineering Playbook - JS/TS Code Reviews](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)

### MAINT-05: Name Async Methods with "Async" Suffix

- **Rule:** Asynchronous methods must end with the "Async" suffix to distinguish them from synchronous alternatives.
- **Category:** Maintainability
- **Evidence:** Microsoft Engineering Playbook includes this as a specific check for JavaScript/TypeScript code reviews.
- **Specific Check:** Review newly added async functions for proper naming convention.
- **Source:** [Microsoft Engineering Playbook - JS/TS Code Reviews](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)

### MAINT-06: Document Classes and Public Methods

- **Rule:** Classes and public methods require JSDoc block comments (`/** */`) describing purpose, parameters, and return values.
- **Category:** Maintainability
- **Evidence:** Microsoft Engineering Playbook requires proper documentation for classes and methods. 75% of defects found during code reviews improve software evolvability (maintainability) rather than fixing visible bugs (Mantyla & Lassenius, IEEE TSE).
- **Specific Check:** Review new classes and exported functions for documentation completeness.
- **Source:** [Microsoft Engineering Playbook](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/), [IEEE TSE - What Types of Defects Are Discovered in Code Reviews](https://ieeexplore.ieee.org/document/4604671/)

### MAINT-07: Implement Proper Logging

- **Rule:** Use structured logging libraries (Winston, Pino, Bunyan). Include request IDs for traceability. Use appropriate log levels (error, warn, info, debug). Never log sensitive data (passwords, tokens, PII).
- **Category:** Maintainability
- **Evidence:** OWASP mandates comprehensive logging for debugging and security incident response. Microsoft Engineering Playbook requires minimum logging levels and sensible level usage.
- **Specific Check:** Verify logging library is configured with appropriate transports. Confirm log levels are used correctly (not logging everything at `info`). Check that sensitive data is redacted.
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html), [Microsoft Engineering Playbook](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)

---

## 5. Automated vs Manual Review

### What Automated Tools Catch Well

| Category | Specific Checks | Tools |
|----------|----------------|-------|
| Style violations | Formatting, naming, indentation | Prettier, ESLint |
| Known vulnerability patterns | XSS, injection, unsafe functions | eslint-plugin-security, Semgrep, Snyk |
| Type errors | Missing properties, wrong types, null access | TypeScript compiler, Flow |
| Dependency vulnerabilities | Known CVEs in packages | npm audit, Snyk, Dependabot |
| Simple code smells | Unused variables, unreachable code | ESLint, TypeScript strict |
| Floating promises | Unawaited async calls | @typescript-eslint/no-floating-promises |

**Evidence:** Automated tools cut PR review time from 30 hours to under 90 minutes (industry study). IEEE research confirmed automated reviews outperform manual checks for repetitive errors and known vulnerability patterns.

**Source:** [Augment Code - When to Use Manual Code Review](https://www.augmentcode.com/guides/when-to-use-manual-code-review-over-automation), [Aikido - Manual vs Automated](https://www.aikido.dev/blog/manual-vs-automated-code-review)

### What Humans Catch That Tools Miss

| Category | Specific Checks |
|----------|----------------|
| Business logic errors | Authorization logic, data flow correctness, domain rule violations |
| Architectural issues | Cross-service impacts, coupling, responsibility boundaries |
| Race conditions | Concurrent access patterns, async ordering dependencies |
| Subtle data leaks | Environment variables exposed through APIs, sensitive fields in responses |
| Context-dependent security | Authorization bypass through business logic, IDOR vulnerabilities |
| Performance at scale | N+1 queries, unbounded growth patterns, missing pagination |
| Design intent | Whether the code correctly implements the specification |

**Evidence:** Automated tools miss approximately 22% of real vulnerabilities while generating 30-60% false positive rates (industry research). 78% of publicly classified bugs are specification errors that no static analysis can detect (Gao et al., ICSE 2017). GitHub study found that projects using a mix of automated and manual reviews ship higher quality code.

**Source:** [Augment Code](https://www.augmentcode.com/guides/when-to-use-manual-code-review-over-automation), [Gao et al. - To Type or Not to Type](https://dl.acm.org/doi/10.1109/ICSE.2017.75), [AlgoCademy - Code Reviews Missing Issues](https://algocademy.com/blog/why-your-code-reviews-arent-catching-important-issues/)

### Recommended Hybrid Strategy

1. **Automate everything automatable**: Formatting, linting, type checking, known vulnerability scanning, dependency auditing
2. **Focus human reviewers on**: Business logic, architecture, security design, error handling completeness, performance implications
3. **Review rate**: Academic research finds 200 LOC/hour or less is the effective rate, identifying nearly two-thirds of defects in design reviews and more than half in code reviews (Kemerer & Paulk)
4. **General detection rate**: Formal code inspections detect about 60-65% of defects (Capers Jones, 12,000+ projects). Informal reviews capture fewer than 50%.

**Source:** [Kemerer & Paulk - Impact of Design and Code Reviews](https://sites.pitt.edu/~ckemerer/PSP_Data.pdf), [LLCBuddy - Peer Code Review Statistics](https://llcbuddy.com/data/peer-code-review-statistics/)

---

## 6. TypeScript and Type Safety

### TS-01: TypeScript Prevents ~15% of Committed Bugs

- **Finding:** Both Flow and TypeScript can conservatively prevent about 15% of bugs that end up in committed code (95% CI: 11.5%-18.5%).
- **Evidence:** Gao et al. (ICSE 2017) examined 400 real bugs from 398 GitHub JavaScript projects. Flow detected 59-60 bugs; TypeScript detected 58-60. Median bug size was 6 lines; 48% affected 5 or fewer lines.
- **Implication for Review:** TypeScript eliminates a meaningful class of bugs (type mismatches, undefined property access, null/undefined errors), freeing reviewers to focus on the remaining 85% of bugs that require human judgment.
- **Source:** [Gao et al. - To Type or Not to Type (ICSE 2017)](https://dl.acm.org/doi/10.1109/ICSE.2017.75), [The Morning Paper analysis](https://blog.acolyer.org/2017/09/19/to-type-or-not-to-type-quantifying-detectable-bugs-in-javascript/)

### TS-02: Most Bugs Are Specification Errors

- **Finding:** Approximately 78% of publicly classified bugs are specification errors (incorrect behavior). Static type systems cannot detect these.
- **Evidence:** Gao et al. study found that the failure to correctly specify behaviors is the most common type of bug by a huge margin. TypeScript can catch type mismatches and undefined property errors, but cannot catch wrong business logic.
- **Implication for Review:** Code review remains essential even with TypeScript. The primary value of human review is catching specification errors (the 78% that types miss), not type errors (the 15% that types catch).
- **Source:** [Gao et al. - To Type or Not to Type](https://dl.acm.org/doi/10.1109/ICSE.2017.75)

### TS-03: Review TypeScript Types Themselves

- **Rule:** During TypeScript code review, examine type definitions for correctness: Are interfaces accurate? Are generics properly constrained? Are union types comprehensive? Is `any` used sparingly with justification?
- **Evidence:** TypeScript code review guidance states "you're examining the shape of the data, the contracts between components, and the story the types are telling." Improper types (overly broad `any`, missing union cases) defeat the purpose of the type system.
- **Specific Check:** Search for `any` type annotations. Review new interface definitions for completeness. Check that function signatures accurately describe behavior (especially optional parameters, union types, and nullability).
- **Source:** [Kodus - TypeScript Code Review Guide](https://kodus.io/en/typescript-code-review-guide/), [Pull Panda - TypeScript Checklist](https://pullpanda.io/blog/typescript-code-review-checklist)

### TS-04: Use TypeScript Strict Mode

- **Rule:** Enable `strict: true` in `tsconfig.json`. This activates `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and other checks that catch additional bug classes.
- **Evidence:** Without strict mode, TypeScript misses many bugs it could otherwise catch. The 15% bug prevention rate assumes type annotations are present; strict mode maximizes the compiler's ability to find issues.
- **Specific Check:** Verify `tsconfig.json` has `strict: true`. If not, check that individual strict flags are enabled. Review any `// @ts-ignore` or `// @ts-expect-error` comments for justification.
- **Source:** [CircleCI - Enforce Type Safety](https://circleci.com/blog/enforce-type-safety-with-typescript-checks-before-deployments/)

---

## 7. Sources Bibliography

### Academic Papers

1. **Gao, Z., Bird, C., Barr, E.T.** "To Type or Not to Type: Quantifying Detectable Bugs in JavaScript." ICSE 2017. [ACM](https://dl.acm.org/doi/10.1109/ICSE.2017.75) | [Microsoft Research PDF](https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/gao2017javascript.pdf) | [Analysis by Adrian Colyer](https://blog.acolyer.org/2017/09/19/to-type-or-not-to-type-quantifying-detectable-bugs-in-javascript/)

2. **Gyimesi, P. et al.** "BugsJS: A Benchmark and Taxonomy of JavaScript Bugs." ICST 2019 / STVR 2021. [IEEE Xplore](https://ieeexplore.ieee.org/document/8730197/) | [Wiley](https://onlinelibrary.wiley.com/doi/full/10.1002/stvr.1751) | [Project Site](https://bugsjs.github.io/)

3. **Mantyla, M.V., Lassenius, C.** "What Types of Defects Are Really Discovered in Code Reviews?" IEEE TSE 2009. [IEEE Xplore](https://ieeexplore.ieee.org/document/4604671/)

4. **Kemerer, C.F., Paulk, M.C.** "The Impact of Design and Code Reviews on Software Quality." [PDF](https://sites.pitt.edu/~ckemerer/PSP_Data.pdf)

5. **Finifter, M. et al.** "An Empirical Study on the Effectiveness of Security Code Review." ESSOS 2013. [PDF](https://mfinifter.github.io/papers/coderev-essos13.pdf)

6. **Park et al.** "To Type or Not to Type? A Systematic Comparison of the Software Quality of JavaScript and TypeScript Applications on GitHub." 2022. [arXiv](https://arxiv.org/abs/2203.11115)

### Formal Standards and Checklists

7. **OWASP Node.js Security Cheat Sheet.** [Link](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

8. **OWASP Top 10:2025.** [Link](https://owasp.org/Top10/2025/)

9. **OWASP NodeGoat Project.** [GitHub](https://github.com/OWASP/NodeGoat)

10. **CWE-1321: Prototype Pollution.** [MITRE](https://cwe.mitre.org/data/definitions/1321.html)

11. **CWE-79: Cross-Site Scripting.** [MITRE](https://cwe.mitre.org/data/definitions/79.html)

12. **Microsoft Engineering Fundamentals Playbook - JS/TS Code Reviews.** [Link](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)

### Node.js Official Documentation

13. **Node.js - Don't Block the Event Loop.** [Link](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

14. **Node.js - Memory Diagnostics.** [Link](https://nodejs.org/en/learn/diagnostics/memory)

15. **Node.js Permission Model (v20+).** [Link](https://nodejs.org/api/permissions.html)

### Industry Guides

16. **eslint-plugin-security.** [npm](https://www.npmjs.com/package/eslint-plugin-security)

17. **Microsoft eslint-plugin-sdl.** [GitHub](https://github.com/microsoft/eslint-plugin-sdl)

18. **Semgrep vs ESLint Comparison.** [Semgrep Blog](https://semgrep.dev/blog/2021/javascript-static-analysis-comparison-eslint-semgrep/)

19. **Node.js Security Best Practices.** [nodejs-security.com](https://www.nodejs-security.com/blog/owasp-nodejs-best-practices-guide)

20. **Awesome Node.js Security.** [GitHub](https://github.com/lirantal/awesome-nodejs-security)

---

## Part 2: Industry Practice & Community Findings

The rules below were extracted from engineering blogs, community checklists, production post-mortems, and widely-adopted style guides. They complement the academic/formal rules above with practical, battle-tested criteria.

---

## 8. Code Quality & Maintainability (Industry Practice)

### IND-CQ-01: Use const/let, never var
- **Rule:** Prefer `const` for all variables that are not reassigned. Use `let` only when reassignment is necessary. Never use `var`.
- **Category:** Maintainability
- **Source:** [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript), [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** ESLint `no-var`, `prefer-const` -- fully automatable
- **Human review needed:** No

### IND-CQ-02: Use modern ES6+ features appropriately
- **Rule:** Use arrow functions, template literals, destructuring, spread/rest operators, default parameters, `import/export`. Avoid the `var that = this` pattern.
- **Category:** Maintainability
- **Source:** [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript), [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** ESLint `prefer-arrow-callback`, `prefer-template`, `prefer-destructuring` -- partially automatable
- **Human review needed:** Yes (readability judgment for destructuring depth)

### IND-CQ-03: Functions should be small and single-purpose
- **Rule:** Functions should do one thing. Keep them under 20-40 lines. If a function needs comments to explain sections, those sections should be separate functions.
- **Category:** Maintainability
- **Source:** [Axioned JS Checklist](https://handbook.axioned.com/learning/javascript/code-review-checklist/), [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** ESLint `max-lines-per-function` (crude measure)
- **Human review needed:** Yes

### IND-CQ-04: Avoid deep nesting
- **Rule:** Maximum 3 levels of nesting. Use early returns, guard clauses, and function extraction to flatten deeply nested code.
- **Category:** Maintainability
- **Source:** [Axioned JS Checklist](https://handbook.axioned.com/learning/javascript/code-review-checklist/), [IBM Code Review Checklist](https://community.ibm.com/community/user/blogs/marina-mascarenhas/2025/07/15/code-review-checklist-for-javascriptreact)
- **Automation:** ESLint `max-depth`
- **Human review needed:** Yes (refactoring strategy)

### IND-CQ-05: No dead code
- **Rule:** Remove commented-out code, unused variables, unused imports, unreachable code, and unused functions. Version control preserves history.
- **Category:** Maintainability
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12), [IBM Code Review Checklist](https://community.ibm.com/community/user/blogs/marina-mascarenhas/2025/07/15/code-review-checklist-for-javascriptreact)
- **Automation:** ESLint `no-unused-vars`, `no-unreachable` -- fully automatable
- **Human review needed:** No

### IND-CQ-06: DRY - No code duplication
- **Rule:** Code duplicated more than twice must be extracted into shared functions, utilities, or modules. Look for near-duplicates with slight variations.
- **Category:** Maintainability
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** Tools like jscpd, SonarQube
- **Human review needed:** Yes (semantic duplication vs. accidental similarity)

### IND-CQ-07: Meaningful naming
- **Rule:** Variables, functions, and classes should have descriptive, intention-revealing names. Functions should start with verbs. Booleans should use is/has/can prefixes. Follow consistent casing: camelCase for variables/functions, PascalCase for classes/components, UPPER_SNAKE_CASE for constants.
- **Category:** Maintainability
- **Source:** [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** ESLint `camelcase`, `new-cap` (partial)
- **Human review needed:** Yes (naming quality is subjective)

### IND-CQ-08: Use strict equality
- **Rule:** Always use `===` and `!==` instead of `==` and `!=`. Loose equality has confusing coercion rules that cause subtle bugs.
- **Category:** Reliability, Maintainability
- **Source:** [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** ESLint `eqeqeq` -- fully automatable
- **Human review needed:** No

### IND-CQ-09: Comments explain "why", not "what"
- **Rule:** Code should be self-documenting. Comments should explain why a decision was made, not what the code does. Remove noise comments. Use `// TODO:` for pending work.
- **Category:** Maintainability
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12), [IBM Code Review Checklist](https://community.ibm.com/community/user/blogs/marina-mascarenhas/2025/07/15/code-review-checklist-for-javascriptreact)
- **Automation:** No
- **Human review needed:** Yes

### IND-CQ-10: No console.log in production code
- **Rule:** Remove all `console.log` statements before merging. Use a proper logging library (Winston, Pino, Bunyan) with structured logging and appropriate log levels.
- **Category:** Maintainability
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** ESLint `no-console` -- fully automatable
- **Human review needed:** No

### IND-CQ-11: No deprecated APIs
- **Rule:** Do not use deprecated Node.js APIs, browser APIs, or library functions. Check for deprecation warnings.
- **Category:** Maintainability
- **Source:** [Axioned JS Checklist](https://handbook.axioned.com/learning/javascript/code-review-checklist/)
- **Automation:** ESLint `node/no-deprecated-api`
- **Human review needed:** Partially (library-specific deprecations may not have lint rules)

### IND-CQ-12: Modules import at file top
- **Rule:** All `require()`/`import` statements should be at the top of the file, not inside functions or conditional blocks (exception: dynamic imports for code splitting).
- **Category:** Maintainability
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices), [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **Automation:** ESLint `import/first` -- fully automatable
- **Human review needed:** No

### IND-CQ-13: Separation of concerns
- **Rule:** Business logic, data access, and presentation/API layers should be separated. Controllers should be thin. Do not mix concerns in a single module.
- **Category:** Maintainability
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** No
- **Human review needed:** Yes (architectural judgment)

### IND-CQ-14: Clean up resources
- **Rule:** Close database connections, file handles, and streams when done. Remove event listeners on teardown. Cancel timers and intervals.
- **Category:** Reliability, Performance
- **Source:** [Axioned Node.js Checklist](https://handbook.axioned.com/learning/node/code-review-checklist/), [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** No
- **Human review needed:** Yes

---

## 9. Error Handling (Industry Practice)

### IND-ERR-01: All async code has error handling
- **Rule:** Every `async/await` block must have `try/catch`. Every Promise chain must have `.catch()`. Unhandled promise rejections crash Node.js processes.
- **Category:** Reliability
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices), [DZone - Unhandled Promise Rejections](https://dzone.com/articles/unhandled-promise-rejections-nodejs-crash)
- **Automation:** ESLint `no-floating-promises` (TypeScript), `promise/catch-or-return`
- **Human review needed:** Yes (error handling quality and completeness)

### IND-ERR-02: Distinguish operational vs programmer errors
- **Rule:** Operational errors (invalid input, network failure) should be handled gracefully. Programmer errors (undefined reference, type errors) indicate bugs to fix. Do not catch programmer errors silently.
- **Category:** Reliability
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices), [Axioned Node.js Checklist](https://handbook.axioned.com/learning/node/code-review-checklist/)
- **Automation:** No
- **Human review needed:** Yes

### IND-ERR-03: No sensitive data in error responses
- **Rule:** Error messages sent to clients must be generic. Never expose stack traces, `process.env`, database details, or internal paths to users.
- **Category:** Security, Reliability
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html), [Node.js Security Best Practices](https://www.nodejs-security.com/blog/ten-best-practices-for-secure-code-review-of-nodejs-code)
- **Automation:** Partially
- **Human review needed:** Yes

### IND-ERR-04: Do not mix async patterns
- **Rule:** Use either async/await OR .then()/.catch() consistently within a function. Mixing makes error flow unpredictable.
- **Category:** Reliability, Maintainability
- **Source:** [LinkedIn - Async/Await Pitfalls](https://www.linkedin.com/advice/1/how-do-you-avoid-common-pitfalls-anti-patterns)
- **Automation:** Partially (custom ESLint rules)
- **Human review needed:** Yes

### IND-ERR-05: Handle process-level errors
- **Rule:** Bind to `process.on('uncaughtException')` and `process.on('unhandledRejection')` for cleanup and logging. Implement graceful shutdown.
- **Category:** Reliability
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** Can check for handler registration
- **Human review needed:** Yes (shutdown logic correctness)

---

## 10. Performance (Industry Practice)

### IND-PERF-01: Parallelize independent async operations
- **Rule:** Use `Promise.all()` for independent async operations instead of sequential `await`. Sequential awaits multiply latency unnecessarily.
- **Category:** Performance
- **Source:** [Axioned Node.js Checklist](https://handbook.axioned.com/learning/node/code-review-checklist/)
- **Automation:** No (requires understanding of data dependencies)
- **Human review needed:** Yes

### IND-PERF-02: Minimize DOM access and manipulation
- **Rule:** Batch DOM reads and writes. Use document fragments for multiple element insertions. Cache DOM references instead of re-querying. Avoid layout thrashing.
- **Category:** Performance
- **Source:** [Axioned JS Checklist](https://handbook.axioned.com/learning/javascript/code-review-checklist/), [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** No
- **Human review needed:** Yes

### IND-PERF-03: Debounce and throttle high-frequency events
- **Rule:** Event handlers for `scroll`, `resize`, `input`, `mousemove` must be debounced or throttled.
- **Category:** Performance
- **Source:** [DebugBear - Front-end JavaScript Performance](https://www.debugbear.com/blog/front-end-javascript-performance)
- **Automation:** No
- **Human review needed:** Yes

### IND-PERF-04: Avoid computation inside loops
- **Rule:** Move invariant calculations, DOM queries, and function definitions outside of loops. Pre-compute values that do not change per iteration.
- **Category:** Performance
- **Source:** [Axioned JS Checklist](https://handbook.axioned.com/learning/javascript/code-review-checklist/)
- **Automation:** Partially
- **Human review needed:** Yes

### IND-PERF-05: Monitor bundle size impact
- **Rule:** New dependencies must be evaluated for bundle size impact. Prefer tree-shakeable (ESM) packages. Use dynamic `import()` for code splitting. Use tools like webpack-bundle-analyzer.
- **Category:** Performance
- **Source:** [DebugBear](https://www.debugbear.com/blog/front-end-javascript-performance), [Nolan Lawson](https://nolanlawson.com/2021/02/23/javascript-performance-beyond-bundle-size/)
- **Automation:** CI checks for bundle size regression
- **Human review needed:** Yes (justification for new dependencies)

### IND-PERF-06: Consider runtime performance beyond bundle size
- **Rule:** Evaluate parse/compile time, execution time, memory usage, and power consumption -- not just download size. Small libraries can have disproportionately high CPU costs.
- **Category:** Performance
- **Source:** [Nolan Lawson - JavaScript Performance Beyond Bundle Size](https://nolanlawson.com/2021/02/23/javascript-performance-beyond-bundle-size/)
- **Automation:** No
- **Human review needed:** Yes

### IND-PERF-07: Prefer native JS methods over utility libraries
- **Rule:** Use native `Array.map/filter/reduce`, `Object.entries/keys/values`, `structuredClone` over lodash/underscore equivalents when the native version is sufficient.
- **Category:** Performance
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** ESLint `you-dont-need-lodash-underscore` plugin
- **Human review needed:** Yes

### IND-PERF-08: Load scripts asynchronously
- **Rule:** Use `async` or `defer` attributes on script tags. Prevent render-blocking JavaScript.
- **Category:** Performance
- **Source:** [Axioned JS Checklist](https://handbook.axioned.com/learning/javascript/code-review-checklist/)
- **Automation:** HTML linting rules
- **Human review needed:** Yes (load order dependencies)

### IND-PERF-09: Use database indexes and optimize queries
- **Rule:** Queries on large collections must use indexed fields. Use `.explain()` to verify query plans. Place `$match`, `$limit`, `$skip` early in aggregation pipelines.
- **Category:** Performance
- **Source:** [Axioned Node.js Checklist](https://handbook.axioned.com/learning/node/code-review-checklist/)
- **Automation:** No
- **Human review needed:** Yes

### IND-PERF-10: CSS animation performance
- **Rule:** Never animate `width`, `height`, `top`, `left`, `margin`, `padding`. Use `transform` and `opacity` only -- these are GPU-composited and avoid layout recalculation.
- **Category:** Performance
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** Stylelint rules
- **Human review needed:** Yes

---

## 11. Testing (Industry Practice)

### IND-TEST-01: Tests follow AAA pattern
- **Rule:** Structure every test with Arrange (setup), Act (execute), Assert (verify) sections. Keep each section visually separated and minimal.
- **Category:** Testing
- **Source:** [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices), [Microsoft Engineering Playbook](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)
- **Automation:** No
- **Human review needed:** Yes

### IND-TEST-02: Test names include three parts
- **Rule:** Test names should specify: (1) what is being tested, (2) the scenario/conditions, (3) the expected result. Example: `"ProductService, when price is zero, should set status to pending"`.
- **Category:** Testing
- **Source:** [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** No
- **Human review needed:** Yes

### IND-TEST-03: Test behavior, not implementation
- **Rule:** Test public APIs and observable behavior. Do not test internal methods, private state, or implementation details. Tests should survive refactoring.
- **Category:** Testing
- **Source:** [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices), [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** No
- **Human review needed:** Yes

### IND-TEST-04: Each test should be independent
- **Rule:** Tests must not depend on other tests or shared mutable state. No global test fixtures. Each test creates its own data.
- **Category:** Testing
- **Source:** [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- **Automation:** No
- **Human review needed:** Yes

### IND-TEST-05: No logic in tests
- **Rule:** Tests should not contain conditionals, loops, try/catch, or string concatenation. If a test has logic, it needs its own test. Tests should be flat and declarative.
- **Category:** Testing
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12), [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- **Automation:** No
- **Human review needed:** Yes

### IND-TEST-06: Test one concern per test
- **Rule:** Each test should verify a single behavior or outcome. Multiple assertions are fine if they verify aspects of the same behavior.
- **Category:** Testing
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** No
- **Human review needed:** Yes

### IND-TEST-07: Cover edge cases and error paths
- **Rule:** Tests must cover not just the happy path but also: empty inputs, null/undefined, boundary values, error responses, network failures, timeouts.
- **Category:** Testing
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** Coverage tools (partial)
- **Human review needed:** Yes

### IND-TEST-08: Mock only external dependencies
- **Rule:** Mock external HTTP services, databases, file systems -- not internal modules. Over-mocking couples tests to implementation.
- **Category:** Testing
- **Source:** [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** No
- **Human review needed:** Yes

### IND-TEST-09: Handle async assertions properly
- **Rule:** Async test methods must include proper `await`, `done` callbacks, or return promises. Missing these causes tests to pass without actually executing assertions.
- **Category:** Testing
- **Source:** [Microsoft Engineering Playbook](https://microsoft.github.io/code-with-engineering-playbook/code-reviews/recipes/javascript-and-typescript/)
- **Automation:** ESLint `jest/no-test-return-statement`, `jest/valid-expect-in-promise`
- **Human review needed:** Yes

### IND-TEST-10: Use BDD-style assertions
- **Rule:** Write expectations declaratively using readable assertion libraries (expect/should) rather than imperative conditional logic.
- **Category:** Testing
- **Source:** [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- **Automation:** No
- **Human review needed:** Yes

---

## 12. React & Frontend Specific (Industry Practice)

### IND-REACT-01: Components should be small and single-responsibility
- **Rule:** Each component should do one thing. If a component handles both data fetching and rendering, split it.
- **Category:** Maintainability
- **Source:** [React Code Review Checklist (pagepro)](https://pagepro.co/blog/18-tips-for-a-better-react-code-review-ts-js/), [IBM Code Review Checklist](https://community.ibm.com/community/user/blogs/marina-mascarenhas/2025/07/15/code-review-checklist-for-javascriptreact)
- **Automation:** No
- **Human review needed:** Yes

### IND-REACT-02: Proper hook dependency arrays
- **Rule:** `useEffect` must have correct dependency arrays. Missing dependencies cause stale closures; extra dependencies cause unnecessary re-runs.
- **Category:** Reliability, Performance
- **Source:** [LogRocket - 15 Common useEffect Mistakes](https://blog.logrocket.com/15-common-useeffect-mistakes-react/)
- **Automation:** ESLint `react-hooks/exhaustive-deps`
- **Human review needed:** Yes (intentional omissions need justification)

### IND-REACT-03: useEffect cleanup functions
- **Rule:** Every `useEffect` that creates subscriptions, timers, event listeners, or async operations must return a cleanup function. Use `AbortController` for fetch requests. Remove event listeners with exact handler references.
- **Category:** Reliability, Performance
- **Source:** [LogRocket - useEffect cleanup](https://blog.logrocket.com/understanding-react-useeffect-cleanup-function/), [Preventing Memory Leaks in React](https://www.c-sharpcorner.com/article/preventing-memory-leaks-in-react-with-useeffect-hooks/)
- **Automation:** Partially (can flag useEffect without return)
- **Human review needed:** Yes

### IND-REACT-04: No state updates in loops or during render
- **Rule:** Never call `setState` inside a loop, in the render body, or in useMemo/useCallback. State updates trigger re-renders.
- **Category:** Reliability, Performance
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** Partially
- **Human review needed:** Yes

### IND-REACT-05: Use React.memo, useMemo, useCallback appropriately
- **Rule:** Apply `React.memo` for components that receive the same props frequently. Use `useMemo` for expensive computations. Use `useCallback` for function references passed as props. Do not over-optimize.
- **Category:** Performance
- **Source:** [IBM Code Review Checklist](https://community.ibm.com/community/user/blogs/marina-mascarenhas/2025/07/15/code-review-checklist-for-javascriptreact), [Sentry React Performance Guide](https://blog.sentry.io/react-js-performance-guide/)
- **Automation:** No
- **Human review needed:** Yes

### IND-REACT-06: Props and state types must be defined
- **Rule:** All component props must have PropTypes (JS) or TypeScript interfaces. State shape should be explicitly typed. Avoid `any` type.
- **Category:** Maintainability, Reliability
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** ESLint `react/prop-types`, TypeScript strict mode
- **Human review needed:** Partially

### IND-REACT-07: No dangerouslySetInnerHTML without sanitization
- **Rule:** Any use of `dangerouslySetInnerHTML` must sanitize content with DOMPurify or equivalent first. Encapsulate in a dedicated security wrapper component.
- **Category:** Security
- **Source:** [Pragmatic Web Security - React XSS](https://pragmaticwebsecurity.com/articles/spasecurity/react-xss-part2), [LogRocket - dangerouslySetInnerHTML](https://blog.logrocket.com/using-dangerouslysetinnerhtml-react-application/)
- **Automation:** ESLint `react/no-danger`
- **Human review needed:** Yes (sanitization verification)

### IND-REACT-08: Key props on list items
- **Rule:** List-rendered elements must have stable, unique `key` props. Never use array index as key when list items can be reordered, inserted, or deleted.
- **Category:** Reliability, Performance
- **Source:** [React Code Review Checklist (pagepro)](https://pagepro.co/blog/18-tips-for-a-better-react-code-review-ts-js/)
- **Automation:** ESLint `react/no-array-index-key`
- **Human review needed:** Yes

### IND-REACT-09: Minimize logic in JSX
- **Rule:** Complex conditionals, transformations, and computations should be extracted to variables or functions above the return statement.
- **Category:** Maintainability
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** No
- **Human review needed:** Yes

### IND-REACT-10: No inline styles
- **Rule:** Avoid inline `style={{}}` attributes. Use CSS classes, CSS modules, or styled-components consistently with the project's approach.
- **Category:** Maintainability
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
- **Automation:** Partially
- **Human review needed:** Yes

---

## 13. Dependencies & Supply Chain (Industry Practice)

### IND-DEP-01: Lock dependencies with lockfiles
- **Rule:** Always commit `package-lock.json` or `pnpm-lock.yaml`. Use `npm ci` in CI/CD instead of `npm install`. Lockfiles ensure reproducible builds.
- **Category:** Security
- **Source:** [OpenSSF npm Best Practices](https://openssf.org/blog/2022/09/01/npm-best-practices-for-the-supply-chain/), [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** CI configuration check
- **Human review needed:** Yes (lockfile diff review for unexpected changes)

### IND-DEP-02: Audit dependencies regularly
- **Rule:** Run `npm audit` as part of CI. Use Dependabot or Snyk for continuous vulnerability scanning. Address critical and high severity vulnerabilities promptly.
- **Category:** Security
- **Source:** [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html), [npm Security Best Practices](https://github.com/bodadotsh/npm-security-best-practices)
- **Automation:** `npm audit`, Snyk, Dependabot
- **Human review needed:** Yes (triage and remediation decisions)

### IND-DEP-03: Evaluate new dependencies carefully
- **Rule:** Before adding a dependency: check maintenance activity, download counts, open issue count, last publish date, license compatibility. Prefer packages over 60 days old. Evaluate if native JS can accomplish the same task.
- **Category:** Security, Maintainability
- **Source:** [Axioned Node.js Checklist](https://handbook.axioned.com/learning/node/code-review-checklist/), [Endor Labs](https://www.endorlabs.com/learn/how-to-defend-against-npm-software-supply-chain-attacks)
- **Automation:** Snyk Advisor, Socket.dev
- **Human review needed:** Yes

### IND-DEP-04: Remove unused dependencies
- **Rule:** `package.json` should not contain dependencies that are not imported anywhere in the codebase. Unused dependencies increase attack surface and bundle size.
- **Category:** Security, Performance
- **Source:** [Frontend Code Review Checklist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12), [Axioned Node.js Checklist](https://handbook.axioned.com/learning/node/code-review-checklist/)
- **Automation:** `depcheck`, `npm-check`
- **Human review needed:** No

### IND-DEP-05: Be cautious with install scripts
- **Rule:** Audit packages that run `preinstall`, `install`, or `postinstall` scripts. These execute arbitrary code during `npm install`.
- **Category:** Security
- **Source:** [npm Security Best Practices](https://github.com/bodadotsh/npm-security-best-practices), [Snyk](https://snyk.io/blog/npm-security-preventing-supply-chain-attacks/)
- **Automation:** `npm audit signatures`, lockfile-lint
- **Human review needed:** Yes

### IND-DEP-06: Guard against dependency confusion
- **Rule:** Use scoped packages (`@org/package`). Configure npm registry settings explicitly. For private packages, ensure the name is claimed on the public registry or use a private registry.
- **Category:** Security
- **Source:** [OpenSSF npm Best Practices](https://openssf.org/blog/2022/09/01/npm-best-practices-for-the-supply-chain/)
- **Automation:** Registry configuration checks
- **Human review needed:** Yes

### IND-DEP-07: Review lockfile diffs
- **Rule:** When `package-lock.json` changes, review the diff to verify only expected packages changed. Use lockfile-lint to validate integrity and registry sources.
- **Category:** Security
- **Source:** [Node.js Security Best Practices](https://www.nodejs-security.com/blog/ten-best-practices-for-secure-code-review-of-nodejs-code)
- **Automation:** lockfile-lint
- **Human review needed:** Yes

---

## 14. Accessibility (Industry Practice)

### IND-A11Y-01: Semantic HTML elements
- **Rule:** Use proper semantic elements (`button`, `nav`, `main`, `article`, `section`) instead of `div` for everything. Screen readers depend on semantic structure.
- **Category:** Accessibility
- **Source:** [Frontend Mentor - Accessibility Tips](https://www.frontendmentor.io/articles/10-fundamental-web-accessibility-tips-for-frontend-developers-rUurADGxCt), [Codeable - Web Accessibility](https://www.codeable.io/blog/accessibility-front-end/)
- **Automation:** ESLint `jsx-a11y` plugin
- **Human review needed:** Yes

### IND-A11Y-02: ARIA attributes used correctly
- **Rule:** Use ARIA attributes correctly. Check for typos (`aria-labelledby` not `aria-labeledby`). Ensure `aria-label`, `aria-describedby` are present where needed.
- **Category:** Accessibility
- **Source:** [Accessibility: The Front-End Refactor](https://medium.com/@zahramirkazemi/accessibility-the-front-end-refactor-no-one-talks-about-647a6a90808a)
- **Automation:** ESLint `jsx-a11y` plugin (partial)
- **Human review needed:** Yes

### IND-A11Y-03: Keyboard navigation works
- **Rule:** All interactive elements must be reachable and operable via keyboard. Focus order must be logical.
- **Category:** Accessibility
- **Source:** [Frontend Mentor - Accessibility Tips](https://www.frontendmentor.io/articles/10-fundamental-web-accessibility-tips-for-frontend-developers-rUurADGxCt)
- **Automation:** Partially
- **Human review needed:** Yes

### IND-A11Y-04: Accessible error messages
- **Rule:** Form errors must be linked to inputs via `aria-describedby`. Invalid inputs must have `aria-invalid="true"`. Do not rely solely on color.
- **Category:** Accessibility
- **Source:** [Accessibility: The Front-End Refactor](https://medium.com/@zahramirkazemi/accessibility-the-front-end-refactor-no-one-talks-about-647a6a90808a)
- **Automation:** Partially
- **Human review needed:** Yes

### IND-A11Y-05: Images have alt text
- **Rule:** All `<img>` elements must have meaningful `alt` attributes. Decorative images should have `alt=""`.
- **Category:** Accessibility
- **Source:** [Frontend Mentor - Accessibility Tips](https://www.frontendmentor.io/articles/10-fundamental-web-accessibility-tips-for-frontend-developers-rUurADGxCt)
- **Automation:** ESLint `jsx-a11y/alt-text`
- **Human review needed:** Yes (alt text quality)

---

## 15. Node.js Production Readiness (Industry Practice)

### IND-PROD-01: Use a process manager
- **Rule:** Never run `node app.js` directly in production. Use PM2, systemd, Docker with restart policy, or a container orchestrator. Process must auto-restart on crash.
- **Category:** Reliability
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices), [Medium - Node.js Mistakes](https://medium.com/@deval93/the-node-js-mistakes-that-nearly-ended-my-career-and-how-you-can-avoid-them-d1247d040e86)
- **Automation:** Deployment config review
- **Human review needed:** Yes

### IND-PROD-02: Implement graceful shutdown
- **Rule:** On SIGTERM/SIGINT: stop accepting new connections, drain existing requests, close database connections, flush logs, then exit.
- **Category:** Reliability
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** No
- **Human review needed:** Yes

### IND-PROD-03: Set NODE_ENV=production
- **Rule:** Ensure `NODE_ENV=production` is set in production. Many frameworks optimize behavior based on this.
- **Category:** Performance, Security
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** Deployment config check
- **Human review needed:** No

### IND-PROD-04: Use structured logging
- **Rule:** Use Pino, Winston, or Bunyan. Include request IDs for correlation. Log to stdout. Never log passwords, tokens, or PII.
- **Category:** Reliability, Security
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices), [OWASP Node.js Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- **Automation:** No
- **Human review needed:** Yes

### IND-PROD-05: Monitor memory usage
- **Rule:** Set V8 memory limits explicitly. Monitor for memory leaks using heap snapshots. Implement health check endpoints.
- **Category:** Reliability, Performance
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices), [Netflix TechBlog - Node.js in Flames](http://techblog.netflix.com/2014/11/nodejs-in-flames.html)
- **Automation:** APM tools
- **Human review needed:** Yes

### IND-PROD-06: Use LTS Node.js versions
- **Rule:** Production environments must run LTS Node.js versions. Stay current with security patches.
- **Category:** Security, Reliability
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** CI version check
- **Human review needed:** No

### IND-PROD-07: Run as non-root user
- **Rule:** Node.js processes must not run as root. Docker containers should specify `USER` directive.
- **Category:** Security
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** Dockerfile lint
- **Human review needed:** Yes

### IND-PROD-08: Delegate SSL/compression to reverse proxy
- **Rule:** Do not handle SSL termination or response compression in Node.js. Delegate to nginx, HAProxy, or cloud load balancers.
- **Category:** Performance
- **Source:** [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- **Automation:** Architecture review
- **Human review needed:** Yes

---

## 16. ESLint Security Plugin Rules (Complete Reference)

The [eslint-plugin-security](https://github.com/eslint-community/eslint-plugin-security) package provides 14 rules:

| Rule | Detects | Severity |
|------|---------|----------|
| `detect-bidi-characters` | Trojan source attacks using unicode bidirectional text | High |
| `detect-buffer-noassert` | Buffer calls with noAssert flag | Medium |
| `detect-child-process` | child_process usage and non-literal exec() | High |
| `detect-disable-mustache-escape` | Disabled HTML escaping in template engines | High |
| `detect-eval-with-expression` | eval() with variable arguments | Critical |
| `detect-new-buffer` | new Buffer() with non-literal arguments | Medium |
| `detect-no-csrf-before-method-override` | CSRF middleware before method-override | High |
| `detect-non-literal-fs-filename` | fs operations with variable filenames | High |
| `detect-non-literal-regexp` | RegExp() with variable patterns (ReDoS risk) | High |
| `detect-non-literal-require` | require() with variable arguments | High |
| `detect-object-injection` | Bracket notation property access in assignments | Medium |
| `detect-possible-timing-attacks` | Sequential comparisons vulnerable to timing | Medium |
| `detect-pseudoRandomBytes` | pseudoRandomBytes() insufficient randomness | Medium |
| `detect-unsafe-regex` | Expensive regexes that block event loop | High |

---

## 17. Industry Sources Bibliography (Part 2)

### Style Guides & Checklists

21. **Airbnb JavaScript Style Guide.** [GitHub](https://github.com/airbnb/javascript)
22. **Airbnb React/JSX Style Guide.** [airbnb.io](https://airbnb.io/javascript/react/)
23. **Frontend Code Review Checklist (bigsergey).** [GitHub Gist](https://gist.github.com/bigsergey/aef64f68c22b3107ccbc439025ebba12)
24. **Axioned JavaScript Code Review Checklist.** [Link](https://handbook.axioned.com/learning/javascript/code-review-checklist/)
25. **Axioned Node.js Code Review Checklist.** [Link](https://handbook.axioned.com/learning/node/code-review-checklist/)
26. **IBM Code Review Checklist for JS/React.** [Link](https://community.ibm.com/community/user/blogs/marina-mascarenhas/2025/07/15/code-review-checklist-for-javascriptreact)
27. **React Code Review: 18 Best Practices (Pagepro).** [Link](https://pagepro.co/blog/18-tips-for-a-better-react-code-review-ts-js/)

### Best Practice Repositories

28. **Node.js Best Practices (goldbergyoni) - 102+ practices.** [GitHub](https://github.com/goldbergyoni/nodebestpractices)
29. **JavaScript Testing Best Practices (goldbergyoni) - 50+ practices.** [GitHub](https://github.com/goldbergyoni/javascript-testing-best-practices)

### Security Sources

30. **Node.js Security Best Practices (nodejs-security.com).** [Link](https://www.nodejs-security.com/blog/ten-best-practices-for-secure-code-review-of-nodejs-code)
31. **OpenSSF npm Best Practices for Supply Chain.** [Link](https://openssf.org/blog/2022/09/01/npm-best-practices-for-the-supply-chain/)
32. **npm Security Best Practices (bodadotsh).** [GitHub](https://github.com/bodadotsh/npm-security-best-practices)
33. **Snyk - NPM Security.** [Link](https://snyk.io/blog/npm-security-preventing-supply-chain-attacks/)
34. **Endor Labs - NPM Supply Chain Defense.** [Link](https://www.endorlabs.com/learn/how-to-defend-against-npm-software-supply-chain-attacks)
35. **OWASP Prototype Pollution Prevention.** [Link](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html)

### Performance Sources

36. **DebugBear - Front-end JavaScript Performance.** [Link](https://www.debugbear.com/blog/front-end-javascript-performance)
37. **Nolan Lawson - JavaScript Performance Beyond Bundle Size.** [Link](https://nolanlawson.com/2021/02/23/javascript-performance-beyond-bundle-size/)
38. **Sentry - React Performance Guide.** [Link](https://blog.sentry.io/react-js-performance-guide/)
39. **Netflix TechBlog - Node.js in Flames.** [Link](http://techblog.netflix.com/2014/11/nodejs-in-flames.html)

### React & Frontend Sources

40. **LogRocket - 15 Common useEffect Mistakes.** [Link](https://blog.logrocket.com/15-common-useeffect-mistakes-react/)
41. **LogRocket - useEffect Cleanup Function.** [Link](https://blog.logrocket.com/understanding-react-useeffect-cleanup-function/)
42. **Pragmatic Web Security - React XSS Part 2.** [Link](https://pragmaticwebsecurity.com/articles/spasecurity/react-xss-part2)
43. **Accessibility: The Front-End Refactor.** [Medium](https://medium.com/@zahramirkazemi/accessibility-the-front-end-refactor-no-one-talks-about-647a6a90808a)
44. **Frontend Mentor - 10 Accessibility Tips.** [Link](https://www.frontendmentor.io/articles/10-fundamental-web-accessibility-tips-for-frontend-developers-rUurADGxCt)

### Post-Mortems & Lessons Learned

45. **Node.js March 17th Infrastructure Incident Post-mortem.** [Link](https://nodejs.org/en/blog/announcements/node-js-march-17-incident)
46. **DZone - Unhandled Promise Rejections Crash.** [Link](https://dzone.com/articles/unhandled-promise-rejections-nodejs-crash)
47. **Medium - Node.js Career Mistakes.** [Link](https://medium.com/@deval93/the-node-js-mistakes-that-nearly-ended-my-career-and-how-you-can-avoid-them-d1247d040e86)
48. **RisingStack - Node.js War Stories.** [Link](https://blog.risingstack.com/node-js-war-stories-solving-issues-in-production-2/)
