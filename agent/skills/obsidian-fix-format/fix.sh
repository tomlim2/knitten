#!/usr/bin/env bash
# Obsidian vault format auditor + fixer.
# Usage:
#   fix.sh                  — full audit (dry run)
#   fix.sh --apply          — apply auto-fixable rewrites
#   fix.sh --check <name>   — run a single check by name
#
# Checks:
#   frontmatter-heading-glued  (auto-fixable) — `---#` etc on same line
#   missing-h1                 (report only)  — no `# Title` in first 30 lines
#   missing-readme             (report only)  — durable agent folders without README.md
#   project-structure          (report only)  — project root files that should live in role folders
#   obsidian-contract          (report only)  — frontmatter/tag/H1/link contract
#   empty-dirs                 (auto-fixable) — empty directories under vault

set -euo pipefail

VAULT="$(jq -r '."obsidian"' ~/.claude/private/caol-config/machine-paths.json)"
if [[ -z "$VAULT" || ! -d "$VAULT" ]]; then
  echo "vault path not found: $VAULT" >&2
  exit 1
fi

AGENT_ROOT="$(jq -r '."obsidian-agent-root" // ."obsidian-vault-claude" // empty' ~/.claude/private/caol-config/machine-paths.json)"
if [[ -z "$AGENT_ROOT" || ! -d "$AGENT_ROOT" ]]; then
  AGENT_ROOT="$VAULT/agent"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAXONOMY="$SCRIPT_DIR/../obsidian-obsidian-markdown/references/TAG-TAXONOMY.md"

APPLY=0
ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=1 ;;
    --check) ONLY="${2:-}"; shift ;;
  esac
  shift
done

cd "$VAULT"

want() { [[ -z "$ONLY" || "$ONLY" == "$1" ]]; }

# --- frontmatter-heading-glued (auto-fix) ---
if want frontmatter-heading-glued; then
  hits=$(grep -rlE '^---#+' . 2>/dev/null || true)
  if [[ -z "$hits" ]]; then
    echo "[frontmatter-heading-glued] clean"
  else
    echo "[frontmatter-heading-glued] offenders:"
    echo "$hits" | sed 's/^/  /'
    if (( APPLY )); then
      while IFS= read -r f; do
        perl -i -pe 's/^---(#+)(.*)$/---\n$1$2/' "$f"
      done <<< "$hits"
      echo "[frontmatter-heading-glued] fixed"
    fi
  fi
fi

# --- missing-h1 (report only) ---
if want missing-h1; then
  count=0
  declare -a missing=()
  while IFS= read -r f; do
    if ! head -30 "$f" | grep -q '^# '; then
      missing+=("$f")
      count=$((count+1))
    fi
  done < <(find . -name '*.md' -not -path './.trash/*' -not -path './.obsidian/*' -not -path './attachments/*')
  if (( count == 0 )); then
    echo "[missing-h1] clean"
  else
    echo "[missing-h1] offenders ($count):"
    printf '  %s\n' "${missing[@]}" | head -20
    (( count > 20 )) && echo "  ... +$((count-20)) more"
    echo "  (report only — not auto-fixed; review filenames before backfill)"
  fi
fi

# --- missing-readme under agent/projects/* ---
# Policy: README required for project roots and durable folders only.
# Repeated entry folders (`days/`, `learnings/`) inherit from parent.
if want missing-readme; then
  count=0
  declare -a missing=()
  while IFS= read -r d; do
    [[ -d "$d" ]] || continue
    [[ -f "$d/README.md" ]] && continue
    missing+=("$d")
    count=$((count+1))
  done < <(
    {
      find "$AGENT_ROOT/projects" -mindepth 1 -maxdepth 1 -type d 2>/dev/null
      find "$AGENT_ROOT/projects" -type d \( \
        -path '*/specs' -o \
        -path '*/plans' -o \
        -path '*/topics' -o \
        -path '*/decisions' -o \
        -path '*/ops/missions' \
      \) 2>/dev/null
    } | sort -u
  )
  if (( count == 0 )); then
    echo "[missing-readme] clean (per policy: project roots + durable folders only)"
  else
    echo "[missing-readme] offenders ($count):"
    printf '  %s\n' "${missing[@]#$VAULT/}" | head -20
    (( count > 20 )) && echo "  ... +$((count-20)) more"
  fi
