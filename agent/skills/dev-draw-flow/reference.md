# dev-draw-flow — reference patterns

Templates and worked examples for the ASCII pipeline diagrams produced by this skill.

---

## Box templates

### Standard module box (~50 char wide)

```
┌──────────────────────────────────────────────────┐
│ {module-name} — {one-line role}                  │
│                                                  │
│ IN:  {input type 1}                              │
│      {input type 2}                              │
│ OUT: {output type 1}                             │
│      {output type 2}                             │
│                                                  │
│ fn:  {driver_fn_1()}                             │
│      {driver_fn_2()}                             │
│                                                  │
│ {optional notes / canonical / ADR refs / status} │
└──────────────────────────────────────────────────┘
```

### Three-up parallel modules (~25 char each, total ~78)

```
┌────────────────────────┐ ┌────────────────────────┐ ┌────────────────────────┐
│ {module-1}             │ │ {module-2}             │ │ {module-3}             │
│                        │ │                        │ │                        │
│ IN:  {short}           │ │ IN:  {short}           │ │ IN:  {short}           │
│ OUT: {short}           │ │ OUT: {short}           │ │ OUT: {short}           │
│                        │ │                        │ │                        │
│ fn:  {fn()}            │ │ fn:  {fn()}            │ │ fn:  {fn()}            │
│                        │ │                        │ │                        │
│ {note / status}        │ │ {note / status}        │ │ {note / status}        │
└───────────┬────────────┘ └───────────┬────────────┘ └───────────┬────────────┘
```

### Wide runtime box (~76 char)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ {runtime-or-engine-module} — {role}                                      │
│                                                                          │
│ {longer prose / component list / co-location notes}                      │
│   · {bullet 1}                                                           │
│   · {bullet 2}                                                           │
│                                                                          │
│ fn: {driver fns}                                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Connector patterns

### Single → single (with type label)

```
            │
            │ {TypeName}
            │
            ▼
```

### Fan-out (one → many, with per-branch type labels)

```
            │
            │
   ┌────────┼────────┐
   │        │        │
{T1}     {T2}     {T3}
   ▼        ▼        ▼
```

### Fan-in (many → one)

```
   {T1}     {T2}     {T3}
    │        │        │
    └────────┼────────┘
             │
             ▼
```

### Bypass lane (one path skips, parallel rejoin)

```
   ┌─────────────┐                            │
   │ Module A    │                            │ {bypass type}
   │ (main path) │                            │
   └──────┬──────┘                            │
          │ {after-A type}                    │
          ▼                                   │
   ┌─────────────┐                            │
   │ Module B    │                            │
   └──────┬──────┘                            │
          │ {after-B type}                    │
          │                                   │
          ▼                                   ▼
   ┌────────────────────────────────────────────┐
   │ Rejoin at runtime / consumer                │
   └────────────────────────────────────────────┘
```

---

## Worked example 1 — fan-out / fan-in pipeline (Shotloom)

This is the canonical example the style was extracted from. Save and reference.

