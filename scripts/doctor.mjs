#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PLUGIN_NAME = "knitten";
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

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
  const marketplacePath = path.join(args.marketplaceRoot, "marketplace.json");
  const copiedRoot = path.join(args.marketplaceRoot, "plugins", PLUGIN_NAME);
  const copiedManifestPath = path.join(copiedRoot, ".codex-plugin", "plugin.json");

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

  const ok = checks.every((item) => item.ok);
  process.stdout.write(`${JSON.stringify({ ok, checks }, null, 2)}\n`);
  if (!ok) process.exitCode = 1;
}

main();
