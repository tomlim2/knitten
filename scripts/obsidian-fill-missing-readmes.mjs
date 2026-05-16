#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const machinePaths = JSON.parse(readFileSync(join(repoRoot, 'agent/private/caol-config/machine-paths.json'), 'utf8'));
const structure = JSON.parse(readFileSync(join(repoRoot, 'agent/private/caol-config/vault-structure.json'), 'utf8'));
const vault = machinePaths.obsidian;
if (!vault || !existsSync(vault)) throw new Error(`Obsidian vault not found: ${vault}`);

const apply = process.argv.includes('--apply');
const today = new Date().toISOString().slice(0, 10);
const projectsRoot = join(vault, structure.rootFolders.projects);
const durable = structure.durableProjectFolders || [];

function titleize(slug) {
  return slug
    .split(/[-_]/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function dirsToCheck() {
  const dirs = [];
  if (!existsSync(projectsRoot)) return dirs;
  for (const ent of readdirSync(projectsRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const projectRoot = join(projectsRoot, ent.name);
    dirs.push(projectRoot);
    for (const rel of durable) {
      const dir = join(projectRoot, ...rel.split('/'));
      if (existsSync(dir) && statSync(dir).isDirectory()) dirs.push(dir);
    }
  }
  return dirs;
}

function projectFor(dir) {
  const rel = relative(projectsRoot, dir).split(sep);
  return rel[0] || 'caol-ila';
}

function readmeFor(dir) {
  const project = projectFor(dir);
  const rel = relative(projectsRoot, dir).split(sep).join('/');
  const isProjectRoot = rel === project;
  const label = isProjectRoot ? titleize(project) : `${titleize(project)} ${titleize(basename(dir))}`;
  const role = isProjectRoot ? 'project map' : `${basename(dir)} folder map`;
  return `---\ntitle: "${label}"\ntags:\n  - type/reference\n  - project/${project}\ndate: ${today}\nsource: codex\n---\n\n# ${label}\n\nThis README marks the ${role}, audience, and routing boundary for this folder.\n\n---\n\n## Folder Contract\n\n- Audience: both\n- Style: structured-narrative\n- Mutability: append and refine as the folder evolves\n\n`;
}

const missing = dirsToCheck().filter((dir) => !existsSync(join(dir, 'README.md')));
if (apply) {
  for (const dir of missing) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'README.md'), readmeFor(dir));
  }
}

console.log(JSON.stringify({
  apply,
  missing: missing.length,
  files: missing.map((dir) => relative(vault, join(dir, 'README.md')).split(sep).join('/')),
}, null, 2));
