import assert from "node:assert/strict";
import test from "node:test";

import { resolveArtifactRoute, routeSignature } from "../scripts/resolve-artifact-route.mjs";

function manifest(overrides = {}) {
  return {
    "schema-version": 1,
    "pack-id": overrides["pack-id"] || "review-pack",
    "display-name": "Review Pack",
    version: "1.0.0",
    visibility: overrides.visibility || "public",
    "owner-domain": "domain",
    description: "Fixture pack.",
    exports: overrides.exports || [{
      "artifact-id": "review-skill",
      "artifact-type": "skill",
      path: "skills/review-skill",
      shape: "directory",
      mount: { layer: "skills", target: "review-skill", mode: "virtual" },
      entrypoint: "skills/review-skill/SKILL.md",
      load: "route-selected",
      route: { domains: ["web"], "task-types": ["review"] },
      "privacy-risk": "public-safe",
    }],
    "compatibility-aliases": overrides["compatibility-aliases"] || [],
  };
}

function installedPack(packManifest, overrides = {}) {
  return {
    "pack-id": packManifest["pack-id"],
    state: overrides.state || "active",
    scope: overrides.scope || {},
    "candidate-index": packManifest.exports.map((entry) => ({
      "pack-id": packManifest["pack-id"],
      "artifact-id": entry["artifact-id"],
      "artifact-type": entry["artifact-type"],
      "source-ref": `${packManifest["pack-id"]}/${entry["artifact-id"]}`,
      load: entry.load,
      route: entry.route || {},
      scope: {},
    })),
  };
}

function resolve(packManifest, options = {}) {
  return resolveArtifactRoute({
    requestText: "please do web review",
    harnessId: "codex",
    cwdRepoKey: "knitten",
    workMode: "personal",
    touchedPaths: [],
    namedArtifact: [],
    installedPacks: [installedPack(packManifest, options.row || {})],
    manifests: [packManifest],
    ...options.request,
  });
}

test("selects one primary candidate without loading bodies", () => {
  const result = resolve(manifest());

  assert.equal(result["result-kind"], "primary");
  assert.equal(result["resolver-body-load-count"], 0);
  assert.equal(result["emitted-candidate-count"], 1);
  assert.equal(result.candidates[0]["load-state"], "selected");
  assert.equal(result.candidates[0]["compatibility-need"], "none");
});

test("selects exact core artifact without pack lookup", () => {
  const result = resolveArtifactRoute({
    requestText: "use core-review",
    harnessId: "codex",
    cwdRepoKey: "knitten",
    workMode: "personal",
    touchedPaths: [],
    namedArtifact: ["core-review"],
    coreArtifacts: [{
      "artifact-id": "core-review",
      "artifact-type": "skill",
      path: "agent/skills/core-review/SKILL.md",
      load: "manual",
      route: { domains: ["agent-hub"] },
    }],
    installedPacks: [],
    manifests: [],
  });

  assert.equal(result["result-kind"], "primary");
  assert.equal(result.candidates[0].source, "core");
  assert.equal(result.candidates[0]["artifact-path-ref"], "agent/skills/core-review/SKILL.md");
  assert.equal(result["resolver-body-load-count"], 0);
});

test("disabled installed rows emit no candidates", () => {
  const result = resolve(manifest(), { row: { state: "disabled" } });

  assert.equal(result["result-kind"], "core-fallback");
  assert.equal(result["fallback-source"], "core");
  assert.equal(result["emitted-candidate-count"], 0);
  assert.deepEqual(result.candidates, []);
});

test("installed rows without validated manifests emit no candidates", () => {
  const pack = manifest();
  const result = resolveArtifactRoute({
    requestText: "please do web review",
    harnessId: "codex",
    cwdRepoKey: "knitten",
    workMode: "personal",
    touchedPaths: [],
    namedArtifact: [],
    installedPacks: [installedPack(pack)],
    manifests: [],
  });

  assert.equal(result["result-kind"], "core-fallback");
  assert.equal(result["emitted-candidate-count"], 0);
  assert.deepEqual(result.candidates, []);
});

