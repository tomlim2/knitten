import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function runValidator(args) {
  try {
    const result = await execFileAsync(process.execPath, ["scripts/validate-llm-first.mjs", ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (err) {
    return { code: err.code, stdout: err.stdout || "", stderr: err.stderr || "" };
  }
}

test("knitten core tree smoke gate is listed", async () => {
  const result = await runValidator(["--list"]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /^knitten-core-tree-smoke$/m);
});

test("knitten core tree smoke gate passes", async () => {
  const result = await runValidator(["--check", "knitten-core-tree-smoke"]);

  assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /all checks passed/);
});
