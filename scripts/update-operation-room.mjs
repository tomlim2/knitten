#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const THREAD_KINDS = new Set(["work", "pr", "review"]);
const LIFECYCLE_STATUSES = new Set(["active", "waiting"]);
const AVAILABILITIES = new Set(["reserved", "available"]);
const WAIT_REASONS = new Set([
  "ci",
  "human_review",
  "author_changes",
  "merge",
  "user_input",
  "external_dependency",
]);
const BOARD_ORDER = new Map([
  ["work", 0],
  ["pr", 1],
  ["review", 2],
  ["waiting", 3],
]);
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), ".config", "knitten", "operation-room.json");

function usage() {
  return `Usage:
  knitten-opr-status publish [options]

Required:
  --title <text>
  --thread-kind <work|pr|review>
  --status <active|waiting>
  --phase <slug>
  --summary <text>

Assignment and waiting:
  --assignment-id <id>
  --availability <reserved|available>
  --waiting-for <ci|human_review|author_changes|merge|user_input|external_dependency>
  --reset-packet-id <id>

Optional:
  --thread-id <id>          Defaults to CODEX_THREAD_ID.
  --file <absolute-path>    Overrides environment and user-local config.
  --config <absolute-path>  Defaults to ~/.config/knitten/operation-room.json.
  --project <name>          Defaults to the cwd basename.
  --next-action <text>
  --blocked-by <text>
  --needs-user-input
  --pr <repo#number[:role]>
  --linear <issue-id[:role]>
  --dry-run`;
}

function takeValue(argv, index, name) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function parseArgs(argv) {
  const options = {
    command: null,
    file: null,
    config: DEFAULT_CONFIG_PATH,
    threadId: process.env.CODEX_THREAD_ID || null,
    title: null,
    project: null,
    threadKind: null,
    status: null,
    availability: null,
    waitingFor: [],
    assignmentId: null,
    resetPacketId: null,
    phase: null,
    summary: null,
    nextAction: null,
    blockedBy: null,
    needsUserInput: false,
    prs: [],
    linears: [],
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (index === 0 && arg === "publish") {
      options.command = arg;
    } else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--needs-user-input") {
      options.needsUserInput = true;
    } else if (arg === "--file") {
      options.file = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--config") {
      options.config = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--thread-id") {
      options.threadId = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--title") {
      options.title = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--project") {
      options.project = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--thread-kind") {
      options.threadKind = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--status") {
      options.status = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--availability") {
      options.availability = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--waiting-for") {
      options.waitingFor.push(takeValue(argv, index, arg));
      index += 1;
    } else if (arg === "--assignment-id") {
      options.assignmentId = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--reset-packet-id") {
      options.resetPacketId = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--phase") {
      options.phase = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--summary") {
      options.summary = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--next-action") {
      options.nextAction = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--blocked-by") {
      options.blockedBy = takeValue(argv, index, arg);
      index += 1;
    } else if (arg === "--pr") {
      options.prs.push(takeValue(argv, index, arg));
      index += 1;
    } else if (arg === "--linear") {
      options.linears.push(takeValue(argv, index, arg));
      index += 1;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (options.command !== "publish") throw new Error("publish command is required");
  for (const key of ["threadId", "title", "threadKind", "status", "phase", "summary"]) {
    if (!options[key]) throw new Error(`${key} is required`);
  }
  if (!/^[0-9a-zA-Z._:-]+$/.test(options.threadId)) throw new Error("threadId contains unsupported characters");
  if (!THREAD_KINDS.has(options.threadKind)) throw new Error(`unsupported thread kind: ${options.threadKind}`);
  if (!LIFECYCLE_STATUSES.has(options.status)) throw new Error(`unsupported lifecycle status: ${options.status}`);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(options.phase)) throw new Error("phase must be a lowercase slug");
  if (options.availability && !AVAILABILITIES.has(options.availability)) {
    throw new Error(`unsupported availability: ${options.availability}`);
  }
  for (const reason of options.waitingFor) {
    if (!WAIT_REASONS.has(reason)) throw new Error(`unsupported waiting reason: ${reason}`);
  }
  if (options.resetPacketId && !/^[0-9a-zA-Z._:-]+$/.test(options.resetPacketId)) {
    throw new Error("resetPacketId contains unsupported characters");
  }
  return options;
}

