#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN_ROOT = path.resolve(SKILL_ROOT, "../..");
const ENTRY_ID_V1 = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-v[0-9]+-[a-z0-9._-]+$/;
const ENTRY_ID_V2 = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-v[0-9]+-a[0-9]+-[a-z0-9._-]+$/;
const ENTRY_ID_V3 = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-v[0-9]+-a[0-9]+-eval-[a-z0-9._-]+$/;
const DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const SEED = /^[a-zA-Z0-9._-]+$/;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const TEXT_FIELDS = [
  "title",
  "emotionArc",
  "scene",
  "medium",
  "compositionRule",
  "directionChoice",
  "punchline",
  "joke",
  "rationale",
  "prompt",
  "sourceSkill",
  "generatedAt",
];
const ENGINE_PROVENANCE_KEYS = ["contractVersion", "narrative", "adaptation", "output"];
const NARRATIVE_PROVENANCE_KEYS = [
  "schemaVersion",
  "seedFingerprint",
  "artifactFingerprint",
  "authorKind",
  "authorRole",
  "effectiveModel",
  "prompt",
];
const ADAPTATION_PROVENANCE_KEYS = [
  "schemaVersion",
  "variant",
  "seedFingerprint",
  "inputFingerprint",
  "artifactFingerprint",
  "storyboardAttemptCount",
  "validationFingerprint",
  "storyboardRasterSha256",
  "prompt",
];
const OUTPUT_PROVENANCE_KEYS = [
  "schemaVersion",
  "styleId",
  "inputFingerprint",
  "artifactFingerprint",
  "effectiveModel",
  "prompt",
];
const ADAPTATION_EVAL_KEYS = [
  "schemaVersion",
  "caseId",
  "caseTitle",
  "caseKind",
  "expectedOutcome",
  "actualOutcome",
  "focusGates",
  "setup",
  "verdict",
  "findings",
];
const ADAPTATION_EVAL_FINDING_KEYS = ["gate", "passed", "evidence"];
const VISUALIZATION_PROVENANCE_KEYS = [
  "schemaVersion",
  "contractVersion",
  "exactEvaluationPrompt",
  "exactImagePrompt",
];
const PROCESS_ARTIFACT_SOURCE_KEYS = [
  "schemaVersion",
  "layer",
  "role",
  "title",
  "description",
  "sourcePath",
];
const PROCESS_ARTIFACT_STORED_KEYS = [
  "schemaVersion",
  "layer",
  "role",
  "title",
  "description",
  "filename",
  "sha256",
  "bytes",
];
const PROCESS_ARTIFACT_LAYERS = new Set(["narrative", "adaptation", "styling"]);
const STYLING_HANDOFF_KEYS = [
  "schemaVersion",
  "summary",
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
];
const STYLING_HANDOFF_UNIT_KEYS = ["unit", "state"];
const ADAPTATION_EVAL_CASE_KINDS = new Set(["positive", "negative", "comparison", "diagnostic"]);
const ADAPTATION_EVAL_OUTCOMES = new Set(["pass", "fail", "mixed"]);

function usage() {
  return `Usage:
  manage-gallery.mjs root [--root <path>]
  manage-gallery.mjs list [--root <path>]
  manage-gallery.mjs render [--root <path>]
  manage-gallery.mjs add --image <path> --metadata <path> [--root <path>]`;
}

function parseArgs(argv) {
  const [command, ...tokens] = argv;
  const args = { command, root: "", image: "", metadata: "" };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--root") args.root = requiredValue(tokens, ++index, token);
    else if (token === "--image") args.image = requiredValue(tokens, ++index, token);
    else if (token === "--metadata") args.metadata = requiredValue(tokens, ++index, token);
    else if (token === "-h" || token === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else throw new Error(`unknown argument: ${token}`);
  }
  if (!command || !["root", "list", "render", "add"].includes(command)) {
    throw new Error(usage());
  }
  return args;
}

