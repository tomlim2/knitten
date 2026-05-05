import { existsSync, readFileSync } from 'node:fs';

export interface Stage {
    stage: string;
    goal: string;
    status: string;
    done: boolean;
    hash: string | null;
}

export interface BuildStageReport {
    stages: Stage[];
    completed: number;
    total: number;
}

/**
 * Parse the `## Build Stages` markdown table out of a CONCEPT.md file.
 * Returns null if the file is missing or the section can't be located —
 * caller decides whether that's an error or just "no project".
 */
export function parseBuildStages(conceptPath: string): BuildStageReport | null {
    if (!existsSync(conceptPath)) return null;
    const text = readFileSync(conceptPath, 'utf-8');
    const m = text.match(/## Build Stages\s*\n([\s\S]*?)(?=\n## )/);
    if (!m) return null;

    const stages: Stage[] = m[1]
        .split('\n')
        .filter(l => l.startsWith('|') && !/^\|\s*-+/.test(l) && !/단계/.test(l))
        .map((l): Stage | null => {
            const cells = l.split('|').slice(1, -1).map(c => c.trim());
            if (cells.length < 4) return null;
            const stage = cells[0].replace(/\*\*/g, '');
            const status = cells[3];
            const hashMatch = status.match(/^`([0-9a-f]+)`$/);
            return {
                stage,
                goal: cells[1],
                status,
                done: !!hashMatch,
                hash: hashMatch ? hashMatch[1] : null,
            };
        })
        .filter((s): s is Stage => s !== null);

    return {
        stages,
        completed: stages.filter(s => s.done).length,
        total: stages.length,
    };
}
