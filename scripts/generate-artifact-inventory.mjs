import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUTPUT_PATH = 'agent/config/artifact-inventory.json';
const REVIEWED_DECISIONS_PATH = 'agent/config/artifact-inventory-reviewed-decisions.json';

const TRACKED_OR_NEW_ARGS = ['ls-files', '--cached', '--others', '--exclude-standard'];

const CORE_PATH_PREFIXES = [
  'agent/config/',
  'agent/lib/',
  'agent/document-templates/agent-hub/',
  'agent/document-templates/github/',
  'agent/rules/',
  'agent/vendor/',
  'docs/reference/',
  'scripts/generate-artifact-inventory.mjs',
  'scripts/install-artifact-pack.mjs',
  'scripts/merge-artifact-pack-registries.mjs',
  'scripts/resolve-artifact-route.mjs',
  'docs/milestones/',
  'scripts/validate-llm-first.mjs',
  'scripts/worktree-',
];

const CORE_EXACT_PATHS = new Set([
  '.github/pull_request_template.md',
  '.github/workflows/validate.yml',
  'AGENT-HUB.md',
  'README.md',
  'SYSTEM.md',
  'agent/AGENTS.md',
  'agent/CLAUDE.md',
  'agent/document-templates/README.md',
  'agent/repo-registry.json',
  'agent/settings.json',
]);

const DOMAIN_PREFIXES = [
  'algorithmic-',
  'brand-',
  'canvas-',
  'claude-',
  'consulting-',
  'cci-',
  'design-',
  'dev-',
  'drink-',
  'frontend-',
  'git-',
  'hatch-',
  'image-',
  'learn-',
  'obsidian-',
  'pmx-',
  'review-',
  'shotloom-',
  'system-',
  'tutoring-',
  'ue-',
  'video-',
  'vrm-',
  'writing-',
];

const DOMAIN_OWNER_PREFIXES = DOMAIN_PREFIXES.filter((prefix) => !['cci-', 'shotloom-'].includes(prefix));

const DOMAIN_SUPPORT_PATH_PARTS = [
  '/algorithmic-',
  '/brand-',
  '/canvas-',
  '/claude-',
  '/consulting-',
  '/design-',
  '/dev-',
  '/drink-',
  '/frontend-',
  '/git-',
  '/hatch-',
  '/hyperframes',
  '/image-',
  '/learn-',
  '/obsidian',
  '/pmx-',
  '/review-',
  '/system-',
  '/tools/',
  '/tutoring-',
  '/ue-',
  '/video-',
  '/vrm-',
  '/writing-',
];

const PRIVATE_SIGNAL_PARTS = [
  'shotloom',
  '/shotloom/',
  'shotloom-',
  'cinev',
  '/cinev/',
  'cci-',
  'CINEV',
  'Slack',
  'slack',
  'Linear',
  'linear',
  'deploy',
  'obsidian',
];

const PERSONAL_PATH_PREFIXES = [
  'drinks/',
  'project-logs/',
];

const PILOT_SKILL_CLASSIFICATIONS = {
  'ah-manage-spec': {
    skillKind: 'workflow-with-notes',
    extractions: [
      extraction('review-checklist', '## Review Workflow', 'judgment', 'standard', 'rubric', 'agent/standards/authoring/spec-review.md', 'no', 'unknown', 'blocked'),
      extraction('archive-delete-policy', '## Archive And Delete', 'lifecycle-policy', 'standard', 'guide', 'agent/standards/policy/spec-lifecycle.md', 'yes', 'unknown', 'blocked'),
    ],
  },
  'ah-route-plan': {
    skillKind: 'workflow-only',
    reviewState: 'accepted',
    extractions: [],
  },
  'shotloom-review-before-pr': {
    skillKind: 'workflow-with-notes',
    reviewState: 'accepted',
    extractions: [
      extraction('review-mode-decision', '### Step 2: Review Mode Decision', 'judgment', 'skill', 'reference', 'agent/skills/shotloom-review-before-pr/references/REVIEW_MODE.md', 'yes', 'yes', 'accepted'),
      extraction('triad-review-rubric', '### Step 3: Selected Main Review', 'judgment', 'skill', 'rubric', 'agent/skills/shotloom-review-before-pr/references/TRIAD_REVIEW.md', 'yes', 'yes', 'accepted'),
    ],
  },
  'obsidian-obsidian-markdown': {
    skillKind: 'reference-heavy',
    extractions: [
      extraction('wikilink-syntax', '## Internal Links (Wikilinks)', 'domain-reference', 'skill', 'reference', 'agent/skills/obsidian-obsidian-markdown/references/OBSIDIAN-FORMAT.md', 'no', 'unknown', 'accepted'),
      extraction('embed-syntax', '## Embeds', 'domain-reference', 'skill', 'reference', 'agent/skills/obsidian-obsidian-markdown/references/EMBEDS.md', 'no', 'unknown', 'blocked'),
      extraction('complete-example', '## Complete Example', 'example', 'skill', 'example', 'agent/skills/obsidian-obsidian-markdown/references/OBSIDIAN-FORMAT.md', 'no', 'unknown', 'accepted'),
    ],
  },
  'hatch-pet': {
    skillKind: 'guide-heavy',
    extractions: [
      extraction('storage-controls', '## Storage Controls', 'lifecycle-policy', 'skill', 'guide', 'agent/skills/hatch-pet/references/STORAGE-CONTROLS.md', 'yes', 'unknown', 'blocked'),
      extraction('brand-discovery', '## Brand Discovery', 'judgment', 'skill', 'guide', 'agent/skills/hatch-pet/references/BRAND-DISCOVERY.md', 'no', 'unknown', 'blocked'),
      extraction('pet-safe-styles', '## Pet-Safe Styles', 'judgment', 'skill', 'rubric', 'agent/skills/hatch-pet/references/PET-SAFE-STYLES.md', 'yes', 'unknown', 'blocked'),
      extraction('transparency-effects', '## Transparency And Effects', 'judgment', 'skill', 'rubric', 'agent/skills/hatch-pet/references/TRANSPARENCY-EFFECTS.md', 'yes', 'yes', 'blocked'),
    ],
  },
};

