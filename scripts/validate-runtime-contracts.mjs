#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { predictedSkillFor, runEval } from "./run-context-load-smoke-eval.mjs";
import {
  markdownLinkDestinations,
  sourcePluginFiles,
} from "./plugin-source-files.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(args, { expectSuccess = true, cwd = REPO_ROOT, env = process.env } = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    env,
    encoding: "utf8",
  });
  if (expectSuccess && result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `${args.join(" ")} failed`).trim());
  }
  if (!expectSuccess && result.status === 0) {
    throw new Error(`${args.join(" ")} should have failed`);
  }
  return result;
}

function validateMaterializationRollback(tempRoot) {
  const marketplaceRoot = path.join(tempRoot, "rollback-marketplace");
  const materialize = "scripts/materialize-local-plugin.mjs";
  run([materialize, `--marketplace-root=${marketplaceRoot}`, "--cachebuster=rollback-base"]);
  const installedRoot = path.join(marketplaceRoot, "plugins", "knitten");
  const sentinel = path.join(installedRoot, ".agent-local", "rollback-sentinel.txt");
  fs.mkdirSync(path.dirname(sentinel), { recursive: true });
  fs.writeFileSync(sentinel, "must-survive\n", "utf8");

  for (const stage of ["before-swap", "after-backup", "before-promote"]) {
    run([
      materialize,
      `--marketplace-root=${marketplaceRoot}`,
      `--cachebuster=rollback-${stage}`,
    ], {
      expectSuccess: false,
      env: { ...process.env, KNITTEN_MATERIALIZE_TEST_FAIL: stage },
    });
    assert.equal(fs.readFileSync(sentinel, "utf8"), "must-survive\n");
    assert.equal(
      fs.readdirSync(path.join(marketplaceRoot, "plugins"))
        .some((name) => name.includes(".stage-") || name.includes(".backup-")),
      false,
    );
  }
}

function git(cwd, args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `git ${args.join(" ")} failed`).trim());
  }
}

function runJson(args) {
  const result = run(args);
  return JSON.parse(result.stdout);
}

function validateMaterializationPreservesLocalState(tempRoot) {
  const materialize = "scripts/materialize-local-plugin.mjs";
  run([materialize, `--marketplace-root=${tempRoot}`, "--cachebuster=runtime1"]);
  const installedRoot = path.join(tempRoot, "plugins", "knitten");
  const sentinel = path.join(installedRoot, ".agent-local", "workflow", "reports", "sentinel.txt");
  fs.mkdirSync(path.dirname(sentinel), { recursive: true });
  fs.writeFileSync(sentinel, "must-survive\n", "utf8");

  run([materialize, `--marketplace-root=${tempRoot}`, "--cachebuster=runtime2"]);
  assert.equal(fs.readFileSync(sentinel, "utf8"), "must-survive\n");
  assert.equal(
    fs.readdirSync(path.join(tempRoot, "plugins")).some((name) => name.includes(".stage-") || name.includes(".backup-")),
    false,
  );

  const doctor = runJson(["scripts/doctor.mjs", `--marketplace-root=${tempRoot}`]);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.checks.find((item) => item.id === "copied-files-match-source")?.ok, true);

  const collector = path.join(installedRoot, "scripts", "run-compact-collector-pilot.mjs");
  const passing = runJson([
    collector,
    "--run=runtime-collector-pass",
    `--cwd=${installedRoot}`,
    "--command=pass::node -e \"process.stdout.write('ok')\"",
  ]);
  assert.equal(passing.ok, true);
  const failingResult = run([
    collector,
    "--run=runtime-collector-fail",
    `--cwd=${installedRoot}`,
    "--command=fail::node -e \"process.exit(7)\"",
  ], { expectSuccess: false });
  const failing = JSON.parse(failingResult.stdout);
  assert.equal(failing.ok, false);
  assert.equal(failing.failed[0]?.exitCode, 7);
}

function validateMaterializationRejectsSymlinkedSourceTarget(tempRoot) {
  const linkedMarketplace = path.join(tempRoot, "source-link");
  fs.symlinkSync(REPO_ROOT, linkedMarketplace, "dir");
  run([
    "scripts/materialize-local-plugin.mjs",
    `--marketplace-root=${linkedMarketplace}`,
    "--cachebuster=unsafe",
  ], { expectSuccess: false });
}

