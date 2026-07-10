#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveLocalArtifactPath } from "./resolve-local-artifact-path.mjs";

const REGISTRY_PATH = "agent/config/outputs.json";
const PLACEHOLDER_PATTERN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;
const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  return `Usage:
  resolve-output.mjs [--root <config-root>] [--outputs-registry <path>] [--local-artifact-registry <path>] [--create] <output-id> [name=value ...]
  resolve-output.mjs [--root <config-root>] [--outputs-registry <path>] --list

Options:
  --create  Create parent directories for local-artifact outputs.

Examples:
  resolve-output.mjs --list
  resolve-output.mjs local-session-handoff date=20260531 slug=main-status
  resolve-output.mjs local-session-handoff date=20260627 slug=output-contract-registry`;
}

function fail(error, detail, code = 2) {
  process.stdout.write(`${JSON.stringify({ ok: false, error, detail }, null, 2)}\n`);
  process.exit(code);
}

function registryExists(root, registryPath = REGISTRY_PATH) {
  const resolved = path.resolve(root);
  const selected = registryPath || REGISTRY_PATH;
  const absoluteRegistry = path.isAbsolute(selected) ? selected : path.join(resolved, selected);
  return existsSync(absoluteRegistry);
}

function validateRoot(root, registryPath = REGISTRY_PATH) {
  const resolved = path.resolve(root);
  if (!existsSync(path.join(resolved, ".codex-plugin/plugin.json")) || !registryExists(resolved, registryPath)) {
    throw new Error("root is not a plugin checkout with the selected output registry");
  }
  return resolved;
}

function rootHasRegistry(root, registryPath = REGISTRY_PATH) {
  const resolved = path.resolve(root);
  return existsSync(path.join(resolved, ".codex-plugin/plugin.json"))
    && existsSync(resolveRegistryPath(resolved, registryPath));
}

function resolveRoot(rootOption = null, cwd = process.cwd(), registryPath = REGISTRY_PATH) {
  if (rootOption !== null) {
    if (!String(rootOption || "").trim()) throw new Error("--root requires a value");
    return validateRoot(rootOption, registryPath);
  }
  const candidates = [
    process.env.KNITTEN_CONFIG_ROOT,
    process.env.KNITTEN_CORE_ROOT,
    PLUGIN_ROOT,
    path.join(process.env.KNITTEN_PLUGINS_ROOT || path.join(process.env.HOME || "", "plugins"), "knitten"),
    path.join(process.env.HOME || "", "plugins", "knitten"),
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (rootHasRegistry(candidate, registryPath)) return path.resolve(candidate);
  }
  const gitRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    cwd,
    encoding: "utf8",
  }).trim();
  return validateRoot(gitRoot, registryPath);
}

function parseOptions(argv) {
  const options = { root: null, outputsRegistry: null, localArtifactRegistry: null, create: false, list: false, args: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--create") {
      options.create = true;
    } else if (arg === "--root") {
      options.root = requiredOptionValue(argv, ++index, "--root");
    } else if (arg?.startsWith("--root=")) {
      options.root = requiredEqualsValue(arg, "--root=");
    } else if (arg === "--outputs-registry") {
      options.outputsRegistry = requiredOptionValue(argv, ++index, "--outputs-registry");
    } else if (arg?.startsWith("--outputs-registry=")) {
      options.outputsRegistry = requiredEqualsValue(arg, "--outputs-registry=");
    } else if (arg === "--local-artifact-registry") {
      options.localArtifactRegistry = requiredOptionValue(argv, ++index, "--local-artifact-registry");
    } else if (arg?.startsWith("--local-artifact-registry=")) {
      options.localArtifactRegistry = requiredEqualsValue(arg, "--local-artifact-registry=");
    } else if (arg === "--list") {
      options.list = true;
    } else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      options.args.push(arg);
    }
  }
  return options;
}

