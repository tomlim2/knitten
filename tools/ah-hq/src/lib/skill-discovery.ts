import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { SKILLS_DIR } from './paths';

export interface Skill {
    id: string;
    name: string;
    description: string;
    category: string;
}

const CATEGORY_MAP: Record<string, string> = {
    cci: 'CINEV',
    ue: 'Unreal Engine',
    dev: 'Dev Tools',
    review: 'Review',
    git: 'Git',
    tutoring: 'Tutoring',
    writing: 'Writing',
    drink: 'Personal',
    design: 'Design',
    consulting: 'Consulting',
    learn: 'Learning',
    pmx: 'VRM/PMX',
    vrm: 'VRM/PMX',
    image: 'Image',
    video: 'Video',
    project: 'Project',
    system: 'System',
    ah: 'Agent Hub',
    obsidian: 'Obsidian',
    shotloom: 'Shotloom',
    canvas: 'Design',
    frontend: 'Design',
    brand: 'Design',
    algorithmic: 'Design',
};

const DISCOVER_TTL_MS = 60_000;
let discoverCache: { at: number; skills: Skill[] } | null = null;

export function discoverSkills(): Skill[] {
    if (discoverCache && Date.now() - discoverCache.at < DISCOVER_TTL_MS) {
        return discoverCache.skills;
    }
    if (!existsSync(SKILLS_DIR)) {
        discoverCache = { at: Date.now(), skills: [] };
        return [];
    }
    const dirs = readdirSync(SKILLS_DIR);
    const skills: Skill[] = [];
    for (const dir of dirs) {
        const skillPath = join(SKILLS_DIR, dir);
        const manifestPath = join(skillPath, 'SKILL.md');
        try {
            if (!statSync(skillPath).isDirectory()) continue;
            if (!existsSync(manifestPath)) continue;
            if (dir === 'ah-hq') continue;     // retired server skill
            const content = readFileSync(manifestPath, 'utf-8');
            const lines = content.split('\n');
            const titleLine = lines.find(l => l.startsWith('# '));
            const name = titleLine ? titleLine.replace('# ', '').trim() : dir;

            // Description = first prose line after title
            const titleIdx = lines.findIndex(l => l.startsWith('# '));
            let description = '';
            for (let i = titleIdx + 1; i < lines.length; i++) {
                const t = lines[i].trim();
                if (t && !t.startsWith('#') && !t.startsWith('*') && !t.startsWith('-')) {
                    description = t;
                    break;
                }
            }

            const prefix = dir.split('-')[0];
            const category = CATEGORY_MAP[prefix] ?? 'Other';
            skills.push({ id: dir, name, description, category });
        } catch {
            // ignore unreadable skill
        }
    }
    skills.sort((a, b) => a.id.localeCompare(b.id));
    discoverCache = { at: Date.now(), skills };
    return skills;
}

export function groupByCategory(skills: Skill[]): Array<{ category: string; skills: Skill[] }> {
    const order = [
        'Caol', 'Shotloom', 'CINEV', 'Unreal Engine', 'Review', 'Git',
        'Dev Tools', 'Design', 'Image', 'Video', 'VRM/PMX',
        'Obsidian', 'Learning', 'Tutoring', 'Consulting', 'Writing',
        'Project', 'System', 'Personal', 'Other',
    ];
    const groups = new Map<string, Skill[]>();
    for (const s of skills) {
        const arr = groups.get(s.category) ?? [];
        arr.push(s);
        groups.set(s.category, arr);
    }
    return order
        .filter(c => groups.has(c))
        .map(c => ({ category: c, skills: groups.get(c)! }));
}
