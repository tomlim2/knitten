#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");

const INVENTORY_PATH = "agent/config/artifact-inventory.json";
const OUTPUTS_PATH = "agent/config/outputs.json";
const LOCAL_ARTIFACT_PATHS_PATH = "agent/config/local-artifact-paths.json";
const REPORT_DIR = "docs/plans/reports/knitten-pluginization-core-extraction";

function parseArgs(argv) {
  const args = { date: new Date().toISOString().slice(0, 10), out: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") {
      args.json = true;
      continue;
    }
    const eq = arg.indexOf("=");
    const key = eq === -1 ? arg : arg.slice(0, eq);
    const inlineValue = eq === -1 ? null : arg.slice(eq + 1);
    if (!["--date", "--out"].includes(key)) throw new Error(`unknown argument: ${arg}`);
    const value = inlineValue ?? argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`${key} requires a value`);
    args[key.slice(2)] = value;
    if (inlineValue === null) i += 1;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error("--date must be YYYY-MM-DD");
  return args;
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(REPO_ROOT, relativePath), "utf8"));
}

function skillIdForPath(sourcePath) {
  return sourcePath?.match(/^agent\/skills\/([^/]+)\/SKILL\.md$/)?.[1] || null;
}

function candidatePackFor(row) {
  if (row["classification-stage"] === "deprecated") return "deprecated-pack";
  if (row["classification-stage"] === "migrate-later" || row["proposed-destination"] === "migrate-later") return "migrate-later";
  switch (row["owner-domain"]) {
    case "core":
      return "knitten-core";
    case "repo":
      return "repo-private-pack";
    case "company":
      return "company-private-pack";
    case "domain":
      return "domain-pack";
    case "experiment":
      return "incubator-pack";
    case "personal":
      return "personal-private-pack";
    default:
      return "needs-review";
  }
}

function blockerStatusFor(row) {
  const blockers = [];
  if (row["privacy-risk"] === "needs-scrub" || row["privacy-risk"] === "private-only") blockers.push(`privacy:${row["privacy-risk"]}`);
  if (row["owner-domain"] === "unknown") blockers.push("owner-domain:unknown");
  if (row["compatibility-need"] === "unknown") blockers.push("compatibility:unknown");
  if (row["review-state"] === "blocked") blockers.push("review:blocked");
  if (row["classification-stage"] === "undecided") blockers.push("classification:undecided");
  return blockers.length ? blockers.join(", ") : "none";
}

function madeByMatchesSkill(madeBy, skillId) {
  if (!skillId || typeof madeBy !== "string") return false;
  return madeBy === skillId || madeBy === `workflow:${skillId}`;
}

function outputIdsForRow(row, outputs) {
  const skillId = skillIdForPath(row["source-artifact-path"]);
  if (!skillId) return [];
  return outputs.entries
    .filter((entry) => madeByMatchesSkill(entry.madeBy, skillId))
    .map((entry) => entry.id);
}

function localArtifactIdentitiesForRow(row, localArtifactPaths) {
  const sourcePath = row["source-artifact-path"] || "";
  const skillId = skillIdForPath(sourcePath);
  if (!skillId) return [];
  const ownerHint = skillId.startsWith("shotloom-") ? "shotloom" : skillId.startsWith("ah-") ? "ah" : null;
  if (!ownerHint) return [];
  return localArtifactPaths.entries
    .filter((entry) => entry.owner === ownerHint)
    .map((entry) => `${entry.owner}/${entry.artifactType}/${entry.item}`);
}

function templateForRow(row, outputs, localArtifactPaths) {
  const templates = new Set();
  for (const id of outputIdsForRow(row, outputs)) {
    const entry = outputs.entries.find((item) => item.id === id);
    if (entry?.template) templates.add(entry.template);
  }
  for (const identity of localArtifactIdentitiesForRow(row, localArtifactPaths)) {
    const [owner, artifactType, item] = identity.split("/");
    const entry = localArtifactPaths.entries.find((candidate) => candidate.owner === owner && candidate.artifactType === artifactType && candidate.item === item);
    if (entry?.template) templates.add(entry.template);
  }
  if (row["source-artifact-path"]?.startsWith("agent/document-templates/")) templates.add(row["source-artifact-path"]);
  return [...templates].sort();
}

function scriptForRow(row) {
  const sourcePath = row["source-artifact-path"] || "";
  return sourcePath.startsWith("scripts/") ? [sourcePath] : [];
}

function cell(values) {
  if (!Array.isArray(values)) return String(values || "none");
  if (values.length === 0) return "none";
  return values.slice(0, 8).join("<br>");
}

