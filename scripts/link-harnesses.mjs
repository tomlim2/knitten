import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AGENT_HUB_ROOT = path.resolve(__dirname, '..');

const agentHubPath = path.join(AGENT_HUB_ROOT, 'agent', 'config', 'agent-hub.json');
const isDryRun = process.argv.includes('--dry-run');
const harnessFilter = getArgValue('--harness');
const REQUIRED_SYMLINK_LAYER_MAPPINGS = ['rules', 'standards', 'skills', 'commands'];

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function resolveHome(filepath) {
  if (filepath.startsWith('~/')) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
}

async function linkHarnesses() {
  if (isDryRun) console.log('\n=== DRY RUN MODE: No changes will be made ===\n');
  console.log(`[link-harnesses] AGENT_HUB_ROOT: ${AGENT_HUB_ROOT}`);
  
  const hubData = JSON.parse(await fs.readFile(agentHubPath, 'utf8'));
  validateHarnessMappings(hubData);

  for (const harness of hubData.harnesses) {
    if (!harness.linkMethod) continue;
    if (harnessFilter && harness.id !== harnessFilter) continue;

    console.log(`\nConfiguring harness: ${harness.displayName}`);
    const targetPath = resolveHome(harness.deployTarget);

    if (harness.linkMethod === 'json-config') {
      await handleJsonConfig(harness, targetPath);
    } else if (harness.linkMethod === 'symlink') {
      await handleSymlinks(harness, targetPath);
    } else {
      console.warn(`Unknown linkMethod: ${harness.linkMethod} for ${harness.id}`);
    }
  }
  if (harnessFilter && !(hubData.harnesses || []).some((harness) => harness.id === harnessFilter)) {
    throw new Error(`Unknown harness: ${harnessFilter}`);
  }
  
  if (isDryRun) console.log('\n=== END DRY RUN ===');
}

function validateHarnessMappings(hubData) {
  const sharedLayerIds = new Set((hubData.sharedLayers || []).map((layer) => layer.id));
  for (const harness of hubData.harnesses || []) {
    if (harness.linkMethod !== 'symlink') continue;
    const mappings = harness.mappings || {};
    for (const layerId of REQUIRED_SYMLINK_LAYER_MAPPINGS) {
      if (sharedLayerIds.has(layerId) && !mappings[layerId]) {
        throw new Error(
          `Harness ${harness.id} is missing required mapping "${layerId}" -> "agent/${layerId}"`,
        );
      }
    }
  }
}

