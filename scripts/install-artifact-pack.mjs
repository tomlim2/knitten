#!/usr/bin/env node
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import crypto from "node:crypto";

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const SCRIPT_ID = "install-artifact-pack@0";
const WRITE_VERBS = new Set(["install", "update", "disable", "enable", "uninstall"]);
const PACK_SPEC_PATH = "docs/plans/proposed/installed-pack-lifecycle.md";

function usage() {
  return `usage: node scripts/install-artifact-pack.mjs <verb> [options]`;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      out._.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    if (eq !== -1) {
      out[arg.slice(2, eq)] = arg.slice(eq + 1);
      continue;
    }
    const key = arg.slice(2);
    if (["dry-run", "json", "replace", "keep-temp", "verbose", "force"].includes(key)) {
      out[key] = true;
      continue;
    }
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value`);
    out[key] = value;
    i += 1;
  }
  return out;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : stableJson(value)).digest("hex");
}

function cloneJson(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function isoNow() {
  return new Date().toISOString();
}

function redactPath(value, verbose, label) {
  return verbose ? value : label;
}

function redactReason(reason, args) {
  if (args.verbose) return reason;
  return String(reason)
    .split(REPO_ROOT).join("<repo>")
    .split(os.homedir()).join("<home>")
    .replaceAll(awaitableTmpDirPattern(), "<tmp>")
    .replace(/(?:\/private)?\/var\/folders\/[^\s"']+/g, "<tmp>")
    .replace(/\/tmp\/[^\s"']+/g, "<tmp>")
    .replace(/(?:\/[A-Za-z0-9._-]+){2,}/g, "<path>");
}

function awaitableTmpDirPattern() {
  return new RegExp(os.tmpdir().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
}

function reportBase(verb, args, registryPath) {
  return {
    verb,
    "dry-run": Boolean(args["dry-run"]),
    "registry-path": registryPath ? redactPath(registryPath, args.verbose, "<registry>") : undefined,
    actions: [],
    recovery: null,
  };
}

function printReport(report, args, exitCode = 0) {
  const cleaned = Object.fromEntries(Object.entries(report).filter(([, value]) => value !== undefined));
  if (args.json) {
    console.log(JSON.stringify(cleaned, null, 2));
  } else {
    console.log(`${cleaned.verb}: ${exitCode === 0 ? "ok" : "failed"}`);
    for (const action of cleaned.actions || []) {
      console.log(`- ${action.status}: ${action.kind}${action.gate ? ` (${action.gate})` : ""} ${action.reason || ""}`.trim());
    }
  }
  process.exit(exitCode);
}

function fail(report, args, gate, reason, exitCode = 1, extra = {}) {
  report.actions.push({
    kind: extra.kind || "registry-read",
    "pack-id": extra["pack-id"] || null,
    "artifact-id": extra["artifact-id"] || null,
    "harness-id": extra["harness-id"] || null,
    layer: extra.layer || null,
    "mount-mode": extra["mount-mode"] || null,
    gate,
    status: "blocked",
    reason: redactReason(reason, args),
  });
  printReport(report, args, exitCode);
}

async function realpathMaybe(p) {
  try {
    return await fs.realpath(p);
  } catch {
    return path.resolve(p);
  }
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

async function trackedPathSet() {
  const { stdout } = await execFileAsync("git", ["ls-files", "-z"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return new Set(stdout.split("\0").filter(Boolean).map((p) => path.resolve(REPO_ROOT, p)));
}

async function resolveRegistryPath(args) {
  const raw = args.registry || process.env.AGENT_HUB_PACK_REGISTRY;
  if (!raw) throw Object.assign(new Error("registry path required"), { gate: "registry-config-missing", code: 1 });
  return path.resolve(raw.replace(/^~(?=\/)/, os.homedir()));
}

async function validateRegistryPath(registryPath, sourceRoot = null) {
  const parent = path.dirname(registryPath);
  let parentStat;
  try {
    parentStat = await fs.stat(parent);
  } catch {
    throw Object.assign(new Error("registry parent is missing"), { gate: "registry-parent-missing", code: 1 });
  }
  if (!parentStat.isDirectory()) {
    throw Object.assign(new Error("registry parent is not a directory"), { gate: "registry-parent-invalid", code: 1 });
  }
  const realRegistry = path.join(await realpathMaybe(parent), path.basename(registryPath));
  const realRepo = await realpathMaybe(REPO_ROOT);
  if (isInside(realRegistry, realRepo)) {
    throw Object.assign(new Error("registry path is inside tracked source"), { gate: "registry-path-unsafe", code: 1 });
  }
  if (sourceRoot && isInside(realRegistry, await realpathMaybe(sourceRoot))) {
    throw Object.assign(new Error("registry path is inside pack source"), { gate: "registry-path-unsafe", code: 1 });
  }
  const tracked = await trackedPathSet();
  if (tracked.has(realRegistry)) {
    throw Object.assign(new Error("registry path is tracked"), { gate: "registry-path-unsafe", code: 1 });
  }
  return realRegistry;
}

async function readJsonFile(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

async function readRegistry(registryPath, missingMode = "missing") {
  try {
    const text = await fs.readFile(registryPath, "utf8");
    if (!text.trim()) throw Object.assign(new Error("registry is empty"), { gate: "registry-invalid", code: 1 });
    const registry = JSON.parse(text);
    if (!registry || registry["schema-version"] !== 1 || !Array.isArray(registry["installed-packs"])) {
      throw Object.assign(new Error("registry shape is invalid"), { gate: "registry-invalid", code: 1 });
    }
    return registry;
  } catch (err) {
    if (err.code === "ENOENT") {
      if (missingMode === "empty") return { "schema-version": 1, "installed-packs": [] };
      if (missingMode === "recover") return { "schema-version": 1, "installed-packs": [] };
      throw Object.assign(new Error("registry is missing"), { gate: missingMode === "recover" ? "registry-missing" : "registry-missing-row", code: 1 });
    }
    if (err instanceof SyntaxError) {
      throw Object.assign(new Error("registry JSON is invalid"), { gate: "registry-invalid", code: 1 });
    }
    throw err;
  }
}

async function writeRegistry(registryPath, registry) {
  await fs.mkdir(path.dirname(registryPath), { recursive: true });
  const tmp = `${registryPath}.tmp.${process.pid}`;
  await fs.writeFile(tmp, `${JSON.stringify(registry, null, 2)}\n`);
  await fs.rename(tmp, registryPath);
}

function journalDir(registryPath) {
  return path.join(path.dirname(registryPath), "journals");
}

function journalBasename(packId, transactionId, verb) {
  return `${packId}.${transactionId}.${verb}.json`;
}

function journalPath(registryPath, packId, transactionId, verb) {
  return path.join(journalDir(registryPath), journalBasename(packId, transactionId, verb));
}

async function writeJournal(registryPath, journal) {
  await fs.mkdir(journalDir(registryPath), { recursive: true });
  const file = journalPath(registryPath, journal["pack-id"], journal["transaction-id"], journal.verb);
  const tmp = `${file}.tmp.${process.pid}`;
  await fs.writeFile(tmp, `${JSON.stringify(journal, null, 2)}\n`);
  await fs.rename(tmp, file);
  return file;
}

async function removeJournal(registryPath, journal) {
  await fs.rm(journalPath(registryPath, journal["pack-id"], journal["transaction-id"], journal.verb), { force: true });
}

async function readJournals(registryPath) {
  const dir = journalDir(registryPath);
  let files = [];
  try {
    files = (await fs.readdir(dir)).filter((file) => file.endsWith(".json")).sort();
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  const journals = [];
  for (const file of files) {
    const data = await readJsonFile(path.join(dir, file));
    journals.push({ file, data });
  }
  return journals;
}

async function assertNoActiveJournal(registryPath, packId) {
  for (const { file, data } of await readJournals(registryPath)) {
    if (data["pack-id"] === packId && !["committed", "recovered"].includes(data.status)) {
      throw Object.assign(new Error(`unfinished journal exists: ${file}`), { gate: "journal-active", code: 1 });
    }
  }
}

async function acquireRegistryLock(registryPath) {
  const lockPath = path.join(path.dirname(registryPath), "registry.lock");
  const token = `${process.pid}:${Date.now()}:${crypto.randomUUID()}`;
  let handle;
  try {
    handle = await fs.open(lockPath, "wx");
    await handle.writeFile(`${JSON.stringify({
      "created-at": isoNow(),
      pid: process.pid,
      token,
      "created-by": SCRIPT_ID,
    }, null, 2)}\n`);
  } catch (err) {
    if (err.code === "EEXIST") {
      throw Object.assign(new Error("registry lock is active"), { gate: "registry-locked", code: 3 });
    }
    throw err;
  } finally {
    if (handle) await handle.close();
  }
  process.once("exit", () => {
    try {
      const current = JSON.parse(readFileSync(lockPath, "utf8"));
      if (current.token === token) rmSync(lockPath, { force: true });
    } catch {
      // Best-effort lock cleanup; stale locks are intentionally visible to recover.
    }
  });
}

async function loadManifest(input) {
  const absolute = path.resolve(input);
  const st = await fs.stat(absolute);
  const manifestPath = st.isDirectory() ? path.join(absolute, "artifact-pack.json") : absolute;
  const sourceRoot = path.dirname(manifestPath);
  const manifest = await readJsonFile(manifestPath);
  return { sourceRoot, manifestPath, manifest };
}

async function validateArtifactPack(sourceRoot) {
  await execFileAsync(process.execPath, [
    "scripts/validate-llm-first.mjs",
    "--check",
    "artifact-pack",
    "--artifact-pack",
    sourceRoot,
  ], { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
}

function candidateRows(manifest) {
  return (manifest.exports || []).map((entry) => ({
    "pack-id": manifest["pack-id"],
    "artifact-id": entry["artifact-id"],
    "artifact-type": entry["artifact-type"],
    "source-ref": `${manifest["pack-id"]}/${entry["artifact-id"]}`,
    "manifest-digest": digest(manifest),
    load: entry.load,
    route: entry.route || {},
    "mount-mode": entry.mount?.mode || "virtual",
    scope: {},
  }));
}

function summarizeRow(row, verbose) {
  if (!row) return null;
  return {
    "pack-id": row["pack-id"],
    state: row.state,
    "source-kind": row["source-kind"],
    scope: row.scope || {},
    "manifest-digest": row["manifest-digest"],
    "updated-at": row["updated-at"],
    "candidate-count": (row["candidate-index"] || []).length,
    "link-count": (row.links || []).length,
    ...(verbose ? { "source-path": row["source-path"], "manifest-path": row["manifest-path"], links: row.links, "candidate-index": row["candidate-index"] } : {}),
  };
}

function findNewestRow(registry, packId) {
  return [...registry["installed-packs"]].reverse().find((row) => row["pack-id"] === packId) || null;
}

function activeRow(registry, packId) {
  return registry["installed-packs"].find((row) => row["pack-id"] === packId && row.state === "active") || null;
}

function upsertRow(registry, nextRow) {
  const idx = registry["installed-packs"].findIndex((row) => row["pack-id"] === nextRow["pack-id"] && row.state !== "tombstoned");
  if (idx === -1) registry["installed-packs"].push(nextRow);
  else registry["installed-packs"][idx] = nextRow;
}

async function readHarnessConfig(args) {
  const configPath = args["harness-config"] ? path.resolve(args["harness-config"]) : path.join(REPO_ROOT, "agent/config/agent-hub.json");
  const config = await readJsonFile(configPath);
  return { configPath, config };
}

async function isTempRegistry(registryPath) {
  const tmp = await realpathMaybe(os.tmpdir());
  const parent = await realpathMaybe(path.dirname(registryPath));
  return isInside(parent, tmp);
}

async function ensureHarnessConfigAllowed(args, registryPath) {
  if (!args["harness-config"]) return;
  const configPath = path.resolve(args["harness-config"]);
  if (isInside(configPath, REPO_ROOT) || !(await isTempRegistry(registryPath))) {
    throw Object.assign(new Error("harness config requires temp registry and untracked config"), { gate: "harness-config-live-registry", code: 1 });
  }
  const tmp = await realpathMaybe(os.tmpdir());
  const { config } = await readHarnessConfig(args);
  for (const harness of config.harnesses || []) {
    const deployTarget = path.resolve((harness.deployTarget || "").replace(/^~(?=\/)/, os.homedir()));
    const deployParent = await realpathMaybe(path.dirname(deployTarget));
    if (!isInside(deployTarget, tmp) && !isInside(deployParent, tmp)) {
      throw Object.assign(new Error("harness config deploy target must be temp"), { gate: "harness-config-live-registry", code: 1 });
    }
    if (isInside(deployTarget, REPO_ROOT) || isInside(deployParent, REPO_ROOT)) {
      throw Object.assign(new Error("harness config deploy target is inside tracked source"), { gate: "harness-config-live-registry", code: 1 });
    }
  }
}

function assertSupportedMountModes(manifest) {
  for (const entry of manifest.exports || []) {
    const mode = entry.mount?.mode || "virtual";
    if (mode === "copy") {
      throw Object.assign(new Error("copy mount mode is not supported by this installer"), { gate: "mount-mode-unsupported", code: 1 });
    }
    if (!["virtual", "link"].includes(mode)) {
      throw Object.assign(new Error("unknown mount mode"), { gate: "mount-mode-unsupported", code: 1 });
    }
  }
}

async function planLinks(manifest, sourceRoot, args, registryPath) {
  const links = [];
  const actions = [];
  const exports = manifest.exports || [];
  const linkExports = exports.filter((entry) => entry.mount?.mode === "link");
  if (linkExports.length === 0) return { links, actions };

  const { config } = await readHarnessConfig(args);
  const harnessId = args.harness;
  const harnesses = (config.harnesses || []).filter((h) => !harnessId || h.id === harnessId);
  if (harnessId && harnesses.length === 0) {
    throw Object.assign(new Error("unknown harness"), { gate: "harness-unknown", code: 1 });
  }
  if (harnesses.length === 0) {
    throw Object.assign(new Error("link mount requires harness mapping"), { gate: "harness-mapping-missing", code: 1 });
  }
  for (const entry of linkExports) {
    const layer = entry.mount?.layer;
    const shared = (config.sharedLayers || []).find((candidate) => candidate.id === layer);
    if (!shared) throw Object.assign(new Error("link layer is unknown"), { gate: "harness-mapping-missing", code: 1 });
    for (const harness of harnesses) {
      const mappingEntry = Object.entries(harness.mappings || {}).find(([, relativeSource]) => relativeSource === shared.path);
      if (!mappingEntry) throw Object.assign(new Error("link layer unsupported for harness"), { gate: "harness-mapping-missing", code: 1 });
      const [targetRootName] = mappingEntry;
      const deployTarget = path.resolve((harness.deployTarget || "").replace(/^~(?=\/)/, os.homedir()));
      const targetPath = path.join(deployTarget, targetRootName, entry.mount.target);
      const sourcePath = path.join(sourceRoot, entry.path);
      const sourceReal = await realpathMaybe(sourcePath);
      const targetParentReal = await realpathMaybe(path.dirname(targetPath));
      const sourceRootReal = await realpathMaybe(sourceRoot);
      if (
        isInside(targetParentReal, sourceRootReal) ||
        isInside(path.resolve(path.dirname(targetPath)), path.resolve(sourceRoot)) ||
        isInside(targetParentReal, await realpathMaybe(REPO_ROOT)) ||
        isInside(path.resolve(path.dirname(targetPath)), path.resolve(REPO_ROOT))
      ) {
        throw Object.assign(new Error("target aliases source tree"), { gate: "core-self-link", code: 1 });
      }
      links.push({
        "pack-id": manifest["pack-id"],
        "artifact-id": entry["artifact-id"],
        "harness-id": harness.id,
        layer,
        target: entry.mount.target,
        "source-realpath": sourceReal,
        "target-path": targetPath,
        "target-realpath-parent": targetParentReal,
        "link-target": sourceReal,
        "ownership-token": digest(`${manifest["pack-id"]}:${entry["artifact-id"]}:${harness.id}:${targetPath}`),
        "created-by": SCRIPT_ID,
        "created-lstat": null,
        "last-status": "planned",
      });
      actions.push(action("link-create", manifest["pack-id"], entry, harness.id, "planned", "link mount planned"));
    }
  }
  await ensureHarnessConfigAllowed(args, registryPath);
  return { links, actions };
}

function mountedTargetRoot(link) {
  return String(link.target || "")
    .split("/")
    .filter(Boolean)
    .reduce((root) => path.dirname(root), link["target-path"]);
}

async function planLinksFromInstalledRow(manifest, sourceRoot, previousLinks) {
  const links = [];
  const actions = [];
  const linkExports = (manifest.exports || []).filter((entry) => entry.mount?.mode === "link");
  if (linkExports.length === 0) return { links, actions };

  const roots = new Map();
  for (const link of previousLinks || []) {
    roots.set(`${link["harness-id"]}:${link.layer}`, mountedTargetRoot(link));
  }
  for (const entry of linkExports) {
    const layer = entry.mount?.layer;
    for (const [key, targetRoot] of roots) {
      const [harnessId, rootLayer] = key.split(":");
      if (rootLayer !== layer) continue;
      const sourcePath = path.join(sourceRoot, entry.path);
      const sourceReal = await realpathMaybe(sourcePath);
      const targetPath = path.join(targetRoot, entry.mount.target);
      const targetParentReal = await realpathMaybe(path.dirname(targetPath));
      links.push({
        "pack-id": manifest["pack-id"],
        "artifact-id": entry["artifact-id"],
        "harness-id": harnessId,
        layer,
        target: entry.mount.target,
        "source-realpath": sourceReal,
        "target-path": targetPath,
        "target-realpath-parent": targetParentReal,
        "link-target": sourceReal,
        "ownership-token": digest(`${manifest["pack-id"]}:${entry["artifact-id"]}:${harnessId}:${targetPath}`),
        "created-by": SCRIPT_ID,
        "created-lstat": null,
        "last-status": "planned",
      });
      actions.push(action("link-create", manifest["pack-id"], entry, harnessId, "planned", "link mount planned"));
    }
  }
  if (links.length === 0 && linkExports.length > 0) {
    throw Object.assign(new Error("update link planning requires previous link roots or harness config"), { gate: "harness-mapping-missing", code: 1 });
  }
  return { links, actions };
}

function action(kind, packId, entry, harnessId, status, reason, gate = null) {
  return {
    kind,
    "pack-id": packId,
    "artifact-id": entry?.["artifact-id"] || null,
    "harness-id": harnessId || null,
    layer: entry?.mount?.layer || null,
    "mount-mode": entry?.mount?.mode || null,
    gate,
    status,
    reason,
  };
}

function conflictId(link, gate) {
  return `sha256:${digest({
    "pack-id": link["pack-id"],
    "artifact-id": link["artifact-id"],
    "harness-id": link["harness-id"],
    layer: link.layer,
    target: link.target,
    gate,
  })}`;
}

function linkActionFromRecord(kind, link, status, reason, gate = null) {
  return {
    kind,
    "pack-id": link["pack-id"],
    "artifact-id": link["artifact-id"],
    "harness-id": link["harness-id"],
    layer: link.layer,
    "mount-mode": "link",
    gate,
    status,
    reason,
  };
}

function linkConflict(link) {
  return {
    "conflict-id": conflictId(link, "existing-path-ownership"),
    "pack-id": link["pack-id"],
    "artifact-id": link["artifact-id"],
    "harness-id": link["harness-id"],
    layer: link.layer,
    target: "<target>",
    gate: "existing-path-ownership",
    status: "blocked",
  };
}

async function linkConflicts(row, registryPath) {
  const ownership = await loadOwnershipMap(registryPath);
  const conflicts = [];
  for (const link of row.links || []) {
    const target = link["target-path"];
    const owned = ownership[target];
    let blocked = false;
    try {
      const st = await fs.lstat(target);
      if (!st.isSymbolicLink()) blocked = true;
      else {
        const payload = await fs.readlink(target);
        if (payload !== link["link-target"] || !ownedLinkIdentityMatches(ownership, link, payload, st)) blocked = true;
      }
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    if (blocked) {
      conflicts.push(linkConflict(link));
    }
  }
  return conflicts;
}

function ownedLinkMatches(ownership, link, payload) {
  const owned = ownership[link["target-path"]];
  return Boolean(owned && owned["ownership-token"] === link["ownership-token"] && owned["link-payload"] === payload);
}

function lstatSnapshot(st) {
  return { dev: st.dev, ino: st.ino, mode: st.mode, size: st.size };
}

function lstatIdentityMatches(record, st) {
  if (!record) return false;
  for (const key of ["dev", "ino", "mode", "size"]) {
    if (typeof record[key] === "number" && record[key] !== st[key]) return false;
  }
  return ["dev", "ino", "mode", "size"].some((key) => typeof record[key] === "number");
}

function ownedLinkIdentityMatches(ownership, link, payload, st) {
  const owned = ownership[link["target-path"]];
  if (!ownedLinkMatches(ownership, link, payload)) return false;
  return lstatIdentityMatches(owned["created-lstat"], st) && lstatIdentityMatches(link["created-lstat"], st);
}

function sameLinkMount(a, b) {
  return a["target-path"] === b["target-path"] &&
    a["link-target"] === b["link-target"] &&
    a["ownership-token"] === b["ownership-token"];
}

async function removalState(link, ownership) {
  let exists = true;
  let removable = false;
  try {
    const st = await fs.lstat(link["target-path"]);
    if (st.isSymbolicLink()) {
      const payload = await fs.readlink(link["target-path"]);
      removable = payload === link["link-target"] && ownedLinkIdentityMatches(ownership, link, payload, st);
    }
  } catch (err) {
    if (err.code === "ENOENT") exists = false;
    else throw err;
  }
  return { exists, removable };
}

async function linkCreateConflict(link, ownership, removedTargets) {
  if (removedTargets.has(link["target-path"])) return null;
  try {
    const st = await fs.lstat(link["target-path"]);
    if (st.isSymbolicLink()) {
      const payload = await fs.readlink(link["target-path"]);
      if (payload === link["link-target"] && ownedLinkIdentityMatches(ownership, link, payload, st)) return null;
    }
    return linkConflict(link);
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

async function planLinkReconciliation(previousLinks, plannedLinks, registryPath) {
  const ownership = await loadOwnershipMap(registryPath);
  const unchanged = [];
  const linksToRemove = [];
  const linksToCreate = [];

  for (const previous of previousLinks) {
    const planned = plannedLinks.find((candidate) => sameLinkMount(previous, candidate));
    if (planned) {
      unchanged.push({ ...planned, "created-lstat": previous["created-lstat"], "last-status": previous["last-status"] });
    } else {
      linksToRemove.push(previous);
    }
  }

  for (const planned of plannedLinks) {
    if (!previousLinks.some((previous) => sameLinkMount(previous, planned))) linksToCreate.push(planned);
  }

  const conflicts = [];
  const removedTargets = new Set();
  for (const link of linksToRemove) {
    const state = await removalState(link, ownership);
    if (state.exists && !state.removable) conflicts.push(linkConflict(link));
    else removedTargets.add(link["target-path"]);
  }
  for (const link of linksToCreate) {
    const conflict = await linkCreateConflict(link, ownership, removedTargets);
    if (conflict) conflicts.push(conflict);
  }

  return {
    unchanged,
    linksToRemove,
    linksToCreate,
    nextLinks: plannedLinks.map((planned) => unchanged.find((link) => sameLinkMount(link, planned)) || planned),
    conflicts,
  };
}

async function applyLinks(links, args, registryPath, transactionId) {
  const ownership = await loadOwnershipMap(registryPath);
  for (const link of links) {
    const target = link["target-path"];
    try {
      const st = await fs.lstat(target);
      if (!st.isSymbolicLink()) {
        throw Object.assign(new Error("target is not installer-owned"), { gate: "existing-path-ownership", code: 1 });
      }
      const payload = await fs.readlink(target);
      if (payload !== link["link-target"] || !ownedLinkMatches(ownership, link, payload)) {
        throw Object.assign(new Error("target symlink is not installer-owned"), { gate: "existing-path-ownership", code: 1 });
      }
      if (!ownedLinkIdentityMatches(ownership, link, payload, st)) {
        throw Object.assign(new Error("target symlink identity is not installer-owned"), { gate: "existing-path-ownership", code: 1 });
      }
      link["created-lstat"] = lstatSnapshot(st);
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
    if (!args["dry-run"]) {
      await fs.mkdir(path.dirname(target), { recursive: true });
      try {
        await fs.symlink(link["link-target"], target);
      } catch (err) {
        if (err.code !== "EEXIST") throw err;
      }
      const st = await fs.lstat(target);
      link["created-lstat"] = lstatSnapshot(st);
      link["last-status"] = "active";
      ownership[target] = {
        "ownership-token": link["ownership-token"],
        "transaction-id": transactionId,
        "link-payload": link["link-target"],
        "created-lstat": link["created-lstat"],
      };
    }
  }
  if (!args["dry-run"] && links.length > 0) await writeOwnershipMap(registryPath, ownership);
}

async function removeOwnedLinks(row, args, registryPath) {
  const ownership = await loadOwnershipMap(registryPath);
  const actions = [];
  for (const link of row.links || []) {
    const target = link["target-path"];
    const { exists, removable } = await removalState(link, ownership);
    if (exists && !removable) continue;
    actions.push(linkActionFromRecord(
      "link-remove",
      link,
      args["dry-run"] ? "planned" : "applied",
      exists ? "installer-owned link removed" : "installer-owned link already absent",
    ));
    if (!args["dry-run"]) {
      if (exists) await fs.unlink(target);
      delete ownership[target];
    }
  }
  if (!args["dry-run"]) await writeOwnershipMap(registryPath, ownership);
  return actions;
}

async function removeJournalOwnedLinks(links, transactionId, args, registryPath) {
  const ownership = await loadOwnershipMap(registryPath);
  const actions = [];
  for (const link of links || []) {
    const target = link["target-path"];
    const owned = ownership[target];
    const baseAction = {
      kind: "link-remove",
      "pack-id": link["pack-id"],
      "artifact-id": link["artifact-id"],
      "harness-id": link["harness-id"],
      layer: link.layer,
      "mount-mode": "link",
      gate: null,
      status: args["dry-run"] ? "planned" : "applied",
      reason: "journal-owned link removed",
    };
    if (
      !owned ||
      owned["transaction-id"] !== transactionId ||
      owned["ownership-token"] !== link["ownership-token"] ||
      owned["link-payload"] !== link["link-target"]
    ) {
      actions.push({ ...baseAction, gate: "ownership-mismatch", status: "skipped", reason: "link ownership does not match journal" });
      continue;
    }
    let exists = true;
    let removable = false;
    try {
      const st = await fs.lstat(target);
      if (st.isSymbolicLink()) {
        const payload = await fs.readlink(target);
        removable = payload === link["link-target"] && lstatIdentityMatches(owned["created-lstat"], st);
      }
    } catch (err) {
      if (err.code === "ENOENT") exists = false;
      else throw err;
    }
    if (exists && !removable) {
      actions.push({ ...baseAction, gate: "existing-path-ownership", status: "skipped", reason: "target is not journal-owned" });
      continue;
    }
    actions.push({ ...baseAction, reason: exists ? "journal-owned link removed" : "journal-owned link already absent" });
    if (!args["dry-run"]) {
      if (exists) await fs.unlink(target);
      delete ownership[target];
    }
  }
  if (!args["dry-run"]) await writeOwnershipMap(registryPath, ownership);
  return actions;
}

function removeJournalRegistryRow(registry, journal, row) {
  if (!row) return false;
  const before = registry["installed-packs"].length;
  registry["installed-packs"] = registry["installed-packs"].filter((candidate) => !(
    candidate["pack-id"] === row["pack-id"] &&
    candidate["transaction-id"] === journal["transaction-id"]
  ));
  return before !== registry["installed-packs"].length;
}

async function materializeManifestSet(registry, args) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "installed-pack-manifest-set-"));
  for (const row of registry["installed-packs"].filter((candidate) => candidate.state === "active")) {
    const destRoot = path.join(tempDir, row["pack-id"]);
    await fs.mkdir(destRoot, { recursive: true });
    await fs.copyFile(row["manifest-path"], path.join(destRoot, "artifact-pack.json"));
    const manifest = await readJsonFile(row["manifest-path"]);
    for (const entry of manifest.exports || []) {
      const source = path.join(row["source-path"], entry.path);
      const target = path.join(destRoot, entry.path);
      await fs.mkdir(path.dirname(target), { recursive: true });
      try {
        await fs.symlink(source, target);
      } catch (err) {
        if (err.code !== "EEXIST") throw err;
      }
    }
  }
  return tempDir;
}

function plannedRegistryWithRow(registry, nextRow) {
  const planned = {
    ...registry,
    "installed-packs": registry["installed-packs"].map((row) => ({ ...row })),
  };
  upsertRow(planned, nextRow);
  return planned;
}

async function validateActiveManifestSet(registry, args) {
  const tempDir = await materializeManifestSet(registry, args);
  try {
    await execFileAsync(process.execPath, [
      "scripts/validate-llm-first.mjs",
      "--check",
      "artifact-pack",
      "--artifact-pack",
      tempDir,
    ], { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
    return tempDir;
  } catch (err) {
    const detail = [err.stdout, err.stderr, err.message].filter(Boolean).join("\n").trim();
    throw Object.assign(new Error(`active manifest-set validation failed${detail ? `: ${detail}` : ""}`), {
      gate: "active-manifest-set",
      code: 1,
    });
  } finally {
    if (!args["keep-temp"]) await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function loadOwnershipMap(registryPath) {
  const p = path.join(path.dirname(registryPath), "ownership-map.json");
  try {
    return await readJsonFile(p);
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

async function writeOwnershipMap(registryPath, map) {
  await fs.writeFile(path.join(path.dirname(registryPath), "ownership-map.json"), `${JSON.stringify(map, null, 2)}\n`);
}

async function commandList(verb, args, registryPath) {
  const report = reportBase(verb, args, registryPath);
  const registry = await readRegistry(registryPath, "empty");
  report["row-count"] = registry["installed-packs"].length;
  report.rows = registry["installed-packs"].map((row) => summarizeRow(row, args.verbose));
  printReport(report, args);
}

async function commandStatus(verb, args, registryPath) {
  const report = reportBase(verb, args, registryPath);
  const registry = await readRegistry(registryPath, "missing-row");
  const row = findNewestRow(registry, args["pack-id"]);
  if (!row) fail(report, args, "registry-missing-row", "no registry row matches pack-id", 1, { "pack-id": args["pack-id"] });
  report["row-count"] = 1;
  report.rows = [summarizeRow(row, args.verbose)];
  printReport(report, args);
}

async function commandInspect(verb, args, registryPath) {
  const report = reportBase(verb, args, registryPath);
  if (args["artifact-pack"]) {
    const loaded = await loadManifest(args["artifact-pack"]);
    assertSupportedMountModes(loaded.manifest);
    await validateRegistryPath(registryPath, loaded.sourceRoot);
    await validateArtifactPack(loaded.sourceRoot);
    const registry = await readRegistry(registryPath, "empty");
    const plannedLinks = await planLinks(loaded.manifest, loaded.sourceRoot, args, registryPath);
    report["previous-state"] = summarizeRow(findNewestRow(registry, loaded.manifest["pack-id"]), args.verbose);
    report["planned-state"] = {
      "pack-id": loaded.manifest["pack-id"],
      state: "pending",
      "candidate-count": candidateRows(loaded.manifest).length,
      "link-count": plannedLinks.links.length,
    };
    report["manifest-set-path"] = "<temp-manifest-set>";
    report.actions.push(action("validate", loaded.manifest["pack-id"], null, null, "applied", "manifest validation passed", "artifact-pack"));
    report.actions.push(...plannedLinks.actions);
    printReport(report, args);
    return;
  }
  return commandStatus(verb, args, registryPath);
}

async function commandInstall(verb, args, registryPath) {
  const report = reportBase(verb, args, registryPath);
  const loaded = await loadManifest(args["artifact-pack"]);
  assertSupportedMountModes(loaded.manifest);
  const safeRegistryPath = await validateRegistryPath(registryPath, loaded.sourceRoot);
  await validateArtifactPack(loaded.sourceRoot);
  const registry = await readRegistry(safeRegistryPath, "empty");
  if (activeRow(registry, loaded.manifest["pack-id"]) && !args.replace) {
    fail(report, args, "duplicate-pack-id", "active pack-id already exists", 1, { "pack-id": loaded.manifest["pack-id"], kind: "registry-write" });
  }
  if (!args["dry-run"]) await assertNoActiveJournal(safeRegistryPath, loaded.manifest["pack-id"]);
  const plannedLinks = await planLinks(loaded.manifest, loaded.sourceRoot, args, safeRegistryPath);
  const now = isoNow();
  const transactionId = `tx-${Date.now()}`;
  const row = {
    "pack-id": loaded.manifest["pack-id"],
    "source-kind": "local-folder",
    "source-path": loaded.sourceRoot,
    "manifest-path": loaded.manifestPath,
    "manifest-digest": digest(loaded.manifest),
    state: args["dry-run"] ? "pending" : "active",
    scope: args.harness ? { "harness-ids": [args.harness] } : {},
    links: plannedLinks.links,
    "candidate-index": candidateRows(loaded.manifest),
    "transaction-id": transactionId,
    "installed-at": now,
    "updated-at": now,
  };
  const previousRow = findNewestRow(registry, row["pack-id"]);
  report["previous-state"] = summarizeRow(previousRow, args.verbose);
  report["planned-state"] = summarizeRow(row, args.verbose);
  report.actions.push(action("validate", row["pack-id"], null, null, "applied", "manifest validation passed", "artifact-pack"));
  report.actions.push(...plannedLinks.actions.map((entry) => ({ ...entry, status: args["dry-run"] ? "planned" : "applied" })));
  const plannedRegistry = plannedRegistryWithRow(registry, { ...row, state: "active" });
  try {
    report["manifest-set-path"] = redactPath(await validateActiveManifestSet(plannedRegistry, args), args.verbose, "<temp-manifest-set>");
    report.actions.push(action("validate", row["pack-id"], null, null, "applied", "active manifest-set validation passed", "active-manifest-set"));
  } catch (err) {
    fail(report, args, err.gate || "active-manifest-set", err.message, err.code || 1, { "pack-id": row["pack-id"], kind: "validate" });
  }
  if (!args["dry-run"]) {
    const journal = {
      "transaction-id": transactionId,
      "pack-id": row["pack-id"],
      verb,
      "registry-digest-before": digest(registry),
      "registry-digest-planned": null,
      "previous-row": cloneJson(previousRow),
      "planned-row": cloneJson(row),
      "planned-actions": cloneJson(report.actions),
      "ownership-metadata": { "link-targets": plannedLinks.links.map((link) => link["target-path"]) },
      status: "planned",
      "created-at": now,
      "updated-at": now,
    };
    await writeJournal(safeRegistryPath, journal);
    journal.status = "applying";
    journal["updated-at"] = isoNow();
    await writeJournal(safeRegistryPath, journal);
    const latest = await readRegistry(safeRegistryPath, "empty");
    if (digest(latest) !== journal["registry-digest-before"]) {
      throw Object.assign(new Error("registry changed after planning"), { gate: "registry-digest-changed", code: 1 });
    }
    await applyLinks(plannedLinks.links, args, safeRegistryPath, transactionId);
    row.state = "active";
    upsertRow(latest, row);
    journal["planned-row"] = cloneJson(row);
    journal["registry-digest-planned"] = digest(latest);
    journal["planned-actions"] = cloneJson(report.actions);
    journal["updated-at"] = isoNow();
    await writeJournal(safeRegistryPath, journal);
    await writeRegistry(safeRegistryPath, latest);
    journal.status = "committed";
    journal["updated-at"] = isoNow();
    await writeJournal(safeRegistryPath, journal);
    await removeJournal(safeRegistryPath, journal);
  }
  printReport(report, args);
}

async function commandStateChange(verb, args, registryPath, nextState) {
  const report = reportBase(verb, args, registryPath);
  const registry = await readRegistry(registryPath, "missing-row");
  const row = findNewestRow(registry, args["pack-id"]);
  if (!row) fail(report, args, "registry-missing-row", "no registry row matches pack-id", 1, { "pack-id": args["pack-id"] });
  if (verb === "enable" && row.state !== "disabled") {
    fail(report, args, "invalid-state-transition", "enable requires a disabled installed pack", 1, { "pack-id": args["pack-id"], kind: "registry-write" });
  }
  if (verb === "disable" && row.state !== "active") {
    fail(report, args, "invalid-state-transition", "disable requires an active installed pack", 1, { "pack-id": args["pack-id"], kind: "registry-write" });
  }
  if (verb === "uninstall" && !["active", "disabled"].includes(row.state)) {
    fail(report, args, "invalid-state-transition", "uninstall requires an active or disabled installed pack", 1, { "pack-id": args["pack-id"], kind: "registry-write" });
  }
  report["previous-state"] = summarizeRow(row, args.verbose);
  const next = { ...row, state: nextState, "updated-at": isoNow(), "transaction-id": `tx-${Date.now()}` };
  report["planned-state"] = summarizeRow(next, args.verbose);
  if (!args["dry-run"]) await assertNoActiveJournal(registryPath, row["pack-id"]);
  if (verb === "uninstall" || verb === "disable") {
    const conflicts = await linkConflicts(row, registryPath);
    if (conflicts.length > 0) {
      report.conflicts = conflicts;
      report.recovery = {
        decision: "manual-conflict",
        gate: "existing-path-ownership",
        actions: [],
      };
      for (const conflict of conflicts) {
        report.actions.push(linkActionFromRecord("link-remove", conflict, "blocked", "target is not installer-owned", conflict.gate));
      }
      if (verb === "uninstall" && !args.force) {
        printReport(report, args, 1);
        return;
      }
    }
  }
  if (verb === "enable") {
    await validateArtifactPack(row["source-path"]);
    const manifest = await readJsonFile(row["manifest-path"]);
    assertSupportedMountModes(manifest);
    next["manifest-digest"] = digest(manifest);
    next["candidate-index"] = candidateRows(manifest);
    try {
      report["manifest-set-path"] = redactPath(await validateActiveManifestSet(plannedRegistryWithRow(registry, next), args), args.verbose, "<temp-manifest-set>");
      report.actions.push(action("validate", row["pack-id"], null, null, "applied", "active manifest-set validation passed", "active-manifest-set"));
    } catch (err) {
      fail(report, args, err.gate || "active-manifest-set", err.message, err.code || 1, { "pack-id": row["pack-id"], kind: "validate" });
    }
    report.actions.push(...(row.links || []).map((link) => ({
      ...linkActionFromRecord("link-create", link, args["dry-run"] ? "planned" : "applied", "installer-owned link active"),
      gate: null,
    })));
  }
  report.actions.push(action("registry-write", row["pack-id"], null, null, args["dry-run"] ? "planned" : "applied", `state set to ${nextState}`));
  if (!args["dry-run"]) {
    const plannedRegistry = cloneJson(registry);
    upsertRow(plannedRegistry, next);
    const journal = {
      "transaction-id": next["transaction-id"],
      "pack-id": row["pack-id"],
      verb,
      "registry-digest-before": digest(registry),
      "registry-digest-planned": digest(plannedRegistry),
      "previous-row": cloneJson(row),
      "planned-row": cloneJson(next),
      "planned-actions": cloneJson(report.actions),
      "ownership-metadata": { "link-targets": (row.links || []).map((link) => link["target-path"]) },
      status: "planned",
      "created-at": isoNow(),
      "updated-at": isoNow(),
    };
    await writeJournal(registryPath, journal);
    journal.status = "applying";
    journal["updated-at"] = isoNow();
    await writeJournal(registryPath, journal);
    const latest = await readRegistry(registryPath, "missing-row");
    if (digest(latest) !== journal["registry-digest-before"]) {
      throw Object.assign(new Error("registry changed after planning"), { gate: "registry-digest-changed", code: 1 });
    }
    if (verb === "enable") {
      await applyLinks(row.links || [], args, registryPath, next["transaction-id"]);
      const freshNext = cloneJson(next);
      upsertRow(latest, freshNext);
      journal["planned-row"] = cloneJson(freshNext);
      journal["registry-digest-planned"] = digest(latest);
      journal["updated-at"] = isoNow();
      await writeJournal(registryPath, journal);
    } else {
      upsertRow(latest, next);
    }
    await writeRegistry(registryPath, latest);
    registry["installed-packs"] = latest["installed-packs"];
  }
  if (verb === "uninstall" || verb === "disable") {
    report.actions.push(...(await removeOwnedLinks(row, args, registryPath)));
  }
  if (!args["dry-run"]) {
    const journal = {
      "transaction-id": next["transaction-id"],
      "pack-id": row["pack-id"],
      verb,
    };
    const current = await readJournals(registryPath);
    const activeJournal = current.find(({ data }) => data["transaction-id"] === next["transaction-id"] && data["pack-id"] === row["pack-id"]);
    if (activeJournal) {
      activeJournal.data.status = "committed";
      activeJournal.data["planned-actions"] = cloneJson(report.actions);
      activeJournal.data["updated-at"] = isoNow();
      await writeJournal(registryPath, activeJournal.data);
      await removeJournal(registryPath, activeJournal.data);
    } else {
      await removeJournal(registryPath, journal);
    }
  }
  printReport(report, args);
}

async function commandUpdate(verb, args, registryPath) {
  const report = reportBase(verb, args, registryPath);
  const registry = await readRegistry(registryPath, "missing-row");
  const row = findNewestRow(registry, args["pack-id"]);
  if (!row) fail(report, args, "registry-missing-row", "no registry row matches pack-id", 1, { "pack-id": args["pack-id"] });
  if (!args["dry-run"]) await assertNoActiveJournal(registryPath, row["pack-id"]);
  await validateArtifactPack(row["source-path"]);
  const manifest = await readJsonFile(row["manifest-path"]);
  assertSupportedMountModes(manifest);
  const scopedHarnesses = row.scope?.["harness-ids"] || [];
  const linkArgs = !args.harness && scopedHarnesses.length === 1 ? { ...args, harness: scopedHarnesses[0] } : args;
  const plannedLinks = args["harness-config"] || (row.links || []).length === 0
    ? await planLinks(manifest, row["source-path"], linkArgs, registryPath)
    : await planLinksFromInstalledRow(manifest, row["source-path"], row.links || []);
  const linkPlan = await planLinkReconciliation(row.links || [], plannedLinks.links, registryPath);
  const next = {
    ...row,
    "manifest-digest": digest(manifest),
    links: linkPlan.nextLinks,
    "candidate-index": candidateRows(manifest),
    "updated-at": isoNow(),
    "transaction-id": `tx-${Date.now()}`,
  };
  report["previous-state"] = summarizeRow(row, args.verbose);
  report["planned-state"] = summarizeRow(next, args.verbose);
  report.actions.push(action("validate", row["pack-id"], null, null, "applied", "manifest validation passed", "artifact-pack"));
  if (linkPlan.conflicts.length > 0) {
    report.conflicts = linkPlan.conflicts;
    report.recovery = {
      decision: "manual-conflict",
      gate: "existing-path-ownership",
      actions: [],
    };
    for (const conflict of linkPlan.conflicts) {
      report.actions.push(linkActionFromRecord("link-remove", conflict, "blocked", "target is not installer-owned", conflict.gate));
    }
    printReport(report, args, 1);
    return;
  }
  if (next.state === "active") {
    try {
      report["manifest-set-path"] = redactPath(await validateActiveManifestSet(plannedRegistryWithRow(registry, next), args), args.verbose, "<temp-manifest-set>");
      report.actions.push(action("validate", row["pack-id"], null, null, "applied", "active manifest-set validation passed", "active-manifest-set"));
    } catch (err) {
      fail(report, args, err.gate || "active-manifest-set", err.message, err.code || 1, { "pack-id": row["pack-id"], kind: "validate" });
    }
  }
  report.actions.push(...linkPlan.linksToRemove.map((link) => linkActionFromRecord(
    "link-remove",
    link,
    args["dry-run"] ? "planned" : "applied",
    "obsolete installer-owned link removed",
  )));
  report.actions.push(...linkPlan.linksToCreate.map((link) => linkActionFromRecord(
    "link-create",
    link,
    args["dry-run"] ? "planned" : "applied",
    "installer-owned link active",
  )));
  report.actions.push(action("candidate-index", row["pack-id"], null, null, args["dry-run"] ? "planned" : "applied", "candidate rows refreshed"));
  report.actions.push(action("registry-write", row["pack-id"], null, null, args["dry-run"] ? "planned" : "applied", "installed pack row refreshed"));
  if (!args["dry-run"]) {
    const plannedRegistry = cloneJson(registry);
    upsertRow(plannedRegistry, next);
    const journal = {
      "transaction-id": next["transaction-id"],
      "pack-id": row["pack-id"],
      verb,
      "registry-digest-before": digest(registry),
      "registry-digest-planned": digest(plannedRegistry),
      "previous-row": cloneJson(row),
      "planned-row": cloneJson(next),
      "planned-actions": cloneJson(report.actions),
      "ownership-metadata": {
        "link-targets": [...new Set([...(row.links || []), ...linkPlan.linksToCreate].map((link) => link["target-path"]))],
      },
      status: "planned",
      "created-at": isoNow(),
      "updated-at": isoNow(),
    };
    await writeJournal(registryPath, journal);
    journal.status = "applying";
    journal["updated-at"] = isoNow();
    await writeJournal(registryPath, journal);
    const latest = await readRegistry(registryPath, "missing-row");
    if (digest(latest) !== journal["registry-digest-before"]) {
      throw Object.assign(new Error("registry changed after planning"), { gate: "registry-digest-changed", code: 1 });
    }
    await removeOwnedLinks({ links: linkPlan.linksToRemove }, args, registryPath);
    await applyLinks(linkPlan.linksToCreate, args, registryPath, next["transaction-id"]);
    next.links = linkPlan.nextLinks.map((link) => linkPlan.linksToCreate.find((created) => sameLinkMount(created, link)) || link);
    upsertRow(latest, next);
    journal["planned-row"] = cloneJson(next);
    journal["registry-digest-planned"] = digest(latest);
    journal["planned-actions"] = cloneJson(report.actions);
    journal["updated-at"] = isoNow();
    await writeJournal(registryPath, journal);
    await writeRegistry(registryPath, latest);
    journal.status = "committed";
    journal["updated-at"] = isoNow();
    await writeJournal(registryPath, journal);
    await removeJournal(registryPath, journal);
  }
  printReport(report, args);
}

async function commandRecover(verb, args, registryPath) {
  const report = reportBase(verb, args, registryPath);
  const dir = path.dirname(registryPath);
  if (existsSync(path.join(dir, "registry.lock"))) {
    report.recovery = { decision: "locked", gate: "registry-locked", actions: [] };
    fail(report, args, "registry-locked", "registry lock is active", 3, { kind: "recover" });
  }
  if (!args["dry-run"]) await acquireRegistryLock(registryPath);
  const registry = await readRegistry(registryPath, "recover");
  const journals = await readJournals(registryPath);
  const currentDigest = digest(registry);
  const recoveryActions = [];
  let decision = "none";
  let gate = null;
  let exitCode = 0;
  for (const { file, data } of journals) {
    const journal = {
      ...data,
      "pack-id": data["pack-id"] || file.split(".")[0],
    };
    const plannedDigest = journal["registry-digest-planned"];
    const beforeDigest = journal["registry-digest-before"];
    let journalDecision = "digest-changed";
    if (journal.status === "committed") {
      journalDecision = "cleanup-committed";
    } else if (beforeDigest === currentDigest || !journal["planned-row"]) {
      journalDecision = "rollback-planned-links";
    } else if (plannedDigest && plannedDigest === currentDigest) {
      journalDecision = "finish-commit";
    }
    if (journalDecision === "digest-changed") {
      gate = "registry-digest-changed";
      exitCode = 1;
    }
    recoveryActions.push({
      kind: "recover",
      journal: file,
      verb: journal.verb,
      "pack-id": journal["pack-id"],
      "transaction-id": journal["transaction-id"],
      decision: journalDecision,
      status: args["dry-run"] ? "planned" : "applied",
    });
    if (args["dry-run"] || journalDecision === "digest-changed") continue;

    if (journalDecision === "rollback-planned-links") {
      const linkActions = await removeJournalOwnedLinks(journal["planned-row"]?.links || [], journal["transaction-id"], args, registryPath);
      recoveryActions.push(...linkActions.map((entry) => ({ ...entry, journal: file })));
      if (linkActions.some((entry) => entry.status === "skipped" && entry.gate)) {
        gate = "existing-path-ownership";
        exitCode = 1;
        continue;
      }
      if (journal.verb === "update" && (journal["previous-row"]?.links || []).length > 0) {
        await applyLinks(journal["previous-row"].links, args, registryPath, journal["transaction-id"]);
        recoveryActions.push(...journal["previous-row"].links.map((link) => ({
          ...linkActionFromRecord("link-create", link, "applied", "previous installer-owned link restored"),
          journal: file,
        })));
      }
      const latest = await readRegistry(registryPath, "recover");
      if (removeJournalRegistryRow(latest, journal, journal["planned-row"])) {
        await writeRegistry(registryPath, latest);
      }
      journal.status = "recovered";
      journal["updated-at"] = isoNow();
      await writeJournal(registryPath, journal);
      await removeJournal(registryPath, journal);
    }
    if (journalDecision === "finish-commit" || journalDecision === "cleanup-committed") {
      if (["disable", "uninstall"].includes(journal.verb)) {
        const linkActions = await removeOwnedLinks(journal["previous-row"] || { links: [] }, args, registryPath);
        recoveryActions.push(...linkActions.map((entry) => ({ ...entry, journal: file })));
      }
      journal.status = "recovered";
      journal["updated-at"] = isoNow();
      await writeJournal(registryPath, journal);
      await removeJournal(registryPath, journal);
    }
  }
  if (recoveryActions.length > 0) {
    if (recoveryActions.some((entry) => entry.decision === "digest-changed")) decision = "digest-changed";
    else if (recoveryActions.some((entry) => entry.decision === "finish-commit")) decision = "finish-commit";
    else if (recoveryActions.some((entry) => entry.decision === "cleanup-committed")) decision = "cleanup-committed";
    else decision = "rollback-planned-links";
  }
  report.recovery = {
    decision,
    gate,
    actions: recoveryActions,
  };
  report.actions.push(action("recover", null, null, null, args["dry-run"] ? "planned" : "applied", journals.length > 0 ? "journal recovery planned" : "no journals found", gate));
  printReport(report, args, exitCode);
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    console.error(usage());
    process.exit(2);
  }
  const verb = args._[0];
  if (!verb) {
    console.error(usage());
    process.exit(2);
  }
  let registryPath;
  try {
    registryPath = await resolveRegistryPath(args);
    registryPath = await validateRegistryPath(registryPath);
    if (args["harness-config"]) await ensureHarnessConfigAllowed(args, registryPath);
    if (WRITE_VERBS.has(verb) && !args["dry-run"]) await acquireRegistryLock(registryPath);
    if (verb === "list") return await commandList(verb, args, registryPath);
    if (verb === "status") return await commandStatus(verb, args, registryPath);
    if (verb === "inspect") return await commandInspect(verb, args, registryPath);
    if (verb === "install") return await commandInstall(verb, args, registryPath);
    if (verb === "update") return await commandUpdate(verb, args, registryPath);
    if (verb === "disable") return await commandStateChange(verb, args, registryPath, "disabled");
    if (verb === "enable") return await commandStateChange(verb, args, registryPath, "active");
    if (verb === "uninstall") return await commandStateChange(verb, args, registryPath, "tombstoned");
    if (verb === "recover") return await commandRecover(verb, args, registryPath);
    throw Object.assign(new Error(`unknown verb: ${verb}`), { code: 2 });
  } catch (err) {
    const report = reportBase(verb || "unknown", args || {}, registryPath);
    const code = err.code === 2 ? 2 : (err.code || 1);
    fail(report, args || {}, err.gate || "installer-error", err.message, code);
  }
}

main();
