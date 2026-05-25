import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const installer = path.join(repoRoot, "scripts/install-artifact-pack.mjs");
const fixtureRewriter = path.join(repoRoot, "scripts/rewrite-installed-pack-fixture.mjs");

async function runInstaller(args, options = {}) {
  try {
    const result = await execFileAsync(process.execPath, [installer, ...args, "--json"], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      ...options,
    });
    return { code: 0, json: JSON.parse(result.stdout), stdout: result.stdout, stderr: result.stderr };
  } catch (err) {
    return {
      code: err.code,
      json: err.stdout ? JSON.parse(err.stdout) : null,
      stdout: err.stdout,
      stderr: err.stderr,
    };
  }
}

async function makeTempRoot(prefix) {
  return fs.mkdtemp(path.join(os.tmpdir(), `installed-pack-${prefix}-`));
}

async function copyAndRewriteFixture(fixturePath) {
  const root = await makeTempRoot(path.basename(fixturePath));
  await fs.cp(path.join(repoRoot, fixturePath), root, { recursive: true });
  await execFileAsync(process.execPath, [fixtureRewriter, root], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return root;
}

test("virtual pack install lifecycle writes registry state transitions", async () => {
  const root = await makeTempRoot("virtual");
  const registry = path.join(root, "registry.json");
  const pack = path.join(repoRoot, "tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal");

  const install = await runInstaller(["install", "--artifact-pack", pack, "--registry", registry]);
  assert.equal(install.code, 0);
  assert.equal(install.json["planned-state"]["pack-id"], "fixture-pack");
  assert.equal(install.json["planned-state"].state, "active");
  await assert.rejects(fs.lstat(path.join(root, "registry.lock")), { code: "ENOENT" });

  const status = await runInstaller(["status", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(status.code, 0);
  assert.equal(status.json.rows[0].state, "active");

  const disable = await runInstaller(["disable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(disable.code, 0);
  assert.equal(disable.json["planned-state"].state, "disabled");

  const enable = await runInstaller(["enable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(enable.code, 0);
  assert.equal(enable.json["planned-state"].state, "active");

  const uninstall = await runInstaller(["uninstall", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(uninstall.code, 0);
  assert.equal(uninstall.json["planned-state"].state, "tombstoned");
});

test("link install creates a harness symlink and ownership map", async () => {
  const root = await makeTempRoot("link-safe");
  const registry = path.join(root, "registry.json");
  const harnessTarget = path.join(root, "harness-target");
  const harnessConfig = path.join(root, "agent-hub.json");
  const pack = path.join(repoRoot, "tests/fixtures/installed-pack-lifecycle/pass/link-safe");

  await fs.writeFile(harnessConfig, `${JSON.stringify({
    harnesses: [{
      id: "codex-test",
      deployTarget: harnessTarget,
      mappings: { skills: "agent/skills" },
    }],
    sharedLayers: [{ id: "skills", path: "agent/skills" }],
  }, null, 2)}\n`);

  const install = await runInstaller([
    "install",
    "--artifact-pack",
    pack,
    "--registry",
    registry,
    "--harness",
    "codex-test",
    "--harness-config",
    harnessConfig,
  ]);
  assert.equal(install.code, 0);

  const linkPath = path.join(harnessTarget, "skills", "demo-skill");
  const linkStat = await fs.lstat(linkPath);
  assert.equal(linkStat.isSymbolicLink(), true);

  const ownership = JSON.parse(await fs.readFile(path.join(root, "ownership-map.json"), "utf8"));
  assert.ok(ownership[linkPath]["ownership-token"]);

  const disable = await runInstaller(["disable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(disable.code, 0);
  await assert.rejects(fs.lstat(linkPath), { code: "ENOENT" });

  const enable = await runInstaller(["enable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(enable.code, 0);
  assert.equal((await fs.lstat(linkPath)).isSymbolicLink(), true);

  const uninstall = await runInstaller(["uninstall", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(uninstall.code, 0);
  await assert.rejects(fs.lstat(linkPath), { code: "ENOENT" });
});

test("unsafe link target under pack source is blocked", async () => {
  const root = await copyAndRewriteFixture("tests/fixtures/installed-pack-lifecycle/fail/deploy-target-inside-source");
  const result = await runInstaller([
    "install",
    "--artifact-pack",
    path.join(root, "pack-source"),
    "--registry",
    path.join(root, "registry.json"),
    "--harness",
    "codex-test",
    "--harness-config",
    path.join(root, "agent-hub.json"),
  ]);

  assert.equal(result.code, 1);
  assert.equal(result.json.actions[0].gate, "core-self-link");
});

test("uninstall reports non-owned link conflict and force tombstones row", async () => {
  const root = await copyAndRewriteFixture("tests/fixtures/installed-pack-lifecycle/fail/link-non-owned-symlink");
  const registry = path.join(root, "registry.json");

  const blocked = await runInstaller(["uninstall", "--pack-id", "fixture-pack", "--registry", registry, "--dry-run"]);
  assert.equal(blocked.code, 1);
  assert.equal(blocked.json.recovery.decision, "manual-conflict");
  assert.equal(blocked.json.conflicts[0].gate, "existing-path-ownership");

  const forced = await runInstaller(["uninstall", "--pack-id", "fixture-pack", "--registry", registry, "--force"]);
  assert.equal(forced.code, 0);
  assert.equal(forced.json["planned-state"].state, "tombstoned");
  assert.equal(forced.json.conflicts[0].gate, "existing-path-ownership");
});

test("disable removes resolver visibility before non-owned link cleanup", async () => {
  const root = await copyAndRewriteFixture("tests/fixtures/installed-pack-lifecycle/fail/link-non-owned-symlink");
  const registry = path.join(root, "registry.json");
  const linkPath = path.join(root, "harness-target", "skills", "demo-skill");

  const disabled = await runInstaller(["disable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(disabled.code, 0);
  assert.equal(disabled.json["planned-state"].state, "disabled");
  assert.equal(disabled.json.conflicts[0].gate, "existing-path-ownership");
  assert.equal((await fs.lstat(linkPath)).isSymbolicLink(), true);

  const status = await runInstaller(["status", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(status.code, 0);
  assert.equal(status.json.rows[0].state, "disabled");
});

test("recover reports stale journals and active locks", async () => {
  const stale = await copyAndRewriteFixture("tests/fixtures/installed-pack-lifecycle/fail/stale-journal");
  const locked = await copyAndRewriteFixture("tests/fixtures/installed-pack-lifecycle/fail/locked-registry");

  const staleResult = await runInstaller(["recover", "--dry-run", "--registry", path.join(stale, "registry.json")]);
  assert.equal(staleResult.code, 0);
  assert.equal(staleResult.json.recovery.decision, "rollback-planned-links");
  assert.equal(staleResult.json.recovery.actions[0].journal, "fixture-pack.tx-stale.update.json");

  const lockedResult = await runInstaller(["recover", "--dry-run", "--registry", path.join(locked, "registry.json")]);
  assert.equal(lockedResult.code, 3);
  assert.equal(lockedResult.json.actions[0].gate, "registry-locked");
  assert.equal(lockedResult.json.recovery.decision, "locked");
});

test("install refuses to adopt a preexisting non-owned symlink", async () => {
  const root = await makeTempRoot("adopt-symlink");
  const registry = path.join(root, "registry.json");
  const harnessTarget = path.join(root, "harness-target");
  const harnessConfig = path.join(root, "agent-hub.json");
  const pack = path.join(repoRoot, "tests/fixtures/installed-pack-lifecycle/pass/link-safe");
  const source = path.join(pack, "skills/demo-skill");
  const linkPath = path.join(harnessTarget, "skills", "demo-skill");

  await fs.mkdir(path.dirname(linkPath), { recursive: true });
  await fs.symlink(source, linkPath);
  await fs.writeFile(harnessConfig, `${JSON.stringify({
    harnesses: [{
      id: "codex-test",
      deployTarget: harnessTarget,
      mappings: { skills: "agent/skills" },
    }],
    sharedLayers: [{ id: "skills", path: "agent/skills" }],
  }, null, 2)}\n`);

  const result = await runInstaller([
    "install",
    "--artifact-pack",
    pack,
    "--registry",
    registry,
    "--harness",
    "codex-test",
    "--harness-config",
    harnessConfig,
  ]);

  assert.equal(result.code, 1);
  assert.equal(result.json.actions[0].gate, "existing-path-ownership");
});

test("disable refuses to delete a replaced symlink with matching payload", async () => {
  const root = await makeTempRoot("replaced-symlink");
  const registry = path.join(root, "registry.json");
  const harnessTarget = path.join(root, "harness-target");
  const harnessConfig = path.join(root, "agent-hub.json");
  const pack = path.join(repoRoot, "tests/fixtures/installed-pack-lifecycle/pass/link-safe");
  const linkPath = path.join(harnessTarget, "skills", "demo-skill");

  await fs.writeFile(harnessConfig, `${JSON.stringify({
    harnesses: [{
      id: "codex-test",
      deployTarget: harnessTarget,
      mappings: { skills: "agent/skills" },
    }],
    sharedLayers: [{ id: "skills", path: "agent/skills" }],
  }, null, 2)}\n`);

  const install = await runInstaller([
    "install",
    "--artifact-pack",
    pack,
    "--registry",
    registry,
    "--harness",
    "codex-test",
    "--harness-config",
    harnessConfig,
  ]);
  assert.equal(install.code, 0);

  const payload = await fs.readlink(linkPath);
  await fs.unlink(linkPath);
  await fs.symlink(payload, linkPath);
  const ownershipPath = path.join(root, "ownership-map.json");
  const ownership = JSON.parse(await fs.readFile(ownershipPath, "utf8"));
  ownership[linkPath]["created-lstat"].ino += 1;
  await fs.writeFile(ownershipPath, `${JSON.stringify(ownership, null, 2)}\n`);

  const disabled = await runInstaller(["disable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(disabled.code, 0);
  assert.equal(disabled.json.conflicts[0].gate, "existing-path-ownership");
  assert.equal((await fs.lstat(linkPath)).isSymbolicLink(), true);
});

test("write verbs refuse an active registry lock", async () => {
  const root = await makeTempRoot("locked-write");
  const registry = path.join(root, "registry.json");
  const pack = path.join(repoRoot, "tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal");
  await fs.writeFile(path.join(root, "registry.lock"), "locked\n");

  const result = await runInstaller(["install", "--artifact-pack", pack, "--registry", registry]);
  assert.equal(result.code, 3);
  assert.equal(result.json.actions[0].gate, "registry-locked");
});

test("enable revalidates manifest and rejects tombstoned rows", async () => {
  const root = await makeTempRoot("enable-guards");
  const pack = path.join(root, "pack");
  const registry = path.join(root, "registry.json");
  await fs.cp(path.join(repoRoot, "tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal"), pack, { recursive: true });

  const install = await runInstaller(["install", "--artifact-pack", pack, "--registry", registry]);
  assert.equal(install.code, 0);

  const disable = await runInstaller(["disable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(disable.code, 0);

  const manifestPath = path.join(pack, "artifact-pack.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest.exports[0].path = "../outside";
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const invalidEnable = await runInstaller(["enable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(invalidEnable.code, 1);

  manifest.exports[0].path = "skills/demo-skill";
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const enable = await runInstaller(["enable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(enable.code, 0);

  const uninstall = await runInstaller(["uninstall", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(uninstall.code, 0);

  const tombstoneEnable = await runInstaller(["enable", "--pack-id", "fixture-pack", "--registry", registry]);
  assert.equal(tombstoneEnable.code, 1);
  assert.equal(tombstoneEnable.json.actions[0].gate, "invalid-state-transition");
});

test("test harness override refuses live deploy target", async () => {
  const root = await makeTempRoot("live-target");
  const registry = path.join(root, "registry.json");
  const harnessConfig = path.join(root, "agent-hub.json");
  const pack = path.join(repoRoot, "tests/fixtures/installed-pack-lifecycle/pass/link-safe");

  await fs.writeFile(harnessConfig, `${JSON.stringify({
    harnesses: [{
      id: "codex-test",
      deployTarget: path.join(os.homedir(), ".codex"),
      mappings: { skills: "agent/skills" },
    }],
    sharedLayers: [{ id: "skills", path: "agent/skills" }],
  }, null, 2)}\n`);

  const result = await runInstaller([
    "install",
    "--artifact-pack",
    pack,
    "--registry",
    registry,
    "--harness",
    "codex-test",
    "--harness-config",
    harnessConfig,
  ]);

  assert.equal(result.code, 1);
  assert.equal(result.json.actions[0].gate, "harness-config-live-registry");
});

test("copy mount mode is rejected instead of installed as a no-op", async () => {
  const root = await makeTempRoot("copy-mode");
  const pack = path.join(root, "pack");
  const registry = path.join(root, "registry.json");
  await fs.cp(path.join(repoRoot, "tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal"), pack, { recursive: true });
  const manifestPath = path.join(pack, "artifact-pack.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest.exports[0].mount.mode = "copy";
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const result = await runInstaller(["install", "--artifact-pack", pack, "--registry", registry]);
  assert.equal(result.code, 1);
  assert.equal(result.json.actions[0].gate, "mount-mode-unsupported");
});

test("default JSON error reasons redact local absolute paths", async () => {
  const root = await makeTempRoot("redaction");
  const pack = path.join(root, "pack");
  const registry = path.join(root, "registry.json");
  await fs.cp(path.join(repoRoot, "tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal"), pack, { recursive: true });
  const manifestPath = path.join(pack, "artifact-pack.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest.exports[0].path = "../outside";
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const result = await runInstaller(["install", "--artifact-pack", pack, "--registry", registry]);
  assert.equal(result.code, 1);
  assert.doesNotMatch(result.stdout, new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(result.stdout, new RegExp(repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
