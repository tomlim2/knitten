#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  FOUR_PANEL_FORMAT_CONTRACT,
  STORYBOARD_VALIDATION_GATES,
  buildClosedOutputInput,
  deriveEngineFingerprints,
  validateAdaptationInput,
  validateFormatContract,
  validateNarrativeSpec,
  validateOutputInput,
  validateStoryboardApproval,
} from "./engine-contracts.mjs";

function narrativeSpec(overrides = {}) {
  return {
    schemaVersion: 1,
    narrativeId: "narrative-2026-07-31-v0",
    sourceContract: {
      sourceFacts: [],
      supportedInferences: [],
      inventions: ["A lantern refuses to go dark until its keeper rests."],
      preservedAmbiguities: ["Whether the lantern is sentient"],
      invariants: ["The keeper accepts help before dawn"],
    },
    structureMode: "transformation-or-passage",
    premise: "A night watch is transferred without extinguishing its care.",
    focalization: "the exhausted keeper",
    charactersAndRoles: [{ id: "keeper", role: "guardian" }],
    characterStateTransitions: [{ subject: "keeper", from: "alone", to: "supported" }],
    eventGraph: [{ id: "handoff", requires: [], causes: ["rest"] }],
    emotionalMovement: ["vigilance", "trust"],
    worldRules: ["The lantern remains lit while someone accepts the watch."],
    motifsAndCausalObjects: ["lantern", "key"],
    consequence: "The watch continues while the keeper sleeps.",
    residue: "A warm key waits beside the empty chair.",
    jokeMeaning: "Even magic has a shift schedule.",
    provenance: {
      briefFingerprint: "brief-001",
      referenceIds: [],
      authorKind: "active-codex-model",
      authorRole: "narrative-author",
      effectiveAuthorModel: "runtime-recorded-model",
      reviewPass: { passed: true, findings: [] },
    },
    ...overrides,
  };
}

function storyboardHandoff(overrides = {}) {
  return {
    handoffVersion: 1,
    approvedStoryboardRaster: {
      path: "/tmp/storyboard.png",
      sha256: "storyboard-sha",
    },
    formatGeometry: FOUR_PANEL_FORMAT_CONTRACT.canvasOrSequenceGeometry,
    visibleSubjects: ["keeper", "relief keeper", "lantern"],
    environmentFacts: ["night watch room"],
    unitStates: ["alone", "arrival", "handoff", "rest"],
    continuityTokens: ["lantern remains lit", "key moves right"],
    causalCarrier: "key",
    lockedCamera: ["wide", "medium", "insert", "wide"],
    lockedMovement: ["rightward key handoff"],
    lockedOrder: FOUR_PANEL_FORMAT_CONTRACT.canonicalOrder,
    lockedSpatialRelationships: ["keeper left; relief keeper right"],
    emotionalTrajectoryAsVisibleState: ["rigid", "surprised", "releasing", "resting"],
    finalVisualResidue: "warm key beside an empty chair",
    permittedFinishFlex: ["palette", "material", "texture"],
    validationFingerprint: "validation-001",
    ...overrides,
  };
}

function outputStyle(overrides = {}) {
  return {
    schemaVersion: 1,
    styleId: "paper-lantern",
    medium: "cut-paper diorama",
    palette: "indigo and amber",
    lighting: "soft practical glow",
    material: "fibrous paper",
    texture: "visible deckled edges",
    finish: "restrained",
    resolution: "1536x1536",
    surfaceRule: "preserve locked geometry",
    ...overrides,
  };
}

function storyboardApproval(overrides = {}) {
  return {
    attemptCount: 1,
    storyboardRasterSha256: "storyboard-sha",
    validationEvidence: STORYBOARD_VALIDATION_GATES.map((gate) => ({
      gate,
      passed: true,
      evidence: `${gate} is visibly legible`,
    })),
    ...overrides,
  };
}

test("NarrativeSpec is closed and rejects format or rendering knowledge", () => {
  assert.equal(validateNarrativeSpec(narrativeSpec()).narrativeId, "narrative-2026-07-31-v0");
  assert.throws(
    () => validateNarrativeSpec(narrativeSpec({ panelCount: 4 })),
    /forbidden keys: panelCount/,
  );
  assert.throws(
    () => validateNarrativeSpec(narrativeSpec({
      sourceContract: {
        ...narrativeSpec().sourceContract,
        inventions: [{ action: "handoff", cameraAngle: "low" }],
      },
    })),
    /forbidden key.*cameraAngle/,
  );
});

test("Adaptation receives exactly NarrativeSpec, FormatContract, and adaptationVariant", () => {
  const input = {
    narrativeSpec: narrativeSpec(),
    formatContract: FOUR_PANEL_FORMAT_CONTRACT,
    adaptationVariant: 0,
  };
  assert.equal(validateAdaptationInput(input), input);
  assert.throws(
    () => validateAdaptationInput({ ...input, outputStyle: outputStyle() }),
    /forbidden keys: outputStyle/,
  );
});

