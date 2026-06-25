#!/usr/bin/env node
import { execFileSync } from "node:child_process";
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
  "document-templates/agent-hub/spec.md",
  "scripts/doctor.mjs",
  "scripts/materialize-local-plugin.mjs",
  "scripts/resolve-output.mjs",
  "scripts/validate-repository-shell.mjs",
  "skills/kc-status/SKILL.md",
];

function isAllowedFile(file) {
  if (requiredFiles.includes(file)) return true;
  if (file.startsWith("agent/config/") && file.endsWith(".json")) return true;
  if (file.startsWith("bin/")) return true;
  if (file.startsWith("docs/guidelines/") && file.endsWith(".md")) return true;
  if (file.startsWith("docs/public-core/")) return true;
  if (file.startsWith("docs/specs/") && file.endsWith(".md")) return true;
  if (file.startsWith("evals/routing-smoke/") && file.endsWith(".json")) return true;
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
    || relativePath.startsWith("skills/kc-");
}

function isShotloomCompatibilityEntry(entry) {
  const compatibility = entry.compatibility || {};
  return compatibility.status === "compatibility-era"
    && compatibility.owner === "shotloom"
    && compatibility.deprecatedBy === "shotloom-task-artifact-resolver"
    && compatibility.primaryStorage === false;
}

function isShotloomMaker(madeBy) {
  return madeBy.startsWith("shotloom-") || madeBy.startsWith("workflow:shotloom-");
}

function outputOwnerAllowed(madeBy, entry) {
  if (isShotloomMaker(madeBy)) return isShotloomCompatibilityEntry(entry);
  if (madeBy === "workflow:agent-hub-session-handoff") return true;
  if (madeBy.startsWith("workflow:")) return true;
  if (madeBy.startsWith("kc-") && fs.existsSync(path.join("skills", madeBy, "SKILL.md"))) return true;
  return false;
}

function localArtifactOwnerAllowed(owner, entry) {
  if (owner === "shotloom") return isShotloomCompatibilityEntry(entry);
  return owner === "ah";
}

function validateRoutingRegistryContract() {
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

validateRoutingRegistryContract();

process.stdout.write(`repository shell ok: ${files.length} files\n`);
