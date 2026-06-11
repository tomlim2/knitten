#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY_PATH = "agent/config/local-artifact-paths.json";
const PLACEHOLDER_PATTERN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;
const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  return `Usage:
  resolve-local-artifact-path.mjs [--root <config-root>] [--registry <path>] [--create] shotloom planning stl-123 brief|spec|design-plan|questions|manifest
  resolve-local-artifact-path.mjs [--root <config-root>] [--registry <path>] [--create] shotloom before-pr stl-123 <safe-branch> readiness|code-blockers|docs-blockers
  resolve-local-artifact-path.mjs [--root <config-root>] [--registry <path>] [--create] shotloom pr <number> watcher-pid|watcher-log|react-log|state|last-event|cache|reply-plan|pause|lock|lock-dir
  resolve-local-artifact-path.mjs [--root <config-root>] [--registry <path>] [--create] shotloom deploy <date-or-version> release-notes|manifest|rollback
  resolve-local-artifact-path.mjs [--root <config-root>] [--registry <path>] [--create] ah reports YYYYMMDD handoff <slug>`;
}

function fail(error, detail, code = 2) {
  process.stdout.write(`${JSON.stringify({ ok: false, error, detail }, null, 2)}\n`);
  process.exit(code);
}

function validateRoot(root) {
  const resolved = path.resolve(root);
  if (!existsSync(path.join(resolved, ".codex-plugin/plugin.json")) || !existsSync(path.join(resolved, "agent/config/local-artifact-paths.json"))) {
    throw new Error("root is not a plugin checkout with agent/config/local-artifact-paths.json");
  }
  return resolved;
}

function rootHasRegistry(root, registryPath = REGISTRY_PATH) {
  const resolved = path.resolve(root);
  return existsSync(path.join(resolved, ".codex-plugin/plugin.json"))
    && existsSync(path.join(resolved, registryPath));
}

function parseOptions(argv) {
  const options = { root: null, registry: null, create: false, args: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--create") {
      options.create = true;
    } else if (arg === "--root") {
      options.root = argv[++index];
    } else if (arg?.startsWith("--root=")) {
      options.root = arg.slice("--root=".length);
    } else if (arg === "--registry") {
      options.registry = argv[++index];
    } else if (arg?.startsWith("--registry=")) {
      options.registry = arg.slice("--registry=".length);
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
  const candidates = [
    rootOption,
    process.env.KNITTEN_CONFIG_ROOT,
    process.env.KNITTEN_CORE_ROOT,
    PLUGIN_ROOT,
    path.join(process.env.KNITTEN_PLUGINS_ROOT || path.join(process.env.HOME || "", "plugins"), "knitten"),
    path.join(process.env.HOME || "", "plugins", "knitten"),
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (rootHasRegistry(candidate)) return path.resolve(candidate);
  }
  const gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  }).trim();
  return validateRoot(gitRoot);
}

function resolveRegistryPath(root, registryPath = null) {
  const selected = registryPath || process.env.AGENT_HUB_LOCAL_ARTIFACT_PATHS_REGISTRY || REGISTRY_PATH;
  return path.isAbsolute(selected) ? selected : path.join(root, selected);
}

function loadRegistry(root, registryPath = null) {
  const selectedRegistryPath = resolveRegistryPath(root, registryPath);
  if (!existsSync(selectedRegistryPath)) {
    throw new Error(`local artifact path registry does not exist: ${selectedRegistryPath}`);
  }
  return JSON.parse(readFileSync(selectedRegistryPath, "utf8"));
}

function assertRegistryShape(registry) {
  if (!registry || registry.schemaVersion !== 1 || registry.root !== ".agent-local" || !Array.isArray(registry.entries)) {
    throw new Error("local artifact path registry must have schemaVersion 1, root .agent-local, and entries[]");
  }
}

function loadValidatedRegistry(root, registryPath = null) {
  const registry = loadRegistry(root, registryPath);
  assertRegistryShape(registry);
  return registry;
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

export function resolveLocalArtifactPath({ root = null, registryPath = null, create = false, args = [], cwd = process.cwd() }) {
  const knittenRoot = resolveRoot(root, cwd);
  const registry = loadValidatedRegistry(knittenRoot, registryPath);
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
  const result = {
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
  if (entry.template) {
    result.template = entry.template;
    result.absoluteTemplatePath = path.isAbsolute(entry.template) ? entry.template : path.join(knittenRoot, entry.template);
  }
  if (entry.schemaKind) {
    result.schemaKind = entry.schemaKind;
  }
  return result;
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  try {
    const result = resolveLocalArtifactPath({
      root: options.root,
      registryPath: options.registry,
      create: options.create,
      args: options.args,
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    fail("resolve-failed", error.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
