#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';

const apply = process.argv.includes('--apply');
const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const machinePaths = JSON.parse(readFileSync(join(repoRoot, 'agent/private/caol-config/machine-paths.json'), 'utf8'));
const structure = JSON.parse(readFileSync(join(repoRoot, 'agent/private/caol-config/vault-structure.json'), 'utf8'));
const vault = machinePaths.obsidian;
if (!vault || !existsSync(vault)) throw new Error(`Obsidian vault not found: ${vault}`);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportDir = join(repoRoot, 'docs/plans/obsidian-note-contract-cleanup-reports', stamp);
mkdirSync(reportDir, { recursive: true });

const projectRoot = structure.rootFolders.projects;
const dailyRoot = structure.rootFolders.daily;
const today = '2026-05-17';
const flatTagMap = new Map([
  ['ue-live-scene-bridge', 'project/ue-live-scene-bridge'],
  ['drinks', 'project/drinks'],
  ['git', 'area/git'],
  ['3d-genai', 'llm/3d-genai'],
  ['mtoon', 'fmt/mtoon'],
  ['shader', 'area/shader'],
  ['toon-rendering', 'area/toon-rendering'],
  ['vrm', 'fmt/vrm'],
  ['wine', 'hobby/wine'],
  ['champagne', 'hobby/champagne'],
  ['hyper3d', 'project/hyper3d'],
  ['job-search', 'project/job-search'],
  ['nvidia', 'llm/nvidia'],
  ['reference', 'type/reference'],
  ['whisky', 'hobby/whisky'],
]);
const projectFolderMap = new Map([
  ['_cross-project', 'cross-project'],
  ['cinev-studio', 'cinev'],
  ['job-search-2026', 'job-search'],
  ['mmd-player-anju', 'mmd-anju'],
]);

function rel(file) {
  return relative(vault, file).split(sep).join('/');
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, ent.name);
    if (ent.isDirectory()) walk(file, out);
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(file);
  }
  return out;
}

function titleize(name) {
  return name
    .replace(/\.md$/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}-?/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase()) || 'Untitled';
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

function inferProject(path) {
  const parts = path.split('/');
  if (parts[0] === projectRoot && parts[1]) return projectFolderMap.get(parts[1]) || parts[1];
  if (parts[0] === dailyRoot) return 'personal';
  return null;
}

function inferType(path) {
  const parts = path.split('/');
  if (parts[0] === dailyRoot) return 'type/devlog';
  const idx = parts.findIndex((part) => ['days', 'learnings', 'topics', 'specs', 'plans', 'decisions'].includes(part));
  const folder = idx >= 0 ? parts[idx] : null;
  if (folder === 'days') return 'type/devlog';
  if (folder === 'learnings') return 'type/learning';
  if (folder === 'specs') return 'type/spec';
  if (folder === 'plans') return 'type/plan';
  if (folder === 'decisions') return 'type/decision';
  return 'type/reference';
}

function inferDate(path, file) {
  const dateInPath = path.match(/20\d{2}-\d{2}-\d{2}/);
  if (dateInPath) return dateInPath[0];
  try {
    return statSync(file).mtime.toISOString().slice(0, 10);
  } catch {
    return today;
  }
}

