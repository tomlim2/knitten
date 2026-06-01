import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function generateManifest() {
  const result = await execFileAsync(process.execPath, ["scripts/generate-knitten-core-export-manifest.mjs"], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(result.stdout);
}

test("core export manifest contains only public-safe core exports", async () => {
  const manifest = await generateManifest();

  assert.equal(manifest["schema-version"], 1);
  assert.equal(manifest["export-count"], manifest.exports.length);
  assert.ok(manifest.exports.length > 0);
  assert.ok(manifest.exports.every((entry) => entry["privacy-risk"] === "public-safe"));
  assert.ok(manifest.exports.every((entry) => entry["classification-stage"] === "core-candidate"));
  assert.ok(manifest.exports.every((entry) => entry["target-path"]));
});

test("core export manifest excludes Obsidian domain rule", async () => {
  const manifest = await generateManifest();
  const paths = manifest.exports.map((entry) => entry["source-artifact-path"]);

  assert.ok(!paths.includes("agent/rules/obsidian.md"));
});

test("core export manifest includes minimal entry seed", async () => {
  const manifest = await generateManifest();
  const paths = manifest.exports.map((entry) => entry["source-artifact-path"]);
  const required = [
    "SYSTEM.md",
    "agent/AGENTS.md",
    "agent/CLAUDE.md",
    "docs/reference/system-glossary.md",
    ".github/workflows/validate.yml",
    ".github/pull_request_template.md",
  ];

  for (const path of required) {
    assert.ok(paths.includes(path), `${path} should be exported`);
  }
});

test("core export manifest includes public README overlay", async () => {
  const manifest = await generateManifest();
  const readme = manifest.exports.find((entry) => entry["target-path"] === "README.md");

  assert.equal(readme?.["row-id"], "overlay:docs/public-core/README.md");
  assert.equal(readme?.["source-artifact-path"], "docs/public-core/README.md");
});

test("core export manifest includes Apache license overlay", async () => {
  const manifest = await generateManifest();
  const license = manifest.exports.find((entry) => entry["target-path"] === "LICENSE");

  assert.equal(license?.["row-id"], "overlay:docs/public-core/LICENSE");
  assert.equal(license?.["source-artifact-path"], "docs/public-core/LICENSE");
});

test("core export manifest leaves private-readiness docs out as source files", async () => {
  const manifest = await generateManifest();
  const sourcePaths = manifest.exports.map((entry) => entry["source-artifact-path"]);
  const deferred = ["README.md", "AGENT-HUB.md", "LOOKUP.md", "CHANGELOG.md"];

  for (const path of deferred) {
    assert.ok(!sourcePaths.includes(path), `${path} should stay deferred`);
  }
});
