#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildDailyCreativeSeed } from "./daily-creative-seed.mjs";

const storyReservoir = JSON.parse(
  readFileSync(new URL("../references/story-theme-reservoir.json", import.meta.url), "utf8"),
);
const legacyStoryDeck = JSON.parse(
  readFileSync(new URL("../references/story-legacy-deck.json", import.meta.url), "utf8"),
);
const styleReservoir = JSON.parse(
  readFileSync(new URL("../references/visual-style-reservoir.json", import.meta.url), "utf8"),
);
const visualStyleCoreDeck = JSON.parse(
  readFileSync(new URL("../references/visual-style-core-deck.json", import.meta.url), "utf8"),
);
const creativeSeedSource = readFileSync(
  new URL("./daily-creative-seed.mjs", import.meta.url),
  "utf8",
);

function anchorsOf(result) {
  if (result.contractVersion === "creative-deck-v5") return result.narrative.storyBrief;
  return result.contractVersion === "creative-deck-v4" ? result.story.anchors : result.anchor;
}

function outputOf(result) {
  if (result.contractVersion === "creative-deck-v5") {
    return {
      ...result.output.outputStyle,
      mediumId: result.output.styleSelectionEvidence.mediumId,
      mediumSource: result.output.styleSelectionEvidence.mediumSource,
      styleTreatmentId: result.output.styleSelectionEvidence.styleTreatmentId,
      styleSignature: result.output.outputStyle.styleId,
      styleLookbackDays: result.output.styleSelectionEvidence.styleLookbackDays,
      stylePoolExhausted: result.output.styleSelectionEvidence.stylePoolExhausted,
    };
  }
  return result.contractVersion === "creative-deck-v4" ? result.output : result.direction;
}

function storyDeckOf(result) {
  if (result.contractVersion === "creative-deck-v5") {
    const brief = result.narrative.storyBrief;
    return {
      worldId: brief.world.id,
      world: brief.world.label,
      worldKind: brief.world.kind,
      researchMode: brief.world.researchMode,
      researchLane: brief.world.researchLane,
      tensionId: brief.tension.id,
      tensionFamily: brief.tension.family,
      castId: brief.cast.id,
      cast: brief.cast.label,
      scaleId: brief.scale.id,
      scale: brief.scale.label,
      motionId: brief.motion.id,
      motion: brief.motion.label,
    };
  }
  if (result.contractVersion !== "creative-deck-v4") return result.story;
  return {
    worldId: result.story.world.id,
    world: result.story.world.label,
    worldKind: result.story.world.kind,
    researchMode: result.story.world.researchMode,
    researchLane: result.story.world.researchLane,
    tensionId: result.story.tension.id,
    tensionFamily: result.story.tension.family,
    castId: result.story.cast.id,
    cast: result.story.cast.label,
    scaleId: result.story.scale.id,
    scale: result.story.scale.label,
    motionId: result.story.motion.id,
    motion: result.story.motion.label,
  };
}

function buildDeckForTest({ date, variant = 0, adaptationVariant = 0 } = {}) {
  if (date < "2026-07-31") return buildDailyCreativeSeed({ date, variant });
  const narrative = buildDailyCreativeSeed({ date, variant, stage: "narrative" });
  const adaptation = buildDailyCreativeSeed({
    date,
    variant,
    adaptationVariant,
    stage: "adaptation",
  });
  const output = buildDailyCreativeSeed({ date, variant, stage: "output" });
  return {
    ...narrative,
    adaptation: adaptation.adaptation,
    adaptationSeedFingerprint: adaptation.adaptationSeedFingerprint,
    output: output.output,
    outputStyleSeedFingerprint: output.outputStyleSeedFingerprint,
  };
}

