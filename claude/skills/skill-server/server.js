require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Load config
const config = require('./config.json');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 972;
const CLAUDE_DIR = path.join(require('os').homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const PRIVATE_DIR = path.join(CLAUDE_DIR, 'private');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');
const STANDARDS_DIR = path.join(CLAUDE_DIR, 'standards');
const OBSIDIAN_CLAUDE_DIR = path.join(require('os').homedir(), 'Library', 'Mobile Documents', 'iCloud~md~obsidian', 'Documents', 'MyNotes', 'claude');

// Initialize Supabase client (graceful degradation)
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

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Usage tracking helpers
async function readUsageStats() {
    if (!supabase) {
        return { skills: {}, commands: {} };
    }

    try {
        const { data, error } = await supabase
            .from('usage_tracking')
            .select('*');

        if (error) throw error;

        // Convert to old format for compatibility
        const stats = { skills: {}, commands: {} };
        data.forEach(row => {
            stats[row.type][row.item_id] = {
                count: row.count,
                lastUsed: row.last_used
            };
        });

        return stats;
    } catch (error) {
        console.error('Failed to read usage stats:', error.message);
        return { skills: {}, commands: {} };
    }
}

async function recordUsage(type, id) {
    if (!supabase) return; // Graceful degradation

    try {
        const { error } = await supabase.rpc('increment_usage', {
            p_type: type,
            p_item_id: id
        });

        if (error) {
            console.error('Tracking error:', error.message);
        }
    } catch (error) {
        // Fail silently - tracking is optional
        console.error('Tracking error:', error.message);
    }
}

// Skill registry
function discoverSkills() {
    const skills = [];
    const dirs = fs.readdirSync(SKILLS_DIR);

    for (const dir of dirs) {
        const skillPath = path.join(SKILLS_DIR, dir);
        const manifestPath = path.join(skillPath, 'SKILL.md');

        if (fs.statSync(skillPath).isDirectory() && fs.existsSync(manifestPath)) {
            const content = fs.readFileSync(manifestPath, 'utf-8');
            const lines = content.split('\n');

            // Parse title
            const titleLine = lines.find(l => l.startsWith('# '));
            const name = titleLine ? titleLine.replace('# ', '').trim() : dir;

            // Parse version
            const versionLine = lines.find(l => l.includes('Version:'));
            const version = versionLine ? versionLine.match(/[\d.]+/)?.[0] || '1.0.0' : '1.0.0';

            // Parse description (first paragraph after title)
            const descStart = lines.findIndex(l => l.startsWith('# ')) + 1;
            let description = '';
            for (let i = descStart; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && !line.startsWith('#') && !line.startsWith('*')) {
                    description = line;
                    break;
                }
            }

            // Detect type
            const files = fs.readdirSync(skillPath);
            const hasHtml = files.some(f => f.endsWith('.html'));
            const hasPy = files.some(f => f.endsWith('.py'));
            const type = hasHtml ? 'web' : (hasPy ? 'cli' : 'unknown');

            // Detect platform
            const platformLine = lines.find(l => l.toLowerCase().includes('platform:'));
            let platform = 'all'; // default
            if (platformLine) {
                const platformValue = platformLine.toLowerCase();
                if (platformValue.includes('windows') && platformValue.includes('mac')) {
                    platform = 'all';
                } else if (platformValue.includes('windows')) {
                    platform = 'win';
                } else if (platformValue.includes('mac')) {
                    platform = 'mac';
                }
            } else {
                // Auto-detect from content
                // Windows-specific: drive letters, .bat/.ps1 files
                const hasWindowsDrive = /[A-Z]:\\/.test(content);
                const hasBatFile = files.some(f => f.endsWith('.bat') || f.endsWith('.ps1'));
                // Mac-specific: /Users/ path (not ~/. which is cross-platform)
                const hasMacAbsPath = content.includes('/Users/');
                const hasShFile = files.some(f => f.endsWith('.sh'));

                if (hasWindowsDrive || hasBatFile) {
                    platform = 'win';
                } else if (hasMacAbsPath || hasShFile) {
                    platform = 'mac';
                }
                // ~/. paths are cross-platform, so 'all' remains default
            }

            // Detect category from prefix
            const prefix = dir.split('-')[0];
            const categoryMap = {
                'art': 'Art',
                'tutoring': 'Tutoring',
                'dev': 'Dev Tools',
                'ue': 'Unreal Engine',
                'meta': 'Meta',
                'learn': 'Learning',
                'drink': 'Personal',
                'review': 'Review',
                'cocv': 'CINEV',
                'git': 'Git',
                'writing': 'Writing',
                'consulting': 'Consulting'
            };
            const category = categoryMap[prefix] || 'Other';

            // Skip self
            if (dir === 'skill-server') continue;

            skills.push({
                id: dir,
                name,
                version,
                description,
                type,
                category,
                platform,
                path: skillPath,
                markdown: content
            });
        }
    }

    return skills;
}

