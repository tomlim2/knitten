#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function usage() {
  console.error(`Usage:
  github-pr-inline-reply.mjs <pr> <comment-id> [--repo owner/name] [--body-file path] [--yes]

Reads the reply body from --body-file or stdin.
Defaults to dry-run. Pass --yes only after the exact draft is approved.

Examples:
  github-pr-inline-reply.mjs 404 3286101827 --body-file /tmp/reply.md
  github-pr-inline-reply.mjs 404 3286101827 --yes <<'EOF'
  Addressed in \`abc1234\`.
  EOF`);
}

function parseArgs(argv) {
  const args = {
    repo: process.env.GH_REPO || "CINEV/shotloom",
    yes: false,
    bodyFile: null,
    positional: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--yes") {
      args.yes = true;
    } else if (arg === "--repo") {
      args.repo = argv[++i];
    } else if (arg === "--body-file") {
      args.bodyFile = argv[++i];
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      args.positional.push(arg);
    }
  }

  if (args.positional.length !== 2 || !args.repo?.includes("/")) {
    usage();
    process.exit(2);
  }

  return {
    repo: args.repo,
    pr: args.positional[0],
    commentId: args.positional[1],
    bodyFile: args.bodyFile,
    yes: args.yes,
  };
}

function readBody(bodyFile) {
  const body = bodyFile
    ? readFileSync(bodyFile, "utf8")
    : readFileSync(0, "utf8");
  const trimmed = body.trim();
  if (!trimmed) {
    console.error("Reply body is empty.");
    process.exit(2);
  }
  return trimmed;
}

const { repo, pr, commentId, bodyFile, yes } = parseArgs(process.argv.slice(2));
const body = readBody(bodyFile);
const endpoint = `/repos/${repo}/pulls/${pr}/comments/${commentId}/replies`;

console.error(`Repo: ${repo}`);
console.error(`PR: ${pr}`);
console.error(`Comment: ${commentId}`);
console.error(`Endpoint: ${endpoint}`);
console.error("\nReply body:\n---");
console.error(body);
console.error("---");

if (!yes) {
  console.error("\nDry run only. Re-run with --yes after approval to post.");
  process.exit(0);
}

const result = spawnSync(
  "gh",
  ["api", "-X", "POST", endpoint, "-f", `body=${body}`],
  { encoding: "utf8" },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

process.stdout.write(result.stdout);
