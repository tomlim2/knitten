#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";

function usage() {
  console.error(`Usage:
  resolve-repo-path.mjs <repo-key>

Reads ~/.claude/private/agent-hub-config/repo-paths.json and prints the
configured repository path for the requested key.`);
}

const key = process.argv[2];
if (!key || process.argv.length !== 3 || key === "-h" || key === "--help") {
  usage();
  process.exit(key === "-h" || key === "--help" ? 0 : 2);
}

const configPath = join(
  process.env.HOME || "",
  ".claude/private/agent-hub-config/repo-paths.json",
);

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch (error) {
  console.error(`ERROR: unable to read ${configPath}`);
  console.error(error.message);
  process.exit(1);
}

const entry = config[key];
const rawPath = typeof entry === "string" ? entry : entry?.path;
if (!rawPath) {
  console.error(`ERROR: repo key '${key}' not found in ${configPath}`);
  process.exit(1);
}

const resolved = rawPath.replace(/^~(?=\/|$)/, process.env.HOME || "~");
process.stdout.write(`${resolved}\n`);
