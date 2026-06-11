#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function usage() {
  return `Usage:
  resolve-repo.mjs <repo-key>

Resolves a repository key from environment variables or local-private Knitten
configuration.`;
}

function envNameFor(key, suffix) {
  return `KNITTEN_REPO_${String(key).toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_${suffix}`;
}

function expandHome(value) {
  return String(value).replace(/^~(?=\/|$)/, os.homedir());
}

function readConfig(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function pathFromConfig(config, key) {
  const value = config[key];
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.path === "string") return value.path;
  return "";
}

function main() {
  const [key, ...rest] = process.argv.slice(2);
  if (!key || rest.length || key === "-h" || key === "--help") {
    process.stdout.write(`${usage()}\n`);
    process.exit(key === "-h" || key === "--help" ? 0 : 2);
  }

  const localConfigDir = process.env.KNITTEN_LOCAL_CONFIG_DIR
    ? path.resolve(process.env.KNITTEN_LOCAL_CONFIG_DIR)
    : path.join(os.homedir(), ".config", "knitten");
  const config = readConfig(path.join(localConfigDir, "repo-paths.json"));
  const candidates = [
    process.env[envNameFor(key, "ROOT")],
    process.env[envNameFor(key, "PATH")],
    pathFromConfig(config, key),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(expandHome(candidate));
    if (fs.existsSync(resolved)) {
      process.stdout.write(`${resolved}\n`);
      return;
    }
  }

  console.error(`repo key not found: ${key}`);
  console.error(`checked ${envNameFor(key, "ROOT")}, ${envNameFor(key, "PATH")}, and ${path.join(localConfigDir, "repo-paths.json")}`);
  process.exit(1);
}

main();
