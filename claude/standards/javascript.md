# JavaScript Coding Standards

**Version:** 0.1.0
**Based on:** Airbnb JavaScript Style Guide + Node.js Best Practices

## Changelog

- **0.1.0** - Initial release

---

## Philosophy

### Core Principles

1. **Readability > Cleverness** - Code is read more than written
2. **Modern JavaScript** - Use ES6+ features, avoid legacy patterns
3. **Consistency** - Follow conventions, not personal preferences
4. **Fail Fast** - Validate early, handle errors gracefully
5. **Performance Awareness** - Don't block, cache wisely, scale horizontally

**Inspired by:**
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Naming Conventions

Based on Airbnb style guide.

### Variables and Functions

Use **camelCase** for variables and functions.

```javascript
// ✅ Good
const userData = getUserData();
const itemCount = items.length;
function calculateTotal(items) { }

// ❌ Bad
const user_data = getUserData();     // snake_case
const ItemCount = items.length;      // PascalCase for variable
function CalculateTotal(items) { }   // PascalCase for function
```

### Classes and Constructors

Use **PascalCase** for classes and constructors.

```javascript
// ✅ Good
class UserService { }
class DataManager { }
const date = new Date();

// ❌ Bad
class userService { }    // camelCase
class data_manager { }   // snake_case
```

### Constants

Use **UPPERCASE** with underscores for constants.

```javascript
// ✅ Good
const API_URL = 'https://api.example.com';
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// ❌ Bad
const apiUrl = 'https://api.example.com';     // camelCase
const maxRetries = 3;
```

**Exception:** Object constants use camelCase for keys.

```javascript
// ✅ Good
const CONFIG = {
    apiUrl: 'https://api.example.com',
    maxRetries: 3,
    timeoutMs: 5000
};
```

### Descriptive Names

Use descriptive names. Avoid abbreviations unless universally understood.

```javascript
// ✅ Good
const userRepository = new UserRepository();
const httpClient = new HttpClient();

// ❌ Bad
const usrRepo = new UserRepository();    // Abbreviation
const cli = new HttpClient();            // Too short
const x = getUserData();                 // Meaningless

// ✅ Exception: Common abbreviations OK
const apiUrl = 'https://api.example.com';
const htmlContent = '<div>...</div>';
const userId = user.id;

// ❌ Bad - Single-letter / cryptic names
for (let i = 0; i < layers.length; i++) { ... }
items.forEach((el, i) => { ... });
canvas.addEventListener('click', (e) => { ... });
const btn = document.getElementById('submit');

// ✅ Good - Descriptive names everywhere
for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) { ... }
items.forEach((item, index) => { ... });
canvas.addEventListener('click', (event) => { ... });
const submitButton = document.getElementById('submit');
```

### Private Convention (Node.js)

Prefix private methods/properties with underscore (convention, not enforced).

```javascript
class UserService {
    constructor() {
        this._cache = new Map();    // Private by convention
    }

    getData() {                     // Public
        return this._fetchFromCache();
    }

    _fetchFromCache() {             // Private by convention
        return this._cache.get('data');
    }
}
```

---

## Variable Declarations

### Use const > let, Never var

```javascript
// ✅ Good
const items = [1, 2, 3];
let count = 0;

// ❌ Bad
var items = [1, 2, 3];    // Never use var
```

**Why avoid var?**
- Function scope (not block scope) causes bugs
- Hoisting confusion
- No error on redeclaration

### One Declaration Per Line

```javascript
// ✅ Good
const name = 'Alice';
const age = 30;

// ❌ Bad
const name = 'Alice', age = 30;
```

### Group const, Then let

```javascript
// ✅ Good
const name = 'Alice';
const age = 30;
let count = 0;
let total = 0;

// ❌ Bad - Mixed order
const name = 'Alice';
let count = 0;
const age = 30;
let total = 0;
```

---

## Modern JavaScript Syntax (ES6+)

### Arrow Functions vs Function Declarations

**Use arrow functions** for callbacks and short functions.

```javascript
// ✅ Good - Arrow function for callbacks
items.map(item => item.name);
items.filter(item => item.active);

setTimeout(() => {
    console.log('Done');
}, 1000);

// ✅ Good - Function declaration for named functions
function getUserData(userId) {
    return db.users.findById(userId);
}
```