async function handleJsonConfig(harness, targetPath) {
  const targetDir = path.dirname(targetPath);
  if (!isDryRun) await fs.mkdir(targetDir, { recursive: true });

  let config = {};
  try {
    const existing = await fs.readFile(targetPath, 'utf8');
    config = JSON.parse(existing);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  let modified = false;
  for (const [key, paths] of Object.entries(harness.configFormat || {})) {
    const resolvedPaths = paths.map((p) => p.replace('$AGENT_HUB_ROOT', AGENT_HUB_ROOT));
    
    config[key] = config[key] || [];
    for (const p of resolvedPaths) {
      if (!config[key].includes(p)) {
        config[key].push(p);
        modified = true;
      }
    }
  }

  if (modified) {
    console.log(`  [+] ${planned('update JSON config')} at ${targetPath}`);
    if (!isDryRun) {
      await fs.writeFile(targetPath, JSON.stringify(config, null, 2) + '\n');
    }
  } else {
    console.log(`  [=] JSON config already up to date at ${targetPath}`);
  }
}

async function handleSymlinks(harness, deployTarget) {
  if (!harness.mappings) {
    console.log(`  [~] No mappings defined for ${harness.id}`);
    return;
  }

  if (!isDryRun) await fs.mkdir(deployTarget, { recursive: true });
  const backupRoot = path.join(deployTarget, '.agent-hub-backups');

  for (const [targetName, relativeSourcePath] of Object.entries(harness.mappings)) {
    const sourcePath = path.join(AGENT_HUB_ROOT, relativeSourcePath);
    const targetPath = path.join(deployTarget, targetName);

    try {
      const stats = await fs.lstat(targetPath);
      if (stats.isSymbolicLink()) {
        const currentTarget = await fs.readlink(targetPath);
        if (currentTarget === sourcePath) {
          console.log(`  [=] Symlink already correct: ${targetName} -> ${relativeSourcePath}`);
          continue;
        } else {
          console.log(`  [-] ${planned('remove incorrect symlink')}: ${targetName}`);
          if (!isDryRun) await fs.unlink(targetPath);
        }
      } else if (stats.isDirectory() && (await fs.lstat(sourcePath)).isDirectory()) {
        console.log(`  [~] Syncing directory mapping: ${targetName} -> ${relativeSourcePath}`);
        await syncDirectoryMapping(sourcePath, targetPath, targetName);
        continue;
      } else {
        await backupExistingPath(targetPath, backupRoot, targetName);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    console.log(`  [+] ${planned('create symlink')}: ${targetName} -> ${relativeSourcePath}`);
    if (!isDryRun) await fs.symlink(sourcePath, targetPath);
  }
}

async function syncDirectoryMapping(sourceDir, targetDir, targetName) {
  if (!isDryRun) await fs.mkdir(targetDir, { recursive: true });
  await cleanupBrokenTargetSymlinks(sourceDir, targetDir, targetName);

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      console.log(`  [=] Preserving harness-owned hidden entry: ${targetName}/${entry.name}`);
      continue;
    }
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    const displayName = `${targetName}/${entry.name}`;

    try {
      const stats = await fs.lstat(targetPath);
      if (stats.isSymbolicLink()) {
        const currentTarget = await fs.readlink(targetPath);
        if (currentTarget === sourcePath) {
          console.log(`  [=] Symlink already correct: ${displayName}`);
          continue;
        }
        console.log(`  [-] ${planned('remove incorrect symlink')}: ${displayName}`);
        if (!isDryRun) await fs.unlink(targetPath);
      } else {
        await backupExistingPath(targetPath, path.join(targetDir, '.agent-hub-backups'), displayName);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    console.log(`  [+] ${planned('create symlink')}: ${displayName} -> ${sourcePath}`);
    if (!isDryRun) await fs.symlink(sourcePath, targetPath);
  }
}

async function cleanupBrokenTargetSymlinks(sourceDir, targetDir, targetName) {
  let entries = [];
  try {
    entries = await fs.readdir(targetDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (!entry.isSymbolicLink()) continue;

    const targetPath = path.join(targetDir, entry.name);
    const displayName = `${targetName}/${entry.name}`;
    const sourceEntry = path.join(sourceDir, entry.name);
    try {
      await fs.stat(targetPath);
      continue;
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    try {
      await fs.lstat(sourceEntry);
      continue;
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    console.log(`  [-] ${planned('remove stale broken symlink')}: ${displayName}`);
    if (!isDryRun) await fs.unlink(targetPath);
  }
}

async function backupExistingPath(targetPath, backupRoot, displayName) {
  const safeName = displayName.replace(/[\\/]/g, '__');
  const bakPath = path.join(backupRoot, `${safeName}.bak.${Date.now()}`);
  console.log(`  [!] ${planned('back up existing real path')} ${displayName} to ${path.basename(backupRoot)}/${path.basename(bakPath)}`);
  if (!isDryRun) {
    await fs.mkdir(backupRoot, { recursive: true });
    await fs.rename(targetPath, bakPath);
  }
}

function planned(action) {
  return isDryRun ? `Would ${action}` : upperFirst(action);
}

function upperFirst(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

linkHarnesses().catch(err => {
  console.error('Error linking harnesses:', err);
  process.exit(1);
});
