#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const PLUGIN_NAME = "knitten";
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const COPY_EXCLUDES = new Set([
  ".agent-local",
  ".git",
  ".DS_Store",
  "node_modules",
]);

function trackedFiles() {
  const result = spawnSync("git", ["ls-files", "-z"], {
    cwd: REPO_ROOT,
    encoding: "buffer",
  });
  if (result.status !== 0) {
    throw new Error((result.stderr.toString("utf8") || "git ls-files failed").trim());
  }
  return result.stdout
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((relative) => !relative.split("/").some((part) => COPY_EXCLUDES.has(part)));
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    marketplaceRoot: os.homedir(),
    cachebuster: defaultCachebuster(),
    useCachebuster: true,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--no-cachebuster") {
      args.useCachebuster = false;
    } else if (arg.startsWith("--marketplace-root=")) {
      args.marketplaceRoot = path.resolve(arg.slice("--marketplace-root=".length));
    } else if (arg.startsWith("--cachebuster=")) {
      args.cachebuster = sanitizeCachebuster(arg.slice("--cachebuster=".length));
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
  materialize-local-plugin.mjs [--dry-run] [--marketplace-root=<path>] [--cachebuster=<token>] [--no-cachebuster]

Copies this checkout into the Codex personal plugin folder and upserts the
personal marketplace entry.`;
}

function defaultCachebuster() {
  return new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
}

function sanitizeCachebuster(value) {
  const sanitized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  if (!sanitized) throw new Error("cachebuster must contain at least one letter or digit");
  return sanitized;
}

function withCachebuster(version, cachebuster) {
  return `${String(version).split("+", 1)[0]}+codex.${cachebuster}`;
}

function assertTargetOutsideRepo(targetDir) {
  const relative = path.relative(REPO_ROOT, targetDir);
  if (relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error(`target plugin directory must be outside this checkout: ${targetDir}`);
  }
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function readManifest(root) {
  const manifestPath = path.join(root, ".codex-plugin", "plugin.json");
  if (!existsSync(manifestPath)) throw new Error(`missing manifest: ${manifestPath}`);
  const manifest = await readJson(manifestPath);
  if (manifest.name !== PLUGIN_NAME) {
    throw new Error(`${manifestPath} name must be ${JSON.stringify(PLUGIN_NAME)}`);
  }
  return manifest;
}

async function readMarketplace(marketplacePath) {
  if (!existsSync(marketplacePath)) {
    return {
      name: "knitten-local",
      interface: {
        displayName: "Knitten Local",
      },
      plugins: [],
    };
  }
  const marketplace = await readJson(marketplacePath);
  if (!Array.isArray(marketplace.plugins)) marketplace.plugins = [];
  if (!marketplace.name || marketplace.name === "personal") marketplace.name = "knitten-local";
  if (!marketplace.interface || typeof marketplace.interface !== "object") {
    marketplace.interface = { displayName: "Knitten Local" };
  } else if (!marketplace.interface.displayName || marketplace.interface.displayName === "Personal") {
    marketplace.interface.displayName = "Knitten Local";
  }
  return marketplace;
}

function upsertMarketplaceEntry(marketplace) {
  const entry = {
    name: PLUGIN_NAME,
    source: {
      source: "local",
      path: `./plugins/${PLUGIN_NAME}`,
    },
    policy: {
      installation: "AVAILABLE",
      authentication: "ON_INSTALL",
    },
    category: "Productivity",
  };
  const index = marketplace.plugins.findIndex((plugin) => plugin?.name === PLUGIN_NAME);
  if (index === -1) {
    marketplace.plugins.push(entry);
    return "added";
  }
  marketplace.plugins[index] = {
    ...marketplace.plugins[index],
    ...entry,
  };
  return "updated";
}

async function copyPlugin(targetDir, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] refresh ${targetDir} from ${REPO_ROOT}`);
    return;
  }
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
  for (const relative of trackedFiles()) {
    const source = path.join(REPO_ROOT, relative);
    const target = path.join(targetDir, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.cp(source, target, { force: true });
  }
}

async function rewriteCopiedManifest(targetDir, sourceManifest, cachebuster, dryRun) {
  if (!cachebuster) return;
  const nextVersion = withCachebuster(sourceManifest.version, cachebuster);
  if (dryRun) {
    console.log(`[dry-run] set ${PLUGIN_NAME} version: ${sourceManifest.version} -> ${nextVersion}`);
    return;
  }
  const manifestPath = path.join(targetDir, ".codex-plugin", "plugin.json");
  const manifest = await readJson(manifestPath);
  manifest.version = nextVersion;
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`set ${PLUGIN_NAME} version: ${sourceManifest.version} -> ${nextVersion}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceManifest = await readManifest(REPO_ROOT);
  const marketplacePath = path.join(args.marketplaceRoot, ".agents", "plugins", "marketplace.json");
  const targetDir = path.join(args.marketplaceRoot, "plugins", PLUGIN_NAME);
  assertTargetOutsideRepo(targetDir);
  const marketplace = await readMarketplace(marketplacePath);
  const action = upsertMarketplaceEntry(marketplace);

  console.log(`${action} marketplace entry: ${PLUGIN_NAME}`);
  await copyPlugin(targetDir, args.dryRun);
  await rewriteCopiedManifest(targetDir, sourceManifest, args.useCachebuster ? args.cachebuster : "", args.dryRun);

  if (args.dryRun) {
    console.log(`[dry-run] write ${marketplacePath}`);
    return;
  }
  await fs.mkdir(path.dirname(marketplacePath), { recursive: true });
  await fs.writeFile(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`, "utf8");
  console.log(`wrote marketplace: ${marketplacePath}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
