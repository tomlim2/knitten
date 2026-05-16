#!/usr/bin/env node
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';

const apply = process.argv.includes('--apply');
const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const machinePaths = JSON.parse(readFileSync(join(repoRoot, 'agent/private/caol-config/machine-paths.json'), 'utf8'));
const vault = machinePaths.obsidian;
if (!vault || !existsSync(vault)) throw new Error(`Obsidian vault not found: ${vault}`);

const sourceDir = join(vault, 'projects/cinev-studio/topics/cinev/notion-archive');
const targetIndex = join(vault, 'projects/cinev-studio/topics/cinev/legacy-worklog.md');
const targetDir = join(vault, 'projects/cinev-studio/topics/cinev/legacy-worklog');
const reportDir = join(
  repoRoot,
  'docs/plans/obsidian-note-contract-cleanup-reports/notion-archive-migration-2026-05-17',
);
mkdirSync(reportDir, { recursive: true });

function rel(file) {
  return relative(vault, file).split(sep).join('/');
}

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return null;
  return {
    raw: text.slice(4, end),
    body: text.slice(end + 5).replace(/^\r?\n/, ''),
  };
}

function parseYaml(raw) {
  const fields = new Map();
  const order = [];
  let current = null;
  for (const line of raw.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      current = kv[1];
      order.push(current);
      const value = kv[2].trim();
      fields.set(current, value === '' ? [] : value.replace(/^['"]|['"]$/g, ''));
      continue;
    }
    if (current && Array.isArray(fields.get(current))) {
      const item = line.match(/^\s*-\s*(.+?)\s*$/);
      if (item) fields.get(current).push(item[1].replace(/^['"]|['"]$/g, ''));
    }
  }
  return { fields, order: [...new Set(order)] };
}

function quoteYaml(value) {
  if (/[:#{}\[\],&*?|\-<>=!%@`]/.test(value)) return JSON.stringify(value);
  return value;
}

function renderFrontmatter(fields, order) {
  const preferred = ['title', 'tags', 'date', 'source'];
  const keys = [...preferred, ...order.filter((key) => !preferred.includes(key))];
  const lines = ['---'];
  for (const key of keys) {
    if (!fields.has(key)) continue;
    const value = fields.get(key);
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${item}`);
    } else {
      lines.push(`${key}: ${quoteYaml(String(value))}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

function normalizeTags(tags) {
  const original = [...tags];
  const semanticPriority = [
    'sys/nanite',
    'sys/blueprint',
    'area/skin-color',
    'area/material',
    'area/shader',
    'area/optimization',
    'area/landscape',
    'area/environment',
    'area/rendering',
    'area/character',
    'area/unreal-engine',
  ];
  const semantic = tags.filter((tag) => !tag.startsWith('type/') && !tag.startsWith('project/'));
  const sortedSemantic = [
    ...semanticPriority.filter((tag) => semantic.includes(tag)),
    ...semantic.filter((tag) => !semanticPriority.includes(tag)),
  ];
  const next = ['type/reference', 'project/cinev', ...sortedSemantic.slice(0, 3)];
  return { original, next: [...new Set(next)] };
}

function normalizeNote(file) {
  const text = readFileSync(file, 'utf8');
  const fm = parseFrontmatter(text);
  if (!fm) return { changed: false, reason: 'frontmatter.missing' };
  const { fields, order } = parseYaml(fm.raw);
  const tags = fields.get('tags');
  if (!Array.isArray(tags)) return { changed: false, reason: 'tags.not-list' };

  const { original, next } = normalizeTags(tags);
  fields.set('tags', next);
  if (!fields.has('source')) fields.set('source', 'notion-export');
  const output = `${renderFrontmatter(fields, order)}${fm.body}`;
  const changed = output !== text;
  if (apply && changed) writeFileSync(file, output);
  return { changed, tagsBefore: original, tagsAfter: next };
}

if (!existsSync(sourceDir)) {
  writeFileSync(join(reportDir, 'manifest.json'), JSON.stringify({ alreadyMigrated: true }, null, 2));
  console.log('already migrated');
  process.exit(0);
}

const moves = [];
const collisions = [];
const tagChanges = [];
const entries = readdirSync(sourceDir, { withFileTypes: true });
for (const entry of entries) {
  const src = join(sourceDir, entry.name);
  const dst = entry.name === 'README.md' ? targetIndex : join(targetDir, entry.name);
  moves.push({ from: rel(src), to: rel(dst) });
  if (existsSync(dst)) collisions.push({ from: rel(src), to: rel(dst) });
}

if (collisions.length > 0) {
  writeFileSync(join(reportDir, 'manifest.json'), JSON.stringify({ apply, collisions, moves }, null, 2));
  throw new Error(`Destination collision count: ${collisions.length}`);
}

for (const entry of entries) {
  if (!entry.name.endsWith('.md') && !entry.isDirectory()) continue;
  const src = join(sourceDir, entry.name);
  if (entry.isFile() && entry.name.endsWith('.md')) {
    const change = normalizeNote(src);
    tagChanges.push({ file: rel(src), ...change });
  }
  if (entry.isDirectory()) {
    for (const nested of readdirSync(src, { withFileTypes: true })) {
      if (!nested.isFile() || !nested.name.endsWith('.md')) continue;
      const file = join(src, nested.name);
      const change = normalizeNote(file);
      tagChanges.push({ file: rel(file), ...change });
    }
  }
}

if (apply) {
  mkdirSync(dirname(targetIndex), { recursive: true });
  mkdirSync(targetDir, { recursive: true });
  for (const move of moves) {
    renameSync(join(vault, move.from), join(vault, move.to));
  }
  rmSync(sourceDir, { recursive: true, force: true });
}

const manifest = {
  apply,
  source: rel(sourceDir),
  targetIndex: rel(targetIndex),
  targetDir: rel(targetDir),
  moved: moves.length,
  tagChanged: tagChanges.filter((change) => change.changed).length,
  collisions,
  moves,
  tagChanges,
};
writeFileSync(join(reportDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ apply, moved: moves.length, tagChanged: manifest.tagChanged, collisions: collisions.length }, null, 2));
