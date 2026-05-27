#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

function usage() {
  console.error(`Usage:
  github-pr-review-snapshot.mjs <pr> [--repo owner/name] [--out-dir path] [--prefix name] [--threads]

Fetches PR metadata, inline review comments, and review records into JSON files.
Defaults match shotloom-respond-pr cache names.

Examples:
  github-pr-review-snapshot.mjs 404
  github-pr-review-snapshot.mjs 404 --prefix post --threads
  github-pr-review-snapshot.mjs 404 --out-dir ~/.claude/ops/pr-404`);
}

function parseArgs(argv) {
  const args = {
    repo: process.env.GH_REPO || "CINEV/shotloom",
    outDir: "/tmp",
    prefix: "",
    threads: false,
    positional: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo") {
      args.repo = argv[++i];
    } else if (arg === "--out-dir") {
      args.outDir = argv[++i];
    } else if (arg === "--prefix") {
      args.prefix = argv[++i];
    } else if (arg === "--threads") {
      args.threads = true;
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      args.positional.push(arg);
    }
  }

  if (args.positional.length !== 1 || !/^[0-9]+$/.test(args.positional[0]) || !args.repo.includes("/")) {
    usage();
    process.exit(2);
  }

  return {
    pr: args.positional[0],
    repo: args.repo,
    outDir: args.outDir.replace(/^~(?=\/|$)/, process.env.HOME || "~"),
    prefix: args.prefix,
    threads: args.threads,
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

function writeJson(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  JSON.parse(content);
  writeFileSync(path, content.endsWith("\n") ? content : `${content}\n`);
}

function names(pr, prefix) {
  const stem = prefix ? `pr${pr}-${prefix}` : `pr${pr}`;
  return {
    view: `${stem}-view.json`,
    comments: `${stem}-comments.json`,
    reviews: `${stem}-reviews.json`,
    threads: `${stem}-threads.json`,
  };
}

const { pr, repo, outDir, prefix, threads } = parseArgs(process.argv.slice(2));
const fileNames = names(pr, prefix);

const view = run([
  "gh",
  "pr",
  "view",
  pr,
  "--repo",
  repo,
  "--json",
  "title,body,headRefName,baseRefName,state,number,reviewRequests,reviewDecision,assignees",
]);
const comments = run(["gh", "api", `repos/${repo}/pulls/${pr}/comments`]);
const reviews = run(["gh", "api", `repos/${repo}/pulls/${pr}/reviews`]);

const outputs = {
  view: join(outDir, fileNames.view),
  comments: join(outDir, fileNames.comments),
  reviews: join(outDir, fileNames.reviews),
};

writeJson(outputs.view, view);
writeJson(outputs.comments, comments);
writeJson(outputs.reviews, reviews);

if (threads) {
  const query = `query {
    repository(owner: "${repo.split("/")[0]}", name: "${repo.split("/")[1]}") {
      pullRequest(number: ${pr}) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 20) {
              nodes { databaseId author { login } body }
            }
          }
        }
      }
    }
  }`;
  const threadJson = run(["gh", "api", "graphql", "-f", `query=${query}`]);
  outputs.threads = join(outDir, fileNames.threads);
  writeJson(outputs.threads, threadJson);
}

console.error(`Repo: ${repo}`);
console.error(`PR: ${pr}`);
for (const [kind, path] of Object.entries(outputs)) {
  console.error(`${kind}: ${path}`);
}

process.stdout.write(`${JSON.stringify(outputs, null, 2)}\n`);
