#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function usage() {
  console.error(`Usage:
  shotloom-worktree-sanity.mjs [--require-ahead] [--allow-dirty] [--print-json]

Validates that cwd is a non-main CINEV/shotloom worktree.

Options:
  --require-ahead  require at least one commit ahead of origin/main
  --allow-dirty    report dirty files without failing
  --print-json     print machine-readable summary to stdout`);
}

function parseArgs(argv) {
  const args = {
    requireAhead: false,
    allowDirty: false,
    printJson: false,
  };

  for (const arg of argv) {
    if (arg === "--require-ahead") {
      args.requireAhead = true;
    } else if (arg === "--allow-dirty") {
      args.allowDirty = true;
    } else if (arg === "--print-json") {
      args.printJson = true;
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      usage();
      process.exit(2);
    }
  }

  return args;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  return {
    status: result.status ?? 1,
    stdout: result.stdout.trimEnd(),
    stderr: result.stderr.trimEnd(),
  };
}

function fail(message, detail = "") {
  console.error(`ERROR: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

const topLevel = run("git", ["rev-parse", "--show-toplevel"]);
if (topLevel.status !== 0) fail("not in a git repository", topLevel.stderr || topLevel.stdout);

const remote = run("git", ["-C", topLevel.stdout, "remote", "get-url", "origin"]);
if (remote.status !== 0) fail("unable to read origin remote", remote.stderr || remote.stdout);
if (!/CINEV\/shotloom(?:\.git)?$/.test(remote.stdout) && !remote.stdout.includes("CINEV/shotloom")) {
  fail("cwd is not a Shotloom worktree", `origin: ${remote.stdout || "(none)"}`);
}

const branch = run("git", ["-C", topLevel.stdout, "rev-parse", "--abbrev-ref", "HEAD"]);
if (branch.status !== 0) fail("unable to read current branch", branch.stderr || branch.stdout);
if (branch.stdout === "main" || branch.stdout === "HEAD") {
  fail(`refusing to run on ${branch.stdout}`);
}

const ahead = run("git", ["-C", topLevel.stdout, "rev-list", "--count", "origin/main..HEAD"]);
if (ahead.status !== 0) fail("unable to compare HEAD against origin/main", ahead.stderr || ahead.stdout);
const aheadCount = Number.parseInt(ahead.stdout, 10);
if (args.requireAhead && aheadCount === 0) {
  fail("branch has no commits ahead of origin/main");
}

const status = run("git", ["-C", topLevel.stdout, "status", "--short"]);
if (status.status !== 0) fail("unable to read git status", status.stderr || status.stdout);
if (!args.allowDirty && status.stdout) {
  fail("worktree is dirty", status.stdout);
}

const changed = run("git", ["-C", topLevel.stdout, "diff", "--name-only", "origin/main...HEAD"]);
if (changed.status !== 0) {
  fail("unable to list changed files against origin/main", changed.stderr || changed.stdout);
}

const summary = {
  "worktree": topLevel.stdout,
  "branch": branch.stdout,
  "origin": remote.stdout,
  "ahead-of-origin-main": aheadCount,
  "dirty": Boolean(status.stdout),
  "dirty-files": status.stdout ? status.stdout.split("\n") : [],
  "changed-files": changed.stdout ? changed.stdout.split("\n") : [],
};

if (args.printJson) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  console.error(`worktree: ${summary.worktree}`);
  console.error(`branch: ${summary.branch}`);
  console.error(`ahead-of-origin-main: ${summary["ahead-of-origin-main"]}`);
  console.error(`dirty: ${summary.dirty ? "yes" : "no"}`);
  if (summary.dirty) console.error(status.stdout);
  if (summary["changed-files"].length > 0) {
    console.error("changed-files:");
    for (const file of summary["changed-files"]) console.error(`- ${file}`);
  }
}
