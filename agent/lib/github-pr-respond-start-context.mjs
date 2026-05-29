#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { computeReviewApproval } from "./github-pr-approved-state-plan.mjs";

function usage() {
  console.error(`Usage:
  github-pr-respond-start-context.mjs <pr> [--out-dir path] [--output path] [--write]

Builds the shotloom-respond-pr start-context JSON from cached PR snapshot
files. Defaults to read-only stdout. Pass --write to save the file.

Expected cache files:
  <out-dir>/pr<N>-view.json
  <out-dir>/pr<N>-comments.json
  <out-dir>/pr<N>-reviews.json

Example:
  github-pr-respond-start-context.mjs 404 --write`);
}

export function parseArgs(argv) {
  const args = {
    outDir: "/tmp",
    output: null,
    write: false,
    positional: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out-dir") {
      args.outDir = argv[++i];
    } else if (arg === "--output") {
      args.output = argv[++i];
    } else if (arg === "--write") {
      args.write = true;
    } else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      args.positional.push(arg);
    }
  }

  if (args.positional.length !== 1 || !/^[0-9]+$/.test(args.positional[0])) {
    usage();
    process.exit(2);
  }

  const pr = args.positional[0];
  const outDir = expandHome(args.outDir);

  return {
    pr,
    outDir,
    outputPath: expandHome(args.output || join(outDir, `pr${pr}-respond-start.json`)),
    write: args.write,
  };
}

export function inlineReviewItems(comments) {
  return (Array.isArray(comments) ? comments : [])
    .filter((comment) => comment?.id)
    .map((comment) => ({
      source: "inline",
      commentId: comment.id,
      author: comment.user?.login || null,
      authorType: comment.user?.type || null,
      authorAssociation: comment.author_association || null,
      path: comment.path || null,
      line: comment.line ?? comment.original_line ?? null,
      url: comment.html_url || comment.url || null,
      body: comment.body || "",
      diffHunk: comment.diff_hunk || "",
      route: null,
      replyPlan: null,
    }));
}

export function reviewBodyItems(reviews) {
  return (Array.isArray(reviews) ? reviews : [])
    .filter((review) => typeof review?.body === "string" && review.body.trim())
    .map((review) => ({
      source: "review-body",
      reviewId: review.id ?? null,
      author: review.user?.login || null,
      authorType: review.user?.type || null,
      state: review.state || null,
      submittedAt: review.submitted_at || null,
      url: review.html_url || null,
      body: review.body,
      route: null,
      replyPlan: null,
    }));
}

export function buildRespondStartContext({ pr, view, comments, reviews, files = {} }) {
  const approval = computeReviewApproval({ view, reviews });
  const reviewItems = [
    ...inlineReviewItems(comments),
    ...reviewBodyItems(reviews),
  ];

  return {
    pr: Number(pr),
    headRefName: view?.headRefName || null,
    baseRefName: view?.baseRefName || null,
    reviewApproved: approval.reviewApproved,
    signals: approval,
    files,
    reviewItems,
    counts: {
      inline: reviewItems.filter((item) => item.source === "inline").length,
      reviewBody: reviewItems.filter((item) => item.source === "review-body").length,
      total: reviewItems.length,
    },
  };
}

function expandHome(path) {
  return path?.replace(/^~(?=\/|$)/, process.env.HOME || "~");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(content, null, 2)}\n`);
}

function main() {
  const { pr, outDir, outputPath, write } = parseArgs(process.argv.slice(2));
  const files = {
    view: join(outDir, `pr${pr}-view.json`),
    comments: join(outDir, `pr${pr}-comments.json`),
    reviews: join(outDir, `pr${pr}-reviews.json`),
  };
  const context = buildRespondStartContext({
    pr,
    view: readJson(files.view),
    comments: readJson(files.comments),
    reviews: readJson(files.reviews),
    files,
  });

  if (write) {
    writeJson(outputPath, context);
    process.stderr.write(`startContext: ${outputPath}\n`);
  }

  process.stdout.write(`${JSON.stringify(context, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