test("same Seoul date and variant produce the same creative seed", () => {
  const first = buildDailyCreativeSeed({ date: "2026-07-21" });
  const second = buildDailyCreativeSeed({ date: "2026-07-21" });
  assert.deepEqual(first, second);

  const expandedFirst = buildDailyCreativeSeed({ date: "2026-07-25" });
  const expandedSecond = buildDailyCreativeSeed({ date: "2026-07-25" });
  assert.deepEqual(expandedFirst, expandedSecond);

  const storyFirst = buildDailyCreativeSeed({ date: "2026-07-28" });
  const storySecond = buildDailyCreativeSeed({ date: "2026-07-28" });
  assert.deepEqual(storyFirst, storySecond);

  const fourPanelFirst = buildDailyCreativeSeed({ date: "2026-07-30" });
  const fourPanelSecond = buildDailyCreativeSeed({ date: "2026-07-30" });
  assert.deepEqual(fourPanelFirst, fourPanelSecond);
});

test("date or explicit variant changes the creative seed", () => {
  const baseline = buildDailyCreativeSeed({ date: "2026-07-21" });
  const tomorrow = buildDailyCreativeSeed({ date: "2026-07-22" });
  const reroll = buildDailyCreativeSeed({ date: "2026-07-21", variant: 1 });
  assert.notEqual(baseline.seedFingerprint, tomorrow.seedFingerprint);
  assert.notEqual(baseline.seedFingerprint, reroll.seedFingerprint);
});

test("adjacent days in the contract year do not repeat the full directed draw", () => {
  const start = Date.parse("2026-01-01T00:00:00Z");
  let previous = "";
  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(start + offset * 86400000).toISOString().slice(0, 10);
    const result = buildDeckForTest({ date });
    const signature = JSON.stringify({
      story: result.contractVersion === "creative-deck-v5"
        ? result.narrative
        : result.contractVersion === "creative-deck-v4"
          ? result.story
          : { anchor: result.anchor, metadata: result.story },
      output: outputOf(result),
    });
    assert.notEqual(signature, previous, date);
    previous = signature;
  }
});

test("draws a compatible directed composition without broad emotion labels", () => {
  const result = buildDailyCreativeSeed({ date: "2026-07-21" });
  assert.equal(result.ok, true);
  assert.ok(result.anchor.humanTension.length > 10);
  assert.ok(result.anchor.everydayScene.length > 5);
  assert.ok(result.direction.medium.length > 3);
  assert.ok(["obey", "break"].includes(result.direction.mode));
  assert.equal(result.direction.mode === "break", Boolean(result.direction.breakPoint));
  assert.match(result.synthesisRule, /precise mixed emotional arc/);
});

test("preserves gallery-stable legacy seeds through the style reservoir cutover", () => {
  const result = buildDailyCreativeSeed({ date: "2026-07-24", variant: 0 });
  assert.equal(result.contractVersion, "creative-deck-v1");
  assert.equal(result.seedFingerprint, "63a31284a782b1f2");
  assert.equal(result.direction.medium, "손자국이 남은 클레이 디오라마");
});

test("preserves style-expanded gallery seeds through the story reservoir cutover", () => {
  const result = buildDailyCreativeSeed({ date: "2026-07-27", variant: 0 });
  assert.equal(result.contractVersion, "creative-deck-v2");
  assert.equal(result.seedFingerprint, "09b8e09406f7455a");
  assert.equal(result.anchor.humanTension, "용서는 했지만 관계의 작은 습관에는 아직 조심스러운 흔적이 남아 있다");
  assert.equal(result.direction.mediumId, "paper-quilling-shadowbox");
});

test("expanded style reservoir avoids recent medium cards deterministically", () => {
  const start = Date.parse("2026-07-25T00:00:00Z");
  const recentMediumIds = [];
  const signatures = new Set();
  const sources = new Set();
  let previousContractVersion = "";

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(start + offset * 86400000).toISOString().slice(0, 10);
    const result = buildDeckForTest({ date });
    const output = outputOf(result);
    assert.ok([
      "creative-deck-v2",
      "creative-deck-v3",
      "creative-deck-v4",
      "creative-deck-v5",
    ].includes(result.contractVersion));
    if (
      ["creative-deck-v4", "creative-deck-v5"].includes(result.contractVersion)
      && previousContractVersion !== result.contractVersion
    ) {
      recentMediumIds.length = 0;
    }
    assert.ok(output.mediumId);
    assert.ok(output.styleTreatmentId);
    assert.equal(output.styleLookbackDays, 7);
    assert.equal(output.stylePoolExhausted, false, date);
    assert.ok(!recentMediumIds.includes(output.mediumId), `${date}: ${output.mediumId}`);
    recentMediumIds.push(output.mediumId);
    if (recentMediumIds.length > 7) recentMediumIds.shift();
    signatures.add(output.styleSignature);
    sources.add(output.mediumSource);
    previousContractVersion = result.contractVersion;
  }

  assert.ok(signatures.size > 100);
  assert.deepEqual([...sources].sort(), ["core", "reservoir"]);
});

