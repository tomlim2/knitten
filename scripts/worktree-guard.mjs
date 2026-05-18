#!/usr/bin/env node
import path from "node:path";
import { mainPathFor, policyFor } from "./worktree-lib.mjs";

async function main() {
  const context = await policyFor(process.cwd());
  if (context.policy?.enabled !== true) return;

  const mainPath = await mainPathFor(context.entry);
  if (path.resolve(context.topLevel) === path.resolve(mainPath)) {
    console.error(`${context.key} policy: use a task worktree for commit and push.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
