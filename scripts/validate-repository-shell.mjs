#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const requiredFiles = [
  ".codex-plugin/plugin.json",
  ".github/workflows/validate.yml",
  ".gitignore",
  "LICENSE",
  "README.md",
  "SYSTEM.md",
  "agent/AGENTS.md",
  "agent/config/local-artifact-paths.json",
  "agent/config/local-helper-paths.json",
  "agent/config/outputs.json",
  "bin/knitten-resolve-output",
  "docs/guidelines/plugin-boundary-pr-check.md",
  "docs/specs/doctor-status-skill.md",
  "docs/specs/plugin-native-core-reboot.md",
  "document-templates/agent-hub/spec.md",
  "scripts/doctor.mjs",
  "scripts/materialize-local-plugin.mjs",
  "scripts/resolve-output.mjs",
  "scripts/validate-repository-shell.mjs",
  "skills/knitten-status/SKILL.md",
];

function isAllowedFile(file) {
  if (requiredFiles.includes(file)) return true;
  if (file.startsWith("agent/config/") && file.endsWith(".json")) return true;
  if (file.startsWith("docs/guidelines/") && file.endsWith(".md")) return true;
  if (file.startsWith("docs/public-core/")) return true;
  if (file.startsWith("docs/specs/") && file.endsWith(".md")) return true;
  if (file.startsWith("document-templates/") && (file.endsWith(".md") || file.endsWith(".json"))) return true;
  if (file.startsWith("skills/") && file.endsWith("/SKILL.md")) return true;
  return false;
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

process.stdout.write(`repository shell ok: ${files.length} files\n`);
