import { exec, execSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { openSync, existsSync } from 'node:fs';
import runtimesConfig from '../config/runtimes.json' with { type: 'json' };
import { getRepoPath, loadRepoPaths } from './paths';

const execAsync = promisify(exec);

export interface RuntimeConfig {
    label: string;
    psPattern: string;
    launch: string[];
    logFile: string;
    extraPath?: string[];
}

export type RuntimeStatus = { running: boolean; pid: number | null };

const RUNTIMES = runtimesConfig as Record<string, RuntimeConfig>;

function expandPath(path: string): string {
    const home = process.env.HOME ?? '';
    return path.replace(/^\$HOME(?=\/|$)|^~(?=\/|$)/, home);
}

export function listRuntimes(): Array<{ name: string; cfg: RuntimeConfig; repoPath: string }> {
    const repos = loadRepoPaths();
    return Object.entries(RUNTIMES).map(([name, cfg]) => ({
        name,
        cfg,
        repoPath: getRepoPath(repos[name]),
    }));
}

export function getRuntimeConfig(name: string): RuntimeConfig | null {
    return RUNTIMES[name] ?? null;
}

export function statusOf(name: string): RuntimeStatus {
    const cfg = RUNTIMES[name];
    if (!cfg) return { running: false, pid: null };
    try {
        const out = execSync(`pgrep -f ${JSON.stringify(cfg.psPattern)} || true`, {
            encoding: 'utf8',
            timeout: 1500,
        }).trim();
        if (!out) return { running: false, pid: null };
        const pids = out.split(/\s+/).map(Number).filter(n => !Number.isNaN(n));
        return pids.length ? { running: true, pid: Math.min(...pids) } : { running: false, pid: null };
    } catch {
        return { running: false, pid: null };
    }
}

/** Async variant. Use Promise.all over many runtimes to avoid sequential pgrep blocking. */
export async function statusOfAsync(name: string): Promise<RuntimeStatus> {
    const cfg = RUNTIMES[name];
    if (!cfg) return { running: false, pid: null };
    try {
        const { stdout } = await execAsync(
            `pgrep -f ${JSON.stringify(cfg.psPattern)} || true`,
            { encoding: 'utf8', timeout: 1500 },
        );
        const out = stdout.trim();
        if (!out) return { running: false, pid: null };
        const pids = out.split(/\s+/).map(Number).filter(n => !Number.isNaN(n));
        return pids.length ? { running: true, pid: Math.min(...pids) } : { running: false, pid: null };
    } catch {
        return { running: false, pid: null };
    }
}

export function startRuntime(name: string): { ok: boolean; reason?: string; pid?: number } {
    const cfg = RUNTIMES[name];
    if (!cfg) return { ok: false, reason: 'unknown runtime' };
    const repos = loadRepoPaths();
    const repoPath = getRepoPath(repos[name]);
    if (!repoPath || !existsSync(repoPath)) {
        return { ok: false, reason: 'repo path missing' };
    }
    const cur = statusOf(name);
    if (cur.running) return { ok: true, pid: cur.pid! };

    const [cmd, ...args] = cfg.launch;
    const out = openSync(cfg.logFile, 'a');
    const err = openSync(cfg.logFile, 'a');
    const extraPath = (cfg.extraPath ?? []).map(expandPath).join(':');
    const child = spawn(cmd, args, {
        cwd: repoPath,
        detached: true,
        stdio: ['ignore', out, err],
        env: {
            ...process.env,
            PATH: extraPath ? `${extraPath}:${process.env.PATH}` : process.env.PATH,
        },
    });
    child.unref();
    return { ok: true, pid: child.pid! };
}

export function stopRuntime(name: string): { ok: boolean; reason?: string; killed?: number } {
    const cfg = RUNTIMES[name];
    if (!cfg) return { ok: false, reason: 'unknown runtime' };
    const cur = statusOf(name);
    if (!cur.running) return { ok: true };
    try {
        execSync(`pkill -TERM -f ${JSON.stringify(cfg.psPattern)}`, { timeout: 1500 });
        return { ok: true, killed: cur.pid! };
    } catch (e) {
        return { ok: false, reason: String(e) };
    }
}
