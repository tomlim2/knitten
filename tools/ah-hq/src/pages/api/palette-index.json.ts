import type { APIRoute } from 'astro';
import { discoverSkills } from '../../lib/skill-discovery';

/** Command palette index — fetched on first ⌘K press to keep page HTML small.
 *  (review-code-astro.md PERF-A07.) */
export const GET: APIRoute = () => {
    const skills = discoverSkills().map(s => ({
        kind: 'skill' as const,
        label: s.id,
        sub: s.description || s.name,
        href: `/skills/${s.id}`,
    }));
    const links = [
        { kind: 'page' as const, label: 'Home', sub: 'Today widgets', href: '/' },
        { kind: 'page' as const, label: 'Browse', sub: 'Skills · Standards · Learnings', href: '/browse' },
        { kind: 'page' as const, label: 'Personal', sub: 'Drinks · Gallery · Invoice', href: '/personal' },
        { kind: 'page' as const, label: 'Skills', sub: `${skills.length} entries`, href: '/skills' },
    ];
    return new Response(JSON.stringify([...links, ...skills]), {
        headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=60' },
    });
};
