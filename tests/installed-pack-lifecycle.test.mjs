import assert from "node:assert/strict";
import crypto from "node:crypto";
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

async function makeRouteSelectedPack(root, packId, priority = null, fixture = "virtual-minimal") {
  const pack = path.join(root, packId);
  await fs.cp(path.join(repoRoot, `tests/fixtures/installed-pack-lifecycle/pass/${fixture}`), pack, { recursive: true });
  const skillPath = path.join(pack, "skills/demo-skill/SKILL.md");
  const manifestPath = path.join(pack, "artifact-pack.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest["pack-id"] = packId;
  manifest["display-name"] = packId;
  manifest.exports[0].load = "route-selected";
  manifest.exports[0].route = {
    domains: ["agent-hub"],
    "task-types": ["implementation"],
    ...(priority === null ? {} : { priority }),
  };
  await fs.writeFile(skillPath, "---\ndescription: Test fixture skill.\n---\n\n# Test Fixture\n");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return pack;
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

test("write verbs retire durable journals after successful completion", async () => {
  const root = await makeTempRoot("journal-retire");
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

  const commands = [
    ["install", "--artifact-pack", pack, "--registry", registry, "--harness", "codex-test", "--harness-config", harnessConfig],
    ["update", "--pack-id", "fixture-pack", "--registry", registry],
    ["disable", "--pack-id", "fixture-pack", "--registry", registry],
    ["enable", "--pack-id", "fixture-pack", "--registry", registry],
    ["uninstall", "--pack-id", "fixture-pack", "--registry", registry],
  ];
  for (const command of commands) {
    const result = await runInstaller(command);
    assert.equal(result.code, 0, result.stdout);
    const journalDir = path.join(root, "journals");
    const journals = await fs.readdir(journalDir).catch((err) => {
      if (err.code === "ENOENT") return [];
      throw err;
    });
    assert.deepEqual(journals, []);
  }
});

test("install prevalidates active manifest set before registry visibility", async () => {
  const root = await makeTempRoot("active-set-install");
  const registry = path.join(root, "registry.json");
  const firstPack = await makeRouteSelectedPack(root, "first-route-pack");
  const secondPack = await makeRouteSelectedPack(root, "second-route-pack");

  const firstInstall = await runInstaller(["install", "--artifact-pack", firstPack, "--registry", registry]);
  assert.equal(firstInstall.code, 0);

  const blocked = await runInstaller(["install", "--artifact-pack", secondPack, "--registry", registry]);
  assert.equal(blocked.code, 1);
  assert.equal(blocked.json.actions.at(-1).gate, "active-manifest-set");
  assert.doesNotMatch(blocked.stdout, new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const list = await runInstaller(["list", "--registry", registry]);
  assert.equal(list.code, 0);
  assert.equal(list.json["row-count"], 1);
  assert.equal(list.json.rows[0]["pack-id"], "first-route-pack");
  assert.equal(list.json.rows[0].state, "active");
});

test("install prevalidation blocks link exposure before mount apply", async () => {
  const root = await makeTempRoot("active-set-link");
  const registry = path.join(root, "registry.json");
  const harnessTarget = path.join(root, "harness-target");
  const harnessConfig = path.join(root, "agent-hub.json");
  const firstPack = await makeRouteSelectedPack(root, "first-route-pack");
  const linkPack = await makeRouteSelectedPack(root, "link-route-pack", null, "link-safe");
  const linkPath = path.join(harnessTarget, "skills", "demo-skill");

  await fs.writeFile(harnessConfig, `${JSON.stringify({
    harnesses: [{
      id: "codex-test",
      deployTarget: harnessTarget,
      mappings: { skills: "agent/skills" },
    }],
    sharedLayers: [{ id: "skills", path: "agent/skills" }],
  }, null, 2)}\n`);

  assert.equal((await runInstaller(["install", "--artifact-pack", firstPack, "--registry", registry])).code, 0);
  const blocked = await runInstaller([
    "install",
    "--artifact-pack",
    linkPack,
    "--registry",
    registry,
    "--harness",
    "codex-test",
    "--harness-config",
    harnessConfig,
  ]);
  assert.equal(blocked.code, 1);
  assert.equal(blocked.json.actions.at(-1).gate, "active-manifest-set");
  await assert.rejects(fs.lstat(linkPath), { code: "ENOENT" });
});

test("update prevalidates active manifest set before replacing candidates", async () => {
  const root = await makeTempRoot("active-set-update");
  const registry = path.join(root, "registry.json");
  const firstPack = await makeRouteSelectedPack(root, "first-route-pack", 1);
  const secondPack = await makeRouteSelectedPack(root, "second-route-pack", 2);

  assert.equal((await runInstaller(["install", "--artifact-pack", firstPack, "--registry", registry])).code, 0);
  assert.equal((await runInstaller(["install", "--artifact-pack", secondPack, "--registry", registry])).code, 0);

  const manifestPath = path.join(secondPack, "artifact-pack.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  delete manifest.exports[0].route.priority;
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const blocked = await runInstaller(["update", "--pack-id", "second-route-pack", "--registry", registry]);
  assert.equal(blocked.code, 1);
  assert.equal(blocked.json.actions.at(-1).gate, "active-manifest-set");

  const status = await runInstaller(["status", "--pack-id", "second-route-pack", "--registry", registry, "--verbose"]);
  assert.equal(status.code, 0);
  assert.equal(status.json.rows[0]["candidate-index"][0].route.priority, 2);
});

test("enable prevalidates active manifest set before restoring visibility", async () => {
  const root = await makeTempRoot("active-set-enable");
  const registry = path.join(root, "registry.json");
  const firstPack = await makeRouteSelectedPack(root, "first-route-pack", 1);
  const secondPack = await makeRouteSelectedPack(root, "second-route-pack", 2);

  assert.equal((await runInstaller(["install", "--artifact-pack", firstPack, "--registry", registry])).code, 0);
  assert.equal((await runInstaller(["install", "--artifact-pack", secondPack, "--registry", registry])).code, 0);
  assert.equal((await runInstaller(["disable", "--pack-id", "second-route-pack", "--registry", registry])).code, 0);

  const manifestPath = path.join(secondPack, "artifact-pack.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  delete manifest.exports[0].route.priority;
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const blocked = await runInstaller(["enable", "--pack-id", "second-route-pack", "--registry", registry]);
  assert.equal(blocked.code, 1);
  assert.equal(blocked.json.actions.at(-1).gate, "active-manifest-set");

  const status = await runInstaller(["status", "--pack-id", "second-route-pack", "--registry", registry]);
  assert.equal(status.code, 0);
  assert.equal(status.json.rows[0].state, "disabled");
});

test("recover rolls back only journal-owned partial install links", async () => {
  const root = await makeTempRoot("partial-install");
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

  const installedRegistry = JSON.parse(await fs.readFile(registry, "utf8"));
  const row = installedRegistry["installed-packs"][0];
  row["transaction-id"] = "tx-partial";
  row.links[0]["last-status"] = "active";
  const linkPath = row.links[0]["target-path"];
  const ownershipPath = path.join(root, "ownership-map.json");
  const ownership = JSON.parse(await fs.readFile(ownershipPath, "utf8"));
  ownership[linkPath]["transaction-id"] = "tx-partial";
  await fs.writeFile(ownershipPath, `${JSON.stringify(ownership, null, 2)}\n`);

  const emptyRegistry = { "schema-version": 1, "installed-packs": [] };
  await fs.writeFile(registry, `${JSON.stringify(emptyRegistry, null, 2)}\n`);
  const plannedRegistry = { "schema-version": 1, "installed-packs": [row] };
  const journal = {
    "transaction-id": "tx-partial",
    "pack-id": "fixture-pack",
    verb: "install",
    "registry-digest-before": digest(emptyRegistry),
    "registry-digest-planned": digest(plannedRegistry),
    "previous-row": null,
    "planned-row": row,
    "planned-actions": [],
    "ownership-metadata": { "link-targets": [linkPath] },
    status: "applying",
  };
  await fs.mkdir(path.join(root, "journals"), { recursive: true });
  await fs.writeFile(path.join(root, "journals", "fixture-pack.tx-partial.install.json"), `${JSON.stringify(journal, null, 2)}\n`);

  const dryRun = await runInstaller(["recover", "--dry-run", "--registry", registry]);
  assert.equal(dryRun.code, 0);
  assert.equal(dryRun.json.recovery.decision, "rollback-planned-links");
  assert.equal((await fs.lstat(linkPath)).isSymbolicLink(), true);

  const recovered = await runInstaller(["recover", "--registry", registry]);
  assert.equal(recovered.code, 0);
  assert.equal(recovered.json.recovery.decision, "rollback-planned-links");
  await assert.rejects(fs.lstat(linkPath), { code: "ENOENT" });
  const finalOwnership = JSON.parse(await fs.readFile(ownershipPath, "utf8"));
  assert.equal(finalOwnership[linkPath], undefined);
  await assert.rejects(fs.lstat(path.join(root, "journals", "fixture-pack.tx-partial.install.json")), { code: "ENOENT" });
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
