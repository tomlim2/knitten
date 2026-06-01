#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveArtifactRoute } from "./resolve-artifact-route.mjs";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const DEFAULT_MANIFEST = "examples/artifact-packs/example-skill-pack/artifact-pack.json";
const REPORT_DIR = "docs/plans/reports/knitten-pluginization-core-extraction";

function parseArgs(argv) {
  const args = { date: new Date().toISOString().slice(0, 10), manifest: DEFAULT_MANIFEST, out: null, json: false };
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
    args[key.slice(2)] = value;
    if (inlineValue === null) i += 1;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error("--date must be YYYY-MM-DD");
  return args;
}

async function readManifest(manifestPath) {
  return JSON.parse(await fs.readFile(path.join(REPO_ROOT, manifestPath), "utf8"));
}

function installedRow(manifest) {
  return {
    "pack-id": manifest["pack-id"],
    state: "active",
    scope: {},
    "candidate-index": manifest.exports.map((entry) => ({
      "pack-id": manifest["pack-id"],
      "artifact-id": entry["artifact-id"],
      "artifact-type": entry["artifact-type"],
      "source-ref": `${manifest["pack-id"]}/${entry["artifact-id"]}`,
      load: entry.load,
      route: entry.route || {},
      scope: {},
    })),
  };
}

function route(manifest, request) {
  return resolveArtifactRoute({
    harnessId: "codex",
    cwdRepoKey: "knitten",
    workMode: "personal",
    touchedPaths: [],
    namedArtifact: [],
    installedPacks: [installedRow(manifest)],
    manifests: [manifest],
    ...request,
  });
}

function scenarioResult(name, result) {
  return {
    name,
    "result-kind": result["result-kind"],
    "primary-candidate-id": result["primary-candidate-id"] || "none",
    "emitted-candidate-count": result["emitted-candidate-count"],
    "resolver-body-load-count": result["resolver-body-load-count"],
    "secondary-candidate-count": result["secondary-candidate-ids"]?.length || 0,
  };
}

function renderMarkdown({ date, manifestPath, manifest, scenarios }) {
  return `---
status: report
created: ${date}
owner: agent-hub
spec: ../../proposed/knitten-pluginization-core-extraction.md
---

# Pluginization Pilot Verification ${date}

## Purpose

Verify the low-risk pilot pack without moving production artifacts.

## Pilot

| Field | Value |
|-------|-------|
| manifest | ${manifestPath} |
| pack id | ${manifest["pack-id"]} |
| first pilot is Shotloom | no |

## Route Results

| scenario | result kind | primary candidate | emitted candidates | body loads | secondary candidates |
|----------|-------------|-------------------|--------------------|------------|----------------------|
${scenarios.map((row) => `| ${row.name} | ${row["result-kind"]} | ${row["primary-candidate-id"]} | ${row["emitted-candidate-count"]} | ${row["resolver-body-load-count"]} | ${row["secondary-candidate-count"]} |`).join("\n")}

## Gate Result

| Gate | Result |
|------|--------|
| route evidence selects pilot | ${scenarios.find((row) => row.name === "route-evidence")?.["result-kind"] === "primary" ? "pass" : "fail"} |
| compatibility alias selects canonical artifact | ${scenarios.find((row) => row.name === "compatibility-alias")?.["result-kind"] === "primary" ? "pass" : "fail"} |
| resolver body loads remain zero | ${scenarios.every((row) => row["resolver-body-load-count"] === 0) ? "pass" : "fail"} |
`;
}

export async function buildPluginizationPilotVerification({ date = new Date().toISOString().slice(0, 10), manifestPath = DEFAULT_MANIFEST } = {}) {
  const manifest = await readManifest(manifestPath);
  const routeEvidence = route(manifest, {
    requestText: "please review this web markdown page",
    touchedPaths: ["README.md"],
  });
  const compatibilityAlias = route(manifest, {
    requestText: "use old-demo-web-review",
    namedArtifact: ["old-demo-web-review"],
  });
  const scenarios = [
    scenarioResult("route-evidence", routeEvidence),
    scenarioResult("compatibility-alias", compatibilityAlias),
  ];
  return {
    date,
    manifestPath,
    manifest,
    scenarios,
    markdown: renderMarkdown({ date, manifestPath, manifest, scenarios }),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const verification = await buildPluginizationPilotVerification({ date: args.date, manifestPath: args.manifest });
  if (args.json) {
    process.stdout.write(`${JSON.stringify({ date: verification.date, manifestPath: verification.manifestPath, scenarios: verification.scenarios }, null, 2)}\n`);
    return;
  }
  const outputPath = args.out || path.join(REPO_ROOT, REPORT_DIR, `pilot-verification-${args.date}.md`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, verification.markdown);
  console.log(`wrote ${path.relative(REPO_ROOT, outputPath)}`);
}

if (process.argv[1] === __filename) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
