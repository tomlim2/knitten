---
title: "Shotloom Devlog — 2026-04-28"
tags:
  - devlog
  - shotloom
  - retarget
  - normalizer
  - adr-0030
  - adr-0035
  - rest-pose-taxonomy
  - cr-canonical
date: 2026-04-28
source: claude
---

# Shotloom Devlog — 2026-04-28

---

## ADR-0035 rest pose taxonomy + CR canonical slot 초안 — STL-221 / [PR #196](https://github.com/CINEV/shotloom/pull/196)

Shotloom retarget 파이프라인의 character / body normalizer 가 공유하는 "rest pose" 어휘가 코드, ADR, 리뷰 스레드에서 6 가지 의미로 겹쳐 쓰여 왔다. ADR-0030 가 normalizer 3-crate 분리를 결정하면서 CR (CINEV Rest) 를 body / character 의 canonical alignment target 으로 명명했지만 구체 자세 / 좌표계 / 단위 / bone basis 는 deferred 상태였다 (STL-223 의 lock-in ADR 에서 확정 예정). ADR-0033 가 facial 측의 ARKit 52 canonical + extension namespace 를 같은 패턴으로 박아둔 반면 body / character 측에는 동등한 어휘 surface 가 없어, downstream ADR (CR lock-in, body A-pose 마이그레이션, source-format adapter) 가 매번 용어를 재정의해야 했다. STL-221 은 그 격차를 메우는 작업.

### Big picture

Retarget pipeline 의 normalizer layer 에 안정 어휘를 박는 게 본질. CR pose 자체는 STL-223 가 lock-in 할 때까지 계속 "ARP rig 기반 잠정 채움" 으로 남지만, taxonomy / naming / invariant / ownership 자체는 lock-in 과 독립적으로 안정한 결정이라 지금 ADR 로 박아두면 STL-223, body A-pose 마이그레이션, source-format adapter 작업이 모두 같은 어휘에서 출발할 수 있다.

### Why

- **Ambiguity 가 코드 리뷰 비용으로 전이.** "rest pose 정렬" 이라고 쓰면 source rest? target rest? CR? — 매번 reviewer 가 추론해야 함. BoneTrack rotation 의 reference frame 도 명문화 안 되어 있어서 retarget 호출부마다 가정이 흩어짐.
- **VrmRestPose vs NormalizedCharacterModel 책임 경계** 가 contract surface 에서 안 보임. 둘 다 rest 정보인데 누가 어느 단계인지 코드 호출부에서만 추론 가능.
- **새 ADR 의존도.** STL-223 (CR lock-in), body A-pose 마이그레이션, source-format adapter 모두 "CR 정렬" 을 전제로 하는데 그 어휘가 정의 안 되어 있으면 각 ADR 이 자기 어휘를 만든다 → 표준화 실패.
- **ADR-0033 와의 비대칭.** Facial 측은 ARKit 52 canonical 이 별도 ADR 로 박혀 있는데 body / character 측은 아직 없음. STL-221 이 그 짝.

### How

ADR 본문 구조는 ADR-0033 (facial canonical) 를 그대로 미러링.

1. **변종 inventory (6 개)** — table 형식으로 source rig rest, target VRM rest, CR slot, src_local_rest, VrmRestPose, align_full_body_rest 적용 후 상태. 각각 where it lives / producer / consumer.
2. **Transformation direction ASCII diagram** — Codex 가 1차 audit 에서 "변환 방향 표 partial" 로 짚어서 추가한 부분. Source FBX / target VRM 두 파이프라인이 CR slot 에서 만나고 retarget 에서 합류하는 구조. variant 번호로 cross-reference.
3. **Naming convention** — prefix table (`src_…` / `target_…` / `cr_…` / `…_local` / `…_rest`) + 5 worked names (src_local_rest, target_rest_local, cr_canonical, cr_aligned_rest, vrm_rest_pose).
4. **6 invariants** — 핵심: BoneTrack rotation 은 src_local_rest 기준, CR slot 은 단일 source-of-truth ADR 가 가짐, character 는 character-model-normalizer 로 / animation 은 body-anim-normalizer 로 CR-aligned 되어 retarget 합류 시 양쪽이 같은 cr_canonical 에 동의해야 함.
5. **Ownership map** — shotloom-import / shotloom-fbx-anim / shotloom-source-anim / shotloom-gltf / 3 normalizer / shotloom-retarget. 각 crate 가 어느 variant 를 owns / produces / consumes.
6. **CR slot status** — 존재만 normative, 구체 형식은 STL-223 deferred. 현재 ARP 기반은 provisional implementation choice 로만 기술.
7. **5 alternatives considered** — defer entire taxonomy / inline per-crate / arch doc 대신 ADR / lock CR pose now / fold into ADR-0030. 각각 reject 이유.

