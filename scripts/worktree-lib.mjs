import { existsSync } from "node:fs";
import { mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

export function runGit(args, options = {}) {
  const output = execFileSync("git", args, {
    cwd: options.cwd || process.cwd(),
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
  });
  return typeof output === "string" ? output.trim() : "";
}

export function tryGit(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: options.cwd || process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
  };
}

export function gitRoot(cwd = process.cwd()) {
  return runGit(["rev-parse", "--show-toplevel"], { cwd });
}

export function slugify(value) {
  return String(value || "task")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean)
    .slice(0, 5)
    .join("-") || "task";
}

export function timestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export async function readRepoConfig() {
  const candidates = [
    path.join(os.homedir(), ".claude/private/agent-hub-config/repo-paths.json"),
    path.join(os.homedir(), ".codex/private/agent-hub-config/repo-paths.json"),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    return { file, repos: JSON.parse(await readFile(file, "utf8")) };
  }
  return { file: null, repos: {} };
}

export async function realpathIfExists(value) {
  try {
    return await realpath(value);
  } catch {
    return path.resolve(value);
  }
}

export async function normalizeRepos(repos) {
  const out = { ...repos };
  if (!out.knitten && out["agent-hub"]) {
    out.knitten = { ...out["agent-hub"], aliasOf: "agent-hub" };
  }
  return out;
}

export async function resolveRepo(cwd = process.cwd(), forcedKey = null) {
  const topLevel = await realpathIfExists(gitRoot(cwd));
  const commonDirRaw = runGit(["rev-parse", "--git-common-dir"], { cwd });
  const commonDir = path.isAbsolute(commonDirRaw)
    ? commonDirRaw
    : path.resolve(topLevel, commonDirRaw);
  const commonMainPath = path.basename(commonDir) === ".git"
    ? await realpathIfExists(path.dirname(commonDir))
    : null;
  const { file, repos } = await readRepoConfig();
  const normalized = await normalizeRepos(repos);
  if (forcedKey) {
    const entry = normalized[forcedKey];
    return { key: forcedKey, entry, configFile: file, topLevel, repos: normalized };
  }
  const orderedEntries = Object.entries(normalized).sort(([a], [b]) => {
    if (a === "knitten") return -1;
    if (b === "knitten") return 1;
    return 0;
  });
  for (const [key, entry] of orderedEntries) {
    if (!entry?.path) continue;
    const repoPath = await realpathIfExists(entry.path);
    if (
      topLevel === repoPath ||
      topLevel.startsWith(`${repoPath}${path.sep}`) ||
      commonMainPath === repoPath
    ) {
      return { key, entry, configFile: file, topLevel, repos: normalized };
    }
  }
  return { key: null, entry: null, configFile: file, topLevel, repos: normalized };
}

export async function policyFor(cwd = process.cwd(), forcedKey = null) {
  const resolved = await resolveRepo(cwd, forcedKey);
  const policy = resolved.entry?.worktreePolicy;
  return { ...resolved, policy };
}

export async function mainPathFor(entry) {
  if (!entry?.path) return null;
  return realpathIfExists(entry.path);
}

export function resolveWorktreeRoot(mainPath, policy, testMode = false) {
  const configured = policy?.worktreeRoot || "../knitten-worktrees";
  const root = path.isAbsolute(configured)
    ? configured
    : path.resolve(mainPath, configured);
  return testMode ? path.join(root, ".test") : root;
}

export function ensureEnabledPolicy(context) {
  if (!context.entry) {
    throw new Error("worktree policy: current repository is not registered in repo config");
  }
  if (context.policy?.enabled !== true) {
    throw new Error(`${context.key} policy: worktree-first is not enabled for this repository`);
  }
}

export function statusPorcelain(cwd) {
  return runGit(["status", "--porcelain"], { cwd });
}

export function isClean(cwd) {
  return statusPorcelain(cwd) === "";
}

export function currentBranch(cwd) {
  const result = tryGit(["branch", "--show-current"], { cwd });
  return result.ok ? result.stdout : "";
}

export function remoteBranchExists(branch, cwd) {
  if (!branch) return false;
  return tryGit(["ls-remote", "--exit-code", "--heads", "origin", branch], { cwd }).ok;
}

export function localBranchExists(branch, cwd) {
  if (!branch) return false;
  return tryGit(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`], { cwd }).ok;
}

export function branchMergedIntoMain(branch, cwd) {
  if (!branch) return false;
  const main = tryGit(["merge-base", "--is-ancestor", branch, "main"], { cwd });
  if (main.ok) return true;
  const originMain = tryGit(["merge-base", "--is-ancestor", branch, "origin/main"], { cwd });
  return originMain.ok;
}

export function parseWorktreeList(cwd = process.cwd()) {
  const text = runGit(["worktree", "list", "--porcelain"], { cwd });
  const items = [];
  let current = null;
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    if (line.startsWith("worktree ")) {
      if (current) items.push(current);
      current = { path: line.slice("worktree ".length) };
    } else if (current && line.startsWith("branch ")) {
      current.branchRef = line.slice("branch ".length);
      current.branch = current.branchRef.replace(/^refs\/heads\//, "");
    } else if (current && line.startsWith("HEAD ")) {
      current.head = line.slice("HEAD ".length);
    } else if (current && line.startsWith("prunable ")) {
      current.prunable = line.slice("prunable ".length);
    }
  }
  if (current) items.push(current);
  return items;
}

export async function writeExecutable(file, body) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, body, { mode: 0o755 });
}

export async function removePath(file) {
  await rm(file, { recursive: true, force: true });
}