function requiredValue(tokens, index, flag) {
  const value = tokens[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}

function galleryRoot(explicitRoot = "", create = false) {
  if (explicitRoot) {
    const root = path.resolve(explicitRoot);
    if (create) mkdirSync(root, { recursive: true });
    return root;
  }
  const shim = path.join(PLUGIN_ROOT, "bin", "knitten-resolve-output");
  const args = create
    ? ["--create", "knitten-gallery-root"]
    : ["knitten-gallery-root"];
  const result = spawnSync(shim, args, {
    cwd: PLUGIN_ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Knitten gallery output resolution failed").trim());
  }
  const resolved = JSON.parse(result.stdout);
  if (resolved.ok !== true || !resolved.absolutePath) {
    throw new Error("Knitten gallery output resolver returned no absolutePath");
  }
  return resolved.absolutePath;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be non-empty text`);
  return value;
}

function validCalendarDate(value) {
  if (!DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function requireClosedRecord(value, keys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  const allowed = new Set(keys);
  const missing = keys.filter((key) => !(key in value));
  const extra = Object.keys(value).filter((key) => !allowed.has(key));
  if (missing.length > 0) throw new Error(`${field} missing keys: ${missing.join(", ")}`);
  if (extra.length > 0) throw new Error(`${field} has unknown keys: ${extra.join(", ")}`);
}

function normalizeEngineRecord(record, keys, field, integerFields = []) {
  requireClosedRecord(record, keys, field);
  const normalized = { ...record };
  for (const key of keys) {
    if (integerFields.includes(key)) {
      if (!Number.isInteger(normalized[key]) || normalized[key] < 0) {
        throw new Error(`${field}.${key} must be a non-negative integer`);
      }
    } else if (key !== "schemaVersion") {
      normalized[key] = requireText(normalized[key], `${field}.${key}`);
    }
  }
  if (!Number.isInteger(normalized.schemaVersion) || normalized.schemaVersion < 1) {
    throw new Error(`${field}.schemaVersion must be a positive integer`);
  }
  return normalized;
}

function normalizeEngineProvenance(value, adaptationVariant) {
  requireClosedRecord(value, ENGINE_PROVENANCE_KEYS, "metadata.engineProvenance");
  const normalized = {
    contractVersion: requireText(value.contractVersion, "metadata.engineProvenance.contractVersion"),
    narrative: normalizeEngineRecord(
      value.narrative,
      NARRATIVE_PROVENANCE_KEYS,
      "metadata.engineProvenance.narrative",
    ),
    adaptation: normalizeEngineRecord(
      value.adaptation,
      ADAPTATION_PROVENANCE_KEYS,
      "metadata.engineProvenance.adaptation",
      ["variant", "storyboardAttemptCount"],
    ),
    output: normalizeEngineRecord(
      value.output,
      OUTPUT_PROVENANCE_KEYS,
      "metadata.engineProvenance.output",
    ),
  };
  if (normalized.adaptation.variant !== adaptationVariant) {
    throw new Error("metadata engine adaptation variant does not match metadata adaptationVariant");
  }
  return normalized;
}

function requireStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${field} must be a non-empty array`);
  }
  return value.map((item, index) => requireText(item, `${field}[${index}]`));
}

function normalizeAdaptationEval(value) {
  requireClosedRecord(value, ADAPTATION_EVAL_KEYS, "metadata.adaptationEval");
  const normalized = {
    schemaVersion: value.schemaVersion,
    caseId: requireText(value.caseId, "metadata.adaptationEval.caseId"),
    caseTitle: requireText(value.caseTitle, "metadata.adaptationEval.caseTitle"),
    caseKind: requireText(value.caseKind, "metadata.adaptationEval.caseKind"),
    expectedOutcome: requireText(value.expectedOutcome, "metadata.adaptationEval.expectedOutcome"),
    actualOutcome: requireText(value.actualOutcome, "metadata.adaptationEval.actualOutcome"),
    focusGates: requireStringArray(value.focusGates, "metadata.adaptationEval.focusGates"),
    setup: requireText(value.setup, "metadata.adaptationEval.setup"),
    verdict: requireText(value.verdict, "metadata.adaptationEval.verdict"),
    findings: value.findings,
  };
  if (normalized.schemaVersion !== 1) {
    throw new Error("metadata.adaptationEval.schemaVersion must be 1");
  }
  if (!SEED.test(normalized.caseId)) {
    throw new Error("metadata.adaptationEval.caseId must be a safe stable token");
  }
  if (!ADAPTATION_EVAL_CASE_KINDS.has(normalized.caseKind)) {
    throw new Error("metadata.adaptationEval.caseKind must be positive, negative, comparison, or diagnostic");
  }
  if (!ADAPTATION_EVAL_OUTCOMES.has(normalized.expectedOutcome)) {
    throw new Error("metadata.adaptationEval.expectedOutcome must be pass, fail, or mixed");
  }
  if (!ADAPTATION_EVAL_OUTCOMES.has(normalized.actualOutcome)) {
    throw new Error("metadata.adaptationEval.actualOutcome must be pass, fail, or mixed");
  }
  if (!Array.isArray(normalized.findings) || normalized.findings.length === 0) {
    throw new Error("metadata.adaptationEval.findings must be a non-empty array");
  }
  normalized.findings = normalized.findings.map((finding, index) => {
    const field = `metadata.adaptationEval.findings[${index}]`;
    requireClosedRecord(finding, ADAPTATION_EVAL_FINDING_KEYS, field);
    if (typeof finding.passed !== "boolean") {
      throw new Error(`${field}.passed must be boolean`);
    }
    return {
      gate: requireText(finding.gate, `${field}.gate`),
      passed: finding.passed,
      evidence: requireText(finding.evidence, `${field}.evidence`),
    };
  });
  return normalized;
}

