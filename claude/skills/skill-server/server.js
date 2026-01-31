const express = require('express');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 972;
const CLAUDE_DIR = path.join(require('os').homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const PRIVATE_DIR = path.join(CLAUDE_DIR, 'private');

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.json());

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

            // Skip self
            if (dir === 'skill-server') continue;

            skills.push({
                id: dir,
                name,
                version,
                description,
                type,
                path: skillPath
            });
        }
    }

    return skills;
}

// Routes
app.get('/', (req, res) => {
    const skills = discoverSkills();
    res.render('dashboard', { skills });
});

app.get('/skills/:id', (req, res) => {
    const skills = discoverSkills();
    const skill = skills.find(s => s.id === req.params.id);

    if (!skill) {
        return res.status(404).send('Skill not found');
    }

    if (skill.type === 'web') {
        res.render('skill-web', { skill });
    } else {
        res.render('skill-cli', { skill });
    }
});

// Serve web skill static files
app.use('/skill-assets/:id', (req, res, next) => {
    const skillPath = path.join(SKILLS_DIR, req.params.id);
    express.static(skillPath)(req, res, next);
});

// File browser API
app.get('/api/files', (req, res) => {
    const subpath = req.query.path || '';
    const targetPath = path.join(PRIVATE_DIR, subpath);

    // Security check
    if (!targetPath.startsWith(PRIVATE_DIR)) {
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
    res.render('files', { basePath: PRIVATE_DIR });
});

// WebSocket for CLI skills
wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const data = JSON.parse(message);

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
