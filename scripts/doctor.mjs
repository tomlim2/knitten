#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PLUGIN_NAME = "knitten";
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUTPUT_KINDS = [
  ["spec", path.join("docs", "specs", "doctor-output.md"), "durable"],
  ["design-plan", path.join("docs", "design-plans", "doctor-output.md"), "durable"],
  ["temp-json", path.join(".agent-local", "knitten", "json", "doctor-output.json"), "local"],
  ["review-json", path.join(".agent-local", "knitten", "reviews", "doctor-output.json"), "local"],
  ["finding-json", path.join(".agent-local", "knitten", "findings", "doctor-output.json"), "local"],
  ["report-md", path.join(".agent-local", "knitten", "reports", "doctor-output.md"), "local"],
  ["report-html", path.join(".agent-local", "knitten", "reports", "doctor-output.html"), "local"],
  ["pull-request-json", path.join(".agent-local", "knitten", "pull-requests", "doctor-output.json"), "local"],
  ["task-json", path.join(".agent-local", "knitten", "tasks", "doctor-output.json"), "local"],
];

function parseArgs(argv) {
  const args = {
    marketplaceRoot: path.join(os.homedir(), ".agents", "plugins"),
    allowSourceVersion: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--marketplace-root=")) {
      args.marketplaceRoot = path.resolve(arg.slice("--marketplace-root=".length));
    } else if (arg === "--allow-source-version") {
      args.allowSourceVersion = true;
    } else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
}

