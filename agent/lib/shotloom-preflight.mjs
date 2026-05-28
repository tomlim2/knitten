#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function usage() {
  console.error(`Usage:
  shotloom-preflight.mjs [--allow-dirty] [--require-non-main] [--require-git-author] [--pr <number>] [--print-json]

Checks Shotloom cwd, configured main checkout path, active GitHub login,
optional git author identity, optional PR assignment, and dirty status.`);
}

let parsedArgs = { printJson: false };

function parseArgs(argv) {
  const args = {
    allowDirty: false,
    requireNonMain: false,
    requireGitAuthor: false,
    printJson: false,
    pr: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--allow-dirty") {
      args.allowDirty = true;
    } else if (arg === "--require-non-main") {
      args.requireNonMain = true;
    } else if (arg === "--require-git-author") {
      args.requireGitAuthor = true;
    } else if (arg === "--print-json") {
      args.printJson = true;
    } else if (arg === "--pr") {
      args.pr = argv[++i] || "";
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      usage();
      process.exit(2);
    }
  }

  if (args.pr && !/^[0-9]+$/.test(args.pr)) {
    usage();
    process.exit(2);
  }

  return args;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  return {
    status: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function fail(message, detail = "") {
  if (parsedArgs.printJson) {
    process.stdout.write(
      `${JSON.stringify(
        {
          ok: false,
          error: message,
          detail: detail || null,
        },
        null,
        2,
      )}\n`,
    );
  }
  console.error(`ERROR: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

function requireRun(label, command, args, options = {}) {
  const result = run(command, args, options);
  if (result.status !== 0) {
    fail(`unable to read ${label}`, result.stderr || result.stdout);
  }
  return result.stdout;
}

const args = parseArgs(process.argv.slice(2));
parsedArgs = args;
const scriptDir = dirname(fileURLToPath(import.meta.url));
const resolver = join(scriptDir, "resolve-repo-path.mjs");

const topLevel = requireRun("git toplevel", "git", ["rev-parse", "--show-toplevel"]);
const gitCommonDir = requireRun("git common dir", "git", ["rev-parse", "--git-common-dir"]);
const branch = requireRun("git branch", "git", ["rev-parse", "--abbrev-ref", "HEAD"]);
const gitUserName = requireRun("git user.name", "git", ["config", "user.name"]);
const gitUserEmail = requireRun("git user.email", "git", ["config", "user.email"]);
const status = requireRun("git status", "git", ["status", "--short"]);
const remote = requireRun("origin remote", "git", ["remote", "get-url", "origin"]);

if (!/CINEV\/shotloom(?:\.git)?$/.test(remote) && !remote.includes("CINEV/shotloom")) {
  fail("cwd is not a Shotloom checkout", `origin: ${remote || "(none)"}`);
}
if (args.requireNonMain && (branch === "main" || branch === "HEAD")) {
  fail(`refusing to run on ${branch}`);
}
if (!args.allowDirty && status) {
  fail("worktree is dirty", status);
}

const shotloomRoot = requireRun(
  "configured Shotloom repo path",
  "node",
  [resolver, "shotloom"],
);
const resolvedShotloomRoot = resolve(shotloomRoot);

const ghLogin = requireRun("active GitHub login", "gh", ["api", "user", "--jq", ".login"]);
if (ghLogin !== "tomlim2") {
  fail("active GitHub login must be tomlim2", `got: ${ghLogin}`);
}

const gitIdentity = `${gitUserName} <${gitUserEmail}>`;
if (args.requireGitAuthor && gitIdentity !== "tomlim2 <deemo@vonvon.me>") {
  fail("git author identity must be tomlim2 <deemo@vonvon.me>", `got: ${gitIdentity}`);
}

let assignees = [];
if (args.pr) {
  const view = requireRun("PR assignees", "gh", [
    "pr",
    "view",
    args.pr,
    "--repo",
    "CINEV/shotloom",
    "--json",
    "assignees",
  ]);
  assignees = (JSON.parse(view).assignees || []).map((item) => item.login);
  if (!assignees.includes("tomlim2")) {
    fail(
      `PR #${args.pr} in CINEV/shotloom is not assigned to tomlim2`,
      `current assignees: ${assignees.join(", ") || "(none)"}`,
    );
  }
}

const summary = {
  "ok": true,
  "worktree": topLevel,
  "git-common-dir": gitCommonDir,
  "branch": branch,
  "origin": remote,
  "configured-shotloom-root": resolvedShotloomRoot,
  "gh-login": ghLogin,
  "git-identity": gitIdentity,
  "dirty": Boolean(status),
  "dirty-files": status ? status.split("\n") : [],
  "pr": args.pr || null,
  "pr-assignees": assignees,
};

if (args.printJson) {
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
} else {
  console.error("ok: true");
  console.error(`worktree: ${summary.worktree}`);
  console.error(`branch: ${summary.branch}`);
  console.error(`origin: ${summary.origin}`);
  console.error(`configured-shotloom-root: ${summary["configured-shotloom-root"]}`);
  console.error(`gh-login: ${summary["gh-login"]}`);
  console.error(`git-identity: ${summary["git-identity"]}`);
  console.error(`dirty: ${summary.dirty ? "yes" : "no"}`);
  if (summary.dirty) console.error(status);
  if (args.pr) console.error(`pr-assignees: ${assignees.join(", ") || "(none)"}`);
}
