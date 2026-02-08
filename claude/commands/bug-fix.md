---
description: Fix bugs with test-first prove-it pattern
argument-hint: "[bug description or issue number]"
allowed-tools: Task, Read, Write, Edit, Bash(npm:*), Bash(node:*), Bash(pytest:*), Bash(jest:*)
---

# Bug Fix: Prove It Pattern

Fix bugs using the **test-first verification pattern**: Reproduce → Fix → Confirm.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `bug-fix`

## Workflow

### Step 1: Reproduce with Test (RED)

**Spawn a subagent** to write a test that reproduces the bug. The test MUST fail before the fix.

**Test level hierarchy** — Reproduce at the lowest level that can capture the bug:

1. **Unit test** — Pure logic bugs, isolated functions (lives next to the code)
2. **Integration test** — Component interactions, API boundaries (lives next to the code)
3. **UX spec test** — Full user flows, browser-dependent behavior (lives in `apps/web/specs/`)

**Agent prompt:**
```
Reproduce bug: $ARGUMENTS

1. Read the relevant code
2. Identify the root cause
3. Write a test that demonstrates the bug
4. Test should be at the LOWEST level possible:
   - Pure logic → unit test
   - API/component → integration test
   - User flow → UX spec test
5. Run the test - it MUST fail
6. Return:
   - Test file path
   - Test code
   - Failure output
   - Root cause analysis
```

### Step 2: Fix (GREEN)

Implement the fix based on root cause analysis from the test.

**Guidelines:**
- Fix the root cause, not symptoms
- Keep changes minimal and focused
- Update related code if needed
- Add comments explaining "why" if non-obvious

### Step 3: Confirm (REFACTOR)

Run the test again - it MUST pass now.

**Verification:**
```bash
# For unit/integration tests
npm test path/to/test.spec.ts

# For UX spec tests
npm run test:e2e path/to/spec.cy.ts
```

**Success criteria:**
- ✅ Test passes
- ✅ No regressions (run full test suite if critical)
- ✅ Code reviewed for clarity

### Step 4: Document (if test not feasible)

If the bug is truly environment-specific or transient, document why a test isn't feasible rather than skipping silently.

**Create a bug report:**
```markdown
## Bug: [Title]

**Environment:** [OS, browser, conditions]
**Reproducible:** No - [explain why]
**Fix applied:** [description]
**Verification:** Manual testing on [date] by [person]
**Why no test:** [specific reason - e.g., "Requires production OAuth flow"]
```

## Example Usage

### Example 1: Logic Bug

```
/bug-fix User age validation accepts negative numbers
```

**Agent writes:**
```typescript
// src/user/validator.spec.ts
test('rejects negative age', () => {
  expect(validateAge(-5)).toBe(false); // FAILS - currently returns true
});
```

**Fix:**
```typescript
function validateAge(age: number): boolean {
  return age >= 0 && age <= 150; // Added >= 0 check
}
```

**Confirm:**
```
✅ Test passes
```

### Example 2: API Bug

```
/bug-fix POST /api/users returns 200 on duplicate email instead of 409
```

**Agent writes:**
```typescript
// src/api/users.integration.spec.ts
test('returns 409 for duplicate email', async () => {
  await createUser({ email: 'test@example.com' });
  const res = await createUser({ email: 'test@example.com' });
  expect(res.status).toBe(409); // FAILS - currently 200
});
```

### Example 3: Environment-Specific (No Test)

```
/bug-fix Slack OAuth fails in production but works locally
```

**Document:**
```markdown
## Bug: Slack OAuth Production Failure

**Environment:** Production only (OAuth redirect URL mismatch)
**Reproducible:** No - requires production Slack app credentials
**Fix applied:** Updated SLACK_REDIRECT_URL in production env vars
**Verification:** Manual test 2026-02-04, successful OAuth flow
**Why no test:** Slack OAuth requires real app credentials, not mockable in test env
```

## Test Framework Detection

Auto-detect test framework from project:

| File | Framework | Command |
|------|-----------|---------|
| `package.json` has `"jest"` | Jest | `npm test` |
| `package.json` has `"vitest"` | Vitest | `npm run test` |
| `pytest.ini` exists | Pytest | `pytest` |
| `cypress.json` exists | Cypress | `npm run test:e2e` |

## Output Format

```
## Bug Fix Report

**Bug:** [Description]
**Root Cause:** [Analysis]

---

### ✅ Step 1: Reproduction (RED)

**Test:** `path/to/test.spec.ts`
**Result:** FAILED (as expected)

```
[failure output]
```

---

### ✅ Step 2: Fix (GREEN)

**Files changed:**
- `src/module.ts` (L42-L45)

**Changes:**
- Added null check before processing
- Updated validation logic

---

### ✅ Step 3: Confirm (PASS)

**Result:** PASSED

```
✓ should reject negative age (2ms)
```

**Test suite:** All tests passing (127/127)

---

**Commits:**
1. `test: add reproduction test for negative age bug`
2. `fix: reject negative age values in validator`
```

## Rules

1. **Test first, always** - Never commit fix without reproduction test
2. **Lowest level** - Use fastest test type that captures the bug
3. **Must fail first** - If test passes before fix, it's not testing the bug
4. **Document exceptions** - If test not feasible, explain why in writing
5. **No silent skips** - Either write test or document why you can't

## Anti-Patterns

❌ **Don't:** "I fixed it, seems to work now"
✅ **Do:** Write test → see failure → fix → see pass

❌ **Don't:** Skip test because "it's too hard to test"
✅ **Do:** Document why test isn't feasible with specifics

❌ **Don't:** Write test after the fix
✅ **Do:** Test must fail first, proving it captures the bug

## Integration with Git Workflow

After bug fix:

1. Commit test first: `git commit -m "test: reproduce negative age bug"`
2. Commit fix: `git commit -m "fix: reject negative age in validator"`
3. Push: `git push`

This creates clear history: bug was reproduced, then fixed.
