#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  currentBranch,
  gitRoot,
  isClean,
  localBranchExists,
  mainPathFor,
  parseWorktreeList,
  policyFor,
  remoteBranchExists,
  runGit,
  statusPorcelain,
  tryGit,
} from "./worktree-lib.mjs";

const DEFAULT_BRANCH = "operational-findings";
const DEFAULT_WORKTREE_DIR = ".worktrees/operational-findings";
const DEFAULT_BASE = "origin/main";

function parseArgs(argv) {
  const args = {
    command: "prepare",
    branch: DEFAULT_BRANCH,
    worktree: null,
    base: DEFAULT_BASE,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "prepare" || arg === "status") args.command = arg;
    else if (arg === "--branch") args.branch = argv[++i];
    else if (arg.startsWith("--branch=")) args.branch = arg.slice("--branch=".length);
    else if (arg === "--worktree") args.worktree = argv[++i];
    else if (arg.startsWith("--worktree=")) args.worktree = arg.slice("--worktree=".length);
    else if (arg === "--base") args.base = argv[++i];
    else if (arg.startsWith("--base=")) args.base = arg.slice("--base=".length);
    else if (arg === "--dry-run") args.dryRun = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function ensurePlainBranchName(branch) {
  if (!branch || branch.includes("..") || branch.startsWith("/") || branch.endsWith("/") || branch.includes(" ")) {
    throw new Error(`invalid findings branch: ${branch}`);
  }
  if (branch.startsWith("codex/")) {
    throw new Error(`findings branch must be long-lived and must not use codex/ prefix: ${branch}`);
  }
}

function describeDirty(cwd) {
  const status = statusPorcelain(cwd);
  return status ? status.split("\n").slice(0, 20).join("\n") : "";
}

function worktreeForBranch(mainPath, branch) {
  return parseWorktreeList(mainPath).find((item) => item.branch === branch);
}

function ensurePathNotTakenByOtherWorktree(mainPath, worktreePath, branch) {
  const target = path.resolve(worktreePath);
  for (const item of parseWorktreeList(mainPath)) {
    if (path.resolve(item.path) === target && item.branch !== branch) {
      throw new Error(`preferred worktree is already registered for ${item.branch || "(detached)"}: ${worktreePath}`);
    }
  }
}

function fetchBase(mainPath, base, dryRun) {
  if (base.startsWith("origin/")) {
    if (dryRun) {
      console.log(`would run: git fetch origin ${base.slice("origin/".length)}`);
      return;
    }
    runGit(["fetch", "origin", base.slice("origin/".length)], { cwd: mainPath, stdio: "inherit" });
  }
}

function ensureRemoteBranchFetched(mainPath, branch, dryRun) {
  if (remoteBranchExists(branch, mainPath)) {
    if (dryRun) {
      console.log(`would run: git fetch origin ${branch}`);
      return;
    }
    runGit(["fetch", "origin", branch], { cwd: mainPath, stdio: "inherit" });
  }
}

function ensureExistingWorktreeReady(worktreePath, branch, dryRun) {
  const actualBranch = currentBranch(worktreePath);
  if (actualBranch !== branch) {
    throw new Error(`findings worktree is on ${actualBranch || "(detached)"}, expected ${branch}: ${worktreePath}`);
  }
  if (!isClean(worktreePath)) {
    throw new Error(`findings worktree is dirty; repair before capture:\n${describeDirty(worktreePath)}`);
  }

  const upstream = tryGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], { cwd: worktreePath });
  if (!upstream.ok && remoteBranchExists(branch, worktreePath)) {
    if (dryRun) {
      console.log(`would set upstream: ${branch} -> origin/${branch}`);
      return;
    }
    runGit(["branch", "--set-upstream-to", `origin/${branch}`, branch], { cwd: worktreePath, stdio: "inherit" });
  }
  const refreshedUpstream = tryGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], { cwd: worktreePath });
  if (!refreshedUpstream.ok) return;

  const behind = tryGit(["rev-list", "--count", `HEAD..${refreshedUpstream.stdout}`], { cwd: worktreePath });
  const ahead = tryGit(["rev-list", "--count", `${refreshedUpstream.stdout}..HEAD`], { cwd: worktreePath });
  const behindCount = behind.ok ? Number(behind.stdout) : 0;
  const aheadCount = ahead.ok ? Number(ahead.stdout) : 0;
  if (behindCount > 0 && aheadCount > 0) {
    throw new Error(`findings branch diverged from ${refreshedUpstream.stdout}; manual rebase/repair needed`);
  }
  if (behindCount > 0) {
    if (dryRun) {
      console.log(`would fast-forward ${worktreePath} from ${refreshedUpstream.stdout}`);
      return;
    }
    runGit(["pull", "--ff-only"], { cwd: worktreePath, stdio: "inherit" });
  }
}

async function resolveMainPath() {
  const context = await policyFor(process.cwd());
  const mainPath = await mainPathFor(context.entry);
  return mainPath || gitRoot(process.cwd());
}

async function prepare(args) {
  ensurePlainBranchName(args.branch);
  const mainPath = await resolveMainPath();
  const worktreePath = path.resolve(mainPath, args.worktree || DEFAULT_WORKTREE_DIR);
  const existingForBranch = worktreeForBranch(mainPath, args.branch);

  fetchBase(mainPath, args.base, args.dryRun);
  ensureRemoteBranchFetched(mainPath, args.branch, args.dryRun);
  ensurePathNotTakenByOtherWorktree(mainPath, worktreePath, args.branch);

  if (existingForBranch && path.resolve(existingForBranch.path) !== worktreePath) {
    throw new Error(`findings branch is already checked out at ${existingForBranch.path}`);
  }

  if (existsSync(worktreePath)) {
    ensureExistingWorktreeReady(worktreePath, args.branch, args.dryRun);
    console.log(`worktree: ${worktreePath}`);
    console.log(`branch: ${args.branch}`);
    return;
  }

  const hasLocal = localBranchExists(args.branch, mainPath);
  const hasRemote = remoteBranchExists(args.branch, mainPath);
  const addArgs = hasLocal
    ? ["worktree", "add", worktreePath, args.branch]
    : hasRemote
      ? ["worktree", "add", "--track", "-b", args.branch, worktreePath, `origin/${args.branch}`]
      : ["worktree", "add", "-b", args.branch, worktreePath, args.base];

  if (args.dryRun) {
    console.log(`would run: git ${addArgs.join(" ")}`);
    console.log(`worktree: ${worktreePath}`);
    console.log(`branch: ${args.branch}`);
    return;
  }
  await mkdir(path.dirname(worktreePath), { recursive: true });
  runGit(addArgs, { cwd: mainPath, stdio: "inherit" });
  ensureExistingWorktreeReady(worktreePath, args.branch, false);
  console.log(`worktree: ${worktreePath}`);
  console.log(`branch: ${args.branch}`);
}

async function status(args) {
  ensurePlainBranchName(args.branch);
  const mainPath = await resolveMainPath();
  const worktreePath = path.resolve(mainPath, args.worktree || DEFAULT_WORKTREE_DIR);
  const item = worktreeForBranch(mainPath, args.branch);
  console.log(`worktree: ${existsSync(worktreePath) ? worktreePath : "(missing)"}`);
  console.log(`branch: ${args.branch}`);
  console.log(`branch-worktree: ${item?.path || "(not checked out)"}`);
  if (existsSync(worktreePath)) {
    console.log(`actual-branch: ${currentBranch(worktreePath) || "(detached)"}`);
    console.log(`dirty: ${isClean(worktreePath) ? "no" : "yes"}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "status") await status(args);
  else await prepare(args);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
