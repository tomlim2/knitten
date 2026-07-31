#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ADAPTATION_CHANGE_OPERATIONS,
  FOUR_PANEL_FORMAT_CONTRACT,
  NARRATIVE_SPEC_KEYS,
  OUTPUT_STYLE_KEYS,
  STORYBOARD_HANDOFF_KEYS,
  fingerprint,
} from "./engine-contracts.mjs";

const LEGACY_CONTRACT_VERSION = "creative-deck-v1";
const STYLE_CONTRACT_VERSION = "creative-deck-v2";
const STORY_CONTRACT_VERSION = "creative-deck-v3";
const FOUR_PANEL_CONTRACT_VERSION = "creative-deck-v4";
const THREE_ENGINE_CONTRACT_VERSION = "creative-deck-v5";
const STYLE_CUTOVER_DATE = "2026-07-25";
const STORY_CUTOVER_DATE = "2026-07-28";
const FOUR_PANEL_CUTOVER_DATE = "2026-07-30";
const THREE_ENGINE_CUTOVER_DATE = "2026-07-31";
const STYLE_LOOKBACK_DAYS = 7;
const TIME_ZONE = "Asia/Seoul";
const DAY_MS = 86_400_000;
const FOUR_PANEL_STAGES = new Set(["story", "adaptation", "storyboard", "output"]);
const THREE_ENGINE_STAGES = new Set(["narrative", "adaptation", "output"]);
const DEFAULT_FORMAT_ID = "four-panel-comic";
// Immutable seed namespace: changing this would rewrite already archived daily
// selections even though workflow ownership moved out of Shotloom Today.
const LEGACY_SEED_NAMESPACE = "shotloom-today";

let legacyStoryDeckCache;

function legacyStoryDeck() {
  if (legacyStoryDeckCache) return legacyStoryDeckCache;
  const deckUrl = new URL("../references/story-legacy-deck.json", import.meta.url);
  const deck = JSON.parse(readFileSync(deckUrl, "utf8"));
  if (
    deck.schemaVersion !== 1
    || !Array.isArray(deck.dramaturgies)
    || deck.dramaturgies.length === 0
  ) {
    throw new Error("invalid legacy story deck");
  }
  for (const item of deck.dramaturgies) {
    if (
      !item.id
      || !item.tension
      || !Array.isArray(item.tones)
      || !Array.isArray(item.scenes)
      || !Array.isArray(item.beats)
      || !Array.isArray(item.turns)
    ) {
      throw new Error(`invalid legacy story card: ${item.id || "unknown"}`);
    }
  }
  legacyStoryDeckCache = deck;
  return legacyStoryDeckCache;
}

let visualStyleCoreDeckCache;

function visualStyleCoreDeck() {
  if (visualStyleCoreDeckCache) return visualStyleCoreDeckCache;
  const deckUrl = new URL("../references/visual-style-core-deck.json", import.meta.url);
  const deck = JSON.parse(readFileSync(deckUrl, "utf8"));
  if (
    deck.schemaVersion !== 1
    || !Array.isArray(deck.media)
    || deck.media.length === 0
    || !Array.isArray(deck.compositions)
    || deck.compositions.length === 0
  ) {
    throw new Error("invalid visual style core deck");
  }
  for (const item of deck.media) {
    if (!item.id || !item.label || !item.family || !Array.isArray(item.tags)) {
      throw new Error(`invalid visual style core medium: ${item.id || "unknown"}`);
    }
  }
  for (const item of deck.compositions) {
    if (!item.id || !item.rule || !item.breakPoint || !Array.isArray(item.tags)) {
      throw new Error(`invalid visual style composition: ${item.id || "unknown"}`);
    }
  }
  visualStyleCoreDeckCache = deck;
  return visualStyleCoreDeckCache;
}

function loadStyleReservoir() {
  const reservoirUrl = new URL("../references/visual-style-reservoir.json", import.meta.url);
  const reservoir = JSON.parse(readFileSync(reservoirUrl, "utf8"));
  if (reservoir.schemaVersion !== 1 || !Array.isArray(reservoir.media) || !Array.isArray(reservoir.treatments)) {
    throw new Error("invalid visual style reservoir");
  }
  for (const item of [...reservoir.media, ...reservoir.treatments]) {
    if (!item.id || !item.label || !Array.isArray(item.tags) || item.tags.length === 0) {
      throw new Error(`invalid visual style reservoir item: ${item.id || "unknown"}`);
    }
  }
  return reservoir;
}

let styleReservoirCache;

function styleReservoir() {
  styleReservoirCache ||= loadStyleReservoir();
  return styleReservoirCache;
}

function loadStoryThemeReservoir() {
  const reservoirUrl = new URL("../references/story-theme-reservoir.json", import.meta.url);
  const reservoir = JSON.parse(readFileSync(reservoirUrl, "utf8"));
  const decks = ["worlds", "tensions", "castPatterns", "scales", "motions"];
  if (
    reservoir.schemaVersion !== 1
    || !Array.isArray(reservoir.researchBasis)
    || reservoir.researchBasis.length === 0
    || decks.some((deck) => !Array.isArray(reservoir[deck]) || reservoir[deck].length === 0)
  ) {
    throw new Error("invalid story theme reservoir");
  }
  for (const deck of decks) {
    const ids = new Set();
    for (const item of reservoir[deck]) {
      if (!item.id || !item.label && !item.tension || ids.has(item.id)) {
        throw new Error(`invalid story theme reservoir ${deck} item: ${item.id || "unknown"}`);
      }
      ids.add(item.id);
    }
  }
  for (const world of reservoir.worlds) {
    if (
      !world.kind
      || !world.researchMode
      || !Array.isArray(world.settings)
      || world.settings.length === 0
      || !Array.isArray(world.realityRules)
      || world.realityRules.length === 0
    ) {
      throw new Error(`invalid story theme reservoir world: ${world.id}`);
    }
  }
  for (const tension of reservoir.tensions) {
    if (
      !tension.family
      || !Array.isArray(tension.tones)
      || tension.tones.length === 0
      || !Array.isArray(tension.beats)
      || tension.beats.length === 0
      || !Array.isArray(tension.turns)
      || tension.turns.length === 0
    ) {
      throw new Error(`invalid story theme reservoir tension: ${tension.id}`);
    }
  }
  return reservoir;
}

