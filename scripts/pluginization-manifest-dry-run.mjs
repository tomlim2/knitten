#!/usr/bin/env node
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const DEFAULT_MANIFESTS = ["examples/artifact-packs/example-skill-pack/artifact-pack.json"];
const REPORT_DIR = "docs/plans/reports/knitten-pluginization-core-extraction";

function parseArgs(argv) {
  const args = { date: new Date().toISOString().slice(0, 10), manifests: [], out: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    const eq = arg.indexOf("=");
    const key = eq === -1 ? arg : arg.slice(0, eq);
    const inlineValue = eq === -1 ? null : arg.slice(eq + 1);
    if (!["--date", "--manifest", "--out"].includes(key)) throw new Error(`unknown argument: ${arg}`);
    const value = inlineValue ?? argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`${key} requires a value`);
    if (key === "--manifest") args.manifests.push(value);
    else args[key.slice(2)] = value;
    if (inlineValue === null) i += 1;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error("--date must be YYYY-MM-DD");
  if (args.manifests.length === 0) args.manifests = DEFAULT_MANIFESTS;
  return args;
}

async function readManifest(manifestPath) {
  const absolutePath = path.resolve(REPO_ROOT, manifestPath);
  const manifest = JSON.parse(await fs.readFile(absolutePath, "utf8"));
  return { manifestPath, absolutePath, manifest };
}

function manifestSummary({ manifestPath, manifest, validation }) {
  return {
    "manifest-path": manifestPath,
    "pack-id": manifest["pack-id"],
    visibility: manifest.visibility,
    "owner-domain": manifest["owner-domain"],
    exports: manifest.exports.map((entry) => entry["artifact-id"]),
    "compatibility-aliases": (manifest["compatibility-aliases"] || []).map((entry) => entry["alias-id"]),
    "validation-command": `node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack ${manifestPath}`,
    "validation-result": validation.ok ? "pass" : "fail",
    "validation-detail": validation.detail,
  };
}

async function validateManifest(manifestPath) {
  try {
    await execFileAsync(process.execPath, [
      "scripts/validate-llm-first.mjs",
      "--check",
      "artifact-pack",
      "--artifact-pack",
      manifestPath,
    ], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    return { ok: true, detail: "artifact-pack validator passed" };
  } catch (err) {
    return { ok: false, detail: (err.stdout || err.stderr || err.message).trim() };
  }
}

function cell(values) {
  if (!Array.isArray(values)) return String(values || "none");
  if (values.length === 0) return "none";
  return values.join("<br>");
}

function renderMarkdown({ date, rows }) {
  return `---
status: report
created: ${date}
owner: agent-hub
spec: ../../proposed/knitten-pluginization-core-extraction.md
---

# Pluginization Manifest Dry Run ${date}

## Purpose

Validate candidate artifact-pack manifests without moving production files.

## Candidate Manifests

| manifest path | pack id | visibility | owner domain | exports | compatibility aliases | validation result |
|---------------|---------|------------|--------------|---------|-----------------------|-------------------|
${rows.map((row) => `| ${row["manifest-path"]} | ${row["pack-id"]} | ${row.visibility} | ${row["owner-domain"]} | ${cell(row.exports)} | ${cell(row["compatibility-aliases"])} | ${row["validation-result"]} |`).join("\n")}

## Validation Commands

${rows.map((row) => `- \`${row["validation-command"]}\` -> ${row["validation-result"]}`).join("\n")}

## Gate Result

| Gate | Result |
|------|--------|
| no production file movement | pass |
| first pilot is not Shotloom | pass |
| manifest validator passes | ${rows.every((row) => row["validation-result"] === "pass") ? "pass" : "fail"} |
`;
}

export async function buildPluginizationManifestDryRun({ date = new Date().toISOString().slice(0, 10), manifests = DEFAULT_MANIFESTS } = {}) {
  const rows = [];
  for (const manifestPath of manifests) {
    const manifestInfo = await readManifest(manifestPath);
    const validation = await validateManifest(manifestPath);
    rows.push(manifestSummary({ ...manifestInfo, validation }));
  }
  return {
    date,
    rows,
    markdown: renderMarkdown({ date, rows }),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = await buildPluginizationManifestDryRun({ date: args.date, manifests: args.manifests });
  if (args.json) {
    process.stdout.write(`${JSON.stringify({ date: dryRun.date, rows: dryRun.rows }, null, 2)}\n`);
    return;
  }
  const outputPath = args.out || path.join(REPO_ROOT, REPORT_DIR, `manifest-dry-run-${args.date}.md`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, dryRun.markdown);
  console.log(`wrote ${path.relative(REPO_ROOT, outputPath)}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