fi

# --- project-structure (report only) ---
if want project-structure; then
  node - "$AGENT_ROOT" <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
const projects = path.join(root, 'projects');
const issues = [];

function rel(file) {
  return path.relative(root, file) || '.';
}

function add(file, code, detail = '') {
  issues.push({ file: rel(file), code, detail });
}

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return null;
  const raw = text.slice(4, end);
  const obj = {};
  let current = null;

  for (const line of raw.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      current = kv[1];
      const value = kv[2].trim();
      obj[current] = value === '' ? [] : value.replace(/^['"]|['"]$/g, '');
      continue;
    }

    if (current && Array.isArray(obj[current])) {
      const item = line.match(/^\s*-\s*(.+?)\s*$/);
      if (item) obj[current].push(item[1].replace(/^['"]|['"]$/g, ''));
    }
  }

  return obj;
}

const rootTypeDest = new Map([
  ['type/devlog', 'days/'],
  ['type/learning', 'learnings/'],
  ['type/spec', 'specs/'],
  ['type/plan', 'plans/'],
  ['type/decision', 'decisions/'],
  ['type/analysis', 'topics/'],
  ['type/reference', 'topics/'],
  ['type/glossary', 'topics/'],
  ['type/topic', 'topics/'],
]);

if (fs.existsSync(projects)) {
  for (const project of fs.readdirSync(projects, { withFileTypes: true }).filter((ent) => ent.isDirectory())) {
    const projectRoot = path.join(projects, project.name);
    for (const ent of fs.readdirSync(projectRoot, { withFileTypes: true })) {
      const file = path.join(projectRoot, ent.name);

      if (ent.isFile() && /\.(bak|tmp)$/.test(ent.name)) {
        add(file, 'project.backup-file', 'backup/temp file inside project root');
        continue;
      }

      if (!ent.isFile() || !ent.name.endsWith('.md') || ent.name === 'README.md') continue;

      const fm = parseFrontmatter(fs.readFileSync(file, 'utf8'));
      const tags = Array.isArray(fm?.tags) ? fm.tags : [];
      const typeTag = tags.find((tag) => tag.startsWith('type/'));
      const dest = rootTypeDest.get(typeTag);
      if (dest) add(file, 'project.root-role-mismatch', `${typeTag} belongs in ${dest}`);
      else add(file, 'project.root-legacy-hub', 'root file should be README.md or a temporary migration hub');
    }
  }
}

console.log(`[project-structure] offenders: ${issues.length}`);
if (issues.length === 0) {
  console.log('[project-structure] clean');
  process.exit(0);
}

const byCode = new Map();
for (const issue of issues) byCode.set(issue.code, (byCode.get(issue.code) || 0) + 1);
for (const [code, count] of [...byCode.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
  console.log(`  ${String(count).padStart(4)} ${code}`);
}
console.log('[project-structure] samples:');
for (const issue of issues.slice(0, 60)) {
  const suffix = issue.detail ? ` | ${issue.detail}` : '';
  console.log(`  ${issue.file} | ${issue.code}${suffix}`);
}
if (issues.length > 60) console.log(`  ... +${issues.length - 60} more`);
NODE
fi

# --- obsidian-contract (report only) ---
if want obsidian-contract; then
  if [[ ! -f "$TAXONOMY" ]]; then
    echo "[obsidian-contract] taxonomy not found: $TAXONOMY" >&2
    exit 1
  fi
  node - "$AGENT_ROOT" "$TAXONOMY" <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.argv[2];
const taxonomyPath = process.argv[3];
const taxonomy = fs.readFileSync(taxonomyPath, 'utf8');
const allowedTags = new Set([...taxonomy.matchAll(/`([a-z]+\/[a-z0-9-]+)`/g)].map((m) => m[1]));
for (const tag of ['status/draft', 'status/active', 'status/blocked', 'status/done']) {
  allowedTags.add(tag);
}

const allowedSources = new Set(['agent', 'manual', 'notion-export', 'codex', 'claude-code']);
const skipDirs = new Set(['.obsidian', '.trash', 'attachments']);
const issues = [];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const file = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(file, out);
    else if (ent.isFile() && ent.name.endsWith('.md')) out.push(file);
  }
  return out;
}

function rel(file) {
  return path.relative(root, file) || '.';
}

function add(file, code, detail = '') {
  issues.push({ file: rel(file), code, detail });
}

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return null;
  const raw = text.slice(4, end);
  const body = text.slice(end + 5);
  const obj = {};
  let current = null;

  for (const line of raw.split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) {
      current = kv[1];
      const value = kv[2].trim();
      obj[current] = value === '' ? [] : value.replace(/^['"]|['"]$/g, '');
      continue;
    }

    if (current && Array.isArray(obj[current])) {
      const item = line.match(/^\s*-\s*(.+?)\s*$/);
      if (item) obj[current].push(item[1].replace(/^['"]|['"]$/g, ''));
    }
  }

  return { raw, obj, body };
}

function stripCodeForProseChecks(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
}

const files = walk(root);
const knownFrontmatterKeys = new Set([
  'aliases',
  'audience',
  'company',
  'created',
  'date',
  'day',
  'department',
  'employment_type',
  'last_updated',
  'location',
  'owner',
  'position',
  'revisit',
  'source',
  'status',
  'tags',
  'title',
  'updated',
  'url',
  'version',
]);

for (const file of files) {
  const relativeFile = rel(file);
  const pathParts = relativeFile.split(path.sep);
  const daysIndex = pathParts.indexOf('days');
  if (daysIndex >= 0 && path.basename(file) !== 'README.md') {
    const afterDays = pathParts.slice(daysIndex + 1);
    const directDayFile = afterDays.length === 1 && /^20\d{2}-\d{2}-\d{2}\.md$/.test(afterDays[0]);
    const splitDayFile = afterDays.length >= 2 && /^20\d{2}-\d{2}-\d{2}$/.test(afterDays[0]);
    if (!directDayFile && !splitDayFile) {
      add(file, 'filename.days-convention', 'use days/YYYY-MM-DD.md or days/YYYY-MM-DD/<slug>.md');
    }
  }

  const text = fs.readFileSync(file, 'utf8');
  const fm = parseFrontmatter(text);
  if (!fm) {
    add(file, 'frontmatter.missing', 'no leading YAML frontmatter');
    continue;
  }

  let listContext = false;
  for (const line of fm.raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (/^[A-Za-z0-9_-]+:\s*/.test(line)) {
      const key = line.split(':', 1)[0];
      if (!knownFrontmatterKeys.has(key)) add(file, 'frontmatter.unknown-key', key);
      listContext = line.startsWith('tags:') && line.trim() === 'tags:';
      continue;
    }
    if (listContext && /^\s*-\s+/.test(line)) continue;
    if (/^\s/.test(line)) continue;
    add(file, 'frontmatter.unknown-line', line.trim());
  }

  for (const key of ['title', 'tags', 'date', 'source']) {
    if (fm.obj[key] == null || fm.obj[key] === '') add(file, `frontmatter.${key}.missing`);
  }

  if (fm.obj.type != null) add(file, 'frontmatter.type.present', String(fm.obj.type));
  if (fm.obj.source && !allowedSources.has(String(fm.obj.source))) {
    add(file, 'frontmatter.source.invalid', String(fm.obj.source));
  }

  const tags = Array.isArray(fm.obj.tags) ? fm.obj.tags : (fm.obj.tags ? [String(fm.obj.tags)] : []);
  if (!Array.isArray(fm.obj.tags)) add(file, 'tags.not-list');

  const typeTags = tags.filter((tag) => tag.startsWith('type/'));
  const projectTags = tags.filter((tag) => tag.startsWith('project/'));
  if (typeTags.length !== 1) add(file, 'tags.type.count', `${typeTags.length}: ${typeTags.join(', ')}`);
  if (projectTags.length !== 1) add(file, 'tags.project.count', `${projectTags.length}: ${projectTags.join(', ')}`);
  if (tags.length > 5) add(file, 'tags.too-many', `${tags.length} tags`);

  for (const tag of tags) {
    if (!/^[a-z]+\/[a-z0-9-]+$/.test(tag)) add(file, 'tags.shape.invalid', tag);
    else if (!allowedTags.has(tag)) add(file, 'tags.taxonomy.unknown', tag);
  }

  const h1s = [...fm.body.matchAll(/^#\s+(.+)$/gm)].map((m) => m[1].trim());
  if (h1s.length !== 1) add(file, 'h1.count', `${h1s.length} H1s`);
  else if (fm.obj.title && h1s[0] !== fm.obj.title) {
    add(file, 'h1.title.mismatch', `H1="${h1s[0]}" title="${fm.obj.title}"`);
  }

  const firstBodyLine = fm.body.split(/\r?\n/).find((line) => line.trim());
  if (firstBodyLine && !firstBodyLine.startsWith('# ')) add(file, 'h1.position', 'first body content is not H1');

  if (/!\[[^\]]*\]\([^)]+\)/.test(text)) add(file, 'links.markdown-image');
  if (/github\.com\/CINEV\/shotloom\/pull\/\d+/i.test(text)) {
    add(file, 'links.private-pr-url', 'replace private Shotloom PR URL with PR NNN text or internal wikilink');
  }
  if (typeTags.includes('type/devlog') && /\[[^\]]+\]\(https?:\/\//.test(fm.body)) {
    add(file, 'links.external-in-devlog');
  }

  const proseBody = stripCodeForProseChecks(fm.body);
  const inlineTags = [...proseBody.matchAll(/(^|\s)#([A-Za-z0-9][A-Za-z0-9/_-]*)/gm)]
    .map((m) => `#${m[2]}`)
    .filter((tag) => !['#rule', '#failed', '#gotcha'].includes(tag));
  if (inlineTags.length) {
    add(file, 'tags.inline.body', [...new Set(inlineTags)].slice(0, 5).join(', '));
  }
}

const projects = path.join(root, 'projects');
const readmeRequired = [];
if (fs.existsSync(projects)) {
  for (const ent of fs.readdirSync(projects, { withFileTypes: true }).filter((item) => item.isDirectory())) {
    const projectRoot = path.join(projects, ent.name);
    readmeRequired.push(projectRoot);
    for (const durable of ['specs', 'plans', 'topics', 'decisions']) {
      const dir = path.join(projectRoot, durable);
      if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) readmeRequired.push(dir);
    }
    const missions = path.join(projectRoot, 'ops', 'missions');
    if (fs.existsSync(missions) && fs.statSync(missions).isDirectory()) readmeRequired.push(missions);
  }
}

for (const dir of readmeRequired) {
  if (!fs.existsSync(path.join(dir, 'README.md'))) add(dir, 'readme.required.missing', 'project root or durable folder');
}

const byCode = new Map();
for (const issue of issues) byCode.set(issue.code, (byCode.get(issue.code) || 0) + 1);
const sorted = [...byCode.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

console.log(`[obsidian-contract] files: ${files.length}`);
if (issues.length === 0) {
  console.log('[obsidian-contract] clean');
  process.exit(0);
}

console.log(`[obsidian-contract] offenders: ${issues.length}`);
for (const [code, count] of sorted) {
  console.log(`  ${String(count).padStart(4)} ${code}`);
}

console.log('[obsidian-contract] samples:');
for (const issue of issues.slice(0, 40)) {
  const suffix = issue.detail ? ` | ${issue.detail}` : '';
  console.log(`  ${issue.file} | ${issue.code}${suffix}`);
}
if (issues.length > 40) console.log(`  ... +${issues.length - 40} more`);
NODE
fi

# --- empty-dirs (auto-fix) ---
if want empty-dirs; then
  hits=$(find . -type d -empty -not -path './.trash/*' -not -path './.obsidian/*' -not -path './attachments*' 2>/dev/null || true)
  if [[ -z "$hits" ]]; then
    echo "[empty-dirs] clean"
  else
    echo "[empty-dirs] offenders:"
    echo "$hits" | sed 's/^/  /'
    if (( APPLY )); then
      echo "$hits" | while IFS= read -r d; do rmdir "$d" 2>/dev/null || true; done
      echo "[empty-dirs] removed"
    fi
  fi
fi

if (( APPLY == 0 )); then
  echo
  echo "(dry run — pass --apply to rewrite auto-fixable checks)"
fi