const REVIEWED_CORE_SKILL_ROLES = {
  'ah-setup-harness': 'bootstrap',
  'ah-resolve-doc-path': 'bootstrap',
  'ah-route-plan': 'router',
  'ah-route-review': 'router',
  'ah-route-implementation': 'router',
  'ah-report-finding': 'router',
  'ah-manage-artifact': 'lifecycle',
  'ah-manage-config': 'lifecycle',
  'ah-manage-document-template': 'lifecycle',
  'ah-manage-milestone': 'lifecycle',
  'ah-manage-skill': 'lifecycle',
  'ah-make-rule': 'lifecycle',
  'ah-make-skill': 'lifecycle',
  'ah-make-standard': 'lifecycle',
  'ah-update-skill': 'lifecycle',
  'ah-edit-skill': 'lifecycle',
  'ah-delete-skill': 'lifecycle',
  'ah-audit-skill': 'lifecycle',
  'ah-review-implementation': 'lifecycle',
  'ah-brief-today': 'none',
  'ah-browse-standards': 'none',
  'ah-grant-perms': 'none',
  'ah-revoke-perms': 'none',
  'ah-guide-private': 'none',
  'ah-log-postmortem': 'none',
  'ah-show-patterns': 'none',
  'ah-manage-spec': 'lifecycle',
};

const MIGRATE_LATER_SKILL_NAMES = new Set([
  'ah-manage-spec',
]);

