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

function executablePath(command) {
  for (const directory of (process.env.PATH || "").split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(directory, command);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      return candidate;
    } catch {
      // Continue searching PATH.
    }
  }
  throw new Error(`unable to resolve executable from PATH: ${command}`);
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

function validateOutputShimHelpContract() {
  const shim = path.join(REPO_ROOT, "bin", "knitten-resolve-output");
  const result = spawnSync(shim, ["--help"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Skill\/kind mode:/);
  assert.match(result.stdout, /--skill=<skill>/);
  assert.match(result.stdout, /Registered output-id mode:/);
  assert.match(result.stdout, /<output-id>/);
}

function validateBoundaryRejectsCoreOwnedFindingSurfaces(tempRoot) {
  const domainRoot = path.join(tempRoot, "domain-fixture");
  const isolatedBin = path.join(tempRoot, "boundary-tools");
  fs.mkdirSync(path.join(domainRoot, ".codex-plugin"), { recursive: true });
  fs.mkdirSync(path.join(domainRoot, "skills", "example"), { recursive: true });
  fs.mkdirSync(path.join(domainRoot, ".agent-local"), { recursive: true });
  fs.mkdirSync(isolatedBin, { recursive: true });
  fs.symlinkSync(executablePath("git"), path.join(isolatedBin, "git"));
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
  ], {
    expectSuccess: false,
    env: { ...process.env, PATH: isolatedBin },
  });
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
  const preflight = fs.readFileSync(path.join(REPO_ROOT, "skills/triad-preflight/SKILL.md"), "utf8");
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
  const review = fs.readFileSync(path.join(REPO_ROOT, "skills/review/SKILL.md"), "utf8");
  const reviewPrinciples = fs.readFileSync(
    path.join(REPO_ROOT, "skills/review/references/code-review-principles.md"),
    "utf8",
  );
  const preflightFlow = fs.readFileSync(
    path.join(REPO_ROOT, "skills/triad-preflight/references/flow.md"),
    "utf8",
  );
  const reviewFixFlow = fs.readFileSync(
    path.join(REPO_ROOT, "skills/review-fix-loop/references/flow.md"),
    "utf8",
  );
  const legacyReviewTemplate = fs.readFileSync(
    path.join(REPO_ROOT, "document-templates/review/code-review.md"),
    "utf8",
  );
  const checkpointTemplate = JSON.parse(fs.readFileSync(
    path.join(REPO_ROOT, "document-templates/workflow/review-fix-loop-checkpoint.json"),
    "utf8",
  ));
  const reviewContractValidator = fs.readFileSync(
    path.join(REPO_ROOT, "scripts/validate-review-contracts.mjs"),
    "utf8",
  );
  const forwardPacketRenderer = fs.readFileSync(
    path.join(REPO_ROOT, "scripts/render-review-forward-packet.mjs"),
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
  const principlesLoadIndex = review.indexOf("references/code-review-principles.md");
  const triadLoadIndex = review.indexOf("references/triad.md");
  const reviewAfterMatchIndex = review.indexOf("## After Match");
  assert.ok(principlesLoadIndex >= 0, "review must load canonical principles");
  assert.ok(reviewAfterMatchIndex >= 0, "review must define After Match");
  assert.ok(principlesLoadIndex > reviewAfterMatchIndex, "review principles must load after Step 0");
  assert.ok(triadLoadIndex > principlesLoadIndex, "review must load principles before triad");
  for (const [name, skill] of [["triad-preflight", preflight], ["review-fix-loop", reviewFix]]) {
    const afterMatchIndex = skill.indexOf("## After Match");
    const flowLoadIndex = skill.indexOf("references/flow.md");
    assert.ok(afterMatchIndex >= 0, `${name} must define After Match`);
    assert.ok(flowLoadIndex > afterMatchIndex, `${name} flow must load after Step 0`);
  }
  for (const [name, flow] of [["triad-preflight", preflightFlow], ["review-fix-loop", reviewFixFlow]]) {
    const postStepZeroIndex = flow.indexOf("After Step 0 passes");
    const canonicalLoadIndex = flow.indexOf("../../review/references/code-review-principles.md");
    assert.ok(postStepZeroIndex >= 0, `${name} flow must state the Step 0 boundary`);
    assert.ok(canonicalLoadIndex > postStepZeroIndex, `${name} canonical load must follow Step 0`);
  }
  assert.match(reviewPrinciples, /improves or preserves overall code health/);
  assert.match(reviewPrinciples, /P0, P1, and P2 findings use `blocker=true`/);
  assert.match(reviewPrinciples, /Optional:.*Nit:.*FYI:/s);
  assert.match(reviewPrinciples, /Review Navigation And Coverage/);
  assert.match(reviewPrinciples, /Review every human-written changed line/);
  assert.match(reviewPrinciples, /Do not use a hard line-count threshold/);
  assert.match(reviewPrinciples, /Positive evidence:/);
  assert.match(reviewPrinciples, /descriptionRefreshRequired/);
  assert.match(reviewTriad, /assignedSurfaceIds/);
  assert.match(reviewTriad, /checkedSurfaceIds/);
  assert.match(reviewTriad, /skippedSurfaces/);
  assert.match(reviewTriad, /blocker=<true\|false>/);
  assert.match(reviewTriad, /Impact: <technical or consumer consequence>/);
  assert.match(reviewTriad, /excluded IDs are invalid/i);
  assert.match(reviewTriad, /coverage\.complete/);
  const readinessFormula = `coverage.complete = uncovered is empty
ready = no P0-P2 blocker
        AND coverage.complete
        AND needsDesignJudgment is empty
nextAction = ask      when needsDesignJudgment is non-empty
             fix      when no design judgment remains and a P0-P2 blocker exists
             review   when no blocker remains and coverage.complete is false
             complete otherwise`;
  assert.ok(reviewPrinciples.includes(readinessFormula), "canonical readiness formula drifted");
  assert.match(reviewPrinciples, /Never substitute synonyms/);
  assert.match(reviewPrinciples, /excluded surface must not appear in any role's assigned, checked, or skipped/i);
  assert.match(reviewTriad, /exact `ask`, `fix`, `review`, or `complete` literal/);
  assert.match(
    reviewFixFlow,
    /Only when `ready=true`, run validation\. Write a `complete` checkpoint only\s+when readiness is true and validation passes\./,
  );
  assert.match(reviewFixFlow, /When validation fails, normalize each actionable failure as a P2 finding/);
  assert.match(reviewFixFlow, /`status=blocked` and `nextAction=fix`/);
  assert.match(reviewFixFlow, /schema-version-1 checkpoint/);
  assert.match(reviewFixFlow, /Ignore the legacy `nextAction`/);
  assert.match(reviewFixFlow, /Run a fresh full review to reconstruct/);
  assert.match(reviewFixFlow, /`status=blocked` requires a non-null `blockedHandoff`/);
  assert.match(reviewFixFlow, /P0-P2 findings with\s+`blocker=true`/);
  assert.match(reviewFixFlow, /Merge every grounded P0-P3 finding/);
  assert.match(reviewFixFlow, /documentation-and-maintainability lens/);
  assert.equal(checkpointTemplate.schemaVersion, 2);
  assert.deepEqual(
    Object.keys(checkpointTemplate.remainingBlockers[0]),
    ["id", "priority", "blocker", "source", "summary", "requiredFix"],
  );
  assert.equal(checkpointTemplate.remainingBlockers[0].priority, "P0|P1|P2");
  assert.equal(checkpointTemplate.remainingBlockers[0].blocker, true);
  assert.equal(Object.hasOwn(checkpointTemplate.remainingBlockers[0], "severity"), false);
  assert.deepEqual(
    Object.keys(checkpointTemplate.nonBlockingFindings[0]),
    ["id", "priority", "blocker", "source", "summary", "recommendation"],
  );
  assert.equal(checkpointTemplate.nonBlockingFindings[0].priority, "P3");
  assert.equal(checkpointTemplate.nonBlockingFindings[0].blocker, false);
  assert.deepEqual(
    Object.keys(checkpointTemplate.documentationCoverage),
    ["required", "checked", "skipped", "notApplicableReason", "complete"],
  );
  assert.deepEqual(
    Object.keys(checkpointTemplate.coverage),
    ["assigned", "checked", "skipped", "excluded", "uncovered", "complete"],
  );
  assert.equal(checkpointTemplate.needsDesignJudgmentCount, 0);
  assert.equal(checkpointTemplate.ready, false);
  assert.deepEqual(checkpointTemplate.handoff, {
    descriptionRefreshRequired: false,
    reason: null,
  });
  assert.equal(checkpointTemplate.blockedHandoff, null);
  assert.equal(checkpointTemplate.nextAction, "<ask|fix|review|complete>");
  assert.match(reviewContractValidator, /excluded-surface-id/);
  assert.match(reviewContractValidator, /handoff: \{ \.\.\.input\.handoff \}/);
  assert.match(reviewContractValidator, /evals\/review-forward-packets/);
  assert.match(reviewContractValidator, /compareCodeUnits/);
  assert.doesNotMatch(reviewContractValidator, /localeCompare/);
  assert.match(reviewContractValidator, /expectedNextAction/);
  assert.doesNotMatch(forwardPacketRenderer, /expected/);
  assert.match(legacyReviewTemplate, /not a runtime dependency/);
  assert.match(legacyReviewTemplate, /State supported required actions directly/);
  assert.match(legacyReviewTemplate, /No emotional language or generic praise/);
  assert.doesNotMatch(reviewPrinciples, /\bLGTM\b|\bOWNERS\b|one-business-day|staffing policy/i);

  for (const relative of sourcePluginFiles(REPO_ROOT)) {
    if (!relative.startsWith("skills/") || !relative.endsWith(".md")) continue;
    assert.doesNotMatch(
      fs.readFileSync(path.join(REPO_ROOT, relative), "utf8"),
      /gpt-[0-9]|model_reasoning_effort|sandbox_mode/,
      `${relative} must use Core agent profile ids`,
    );
  }
}

function requireClosedKeys(value, allowed) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("unknown-key");
  }
  const actual = Object.keys(value).sort();
  const expected = [...allowed].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error("unknown-key");
  }
}

