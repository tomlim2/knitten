import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { mergeArtifactPackRegistries } from "../scripts/merge-artifact-pack-registries.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8"));
}

async function writeJson(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

function outputEntry(overrides = {}) {
  return {
    id: "pack-output",
    description: "Pack exported output fixture",
    madeBy: "workflow:pack-fixture",
    writeTarget: {
      kind: "local-artifact",
      localArtifactTokens: ["pack", "reports", "{slug}", "summary"],
    },
    args: [{ name: "slug", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" }],
    template: "document-templates/pack-summary.json",
    format: "json",
    ...overrides,
  };
}

function localEntry(overrides = {}) {
  return {
    owner: "pack",
    artifactType: "reports",
    item: "summary",
    kind: "file",
    args: [{ name: "slug", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" }],
    path: ".agent-local/pack/reports/{slug}/summary.json",
    cleanupPath: ".agent-local/pack/reports/{slug}",
    description: "Pack exported local artifact path fixture",
    template: "document-templates/pack-summary.json",
    schemaKind: "pack-summary",
    ...overrides,
  };
}

async function makeFixturePack(t, { state = "active", outputs = [outputEntry()], localArtifactPaths = [localEntry()] } = {}) {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "knitten-pack-merge-"));
  t.after(() => fsp.rm(root, { recursive: true, force: true }));

  const manifest = {
    "schema-version": 1,
    "pack-id": "merge-pack",
    "display-name": "Merge Pack",
    version: "1.0.0",
    visibility: "public",
    "owner-domain": "domain",
    description: "Fixture pack for registry merge tests.",
    exports: [
      {
        "artifact-id": "pack-outputs",
        "artifact-type": "config",
        path: "config/outputs.json",
        shape: "file",
        mount: { layer: "config", target: "outputs.json", mode: "virtual" },
        load: "on-demand",
        dependencies: ["core:manifest-schema"],
        "privacy-risk": "public-safe",
      },
      {
        "artifact-id": "pack-local-artifact-paths",
        "artifact-type": "config",
        path: "config/local-artifact-paths.json",
        shape: "file",
        mount: { layer: "config", target: "local-artifact-paths.json", mode: "virtual" },
        load: "on-demand",
        dependencies: ["core:manifest-schema"],
        "privacy-risk": "public-safe",
      },
    ],
    "compatibility-aliases": [],
  };

  await writeJson(path.join(root, "artifact-pack.json"), manifest);
  await writeJson(path.join(root, "document-templates/pack-summary.json"), {
    schemaVersion: 1,
    kind: "pack-summary",
    status: "ready",
    summary: "<summary>",
  });
  await writeJson(path.join(root, "config/outputs.json"), { schemaVersion: 1, entries: outputs });
  await writeJson(path.join(root, "config/local-artifact-paths.json"), {
    schemaVersion: 1,
    root: ".agent-local",
    entries: localArtifactPaths,
  });

  const registryPath = path.join(root, "installed-packs.json");
  await writeJson(registryPath, {
    "schema-version": 1,
    "installed-packs": [{
      "pack-id": "merge-pack",
      state,
      "source-path": root,
      "manifest-path": path.join(root, "artifact-pack.json"),
      "manifest-digest": "test",
      scope: {},
      links: [],
      "candidate-index": [],
    }],
  });

  return { root, registryPath };
}

test("merges active pack outputs with core outputs", async (t) => {
  const { registryPath } = await makeFixturePack(t);
  const merged = await mergeArtifactPackRegistries({ kind: "outputs", registryPath });
  const core = readJson("agent/config/outputs.json");

  assert.equal(merged.schemaVersion, 1);
  assert.ok(merged.entries.length > core.entries.length);
  const entry = merged.entries.find((candidate) => candidate.id === "pack-output");
  assert.ok(entry);
  assert.equal(entry.template.endsWith("/document-templates/pack-summary.json"), true);
  assert.equal(path.isAbsolute(entry.template), true);
  assert.deepEqual(merged.generated.packs, [{ "pack-id": "merge-pack", "artifact-id": "pack-outputs" }]);
});

test("merges active pack local artifact paths with core local artifact paths", async (t) => {
  const { registryPath } = await makeFixturePack(t);
  const merged = await mergeArtifactPackRegistries({ kind: "local-artifact-paths", registryPath });
  const core = readJson("agent/config/local-artifact-paths.json");

  assert.equal(merged.schemaVersion, 1);
  assert.equal(merged.root, ".agent-local");
  assert.ok(merged.entries.length > core.entries.length);
  const entry = merged.entries.find((candidate) => candidate.owner === "pack" && candidate.artifactType === "reports" && candidate.item === "summary");
  assert.ok(entry);
  assert.equal(entry.template.endsWith("/document-templates/pack-summary.json"), true);
  assert.equal(path.isAbsolute(entry.template), true);
  assert.deepEqual(merged.generated.packs, [{ "pack-id": "merge-pack", "artifact-id": "pack-local-artifact-paths" }]);
});

test("ignores disabled pack rows", async (t) => {
  const { registryPath } = await makeFixturePack(t, { state: "disabled" });
  const merged = await mergeArtifactPackRegistries({ kind: "outputs", registryPath });
  const core = readJson("agent/config/outputs.json");

  assert.equal(merged.entries.length, core.entries.length);
  assert.deepEqual(merged.generated.packs, []);
});

test("rejects duplicate output ids across core and pack registries", async (t) => {
  const core = readJson("agent/config/outputs.json");
  const { registryPath } = await makeFixturePack(t, {
    outputs: [outputEntry({ id: core.entries[0].id })],
  });

  await assert.rejects(
    () => mergeArtifactPackRegistries({ kind: "outputs", registryPath }),
    /duplicate output id:/,
  );
});

test("rejects duplicate local artifact identities across core and pack registries", async (t) => {
  const core = readJson("agent/config/local-artifact-paths.json");
  const duplicate = core.entries[0];
  const { registryPath } = await makeFixturePack(t, {
    localArtifactPaths: [localEntry({
      owner: duplicate.owner,
      artifactType: duplicate.artifactType,
      item: duplicate.item,
    })],
  });

  await assert.rejects(
    () => mergeArtifactPackRegistries({ kind: "local-artifact-paths", registryPath }),
    /duplicate local artifact identity:/,
  );
});