let storyThemeReservoirCache;

function storyThemeReservoir() {
  storyThemeReservoirCache ||= loadStoryThemeReservoir();
  return storyThemeReservoirCache;
}

function allMedia() {
  return [
    ...visualStyleCoreDeck().media.map((item) => ({
      ...item,
      source: "core",
    })),
    ...styleReservoir().media.map((item) => ({
      ...item,
      source: "reservoir",
    })),
  ];
}

function dateFromParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function validateDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`invalid date: ${value}`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`invalid date: ${value}`);
  }
  return value;
}

function seedFor(date, variant, contractVersion) {
  return `${LEGACY_SEED_NAMESPACE}|${contractVersion}|${date}|variant=${variant}`;
}

function unbiasedIndex(seed, label, length) {
  if (!Number.isInteger(length) || length < 1) throw new Error("draw deck must not be empty");
  const size = BigInt(length);
  const range = 1n << 64n;
  const limit = range - (range % size);
  for (let counter = 0; ; counter += 1) {
    const digest = createHash("sha256").update(`${seed}|${label}|${counter}`).digest();
    const value = digest.readBigUInt64BE(0);
    if (value < limit) return Number(value % size);
  }
}

function pick(seed, label, values) {
  return values[unbiasedIndex(seed, label, values.length)];
}

function intersects(left, right) {
  return left.some((value) => right.includes(value));
}

function addDays(date, offset) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + offset * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(start, end) {
  return Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS);
}

function shuffled(seed, label, values) {
  const result = [...values];
  for (let cursor = result.length - 1; cursor > 0; cursor -= 1) {
    const swapIndex = unbiasedIndex(seed, `${label}|swap=${cursor}`, cursor + 1);
    [result[cursor], result[swapIndex]] = [result[swapIndex], result[cursor]];
  }
  return result;
}

function balancedPick(date, variant, label, values) {
  const offset = daysBetween(STORY_CUTOVER_DATE, date);
  if (offset < 0) throw new Error(`balanced story draw before cutover: ${date}`);
  const cycle = Math.floor(offset / values.length);
  const position = offset % values.length;
  const cycleSeed = `${LEGACY_SEED_NAMESPACE}|${STORY_CONTRACT_VERSION}|${label}|variant=${variant}|cycle=${cycle}`;
  return shuffled(cycleSeed, label, values)[position];
}

function balancedCompatiblePick(date, variant, label, values, predicate) {
  const offset = daysBetween(STORY_CUTOVER_DATE, date);
  if (offset < 0) throw new Error(`balanced story draw before cutover: ${date}`);
  const cycle = Math.floor(offset / values.length);
  const position = offset % values.length;
  const cycleSeed = `${LEGACY_SEED_NAMESPACE}|${STORY_CONTRACT_VERSION}|${label}|variant=${variant}|cycle=${cycle}`;
  const order = shuffled(cycleSeed, label, values);
  for (let step = 0; step < order.length; step += 1) {
    const candidate = order[(position + step) % order.length];
    if (predicate(candidate)) return candidate;
  }
  throw new Error(`no compatible story card: ${label} on ${date}`);
}

function selectDramaturgy(seed) {
  return pick(seed, "dramaturgy", legacyStoryDeck().dramaturgies);
}

function selectStoryTheme(date, variant) {
  const reservoir = storyThemeReservoir();
  const world = balancedPick(date, variant, "story-world", reservoir.worlds);
  const tension = balancedCompatiblePick(
    date,
    variant,
    "story-tension",
    reservoir.tensions,
    (candidate) => !candidate.excludedWorldKinds?.includes(world.kind),
  );
  const cast = balancedCompatiblePick(
    date,
    variant,
    "story-cast",
    reservoir.castPatterns,
    (candidate) => (
      (!world.compatibleCastIds || world.compatibleCastIds.includes(candidate.id))
      && (!tension.compatibleCastIds || tension.compatibleCastIds.includes(candidate.id))
    ),
  );
  const multiActorCast = !["solitary"].includes(cast.id);
  return {
    world,
    tension,
    cast,
    scale: balancedPick(date, variant, "story-scale", reservoir.scales),
    motion: balancedCompatiblePick(
      date,
      variant,
      "story-motion",
      reservoir.motions,
      (candidate) => (
        (multiActorCast || !["exchange-gift", "pass-knowledge", "coordinate-risk"].includes(candidate.id))
        && (!world.compatibleMotionIds || world.compatibleMotionIds.includes(candidate.id))
      ),
    ),
  };
}

function contractVersionForDate(date) {
  if (date < STYLE_CUTOVER_DATE) return LEGACY_CONTRACT_VERSION;
  if (date < STORY_CUTOVER_DATE) return STYLE_CONTRACT_VERSION;
  if (date < FOUR_PANEL_CUTOVER_DATE) return STORY_CONTRACT_VERSION;
  if (date < THREE_ENGINE_CUTOVER_DATE) return FOUR_PANEL_CONTRACT_VERSION;
  return THREE_ENGINE_CONTRACT_VERSION;
}