test("story and visual-style reference reservoirs have disjoint ownership", () => {
  assert.deepEqual(
    Object.keys(legacyStoryDeck).sort(),
    ["dramaturgies", "id", "schemaVersion", "sourcePolicy"],
  );
  assert.deepEqual(
    Object.keys(styleReservoir).sort(),
    ["id", "media", "schemaVersion", "sourcePolicy", "treatments"],
  );
  assert.deepEqual(
    Object.keys(visualStyleCoreDeck).sort(),
    ["compositions", "id", "media", "schemaVersion", "sourcePolicy"],
  );
  assert.deepEqual(
    Object.keys(storyReservoir).sort(),
    [
      "castPatterns",
      "id",
      "motions",
      "researchBasis",
      "scales",
      "schemaVersion",
      "sourcePolicy",
      "tensions",
      "worlds",
    ],
  );
  assert.doesNotMatch(
    JSON.stringify([styleReservoir, visualStyleCoreDeck]),
    /researchBasis|worlds|tensions|castPatterns|scales|motions/,
  );
  assert.doesNotMatch(
    JSON.stringify([storyReservoir, legacyStoryDeck]),
    /"media"|"treatments"|"mediumId"|"styleTreatment"/,
  );
  assert.doesNotMatch(
    creativeSeedSource,
    /const (?:DRAMATURGIES|MEDIA|COMPOSITIONS|CORE_MEDIA_FAMILIES)\b/,
  );
});

test("story deck balances worlds, cast sizes, scales, and narrative motions", () => {
  const start = Date.parse("2026-07-28T00:00:00Z");
  const worlds = [];
  const casts = [];
  const scales = [];
  const motions = [];

  for (let offset = 0; offset < 19; offset += 1) {
    const date = new Date(start + offset * 86400000).toISOString().slice(0, 10);
    const result = buildDeckForTest({ date });
    const anchors = anchorsOf(result);
    const story = storyDeckOf(result);
    assert.ok([
      "creative-deck-v3",
      "creative-deck-v4",
      "creative-deck-v5",
    ].includes(result.contractVersion));
    assert.ok(anchors.storyScene);
    assert.ok(anchors.worldLogic);
    assert.ok(story.world);
    assert.ok(story.cast);
    assert.ok(story.scale);
    assert.ok(story.motion);
    if (result.contractVersion === "creative-deck-v3") {
      assert.match(result.visualStoryRule, /subject, desire, obstacle, change, and visual proof/);
    } else if (result.contractVersion === "creative-deck-v4") {
      assert.match(result.adaptation.contract.rule, /exactly four causally linked beats/);
    } else {
      assert.equal(result.adaptation.contract.ownsStoryboard, true);
    }
    worlds.push(story.worldId);
    casts.push(story.castId);
    scales.push(story.scaleId);
    motions.push(story.motionId);
  }

  assert.equal(new Set(worlds).size, 19);
  assert.equal(new Set(casts.slice(0, 8)).size, 8);
  assert.equal(new Set(scales.slice(0, 6)).size, 6);
  assert.ok(new Set(motions.slice(0, 10)).size >= 8);
  assert.equal(new Set(motions).size, 10);
  assert.ok(worlds.includes("fairy-tale-threshold"));
  assert.ok(worlds.includes("dream-discontinuity"));
  assert.ok(worlds.includes("deep-sea-expedition"));
  assert.ok(worlds.includes("living-heritage-workshop"));
  assert.ok(casts.includes("trio"));
  assert.ok(casts.includes("community"));
  assert.ok(casts.includes("no-human"));
});

