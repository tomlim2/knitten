#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OPTIONAL_ROUTES = new Set(["track-out-of-scope-nit"]);
const OPTIONAL_STATUSES = new Set(["optional", "non-blocking", "non_blocking", "p3-nit", "p3_nit"]);

function usage() {
  console.error(`Usage:
  github-pr-approved-state-plan.mjs <pr> [--plan path] [--out-dir path] [--write] [--review-state-only]

Reads the Step 7 reply-plan JSON plus cached review files and computes whether
the plan should use the APPROVED-state route. Defaults to a read-only JSON
summary. Pass --write to update approvedState and reRequest.default in the plan.
Pass --review-state-only near workflow start to report the PR review approval
signal before a Step 7 reply plan exists.

Expected cache files:
  <out-dir>/pr<N>-view.json
  <out-dir>/pr<N>-reviews.json

Examples:
  github-pr-approved-state-plan.mjs 404 --review-state-only
  github-pr-approved-state-plan.mjs 404 --plan /tmp/pr404-reply-plan.json
  github-pr-approved-state-plan.mjs 404 --plan /tmp/pr404-reply-plan.json --write`);
}

export function parseArgs(argv) {
  const args = {
    outDir: "/tmp",
    plan: null,
    write: false,
    reviewStateOnly: false,
    positional: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out-dir") {
      args.outDir = argv[++i];
    } else if (arg === "--plan") {
      args.plan = argv[++i];
    } else if (arg === "--write") {
      args.write = true;
    } else if (arg === "--review-state-only") {
      args.reviewStateOnly = true;
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
    (!args.plan && !args.reviewStateOnly) ||
    (args.write && args.reviewStateOnly)
  ) {
    usage();
    process.exit(2);
  }

  return {
    pr: args.positional[0],
    outDir: args.outDir.replace(/^~(?=\/|$)/, process.env.HOME || "~"),
    planPath: args.plan?.replace(/^~(?=\/|$)/, process.env.HOME || "~"),
    write: args.write,
    reviewStateOnly: args.reviewStateOnly,
  };
}

export function latestSubstantiveReviewState(reviews) {
  const substantive = reviews
    .filter((review) => review?.state && review.state !== "COMMENTED")
    .sort((a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0));
  return substantive.at(-1)?.state || "";
}

export function computeReviewApproval({ view, reviews }) {
  const latestReviewState = latestSubstantiveReviewState(reviews);
  const reviewDecision = view?.reviewDecision || "";
  const reviewApproved = reviewDecision === "APPROVED" || latestReviewState === "APPROVED";
  return {
    reviewApproved,
    reviewDecision,
    latestReviewState,
  };
}

function itemIsNonBlocking(item) {
  if (item?.nonBlocking === true) return true;
  if (item?.optional === true) return true;
  if (typeof item?.severity === "string" && item.severity.toUpperCase() === "P3") return true;
  if (typeof item?.route === "string" && OPTIONAL_ROUTES.has(item.route)) return true;
  if (typeof item?.status === "string" && OPTIONAL_STATUSES.has(item.status.toLowerCase())) return true;
  return false;
}

export function computeApprovedState({ view, reviews, plan }) {
  const { latestReviewState, reviewDecision, reviewApproved } = computeReviewApproval({ view, reviews });
  const actionableItems = Array.isArray(plan?.items)
    ? plan.items.filter((item) => item?.source !== "informational")
    : [];
  const suppressedItem = plan?.suppressedSummary
    ? [typeof plan.suppressedSummary === "object" ? plan.suppressedSummary : { nonBlocking: false }]
    : [];
  const approvalItems = [...actionableItems, ...suppressedItem];
  const hasActionableItems = approvalItems.length > 0;
  const allItemsNonBlocking = hasActionableItems && approvalItems.every(itemIsNonBlocking);
  const approvedState = reviewApproved && allItemsNonBlocking;

  return {
    pr: plan?.pr ?? null,
    approvedState,
    reRequestDefault: !approvedState,
    signals: {
      reviewDecision,
      latestReviewState,
      reviewApproved,
      actionableItemCount: actionableItems.length,
      allItemsNonBlocking,
    },
  };
}

export function applyApprovedState(plan, decision) {
  return {
    ...plan,
    approvedState: decision.approvedState,
    reRequest: {
      ...(plan.reRequest || {}),
      default: decision.reRequestDefault,
    },
  };
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function main() {
  const { pr, outDir, planPath, write, reviewStateOnly } = parseArgs(process.argv.slice(2));
  const view = readJson(join(outDir, `pr${pr}-view.json`));
  const reviews = readJson(join(outDir, `pr${pr}-reviews.json`));
  if (reviewStateOnly) {
    process.stdout.write(`${JSON.stringify({ pr, ...computeReviewApproval({ view, reviews }) }, null, 2)}\n`);
    return;
  }

  const plan = readJson(planPath);
  const decision = computeApprovedState({ view, reviews, plan });

  if (write) {
    const nextPlan = applyApprovedState(plan, decision);
    writeFileSync(planPath, `${JSON.stringify(nextPlan, null, 2)}\n`);
  }

  process.stdout.write(`${JSON.stringify(decision, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