function selectDramaturgyForDate(date, variant) {
  const contractVersion = contractVersionForDate(date);
  const seed = seedFor(date, variant, contractVersion);
  return [
    STORY_CONTRACT_VERSION,
    FOUR_PANEL_CONTRACT_VERSION,
    THREE_ENGINE_CONTRACT_VERSION,
  ].includes(contractVersion)
    ? selectStoryTheme(date, variant).tension
    : selectDramaturgy(seed);
}

function selectLegacyMedium(date, variant) {
  const seed = seedFor(date, variant, LEGACY_CONTRACT_VERSION);
  const dramaturgy = selectDramaturgy(seed);
  const candidates = visualStyleCoreDeck().media.filter(
    (item) => intersects(item.tags, dramaturgy.tones),
  );
  return pick(seed, "medium", candidates);
}

function selectExpandedMedium(date, variant) {
  const recentMediumIds = [];
  for (let offset = STYLE_LOOKBACK_DAYS; offset > 0; offset -= 1) {
    recentMediumIds.push(selectLegacyMedium(addDays(STYLE_CUTOVER_DATE, -offset), variant).id);
  }

  let selection;
  for (let cursor = STYLE_CUTOVER_DATE; cursor <= date; cursor = addDays(cursor, 1)) {
    const contractVersion = contractVersionForDate(cursor);
    const seed = seedFor(cursor, variant, contractVersion);
    const dramaturgy = selectDramaturgyForDate(cursor, variant);
    const compatible = allMedia().filter((item) => intersects(item.tags, dramaturgy.tones));
    const fresh = compatible.filter((item) => !recentMediumIds.includes(item.id));
    const poolExhausted = fresh.length === 0;
    const medium = pick(seed, "medium", poolExhausted ? compatible : fresh);
    selection = {
      medium,
      poolExhausted,
      compatibleCount: compatible.length,
      freshCount: fresh.length,
    };
    recentMediumIds.push(medium.id);
    if (recentMediumIds.length > STYLE_LOOKBACK_DAYS) recentMediumIds.shift();
  }

  return selection;
}

function buildLegacyCreativeSeed(selectedDate, variant) {
  const seed = seedFor(selectedDate, variant, LEGACY_CONTRACT_VERSION);
  const dramaturgy = selectDramaturgy(seed);
  const mediumCandidates = visualStyleCoreDeck().media.filter(
    (item) => intersects(item.tags, dramaturgy.tones),
  );
  const compositionCandidates = visualStyleCoreDeck().compositions.filter(
    (item) => intersects(item.tags, dramaturgy.tones),
  );
  const medium = pick(seed, "medium", mediumCandidates);
  const composition = pick(seed, "composition", compositionCandidates);
  const directionMode = pick(seed, "direction-mode", ["obey", "break", "break"]);
  const fingerprint = createHash("sha256").update(seed).digest("hex").slice(0, 16);

  return {
    ok: true,
    contractVersion: LEGACY_CONTRACT_VERSION,
    timezone: TIME_ZONE,
    date: selectedDate,
    variant,
    seedFingerprint: fingerprint,
    anchor: {
      humanTension: dramaturgy.tension,
      temporalBeat: pick(seed, "temporal-beat", dramaturgy.beats),
      everydayScene: pick(seed, "scene", dramaturgy.scenes),
      comicTurn: pick(seed, "comic-turn", dramaturgy.turns),
    },
    direction: {
      medium: medium.label,
      dominantRule: composition.rule,
      mode: directionMode,
      breakPoint: directionMode === "break" ? composition.breakPoint : null,
    },
    synthesisRule: "Use the anchors to name one precise mixed emotional arc; do not repeat a deck id or broad emotion label as the final theme.",
  };
}

function buildStyleExpandedCreativeSeed(selectedDate, variant) {
  const seed = seedFor(selectedDate, variant, STYLE_CONTRACT_VERSION);
  const dramaturgy = selectDramaturgy(seed);
  const compositionCandidates = visualStyleCoreDeck().compositions.filter(
    (item) => intersects(item.tags, dramaturgy.tones),
  );
  const styleSelection = selectExpandedMedium(selectedDate, variant);
  const medium = styleSelection.medium;
  const familyTreatments = styleReservoir().treatments.filter(
    (item) => item.compatibleFamilies.includes("*") || item.compatibleFamilies.includes(medium.family),
  );
  const toneTreatments = familyTreatments.filter((item) => intersects(item.tags, dramaturgy.tones));
  const treatment = pick(seed, "style-treatment", toneTreatments.length > 0 ? toneTreatments : familyTreatments);
  const composition = pick(seed, "composition", compositionCandidates);
  const directionMode = pick(seed, "direction-mode", ["obey", "break", "break"]);
  const fingerprint = createHash("sha256").update(seed).digest("hex").slice(0, 16);

  return {
    ok: true,
    contractVersion: STYLE_CONTRACT_VERSION,
    timezone: TIME_ZONE,
    date: selectedDate,
    variant,
    seedFingerprint: fingerprint,
    anchor: {
      humanTension: dramaturgy.tension,
      temporalBeat: pick(seed, "temporal-beat", dramaturgy.beats),
      everydayScene: pick(seed, "scene", dramaturgy.scenes),
      comicTurn: pick(seed, "comic-turn", dramaturgy.turns),
    },
    direction: {
      medium: `${medium.label} · ${treatment.label}`,
      mediumId: medium.id,
      mediumSource: medium.source,
      styleTreatment: treatment.label,
      styleTreatmentId: treatment.id,
      styleSignature: `${medium.id}+${treatment.id}`,
      styleLookbackDays: STYLE_LOOKBACK_DAYS,
      stylePoolExhausted: styleSelection.poolExhausted,
      compatibleStyleCount: styleSelection.compatibleCount,
      freshStyleCount: styleSelection.freshCount,
      dominantRule: composition.rule,
      mode: directionMode,
      breakPoint: directionMode === "break" ? composition.breakPoint : null,
    },
    synthesisRule: "Use the anchors to name one precise mixed emotional arc; do not repeat a deck id or broad emotion label as the final theme.",
  };
}