// Group skills by category
function groupByCategory(skills) {
    const groups = {};
    const order = ['Meta', 'Review', 'Git', 'CINEV', 'Unreal Engine', 'Art', 'Tutoring', 'Consulting', 'Learning', 'Writing', 'Dev Tools', 'Personal', 'Other'];

    skills.forEach(skill => {
        if (!groups[skill.category]) {
            groups[skill.category] = [];
        }
        groups[skill.category].push(skill);
    });

    // Return ordered array of { category, skills }
    return order
        .filter(cat => groups[cat])
        .map(cat => ({ category: cat, skills: groups[cat] }));
}

// Discover command-only entries (commands without a matching skill)
function discoverCommandOnly(skillNames) {
    if (!fs.existsSync(COMMANDS_DIR)) return [];

    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
    const commands = [];

    for (const file of files) {
        const name = file.replace('.md', '');

        // Skip if a skill with the same name exists
        if (skillNames.has(name)) continue;

        const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
        const lines = content.split('\n');

        // Parse frontmatter
        let description = '';
        let inFrontmatter = false;

        for (const line of lines) {
            if (line.trim() === '---') {
                inFrontmatter = !inFrontmatter;
                continue;
            }
            if (inFrontmatter && line.startsWith('description:')) {
                description = line.replace('description:', '').trim();
            }
        }

        // Detect category from prefix
        const prefix = name.split('-')[0];
        const categoryMap = {
            'art': 'Art',
            'tutoring': 'Tutoring',
            'dev': 'Dev Tools',
            'ue': 'Unreal Engine',
            'meta': 'Meta',
            'learn': 'Learning',
            'drink': 'Personal',
            'review': 'Review',
            'cocv': 'CINEV',
            'git': 'Git',
            'writing': 'Writing',
            'consulting': 'Consulting'
        };
        const category = categoryMap[prefix] || 'Other';

        commands.push({
            id: name,
            name,
            description,
            type: 'command',
            category,
            path: path.join(COMMANDS_DIR, file)
        });
    }

    return commands;
}

