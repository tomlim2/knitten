#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  filesystemPluginFiles,
  sourcePluginFiles,
} from "./plugin-source-files.mjs";

const PLUGIN_NAME = "knitten";
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
    "workflow",
    "operational-findings",
    today,
    "reports",
    "doctor-output.json",
  );
  return [
    ["spec", path.join("docs", "specs", "doctor-output.md"), "durable"],
    ["design-plan", path.join("docs", "design-plans", "doctor-output.md"), "durable"],
    ["temp-json", path.join(".agent-local", "workflow", "json", "doctor-output.json"), "local"],
    ["review-json", path.join(".agent-local", "workflow", "reviews", "doctor-output.json"), "local"],
    ["operational-finding-json", operationalFindingPath, "local"],
    ["report-md", path.join(".agent-local", "workflow", "reports", "doctor-output.md"), "local"],
    ["report-html", path.join(".agent-local", "workflow", "reports", "doctor-output.html"), "local"],
    ["task-json", path.join(".agent-local", "workflow", "tasks", "doctor-output.json"), "local"],
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

function comparableFileHash(root, relative) {
  const absolute = path.join(root, relative);
  if (relative === ".codex-plugin/plugin.json") {
    const manifest = readJson(absolute);
    manifest.version = String(manifest.version).split("+", 1)[0];
    return crypto.createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
  }
  return crypto.createHash("sha256").update(fs.readFileSync(absolute)).digest("hex");
}

function comparePluginTrees(sourceRoot, copiedRoot) {
  const sourceFiles = sourcePluginFiles(sourceRoot);
  const copiedFiles = filesystemPluginFiles(copiedRoot);
  const sourceSet = new Set(sourceFiles);
  const copiedSet = new Set(copiedFiles);
  const missing = sourceFiles.filter((relative) => !copiedSet.has(relative));
  const extra = copiedFiles.filter((relative) => !sourceSet.has(relative));
  const changed = sourceFiles.filter((relative) => (
    copiedSet.has(relative)
    && comparableFileHash(sourceRoot, relative) !== comparableFileHash(copiedRoot, relative)
  ));
  return { missing, extra, changed };
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

function isSafeRelativePath(value) {
  return Boolean(value)
    && !path.isAbsolute(value)
    && !String(value).split(/[\\/]+/).includes("..");
}

function helperPathAllowed(relativePath) {
  return relativePath.startsWith("bin/")
    || relativePath.startsWith("scripts/")
    || relativePath.startsWith("skills/");
}

function outputOwnerAllowed(root, madeBy, entry) {
  if (madeBy === "workflow:shared-session-handoff") return true;
  if (madeBy.startsWith("workflow:")) return true;
  if (fs.existsSync(path.join(root, "skills", madeBy, "SKILL.md"))) return true;
  return false;
}

function localArtifactOwnerAllowed(owner, _entry) {
  return owner === "workflow";
}

function sampleForArg(arg) {
  const candidates = [
    "doctor-output",
    "doctor-run",
    "20260707",
    "2026-07-07",
    "x",
    "x-1",
    "x_1",
    "x.1",
  ];
  const pattern = new RegExp(arg.pattern);
  for (const candidate of candidates) {
    const value = arg.normalize === "lowercase" ? candidate.toLowerCase() : candidate;
    if (!value.includes("/") && !value.includes("..") && pattern.test(value)) {
      return value;
    }
  }
  throw new Error(`${arg.name} has unsupported sample pattern ${arg.pattern}`);
}

function validateRegisteredOutputResolves(root, entry, problems) {
  if (entry.writeTarget?.kind !== "local-artifact") return;
  const scriptPath = path.join(root, "scripts", "resolve-registered-output.mjs");
  if (!fs.existsSync(scriptPath)) {
    problems.push(`outputs:${entry.id || "<missing id>"} missing resolver ${scriptPath}`);
    return;
  }
  const assignments = (entry.args || []).map((arg) => `${arg.name}=${sampleForArg(arg)}`);
  const result = spawnSync("node", [scriptPath, "--root", root, entry.id, ...assignments], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "registered output resolution failed").trim();
    problems.push(`outputs:${entry.id || "<missing id>"} failed local-artifact resolution: ${detail}`);
  }
}

function validateOutputRegistryContract(root) {
  const outputsPath = path.join(root, "agent", "config", "outputs.json");
  const localArtifactsPath = path.join(root, "agent", "config", "local-artifact-paths.json");
  const localHelpersPath = path.join(root, "agent", "config", "local-helper-paths.json");
  const outputs = readJson(outputsPath);
  const localArtifacts = readJson(localArtifactsPath);
  const localHelpers = readJson(localHelpersPath);
  const problems = [];

  for (const entry of outputs.entries) {
    const id = entry.id || "<missing id>";
    const madeBy = String(entry.madeBy || "");
    if (!outputOwnerAllowed(root, madeBy, entry)) {
      problems.push(`outputs:${id} has disallowed or undocumented madeBy ${madeBy || "<missing>"}`);
    }

    if (entry.template) {
      if (!isSafeRelativePath(entry.template)) {
        problems.push(`outputs:${id} has unsafe template path ${entry.template}`);
      } else if (!fs.existsSync(path.join(root, entry.template))) {
        problems.push(`outputs:${id} missing template ${entry.template}`);
      }
    }

    if (entry.writeTarget?.kind === "repo-template") {
      const outputPath = String(entry.writeTarget.path || "");
      if (
        !outputPath.startsWith("docs/specs/")
        && !outputPath.startsWith("docs/design-plans/")
      ) {
        problems.push(`outputs:${id} has non-generic durable path ${outputPath || "<missing>"}`);
      }
    }

    validateRegisteredOutputResolves(root, entry, problems);
  }

  for (const entry of localArtifacts.entries) {
    const label = `${entry.owner || "<missing owner>"}:${entry.artifactType || "<missing type>"}:${entry.item || "<missing item>"}`;
    if (!localArtifactOwnerAllowed(entry.owner, entry)) {
      problems.push(`local-artifact:${label} has disallowed or undocumented owner ${entry.owner || "<missing>"}`);
    }
    if (entry.template) {
      if (!isSafeRelativePath(entry.template)) {
        problems.push(`local-artifact:${label} has unsafe template path ${entry.template}`);
      } else if (!fs.existsSync(path.join(root, entry.template))) {
        problems.push(`local-artifact:${label} missing template ${entry.template}`);
      }
    }
  }

  for (const entry of localHelpers.entries) {
    const id = entry.id || "<missing id>";
    const helperPath = String(entry.path || "");
    if (!isSafeRelativePath(helperPath)) {
      problems.push(`helper:${id} has unsafe path ${helperPath || "<missing>"}`);
      continue;
    }
    if (!helperPathAllowed(helperPath)) {
      problems.push(`helper:${id} has disallowed path ${helperPath}`);
    }
    if (!fs.existsSync(path.join(root, helperPath))) {
      problems.push(`helper:${id} missing path ${helperPath}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(problems.join("; "));
  }

  return [
    `outputs=${outputs.entries.length}`,
    `localArtifacts=${localArtifacts.entries.length}`,
    `localHelpers=${localHelpers.entries.length}`,
  ].join(", ");
}

function skillShapeWarnings(root) {
  const warnings = [];
  const skillsRoot = path.join(root, "skills");
  if (!fs.existsSync(skillsRoot)) return [`${skillsRoot} does not exist`];
  const skills = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const skillName of skills) {
    const skillPath = path.join(skillsRoot, skillName, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    const relativeSkillPath = path.relative(root, skillPath);
    const body = fs.readFileSync(skillPath, "utf8");
    const frontmatter = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) {
      warnings.push(`${relativeSkillPath} missing YAML frontmatter`);
    } else if (!/^match-check:\s*(loose|normal|strict)\s*$/m.test(frontmatter[1])) {
      warnings.push(`${relativeSkillPath} missing match-check frontmatter`);
    }
    if (!body.includes("## Step 0: Match Check")) {
      warnings.push(`${relativeSkillPath} missing Step 0: Match Check`);
    }

    const referencesRoot = path.join(skillsRoot, skillName, "references");
    if (!fs.existsSync(referencesRoot)) continue;
    const referenceFiles = fs.readdirSync(referencesRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
    if (referenceFiles.length === 0) continue;
    if (!body.includes("Do not read detailed references until Step 0 passes.")) {
      warnings.push(`${relativeSkillPath} missing pre-reference Step 0 guard`);
    }
    if (!/## After Match[\s\S]*references\//.test(body)) {
      warnings.push(`${relativeSkillPath} missing post-match reference load instruction`);
    }
  }

  return warnings;
}

function warningCheck(checks, id, run) {
  try {
    const warnings = run();
    const check = {
      id,
      ok: true,
      detail: `${warnings.length} warnings`,
    };
    if (warnings.length > 0) check.warnings = warnings;
    checks.push(check);
  } catch (error) {
    checks.push({ id, ok: true, detail: `warning scan failed: ${error.message}` });
  }
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
  const sourceSkillPath = path.join(REPO_ROOT, "skills", "status", "SKILL.md");
  const sourceOutputScriptPath = path.join(REPO_ROOT, "scripts", "resolve-output.mjs");
  const sourceOutputShimPath = path.join(REPO_ROOT, "bin", "knitten-resolve-output");
  const sourcePathCommandPath = path.join(REPO_ROOT, "bin", "knitten-path");
  const sourceDomainPluginValidatorPath = path.join(REPO_ROOT, "scripts", "validate-domain-plugin-boundary.mjs");
  const sourceLegacyBoundaryValidatorPath = path.join(REPO_ROOT, "scripts", "validate-payload-boundary.mjs");
  const marketplacePath = path.join(args.marketplaceRoot, ".agents", "plugins", "marketplace.json");
  const copiedRoot = path.join(args.marketplaceRoot, "plugins", PLUGIN_NAME);
  const copiedManifestPath = path.join(copiedRoot, ".codex-plugin", "plugin.json");
  const copiedOutputShimPath = path.join(copiedRoot, "bin", "knitten-resolve-output");
  const copiedPathCommandPath = path.join(copiedRoot, "bin", "knitten-path");

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
    if (!fs.existsSync(sourcePathCommandPath)) throw new Error(`missing ${sourcePathCommandPath}`);
    if (!fs.existsSync(sourceDomainPluginValidatorPath)) throw new Error(`missing ${sourceDomainPluginValidatorPath}`);
    if (!fs.existsSync(sourceLegacyBoundaryValidatorPath)) throw new Error(`missing ${sourceLegacyBoundaryValidatorPath}`);
    return `${sourceOutputScriptPath}, ${sourceOutputShimPath}, ${sourcePathCommandPath}, ${sourceDomainPluginValidatorPath}`;
  });

  check(checks, "source-config-registries", () => {
    return checkConfigRegistries(REPO_ROOT);
  });

  check(checks, "source-output-registry-contract", () => {
    return validateOutputRegistryContract(REPO_ROOT);
  });

  warningCheck(checks, "source-skill-shape-warnings", () => {
    return skillShapeWarnings(REPO_ROOT);
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
      "--skill=report-finding",
      "--name=doctor-output",
      `--workspace-root=${REPO_ROOT}`,
      `--target-root=${targetRoot}`,
    ]);
    const expectedPath = path.join(
      REPO_ROOT,
      ".agent-local",
      "workflow",
      "operational-findings",
      localDateString(),
      "reports",
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
    const expectedPath = path.join(copiedRoot, ".agent-local", "workflow", "reviews", "doctor-source-env-output.json");
    if (!sameRealPath(output.pluginRoot, copiedRoot)) {
      throw new Error(`source shim plugins-root env pluginRoot expected ${copiedRoot}, got ${output.pluginRoot}`);
    }
    if (!sameOutputPath(output.selectedPath, expectedPath)) {
      throw new Error(`source shim plugins-root env path expected ${expectedPath}, got ${output.selectedPath}`);
    }
    return "KNITTEN_PLUGINS_ROOT";
  });

  check(checks, "source-knitten-path", () => {
    const output = runJson(sourcePathCommandPath, [
      "output",
      "--kind=review-json",
      "--name=doctor-path-command",
      `--workspace-root=${REPO_ROOT}`,
    ]);
    if (output.selectedKind !== "review-json") throw new Error("knitten-path output returned unexpected selectedKind");
    const template = spawnSync(sourcePathCommandPath, ["template", "workflow/spec.md"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    if (template.status !== 0) throw new Error((template.stderr || template.stdout).trim());
    if (!template.stdout.trim().endsWith("document-templates/workflow/spec.md")) {
      throw new Error(`unexpected template path: ${template.stdout.trim()}`);
    }
    return "output, template";
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

  check(checks, "copied-files-match-source", () => {
    const diff = comparePluginTrees(REPO_ROOT, copiedRoot);
    if (diff.missing.length || diff.extra.length || diff.changed.length) {
      throw new Error(
        `copied plugin differs from source; missing=${diff.missing.join(",") || "none"} `
        + `extra=${diff.extra.join(",") || "none"} changed=${diff.changed.join(",") || "none"}`,
      );
    }
    return `${sourcePluginFiles(REPO_ROOT).length} copied files match source`;
  });

  check(checks, "copied-config-registries", () => {
    return checkConfigRegistries(copiedRoot);
  });

  check(checks, "copied-output-registry-contract", () => {
    return validateOutputRegistryContract(copiedRoot);
  });

  warningCheck(checks, "copied-skill-shape-warnings", () => {
    return skillShapeWarnings(copiedRoot);
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
    const expectedPath = path.join(copiedRoot, ".agent-local", "workflow", "reviews", "doctor-output.json");
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

  check(checks, "copied-knitten-path", () => {
    if (!fs.existsSync(copiedPathCommandPath)) throw new Error(`missing ${copiedPathCommandPath}`);
    const output = runJson(copiedPathCommandPath, [
      "output",
      "--kind=review-json",
      "--name=doctor-copied-path-command",
      `--workspace-root=${REPO_ROOT}`,
    ]);
    if (output.selectedKind !== "review-json") throw new Error("copied knitten-path output returned unexpected selectedKind");
    return copiedPathCommandPath;
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
    const expectedPath = path.join(copiedRoot, ".agent-local", "workflow", "reviews", "doctor-env-output.json");
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
