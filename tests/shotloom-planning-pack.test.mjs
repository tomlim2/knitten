import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

import { resolveArtifactRoute } from "../scripts/resolve-artifact-route.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packRoot = path.join(repoRoot, "tests/fixtures/artifact-packs/pass/shotloom-planning-pack");

async function readManifest() {
  return JSON.parse(await fs.readFile(path.join(packRoot, "artifact-pack.json"), "utf8"));
}

function installedRow(manifest) {
  return {
    "pack-id": manifest["pack-id"],
    state: "active",
    scope: {},
    "candidate-index": manifest.exports.map((entry) => ({
      "pack-id": manifest["pack-id"],
      "artifact-id": entry["artifact-id"],
      "artifact-type": entry["artifact-type"],
      "source-ref": `${manifest["pack-id"]}/${entry["artifact-id"]}`,
      load: entry.load,
      route: entry.route || {},
      scope: {},
    })),
  };
}

async function runNode(args) {
  return execFileAsync(process.execPath, args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

test("shotloom planning pack passes explicit artifact-pack validation", async () => {
  await runNode([
    "scripts/validate-llm-first.mjs",
    "--check",
    "artifact-pack",
    "--artifact-pack",
    packRoot,
  ]);
});

test("shotloom planning pack exports planning-only surfaces", async () => {
  const manifest = await readManifest();
  const ids = new Set(manifest.exports.map((entry) => entry["artifact-id"]));

  assert.deepEqual([...ids].sort(), [
    "json-handoff-packet-template",
    "shotloom-draft-spec",
    "shotloom-planning-local-artifact-paths",
    "shotloom-planning-manifest-template",
    "shotloom-planning-output-contracts",
    "shotloom-prepare-task",
    "shotloom-start-task",
  ]);
  assert.equal(manifest.visibility, "private");
  assert.equal(manifest.exports.every((entry) => entry["privacy-risk"] === "needs-scrub"), true);
});

test("shotloom planning pack selects prepare task by explicit name", async () => {
  const manifest = await readManifest();
  const result = resolveArtifactRoute({
    requestText: "use shotloom-prepare-task",
    harnessId: "codex",
    cwdRepoKey: "shotloom",
    workMode: "personal",
    touchedPaths: [],
    namedArtifact: ["shotloom-prepare-task"],
    installedPacks: [installedRow(manifest)],
    manifests: [manifest],
  });

  assert.equal(result["result-kind"], "primary");
  assert.match(result["primary-candidate-id"], /shotloom-planning-pack:shotloom-prepare-task:none:none$/);
  assert.equal(result["resolver-body-load-count"], 0);
});

test("shotloom planning pack resolves legacy start-task path", async () => {
  const manifest = await readManifest();
  const result = resolveArtifactRoute({
    requestText: "use agent/skills/shotloom-start-task",
    harnessId: "codex",
    cwdRepoKey: "shotloom",
    workMode: "personal",
    touchedPaths: [],
    namedArtifact: ["agent/skills/shotloom-start-task"],
    installedPacks: [installedRow(manifest)],
    manifests: [manifest],
  });
  const aliasCandidate = result.candidates.find((candidate) => candidate["compatibility-alias-id"] === "shotloom-start-task-legacy-path");

  assert.equal(result["result-kind"], "primary");
  assert.equal(result["primary-candidate-id"], aliasCandidate["candidate-id"]);
  assert.equal(aliasCandidate["artifact-id"], "shotloom-start-task");
  assert.equal(aliasCandidate["matched-compatibility-input"], "agent/skills/shotloom-start-task");
  assert.equal(result["resolver-body-load-count"], 0);
});
