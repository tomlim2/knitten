#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PLUGIN_NAME = "knitten";
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function outputKinds() {
  const today = localDateString();
  const operationalFindingPath = path.join(
    ".agent-local",
    "ah",
    "operational-findings",
    today,
    "doctor-output.json",
  );
  return [
    ["spec", path.join("docs", "specs", "doctor-output.md"), "durable"],
    ["design-plan", path.join("docs", "design-plans", "doctor-output.md"), "durable"],
    ["temp-json", path.join(".agent-local", "ah", "json", "doctor-output.json"), "local"],
    ["review-json", path.join(".agent-local", "ah", "reviews", "doctor-output.json"), "local"],
    ["response-json", path.join(".agent-local", "ah", "responses", "doctor-output.json"), "local"],
    ["operational-finding-json", operationalFindingPath, "local"],
    ["report-md", path.join(".agent-local", "ah", "reports", "doctor-output.md"), "local"],
    ["report-html", path.join(".agent-local", "ah", "reports", "doctor-output.html"), "local"],
    ["pull-request-json", path.join(".agent-local", "ah", "pull-requests", "doctor-output.json"), "local"],
    ["task-json", path.join(".agent-local", "ah", "tasks", "doctor-output.json"), "local"],
  ];
}

function parseArgs(argv) {
  const args = {
    marketplaceRoot: os.homedir(),
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

function canonicalOutputPath(value) {
  let current = path.resolve(value);
  const suffix = [];
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(value);
    suffix.unshift(path.basename(current));
    current = parent;
  }
  return path.join(fs.realpathSync(current), ...suffix);
}

function sameOutputPath(left, right) {
  return canonicalOutputPath(left) === canonicalOutputPath(right);
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

function checkConfigRegistries(root) {
  const required = [
    ["agent/config/outputs.json", (value) => value.schemaVersion === 1 && Array.isArray(value.entries)],
    ["agent/config/local-artifact-paths.json", (value) => value.schemaVersion === 1 && value.root === ".agent-local" && Array.isArray(value.entries)],
    ["agent/config/local-helper-paths.json", (value) => value.schemaVersion === 1 && Array.isArray(value.entries)],
  ];
  for (const [relativePath, isValid] of required) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) throw new Error(`missing ${relativePath}`);
    const parsed = readJson(absolutePath);
    if (!isValid(parsed)) throw new Error(`invalid registry shape: ${relativePath}`);
  }
  return `${required.length} registries`;
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
  const marketplacePath = path.join(args.marketplaceRoot, ".agents", "plugins", "marketplace.json");
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

  check(checks, "source-config-registries", () => {
    return checkConfigRegistries(REPO_ROOT);
  });

  check(checks, "source-output-kinds", () => {
    const kinds = outputKinds();
    for (const [kind, relativePath, persistence] of kinds) {
      const output = runJson("node", [
        sourceOutputScriptPath,
        `--kind=${kind}`,
        "--name=doctor-output",
        `--workspace-root=${REPO_ROOT}`,
      ]);
      const expectedPath = path.join(REPO_ROOT, relativePath);
      if (!sameOutputPath(output.selectedPath, expectedPath)) {
        throw new Error(`${kind} path expected ${expectedPath}, got ${output.selectedPath}`);
      }
      if (!sameOutputPath(output.selectedDir, path.dirname(expectedPath))) {
        throw new Error(`${kind} dir expected ${path.dirname(expectedPath)}, got ${output.selectedDir}`);
      }
      if (output.selectedPersistence !== persistence) {
        throw new Error(`${kind} persistence expected ${persistence}, got ${output.selectedPersistence}`);
      }
    }
    return `${kinds.length} kinds`;
  });

  check(checks, "source-output-target-root", () => {
    const targetRoot = path.join(REPO_ROOT, ".agent-local", "doctor-target-root");
    const output = runJson("node", [
      sourceOutputScriptPath,
      "--skill=ah-report-finding",
      "--name=doctor-output",
      `--workspace-root=${REPO_ROOT}`,
      `--target-root=${targetRoot}`,
    ]);
    const expectedPath = path.join(
      REPO_ROOT,
      ".agent-local",
      "ah",
      "operational-findings",
      localDateString(),
      "doctor-output.json",
    );
    if (!sameOutputPath(output.selectedPath, expectedPath)) {
      throw new Error(`target-root path expected ${expectedPath}, got ${output.selectedPath}`);
    }
    if (output.selectedOwnerRoot !== REPO_ROOT) {
      throw new Error(`target-root owner expected ${REPO_ROOT}, got ${output.selectedOwnerRoot}`);
    }
    if (output.targetRoot !== targetRoot) {
      throw new Error(`targetRoot expected ${targetRoot}, got ${output.targetRoot}`);
    }
    if (output.selectedTargetRoot !== targetRoot) {
      throw new Error(`selectedTargetRoot expected ${targetRoot}, got ${output.selectedTargetRoot}`);
    }
    return expectedPath;
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

  check(checks, "source-output-legacy-kind-rejected", () => {
    const result = spawnSync("node", [
      sourceOutputScriptPath,
      "--kind=finding-json",
      "--name=doctor-output",
      `--workspace-root=${REPO_ROOT}`,
    ], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    if (result.status === 0) throw new Error("finding-json should fail");
    return "finding-json rejected";
  });

  check(checks, "source-output-shim-plugins-root-env", () => {
    const output = runJson(sourceOutputShimPath, [
      "--kind=review-json",
      "--name=doctor-source-env-output",
      `--workspace-root=${REPO_ROOT}`,
    ], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        KNITTEN_PLUGIN_ROOT: "",
        KNITTEN_PLUGINS_ROOT: path.join(args.marketplaceRoot, "plugins"),
      },
    });
    const expectedPath = path.join(copiedRoot, ".agent-local", "ah", "reviews", "doctor-source-env-output.json");
    if (!sameRealPath(output.pluginRoot, copiedRoot)) {
      throw new Error(`source shim plugins-root env pluginRoot expected ${copiedRoot}, got ${output.pluginRoot}`);
    }
    if (!sameOutputPath(output.selectedPath, expectedPath)) {
      throw new Error(`source shim plugins-root env path expected ${expectedPath}, got ${output.selectedPath}`);
    }
    return "KNITTEN_PLUGINS_ROOT";
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

  check(checks, "copied-config-registries", () => {
    return checkConfigRegistries(copiedRoot);
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
    const expectedPath = path.join(copiedRoot, ".agent-local", "ah", "reviews", "doctor-output.json");
    if (!sameRealPath(output.pluginRoot, copiedRoot)) {
      throw new Error(`copied shim pluginRoot expected ${copiedRoot}, got ${output.pluginRoot}`);
    }
    if (!sameRealPath(output.hubRoot, copiedRoot)) {
      throw new Error(`copied shim hubRoot expected ${copiedRoot}, got ${output.hubRoot}`);
    }
    if (!sameOutputPath(output.selectedPath, expectedPath)) {
      throw new Error(`copied shim path expected ${expectedPath}, got ${output.selectedPath}`);
    }
    return copiedOutputShimPath;
  });

  check(checks, "copied-output-shim-plugins-root-env", () => {
    if (!fs.existsSync(copiedOutputShimPath)) throw new Error(`missing ${copiedOutputShimPath}`);
    const output = runJson(copiedOutputShimPath, [
      "--kind=review-json",
      "--name=doctor-env-output",
      `--workspace-root=${REPO_ROOT}`,
    ], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        KNITTEN_PLUGIN_ROOT: "",
        KNITTEN_PLUGINS_ROOT: path.join(args.marketplaceRoot, "plugins"),
      },
    });
    const expectedPath = path.join(copiedRoot, ".agent-local", "ah", "reviews", "doctor-env-output.json");
    if (!sameRealPath(output.pluginRoot, copiedRoot)) {
      throw new Error(`plugins-root env pluginRoot expected ${copiedRoot}, got ${output.pluginRoot}`);
    }
    if (!sameRealPath(output.hubRoot, copiedRoot)) {
      throw new Error(`plugins-root env hubRoot expected ${copiedRoot}, got ${output.hubRoot}`);
    }
    if (!sameOutputPath(output.selectedPath, expectedPath)) {
      throw new Error(`plugins-root env path expected ${expectedPath}, got ${output.selectedPath}`);
    }
    return "KNITTEN_PLUGINS_ROOT";
  });

  const ok = checks.every((item) => item.ok);
  process.stdout.write(`${JSON.stringify({ ok, checks }, null, 2)}\n`);
  if (!ok) process.exitCode = 1;
}

main();