test("scope mismatch emits no candidate unless explicitly named", () => {
  const result = resolve(manifest(), { row: { scope: { "repo-keys": ["shotloom"] } } });

  assert.equal(result["result-kind"], "core-fallback");
  assert.equal(result["emitted-candidate-count"], 0);
});

test("explicit scope-blocked artifact returns excluded result", () => {
  const result = resolve(manifest(), {
    row: { scope: { "repo-keys": ["shotloom"] } },
    request: { namedArtifact: ["review-skill"] },
  });

  assert.equal(result["result-kind"], "excluded");
  assert.deepEqual(result["excluded-artifact-refs"], ["review-pack/review-skill"]);
  assert.equal(result["exclusion-reason"], "scope");
  assert.equal(result["resolver-body-load-count"], 0);
});

test("exact artifact name outranks route score", () => {
  const pack = manifest({
    exports: [
      {
        "artifact-id": "broad-review",
        "artifact-type": "skill",
        path: "skills/broad-review",
        shape: "directory",
        mount: { layer: "skills", target: "broad-review", mode: "virtual" },
        entrypoint: "skills/broad-review/SKILL.md",
        load: "route-selected",
        route: { domains: ["web"], "task-types": ["review"] },
        "privacy-risk": "public-safe",
      },
      {
        "artifact-id": "named-skill",
        "artifact-type": "skill",
        path: "skills/named-skill",
        shape: "directory",
        mount: { layer: "skills", target: "named-skill", mode: "virtual" },
        entrypoint: "skills/named-skill/SKILL.md",
        load: "manual",
        route: { domains: ["agent-hub"] },
        "privacy-risk": "public-safe",
      },
    ],
  });

  const result = resolve(pack, { request: { namedArtifact: ["named-skill"] } });

  assert.equal(result["result-kind"], "primary");
  assert.match(result["primary-candidate-id"], /named-skill/);
  assert.equal(result.candidates[0]["candidate-id"], result["primary-candidate-id"]);
  assert.equal(result["resolver-body-load-count"], 0);
});

test("request text name matching is token bounded", () => {
  const pack = manifest({
    exports: [
      {
        "artifact-id": "review-skill",
        "artifact-type": "skill",
        path: "skills/review-skill",
        shape: "directory",
        mount: { layer: "skills", target: "review-skill", mode: "virtual" },
        entrypoint: "skills/review-skill/SKILL.md",
        load: "manual",
        route: { domains: ["agent-hub"] },
        "privacy-risk": "public-safe",
      },
      {
        "artifact-id": "web-review",
        "artifact-type": "skill",
        path: "skills/web-review",
        shape: "directory",
        mount: { layer: "skills", target: "web-review", mode: "virtual" },
        entrypoint: "skills/web-review/SKILL.md",
        load: "route-selected",
        route: { domains: ["web"] },
        "privacy-risk": "public-safe",
      },
    ],
  });

  const result = resolve(pack, { request: { requestText: "please review-skillful web page" } });

  assert.equal(result["result-kind"], "primary");
  assert.match(result["primary-candidate-id"], /web-review/);
  assert.equal(result.candidates.find((candidate) => candidate["artifact-id"] === "review-skill").exactMatch, false);
});

test("excluded domain blocks explicit artifact without body load", () => {
  const pack = manifest({
    exports: [{
      "artifact-id": "ue-sensitive",
      "artifact-type": "skill",
      path: "skills/ue-sensitive",
      shape: "directory",
      mount: { layer: "skills", target: "ue-sensitive", mode: "virtual" },
      entrypoint: "skills/ue-sensitive/SKILL.md",
      load: "route-selected",
      route: { domains: ["web"], "exclude-when": ["unreal"] },
      "privacy-risk": "public-safe",
    }],
  });

  const result = resolve(pack, {
    request: {
      requestText: "please use ue-sensitive for web review with unreal terms",
      namedArtifact: ["ue-sensitive"],
    },
  });

  assert.equal(result["result-kind"], "excluded");
  assert.equal(result["exclusion-reason"], "exclude-when");
  assert.equal(result["resolver-body-load-count"], 0);
});

