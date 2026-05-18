#!/usr/bin/env node
import path from "node:path";
import { currentBranch, mainPathFor, policyFor } from "./worktree-lib.mjs";

async function main() {
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
    console.error(`${context.key} policy: use a task worktree for commit and push.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