// Routes
app.get('/', async (req, res) => {
    // Skill/command count
    const skills = discoverSkills();
    const skillNames = new Set(skills.map(s => s.id));
    const commandOnly = discoverCommandOnly(skillNames);
    const totalCount = skills.length + commandOnly.length;

    // Top used from Supabase
    const usageStats = await readUsageStats();
    const allUsage = { ...usageStats.skills, ...usageStats.commands };
    const topUsed = Object.entries(allUsage)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, data]) => ({ name, count: data.count }));

    // Recent learnings (from Obsidian vault)
    const learningsDir = path.join(OBSIDIAN_CLAUDE_DIR, 'learnings', 'projects');
    let recentLearnings = [];
    try {
        if (fs.existsSync(learningsDir)) {
            recentLearnings = fs.readdirSync(learningsDir)
                .filter(f => f.endsWith('.md'))
                .map(f => {
                    const stat = fs.statSync(path.join(learningsDir, f));
                    return { name: f, mtime: stat.mtime };
                })
                .sort((a, b) => b.mtime - a.mtime)
                .slice(0, 5);
        }
    } catch (e) { /* ignore */ }

    // Recent standards
    let recentStandards = [];
    try {
        if (fs.existsSync(STANDARDS_DIR)) {
            recentStandards = fs.readdirSync(STANDARDS_DIR)
                .filter(f => f.endsWith('.md'))
                .map(f => {
                    const stat = fs.statSync(path.join(STANDARDS_DIR, f));
                    return { name: f, mtime: stat.mtime };
                })
                .sort((a, b) => b.mtime - a.mtime)
                .slice(0, 5);
        }
    } catch (e) { /* ignore */ }

    // Recent wines (from Obsidian vault)
    const drinksFile = path.join(OBSIDIAN_CLAUDE_DIR, 'drinks', 'drinks.json');
    let recentWines = [];
    try {
        if (fs.existsSync(drinksFile)) {
            const drinksData = JSON.parse(fs.readFileSync(drinksFile, 'utf-8'));
            const drinks = drinksData.drinks || [];
            recentWines = drinks
                .filter(d => d.type && d.type.toLowerCase().includes('wine'))
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);
        }
    } catch (e) { /* ignore */ }

    res.render('home', { topUsed, recentLearnings, recentStandards, recentWines, totalCount, config, activePage: '/' });
});

app.get('/skills', async (req, res) => {
    const skills = discoverSkills();
    const skillNames = new Set(skills.map(s => s.id));
    const commandOnly = discoverCommandOnly(skillNames);
    const allItems = [...skills, ...commandOnly].sort((a, b) => a.name.localeCompare(b.name));
    const totalCount = allItems.length;

    const usageStats = await readUsageStats();
    res.render('dashboard', { allItems, totalCount, usageStats, config, activePage: '/skills' });
});

// Serve skill static files (CSS, JS, etc.)
app.get('/skills/:id/:file', (req, res, next) => {
    const filePath = path.resolve(SKILLS_DIR, req.params.id, req.params.file);

    if (!filePath.startsWith(SKILLS_DIR)) {
        return res.status(403).send('Access denied');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
    }
    next();
});

// Serve skill index page
app.get('/skills/:id', (req, res) => {
    const skills = discoverSkills();
    const skill = skills.find(s => s.id === req.params.id);

    if (!skill) {
        return res.status(404).send('Skill not found');
    }

    if (skill.type === 'web') {
        const indexPath = path.join(skill.path, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
        return res.status(404).send('index.html not found');
    }

    res.render('skill-cli', { skill, config, activePage: '/skills', subPage: skill.id });
});

// File browser API
app.get('/api/files', (req, res) => {
    const subpath = req.query.path || '';

    // Resolve base directory: learnings/ and drinks/ served from Obsidian vault
    let baseDir = PRIVATE_DIR;
    if (subpath.startsWith('learnings') || subpath.startsWith('drinks')) {
        baseDir = OBSIDIAN_CLAUDE_DIR;
    }
    const targetPath = path.resolve(baseDir, subpath);

    // Security check
    if (!targetPath.startsWith(baseDir)) {
        return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ error: 'Not found' });
    }

    const stat = fs.statSync(targetPath);

    if (stat.isDirectory()) {
        const entries = fs.readdirSync(targetPath).map(name => {
            const entryPath = path.join(targetPath, name);
            const entryStat = fs.statSync(entryPath);
            return {
                name,
                type: entryStat.isDirectory() ? 'directory' : 'file',
                size: entryStat.isFile() ? entryStat.size : null,
                modified: entryStat.mtime
            };
        });
        res.json({ path: subpath, entries });
    } else {
        // Serve file
        res.sendFile(targetPath);
    }
});

app.get('/files', (req, res) => {
    res.render('files', { basePath: PRIVATE_DIR, config, activePage: '/files' });
});