function usage() {
  return `Usage:
  doctor.mjs [--marketplace-root=<path>] [--allow-source-version]

Checks the Knitten source checkout and its personal-marketplace plugin copy.`;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sameRealPath(left, right) {
  return fs.realpathSync(left) === fs.realpathSync(right);
}

function runJson(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || REPO_ROOT,
    env: options.env || process.env,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${command} failed`).trim());
  }
  return JSON.parse(result.stdout);
}

function check(checks, id, run) {
  try {
    const detail = run();
    checks.push({ id, ok: true, detail });
  } catch (error) {
    checks.push({ id, ok: false, detail: error.message });
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const checks = [];
  const sourceManifestPath = path.join(REPO_ROOT, ".codex-plugin", "plugin.json");
  const sourceSkillPath = path.join(REPO_ROOT, "skills", "knitten-status", "SKILL.md");
  const sourceOutputScriptPath = path.join(REPO_ROOT, "scripts", "resolve-output.mjs");
  const sourceOutputShimPath = path.join(REPO_ROOT, "bin", "knitten-resolve-output");
  const marketplacePath = path.join(args.marketplaceRoot, "marketplace.json");
  const copiedRoot = path.join(args.marketplaceRoot, "plugins", PLUGIN_NAME);
  const copiedManifestPath = path.join(copiedRoot, ".codex-plugin", "plugin.json");
  const copiedOutputShimPath = path.join(copiedRoot, "bin", "knitten-resolve-output");

  let sourceManifest = null;
  let marketplace = null;
  let entry = null;
  let copiedManifest = null;

  check(checks, "source-manifest", () => {
    sourceManifest = readJson(sourceManifestPath);
    if (sourceManifest.name !== PLUGIN_NAME) {
      throw new Error(`expected name ${PLUGIN_NAME}, got ${sourceManifest.name}`);
    }
    return sourceManifestPath;
  });

  check(checks, "source-status-skill", () => {
    if (!fs.existsSync(sourceSkillPath)) throw new Error(`missing ${sourceSkillPath}`);
    return sourceSkillPath;
  });

  check(checks, "source-output-runtime", () => {
    if (!fs.existsSync(sourceOutputScriptPath)) throw new Error(`missing ${sourceOutputScriptPath}`);
    if (!fs.existsSync(sourceOutputShimPath)) throw new Error(`missing ${sourceOutputShimPath}`);
    return `${sourceOutputScriptPath}, ${sourceOutputShimPath}`;
  });

  check(checks, "source-output-kinds", () => {
    for (const [kind, relativePath, persistence] of OUTPUT_KINDS) {
      const output = runJson("node", [
        sourceOutputScriptPath,
        `--kind=${kind}`,
        "--name=doctor-output",
        `--workspace-root=${REPO_ROOT}`,
      ]);
      const expectedPath = path.join(REPO_ROOT, relativePath);
      if (output.selectedPath !== expectedPath) {
        throw new Error(`${kind} path expected ${expectedPath}, got ${output.selectedPath}`);
      }
      if (output.selectedDir !== path.dirname(expectedPath)) {
        throw new Error(`${kind} dir expected ${path.dirname(expectedPath)}, got ${output.selectedDir}`);
      }
      if (output.selectedPersistence !== persistence) {
        throw new Error(`${kind} persistence expected ${persistence}, got ${output.selectedPersistence}`);
      }
    }
    return `${OUTPUT_KINDS.length} kinds`;
  });

  check(checks, "source-output-name-required", () => {
    for (const args of [
      ["--kind=review-json", `--workspace-root=${REPO_ROOT}`],
      ["--kind=review-json", "--name=!!!", `--workspace-root=${REPO_ROOT}`],
    ]) {
      const result = spawnSync("node", [sourceOutputScriptPath, ...args], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      });
      if (result.status === 0) throw new Error(`${args.join(" ")} should fail`);
    }
    return "missing or unusable --name fails";
  });

  check(checks, "marketplace-file", () => {
    marketplace = readJson(marketplacePath);
    if (!Array.isArray(marketplace.plugins)) throw new Error("marketplace.plugins must be an array");
    return marketplacePath;
  });

  check(checks, "marketplace-entry", () => {
    if (!marketplace) throw new Error("marketplace file did not load");
    entry = marketplace.plugins.find((plugin) => plugin?.name === PLUGIN_NAME);
    if (!entry) throw new Error("missing knitten marketplace entry");
    return entry.source?.path || "";
  });

  check(checks, "marketplace-entry-path", () => {
    if (!entry) throw new Error("marketplace entry did not load");
    if (entry.source?.source !== "local") throw new Error("entry source must be local");
    if (entry.source?.path !== `./plugins/${PLUGIN_NAME}`) {
      throw new Error(`entry path must be ./plugins/${PLUGIN_NAME}`);
    }
    return entry.source.path;
  });

  check(checks, "copied-manifest", () => {
    copiedManifest = readJson(copiedManifestPath);
    if (copiedManifest.name !== PLUGIN_NAME) {
      throw new Error(`expected copied name ${PLUGIN_NAME}, got ${copiedManifest.name}`);
    }
    return copiedManifestPath;
  });

  check(checks, "copied-version", () => {
    if (!copiedManifest) throw new Error("copied manifest did not load");
    if (!args.allowSourceVersion && !String(copiedManifest.version).includes("+codex.")) {
      throw new Error(`copied version lacks +codex. cachebuster: ${copiedManifest.version}`);
    }
    return copiedManifest.version;
  });

  check(checks, "copied-output-shim", () => {
    if (!fs.existsSync(copiedOutputShimPath)) throw new Error(`missing ${copiedOutputShimPath}`);
    const output = runJson(copiedOutputShimPath, [
      "--kind=review-json",
      "--name=doctor-output",
      `--workspace-root=${REPO_ROOT}`,
    ], {
      cwd: REPO_ROOT,
    });
    const expectedPath = path.join(REPO_ROOT, ".agent-local", "knitten", "reviews", "doctor-output.json");
    if (!sameRealPath(output.pluginRoot, copiedRoot)) {
      throw new Error(`copied shim pluginRoot expected ${copiedRoot}, got ${output.pluginRoot}`);
    }
    if (output.selectedPath !== expectedPath) {
      throw new Error(`copied shim path expected ${expectedPath}, got ${output.selectedPath}`);
    }
    return copiedOutputShimPath;
  });

  const ok = checks.every((item) => item.ok);
  process.stdout.write(`${JSON.stringify({ ok, checks }, null, 2)}\n`);
  if (!ok) process.exitCode = 1;
}

main();
