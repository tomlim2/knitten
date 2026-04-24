---
title: "Shotloom ADR Draft — PMX Import Placeholder"
tags:
  - shotloom
  - adr-draft
  - pmx
  - vrm
date: 2026-04-24
source: claude
status: draft-pending-landing
---

# Shotloom ADR Draft — PMX Import Placeholder

논의 흐름 보존용 draft. 실제 랜딩은 아래 의존성 순서 지킨 뒤.

---

## Landing order

1. **ADR-0030** — Normalizer crate extraction (PR #153, 현재 CHANGES_REQUESTED) 머지
2. **ADR-0031** — Anim-source crate 관련 ADR (미작성, 다음 예정)
3. **ADR-00NN** — 이 PMX import placeholder (번호는 위 둘 확정 후 할당)

PMX ADR 번호는 최소 0032. 실제 번호는 0031 작성/머지 후 재확인.

---

## Why placeholder (not committed decision)

- PMX 임포트 얘기가 나왔으니 "이런 게 논의됐다"는 기록만 남김
- 두 가지 아키텍처(Rust importer vs Frontend TS)를 이름 붙여서 남김
- 실제 커밋은 사용자 수요 신호 / 번들 예산 / TS 모듈 성숙도 확인 후 별도 ADR에서
- 이 ADR은 코드 변경 0, 스코프 최소

---

## ADR body draft

````markdown
# ADR-00NN: PMX Import — Placeholder for Future Decision

## Status

Proposed

Date: <TBD, 랜딩일>

## Context

PMX is a common character source format from the MMD ecosystem. Users
bringing PMX assets into Shotloom today have no in-product path —
conversion happens outside the product before the existing VRM import
flow (ADR-0013) can accept the result.

PMX support has come up as a candidate feature. This ADR exists to
record that the topic was raised, surface the two architectures we
have considered so far, and defer the actual commitment to a later
ADR once scope and demand are clearer.

Shotloom's normalization boundary for character assets is
`shotloom-gltf` (ADR-0013). `vrm_normalization.rs` already recognizes
PMX as a source lineage for VRMs arriving from external PMX→VRM
pipelines — see
[`crates/shotloom-gltf/src/vrm_normalization.rs:230-234`](../../crates/shotloom-gltf/src/vrm_normalization.rs).
PMX itself is not an accepted input at any crate boundary.

## Decision

**This ADR does not commit to an implementation.** It records two
candidate architectures and explicitly leaves the choice open.

### Candidate 1 — Importer-side conversion (Rust)

PMX→VRM conversion lives inside the Rust import path, likely as a new
`pmx-to-vrm` crate consumed by `shotloom-gltf` or an equivalent
importer layer. PMX bytes enter the Rust runtime; VRM 1.x-compatible
artifacts come out.

### Candidate 2 — Frontend-side conversion (TypeScript)

PMX→VRM conversion lives in the React + TypeScript editor shell
(ADR-0002), as a workspace package that runs in the browser. The Rust
runtime receives only VRM bytes and stays PMX-agnostic.

Either candidate keeps the `shotloom-gltf` character contract
(ADR-0013) intact and reuses the existing PMX-lineage handling in
`vrm_normalization.rs` for the downstream VRM.

The decision between them depends on factors not yet resolved,
including: whether an in-browser TypeScript PMX→VRM module is
available at the point of work, bundle-size budget, whether Shotloom
wants PMX knowledge inside any Rust crate, and user-demand signal.

## Consequences

**Positive**

- Records that PMX support was discussed, so future work does not
  restart the conversation from zero.
- Names both architectures so a future ADR can reject one by name
  rather than re-deriving the option space.
- No implementation cost today. No crate changes, no frontend
  changes.

**Negative / Costs**

- Readers may mistake a placeholder ADR for a committed decision.
  Mitigated by keeping the status and wording explicit.

**Neutral**

- `vrm_normalization.rs:230-234` PMX-lineage handling continues to
  serve externally-converted PMX→VRM assets, regardless of which
  candidate eventually ships.

## Non-goals

- Committing to either candidate architecture.
- MMD rigid-body physics, IK chain preservation, or morph-group 1:1
  fidelity. If PMX import ships under either candidate, these remain
  out of scope.
- Rust-side PMX parsing in any form outside Candidate 1.

## References

- **Related:** [ADR-0002](adr-0002-react-typescript-editor-shell.md),
  [ADR-0013](adr-0013-generated-character-contract.md).
- **Depends on:** [ADR-0030](adr-0030-normalizer-crate-extraction.md)
  and the anim-source ADR (ADR-0031, TBD) for any future
  implementation ADR — both affect where PMX conversion would attach.
- **Code reference:** [`crates/shotloom-gltf/src/vrm_normalization.rs:230-234`](../../crates/shotloom-gltf/src/vrm_normalization.rs).
````

---

## Pre-landing checklist (기록만, 당일 재확인)

- [ ] ADR-0030 머지 완료
- [ ] ADR-0031 (anim-source) 작성 + 머지 완료
- [ ] 다음 free ADR 번호 재확인 (`ls docs/adr/ | grep -oE 'adr-[0-9]+' | sort -u | tail -1`)
- [ ] 이 draft 본문 최신 상태 재검토 (그 사이 normalizer / anim-source ADR 결정이 전제를 바꿨을 수 있음)
- [ ] `vrm_normalization.rs:230-234` 줄 번호 여전히 유효한지 확인 (0030 머지로 이동했을 수 있음)
- [ ] 브랜치: `chore/adr-00NN-pmx-import-placeholder`
- [ ] `docs/adr/README.md` Proposed 섹션 업데이트
- [ ] `node scripts/validate-doc-paths.mjs` 통과
- [ ] PR approval 받고 오픈
