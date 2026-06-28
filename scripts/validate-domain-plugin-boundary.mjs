#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ACTIVE_GLOBS = ["SKILL.md", "*.sh", "*.mjs", "*.py"];
const LEGACY_PATTERN = [
  "KNITTEN_ROOT",
  "\\.claude",
  "skills/kas-support",
  "agent/lib",
  "agent/config",
  "document-templates",
  "agent/standards",
  "\\.\\./knitten",
  "plugins/knitten",
  "scripts/resolve-[a-z-]+\\.mjs",
  "bin/knitten-resolve-output",
].join("|");

function usage() {
  return `Usage:
  validate-domain-plugin-boundary.mjs --domain-plugin <plugin-root> [--warn-only]

Validates that a domain plugin does not own generic Knitten path/output runtime,
template, standards, or local-runtime surfaces. The --payload alias is retained
only for legacy callers; new docs and wrappers must use --domain-plugin.`;
}

function parseArgs(argv) {
  const args = { pluginRoot: "", warnOnly: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--domain-plugin") args.pluginRoot = argv[++index];
    else if (arg.startsWith("--domain-plugin=")) args.pluginRoot = arg.slice("--domain-plugin=".length);
    else if (arg === "--payload") args.pluginRoot = argv[++index];
    else if (arg.startsWith("--payload=")) args.pluginRoot = arg.slice("--payload=".length);
    else if (arg === "--warn-only") args.warnOnly = true;
    else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (!args.pluginRoot) throw new Error("--domain-plugin is required");
  return args;
}

function add(results, severity, id, pathName, detail) {
  results.push({ id, severity, path: pathName, detail });
}

function exists(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function rg(root, args) {
  return spawnSync("rg", args, { cwd: root, encoding: "utf8" });
}

function checkPath(results, root, relativePath, detail) {
  if (exists(root, relativePath)) add(results, "fail", `forbidden:${relativePath}`, relativePath, detail);
}

function checkForbiddenDocs(results, root) {
  const forbiddenDocDirs = ["docs/planning", "docs/plans", "docs/archive"];
  for (const relativePath of forbiddenDocDirs) {
    checkPath(results, root, relativePath, "Historical planning docs do not belong in the domain plugin.");
  }
}

function checkActiveLegacyContent(results, root) {
  const args = ["-n", LEGACY_PATTERN, "skills"];
  for (const glob of ACTIVE_GLOBS) args.push("--glob", glob);
  const result = rg(root, args);
  if (result.status === 1) return;
  if (result.status !== 0) {
    add(results, "fail", "scan:active-legacy-paths", "skills", (result.stderr || result.stdout).trim());
    return;
  }
  for (const line of result.stdout.split(/\r?\n/).filter(Boolean)) {
    add(results, "fail", "active-legacy-path", line.split(":", 1)[0], line);
  }
}

function checkReferenceLegacyContent(results, root) {
  const result = rg(root, ["-n", LEGACY_PATTERN, "skills", "--glob", "*/references/**", "--glob", "*/reference.md"]);
  if (result.status === 1) return;
  if (result.status !== 0) {
    add(results, "fail", "scan:reference-legacy-paths", "skills", (result.stderr || result.stdout).trim());
    return;
  }
  for (const line of result.stdout.split(/\r?\n/).filter(Boolean)) {
    if (line.includes("Legacy evidence:")) continue;
    add(results, "fail", "reference-legacy-path-without-label", line.split(":", 1)[0], line);
  }
}

function checkBoundaryWrapper(results, root) {
  const wrapper = path.join(root, "scripts", "validate-boundary.mjs");
  if (!fs.existsSync(wrapper)) return;
  const text = fs.readFileSync(wrapper, "utf8");
  if (!/validate-domain-plugin-boundary\.mjs|validate-payload-boundary\.mjs|KNITTEN_PATH_BIN/.test(text)) {
    add(
      results,
      "fail",
      "domain-validator-owns-boundary-policy",
      "scripts/validate-boundary.mjs",
      "Domain plugin validator must delegate to Knitten Core validation instead of owning a boundary rule table.",
    );
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const pluginRoot = path.resolve(args.pluginRoot);
  const results = [];
  if (!exists(pluginRoot, ".codex-plugin/plugin.json")) {
    throw new Error(`domain plugin root missing .codex-plugin/plugin.json: ${pluginRoot}`);
  }

  checkPath(results, pluginRoot, "skills/kas-support", "KAS domain plugin must not contain generic support skill.");
  checkPath(results, pluginRoot, "agent/config/outputs.json", "Generic output registry belongs to Knitten Core.");
  checkPath(results, pluginRoot, "agent/config/local-artifact-paths.json", "Generic artifact registry belongs to Knitten Core.");
  checkPath(results, pluginRoot, "agent/config/local-helper-paths.json", "Generic helper registry belongs to Knitten Core.");
  checkPath(results, pluginRoot, "document-templates", "Shared templates belong to Knitten Core or skill-local directories.");
  checkForbiddenDocs(results, pluginRoot);
  checkActiveLegacyContent(results, pluginRoot);
  checkReferenceLegacyContent(results, pluginRoot);
  checkBoundaryWrapper(results, pluginRoot);

  const effective = results.map((result) => ({
    ...result,
    effectiveSeverity: args.warnOnly && result.severity === "fail" ? "warn" : result.severity,
  }));
  const errors = effective.filter((result) => result.effectiveSeverity === "fail");
  const warnings = effective.filter((result) => result.effectiveSeverity === "warn");
  process.stdout.write(`${JSON.stringify({
    ok: errors.length === 0,
    mode: args.warnOnly ? "warn-only" : "strict",
    errorCount: errors.length,
    warningCount: warnings.length,
    results: effective,
  }, null, 2)}\n`);
  if (errors.length) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