function splitRole(value, fallbackRole) {
  const match = value.match(/^(.*?):([a-z][a-z0-9_-]*)$/);
  if (!match) return { value, role: fallbackRole };
  return { value: match[1], role: match[2] };
}

function parsePr(value) {
  const parsed = splitRole(value, "target");
  const match = parsed.value.match(/^([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)#([1-9][0-9]*)$/);
  if (!match) throw new Error(`invalid PR target: ${value}`);
  return {
    repository: match[1],
    number: Number(match[2]),
    url: `https://github.com/${match[1]}/pull/${match[2]}`,
    role: parsed.role,
  };
}

function parseLinear(value) {
  const parsed = splitRole(value, "target");
  if (!/^[A-Z][A-Z0-9]*-[1-9][0-9]*$/.test(parsed.value)) {
    throw new Error(`invalid Linear target: ${value}`);
  }
  return { id: parsed.value, role: parsed.role };
}

async function readJsonIfPresent(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function resolveDestination(options, cwd) {
  if (options.file) return path.resolve(options.file);
  if (process.env.KNITTEN_OPR_STATUS_FILE) return path.resolve(process.env.KNITTEN_OPR_STATUS_FILE);
  const config = await readJsonIfPresent(path.resolve(options.config));
  if (!config) return { skipped: "not_configured" };
  if (config.schemaVersion !== 1 || typeof config.statusFile !== "string") {
    throw new Error("operation-room config must have schemaVersion 1 and statusFile");
  }
  const includes = config.includeWorkspaceBasenames;
  if (includes !== undefined) {
    if (!Array.isArray(includes) || includes.some((item) => typeof item !== "string")) {
      throw new Error("includeWorkspaceBasenames must be an array of strings");
    }
    if (!includes.includes(path.basename(cwd))) return { skipped: "workspace_filter" };
  }
  return path.resolve(config.statusFile);
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function acquireLock(lockFile) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const handle = await fs.open(lockFile, "wx");
      return async () => {
        await handle.close();
        await fs.rm(lockFile, { force: true });
      };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      try {
        const stat = await fs.stat(lockFile);
        if (Date.now() - stat.mtimeMs > 30000) {
          await fs.rm(lockFile, { force: true });
          continue;
        }
      } catch (statError) {
        if (statError.code !== "ENOENT") throw statError;
      }
      await delay(25 + Math.floor(Math.random() * 25));
    }
  }
  throw new Error(`timed out waiting for operation-room lock: ${lockFile}`);
}

function validateRoom(room) {
  if (!room || room.schemaVersion !== 1 || !Array.isArray(room.threads)) {
    throw new Error("operation-room JSON must have schemaVersion 1 and threads[]");
  }
}

function git(cwd, args) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    const detail = String(error.stderr || error.message || "git command failed").trim();
    throw new Error(`worktree gate failed: ${detail}`);
  }
}