function requiredOptionValue(argv, index, option) {
  const value = argv[index];
  if (!String(value || "").trim() || String(value).startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

function requiredEqualsValue(arg, prefix) {
  const value = arg.slice(prefix.length);
  if (!String(value || "").trim()) {
    throw new Error(`${prefix.slice(0, -1)} requires a value`);
  }
  return value;
}

function resolveRegistryPath(root, registryPath = null) {
  const selected = registryPath || process.env.AGENT_HUB_OUTPUTS_REGISTRY || REGISTRY_PATH;
  return path.isAbsolute(selected) ? selected : path.join(root, selected);
}

function loadRegistry(root, registryPath = null) {
  const selectedRegistryPath = resolveRegistryPath(root, registryPath);
  if (!existsSync(selectedRegistryPath)) {
    throw new Error(`output registry does not exist: ${selectedRegistryPath}`);
  }
  const registry = JSON.parse(readFileSync(selectedRegistryPath, "utf8"));
  if (!registry || registry.schemaVersion !== 1 || !Array.isArray(registry.entries)) {
    throw new Error("output registry must have schemaVersion 1 and entries[]");
  }
  return registry;
}

function parseAssignments(tokens) {
  const values = {};
  for (const token of tokens) {
    const index = token.indexOf("=");
    if (index <= 0) {
      throw new Error(`expected name=value argument, got ${JSON.stringify(token)}`);
    }
    const name = token.slice(0, index);
    const value = token.slice(index + 1);
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) {
      throw new Error(`invalid argument name: ${name}`);
    }
    if (Object.hasOwn(values, name)) {
      throw new Error(`duplicate argument: ${name}`);
    }
    values[name] = value;
  }
  return values;
}

function validateArgs(entry, rawValues) {
  const values = {};
  const declared = new Set();
  for (const arg of entry.args || []) {
    declared.add(arg.name);
    if (!Object.hasOwn(rawValues, arg.name)) {
      throw new Error(`${entry.id} missing arg: ${arg.name}`);
    }
    const rawValue = String(rawValues[arg.name]);
    if (rawValue.includes("/") || rawValue.includes("\\") || rawValue.includes("..")) {
      throw new Error(`${arg.name} contains invalid path characters`);
    }
    const value = arg.normalize === "lowercase" ? rawValue.toLowerCase() : rawValue;
    const pattern = new RegExp(arg.pattern);
    if (!pattern.test(value)) {
      throw new Error(`${arg.name} does not match ${arg.pattern}`);
    }
    values[arg.name] = value;
  }
  for (const name of Object.keys(rawValues)) {
    if (!declared.has(name)) {
      throw new Error(`${entry.id} received undeclared arg: ${name}`);
    }
  }
  return values;
}

function renderTemplate(template, values) {
  return String(template).replaceAll(PLACEHOLDER_PATTERN, (_match, name) => {
    if (!Object.hasOwn(values, name)) {
      throw new Error(`template references undeclared arg: ${name}`);
    }
    return values[name];
  });
}

function isSafeRepoRelativePath(value) {
  if (typeof value !== "string" || !value || value.startsWith("/") || value.includes("..")) return false;
  const normalized = path.posix.normalize(value);
  return normalized === value && !normalized.startsWith("../") && !normalized.includes("/../");
}

function findEntry(registry, id) {
  const matches = registry.entries.filter((entry) => entry.id === id);
  if (matches.length !== 1) {
    throw new Error(`unknown output id: ${id}`);
  }
  return matches[0];
}

function listOutputs(registry) {
  return registry.entries.map((entry) => {
    const writeTarget = writeTargetFor(entry);
    return {
      id: entry.id,
      description: entry.description,
      madeBy: entry.madeBy,
      writeTargetKind: writeTarget.kind,
      args: (entry.args || []).map((arg) => arg.name),
      format: entry.format,
      hasTemplate: Boolean(entry.template),
    };
  });
}

function writeTargetFor(entry) {
  if (!entry.writeTarget || typeof entry.writeTarget !== "object") {
    throw new Error(`${entry.id} missing writeTarget`);
  }
  return entry.writeTarget;
}

function baseResult(root, entry) {
  const writeTarget = writeTargetFor(entry);
  const result = {
    ok: true,
    id: entry.id,
    description: entry.description,
    madeBy: entry.madeBy,
    writeTarget,
    locationKind: writeTarget.kind,
    template: entry.template,
    format: entry.format,
  };
  if (entry.formatOptions) result.formatOptions = entry.formatOptions;
  if (entry.template) {
    const absoluteTemplatePath = path.isAbsolute(entry.template) ? entry.template : path.join(root, entry.template);
    if (!existsSync(absoluteTemplatePath)) {
      throw new Error(`${entry.id} template does not exist: ${entry.template}`);
    }
    result.absoluteTemplatePath = absoluteTemplatePath;
  }
  if (writeTarget.section) result.section = writeTarget.section;
  if (writeTarget.parentOutput) result.parentOutput = writeTarget.parentOutput;
  return result;
}

export function resolveOutput({ root = null, destinationRoot = null, outputsRegistryPath = null, localArtifactRegistryPath = null, create = false, id, values = {}, cwd = process.cwd() }) {
  const knittenRoot = resolveRoot(root, cwd, outputsRegistryPath);
  const selectedDestinationRoot = destinationRoot ? path.resolve(destinationRoot) : knittenRoot;
  const registry = loadRegistry(knittenRoot, outputsRegistryPath);
  const entry = findEntry(registry, id);
  const normalizedValues = validateArgs(entry, values);
  const result = baseResult(knittenRoot, entry);
  const writeTarget = writeTargetFor(entry);

  if (writeTarget.kind === "repo-template") {
    const relativePath = renderTemplate(writeTarget.path, normalizedValues);
    if (!isSafeRepoRelativePath(relativePath)) {
      throw new Error(`${entry.id} resolved unsafe repo path: ${relativePath}`);
    }
    const absolutePath = path.join(selectedDestinationRoot, relativePath);
    if (create) mkdirSync(path.dirname(absolutePath), { recursive: true });
    return {
      ...result,
      path: relativePath,
      absolutePath,
    };
  }

  if (writeTarget.kind === "local-artifact") {
    const localTokens = writeTarget.localArtifactTokens.map((token) => renderTemplate(token, normalizedValues));
    const local = resolveLocalArtifactPath({ root: knittenRoot, registryPath: localArtifactRegistryPath, create, args: localTokens, cwd });
    return {
      ...result,
      path: local.path,
      absolutePath: local.absolutePath,
      cleanupPath: local.cleanupPath,
      absoluteCleanupPath: local.absoluteCleanupPath,
    };
  }

  if (writeTarget.kind === "document-section") {
    const parent = resolveOutput({
      root: knittenRoot,
      destinationRoot: selectedDestinationRoot,
      outputsRegistryPath,
      localArtifactRegistryPath,
      id: writeTarget.parentOutput,
      values: normalizedValues,
      cwd,
    });
    return {
      ...result,
      path: parent.path,
      absolutePath: parent.absolutePath,
    };
  }

  if (writeTarget.kind === "doc-path") {
    throw new Error(
      `${entry.id} uses unsupported doc-path resolution; use repo-template or local-artifact output targets instead`,
    );
  }

  throw new Error(`${entry.id} unsupported writeTarget kind: ${writeTarget.kind}`);
}

function main() {
  try {
    const options = parseOptions(process.argv.slice(2));
    const [id, ...assignmentTokens] = options.args;
    if (options.list) {
      const root = resolveRoot(options.root, process.cwd(), options.outputsRegistry);
      const registry = loadRegistry(root, options.outputsRegistry);
      process.stdout.write(`${JSON.stringify({ ok: true, outputs: listOutputs(registry) }, null, 2)}\n`);
      return;
    }
    if (!id) fail("usage", usage());
    const result = resolveOutput({
      root: options.root,
      outputsRegistryPath: options.outputsRegistry,
      localArtifactRegistryPath: options.localArtifactRegistry,
      create: options.create,
      id,
      values: parseAssignments(assignmentTokens),
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    fail("resolve-failed", error.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
