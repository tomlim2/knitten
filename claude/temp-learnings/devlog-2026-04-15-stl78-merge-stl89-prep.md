---
title: "04-15 (밤): STL-78 머지까지 + STL-89 prep — git-log-first, GitHub reply re-root, codex tail hang"
tags: [devlog, shotloom, stl-78, stl-89, pr-review, github-api, codex-cli]
date: 2026-04-15
---

# 04-15 (밤): STL-78 머지까지 + STL-89 prep

## 1. 세션 목표

1. STL-78 PR #72 에 달린 Copilot 코멘트 대응하고 머지까지
2. STL-89 (`retarget_arp_to_vrm` + viewer wiring) prep — 브랜치 + ADR 초안까지

둘 다 완료.

---

## 2. 오늘 얻은 교훈 3개 (재발 방지용)

### 2.1 세션 시작할 때 `git log` 먼저 읽어라

PR #72 에 달린 Copilot 인라인 코멘트 8개를 보고 "이거 다 고쳐야지" 하고 바로 codex subagent 에 P1 3개 dispatch 했는데, 나중에 `git log` 봤더니 **브랜치에 이미 commit `3f3650f` 가 있었음** — 제목이 "fix(fbx-anim-importer): address copilot review on #72 — range guard, cache invariant, naming". 즉 Copilot 코멘트 중 5개는 이미 2커밋 전에 push 로 해결된 상태였고, 내가 시킨 codex는 중복 작업을 돌린 셈.

- 원인: 세션 시작할 때 `git status` 만 보고 clean 인 것만 확인했음. `git log -10` 안 봤음.
- 결과: codex/subagent 이 이미 고친 곳을 또 고치는 바람에 VRM should_write 스코프 창크리프까지 발생. uncommitted diff 를 전부 revert 하고 진짜 필요한 2-file change (partial_cmp 주석) 만 커밋해야 했음.
- 재발 방지: **PR 리뷰 대응 세션 시작할 때 `git log --oneline -10` + 최신 커밋 메시지 전문 확인.** 특히 "address review / address copilot / address feedback" 같은 메시지가 최근에 있으면 Copilot 의 코멘트가 이미 outdated 일 가능성을 의심.

### 2.2 Copilot 리뷰는 "라운드" 개념으로 읽어야 한다

Copilot 은 PR 에 커밋이 추가되면 **새 리뷰 라운드** 를 돌린다. 즉 `gh api /pulls/{id}/comments` 로 가져오면 모든 라운드의 인라인 코멘트가 **평면적으로 섞여서** 반환됨.

- 1라운드: 커밋 `3f3650f` 전 코드에 달린 5개. `line: null`, `position: 1` 로 내려옴 (해당 라인이 현재 diff 에 없음 → GitHub UI 는 "Outdated" 로 접음).
- 2라운드: `3f3650f` 이후 돌린 새 리뷰 에서 달린 3개 (진짜 active).

내가 처음에 이걸 구분 안 하고 "코멘트 8개" 로 취급해서 답글 8개 초안 다 뽑았다가, user 가 "근데 그거 3개 아님?" 지적해서 뒤늦게 깨달음.

- 재발 방지: `gh api /pulls/{id}/reviews` 로 리뷰 단위 먼저 보고, 리뷰별 코멘트는 `/pulls/{id}/reviews/{review-id}/comments` 로 가져오자. `line: null` 은 outdated 신호로 해석.

### 2.3 GitHub review reply API 는 `in_reply_to_id` 를 re-root 한다

3 개 Copilot 코멘트 + 3 개 ryumiel follow-up 코멘트 (같은 file:line) 가 한 스레드에 공존하는 상태였음. ryumiel 코멘트에 답글을 달려고 `POST /pulls/72/comments/{ryumiel-id}/replies` 호출했는데, 반환된 객체의 `in_reply_to_id` 가 **Copilot 의 코멘트 ID** 로 나왔다. 즉 GitHub 는 같은 file:line 스레드의 최초 코멘트 (= 스레드 루트 = Copilot 꺼) 에 자동으로 re-root 함.

- UI 로는 "tomlim2 replied to Copilot" 으로만 보임. ryumiel 코멘트에 직접 답한 것처럼 안 보임.
- 결국 중복 답글 3개 (`DELETE /pulls/comments/{id}`) 로 제거하고, 첫 라운드 답글 (Copilot 에게 단 것) 에 ryumiel 포인트를 묵시적으로 포함시키는 걸로 해결.
- 재발 방지: **한 file:line 에 여러 리뷰어 코멘트가 섞여 있으면, 각자에게 따로 답글 달아도 전부 같은 루트에 붙는다.** 각자에게 명시적으로 답하고 싶으면 top-level PR comment 로 가거나, 답글 본문에서 "@ryumiel re:" 로 명시적으로 가리키거나, 애초에 각 리뷰어가 별도 스레드를 연 경우에만 가능.

---

