# Code Review Output Template

**Version:** 1.0.0

Output format template for all code reviews.

---

## Changelog

- **1.0.0** - Initial release with facts-based feedback approach

---

## Purpose

This template defines the **output format** for code reviews. When conducting a code review:

1. First, review code according to applicable standards (javascript.md, unreal-engine-cpp.md, etc.)
2. Then, structure your review output according to this template
3. Use facts-based feedback style throughout

---

## Core Principles: Facts-Based Feedback

> **"Technical facts and data overrule opinions and personal preferences"** — Google Engineering Practices

### Rules

1. **Base feedback on standards, not opinions**
   - ✅ Reference specific standards (javascript.md:L234)
   - ❌ State personal preferences without basis

2. **Be specific and concrete with measurements**
   - ✅ "Function length: 150 lines. Standard: max 50 lines (javascript.md:L789)"
   - ❌ "This function is too long"

3. **Focus on code, not developer**
   - ✅ "Variable name doesn't follow camelCase convention"
   - ❌ "You didn't follow naming conventions"

4. **Ask questions instead of making demands**
   - ✅ "Should this use async/await per javascript.md:L234? Current implementation blocks event loop."
   - ❌ "Change this to use async/await"

5. **No emotional language or praise**
   - ✅ "Implementation matches design-system.md specifications"
   - ❌ "Great work on this!" ✨

---

## Review Output Format

### Section 1: Summary

**Purpose**: Objective overview of review scope and findings

**Format**:
```markdown
## Review Summary

**Files Reviewed**: [count] files, [total] lines changed
**Standards Applied**: [list of applicable standards]
**Critical Issues**: [count] (must fix before merge)
**Suggestions**: [count] (recommended improvements)
**Questions**: [count] (clarification needed)
```

**Example**:
```markdown
## Review Summary

**Files Reviewed**: 3 files, 287 lines changed
**Standards Applied**: javascript.md, design-system.md
**Critical Issues**: 2 (must fix before merge)
**Suggestions**: 5 (recommended improvements)
**Questions**: 3 (clarification needed)
```

---

### Section 2: Critical Issues

**Purpose**: Must-fix issues that violate standards or introduce bugs/security risks

**Format**:
```markdown
## Critical Issues

### [Severity] [File:Line] [Issue Title]

**Standard**: [standard.md:line or rule reference]
**Current**: [what the code does now]
**Expected**: [what it should do]
**Impact**: [technical consequence]

[Optional: Code snippet or additional context]
```

**Example**:
```markdown
## Critical Issues

### CRITICAL src/server.js:45 — Exposed Database Credentials

**Standard**: javascript.md:L892 (Never hardcode secrets)
**Current**: Database password hardcoded in source file
**Expected**: Use environment variables (process.env.DB_PASSWORD)
**Impact**: Security vulnerability. Credentials exposed in version control.

\`\`\`javascript
// Current (line 45)
const dbPassword = 'production_password_123';

// Expected
const dbPassword = process.env.DB_PASSWORD;
\`\`\`

### ERROR src/utils/data.js:128 — Blocking I/O in Async Function

**Standard**: javascript.md:L456 (Use non-blocking async operations)
**Current**: fs.readFileSync() blocks event loop
**Expected**: Use fs.promises.readFile() or fs.readFile() with async/await
**Impact**: Blocks Node.js event loop, degrades server performance

\`\`\`javascript
// Current (line 128)
const data = fs.readFileSync('data.json', 'utf8');

// Expected
const data = await fs.promises.readFile('data.json', 'utf8');
\`\`\`
```

---

### Section 3: Suggestions

**Purpose**: Recommended improvements that enhance code quality but aren't blocking

**Format**:
```markdown
## Suggestions

### [File:Line] [Suggestion Title]

**Observation**: [factual description of current code]
**Standard/Rationale**: [reference or technical reasoning]
**Recommendation**: [what could be improved]
**Benefit**: [measurable or technical benefit]
```

