import { createHash } from "node:crypto";

export const NARRATIVE_SPEC_KEYS = Object.freeze([
  "schemaVersion",
  "narrativeId",
  "sourceContract",
  "structureMode",
  "premise",
  "focalization",
  "charactersAndRoles",
  "characterStateTransitions",
  "eventGraph",
  "emotionalMovement",
  "worldRules",
  "motifsAndCausalObjects",
  "consequence",
  "residue",
  "jokeMeaning",
  "provenance",
]);

export const STORYBOARD_HANDOFF_KEYS = Object.freeze([
  "handoffVersion",
  "approvedStoryboardRaster",
  "formatGeometry",
  "visibleSubjects",
  "environmentFacts",
  "unitStates",
  "continuityTokens",
  "causalCarrier",
  "lockedCamera",
  "lockedMovement",
  "lockedOrder",
  "lockedSpatialRelationships",
  "emotionalTrajectoryAsVisibleState",
  "finalVisualResidue",
  "permittedFinishFlex",
  "validationFingerprint",
]);

export const OUTPUT_STYLE_KEYS = Object.freeze([
  "schemaVersion",
  "styleId",
  "medium",
  "palette",
  "lighting",
  "material",
  "texture",
  "finish",
  "resolution",
  "surfaceRule",
]);

export const ADAPTATION_CHANGE_OPERATIONS = Object.freeze([
  "retained",
  "omitted",
  "compressed",
  "merged",
  "externalized",
  "reordered-for-format",
  "clarified-within-invariant",
  "invented-visible-action",
  "invented-bridging-event",
  "invented-counterpoint",
  "invented-visual-consequence",
]);

export const STORYBOARD_VALIDATION_GATES = Object.freeze([
  "camera-angle-and-distance",
  "movement-direction",
  "unit-order-and-causality",
  "spatial-relationships",
  "narrative-invariant-preservation",
  "required-units-present-once",
  "first-time-reader-causality",
  "state-timing-no-anticipation",
  "prop-mechanism-chain-legibility",
  "actor-object-relationship-legibility",
]);

export const FOUR_PANEL_FORMAT_CONTRACT = Object.freeze({
  formatId: "four-panel-comic",
  formatVersion: 1,
  unitKind: "panel",
  unitCount: 4,
  canvasOrSequenceGeometry: {
    assetCount: 1,
    layout: "equal 2x2 grid",
  },
  canonicalOrder: ["top-left", "top-right", "bottom-left", "bottom-right"],
  continuityRequirements: [
    "causal-object continuity",
    "screen-direction continuity",
    "visible state transitions",
    "state timing does not reveal final outcomes before their visible turn",
    "actor or token relationships to causal objects are legible",
  ],
  textPolicy: "no dialogue, captions, panel numbers, sound effects, logos, signatures, or watermarks",
  storyboardBlueprintType: "strict-monochrome-rough-four-panel-board",
  formatSpecificValidation: [
    "all four panels present exactly once",
    "canonical reading order is causally legible",
    "camera angle and distance are legible",
    "movement direction is consistent",
    "within-panel and cross-panel spatial relationships are legible",
    "Narrative invariants remain visibly preserved",
    "first-time viewer can read the selected Narrative structure movement without prose",
    "final meaning states do not appear before their causal visible turn",
    "consequential props connect as one readable mechanism chain from cause to result",
    "actor/token sight-lines, contact points, pull-lines, or alignments connect action to effect",
  ],
});

const FORMAT_CONTRACT_KEYS = Object.freeze([
  "formatId",
  "formatVersion",
  "unitKind",
  "unitCount",
  "canvasOrSequenceGeometry",
  "canonicalOrder",
  "continuityRequirements",
  "textPolicy",
  "storyboardBlueprintType",
  "formatSpecificValidation",
]);

const SOURCE_CONTRACT_KEYS = Object.freeze([
  "sourceFacts",
  "supportedInferences",
  "inventions",
  "preservedAmbiguities",
  "invariants",
]);

