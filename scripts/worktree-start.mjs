#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  currentBranch,
  ensureEnabledPolicy,
  gitRoot,
  isClean,
  localBranchExists,
  mainPathFor,
  policyFor,
  resolveWorktreeRoot,
  runGit,
  slugify,
  timestamp,
} from "./worktree-lib.mjs";

function parseArgs(argv) {
  const args = { slug: null, testMode: false, repo: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--test-mode") args.testMode = true;
    else if (arg === "--repo") args.repo = argv[++i];
    else if (arg.startsWith("--repo=")) args.repo = arg.slice("--repo=".length);
    else if (!args.slug) args.slug = arg;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const context = await policyFor(process.cwd(), args.repo);
  ensureEnabledPolicy(context);

  if (context.policy.deferToRepoWorkflow) {
    console.log(`${context.key} policy: use the repo-specific worktree starter.`);
    if (context.key === "shotloom") console.log("Suggested command: shotloom-start-task");
    return;
  }

  const mainPath = await mainPathFor(context.entry);
  const currentRoot = gitRoot(process.cwd());
  if (path.resolve(currentRoot) !== path.resolve(mainPath)) {
    throw new Error(`${context.key} policy: run starter from the main checkout (${mainPath})`);
  }
  if (!isClean(mainPath)) {
    throw new Error(`${context.key} policy: main checkout has uncommitted changes`);
  }

  const branchPrefix = args.testMode ? "codex/test/" : context.policy.branchPrefix || "codex/";
  const slug = slugify(args.slug);
  const root = resolveWorktreeRoot(mainPath, context.policy, args.testMode);
  let body;
  let branch;
  let worktreePath;
  do {
    body = `${timestamp()}-${slug}`;
    branch = `${branchPrefix}${body}`;
    worktreePath = path.join(root, body);
    if (!localBranchExists(branch, mainPath) && !existsSync(worktreePath)) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (true);

  await mkdir(root, { recursive: true });
  runGit(["fetch", "origin", "main"], { cwd: mainPath, stdio: "inherit" });
  runGit(["worktree", "add", "-b", branch, worktreePath, "origin/main"], {
    cwd: mainPath,
    stdio: "inherit",
  });

  console.log(`worktree: ${worktreePath}`);
  console.log(`branch: ${branch}`);
  console.log(`base: origin/main`);
  console.log(`current-main-branch: ${currentBranch(mainPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