**Example**:
```markdown
## Suggestions

### src/api/users.js:67 — Function Complexity

**Observation**: getUserData() function is 145 lines with cyclomatic complexity 18
**Standard**: javascript.md:L789 (max 50 lines per function, complexity ≤ 10)
**Recommendation**: Extract validation logic into separate validateUserInput() function, database operations into UserRepository class
**Benefit**: Improved testability, reduced cognitive load, easier maintenance

### src/components/Header.jsx:23 — Missing PropTypes

**Observation**: Component accepts props without type validation
**Standard**: javascript.md:L567 (Use PropTypes for all React components)
**Recommendation**: Add PropTypes definition
**Benefit**: Type safety, better developer experience, catches bugs at runtime

\`\`\`javascript
Header.propTypes = {
  title: PropTypes.string.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired
};
\`\`\`

### public/styles/main.css:234 — Magic Number

**Observation**: Hard-coded value `margin-top: 37px` without context
**Standard**: design-system.md:L45 (Use CSS variables for spacing)
**Recommendation**: Use `var(--spacing-lg)` or document reason for custom value
**Benefit**: Consistent spacing across UI, easier theme updates
```

---

### Section 4: Questions

**Purpose**: Clarifying questions about design choices or implementation details

**Format**:
```markdown
## Questions

### [File:Line] [Question Topic]

**Context**: [what the code does]
**Question**: [specific question]
**Reason**: [why this matters for review]
```

**Example**:
```markdown
## Questions

### src/services/cache.js:89 — Cache TTL Strategy

**Context**: Cache TTL set to 3600 seconds (1 hour) for user data
**Question**: Is 1-hour TTL intentional for user profile data? User preferences updates may not reflect for 1 hour.
**Reason**: Affects user experience. javascript.md:L923 recommends TTL based on data change frequency.

### src/components/ProductList.jsx:156 — Re-render Optimization

**Context**: Component re-renders on every parent state change despite using React.memo
**Question**: Should this use useMemo for the `filteredProducts` calculation? Current implementation recalculates on every render.
**Reason**: Performance impact. Calculating 1000+ product filters on every render may cause UI lag.

### Content/Materials/M_Character.uasset — Material Complexity

**Context**: Material has 145 instruction count
**Question**: Is this material used on multiple characters or single hero character?
**Reason**: unreal-engine-cpp.md:L567 recommends <100 instructions for characters. If used on multiple instances, may impact performance.
```

---

### Section 5: Standards Compliance

**Purpose**: Checklist showing which standards were verified

**Format**:
```markdown
## Standards Compliance

### [standard.md] — [Standard Name]

- ✅ [Rule/section that passed]
- ✅ [Rule/section that passed]
- ⚠️ [Rule/section with suggestions]
- ❌ [Rule/section with critical issues]
- ➖ [Rule/section not applicable]
```

**Example**:
```markdown
## Standards Compliance

### javascript.md — JavaScript/Node.js Coding Standards

- ✅ Naming conventions (camelCase, PascalCase)
- ✅ Modern syntax (const/let, arrow functions, destructuring)
- ⚠️ Function length (5 functions exceed 50 lines)
- ❌ Async patterns (1 blocking I/O call)
- ✅ Error handling (try/catch used appropriately)
- ⚠️ Code comments (some complex logic lacks "why" comments)
- ✅ Security (no hardcoded secrets)
- ➖ Testing (no test files in this PR)

### design-system.md — Typo-base v1.8.1

- ✅ Typography (showcase headings 20/18/16/14px)
- ⚠️ Spacing (1 magic number found)
- ✅ Colors (using CSS variables)
- ✅ Code blocks (border-radius: 1px)
- ➖ Layout (no layout changes in this PR)
```

---

## Standard References Map

Use these standards based on file type and domain:

| Standard | When to Apply |
|----------|---------------|
| `javascript.md` | JavaScript/Node.js files (.js, .jsx, .ts, .tsx) |
| `unreal-engine-cpp.md` | Unreal Engine C++ files (.h, .cpp) |
| `unreal-engine-asset.md` | Unreal Engine assets (naming, organization) |
| `design-system.md` | UI/CSS files (.css, .html, .ejs) |
| `review-code-javascript.md` | JavaScript/Node.js code review checklist (detailed) |
| `review-code-unreal-cpp.md` | C++ code review checklist (detailed) |
| `review-code-unreal-python.md` | UE Python code review checklist |
| `slash-commands.md` | Slash command files (.md in commands/) |
| `delegation.md` | Project planning and task breakdown |
| `tech-spec-template.md` | Technical specifications |

