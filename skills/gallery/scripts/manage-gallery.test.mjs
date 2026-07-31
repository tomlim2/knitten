#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { addEntry, loadEntries, normalizeMetadata } from "./manage-gallery.mjs";

const root = mkdtempSync(path.join(os.tmpdir(), "knitten-gallery-test-"));
const image = path.join(root, "source.png");
writeFileSync(image, Buffer.from("89504e470d0a1a0a", "hex"));

const metadata = {
  schemaVersion: 1,
  id: "2026-07-22-v0-test-seed",
  date: "2026-07-22",
  variant: 0,
  seedFingerprint: "test-seed",
  title: "테스트 작품",
  emotionArc: "기대가 안도로 누그러진다",
  scene: "빈 식탁",
  medium: "종이 콜라주",
  compositionRule: "대칭",
  directionChoice: "컵 하나만 축을 깬다",
  punchline: "과한 준비가 웃음을 만든다",
  joke: "테스트 농담",
  rationale: "따뜻함과 빈자리를 함께 보이기 위해서다.",
  prompt: "A prompt with <unsafe> & exact line breaks\nsecond line",
  sourceSkill: "daily-visual-story",
  generatedAt: "2026-07-22T08:56:04+09:00",
};

try {
  assert.equal(normalizeMetadata(metadata).id, metadata.id);
  const first = addEntry({ root, imagePath: image, metadata });
  assert.equal(first.idempotent, false);
  assert.equal(first.count, 1);
  assert.equal(loadEntries(root).length, 1);
  const html = readFileSync(first.htmlPath, "utf8");
  assert.match(html, /Knitten Gallery/);
  assert.match(html, /왜 이렇게 만들었나/);
  assert.match(html, /실제 생성 프롬프트/);
  assert.match(html, /&lt;unsafe&gt; &amp; exact line breaks/);

  const second = addEntry({ root, imagePath: image, metadata });
  assert.equal(second.idempotent, true);

  const threeEngineMetadata = {
    ...metadata,
    schemaVersion: 2,
    id: "2026-07-31-v3-a2-v5-seed",
    date: "2026-07-31",
    variant: 3,
    narrativeVariant: 3,
    adaptationVariant: 2,
    formatId: "four-panel-comic",
    seedFingerprint: "v5-seed",
    prompt: "StoryboardHandoff + OutputStyle only",
    processArtifacts: [
      {
        schemaVersion: 1,
        layer: "adaptation",
        role: "approved-storyboard",
        title: "Approved rough storyboard",
        description: "The rough board passed to Output.",
        sourcePath: image,
      },
    ],
    stylingHandoff: {
      schemaVersion: 1,
      summary: "Adaptation passes the UI specification to Styling: rough board, subjects, scene, panel states, and locks.",
      visibleSubjects: [
        "simple figures",
        "one central object",
      ],
      environmentFacts: [
        "small room",
        "single window",
      ],
      unitStates: [
        { unit: "top-left", state: "problem state" },
        { unit: "top-right", state: "cause state" },
        { unit: "bottom-left", state: "action state" },
        { unit: "bottom-right", state: "result state" },
      ],
      continuityTokens: [
        "rope",
        "lamp",
      ],
      causalCarrier: "gesture moves rope, rope moves lamp",
      lockedCamera: "four fixed panel cameras",
      lockedMovement: "left-to-right cause path",
      lockedOrder: [
        "problem",
        "cause",
        "action",
        "result",
      ],
      lockedSpatialRelationships: [
        "object stays center",
        "characters stay around object",
      ],
      emotionalTrajectoryAsVisibleState: "hesitation becomes relief",
      finalVisualResidue: "unused tool remains visible",
      permittedFinishFlex: [
        "apply texture",
        "preserve panel states",
      ],
    },
    engineProvenance: {
      contractVersion: "creative-deck-v5",
      narrative: {
        schemaVersion: 1,
        seedFingerprint: "narrative-seed",
        artifactFingerprint: "narrative-artifact",
        authorKind: "active-codex-model",
        authorRole: "narrative-author",
        effectiveModel: "runtime-recorded-model",
        prompt: "Narrative prompt",
      },
      adaptation: {
        schemaVersion: 1,
        variant: 2,
        seedFingerprint: "adaptation-seed",
        inputFingerprint: "narrative-plus-format",
        artifactFingerprint: "storyboard-package",
        storyboardAttemptCount: 1,
        validationFingerprint: "validation-pass",
        storyboardRasterSha256: "storyboard-sha",
        prompt: "Adaptation and rough storyboard prompt",
      },
      output: {
        schemaVersion: 1,
        styleId: "paper-and-ink",
        inputFingerprint: "handoff-plus-style",
        artifactFingerprint: "rendered-artifact",
        effectiveModel: "runtime-image-model",
        prompt: "StoryboardHandoff + OutputStyle only",
      },
    },
  };
  assert.equal(normalizeMetadata(threeEngineMetadata).adaptationVariant, 2);
  const third = addEntry({ root, imagePath: image, metadata: threeEngineMetadata });
  assert.equal(third.idempotent, false);
  assert.equal(third.count, 2);
  const threeEngineHtml = readFileSync(third.htmlPath, "utf8");
  assert.match(threeEngineHtml, /narrative 3 · adaptation 2/);
  assert.match(threeEngineHtml, /제작 과정/);
  assert.match(threeEngineHtml, /이야기 계층/);
  assert.match(threeEngineHtml, /각색 계층/);
  assert.match(threeEngineHtml, /스타일링 계층/);
  assert.match(threeEngineHtml, /Adaptation and rough storyboard prompt/);
  assert.match(threeEngineHtml, /Approved rough storyboard/);
  assert.match(threeEngineHtml, /2026-07-31-v3-a2-v5-seed--adaptation-approved-storyboard.png/);
  assert.match(threeEngineHtml, /paper-and-ink/);
  assert.match(threeEngineHtml, /각색에서 스타일링으로 넘긴 UI 명세/);
  assert.match(threeEngineHtml, /simple figures/);
  assert.match(threeEngineHtml, /problem state/);
  const thirdAgain = addEntry({ root, imagePath: image, metadata: threeEngineMetadata });
  assert.equal(thirdAgain.idempotent, true);

  const adaptationEvalMetadata = {
    ...metadata,
    schemaVersion: 3,
    id: "2026-07-30-v0-a0-eval-state-timing-no-anticipation",
    date: "2026-07-30",
    variant: 0,
    narrativeVariant: 0,
    adaptationVariant: 0,
    formatId: "four-panel-comic",
    seedFingerprint: "state-timing-no-anticipation",
    title: "각색 시각화 테스트: 해결 상태 선행 노출",
    emotionArc: "문제가 보이기 전 해결 결과가 먼저 보이면 감정선이 끊긴다",
    scene: "표지판, 갈라진 바닥, 우회 경로 점선이 있는 네 컷 테스트 보드",
    medium: "흑백 러프 스토리보드 테스트 시트",
    compositionRule: "1컷과 4컷을 같은 구도로 두고 before/after를 비교한다",
    directionChoice: "3컷 전에는 우회 경로를 완성하지 않고, 4컷에서만 실선으로 확정한다",
    punchline: "길이 먼저 똑똑하면 수리공은 할 일이 없다",
    joke: "점선이 너무 성실하면 이야기가 먼저 퇴근한다.",
    rationale: "각색 엔진의 상태 타이밍 게이트가 실제 이미지로 읽히는지 보존하기 위해서다.",
    prompt: "Adaptation visualization test image prompt",
    sourceSkill: "daily-visual-story/adaptation-visualization-test",
    generatedAt: "2026-07-30T12:20:00+09:00",
    adaptationEval: {
      schemaVersion: 1,
      caseId: "state-timing-no-anticipation",
      caseTitle: "Do not show the solved route before the repair action",
      caseKind: "negative",
      expectedOutcome: "fail",
      actualOutcome: "fail",
      focusGates: [
        "state-timing-no-anticipation",
        "first-time-reader-causality",
      ],
      setup: "A route marker becomes resolved in panel 1 even though the sign repair happens in panel 3.",
      verdict: "The board must fail because the visual result appears before its visible cause.",
      findings: [
        {
          gate: "state-timing-no-anticipation",
          passed: false,
          evidence: "The safe route is already solid before the repair action panel.",
        },
      ],
    },
    visualizationProvenance: {
      schemaVersion: 1,
      contractVersion: "creative-deck-v5-adaptation-eval-v1",
      exactEvaluationPrompt: "Evaluate the storyboard for future solved state anticipation.",
      exactImagePrompt: "Draw the adaptation visualization test sheet.",
    },
  };
  assert.equal(normalizeMetadata(adaptationEvalMetadata).adaptationEval.actualOutcome, "fail");
  const fourth = addEntry({ root, imagePath: image, metadata: adaptationEvalMetadata });
  assert.equal(fourth.idempotent, false);
  assert.equal(fourth.count, 3);
  const adaptationEvalHtml = readFileSync(fourth.htmlPath, "utf8");
  assert.match(adaptationEvalHtml, /각색 시각화 테스트/);
  assert.match(adaptationEvalHtml, /state-timing-no-anticipation/);
  assert.match(adaptationEvalHtml, /Draw the adaptation visualization test sheet/);

  assert.throws(
    () => addEntry({ root, imagePath: image, metadata: { ...metadata, prompt: "changed" } }),
    /already exists with different content/,
  );
  assert.throws(
    () => normalizeMetadata({ ...threeEngineMetadata, adaptationVariant: 4 }),
    /id adaptation variant does not match/,
  );
  assert.throws(
    () => normalizeMetadata({
      ...threeEngineMetadata,
      engineProvenance: {
        ...threeEngineMetadata.engineProvenance,
        narrative: {
          ...threeEngineMetadata.engineProvenance.narrative,
          formatId: "four-panel-comic",
        },
      },
    }),
    /unknown keys: formatId/,
  );
  assert.throws(
    () => normalizeMetadata({
      ...adaptationEvalMetadata,
      id: "2026-07-30-v0-a0-eval-other-case",
    }),
    /id eval case does not match/,
  );
  assert.throws(
    () => normalizeMetadata({
      ...adaptationEvalMetadata,
      adaptationEval: {
        ...adaptationEvalMetadata.adaptationEval,
        caseKind: "pretty",
      },
    }),
    /caseKind must be/,
  );
  assert.throws(() => normalizeMetadata({ ...metadata, date: "2026-02-30" }), /real YYYY-MM-DD/);
  process.stdout.write("gallery tests: ok\n");
} finally {
  rmSync(root, { recursive: true, force: true });
}
