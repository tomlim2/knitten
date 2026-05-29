#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveHelperPath } from "./resolve-helper-path.mjs";

function usage() {
  return `Usage:
  run-helper.mjs [--root <knitten-root>] <helper-id> -- [args...]`;
}

function parseOptions(argv) {
  const options = { root: null, helperId: null, helperArgs: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--root") {
      options.root = argv[++index];
    } else if (arg?.startsWith("--root=")) {
      options.root = arg.slice("--root=".length);
    } else if (arg === "--") {
      options.helperArgs = argv.slice(index + 1);
      break;
    } else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else if (!options.helperId) {
      options.helperId = arg;
    } else {
      options.helperArgs.push(arg);
    }
  }
  return options;
}

function commandFor(absolutePath) {
  const ext = path.extname(absolutePath);
  if (ext === ".mjs" || ext === ".js") return ["node", absolutePath];
  if (ext === ".py") return ["python3", absolutePath];
  if (ext === ".sh") return ["bash", absolutePath];
  return [absolutePath];
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  if (!options.helperId) {
    process.stderr.write(`${usage()}\n`);
    process.exit(2);
  }
  const helper = resolveHelperPath({ root: options.root, args: [options.helperId] });
  const [command, ...prefixArgs] = commandFor(helper.absolutePath);
  const result = spawnSync(command, [...prefixArgs, ...options.helperArgs], {
    cwd: process.cwd(),
    env: { ...process.env, KNITTEN_ROOT: helper.root },
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