function normalizeLegacyRemainingBlockers(findings) {
  return findings.map((finding) => {
    requireClosedKeys(finding, ["id", "severity", "source", "summary", "requiredFix"]);
    if (!["P0", "P1", "P2"].includes(finding.severity)) {
      throw new Error("invalid-legacy-blocker-priority");
    }
    const { severity, ...rest } = finding;
    return { id: rest.id, priority: severity, blocker: true, ...rest };
  });
}

function validateNonBlockingFindings(findings) {
  assert.ok(Array.isArray(findings), "nonBlockingFindings must be an array");
  for (const finding of findings) {
    requireClosedKeys(
      finding,
      ["id", "priority", "blocker", "source", "summary", "recommendation"],
    );
    if (finding.priority !== "P3" || finding.blocker !== false) {
      throw new Error("invalid-non-blocking-finding");
    }
  }
}

function validateDocumentationCoverage(coverage) {
  requireClosedKeys(
    coverage,
    ["required", "checked", "skipped", "notApplicableReason", "complete"],
  );
  for (const key of ["required", "checked", "skipped"]) {
    assert.ok(Array.isArray(coverage[key]), `documentationCoverage.${key} must be an array`);
    assert.equal(new Set(coverage[key]).size, coverage[key].length);
  }
  const required = new Set(coverage.required);
  assert.ok(coverage.checked.every((item) => required.has(item)));
  assert.ok(coverage.skipped.every((item) => required.has(item)));
  assert.ok(coverage.checked.every((item) => !coverage.skipped.includes(item)));
  const expectedComplete = coverage.required.length === 0
    ? typeof coverage.notApplicableReason === "string"
      && coverage.notApplicableReason.length > 0
      && coverage.checked.length === 0
      && coverage.skipped.length === 0
    : coverage.required.every((item) => coverage.checked.includes(item))
      && coverage.skipped.length === 0
      && coverage.notApplicableReason === null;
  assert.equal(coverage.complete, expectedComplete);
}

