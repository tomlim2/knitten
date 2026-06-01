import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = "docs/plans/reports/knitten-pluginization-core-extraction/knitten-core-export-manifest-2026-06-01.json";

async function makeTempDir() {
  return fs.mkdtemp(path.join(os.tmpdir(), "knitten-core-tree-"));
}

async function assemble(outputDir) {
  return execFileAsync(
    process.execPath,
    ["scripts/assemble-knitten-core-tree.mjs", `--manifest=${manifestPath}`, `--output-dir=${outputDir}`],
    {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    },
  );
}

test("assembles core export manifest into a temporary tree", async () => {
  const tempDir = await makeTempDir();
  const outputDir = path.join(tempDir, "core");

  await assemble(outputDir);

  assert.ok(existsSync(path.join(outputDir, "SYSTEM.md")));
  assert.ok(existsSync(path.join(outputDir, "agent/AGENTS.md")));
  assert.ok(existsSync(path.join(outputDir, "scripts/validate-llm-first.mjs")));
  assert.ok(existsSync(path.join(outputDir, ".knitten-core-export-manifest.json")));
  assert.ok(existsSync(path.join(outputDir, "README.md")));
  assert.ok(existsSync(path.join(outputDir, "LICENSE")));
  assert.match(await fs.readFile(path.join(outputDir, "LICENSE"), "utf8"), /Apache License/);
  assert.ok(!existsSync(path.join(outputDir, "AGENT-HUB.md")));
});

test("refuses to assemble into a non-empty directory", async () => {
  const tempDir = await makeTempDir();
  const outputDir = path.join(tempDir, "core");
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, "existing.txt"), "keep\n");

  await assert.rejects(() => assemble(outputDir), /output directory is not empty/);
});
