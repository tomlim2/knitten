import { marked } from 'marked';

marked.setOptions({
    gfm: true,
    breaks: false,
});

/** Strip leading YAML frontmatter (---...---) before rendering. */
export function renderMarkdown(src: string): string {
    let body = src;
    if (src.startsWith('---\n')) {
        const end = src.indexOf('\n---\n', 4);
        if (end !== -1) body = src.slice(end + 5);
    }
    return marked.parse(body) as string;
}

export function extractFrontmatter(src: string): Record<string, string> {
    if (!src.startsWith('---\n')) return {};
    const end = src.indexOf('\n---\n', 4);
    if (end === -1) return {};
    const block = src.slice(4, end);
    const out: Record<string, string> = {};
    for (const line of block.split('\n')) {
        const m = line.match(/^([\w-]+):\s*(.*)$/);
        if (m) out[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1');
    }
    return out;
}
