---
title: "04-15: STL-78 FBX animation importer 계획 + Linear skill 개편 + bevy-vrm 상류 싱크"
tags: [devlog, shotloom, stl-78, stl-75, linear, bevy-vrm, privacy-rule]
date: 2026-04-15
---

# 04-15: STL-78 FBX animation importer 계획 + Linear skill 개편 + bevy-vrm 상류 싱크

## 왜 이 세션이 있었나

어제(04-14 오후) STL-74 리뷰 대응 revision을 푸시하고, "다음 스텝은 FBX 임포터 포팅"이라고 devlog에 적어뒀음. 오늘은 그 FBX 임포터 작업을 실제로 착수 가능한 상태까지 밀어붙이는 게 목표. 단, STL-74 PR이 아직 `CHANGES_REQUESTED` 상태라 sequential-PR dependency rule에 따라 downstream 브랜치/코드는 금지 — **Linear 이슈와 설계 prep만** 허용.

---

## 세션 타임라인

### 1. 저장소 풀 (git-pull-repos)

7개 레포 풀. 3개가 dirty:

- `ta-portfolio` — branch `try/tegaki-hero`에 tracking 없음. 방치.
- `shotloom-github` feat/shotloom-retarget — 로컬 Cargo.lock 변경 (-380/+12). `git stash → pull → stash pop` 클린. 업스트림이 이미 같은 Cargo.lock 재생성을 포함해서 stash pop에 충돌 없었음 (9 commits fast-forward).
- `bevy-vrm` main — 로컬 `crates/humanoid_retarget/Cargo.toml` (+4 lines, fbx-summary-scratch bin 등록) + 미추적 `src/bin/fbx_summary_scratch.rs` (438 LOC). `git stash --include-untracked → pull → stash pop` 클린.

### 2. 핵심 발견: bevy-vrm 상류가 FBX 크레이트를 이미 리팩터링해뒀음

풀이 끝나고 bevy-vrm의 `fbx_rig` 상태를 확인하려는데, 상류 5 커밋이 이미 작업을 거의 다 해놓은 상태였다:

- `crates/fbx_rig/` (1188 LOC 단일 `lib.rs`) → **이름 변경 + 분해** `crates/fbx_animation_importer/`
- 모듈 트리:
  - `src/lib.rs` (44) · `detect.rs` (37) · `math.rs` (42) · `skeleton.rs` (141) · `types.rs` (65) · `raw.rs` (37) · `post_process.rs` (72)
  - `src/parse/` 분할: `mod.rs` (514) + `anim_curve.rs` (141) + `attrs.rs` (39) + `cluster.rs` (99) + `model.rs` (127) + `skip.rs` (29)
- **Golden test 7종 추가:** `golden_basic`, `golden_bind_pose`, `golden_blendshape`, `golden_dcc_detect`, `golden_hierarchy`, `golden_quat_continuity`, `error_cases`
- `examples/dump_golden.rs` (171 LOC)

이게 STL-78 계획을 완전히 바꿈. 어제까지의 plan은 "1188 LOC 모놀리식 파서를 모듈 분해하면서 포팅"이었는데, 이제 **상류가 이미 분해를 끝냈으니 shotloom으로 가는 건 verbatim port**. `rules/testing.md`의 예외 #3 ("verbatim port w/ follow-up test commit in same PR")이 그대로 적용 가능.

내 로컬 scratch (`fbx_summary_scratch.rs`)는 `fbx_rig::fbxcel::...` import를 쓰고 있어서 상류 리네임 후 컴파일 깨짐. 여전히 uncommitted로 남겨둠 — 개인 탐색용이고 프로덕션 경로 아님.

### 3. Linear skill 템플릿 대규모 개편

FBX 이슈를 올리기 전에 `/shotloom-linear-create-issue`를 호출했는데, 유저가 "template outdated"라고 지적. 확인 절차:

**상류 소스 확인:**

- shotloom 레포 `docs/guidelines/project-management-model.md` §8.1 확인 → Linear 이슈 섹션 템플릿은 **repo 안에 존재하지 않음**. 있는 건 PR/ADR/module-doc 템플릿뿐. "tool-neutral, describe meaning first"라는 원칙만 있음.
- 즉 template은 오직 `~/.claude/commands/shotloom-linear-create-issue.md`에만 존재. 상류와 동기화할 대상 없음. 유일한 유지 방법은 최근 이슈 샘플링.

