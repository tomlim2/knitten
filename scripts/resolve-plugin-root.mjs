#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PLUGIN_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function usage() {
  return `Usage:
  resolve-plugin-root.mjs <knitten|knitten-all-skills>`;
}

function pluginNameFor(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, ".codex-plugin", "plugin.json"), "utf8")).name;
  } catch {
    return "";
  }
}

function firstPluginRoot(name) {
  const envName = `KNITTEN_PLUGIN_${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_ROOT`;
  const candidates = [
    process.env[envName],
    name === "knitten" ? process.env.KNITTEN_CORE_ROOT : "",
    name === "knitten-all-skills" ? process.env.PAYLOAD_PLUGIN_ROOT : "",
    path.join(path.dirname(PLUGIN_ROOT), name),
    path.join(process.env.KNITTEN_PLUGINS_ROOT || path.join(os.homedir(), "plugins"), name),
  ].filter(Boolean);
  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved) && pluginNameFor(resolved) === name) return resolved;
  }
  return "";
}

function main() {
  const [name, ...rest] = process.argv.slice(2);
  if (!name || rest.length || name === "-h" || name === "--help") {
    process.stdout.write(`${usage()}\n`);
    process.exit(name === "-h" || name === "--help" ? 0 : 2);
  }
  const root = firstPluginRoot(name);
  if (!root) {
    console.error(`plugin root not found: ${name}`);
    process.exit(1);
  }
  process.stdout.write(`${root}\n`);
}

main();