async function verifyCleanWorktree(cwd, now) {
  if (git(cwd, ["rev-parse", "--is-inside-work-tree"]) !== "true") {
    throw new Error("worktree gate failed: cwd is not inside a Git worktree");
  }
  const changes = git(cwd, ["status", "--porcelain=v1", "--untracked-files=all"]);
  if (changes) throw new Error(`worktree gate failed: worktree is not clean\n${changes}`);
  const gitDir = git(cwd, ["rev-parse", "--absolute-git-dir"]);
  for (const marker of ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "rebase-apply", "rebase-merge", "sequencer"]) {
    try {
      await fs.access(path.join(gitDir, marker));
      throw new Error(`worktree gate failed: ${marker} operation is in progress`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const branch = git(cwd, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  if (!branch) throw new Error("worktree gate failed: detached HEAD is not assignable");
  return {
    worktreeClean: true,
    checkedAt: now,
    branch,
    head: git(cwd, ["rev-parse", "HEAD"]),
  };
}

function validateState(options) {
  const targetCount = options.prs.length + options.linears.length;
  if (options.status === "active") {
    if (options.availability) throw new Error("active status must not declare availability");
    if (options.waitingFor.length > 0) throw new Error("active status must not declare waiting reasons");
    if (!options.assignmentId) throw new Error("active status requires assignmentId");
    return;
  }
  if (!options.availability) throw new Error("waiting status requires availability");
  if (options.availability === "reserved") {
    if (!options.assignmentId) throw new Error("reserved waiting status requires assignmentId");
    if (options.waitingFor.length === 0) throw new Error("reserved waiting status requires waitingFor");
  } else {
    if (options.assignmentId) throw new Error("available waiting status must clear assignmentId");
    if (options.waitingFor.length > 0) throw new Error("available waiting status must clear waitingFor");
    if (targetCount > 0) throw new Error("available waiting status must clear PR and Linear targets");
    if (options.phase !== "available") throw new Error("available waiting status must use phase=available");
  }
  if (options.needsUserInput && !options.waitingFor.includes("user_input")) {
    throw new Error("needsUserInput requires waitingFor=user_input");
  }
}

function resetRequired(previous, options) {
  if (options.status !== "active") return false;
  if (!previous) return true;
  if (previous.assignmentId !== options.assignmentId) return true;
  return previous.status === "waiting" && previous.availability === "available";
}

async function entryFor(options, cwd, now, previous) {
  validateState(options);
  const requiresReset = resetRequired(previous, options);
  let assignmentGate = previous?.assignmentGate ?? null;
  if (requiresReset) {
    if (!options.resetPacketId) {
      throw new Error("new assignment requires resetPacketId after an explicit reset packet");
    }
    assignmentGate = {
      resetPacketId: options.resetPacketId,
      ...(await verifyCleanWorktree(cwd, now)),
    };
  }
  if (options.status === "waiting" && options.availability === "available") {
    assignmentGate = null;
  }
  const active = options.status === "active";
  return {
    threadId: options.threadId,
    title: options.title,
    hostId: "local",
    cwd,
    threadKind: options.threadKind,
    status: options.status,
    availability: options.availability,
    waitingFor: [...new Set(options.waitingFor)],
    assignmentId: options.assignmentId,
    assignmentGate,
    runtimeStatus: active ? "active" : "idle",
    turnStatus: active ? "inProgress" : "completed",
    workflowStatus: active ? "working" : "waiting_external",
    phase: options.phase,
    targets: {
      pullRequests: options.prs.map(parsePr),
      linearIssues: options.linears.map(parseLinear),
    },
    summary: options.summary,
    nextAction: options.nextAction,
    blockedBy: options.blockedBy,
    needsUserInput: options.needsUserInput,
    updatedAt: now,
  };
}

function boardState(entry) {
  return entry.status === "waiting" ? "waiting" : entry.threadKind;
}

async function publish(file, options, cwd) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const lockFile = `${file}.lock`;
  const release = await acquireLock(lockFile);
  try {
    const now = new Date().toISOString();
    const existing = await readJsonIfPresent(file);
    const room = existing || {
      schemaVersion: 1,
      observedAt: now,
      project: options.project || path.basename(cwd),
      threads: [],
    };
    validateRoom(room);
    const previous = room.threads.find((item) => item?.threadId === options.threadId) ?? null;
    const entry = await entryFor(options, cwd, now, previous);
    const threads = room.threads.filter((item) => item?.threadId !== entry.threadId);
    threads.push(entry);
    threads.sort((left, right) => {
      const stateDelta = (BOARD_ORDER.get(boardState(left)) ?? 99)
        - (BOARD_ORDER.get(boardState(right)) ?? 99);
      if (stateDelta !== 0) return stateDelta;
      return String(right.updatedAt || "").localeCompare(String(left.updatedAt || ""));
    });
    const next = {
      ...room,
      observedAt: now,
      project: room.project || options.project || path.basename(cwd),
      threads,
    };
    if (options.dryRun) return { file, entry, room: next, dryRun: true };
    const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
    try {
      await fs.writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, "utf8");
      await fs.rename(temporary, file);
    } finally {
      await fs.rm(temporary, { force: true });
    }
    return { file, entry, threadCount: threads.length, dryRun: false };
  } finally {
    await release();
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const cwd = path.resolve(process.cwd());
  const destination = await resolveDestination(options, cwd);
  if (typeof destination !== "string") {
    process.stdout.write(`${JSON.stringify({ ok: true, configured: false, ...destination })}\n`);
    return;
  }
  const result = await publish(destination, options, cwd);
  process.stdout.write(`${JSON.stringify({ ok: true, configured: true, ...result })}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