**Arrow functions for lexical `this`:**

```javascript
// ✅ Good - Arrow function preserves `this`
class Timer {
    constructor() {
        this.seconds = 0;
    }

    start() {
        setInterval(() => {
            this.seconds++;    // `this` refers to Timer instance
        }, 1000);
    }
}

// ❌ Bad - Function loses `this` context
class Timer {
    start() {
        setInterval(function() {
            this.seconds++;    // `this` is undefined or global
        }, 1000);
    }
}
```

### Template Literals Over Concatenation

```javascript
// ✅ Good
const message = `Hello, ${user.name}!`;
const url = `/api/users/${userId}/posts`;

// ❌ Bad
const message = 'Hello, ' + user.name + '!';
const url = '/api/users/' + userId + '/posts';
```

### Destructuring

**Objects:**

```javascript
// ✅ Good
const { name, age } = user;
const { id: userId, email } = user;

// ❌ Bad
const name = user.name;
const age = user.age;
```

**Arrays:**

```javascript
// ✅ Good
const [first, second] = items;
const [, , third] = items;    // Skip elements

// ❌ Bad
const first = items[0];
const second = items[1];
```

**Function parameters:**

```javascript
// ✅ Good
function createUser({ name, email, role = 'user' }) {
    return { name, email, role };
}

// ❌ Bad
function createUser(options) {
    const name = options.name;
    const email = options.email;
    const role = options.role || 'user';
    return { name, email, role };
}
```

### Spread Operator

**Arrays:**

```javascript
// ✅ Good - Copy array
const copy = [...items];

// ✅ Good - Merge arrays
const combined = [...itemsA, ...itemsB];

// ❌ Bad
const copy = items.slice();
const combined = itemsA.concat(itemsB);
```

**Objects:**

```javascript
// ✅ Good - Copy object
const copy = { ...user };

// ✅ Good - Merge objects
const updated = { ...user, age: 31 };

// ❌ Bad
const copy = Object.assign({}, user);
```

### Optional Chaining

```javascript
// ✅ Good
const city = user?.address?.city;
const result = obj?.method?.();

// ❌ Bad
const city = user && user.address && user.address.city;
```

### Nullish Coalescing

```javascript
// ✅ Good - Only null/undefined triggers default
const port = process.env.PORT ?? 3000;
const name = user.name ?? 'Anonymous';

// ⚠️ Caution - || also triggers on 0, '', false
const port = process.env.PORT || 3000;    // If PORT=0, uses 3000
```

### Default Parameters

```javascript
// ✅ Good
function createUser(name, role = 'user') {
    return { name, role };
}

// ❌ Bad
function createUser(name, role) {
    role = role || 'user';
    return { name, role };
}
```

---

## Async Programming

### Prefer async/await Over Callbacks

**Avoid callback hell:**

```javascript
// ❌ Bad - Callback hell
getUserData(userId, (err, user) => {
    if (err) return handleError(err);

    getPosts(user.id, (err, posts) => {
        if (err) return handleError(err);

        getComments(posts[0].id, (err, comments) => {
            if (err) return handleError(err);
            console.log(comments);
        });
    });
});

// ✅ Good - async/await
async function getUserWithData(userId) {
    const user = await getUserData(userId);
    const posts = await getPosts(user.id);
    const comments = await getComments(posts[0].id);
    return comments;
}
```

### Always Use try/catch with async/await

```javascript
// ✅ Good
async function fetchUserData(userId) {
    try {
        const user = await db.users.findById(userId);
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error.message);
        throw error;    // Re-throw or handle
    }
}

// ❌ Bad - No error handling
async function fetchUserData(userId) {
    const user = await db.users.findById(userId);
    return user;    // Unhandled promise rejection
}
```

### Parallel vs Sequential Execution

**Sequential (one after another):**

```javascript
// ✅ Use when operations depend on each other
async function processUser(userId) {
    const user = await getUser(userId);        // Must finish first
    const posts = await getPosts(user.id);     // Needs user.id
    const stats = await calculateStats(posts); // Needs posts
    return stats;
}
```

**Parallel (all at once):**