async function main() {
  const files = await listRepoFiles();
  const rows = [];

  for (const file of files) {
    if (shouldSkip(file)) continue;
    const skillName = skillNameFor(file);
    if (skillName) {
      rows.push(await makeSkillRow(file, skillName));
      rows.push(...makePilotExtractionRows(file, skillName));
      continue;
    }

    const artifactType = artifactTypeFor(file);
    if (!artifactType) continue;
    rows.push(makeArtifactRow(file, artifactType));
  }

  await applyReviewedDecisions(rows);
  rows.sort((a, b) => a['row-id'].localeCompare(b['row-id']));
  const inventory = {
    'schema-version': 1,
    'generated-at': process.env.ARTIFACT_INVENTORY_GENERATED_AT || new Date().toISOString(),
    'source-commit': await sourceCommit(),
    'source-dirty': await sourceDirty(),
    rows,
  };

  await fs.writeFile(path.join(REPO_ROOT, OUTPUT_PATH), `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(`wrote ${OUTPUT_PATH} (${rows.length} rows)`);
}

async function applyReviewedDecisions(rows) {
  const decisionPath = path.join(REPO_ROOT, REVIEWED_DECISIONS_PATH);
  let payload;
  try {
    payload = JSON.parse(await fs.readFile(decisionPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }
  const decisions = new Map((payload.decisions || []).map((decision) => [decision['row-id'], decision]));
  for (const row of rows) {
    const decision = decisions.get(row['row-id']);
    if (!decision) continue;
    row['classification-stage'] = decision['classification-stage'];
    row['proposed-destination'] = decision['proposed-destination'];
    row['review-state'] = decision['review-state'];
  }
}

async function listRepoFiles() {
  const { stdout } = await execFileAsync('git', TRACKED_OR_NEW_ARGS, { cwd: REPO_ROOT });
  const files = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
  const existing = [];
  for (const file of files) {
    try {
      await fs.access(path.join(REPO_ROOT, file));
      existing.push(file);
    } catch {
      // Deleted-but-still-tracked files remain in git ls-files before staging.
    }
  }
  return existing;
}

async function sourceCommit() {
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT });
  return stdout.trim();
}

async function sourceDirty() {
  const { stdout } = await execFileAsync('git', ['status', '--porcelain', '--untracked-files=normal'], { cwd: REPO_ROOT });
  return stdout.trim().length > 0;
}

function shouldSkip(file) {
  return (
    file === OUTPUT_PATH ||
    file.startsWith('.git/') ||
    file.startsWith('.worktrees/') ||
    file.startsWith('agent/private/') ||
    file.includes('/node_modules/') ||
    file.includes('/target/')
  );
}

function skillNameFor(file) {
  const match = file.match(/^agent\/skills\/([^/]+)\/SKILL\.md$/);
  return match?.[1] || null;
}

async function makeSkillRow(file, skillName) {
  const text = await fs.readFile(path.join(REPO_ROOT, file), 'utf8');
  const pilot = PILOT_SKILL_CLASSIFICATIONS[skillName];
  const extractionCount = pilot?.extractions.length || 0;
  const migrateLater = MIGRATE_LATER_SKILL_NAMES.has(skillName);
  return {
    ...commonRow(`skill:${file}`, 'skill', file, 'skill', {
      reviewState: pilotReviewState(pilot),
      migrateLater,
    }),
    'skill-size': classifySkillSize(text),
    'skill-kind': pilot?.skillKind || classifySkillKind(text),
    'core-skill-role': classifyCoreSkillRole(skillName),
    'extraction-count': extractionCount,
    'split-readiness': classifySplitReadiness(pilot?.extractions || []),
  };
}

function makeArtifactRow(file, artifactType) {
  return commonRow(`artifact:${file}`, 'artifact', file, artifactType);
}

function makePilotExtractionRows(file, skillName) {
  const pilot = PILOT_SKILL_CLASSIFICATIONS[skillName];
  if (!pilot) return [];
  const parentRowId = `skill:${file}`;
  return pilot.extractions.map((item) => ({
    ...commonRow(`extraction:${file}#${item.id}`, 'extraction-item', file, 'skill', {
      reviewState: item.reviewState,
      migrateLater: skillName === 'ah-manage-spec' && item.reviewState === 'blocked',
    }),
    'parent-row-id': parentRowId,
    'extraction-id': item.id,
    'source-section': item.sourceSection,
    'content-kind': item.contentKind,
    'extracted-artifact-type': item.extractedArtifactType,
    'artifact-subkind': item.artifactSubkind,
    'target-path': item.targetPath,
    'required-at-runtime': item.requiredAtRuntime,
    'validation-needed': item.validationNeeded,
  }));
}

function commonRow(rowId, rowType, sourcePath, artifactType, options = {}) {
  const classificationStage = options.migrateLater ? 'migrate-later' : 'undecided';
  const proposedDestination = options.migrateLater ? 'migrate-later' : 'undecided';
  return {
    'row-id': rowId,
    'row-type': rowType,
    'source-artifact-path': sourcePath,
    'artifact-type': artifactType,
    'owner-domain': ownerDomainFor(sourcePath),
    'privacy-risk': privacyRiskFor(sourcePath),
    dependencies: [],
    'proposed-destination': proposedDestination,
    'compatibility-need': 'unknown',
    'classification-stage': classificationStage,
    'review-state': options.reviewState || 'pending',
  };
}

function pilotReviewState(pilot) {
  if (!pilot) return 'pending';
  if (pilot.reviewState) return pilot.reviewState;
  if (pilot.extractions.some((item) => item.reviewState === 'blocked')) return 'blocked';
  if (pilot.extractions.some((item) => item.reviewState === 'accepted')) return 'accepted';
  return 'pending';
}

function artifactTypeFor(file) {
  if (file.startsWith('agent/rules/') && file.endsWith('.md')) return 'rule';
  if (file.startsWith('agent/standards/') && file.endsWith('.md')) return 'standard';
  if (file.startsWith('agent/config/')) return 'config';
  if (file.startsWith('scripts/')) return 'script';
  if (file.startsWith('tests/') || file.includes('/fixtures/') || file.endsWith('.fixture.json')) return 'fixture';
  if (file === 'README.md' || file === 'AGENT-HUB.md') return 'generated-view';
  if (file.endsWith('.md') || file.startsWith('docs/') || file.startsWith('agent/document-templates/')) return 'doc';
  if (file.startsWith('.github/') || file.endsWith('.json') || file.endsWith('.toml') || file.endsWith('.yml') || file.endsWith('.yaml')) return 'config';
  return null;
}