function buildFourPanelAdaptation() {
  return {
    target: {
      mode: "four-panel-comic",
      beatCount: 4,
      beatRoles: [
        { id: "setup", beat: "Establish the world rule, focal character, and visible desire." },
        { id: "pressure", beat: "Make the concrete obstacle and personal cost visible." },
        { id: "turn", beat: "Show the consequential choice and the comic or emotional reversal." },
        { id: "residue", beat: "Prove the changed state and leave one emotionally meaningful remainder." },
      ],
    },
    contract: {
      consumes: "storySpec",
      emits: "outputBrief",
      freezeBeforeHandoff: true,
      mayAlterCoreStoryFacts: false,
      allowedTransformations: [
        "select essential beats",
        "compress elapsed time",
        "externalize internal state as visible action",
        "merge nonessential actions",
        "move the comic reveal without changing its meaning",
      ],
      protectedInvariants: [
        "focalSubject",
        "desire",
        "obstacle",
        "cost",
        "choice",
        "consequence",
        "residue",
        "worldLogic",
        "jokeMeaning",
      ],
      requiredFields: [
        "causalCarrier",
        "panelBeats",
        "continuityInvariants",
        "omissions",
        "externalizations",
        "outputBrief",
      ],
      outputBriefFields: [
        "visualSubjects",
        "environmentFacts",
        "panelStates",
        "continuityTokens",
        "causalCarrier",
        "emotionalTrajectory",
        "finalVisualResidue",
      ],
      depthLayers: ["surface action"],
      rule: "Translate the sealed storySpec into exactly four causally linked beats and emit a self-contained outputBrief. Change expression and pacing only; preserve every protected story invariant.",
    },
  };
}

function buildFourPanelStoryboard() {
  return {
    purpose: "Validate the adapted camera, composition, movement, cut order, and spatial relationships before final rendering.",
    render: {
      assetCount: 1,
      panelCount: 4,
      layout: "2x2",
      readingOrder: ["top-left", "top-right", "bottom-left", "bottom-right"],
      colorPolicy: "strict monochrome black, white, and neutral gray only; no color",
      lineStyle: "rough hand-drawn sketch, thumbnail, or underdrawing construction lines",
      detailBudget: "action-token positions, causal-object motion, and only the minimum background geometry needed for orientation",
      actorPolicy: "use sparse human construction armatures for visible human actors; use non-human geometric tokens for nonhuman, object, crowd, or impersonal actors; no finished figures, faces, hands, fingers, feet, clothing, body outlines, costumes, character designs, or silhouette fill",
      finalArt: false,
      allowedNotation: "simple nonverbal movement arrows only",
      forbidden: [
        "color",
        "finished rendering",
        "decorative detail",
        "surface texture",
        "lighting polish",
        "dialogue",
        "captions",
      ],
    },
    contract: {
      consumes: "outputBrief",
      emits: "storyboardHandoff",
      loadsCreativeReferences: false,
      freezeBeforeHandoff: true,
      requiredFields: [
        "storyboardRaster",
        "cameraAngles",
        "movementDirections",
        "cutOrder",
        "spatialRelationships",
        "validation",
      ],
      validationChecks: [
        "intendedCameraAngle",
        "actionTokenOrCausalObjectMovementDirection",
        "cutSequence",
        "withinFrameSpatialRelationships",
        "firstTimeReaderCausality",
        "stateTimingNoAnticipation",
        "actorObjectRelationshipLegibility",
      ],
      causalityPreflight: [
        "name one first-time-viewer beat purpose per unit",
        "build a state-timing table for repeated visual tokens and causal objects",
        "do not show a future solved state before the visible action that causes it",
        "connect actors or tokens to objects through sight-lines, contact points, pull-lines, or alignments",
        "rhyme first and final unit layout when possible to make before/after change visible",
      ],
      passRule: "Pass only when every validation check is legible from the rough board without consulting StorySpec.",
      retryRule: "On failure, revise AdaptationSpec or outputBrief and regenerate the storyboard; never hide a failed board with final rendering.",
      rule: "Treat the storyboard as a camera, composition, and movement blueprint, never as finished artwork.",
    },
  };
}

function selectFourPanelOutputMedium(date, variant) {
  const media = allMedia();
  const recentMediumIds = [];
  let selection;
  for (let cursor = FOUR_PANEL_CUTOVER_DATE; cursor <= date; cursor = addDays(cursor, 1)) {
    const seed = seedFor(cursor, variant, FOUR_PANEL_CONTRACT_VERSION);
    const fresh = media.filter((item) => !recentMediumIds.includes(item.id));
    const poolExhausted = fresh.length === 0;
    const medium = pick(seed, "output-medium", poolExhausted ? media : fresh);
    selection = {
      medium,
      poolExhausted,
      compatibleCount: media.length,
      freshCount: fresh.length,
    };
    recentMediumIds.push(medium.id);
    if (recentMediumIds.length > STYLE_LOOKBACK_DAYS) recentMediumIds.shift();
  }
  return selection;
}

