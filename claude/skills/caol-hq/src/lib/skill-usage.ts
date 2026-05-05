import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { loadRepoPaths, getRepoPath } from './paths';

export type SkillUsageRow = {
    ts: string;
    utc_offset_min: number;
    sid: string;
    skill: string;
    machine: string;
};

const HOME = homedir();

function expandHome(p: string): string {
    return p.startsWith('~') ? join(HOME, p.slice(1)) : p;
}

export function skillUsageRoot(): string | null {
    const repos = loadRepoPaths();
    const caol = getRepoPath(repos['caol-ila']);
    if (!caol) return null;
    return join(expandHome(caol), 'claude', 'private', 'skill-usage');
}

function listMachineDirs(root: string): string[] {
    if (!existsSync(root)) return [];
    return readdirSync(root, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
}

function listJsonlFiles(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => join(dir, f));
}

export function loadAllRows(opts: { sinceDays?: number } = {}): SkillUsageRow[] {
    const root = skillUsageRoot();
    if (!root) return [];
    const cutoff = opts.sinceDays
        ? Date.now() - opts.sinceDays * 86400 * 1000
        : 0;
    const rows: SkillUsageRow[] = [];
    for (const machine of listMachineDirs(root)) {
        const machineDir = join(root, machine);
        for (const file of listJsonlFiles(machineDir)) {
            // Skip files older than cutoff by mtime as a coarse filter.
            if (cutoff && statSync(file).mtimeMs < cutoff - 86400 * 1000) continue;
            const text = readFileSync(file, 'utf-8');
            for (const line of text.split('\n')) {
                if (!line.trim()) continue;
                try {
                    const r = JSON.parse(line) as Omit<SkillUsageRow, 'machine'>;
                    if (cutoff && new Date(r.ts).getTime() < cutoff) continue;
                    rows.push({ ...r, machine });
                } catch {
                    // Skip malformed line.
                }
            }
        }
    }
    return rows;
}

export type SkillCount = { skill: string; count: number };

export function topSkills(rows: SkillUsageRow[], n: number): SkillCount[] {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.skill, (counts.get(r.skill) ?? 0) + 1);
    return Array.from(counts.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, n);
}

export function machineBreakdown(rows: SkillUsageRow[]): Array<{ machine: string; count: number }> {
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.machine, (counts.get(r.machine) ?? 0) + 1);
    return Array.from(counts.entries())
        .map(([machine, count]) => ({ machine, count }))
        .sort((a, b) => b.count - a.count);
}

export function machineDisplayName(machineId: string): string {
    // Try resolving from local hardware.json (only the local machine matches).
    const hwFile = join(HOME, '.claude', 'private', 'caol-config', 'hardware.json');
    if (existsSync(hwFile)) {
        try {
            const hw = JSON.parse(readFileSync(hwFile, 'utf-8'));
            if (hw.machine_id === machineId && hw.name) return hw.name;
        } catch {
            // fall through
        }
    }
    return machineId.slice(0, 8);
}