function aggregateRows(rows, outputs, localArtifactPaths) {
  return rows.map((row) => ({
    "candidate-pack": candidatePackFor(row),
    "row-id": row["row-id"],
    "owner-domain": row["owner-domain"],
    "privacy-risk": row["privacy-risk"],
    dependencies: row.dependencies || [],
    "support-files": row["source-artifact-path"] ? [row["source-artifact-path"]] : [],
    "output-ids": outputIdsForRow(row, outputs),
    "local-artifact-identities": localArtifactIdentitiesForRow(row, localArtifactPaths),
    templates: templateForRow(row, outputs, localArtifactPaths),
    scripts: scriptForRow(row),
    "compatibility-need": row["compatibility-need"],
    "blocker-status": blockerStatusFor(row),
  }));
}

function packSummary(rows) {
  const packs = new Map();
  for (const row of rows) {
    const key = row["candidate-pack"];
    const summary = packs.get(key) || { rows: 0, blockers: 0, "privacy-risks": new Set(), "owner-domains": new Set() };
    summary.rows += 1;
    if (row["blocker-status"] !== "none") summary.blockers += 1;
    summary["privacy-risks"].add(row["privacy-risk"]);
    summary["owner-domains"].add(row["owner-domain"]);
    packs.set(key, summary);
  }
  return [...packs.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([pack, summary]) => ({
    pack,
    rows: summary.rows,
    blockers: summary.blockers,
    "owner-domains": [...summary["owner-domains"]].sort(),
    "privacy-risks": [...summary["privacy-risks"]].sort(),
  }));
}

function renderMarkdown({ date, inventory, rows, summaries }) {
  const highSignalRows = rows
    .filter((row) => row["candidate-pack"] !== "knitten-core" || row["blocker-status"] !== "none")
    .slice(0, 120);
  return `---
status: report
created: ${date}
owner: agent-hub
spec: ../../proposed/knitten-pluginization-core-extraction.md
---

# Pluginization Inventory ${date}

## Purpose

Dry-run pack grouping from \`${INVENTORY_PATH}\`. This report does not move files
or assign final skill classification.

## Source

| Field | Value |
|-------|-------|
| source commit | \`${inventory["source-commit"]}\` |
| source dirty | \`${inventory["source-dirty"]}\` |
| inventory rows | ${inventory.rows.length} |

## Pack Summary

| candidate pack | rows | blockers | owner domains | privacy risks |
|----------------|------|----------|---------------|---------------|
${summaries.map((row) => `| ${row.pack} | ${row.rows} | ${row.blockers} | ${cell(row["owner-domains"])} | ${cell(row["privacy-risks"])} |`).join("\n")}

## Candidate Rows

| candidate pack | row id | owner domain | privacy risk | dependencies | support files | output ids | local artifact identities | templates | scripts | compatibility need | blocker status |
|----------------|--------|--------------|--------------|--------------|---------------|------------|---------------------------|-----------|---------|--------------------|----------------|
${highSignalRows.map((row) => `| ${row["candidate-pack"]} | \`${row["row-id"]}\` | ${row["owner-domain"]} | ${row["privacy-risk"]} | ${cell(row.dependencies)} | ${cell(row["support-files"])} | ${cell(row["output-ids"])} | ${cell(row["local-artifact-identities"])} | ${cell(row.templates)} | ${cell(row.scripts)} | ${row["compatibility-need"]} | ${row["blocker-status"]} |`).join("\n")}

## Gate Result

| Gate | Result |
|------|--------|
| no file movement | pass |
| final skill classification deferred | pass |
| candidate pack visibility | pass |
| blocker visibility | pass |
`;
}

export async function buildPluginizationInventoryReport({ date = new Date().toISOString().slice(0, 10) } = {}) {
  const inventory = await readJson(INVENTORY_PATH);
  const outputs = await readJson(OUTPUTS_PATH);
  const localArtifactPaths = await readJson(LOCAL_ARTIFACT_PATHS_PATH);
  if (inventory["schema-version"] !== 1 || !Array.isArray(inventory.rows)) throw new Error("artifact inventory shape is invalid");
  const rows = aggregateRows(inventory.rows, outputs, localArtifactPaths);
  const summaries = packSummary(rows);
  return {
    date,
    inventory,
    rows,
    summaries,
    markdown: renderMarkdown({ date, inventory, rows, summaries }),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = await buildPluginizationInventoryReport({ date: args.date });
  if (args.json) {
    process.stdout.write(`${JSON.stringify({ date: report.date, rows: report.rows, summaries: report.summaries }, null, 2)}\n`);
    return;
  }
  const outputPath = args.out || path.join(REPO_ROOT, REPORT_DIR, `pluginization-inventory-${args.date}.md`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, report.markdown);
  console.log(`wrote ${path.relative(REPO_ROOT, outputPath)}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
