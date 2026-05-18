#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import {
  branchMergedIntoMain,
  currentBranch,
  isClean,
  mainPathFor,
  parseWorktreeList,
  policyFor,
  resolveWorktreeRoot,
  remoteBranchExists,
  removePath,
  runGit,
  tryGit,
} from "./worktree-lib.mjs";

function parseArgs(argv) {
  const args = { apply: false, yes: false, merged: false, olderThan: null, cleanupTestArtifacts: false, localOnly: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--yes") args.yes = true;
    else if (arg === "--merged") args.merged = true;
    else if (arg === "--local-only") args.localOnly = true;
    else if (arg === "--cleanup-test-artifacts") args.cleanupTestArtifacts = true;
    else if (arg === "--older-than") args.olderThan = Number(argv[++i]);
    else if (arg.startsWith("--older-than=")) args.olderThan = Number(arg.slice("--older-than=".length));
  }
  return args;
}

function ageDays(worktreePath) {
  const name = path.basename(worktreePath);
  const match = name.match(/^(\d{8})-(\d{6})-/);
  if (!match) return null;
  const iso = `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)}T${match[2].slice(0, 2)}:${match[2].slice(2, 4)}:${match[2].slice(4, 6)}`;
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return null;
  return Math.floor((Date.now() - created.getTime()) / 86400000);
}

async function cleanupTestArtifacts(mainPath, policy) {
  const items = parseWorktreeList(mainPath).filter((item) => item.branch?.startsWith("codex/test/"));
  for (const item of items) {
    if (!existsSync(item.path)) continue;
    if (path.resolve(item.path) === path.resolve(mainPath)) continue;
    runGit(["worktree", "remove", "--force", item.path], { cwd: mainPath, stdio: "inherit" });
  }
  const branches = tryGit(["branch", "--list", "codex/test/*", "--format=%(refname:short)"], { cwd: mainPath });
  if (branches.ok) {
    for (const branch of branches.stdout.split("\n").filter(Boolean)) {
      runGit(["branch", "-D", branch], { cwd: mainPath, stdio: "inherit" });
    }
  }
  await removePath(resolveWorktreeRoot(mainPath, policy, true));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const context = await policyFor(process.cwd());
  if (context.policy?.enabled !== true) {
    console.log("worktree-first is not enabled for this repository");
    return;
  }
  const mainPath = await mainPathFor(context.entry);
  runGit(["fetch", "origin", "main"], { cwd: mainPath, stdio: "ignore" });

  if (args.cleanupTestArtifacts) {
    await cleanupTestArtifacts(mainPath, context.policy);
    console.log("removed test worktree artifacts");
    return;
  }

  const candidates = [];
  for (const item of parseWorktreeList(mainPath)) {
    if (path.resolve(item.path) === path.resolve(mainPath)) continue;
    if (!existsSync(item.path)) continue;
    const branch = item.branch || currentBranch(item.path);
    if (!isClean(item.path)) continue;
    if (!args.localOnly) {
      if (!branchMergedIntoMain(branch, mainPath)) continue;
      if (remoteBranchExists(branch, mainPath)) continue;
    }
    if (Number.isFinite(args.olderThan)) {
      const age = ageDays(item.path);
      if (age === null || age < args.olderThan) continue;
    }
    candidates.push({ ...item, branch });
  }

  if (candidates.length === 0) {
    console.log("no cleanup candidates");
    return;
  }

  console.log("cleanup candidates:");
  for (const item of candidates) console.log(`- ${item.path} (${item.branch})`);

  if (!args.apply) {
    console.log("dry-run only; pass --apply --yes to remove candidates");
    return;
  }
  if (!args.yes) {
    throw new Error("--apply requires --yes after user approval");
  }

  for (const item of candidates) {
    runGit(["worktree", "remove", item.path], { cwd: mainPath, stdio: "inherit" });
    if (item.branch && !args.localOnly) {
      const deleteResult = tryGit(["branch", "-d", item.branch], { cwd: mainPath });
      if (!deleteResult.ok) console.error(deleteResult.stderr);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