**Linear MCP로 최근 15 이슈 샘플링.** 6개 drift finding:

1. **`## Summary` as pre-Context section** — Husker의 STL-76/77 (04-14, 하루 전)이 `## Summary` → `## Context` 구조 시작. 기존 템플릿은 Context를 first section으로 규정.
2. **Linear native `<issue id="...">STL-NN</issue>` tag** — STL-74/75가 쓰는 방식. 기존 템플릿 Step 5는 plain `STL-42`를 markdown link `[STL-42](url)`로 **강제 변환**하게 되어 있었는데, 이건 팀 컨벤션 아님. Plain text가 Linear에서 auto-linkify됨.
3. **Korean section variants 누락** — `## 결정 필요 사항`, `## 요청 사항`, `## 완료 조건`, `## 참고 파일` (STL-66/68/73). 기존 템플릿은 `## 배경` / `## 범위`만 나열.
4. **`## Child Issues` umbrella pattern** — STL-17 패턴.
5. **`### Alpha` / `### Bravo` staged decision subsection** — STL-68 패턴.
6. **`Related to STL-NN` footer** — plain text (STL-73). 기존 link 변환 규칙이 과도했음.

### 4. Privacy 규칙 추가

유저가 skill 개편과 함께 **중요한 룰 추가**: "shotloom Linear에 개인 private 레포(`bevy-vrm` 등) 절대 언급/링크 금지." 이유: 회사 Linear/PR/Slack에 개인 사이드 프로젝트 흔적이 남으면 소유권 모호성 + 개인 repo 노출.

Skill 파일 Step 2와 Step 6에 privacy 규칙 블록 추가:

- 금지 대상: `bevy-vrm`, `anju`, `mmd-anju`, `ta-portfolio`, `StoryPreviz`, 그 외 `repo-paths.json` 등록됐지만 CINEV 소유 아닌 모든 레포.
- 포팅 작업의 경우 원본을 "prior internal prototype" / "선행 R&D 코드" / "upstream reference implementation"처럼 추상 지칭.
- 허용: shotloom 내부 경로(`crates/...`, `docs/...`), CINEV org GitHub, STL-NN, ADR 번호, spec 문서명.
- 판단 기준: "이 링크/경로가 shotloom 레포 안에 있는가?" — 아니면 제거.

같은 룰을 session-level이 아니라 **persistent memory**로 저장: `feedback_shotloom_no_private_repo_refs.md`. 이유는 shotloom 이슈뿐 아니라 PR 본문/Slack/repo doc에도 적용되는 횡단 규칙이기 때문.

### 5. STL-78 이슈 생성 (`shotloom-fbx-anim-importer`)

첫 드래프트는 파서 크레이트 소유권을 "옵션 A (기존 `shotloom-import`에 FBX 경로 추가)" vs "옵션 B (신규 크레이트)"로 결정 미정 상태로 썼음. 유저가 즉시 **hybrid로 결정**: 파서는 신규 크레이트 `shotloom-fbx-anim-importer`, 정규화/캐시 경로는 `shotloom-import`에 추가. VRM import 패턴(`shotloom-gltf::normalize_vrm` → `shotloom-import`)과 동형.

**3-layer 구조 확정:**

- **Layer 1:** `shotloom-fbx-anim-importer` 신규 크레이트. 순수 파서, `fbxcel` 의존, `std::fs` 사용 안 함 (bytes 입력) → WASM 호환 가능. `parse(bytes) → SourceAsset`.
- **Layer 2:** `shotloom-import`에 FBX normalize 경로 추가. `shotloom-fbx-anim-importer`를 래핑해서 캐시 아티팩트 생성, `std::fs`로 머티리얼라이즈, native-only 유지.
- **Layer 3:** `shotloom-retarget`이 소비자.

이 결정은 `adr-0023-retargeter-validation-contract.md` §3 부록 또는 신규 ADR로 기록해야 함 (AC에 포함).

**Linear 측 이슈 히스토리:**