function normalizeVisualizationProvenance(value) {
  requireClosedRecord(value, VISUALIZATION_PROVENANCE_KEYS, "metadata.visualizationProvenance");
  const normalized = {
    schemaVersion: value.schemaVersion,
    contractVersion: requireText(value.contractVersion, "metadata.visualizationProvenance.contractVersion"),
    exactEvaluationPrompt: requireText(
      value.exactEvaluationPrompt,
      "metadata.visualizationProvenance.exactEvaluationPrompt",
    ),
    exactImagePrompt: requireText(
      value.exactImagePrompt,
      "metadata.visualizationProvenance.exactImagePrompt",
    ),
  };
  if (normalized.schemaVersion !== 1) {
    throw new Error("metadata.visualizationProvenance.schemaVersion must be 1");
  }
  return normalized;
}

function normalizeProcessArtifact(value, index) {
  const hasSourcePath = Object.hasOwn(value || {}, "sourcePath");
  const field = `metadata.processArtifacts[${index}]`;
  requireClosedRecord(
    value,
    hasSourcePath ? PROCESS_ARTIFACT_SOURCE_KEYS : PROCESS_ARTIFACT_STORED_KEYS,
    field,
  );
  const normalized = {
    schemaVersion: value.schemaVersion,
    layer: requireText(value.layer, `${field}.layer`),
    role: requireText(value.role, `${field}.role`),
    title: requireText(value.title, `${field}.title`),
    description: requireText(value.description, `${field}.description`),
  };
  if (normalized.schemaVersion !== 1) {
    throw new Error(`${field}.schemaVersion must be 1`);
  }
  if (!PROCESS_ARTIFACT_LAYERS.has(normalized.layer)) {
    throw new Error(`${field}.layer must be narrative, adaptation, or styling`);
  }
  if (!SEED.test(normalized.role)) {
    throw new Error(`${field}.role must be a safe stable token`);
  }
  if (hasSourcePath) {
    return {
      ...normalized,
      sourcePath: requireText(value.sourcePath, `${field}.sourcePath`),
    };
  }
  const filename = requireText(value.filename, `${field}.filename`);
  const extension = path.extname(filename).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension) || path.basename(filename) !== filename) {
    throw new Error(`${field}.filename must be a supported gallery asset filename`);
  }
  if (!/^[a-f0-9]{64}$/.test(value.sha256 || "")) {
    throw new Error(`${field}.sha256 must be a sha256 hex digest`);
  }
  if (!Number.isInteger(value.bytes) || value.bytes < 1) {
    throw new Error(`${field}.bytes must be a positive integer`);
  }
  return {
    ...normalized,
    filename,
    sha256: value.sha256,
    bytes: value.bytes,
  };
}

function normalizeProcessArtifacts(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error("metadata.processArtifacts must be an array");
  return value.map(normalizeProcessArtifact);
}

function normalizeStylingHandoff(value) {
  if (value === undefined) return undefined;
  requireClosedRecord(value, STYLING_HANDOFF_KEYS, "metadata.stylingHandoff");
  const normalized = {
    schemaVersion: value.schemaVersion,
    summary: requireText(value.summary, "metadata.stylingHandoff.summary"),
    visibleSubjects: requireStringArray(value.visibleSubjects, "metadata.stylingHandoff.visibleSubjects"),
    environmentFacts: requireStringArray(value.environmentFacts, "metadata.stylingHandoff.environmentFacts"),
    unitStates: value.unitStates,
    continuityTokens: requireStringArray(value.continuityTokens, "metadata.stylingHandoff.continuityTokens"),
    causalCarrier: requireText(value.causalCarrier, "metadata.stylingHandoff.causalCarrier"),
    lockedCamera: requireText(value.lockedCamera, "metadata.stylingHandoff.lockedCamera"),
    lockedMovement: requireText(value.lockedMovement, "metadata.stylingHandoff.lockedMovement"),
    lockedOrder: requireStringArray(value.lockedOrder, "metadata.stylingHandoff.lockedOrder"),
    lockedSpatialRelationships: requireStringArray(
      value.lockedSpatialRelationships,
      "metadata.stylingHandoff.lockedSpatialRelationships",
    ),
    emotionalTrajectoryAsVisibleState: requireText(
      value.emotionalTrajectoryAsVisibleState,
      "metadata.stylingHandoff.emotionalTrajectoryAsVisibleState",
    ),
    finalVisualResidue: requireText(value.finalVisualResidue, "metadata.stylingHandoff.finalVisualResidue"),
    permittedFinishFlex: requireStringArray(
      value.permittedFinishFlex,
      "metadata.stylingHandoff.permittedFinishFlex",
    ),
  };
  if (normalized.schemaVersion !== 1) {
    throw new Error("metadata.stylingHandoff.schemaVersion must be 1");
  }
  if (!Array.isArray(normalized.unitStates) || normalized.unitStates.length === 0) {
    throw new Error("metadata.stylingHandoff.unitStates must be a non-empty array");
  }
  normalized.unitStates = normalized.unitStates.map((unitState, index) => {
    const field = `metadata.stylingHandoff.unitStates[${index}]`;
    requireClosedRecord(unitState, STYLING_HANDOFF_UNIT_KEYS, field);
    return {
      unit: requireText(unitState.unit, `${field}.unit`),
      state: requireText(unitState.state, `${field}.state`),
    };
  });
  return normalized;
}