```javascript
// ✅ Use when operations are independent
async function getDashboardData(userId) {
    const [user, posts, comments] = await Promise.all([
        getUser(userId),
        getPosts(userId),
        getComments(userId)
    ]);
    return { user, posts, comments };
}

// ❌ Bad - Unnecessary sequential execution
async function getDashboardData(userId) {
    const user = await getUser(userId);       // Waits unnecessarily
    const posts = await getPosts(userId);     // Could run in parallel
    const comments = await getComments(userId);
    return { user, posts, comments };
}
```

### Promise.allSettled for Partial Failures

```javascript
// ✅ Good - Continue even if some fail
async function fetchMultipleSources() {
    const results = await Promise.allSettled([
        fetchSourceA(),
        fetchSourceB(),
        fetchSourceC()
    ]);

    const successful = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

    return successful;
}
```

---

## Error Handling

### Graceful Degradation Pattern

From skill-server example:

```javascript
// ✅ Good - Graceful degradation
let supabase = null;
try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );
        console.log('✓ Supabase connected - tracking enabled');
    } else {
        console.log('⚠ Supabase credentials not found - tracking disabled');
    }
} catch (error) {
    console.log('⚠ Supabase initialization failed - tracking disabled');
}

// Later, check if available
async function recordUsage(type, id) {
    if (!supabase) return;  // Graceful degradation

    try {
        await supabase.rpc('increment_usage', { p_type: type, p_item_id: id });
    } catch (error) {
        console.error('Tracking error:', error.message);
        // Fail silently - tracking is optional
    }
}
```

### Express Error Middleware

```javascript
// ✅ Good - Centralized error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    // Don't expose internal error details
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// Route example
app.get('/api/users/:id', async (req, res, next) => {
    try {
        const user = await getUserData(req.params.id);
        res.json(user);
    } catch (error) {
        next(error);  // Pass to error middleware
    }
});
```

### Console Logging Standards

```javascript
// ✅ Good - Appropriate log levels
console.log('Server started on port', PORT);         // Info
console.warn('API rate limit approaching');          // Warning
console.error('Database connection failed:', error); // Error

// ❌ Bad - All console.log
console.log('Error:', error);    // Should be console.error
```

### Operational vs Programmer Errors

**Operational errors** (expected, recoverable):
- Network failures
- Invalid user input
- Database timeouts

**Programmer errors** (bugs, not recoverable):
- Undefined variables
- Type errors
- Logic bugs

```javascript
// ✅ Good - Handle operational errors
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);  // Operational
        }
        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError') {
            // Programmer error - invalid URL format
            throw error;  // Let it crash
        }
        // Operational error - retry or fallback
        console.error('Fetch failed:', error.message);
        return null;
    }
}
```

### Process-Level Error Handling

```javascript
// ✅ Good - Last resort for uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    // Log to monitoring service
    process.exit(1);  // Exit after cleanup
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
    // Log to monitoring service
});
```

---

## Node.js Specific

### Module System (CommonJS)

```javascript
// ✅ Good - CommonJS (Node.js default)
const express = require('express');
const path = require('path');
const { getUserData } = require('./services/users');

module.exports = {
    getUserData,
    createUser
};

// Alternative - Single export
module.exports = function createServer() {
    // ...
};
```

**Note:** ESM (import/export) requires `"type": "module"` in package.json or `.mjs` extension.

### Path Handling

```javascript
// ✅ Good - Use path.join()
const filePath = path.join(__dirname, 'data', 'users.json');
const publicDir = path.join(__dirname, 'public');

// ❌ Bad - String concatenation (breaks on Windows)
const filePath = __dirname + '/data/users.json';
const publicDir = __dirname + '/public';
```

### File System (Promises API)

```javascript
// ✅ Good - fs/promises (async/await)
const fs = require('fs').promises;

async function readConfig() {
    try {
        const data = await fs.readFile('config.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to read config:', error.message);
        return {};
    }
}

// ❌ Bad - Synchronous (blocks event loop)
const fs = require('fs');
const data = fs.readFileSync('config.json', 'utf-8');  // Blocks!
```

### Environment Variables

```javascript
// ✅ Good - Use process.env with defaults
const PORT = process.env.PORT ?? 3000;
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// ✅ Good - Validate required variables
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

// ✅ Good - Type conversion
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES ?? '3', 10);
const ENABLE_CACHE = process.env.ENABLE_CACHE === 'true';
```

### NODE_ENV for Performance