test("preserves single-frame story seeds through the four-panel cutover", () => {
  const result = buildDailyCreativeSeed({ date: "2026-07-29", variant: 0 });
  assert.equal(result.contractVersion, "creative-deck-v3");
  assert.equal(result.seedFingerprint, "55820f569054d8cd");
  assert.equal(result.format, undefined);
  assert.match(result.visualStoryRule, /one frame/);
});

test("four-panel contract separates story, adaptation, storyboard, and output", () => {
  const result = buildDailyCreativeSeed({ date: "2026-07-30", variant: 0 });
  assert.equal(result.contractVersion, "creative-deck-v4");
  assert.equal(result.anchor, undefined);
  assert.equal(result.direction, undefined);
  assert.equal(result.format, undefined);
  assert.equal(result.presentation, undefined);
  assert.equal(result.visualStoryRule, undefined);
  assert.equal(result.story.contract.freezeBeforeHandoff, true);
  assert.equal(result.story.contract.emits, "storySpec");
  assert.deepEqual(
    result.story.contract.requiredFields,
    ["focalSubject", "desire", "obstacle", "cost", "choice", "consequence", "residue", "joke"],
  );
  assert.deepEqual(
    result.story.contract.depthLayers,
    ["causality", "desire and cost", "relationship or theme", "world logic"],
  );
  assert.doesNotMatch(result.story.world.label, /한 장면/);

  assert.equal(result.adaptation.contract.consumes, "storySpec");
  assert.equal(result.adaptation.contract.emits, "outputBrief");
  assert.equal(result.adaptation.contract.freezeBeforeHandoff, true);
  assert.equal(result.adaptation.contract.mayAlterCoreStoryFacts, false);
  assert.deepEqual(
    result.adaptation.contract.allowedTransformations,
    [
      "select essential beats",
      "compress elapsed time",
      "externalize internal state as visible action",
      "merge nonessential actions",
      "move the comic reveal without changing its meaning",
    ],
  );
  assert.deepEqual(
    result.adaptation.contract.protectedInvariants,
    [
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
  );
  assert.deepEqual(
    result.adaptation.contract.requiredFields,
    [
      "causalCarrier",
      "panelBeats",
      "continuityInvariants",
      "omissions",
      "externalizations",
      "outputBrief",
    ],
  );
  assert.deepEqual(
    result.adaptation.contract.outputBriefFields,
    [
      "visualSubjects",
      "environmentFacts",
      "panelStates",
      "continuityTokens",
      "causalCarrier",
      "emotionalTrajectory",
      "finalVisualResidue",
    ],
  );
  assert.equal(result.adaptation.target.mode, "four-panel-comic");
  assert.equal(result.adaptation.target.beatCount, 4);
  assert.deepEqual(
    result.adaptation.target.beatRoles.map((beat) => beat.id),
    ["setup", "pressure", "turn", "residue"],
  );
  assert.deepEqual(result.adaptation.contract.depthLayers, ["surface action"]);

  assert.equal(result.storyboard.contract.consumes, "outputBrief");
  assert.equal(result.storyboard.contract.emits, "storyboardHandoff");
  assert.equal(result.storyboard.contract.loadsCreativeReferences, false);
  assert.equal(result.storyboard.render.colorPolicy, "strict monochrome black, white, and neutral gray only; no color");
  assert.equal(result.storyboard.render.finalArt, false);
  assert.deepEqual(
    result.storyboard.contract.validationChecks,
    [
      "intendedCameraAngle",
      "actionTokenOrCausalObjectMovementDirection",
      "cutSequence",
      "withinFrameSpatialRelationships",
      "firstTimeReaderCausality",
      "stateTimingNoAnticipation",
      "actorObjectRelationshipLegibility",
    ],
  );
  assert.match(result.storyboard.render.lineStyle, /rough hand-drawn sketch/);
  assert.match(result.storyboard.render.detailBudget, /minimum background geometry/);
  assert.match(result.storyboard.render.actorPolicy, /human construction armatures/);
  assert.match(result.storyboard.render.actorPolicy, /non-human geometric tokens/);
  assert.match(result.storyboard.contract.causalityPreflight.join(" "), /state-timing table/);

  assert.equal(result.output.contract.consumes, "storyboardHandoff");
  assert.equal(result.output.contract.inputClosed, true);
  assert.equal(result.output.contract.requiresStoryboardApproval, true);
  assert.equal(result.output.contract.mayAlterAdaptedEvents, false);
  assert.equal(result.output.render.assetCount, 1);
  assert.equal(result.output.render.panelCount, 4);
  assert.equal(result.output.render.layout, "2x2");
  assert.deepEqual(result.output.contract.depthLayers, ["formal metaphor"]);

  assert.doesNotMatch(JSON.stringify(result.story), /mediumId|panelCount|dominantRule/);
  assert.doesNotMatch(JSON.stringify(result.adaptation), /mediumId|dominantRule|humanTension/);
  assert.doesNotMatch(JSON.stringify(result.storyboard), /storySpec|mediumId|dominantRule|humanTension/);
  assert.doesNotMatch(JSON.stringify(result.output), /humanTension|worldId|comicTurn|beatRoles/);
  assert.match(result.synthesisRule, /StorySpec and the output stage never inspect or reference one another/);
  assert.match(result.synthesisRule, /Storyboard validates it and emits approved storyboardHandoff/);
});

test("stage projections enforce the StorySpec to StoryboardHandoff information boundary", () => {
  const args = { date: "2026-07-30", variant: 0 };
  const story = buildDailyCreativeSeed({ ...args, stage: "story" });
  const adaptation = buildDailyCreativeSeed({ ...args, stage: "adaptation" });
  const storyboard = buildDailyCreativeSeed({ ...args, stage: "storyboard" });
  const output = buildDailyCreativeSeed({ ...args, stage: "output" });

  assert.equal(story.stage, "story");
  assert.ok(story.story);
  assert.equal(story.adaptation, undefined);
  assert.equal(story.storyboard, undefined);
  assert.equal(story.output, undefined);
  assert.doesNotMatch(
    JSON.stringify(story),
    /adaptation|storyboard|output|format|panel|camera|medium|composition|layout|render/i,
  );

  assert.equal(adaptation.stage, "adaptation");
  assert.equal(adaptation.story, undefined);
  assert.ok(adaptation.adaptation);
  assert.equal(adaptation.storyboard, undefined);
  assert.equal(adaptation.output, undefined);
  assert.doesNotMatch(JSON.stringify(adaptation), /humanTension|worldId|mediumId|dominantRule/);

  assert.equal(storyboard.stage, "storyboard");
  assert.equal(storyboard.story, undefined);
  assert.equal(storyboard.adaptation, undefined);
  assert.ok(storyboard.storyboard);
  assert.equal(storyboard.output, undefined);
  assert.doesNotMatch(
    JSON.stringify(storyboard),
    /storySpec|humanTension|worldId|mediumId|dominantRule/,
  );

  assert.equal(output.stage, "output");
  assert.equal(output.story, undefined);
  assert.equal(output.adaptation, undefined);
  assert.equal(output.storyboard, undefined);
  assert.ok(output.output);
  assert.doesNotMatch(JSON.stringify(output), /storySpec|humanTension|worldId|comicTurn|beatRoles/);

  assert.equal(story.seedFingerprint, adaptation.seedFingerprint);
  assert.equal(adaptation.seedFingerprint, storyboard.seedFingerprint);
  assert.equal(storyboard.seedFingerprint, output.seedFingerprint);
});

test("stage builders load only their owned creative reference domain", () => {
  const builderStart = creativeSeedSource.indexOf("function buildStoryExpandedCreativeSeed");
  const builderEnd = creativeSeedSource.indexOf("\nfunction projectFourPanelStage", builderStart);
  const builder = creativeSeedSource.slice(builderStart, builderEnd);
  const adaptationReturn = builder.indexOf('stage === "adaptation"');
  const storyboardReturn = builder.indexOf('stage === "storyboard"');
  const outputReturn = builder.indexOf('stage === "output"');
  const storyLoad = builder.indexOf("selectStoryTheme(selectedDate, variant)");
  const storyReturn = builder.indexOf('stage === "story"');
  const combinedOutput = builder.indexOf("buildFourPanelOutput(selectedDate, variant)", storyReturn);

  assert.ok(adaptationReturn >= 0 && adaptationReturn < storyLoad);
  assert.ok(storyboardReturn >= 0 && storyboardReturn < storyLoad);
  assert.ok(outputReturn >= 0 && outputReturn < storyLoad);
  assert.ok(storyLoad >= 0 && storyLoad < storyReturn);
  assert.ok(storyReturn >= 0 && storyReturn < combinedOutput);

  const outputBuilderStart = creativeSeedSource.indexOf("function buildFourPanelOutput");
  const outputBuilderEnd = creativeSeedSource.indexOf(
    "\nfunction buildFourPanelStory",
    outputBuilderStart,
  );
  const outputBuilder = creativeSeedSource.slice(outputBuilderStart, outputBuilderEnd);
  assert.match(outputBuilder, /styleReservoir\(\)/);
  assert.doesNotMatch(outputBuilder, /selectStoryTheme|storyThemeReservoir/);
});

test("present-day unseen worlds request primary-source grounding without inventing news", () => {
  const start = Date.parse("2026-07-28T00:00:00Z");
  const results = [];
  for (let offset = 0; offset < 19; offset += 1) {
    const date = new Date(start + offset * 86400000).toISOString().slice(0, 10);
    results.push(buildDeckForTest({ date }));
  }
  const currentWorlds = results.filter(
    (result) => storyDeckOf(result).researchMode === "current-primary-source",
  );
  assert.ok(currentWorlds.length >= 7);
  for (const result of currentWorlds) {
    const story = storyDeckOf(result);
    assert.ok(story.researchLane);
    assert.equal(story.worldKind, "contemporary-unseen");
  }
});

test("story combinations obey world and tension compatibility constraints", () => {
  const worlds = new Map(storyReservoir.worlds.map((item) => [item.id, item]));
  const tensions = new Map(storyReservoir.tensions.map((item) => [item.id, item]));
  const start = Date.parse("2026-07-28T00:00:00Z");

  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(start + offset * 86400000).toISOString().slice(0, 10);
    const result = buildDeckForTest({ date });
    const story = storyDeckOf(result);
    const world = worlds.get(story.worldId);
    const tension = tensions.get(story.tensionId);
    assert.ok(!tension.excludedWorldKinds?.includes(world.kind), `${date}: ${tension.id} / ${world.kind}`);
    assert.ok(!world.compatibleCastIds || world.compatibleCastIds.includes(story.castId), date);
    assert.ok(!tension.compatibleCastIds || tension.compatibleCastIds.includes(story.castId), date);
    assert.ok(!world.compatibleMotionIds || world.compatibleMotionIds.includes(story.motionId), date);
  }
});