### What

- `docs/adr/adr-0035-rest-pose-taxonomy.md` — 신규 ADR (Proposed).
- `docs/adr/README.md` — Proposed section 에 ADR-0035 entry.
- 3 commits: 초안 → transformation-direction diagram 추가 (Codex AC audit fix) → rebase 후 shotloom-source-anim 반영.

### 사이드 노트

- **ADR 번호 충돌 가드.** 작업 시작 시 main 의 ADR-0030 ~ 0033 외에 in-flight 인 origin/chore/source-anim-crate 브랜치에 ADR-0034 (PR #188) 가 있어 다음 free 번호는 0035. ADR 번호는 provisional 인 만큼 PR title 에는 박지 않고 본문 / 파일명에만 사용 (skill 의 STL-193 PR #177 ↔ #169 0032 충돌 사례 회피).
- **Rebase 후 source-anim-crate 영향 재평가.** PR 초안 직전 rebase 했더니 PR #188 가 바로 직전에 머지되어 있었음. ADR-0034 가 main 에 들어왔고 shotloom-source-anim crate 가 SourceAsset / SourceFormat / SourceBone 를 owns. ownership map 에 shotloom-source-anim row 추가 + ADR-0023 §6 supersession 명시 + ADR-0034 mention 을 text-only 에서 real markdown link 로 승격. validate-doc-paths 수치도 943→963 / 143→145 로 sync.
- **Codex AC audit 패턴.** acceptance criteria 9 개 전부 PASS / PARTIAL 분류 받아서 PARTIAL 1 개 (변환 방향 표) 만 fix 하고 나머지는 그대로. 두 번째로 PR body audit 도 돌려서 5 개 finding 중 2 개 valid / 3 개 false-positive. False-positive 는 precedent 있는 quantitative 수치 (PR #166 의 "3503/541 verified" 등) 와 in-repo template 에 명시된 `### Test details` heading. Codex 가 in-repo template 을 다시 읽지 않고 일반론으로 판단하는 false-positive 패턴이 두 번 반복 — 향후 audit prompt 에서 "in-repo pr-guideline.md §3 의 expanded template 은 exhaustive 가 아니라 `### Test details` subheading 도 포함" 을 명시하면 줄어들 듯.
- **`/shotloom-review-before-pr` skip rationale.** branch diff 가 docs/adr markdown 만 있고 Rust / TS source 0 줄 — start-code Step 7 의 명시적 skip exception 적용. PR body Test details 에도 한 줄로 기록 (reviewer 가 "왜 skip 했는지" 안 묻도록).

---

## STL-183 closed ([#188](https://github.com/CINEV/shotloom/pull/188))

회고 — `SourceAsset` / `SourceFormat` 등 source-animation 도메인 타입을 `shotloom-retarget` 에서 신규 `shotloom-source-anim` crate 로 분리한 PR. 라운드 1 에서 8 개 finding (전부 fix), 라운드 2 에서 7 개 finding (4 fix / 1 STL-222 defer / 2 ack no-action). 머지된 commit `7ba84cb` (squash).

**지적 1 — 같은 anti-pattern 의 비대칭 적용.** 라운드 1 에서 ADR-0023 §6 의 in-place rewrite 를 section-level supersession banner 로 고쳤는데, 같은 PR 의 ADR-0024 §1 에 동일 anti-pattern 이 있는 걸 라운드 1 에서는 못 잡고 라운드 2 에 와서야 잡힘. 리뷰어 본인도 "P1 blocking carry-over I missed in the prior pass" 인정. → 한 PR 안에서 amendment pattern 은 reviewer 가 처음 짚은 한 section 만이 아니라 같은 anti-pattern 을 보이는 모든 section 에 동시 적용. 픽스: 1780afb 의 `docs/adr/adr-0024-fbx-animation-parser-crate.md` (§1 verbatim 복원 + supersession banner) + `adr-0034-source-animation-type-ownership.md` (`## Supersedes` 에 ADR-0024 §1 추가).

**지적 2 — orphan re-export 두 라운드 연속.** 라운드 1 에 `glob_match` orphan re-export 지적 → 라운드 2 에 `pub use shotloom_source_anim::{SourceAsset, SourceBone, ...}` orphan re-export 지적. 같은 패턴이 한 PR 안에서 두 번 나옴. → owner crate 이전 시 transitional re-export 는 `rg "shotloom_<crate>::<symbol>" --type rust` 로 external caller 0 건 확인 후에만 add. 0 건이면 add 자체를 skip. 픽스: 1780afb 의 `crates/shotloom-retarget/src/lib.rs` (`pub use ...` 블록 통째 삭제 → 비-pub `use` 로 다운그레이드).

**지적 3 — speculative public surface.** 라운드 1 에서 `pub type RestSyncRules = [(String, String)]` (slice alias 라 by-value 사용 불가) 를 `Vec<(String, String)>` 로 수정했는데, 라운드 2 에서 "Vec 형태도 consumer 0 명" 이라고 나옴. doc 의 "external caller 가 `&RestSyncRules` shape 을 핀할 수 있도록" 이라는 정당화도 가상 caller 기반. → `pub type` alias 는 actual external caller 가 있을 때만 노출. 가상의 미래 caller 는 정당화 사유로 부족함. 픽스: 1780afb 에서 alias 통째 삭제, 4 개 함수 시그니처를 `Option<&[(String, String)]>` 슬라이스로 직접 받게 변경.

**지적 4 — review skill 에 justification axis 누락.** 위 3 개를 응답하면서 사용자가 "리뷰어도 실수할 수 있는데 scope + justification 두 축 다 거른 뒤 fix queue 진입해야 한다" 지적. 실제로 `/shotloom-respond-pr` skill 의 Step 2.5 는 scope 한 축뿐이었음. 픽스: caol-ila 의 `claude/skills/shotloom-respond-pr/SKILL.md` Step 2.5 에 Axis 2 (justification check) 추가, Step 3 / Step 4 에 mandatory rule re-read beat 추가.

> [!tip] 가장 중요한 배운 것 — 리뷰 응답은 scope + justification 두 축을 다 거친 다음에 fix queue 에 들어간다.
> 리뷰어 코멘트를 자동으로 actionable 로 보면 위험. 같은 PR 안에서 (a) reviewer 가 본인이 missed 했다고 말하면 정당성 재검토 신호 (b) recommended fix 의 강도가 rule 이 요구하는 것보다 강하거나 약하면 (예: "downgrade to pub(crate)" vs "delete entirely") 사용자에게 surface 후 결정 (c) reviewer 가 broader follow-up 을 본인이 이미 filed 했으면 좁은 fix 를 이 PR 에 또 박는 게 churn 일 수 있음.

> [!abstract] Rule
> PR 리뷰 응답 시 모든 finding 은 scope axis (in-scope / out-of-scope / defer-with-issue / ambiguous) + justification axis (justified-as-rec / justified-fix-different / pushback / disagree) 두 축을 통과한 뒤에만 fix queue 에 들어간다. 둘 중 하나라도 in-scope + justified-as-rec 가 아니면 사용자에게 surface. 리뷰어는 권위가 아니라 standard 가 권위. `#rule` `#pr-review`

> [!warning] Squash-merge 가 머지된 직후 `git branch -d` 거부됨
> shotloom 은 squash-merge 정책이라 PR 머지 후 feature branch 의 개별 commit 이 main 의 ancestor 아님 → `branch -d` refuse → `branch -D` 가 정상 흐름인데 close-task skill 의 default 는 -D 금지. **교훈:** squash-merge 정책 레포 (shotloom) 에서는 close-task 시 `branch -D` 를 사용자 confirm 후 사용하거나, skill 에 "squash-merge detected → -D 자동 허용" 분기를 추가.

> [!warning] 메인 체크아웃에 origin 미상의 staged revert 발견 시 임의 폐기 금지
> respond-pr 시작 시 main 워크트리에 PR 의 ADR 작업을 되돌리는 staged revert 가 6 파일 분량으로 staged 상태였음 — 출처를 모르는 in-progress 상태. stash 로 분리 후 작업, 끝나고 사용자 승인 받아 drop. **교훈:** 모르는 in-progress state 발견 시 (a) stash 로 분리 (b) 사용자에게 surface (c) 임의 폐기 금지. close-task 시점에서 사용자 승인 후 drop.

### Follow-ups

- [STL-220](https://linear.app/cinamon-corp/issue/STL-220) — ADR scope discipline (rename-fragile 콘텐츠 owned docs 로 이동), 라운드 2 의 ADR-0034 `## Supersedes` heading + Cargo.toml field ordering 도 여기 흡수.
- [STL-222](https://linear.app/cinamon-corp/issue/STL-222) — `RestAlignTrack` ↔ `BoneTrack` mirror invariant 컴파일 타임 락 (sentinel test 우선, 공통 crate 추출 fallback).