```javascript
// ✅ Good - Check NODE_ENV
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    // Production optimizations
    app.set('view cache', true);
    app.use(compression());
} else {
    // Development tools
    app.use(morgan('dev'));
}
```

---

## Express.js Patterns

### Route Organization (RESTful)

```javascript
// ✅ Good - RESTful conventions
app.get('/api/users', getUsers);           // List
app.get('/api/users/:id', getUser);        // Read
app.post('/api/users', createUser);        // Create
app.put('/api/users/:id', updateUser);     // Update (full)
app.patch('/api/users/:id', patchUser);    // Update (partial)
app.delete('/api/users/:id', deleteUser);  // Delete

// ❌ Bad - Non-standard routes
app.get('/api/getUsers', getUsers);
app.post('/api/deleteUser', deleteUser);   // Should be DELETE
```

### Async Route Handlers

```javascript
// ✅ Good - Async handler with error propagation
app.get('/api/users/:id', async (req, res, next) => {
    try {
        const user = await getUserData(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        next(error);  // Pass to error middleware
    }
});
```

### Middleware Patterns

```javascript
// ✅ Good - Reusable middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

function validateUserId(req, res, next) {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }
    next();
}

// Use middleware
app.get('/api/users/:id', requireAuth, validateUserId, getUser);
```

### HTTP Status Codes

```javascript
// ✅ Good - Use correct status codes
res.status(200).json(data);         // OK
res.status(201).json(created);      // Created
res.status(204).send();             // No Content
res.status(400).json({ error });    // Bad Request
res.status(401).json({ error });    // Unauthorized
res.status(404).json({ error });    // Not Found
res.status(500).json({ error });    // Internal Server Error

// ❌ Bad - Always 200
res.json({ error: 'Not found' });   // Should be 404
```

### Separate App Definition from Server

```javascript
// ✅ Good - app.js (testable)
const express = require('express');
const app = express();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;

// ✅ Good - server.js (not tested)
const app = require('./app');
const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

---

## Project Structure

### Component-Based Organization

```
project/
├── src/
│   ├── users/              # User component
│   │   ├── user.routes.js
│   │   ├── user.service.js
│   │   ├── user.model.js
│   │   └── user.test.js
│   ├── posts/              # Post component
│   │   ├── post.routes.js
│   │   ├── post.service.js
│   │   ├── post.model.js
│   │   └── post.test.js
│   └── common/             # Shared utilities
│       ├── db.js
│       └── logger.js
├── app.js                  # Express app definition
├── server.js               # Server startup
└── package.json
```

**Why component-based?**
- Easy to reason about (all user-related code in one folder)
- Scales better than grouping by type (routes/, services/, models/)
- Easier to extract into microservices

### Layer Separation

**Each component should have clear layers:**

```javascript
// routes layer (HTTP concerns)
router.get('/:id', async (req, res, next) => {
    try {
        const user = await userService.getById(req.params.id);
        res.json(user);
    } catch (error) {
        next(error);
    }
});

// service layer (business logic)
async function getById(userId) {
    const user = await userModel.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
}

// model layer (data access)
async function findById(userId) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    return result.rows[0];
}
```

---

## Code Quality

### ESLint Configuration

```json
{
    "extends": ["eslint:recommended", "plugin:node/recommended"],
    "env": {
        "node": true,
        "es6": true
    },
    "rules": {
        "no-var": "error",
        "prefer-const": "error",
        "no-console": "off",
        "semi": ["error", "always"]
    }
}
```

### Line Length

**Maximum: 80-120 characters**

```javascript
// ✅ Good - Break long lines
const result = await processUserData(
    userId,
    options,
    { includeDeleted: false, limit: 100 }
);

// ❌ Bad - Too long
const result = await processUserData(userId, options, { includeDeleted: false, limit: 100, sortBy: 'createdAt', order: 'desc' });
```

### Single Responsibility Principle

```javascript
// ✅ Good - Each function does one thing
function validateUser(user) {
    if (!user.email) throw new Error('Email required');
    if (!user.name) throw new Error('Name required');
}

function saveUser(user) {
    return db.users.insert(user);
}

async function createUser(userData) {
    validateUser(userData);
    const user = await saveUser(userData);
    return user;
}

