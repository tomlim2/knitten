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
const fixturePackRoot = path.join(repoRoot, "tests/fixtures/artifact-packs/pass/image-convert-exr-pack");
const examplePackRoot = path.join(repoRoot, "examples/artifact-packs/image-convert-exr-pack");
const coreSkillPath = path.join(repoRoot, "agent/skills/image-convert-exr/SKILL.md");
const readinessReportPath = path.join(
  repoRoot,
  "docs/plans/reports/knitten-pluginization-core-extraction/skill-pack-readiness-image-convert-exr-2026-06-01.md",
);

async function readManifest(packRoot = fixturePackRoot) {
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

async function resolveNamedArtifact(namedArtifact, packRoot = fixturePackRoot) {
  const manifest = await readManifest(packRoot);
  return resolveArtifactRoute({
    requestText: `use ${namedArtifact}`,
    harnessId: "codex",
    cwdRepoKey: "knitten",
    workMode: "personal",
    touchedPaths: [],
    namedArtifact: [namedArtifact],
    installedPacks: [installedRow(manifest)],
    manifests: [manifest],
  });
}

async function validatePack(packRoot) {
  await runNode([
    "scripts/validate-llm-first.mjs",
    "--check",
    "artifact-pack",
    "--artifact-pack",
    packRoot,
  ]);
}

test("image convert exr fixture pack passes explicit artifact-pack validation", async () => {
  await validatePack(fixturePackRoot);
});

test("image convert exr example pack passes explicit artifact-pack validation", async () => {
  await validatePack(examplePackRoot);
});

test("image convert exr example pack inspect is read-only", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "image-convert-exr-pack-"));
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

  assert.equal(report["planned-state"]["pack-id"], "image-convert-exr-pack");
  assert.equal(report["planned-state"]["candidate-count"], 1);
  await assert.rejects(fs.stat(registry), { code: "ENOENT" });
});

test("image convert exr example skill uses pack-local script instructions", async () => {
  const skill = await fs.readFile(path.join(examplePackRoot, "skills/image-convert-exr/SKILL.md"), "utf8");

  assert.equal(skill.includes("~/.claude/skills/image-convert-exr"), false);
  assert.equal(skill.includes("<this-skill-directory>/convert.py"), true);
});

test("image convert exr core removal remains blocked until runtime replacement proof exists", async () => {
  const coreSkill = await fs.readFile(coreSkillPath, "utf8");
  const readinessReport = await fs.readFile(readinessReportPath, "utf8");

  assert.equal(coreSkill.includes("~/.claude/skills/image-convert-exr/convert.py"), true);
  assert.equal(readinessReport.includes("| Core removal readiness | `core-removal-blocked` |"), true);
});

test("image convert exr canonical skill name resolves without selecting compatibility", async () => {
  const result = await resolveNamedArtifact("image-convert-exr");
  const aliasCandidate = result.candidates.find((candidate) => candidate["compatibility-need"] === "old-path-mapping");

  assert.equal(result["result-kind"], "primary");
  assert.match(result["primary-candidate-id"], /image-convert-exr:none:none$/);
  assert.notEqual(result["primary-candidate-id"], aliasCandidate["candidate-id"]);
  assert.equal(aliasCandidate.exactMatch, false);
  assert.equal(result["resolver-body-load-count"], 0);
});

test("image convert exr legacy source path resolves to canonical pack skill", async () => {
  const result = await resolveNamedArtifact("agent/skills/image-convert-exr");
  const aliasCandidate = result.candidates.find((candidate) => candidate["compatibility-need"] === "old-path-mapping");

  assert.equal(result["result-kind"], "primary");
  assert.equal(result["primary-candidate-id"], aliasCandidate["candidate-id"]);
  assert.equal(aliasCandidate["artifact-id"], "image-convert-exr");
  assert.equal(aliasCandidate["matched-compatibility-input"], "agent/skills/image-convert-exr");
  assert.equal(aliasCandidate["route-evidence"].some((item) => item.axis === "exact-name" && item.value === "agent/skills/image-convert-exr"), true);
  assert.equal(result["resolver-body-load-count"], 0);
});

test("image convert exr example pack resolves from route evidence", async () => {
  const manifest = await readManifest(examplePackRoot);
  const result = resolveArtifactRoute({
    requestText: "convert exr texture with python",
    harnessId: "codex",
    cwdRepoKey: "knitten",
    workMode: "personal",
    touchedPaths: ["texture.exr"],
    namedArtifact: [],
    installedPacks: [installedRow(manifest)],
    manifests: [manifest],
  });

  assert.equal(result["result-kind"], "primary");
  assert.match(result["primary-candidate-id"], /image-convert-exr-pack:image-convert-exr/);
  assert.equal(result.candidates[0]["load-state"], "selected");
  assert.equal(result["resolver-body-load-count"], 0);
});
