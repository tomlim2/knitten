---
status: accepted
---
# JavaScript Coding Standards

**Based on:** Airbnb JavaScript Style Guide + Node.js Best Practices

---

## Philosophy

1. **Readability > Cleverness** - Code is read more than written
2. **Modern JavaScript** - Use ES6+ features, avoid legacy patterns
3. **Consistency** - Follow conventions, not personal preferences
4. **Fail Fast** - Validate early, handle errors gracefully
5. **Performance Awareness** - Don't block, cache wisely, scale horizontally

---

## Naming Conventions

| Target | Style | Example |
|--------|-------|---------|
| Variables, functions | camelCase | `userData`, `getUserData()` |
| Classes, constructors | PascalCase | `UserService`, `DataManager` |
| Constants | UPPER_SNAKE | `API_URL`, `MAX_RETRIES` |
| Private (convention) | `_prefix` | `this._cache`, `_fetchFromCache()` |

**Rules:**
- Use descriptive names. Avoid abbreviations unless universal (`api`, `html`, `url` are OK).
- Never use single-letter or cryptic names: `i`, `el`, `e`, `btn` are all bad.
- Object constant keys use camelCase: `const CONFIG = { apiUrl: '...', maxRetries: 3 };`

```javascript
// Good
for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) { ... }
items.forEach((item, index) => { ... });
canvas.addEventListener('click', (event) => { ... });
const submitButton = document.getElementById('submit');

// Bad
for (let i = 0; i < layers.length; i++) { ... }
items.forEach((el, i) => { ... });
canvas.addEventListener('click', (e) => { ... });
const btn = document.getElementById('submit');
```

---

## Variable Declarations

- **`const` > `let`, never `var`** (var has function scope, hoisting, and redeclaration bugs)
- **One declaration per line**
- **Group `const` first, then `let`**

```javascript
const name = 'Alice';
const age = 30;
let count = 0;
let total = 0;
```

---

## Modern JavaScript Syntax (ES6+)

### Arrow Functions

Use for callbacks and short functions. Use function declarations for named functions.

```javascript
items.map(item => item.name);
items.filter(item => item.active);
setTimeout(() => { console.log('Done'); }, 1000);

function getUserData(userId) {
    return db.users.findById(userId);
}
```

Arrow functions preserve lexical `this` -- use them in class methods with `setInterval`/`setTimeout`.

### Template Literals

```javascript
const message = `Hello, ${user.name}!`;
const url = `/api/users/${userId}/posts`;
```

### Destructuring

```javascript
// Objects
const { name, age } = user;
const { id: userId, email } = user;

// Arrays
const [first, second] = items;

// Function parameters with defaults
function createUser({ name, email, role = 'user' }) {
    return { name, email, role };
}
```

### Spread Operator

```javascript
const copy = [...items];                         // Copy array
const combined = [...itemsA, ...itemsB];         // Merge arrays
const copy = { ...user };                        // Copy object
const updated = { ...user, age: 31 };            // Merge objects
```

### Optional Chaining and Nullish Coalescing

```javascript
const city = user?.address?.city;                // Optional chaining
const result = obj?.method?.();
const port = process.env.PORT ?? 3000;           // Nullish coalescing (null/undefined only)
// Caution: || also triggers on 0, '', false
```

### Default Parameters

```javascript
function createUser(name, role = 'user') {
    return { name, role };
}
```

---

## Async Programming

### Prefer async/await Over Callbacks

```javascript
async function getUserWithData(userId) {
    const user = await getUserData(userId);
    const posts = await getPosts(user.id);
    const comments = await getComments(posts[0].id);
    return comments;
}
```

### Always Use try/catch

```javascript
async function fetchUserData(userId) {
    try {
        const user = await db.users.findById(userId);
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error.message);
        throw error;
    }
}
```

### Parallel vs Sequential

```javascript
// Sequential - when operations depend on each other
const user = await getUser(userId);
const posts = await getPosts(user.id);

// Parallel - when operations are independent
const [user, posts, comments] = await Promise.all([
    getUser(userId),
    getPosts(userId),
    getComments(userId)
]);
```

### Promise.allSettled for Partial Failures

```javascript
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
```

---

## Error Handling

### Graceful Degradation

```javascript
let supabase = null;
try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }
} catch (error) {
    console.log('Supabase initialization failed - tracking disabled');
}

async function recordUsage(type, id) {
    if (!supabase) return;  // Graceful degradation
    try {
        await supabase.rpc('increment_usage', { p_type: type, p_item_id: id });
    } catch (error) {
        console.error('Tracking error:', error.message);
    }
}
```

### Console Logging Standards

- `console.log()` for info, `console.warn()` for warnings, `console.error()` for errors.
- Never use `console.log()` for error messages.

### Operational vs Programmer Errors

- **Operational** (expected, recoverable): network failures, invalid input, timeouts -- handle gracefully.
- **Programmer** (bugs): undefined variables, type errors -- let them crash.

### Process-Level Error Handling

```javascript
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
});
```

---

## Code Quality

### Formatting

- **Indentation:** 2 spaces, no tabs (Airbnb style)
- **Line length:** 80-120 characters max
- **Function length:** Under 50 lines ideal
- **Nesting:** Maximum 3 levels deep
- **Strict equality:** Always `===`, never `==`

### Early Returns (Guard Clauses)

```javascript
function processUser(user) {
    if (!user) return null;
    if (!user.active) return null;
    if (!user.email) return null;
    return transformUserData(user);
}
```

### Single Responsibility

Each function does one thing. Break large functions into composable pieces.

```javascript
async function createUser(userData) {
    validateUser(userData);
    const user = await saveUser(userData);
    return user;
}
```

### Immutability

```javascript
// Good - return new object
function updateUser(user, updates) {
    return { ...user, ...updates };
}

// Bad - mutating parameter
function updateUser(user, updates) {
    user.name = updates.name;
    return user;
}
```

---

## Quick Reference

### Modern JavaScript Checklist

- `const` > `let`, never `var`
- Arrow functions for callbacks
- Template literals for strings
- Destructuring for objects/arrays
- Spread operator for copying
- Optional chaining `?.`
- Nullish coalescing `??`
- async/await over callbacks
- `===` instead of `==`

### Node.js Checklist

- `path.join()` for file paths
- `fs/promises` for file operations
- Environment variables with defaults
- Graceful degradation for optional features
- `NODE_ENV='production'` in production

### Express.js Checklist

- RESTful route conventions
- Async handlers with try/catch
- Error middleware with `next(err)`
- Input validation (Joi, express-validator)
- Correct HTTP status codes
- Separate app.js from server.js

---

## Additional Resources

For detailed examples and advanced patterns, see [javascript-reference.md](javascript-reference.md).

---

*Readable code is maintainable code. Write for humans, not machines.*
