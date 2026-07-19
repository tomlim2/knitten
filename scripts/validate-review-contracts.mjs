#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_ROOT = path.join(REPO_ROOT, "evals/review-contracts");
const FORWARD_PACKET_ROOT = path.join(REPO_ROOT, "evals/review-forward-packets");
const PRIORITY_RANK = new Map([["P0", 0], ["P1", 1], ["P2", 2], ["P3", 3]]);

function compareCodeUnits(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

class ContractError extends Error {
  constructor(code, detail) {
    super(`${code}: ${detail}`);
    this.code = code;
  }
}

function fail(code, detail) {
  throw new ContractError(code, detail);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, label) {
  if (!isObject(value)) throw new Error(`${label} must be an object`);
}

function requireArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
}

function closedKeys(value, allowed, label) {
  requireObject(value, label);
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail("unknown-key", `${label}.${key}`);
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) throw new Error(`${label}.${key} is required`);
  }
}

function duplicate(values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}

function validateIdArray(value, label) {
  requireArray(value, label);
  if (!value.every((item) => typeof item === "string" && item.length > 0)) {
    throw new Error(`${label} must contain non-empty strings`);
  }
  const repeated = duplicate(value);
  if (repeated) fail("duplicate-surface-id", `${label}:${repeated}`);
}

function validateHandoff(handoff, label) {
  closedKeys(handoff, ["descriptionRefreshRequired", "reason"], label);
  if (typeof handoff.descriptionRefreshRequired !== "boolean") {
    throw new Error(`${label}.descriptionRefreshRequired must be boolean`);
  }
  if (handoff.descriptionRefreshRequired) {
    if (typeof handoff.reason !== "string" || handoff.reason.length === 0) {
      throw new Error(`${label} description refresh requires a reason`);
    }
  } else if (handoff.reason !== null) {
    throw new Error(`${label} unchanged reason must be null`);
  }
}

function validateExpected(expected) {
  closedKeys(
    expected,
    ["coverage", "handoff", "loopEligibleFindingIds", "ready", "nextAction"],
    "expected",
  );
  closedKeys(
    expected.coverage,
    ["assigned", "checked", "skipped", "excluded", "uncovered", "complete"],
    "expected.coverage",
  );
  for (const key of ["assigned", "checked", "skipped", "uncovered"]) {
    validateIdArray(expected.coverage[key], `expected.coverage.${key}`);
  }
  validateHandoff(expected.handoff, "expected.handoff");
  requireArray(expected.coverage.excluded, "expected.coverage.excluded");
  for (const [index, item] of expected.coverage.excluded.entries()) {
    closedKeys(item, ["surfaceId", "reason"], `expected.coverage.excluded[${index}]`);
  }
  validateIdArray(expected.loopEligibleFindingIds, "expected.loopEligibleFindingIds");
  if (typeof expected.coverage.complete !== "boolean" || typeof expected.ready !== "boolean") {
    throw new Error("expected readiness values must be boolean");
  }
  if (!["complete", "fix", "review", "ask"].includes(expected.nextAction)) {
    throw new Error("expected.nextAction is invalid");
  }
}

