import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

export interface DocEntry {
    slug: string;          // forward-slash relative path without .md
    name: string;          // basename without .md
    path: string;          // absolute path
    mtime: Date;
    size: number;
}

/** Walk a directory recursively, returning every `.md` file. */
export function walkMarkdown(rootDir: string): DocEntry[] {
    if (!existsSync(rootDir)) return [];
    const out: DocEntry[] = [];
    function walk(dir: string) {
        for (const entry of readdirSync(dir)) {
            const abs = join(dir, entry);
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
    return out;
}

export function readDoc(rootDir: string, slug: string): { content: string; mtime: Date } | null {
    const abs = join(rootDir, `${slug}.md`);
    if (!existsSync(abs)) return null;
    const st = statSync(abs);
    if (!st.isFile()) return null;
    return { content: readFileSync(abs, 'utf-8'), mtime: st.mtime };
}