test("three-engine v5 exposes only Narrative, Adaptation-with-Storyboard, or Output", () => {
  const args = { date: "2026-07-31", variant: 0 };
  const narrative = buildDailyCreativeSeed({ ...args, stage: "narrative" });
  const adaptation = buildDailyCreativeSeed({
    ...args,
    adaptationVariant: 0,
    stage: "adaptation",
  });
  const output = buildDailyCreativeSeed({ ...args, stage: "output" });

  assert.equal(narrative.contractVersion, "creative-deck-v5");
  assert.equal(narrative.stage, "narrative");
  assert.ok(narrative.narrative.storyBrief);
  assert.equal(narrative.adaptation, undefined);
  assert.equal(narrative.output, undefined);
  assert.deepEqual(
    Object.keys(narrative).sort(),
    [
      "contractVersion",
      "date",
      "narrative",
      "narrativeSeedFingerprint",
      "narrativeVariant",
      "ok",
      "stage",
      "timezone",
    ],
  );
  assert.doesNotMatch(
    JSON.stringify(narrative),
    /formatId|panelCount|cameraAngle|layout|mediumId|outputStyle|adaptationVariant/,
  );

  assert.equal(adaptation.stage, "adaptation");
  assert.equal(adaptation.narrative, undefined);
  assert.equal(adaptation.output, undefined);
  assert.equal(adaptation.adaptation.contract.ownsStoryboard, true);
  assert.equal(adaptation.adaptation.storyboardPolicy.maximumAttempts, 2);
  assert.match(adaptation.adaptation.storyboardPolicy.actorPolicy, /human construction armatures/);
  assert.match(adaptation.adaptation.storyboardPolicy.actorPolicy, /non-human geometric tokens/);
  assert.match(adaptation.adaptation.storyboardPolicy.causalityPreflight.join(" "), /no future solved state/);
  assert.equal(adaptation.adaptation.formatContract.formatId, "four-panel-comic");
  assert.equal(adaptation.adaptation.formatContract.unitCount, 4);
  assert.ok(adaptation.adaptation.storyboardHandoffContract.requiredFields.includes("lockedCamera"));
  assert.doesNotMatch(
    JSON.stringify(adaptation),
    /storyBrief|humanTension|outputStyle|mediumId|styleTreatmentId/,
  );

  assert.equal(output.stage, "output");
  assert.equal(output.narrative, undefined);
  assert.equal(output.adaptation, undefined);
  assert.deepEqual(
    output.output.contract.consumesExactly,
    ["StoryboardHandoff", "OutputStyle"],
  );
  assert.equal(output.output.contract.inputClosed, true);
  assert.doesNotMatch(
    JSON.stringify(output),
    /NarrativeSpec|StoryBrief|AdaptationSpec|changeLedger|humanTension|adaptationVariant/,
  );
});