function buildFourPanelOutput(selectedDate, variant) {
  const seed = seedFor(selectedDate, variant, FOUR_PANEL_CONTRACT_VERSION);
  const styleSelection = selectFourPanelOutputMedium(selectedDate, variant);
  const medium = styleSelection.medium;
  const treatments = styleReservoir().treatments.filter(
    (item) => item.compatibleFamilies.includes("*") || item.compatibleFamilies.includes(medium.family),
  );
  const treatment = pick(seed, "output-style-treatment", treatments);
  const composition = pick(seed, "output-composition", visualStyleCoreDeck().compositions);
  const directionMode = pick(seed, "output-direction-mode", ["obey", "break", "break"]);
  return {
    medium: `${medium.label} · ${treatment.label}`,
    mediumId: medium.id,
    mediumSource: medium.source,
    styleTreatment: treatment.label,
    styleTreatmentId: treatment.id,
    styleSignature: `${medium.id}+${treatment.id}`,
    styleLookbackDays: STYLE_LOOKBACK_DAYS,
    stylePoolExhausted: styleSelection.poolExhausted,
    compatibleStyleCount: styleSelection.compatibleCount,
    freshStyleCount: styleSelection.freshCount,
    dominantRule: composition.rule,
    mode: directionMode,
    breakPoint: directionMode === "break" ? composition.breakPoint : null,
    render: {
      assetCount: 1,
      panelCount: 4,
      layout: "2x2",
      readingOrder: ["top-left", "top-right", "bottom-left", "bottom-right"],
      textPolicy: "no dialogue, captions, panel numbers, sound effects, logos, signatures, or watermarks",
    },
    contract: {
      consumes: "storyboardHandoff",
      inputClosed: true,
      requiresStoryboardApproval: true,
      mayAlterAdaptedEvents: false,
      depthLayers: ["formal metaphor"],
      rule: "Render only the approved storyboardHandoff as one four-panel raster. Preserve its camera, composition, movement, cut order, and spatial relationships; do not infer or rewrite events outside that handoff.",
    },
  };
}

function buildFourPanelStory(anchors, storySelection) {
  return {
    anchors,
    world: {
      id: storySelection.worldId,
      label: storySelection.world,
      kind: storySelection.worldKind,
      researchMode: storySelection.researchMode,
      researchLane: storySelection.researchLane,
    },
    tension: {
      id: storySelection.tensionId,
      family: storySelection.tensionFamily,
    },
    cast: {
      id: storySelection.castId,
      label: storySelection.cast,
    },
    scale: {
      id: storySelection.scaleId,
      label: storySelection.scale,
    },
    motion: {
      id: storySelection.motionId,
      label: storySelection.motion,
    },
    contract: {
      freezeBeforeHandoff: true,
      emits: "storySpec",
      requiredFields: [
        "focalSubject",
        "desire",
        "obstacle",
        "cost",
        "choice",
        "consequence",
        "residue",
        "joke",
      ],
      depthLayers: [
        "causality",
        "desire and cost",
        "relationship or theme",
        "world logic",
      ],
      rule: "Synthesize and freeze a sealed canonical story specification whose facts, causality, and meaning are complete in their own domain.",
    },
  };
}

function buildStoryExpandedCreativeSeed(selectedDate, variant, contractVersion, stage = null) {
  const seed = seedFor(selectedDate, variant, contractVersion);
  const fingerprint = createHash("sha256").update(seed).digest("hex").slice(0, 16);
  const base = {
    ok: true,
    contractVersion,
    timezone: TIME_ZONE,
    date: selectedDate,
    variant,
    seedFingerprint: fingerprint,
  };
  if (contractVersion === FOUR_PANEL_CONTRACT_VERSION && stage === "adaptation") {
    return { ...base, stage, adaptation: buildFourPanelAdaptation() };
  }
  if (contractVersion === FOUR_PANEL_CONTRACT_VERSION && stage === "storyboard") {
    return { ...base, stage, storyboard: buildFourPanelStoryboard() };
  }
  if (contractVersion === FOUR_PANEL_CONTRACT_VERSION && stage === "output") {
    return { ...base, stage, output: buildFourPanelOutput(selectedDate, variant) };
  }

  const theme = selectStoryTheme(selectedDate, variant);
  const dramaturgy = theme.tension;
  const anchors = {
    humanTension: dramaturgy.tension,
    temporalBeat: pick(seed, "temporal-beat", dramaturgy.beats),
    storyScene: pick(seed, "story-scene", theme.world.settings),
    worldLogic: pick(seed, "world-logic", theme.world.realityRules),
    comicTurn: pick(seed, "comic-turn", dramaturgy.turns),
  };
  const storySelection = {
    worldId: theme.world.id,
    world: contractVersion === FOUR_PANEL_CONTRACT_VERSION
      ? theme.world.label.replace("한 장면에 ", "")
      : theme.world.label,
    worldKind: theme.world.kind,
    researchMode: theme.world.researchMode,
    researchLane: theme.world.researchLane || null,
    tensionId: dramaturgy.id,
    tensionFamily: dramaturgy.family,
    castId: theme.cast.id,
    cast: theme.cast.label,
    scaleId: theme.scale.id,
    scale: theme.scale.label,
    motionId: theme.motion.id,
    motion: theme.motion.label,
  };
  if (contractVersion === FOUR_PANEL_CONTRACT_VERSION) {
    const story = buildFourPanelStory(anchors, storySelection);
    if (stage === "story") return { ...base, stage, story };
    return {
      ...base,
      story,
      adaptation: buildFourPanelAdaptation(),
      storyboard: buildFourPanelStoryboard(),
      output: buildFourPanelOutput(selectedDate, variant),
      synthesisRule: "StorySpec and the output stage never inspect or reference one another. Adaptation emits sealed outputBrief; Storyboard validates it and emits approved storyboardHandoff; Output receives only that handoff and may not infer outside it.",
    };
  }

  const compositionCandidates = visualStyleCoreDeck().compositions.filter(
    (item) => intersects(item.tags, dramaturgy.tones),
  );
  const styleSelection = selectExpandedMedium(selectedDate, variant);
  const medium = styleSelection.medium;
  const familyTreatments = styleReservoir().treatments.filter(
    (item) => item.compatibleFamilies.includes("*") || item.compatibleFamilies.includes(medium.family),
  );
  const toneTreatments = familyTreatments.filter((item) => intersects(item.tags, dramaturgy.tones));
  const treatment = pick(seed, "style-treatment", toneTreatments.length > 0 ? toneTreatments : familyTreatments);
  const composition = pick(seed, "composition", compositionCandidates);
  const directionMode = pick(seed, "direction-mode", ["obey", "break", "break"]);
  const outputSelection = {
    medium: `${medium.label} · ${treatment.label}`,
    mediumId: medium.id,
    mediumSource: medium.source,
    styleTreatment: treatment.label,
    styleTreatmentId: treatment.id,
    styleSignature: `${medium.id}+${treatment.id}`,
    styleLookbackDays: STYLE_LOOKBACK_DAYS,
    stylePoolExhausted: styleSelection.poolExhausted,
    compatibleStyleCount: styleSelection.compatibleCount,
    freshStyleCount: styleSelection.freshCount,
    dominantRule: composition.rule,
    mode: directionMode,
    breakPoint: directionMode === "break" ? composition.breakPoint : null,
  };
  return {
    ...base,
    anchor: anchors,
    story: storySelection,
    direction: outputSelection,
    visualStoryRule: "Stage a legible subject, desire, obstacle, change, and visual proof in one frame; do not collapse an imaginative or present-day world back into a generic two-person reconciliation scene.",
    synthesisRule: "Use every returned story axis to build one specific visual narrative; the ids are internal and must not appear as the final title.",
  };
}

