# Knitten Gallery Flow

## Storage

Resolve `knitten-gallery-root` through the runtime Knitten output shim. The
shim must redirect a cache-loaded skill to the persistent Knitten hub. The root
is local state under that hub, never a versioned cache or repository asset
directory.

The manager maintains:

```text
<gallery-root>/
  assets/<entry-id>.<ext>
  entries/<entry-id>.json
  index.json
  index.html
```

The copied asset keeps the gallery valid if the image-generation cache is later
cleaned. JSON entries are canonical; `index.json` and `index.html` are derived.

## Show

Run:

```bash
node <knitten-root>/skills/gallery/scripts/manage-gallery.mjs render
node <knitten-root>/skills/gallery/scripts/manage-gallery.mjs list
```

Return the absolute `index.html` path as a clickable local link. Do not open a
browser unless the user asks.

## Add

Prepare one UTF-8 metadata JSON file and run:

```bash
node <knitten-root>/skills/gallery/scripts/manage-gallery.mjs add \
  --image <generated-image-path> \
  --metadata <metadata-json-path>
```

Legacy entries remain schema v1. New three-engine daily visual stories use
schema v2:

```json
{
  "schemaVersion": 2,
  "id": "2026-07-31-v0-a1-7afc097f97093306",
  "date": "2026-07-31",
  "variant": 0,
  "narrativeVariant": 0,
  "adaptationVariant": 1,
  "formatId": "four-panel-comic",
  "seedFingerprint": "7afc097f97093306",
  "title": "먼저 서툴러질 용기",
  "emotionArc": "감정이 어떻게 움직이는지",
  "scene": "감정을 담는 생활 장면",
  "medium": "선택한 화풍과 재료",
  "compositionRule": "화면의 지배 규칙",
  "directionChoice": "규칙을 지키거나 정확히 한 번 깨는 방식",
  "punchline": "시각적 펀치라인",
  "joke": "이미지 아래에 표시한 농담",
  "rationale": "왜 이 장면·화풍·구도로 만들었는지",
  "prompt": "StoryboardHandoff + OutputStyle로 만든 최종 프롬프트 전문",
  "sourceSkill": "daily-visual-story",
  "generatedAt": "2026-07-31T08:56:04+09:00",
  "processArtifacts": [
    {
      "schemaVersion": 1,
      "layer": "adaptation",
      "role": "approved-storyboard",
      "title": "Approved rough storyboard",
      "description": "Output에 넘긴 각색 계층의 흑백 러프 스토리보드",
      "sourcePath": "/absolute/path/to/storyboard.png"
    }
  ],
  "stylingHandoff": {
    "schemaVersion": 1,
    "summary": "각색 계층이 스타일링 계층에 넘기는 UI 명세",
    "visibleSubjects": [
      "대략적인 인물·오브젝트 설명"
    ],
    "environmentFacts": [
      "대략적인 배경·공간 설명"
    ],
    "unitStates": [
      {
        "unit": "top-left",
        "state": "해당 컷의 visible state"
      }
    ],
    "continuityTokens": [
      "반복되는 원인 토큰"
    ],
    "causalCarrier": "원인이 화면에서 이동하는 방식",
    "lockedCamera": "스타일링이 보존해야 할 카메라",
    "lockedMovement": "스타일링이 보존해야 할 움직임",
    "lockedOrder": [
      "problem",
      "cause",
      "action",
      "result"
    ],
    "lockedSpatialRelationships": [
      "스타일링이 보존해야 할 공간 관계"
    ],
    "emotionalTrajectoryAsVisibleState": "감정 이동을 화면 상태로 표현한 문장",
    "finalVisualResidue": "마지막에 남아야 하는 시각 잔여물",
    "permittedFinishFlex": [
      "스타일링이 바꿔도 되는 finish 범위"
    ]
  },
  "engineProvenance": {
    "contractVersion": "creative-deck-v5",
    "narrative": {
      "schemaVersion": 1,
      "seedFingerprint": "narrative-seed",
      "artifactFingerprint": "narrative-artifact",
      "authorKind": "active-codex-model",
      "authorRole": "narrative-author",
      "effectiveModel": "runtime-recorded-model",
      "prompt": "Narrative prompt 전문"
    },
    "adaptation": {
      "schemaVersion": 1,
      "variant": 1,
      "seedFingerprint": "adaptation-seed",
      "inputFingerprint": "narrative-plus-format",
      "artifactFingerprint": "storyboard-package",
      "storyboardAttemptCount": 1,
      "validationFingerprint": "validation-pass",
      "storyboardRasterSha256": "storyboard-sha256",
      "prompt": "Adaptation과 rough Storyboard prompt 전문"
    },
    "output": {
      "schemaVersion": 1,
      "styleId": "style-id",
      "inputFingerprint": "handoff-plus-style",
      "artifactFingerprint": "rendered-artifact",
      "effectiveModel": "runtime-image-model",
      "prompt": "StoryboardHandoff + OutputStyle 최종 prompt 전문"
    }
  }
}
```

