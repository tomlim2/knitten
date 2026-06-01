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

test("public safety scrub gate is listed", async () => {
  const result = await runValidator(["--list"]);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /^public-safety-scrub-gates$/m);
});

test("public safety scrub gate reports current core-candidate blocker", async () => {
  const result = await runValidator(["--check", "public-safety-scrub-gates"]);
  const output = `${result.stdout}\n${result.stderr}`;

  assert.notEqual(result.code, 0);
  assert.match(output, /agent\/rules\/obsidian\.md/);
  assert.match(output, /privacy-risk needs-scrub blocks public core promotion/);
});
