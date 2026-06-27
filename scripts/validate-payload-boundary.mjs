#!/usr/bin/env node
import path from "node:path";
import { spawnSync } from "node:child_process";

const scriptPath = path.join(path.dirname(new URL(import.meta.url).pathname), "validate-domain-plugin-boundary.mjs");
const result = spawnSync(process.execPath, [scriptPath, ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exitCode = 2;
} else {
  process.exitCode = result.status ?? 1;
}