function calculate(input) {
  closedKeys(
    input,
    [
      "schemaVersion",
      "caseId",
      "inventory",
      "roleCoverage",
      "normalizedFindings",
      "needsDesignJudgmentCount",
      "handoff",
      "expected",
    ],
    "fixture",
  );
  if (input.schemaVersion !== 1) throw new Error("schemaVersion must be 1");
  if (typeof input.caseId !== "string" || input.caseId.length === 0) {
    throw new Error("caseId must be a non-empty string");
  }

  requireArray(input.inventory, "inventory");
  const inventoryById = new Map();
  for (const [index, item] of input.inventory.entries()) {
    closedKeys(
      item,
      ["surfaceId", "path", "kind", "reviewRequired", "exclusionReason"],
      `inventory[${index}]`,
    );
    if (
      typeof item.surfaceId !== "string"
      || item.surfaceId.length === 0
      || typeof item.path !== "string"
      || item.path.length === 0
    ) {
      throw new Error(`inventory[${index}] ids and paths must be non-empty strings`);
    }
    if (inventoryById.has(item.surfaceId)) {
      fail("duplicate-surface-id", item.surfaceId);
    }
    if (!["human", "generated", "data"].includes(item.kind)) {
      throw new Error(`inventory[${index}].kind is invalid`);
    }
    if (typeof item.reviewRequired !== "boolean") {
      throw new Error(`inventory[${index}].reviewRequired must be boolean`);
    }
    if (item.kind === "human" && item.reviewRequired !== true) {
      throw new Error(`human surface ${item.surfaceId} must require review`);
    }
    if (!item.reviewRequired && (
      item.kind === "human"
      || typeof item.exclusionReason !== "string"
      || item.exclusionReason.length === 0
    )) {
      throw new Error(`excluded surface ${item.surfaceId} requires a reason`);
    }
    if (item.reviewRequired && item.exclusionReason !== null) {
      throw new Error(`review-required surface ${item.surfaceId} cannot have an exclusion reason`);
    }
    inventoryById.set(item.surfaceId, item);
  }

  requireArray(input.roleCoverage, "roleCoverage");
  const assigned = new Set();
  const checked = new Set();
  const skipped = new Set();
  for (const [index, report] of input.roleCoverage.entries()) {
    closedKeys(
      report,
      ["role", "assignedSurfaceIds", "checkedSurfaceIds", "skippedSurfaces"],
      `roleCoverage[${index}]`,
    );
    if (typeof report.role !== "string" || report.role.length === 0) {
      throw new Error(`roleCoverage[${index}].role must be a non-empty string`);
    }
    validateIdArray(report.assignedSurfaceIds, `roleCoverage[${index}].assignedSurfaceIds`);
    validateIdArray(report.checkedSurfaceIds, `roleCoverage[${index}].checkedSurfaceIds`);
    requireArray(report.skippedSurfaces, `roleCoverage[${index}].skippedSurfaces`);
    const skippedIds = [];
    for (const [skipIndex, skip] of report.skippedSurfaces.entries()) {
      closedKeys(skip, ["surfaceId", "reason"], `roleCoverage[${index}].skippedSurfaces[${skipIndex}]`);
      if (typeof skip.reason !== "string" || skip.reason.length === 0) {
        throw new Error("skipped surface requires a reason");
      }
      skippedIds.push(skip.surfaceId);
    }
    validateIdArray(skippedIds, `roleCoverage[${index}].skippedSurfaces`);
    const assignedForRole = new Set(report.assignedSurfaceIds);
    for (const surfaceId of [...report.assignedSurfaceIds, ...report.checkedSurfaceIds, ...skippedIds]) {
      if (!inventoryById.has(surfaceId)) fail("unknown-surface-id", surfaceId);
      if (!inventoryById.get(surfaceId).reviewRequired) {
        fail("excluded-surface-id", surfaceId);
      }
    }
    for (const surfaceId of [...report.checkedSurfaceIds, ...skippedIds]) {
      if (!assignedForRole.has(surfaceId)) fail("unknown-surface-id", `${surfaceId} is not assigned to ${report.role}`);
    }
    for (const surfaceId of report.checkedSurfaceIds) {
      if (skippedIds.includes(surfaceId)) fail("coverage-overlap", surfaceId);
    }
    report.assignedSurfaceIds.forEach((surfaceId) => assigned.add(surfaceId));
    report.checkedSurfaceIds.forEach((surfaceId) => checked.add(surfaceId));
    skippedIds.forEach((surfaceId) => skipped.add(surfaceId));
  }

  requireArray(input.normalizedFindings, "normalizedFindings");
  const findingIds = new Set();
  const eligible = [];
  const blockers = [];
  for (const [index, finding] of input.normalizedFindings.entries()) {
    closedKeys(finding, ["fixtureFindingId", "priority", "blocker"], `normalizedFindings[${index}]`);
    if (typeof finding.fixtureFindingId !== "string" || finding.fixtureFindingId.length === 0) {
      throw new Error(`normalizedFindings[${index}].fixtureFindingId must be a non-empty string`);
    }
    if (findingIds.has(finding.fixtureFindingId)) {
      throw new Error(`duplicate fixtureFindingId: ${finding.fixtureFindingId}`);
    }
    findingIds.add(finding.fixtureFindingId);
    if (!PRIORITY_RANK.has(finding.priority) || typeof finding.blocker !== "boolean") {
      fail("invalid-blocker-priority", finding.fixtureFindingId);
    }
    const shouldBlock = finding.priority !== "P3";
    if (finding.blocker !== shouldBlock) {
      fail("invalid-blocker-priority", finding.fixtureFindingId);
    }
    eligible.push(finding);
    if (shouldBlock) blockers.push(finding);
  }

  if (!Number.isInteger(input.needsDesignJudgmentCount) || input.needsDesignJudgmentCount < 0) {
    throw new Error("needsDesignJudgmentCount must be a non-negative integer");
  }
  validateHandoff(input.handoff, "handoff");

  validateExpected(input.expected);

  const sortIds = (values) => [...values].sort(compareCodeUnits);
  const requiredIds = input.inventory
    .filter((item) => item.reviewRequired)
    .map((item) => item.surfaceId);
  const uncovered = requiredIds.filter((surfaceId) => !checked.has(surfaceId)).sort(compareCodeUnits);
  const excluded = input.inventory
    .filter((item) => !item.reviewRequired)
    .map((item) => ({ surfaceId: item.surfaceId, reason: item.exclusionReason }))
    .sort((left, right) => compareCodeUnits(left.surfaceId, right.surfaceId));
  const loopEligible = eligible.sort((left, right) => (
    PRIORITY_RANK.get(left.priority) - PRIORITY_RANK.get(right.priority)
    || compareCodeUnits(left.fixtureFindingId, right.fixtureFindingId)
  ));
  const complete = uncovered.length === 0;
  const ready = blockers.length === 0 && complete && input.needsDesignJudgmentCount === 0;
  const nextAction = input.needsDesignJudgmentCount > 0
    ? "ask"
    : loopEligible.length > 0
      ? "fix"
      : !complete
        ? "review"
        : "complete";

  return {
    coverage: {
      assigned: sortIds(assigned),
      checked: sortIds(checked),
      skipped: sortIds(skipped),
      excluded,
      uncovered,
      complete,
    },
    handoff: { ...input.handoff },
    loopEligibleFindingIds: loopEligible.map((finding) => finding.fixtureFindingId),
    ready,
    nextAction,
  };
}