**Multiple standards may apply to a single review** (e.g., React component review uses both `javascript.md` for code and `design-system.md` for styling).

---

## Example: Complete Review Output

```markdown
# Code Review: User Authentication Refactor

## Review Summary

**Files Reviewed**: 4 files, 342 lines changed
**Standards Applied**: javascript.md, design-system.md
**Critical Issues**: 1 (must fix before merge)
**Suggestions**: 3 (recommended improvements)
**Questions**: 2 (clarification needed)

---

## Critical Issues

### ERROR src/auth/login.js:78 — SQL Injection Vulnerability

**Standard**: javascript.md:L845 (Use parameterized queries)
**Current**: User input concatenated directly into SQL query
**Expected**: Use parameterized query or ORM
**Impact**: Critical security vulnerability. Allows arbitrary SQL execution.

\`\`\`javascript
// Current (line 78) — UNSAFE
const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;

// Expected
const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
db.execute(query, [email, hashedPassword]);
\`\`\`

---

## Suggestions

### src/auth/login.js:45 — Function Length

**Observation**: authenticateUser() function is 87 lines
**Standard**: javascript.md:L789 (max 50 lines per function)
**Recommendation**: Extract password validation into validatePassword(), token generation into generateAuthToken()
**Benefit**: Improved testability, easier to maintain

### src/components/LoginForm.jsx:23 — Inline Styles

**Observation**: Component uses inline style objects instead of CSS classes
**Standard**: design-system.md:L123 (Use centralized CSS, avoid inline styles)
**Recommendation**: Move styles to main.css or component-specific CSS file
**Benefit**: Consistency with design system, easier theme updates

### src/auth/session.js:156 — Error Message Exposure

**Observation**: Detailed error messages exposed to client
**Standard**: javascript.md:L901 (Don't expose internal errors to client)
**Recommendation**: Log detailed error server-side, return generic message to client
**Benefit**: Security (prevents information leakage), better user experience

---

## Questions

### src/auth/login.js:112 — Session Duration

**Context**: Session token TTL set to 7 days
**Question**: Is 7-day session intentional? javascript.md:L923 recommends shorter TTL for sensitive operations.
**Reason**: Security consideration. Longer sessions increase risk of token theft.

### src/components/LoginForm.jsx:67 — Form Validation

**Context**: Email validation uses simple regex pattern
**Question**: Should this use a library like validator.js for email validation? Current regex may miss edge cases.
**Reason**: javascript.md:L678 recommends well-tested libraries over custom regex for common tasks.

---

## Standards Compliance

### javascript.md — JavaScript/Node.js Coding Standards

- ✅ Naming conventions (camelCase, PascalCase)
- ✅ Modern syntax (const/let, async/await)
- ⚠️ Function length (1 function exceeds 50 lines)
- ❌ Security (SQL injection vulnerability)
- ✅ Error handling (try/catch used)
- ✅ Code organization (clear separation of concerns)

### design-system.md — Typo-base v1.8.1

- ⚠️ Inline styles (1 component uses inline styles)
- ✅ Typography (using showcase styles)
- ✅ Form inputs (following design system)
- ➖ Layout (no layout changes)
```

---

## Writing Tips

### Do's ✅

- **Reference specific lines**: "src/app.js:45" instead of "in the app file"
- **Cite standards**: "javascript.md:L789" instead of "best practice says"
- **Use measurements**: "150 lines, complexity 18" instead of "too complex"
- **Ask questions**: "Should this...?" instead of "Change this to..."
- **Explain impact**: "Blocks event loop, degrades performance" instead of "bad performance"

### Don'ts ❌

- **No opinions without basis**: ❌ "I think this is messy"
- **No emotional language**: ❌ "Great work!", "This is terrible"
- **No vague feedback**: ❌ "Improve this code"
- **No commands without context**: ❌ "Refactor this"
- **No personal pronouns for developer**: ❌ "You should..." (use "This should...")

---

## Notes

- This template is for **review output format**, not review checklist
- For detailed review checklists, see domain-specific standards (review-code-unreal-cpp.md, etc.)
- All reviews should reference applicable standards from `~/.claude/standards/`
- Severity levels: CRITICAL (security/bugs), ERROR (standard violations), WARNING (suggestions)
