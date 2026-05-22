#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { currentBranch, mainPathFor, policyFor, tryGit } from "./worktree-lib.mjs";

const MAIN_CHORE_MAX_FILES = 8;
const MAIN_CHORE_PATHS = [
  /^\.gitignore$/,
  /^\.github\//,
  /^agent\/rules\//,
  /^docs\/briefings\/specs\/knitten-worktree-first\.md$/,
  /^docs\/milestones\/worktree-first-workflow\.md$/,
  /^docs\/plans\/active\/knitten-worktree-first\.md$/,
  /^scripts\/git-hooks\//,
  /^scripts\/worktree-guard\.mjs$/,
];

function listFiles(args, cwd) {
  const result = tryGit(args, { cwd });
  if (!result.ok) return [];
  return result.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

function matchesMainChorePath(file) {
  return MAIN_CHORE_PATHS.some((pattern) => pattern.test(file));
}

function isSmallMainChoreFileSet(files) {
  return files.length > 0 &&
    files.length <= MAIN_CHORE_MAX_FILES &&
    files.every(matchesMainChorePath);
}

function mainChoreCommitAllowed(cwd) {
  return isSmallMainChoreFileSet(listFiles(["diff", "--cached", "--name-only"], cwd));
}

function mainChorePushAllowed(cwd) {
  const files = listFiles(["diff", "--name-only", "origin/main..HEAD"], cwd);
  if (!isSmallMainChoreFileSet(files)) return false;
  const subjects = listFiles(["log", "--format=%s", "origin/main..HEAD"], cwd);
  return subjects.length > 0 && subjects.every((subject) => subject.startsWith("chore:"));
}

function mainChoreMessageAllowed(file) {
  const subject = readFileSync(file, "utf8").split("\n")[0]?.trim() || "";
  return subject.startsWith("chore:");
}

async function main() {
  const mode = process.argv[2] || "commit";
  const messageFile = process.argv[3];
  const context = await policyFor(process.cwd());
  if (context.policy?.enabled !== true) return;

  const mainPath = await mainPathFor(context.entry);
  if (path.resolve(context.topLevel) === path.resolve(mainPath)) {
    const branch = currentBranch(context.topLevel);
    const prefix = context.policy?.branchPrefix || "";
    if (
      context.policy?.allowMainFeatureBranch === true &&
      branch &&
      branch !== "main" &&
      branch.startsWith(prefix)
    ) {
      return;
    }
    const blockMainCommit = context.policy?.blockMainCommit !== false;
    const blockMainPush = context.policy?.blockMainPush !== false;
    if (mode === "commit" && !blockMainCommit) return;
    if (mode === "push" && !blockMainPush) return;
    if (mode === "commit" && mainChoreCommitAllowed(context.topLevel)) return;
    if (mode === "push" && mainChorePushAllowed(context.topLevel)) return;
    if (mode === "commit-msg" && messageFile && mainChoreCommitAllowed(context.topLevel) && mainChoreMessageAllowed(messageFile)) {
      return;
    }
    if (mode === "commit-msg" && messageFile && mainChoreCommitAllowed(context.topLevel)) {
      console.error(`${context.key} policy: main checkout chore lane requires a commit subject that starts with "chore:".`);
      process.exit(1);
    }
    console.error(`${context.key} policy: use a task worktree for commit and push.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