test("ambiguous result when equal route signature lacks priority", () => {
  const pack = manifest({
    exports: ["first-skill", "second-skill"].map((id) => ({
      "artifact-id": id,
      "artifact-type": "skill",
      path: `skills/${id}`,
      shape: "directory",
      mount: { layer: "skills", target: id, mode: "virtual" },
      entrypoint: `skills/${id}/SKILL.md`,
      load: "route-selected",
      route: { domains: ["web"] },
      "privacy-risk": "public-safe",
    })),
  });

  const result = resolve(pack, { request: { requestText: "web task" } });

  assert.equal(result["result-kind"], "ambiguous");
  assert.equal(result["ambiguity-reason"].field, "priority");
  assert.equal(result["resolver-body-load-count"], 0);
});

test("lower priority wins for same route signature", () => {
  const pack = manifest({
    exports: [
      ["slow-skill", 9],
      ["fast-skill", 1],
    ].map(([id, priority]) => ({
      "artifact-id": id,
      "artifact-type": "skill",
      path: `skills/${id}`,
      shape: "directory",
      mount: { layer: "skills", target: id, mode: "virtual" },
      entrypoint: `skills/${id}/SKILL.md`,
      load: "route-selected",
      route: { domains: ["web"], priority },
      "privacy-risk": "public-safe",
    })),
  });

  const result = resolve(pack, { request: { requestText: "web task" } });

  assert.equal(result["result-kind"], "primary");
  assert.match(result["primary-candidate-id"], /fast-skill/);
});

test("compatibility alias emits canonical artifact with alias provenance", () => {
  const pack = manifest({
    "compatibility-aliases": [{
      "alias-id": "old-review-name",
      "target-artifact-id": "review-skill",
      "compatibility-need": "alias",
      "old-name": "old-review",
      "removal-criteria": "Reference scan returns zero matches.",
    }],
  });

  const result = resolve(pack, { request: { namedArtifact: ["old-review"] } });
  const candidate = result.candidates.find((item) => item["compatibility-need"] === "alias");

  assert.equal(result["result-kind"], "primary");
  assert.equal(candidate["artifact-id"], "review-skill");
  assert.equal(candidate["compatibility-alias-id"], "old-review-name");
  assert.equal(candidate["matched-compatibility-input"], "old-review");
});

test("compatibility alias is not route-selected unless old name matches", () => {
  const pack = manifest({
    "compatibility-aliases": [{
      "alias-id": "old-review-name",
      "target-artifact-id": "review-skill",
      "compatibility-need": "alias",
      "old-name": "old-review",
      "removal-criteria": "Reference scan returns zero matches.",
    }],
  });

  const result = resolve(pack, { request: { requestText: "please do web review" } });
  const aliasCandidate = result.candidates.find((item) => item["compatibility-need"] === "alias");

  assert.equal(result["result-kind"], "primary");
  assert.notEqual(result["primary-candidate-id"], aliasCandidate["candidate-id"]);
  assert.equal(aliasCandidate["load-state"], "metadata-only");
});

test("canonical artifact name does not select compatibility alias candidate", () => {
  const pack = manifest({
    "compatibility-aliases": [{
      "alias-id": "old-review-name",
      "target-artifact-id": "review-skill",
      "compatibility-need": "alias",
      "old-name": "old-review",
      "removal-criteria": "Reference scan returns zero matches.",
    }],
  });

  const result = resolve(pack, { request: { requestText: "use review-skill", namedArtifact: ["review-skill"] } });
  const aliasCandidate = result.candidates.find((item) => item["compatibility-need"] === "alias");

  assert.equal(result["result-kind"], "primary");
  assert.match(result["primary-candidate-id"], /review-skill:none:none$/);
  assert.notEqual(result["primary-candidate-id"], aliasCandidate["candidate-id"]);
  assert.equal(aliasCandidate.exactMatch, false);
});

