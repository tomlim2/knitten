#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ACTIVE_GLOBS = ["SKILL.md", "*.sh", "*.mjs", "*.py"];
const LEGACY_PATTERN = [
  "KNITTEN_ROOT",
  "\\.claude",
  "agent/lib",
  "agent/config",
  "document-templates",
  "agent/standards",
  "\\.\\./knitten",
  "plugins/knitten",
  "scripts/resolve-[a-z-]+\\.mjs",
  "bin/knitten-resolve-output",
].join("|");
const FINDING_WORKFLOW_PATTERN = "report-finding|finding[- ]report|operational-findings";
const DIRECT_AGENT_MODEL_PATTERN = "gpt-[0-9]|model_reasoning_effort|sandbox_mode";

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

function checkTrackedLocalArtifacts(results, root) {
  const result = spawnSync("git", ["ls-files", "-z", "--", ".agent-local"], {
    cwd: root,
    encoding: "buffer",
  });
  if (result.status !== 0) {
    add(results, "fail", "scan:tracked-agent-local", ".agent-local", (result.stderr || Buffer.from("git ls-files failed")).toString("utf8").trim());
    return;
  }
  for (const relativePath of result.stdout.toString("utf8").split("\0").filter(Boolean)) {
    add(results, "fail", "tracked-agent-local", relativePath, "Domain plugins must not track local runtime artifacts.");
  }
}

function checkFindingWorkflowReferences(results, root) {
  const candidates = ["README.md", "AGENTS.md", "SYSTEM.md", "skills", "scripts"]
    .filter((relativePath) => exists(root, relativePath));
  if (candidates.length === 0) return;
  const result = rg(root, ["-n", "-i", FINDING_WORKFLOW_PATTERN, ...candidates]);
  if (result.status === 1) return;
  if (result.status !== 0) {
    add(results, "fail", "scan:finding-workflow-references", candidates.join(","), (result.stderr || result.stdout).trim());
    return;
  }
  for (const line of result.stdout.split(/\r?\n/).filter(Boolean)) {
    add(results, "fail", "finding-workflow-reference", line.split(":", 1)[0], line);
  }
}

function checkDirectAgentModelSettings(results, root) {
  if (!exists(root, "skills")) return;
  const result = rg(root, [
    "-n",
    DIRECT_AGENT_MODEL_PATTERN,
    "skills",
    "--glob",
    "*.md",
  ]);
  if (result.status === 1) return;
  if (result.status !== 0) {
    add(results, "fail", "scan:direct-agent-model-settings", "skills", (result.stderr || result.stdout).trim());
    return;
  }
  for (const line of result.stdout.split(/\r?\n/).filter(Boolean)) {
    add(
      results,
      "fail",
      "direct-agent-model-setting",
      line.split(":", 1)[0],
      `${line}; use a Knitten Core agent profile id instead`,
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

  checkPath(results, pluginRoot, "agent/config/outputs.json", "Generic output registry belongs to Knitten Core.");
  checkPath(results, pluginRoot, "agent/config/local-artifact-paths.json", "Generic artifact registry belongs to Knitten Core.");
  checkPath(results, pluginRoot, "agent/config/local-helper-paths.json", "Generic helper registry belongs to Knitten Core.");
  checkPath(results, pluginRoot, "document-templates", "Shared templates belong to Knitten Core or skill-local directories.");
  checkForbiddenDocs(results, pluginRoot);
  checkActiveLegacyContent(results, pluginRoot);
  checkReferenceLegacyContent(results, pluginRoot);
  checkBoundaryWrapper(results, pluginRoot);
  checkTrackedLocalArtifacts(results, pluginRoot);
  checkFindingWorkflowReferences(results, pluginRoot);
  checkDirectAgentModelSettings(results, pluginRoot);

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
