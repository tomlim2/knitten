#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function parseArgs(argv) {
  const args = { manifest: null, outputDir: null };
  for (const arg of argv) {
    if (arg.startsWith("--manifest=")) {
      args.manifest = arg.slice("--manifest=".length);
      continue;
    }
    if (arg.startsWith("--output-dir=")) {
      args.outputDir = arg.slice("--output-dir=".length);
      continue;
    }
    throw new Error(`unknown argument: ${arg}`);
  }
  if (!args.manifest) throw new Error("missing --manifest=<path>");
  if (!args.outputDir) throw new Error("missing --output-dir=<path>");
  return args;
}

function resolveUnder(base, relativePath) {
  const resolved = path.resolve(base, relativePath);
  const rel = path.relative(base, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`path escapes root: ${relativePath}`);
  }
  return resolved;
}

async function assertEmptyOutputDir(outputDir) {
  if (!existsSync(outputDir)) return;
  const entries = await fs.readdir(outputDir);
  if (entries.length > 0) {
    throw new Error(`output directory is not empty: ${path.relative(REPO_ROOT, outputDir) || outputDir}`);
  }
}

async function copyExport(sourcePath, targetPath, outputDir) {
  const source = resolveUnder(REPO_ROOT, sourcePath);
  if (!existsSync(source)) throw new Error(`missing source file: ${sourcePath}`);

  const target = resolveUnder(outputDir, targetPath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestPath = resolveUnder(REPO_ROOT, args.manifest);
  const outputDir = path.resolve(REPO_ROOT, args.outputDir);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

  if (!Array.isArray(manifest.exports)) throw new Error("manifest exports must be an array");

  await assertEmptyOutputDir(outputDir);
  await fs.mkdir(outputDir, { recursive: true });

  for (const entry of manifest.exports) {
    if (!entry["source-artifact-path"]) throw new Error("manifest export missing source-artifact-path");
    await copyExport(entry["source-artifact-path"], entry["target-path"] || entry["source-artifact-path"], outputDir);
  }

  await fs.writeFile(
    path.join(outputDir, ".knitten-core-export-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.error(`assembled ${manifest.exports.length} files into ${path.relative(REPO_ROOT, outputDir)}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
