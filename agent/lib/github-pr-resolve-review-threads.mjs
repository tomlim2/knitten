#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function usage() {
  console.error(`Usage:
  github-pr-resolve-review-threads.mjs <pr> --plan path [--repo owner/name] [--yes]

Maps Step 7 reply-plan commentIds to GitHub review thread IDs and resolves the
matching unresolved threads. Defaults to dry-run. Pass --yes only after the
reply plan execution has been approved.

Examples:
  github-pr-resolve-review-threads.mjs 404 --plan /tmp/pr404-reply-plan.json
  github-pr-resolve-review-threads.mjs 404 --plan /tmp/pr404-reply-plan.json --yes`);
}

export function parseArgs(argv) {
  const args = {
    repo: process.env.GH_REPO || "CINEV/shotloom",
    plan: null,
    yes: false,
    positional: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--repo") {
      args.repo = argv[++i];
    } else if (arg === "--plan") {
      args.plan = argv[++i];
    } else if (arg === "--yes") {
      args.yes = true;
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      args.positional.push(arg);
    }
  }

  if (args.positional.length !== 1 || !/^[0-9]+$/.test(args.positional[0]) || !args.repo.includes("/") || !args.plan) {
    usage();
    process.exit(2);
  }

  return {
    pr: args.positional[0],
    repo: args.repo,
    planPath: args.plan.replace(/^~(?=\/|$)/, process.env.HOME || "~"),
    yes: args.yes,
  };
}

export function commentIdsFromPlan(plan) {
  return new Set(
    (Array.isArray(plan?.items) ? plan.items : [])
      .map((item) => item?.commentId)
      .filter((id) => Number.isInteger(id) || (typeof id === "string" && /^[0-9]+$/.test(id)))
      .map((id) => Number(id)),
  );
}

export function reviewThreadNodes(graphqlResponse) {
  return graphqlResponse?.data?.repository?.pullRequest?.reviewThreads?.nodes || [];
}

export function plannedThreadResolutions({ plan, graphqlResponse }) {
  const commentIds = commentIdsFromPlan(plan);
  const nodes = reviewThreadNodes(graphqlResponse);
  return nodes
    .map((thread) => {
      const firstComment = thread?.comments?.nodes?.[0];
      return {
        threadId: thread?.id,
        isResolved: Boolean(thread?.isResolved),
        commentId: Number(firstComment?.databaseId),
      };
    })
    .filter((thread) => thread.threadId && commentIds.has(thread.commentId))
    .map((thread) => ({
      ...thread,
      action: thread.isResolved ? "skip-already-resolved" : "resolve",
    }));
}

function runGh(args) {
  const result = spawnSync("gh", args, { encoding: "utf8" });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function reviewThreadsQuery(repo, pr) {
  const [owner, name] = repo.split("/");
  return `query {
    repository(owner: "${owner}", name: "${name}") {
      pullRequest(number: ${pr}) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 1) {
              nodes { databaseId }
            }
          }
        }
      }
    }
  }`;
}

function resolveMutation(threadId) {
  return `mutation {
    resolveReviewThread(input: {threadId: "${threadId}"}) {
      thread { id isResolved }
    }
  }`;
}

function main() {
  const { pr, repo, planPath, yes } = parseArgs(process.argv.slice(2));
  const plan = readJson(planPath);
  const graphqlResponse = JSON.parse(runGh(["api", "graphql", "-f", `query=${reviewThreadsQuery(repo, pr)}`]));
  const resolutions = plannedThreadResolutions({ plan, graphqlResponse });

  process.stderr.write(`Repo: ${repo}\n`);
  process.stderr.write(`PR: ${pr}\n`);
  process.stderr.write(`Plan: ${planPath}\n`);
  process.stderr.write(`Matched threads: ${resolutions.length}\n`);

  for (const item of resolutions) {
    process.stderr.write(`${item.action}: comment ${item.commentId} -> ${item.threadId}\n`);
  }

  if (!yes) {
    process.stderr.write("\nDry run only. Re-run with --yes after approval to resolve threads.\n");
    process.stdout.write(`${JSON.stringify({ pr, repo, dryRun: true, resolutions }, null, 2)}\n`);
    return;
  }

  const resolved = [];
  for (const item of resolutions) {
    if (item.action !== "resolve") continue;
    const output = runGh(["api", "graphql", "-f", `query=${resolveMutation(item.threadId)}`]);
    resolved.push(JSON.parse(output));
  }

  process.stdout.write(`${JSON.stringify({ pr, repo, dryRun: false, resolutions, resolved }, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