export function normalizeMetadata(raw) {
  if (!raw || ![1, 2, 3].includes(raw.schemaVersion)) {
    throw new Error("metadata schemaVersion must be 1, 2, or 3");
  }
  const metadata = { ...raw };
  const entryPattern = metadata.schemaVersion === 3
    ? ENTRY_ID_V3
    : metadata.schemaVersion === 2
      ? ENTRY_ID_V2
      : ENTRY_ID_V1;
  if (!entryPattern.test(metadata.id || "")) throw new Error("metadata id has an invalid daily entry shape");
  if (!validCalendarDate(metadata.date || "")) throw new Error("metadata date must be a real YYYY-MM-DD date");
  if (!metadata.id.startsWith(`${metadata.date}-v`)) throw new Error("metadata id must start with date and variant");
  if (!Number.isInteger(metadata.variant) || metadata.variant < 0) {
    throw new Error("metadata variant must be a non-negative integer");
  }
  if (!metadata.id.startsWith(`${metadata.date}-v${metadata.variant}-`)) {
    throw new Error("metadata id variant does not match metadata variant");
  }
  if (!SEED.test(metadata.seedFingerprint || "")) {
    throw new Error("metadata seedFingerprint must be a safe stable token");
  }
  for (const field of TEXT_FIELDS) metadata[field] = requireText(metadata[field], field);
  if (Number.isNaN(Date.parse(metadata.generatedAt))) throw new Error("metadata generatedAt must be an ISO timestamp");
  if (metadata.schemaVersion >= 2) {
    if (!Number.isInteger(metadata.narrativeVariant) || metadata.narrativeVariant < 0) {
      throw new Error("metadata narrativeVariant must be a non-negative integer");
    }
    if (metadata.narrativeVariant !== metadata.variant) {
      throw new Error("metadata narrativeVariant must match metadata variant");
    }
    if (!Number.isInteger(metadata.adaptationVariant) || metadata.adaptationVariant < 0) {
      throw new Error("metadata adaptationVariant must be a non-negative integer");
    }
    if (!metadata.id.startsWith(
      `${metadata.date}-v${metadata.narrativeVariant}-a${metadata.adaptationVariant}-`,
    )) {
      throw new Error("metadata id adaptation variant does not match metadata adaptationVariant");
    }
    metadata.formatId = requireText(metadata.formatId, "metadata.formatId");
  }
  if (metadata.schemaVersion === 2) {
    metadata.engineProvenance = normalizeEngineProvenance(
      metadata.engineProvenance,
      metadata.adaptationVariant,
    );
    metadata.processArtifacts = normalizeProcessArtifacts(metadata.processArtifacts);
    metadata.stylingHandoff = normalizeStylingHandoff(metadata.stylingHandoff);
  } else if (metadata.schemaVersion === 3) {
    metadata.adaptationEval = normalizeAdaptationEval(metadata.adaptationEval);
    if (!metadata.id.startsWith(
      `${metadata.date}-v${metadata.narrativeVariant}-a${metadata.adaptationVariant}-eval-${metadata.adaptationEval.caseId}`,
    )) {
      throw new Error("metadata id eval case does not match metadata.adaptationEval.caseId");
    }
    metadata.visualizationProvenance = normalizeVisualizationProvenance(metadata.visualizationProvenance);
  }
  return metadata;
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function prepareProcessArtifacts(root, entryId, processArtifacts = []) {
  return processArtifacts.map((artifact) => {
    if (!Object.hasOwn(artifact, "sourcePath")) {
      return { entry: artifact, sourcePath: "", destinationPath: "" };
    }
    const sourcePath = path.resolve(artifact.sourcePath);
    if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
      throw new Error(`process artifact image does not exist: ${sourcePath}`);
    }
    const extension = path.extname(sourcePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) throw new Error(`unsupported process artifact extension: ${extension}`);
    const filename = `${entryId}--${artifact.layer}-${artifact.role}${extension}`;
    const destinationPath = path.join(root, "assets", filename);
    return {
      entry: {
        schemaVersion: artifact.schemaVersion,
        layer: artifact.layer,
        role: artifact.role,
        title: artifact.title,
        description: artifact.description,
        filename,
        sha256: sha256(sourcePath),
        bytes: statSync(sourcePath).size,
      },
      sourcePath,
      destinationPath,
    };
  });
}

function copyPreparedProcessArtifacts(preparedArtifacts) {
  for (const artifact of preparedArtifacts) {
    if (artifact.sourcePath) copyFileSync(artifact.sourcePath, artifact.destinationPath);
  }
}

function processArtifactsExist(root, processArtifacts = []) {
  return processArtifacts.every((artifact) => {
    const imagePath = path.join(root, "assets", artifact.filename);
    return existsSync(imagePath) && sha256(imagePath) === artifact.sha256;
  });
}

