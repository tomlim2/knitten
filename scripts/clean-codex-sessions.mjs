#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const usage = `Usage:
  node scripts/clean-codex-sessions.mjs [--execute] [--older-than-days N] [--include-backups] [--codex-home PATH] [--json]

Default mode is dry-run. Add --execute to delete.

Deletes:
  - <codex-home>/sessions/*
  - <codex-home>/archived_sessions/*
  - <codex-home>/shell_snapshots/*

Optional:
  - --include-backups deletes <codex-home>/backups/delete-threads-*

Preserves auth, config, plugins, skills, goals, memories, state DBs, and log DBs.
`;

const args = process.argv.slice(2);
const options = {
  execute: false,
  includeBackups: false,
  json: false,
  olderThanDays: 0,
  codexHome: process.env.CODEX_HOME || path.join(os.homedir(), ".codex"),
};

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--execute") {
    options.execute = true;
  } else if (arg === "--include-backups") {
    options.includeBackups = true;
  } else if (arg === "--json") {
    options.json = true;
  } else if (arg === "--older-than-days") {
    const value = args[++i];
    if (!value || Number.isNaN(Number(value)) || Number(value) < 0) {
      fail("Invalid --older-than-days value");
    }
    options.olderThanDays = Number(value);
  } else if (arg === "--codex-home") {
    const value = args[++i];
    if (!value) fail("Missing --codex-home value");
    options.codexHome = value;
  } else if (arg === "--help" || arg === "-h") {
    console.log(usage);
    process.exit(0);
  } else {
    fail(`Unknown argument: ${arg}`);
  }
}

const codexHome = path.resolve(options.codexHome);
const cutoffMs =
  options.olderThanDays > 0
    ? Date.now() - options.olderThanDays * 24 * 60 * 60 * 1000
    : 0;

const plan = [];

await assertSafeCodexHome(codexHome);
await collectChildren(path.join(codexHome, "sessions"), "session");
await collectChildren(path.join(codexHome, "archived_sessions"), "archived-session");
await collectChildren(path.join(codexHome, "shell_snapshots"), "shell-snapshot");

if (options.includeBackups) {
  await collectChildren(path.join(codexHome, "backups"), "delete-thread-backup", {
    namePrefix: "delete-threads-",
  });
}

const totalBytes = plan.reduce((sum, item) => sum + item.bytes, 0);

if (options.execute) {
  for (const item of plan) {
    await fs.rm(item.path, { recursive: true, force: true });
  }
}

const result = {
  ok: true,
  mode: options.execute ? "execute" : "dry-run",
  codexHome,
  olderThanDays: options.olderThanDays,
  includeBackups: options.includeBackups,
  count: plan.length,
  bytes: totalBytes,
  humanBytes: formatBytes(totalBytes),
  deleted: options.execute ? plan : [],
  candidates: options.execute ? [] : plan,
};

if (options.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`${result.mode}: ${result.count} candidate(s), ${result.humanBytes}`);
  if (!options.execute) {
    console.log("No files deleted. Re-run with --execute to delete.");
  }
  for (const item of plan) {
    console.log(`${options.execute ? "deleted" : "candidate"}\t${formatBytes(item.bytes)}\t${item.kind}\t${item.path}`);
  }
}

async function collectChildren(root, kind, filters = {}) {
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }

  for (const entry of entries) {
    if (entry.name === "." || entry.name === "..") continue;
    if (filters.namePrefix && !entry.name.startsWith(filters.namePrefix)) continue;

    const target = path.join(root, entry.name);
    const stat = await fs.lstat(target);
    if (cutoffMs && stat.mtimeMs > cutoffMs) continue;

    plan.push({
      kind,
      path: target,
      bytes: await sizeOf(target),
      mtime: stat.mtime.toISOString(),
    });
  }
}

async function assertSafeCodexHome(dir) {
  const stat = await fs.stat(dir).catch((error) => {
    if (error.code === "ENOENT") fail(`Codex home does not exist: ${dir}`);
    throw error;
  });
  if (!stat.isDirectory()) fail(`Codex home is not a directory: ${dir}`);

  const basename = path.basename(dir);
  if (basename !== ".codex") {
    fail(`Refusing non-.codex directory: ${dir}`);
  }

  const authPath = path.join(dir, "auth.json");
  const configPath = path.join(dir, "config.toml");
  const hasAuth = await exists(authPath);
  const hasConfig = await exists(configPath);
  if (!hasAuth && !hasConfig) {
    fail(`Refusing directory without auth.json or config.toml marker: ${dir}`);
  }
}

async function sizeOf(target) {
  const stat = await fs.lstat(target);
  if (!stat.isDirectory()) return stat.size;

  let total = 0;
  const stack = [target];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const child = path.join(current, entry.name);
      let childStat;
      try {
        childStat = await fs.lstat(child);
      } catch {
        continue;
      }
      total += childStat.size;
      if (childStat.isDirectory() && !childStat.isSymbolicLink()) {
        stack.push(child);
      }
    }
  }
  return total;
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)}${units[unitIndex]}`;
}

function fail(message) {
  if (options.json) {
    console.log(JSON.stringify({ ok: false, error: message }, null, 2));
  } else {
    console.error(message);
    console.error(usage);
  }
  process.exit(2);
}