function validateCompleteSourceSnapshot(tempRoot) {
  const snapshotRoot = path.join(tempRoot, "complete-source");
  fs.cpSync(REPO_ROOT, snapshotRoot, {
    recursive: true,
    filter(source) {
      const relative = path.relative(REPO_ROOT, source);
      return !relative.split(path.sep).some((part) => part === ".git" || part === ".agent-local");
    },
  });
  git(snapshotRoot, ["init", "-q"]);
  git(snapshotRoot, ["add", "."]);
  run(["scripts/validate-repository-shell.mjs"], { cwd: snapshotRoot });

  const untrackedReference = path.join(
    snapshotRoot,
    "skills",
    "draft-spec",
    "references",
    "runtime-untracked.md",
  );
  fs.appendFileSync(
    path.join(snapshotRoot, "skills", "draft-spec", "SKILL.md"),
    "\n[Runtime untracked reference](references/runtime-untracked.md)\n",
    "utf8",
  );
  fs.writeFileSync(untrackedReference, "# Runtime untracked reference\n", "utf8");
  const referencesRoot = path.dirname(untrackedReference);
  const parenthesizedReference = path.join(referencesRoot, "runtime-(safe).md");
  fs.writeFileSync(parenthesizedReference, "# Parenthesized reference\n", "utf8");

  const outsideSkill = path.join(snapshotRoot, "runtime-outside.md");
  fs.writeFileSync(outsideSkill, "must not copy\n", "utf8");
  const externalRoot = path.join(tempRoot, "external-reference");
  fs.mkdirSync(externalRoot, { recursive: true });
  const externalFile = path.join(externalRoot, "secret.md");
  fs.writeFileSync(externalFile, "must not copy\n", "utf8");
  fs.symlinkSync(externalFile, path.join(referencesRoot, "runtime-final-link.md"));
  const externalDirectory = path.join(externalRoot, "directory");
  fs.mkdirSync(externalDirectory, { recursive: true });
  fs.writeFileSync(path.join(externalDirectory, "child.md"), "must not copy\n", "utf8");
  fs.symlinkSync(externalDirectory, path.join(referencesRoot, "runtime-link-dir"), "dir");
  const excludedReference = path.join(referencesRoot, ".agent-local", "secret.md");
  fs.mkdirSync(path.dirname(excludedReference), { recursive: true });
  fs.writeFileSync(excludedReference, "must not copy\n", "utf8");
  fs.appendFileSync(
    path.join(snapshotRoot, "skills", "draft-spec", "SKILL.md"),
    [
      "[Parenthesized reference](references/runtime-(safe).md)",
      "[Outside skill](../../runtime-outside.md)",
      `[Absolute reference](${externalFile})`,
      "[URL reference](https://example.com/reference.md)",
      "[Final symlink](references/runtime-final-link.md)",
      "[Ancestor symlink](references/runtime-link-dir/child.md)",
      "[Excluded reference](references/.agent-local/secret.md)",
      "",
    ].join("\n"),
    "utf8",
  );

  const inventory = new Set(sourcePluginFiles(snapshotRoot));
  assert.equal(inventory.has("skills/draft-spec/references/runtime-untracked.md"), true);
  assert.equal(inventory.has("skills/draft-spec/references/runtime-(safe).md"), true);
  assert.equal(inventory.has("runtime-outside.md"), false);
  assert.equal(inventory.has("skills/draft-spec/references/runtime-final-link.md"), false);
  assert.equal(inventory.has("skills/draft-spec/references/runtime-link-dir/child.md"), false);
  assert.equal(inventory.has("skills/draft-spec/references/.agent-local/secret.md"), false);

  const marketplaceRoot = path.join(tempRoot, "complete-marketplace");
  run([
    "scripts/materialize-local-plugin.mjs",
    `--marketplace-root=${marketplaceRoot}`,
    "--cachebuster=complete",
  ], { cwd: snapshotRoot });
  const installedRoot = path.join(marketplaceRoot, "plugins", "knitten");
  assert.equal(fs.existsSync(path.join(installedRoot, "scripts", "validate-runtime-contracts.mjs")), true);
  assert.equal(fs.existsSync(path.join(installedRoot, "skills", "draft-spec", "references", "flow.md")), true);
  assert.equal(fs.existsSync(path.join(installedRoot, "skills", "draft-spec", "references", "runtime-untracked.md")), true);
  assert.equal(fs.existsSync(path.join(installedRoot, "skills", "draft-spec", "references", "runtime-(safe).md")), true);
  assert.equal(fs.existsSync(path.join(installedRoot, "runtime-outside.md")), false);
  assert.equal(fs.existsSync(path.join(installedRoot, "skills", "draft-spec", "references", "runtime-final-link.md")), false);
  assert.equal(fs.existsSync(path.join(installedRoot, "skills", "draft-spec", "references", "runtime-link-dir", "child.md")), false);
  assert.equal(fs.existsSync(path.join(installedRoot, "skills", "draft-spec", "references", ".agent-local", "secret.md")), false);
  assert.equal(fs.existsSync(path.join(installedRoot, "docs", "public-core")), false);
  const doctor = JSON.parse(run([
    "scripts/doctor.mjs",
    `--marketplace-root=${marketplaceRoot}`,
  ], { cwd: snapshotRoot }).stdout);
  assert.equal(doctor.ok, true);

  const manifestPath = path.join(snapshotRoot, ".codex-plugin", "plugin.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  fs.writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, skills: "./missing-skills/" }, null, 2)}\n`, "utf8");
  run(["scripts/validate-repository-shell.mjs"], { cwd: snapshotRoot, expectSuccess: false });
}

function validateExplicitRootFailures() {
  const invalidRoot = path.join(os.tmpdir(), "definitely-not-a-knitten-root");
  run(["scripts/resolve-local-artifact-path.mjs", "--root"], { expectSuccess: false });
  run(["scripts/resolve-registered-output.mjs", "--root="], { expectSuccess: false });
  run([
    "scripts/resolve-local-artifact-path.mjs",
    "--root",
    invalidRoot,
    "workflow",
    "reports",
    "20260710",
    "handoff",
    "invalid-root",
  ], { expectSuccess: false });
  run([
    "scripts/resolve-registered-output.mjs",
    "--root",
    invalidRoot,
    "local-session-handoff",
    "date=20260710",
    "slug=invalid-root",
  ], { expectSuccess: false });
  run([
    "scripts/resolve-output.mjs",
    `--hub-root=${invalidRoot}`,
    "--kind=review-json",
    "--name=invalid-root",
    `--workspace-root=${REPO_ROOT}`,
  ], { expectSuccess: false });
}

function validateRegisteredAndCompatibilityOutputsAgree() {
  const compatibility = runJson([
    "scripts/resolve-output.mjs",
    "--skill=report-finding",
    "--name=runtime-contract",
    `--workspace-root=${REPO_ROOT}`,
  ]);
  const findingDate = path.basename(path.dirname(path.dirname(compatibility.selectedPath)));
  const registered = runJson([
    "scripts/resolve-registered-output.mjs",
    "operational-finding-json",
    `date=${findingDate}`,
    "slug=runtime-contract",
  ]);
  assert.equal(compatibility.selectedPath, registered.absolutePath);
}

function validateBoundaryRejectsCoreOwnedFindingSurfaces(tempRoot) {
  const domainRoot = path.join(tempRoot, "domain-fixture");
  fs.mkdirSync(path.join(domainRoot, ".codex-plugin"), { recursive: true });
  fs.mkdirSync(path.join(domainRoot, "skills", "example"), { recursive: true });
  fs.mkdirSync(path.join(domainRoot, ".agent-local"), { recursive: true });
  fs.writeFileSync(
    path.join(domainRoot, ".codex-plugin", "plugin.json"),
    `${JSON.stringify({ name: "domain-fixture", version: "0.0.0" }, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(domainRoot, "skills", "example", "SKILL.md"),
    `Use report-finding for failures with ${"gpt-" + "5.6"}.\n`,
    "utf8",
  );
  fs.writeFileSync(path.join(domainRoot, ".agent-local", "tracked.json"), "{}\n", "utf8");
  const init = spawnSync("git", ["init", "-q"], { cwd: domainRoot, encoding: "utf8" });
  assert.equal(init.status, 0);
  const add = spawnSync("git", ["add", "."], { cwd: domainRoot, encoding: "utf8" });
  assert.equal(add.status, 0);

  const result = run([
    "scripts/validate-domain-plugin-boundary.mjs",
    "--domain-plugin",
    domainRoot,
  ], { expectSuccess: false });
  const report = JSON.parse(result.stdout);
  const ids = new Set(report.results.map((item) => item.id));
  assert.equal(ids.has("tracked-agent-local"), true);
  assert.equal(ids.has("finding-workflow-reference"), true);
  assert.equal(ids.has("direct-agent-model-setting"), true);
}

function validateSafetyRejectCannotPass() {
  let forcedRejects = 0;
  const report = runEval({
    predictSkill(request) {
      const predicted = predictedSkillFor(request);
      if (predicted === "implement" && forcedRejects < 2) {
        forcedRejects += 1;
        return "reject";
      }
      return predicted;
    },
  });
  assert.equal(forcedRejects, 2);
  assert.equal(report.ok, false);
  assert.equal(report.metrics.safetyMissCount, 2);
}

function validateCoreSkillSafetyContracts() {
  const implement = fs.readFileSync(path.join(REPO_ROOT, "skills/implement/SKILL.md"), "utf8");
  const implementFlow = fs.readFileSync(
    path.join(REPO_ROOT, "skills/implement/references/flow.md"),
    "utf8",
  );
  const reviewFix = fs.readFileSync(path.join(REPO_ROOT, "skills/review-fix-loop/SKILL.md"), "utf8");
  const usage = fs.readFileSync(path.join(REPO_ROOT, "skills/log-usage/SKILL.md"), "utf8");
  const draft = fs.readFileSync(path.join(REPO_ROOT, "skills/draft-spec/SKILL.md"), "utf8");
  const draftFlow = fs.readFileSync(
    path.join(REPO_ROOT, "skills/draft-spec/references/flow.md"),
    "utf8",
  );
  const reviewTriad = fs.readFileSync(
    path.join(REPO_ROOT, "skills/review/references/triad.md"),
    "utf8",
  );

  assert.match(implement, /This skill is local-only/);
  assert.match(implement, /owning `strict` skill/);
  assert.match(implement, /references\/flow\.md/);
  assert.match(implementFlow, /Remain local-only/);
  assert.match(reviewFix, /mutation is limited to local files/);
  assert.match(reviewFix, /checkpoint owner and absolute location are resolved/);
  assert.match(reviewFix, /Never commit, push, create PRs/);
  assert.match(usage, /post-match, read-only safety check/);
  assert.doesNotMatch(usage, /Confirm the destination is local-only and ignored before writing/);
  const draftFrontmatter = draft.slice(0, draft.indexOf("\n---", 4));
  assert.match(draftFrontmatter, /^allowed-tools:.*\bAgent\b/m);
  assert.match(draftFlow, /two independent read-only agents/);
  assert.match(draftFlow, /scan-fast-readonly/);
  assert.match(draftFlow, /knitten-path agent-profile scan-fast-readonly/);
  assert.match(draftFlow, /primary agent owns approach selection/);
  assert.match(draftFlow, /Apply the returned model, reasoning, sandbox, and fallback/);
  assert.match(reviewTriad, /review-deep-readonly/);
  assert.match(reviewTriad, /scan-fast-readonly/);
  assert.match(reviewTriad, /knitten-path agent-profile <profile-id>/);

  for (const relative of sourcePluginFiles(REPO_ROOT)) {
    if (!relative.startsWith("skills/") || !relative.endsWith(".md")) continue;
    assert.doesNotMatch(
      fs.readFileSync(path.join(REPO_ROOT, relative), "utf8"),
      /gpt-[0-9]|model_reasoning_effort|sandbox_mode/,
      `${relative} must use Core agent profile ids`,
    );
  }
}

function validateAgentProfileResolution() {
  const list = runJson(["scripts/resolve-agent-profile.mjs", "--list"]);
  assert.equal(list.ok, true);
  assert.equal(list.owner, "knitten-core");
  assert.deepEqual(
    list.profiles.map((profile) => profile.id).sort(),
    ["causal-analysis-readonly", "review-deep-readonly", "scan-fast-readonly"],
  );
  for (const profile of list.profiles) {
    const resolved = runJson(["scripts/resolve-agent-profile.mjs", profile.id]);
    assert.equal(resolved.profile.id, profile.id);
    assert.equal(resolved.profile.recordRequestedAndEffective, true);
  }
  run(["scripts/resolve-agent-profile.mjs", "missing-profile"], { expectSuccess: false });
}

function validateMarkdownLinkParser() {
  assert.deepEqual(
    markdownLinkDestinations(
      "[plain](references/plain.md) [paren](references/a(b).md) [escaped](references/a\\(b\\).md)",
    ),
    ["references/plain.md", "references/a(b).md", "references/a(b).md"],
  );
}

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "knitten-runtime-contracts-"));
  try {
    validateMaterializationPreservesLocalState(tempRoot);
    validateMaterializationRollback(tempRoot);
    validateMaterializationRejectsSymlinkedSourceTarget(tempRoot);
    validateCompleteSourceSnapshot(tempRoot);
    validateExplicitRootFailures();
    validateRegisteredAndCompatibilityOutputsAgree();
    validateBoundaryRejectsCoreOwnedFindingSurfaces(tempRoot);
    validateSafetyRejectCannotPass();
    validateCoreSkillSafetyContracts();
    validateAgentProfileResolution();
    validateMarkdownLinkParser();
    process.stdout.write("runtime contracts ok\n");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main();