function stableMetadata(entry) {
  const selected = {
    schemaVersion: entry.schemaVersion,
    id: entry.id,
    date: entry.date,
    variant: entry.variant,
    seedFingerprint: entry.seedFingerprint,
  };
  for (const field of TEXT_FIELDS) selected[field] = entry[field];
  if (entry.schemaVersion === 2) {
    selected.narrativeVariant = entry.narrativeVariant;
    selected.adaptationVariant = entry.adaptationVariant;
    selected.formatId = entry.formatId;
    selected.engineProvenance = entry.engineProvenance;
    if (entry.processArtifacts) selected.processArtifacts = entry.processArtifacts;
    if (entry.stylingHandoff) selected.stylingHandoff = entry.stylingHandoff;
  } else if (entry.schemaVersion === 3) {
    selected.narrativeVariant = entry.narrativeVariant;
    selected.adaptationVariant = entry.adaptationVariant;
    selected.formatId = entry.formatId;
    selected.adaptationEval = entry.adaptationEval;
    selected.visualizationProvenance = entry.visualizationProvenance;
  }
  return selected;
}

function entryFiles(root) {
  const entriesRoot = path.join(root, "entries");
  if (!existsSync(entriesRoot)) return [];
  return readdirSync(entriesRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(entriesRoot, name));
}

export function loadEntries(root) {
  return entryFiles(root)
    .map((file) => readJson(file))
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderProcessRows(rows) {
  return rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([label, value]) => `
            <div class="process-row">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>`)
    .join("");
}

function renderProcessArtifacts(artifacts = []) {
  if (artifacts.length === 0) return "";
  const figures = artifacts.map((artifact) => {
    const asset = `assets/${encodeURIComponent(artifact.filename)}`;
    return `
            <figure class="process-artifact">
              <img src="${asset}" alt="${escapeHtml(artifact.title)}">
              <figcaption>
                <strong>${escapeHtml(artifact.title)}</strong>
                <span>${escapeHtml(artifact.description)}</span>
              </figcaption>
            </figure>`;
  }).join("");
  return `
          <div class="process-artifacts">
            ${figures}
          </div>`;
}

