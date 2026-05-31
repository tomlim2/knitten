import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { resolveOutput } from "../agent/lib/resolve-output.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resolverScript = path.join(repoRoot, "agent/lib/resolve-output.mjs");

function runResolver(args, options = {}) {
  const result = spawnSync(process.execPath, [resolverScript, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    ...options,
  });
  return {
    code: result.status,
    json: result.stdout ? JSON.parse(result.stdout) : null,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function copyFile(relativePath, root) {
  const from = path.join(repoRoot, relativePath);
  const to = path.join(root, relativePath);
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to);
}

function makeTempRoot(editOutputs = (outputs) => outputs) {
  const root = mkdtempSync(path.join(os.tmpdir(), "output-contract-root-"));
  mkdirSync(path.join(root, "agent/config"), { recursive: true });
  writeFileSync(path.join(root, "SYSTEM.md"), "# Fixture System\n");
  copyFile("agent/config/agent-hub.json", root);
  copyFile("agent/config/local-artifact-paths.json", root);
  for (const template of [
    "agent/document-templates/agent-hub/spec.md",
    "agent/document-templates/agent-hub/design-plan.md",
    "agent/document-templates/agent-hub/json-handoff-packet.json",
  ]) {
    copyFile(template, root);
  }
  writeJson(path.join(root, "agent/config/outputs.json"), editOutputs(readJson("agent/config/outputs.json")));
  return root;
}

function withTempRoot(editOutputs, fn) {
  const root = makeTempRoot(editOutputs);
  try {
    return fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function expectCliFailure(args, detailPattern) {
  const result = runResolver(args);
  assert.notEqual(result.code, 0, result.stdout);
  assert.equal(result.json.ok, false);
  assert.equal(result.json.error, "resolve-failed");
  assert.match(result.json.detail, detailPattern);
}

test("resolves proposed spec output", () => {
  const result = resolveOutput({
    root: repoRoot,
    id: "agent-hub-spec-proposed",
    values: { slug: "test-spec" },
  });

  assert.equal(result.ok, true);
  assert.equal(result.madeBy, "ah-manage-spec");
  assert.equal(result.writeTarget.kind, "repo-template");
  assert.equal(result.locationKind, "repo-template");
  assert.equal(result.path, "docs/plans/proposed/test-spec.md");
  assert.equal(result.absolutePath, path.join(repoRoot, "docs/plans/proposed/test-spec.md"));
  assert.equal(result.template, "agent/document-templates/agent-hub/spec.md");
  assert.equal(result.absoluteTemplatePath, path.join(repoRoot, "agent/document-templates/agent-hub/spec.md"));
  assert.equal(result.format, "markdown");
});

test("resolves design plan section to parent output path", () => {
  const result = resolveOutput({
    root: repoRoot,
    id: "agent-hub-design-plan-section",
    values: { slug: "test-spec" },
  });

  assert.equal(result.ok, true);
  assert.equal(result.writeTarget.kind, "document-section");
  assert.equal(result.parentOutput, "agent-hub-spec-proposed");
  assert.equal(result.section, "## Design Plan");
  assert.equal(result.path, "docs/plans/proposed/test-spec.md");
  assert.equal(result.absolutePath, path.join(repoRoot, "docs/plans/proposed/test-spec.md"));
  assert.equal(result.format, "markdown-section");
});

test("resolves local session handoff output", () => {
  const result = resolveOutput({
    root: repoRoot,
    id: "local-session-handoff",
    values: { date: "20260531", slug: "test-handoff" },
  });

  assert.equal(result.ok, true);
  assert.equal(result.writeTarget.kind, "local-artifact");
  assert.equal(result.path, ".agent-local/reports/20260531-test-handoff.json");
  assert.equal(result.absolutePath, path.join(repoRoot, ".agent-local/reports/20260531-test-handoff.json"));
  assert.equal(result.cleanupPath, ".agent-local/reports");
  assert.equal(result.absoluteCleanupPath, path.join(repoRoot, ".agent-local/reports"));
  assert.equal(result.format, "json");
});

test("resolves Shotloom start-task brief output", () => {
  const result = resolveOutput({
    root: repoRoot,
    id: "shotloom-start-task-brief",
    values: { stl: "STL-123" },
  });

  assert.equal(result.ok, true);
  assert.equal(result.madeBy, "shotloom-start-task");
  assert.equal(result.writeTarget.kind, "local-artifact");
  assert.equal(result.path, ".agent-local/shotloom/planning/stl-123/brief.json");
  assert.equal(result.absolutePath, path.join(repoRoot, ".agent-local/shotloom/planning/stl-123/brief.json"));
  assert.equal(result.cleanupPath, ".agent-local/shotloom/planning/stl-123");
  assert.equal(result.absoluteCleanupPath, path.join(repoRoot, ".agent-local/shotloom/planning/stl-123"));
  assert.equal(result.template, "agent/document-templates/agent-hub/json-handoff-packet.json");
  assert.equal(result.format, "json");
  assert.deepEqual(result.formatOptions, { schemaKind: "shotloom-start-task-brief" });
});

test("resolves Shotloom draft-spec planning outputs", () => {
  const cases = [
    ["shotloom-planning-spec", "spec", "shotloom-planning-spec"],
    ["shotloom-planning-design-plan", "design-plan", "shotloom-planning-design-plan"],
    ["shotloom-planning-questions", "questions", "shotloom-planning-questions"],
    ["shotloom-planning-manifest", "manifest", "shotloom-planning-manifest"],
  ];

  for (const [id, artifact, schemaKind] of cases) {
    const result = resolveOutput({
      root: repoRoot,
      id,
      values: { stl: "STL-431" },
    });

    assert.equal(result.ok, true);
    assert.equal(result.madeBy, "shotloom-draft-spec");
    assert.equal(result.writeTarget.kind, "local-artifact");
    assert.equal(result.path, `.agent-local/shotloom/planning/stl-431/${artifact}.json`);
    assert.equal(result.absolutePath, path.join(repoRoot, `.agent-local/shotloom/planning/stl-431/${artifact}.json`));
    assert.equal(result.cleanupPath, ".agent-local/shotloom/planning/stl-431");
    assert.equal(result.absoluteCleanupPath, path.join(repoRoot, ".agent-local/shotloom/planning/stl-431"));
    assert.equal(result.template, "agent/document-templates/agent-hub/json-handoff-packet.json");
    assert.equal(result.format, "json");
    assert.deepEqual(result.formatOptions, { schemaKind });
  }
});

test("resolves Shotloom before-PR outputs", () => {
  const cases = [
    ["shotloom-before-pr-readiness", "readiness", "shotloom-before-pr-readiness"],
    ["shotloom-before-pr-code-blockers", "code-blockers", "shotloom-before-pr-code-blockers"],
    ["shotloom-before-pr-docs-blockers", "docs-blockers", "shotloom-before-pr-docs-blockers"],
  ];

  for (const [id, artifact, schemaKind] of cases) {
    const result = resolveOutput({
      root: repoRoot,
      id,
      values: { stl: "STL-510", safeBranch: "feat-shotloom-output" },
    });

    assert.equal(result.ok, true);
    assert.equal(result.madeBy, "shotloom-review-before-pr");
    assert.equal(result.writeTarget.kind, "local-artifact");
    assert.equal(result.path, `.agent-local/shotloom/before-pr/stl-510/feat-shotloom-output/${artifact}.json`);
    assert.equal(result.absolutePath, path.join(repoRoot, `.agent-local/shotloom/before-pr/stl-510/feat-shotloom-output/${artifact}.json`));
    assert.equal(result.cleanupPath, ".agent-local/shotloom/before-pr/stl-510/feat-shotloom-output");
    assert.equal(result.absoluteCleanupPath, path.join(repoRoot, ".agent-local/shotloom/before-pr/stl-510/feat-shotloom-output"));
    assert.equal(result.template, "agent/document-templates/agent-hub/json-handoff-packet.json");
    assert.equal(result.format, "json");
    assert.deepEqual(result.formatOptions, { schemaKind });
  }
});

test("resolves Shotloom PR outputs", () => {
  const cache = resolveOutput({
    root: repoRoot,
    id: "shotloom-pr-cache",
    values: { pr: "77" },
  });

  assert.equal(cache.ok, true);
  assert.equal(cache.madeBy, "workflow:shotloom-pr-cache");
  assert.equal(cache.path, ".agent-local/shotloom/pr/77");
  assert.equal(cache.absolutePath, path.join(repoRoot, ".agent-local/shotloom/pr/77"));
  assert.equal(cache.cleanupPath, ".agent-local/shotloom/pr/77");
  assert.equal(cache.absoluteCleanupPath, path.join(repoRoot, ".agent-local/shotloom/pr/77"));
  assert.equal(cache.template, undefined);
  assert.equal(cache.format, "directory");

  const replyPlan = resolveOutput({
    root: repoRoot,
    id: "shotloom-pr-reply-plan",
    values: { pr: "77" },
  });

  assert.equal(replyPlan.ok, true);
  assert.equal(replyPlan.madeBy, "shotloom-respond-pr");
  assert.equal(replyPlan.path, ".agent-local/shotloom/pr/77/reply-plan.json");
  assert.equal(replyPlan.cleanupPath, ".agent-local/shotloom/pr/77");
  assert.equal(replyPlan.template, "agent/document-templates/agent-hub/json-handoff-packet.json");
  assert.equal(replyPlan.format, "json");
  assert.deepEqual(replyPlan.formatOptions, { schemaKind: "shotloom-pr-reply-plan" });
});

test("resolves Shotloom deploy outputs", () => {
  const cases = [
    ["shotloom-deploy-release-notes", "release-notes.md", "agent/document-templates/agent-hub/release-notes.md", "markdown", null],
    ["shotloom-deploy-manifest", "manifest.json", "agent/document-templates/agent-hub/json-handoff-packet.json", "json", "shotloom-deploy-manifest"],
    ["shotloom-deploy-rollback", "rollback.json", "agent/document-templates/agent-hub/json-handoff-packet.json", "json", "shotloom-deploy-rollback"],
  ];

  for (const [id, fileName, template, format, schemaKind] of cases) {
    const result = resolveOutput({
      root: repoRoot,
      id,
      values: { key: "v0.1.2-test" },
    });

    assert.equal(result.ok, true);
    assert.equal(result.madeBy, "shotloom-deploy-web");
    assert.equal(result.writeTarget.kind, "local-artifact");
    assert.equal(result.path, `.agent-local/shotloom/deploy/v0.1.2-test/${fileName}`);
    assert.equal(result.cleanupPath, ".agent-local/shotloom/deploy/v0.1.2-test");
    assert.equal(result.template, template);
    assert.equal(result.format, format);
    if (schemaKind) assert.deepEqual(result.formatOptions, { schemaKind });
  }
});

test("lists output contract ids", () => {
  const result = runResolver(["--list"]);

  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.json.ok, true);
  assert.deepEqual(result.json.outputs.map((entry) => entry.id), [
    "local-session-handoff",
    "agent-hub-spec-proposed",
    "agent-hub-design-plan-section",
    "shotloom-start-task-brief",
    "shotloom-planning-spec",
    "shotloom-planning-design-plan",
    "shotloom-planning-questions",
    "shotloom-planning-manifest",
    "shotloom-before-pr-readiness",
    "shotloom-before-pr-code-blockers",
    "shotloom-before-pr-docs-blockers",
    "shotloom-pr-cache",
    "shotloom-pr-reply-plan",
    "shotloom-deploy-release-notes",
    "shotloom-deploy-manifest",
    "shotloom-deploy-rollback",
  ]);
  assert.deepEqual(result.json.outputs.find((entry) => entry.id === "agent-hub-spec-proposed"), {
    id: "agent-hub-spec-proposed",
    description: "Agent-hub proposed spec document",
    madeBy: "ah-manage-spec",
    writeTargetKind: "repo-template",
    args: ["slug"],
    format: "markdown",
    hasTemplate: true,
  });
});

test("CLI returns structured JSON for argument failures", () => {
  expectCliFailure(["missing-output"], /unknown output id: missing-output/);
  expectCliFailure(["agent-hub-spec-proposed"], /missing arg: slug/);
  expectCliFailure(["agent-hub-spec-proposed", "slug=test", "extra=x"], /received undeclared arg: extra/);
  expectCliFailure(["agent-hub-spec-proposed", "slug=../bad"], /contains invalid path characters/);
});

test("fails on broken parent output in a temp root", () => {
  withTempRoot((outputs) => {
    outputs.entries.find((entry) => entry.id === "agent-hub-design-plan-section").writeTarget.parentOutput = "missing-parent";
    return outputs;
  }, (root) => {
    assert.throws(
      () => resolveOutput({ root, id: "agent-hub-design-plan-section", values: { slug: "test-spec" } }),
      /unknown output id: missing-parent/,
    );
  });
});

test("fails on unsafe resolved path in a temp root", () => {
  withTempRoot((outputs) => {
    outputs.entries.find((entry) => entry.id === "agent-hub-spec-proposed").writeTarget.path = "../bad/{slug}.md";
    return outputs;
  }, (root) => {
    assert.throws(
      () => resolveOutput({ root, id: "agent-hub-spec-proposed", values: { slug: "test-spec" } }),
      /resolved unsafe repo path/,
    );
  });
});

test("fails when a declared template is missing in a temp root", () => {
  withTempRoot((outputs) => {
    outputs.entries.find((entry) => entry.id === "agent-hub-spec-proposed").template = "agent/document-templates/agent-hub/missing.md";
    return outputs;
  }, (root) => {
    assert.throws(
      () => resolveOutput({ root, id: "agent-hub-spec-proposed", values: { slug: "test-spec" } }),
      /template does not exist: agent\/document-templates\/agent-hub\/missing\.md/,
    );
  });
});

test("fails on unsupported write target kind in a temp root", () => {
  withTempRoot((outputs) => {
    outputs.entries.find((entry) => entry.id === "agent-hub-spec-proposed").writeTarget.kind = "moon-base";
    return outputs;
  }, (root) => {
    assert.throws(
      () => resolveOutput({ root, id: "agent-hub-spec-proposed", values: { slug: "test-spec" } }),
      /unsupported writeTarget kind: moon-base/,
    );
  });
});

test("CLI supports temp roots", () => {
  withTempRoot((outputs) => outputs, (root) => {
    const result = runResolver(["--root", root, "agent-hub-spec-proposed", "slug=test-spec"]);

    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.json.ok, true);
    assert.equal(result.json.absolutePath, path.join(root, "docs/plans/proposed/test-spec.md"));
  });
});

test("CLI --create creates local artifact parent directories", () => {
  withTempRoot((outputs) => outputs, (root) => {
    const result = runResolver(["--root", root, "--create", "shotloom-start-task-brief", "stl=stl-123"]);

    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.json.ok, true);
    assert.equal(result.json.absolutePath, path.join(root, ".agent-local/shotloom/planning/stl-123/brief.json"));
    assert.equal(existsSync(path.dirname(result.json.absolutePath)), true);
  });
});

test("CLI --create creates local artifact directories", () => {
  withTempRoot((outputs) => outputs, (root) => {
    const result = runResolver(["--root", root, "--create", "shotloom-pr-cache", "pr=77"]);

    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.json.ok, true);
    assert.equal(result.json.absolutePath, path.join(root, ".agent-local/shotloom/pr/77"));
    assert.equal(existsSync(result.json.absolutePath), true);
  });
});