```
                                   [ VRM / glTF ]
                                          │
                                     VRM bytes
                                          │
                                          ▼
                  ┌──────────────────────────────────────────────────┐
                  │ shotloom-gltf — VRM / glTF parser + 포맷 normalize │
                  │                                                  │
                  │ IN:  VRM / glTF bytes                            │
                  │ OUT: normalized 1.x bytes                        │
                  │      ExtractedRest                               │
                  │      Diagnostic[]                                │
                  │                                                  │
                  │ fn:  vrm_normalization::*                        │
                  │                                                  │
                  │ ADR-0013                                         │
                  └─────────────────────┬────────────────────────────┘
                                        │
                                        │ normalized bytes
                                        ▼
                  ┌──────────────────────────────────────────────────┐
                  │ shotloom-import — orchestration + cache          │
                  │                                                  │
                  │ IN:  bytes + cache root                          │
                  │ OUT: ImportedVrmAsset                            │
                  │      ImportedFbxAnimation                        │
                  │                                                  │
                  │ fn:  import_vrm_to_cache()                       │
                  └────┬────────────────┬────────────────┬───────────┘
                       │                │                │
              ImportedVrm     ImportedFbxAnim   ImportedFbxAnim
              Asset           (Body)            (Face)
                       ▼                ▼                ▼
             ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
             │ character-   │  │ body-anim-   │  │ facial-anim- │
             │ model-norm.  │  │ normalizer   │  │ normalizer   │
             └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                    │                 │                 │
            NormalizedChar     Vec<BoneTrack>    FacialBlendshape
            acterModel                            Anim
                    │                 │                 │
                    └────────┬────────┘                 │
                             ▼                          │
                  ┌──────────────────────┐              │
                  │ retarget (body math) │              │ (bypass lane —
                  └──────────┬───────────┘              │  facial 은 retarget
                             │                          │  안 거침)
                  TargetBodyAnimation                   │
                             │                          │
                             ▼                          ▼
                  ┌────────────────────────────────────────┐
                  │ engine — anim track 소비 + render        │
                  └────────────────────────────────────────┘
```

Note the bypass lane: facial path goes from `facial-anim-normalizer` directly to engine, skipping retarget. The bypass is drawn as a parallel vertical line on the right that doesn't enter the retarget box.

---

## Worked example 2 — linear pipeline

When there's no fan-out / fan-in, just a chain.

```
   [ Source ]
        │
        │ {input type}
        ▼
   ┌─────────────────────────┐
   │ Module A                │
   │ IN:  ...                │
   │ OUT: ...                │
   └──────────┬──────────────┘
              │ {intermediate type}
              ▼
   ┌─────────────────────────┐
   │ Module B                │
   │ IN:  ...                │
   │ OUT: ...                │
   └──────────┬──────────────┘
              │ {output type}
              ▼
   [ Final Consumer ]
```

---

## Worked example 3 — dependency graph (compile-time)

When the diagram is just import direction, not data flow, use a simpler pattern. No IN / OUT boxes — just module names in a tree.

```
              shotloom-gltf      shotloom-fbx-anim
                     └─────┬───────────┘
                           ▼
                      shotloom-import
                           │
                           ▼
                      shotloom-source-anim
                           │
                           ▼
                ┌──────────┼──────────┐
                ▼          ▼          ▼
          char-model  body-anim   facial-anim
          normalizer  normalizer  normalizer
                └──────────┼──────────┘
                           ▼
                      shotloom-retarget
                           │
                           ▼
                      shotloom-engine
```

Use this variant when documenting `Cargo.toml` dependency direction or crate-level layering.

---

## Style cheatsheet

| Element | Glyph |
|---------|-------|
| Vertical pipe | `│` |
| Horizontal pipe | `─` |
| Top-left corner | `┌` |
| Top-right corner | `┐` |
| Bottom-left corner | `└` |
| Bottom-right corner | `┘` |
| T-junction (fan-out top) | `┬` |
| T-junction (fan-in bottom) | `┴` |
| Cross-junction | `┼` |
| Down-arrow | `▼` |
| Right-arrow (rare) | `▶` |

Use box-drawing characters consistently — never mix with `+` / `-` / `\|` ASCII variants.

## Common pitfalls

- **Vertical alignment drift** — box widths must align column-by-column. Count chars when in doubt.
- **Type label on arrow missing** — every arrow needs a type label between the modules unless the type is obvious from the source module's OUT.
- **Stage headers leaking back in** — resist the urge to label "STAGE 3 — NORMALIZE" at the top of a row of normalizer boxes. The boxes themselves carry meaning.
- **Bypass lane forgotten** — when an asymmetric path exists, draw it. Don't fragment the diagram into "main path" + "side note about facial".
- **Notes too long inside boxes** — one or two short lines max. If longer, move to a callout below the diagram.