## 3. 부수 교훈 — codex CLI tail 파이프 hang

P2/P3 배치를 `codex exec ... | tail -200` 백그라운드로 dispatch 했다가 **8 분째 0 바이트 출력 + 프로세스 부재** 상태로 멈춤. harness 는 "running" 이라고 우김.

원인 추정: `tail -200` 파이프가 codex 종료까지 버퍼링하는데, 중간에 codex 가 조용히 죽거나 stdin/tty 관련 문제로 flush 안 함.

해결: kill + 파일 리다이렉트 (`> /tmp/codex-p2p3.log 2>&1`) 로 재시작 — 그런데 user 가 "그냥 Agent tool 로 해" 해서 Sonnet subagent 로 교체. 결과적으로 subagent 가 훨씬 안정적이고 결과도 깔끔. **기계적 멀티파일 작업은 subagent (Sonnet) 이 codex CLI 백그라운드보다 reliable.**

---

## 4. STL-89 prep 결과

- 브랜치 `feat/arp-vrm-wiring` (from `main@943f1da`)
- Commits:
  - `52c13bc` docs(adr): propose ADR-0025 retargeter public driver (`evaluate_pipeline`)
  - `0fa0441` docs(adr): rename ADR-0025 entry point from `evaluate_pipeline` to `retarget_arp_to_vrm`
- 핵심 결정: 공개 엔트리 이름을 ADR-0023 §9 placeholder `evaluate_pipeline` 에서 **`retarget_arp_to_vrm`** 로 대체. 이유 — `evaluate_pipeline` 은 도메인/방향 둘 다 안 드러나고 generic plumbing 처럼 읽힘. `retarget_arp_to_vrm` 은 verb-first Rust 관용 + source rig 족(ARP) + target format(VRM) 명시 + 타입/모듈 이름과 혼동 불가.
- Contract (draft):
  ```rust
  pub fn retarget_arp_to_vrm(
      source: &SourceAsset,
      vrm_rest: &VrmRestPose,
      options: RetargeterOptions,
  ) -> (TargetAnimation, Vec<Diagnostic>);
  ```
- Minimal promotion surface: `RetargeterOptions`, `vrm_rest::build_from_bevy_vrm` (new), 이미 공개인 domain types. 나머지는 `pub(crate)` 유지.
- Open questions (ADR 안에 명시):
  - `VrmRestPose` constructor 최종 이름 (`build_from_bevy_vrm` vs `from_loaded_vrm` vs `extract_rest_pose`)
  - `RetargeterOptions` 에 `#[non_exhaustive]` 붙일지
  - `init_log` 을 diagnostic 으로 흡수할지 따로 반환할지

---

## 5. 내일 재개 위치

- **S2:** `retarget_arp_to_vrm` 실제 구현 + 최소 `pub(crate)` → `pub` 승격 + 단위 테스트
- **S3:** `vrm_rest::build_from_bevy_vrm` — `bevy_vrm1::Loaded` humanoid 컴포넌트 surface 조사 먼저 (자체 매핑 테이블 금지)
- **S4/S5:** `examples/viewer.rs` 배선 + male/female preset T-pose 탈출 확인
- **S6:** full gates + 22-pattern self-review (`/shotloom-review-before-pr`) + PR (`/shotloom-make-pr`)

---

## 6. 주말 TODO — 셀프 코드리뷰 blind spot 역추적

**질문:** 오늘 PR #72 에서 Copilot/ryumiel 이 잡은 지적사항을, 왜 내가 여러 번 돌린 셀프 코드리뷰에서는 못 걸러냈는가?

**조사 대상 (오늘 외부 리뷰가 처음 잡아낸 것들):**

1. `RotationOrder` i32 → u8 silent cast, downstream `euler_to_quat` XYZ fallback (Group C silent fallback)
2. `should_write` byte-compare 가 SHA-256 콘텐츠 어드레서블 캐시에서 중복 I/O (성능 + 디자인)
3. Windows `fs::rename` overwrite-failure 경로 (플랫폼 특이사항)
4. `write_artifact_atomically` 의 `!exists()` vs `rename` race (동시성)
5. `NORMALIZED_FBX_CACHE_VERSION` naming — 실제로는 normalization 단계 없음 (네이밍 ↔ 구현 mismatch)
6. `~12 MB` per-bone 추정 주석이 실제 `Quat+Vec3` ≈ 28 B/frame 대비 ~4x 과장 (산수 검증 누락)
7. `partial_cmp().unwrap()` panic 을 이유로 든 주석이 실제 `f32::total_cmp` 코드와 불일치 (doc↔code drift)
8. `assert_parse_err_contains` non-exhaustive match 가 미래 variant 추가 시 컴파일 에러 far-from-site (defensive test 설계)

**가설 (검증 필요):**