function inferTitle(body, file) {
  const h1 = body.match(/^#\s+(.+?)\s*$/m);
  if (h1) return h1[1].trim().replace(/^['"]|['"]$/g, '');
  return titleize(basename(file));
}

function normalizeSource(value, path) {
  if (!value) return path.endsWith('/README.md') ? 'codex' : 'manual';
  const lower = String(value).toLowerCase();
  if (['claude', 'claude-code', 'claude code'].includes(lower)) return 'codex';
  if (['agent', 'manual', 'notion-export', 'codex'].includes(lower)) return lower;
  return 'manual';
}

function renderFrontmatter(fields, order) {
  const preferred = ['title', 'tags', 'date', 'source'];
  const keys = [...preferred, ...order.filter((key) => !preferred.includes(key) && key !== 'type')];
  const lines = ['---'];
  for (const key of keys) {
    if (!fields.has(key)) continue;
    const value = fields.get(key);
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${item}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

function ensureOneH1AfterFrontmatter(body, title) {
  const h1s = [...body.matchAll(/^#\s+(.+?)\s*$/gm)];
  if (h1s.length === 0) return `# ${title}\n\n${body.replace(/^\s+/, '')}`;
  if (h1s.length === 1) {
    const full = h1s[0][0];
    const without = body.slice(0, h1s[0].index) + body.slice(h1s[0].index + full.length);
    return `# ${title}\n\n${without.replace(/^\s+/, '')}`;
  }
  return body;
}

const files = [
  ...walk(join(vault, projectRoot)),
  ...walk(join(vault, dailyRoot)),
];

const changes = [];
const skipped = [];

for (const file of files) {
  const path = rel(file);
  const text = readFileSync(file, 'utf8');
  const fm = parseFrontmatter(text);
  if (!fm) {
    skipped.push({ file: path, reason: 'frontmatter.missing' });
    continue;
  }

  const { fields, order } = parseYaml(fm.raw);
  const before = text;
  const fileChanges = [];

  if (!fields.has('title') || fields.get('title') === '') {
    fields.set('title', inferTitle(fm.body, file));
    if (!order.includes('title')) order.push('title');
    fileChanges.push('title.backfill');
  }

  if (!fields.has('date') || fields.get('date') === '') {
    fields.set('date', inferDate(path, file));
    if (!order.includes('date')) order.push('date');
    fileChanges.push('date.backfill');
  }

  const normalizedSource = normalizeSource(fields.get('source'), path);
  if (fields.get('source') !== normalizedSource) {
    fields.set('source', normalizedSource);
    if (!order.includes('source')) order.push('source');
    fileChanges.push('source.normalize');
  }

  let tags = fields.get('tags');
  if (!Array.isArray(tags)) {
    tags = typeof tags === 'string' && tags ? [tags] : [];
    fields.set('tags', tags);
    if (!order.includes('tags')) order.push('tags');
    fileChanges.push('tags.list');
  }

  if (fields.has('type')) {
    const typeValue = String(fields.get('type')).replace(/^type\//, '');
    const typeTag = `type/${typeValue}`;
    if (!tags.includes(typeTag)) tags.unshift(typeTag);
    fields.delete('type');
    fileChanges.push('type-key.to-tag');
  }

  const normalizedTags = [];
  for (const tag of tags) {
    normalizedTags.push(flatTagMap.get(tag) || tag);
  }
  if (normalizedTags.join('\0') !== tags.join('\0')) {
    tags.splice(0, tags.length, ...normalizedTags);
    fileChanges.push('flat-tags.normalize');
  }

  const project = inferProject(path);
  if (project && tags.filter((tag) => tag.startsWith('project/')).length === 0) {
    tags.push(`project/${project}`);
    fileChanges.push('project-tag.infer');
  }

  if (tags.filter((tag) => tag.startsWith('type/')).length === 0) {
    tags.unshift(inferType(path));
    fileChanges.push('type-tag.infer');
  }

  const projectTags = tags.filter((tag) => tag.startsWith('project/'));
  if (project && projectTags.length !== 1) {
    const desired = `project/${project}`;
    const next = tags.filter((tag) => !tag.startsWith('project/'));
    next.push(desired);
    tags.splice(0, tags.length, ...new Set(next));
    fileChanges.push('project-tag.dedupe');
  }

  const typeTags = tags.filter((tag) => tag.startsWith('type/'));
  if (typeTags.length !== 1) {
    const desired = path.startsWith(`${dailyRoot}/`) && typeTags.includes('type/journal')
      ? 'type/journal'
      : inferType(path);
    const next = tags.filter((tag) => !tag.startsWith('type/'));
    next.unshift(desired);
    tags.splice(0, tags.length, ...new Set(next));
    fileChanges.push('type-tag.dedupe');
  }

  const title = fields.get('title');
  const nextBody = ensureOneH1AfterFrontmatter(fm.body, title);
  if (nextBody !== fm.body) fileChanges.push('h1.mechanical');

  if (fileChanges.length) {
    const after = `${renderFrontmatter(fields, order)}\n${nextBody}`;
    changes.push({ file: path, changes: fileChanges });
    if (apply && after !== before) writeFileSync(file, after);
  }
}

writeFileSync(join(reportDir, 'auto-fix-preview.json'), JSON.stringify(changes, null, 2) + '\n');
writeFileSync(join(reportDir, 'decision-needed.json'), JSON.stringify(skipped, null, 2) + '\n');
writeFileSync(join(reportDir, 'summary.json'), JSON.stringify({
  apply,
  filesScanned: files.length,
  filesWithPlannedChanges: changes.length,
  skipped: skipped.length,
}, null, 2) + '\n');

console.log(JSON.stringify({
  apply,
  reportDir,
  filesScanned: files.length,
  filesWithPlannedChanges: changes.length,
  skipped: skipped.length,
}, null, 2));
