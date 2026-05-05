import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { loadRepoPaths, getRepoPath } from './paths';

const execAsync = promisify(exec);

export interface CommitRow {
    repo: string;
    hash: string;       // short
    subject: string;
    author: string;
    at: number;         // unix seconds
    refs: string;       // decorate output, e.g. "HEAD -> main, origin/main"
}

interface CacheEntry { at: number; rows: CommitRow[] }
const TTL_MS = 60_000;
const cacheKey = '__gitFeedCache';

/**
 * Gather recent commits across all registered repos in parallel.
 * Each repo contributes up to `perRepo` commits across all local refs
 * (covers worktree branches without listing them separately).
 */
export async function loadRecentCommits(perRepo = 10): Promise<CommitRow[]> {
    const g = globalThis as unknown as { [k: string]: CacheEntry | undefined };
    const cached = g[cacheKey];
    if (cached && Date.now() - cached.at < TTL_MS) return cached.rows;

    const repos = loadRepoPaths();
    const fmt = '%h%x09%ct%x09%an%x09%D%x09%s';

    const tasks = Object.entries(repos).map(async ([name, entry]): Promise<CommitRow[]> => {
        const repoPath = getRepoPath(entry);
        if (!repoPath || !existsSync(repoPath)) return [];
        try {
            const { stdout } = await execAsync(
                `git log --all --remotes=NONE -${perRepo} --format='${fmt}'`,
                { cwd: repoPath, encoding: 'utf8', timeout: 3000, maxBuffer: 1024 * 1024 },
            );
            const rows: CommitRow[] = [];
            for (const line of stdout.split('\n')) {
                if (!line) continue;
                const [hash, ts, author, refs, ...rest] = line.split('\t');
                const at = Number(ts);
                if (!hash || !Number.isFinite(at)) continue;
                rows.push({
                    repo: name,
                    hash,
                    subject: rest.join('\t'),
                    author: author ?? '',
                    at,
                    refs: refs ?? '',
                });
            }
            return rows;
        } catch {
            return [];
        }
    });

    const all = (await Promise.all(tasks)).flat();
    all.sort((a, b) => b.at - a.at);
    g[cacheKey] = { at: Date.now(), rows: all };
    return all;
}

/** Format a unix-seconds timestamp as a short Korean-friendly relative time. */
export function timeAgo(at: number, now = Date.now() / 1000): string {
    const diff = Math.max(0, now - at);
    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;
    if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))}주 전`;
    if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))}달 전`;
    return `${Math.floor(diff / (86400 * 365))}년 전`;
}
