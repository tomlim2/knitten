import type { APIRoute } from 'astro';
import { startRuntime, stopRuntime } from '../../../../lib/runtimes';

export const POST: APIRoute = ({ params }) => {
    const name = params.name as string;
    const action = params.action as string;
    if (action === 'start') {
        const r = startRuntime(name);
        return new Response(JSON.stringify(r), {
            status: r.ok ? 200 : 400,
            headers: { 'content-type': 'application/json' },
        });
    }
    if (action === 'stop') {
        const r = stopRuntime(name);
        return new Response(JSON.stringify(r), {
            status: r.ok ? 200 : 400,
            headers: { 'content-type': 'application/json' },
        });
    }
    return new Response(JSON.stringify({ ok: false, reason: 'unknown action' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
    });
};
