#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, sep } from 'node:path';

const apply = process.argv.includes('--apply');
const repoRoot = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const machinePaths = JSON.parse(readFileSync(join(repoRoot, 'agent/private/agent-hub-config/machine-paths.json'), 'utf8'));
const structure = JSON.parse(readFileSync(join(repoRoot, 'agent/private/agent-hub-config/vault-structure.json'), 'utf8'));
const vault = machinePaths.obsidian;
if (!vault || !existsSync(vault)) throw new Error(`Obsidian vault not found: ${vault}`);

const reportDir = join(
  repoRoot,
  'docs/plans/reports/obsidian-note-contract-cleanup/final-contract-cleanup-2026-05-17',
);
mkdirSync(reportDir, { recursive: true });

const semanticPriority = [
  'status/active',
  'status/draft',
  'status/done',
  'area/character',
  'area/material',
  'area/shader',
  'area/animation',
  'area/optimization',
  'area/unreal-engine',
  'area/texture',
  'area/rendering',
  'area/ui',
  'area/ux',
  'fmt/vrm',
  'fmt/fbx',
  'fmt/pmx',
  'fmt/gltf',
  'fmt/mtoon',
  'lang/rust',
  'lang/cpp',
  'lang/python',
  'lang/javascript',
  'lib/bevy',
  'lib/threejs',
  'sys/nanite',
  'sys/blueprint',
  'sys/blender',
  'hobby/wine',
  'hobby/whisky',
];

function rel(file) {
  return relative(vault, file).split(sep).join('/');
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (structure.systemFolders?.includes(ent.name)) continue;
    const file = join(dir, ent.name);
    if (ent.isDirectory()) walk(file, out);
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(file);
  }
  return out;
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

function titleFromPath(file) {
  return basename(file, '.md')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, (ch) => ch.toUpperCase()) || 'Untitled';
}