test("compatibility shim points to shim path", () => {
  const pack = manifest({
    "compatibility-aliases": [{
      "alias-id": "old-review-shim",
      "target-artifact-id": "review-skill",
      "compatibility-need": "shim",
      "old-name": "old-review",
      "shim-path": "skills/old-review/SKILL.md",
      "removal-criteria": "Reference scan returns zero matches.",
    }],
  });

  const result = resolve(pack, { request: { namedArtifact: ["old-review"] } });
  const candidate = result.candidates.find((item) => item["compatibility-need"] === "shim");

  assert.equal(result["result-kind"], "primary");
  assert.equal(result["primary-candidate-id"], candidate["candidate-id"]);
  assert.equal(candidate["artifact-id"], "review-skill");
  assert.equal(candidate["artifact-path-ref"], "skills/old-review/SKILL.md");
});

test("manual and on-demand candidates remain metadata-only during resolution", () => {
  const pack = manifest({
    exports: [
      {
        "artifact-id": "manual-skill",
        "artifact-type": "skill",
        path: "skills/manual-skill",
        shape: "directory",
        mount: { layer: "skills", target: "manual-skill", mode: "virtual" },
        entrypoint: "skills/manual-skill/SKILL.md",
        load: "manual",
        route: { domains: ["web"] },
        "privacy-risk": "public-safe",
      },
      {
        "artifact-id": "ondemand-skill",
        "artifact-type": "skill",
        path: "skills/ondemand-skill",
        shape: "directory",
        mount: { layer: "skills", target: "ondemand-skill", mode: "virtual" },
        entrypoint: "skills/ondemand-skill/SKILL.md",
        load: "on-demand",
        route: { domains: ["web"] },
        "privacy-risk": "public-safe",
      },
    ],
  });

  const result = resolve(pack, { request: { requestText: "web", namedArtifact: ["manual-skill"] } });
  const manualCandidate = result.candidates.find((candidate) => candidate["artifact-id"] === "manual-skill");
  const onDemandCandidate = result.candidates.find((candidate) => candidate["artifact-id"] === "ondemand-skill");

  assert.equal(result["result-kind"], "primary");
  assert.equal(result["primary-candidate-id"], manualCandidate["candidate-id"]);
  assert.equal(result["resolver-body-load-count"], 0);
  assert.equal(manualCandidate["load-state"], "metadata-only");
  assert.equal(onDemandCandidate["load-state"], "metadata-only");
});

test("manual candidates are not selected by route evidence unless explicitly named", () => {
  const pack = manifest({
    exports: [{
      "artifact-id": "manual-skill",
      "artifact-type": "skill",
      path: "skills/manual-skill",
      shape: "directory",
      mount: { layer: "skills", target: "manual-skill", mode: "virtual" },
      entrypoint: "skills/manual-skill/SKILL.md",
      load: "manual",
      route: { domains: ["web"] },
      "privacy-risk": "public-safe",
    }],
  });

  const result = resolve(pack, { request: { requestText: "web" } });

  assert.equal(result["result-kind"], "core-fallback");
  assert.equal(result["emitted-candidate-count"], 1);
  assert.equal(result.candidates[0]["load-state"], "metadata-only");
  assert.equal(result.candidates[0].exactMatch, false);
});

test("route signature uses validator-owned fields", () => {
  assert.deepEqual(routeSignature({
    domains: ["web"],
    "task-types": ["review"],
    unknown: ["ignored"],
    "exclude-when": ["unreal"],
  }), {
    domains: ["web"],
    "exclude-when": ["unreal"],
    "task-types": ["review"],
  });
});