// ❌ Bad - Function does too much
async function createUser(userData) {
    // Validation
    if (!userData.email) throw new Error('Email required');
    if (!userData.name) throw new Error('Name required');

    // Saving
    const user = await db.users.insert(userData);

    // Sending email
    await sendEmail(user.email, 'Welcome!');

    // Logging
    console.log('User created:', user.id);

    return user;
}
```

### Function Length

**Ideal: <50 lines**

If a function exceeds 50 lines, consider breaking it into smaller functions.

### Early Returns (Guard Clauses)

```javascript
// ✅ Good - Early returns
function processUser(user) {
    if (!user) return null;
    if (!user.active) return null;
    if (!user.email) return null;

    // Main logic here
    return transformUserData(user);
}

// ❌ Bad - Deep nesting
function processUser(user) {
    if (user) {
        if (user.active) {
            if (user.email) {
                // Main logic deeply nested
                return transformUserData(user);
            }
        }
    }
    return null;
}
```

### Avoid Deep Nesting

**Maximum: 3 levels**

```javascript
// ✅ Good - Flat structure
async function processOrder(order) {
    if (!order) throw new Error('Order required');
    if (!order.items.length) throw new Error('No items');

    const user = await getUser(order.userId);
    if (!user) throw new Error('User not found');

    const total = calculateTotal(order.items);
    return { order, user, total };
}

// ❌ Bad - Deep nesting
async function processOrder(order) {
    if (order) {
        if (order.items.length > 0) {
            const user = await getUser(order.userId);
            if (user) {
                const total = calculateTotal(order.items);
                return { order, user, total };
            }
        }
    }
}
```

---

## Security

### Input Validation

```javascript
// ✅ Good - Validate all inputs
const Joi = require('joi');

const userSchema = Joi.object({
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(0).max(150)
});