function quoteYaml(value) {
  if (/[:#{}\[\],&*?|<>=!%@`]/.test(value)) return JSON.stringify(value);
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

function inferProject(path) {
  const parts = path.split('/');
  if (parts[0] === structure.rootFolders.projects && parts[1]) {
    if (parts[1] === 'cinev-studio') return 'project/cinev';
    if (parts[1] === 'mmd-player-anju') return 'project/mmd-anju';
    if (parts[1] === '_cross-project') return 'project/cross-project';
    return `project/${parts[1]}`;
  }
  return 'project/personal';
}

function inferType(path) {
  if (path.includes('/days/')) return 'type/devlog';
  if (path.includes('/learnings/')) return 'type/learning';
  if (path.includes('/specs/')) return 'type/spec';
  if (path.includes('/plans/')) return 'type/plan';
  if (path.includes('/decisions/')) return 'type/decision';
  if (path.endsWith('/README.md')) return 'type/index';
  return 'type/reference';
}

function trimTags(tags, path) {
  const type = tags.find((tag) => tag.startsWith('type/')) || inferType(path);
  const project = tags.find((tag) => tag.startsWith('project/')) || inferProject(path);
  const semantic = tags.filter((tag) => !tag.startsWith('type/') && !tag.startsWith('project/'));
  const sorted = [
    ...semanticPriority.filter((tag) => semantic.includes(tag)),
    ...semantic.filter((tag) => !semanticPriority.includes(tag)),
  ];
  return [...new Set([type, project, ...sorted.slice(0, 3)])];
}

function normalizeH1(body, title) {
  const h1s = [...body.matchAll(/^#\s+(.+)$/gm)];
  const firstBodyLine = body.split(/\r?\n/).find((line) => line.trim());
  if (h1s.length === 1 && firstBodyLine?.startsWith('# ')) return body;
  const demoted = body.replace(/^#\s+(.+)$/gm, '## $1').replace(/^\s+/, '');
  return `# ${title}\n\n${demoted}`;
}

function stripCode(text) {
  return text.replace(/```[\s\S]*?```/g, (block) => '\n'.repeat(block.split(/\r?\n/).length - 1))
    .replace(/`[^`\n]*`/g, '');
}

function normalizeInlineTags(body) {
  const lines = body.split(/\r?\n/);
  let changed = false;
  let inFence = false;
  const out = lines.map((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;

    const headingTags = line.match(/^((?:#[A-Za-z0-9][A-Za-z0-9/_-]*\s+)+)(.+)$/);
    if (headingTags) {
      const labels = headingTags[1]
        .trim()
        .split(/\s+/)
        .map((tag) => tag.slice(1).replace(/-/g, ' '))
        .join(', ');
      changed = true;
      return `## ${labels}: ${headingTags[2].trim()}`;
    }

    const next = line.replace(/(^|\s)#([A-Za-z0-9][A-Za-z0-9/_-]*)/g, (match, prefix, tag) => {
      if (['rule', 'failed', 'gotcha'].includes(tag)) return match;
      changed = true;
      return `${prefix}\\#${tag}`;
    });
    return next;
  });
  return { body: out.join('\n'), changed };
}

const files = [
  ...walk(join(vault, structure.rootFolders.projects)),
  ...walk(join(vault, structure.rootFolders.daily)),
];
const changes = [];

for (const file of files) {
  const path = rel(file);
  const before = readFileSync(file, 'utf8');
  let fm = parseFrontmatter(before);
  const fileChanges = [];

  if (!fm) {
    const title = titleFromPath(file);
    const date = statSync(file).mtime.toISOString().slice(0, 10);
    const fields = new Map([
      ['title', title],
      ['tags', [inferType(path), inferProject(path)]],
      ['date', date],
      ['source', 'manual'],
    ]);
    const body = before.startsWith('# ') ? before : `# ${title}\n\n${before}`;
    const after = `${renderFrontmatter(fields, ['title', 'tags', 'date', 'source'])}${body}`;
    fileChanges.push('frontmatter.insert');
    if (apply) writeFileSync(file, after);
    changes.push({ file: path, changes: fileChanges });
    continue;
  }

  const { fields, order } = parseYaml(fm.raw);
  if (!fields.has('title') || !fields.get('title')) {
    fields.set('title', titleFromPath(file));
    order.push('title');
    fileChanges.push('title.backfill');
  }
  if (!fields.has('date') || !fields.get('date')) {
    fields.set('date', statSync(file).mtime.toISOString().slice(0, 10));
    order.push('date');
    fileChanges.push('date.backfill');
  }
  if (!fields.has('source') || !fields.get('source')) {
    fields.set('source', 'manual');
    order.push('source');
    fileChanges.push('source.backfill');
  }
  if (fields.has('project')) {
    fields.delete('project');
    fileChanges.push('frontmatter.project.remove');
  }
  if (fields.has('started')) {
    fields.set('created', fields.get('started'));
    fields.delete('started');
    if (!order.includes('created')) order.push('created');
    fileChanges.push('frontmatter.started.to-created');
  }

  let tags = fields.get('tags');
  if (!Array.isArray(tags)) {
    tags = tags ? [String(tags)] : [];
    fileChanges.push('tags.to-list');
  }
  const needsTagTrim = tags.length > 5
    || tags.filter((tag) => tag.startsWith('type/')).length !== 1
    || tags.filter((tag) => tag.startsWith('project/')).length !== 1;
  const trimmedTags = needsTagTrim ? trimTags(tags, path) : tags;
  if (needsTagTrim && trimmedTags.join('\0') !== tags.join('\0')) {
    fields.set('tags', trimmedTags);
    fileChanges.push('tags.trim');
  } else {
    fields.set('tags', tags);
  }

  let body = normalizeH1(fm.body, fields.get('title'));
  if (body !== fm.body) fileChanges.push('h1.normalize');

  const inline = normalizeInlineTags(body);
  if (inline.changed) {
    body = inline.body;
    fileChanges.push('inline-tags.escape');
  }

  const after = `${renderFrontmatter(fields, order)}${body}`;
  if (after !== before && fileChanges.length) {
    if (apply) writeFileSync(file, after);
    changes.push({ file: path, changes: fileChanges });
  }
}

writeFileSync(join(reportDir, apply ? 'applied.json' : 'preview.json'), JSON.stringify({
  apply,
  filesScanned: files.length,
  filesChanged: changes.length,
  changes,
}, null, 2));

console.log(JSON.stringify({ apply, filesScanned: files.length, filesChanged: changes.length }, null, 2));
