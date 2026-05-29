#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY_PATH = "agent/config/local-helper-paths.json";

function usage() {
  return `Usage:
  prepare-local-bin.mjs [--root <knitten-root>]`;
}

function validateRoot(root) {
  const resolved = path.resolve(root);
  if (!existsSync(path.join(resolved, "SYSTEM.md")) || !existsSync(path.join(resolved, "agent/config/agent-hub.json"))) {
    throw new Error("root is not the Knitten agent-hub checkout");
  }
  return resolved;
}

function parseOptions(argv) {
  const options = { root: null };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--root") {
      options.root = argv[++index];
    } else if (arg?.startsWith("--root=")) {
      options.root = arg.slice("--root=".length);
    } else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return options;
}

function resolveRoot(rootOption = null, cwd = process.cwd()) {
  const root = rootOption || execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  }).trim();
  return validateRoot(root);
}

function main() {
  try {
    const options = parseOptions(process.argv.slice(2));
    const root = resolveRoot(options.root);
    const registry = JSON.parse(readFileSync(path.join(root, REGISTRY_PATH), "utf8"));
    const binDir = path.join(root, ".agent-local/bin");
    mkdirSync(binDir, { recursive: true });
    const created = [];
    for (const entry of registry.entries) {
      const command = entry.command || entry.id;
      const wrapperPath = path.join(binDir, command);
      const body = `#!/usr/bin/env bash
set -euo pipefail
exec node ${JSON.stringify(path.join(root, "agent/lib/run-helper.mjs"))} --root ${JSON.stringify(root)} ${JSON.stringify(entry.id)} -- "$@"
`;
      writeFileSync(wrapperPath, body);
      chmodSync(wrapperPath, 0o755);
      created.push({ command, helper: entry.id, path: path.relative(root, wrapperPath) });
    }
    process.stdout.write(`${JSON.stringify({ ok: true, binDir: path.relative(root, binDir), created }, null, 2)}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ ok: false, error: "prepare-failed", detail: error.message }, null, 2)}\n`);
    process.exit(2);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