// Commands API
app.get('/api/commands', (req, res) => {
    if (!fs.existsSync(COMMANDS_DIR)) {
        return res.json({ commands: [] });
    }

    const files = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
    const commands = files.map(file => {
        const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf-8');
        const lines = content.split('\n');

        // Parse frontmatter
        let description = '';
        let allowedTools = '';
        let argumentHint = '';
        let inFrontmatter = false;

        for (const line of lines) {
            if (line.trim() === '---') {
                inFrontmatter = !inFrontmatter;
                continue;
            }
            if (inFrontmatter) {
                if (line.startsWith('description:')) {
                    description = line.replace('description:', '').trim();
                }
                if (line.startsWith('allowed-tools:')) {
                    allowedTools = line.replace('allowed-tools:', '').trim();
                }
                if (line.startsWith('argument-hint:')) {
                    argumentHint = line.replace('argument-hint:', '').trim().replace(/^["']|["']$/g, '');
                }
            }
        }

        // Detect platform
        const platformLine = lines.find(l => l.toLowerCase().includes('platform:'));
        let platform = 'all'; // default
        if (platformLine) {
            const platformValue = platformLine.toLowerCase();
            if (platformValue.includes('windows') && platformValue.includes('mac')) {
                platform = 'all';
            } else if (platformValue.includes('windows')) {
                platform = 'win';
            } else if (platformValue.includes('mac')) {
                platform = 'mac';
            }
        } else {
            // Auto-detect from content
            const hasWindowsDrive = /[A-Z]:\\/.test(content);
            const hasMacAbsPath = content.includes('/Users/');

            if (hasWindowsDrive) {
                platform = 'win';
            } else if (hasMacAbsPath) {
                platform = 'mac';
            }
        }

        return {
            name: file.replace('.md', ''),
            description,
            allowedTools,
            argumentHint,
            platform
        };
    });

    res.json({ commands });
});

// Skills API
app.get('/api/skills', (req, res) => {
    const skills = discoverSkills();
    res.json({ skills });
});

// Standards API
app.get('/api/standards', (req, res) => {
    if (!fs.existsSync(STANDARDS_DIR)) {
        return res.json({ standards: [] });
    }

    const files = fs.readdirSync(STANDARDS_DIR).filter(f => f.endsWith('.md'));
    const standards = files.map(file => {
        const content = fs.readFileSync(path.join(STANDARDS_DIR, file), 'utf-8');
        const lines = content.split('\n');

        // Parse title
        const titleLine = lines.find(l => l.startsWith('# '));
        const name = file.replace('.md', '');
        const title = titleLine ? titleLine.replace('# ', '').trim() : name;

        // Parse version
        const versionLine = lines.find(l => l.includes('Version'));
        const version = versionLine ? versionLine.match(/[\d.]+/)?.[0] || '0.1.0' : '0.1.0';

        return { name, title, version };
    });

    res.json({ standards });
});

app.get('/api/standards/:name', (req, res) => {
    const filePath = path.resolve(STANDARDS_DIR, `${req.params.name}.md`);

    if (!filePath.startsWith(STANDARDS_DIR)) {
        return res.status(403).send('Access denied');
    }

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Standard not found');
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.type('text/plain').send(content);
});

// Repos API
app.get('/api/repos', (req, res) => {
    const repoPathsFile = path.join(PRIVATE_DIR, 'repo-paths.json');
    try {
        if (fs.existsSync(repoPathsFile)) {
            const repoPaths = JSON.parse(fs.readFileSync(repoPathsFile, 'utf8'));
            const repos = Object.entries(repoPaths).map(([name, repoPath]) => ({
                name,
                path: repoPath,
                connected: fs.existsSync(repoPath)
            }));
            return res.json({ repos });
        }
    } catch (e) { /* ignore */ }
    res.json({ repos: [] });
});

app.post('/api/repos', (req, res) => {
    const { name, path: repoPath } = req.body;
    if (!name || !repoPath) {
        return res.status(400).json({ error: 'Missing name or path' });
    }

    const repoPathsFile = path.join(PRIVATE_DIR, 'repo-paths.json');
    let repoPaths = {};
    try {
        if (fs.existsSync(repoPathsFile)) {
            repoPaths = JSON.parse(fs.readFileSync(repoPathsFile, 'utf8'));
        }
    } catch (e) { /* ignore */ }

    repoPaths[name] = repoPath;
    fs.writeFileSync(repoPathsFile, JSON.stringify(repoPaths, null, 2) + '\n');
    res.json({ success: true, name, path: repoPath });
});

app.delete('/api/repos', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Missing name' });
    }

    const repoPathsFile = path.join(PRIVATE_DIR, 'repo-paths.json');
    try {
        if (fs.existsSync(repoPathsFile)) {
            const repoPaths = JSON.parse(fs.readFileSync(repoPathsFile, 'utf8'));
            delete repoPaths[name];
            fs.writeFileSync(repoPathsFile, JSON.stringify(repoPaths, null, 2) + '\n');
        }
    } catch (e) { /* ignore */ }
    res.json({ success: true });
});