1. STL-78 생성 — 제목 `shotloom FBX animation importer port`, privacy-scrubbed description.
2. 제목 변경 → `shotloom-fbx-anim-importer` (branch/crate 이름과 일치).
3. Description 업데이트 — hybrid architecture 반영.
4. 첫 hybrid 업데이트가 Linear markdown 파서에 의해 렌더링 깨짐 (architecture 테이블이 트리거, 백틱들이 뒤섞임).
5. 테이블 제거 + backtick 대신 plain code span 사용해서 재저장 → 클린.
6. 재저장 결과에서도 Linear가 `.rs` / `.md` 확장자를 URL로 인식해 `[lib.rs](http://lib.rs)` 식으로 auto-linkify함. 시각적으로만 노이즈, 의미는 보존.

**STL-78 레퍼런스:** https://linear.app/cinamon-corp/issue/STL-78/shotloom-fbx-anim-importer, 브랜치 `deemo/stl-78-shotloom-fbx-anim-importer`.

### 6. STL-75 블로커/description 업데이트

유저가 STL-75(Quality evaluation system)의 블로커를 재정의해달라고 함. 기존엔 STL-74만 선행 이슈로 적혀 있었는데, **Rubric A가 source animation 품질을 평가**하기 때문에 FBX importer가 없으면 실제 fixture가 의미 없음. 따라서 STL-75의 블로커는 STL-74 + STL-78 **둘 다**.

수정 내용:

- `blockedBy: ["STL-74", "STL-78"]`
- Context 재작성 — "upstream 의존 이슈 2개" 섹션 명시, 왜 각각 블로커인지 설명
- `bevy-vrm` 언급 4곳 전부 `선행 R&D 코드`로 치환 (privacy rule 적용)
- Acceptance Criteria의 "bevy-vrm 쪽 metric_fixtures 기준" → "선행 R&D 쪽 metric_fixtures 기준"
- Notes에 "왜 STL-78도 블로커인가" 문단 추가
- References에 STL-78 엔트리 추가

---

## 현재 상태

### PR / CI

- **STL-74 PR #66** — 모든 CI 체크 SUCCESS (alsa-sys fix 검증 완료, Rust Tests 포함 전부 그린). 상태: `OPEN`, `MERGEABLE`, `reviewDecision: CHANGES_REQUESTED`. 리뷰어 `ryumiel`의 재검토 대기 중. 재검토 요청 코멘트 아직 안 남김.
- **STL-78** — Backlog, hybrid 구조 확정, STL-74 머지 대기.
- **STL-75** — Todo, 블로커 STL-74 + STL-78 둘 다 등록. 상태 Todo로 된 건 Linear가 자동 조정한 듯 (원래 요청한 변경은 아님).

### 로컬 레포 상태

- **shotloom-github:** `feat/shotloom-retarget`, clean, origin과 동기화.
- **bevy-vrm:** `main`, 상류와 동기화, uncommitted Cargo.toml (+fbx-summary-scratch bin) + untracked `fbx_summary_scratch.rs` (438 LOC, `fbx_rig::...` imports → `fbx_animation_importer::...`로 업데이트 필요). 개인 탐색용 스크래치라 나중에 고쳐도 됨.
- **caol-ila:** uncommitted. 수정된 것:
  - `claude/commands/shotloom-linear-create-issue.md` — template 개편 + privacy 규칙
  - `claude/projects/-Users-deemooooooooo-Desktop-www-caol-ila/memory/feedback_shotloom_no_private_repo_refs.md` (신규)
  - `claude/projects/-Users-deemooooooooo-Desktop-www-caol-ila/memory/MEMORY.md` — 인덱스 엔트리 추가

### 영향받은 메모리

- **신규:** `feedback_shotloom_no_private_repo_refs.md` — shotloom artifacts(Linear/PR/Slack/docs)에 개인 private 레포 언급 금지.

---

## 다음 스텝 (이어갈 터미널에서 할 일)

### 1. caol-ila 변경 커밋

```
claude/commands/shotloom-linear-create-issue.md (modified)
claude/projects/-Users-deemooooooooo-Desktop-www-caol-ila/memory/feedback_shotloom_no_private_repo_refs.md (new)
claude/projects/-Users-deemooooooooo-Desktop-www-caol-ila/memory/MEMORY.md (modified)
```

커밋 메시지 제안:

