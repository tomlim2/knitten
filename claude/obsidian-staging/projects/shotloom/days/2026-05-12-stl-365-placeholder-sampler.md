---
title: 2026-05-12 STL-365 placeholder sampler closed recap
tags:
  - type/devlog
  - project/shotloom
  - area/render
  - lib/bevy
date: 2026-05-12
source: STL-365 closed
---

# 2026-05-12 STL-365 closed — placeholder material Repeat+Nearest sampler

## 13:52 — STL-365 closed ([#296](https://github.com/CINEV/shotloom/pull/296))

회고 — round-1 리뷰에서 가장 큰 한 방이 외부 LLM 합의로 다져진 잘못된 전제였음. 추가로 PR body / ADR-vs-README 분리에서 본인 메모리/관성으로 친 ceremony 가 적지 않게 surface.

**지적 1 — `plane.normal` schema default 거꾸로 가정.** hon454: "공식 `VRMC_springBone_extended_collider-1.0` schema/README 에서 `ShapePlane.normal` 의 기본값은 `[0.0, 0.0, 1.0]` 입니다." 내가 짠 plan/code/test 는 default 를 `[0,0,-1]` 로 가정, materialize 값을 `[0,0,1]` 로 박음 — omitted normal 이 unrotated 로 남는 정반대 결함. plan-time Codex 도 같은 오답에 동의해 cross-check 가 false confidence 로 통과, S3 subagent 는 *내가 준 전제* 의 산수만 검증해서 통과 → 사람 리뷰어가 깬 자리. → `bd9dec1` 에서 swap. `canonical-first.md` 에 "Spec default / magic value / enum cited in code or doc" trigger 행 추가 (`24ed981`) — 다음부터는 schema 파일 직접 fetch 가 intent-formation 단계에서 발동.

**지적 2 — PR body Summary 에 outcome 아닌 mechanics.** Summary 3 bullets 중 2 개가 "extract helper" / "update ADR" 같은 mechanics 였음. `pr-guideline.md` §5: "Summary: Use 1 to 3 bullets to explain the **main outcome**." 본 PR 의 main outcome 은 하나 — 큰 mesh 에서 checker crisp. → Summary 1 bullet 로 trim, 나머지는 Changes 섹션이 이미 다룸.

**지적 3 — process-meta / future-tense leak 다발.** "still Proposed" parenthetical, "ADR carries the rule, rustdoc carries the explanation" 정책 선언, "visual verification can run on any future scene", "The existing startup test stays unchanged — it asserts on material invariants where the setup cost is one tick, but a sampler-on-loaded-image assertion would have needed `ImagePlugin` plus async load-state polling" 안 한 것에 대한 justification — PR body 안에서 이런 process meta 가 outcome 기술을 흐리게 만듦. `shotloom-make-pr` 의 "active suppression" 리스트와 같은 원칙. → PR body 재작성, mechanics + meta 모두 빠지고 outcome / why / changes(facts) / impact / testing 만 남김.

**지적 4 — ADR 본문에 rationale prose 박지 않기.** ADR Decision #4 첫 갱신 시 "Bevy 의 defaults turn the checker into a blurred grey panel ... Nearest keeps... Repeat tiles..." 라는 *왜* prose 단락을 본문에 추가. 사용자 지적: "ADR 은 법칙, 어떻게 / 왜 같은 건 README/rustdoc." 사실 동일 내용 rationale 은 `placeholder_sampler_descriptor` 의 rustdoc 에 이미 있었음 — ADR 에 중복 박은 게 패턴 위반. → `a86f04ee` 에서 rationale 단락 제거, 한 줄 cross-link 으로 교체 ("Sampler invariant rationale is owned by `crates/shotloom-engine/src/materials/placeholder.rs` rustdoc").

**지적 5 — 워크트리 정리에서 stray 파일에 `--force` 쓰려 함.** PR 머지 후 wrapup 에서 worktree 안 `shotloom_core.long-type-*.txt` (rustc 가 type 이름 너무 길 때 dump 하는 임시 파일) 가 남아 `git worktree remove` 가 dirty 라고 거부. 처음에는 `--force` 옵션을 자연스럽게 제안하려 했으나 사용자 지적: "옵션 1 (보고 결정) 과 옵션 2 (안 보고 일괄) 가 같은 결과라도 등가 아님." → 파일 본문 확인 (임시 type-dump 라 안전 폐기 OK) 후 `rm` → 평범 `git worktree remove`. 같은 결과지만 명시적 판단 경로.

> [!tip] 가장 중요한 배운 것 — 외부 LLM 두 명 합의는 진실 신호가 아니라 같은 prior 신호일 수 있다
> plan-time Codex 가 추천한 default 값과 author 가 "알고 있다" 고 느낀 default 값이 같았던 이유는, 둘 다 schema 파일을 안 열어보고 같은 training prior 에서 같은 값을 뽑은 것. 사람 리뷰어 (hon454) 가 schema 본문을 직접 인용해서 깸. **두 LLM 합의 = verification 아님.** 외부 스펙 값을 코드 / doc / plan 에 인용할 땐 schema 파일 직접 fetch 가 필수. `canonical-first.md` trigger 행으로 박힘.

> [!abstract] Rule
> External spec default / magic value / enum cited in code, doc, comment, or plan — fetch the schema file directly (`gh api repos/<org>/<repo>/contents/<schema-path>` or `WebFetch`). Memory and external LLM recall are both unverified. `#rule`

> [!warning] S3 subagent verification 은 전제 자체를 검증하지 못한다
> Step 3.8 dispatch 한 explore subagent 는 "`180Y([0,0,-1]) = [0,0,1]` 산수가 맞나?" 만 검증 — 그 산수는 통과. 검증 안 한 건 "default 가 정말 `[0,0,-1]` 인가?" — 이게 진짜 전제. **교훈:** subagent prompt 가 *내가 제시한 claim* 의 산수만 검증하면, claim 자체의 출처를 안 따라간다. canonical-first 단계에서 schema 가 박혀 있어야 subagent 도 그 출처를 따라 검증 가능.

> [!warning] PR body 에서 mechanics / process meta / future leak 은 한 PR 안에서 여러 자리에 동시 생긴다
> "still Proposed" 한 자리 잡으니 "ADR carries the rule" 다른 자리, 또 "future scene" 또 다른 자리. 단발이 아니라 *register* 가 잘못된 상태였다는 신호. **교훈:** PR body 한 줄 잡았을 때 같은 register 의 다른 자리도 같이 sweep 하는 습관. 사용자가 "한 군데 더 있습니다" 라고 짚어줄 때마다 catch 가 늦었음.

### 사이드 노트

- `/shotloom-draft-task-plan` 도입 후 두 번째 적용 사례 — plan ↔ implementation 게이트 분리가 round-1 review 의 plan revision 사이클을 깔끔히 흡수 (plan-time Codex 검토 → revision 두 차례 → 구현).
- ADR-0031 Status 가 `Proposed` 라 in-place 편집. `adr-template.md` §"Editing an Accepted ADR" 가 명시: Accepted 라도 `## Amendment` block 금지, 허용 경로는 silent in-place edit (preservation) 또는 supersession (semantic change) 만. 다음 PR 들에서 인용 시 주의.
- `crates/shotloom-engine/README.md` 가 `placeholder_sampler_descriptor` 같은 module 함수까지는 노출 안 함. ADR 본문이 함수 surface 가 아니라 crate README 를 cross-link 하는 게 ADR template Litmus test 와 정합.