function ownerDomainFor(file) {
  if (CORE_EXACT_PATHS.has(file)) return 'core';
  if (CORE_PATH_PREFIXES.some((prefix) => file.startsWith(prefix))) return 'core';
  if (isCoreTestPath(file)) return 'core';
  if (file.startsWith('agent/skills/ah-')) return 'core';
  if (file.includes('/shotloom/') || file.includes('shotloom-')) return 'repo';
  if (file.includes('/cinev/') || file.includes('cci-')) return 'company';
  if (PERSONAL_PATH_PREFIXES.some((prefix) => file.startsWith(prefix))) return 'personal';
  if (file.startsWith('examples/artifact-packs/')) return 'domain';
  if (isDomainPath(file)) return 'domain';
  return 'unknown';
}

function privacyRiskFor(file) {
  if (PERSONAL_PATH_PREFIXES.some((prefix) => file.startsWith(prefix))) return 'private-only';
  if (hasPrivateSignal(file)) {
    return 'needs-scrub';
  }
  if (CORE_EXACT_PATHS.has(file)) return 'public-safe';
  if (CORE_PATH_PREFIXES.some((prefix) => file.startsWith(prefix))) return 'public-safe';
  if (isCoreTestPath(file)) return 'public-safe';
  if (file.startsWith('examples/artifact-packs/')) return 'public-safe';
  if (ownerDomainFor(file) === 'core') return 'public-safe';
  if (ownerDomainFor(file) === 'domain') return 'public-safe';
  return 'unknown';
}

function isCoreTestPath(file) {
  if (!file.startsWith('tests/')) return false;
  return (
    file.includes('artifact') ||
    file.includes('agent') ||
    file.includes('output') ||
    file.includes('routing') ||
    file.includes('skill')
  );
}

function isDomainPath(file) {
  const skillName = skillNameFor(file);
  if (skillName && DOMAIN_OWNER_PREFIXES.some((prefix) => skillName.startsWith(prefix))) return true;
  if (DOMAIN_SUPPORT_PATH_PARTS.some((part) => file.includes(part))) return true;
  return false;
}

function hasPrivateSignal(file) {
  return PRIVATE_SIGNAL_PARTS.some((part) => file.includes(part));
}

function classifyCoreSkillRole(skillName) {
  if (REVIEWED_CORE_SKILL_ROLES[skillName]) return REVIEWED_CORE_SKILL_ROLES[skillName];
  if (skillName.startsWith('ah-')) return 'none';
  if (skillName.startsWith('shotloom-')) return 'repo-specific';
  if (DOMAIN_PREFIXES.some((prefix) => skillName.startsWith(prefix))) return 'domain';
  return 'none';
}

function classifySkillSize(text) {
  const lineCount = text.split('\n').length;
  if (lineCount <= 80) return 'tiny';
  if (lineCount <= 160) return 'small';
  if (lineCount <= 260) return 'medium';
  if (lineCount <= 400) return 'large';
  return 'huge';
}

function classifySkillKind(text) {
  const extractionHeadingCount = countMatches(
    text,
    /^##\s+.*(Examples?|Guidelines?|Rubric|Reference|Checklist|Policy|Template|Decision|Taxonomy|Format|Prompt)/gim,
  );
  const lineCount = text.split('\n').length;

  if (extractionHeadingCount >= 3) {
    if (/Rubric|Guidelines?|Policy|Decision|Taxonomy|Format/i.test(text)) return 'guide-heavy';
    return 'reference-heavy';
  }
  if (extractionHeadingCount >= 1 || lineCount > 220) return 'workflow-with-notes';
  return 'workflow-only';
}

function classifySplitReadiness(extractions) {
  if (extractions.length === 0) return 'none';
  if (extractions.some((item) => item.targetPath === 'undecided')) return 'blocked';
  if (extractions.length === 1) return 'low';
  return 'ready';
}

function countMatches(value, regex) {
  return Array.from(value.matchAll(regex)).length;
}

function extraction(
  id,
  sourceSection,
  contentKind,
  extractedArtifactType,
  artifactSubkind,
  targetPath,
  requiredAtRuntime,
  validationNeeded,
  reviewState = 'pending',
) {
  return {
    id,
    sourceSection,
    contentKind,
    extractedArtifactType,
    artifactSubkind,
    targetPath,
    requiredAtRuntime,
    validationNeeded,
    reviewState,
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