function buildThreeEngineNarrative(selectedDate, narrativeVariant) {
  const seed = seedFor(selectedDate, narrativeVariant, THREE_ENGINE_CONTRACT_VERSION);
  const theme = selectStoryTheme(selectedDate, narrativeVariant);
  const tension = theme.tension;
  const narrativeSeedFingerprint = createHash("sha256")
    .update(seed)
    .digest("hex")
    .slice(0, 24);
  return {
    narrativeSeedFingerprint,
    narrative: {
      schemaVersion: 1,
      storyBrief: {
        humanTension: tension.tension,
        temporalBeat: pick(seed, "temporal-beat", tension.beats),
        storyScene: pick(seed, "story-scene", theme.world.settings),
        worldLogic: pick(seed, "world-logic", theme.world.realityRules),
        comicTurn: pick(seed, "comic-turn", tension.turns),
        world: {
          id: theme.world.id,
          label: theme.world.label,
          kind: theme.world.kind,
          researchMode: theme.world.researchMode,
          researchLane: theme.world.researchLane || null,
        },
        tension: {
          id: tension.id,
          family: tension.family,
        },
        cast: {
          id: theme.cast.id,
          label: theme.cast.label,
        },
        scale: {
          id: theme.scale.id,
          label: theme.scale.label,
        },
        motion: {
          id: theme.motion.id,
          label: theme.motion.label,
        },
      },
      authorContract: {
        producer: "active-codex-model",
        authorRole: "narrative-author",
        effectiveModel: "record the runtime model; never pin one here",
        replaceableProducer: true,
      },
      reviewContract: {
        separatePass: true,
        checks: [
          "causal completeness",
          "visible or consequential state change",
          "emotional movement supported by events",
          "world-rule sufficiency",
          "preserved ambiguity distinguished from omission",
          "no recent-result imitation",
        ],
      },
      contract: {
        consumes: "StoryBrief",
        emits: "NarrativeSpec",
        closed: true,
        requiredFields: NARRATIVE_SPEC_KEYS,
        freezeBeforeAdaptation: true,
        rule: "Create and review a causally complete story in its own domain. Record the effective author model at runtime and freeze the result before any visual target is selected.",
      },
    },
  };
}

