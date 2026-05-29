#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY_PATH = "agent/config/local-artifact-paths.json";
const PLACEHOLDER_PATTERN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

function usage() {
  return `Usage:
  resolve-local-artifact-path.mjs [--root <knitten-root>] [--create] shotloom planning stl-123 brief|spec|design-plan|questions|manifest
  resolve-local-artifact-path.mjs [--root <knitten-root>] [--create] shotloom before-pr stl-123 <safe-branch> readiness|code-blockers|docs-blockers
  resolve-local-artifact-path.mjs [--root <knitten-root>] [--create] shotloom pr <number> watcher-pid|watcher-log|react-log|state|last-event|log|reply-plan|pause|lock|lock-dir
  resolve-local-artifact-path.mjs [--root <knitten-root>] [--create] shotloom deploy <date-or-version> release-notes|manifest|rollback
  resolve-local-artifact-path.mjs [--root <knitten-root>] [--create] ah operational-findings YYYY-MM-DD inbox
  resolve-local-artifact-path.mjs [--root <knitten-root>] [--create] ah operational-findings YYYY-MM-DD report <slug>`;
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

function parseOptions(argv) {
  const options = { root: null, create: false, args: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--create") {
      options.create = true;
    } else if (arg === "--root") {
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

function resolveRoot(rootOption = null, cwd = process.cwd()) {
  const root = rootOption || execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  }).trim();
  return validateRoot(root);
}

function loadRegistry(root) {
  const registryPath = path.join(root, REGISTRY_PATH);
  return JSON.parse(readFileSync(registryPath, "utf8"));
}

function entryKey(entry) {
  return `${entry.owner}/${entry.artifactType}/${entry.item}`;
}

function argPosition(arg) {
  return arg.position || "before-item";
}

function normalizeArg(value, arg) {
  return arg.normalize === "lowercase" ? value.toLowerCase() : value;
}

function assertCleanSegment(value, label) {
  if (!value || value.includes("/") || value.includes("..")) {
    throw new Error(`${label} contains invalid path characters`);
  }
}

function validateArg(value, arg) {
  assertCleanSegment(value, arg.name);
  const pattern = new RegExp(arg.pattern);
  if (!pattern.test(value)) {
    throw new Error(`${arg.name} does not match ${arg.pattern}`);
  }
  return normalizeArg(value, arg);
}

function renderTemplate(template, values) {
  return template.replaceAll(PLACEHOLDER_PATTERN, (_match, name) => {
    if (!Object.hasOwn(values, name)) {
      throw new Error(`template references undeclared arg: ${name}`);
    }
    return values[name];
  });
}

function ensureLocalPath(rendered, label) {
  if (!rendered.startsWith(".agent-local/")) {
    throw new Error(`${label} must start with .agent-local/`);
  }
  const normalized = path.posix.normalize(rendered);
  if (normalized !== rendered || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`${label} must not contain path traversal`);
  }
  return rendered;
}

function findEntry(registry, owner, artifactType, item) {
  const entries = registry.entries.filter(
    (entry) => entry.owner === owner && entry.artifactType === artifactType && entry.item === item,
  );
  if (entries.length !== 1) {
    throw new Error(`unknown local artifact entry: ${owner} ${artifactType} ${item || "(missing item)"}`);
  }
  return entries[0];
}

function parseCommand(registry, args) {
  const [owner, artifactType, ...tokens] = args;
  if (!owner) throw new Error("missing owner");
  if (!artifactType) throw new Error("missing artifact type");
  const candidates = registry.entries.filter((entry) => entry.owner === owner && entry.artifactType === artifactType);
  if (candidates.length === 0) {
    throw new Error(`unknown local artifact type: ${owner} ${artifactType}`);
  }

  for (let itemIndex = 0; itemIndex < tokens.length; itemIndex++) {
    const item = tokens[itemIndex];
    if (!candidates.some((entry) => entry.item === item)) {
      continue;
    }
    const entry = findEntry(registry, owner, artifactType, item);
    const beforeArgs = entry.args.filter((arg) => argPosition(arg) === "before-item");
    const afterArgs = entry.args.filter((arg) => argPosition(arg) === "after-item");
    const beforeTokens = tokens.slice(0, itemIndex);
    const afterTokens = tokens.slice(itemIndex + 1);
    if (beforeTokens.length !== beforeArgs.length || afterTokens.length !== afterArgs.length) {
      continue;
    }
    const values = {};
    beforeArgs.forEach((arg, index) => {
      values[arg.name] = validateArg(beforeTokens[index], arg);
    });
    afterArgs.forEach((arg, index) => {
      values[arg.name] = validateArg(afterTokens[index], arg);
    });
    return { entry, values };
  }

  const knownItems = candidates.map((entry) => entry.item).sort().join("|");
  throw new Error(`unknown local artifact item for ${owner} ${artifactType}; expected ${knownItems}`);
}

export function resolveLocalArtifactPath({ root = null, create = false, args = [], cwd = process.cwd() }) {
  const knittenRoot = resolveRoot(root, cwd);
  const registry = loadRegistry(knittenRoot);
  const { entry, values } = parseCommand(registry, args);
  if (!["file", "directory"].includes(entry.kind)) {
    throw new Error(`unknown local artifact kind: ${entry.kind}`);
  }
  const relativePath = ensureLocalPath(renderTemplate(entry.path, values), "path");
  const cleanupPath = ensureLocalPath(renderTemplate(entry.cleanupPath, values), "cleanupPath");
  const absolutePath = path.join(knittenRoot, relativePath);
  const absoluteCleanupPath = path.join(knittenRoot, cleanupPath);
  if (create) {
    if (entry.kind === "directory") {
      mkdirSync(absolutePath, { recursive: true });
    } else {
      mkdirSync(path.dirname(absolutePath), { recursive: true });
    }
  }
  return {
    ok: true,
    owner: entry.owner,
    artifactType: entry.artifactType,
    item: entry.item,
    kind: entry.kind,
    root: knittenRoot,
    path: relativePath,
    absolutePath,
    cleanupPath,
    absoluteCleanupPath,
  };
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  try {
    const result = resolveLocalArtifactPath(options);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    fail("resolve-failed", error.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
