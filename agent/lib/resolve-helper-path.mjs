#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY_PATH = "agent/config/local-helper-paths.json";

function usage() {
  return `Usage:
  resolve-helper-path.mjs [--root <knitten-root>] <helper-id>`;
}

function fail(error, detail, code = 2) {
  process.stdout.write(`${JSON.stringify({ ok: false, error, detail }, null, 2)}\n`);
  process.exit(code);
}

function validateRoot(root) {
  const resolved = path.resolve(root);
  if (!existsSync(path.join(resolved, "SYSTEM.md")) || !existsSync(path.join(resolved, "agent/config/agent-hub.json"))) {
    throw new Error("root is not the Knitten agent-hub checkout");
  }
  return resolved;
}

function resolveRoot(rootOption = null, cwd = process.cwd()) {
  const root = rootOption || execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  }).trim();
  return validateRoot(root);
}

function parseOptions(argv) {
  const options = { root: null, args: [] };
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
      options.args.push(arg);
    }
  }
  return options;
}

function loadRegistry(root) {
  return JSON.parse(readFileSync(path.join(root, REGISTRY_PATH), "utf8"));
}

function safeRegistryPath(value) {
  if (typeof value !== "string" || value.startsWith("/") || value.includes("..")) {
    throw new Error(`invalid helper path: ${JSON.stringify(value)}`);
  }
  const normalized = path.posix.normalize(value);
  if (normalized !== value || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`invalid helper path: ${JSON.stringify(value)}`);
  }
  return value;
}

export function resolveHelperPath({ root = null, args = [], cwd = process.cwd() }) {
  const [id] = args;
  if (!id) throw new Error("missing helper id");
  const knittenRoot = resolveRoot(root, cwd);
  const registry = loadRegistry(knittenRoot);
  const matches = registry.entries.filter((entry) => entry.id === id);
  if (matches.length !== 1) {
    throw new Error(`unknown helper id: ${id}`);
  }
  const entry = matches[0];
  const relativePath = safeRegistryPath(entry.path);
  const absolutePath = path.join(knittenRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`helper path does not exist: ${relativePath}`);
  }
  return {
    ok: true,
    id: entry.id,
    kind: entry.kind,
    root: knittenRoot,
    path: relativePath,
    absolutePath,
  };
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  try {
    const result = resolveHelperPath(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    fail("resolve-failed", error.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