function buildThreeEngineAdaptation(selectedDate, narrativeVariant, adaptationVariant) {
  const adaptationSeedFingerprint = fingerprint("AdaptationSeed", {
    contractVersion: THREE_ENGINE_CONTRACT_VERSION,
    date: selectedDate,
    narrativeVariant,
    formatId: DEFAULT_FORMAT_ID,
    adaptationVariant,
  });
  const seed = `${LEGACY_SEED_NAMESPACE}|${THREE_ENGINE_CONTRACT_VERSION}|${selectedDate}|narrativeVariant=${narrativeVariant}|adaptationVariant=${adaptationVariant}`;
  const interpretationModes = adaptationVariant === 0
    ? ["faithful-visible-translation"]
    : [
        "invented-bridging-event",
        "invented-counterpoint",
        "invented-visual-consequence",
        "clarified-within-invariant",
      ];
  return {
    adaptationSeedFingerprint,
    adaptation: {
      schemaVersion: 1,
      formatContract: FOUR_PANEL_FORMAT_CONTRACT,
      adaptationVariant,
      interpretationMode: pick(seed, "interpretation-mode", interpretationModes),
      contract: {
        consumesExactly: [
          "NarrativeSpec",
          "FormatContract",
          "adaptationVariant",
        ],
        emits: "StoryboardPackage",
        ownsStoryboard: true,
        mayInventVisibleEvents: true,
        mustPreserveNarrativeInvariants: true,
        changeLedgerOperations: ADAPTATION_CHANGE_OPERATIONS,
        outputBlockedUntilStoryboardPasses: true,
        rule: "Adapt the frozen narrative for the user-selected visual format, record every transformation or invention, then prove the result with an inspected rough storyboard.",
      },
      storyboardPolicy: {
        purpose: "camera, composition, movement, order, and spatial blueprint",
        assetCount: 1,
        panelCount: 4,
        layout: "equal 2x2 grid",
        readingOrder: FOUR_PANEL_FORMAT_CONTRACT.canonicalOrder,
        colorPolicy: "strict black, white, and neutral gray only; no color",
        lineStyle: "rough hand-drawn thumbnail or underdrawing construction lines",
        detailBudget: "action-token positions, causal-object movement, screen direction, and minimum orientation geometry only",
        actorPolicy: "use sparse human construction armatures for visible human actors; use non-human geometric tokens for nonhuman, object, crowd, or impersonal actors; no finished figures, faces, hair, hands, fingers, feet, clothing, body outlines, costumes, character designs, or silhouette fill",
        causalityPreflight: [
          "one first-time-viewer beat purpose per panel",
          "state-timing table for each repeated visual token or causal object",
          "no future solved state before the visible action that causes it",
          "actor/token-to-object sight-line, contact point, pull-line, or alignment for every action",
          "first/final panel before-after rhyme when the format allows",
        ],
        finalArt: false,
        allowedNotation: "simple nonverbal movement arrows only",
        maximumAttempts: 2,
        validationChecks: [
          "intended camera angle and distance",
          "action-token or causal-object movement direction",
          "panel order and causal readability",
          "within-panel and cross-panel spatial relationships",
          "Narrative invariant preservation",
          "all four panels present exactly once",
          "first-time viewer causal readability",
          "state timing, with no future solved state shown before its cause",
          "actor/token-to-object relationship legibility",
        ],
      },
      storyboardPackageContract: {
        schemaVersion: 1,
        requiredFields: [
          "narrativeRef",
          "formatContract",
          "adaptationVariant",
          "adaptationSeedFingerprint",
          "adaptationSpec",
          "changeLedger",
          "outputBrief",
          "storyboardPrompt",
          "storyboardRaster",
          "attemptCount",
          "validationEvidence",
          "storyboardHandoff",
        ],
        failure: "blocked: storyboard-validation-failed",
      },
      storyboardHandoffContract: {
        handoffVersion: 1,
        closed: true,
        requiredFields: STORYBOARD_HANDOFF_KEYS,
        excludes: [
          "NarrativeSpec",
          "source prose",
          "AdaptationSpec",
          "change ledger",
          "discarded alternatives",
          "rationale",
          "joke explanation",
          "raw references",
        ],
      },
    },
  };
}

function selectThreeEngineOutputMedium(date, narrativeVariant) {
  const media = allMedia();
  const recentMediumIds = [];
  let selection;
  for (let cursor = THREE_ENGINE_CUTOVER_DATE; cursor <= date; cursor = addDays(cursor, 1)) {
    const seed = seedFor(cursor, narrativeVariant, THREE_ENGINE_CONTRACT_VERSION);
    const fresh = media.filter((item) => !recentMediumIds.includes(item.id));
    const poolExhausted = fresh.length === 0;
    const medium = pick(seed, "output-medium", poolExhausted ? media : fresh);
    selection = {
      medium,
      poolExhausted,
      compatibleCount: media.length,
      freshCount: fresh.length,
    };
    recentMediumIds.push(medium.id);
    if (recentMediumIds.length > STYLE_LOOKBACK_DAYS) recentMediumIds.shift();
  }
  return selection;
}

function buildThreeEngineOutput(selectedDate, narrativeVariant) {
  const seed = seedFor(selectedDate, narrativeVariant, THREE_ENGINE_CONTRACT_VERSION);
  const styleSelection = selectThreeEngineOutputMedium(selectedDate, narrativeVariant);
  const medium = styleSelection.medium;
  const treatments = styleReservoir().treatments.filter(
    (item) => item.compatibleFamilies.includes("*") || item.compatibleFamilies.includes(medium.family),
  );
  const treatment = pick(seed, "output-style-treatment", treatments);
  const composition = pick(seed, "output-composition", visualStyleCoreDeck().compositions);
  const directionMode = pick(seed, "output-direction-mode", ["obey", "break", "break"]);
  const outputStyle = {
    schemaVersion: 1,
    styleId: `${medium.id}+${treatment.id}`,
    medium: medium.label,
    palette: "resolve one coherent palette inside Output without changing locked visible states",
    lighting: "resolve lighting inside Output without changing locked camera or spatial relationships",
    material: medium.label,
    texture: treatment.label,
    finish: "finished raster with no text, branding, signature, or watermark",
    resolution: "one high-resolution square raster; record actual dimensions at runtime",
    surfaceRule: directionMode === "break"
      ? `${composition.rule}; deliberately break at: ${composition.breakPoint}`
      : composition.rule,
  };
  return {
    outputStyleSeedFingerprint: fingerprint("OutputStyleSeed", outputStyle),
    output: {
      schemaVersion: 1,
      outputStyle,
      styleSelectionEvidence: {
        mediumId: medium.id,
        mediumSource: medium.source,
        styleTreatmentId: treatment.id,
        styleLookbackDays: STYLE_LOOKBACK_DAYS,
        stylePoolExhausted: styleSelection.poolExhausted,
        compatibleStyleCount: styleSelection.compatibleCount,
        freshStyleCount: styleSelection.freshCount,
        directionMode,
      },
      contract: {
        consumesExactly: ["StoryboardHandoff", "OutputStyle"],
        emits: "RenderedArtifact",
        inputClosed: true,
        requiredOutputStyleFields: OUTPUT_STYLE_KEYS,
        requiresStoryboardApproval: true,
        mayAlterAdaptedEvents: false,
        rule: "Start a fresh closed-input render from the approved StoryboardHandoff and OutputStyle only. Preserve every locked field and record any style conflict as a storyboard-lock override.",
      },
      proofContract: {
        requiredFields: [
          "handoffFingerprint",
          "styleId",
          "effectiveGenerationModel",
          "exactFinalPrompt",
          "visiblePreservationChecks",
          "artifactSha256",
        ],
      },
    },
  };
}