function validateForwardPacket(packet, name) {
  closedKeys(
    packet,
    ["schemaVersion", "caseId", "dispatch", "reviewBrief", "inventory", "evidence", "expected"],
    `forwardPacket:${name}`,
  );
  assert.equal(packet.schemaVersion, 1, `${name}: schemaVersion`);
  assert.equal(typeof packet.caseId, "string", `${name}: caseId`);
  assert.ok(packet.caseId.length > 0, `${name}: caseId`);
  closedKeys(
    packet.dispatch,
    ["reviewMode", "role", "assignedSurfaceIds"],
    `forwardPacket:${name}.dispatch`,
  );
  assert.equal(packet.dispatch.reviewMode, "single", `${name}: dispatch.reviewMode`);
  assert.equal(typeof packet.dispatch.role, "string", `${name}: dispatch.role`);
  assert.ok(packet.dispatch.role.length > 0, `${name}: dispatch.role`);
  validateIdArray(packet.dispatch.assignedSurfaceIds, `${name}: dispatch.assignedSurfaceIds`);
  closedKeys(
    packet.reviewBrief,
    ["purpose", "what", "why", "primaryConsumer", "nonGoals"],
    `forwardPacket:${name}.reviewBrief`,
  );
  for (const key of ["purpose", "what", "why", "primaryConsumer"]) {
    assert.equal(typeof packet.reviewBrief[key], "string", `${name}: reviewBrief.${key}`);
    assert.ok(packet.reviewBrief[key].length > 0, `${name}: reviewBrief.${key}`);
  }
  requireArray(packet.reviewBrief.nonGoals, `${name}: reviewBrief.nonGoals`);
  assert.ok(packet.reviewBrief.nonGoals.every((item) => typeof item === "string" && item.length > 0));
  requireArray(packet.inventory, `${name}: inventory`);
  const ids = [];
  for (const [index, item] of packet.inventory.entries()) {
    closedKeys(
      item,
      ["surfaceId", "path", "kind", "reviewRequired", "exclusionReason"],
      `forwardPacket:${name}.inventory[${index}]`,
    );
    assert.equal(item.kind, "human", `${name}: forward packet surfaces are human-reviewed`);
    assert.equal(item.reviewRequired, true, `${name}: forward packet surface reviewRequired`);
    assert.equal(item.exclusionReason, null, `${name}: forward packet exclusionReason`);
    assert.equal(typeof item.surfaceId, "string", `${name}: inventory.surfaceId`);
    assert.ok(item.surfaceId.length > 0, `${name}: inventory.surfaceId`);
    assert.equal(typeof item.path, "string", `${name}: inventory.path`);
    assert.ok(item.path.length > 0, `${name}: inventory.path`);
    ids.push(item.surfaceId);
  }
  validateIdArray(ids, `forwardPacket:${name}.inventory`);
  assert.deepEqual(
    [...packet.dispatch.assignedSurfaceIds].sort(compareCodeUnits),
    [...ids].sort(compareCodeUnits),
    `${name}: every surface must be assigned`,
  );
  requireArray(packet.evidence, `${name}: evidence`);
  assert.ok(packet.evidence.length > 0, `${name}: evidence must not be empty`);
  assert.ok(packet.evidence.every((item) => typeof item === "string" && item.length > 0));
  closedKeys(
    packet.expected,
    ["requiredFindings", "optionalFindingAllowed", "needsDesignJudgmentCount", "coverageComplete", "ready", "nextAction"],
    `forwardPacket:${name}.expected`,
  );
  requireArray(packet.expected.requiredFindings, `${name}: expected.requiredFindings`);
  for (const [index, finding] of packet.expected.requiredFindings.entries()) {
    closedKeys(
      finding,
      ["priority", "blocker", "correctiveOutcome"],
      `forwardPacket:${name}.expected.requiredFindings[${index}]`,
    );
    assert.ok(["P0", "P1", "P2"].includes(finding.priority));
    assert.equal(finding.blocker, true);
    assert.equal(typeof finding.correctiveOutcome, "string");
    assert.ok(finding.correctiveOutcome.length > 0);
  }
  assert.equal(typeof packet.expected.optionalFindingAllowed, "boolean");
  assert.ok(Number.isInteger(packet.expected.needsDesignJudgmentCount));
  assert.ok(packet.expected.needsDesignJudgmentCount >= 0);
  assert.equal(typeof packet.expected.coverageComplete, "boolean");
  assert.equal(typeof packet.expected.ready, "boolean");
  assert.ok(["ask", "fix", "review", "complete"].includes(packet.expected.nextAction));
  const expectedReady = packet.expected.requiredFindings.length === 0
    && packet.expected.coverageComplete
    && packet.expected.needsDesignJudgmentCount === 0;
  const expectedNextAction = packet.expected.needsDesignJudgmentCount > 0
    ? "ask"
    : packet.expected.requiredFindings.length > 0
      ? "fix"
      : !packet.expected.coverageComplete
        ? "review"
        : "complete";
  assert.equal(packet.expected.ready, expectedReady, `${name}: expected.ready`);
  assert.equal(packet.expected.nextAction, expectedNextAction, `${name}: expected.nextAction`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURE_ROOT, relativePath), "utf8"));
}

