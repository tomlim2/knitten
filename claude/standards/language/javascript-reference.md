---
status: proposed
---
# JavaScript Standards — Reference

Detailed examples and patterns. See [javascript.md](javascript.md) for core rules.

---

## Node.js Specific

### Module System (CommonJS)

```javascript
// Good - CommonJS (Node.js default)
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
// Good - Use path.join()
const filePath = path.join(__dirname, 'data', 'users.json');
const publicDir = path.join(__dirname, 'public');

// Bad - String concatenation (breaks on Windows)
const filePath = __dirname + '/data/users.json';
const publicDir = __dirname + '/public';
```

### File System (Promises API)

```javascript
// Good - fs/promises (async/await)
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

// Bad - Synchronous (blocks event loop)
const fs = require('fs');
const data = fs.readFileSync('config.json', 'utf-8');  // Blocks!
```

### Environment Variables

```javascript
// Good - Use process.env with defaults
const PORT = process.env.PORT ?? 3000;
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// Good - Validate required variables
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

// Good - Type conversion
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES ?? '3', 10);
const ENABLE_CACHE = process.env.ENABLE_CACHE === 'true';
```

### NODE_ENV for Performance

```javascript
// Good - Check NODE_ENV
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
// Good - RESTful conventions
app.get('/api/users', getUsers);           // List
app.get('/api/users/:id', getUser);        // Read
app.post('/api/users', createUser);        // Create
app.put('/api/users/:id', updateUser);     // Update (full)
app.patch('/api/users/:id', patchUser);    // Update (partial)
app.delete('/api/users/:id', deleteUser);  // Delete

// Bad - Non-standard routes
app.get('/api/getUsers', getUsers);
app.post('/api/deleteUser', deleteUser);   // Should be DELETE
```

### Async Route Handlers

```javascript
// Good - Async handler with error propagation
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
// Good - Reusable middleware
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
// Good - Use correct status codes
res.status(200).json(data);         // OK
res.status(201).json(created);      // Created
res.status(204).send();             // No Content
res.status(400).json({ error });    // Bad Request
res.status(401).json({ error });    // Unauthorized
res.status(404).json({ error });    // Not Found
res.status(500).json({ error });    // Internal Server Error

// Bad - Always 200
res.json({ error: 'Not found' });   // Should be 404
```

### Express Error Middleware

```javascript
// Good - Centralized error handling
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

### Separate App Definition from Server

```javascript
// Good - app.js (testable)
const express = require('express');
const app = express();

app.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = app;

// Good - server.js (not tested)
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

## ESLint Configuration

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

---

## Security

### Input Validation

```javascript
// Good - Validate all inputs
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
// Good - Limit payload size
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### Don't Expose Error Details

```javascript
// Good - Generic error message for clients
app.use((err, req, res, next) => {
    console.error('Error:', err);  // Log full error server-side

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message  // Show details only in dev
    });
});

// Bad - Exposing stack traces
app.use((err, req, res, next) => {
    res.status(500).json({
        error: err.message,
        stack: err.stack  // Never expose stack traces!
    });
});
```

### Security Headers (Helmet)

```javascript
// Good - Use Helmet for security headers
const helmet = require('helmet');
app.use(helmet());
```

---

## Performance

### Clustering (Multi-Core)

```javascript
// Good - Utilize all CPU cores
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
// Good - Cache expensive operations
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
// Bad - Blocking operation
const data = fs.readFileSync('large-file.json');  // Blocks!

// Good - Non-blocking
const data = await fs.promises.readFile('large-file.json');

// Bad - CPU-intensive task blocks
function fibonacci(n) {
    return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);  // Blocks for large n
}

// Good - Offload to worker thread
const { Worker } = require('worker_threads');
const worker = new Worker('./fibonacci-worker.js');
```

### Compression Middleware

```javascript
// Good - Enable compression
const compression = require('compression');
app.use(compression());
```

---

## Array/Object Patterns

### Prefer Array Methods Over Loops

```javascript
// Good - Array methods (functional)
const activeUsers = users.filter(u => u.active);
const userNames = users.map(u => u.name);
const total = prices.reduce((sum, price) => sum + price, 0);

// Bad - For loops (imperative)
const activeUsers = [];
for (let i = 0; i < users.length; i++) {
    if (users[i].active) {
        activeUsers.push(users[i]);
    }
}
```

### Object Manipulation

```javascript
// Good - Modern methods
const keys = Object.keys(obj);
const values = Object.values(obj);
const entries = Object.entries(obj);

Object.entries(user).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
});

// Bad - for...in loop
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
// Good - Explains why
// Cache results for 5 minutes to reduce database load during traffic spikes
cache.set(key, value, 300);

// Bad - Obvious comment
// Set cache value
cache.set(key, value, 300);
```

### No Obvious Comments

```javascript
// Bad - Obvious
i++;  // Increment i
const users = [];  // Create empty array

// Good - Only comment complex logic
// Use binary search since array is already sorted (O(log n) vs O(n))
const index = binarySearch(sortedArray, target);
```

---

## Common Anti-Patterns

### Callback Hell

```javascript
// Bad
getData((err, data) => {
    processData(data, (err, result) => {
        saveResult(result, (err, saved) => {
            console.log(saved);
        });
    });
});

// Good - Use async/await
const data = await getData();
const result = await processData(data);
const saved = await saveResult(result);
```

### var Declarations

```javascript
// Bad - Never use var
var count = 0;

// Good - Use const or let
const count = 0;
let count = 0;
```

### Mutating Function Parameters

```javascript
// Bad - Don't mutate parameters
function addItem(array, item) {
    array.push(item);  // Mutates original array!
    return array;
}

// Good - Return new array
function addItem(array, item) {
    return [...array, item];
}
```

### Long Functions

```javascript
// Bad - Function too long (>50 lines)
function processOrder(order) {
    // 100 lines of code...
}

// Good - Break into smaller functions
function processOrder(order) {
    validateOrder(order);
    const items = prepareItems(order.items);
    const total = calculateTotal(items);
    return createInvoice(order, items, total);
}
```

### Synchronous Operations in Production

```javascript
// Bad - Never in production
const config = JSON.parse(fs.readFileSync('config.json'));  // Blocks!

// Good - Load async at startup
async function loadConfig() {
    const data = await fs.promises.readFile('config.json');
    return JSON.parse(data);
}
```

---

*Readable code is maintainable code. Write for humans, not machines.*