- Keep every engine prompt verbatim, including line breaks and constraints.
- Render schema-v2 four-panel entries with a process accordion split into
  Narrative, Adaptation/Storyboard, and Styling/Output layers so the final
  image can be inspected together with the production path.
- When an intermediate raster is used to produce the final output, add it as a
  `processArtifacts` item. The gallery manager copies each source image into
  `assets/` and stores only the copied filename, digest, and byte size in the
  canonical entry.
- Treat `processArtifacts` as the visual evidence ledger for the entry, not as
  a single selected preview. When multiple visual attempts or examples are used
  to judge a layer, include all deliberate evidence images: approved
  storyboards, rejected styling attempts, diagnostic variants, and the final
  approved styling example when it clarifies the decision.
- Use `stylingHandoff` to show what Adaptation passes to Styling: the UI-like
  screen specification that Styling turns into GUI-like final art.
- Use
  `<date>-v<narrativeVariant>-a<adaptationVariant>-<seedFingerprint>` for
  schema-v2 entries. Every explicitly approved adaptation variant is a separate
  entry and never overwrites another.
- Keep schema-v1 ids and metadata readable and unchanged.
- Adaptation visualization test cases use schema v3. These are local daily
  gallery entries for checking whether an Adaptation storyboard is visually
  readable before Output, not replacement daily-story engine records:

```json
{
  "schemaVersion": 3,
  "id": "2026-07-30-v0-a0-eval-state-timing-no-anticipation",
  "date": "2026-07-30",
  "variant": 0,
  "narrativeVariant": 0,
  "adaptationVariant": 0,
  "formatId": "four-panel-comic",
  "seedFingerprint": "state-timing-no-anticipation",
  "title": "각색 시각화 테스트: 해결 상태 선행 노출",
  "emotionArc": "문제, 원인, 행동, 결과가 처음 보는 사람에게 읽히는지",
  "scene": "표지판, 갈라진 바닥, 우회 경로 점선이 있는 네 컷 테스트 보드",
  "medium": "흑백 러프 스토리보드 테스트 시트",
  "compositionRule": "1컷과 4컷을 같은 구도로 두고 before/after를 비교한다",
  "directionChoice": "3컷 전에는 우회 경로를 완성하지 않는다",
  "punchline": "해결 경로가 원인 행동보다 먼저 등장하면 실패한다",
  "joke": "점선이 너무 성실하면 이야기가 먼저 퇴근한다.",
  "rationale": "각색 엔진의 상태 타이밍 게이트가 실제 이미지로 읽히는지 보존하기 위해서다.",
  "prompt": "각색 시각화 테스트 이미지 생성 프롬프트 전문",
  "sourceSkill": "daily-visual-story/adaptation-visualization-test",
  "generatedAt": "2026-07-30T12:20:00+09:00",
  "adaptationEval": {
    "schemaVersion": 1,
    "caseId": "state-timing-no-anticipation",
    "caseTitle": "Do not show the solved route before the repair action",
    "caseKind": "negative",
    "expectedOutcome": "fail",
    "actualOutcome": "fail",
    "focusGates": [
      "state-timing-no-anticipation",
      "first-time-reader-causality"
    ],
    "setup": "A route marker becomes resolved before the sign repair.",
    "verdict": "The board fails because the visual result appears before its visible cause.",
    "findings": [
      {
        "gate": "state-timing-no-anticipation",
        "passed": false,
        "evidence": "The safe route is already solid before the repair action panel."
      }
    ]
  },
  "visualizationProvenance": {
    "schemaVersion": 1,
    "contractVersion": "creative-deck-v5-adaptation-eval-v1",
    "exactEvaluationPrompt": "평가에 사용한 프롬프트 전문",
    "exactImagePrompt": "이미지 생성에 사용한 프롬프트 전문"
  }
}
```

- Use
  `<date>-v<narrativeVariant>-a<adaptationVariant>-eval-<caseId>` for schema-v3
  entries. `caseId` must match `adaptationEval.caseId`.
- `caseKind` is one of `positive`, `negative`, `comparison`, or `diagnostic`.
- `expectedOutcome` and `actualOutcome` are one of `pass`, `fail`, or `mixed`.
- Store both the exact evaluation prompt and the exact image prompt. Do not
  label a reconstructed prompt as exact.
- If a pre-contract entry has no seed, use a truthful stable marker such as
  `pre-seed-contract`; do not invent a fingerprint.
- The same id plus identical image and metadata is idempotent. A conflicting
  duplicate must stop instead of silently replacing history.
- After a successful add, report the entry path and gallery index path.

## Backfill

Backfill only entries whose source image and exact original prompt can be
verified from the active conversation or its durable session record. Record
the original generation date, not the import date. Explain uncertainty in the
metadata instead of filling gaps with guesses.

## Binding Rules

- Preserve source images; copy, do not move.
- Keep the prompt complete and unredacted unless it contains private data. If
  it does, stop and ask before storing it.
- Escape all metadata when rendering HTML.
- Use no remote assets, analytics, scripts, or network calls in the gallery.