function buildThreeEngineProjection({
  date,
  narrativeVariant,
  adaptationVariant,
  formatId,
  stage,
}) {
  if (!THREE_ENGINE_STAGES.has(stage)) {
    throw new Error(`creative-deck-v5 requires stage narrative, adaptation, or output: ${stage}`);
  }
  if (formatId !== DEFAULT_FORMAT_ID) {
    throw new Error(`unsupported visual format: ${formatId}`);
  }
  const base = {
    ok: true,
    contractVersion: THREE_ENGINE_CONTRACT_VERSION,
    timezone: TIME_ZONE,
    date,
    stage,
  };
  if (stage === "narrative") {
    return {
      ...base,
      narrativeVariant,
      ...buildThreeEngineNarrative(date, narrativeVariant),
    };
  }
  if (stage === "adaptation") {
    return {
      ...base,
      adaptationVariant,
      ...buildThreeEngineAdaptation(date, narrativeVariant, adaptationVariant),
    };
  }
  return {
    ...base,
    ...buildThreeEngineOutput(date, narrativeVariant),
  };
}

function projectFourPanelStage(result, stage) {
  if (stage === null || stage === undefined) return result;
  if (!FOUR_PANEL_STAGES.has(stage)) {
    throw new Error(`stage must be one of story, adaptation, storyboard, or output: ${stage}`);
  }
  if (result.contractVersion !== FOUR_PANEL_CONTRACT_VERSION) {
    throw new Error(`stage projection requires ${FOUR_PANEL_CONTRACT_VERSION}: ${result.date}`);
  }
  return {
    ok: result.ok,
    contractVersion: result.contractVersion,
    timezone: result.timezone,
    date: result.date,
    variant: result.variant,
    seedFingerprint: result.seedFingerprint,
    stage,
    [stage]: result[stage],
  };
}

export function buildDailyCreativeSeed({
  date = dateFromParts(),
  variant = 0,
  adaptationVariant = 0,
  formatId = DEFAULT_FORMAT_ID,
  stage = null,
} = {}) {
  const selectedDate = validateDate(date);
  if (!Number.isInteger(variant) || variant < 0 || variant > 999) {
    throw new Error(`variant must be an integer from 0 to 999: ${variant}`);
  }
  if (!Number.isInteger(adaptationVariant) || adaptationVariant < 0 || adaptationVariant > 999) {
    throw new Error(`adaptationVariant must be an integer from 0 to 999: ${adaptationVariant}`);
  }
  if (typeof formatId !== "string" || formatId.length === 0) {
    throw new Error("formatId must be a non-empty string");
  }
  if (selectedDate >= THREE_ENGINE_CUTOVER_DATE) {
    return buildThreeEngineProjection({
      date: selectedDate,
      narrativeVariant: variant,
      adaptationVariant,
      formatId,
      stage,
    });
  }
  let result;
  if (selectedDate < STYLE_CUTOVER_DATE) result = buildLegacyCreativeSeed(selectedDate, variant);
  else if (selectedDate < STORY_CUTOVER_DATE) result = buildStyleExpandedCreativeSeed(selectedDate, variant);
  if (selectedDate < FOUR_PANEL_CUTOVER_DATE) {
    result ||= buildStoryExpandedCreativeSeed(selectedDate, variant, STORY_CONTRACT_VERSION);
  } else {
    result = buildStoryExpandedCreativeSeed(
      selectedDate,
      variant,
      FOUR_PANEL_CONTRACT_VERSION,
      stage,
    );
  }
  return projectFourPanelStage(result, stage);
}

function parseArgs(argv) {
  const args = {
    date: dateFromParts(),
    variant: 0,
    adaptationVariant: 0,
    formatId: DEFAULT_FORMAT_ID,
    stage: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--date") args.date = argv[++index] || "";
    else if (arg.startsWith("--date=")) args.date = arg.slice("--date=".length);
    else if (arg === "--variant" || arg === "--narrative-variant") args.variant = Number(argv[++index]);
    else if (arg.startsWith("--variant=")) args.variant = Number(arg.slice("--variant=".length));
    else if (arg.startsWith("--narrative-variant=")) {
      args.variant = Number(arg.slice("--narrative-variant=".length));
    } else if (arg === "--adaptation-variant") args.adaptationVariant = Number(argv[++index]);
    else if (arg.startsWith("--adaptation-variant=")) {
      args.adaptationVariant = Number(arg.slice("--adaptation-variant=".length));
    } else if (arg === "--format") args.formatId = argv[++index] || "";
    else if (arg.startsWith("--format=")) args.formatId = arg.slice("--format=".length);
    else if (arg === "--stage") args.stage = argv[++index] || "";
    else if (arg.startsWith("--stage=")) args.stage = arg.slice("--stage=".length);
    else if (arg === "--print-json") continue;
    else if (arg === "-h" || arg === "--help") {
      process.stdout.write("Usage: daily-creative-seed.mjs [--date YYYY-MM-DD] [--narrative-variant N] [--adaptation-variant N] [--format four-panel-comic] [--stage narrative|adaptation|output] [--print-json]\n");
      process.exit(0);
    } else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${JSON.stringify(buildDailyCreativeSeed(parseArgs(process.argv.slice(2))), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
