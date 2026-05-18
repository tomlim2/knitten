#!/usr/bin/env node
import path from "node:path";
import { gitRoot, runGit, writeExecutable } from "./worktree-lib.mjs";

const HOOK_BODY = `#!/usr/bin/env sh
repo_root="$(git rev-parse --show-toplevel)"
node "$repo_root/scripts/worktree-guard.mjs"
`;

async function main() {
  const root = gitRoot(process.cwd());
  runGit(["config", "--local", "core.hooksPath", "scripts/git-hooks"], {
    cwd: root,
    stdio: "inherit",
  });
  await writeExecutable(path.join(root, "scripts/git-hooks/pre-commit"), HOOK_BODY);
  await writeExecutable(path.join(root, "scripts/git-hooks/pre-push"), HOOK_BODY);
  console.log("installed repo-local hooks at scripts/git-hooks");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