function validateBlockedCheckpointState(state) {
  requireClosedKeys(
    state,
    ["status", "remainingBlockers", "ready", "nextAction", "blockedHandoff"],
  );
  for (const finding of state.remainingBlockers) {
    requireClosedKeys(
      finding,
      ["id", "priority", "blocker", "source", "summary", "requiredFix"],
    );
    if (!["P0", "P1", "P2"].includes(finding.priority) || finding.blocker !== true) {
      throw new Error("invalid-blocked-state");
    }
  }
  if (state.status !== "blocked") {
    if (state.blockedHandoff !== null) throw new Error("unexpected-blocked-handoff");
    return;
  }
  if (state.blockedHandoff === null) throw new Error("missing-blocked-handoff");
  requireClosedKeys(state.blockedHandoff, ["owner", "requiredAction", "reason"]);
  if (!Object.values(state.blockedHandoff)
    .every((value) => typeof value === "string" && value.length > 0)) {
    throw new Error("invalid-blocked-handoff");
  }
  if (state.remainingBlockers.length === 0 || state.ready !== false || state.nextAction !== "fix") {
    throw new Error("invalid-blocked-state");
  }
}

function validateFreshReviewState(state) {
  requireClosedKeys(state, [
    "remainingBlockers",
    "nonBlockingFindings",
    "documentationCoverage",
    "coverage",
    "needsDesignJudgmentCount",
    "ready",
    "handoff",
    "blockedHandoff",
    "nextAction",
  ]);
  for (const finding of state.remainingBlockers) {
    requireClosedKeys(
      finding,
      ["id", "priority", "blocker", "source", "summary", "requiredFix"],
    );
    if (!["P0", "P1", "P2"].includes(finding.priority) || finding.blocker !== true) {
      throw new Error("invalid-blocked-state");
    }
  }
  validateNonBlockingFindings(state.nonBlockingFindings);
  validateDocumentationCoverage(state.documentationCoverage);
  requireClosedKeys(
    state.coverage,
    ["assigned", "checked", "skipped", "excluded", "uncovered", "complete"],
  );
  for (const key of ["assigned", "checked", "skipped", "excluded", "uncovered"]) {
    assert.ok(Array.isArray(state.coverage[key]), `coverage.${key} must be an array`);
  }
  assert.equal(state.coverage.complete, state.coverage.uncovered.length === 0);
  requireClosedKeys(state.handoff, ["descriptionRefreshRequired", "reason"]);
  assert.equal(typeof state.handoff.descriptionRefreshRequired, "boolean");
  if (state.handoff.descriptionRefreshRequired) {
    assert.equal(typeof state.handoff.reason, "string");
    assert.ok(state.handoff.reason.length > 0);
  } else {
    assert.equal(state.handoff.reason, null);
  }
  if (state.blockedHandoff !== null) {
    requireClosedKeys(state.blockedHandoff, ["owner", "requiredAction", "reason"]);
  }
  assert.ok(Number.isInteger(state.needsDesignJudgmentCount));
  assert.ok(state.needsDesignJudgmentCount >= 0);
  const expectedReady = state.remainingBlockers.length === 0
    && state.coverage.complete
    && state.needsDesignJudgmentCount === 0;
  const expectedNextAction = state.needsDesignJudgmentCount > 0
    ? "ask"
    : state.remainingBlockers.length > 0
      ? "fix"
      : !state.coverage.complete
        ? "review"
        : "complete";
  assert.equal(state.ready, expectedReady);
  assert.equal(state.nextAction, expectedNextAction);
}

