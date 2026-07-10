#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync("node", ["scripts/run-context-load-smoke-eval.mjs", ...process.argv.slice(2)], {
  cwd: repoRoot,
  encoding: "utf8",
  stdio: ["inherit", "pipe", "pipe"],
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;