function main() {
  const validFiles = fs.readdirSync(FIXTURE_ROOT)
    .filter((name) => name.endsWith(".json") && name !== "invalid-cases.json")
    .sort(compareCodeUnits);
  for (const name of validFiles) {
    const fixture = readJson(name);
    assert.deepEqual(calculate(fixture), fixture.expected, name);
  }

  const invalid = readJson("invalid-cases.json");
  closedKeys(invalid, ["schemaVersion", "caseId", "cases"], "invalidFixture");
  assert.equal(invalid.schemaVersion, 1);
  assert.equal(invalid.caseId, "invalid-cases");
  requireArray(invalid.cases, "invalidFixture.cases");
  for (const [index, testCase] of invalid.cases.entries()) {
    closedKeys(testCase, ["caseId", "input", "expectedError"], `invalidFixture.cases[${index}]`);
    assert.throws(
      () => calculate(testCase.input),
      (error) => error instanceof ContractError && error.code === testCase.expectedError,
      testCase.caseId,
    );
  }

  const forwardFiles = fs.readdirSync(FORWARD_PACKET_ROOT)
    .filter((name) => name.endsWith(".json"))
    .sort(compareCodeUnits);
  assert.deepEqual(forwardFiles, [
    "clarity-explanation.json",
    "non-perfect-improvement.json",
    "unsupported-complexity.json",
  ]);
  for (const name of forwardFiles) {
    const packet = JSON.parse(fs.readFileSync(path.join(FORWARD_PACKET_ROOT, name), "utf8"));
    assert.equal(packet.caseId, path.basename(name, ".json"), `${name}: caseId must match filename`);
    validateForwardPacket(packet, name);
    const renderedResult = spawnSync(
      process.execPath,
      ["scripts/render-review-forward-packet.mjs", packet.caseId],
      { cwd: REPO_ROOT, encoding: "utf8" },
    );
    assert.equal(renderedResult.status, 0, renderedResult.stderr || name);
    const rendered = JSON.parse(renderedResult.stdout);
    assert.deepEqual(rendered, {
      schemaVersion: packet.schemaVersion,
      caseId: packet.caseId,
      reviewMode: packet.dispatch.reviewMode,
      role: packet.dispatch.role,
      reviewBrief: packet.reviewBrief,
      inventory: packet.inventory,
      assignedSurfaceIds: packet.dispatch.assignedSurfaceIds,
      evidence: packet.evidence,
    }, `${name}: rendered blind packet`);
  }
  for (const caseId of ["../unsafe", "missing-case"]) {
    const rejected = spawnSync(
      process.execPath,
      ["scripts/render-review-forward-packet.mjs", caseId],
      { cwd: REPO_ROOT, encoding: "utf8" },
    );
    assert.notEqual(rejected.status, 0, `${caseId} must be rejected`);
  }

  process.stdout.write(
    `review contracts ok: ${validFiles.length} fixtures, ${invalid.cases.length} invalid cases, ${forwardFiles.length} forward packets\n`,
  );
}

main();
