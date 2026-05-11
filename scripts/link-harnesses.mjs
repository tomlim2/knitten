import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CAOL_ILA_ROOT = path.resolve(__dirname, '..');

const agentHubPath = path.join(CAOL_ILA_ROOT, 'agent', 'config', 'agent-hub.json');

function resolveHome(filepath) {
  if (filepath.startsWith('~/')) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
}

async function linkHarnesses() {
  console.log(`[link-harnesses] CAOL_ILA_ROOT: ${CAOL_ILA_ROOT}`);
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
}

async function handleJsonConfig(harness, targetPath) {
  const targetDir = path.dirname(targetPath);
  await fs.mkdir(targetDir, { recursive: true });

  let config = {};
  try {
    const existing = await fs.readFile(targetPath, 'utf8');
    config = JSON.parse(existing);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  let modified = false;
  for (const [key, paths] of Object.entries(harness.configFormat || {})) {
    const resolvedPaths = paths.map(p => p.replace('$CAOL_ILA_ROOT', CAOL_ILA_ROOT));
    
    config[key] = config[key] || [];
    for (const p of resolvedPaths) {
      if (!config[key].includes(p)) {
        config[key].push(p);
        modified = true;
      }
    }
  }

  if (modified) {
    await fs.writeFile(targetPath, JSON.stringify(config, null, 2) + '\n');
    console.log(`  [+] Updated JSON config at ${targetPath}`);
  } else {
    console.log(`  [=] JSON config already up to date at ${targetPath}`);
  }
}

async function handleSymlinks(harness, targetPath) {
  // Not fully implemented in registry yet, placeholder for symlink logic
  console.log(`  [~] Symlink handling for ${harness.id} is pending mapping definitions in agent-hub.json`);
}

linkHarnesses().catch(err => {
  console.error('Error linking harnesses:', err);
  process.exit(1);
});