const NARRATIVE_PROVENANCE_KEYS = Object.freeze([
  "briefFingerprint",
  "referenceIds",
  "authorKind",
  "authorRole",
  "effectiveAuthorModel",
  "reviewPass",
]);

const OUTPUT_INPUT_KEYS = Object.freeze(["storyboardHandoff", "outputStyle"]);
const ADAPTATION_INPUT_KEYS = Object.freeze([
  "narrativeSpec",
  "formatContract",
  "adaptationVariant",
]);
const STORYBOARD_APPROVAL_KEYS = Object.freeze([
  "attemptCount",
  "storyboardRasterSha256",
  "validationEvidence",
]);
const STORYBOARD_EVIDENCE_KEYS = Object.freeze(["gate", "passed", "evidence"]);

const NARRATIVE_FORBIDDEN_KEYS = new Set([
  "formatid",
  "formatversion",
  "unitkind",
  "unitcount",
  "panelcount",
  "pagecount",
  "shotcount",
  "durationtarget",
  "camera",
  "cameraangle",
  "cameradistance",
  "crop",
  "lens",
  "blocking",
  "screendirection",
  "layout",
  "gutters",
  "aspectratio",
  "readingorder",
  "storyboard",
  "storyboardinstructions",
  "medium",
  "palette",
  "texture",
  "lighting",
  "compositionstyle",
  "render",
  "renderresolution",
  "outputstyle",
  "adaptationvariant",
]);

const HANDOFF_FORBIDDEN_KEYS = new Set([
  "narrativespec",
  "storybrief",
  "sourcecontract",
  "adaptationspec",
  "changeledger",
  "discardedalternatives",
  "jokemeaning",
  "rawreferences",
  "rationale",
]);

function assertRecord(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertClosedRecord(value, allowedKeys, label) {
  assertRecord(value, label);
  const allowed = new Set(allowedKeys);
  const missing = allowedKeys.filter((key) => !(key in value));
  const extra = Object.keys(value).filter((key) => !allowed.has(key));
  if (missing.length > 0) throw new Error(`${label} missing keys: ${missing.join(", ")}`);
  if (extra.length > 0) throw new Error(`${label} has forbidden keys: ${extra.join(", ")}`);
}

function assertIntegerVariant(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    throw new Error(`${label} must be an integer from 0 to 999: ${value}`);
  }
}

