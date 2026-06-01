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
  remoteTrackingBranchExists,
  statusPorcelain,
  tryGit,
} from "./worktree-lib.mjs";

function ageFromName(worktreePath) {
  const name = path.basename(worktreePath);
  const match = name.match(/^(\d{8})-(\d{6})-/);
  if (!match) return "unknown";
  const iso = `${match[1].slice(0, 4)}-${match[1].slice(4, 6)}-${match[1].slice(6, 8)}T${match[2].slice(0, 2)}:${match[2].slice(2, 4)}:${match[2].slice(4, 6)}`;
  const created = new Date(iso);
  if (Number.isNaN(created.getTime())) return "unknown";
  const days = Math.floor((Date.now() - created.getTime()) / 86400000);
  return `${Math.max(days, 0)}d`;
}

function aheadState(worktreePath) {
  const upstream = tryGit(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], {
    cwd: worktreePath,
  });
  if (!upstream.ok) return "no-upstream";
  const count = tryGit(["rev-list", "--count", `${upstream.stdout}..HEAD`], { cwd: worktreePath });
  return count.ok ? `${count.stdout} ahead` : "unknown";
}

async function main() {
  const context = await policyFor(process.cwd());
  if (context.policy?.enabled !== true) {
    console.log("worktree-first is not enabled for this repository");
    return;
  }
  const mainPath = await mainPathFor(context.entry);
  const items = parseWorktreeList(mainPath);
  console.log("path\tbranch\tdirty\tahead\tage\tcleanup");
  for (const item of items) {
    if (!existsSync(item.path)) {
      console.log(`${item.path}\t${item.branch || "(unknown)"}\tprunable\tunknown\tunknown\tprune`);
      continue;
    }
    const branch = item.branch || currentBranch(item.path) || "(detached)";
    const status = statusPorcelain(item.path);
    const dirty = status ? `dirty(${status.split("\n").length})` : "clean";
    const merged = branchMergedIntoMain(branch, mainPath);
    const remoteExists = remoteTrackingBranchExists(branch, mainPath);
    const cleanup = path.resolve(item.path) === path.resolve(mainPath)
      ? "main"
      : isClean(item.path) && merged && !remoteExists
        ? "candidate"
        : "keep";
    console.log(`${item.path}\t${branch}\t${dirty}\t${aheadState(item.path)}\t${ageFromName(item.path)}\t${cleanup}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