app.post('/api/users', async (req, res, next) => {
    try {
        const validated = await userSchema.validateAsync(req.body);
        const user = await createUser(validated);
        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
});
```

### Limit Request Body Size

```javascript
// ✅ Good - Limit payload size
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### Don't Expose Error Details

```javascript
// ✅ Good - Generic error message for clients
app.use((err, req, res, next) => {
    console.error('Error:', err);  // Log full error server-side

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message  // Show details only in dev
    });
});

// ❌ Bad - Exposing stack traces
app.use((err, req, res, next) => {
    res.status(500).json({
        error: err.message,
        stack: err.stack  // Never expose stack traces!
    });
});
```

### Security Headers (Helmet)

```javascript
// ✅ Good - Use Helmet for security headers
const helmet = require('helmet');
app.use(helmet());
```

---

## Performance

### Clustering (Multi-Core)

```javascript
// ✅ Good - Utilize all CPU cores
const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker) => {
        console.log(`Worker ${worker.id} died, starting new worker`);
        cluster.fork();
    });
} else {
    const app = require('./app');
    app.listen(3000);
}
```

### Caching

```javascript
// ✅ Good - Cache expensive operations
const cache = new Map();

async function getUserData(userId) {
    if (cache.has(userId)) {
        return cache.get(userId);
    }

    const user = await db.users.findById(userId);
    cache.set(userId, user);

    // Expire after 5 minutes
    setTimeout(() => cache.delete(userId), 5 * 60 * 1000);

    return user;
}
```

### Don't Block Event Loop

```javascript
// ❌ Bad - Blocking operation
const data = fs.readFileSync('large-file.json');  // Blocks!

// ✅ Good - Non-blocking
const data = await fs.promises.readFile('large-file.json');

// ❌ Bad - CPU-intensive task blocks
function fibonacci(n) {
    return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);  // Blocks for large n
}

// ✅ Good - Offload to worker thread
const { Worker } = require('worker_threads');
const worker = new Worker('./fibonacci-worker.js');
```

### Compression Middleware

```javascript
// ✅ Good - Enable compression
const compression = require('compression');
app.use(compression());
```

---

## Array/Object Patterns

### Prefer Array Methods Over Loops

```javascript
// ✅ Good - Array methods (functional)
const activeUsers = users.filter(u => u.active);
const userNames = users.map(u => u.name);
const total = prices.reduce((sum, price) => sum + price, 0);

// ❌ Bad - For loops (imperative)
const activeUsers = [];
for (let i = 0; i < users.length; i++) {
    if (users[i].active) {
        activeUsers.push(users[i]);
    }
}
```

### Immutability

```javascript
// ✅ Good - Don't mutate objects
function updateUser(user, updates) {
    return { ...user, ...updates };
}

// ❌ Bad - Mutating parameter
function updateUser(user, updates) {
    user.name = updates.name;
    user.email = updates.email;
    return user;  // Mutated original
}
```

### Object Manipulation

```javascript
// ✅ Good - Modern methods
const keys = Object.keys(obj);
const values = Object.values(obj);
const entries = Object.entries(obj);

Object.entries(user).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
});

// ❌ Bad - for...in loop
for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
        console.log(obj[key]);
    }
}
```

---

## Comments & Documentation

### JSDoc for Public APIs

```javascript
/**
 * Fetches user data from the database.
 *
 * @param {number} userId - The ID of the user to fetch
 * @param {Object} options - Optional parameters
 * @param {boolean} [options.includeDeleted=false] - Include deleted users
 * @returns {Promise<Object>} The user object
 * @throws {Error} If user not found
 *
 * @example
 * const user = await getUserData(123);
 * const userWithDeleted = await getUserData(123, { includeDeleted: true });
 */
async function getUserData(userId, options = {}) {
    // Implementation
}
```

### Explain "Why" Not "What"

```javascript
// ✅ Good - Explains why
// Cache results for 5 minutes to reduce database load during traffic spikes
cache.set(key, value, 300);

// ❌ Bad - Obvious comment
// Set cache value
cache.set(key, value, 300);
```

### No Obvious Comments

```javascript
// ❌ Bad - Obvious
i++;  // Increment i
const users = [];  // Create empty array

// ✅ Good - Only comment complex logic
// Use binary search since array is already sorted (O(log n) vs O(n))
const index = binarySearch(sortedArray, target);
```

---

## Common Anti-Patterns

### ❌ Callback Hell

```javascript
// ❌ Avoid
getData((err, data) => {
    processData(data, (err, result) => {
        saveResult(result, (err, saved) => {
            console.log(saved);
        });
    });
});

// ✅ Use async/await
const data = await getData();
const result = await processData(data);
const saved = await saveResult(result);
```

### ❌ var Declarations

```javascript
// ❌ Never use var
var count = 0;

// ✅ Use const or let
const count = 0;
let count = 0;
```

### ❌ == Instead of ===

```javascript
// ❌ Avoid type coercion
if (value == 0) { }   // true for '', 0, false, null

// ✅ Strict equality
if (value === 0) { }  // Only true for 0
```

### ❌ Mutating Function Parameters

```javascript
// ❌ Don't mutate parameters
function addItem(array, item) {
    array.push(item);  // Mutates original array!
    return array;
}

// ✅ Return new array
function addItem(array, item) {
    return [...array, item];
}
```

### ❌ Long Functions

```javascript
// ❌ Function too long (>50 lines)
function processOrder(order) {
    // 100 lines of code...
}

// ✅ Break into smaller functions
function processOrder(order) {
    validateOrder(order);
    const items = prepareItems(order.items);
    const total = calculateTotal(items);
    return createInvoice(order, items, total);
}
```

### ❌ Synchronous Operations in Production

```javascript
// ❌ Never in production
const config = JSON.parse(fs.readFileSync('config.json'));  // Blocks!

// ✅ Load async at startup
async function loadConfig() {
    const data = await fs.promises.readFile('config.json');
    return JSON.parse(data);
}
```

---

## Quick Reference

### Modern JavaScript Checklist

- ✅ `const` > `let`, never `var`
- ✅ Arrow functions for callbacks
- ✅ Template literals for strings
- ✅ Destructuring for objects/arrays
- ✅ Spread operator for copying
- ✅ Optional chaining `?.`
- ✅ Nullish coalescing `??`
- ✅ async/await over callbacks
- ✅ `===` instead of `==`

### Node.js Checklist

- ✅ `path.join()` for file paths
- ✅ `fs/promises` for file operations
- ✅ Environment variables with defaults
- ✅ Graceful degradation for optional features
- ✅ `NODE_ENV='production'` in production

### Express.js Checklist

- ✅ RESTful route conventions
- ✅ Async handlers with try/catch
- ✅ Error middleware with `next(err)`
- ✅ Input validation (Joi, express-validator)
- ✅ Correct HTTP status codes
- ✅ Separate app.js from server.js

---

*Readable code is maintainable code. Write for humans, not machines.*