function assertNoForbiddenKeys(value, forbiddenKeys, label, path = label) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(
      item,
      forbiddenKeys,
      label,
      `${path}[${index}]`,
    ));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key.toLowerCase())) {
      throw new Error(`${label} contains forbidden key at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, forbiddenKeys, label, `${path}.${key}`);
  }
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, stableValue(value[key])]),
  );
}

export function fingerprint(label, value) {
  return createHash("sha256")
    .update(`${label}|${JSON.stringify(stableValue(value))}`)
    .digest("hex")
    .slice(0, 24);
}

export function validateNarrativeSpec(value) {
  assertClosedRecord(value, NARRATIVE_SPEC_KEYS, "NarrativeSpec");
  assertClosedRecord(value.sourceContract, SOURCE_CONTRACT_KEYS, "NarrativeSpec.sourceContract");
  assertClosedRecord(value.provenance, NARRATIVE_PROVENANCE_KEYS, "NarrativeSpec.provenance");
  assertNoForbiddenKeys(value, NARRATIVE_FORBIDDEN_KEYS, "NarrativeSpec");
  return value;
}

export function validateFormatContract(value) {
  assertClosedRecord(value, FORMAT_CONTRACT_KEYS, "FormatContract");
  if (!value.formatId || !Number.isInteger(value.formatVersion) || value.formatVersion < 1) {
    throw new Error("FormatContract must have a formatId and positive integer formatVersion");
  }
  if (!Number.isInteger(value.unitCount) || value.unitCount < 1) {
    throw new Error("FormatContract.unitCount must be a positive integer");
  }
  return value;
}

export function validateAdaptationInput(value) {
  assertClosedRecord(value, ADAPTATION_INPUT_KEYS, "AdaptationInput");
  validateNarrativeSpec(value.narrativeSpec);
  validateFormatContract(value.formatContract);
  assertIntegerVariant(value.adaptationVariant, "adaptationVariant");
  return value;
}

export function validateStoryboardHandoff(value) {
  assertClosedRecord(value, STORYBOARD_HANDOFF_KEYS, "StoryboardHandoff");
  assertNoForbiddenKeys(value, HANDOFF_FORBIDDEN_KEYS, "StoryboardHandoff");
  return value;
}

export function validateStoryboardApproval(value) {
  assertClosedRecord(value, STORYBOARD_APPROVAL_KEYS, "StoryboardApproval");
  if (!Number.isInteger(value.attemptCount) || value.attemptCount < 1 || value.attemptCount > 2) {
    throw new Error("blocked: storyboard-validation-failed (attemptCount must be 1 or 2)");
  }
  if (typeof value.storyboardRasterSha256 !== "string" || !value.storyboardRasterSha256) {
    throw new Error("blocked: storyboard-validation-failed (missing storyboard raster hash)");
  }
  if (!Array.isArray(value.validationEvidence)) {
    throw new Error("blocked: storyboard-validation-failed (validationEvidence must be an array)");
  }
  const byGate = new Map();
  for (const item of value.validationEvidence) {
    assertClosedRecord(item, STORYBOARD_EVIDENCE_KEYS, "StoryboardApproval.validationEvidence");
    if (!STORYBOARD_VALIDATION_GATES.includes(item.gate) || byGate.has(item.gate)) {
      throw new Error(`blocked: storyboard-validation-failed (unknown or duplicate gate: ${item.gate})`);
    }
    if (item.passed !== true || typeof item.evidence !== "string" || !item.evidence.trim()) {
      throw new Error(`blocked: storyboard-validation-failed (${item.gate})`);
    }
    byGate.set(item.gate, item);
  }
  const missing = STORYBOARD_VALIDATION_GATES.filter((gate) => !byGate.has(gate));
  if (missing.length > 0) {
    throw new Error(`blocked: storyboard-validation-failed (missing gates: ${missing.join(", ")})`);
  }
  return {
    ...value,
    validationFingerprint: fingerprint("StoryboardApproval", value),
  };
}

export function validateOutputStyle(value) {
  assertClosedRecord(value, OUTPUT_STYLE_KEYS, "OutputStyle");
  return value;
}

export function validateOutputInput(value) {
  assertClosedRecord(value, OUTPUT_INPUT_KEYS, "OutputInput");
  validateStoryboardHandoff(value.storyboardHandoff);
  validateOutputStyle(value.outputStyle);
  return value;
}

export function deriveEngineFingerprints({
  narrativeSpec,
  formatContract,
  adaptationVariant,
  storyboardHandoff,
  outputStyle,
}) {
  validateNarrativeSpec(narrativeSpec);
  validateFormatContract(formatContract);
  assertIntegerVariant(adaptationVariant, "adaptationVariant");
  validateStoryboardHandoff(storyboardHandoff);
  validateOutputStyle(outputStyle);
  const narrativeFingerprint = fingerprint("NarrativeSpec", narrativeSpec);
  const formatFingerprint = fingerprint("FormatContract", formatContract);
  const adaptationFingerprint = fingerprint("Adaptation", {
    narrativeFingerprint,
    formatFingerprint,
    adaptationVariant,
  });
  const handoffFingerprint = fingerprint("StoryboardHandoff", storyboardHandoff);
  const outputStyleFingerprint = fingerprint("OutputStyle", outputStyle);
  const outputFingerprint = fingerprint("Output", {
    adaptationFingerprint,
    handoffFingerprint,
    outputStyleFingerprint,
  });
  return {
    narrativeFingerprint,
    formatFingerprint,
    adaptationFingerprint,
    handoffFingerprint,
    outputStyleFingerprint,
    outputFingerprint,
  };
}

export function buildClosedOutputInput(storyboardHandoff, outputStyle) {
  return validateOutputInput({ storyboardHandoff, outputStyle });
}