function renderListItems(items = []) {
  return items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function renderStylingHandoff(handoff) {
  if (!handoff) return "";
  const unitStates = handoff.unitStates
    .map((unitState) => `
              <li>
                <strong>${escapeHtml(unitState.unit)}</strong>
                <span>${escapeHtml(unitState.state)}</span>
              </li>`)
    .join("");
  return `
          <details class="handoff-details">
            <summary>각색에서 스타일링으로 넘긴 UI 명세</summary>
            <p>${escapeHtml(handoff.summary)}</p>
            <div class="handoff-grid">
              <section>
                <h4>인물·오브젝트</h4>
                <ul>${renderListItems(handoff.visibleSubjects)}</ul>
              </section>
              <section>
                <h4>배경·공간</h4>
                <ul>${renderListItems(handoff.environmentFacts)}</ul>
              </section>
              <section>
                <h4>컷별 상태</h4>
                <ol>${unitStates}</ol>
              </section>
              <section>
                <h4>잠금 규칙</h4>
                <ul>
                  <li>${escapeHtml(handoff.lockedCamera)}</li>
                  <li>${escapeHtml(handoff.lockedMovement)}</li>
                  ${renderListItems(handoff.lockedSpatialRelationships)}
                </ul>
              </section>
              <section>
                <h4>연속성과 원인</h4>
                <ul>
                  <li>${escapeHtml(handoff.causalCarrier)}</li>
                  ${renderListItems(handoff.continuityTokens)}
                </ul>
              </section>
              <section>
                <h4>스타일링 허용 범위</h4>
                <ul>${renderListItems(handoff.permittedFinishFlex)}</ul>
              </section>
            </div>
            <div class="handoff-residue">
              <strong>감정 상태</strong>
              <span>${escapeHtml(handoff.emotionalTrajectoryAsVisibleState)}</span>
            </div>
            <div class="handoff-residue">
              <strong>최종 잔여물</strong>
              <span>${escapeHtml(handoff.finalVisualResidue)}</span>
            </div>
          </details>`;
}

function renderProcessStep({ badge, title, overview, rows, artifacts, promptLabel, prompt }) {
  return `
        <details class="process-step">
          <summary>
            <span class="step-badge">${escapeHtml(badge)}</span>
            <span class="step-title">${escapeHtml(title)}</span>
            <span class="step-overview">${escapeHtml(overview)}</span>
          </summary>
          <div class="process-grid">
            ${renderProcessRows(rows)}
          </div>
          ${renderProcessArtifacts(artifacts)}
          <details class="layer-prompt">
            <summary>${escapeHtml(promptLabel)}</summary>
            <pre>${escapeHtml(prompt)}</pre>
          </details>
        </details>`;
}

function renderEngineProcess(entry) {
  const provenance = entry.engineProvenance;
  const processArtifacts = entry.processArtifacts || [];
  const artifactsFor = (layer) => processArtifacts.filter((artifact) => artifact.layer === layer);
  return `
        <section class="process" aria-label="three engine process">
          <div class="process-heading">
            <h3>제작 과정</h3>
            <span>${escapeHtml(entry.formatId)}</span>
          </div>
          ${renderProcessStep({
            badge: "Narrative",
            title: "이야기 계층",
            overview: "형식과 화풍을 고르기 전에 원인, 감정 이동, 이야기 불변식을 고정합니다.",
            rows: [
              ["seed", provenance.narrative.seedFingerprint],
              ["artifact", provenance.narrative.artifactFingerprint],
              ["author", `${provenance.narrative.authorRole} · ${provenance.narrative.effectiveModel}`],
            ],
            artifacts: artifactsFor("narrative"),
            promptLabel: "Narrative prompt",
            prompt: provenance.narrative.prompt,
          })}
          ${renderProcessStep({
            badge: "Adaptation",
            title: "각색 계층",
            overview: "네컷의 순서, 화면 구성, 움직임, rough storyboard 검증을 맡습니다.",
            rows: [
              ["variant", provenance.adaptation.variant],
              ["seed", provenance.adaptation.seedFingerprint],
              ["input", provenance.adaptation.inputFingerprint],
              ["artifact", provenance.adaptation.artifactFingerprint],
              ["attempts", provenance.adaptation.storyboardAttemptCount],
              ["validation", provenance.adaptation.validationFingerprint],
              ["storyboard", provenance.adaptation.storyboardRasterSha256],
            ],
            artifacts: artifactsFor("adaptation"),
            promptLabel: "Adaptation + Storyboard prompt",
            prompt: provenance.adaptation.prompt,
          })}
          ${renderProcessStep({
            badge: "Styling",
            title: "스타일링 계층",
            overview: "승인된 StoryboardHandoff와 OutputStyle만 사용해 최종 화면 질감을 입힙니다.",
            rows: [
              ["style", provenance.output.styleId],
              ["input", provenance.output.inputFingerprint],
              ["artifact", provenance.output.artifactFingerprint],
              ["model", provenance.output.effectiveModel],
            ],
            artifacts: artifactsFor("styling"),
            promptLabel: "Output prompt",
            prompt: provenance.output.prompt,
          })}
          ${renderStylingHandoff(entry.stylingHandoff)}
          <details class="process-json">
            <summary>전체 provenance JSON</summary>
            <pre>${escapeHtml(JSON.stringify(provenance, null, 2))}</pre>
          </details>
        </section>`;
}

function renderEntry(entry) {
  const asset = `assets/${encodeURIComponent(entry.image.filename)}`;
  const variantLabel = entry.schemaVersion >= 2
    ? `narrative ${entry.narrativeVariant} · adaptation ${entry.adaptationVariant}`
    : `variant ${entry.variant}`;
  const extraDetails = entry.schemaVersion === 2
    ? renderEngineProcess(entry)
    : entry.schemaVersion === 3
      ? `
        <details>
          <summary>각색 시각화 테스트</summary>
          <h3>${escapeHtml(entry.adaptationEval.caseTitle)}</h3>
          <p>${escapeHtml(entry.adaptationEval.verdict)}</p>
          <pre>${escapeHtml(JSON.stringify(entry.adaptationEval, null, 2))}</pre>
          <h3>Evaluation prompt</h3>
          <pre>${escapeHtml(entry.visualizationProvenance.exactEvaluationPrompt)}</pre>
          <h3>Image prompt</h3>
          <pre>${escapeHtml(entry.visualizationProvenance.exactImagePrompt)}</pre>
        </details>`
    : "";
  return `
    <article class="card">
      <div class="visual"><img src="${asset}" alt="${escapeHtml(entry.title)}"></div>
      <div class="story">
        <div class="eyebrow"><time datetime="${escapeHtml(entry.date)}">${escapeHtml(entry.date)}</time><span>${escapeHtml(variantLabel)}</span></div>
        <h2>${escapeHtml(entry.title)}</h2>
        <p class="arc">${escapeHtml(entry.emotionArc)}</p>
        <blockquote>${escapeHtml(entry.joke)}</blockquote>
        <dl>
          <div><dt>왜 이렇게 만들었나</dt><dd>${escapeHtml(entry.rationale)}</dd></div>
          <div><dt>생활 장면</dt><dd>${escapeHtml(entry.scene)}</dd></div>
          <div><dt>화풍</dt><dd>${escapeHtml(entry.medium)}</dd></div>
          <div><dt>화면 규칙</dt><dd>${escapeHtml(entry.compositionRule)}</dd></div>
          <div><dt>연출 선택</dt><dd>${escapeHtml(entry.directionChoice)}</dd></div>
          <div><dt>펀치라인</dt><dd>${escapeHtml(entry.punchline)}</dd></div>
        </dl>
        <details class="prompt-details">
          <summary>실제 생성 프롬프트</summary>
          <pre>${escapeHtml(entry.prompt)}</pre>
        </details>
        ${extraDetails}
        <p class="meta">${escapeHtml(entry.sourceSkill)} · seed ${escapeHtml(entry.seedFingerprint)}</p>
      </div>
    </article>`;
}

function renderHtml(entries) {
  const cards = entries.map(renderEntry).join("\n");
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Knitten Gallery</title>
  <style>
    :root { color-scheme: dark; --ink:#f4eee3; --muted:#aea99f; --paper:#171816; --card:#22231f; --line:#3b3d35; --accent:#d5ff78; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--paper); color:var(--ink); font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    header { max-width:1180px; margin:0 auto; padding:72px 24px 42px; border-bottom:1px solid var(--line); }
    .kicker { color:var(--accent); font-size:.75rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
    h1 { margin:.45rem 0 .7rem; font-family:Georgia,"Times New Roman",serif; font-size:clamp(3rem,8vw,7rem); font-weight:500; line-height:.9; }
    header p { max-width:700px; margin:0; color:var(--muted); font-size:1.05rem; line-height:1.65; }
    main { max-width:1180px; margin:0 auto; padding:48px 24px 96px; display:grid; gap:56px; }
    .card { display:grid; grid-template-columns:minmax(0,1.08fr) minmax(320px,.92fr); overflow:hidden; border:1px solid var(--line); border-radius:24px; background:var(--card); box-shadow:0 22px 70px #0005; }
    .visual { min-height:460px; background:#0c0d0c; }
    .visual img { width:100%; height:100%; display:block; object-fit:cover; }
    .story { padding:clamp(26px,4vw,52px); }
    .eyebrow { display:flex; gap:12px; color:var(--accent); font:700 .72rem/1.2 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.09em; text-transform:uppercase; }
    h2 { margin:16px 0 14px; font-family:Georgia,"Times New Roman",serif; font-size:clamp(2rem,4vw,3.6rem); font-weight:500; line-height:1.05; }
    .arc { color:var(--muted); line-height:1.7; }
    blockquote { margin:28px 0; padding:18px 0 18px 22px; border-left:3px solid var(--accent); font-family:Georgia,"Times New Roman",serif; font-size:1.15rem; line-height:1.65; }
    dl { display:grid; gap:15px; margin:28px 0; }
    dl div { display:grid; grid-template-columns:130px 1fr; gap:14px; padding-top:15px; border-top:1px solid var(--line); }
    dt { color:var(--muted); font-size:.78rem; font-weight:700; }
    dd { margin:0; line-height:1.55; }
    details { margin-top:30px; border-top:1px solid var(--line); padding-top:18px; }
    summary { cursor:pointer; color:var(--accent); font-weight:750; }
    pre { max-height:420px; overflow:auto; margin:16px 0 0; padding:18px; border-radius:12px; background:#10110f; color:#ddd8ce; white-space:pre-wrap; word-break:break-word; font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace; }
    .process { display:grid; gap:10px; margin-top:30px; border-top:1px solid var(--line); padding-top:18px; }
    .process-heading { display:flex; align-items:baseline; justify-content:space-between; gap:14px; }
    .process-heading h3 { margin:0; font-size:.95rem; }
    .process-heading span { color:var(--muted); font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace; }
    .process-step { margin:0; padding:0; border:1px solid var(--line); border-radius:8px; background:#1a1b18; overflow:hidden; }
    .process-step[open] { border-color:#556042; }
    .process-step > summary { display:grid; grid-template-columns:auto minmax(0,1fr); gap:4px 12px; align-items:baseline; padding:14px 16px; }
    .step-badge { color:#10110f; background:var(--accent); border-radius:999px; padding:3px 8px; font:800 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace; text-transform:uppercase; }
    .step-title { color:var(--ink); font-weight:800; }
    .step-overview { grid-column:2; color:var(--muted); font-size:.86rem; line-height:1.5; }
    .process-grid { display:grid; gap:8px; padding:0 16px 14px; }
    .process-row { display:grid; grid-template-columns:112px minmax(0,1fr); gap:12px; padding-top:8px; border-top:1px solid #2c2e28; }
    .process-row span { color:var(--muted); font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
    .process-row strong { min-width:0; overflow-wrap:anywhere; color:#e7e1d6; font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
    .process-artifacts { display:grid; gap:12px; padding:0 16px 14px; }
    .process-artifact { margin:0; border:1px solid #2c2e28; border-radius:8px; overflow:hidden; background:#10110f; }
    .process-artifact img { display:block; width:100%; height:auto; }
    .process-artifact figcaption { display:grid; gap:4px; padding:10px 12px 12px; }
    .process-artifact figcaption strong { color:var(--ink); font-size:.86rem; }
    .process-artifact figcaption span { color:var(--muted); font-size:.8rem; line-height:1.5; }
    .handoff-details { margin:0; border:1px solid var(--line); border-radius:8px; background:#181916; padding:0; overflow:hidden; }
    .handoff-details > summary { padding:14px 16px; }
    .handoff-details > p { margin:0; padding:0 16px 14px; color:var(--muted); font-size:.88rem; line-height:1.6; }
    .handoff-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; padding:0 16px 14px; }
    .handoff-grid section { border-top:1px solid #2c2e28; padding-top:10px; }
    .handoff-grid h4 { margin:0 0 8px; color:var(--ink); font-size:.78rem; }
    .handoff-grid ul, .handoff-grid ol { margin:0; padding-left:18px; color:#ddd8ce; font-size:.78rem; line-height:1.55; }
    .handoff-grid li + li { margin-top:5px; }
    .handoff-grid li strong { display:block; color:var(--accent); font:700 11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
    .handoff-grid li span { color:#ddd8ce; }
    .handoff-residue { display:grid; grid-template-columns:100px minmax(0,1fr); gap:12px; margin:0 16px 12px; padding-top:10px; border-top:1px solid #2c2e28; color:#ddd8ce; font-size:.8rem; line-height:1.55; }
    .handoff-residue strong { color:var(--muted); font:700 11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
    .layer-prompt, .process-json { margin:0 16px 16px; border-top:1px solid #2c2e28; padding-top:12px; }
    .process-json { margin-top:6px; }
    .meta { margin-top:20px; color:#7f8277; font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
    .empty { padding:80px 0; color:var(--muted); }
    @media (max-width:820px) { .card { grid-template-columns:1fr; } .visual { min-height:0; aspect-ratio:4/3; } dl div, .process-row, .handoff-grid, .handoff-residue { grid-template-columns:1fr; gap:6px; } .process-step > summary { grid-template-columns:1fr; } .step-overview { grid-column:auto; } }
  </style>
</head>
<body>
  <header>
    <div class="kicker">Knitten · Daily Emotional Archive</div>
    <h1>Knitten Gallery</h1>
    <p>매일 한 장의 감정, 한 번의 연출 선택, 그리고 실제 생성 프롬프트를 함께 보존합니다. 결과보다 왜 그렇게 만들었는지를 잊지 않기 위한 기록입니다.</p>
  </header>
  <main>${cards || '<p class="empty">아직 기록된 작품이 없습니다.</p>'}</main>
</body>
</html>
`;
}

export function renderGallery(root) {
  mkdirSync(root, { recursive: true });
  const entries = loadEntries(root);
  const index = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };
  const jsonPath = path.join(root, "index.json");
  const htmlPath = path.join(root, "index.html");
  writeFileSync(jsonPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  writeFileSync(htmlPath, renderHtml(entries), "utf8");
  return { root, count: entries.length, jsonPath, htmlPath };
}

export function addEntry({ root, imagePath, metadata }) {
  const normalized = normalizeMetadata(metadata);
  const sourceImage = path.resolve(imagePath);
  if (!existsSync(sourceImage) || !statSync(sourceImage).isFile()) throw new Error(`image does not exist: ${sourceImage}`);
  const extension = path.extname(sourceImage).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) throw new Error(`unsupported image extension: ${extension}`);

  mkdirSync(path.join(root, "assets"), { recursive: true });
  mkdirSync(path.join(root, "entries"), { recursive: true });
  const imageDigest = sha256(sourceImage);
  const imageName = `${normalized.id}${extension}`;
  const destinationImage = path.join(root, "assets", imageName);
  const entryPath = path.join(root, "entries", `${normalized.id}.json`);
  const preparedProcessArtifacts = prepareProcessArtifacts(root, normalized.id, normalized.processArtifacts);
  const entryMetadata = { ...normalized };
  if (preparedProcessArtifacts.length > 0) {
    entryMetadata.processArtifacts = preparedProcessArtifacts.map((artifact) => artifact.entry);
  } else {
    delete entryMetadata.processArtifacts;
  }

  if (existsSync(entryPath)) {
    const existing = readJson(entryPath);
    const sameMetadata = JSON.stringify(stableMetadata(existing)) === JSON.stringify(stableMetadata(entryMetadata));
    if (
      sameMetadata
      && existing.image?.sha256 === imageDigest
      && existsSync(destinationImage)
      && processArtifactsExist(root, existing.processArtifacts)
    ) {
      return { ...renderGallery(root), entryPath, imagePath: destinationImage, idempotent: true };
    }
    throw new Error(`gallery entry already exists with different content: ${normalized.id}`);
  }

  copyFileSync(sourceImage, destinationImage);
  copyPreparedProcessArtifacts(preparedProcessArtifacts);
  const entry = {
    ...entryMetadata,
    recordedAt: new Date().toISOString(),
    image: {
      filename: imageName,
      sha256: imageDigest,
      bytes: statSync(destinationImage).size,
    },
  };
  writeFileSync(entryPath, `${JSON.stringify(entry, null, 2)}\n`, "utf8");
  return { ...renderGallery(root), entryPath, imagePath: destinationImage, idempotent: false };
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const root = galleryRoot(args.root, args.command !== "list" && args.command !== "root");
    let result;
    if (args.command === "root") {
      result = { ok: true, root, htmlPath: path.join(root, "index.html") };
    } else if (args.command === "list") {
      result = { ok: true, root, count: loadEntries(root).length, entries: loadEntries(root) };
    } else if (args.command === "render") {
      result = { ok: true, ...renderGallery(root) };
    } else {
      if (!args.image || !args.metadata) throw new Error("add requires --image and --metadata");
      result = { ok: true, ...addEntry({ root, imagePath: args.image, metadata: readJson(args.metadata) }) };
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
