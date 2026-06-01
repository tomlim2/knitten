#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");

const KINDS = {
  outputs: {
    corePath: "agent/config/outputs.json",
    packPath: "config/outputs.json",
    mountTarget: "outputs.json",
    validate(registry, source) {
      if (!registry || registry.schemaVersion !== 1 || !Array.isArray(registry.entries)) {
        throw new Error(`${source} outputs registry must have schemaVersion 1 and entries[]`);
      }
    },
    entryKey(entry) {
      return entry?.id;
    },
    duplicateLabel(key) {
      return `duplicate output id: ${key}`;
    },
  },
  "local-artifact-paths": {
    corePath: "agent/config/local-artifact-paths.json",
    packPath: "config/local-artifact-paths.json",
    mountTarget: "local-artifact-paths.json",
    validate(registry, source) {
      if (!registry || registry.schemaVersion !== 1 || registry.root !== ".agent-local" || !Array.isArray(registry.entries)) {
        throw new Error(`${source} local-artifact-paths registry must have schemaVersion 1, root .agent-local, and entries[]`);
      }
    },
    entryKey(entry) {
      if (!entry) return null;
      return `${entry.owner}/${entry.artifactType}/${entry.item}`;
    },
    duplicateLabel(key) {
      return `duplicate local artifact identity: ${key}`;
    },
  },
};

function parseArgs(argv) {
  const args = { kind: null, registry: null, out: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    const eq = arg.indexOf("=");
    const key = eq === -1 ? arg : arg.slice(0, eq);
    const inlineValue = eq === -1 ? null : arg.slice(eq + 1);
    if (!["--kind", "--registry", "--out"].includes(key)) {
      throw new Error(`unknown argument: ${arg}`);
    }
    const value = inlineValue ?? argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`${key} requires a value`);
    args[key.slice(2)] = value;
    if (inlineValue === null) i += 1;
  }
  return args;
}

function usage() {
  return [
    "usage: node scripts/merge-artifact-pack-registries.mjs --kind <outputs|local-artifact-paths> --registry <installed-pack-registry> [--out <path>]",
    "",
    "Derives a generated registry view from core config plus active artifact-pack config exports.",
  ].join("\n");
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

function activeInstalledRows(registry) {
  if (!registry || registry["schema-version"] !== 1 || !Array.isArray(registry["installed-packs"])) {
    throw new Error("installed pack registry must have schema-version 1 and installed-packs[]");
  }
  return registry["installed-packs"].filter((row) => row?.state === "active");
}

function isConfigExportForKind(entry, config) {
  return entry?.["artifact-type"] === "config" &&
    entry.shape === "file" &&
    entry.mount?.layer === "config" &&
    (
      entry.path === config.packPath ||
      entry.mount.target === config.mountTarget
    );
}

function normalizePackRegistryTemplates(registry, sourcePath) {
  return {
    ...registry,
    entries: registry.entries.map((entry) => {
      if (typeof entry?.template !== "string" || path.isAbsolute(entry.template)) return entry;
      return {
        ...entry,
        template: path.resolve(sourcePath, entry.template),
      };
    }),
  };
}

async function packConfigRegistries(kind, installedRegistryPath) {
  const config = KINDS[kind];
  const installedRegistry = await readJson(installedRegistryPath);
  const rows = activeInstalledRows(installedRegistry);
  const registries = [];

  for (const row of rows) {
    const packId = row["pack-id"] || "<unknown-pack>";
    if (typeof row["source-path"] !== "string" || typeof row["manifest-path"] !== "string") {
      throw new Error(`${packId} active registry row must include source-path and manifest-path`);
    }
    const manifest = await readJson(row["manifest-path"]);
    if (manifest?.["schema-version"] !== 1 || manifest?.["pack-id"] !== packId || !Array.isArray(manifest.exports)) {
      throw new Error(`${packId} manifest shape is invalid or does not match installed row`);
    }
    for (const entry of manifest.exports) {
      if (!isConfigExportForKind(entry, config)) continue;
      const registryPath = path.resolve(row["source-path"], entry.path);
      const registry = await readJson(registryPath);
      config.validate(registry, `${packId}/${entry["artifact-id"]}`);
      registries.push({
        packId,
        artifactId: entry["artifact-id"],
        path: registryPath,
        registry: normalizePackRegistryTemplates(registry, row["source-path"]),
      });
    }
  }

  return registries;
}

function mergeEntries(kind, coreRegistry, packRegistries) {
  const config = KINDS[kind];
  const seen = new Map();
  const entries = [];
  const addEntry = (entry, source) => {
    const key = config.entryKey(entry);
    if (typeof key !== "string" || !key) throw new Error(`${source} has an entry without a merge key`);
    if (seen.has(key)) {
      throw new Error(`${config.duplicateLabel(key)} (${seen.get(key)} vs ${source})`);
    }
    seen.set(key, source);
    entries.push(entry);
  };

  for (const entry of coreRegistry.entries) addEntry(entry, "core");
  for (const pack of packRegistries) {
    for (const entry of pack.registry.entries) addEntry(entry, `${pack.packId}/${pack.artifactId}`);
  }
  return entries;
}

export async function mergeArtifactPackRegistries({ kind, registryPath }) {
  const config = KINDS[kind];
  if (!config) throw new Error(`unsupported kind: ${kind}`);
  const coreRegistryPath = path.join(REPO_ROOT, config.corePath);
  const coreRegistry = await readJson(coreRegistryPath);
  config.validate(coreRegistry, "core");
  const packRegistries = await packConfigRegistries(kind, path.resolve(registryPath));
  const merged = {
    ...coreRegistry,
    entries: mergeEntries(kind, coreRegistry, packRegistries),
    generated: {
      by: "merge-artifact-pack-registries@0",
      kind,
      core: config.corePath,
      "installed-pack-registry": path.resolve(registryPath),
      packs: packRegistries.map((pack) => ({
        "pack-id": pack.packId,
        "artifact-id": pack.artifactId,
      })),
    },
  };
  return merged;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.kind) throw new Error("--kind is required");
  if (!args.registry) throw new Error("--registry is required");
  const merged = await mergeArtifactPackRegistries({ kind: args.kind, registryPath: args.registry });
  const text = `${JSON.stringify(merged, null, 2)}\n`;
  if (args.out) {
    const out = path.resolve(args.out);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, text);
  } else {
    process.stdout.write(text);
  }
}

if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