test("Output receives exactly StoryboardHandoff and OutputStyle", () => {
  const input = buildClosedOutputInput(storyboardHandoff(), outputStyle());
  assert.deepEqual(Object.keys(input).sort(), ["outputStyle", "storyboardHandoff"]);
  assert.throws(
    () => validateOutputInput({ ...input, narrativeSpec: narrativeSpec() }),
    /forbidden keys: narrativeSpec/,
  );
  assert.throws(
    () => buildClosedOutputInput(
      storyboardHandoff({ rationale: "read the source story" }),
      outputStyle(),
    ),
    /forbidden keys: rationale/,
  );
});

test("Storyboard approval blocks Output when any visible gate fails", () => {
  assert.deepEqual(
    STORYBOARD_VALIDATION_GATES.slice(-4),
    [
      "first-time-reader-causality",
      "state-timing-no-anticipation",
      "prop-mechanism-chain-legibility",
      "actor-object-relationship-legibility",
    ],
  );
  const approved = validateStoryboardApproval(storyboardApproval());
  assert.match(approved.validationFingerprint, /^[a-f0-9]{24}$/);
  const failedEvidence = storyboardApproval().validationEvidence.map((item) => (
    item.gate === "movement-direction" ? { ...item, passed: false } : item
  ));
  assert.throws(
    () => validateStoryboardApproval(storyboardApproval({ validationEvidence: failedEvidence })),
    /blocked: storyboard-validation-failed \(movement-direction\)/,
  );
  assert.throws(
    () => validateStoryboardApproval(storyboardApproval({ attemptCount: 3 })),
    /blocked: storyboard-validation-failed/,
  );
});

test("fingerprints follow the declared invalidation graph", () => {
  const base = {
    narrativeSpec: narrativeSpec(),
    formatContract: FOUR_PANEL_FORMAT_CONTRACT,
    adaptationVariant: 0,
    storyboardHandoff: storyboardHandoff(),
    outputStyle: outputStyle(),
  };
  const original = deriveEngineFingerprints(base);
  const adaptationReroll = deriveEngineFingerprints({ ...base, adaptationVariant: 1 });
  assert.equal(original.narrativeFingerprint, adaptationReroll.narrativeFingerprint);
  assert.equal(original.formatFingerprint, adaptationReroll.formatFingerprint);
  assert.notEqual(original.adaptationFingerprint, adaptationReroll.adaptationFingerprint);
  assert.notEqual(original.outputFingerprint, adaptationReroll.outputFingerprint);

  const formatChange = deriveEngineFingerprints({
    ...base,
    formatContract: {
      ...FOUR_PANEL_FORMAT_CONTRACT,
      formatId: "future-visual-sequence",
      formatVersion: 1,
    },
  });
  assert.equal(original.narrativeFingerprint, formatChange.narrativeFingerprint);
  assert.notEqual(original.formatFingerprint, formatChange.formatFingerprint);
  assert.notEqual(original.adaptationFingerprint, formatChange.adaptationFingerprint);
  assert.notEqual(original.outputFingerprint, formatChange.outputFingerprint);

  const outputStyleChange = deriveEngineFingerprints({
    ...base,
    outputStyle: outputStyle({ palette: "silver and moss" }),
  });
  assert.equal(original.narrativeFingerprint, outputStyleChange.narrativeFingerprint);
  assert.equal(original.adaptationFingerprint, outputStyleChange.adaptationFingerprint);
  assert.notEqual(original.outputFingerprint, outputStyleChange.outputFingerprint);
});

test("a future visual format can register without changing NarrativeSpec", () => {
  const futureFormat = {
    ...FOUR_PANEL_FORMAT_CONTRACT,
    formatId: "future-motion-sequence",
    formatVersion: 1,
    unitKind: "shot",
    unitCount: 6,
    canvasOrSequenceGeometry: { assetCount: 6, layout: "ordered sequence" },
    canonicalOrder: ["shot-1", "shot-2", "shot-3", "shot-4", "shot-5", "shot-6"],
    storyboardBlueprintType: "strict-monochrome-rough-shot-board",
  };
  assert.equal(validateFormatContract(futureFormat).formatId, "future-motion-sequence");
  assert.equal(validateNarrativeSpec(narrativeSpec()).schemaVersion, 1);
});

test("a future Narrative producer can emit the same contract", () => {
  const sourceAdapterNarrative = narrativeSpec({
    provenance: {
      ...narrativeSpec().provenance,
      authorKind: "source-adapter",
      authorRole: "legend-adapter",
      effectiveAuthorModel: "runtime-adapter-provenance",
    },
  });
  assert.equal(
    validateNarrativeSpec(sourceAdapterNarrative).provenance.authorKind,
    "source-adapter",
  );
});

test("validate-engine-packet CLI validates a closed packet", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "daily-engine-contract-"));
  try {
    const input = path.join(root, "narrative.json");
    writeFileSync(input, `${JSON.stringify(narrativeSpec(), null, 2)}\n`, "utf8");
    const result = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL("./validate-engine-packet.mjs", import.meta.url)),
        "--type",
        "narrative",
        "--input",
        input,
      ],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      ok: true,
      type: "narrative",
      input,
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
