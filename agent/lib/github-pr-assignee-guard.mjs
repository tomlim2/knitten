#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function usage() {
  console.error(`Usage:
  github-pr-assignee-guard.mjs <pr> [--repo owner/name] [--assignee login]

Exits 0 only when the target PR is assigned to the required login.

Examples:
  github-pr-assignee-guard.mjs 404
  github-pr-assignee-guard.mjs 404 --repo CINEV/shotloom --assignee tomlim2`);
}

function parseArgs(argv) {
  const args = {
    repo: process.env.GH_REPO || "CINEV/shotloom",
    assignee: "tomlim2",
    positional: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo") {
      args.repo = argv[++i];
    } else if (arg === "--assignee") {
      args.assignee = argv[++i];
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      args.positional.push(arg);
    }
  }

  if (
    args.positional.length !== 1 ||
    !/^[0-9]+$/.test(args.positional[0]) ||
    !args.repo.includes("/") ||
    !args.assignee
  ) {
    usage();
    process.exit(2);
  }

  return {
    pr: args.positional[0],
    repo: args.repo,
    assignee: args.assignee,
  };
}

function run(args) {
  const result = spawnSync(args[0], args.slice(1), { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

const { pr, repo, assignee } = parseArgs(process.argv.slice(2));

const view = run([
  "gh",
  "pr",
  "view",
  pr,
  "--repo",
  repo,
  "--json",
  "assignees",
]);

const data = JSON.parse(view);
const assignees = (data.assignees || []).map((item) => item.login);

if (!assignees.includes(assignee)) {
  console.error(
    `ERROR: PR #${pr} in ${repo} is not assigned to ${assignee}. Current assignees: ${assignees.join(", ") || "(none)"}`,
  );
  console.error(
    "Stop before checkout, commit, push, PR body edit, reply, thread resolution, or reviewer re-request.",
  );
  process.exit(1);
}

console.error(`OK: PR #${pr} in ${repo} is assigned to ${assignee}.`);
