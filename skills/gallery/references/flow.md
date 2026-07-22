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

Required metadata:

```json
{
  "schemaVersion": 1,
  "id": "2026-07-22-v0-7afc097f97093306",
  "date": "2026-07-22",
  "variant": 0,
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
  "prompt": "이미지 생성 도구에 전달한 최종 프롬프트 전문",
  "sourceSkill": "shotloom-today",
  "generatedAt": "2026-07-22T08:56:04+09:00"
}
```

- Keep `prompt` verbatim, including line breaks and constraints.
- Use `<date>-v<variant>-<seedFingerprint>` for deterministic daily entries.
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