test("adaptation reroll is independent from Narrative and OutputStyle selection", () => {
  const base = { date: "2026-07-31", variant: 4 };
  const narrative = buildDailyCreativeSeed({ ...base, stage: "narrative" });
  const first = buildDailyCreativeSeed({
    ...base,
    adaptationVariant: 0,
    stage: "adaptation",
  });
  const reroll = buildDailyCreativeSeed({
    ...base,
    adaptationVariant: 1,
    stage: "adaptation",
  });
  const output = buildDailyCreativeSeed({ ...base, stage: "output" });

  assert.equal(narrative.narrativeVariant, 4);
  assert.notEqual(first.adaptationSeedFingerprint, reroll.adaptationSeedFingerprint);
  assert.equal(first.adaptation.interpretationMode, "faithful-visible-translation");
  assert.notEqual(reroll.adaptation.interpretationMode, "faithful-visible-translation");
  assert.equal(
    output.outputStyleSeedFingerprint,
    buildDailyCreativeSeed({ ...base, adaptationVariant: 99, stage: "output" })
      .outputStyleSeedFingerprint,
  );
});

test("rejects invalid dates and variants", () => {
  assert.throws(() => buildDailyCreativeSeed({ date: "2026-02-30" }), /invalid date/);
  assert.throws(() => buildDailyCreativeSeed({ date: "2026-07-21", variant: -1 }), /variant/);
  assert.throws(
    () => buildDailyCreativeSeed({
      date: "2026-07-31",
      adaptationVariant: -1,
      stage: "adaptation",
    }),
    /adaptationVariant/,
  );
  assert.throws(
    () => buildDailyCreativeSeed({ date: "2026-07-31" }),
    /requires stage narrative, adaptation, or output/,
  );
  assert.throws(
    () => buildDailyCreativeSeed({
      date: "2026-07-31",
      formatId: "single-frame",
      stage: "adaptation",
    }),
    /unsupported visual format/,
  );
  assert.throws(
    () => buildDailyCreativeSeed({ date: "2026-07-30", stage: "renderer" }),
    /stage must be one of story, adaptation, storyboard, or output/,
  );
  assert.throws(
    () => buildDailyCreativeSeed({ date: "2026-07-29", stage: "story" }),
    /stage projection requires creative-deck-v4/,
  );
});
