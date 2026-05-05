import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

export interface DocEntry {
    slug: string;          // forward-slash relative path without .md
    name: string;          // basename without .md
    path: string;          // absolute path
    mtime: Date;
    size: number;
}

const WALK_TTL_MS = 60_000;
const walkCache = new Map<string, { at: number; entries: DocEntry[] }>();

/** Walk a directory recursively, returning every `.md` file. Cached 60s per root. */
export function walkMarkdown(rootDir: string): DocEntry[] {
    const cached = walkCache.get(rootDir);
    if (cached && Date.now() - cached.at < WALK_TTL_MS) return cached.entries;
    if (!existsSync(rootDir)) {
        walkCache.set(rootDir, { at: Date.now(), entries: [] });
        return [];
    }
    const out: DocEntry[] = [];
    function walk(dir: string) {
        for (const entry of readdirSync(dir)) {
            const abs = resolve(dir, entry);
            const st = statSync(abs);
            if (st.isDirectory()) {
                walk(abs);
            } else if (st.isFile() && entry.endsWith('.md')) {
                const rel = relative(rootDir, abs).replace(/\\/g, '/');
                out.push({
                    slug: rel.replace(/\.md$/, ''),
                    name: entry.replace(/\.md$/, ''),
                    path: abs,
                    mtime: st.mtime,
                    size: st.size,
                });
            }
        }
    }
    walk(rootDir);
    walkCache.set(rootDir, { at: Date.now(), entries: out });
    return out;
}

/**
 * Resolve a slug under rootDir and confirm the resolved path stays within
 * rootDir. Defends against `../../etc/passwd` style traversal
 * (review-code-astro.md ROUTE-A05).
 */
export function safeResolveUnder(rootDir: string, slug: string, suffix = ''): string | null {
    if (typeof slug !== 'string' || slug.length === 0) return null;
    if (slug.includes('\0')) return null;
    const rootAbs = resolve(rootDir);
    const candidate = resolve(rootAbs, `${slug}${suffix}`);
    const within = candidate === rootAbs || candidate.startsWith(rootAbs + sep);
    return within ? candidate : null;
}

export function readDoc(rootDir: string, slug: string): { content: string; mtime: Date } | null {
    const abs = safeResolveUnder(rootDir, slug, '.md');
    if (!abs || !existsSync(abs)) return null;
    const st = statSync(abs);
    if (!st.isFile()) return null;
    return { content: readFileSync(abs, 'utf-8'), mtime: st.mtime };
}
