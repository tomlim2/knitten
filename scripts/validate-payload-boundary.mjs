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
  validate-payload-boundary.mjs --payload <payload-root> [--warn-only]

Validates that a payload plugin does not own generic Knitten path, routing,
template, standards, or local-runtime surfaces.`;
}

function parseArgs(argv) {
  const args = { payload: "", warnOnly: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--payload") args.payload = argv[++index];
    else if (arg.startsWith("--payload=")) args.payload = arg.slice("--payload=".length);
    else if (arg === "--warn-only") args.warnOnly = true;
    else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (!args.payload) throw new Error("--payload is required");
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
    checkPath(results, root, relativePath, "Historical planning docs do not belong in the payload.");
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
  if (!/validate-payload-boundary\.mjs|KNITTEN_PATH_BIN/.test(text)) {
    add(
      results,
      "fail",
      "kas-validator-owns-boundary-policy",
      "scripts/validate-boundary.mjs",
      "KAS validator must delegate to KC validation instead of owning a boundary rule table.",
    );
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const payloadRoot = path.resolve(args.payload);
  const results = [];
  if (!exists(payloadRoot, ".codex-plugin/plugin.json")) {
    throw new Error(`payload root missing .codex-plugin/plugin.json: ${payloadRoot}`);
  }

  checkPath(results, payloadRoot, "skills/kas-support", "KAS payload must not contain generic support skill.");
  checkPath(results, payloadRoot, "agent/config/outputs.json", "Generic output registry belongs to KC.");
  checkPath(results, payloadRoot, "agent/config/local-artifact-paths.json", "Generic artifact registry belongs to KC.");
  checkPath(results, payloadRoot, "agent/config/local-helper-paths.json", "Generic helper registry belongs to KC.");
  checkPath(results, payloadRoot, "document-templates", "Shared templates belong to KC or skill-local directories.");
  checkForbiddenDocs(results, payloadRoot);
  checkActiveLegacyContent(results, payloadRoot);
  checkReferenceLegacyContent(results, payloadRoot);
  checkBoundaryWrapper(results, payloadRoot);

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
