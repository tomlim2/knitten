import type { APIRoute } from 'astro';
import { startRuntime, stopRuntime } from '../../../../lib/runtimes';

const ALLOWED_ORIGINS = new Set([
    'http://localhost:9720',
    'http://127.0.0.1:9720',
]);

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', ...headers },
    });
}

export const POST: APIRoute = ({ params, request }) => {
    // CSRF defence — same-origin only. Browsers omit Origin on same-origin
    // navigations; reject only when present and unknown
    // (review-code-astro.md SEC-A06).
    const origin = request.headers.get('origin');
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return json({ ok: false, reason: 'forbidden origin' }, 403);
    }

    const name = params.name;
    const action = params.action;
    if (!name || !action) return json({ ok: false, reason: 'missing param' }, 400);

    if (action === 'start') {
        const r = startRuntime(name);
        return json(r, r.ok ? 200 : 400);
    }
    if (action === 'stop') {
        const r = stopRuntime(name);
        return json(r, r.ok ? 200 : 400);
    }
    return json({ ok: false, reason: 'unknown action' }, 400);
};

// 405 for any non-POST method, with Allow header
// (review-code-astro.md ROUTE-A03).
export const ALL: APIRoute = ({ request }) => {
    if (request.method === 'POST') {
        return json({ ok: false, reason: 'method handled by POST export' }, 500);
    }
    return json({ ok: false, reason: 'method not allowed' }, 405, { allow: 'POST' });
};
