import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

import { resolveArtifactRoute } from "../scripts/resolve-artifact-route.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const examplePackRoot = path.join(repoRoot, "examples/artifact-packs/example-skill-pack");

async function readManifest() {
  return JSON.parse(await fs.readFile(path.join(examplePackRoot, "artifact-pack.json"), "utf8"));
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

test("example skill pack passes explicit artifact-pack validation", async () => {
  await runNode([
    "scripts/validate-llm-first.mjs",
    "--check",
    "artifact-pack",
    "--artifact-pack",
    examplePackRoot,
  ]);
});

test("example skill pack inspect is read-only with a temp registry", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "example-skill-pack-"));
  const registry = path.join(root, "registry.json");

  const result = await runNode([
    "scripts/install-artifact-pack.mjs",
    "inspect",
    "--artifact-pack",
    examplePackRoot,
    "--registry",
    registry,
    "--json",
  ]);
  const report = JSON.parse(result.stdout);

  assert.equal(report["planned-state"]["pack-id"], "example-skill-pack");
  assert.equal(report["planned-state"]["candidate-count"], 1);
  assert.equal(report["planned-state"]["link-count"], 0);
  await assert.rejects(fs.stat(registry), { code: "ENOENT" });
});

test("example skill pack resolves as primary from route evidence without body loads", async () => {
  const manifest = await readManifest();
  const result = resolveArtifactRoute({
    requestText: "please review this web markdown page",
    harnessId: "codex",
    cwdRepoKey: "knitten",
    workMode: "personal",
    touchedPaths: ["README.md"],
    namedArtifact: [],
    installedPacks: [installedRow(manifest)],
    manifests: [manifest],
  });

  assert.equal(result["result-kind"], "primary");
  assert.match(result["primary-candidate-id"], /example-skill-pack:demo-web-review/);
  assert.equal(result["resolver-body-load-count"], 0);
  assert.equal(result.candidates[0]["artifact-id"], "demo-web-review");
  assert.equal(result.candidates[0]["load-state"], "selected");
});

test("example skill pack compatibility alias resolves to canonical skill", async () => {
  const manifest = await readManifest();
  const result = resolveArtifactRoute({
    requestText: "use old-demo-web-review",
    harnessId: "codex",
    cwdRepoKey: "knitten",
    workMode: "personal",
    touchedPaths: [],
    namedArtifact: ["old-demo-web-review"],
    installedPacks: [installedRow(manifest)],
    manifests: [manifest],
  });
  const aliasCandidate = result.candidates.find((candidate) => candidate["compatibility-need"] === "alias");

  assert.equal(result["result-kind"], "primary");
  assert.equal(result["primary-candidate-id"], aliasCandidate["candidate-id"]);
  assert.equal(aliasCandidate["artifact-id"], "demo-web-review");
  assert.equal(aliasCandidate["compatibility-alias-id"], "old-demo-web-review");
  assert.equal(aliasCandidate["matched-compatibility-input"], "old-demo-web-review");
  assert.equal(result["resolver-body-load-count"], 0);
});

test("example skill pack canonical skill name does not select alias candidate", async () => {
  const manifest = await readManifest();
  const result = resolveArtifactRoute({
    requestText: "use demo-web-review",
    harnessId: "codex",
    cwdRepoKey: "knitten",
    workMode: "personal",
    touchedPaths: [],
    namedArtifact: ["demo-web-review"],
    installedPacks: [installedRow(manifest)],
    manifests: [manifest],
  });
  const aliasCandidate = result.candidates.find((candidate) => candidate["compatibility-need"] === "alias");

  assert.equal(result["result-kind"], "primary");
  assert.match(result["primary-candidate-id"], /demo-web-review:none:none$/);
  assert.notEqual(result["primary-candidate-id"], aliasCandidate["candidate-id"]);
  assert.equal(aliasCandidate.exactMatch, false);
  assert.equal(result["resolver-body-load-count"], 0);
});
