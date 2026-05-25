#!/usr/bin/env node

const ROUTE_SIGNATURE_FIELDS = [
  "context-profile",
  "domains",
  "repo-keys",
  "task-types",
  "languages",
  "frameworks",
  "work-modes",
  "exclude-when",
];

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function sortedStrings(value) {
  return asArray(value).map(String).sort();
}

function textIncludes(text, value) {
  return text.toLowerCase().includes(String(value).toLowerCase());
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textHasNameToken(text, value) {
  const token = escapeRegExp(value);
  return new RegExp(`(^|[^A-Za-z0-9_-])${token}([^A-Za-z0-9_-]|$)`, "i").test(text);
}

function makeCandidateId(candidate) {
  return [
    candidate.source,
    candidate["pack-id"] || "core",
    candidate["artifact-id"],
    candidate["compatibility-need"] || "none",
    candidate["compatibility-alias-id"] || "none",
  ].join(":");
}

export function routeSignature(route = {}) {
  const signature = {};
  for (const field of ROUTE_SIGNATURE_FIELDS) {
    const values = sortedStrings(route[field]);
    if (values.length > 0) signature[field] = values;
  }
  return signature;
}

function routeSignatureKey(candidate) {
  return JSON.stringify(candidate["route-signature"] || {});
}

function artifactRef(candidate) {
  return candidate["pack-id"] ? `${candidate["pack-id"]}/${candidate["artifact-id"]}` : `core/${candidate["artifact-id"]}`;
}

function scopeMatches(scope = {}, request) {
  const harnesses = asArray(scope["harness-ids"]);
  if (harnesses.length > 0 && !harnesses.includes(request.harnessId)) return false;

  const repoKeys = asArray(scope["repo-keys"]);
  if (repoKeys.length > 0 && !repoKeys.includes(request.cwdRepoKey)) return false;

  const workModes = asArray(scope["work-modes"]);
  if (workModes.length > 0 && !workModes.includes(request.workMode)) return false;

  return true;
}

function visibilityMatches(visibility, workMode) {
  if (!visibility || visibility === "public") return true;
  if (visibility === "company") return workMode === "company";
  if (visibility === "private" || visibility === "local") return workMode === "personal";
  return false;
}

function exactNameMatches(candidate, request) {
  const named = asArray(request.namedArtifact).filter(Boolean);
  const text = request.requestText || "";
  const names = [
    candidate["artifact-id"],
    candidate["candidate-id"],
    candidate["compatibility-alias-id"],
    candidate["matched-compatibility-input"],
  ].filter(Boolean);
  return names.some((name) => named.includes(name) || textHasNameToken(text, name));
}

function pathEvidence(touchedPaths = [], route = {}) {
  const languages = asArray(route.languages);
  if (languages.length === 0) return [];
  const extensionMap = new Map([
    ["javascript", ".js"],
    ["typescript", ".ts"],
    ["markdown", ".md"],
    ["json", ".json"],
    ["rust", ".rs"],
  ]);
  return languages
    .filter((language) => touchedPaths.some((touchedPath) => touchedPath.endsWith(extensionMap.get(language) || `.${language}`)))
    .map((value) => ({ axis: "languages", value }));
}

function routeEvidence(candidate, request) {
  const route = candidate.route || {};
  const text = request.requestText || "";
  const evidence = [];

  for (const value of asArray(route.domains)) {
    if (textIncludes(text, value)) evidence.push({ axis: "domains", value });
  }
  for (const value of asArray(route["task-types"])) {
    if (textIncludes(text, value)) evidence.push({ axis: "task-types", value });
  }
  for (const value of asArray(route["repo-keys"])) {
    if (request.cwdRepoKey === value || textIncludes(text, value)) evidence.push({ axis: "repo-keys", value });
  }
  for (const value of asArray(route["work-modes"])) {
    if (request.workMode === value || textIncludes(text, value)) evidence.push({ axis: "work-modes", value });
  }
  evidence.push(...pathEvidence(request.touchedPaths, route));

  if (exactNameMatches(candidate, request)) {
    evidence.push({ axis: "exact-name", value: candidate["matched-compatibility-input"] || candidate["artifact-id"] });
  }

  return evidence;
}

function hasExcludedDomain(candidate, evidence, requestText) {
  const excluded = new Set(asArray(candidate.route?.["exclude-when"]));
  return evidence.some((item) => item.axis === "domains" && excluded.has(item.value)) ||
    [...excluded].some((value) => textIncludes(requestText, value));
}

function candidateFromIndex(row, indexEntry, manifest, compatibility = null) {
  const exportRow = (manifest?.exports || []).find((entry) => entry["artifact-id"] === indexEntry["artifact-id"]) || {};
  const compatibilityNeed = compatibility?.["compatibility-need"] || "none";
  const artifactPathRef = compatibilityNeed === "shim" && compatibility?.["shim-path"]
    ? compatibility["shim-path"]
    : indexEntry["source-ref"] || artifactRef(indexEntry);
  const candidate = {
    source: "pack",
    "pack-id": row["pack-id"] || indexEntry["pack-id"],
    "artifact-id": compatibility?.["target-artifact-id"] || indexEntry["artifact-id"],
    "artifact-type": indexEntry["artifact-type"],
    visibility: manifest?.visibility || "local",
    scope: row.scope || {},
    load: indexEntry.load,
    "load-state": "metadata-only",
    route: indexEntry.route || exportRow.route || {},
    "route-evidence": [],
    "route-score": 0,
    "route-signature": routeSignature(indexEntry.route || exportRow.route || {}),
    priority: (indexEntry.route || exportRow.route || {}).priority,
    "artifact-path-ref": artifactPathRef,
    "compatibility-need": compatibilityNeed,
    "compatibility-alias-id": compatibility?.["alias-id"],
    "matched-compatibility-input": compatibility?.["old-name"] || compatibility?.["old-path"],
  };
  candidate["candidate-id"] = makeCandidateId(candidate);
  return candidate;
}

function candidatesFromRow(row, manifest) {
  const rows = [];
  for (const indexEntry of row["candidate-index"] || []) {
    rows.push(candidateFromIndex(row, indexEntry, manifest));
    const aliases = (manifest?.["compatibility-aliases"] || [])
      .filter((alias) => alias["target-artifact-id"] === indexEntry["artifact-id"]);
    for (const alias of aliases) rows.push(candidateFromIndex(row, indexEntry, manifest, alias));
  }
  return rows;
}

function candidateFromCore(entry) {
  const candidate = {
    source: "core",
    "artifact-id": entry["artifact-id"],
    "artifact-type": entry["artifact-type"],
    visibility: "core",
    scope: {},
    load: entry.load || "manual",
    "load-state": "metadata-only",
    route: entry.route || {},
    "route-evidence": [],
    "route-score": 0,
    "route-signature": routeSignature(entry.route || {}),
    priority: entry.route?.priority,
    "artifact-path-ref": entry.path,
    "compatibility-need": "none",
  };
  candidate["candidate-id"] = makeCandidateId(candidate);
  return candidate;
}

function compareCandidates(a, b) {
  if (b.exactMatch !== a.exactMatch) return Number(b.exactMatch) - Number(a.exactMatch);
  if (b["route-score"] !== a["route-score"]) return b["route-score"] - a["route-score"];
  if (routeSignatureKey(a) === routeSignatureKey(b) && a.priority !== undefined && b.priority !== undefined && a.priority !== b.priority) {
    return a.priority - b.priority;
  }
  return 0;
}

function isSelectable(candidate) {
  if (candidate.load === "manual") return candidate.exactMatch;
  return candidate.exactMatch || candidate["route-score"] >= (candidate.route?.["min-evidence"] || 1);
}

function compareCandidateRows(a, b) {
  const selectableDiff = Number(isSelectable(b)) - Number(isSelectable(a));
  if (selectableDiff !== 0) return selectableDiff;
  return compareCandidates(a, b);
}

function ambiguousTie(candidates) {
  if (candidates.length < 2) return null;
  const [first, second] = candidates;
  if (first.exactMatch !== second.exactMatch) return null;
  if (first["route-score"] !== second["route-score"]) return null;
  const sameSignature = routeSignatureKey(first) === routeSignatureKey(second);
  if (!sameSignature) return { field: "route-score", candidates: [first, second] };
  if (first.priority === undefined || second.priority === undefined) return { field: "priority", candidates: [first, second] };
  if (first.priority === second.priority) return { field: "priority", candidates: [first, second] };
  return null;
}

function baseEnvelope(resultKind, extra = {}) {
  return {
    "result-kind": resultKind,
    "secondary-candidate-ids": [],
    "emitted-candidate-count": 0,
    "resolver-body-load-count": 0,
    ...extra,
  };
}

export function resolveArtifactRoute(input) {
  const request = {
    requestText: input.requestText || "",
    harnessId: input.harnessId || "",
    cwdRepoKey: input.cwdRepoKey || "",
    workMode: input.workMode || "",
    touchedPaths: input.touchedPaths || [],
    namedArtifact: input.namedArtifact || [],
  };
  const manifests = new Map((input.manifests || []).map((manifest) => [manifest["pack-id"], manifest]));
  const explicitExcluded = [];
  const emitted = [];

  for (const entry of input.coreArtifacts || []) {
    const candidate = candidateFromCore(entry);
    const evidence = routeEvidence(candidate, request);
    candidate["route-evidence"] = evidence;
    candidate["route-score"] = evidence.filter((item) => item.axis !== "exact-name").length;
    candidate.exactMatch = evidence.some((item) => item.axis === "exact-name");
    emitted.push(candidate);
  }

  for (const row of input.installedPacks || []) {
    const manifest = manifests.get(row["pack-id"]);
    if (!manifest) continue;
    for (const candidate of candidatesFromRow(row, manifest)) {
      const explicitlyNamed = exactNameMatches(candidate, request);
      if (row.state !== "active") continue;
      if (!scopeMatches(row.scope || {}, request)) {
        if (explicitlyNamed) explicitExcluded.push({ candidate, reason: "scope" });
        continue;
      }
      if (!visibilityMatches(candidate.visibility, request.workMode)) {
        if (explicitlyNamed) explicitExcluded.push({ candidate, reason: "visibility" });
        continue;
      }
      const evidence = routeEvidence(candidate, request);
      if (hasExcludedDomain(candidate, evidence, request.requestText)) {
        if (explicitlyNamed) explicitExcluded.push({ candidate, reason: "exclude-when" });
        continue;
      }
      candidate["route-evidence"] = evidence;
      candidate["route-score"] = evidence.filter((item) => item.axis !== "exact-name").length;
      candidate.exactMatch = evidence.some((item) => item.axis === "exact-name");
      if (candidate.load === "route-selected" && candidate["route-score"] < (candidate.route?.["min-evidence"] || 1) && !candidate.exactMatch) {
        emitted.push(candidate);
        continue;
      }
      emitted.push(candidate);
    }
  }

  if (explicitExcluded.length > 0) {
    return {
      ...baseEnvelope("excluded", {
        "excluded-artifact-refs": explicitExcluded.map((item) => artifactRef(item.candidate)),
        "exclusion-reason": explicitExcluded[0].reason,
      }),
      candidates: [],
    };
  }

  const selectable = emitted.filter(isSelectable);
  const ordered = [...selectable].sort(compareCandidates);
  const envelopeFields = { "emitted-candidate-count": emitted.length };
  if (ordered.length === 0) {
    return { ...baseEnvelope("core-fallback", { ...envelopeFields, "fallback-source": "core" }), candidates: [...emitted].sort(compareCandidateRows) };
  }

  const tie = ambiguousTie(ordered);
  if (tie) {
    return {
      ...baseEnvelope("ambiguous", {
        ...envelopeFields,
        "ambiguity-reason": {
          field: tie.field,
          "candidate-ids": tie.candidates.map((candidate) => candidate["candidate-id"]),
        },
      }),
      candidates: [...emitted].sort(compareCandidateRows),
    };
  }

  const primary = ordered[0];
  if (primary.load === "route-selected") primary["load-state"] = "selected";
  const secondary = ordered.slice(1, 3).map((candidate) => candidate["candidate-id"]);
  return {
    ...baseEnvelope("primary", {
      ...envelopeFields,
      "primary-candidate-id": primary["candidate-id"],
      "secondary-candidate-ids": secondary,
    }),
    candidates: [...emitted].sort(compareCandidateRows),
  };
}
