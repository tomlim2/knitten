import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

const HOME = homedir();
export const CLAUDE_DIR = join(HOME, '.claude');
export const SKILLS_DIR = join(CLAUDE_DIR, 'skills');
export const COMMANDS_DIR = join(CLAUDE_DIR, 'commands');
export const STANDARDS_DIR = join(CLAUDE_DIR, 'standards');
export const PRIVATE_DIR = join(CLAUDE_DIR, 'private');
export const CAOL_CONFIG_DIR = join(PRIVATE_DIR, 'caol-config');

export const REPO_PATHS_FILE = join(CAOL_CONFIG_DIR, 'repo-paths.json');
export const MACHINE_PATHS_FILE = join(CAOL_CONFIG_DIR, 'machine-paths.json');
export const HARDWARE_FILE = join(CAOL_CONFIG_DIR, 'hardware.json');

export type RepoEntry = string | { path: string; description?: string };
export type RepoPaths = Record<string, RepoEntry>;

export function loadRepoPaths(): RepoPaths {
    if (!existsSync(REPO_PATHS_FILE)) return {};
    try {
        return JSON.parse(readFileSync(REPO_PATHS_FILE, 'utf-8')) as RepoPaths;
    } catch {
        return {};
    }
}

export function getRepoPath(entry: RepoEntry | undefined): string {
    if (!entry) return '';
    return typeof entry === 'string' ? entry : entry.path;
}

export function getRepoDescription(entry: RepoEntry | undefined): string {
    if (!entry || typeof entry === 'string') return '';
    return entry.description ?? '';
}

export function loadMachinePaths(): Record<string, string> {
    if (!existsSync(MACHINE_PATHS_FILE)) return {};
    try {
        return JSON.parse(readFileSync(MACHINE_PATHS_FILE, 'utf-8'));
    } catch {
        return {};
    }
}

export function obsidianAgentDir(): string | null {
    const machine = loadMachinePaths();
    return machine['obsidian-agent-root'] ?? machine['obsidian-vault-claude'] ?? machine['obsidian-staging'] ?? null;
}