- **H1 — Pattern coverage gap:** 현재 `review-code-rust.md` 22-pattern 이 Group A (doc↔code), B (classifier asymmetry), C (silent fallback), D (library hygiene), E (build/platform), F (cross-crate) 로 나뉘어 있는데, **"수치/단위 검증" (#6) + "플랫폼 특이 IO" (#3) + "동시성 race" (#4) 는 어느 Group 에도 명시적으로 없음.** 체크리스트가 산수/플랫폼/동시성 축을 커버 안 하면 반복적으로 놓친다.
- **H2 — Diff-local reading bias:** 셀프 리뷰를 할 때 나는 `git diff` 단위로 파일 별로 읽는다. 그런데 #4 race, #3 Windows, #2 redundant I/O 는 **파일 단위가 아니라 호출 체인 전체** (`import_fbx_to_cache` → `should_write` → `write_artifact_atomically` → `fs::rename`) 를 머릿속에 그려야 잡힌다. 셀프 리뷰 시점에 "이 변경이 전체 I/O path 어디에 걸리는지" 를 명시적으로 스케치 안 했다.
- **H3 — 주석을 코드처럼 안 읽음:** #5 네이밍 드리프트, #6 12 MB 과장, #7 `partial_cmp` stale 주석 — 모두 **주석 자체의 사실 주장**이 틀린 케이스. 내가 셀프 리뷰할 때 주석은 "설명이니까 맞겠지" 로 넘기고 산수/패턴 일치 검증을 안 했다. Group A (doc↔code) 가 명시돼 있음에도 적용이 느슨했다.
- **H4 — Test 가 코드와 동시에 움직일 때 두 쪽 다 테스트 대상이 됨:** #8 은 "테스트를 테스트 하는" 메타 층. 내가 테스트를 작성하면서 미래 확장성까지 체크 안 했다. 테스트는 한 번 쓰고 잊는 대상이 아닌데.
- **H5 — Self-review repetition fatigue:** 3회 self-review 중 2-3회차에 "지난번에 봤으니 괜찮겠지" 로 커버리지가 줄어든 가능성. 매 회차에 동일한 pattern pass 를 돌렸는지, 아니면 회차마다 다른 각도만 봤는지 기록이 없음.

**조사 방법 (주말):**

1. `review-code-rust.md` 22 pattern 을 위 8 건과 매핑 — 각 defect 가 어느 pattern 으로 잡혔어야 했는지 표로 작성. Pattern coverage 구멍이 보이면 pattern 18-22 추가.
2. 셀프 리뷰 체크리스트에 **"산수/플랫폼/동시성/주석-사실"** 4 개 축을 명시적 bullet 으로 추가 (H1, H2 커버).
3. `/shotloom-review-before-pr` 스킬에 **"주석의 사실 주장을 코드와 대조" step** 추가 (H3 커버). 예: `grep -n "MB\|MiB\|ms\|panic\|unwrap" $DIFF_FILES` 같은 보조 grep 한 줄.
4. 회차별 self-review 기록 템플릿 — 매 회차에 어느 pattern 을 돌렸는지 명시적으로 체크 (H5 커버).
5. 결과를 `devlog-2026-04-18-self-review-blindspot.md` (토요일자) 로 기록하고, pattern 확장이 있으면 `standards/review-code-rust.md` 에 반영.

**우선순위:** H1 + H3 부터. 산수 + 주석-사실 불일치는 오늘 가장 많이 놓친 축이고 grep 수준 자동화로도 부분적으로 잡을 수 있음.

---

## 7. 주말 문서 정리 대상

이번 주 만들어둔 문서들 구조 리뷰 + 중복/이관 정리.

### 7.1 이중 관리 구조: `order/` vs `.agent/`

- `shotloom/.agent/handoff-stl-89.md` — repo-scoped 운영 메모리 (shotloom 체크아웃에 딸려옴)
- `~/.codex/order/stl-89-retarget-arp-to-vrm-wiring.md` — codex CLI 주문 큐
- 둘은 같은 내용 복사본. 오늘 만들 때 "source of truth = shotloom/.agent, 복사본 = ~/.codex/order" 로 결정했는데 원칙이 제대로 지켜질지 검증 필요.
- 주말 검토 항목:
  - 원칙 문서화: 어느 쪽이 canonical 인지 `~/.codex/order/README.md` 와 shotloom 의 `.agent/README.md` 둘 다에 교차 명시.
  - 복사본 드리프트 방지 방법 — symlink vs 수동 sync vs 복사만 허용. symlink 는 shotloom 체크아웃 상태 의존이라 위험. 수동 sync 가 현실적일 듯.
  - 완료된 order 는 어디로 — `~/.codex/order/archive/` 이관 vs Linear 완료 표시로 충분.

### 7.2 `.agent/` 폴더 구조 (shotloom)

- 오늘 `.agent/handoff-stl-89.md` 하나만 넣었는데, `~/.claude/standards/shotloom.md` 의 `.agent/` 섹션은 `README.md` + `working-rules.md` + `project-guide.md` + `checklists.md` 를 권장한다.
- 아직 `README.md` 조차 없어서 다음 agent 가 `.agent/` 폴더를 처음 열면 handoff 파일 하나만 보이는 상태. 주말에:
  - `.agent/README.md` — index (handoff 파일들 + 향후 working-rules 등 설명)
  - 필요 시 `.agent/working-rules.md` — shotloom 에서 agent 가 지켜야 하는 반복적 운영 rule (`rules/shotloom-git.md` 와 중복 안 되게 주의)

### 7.3 `~/.codex/order/` 디렉토리 구조

- 지금: `order/README.md` + `order/stl-89-*.md` 만 존재.
- 검토:
  - `order/archive/` 하위 도입 여부
  - order 파일 이름 규칙 (`<issue-id>-<slug>.md`) 확정 — 현재는 README 에 한 줄로만 있음
  - `order/` 외에 `prompts/`, `skills/` 같은 기존 폴더와 역할 분리 재검토. 특히 "반복적으로 쓰는 지시 템플릿" 과 "일회성 작업 주문" 이 섞이면 안 됨.

### 7.4 devlog → Obsidian 아카이빙

- 오늘자 `devlog-2026-04-15-stl78-merge-stl89-prep.md` 는 `caol-ila/claude/temp-learnings/` 에 있음 (평일 용).
- 주말에 이 devlog + 4/14 devlog 들을 Obsidian vault `claude/` 하위로 이관하고, `temp-learnings/` 는 비우는 게 `maximize-codex-sonnet` / `weekday-temp-storage` 메모리 규칙에 맞음.
- 메모리에 기록된 규칙: *"평일 devlog/learning은 caol-ila temp-learnings로, 주말에 Obsidian 아카이빙"*

**우선순위:** 7.1 (이중 관리 원칙) 이 제일 시급. 지금 분산돼 있어서 다음 세션에 찾을 때 헷갈릴 위험이 있음.

---

## 8. 주말 TODO — vrm2u-bevy thumb retarget chain rewrite

밤늦게 viewer 띄워서 0.x 모델 (`vroid_0x_f_minjoon.vrm`) 의 엄지 문제 진단 시작 → 표면 픽스 시도 → 근본 원인 발견 → **모든 코드 수정 revert + 여기로 이관.** 깊은 작업이고 4월 초 R&D 가 막혔던 영역이라 신중하게 접근해야 함.

### 8.1 사용자 보고

- 모델: `assets/models/vroid_0x_f_minjoon.vrm` (VRM 0.x VRoid 모델)
- 증상 1: 엄지가 반대 방향으로 꺾임
- 증상 2: 엄지 끝 (`ThumbDistal`) 이 아예 안 구부러짐 (양손)
- VRM 1.x 모델에선 위 두 증상 안 보이는 듯 (확인 필요)

### 8.2 진단 결과 — 발견 5건

오늘 코드 안 들여다보고는 이해 불가. 5건 다 같은 근본 원인의 layer 별 노출.

#### ① `vrm0_compat::humanoid::BONE_RENAMES` 가 0.x → 1.0 엄지 매핑을 잘못함

파일: `crates/vrm0_compat/src/humanoid.rs:6-11`

```rust
("leftThumbIntermediate", "leftThumbMetacarpal"),  // ❌
("rightThumbIntermediate", "rightThumbMetacarpal"),// ❌
("leftThumbProximal", "leftThumbProximal"),        // ❌ Proximal → Metacarpal 이어야
("rightThumbProximal", "rightThumbProximal"),      // ❌
```

VRM 0.x 와 1.0 의 엄지 본 네이밍은 한 슬롯 밀려 있음. 같은 3개 물리 본:

| 물리 위치 | VRM 0.x | VRM 1.0 |
|---|---|---|
| 손에 붙은 뿌리 | `ThumbProximal` | `ThumbMetacarpal` |
| 중간 관절 | `ThumbIntermediate` | `ThumbProximal` |
| 끝 | `ThumbDistal` | `ThumbDistal` (동일) |

올바른 매핑:

```rust
("leftThumbProximal", "leftThumbMetacarpal"),
("rightThumbProximal", "rightThumbMetacarpal"),
("leftThumbIntermediate", "leftThumbProximal"),
("rightThumbIntermediate", "rightThumbProximal"),
// Distal pass-through
```

현재 코드는 0.x 의 "Intermediate" (중간) 를 1.0 의 "Metacarpal" (뿌리) 로 잘못 매핑하고, 0.x 의 "Proximal" (실제 뿌리) 을 1.0 "Proximal" (중간 슬롯) 으로 그대로 둠. 결과적으로 0.x 모델에선 humanoid map 에서 뿌리/중간이 뒤바뀌어, retargeter 가 "뿌리 굽힘" 회전을 적용할 때 실제론 중간 본을 굽혀서 엄지가 반대 방향으로 꺾임.

#### ② `compute_virtual_rest_global` 이 1.0 엄지 chain 모름

파일: `crates/humanoid_retarget/src/vrm_rest.rs:307-318`

```rust
for finger in &fingers {  // ["Thumb", "Index", "Middle", "Ring", "Little"]
    pairs.push((f"{side}{finger}Proximal", f"{side}{finger}Intermediate", side_x));
    pairs.push((f"{side}{finger}Intermediate", f"{side}{finger}Distal", side_x));
}
```

모든 finger 가 `Proximal → Intermediate → Distal` chain 이라고 가정. 하지만 VRM 1.0 엄지엔 `Intermediate` 슬롯이 없음 (`Metacarpal → Proximal → Distal`). 결과: 엄지의 virtual rest 가 lookup 실패 → 엄지 뿌리/끝 둘 다 rest 보정 없음.

수정안: 엄지만 별도 처리:
```rust
if *finger == "Thumb" {
    pairs.push((f"{side}ThumbMetacarpal", f"{side}ThumbProximal", side_x));
    pairs.push((f"{side}ThumbProximal", f"{side}ThumbDistal", side_x));
} else { /* 기존 Proximal/Intermediate/Distal */ }
```

#### ③ `segment_depth` 가 1.0 엄지 못 분류

파일: `crates/humanoid_retarget/src/finger_rest_align.rs:159-172`

```rust
if ends_with("proximal") → 0
if ends_with("intermediate") → 1
if ends_with("distal") → 2
else → 3 (unknown)
```

`leftThumbMetacarpal` 은 위 세 어떤 suffix 와도 안 맞아서 3 (unknown) 반환 → 엄지 chain 위상 정렬이 깨짐. 게다가 `leftThumbProximal` 을 0 (뿌리 역할) 로 분류하는데 1.0 에선 이게 중간 관절이라 의미가 뒤바뀜.

수정안: 엄지일 땐 다른 매핑:
```rust
let is_thumb = lower.contains("thumb");
if is_thumb && ends_with("metacarpal") { 0 }
else if is_thumb && ends_with("proximal") { 1 }
else if ends_with("proximal") { 0 }
else if ends_with("intermediate") { 1 }
else if ends_with("distal") { 2 }
else { 3 }
```

#### ④ **`arp_body.json` 의 `*Thumb* Skip` 룰 — 진짜 근본 원인**

파일: `assets/retarget/arp_body.json`

```json
["*Thumb*", "Skip"],
["*Index*", "ScalarCurl"],
["*Middle*", "ScalarCurl"],
...
```

매핑 자체는 메인 테이블에서 `c_thumb1/2/3 → leftThumbMetacarpal/Proximal/Distal` 로 정상 연결돼 있음. 하지만 retarget mode 룰에서 **모든 Thumb 매칭 본을 의도적으로 Skip 처리**. 즉 ①②③ 다 고쳐도 retargeter 자체가 엄지 회전 계산을 안 함. 이게 사용자가 본 "엄지 끝 안 구부러짐" 의 직접 원인.

`experiments-thumb-bind-pose.md` (2026-04-03) 에 *"Thumb 은 multi-axis 라서 from_rotation_arc shortest arc 가 안 맞음 → curl direction 이 바깥으로 꺾임 → skip"* 으로 기록된 결정의 잔재. ScalarCurl 모드는 단일 축 가정인데 엄지는 palm 평면 + palm 수직 두 축으로 동시에 회전해야 해서 ScalarCurl 적용 불가.

#### ⑤ `arp_body.json` 안 0.x 레거시 매핑 잔재

같은 파일 다른 섹션 (override 블록?) 에:

```json
"c_thumb1.l": "leftThumbProximal",       // 0.x 네이밍 — 1.0 에선 Metacarpal 이어야
"c_thumb2.l": "leftThumbIntermediate",   // 0.x 네이밍 — 1.0 에선 Proximal
```

메인 테이블의 1.0 매핑과 상충됨. 우선순위/덮어쓰기 순서 확인 필요.

### 8.3 대체 경로 — `arp_vrm_user_pose.rs` EXP-004

파일: `crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:73-102`

devlog 에 적힌 EXP-004 (2026-04-12) UserCalibrated path. 6개 엄지 본 매핑 정의 + viewer 키바인딩 (P=calibration, Tab=thumb bone, Q/W/A/S/Z/X=rotate) 까지 만들어져 있음. 하지만 retarget pipeline 에 wire up 안 된 듯 — Skip 룰을 우회해서 이 path 를 활성화하면 엄지 처리가 가능할 가능성 있음.

devlog 메모: *"EXP-003 DirectCopy failed (thumb → elbow). EXP-004 UserCalibrated 가능성"*. 즉 DirectCopy 도 시도했고 실패. UserCalibrated 가 그나마 가능성 있는 마지막 시도.

### 8.4 주말/내일 작업 분기

| 옵션 | 작업량 | 리스크 |
|---|---|---|
| **A. UserCalibrated path 활성화만** | 1-2시간 | 낮음. ④ Skip 룰 빼고 EXP-004 wire up. 한 모델만이라도 동작 보면 성공 |
| **B. 새 `ThumbCurl` 모드 설계 + 구현** | 4-8시간 | 중. multi-axis (palm normal + palm plane) 처리 새로 짜야 함 |
| **C. multi-model 회귀 검증** | +2-4시간 | 0.x/1.x, M/F, 여러 모델 |
| **D. B+C** | **반나절~하루** | 디자인 spiral 가능성 있음 (4월 초 R&D 가 막혔던 곳) |

### 8.5 권장 진입 순서

1. **새 Linear issue 생성** — e.g. *"vrm2u-bevy: thumb retarget chain rewrite"*. STL- prefix 안 붙음 (개인 프로젝트). 위 ①-⑤ 발견 + 옵션 A/B 명시.
2. **옵션 A 먼저 시도** (1-2시간 박스). UserCalibrated 활성화 + 한 모델 (`vroid_0x_f_minjoon.vrm`) 로 시각 검증.
3. 옵션 A 가 안 풀리면 **옵션 B 로 escalation.** `experiments-thumb-bind-pose.md` 의 EXP-002 (palm normal 기반 signed angle) 부터 다시 시도.
4. **옵션 A 가 풀리면**: ①②③ 도 함께 fix (cascading 으로 효과 나타남), 그리고 옵션 C 로 multi-model 회귀 측정.

### 8.6 오늘 시도한 코드 수정 (전부 revert 됨)

기록만 남김. 실제 적용 안 됨 — `git status` 클린 상태로 종료.

- `vrm0_compat/src/humanoid.rs` ① 수정 + 단위 테스트 3개
- `humanoid_retarget/src/vrm_rest.rs` ② 수정
- `humanoid_retarget/src/finger_rest_align.rs` ③ 수정

Cargo test 는 green 이었지만 ④ 가 진짜 원인이라 시각적으로는 효과 없음. 부분 수정만 commit 하면 misleading 한 "thumb fix" 커밋이 git history 에 남게 됨 → 전부 revert 결정.

### 8.7 시간 추정

- 옵션 A 시도 + 결과 확인: 1-2시간
- 옵션 A 가 풀린 경우 ①②③ + 회귀 측정: +2-3시간
- 옵션 B 까지 가야 하는 경우: 추가 4-8시간

**하루 작업 박스 권장.** 안 풀리면 issue 에 partial findings 만 commit 하고 다음 세션으로 넘김.

---

## 9. 주말 TODO — vrm0_compat 전체 audit (별개 작업, §8 보다 우선)

§8 thumb 디버깅 도중에 나온 framing: *"converter 가 자기 책임 (정확한 0.x → 1.0 변환) 만 제대로 하면, 0.x 와 1.0 모델이 동일한 buggy runtime 상태가 되어 문제가 단일화된다."*

이 framing 을 받아서 `vrm2u-bevy/crates/vrm0_compat/` 6개 파일 (lib.rs, glb.rs, humanoid.rs, meta.rs, materials.rs, expressions.rs, spring_bone.rs) 전체를 VRM 0.x ↔ 1.0 spec 차이와 비교해 audit 함. **모든 코드 수정은 보류 — 발견만 기록.**

### 9.1 🔴 P1 — Critical 버그 (출력이 구조적으로 잘못됨)

#### P1-1. `humanoid.rs::BONE_RENAMES` 엄지 체인 매핑

§8 ① 와 동일. 4줄 fix:
```rust
("leftThumbProximal", "leftThumbMetacarpal"),
("rightThumbProximal", "rightThumbMetacarpal"),
("leftThumbIntermediate", "leftThumbProximal"),
("rightThumbIntermediate", "rightThumbProximal"),
// Distal pass-through
```
파일: `crates/vrm0_compat/src/humanoid.rs:6-11`. 시간 추정: 10분 + 단위 테스트 3개.

#### P1-2. `expressions.rs::convert` mesh→node 잘못된 매핑

파일: `crates/vrm0_compat/src/expressions.rs:62-66`

```rust
Some(json!({
    "node": mesh,  // VRM 0.x mesh index maps to node  ← 거짓말 주석
    "index": index,
    "weight": weight / 100.0
}))
```

VRM 0.x `blendShapeBind`:
- `mesh`: `meshes[]` 배열의 인덱스 (mesh 자원)
- `index`: 그 mesh 의 morph target 인덱스
- `weight`: 0-100

VRM 1.0 `morphTargetBind`:
- `node`: `nodes[]` 배열의 인덱스 (그 노드는 `mesh` 필드로 mesh 를 참조)
- `index`: morph target 인덱스
- `weight`: 0.0-1.0

**문제:** 현재 코드는 mesh index 를 node index 로 그대로 사용. 두 인덱스는 우연히 일치할 수도 있고 아닐 수도 있음. 일반 모델에선 `nodes[i].mesh = i` 로 정렬돼 있어서 우연히 작동할 수 있지만, 노드 순서가 뒤섞인 모델 (특히 spring bone 등 추가 노드가 mesh 노드보다 먼저 오는 경우) 에선 **blend shape 가 잘못된 노드에 적용되거나 아예 안 적용**.

수정 방법: `nodes[]` 배열을 한 번 스캔해서 `mesh_idx → node_idx` 역매핑 만들고 lookup. 한 mesh 가 여러 node 에서 참조되는 경우는 (인스턴싱) 별도 처리 필요 — VRM 모델에선 드물지만 spec 상 가능.

```rust
fn build_mesh_to_node_map(json: &Value) -> HashMap<u64, u64> {
    let mut map = HashMap::new();
    if let Some(nodes) = json.get("nodes").and_then(|v| v.as_array()) {
        for (node_idx, node) in nodes.iter().enumerate() {
            if let Some(mesh_idx) = node.get("mesh").and_then(|v| v.as_u64()) {
                // 첫 번째로 만난 노드 사용. 인스턴싱 시 추가 처리 필요.
                map.entry(mesh_idx).or_insert(node_idx as u64);
            }
        }
    }
    map
}
```

`expressions::convert` 시그니처에 `nodes` 추가하거나 `lib.rs` 에서 미리 매핑 만들어 전달. 시간 추정: 30-60분 + 단위 테스트.

### 9.2 🟠 P2 — Significant gaps (정보 손실)

#### P2-1. `meta.rs` 라이선싱 필드 전부 무시

파일: `crates/vrm0_compat/src/meta.rs:25-39`

현재 코드는 `title/author/version` 만 읽고 라이선싱은 안전한 default 박음:
```rust
"licenseUrl": "https://vrm.dev/licenses/1.0/",
"avatarPermission": "everyone",
"commercialUsage": "personalNonProfit",
...
"allowExcessivelyViolentUsage": false,
"allowExcessivelySexualUsage": false,
"allowPoliticalOrReligiousUsage": false,
"allowAntisocialOrHateUsage": false,
"allowRedistribution": false,
```

VRM 0.x 의 실제 필드 (`extensions.VRM.meta`):
- `allowedUserName` ("OnlyAuthor"|"ExplicitlyLicensedPerson"|"Everyone") → 1.0 `avatarPermission` ("onlyAuthor"|"onlySeparatelyLicensedPerson"|"everyone")
- `commercialUssageName` ("Allow"|"Disallow") → 1.0 `commercialUsage` ("personalNonProfit"|"personalProfit"|"corporation")
- `violentUssageName` ("Allow"|"Disallow") → 1.0 `allowExcessivelyViolentUsage` (bool)
- `sexualUssageName` ("Allow"|"Disallow") → 1.0 `allowExcessivelySexualUsage` (bool)
- `licenseName` (string) → 1.0 `licenseUrl` (URL — 매핑 표 필요: "Redistribution_Prohibited" → 어떤 URL?)
- `otherPermissionUrl` → 1.0 `otherLicenseUrl`
- `texture` (thumbnail node index) → 1.0 `thumbnailImage` (image index — 변환 필요)
- `contactInformation` → 1.0 `contactInformation`
- `reference` → 1.0 `references[]`

**저자가 명시한 권한이 전부 손실** → 라이선스 위반 가능성. 시간 추정: 60-90분 + 매핑 표 검증.

#### P2-2. `materials.rs` 텍스처 누락

파일: `crates/vrm0_compat/src/materials.rs`

현재 변환되는 텍스처: `_MainTex` (baseColor), `_ShadeTexture` (shadeMultiply). 끝.

VRM 0.x MToon 의 다른 텍스처들:
- `_BumpMap` → glTF `normalTexture`
- `_EmissionMap` → glTF `emissiveTexture` + `emissiveFactor`
- `_SphereAdd` → MToon 1.0 `matcapTexture`
- `_OutlineWidthTexture` → MToon 1.0 `outlineWidthMultiplyTexture`
- `_RimTexture` → MToon 1.0 `rimMultiplyTexture`
- `_UvAnimMaskTexture` → MToon 1.0 `uvAnimationMaskTexture`

전부 변환 안 됨 → MToon 시각 충실도 손실. 시간 추정: 60-120분.

#### P2-3. `materials.rs::transparentWithZWrite` 하드코드

파일: `crates/vrm0_compat/src/materials.rs:170`

```rust
"transparentWithZWrite": false,
```

`VRM/UnlitTransparentZWrite` 셰이더는 이름 그대로 ZWrite=true 인데 무조건 false. 셰이더 이름 보고 분기:
```rust
"transparentWithZWrite": shader == "VRM/UnlitTransparentZWrite",
```
시간 추정: 5분.

### 9.3 🟡 P3 — 검증 필요 (spec 재확인 후 결정)

#### P3-1. `lib.rs::flip_root_nodes` 정당성

파일: `crates/vrm0_compat/src/lib.rs:96-112`

루트 노드에 180° Y 회전 적용 (`[0.0, 1.0, 0.0, 0.0]`). VRM 0.x 와 1.0 의 facing 차이 보정인 듯. 검증 필요:
- VRM 0.x 캐릭터는 +Z 방향 facing? -Z?
- VRM 1.0 spec: 캐릭터는 +Z 방향 facing (per VRMC_vrm 1.0)
- 0.x 가 -Z 였다면 180° Y 회전 정당. 0.x 도 +Z 였다면 잘못된 회전.

시각 회귀 테스트로 검증 가능. spec 문서 직접 확인 권장.

#### P3-2. `spring_bone.rs::collect_chain` 분기 처리

파일: `crates/vrm0_compat/src/spring_bone.rs:181-198`

```rust
loop {
    match children_map.get(&current) {
        Some(children) if children.len() == 1 => {
            current = children[0];
            chain.push(current);
        }
        Some(children) if children.len() > 1 => {
            for &child in children {
                chain.push(child);
            }
            break;  // ← 분기점 자식들만 push 하고 그 자식의 자손은 무시
        }
        _ => break,
    }
}
```

분기점 (skirt → 4 panel) 같은 spring bone 구조에서 panel 의 깊은 자식들이 chain 에 안 들어감. bevy_vrm1 이 어떻게 처리하는지 확인 필요. 재귀로 바꾸거나 각 자식별로 별도 spring 생성하는 게 정공법.

#### P3-3. `lib.rs::extensionsRequired` 미설정

파일: `crates/vrm0_compat/src/lib.rs:114-136`

`extensionsUsed` 만 업데이트, `extensionsRequired` 는 안 건드림. unlit MToon 머티리얼 (특히 hair, eye glow) 은 일부 viewer 에서 `KHR_materials_unlit` 을 required 로 선언해야 정상 표시. 시간 추정: 10분.

### 9.4 ✅ Clean (변경 불필요)

- `glb.rs` — GLB 파싱/리빌드. 표준 glTF GLB 컨테이너 처리, 정확함.
- `expressions.rs` preset rename — happy/angry/sad/relaxed/aa/ih/blink/lookUp 등 매핑 spec 과 일치.
- `materials.rs` 감마→선형 변환, alpha mode 매핑, outline width cm→m. 정확.
- `spring_bone.rs::stiffiness` 오타 처리 + 결측 필드 default. 정확.

### 9.5 작업량 추정 + Tier 분류

| Tier | 항목 | 시간 |
|---|---|---|
| **Tier 1** | P1-1, P1-2 | 1.5-2시간 |
| **Tier 2** | + P2-1, P2-2, P2-3 | + 2-3시간 |
| **Tier 3** | + P3-1, P3-2, P3-3 검증/수정 | + 1-2시간 |

전체 audit 완수: **약 5시간 작업**. Tier 1+2 만: **약 4시간**.

### 9.6 §8 (thumb 시각 문제) 와의 관계

**Converter audit (§9) 가 끝나도 사용자가 본 "엄지 안 구부러짐" 은 해결 안 됨.** 그 문제는 §8 의 ④ `arp_body.json` Skip 룰 + ②③ runtime 결함 때문. Converter 책임 밖.

하지만 §9 가 끝난 후엔:
- 0.x 모델이 진짜 valid 1.0 처럼 보이게 됨
- §8 의 thumb 문제가 *"0.x 만"* 이 아니라 *"모든 VRM"* 의 동일한 문제로 단일화됨
- §8 작업의 가설/측정이 깔끔해짐 — *"이 fix 가 0.x 와 1.x 양쪽에서 동일하게 작동한다"* 를 보장 가능

**권장 순서:** §9 Tier 1 (필수 P1) → §8 옵션 A (thumb runtime UserCalibrated path 활성화) → §9 Tier 2 (P2 정보 손실 차단) → §9 Tier 3 (P3 검증). 한 번에 모든 걸 안 풀어도 됨, 단계별로 commit/test/visual-regression.

### 9.7 새 Linear issue 후보 제목

- *"vrm2u-bevy: vrm0_compat full audit + structural fixes"* (P1 Tier 1)
- *"vrm2u-bevy: vrm0_compat licensing + material gap closure"* (P2 Tier 2)
- *"vrm2u-bevy: thumb retarget chain rewrite"* (§8 — 별개 issue)

3개 이슈로 분리하면 각각 PR 단위가 적당함. 한 PR 에 다 넣으면 reviewer 가 audit 영역과 runtime 영역 섞여서 리뷰하기 어려움.

### 9.8 오늘 commit 안 한 코드

§9 audit 도 §8 처럼 **모든 코드 수정 보류**. 발견만 이 devlog 에 기록. `vrm2u-bevy` git tree 는 클린 상태로 종료.
