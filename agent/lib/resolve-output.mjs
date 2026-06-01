#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveLocalArtifactPath } from "./resolve-local-artifact-path.mjs";

const REGISTRY_PATH = "agent/config/outputs.json";
const PLACEHOLDER_PATTERN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

function usage() {
  return `Usage:
  resolve-output.mjs [--root <knitten-root>] [--outputs-registry <path>] [--local-artifact-registry <path>] [--create] <output-id> [name=value ...]
  resolve-output.mjs [--root <knitten-root>] [--outputs-registry <path>] --list

Options:
  --create  Create parent directories for local-artifact outputs.

Examples:
  resolve-output.mjs --list
  resolve-output.mjs local-session-handoff date=20260531 slug=main-status
  resolve-output.mjs agent-hub-spec-proposed slug=output-contract-registry
  resolve-output.mjs agent-hub-design-plan-section slug=output-contract-registry`;
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
  const options = { root: null, outputsRegistry: null, localArtifactRegistry: null, create: false, list: false, args: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--create") {
      options.create = true;
    } else if (arg === "--root") {
      options.root = argv[++index];
    } else if (arg?.startsWith("--root=")) {
      options.root = arg.slice("--root=".length);
    } else if (arg === "--outputs-registry") {
      options.outputsRegistry = argv[++index];
    } else if (arg?.startsWith("--outputs-registry=")) {
      options.outputsRegistry = arg.slice("--outputs-registry=".length);
    } else if (arg === "--local-artifact-registry") {
      options.localArtifactRegistry = argv[++index];
    } else if (arg?.startsWith("--local-artifact-registry=")) {
      options.localArtifactRegistry = arg.slice("--local-artifact-registry=".length);
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
    if (rawValue.includes("/") || rawValue.includes("..")) {
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

export function resolveOutput({ root = null, outputsRegistryPath = null, localArtifactRegistryPath = null, create = false, id, values = {}, cwd = process.cwd() }) {
  const knittenRoot = resolveRoot(root, cwd);
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
    return {
      ...result,
      path: relativePath,
      absolutePath: path.join(knittenRoot, relativePath),
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
    const script = path.join(knittenRoot, "agent/skills/ah-resolve-doc-path/resolve.sh");
    const docArgs = ["doc", writeTarget.docPurpose];
    if (Object.hasOwn(normalizedValues, "project")) {
      docArgs.push(normalizedValues.project);
    }
    const stdout = execFileSync("bash", [script, ...docArgs], {
      cwd: knittenRoot,
      encoding: "utf8",
    });
    const resolvedPath = stdout
      .split("\n")
      .find((line) => line.startsWith("RESOLVED_PATH="))
      ?.slice("RESOLVED_PATH=".length);
    if (!resolvedPath) {
      throw new Error(`${entry.id} doc-path resolver did not return RESOLVED_PATH`);
    }
    return {
      ...result,
      path: resolvedPath,
      absolutePath: resolvedPath,
    };
  }

  throw new Error(`${entry.id} unsupported writeTarget kind: ${writeTarget.kind}`);
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const [id, ...assignmentTokens] = options.args;
  try {
    if (options.list) {
      const root = resolveRoot(options.root);
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
