const express = require('express');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const http = require('http');

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
const OBSIDIAN_CLAUDE_DIR = (() => {
    const repoPathsFile = path.join(PRIVATE_DIR, 'repo-paths.json');
    try {
        const repos = JSON.parse(fs.readFileSync(repoPathsFile, 'utf-8'));
        const entry = repos.obsidian;
        const obsidianPath = typeof entry === 'string' ? entry : entry?.path;
        if (obsidianPath) return path.join(obsidianPath, 'claude');
    } catch {}
    // fallback: macOS iCloud path
    return path.join(require('os').homedir(), 'Library', 'Mobile Documents', 'iCloud~md~obsidian', 'Documents', 'MyNotes', 'claude');
})();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Repo path helpers (backward compatible with old string format)
function getRepoPath(entry) {
    return typeof entry === 'string' ? entry : entry.path;
}
function getRepoDescription(entry) {
    return typeof entry === 'string' ? '' : (entry.description || '');
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
                'cci': 'CINEV',
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
            'cci': 'CINEV',
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
app.get('/', (req, res) => {
    // Skill/command count
    const skills = discoverSkills();
    const skillNames = new Set(skills.map(s => s.id));
    const commandOnly = discoverCommandOnly(skillNames);
    const totalCount = skills.length + commandOnly.length;

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

    // Hardware info
    let hardware = null;
    try {
        const hwFile = path.join(PRIVATE_DIR, 'hardware.json');
        if (fs.existsSync(hwFile)) {
            hardware = JSON.parse(fs.readFileSync(hwFile, 'utf8'));
        }
    } catch (e) { /* ignore */ }

    // Refs: unified list of all referenced paths
    const repoPathsFile = path.join(PRIVATE_DIR, 'repo-paths.json');
    let registeredPaths = {};
    try {
        if (fs.existsSync(repoPathsFile)) {
            registeredPaths = JSON.parse(fs.readFileSync(repoPathsFile, 'utf8'));
        }
    } catch (e) { /* ignore */ }

    const refsMap = {}; // name -> { connected, path }

    function addRef(name, refPath) {
        const connected = fs.existsSync(refPath);
        if (!refsMap[name]) {
            refsMap[name] = { connected, path: refPath };
        } else {
            // Prefer connected path; among same status, keep first
            if (connected && !refsMap[name].connected) {
                refsMap[name] = { connected: true, path: refPath };
            }
        }
    }

    // Expected refs: always show, even if not yet registered
    const expectedRefs = ['anju', 'ta-portfolio', 'obsidian', 'caol-ila', 'cinev-studio', 'cinev-engine'];
    for (const name of expectedRefs) {
        refsMap[name] = { connected: false, path: '' };
    }

    // Add registered repos (overwrites expected refs with actual data)
    for (const [name, entry] of Object.entries(registeredPaths)) {
        addRef(name, getRepoPath(entry));
    }

    // Scan codebase for hardcoded path references
    const scanTargets = [
        path.join(STANDARDS_DIR, 'cinev-git-workflow.md'),
        path.join(SKILLS_DIR, 'cci-art-create-branch', 'config.json'),
        path.join(COMMANDS_DIR, 'cci-summarize-commit.md'),
        path.join(COMMANDS_DIR, 'cci-open-creator-launcher.md'),
        path.join(COMMANDS_DIR, 'cci-open-creator-shipper.md'),
        path.join(COMMANDS_DIR, 'cci-open-creator-character.md'),
        path.join(COMMANDS_DIR, 'meta-check-updates.md'),
    ];

    for (const file of scanTargets) {
        try {
            if (!fs.existsSync(file)) continue;
            const content = fs.readFileSync(file, 'utf8');
            const winMatches = content.match(/[A-Z]:\\[A-Za-z][^\s"`*)<,`]+/g) || [];
            const unixMatches = content.match(/\/Users\/younsoolim\/[^\s"`*)<,`]+/g) || [];

            for (let p of [...winMatches, ...unixMatches]) {
                p = p.replace(/[.,:;)]+$/, '');
                let repoRoot;
                if (/^[A-Z]:\\/.test(p)) {
                    const parts = p.replace(/\\/g, '/').split('/');
                    repoRoot = (parts[1] === 'vs' || parts[1] === 'Second')
                        ? parts.slice(0, 3).join('\\')
                        : parts.slice(0, 2).join('\\');
                    repoRoot = repoRoot.replace(/\//g, '\\');
                } else {
                    const parts = p.split('/');
                    if (parts[3] === 'Desktop' && parts[4] === 'www') {
                        repoRoot = parts.slice(0, 6).join('/');
                    } else if (parts[3] === 'Library') {
                        repoRoot = parts.slice(0, 9).join('/');
                    } else {
                        repoRoot = parts.slice(0, 5).join('/');
                    }
                }

                const segments = repoRoot.replace(/\\/g, '/').split('/').filter(Boolean);
                const rawName = segments[segments.length - 1].toLowerCase();
                const nameOverrides = {
                    'cinevstudio': 'cinev-studio',
                };
                const name = nameOverrides[rawName] || rawName;
                addRef(name, repoRoot);
            }
        } catch (e) { /* ignore */ }
    }

    const refs = Object.entries(refsMap).map(([name, data]) => ({
        name,
        connected: data.connected,
        path: data.path
    }));

    res.render('home', { recentLearnings, recentStandards, recentWines, refs, hardware, totalCount, config, activePage: '/' });
});

// Context view helpers
const { execSync } = require('child_process');

function getRecentCommits(repoPath, count = 5, subPath = null) {
    try {
        const pathArg = subPath ? ` -- "${subPath}"` : '';
        const out = execSync(
            `git -C "${repoPath}" log --oneline --format="%s||%ad" --date=format:"%m/%d" -${count}${pathArg}`,
            { encoding: 'utf-8', timeout: 5000 }
        ).trim();
        if (!out) return [];
        return out.split('\n').map(line => {
            const [msg, date] = line.split('||');
            return { msg, date };
        });
    } catch { return []; }
}

function getRecentLessons(obsidianDir, count = 3) {
    const lessonsDir = path.join(obsidianDir, 'tutoring', 'lessons');
    const results = [];
    try {
        const students = fs.readdirSync(lessonsDir).filter(d =>
            fs.statSync(path.join(lessonsDir, d)).isDirectory()
        );
        for (const student of students) {
            const files = fs.readdirSync(path.join(lessonsDir, student))
                .filter(f => f.endsWith('.md'))
                .sort().reverse();
            for (const f of files.slice(0, 2)) {
                const match = f.match(/^(\d{4}-\d{2}-\d{2})_(.+?)(_done)?\.md$/);
                if (match) {
                    results.push({
                        student,
                        topic: match[2].replace(/_/g, ' '),
                        date: match[1].slice(5).replace('-', '/')
                    });
                }
            }
        }
    } catch {}
    // Consultations
    const consultationsDir = path.join(obsidianDir, 'tutoring', 'consultations');
    try {
        if (fs.existsSync(consultationsDir)) {
            const files = fs.readdirSync(consultationsDir).filter(f => f.endsWith('.md'));
            for (const file of files) {
                const content = fs.readFileSync(path.join(consultationsDir, file), 'utf-8');
                const student = file.replace('.md', '');
                const sessions = [...content.matchAll(/^###\s+(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)/gm)];
                for (const s of sessions.slice(-2)) {
                    results.push({
                        student,
                        topic: '(면담) ' + s[2].trim(),
                        date: s[1].slice(5).replace('-', '/')
                    });
                }
            }
        }
    } catch {}
    return results.sort((a, b) => b.date > a.date ? 1 : -1).slice(0, count);
}

function getRecentConsulting(obsidianDir, count = 3) {
    const consultDir = path.join(obsidianDir, 'consulting');
    const results = [];
    try {
        const files = fs.readdirSync(consultDir).filter(f => f.endsWith('.md'));
        for (const file of files) {
            const content = fs.readFileSync(path.join(consultDir, file), 'utf-8');
            const companyMatch = content.match(/^#\s+(.+)/m);
            const company = companyMatch ? companyMatch[1].replace(/ - Consulting History/, '') : file.replace('.md', '');
            const sessions = [...content.matchAll(/^###\s+(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)/gm)];
            for (const s of sessions.slice(-2)) {
                results.push({
                    company,
                    topic: s[2].trim(),
                    date: s[1].slice(5).replace('-', '/')
                });
            }
        }
    } catch {}
    return results.sort((a, b) => b.date > a.date ? 1 : -1).slice(0, count);
}

function daysAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    return Math.floor((now - d) / 86400000);
}

app.get('/contexts', (req, res) => {
    const repoPathsFile = path.join(PRIVATE_DIR, 'repo-paths.json');
    let repos = {};
    try { repos = JSON.parse(fs.readFileSync(repoPathsFile, 'utf-8')); } catch {}

    // CINEV
    const cinevPath = getRepoPath(repos['cinev-studio'] || repos['cinev-studio-git']);
    const cinevCommits = cinevPath ? getRecentCommits(cinevPath) : [];
    let artState = null;
    try {
        const ab = JSON.parse(fs.readFileSync(path.join(PRIVATE_DIR, 'art-branches.json'), 'utf-8'));
        const current = ab.history.find(h => h.branch === ab.current);
        if (current) {
            artState = `art: ${ab.current}  state: ${current.state}  since: ${current.created_at}`;
        }
    } catch {}
    const cinevLastDate = cinevCommits[0]?.date;
    const cinevActive = cinevLastDate && daysAgo(new Date().getFullYear() + '-' + cinevLastDate.replace('/', '-')) <= 3;

    // Personal
    let personalProjects = [];
    try {
        const ctxData = JSON.parse(fs.readFileSync(path.join(OBSIDIAN_CLAUDE_DIR, 'contexts.json'), 'utf-8'));
        personalProjects = (ctxData.personal?.projects || []).map(p => {
            const proj = { ...p, commits: [] };
            if (p.repo && repos[p.repo]) {
                const repoPath = getRepoPath(repos[p.repo]);
                if (p.path) {
                    proj.commits = getRecentCommits(repoPath, 3, p.path);
                } else {
                    proj.commits = getRecentCommits(repoPath, 3);
                }
            }
            return proj;
        });
    } catch {}
    const personalActive = personalProjects.some(p => p.status === 'active');

    // Side work
    const tutoring = getRecentLessons(OBSIDIAN_CLAUDE_DIR);
    const consulting = getRecentConsulting(OBSIDIAN_CLAUDE_DIR);
    const sideLastDate = tutoring[0]?.date || consulting[0]?.date;
    const sideActive = sideLastDate && daysAgo(new Date().getFullYear() + '-' + sideLastDate.replace('/', '-')) <= 7;

    // Hobby — recent drinks
    let recentDrinks = [];
    try {
        const drinksData = JSON.parse(fs.readFileSync(path.join(OBSIDIAN_CLAUDE_DIR, 'drinks', 'drinks.json'), 'utf-8'));
        recentDrinks = (drinksData.drinks || [])
            .filter(d => d.date)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5)
            .map(d => ({ name: d.name, type: d.type, venue: d.venue || '', date: d.date }));
    } catch {}

    res.render('contexts', {
        config,
        activePage: '/contexts',
        contexts: {
            cinev: {
                commits: cinevCommits,
                artState,
                badge: cinevActive ? 'ctx-badge-active' : 'ctx-badge-idle',
                badgeLabel: cinevActive ? 'Active' : 'Idle'
            },
            personal: {
                projects: personalProjects,
                badge: personalActive ? 'ctx-badge-active' : 'ctx-badge-idle',
                badgeLabel: personalActive ? 'Active' : 'Idle'
            },
            side: {
                tutoring,
                consulting,
                badge: sideActive ? 'ctx-badge-active' : 'ctx-badge-idle',
                badgeLabel: sideActive ? 'Active' : 'Idle'
            },
            hobby: {
                drinks: recentDrinks,
                badge: recentDrinks.length > 0 ? 'ctx-badge-active' : 'ctx-badge-idle',
                badgeLabel: recentDrinks.length > 0 ? `${recentDrinks.length} recent` : 'Empty'
            }
        }
    });
});

app.get('/skills', (req, res) => {
    const skills = discoverSkills();
    const skillNames = new Set(skills.map(s => s.id));
    const commandOnly = discoverCommandOnly(skillNames);
    const allItems = [...skills, ...commandOnly].sort((a, b) => a.name.localeCompare(b.name));
    const totalCount = allItems.length;

    res.render('dashboard', { allItems, totalCount, config, activePage: '/skills' });
});

// Gallery
const GALLERY_FILE = path.join(PRIVATE_DIR, 'gallery-prompts.json');

// Civitai fetch
const GALLERY_FETCH_INTERVAL = 24 * 60 * 60 * 1000; // 24h
let lastGalleryFetch = 0;

function aspectFromDimensions(w, h) {
    if (!w || !h) return '1:1';
    const r = w / h;
    if (Math.abs(r - 1) < 0.1) return '1:1';
    if (Math.abs(r - 16/9) < 0.15) return '16:9';
    if (Math.abs(r - 9/16) < 0.15) return '9:16';
    if (Math.abs(r - 4/3) < 0.15) return '4:3';
    if (Math.abs(r - 3/4) < 0.15) return '3:4';
    if (r > 1) return '16:9';
    return '9:16';
}

function categorizeCivitaiPrompt(prompt) {
    const p = prompt.toLowerCase();
    if (/\b(texture|seamless|tileable|pattern|material)\b/.test(p)) return 'Texture';
    if (/\b(icon|ui|button|interface|emoji|logo)\b/.test(p)) return 'UI/Icon';
    if (/\b(landscape|scenery|city|mountain|ocean|sunset|forest|building|architecture|street)\b/.test(p)) return 'Landscape';
    return 'Character';
}

async function fetchCivitaiPrompts() {
    const https = require('https');

    function fetchJSON(url) {
        return new Promise((resolve, reject) => {
            https.get(url, { headers: { 'User-Agent': 'SkillServer/1.0' } }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try { resolve(JSON.parse(body)); }
                    catch (e) { reject(e); }
                });
            }).on('error', reject);
        });
    }

    try {
        // Random period for variety, always sorted by most reactions
        const periods = ['Day', 'Week', 'Month'];
        const period = periods[Math.floor(Math.random() * periods.length)];

        const data = await fetchJSON(`https://civitai.com/api/v1/images?limit=50&sort=Most+Reactions&period=${period}&nsfw=None`);
        const items = data.items || [];
        const prompts = [];

        for (const img of items) {
            const meta = img.meta || {};
            const prompt = meta.prompt;
            if (!prompt || prompt.length < 20) continue;

            const cleanPrompt = prompt.length > 500 ? prompt.slice(0, 500) + '...' : prompt;
            const aspect = aspectFromDimensions(img.width, img.height);
            const category = categorizeCivitaiPrompt(prompt);
            const url = `https://civitai.com/images/${img.id}`;

            const titleRaw = cleanPrompt.split(/[,.\n]/)[0].trim();
            const title = titleRaw.length > 40 ? titleRaw.slice(0, 37) + '...' : titleRaw;

            const tags = ['civitai'];
            if (meta.Model) tags.push(meta.Model.toLowerCase().replace(/\s+/g, '-'));

            prompts.push({ title, prompt: cleanPrompt, aspect, category, url, tags });
        }

        if (prompts.length === 0) return { fetched: 0 };

        // Clear non-favorites, keep only favorites
        const gallery = readGallery();
        for (const cat of gallery.categories) {
            cat.prompts = cat.prompts.filter(p => p.favorite);
        }

        // Add fresh prompts
        let added = 0;
        for (const p of prompts) {
            let cat = gallery.categories.find(c => c.name === p.category);
            if (!cat) {
                cat = { name: p.category, prompts: [] };
                gallery.categories.push(cat);
            }
            cat.prompts.push({
                title: p.title,
                prompt: p.prompt,
                aspect: p.aspect,
                tags: p.tags,
                url: p.url
            });
            added++;
        }

        gallery.categories = gallery.categories.filter(c => c.prompts.length > 0);
        gallery.lastFetch = new Date().toISOString();
        saveGallery(gallery);
        lastGalleryFetch = Date.now();

        return { fetched: prompts.length, added, total: gallery.categories.reduce((s, c) => s + c.prompts.length, 0) };
    } catch (e) {
        console.error('Civitai fetch error:', e.message);
        return { error: e.message };
    }
}

// Auto-fetch on server start if gallery is empty (no non-favorites)
setTimeout(() => {
    const gallery = readGallery();
    const hasContent = gallery.categories.some(c => c.prompts.some(p => !p.favorite));
    if (!hasContent) {
        fetchCivitaiPrompts().then(r => console.log('Gallery initial fetch:', r));
    }
}, 5000);

function readGallery() {
    try {
        if (fs.existsSync(GALLERY_FILE)) {
            return JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf-8'));
        }
    } catch {}
    return { categories: [] };
}

function saveGallery(data) {
    fs.writeFileSync(GALLERY_FILE, JSON.stringify(data, null, 2) + '\n');
}

app.get('/gallery', (req, res) => {
    res.render('gallery', { config, activePage: '/gallery' });
});

app.get('/api/gallery', (req, res) => {
    res.json(readGallery());
});

app.post('/api/gallery/fetch', async (req, res) => {
    const result = await fetchCivitaiPrompts();
    res.json(result);
});

app.post('/api/gallery', (req, res) => {
    const { title, prompt, category, aspect, tags, url, editCategory, editIndex } = req.body;
    if (!title || !prompt || !category) {
        return res.status(400).json({ error: 'Missing title, prompt, or category' });
    }

    const data = readGallery();
    const entry = { title, prompt, aspect: aspect || '1:1', tags: tags || [] };
    if (url) entry.url = url;

    // Edit existing
    if (editCategory !== undefined && editIndex !== undefined) {
        const oldCat = data.categories.find(c => c.name === editCategory);
        if (oldCat && oldCat.prompts[editIndex] !== undefined) {
            // If category changed, remove from old and add to new
            if (editCategory !== category) {
                oldCat.prompts.splice(editIndex, 1);
                let newCat = data.categories.find(c => c.name === category);
                if (!newCat) {
                    newCat = { name: category, prompts: [] };
                    data.categories.push(newCat);
                }
                newCat.prompts.push(entry);
            } else {
                oldCat.prompts[editIndex] = entry;
            }
        }
    } else {
        // Add new
        let cat = data.categories.find(c => c.name === category);
        if (!cat) {
            cat = { name: category, prompts: [] };
            data.categories.push(cat);
        }
        cat.prompts.push(entry);
    }

    // Remove empty categories
    data.categories = data.categories.filter(c => c.prompts.length > 0);
    saveGallery(data);
    res.json({ success: true });
});

app.post('/api/gallery/favorite', (req, res) => {
    const { category, index } = req.body;
    const data = readGallery();
    const cat = data.categories.find(c => c.name === category);
    if (cat && cat.prompts[index] !== undefined) {
        cat.prompts[index].favorite = !cat.prompts[index].favorite;
        if (!cat.prompts[index].favorite) delete cat.prompts[index].favorite;
        saveGallery(data);
    }
    res.json({ success: true });
});

app.delete('/api/gallery/:category/:index', (req, res) => {
    const catName = decodeURIComponent(req.params.category);
    const idx = parseInt(req.params.index);
    const data = readGallery();
    const cat = data.categories.find(c => c.name === catName);
    if (cat && cat.prompts[idx] !== undefined) {
        cat.prompts.splice(idx, 1);
    }
    data.categories = data.categories.filter(c => c.prompts.length > 0);
    saveGallery(data);
    res.json({ success: true });
});

app.get('/components', (req, res) => {
    res.render('components', { config, activePage: '/components' });
});

// Unified markdown reader routes
app.get('/standards', (req, res) => {
    res.render('markdown-reader', { mode: 'standards', config, activePage: '/standards' });
});
app.get('/learnings', (req, res) => {
    res.render('markdown-reader', { mode: 'learnings', config, activePage: '/learnings' });
});

// 301 redirects from old skill pages
app.get('/skills/meta-browse-standards', (req, res) => res.redirect(301, '/standards'));
app.get('/skills/learn-browse-entries', (req, res) => res.redirect(301, '/learnings'));

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

    const cliSkills = skills.filter(s => s.type === 'cli').sort((a, b) => a.id.localeCompare(b.id));
    res.render('markdown-reader', { mode: 'skill', skill, cliSkills, config, activePage: '/skills' });
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

// Learnings API — project-based tree
app.get('/api/learnings', (req, res) => {
    const projectsDir = path.join(OBSIDIAN_CLAUDE_DIR, 'projects');
    if (!fs.existsSync(projectsDir)) {
        return res.json({ projects: [] });
    }

    const projects = [];

    // _template.md at root
    const templatePath = path.join(projectsDir, '_template.md');
    if (fs.existsSync(templatePath)) {
        projects.push({ name: '_template', files: [{ name: '_template.md', path: '_template.md' }] });
    }

    // Scan directories
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    entries.filter(e => e.isDirectory()).sort((a, b) => {
        // _ prefixed dirs last
        const aPrefix = a.name.startsWith('_') ? 1 : 0;
        const bPrefix = b.name.startsWith('_') ? 1 : 0;
        if (aPrefix !== bPrefix) return aPrefix - bPrefix;
        return a.name.localeCompare(b.name);
    }).forEach(dir => {
        const dirPath = path.join(projectsDir, dir.name);
        const files = [];

        function scanDir(currentPath, prefix) {
            const items = fs.readdirSync(currentPath, { withFileTypes: true });
            items.forEach(item => {
                if (item.isFile() && item.name.endsWith('.md')) {
                    files.push({
                        name: prefix ? prefix + '/' + item.name : item.name,
                        path: dir.name + '/' + (prefix ? prefix + '/' : '') + item.name
                    });
                } else if (item.isDirectory()) {
                    scanDir(path.join(currentPath, item.name), prefix ? prefix + '/' + item.name : item.name);
                }
            });
        }

        scanDir(dirPath, '');
        if (files.length > 0) {
            projects.push({ name: dir.name, files });
        }
    });

    res.json({ projects });
});

app.get('/api/learnings/:filePath(*)', (req, res) => {
    const projectsDir = path.join(OBSIDIAN_CLAUDE_DIR, 'projects');
    const filePath = path.resolve(projectsDir, req.params.filePath);

    if (!filePath.startsWith(projectsDir)) {
        return res.status(403).send('Access denied');
    }
    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
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
            const repos = Object.entries(repoPaths).map(([name, entry]) => ({
                name,
                path: getRepoPath(entry),
                description: getRepoDescription(entry),
                connected: fs.existsSync(getRepoPath(entry))
            }));
            return res.json({ repos });
        }
    } catch (e) { /* ignore */ }
    res.json({ repos: [] });
});

app.post('/api/repos', (req, res) => {
    const { name, path: repoPath, description } = req.body;
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

    repoPaths[name] = { path: repoPath, description: description || '' };
    fs.writeFileSync(repoPathsFile, JSON.stringify(repoPaths, null, 2) + '\n');
    res.json({ success: true, name, path: repoPath, description: description || '' });
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

// Gemini API key from env
app.get('/api/gemini-key', (req, res) => {
    const key = process.env.GEMINI_API_KEY || '';
    res.json({ key: key ? key : null });
});

// Gemini usage tracking
const GEMINI_USAGE_FILE = path.join(PRIVATE_DIR, 'gemini-usage.json');

function getGeminiUsage() {
    try {
        if (fs.existsSync(GEMINI_USAGE_FILE)) {
            return JSON.parse(fs.readFileSync(GEMINI_USAGE_FILE, 'utf-8'));
        }
    } catch {}
    return { totalRequests: 0, totalInputTokens: 0, totalOutputTokens: 0, totalImages: 0, history: [] };
}

function saveGeminiUsage(data) {
    fs.writeFileSync(GEMINI_USAGE_FILE, JSON.stringify(data, null, 2) + '\n');
}

app.get('/api/gemini-usage', (req, res) => {
    res.json(getGeminiUsage());
});

app.post('/api/gemini-usage', (req, res) => {
    const { inputTokens, outputTokens, model, type } = req.body;
    const usage = getGeminiUsage();
    usage.totalRequests += 1;
    usage.totalInputTokens += (inputTokens || 0);
    usage.totalOutputTokens += (outputTokens || 0);
    usage.totalImages += 1;
    usage.history.push({
        ts: new Date().toISOString(),
        model: model || 'unknown',
        type: type || 'unknown',
        inputTokens: inputTokens || 0,
        outputTokens: outputTokens || 0
    });
    // Keep last 500 entries
    if (usage.history.length > 500) usage.history = usage.history.slice(-500);
    saveGeminiUsage(usage);
    res.json(usage);
});

// Config API (used by layout.js for shared nav/footer)
app.get('/api/config', (req, res) => {
    res.json(config);
});

// Get invoice presets (bank info, students)
app.get('/api/invoice/presets', (req, res) => {
    const presetsPath = path.join(OBSIDIAN_CLAUDE_DIR, 'tutoring', 'presets.json');
    try {
        const data = JSON.parse(fs.readFileSync(presetsPath, 'utf-8'));
        res.json(data);
    } catch (e) {
        res.status(404).json({ error: 'presets.json not found' });
    }
});

// Save invoice PDF
app.post('/api/invoice/save', express.raw({ type: 'application/pdf', limit: '10mb' }), (req, res) => {
    const { studentName, year, month } = req.query;

    if (!studentName || !year || !month) {
        return res.status(400).json({ error: 'Missing studentName, year, or month' });
    }

    const invoicesDir = path.join(OBSIDIAN_CLAUDE_DIR, 'tutoring', 'invoices');

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
