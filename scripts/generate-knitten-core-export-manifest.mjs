#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const INVENTORY_PATH = "agent/config/artifact-inventory.json";
const OVERLAYS_PATH = "agent/config/knitten-core-export-overlays.json";

function parseArgs(argv) {
  const args = { output: null };
  for (const arg of argv) {
    if (arg.startsWith("--output=")) {
      args.output = arg.slice("--output=".length);
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

async function readInventory() {
  const payload = JSON.parse(await fs.readFile(path.join(REPO_ROOT, INVENTORY_PATH), "utf8"));
  if (!Array.isArray(payload.rows)) {
    throw new Error(`${INVENTORY_PATH} rows must be an array`);
  }
  return payload;
}

async function readOverlays() {
  const overlayPath = path.join(REPO_ROOT, OVERLAYS_PATH);
  if (!existsSync(overlayPath)) return [];
  const payload = JSON.parse(await fs.readFile(overlayPath, "utf8"));
  if (!Array.isArray(payload.overlays)) {
    throw new Error(`${OVERLAYS_PATH} overlays must be an array`);
  }
  return payload.overlays;
}

function validateExport(entry, blockers) {
  const sourcePath = entry["source-artifact-path"];
  const targetPath = entry["target-path"] || sourcePath;
  if (entry["privacy-risk"] !== "public-safe") {
    blockers.push(`${entry["row-id"]}: privacy-risk ${entry["privacy-risk"]}`);
  }
  if (!sourcePath || !existsSync(path.join(REPO_ROOT, sourcePath))) {
    blockers.push(`${entry["row-id"]}: missing source path ${sourcePath || "(empty)"}`);
  }
  if (!targetPath || targetPath.startsWith("/") || targetPath.split(/[\\/]/).includes("..")) {
    blockers.push(`${entry["row-id"]}: invalid target path ${targetPath || "(empty)"}`);
  }
}

function buildManifest(inventory, overlays) {
  const exports = [];
  const blockers = [];

  for (const row of inventory.rows) {
    if (row["proposed-destination"] !== "knitten-core") continue;

    const sourcePath = row["source-artifact-path"];
    const entry = {
      "row-id": row["row-id"],
      "source-artifact-path": sourcePath,
      "target-path": sourcePath,
      "artifact-type": row["artifact-type"],
      "privacy-risk": row["privacy-risk"],
      "classification-stage": row["classification-stage"],
    };
    validateExport(entry, blockers);
    exports.push(entry);
  }

  for (const overlay of overlays) {
    const entry = {
      "row-id": overlay["row-id"],
      "source-artifact-path": overlay["source-artifact-path"],
      "target-path": overlay["target-path"],
      "artifact-type": overlay["artifact-type"],
      "privacy-risk": overlay["privacy-risk"],
      "classification-stage": overlay["classification-stage"],
    };
    validateExport(entry, blockers);
    exports.push(entry);
  }

  const seenTargets = new Map();
  for (const entry of exports) {
    const targetPath = entry["target-path"];
    const previous = seenTargets.get(targetPath);
    if (previous) {
      blockers.push(`${entry["row-id"]}: duplicate target path ${targetPath} already used by ${previous}`);
      continue;
    }
    seenTargets.set(targetPath, entry["row-id"]);
  }

  if (blockers.length > 0) {
    throw new Error(`core export blockers:\n${blockers.map((item) => `- ${item}`).join("\n")}`);
  }

  exports.sort((a, b) => a["source-artifact-path"].localeCompare(b["source-artifact-path"]));

  return {
    "schema-version": 1,
    "source-inventory": INVENTORY_PATH,
    "export-count": exports.length,
    exports,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inventory = await readInventory();
  const overlays = await readOverlays();
  const manifest = buildManifest(inventory, overlays);
  const json = `${JSON.stringify(manifest, null, 2)}\n`;

  if (args.output) {
    const outputPath = path.join(REPO_ROOT, args.output);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, json);
    console.error(`wrote ${args.output} (${manifest["export-count"]} exports)`);
    return;
  }

  process.stdout.write(json);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
