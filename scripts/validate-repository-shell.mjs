#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const requiredFiles = [
  ".codex-plugin/plugin.json",
  ".github/workflows/validate.yml",
  ".gitignore",
  "CHANGELOG.md",
  "LICENSE",
  "MILESTONE.md",
  "README.md",
  "SYSTEM.md",
  "agent/AGENTS.md",
  "agent/config/local-artifact-paths.json",
  "agent/config/local-helper-paths.json",
  "agent/config/outputs.json",
  "bin/knitten-path",
  "bin/knitten-resolve-output",
  "docs/guidelines/plugin-boundary-pr-check.md",
  "docs/specs/doctor-status-skill.md",
  "docs/specs/plugin-native-core-reboot.md",
  "document-templates/workflow/spec.md",
  "scripts/doctor.mjs",
  "scripts/materialize-local-plugin.mjs",
  "scripts/resolve-output.mjs",
  "scripts/validate-domain-plugin-boundary.mjs",
  "scripts/validate-repository-shell.mjs",
  "skills/status/SKILL.md",
];

function isAllowedFile(file) {
  if (requiredFiles.includes(file)) return true;
  if (file.startsWith("agent/config/") && file.endsWith(".json")) return true;
  if (file.startsWith("bin/")) return true;
  if (file.startsWith("docs/guidelines/") && file.endsWith(".md")) return true;
  if (file.startsWith("docs/public-core/")) return true;
  if (file.startsWith("docs/specs/") && file.endsWith(".md")) return true;
  if (file.startsWith("evals/context-load-smoke/") && file.endsWith(".json")) return true;
  if (file.startsWith("examples/minimal-domain-plugin/")) return true;
  if (file.startsWith("document-templates/") && (file.endsWith(".md") || file.endsWith(".json"))) return true;
  if (file.startsWith("scripts/")) return true;
  if (file.startsWith("skills/") && file.endsWith("/SKILL.md")) return true;
  if (file.startsWith("skills/") && file.includes("/references/")) return true;
  if (file.startsWith("skills/") && file.includes("/scripts/")) return true;
  if (file.startsWith("skills/") && file.includes("/agents/") && file.endsWith(".yaml")) return true;
  return false;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
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

function outputOwnerAllowed(madeBy, entry) {
  if (madeBy === "workflow:shared-session-handoff") return true;
  if (madeBy.startsWith("workflow:")) return true;
  if (fs.existsSync(path.join("skills", madeBy, "SKILL.md"))) return true;
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

function validateRegisteredOutputResolves(entry, problems) {
  if (entry.writeTarget?.kind !== "local-artifact") return;
  const scriptPath = "scripts/resolve-registered-output.mjs";
  if (!fs.existsSync(scriptPath)) {
    problems.push(`outputs:${entry.id || "<missing id>"} missing resolver ${scriptPath}`);
    return;
  }
  const assignments = (entry.args || []).map((arg) => `${arg.name}=${sampleForArg(arg)}`);
  const result = spawnSync("node", [scriptPath, entry.id, ...assignments], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "registered output resolution failed").trim();
    problems.push(`outputs:${entry.id || "<missing id>"} failed local-artifact resolution: ${detail}`);
  }
}

function validateOutputRegistryContract() {
  const outputs = readJson("agent/config/outputs.json");
  const localArtifacts = readJson("agent/config/local-artifact-paths.json");
  const localHelpers = readJson("agent/config/local-helper-paths.json");
  const problems = [];

  for (const entry of outputs.entries) {
    const id = entry.id || "<missing id>";
    const madeBy = String(entry.madeBy || "");
    if (!outputOwnerAllowed(madeBy, entry)) {
      problems.push(`outputs:${id} has disallowed or undocumented madeBy ${madeBy || "<missing>"}`);
    }

    if (entry.template) {
      if (!isSafeRelativePath(entry.template)) {
        problems.push(`outputs:${id} has unsafe template path ${entry.template}`);
      } else if (!fs.existsSync(entry.template)) {
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

    validateRegisteredOutputResolves(entry, problems);
  }

  for (const entry of localArtifacts.entries) {
    const label = `${entry.owner || "<missing owner>"}:${entry.artifactType || "<missing type>"}:${entry.item || "<missing item>"}`;
    if (!localArtifactOwnerAllowed(entry.owner, entry)) {
      problems.push(`local-artifact:${label} has disallowed or undocumented owner ${entry.owner || "<missing>"}`);
    }
    if (entry.template) {
      if (!isSafeRelativePath(entry.template)) {
        problems.push(`local-artifact:${label} has unsafe template path ${entry.template}`);
      } else if (!fs.existsSync(entry.template)) {
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
    if (!fs.existsSync(helperPath)) {
      problems.push(`helper:${id} missing path ${helperPath}`);
    }
  }

  if (problems.length > 0) {
    throw new Error(problems.join("; "));
  }
}

function skillShapeWarnings() {
  const warnings = [];
  const skillsRoot = "skills";
  if (!fs.existsSync(skillsRoot)) return [`${skillsRoot} does not exist`];
  const skills = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const skillName of skills) {
    const skillPath = path.join(skillsRoot, skillName, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    const body = fs.readFileSync(skillPath, "utf8");
    const frontmatter = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) {
      warnings.push(`${skillPath} missing YAML frontmatter`);
    } else if (!/^match-check:\s*(loose|normal|strict)\s*$/m.test(frontmatter[1])) {
      warnings.push(`${skillPath} missing match-check frontmatter`);
    }
    if (!body.includes("## Step 0: Match Check")) {
      warnings.push(`${skillPath} missing Step 0: Match Check`);
    }

    const referencesRoot = path.join(skillsRoot, skillName, "references");
    if (!fs.existsSync(referencesRoot)) continue;
    const referenceFiles = fs.readdirSync(referencesRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
    if (referenceFiles.length === 0) continue;
    if (!body.includes("Do not read detailed references until Step 0 passes.")) {
      warnings.push(`${skillPath} missing pre-reference Step 0 guard`);
    }
    if (!/## After Match[\s\S]*references\//.test(body)) {
      warnings.push(`${skillPath} missing post-match reference load instruction`);
    }
  }

  return warnings;
}

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) throw new Error(`missing required file: ${file}`);
}

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

for (const file of files) {
  if (!isAllowedFile(file)) {
    throw new Error(`unexpected file in plugin shell: ${file}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(".codex-plugin/plugin.json", "utf8"));
for (const field of ["name", "version", "description", "interface"]) {
  if (!manifest[field]) throw new Error(`plugin manifest missing ${field}`);
}
if (manifest.name !== "knitten") throw new Error("plugin manifest name must be knitten");

validateOutputRegistryContract();

const warnings = skillShapeWarnings();
for (const warning of warnings) {
  process.stderr.write(`warning: ${warning}\n`);
}

process.stdout.write(`repository shell ok: ${files.length} files\n`);
