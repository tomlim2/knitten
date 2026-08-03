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

async function run(args, cwd) {
  const result = await execFileAsync(process.execPath, [SCRIPT, ...args], {
    cwd,
    env: { ...process.env, CODEX_THREAD_ID: "" },
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
  await fs.mkdir(workspace);
  await fs.mkdir(otherWorkspace);
  await git(workspace, ["init", "-b", "main"]);
  await git(workspace, ["config", "user.email", "opr-test@example.invalid"]);
  await git(workspace, ["config", "user.name", "OPR Test"]);
  await git(workspace, ["commit", "--allow-empty", "-m", "test root"]);
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
    "--title", "camera",
    "--thread-kind", "pr",
    "--status", "active",
    "--assignment-id", "pr:CINEV/shotloom#894",
    "--phase", "implementation",
    "--summary", "current state",
    "--next-action", "verify",
    "--pr", "CINEV/shotloom#894:target",
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
    "--thread-id", "thread-a", "--title", "camera",
    "--thread-kind", "pr", "--status", "waiting",
    "--availability", "reserved", "--waiting-for", "human_review",
    "--assignment-id", "pr:CINEV/shotloom#894",
    "--phase", "awaiting_review", "--summary", "waiting for review",
    "--pr", "CINEV/shotloom#894:target",
  ], workspace);
  await run([...active, "--summary", "review response resumed"], workspace);
  await run([
    "publish", "--file", file,
    "--thread-id", "thread-a", "--title", "camera",
    "--thread-kind", "pr", "--status", "waiting",
    "--availability", "available", "--phase", "available",
    "--summary", "available for assignment",
  ], workspace);

  await Promise.all(["thread-b", "thread-c"].map((threadId) => run([
    ...active,
    "--thread-id", threadId,
    "--assignment-id", `assignment:${threadId}`,
    "--reset-packet-id", `reset:${threadId}`,
  ], workspace)));

  const room = JSON.parse(await fs.readFile(file, "utf8"));
  assert.equal(room.threads.length, 4);
  const available = room.threads.find((item) => item.threadId === "thread-a");
  assert.equal(available.status, "waiting");
  assert.equal(available.availability, "available");
  assert.equal(available.assignmentId, null);
  assert.equal(available.targets.pullRequests.length, 0);
  assert.equal(room.threads.find((item) => item.threadId === "thread-b").assignmentGate.worktreeClean, true);
  assert.equal(room.threads.find((item) => item.threadId === "existing").summary, "preserved");

  const skipped = await run([
    "publish", "--config", config,
    "--thread-id", "filtered", "--title", "filtered",
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
