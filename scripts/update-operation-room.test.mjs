#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "update-operation-room.mjs");

async function run(args, cwd, extraEnv = {}) {
  const result = await execFileAsync(process.execPath, [SCRIPT, ...args], {
    cwd,
    env: { ...process.env, CODEX_THREAD_ID: "", ...extraEnv },
  });
  return JSON.parse(result.stdout);
}

async function reject(args, cwd, pattern) {
  await assert.rejects(run(args, cwd), pattern);
}

async function git(cwd, args) {
  await execFileAsync("git", args, { cwd });
}

async function main() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "knitten-opr-test-"));
  const workspace = path.join(root, "shotloom-github");
  const otherWorkspace = path.join(root, "knitten");
  const file = path.join(root, "opr.json");
  const config = path.join(root, "operation-room.json");
  const fakeCargo = path.join(root, "fake-cargo.mjs");
  await fs.mkdir(workspace);
  await fs.mkdir(otherWorkspace);
  await git(workspace, ["init", "-b", "main"]);
  await git(workspace, ["config", "user.email", "opr-test@example.invalid"]);
  await git(workspace, ["config", "user.name", "OPR Test"]);
  await git(workspace, ["commit", "--allow-empty", "-m", "test root"]);
  await fs.writeFile(fakeCargo, `#!/usr/bin/env node
import fs from "node:fs/promises";
const targetIndex = process.argv.indexOf("--target-dir");
if (targetIndex === -1) process.exit(2);
await fs.rm(process.argv[targetIndex + 1], { recursive: true, force: true });
`);
  await fs.chmod(fakeCargo, 0o755);
  await fs.writeFile(file, `${JSON.stringify({
    schemaVersion: 1,
    observedAt: "2026-01-01T00:00:00.000Z",
    project: "shotloom-github",
    threads: [{
      threadId: "existing",
      threadKind: "pr",
      status: "waiting",
      availability: "available",
      workflowStatus: "waiting_external",
      summary: "preserved",
    }],
  }, null, 2)}\n`);
  await fs.writeFile(config, `${JSON.stringify({
    schemaVersion: 1,
    statusFile: file,
    includeWorkspaceBasenames: ["shotloom-github"],
  }, null, 2)}\n`);

  const active = [
    "publish",
    "--file", file,
    "--thread-id", "thread-a",
    "--thread-name", "Camera responder",
    "--title", "camera",
    "--thread-kind", "pr",
    "--status", "active",
    "--assignment-id", "pr:CINEV/shotloom#894",
    "--phase", "implementation",
    "--summary", "current state",
    "--next-action", "verify",
    "--pr", "CINEV/shotloom#894:target",
    "--pr-title", "Camera properties",
    "--automation", "automatic",
    "--response-state", "responding",
    "--human-review-round", "1",
    "--bot-review-round", "2",
    "--comment-count", "49",
    "--linear", "STL-1144:target",
  ];

  await reject(active, workspace, /requires resetPacketId/);
  await fs.writeFile(path.join(workspace, "dirty.txt"), "dirty\n");
  await reject([...active, "--reset-packet-id", "reset-a"], workspace, /worktree is not clean/);
  await fs.rm(path.join(workspace, "dirty.txt"));

  await run([...active, "--reset-packet-id", "reset-a"], workspace);
  await run([...active, "--summary", "same assignment update"], workspace);
  await run([
    "publish", "--file", file,
    "--thread-id", "thread-a", "--thread-name", "Camera responder", "--title", "camera",
    "--thread-kind", "pr", "--status", "waiting",
    "--availability", "reserved", "--waiting-for", "human_review",
    "--assignment-id", "pr:CINEV/shotloom#894",
    "--phase", "awaiting_review", "--summary", "waiting for review",
    "--pr", "CINEV/shotloom#894:target",
    "--pr-title", "Camera properties",
    "--automation", "human_confirmation",
    "--response-state", "approval_required",
    "--human-review-round", "2",
    "--bot-review-round", "3",
    "--comment-count", "50",
  ], workspace);
  await run([...active, "--summary", "review response resumed"], workspace);
  await fs.mkdir(path.join(workspace, "target"));
  await fs.writeFile(path.join(workspace, "target", "cache.bin"), "cache");
  await run([
    "publish", "--file", file,
    "--thread-id", "thread-a", "--thread-name", "Camera responder", "--title", "camera",
    "--thread-kind", "pr", "--status", "waiting",
    "--availability", "available", "--phase", "available",
    "--merged",
  ], workspace, { KNITTEN_OPR_CARGO_BIN: fakeCargo });

  await assert.rejects(fs.access(path.join(workspace, "target")), /ENOENT/);

  await run([
    ...active,
    "--thread-id", "thread-d",
    "--assignment-id", "assignment:thread-d",
    "--reset-packet-id", "reset:thread-d",
    "--comment-count", "100",
  ], workspace);
  const externalCache = path.join(root, "outside-target");
  await fs.mkdir(externalCache);
  await fs.symlink(externalCache, path.join(workspace, "target"));
  await run([
    "publish", "--file", file,
    "--thread-id", "thread-d", "--thread-name", "Unsafe cache responder", "--title", "unsafe cache",
    "--thread-kind", "pr", "--status", "waiting",
    "--availability", "available", "--phase", "available",
    "--merged",
  ], workspace, { KNITTEN_OPR_CARGO_BIN: fakeCargo });
  await fs.rm(path.join(workspace, "target"));
  await fs.access(externalCache);

  await Promise.all(["thread-b", "thread-c"].map((threadId) => run([
    ...active,
    "--thread-id", threadId,
    "--assignment-id", `assignment:${threadId}`,
    "--reset-packet-id", `reset:${threadId}`,
  ], workspace)));

  const room = JSON.parse(await fs.readFile(file, "utf8"));
  assert.equal(room.threads.length, 5);
  const available = room.threads.find((item) => item.threadId === "thread-a");
  assert.equal(available.threadName, "Camera responder");
  assert.equal(available.status, "waiting");
  assert.equal(available.availability, "available");
  assert.equal(available.assignmentId, null);
  assert.equal(available.targets.pullRequests.length, 0);
  assert.equal(available.cacheCleanup.status, "cleaned");
  assert.equal(room.threads.find((item) => item.threadId === "thread-b").assignmentGate.worktreeClean, true);
  assert.equal("summary" in room.threads.find((item) => item.threadId === "existing"), false);
  const failedCleanup = room.threads.find((item) => item.threadId === "thread-d");
  assert.equal(failedCleanup.availability, "reserved");
  assert.equal(failedCleanup.cacheCleanup.status, "failed");
  assert.equal(failedCleanup.targets.pullRequests.length, 1);

  await git(workspace, ["checkout", "-b", "work-status"]);
  await fs.writeFile(path.join(workspace, "feature.rs"), "fn feature() {}\n");
  await git(workspace, ["add", "feature.rs"]);
  await git(workspace, ["commit", "-m", "feature"]);
  await run([
    "publish", "--file", file,
    "--thread-id", "thread-work", "--thread-name", "Work thread", "--title", "work status",
    "--thread-kind", "work", "--status", "active",
    "--assignment-id", "work:STL-1", "--reset-packet-id", "reset:work",
    "--phase", "working", "--work-state", "working",
    "--base-ref", "main", "--last-linear-id", "STL-1",
    "--last-linear-name", "작업 상태 테스트",
    "--linear-split-at", "2026-08-04T00:00:00.000Z",
    "--web-app-url", "http://localhost:5173/",
  ], workspace);
  const roomWithWork = JSON.parse(await fs.readFile(file, "utf8"));
  const work = roomWithWork.threads.find((item) => item.threadId === "thread-work").work;
  assert.equal(work.state, "working");
  assert.equal(work.lastLinear.name, "작업 상태 테스트");
  assert.equal(work.loc.added, 1);
  assert.equal(work.loc.deleted, 0);

  await run([
    "set-thread-name", "--file", file,
    "--thread-id", "thread-work", "--thread-name", "Renamed work thread",
  ], workspace);
  const renamedRoom = JSON.parse(await fs.readFile(file, "utf8"));
  assert.equal(renamedRoom.threads.find((item) => item.threadId === "thread-work").threadName, "Renamed work thread");

  const skipped = await run([
    "publish", "--config", config,
    "--thread-id", "filtered", "--thread-name", "Filtered thread", "--title", "filtered",
    "--thread-kind", "work", "--status", "waiting",
    "--availability", "available", "--phase", "available",
    "--summary", "must not be written",
  ], otherWorkspace);
  assert.equal(skipped.configured, false);
  assert.equal(skipped.skipped, "workspace_filter");

  await fs.rm(root, { recursive: true, force: true });
  process.stdout.write("operation-room publisher tests passed\n");
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
