---
title: 2026-05-11 STL-227 extended_collider paused recap
tags:
  - type/devlog
  - project/shotloom
  - area/vrm
  - lib/shotloom-gltf
date: 2026-05-11
source: STL-227 paused
---

# 2026-05-11 STL-227 paused — VRMC_springBone_extended_collider normalization

## 15:22 — STL-227 paused ([#289](https://github.com/CINEV/shotloom/pull/289))

회고 — PR이 아직 in review (hon454 round-1 후 fix 푸시, 재리뷰 대기). 머지 전에 회고를 따로 남기는 이유는 round-1에서 잡힌 결함이 **두 LLM이 합의한 잘못된 전제**여서 다음 세션이 같은 함정을 안 밟게 룰을 박을 단계까지 모두 끝났기 때문.

**지적 1 — `plane.normal` 스키마 default를 거꾸로 가정.** hon454: "공식 `VRMC_springBone_extended_collider-1.0` schema/README에서 `ShapePlane.normal`의 기본값은 `[0.0, 0.0, 1.0]`입니다. 따라서 parity-odd collider에서 생략된 기본 normal을 180Y 회전해 materialize한다면 `[0.0, 0.0, -1.0]`이 되어야 합니다." 내가 짠 plan/code/test는 default를 `[0,0,-1]`로 가정해서 materialize 값을 `[0,0,1]`로 박았음 — 결과적으로 omitted normal이 unrotated 상태로 남는 정반대 결함을 만들었음. → bd9dec1 에서 코드/rustdoc/spec doc/test 기대값 일제 swap.

**지적 2 — plan-time Codex 리뷰가 같은 오답에 합의.** plan doc round-1 review에서 Codex가 "decide whether to materialize `[0, 0, -1]`" 이라고 추천. 외부 LLM이 같은 값을 제시하니 cross-check 생략. `~/.claude/rules/external-recommendation-cross-check.md`는 user's own conventions 가이드만 다루고, **외부 스펙 자체가 authority인 케이스를 명시 안 함**. 그 빈 칸으로 둘이 합의한 잘못된 가정이 통과. → fix 자체는 그 구멍을 안 메움. 룰 보강이 별도 land.

**지적 3 — Step 3.8 subagent verification (S3) 가 산수만 검증, 전제는 검증 안 함.** review-before-pr Step 3.8에서 dispatch한 explore subagent가 검증한 건 "`180Y([0,0,-1]) = [0,0,1]` 산수가 맞나?" — 통과. 검증 안 한 건 "default가 정말 `[0,0,-1]`인가?" — 이게 전제. subagent prompt가 *내가 준 전제*를 사실로 받고 그 위에서만 산수를 검증함. self-review 한계가 정확히 여기서 새어나옴: 같은 모델이 같은 전제로 쓰고 검증함. → 룰 보강은 trigger를 한 layer 위로 올림.

> [!tip] 가장 중요한 배운 것 — 외부 스펙 default는 반드시 schema 파일 직접 fetch
> "스펙에 따르면 X" 라고 쓸 때 X가 어느 file:line 에서 왔는지 출처를 댈 수 있어야 한다. memory / training prior / 외부 LLM 추천은 *모두* 검증 안 됨. 두 LLM (나 + Codex) 이 동일한 오답에 합의해도 둘 다 같은 잘못된 prior에서 출발한 가능성이 0이 아니라 *흔하다*. 사람 리뷰어(hon454)가 깨준 게 정확히 그 자리. canonical-first.md 의 다음 layer는 "스펙 값 인용 시 schema file 직접 fetch" 행이고 24ed981 에 land함.

> [!abstract] Rule
> Spec default / magic value / enum 을 code, doc, comment, plan에 인용할 때 — `gh api repos/<org>/<repo>/contents/<schema-path>` 나 `WebFetch` 로 schema 파일을 직접 열어 인용 출처를 확보. memory 와 외부 LLM recall 은 둘 다 unverified. `#rule`

> [!warning] 두 LLM 합의는 verification 이 아니다
> plan-time Codex review + author 자기 review 가 같은 default 값 `[0,0,-1]` 에 합의 → false confidence → human round-1 reviewer 가 깰 때까지 통과. **교훈:** "두 모델이 같은 결론" 은 진실의 신호가 아니라 *같은 training distribution 에서 같은 prior 를 뽑았다* 는 신호일 수 있다. 둘 다 schema 를 안 열어봤으면 둘 다 같은 종류로 틀린다.

> [!warning] Step 3.8 subagent 가 전제를 검증하지 못함
> S3 verification 의 subagent prompt 는 *내가 제시한 claim* 의 산수를 검증함. claim 자체의 전제는 검증 대상에 없음. **교훈:** subagent prompt 를 짤 때 "내 전제는 옳다고 가정하고 X 만 검증하라" 형태가 아니라 "내 전제가 어디서 왔는지 출처도 검증하라" 형태로 dispatch 가능한지 검토. 다만 이건 review-rust 새 패턴이라기보다 canonical-first 의 자연 결과 — 전제 출처가 verifiable 한 형태로 plan/PR 에 박혀 있으면 subagent 도 그걸 따라가 검증할 수 있음.

### 사이드 노트

- `assets/models/*.vrm` 13개 전체에 `VRMC_springBone_extended_collider` 사용 자산 0개 확인. yoya/phainon/minjoon/shimaenaga 같은 backward fixture 들도 base schema only. real-asset E2E 증명 surface 없음 — synthetic JSON 6 tests 가 전부.
- `/shotloom-start-task` Step 6.5 (plan doc 작성) 를 별도 스킬 `/shotloom-draft-task-plan` 으로 분리. plan ↔ implementation 을 두 게이트로 명확히 분리하는 목적. STL-227 이 첫 적용 사례.
- 같은 PR에서 `Resolves` vs `Part of` 컨벤션 재학습: commit footer 는 `Part of` 만 허용, `Resolves` 는 PR description 만. `commit-guideline.md` §3.