```
skill+rule: shotloom-linear-create-issue 템플릿 개편 + private repo 금지 규칙

- Linear 최근 이슈 15개 샘플링 결과 6건 drift 반영
  (Summary 섹션, 네이티브 <issue> 태그, Korean section 변형,
   Child Issues umbrella, staged decision subsection, Related footer)
- Privacy rule: shotloom artifact에 개인 private repo 언급 금지
  feedback memory `feedback_shotloom_no_private_repo_refs.md` 저장
```

### 2. STL-74 리뷰 재요청

PR #66 모든 CI 그린. 리뷰어에게 재검토 요청 코멘트. 내용 초안:

- 5건 리뷰어 피드백 대응 완료 (CI fix, PR shape, unit tests, LFS fixtures, Code Gate)
- Sub-agent convention audit로 발견한 9건 묵시적 빚도 함께 정리 (MAP.md, README, dep justification, allow-comments, unwrap 제거 등)
- CI 그린 확인
- 머지 결정 요청

### 3. STL-74 merge 후 처리

merge 되면:

- STL-78 설계 prep 종료하고 실제 브랜치 `feat/shotloom-fbx-anim-importer` (또는 팀 브랜치 컨벤션 따름) 딴다.
- ADR 먼저 분리 PR 가능 여부 판단. `adr-0023` §3 확장 vs 신규 ADR 선택.
- Layer 1 파서 크레이트 scaffold → verbatim port → golden tests 순.

### 4. bevy-vrm scratch 업데이트 (선택)

`fbx_summary_scratch.rs` import를 `fbx_rig::fbxcel::...` → `fbx_animation_importer::fbxcel::...`로 교체. 개인 탐색용이라 급하지 않음. 커밋할지는 그때 결정.

### 5. STL-78 본격 착수 전 prep 체크리스트

STL-74 머지 전까지 해도 되는 설계 작업 (sequential-PR rule 준수):

- [ ] `shotloom-retarget`의 `SourceAsset` 실제 사용처 grep → 타입 소유권 판단
- [ ] `shotloom-import`의 VRM normalize 경로 재독 → FBX normalize 구조 템플릿화
- [ ] `shotloom-fbx-anim-importer` public API 축소 후보 정리 (최소 surface)
- [ ] STL-74 LFS fixture 3개가 STL-78 golden test에 재사용 가능한지 확인
- [ ] ADR 드래프트 (§3 확장 vs 신규)

---

## 배운 점

- **상류 리팩터링이 downstream 계획을 뒤집을 수 있다.** 어제까지는 "1188 LOC 모놀리식 포팅"이 작업 단위였는데, 하루 상류 작업 몇 개로 "8-module verbatim port + 7 golden test port"로 바뀜. 계획할 때 상류 상태를 매일 재확인해야 함.
- **Repo 안에 존재하지 않는 convention은 sampling이 유일한 동기화 경로다.** shotloom은 "tool-neutral" 원칙으로 Linear 이슈 템플릿을 의도적으로 repo에 두지 않음. 이런 convention은 Linear 이슈 샘플링 외에 maintain할 방법이 없음. 일주일 지나면 drift 생김.
- **Privacy는 artifact-type 횡단 규칙이다.** "shotloom Linear에 bevy-vrm 쓰지 마라"가 Linear에만 적용되면 PR 본문, Slack, repo doc에 슬금슬금 새어나감. Session-level 주의가 아니라 feedback memory로 persistent하게 박아둬야 함.
- **Linear markdown 파서는 테이블 + backtick 조합에 취약.** 한 번 파싱 엉키면 backtick들이 전혀 관련 없는 곳에서 다시 해석됨. 복잡한 구조는 테이블 대신 볼드 헤딩 + bullet로 풀어써야 안전. `.rs` / `.md` 확장자는 URL로 auto-link되므로 링크 문법과 충돌 주의.
- **Hybrid crate ownership은 VRM 패턴을 따라가는 게 가장 저항이 적다.** 파서와 normalization orchestration을 분리하는 건 추상적으로 논하기보단 "기존에 작동하는 VRM 흐름과 동형으로" 보면 결정이 빠름.

---

#devlog #shotloom #stl-78 #stl-75 #linear #privacy-rule #bevy-vrm #fbx-importer
