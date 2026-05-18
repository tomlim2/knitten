import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AGENT_HUB_ROOT = path.resolve(__dirname, '..');

const agentHubPath = path.join(AGENT_HUB_ROOT, 'agent', 'config', 'agent-hub.json');
const isDryRun = process.argv.includes('--dry-run');

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

  for (const harness of hubData.harnesses) {
    if (!harness.linkMethod) continue;

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
  
  if (isDryRun) console.log('\n=== END DRY RUN ===');
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
    console.log(`  [+] Would update JSON config at ${targetPath}`);
    if (!isDryRun) {
      await fs.writeFile(targetPath, JSON.stringify(config, null, 2) + '\n');
      console.log(`  [+] Updated JSON config at ${targetPath}`);
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
          console.log(`  [-] Would remove incorrect symlink: ${targetName}`);
          if (!isDryRun) await fs.unlink(targetPath);
        }
      } else {
        const bakPath = `${targetPath}.bak.${Date.now()}`;
        console.log(`  [!] Would back up existing real path ${targetName} to ${path.basename(bakPath)}`);
        if (!isDryRun) await fs.rename(targetPath, bakPath);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    console.log(`  [+] Would create symlink: ${targetName} -> ${relativeSourcePath}`);
    if (!isDryRun) await fs.symlink(sourcePath, targetPath);
  }
}

linkHarnesses().catch(err => {
  console.error('Error linking harnesses:', err);
  process.exit(1);
});
