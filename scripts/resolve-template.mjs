#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PLUGIN_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function usage() {
  return `Usage:
  resolve-template.mjs <template-id-or-path>

Prints an absolute path under document-templates.`;
}

function safeTemplatePath(value) {
  const normalized = path.posix.normalize(String(value).replace(/^document-templates\//, ""));
  if (!normalized || normalized.startsWith("../") || normalized.includes("/../") || path.isAbsolute(normalized)) {
    throw new Error(`unsafe template id: ${value}`);
  }
  return normalized;
}

function main() {
  const [id, ...rest] = process.argv.slice(2);
  if (!id || rest.length || id === "-h" || id === "--help") {
    process.stdout.write(`${usage()}\n`);
    process.exit(id === "-h" || id === "--help" ? 0 : 2);
  }
  try {
    const absolutePath = path.join(PLUGIN_ROOT, "document-templates", safeTemplatePath(id));
    if (!fs.existsSync(absolutePath)) throw new Error(`template not found: ${id}`);
    process.stdout.write(`${absolutePath}\n`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main();