// Config API (used by layout.js for shared nav/footer)
app.get('/api/config', (req, res) => {
    res.json(config);
});

// Usage tracking API
app.post('/api/usage/track', async (req, res) => {
    const { type, id } = req.body;

    if (!type || !id) {
        return res.status(400).json({ error: 'Missing type or id' });
    }

    if (type !== 'skills' && type !== 'commands') {
        return res.status(400).json({ error: 'Invalid type. Must be "skills" or "commands"' });
    }

    await recordUsage(type, id);
    res.json({ success: true });
});

app.get('/api/usage/stats', async (req, res) => {
    const stats = await readUsageStats();
    res.json(stats);
});

app.delete('/api/usage/track', async (req, res) => {
    const { type, id } = req.body;

    if (!type || !id) {
        return res.status(400).json({ error: 'Missing type or id' });
    }

    if (type !== 'skills' && type !== 'commands') {
        return res.status(400).json({ error: 'Invalid type. Must be "skills" or "commands"' });
    }

    if (!supabase) {
        return res.status(503).json({ error: 'Tracking service unavailable' });
    }

    try {
        const { error } = await supabase
            .from('usage_tracking')
            .delete()
            .eq('type', type)
            .eq('item_id', id);

        if (error) throw error;

        res.json({ success: true, message: `Deleted ${type}/${id}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save invoice PDF
app.post('/api/invoice/save', express.raw({ type: 'application/pdf', limit: '10mb' }), (req, res) => {
    const { studentName, year, month } = req.query;

    if (!studentName || !year || !month) {
        return res.status(400).json({ error: 'Missing studentName, year, or month' });
    }

    const invoicesDir = path.join(PRIVATE_DIR, 'tutoring', 'invoices');

    // Create directory if not exists
    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const filename = `${year}-${String(month).padStart(2, '0')}_${studentName}.pdf`;
    const filePath = path.join(invoicesDir, filename);

    try {
        fs.writeFileSync(filePath, req.body);
        res.json({
            success: true,
            path: filePath,
            filename
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// WebSocket for CLI skills
wss.on('connection', (ws) => {
    ws.on('error', (err) => console.error('WebSocket error:', err.message));

    ws.on('message', async (message) => {
        let data;
        try {
            data = JSON.parse(message);
        } catch {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            return;
        }

        if (data.action === 'collect-commits') {
            const { repoPath, options } = data;

            try {
                const simpleGit = require('simple-git');
                const git = simpleGit(repoPath);

                ws.send(JSON.stringify({ type: 'status', message: 'Fetching commits...' }));

                const logOptions = {
                    maxCount: options.limit || 100
                };

                if (options.since) {
                    logOptions['--since'] = options.since;
                }
                if (options.author) {
                    logOptions['--author'] = options.author;
                }

                const log = await git.log(logOptions);

                const commits = log.all.map(commit => ({
                    hash: commit.hash,
                    date: commit.date,
                    message: commit.message,
                    author: commit.author_name,
                    email: commit.author_email
                }));

                ws.send(JSON.stringify({
                    type: 'complete',
                    commits,
                    count: commits.length
                }));

            } catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: error.message
                }));
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Skill Server running at http://localhost:${PORT}`);
});