function validateReviewCheckpointMigration() {
  const fixture = JSON.parse(fs.readFileSync(
    path.join(REPO_ROOT, "evals/review-checkpoints/schema-v1-migration.json"),
    "utf8",
  ));
  requireClosedKeys(
    fixture,
    ["schemaVersion", "caseId", "legacyCheckpoint", "expectedMigration", "invalidCases"],
  );
  assert.equal(fixture.schemaVersion, 1);
  assert.equal(fixture.caseId, "schema-v1-migration");
  const legacy = fixture.legacyCheckpoint;
  requireClosedKeys(legacy, [
    "schemaVersion",
    "kind",
    "status",
    "summary",
    "loopKind",
    "loopNumber",
    "reviewMode",
    "target",
    "fixedFindings",
    "remainingBlockers",
    "changedFiles",
    "reviewPacketBudget",
    "validation",
    "userApproval",
    "nextAction",
    "updatedAt",
  ]);
  assert.equal(legacy.schemaVersion, 1);
  for (const missing of [
    "nonBlockingFindings",
    "documentationCoverage",
    "coverage",
    "needsDesignJudgmentCount",
    "ready",
    "handoff",
    "blockedHandoff",
  ]) {
    assert.equal(Object.hasOwn(legacy, missing), false, `legacy checkpoint unexpectedly has ${missing}`);
  }
  requireClosedKeys(fixture.expectedMigration, [
    "carryForwardFields",
    "recomputeFields",
    "normalizedRemainingBlockers",
    "freshReviewResult",
    "v2WriteTime",
    "expectedV2State",
    "discardLegacyNextAction",
    "requiresFreshFullReview",
    "writeSchemaVersion",
  ]);
  const expectedCarryForwardFields = [
    "kind",
    "loopKind",
    "reviewMode",
    "target",
    "fixedFindings",
    "changedFiles",
    "reviewPacketBudget",
    "validation",
    "userApproval",
  ];
  const expectedRecomputeFields = [
    "status",
    "summary",
    "loopNumber",
    "nonBlockingFindings",
    "documentationCoverage",
    "coverage",
    "needsDesignJudgmentCount",
    "ready",
    "handoff",
    "blockedHandoff",
    "nextAction",
    "updatedAt",
  ];
  assert.deepEqual(fixture.expectedMigration.carryForwardFields, expectedCarryForwardFields);
  assert.deepEqual(fixture.expectedMigration.recomputeFields, expectedRecomputeFields);
  for (const field of fixture.expectedMigration.carryForwardFields) {
    assert.equal(Object.hasOwn(legacy, field), true, `legacy checkpoint missing ${field}`);
  }
  for (const disallowed of ["schemaVersion", "remainingBlockers", "nextAction"]) {
    assert.equal(
      fixture.expectedMigration.carryForwardFields.includes(disallowed),
      false,
      `${disallowed} must not be carried forward`,
    );
  }
  const recomputed = new Set(fixture.expectedMigration.recomputeFields);
  assert.equal(
    fixture.expectedMigration.carryForwardFields.some((field) => recomputed.has(field)),
    false,
    "carry-forward and recompute fields must be disjoint",
  );
  const classifiedLegacyFields = new Set([
    ...fixture.expectedMigration.carryForwardFields,
    ...fixture.expectedMigration.recomputeFields.filter((field) => Object.hasOwn(legacy, field)),
    "schemaVersion",
    "remainingBlockers",
    "nextAction",
  ]);
  assert.deepEqual([...classifiedLegacyFields].sort(), Object.keys(legacy).sort());
  const normalizedRemainingBlockers = normalizeLegacyRemainingBlockers(legacy.remainingBlockers);
  assert.deepEqual(
    normalizedRemainingBlockers,
    fixture.expectedMigration.normalizedRemainingBlockers,
  );
  assert.equal(legacy.nextAction, "validate");
  assert.equal(fixture.expectedMigration.discardLegacyNextAction, true);
  assert.equal(fixture.expectedMigration.requiresFreshFullReview, true);
  assert.equal(fixture.expectedMigration.writeSchemaVersion, 2);
  const freshReview = fixture.expectedMigration.freshReviewResult;
  validateFreshReviewState(freshReview);
  const blockerCount = freshReview.remainingBlockers.length;
  const carriedState = Object.fromEntries(
    fixture.expectedMigration.carryForwardFields.map((field) => [field, legacy[field]]),
  );
  const migratedState = {
    ...carriedState,
    ...freshReview,
    schemaVersion: 2,
    status: freshReview.blockedHandoff ? "blocked" : "continue",
    summary: `Fresh review: ${blockerCount} ${blockerCount === 1 ? "blocker" : "blockers"}, coverage ${freshReview.coverage.complete ? "complete" : "incomplete"}, nextAction=${freshReview.nextAction}.`,
    loopNumber: legacy.loopNumber + 1,
    updatedAt: fixture.expectedMigration.v2WriteTime,
  };
  requireClosedKeys(migratedState, [
    "schemaVersion",
    "kind",
    "status",
    "summary",
    "loopKind",
    "loopNumber",
    "reviewMode",
    "target",
    "fixedFindings",
    "remainingBlockers",
    "nonBlockingFindings",
    "documentationCoverage",
    "coverage",
    "needsDesignJudgmentCount",
    "ready",
    "handoff",
    "blockedHandoff",
    "changedFiles",
    "reviewPacketBudget",
    "validation",
    "userApproval",
    "nextAction",
    "updatedAt",
  ]);
  requireClosedKeys(fixture.expectedMigration.expectedV2State, Object.keys(migratedState));
  validateFreshReviewState({
    remainingBlockers: migratedState.remainingBlockers,
    nonBlockingFindings: migratedState.nonBlockingFindings,
    documentationCoverage: migratedState.documentationCoverage,
    coverage: migratedState.coverage,
    needsDesignJudgmentCount: migratedState.needsDesignJudgmentCount,
    ready: migratedState.ready,
    handoff: migratedState.handoff,
    blockedHandoff: migratedState.blockedHandoff,
    nextAction: migratedState.nextAction,
  });
  validateBlockedCheckpointState({
    status: migratedState.status,
    remainingBlockers: migratedState.remainingBlockers,
    ready: migratedState.ready,
    nextAction: migratedState.nextAction,
    blockedHandoff: migratedState.blockedHandoff,
  });
  assert.deepEqual(migratedState, fixture.expectedMigration.expectedV2State);
  for (const invalid of fixture.invalidCases) {
    requireClosedKeys(invalid, ["caseId", "remainingBlockers", "expectedError"]);
    assert.throws(
      () => normalizeLegacyRemainingBlockers(invalid.remainingBlockers),
      new RegExp(invalid.expectedError),
      invalid.caseId,
    );
  }

  const blockedFixture = JSON.parse(fs.readFileSync(
    path.join(REPO_ROOT, "evals/review-checkpoints/schema-v2-blocked.json"),
    "utf8",
  ));
  requireClosedKeys(blockedFixture, ["schemaVersion", "caseId", "validState", "invalidCases"]);
  assert.equal(blockedFixture.schemaVersion, 2);
  assert.equal(blockedFixture.caseId, "schema-v2-blocked");
  validateBlockedCheckpointState(blockedFixture.validState);
  for (const invalid of blockedFixture.invalidCases) {
    requireClosedKeys(invalid, ["caseId", "input", "expectedError"]);
    assert.throws(
      () => validateBlockedCheckpointState(invalid.input),
      new RegExp(invalid.expectedError),
      invalid.caseId,
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
    validateOutputShimHelpContract();
    validateBoundaryRejectsCoreOwnedFindingSurfaces(tempRoot);
    validateSafetyRejectCannotPass();
    validateCoreSkillSafetyContracts();
    validateReviewCheckpointMigration();
    run(["scripts/validate-review-contracts.mjs"]);
    validateAgentProfileResolution();
    validateMarkdownLinkParser();
    process.stdout.write("runtime contracts ok\n");
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main();
