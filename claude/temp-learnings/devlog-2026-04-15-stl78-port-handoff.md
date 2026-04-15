---
title: "04-15: STL-78 FBX importer 포팅 핸드오프 — bevy-vrm 리뷰 완료 + shotloom 브랜치 준비"
tags: [devlog, shotloom, stl-78, bevy-vrm, handoff, fbx-importer]
date: 2026-04-15
---

# STL-78 FBX importer 포팅 핸드오프

다음 세션이 바로 이어받을 수 있게 작성. Pre-flight → Layer 1/2/3 → PR 순서.

---

## 세션 요약 (04-15 오후)

### bevy-vrm `fbx_animation_importer` 리뷰 + 개선 (main, 6 커밋 ahead of origin, push X)

| 커밋 | 내용 |
|---|---|
| `d5df021` | **Rename pass** — Fbx*→Source* 타입 정렬 (shotloom source_data.rs와 1:1). humanoid_retarget의 로컬 `SourceFormat`(파일포맷 discriminator, `Fbx` 변형)은 `SourceFileFormat`으로 분리해서 collision 해소 |
| `6eed022` | **pub 축소** — `math`/`parse`/`skeleton`/`types` 모두 `pub(crate)`. crate root re-export만 public |
| `dbbc18b` | **ParseConfig + parse_with_config** — sample_rate 파라미터화, `DEFAULT_SAMPLE_RATE` 공개, 0/음수/NaN Err, 60fps frame_count 테스트 |
| `298a931` | **DCC Auto fallback** — "all-identity PreRotation → Blender" heuristic 제거. Creator 없고 positive signal 없으면 `Auto`, downstream에서 Auto는 Maya-style(Z-up cm) path로 처리 |
| `be2a2d2` | **Hand inpainting history 주석** — d8a606c → 5765b7f → 2490d77 3-커밋 rollback 히스토리 inline으로 박아둠. 의도된 hand-only scope, brittle 아님 |
| `ad990ff` | **Euler order 문서화 + 테스트** — FBX RotationOrder 0-5 전체 유도 설명, glam reversal 수식, unsupported 6+은 `debug_assert!` + release 빌드 best-effort XYZ fallback. 6 inline unit test |

**테스트 현황:** 10 lib + 8 error_cases + 12 golden suites 전부 green. `cargo check --workspace` 그린.

**남은 이슈 (결론 나중에):**
- `BlendShape_g` Null 필터 — 파서 버그 아니라 MetaHuman convention. face scope에서 bones 버리면 자동 해결됨. 결정 대기
- body/face split 위치 — open discussion, 현재 **(B) 리타게터 레벨 split** 유지가 shotloom 방향과 일치한다는 판단. 코드는 안 건드림

### shotloom-github 상태

- **STL-74 PR #66 MERGED** (`c2c92d7` on main)
- 로컬 `main`: `c2c92d7` + `32ededa feat(core)!: establish Rust persisted model as bundle format SoT (#67)` 최신
- **브랜치 생성 완료**: `feat/fbx-anim-importer` (from latest main)
- **⚠ Uncommitted on feat/fbx-anim-importer**: `AGENTS.md` 72줄 추가 (Documentation Precedence 섹션). 원래 feat/shotloom-retarget 작업 중이던 로컬 변경이 stash→pull→pop 경로로 새 브랜치로 넘어옴. **STL-78 scope 아님** — 별도 처리 필요:
  - (A) 별도 `docs/agents-precedence` 브랜치로 분리 + 단독 PR → 권장
  - (B) 그냥 discard (유저 결정)
  - (C) STL-78 브랜치에 같이 커밋 → scope 오염, 비추
- gh active: `tomlim2` ✅
- git identity: `tomlim2 <deemo@vonvon.me>` ✅

---

## Privacy 규칙 (MUST follow)

**shotloom artifact(Linear/PR/커밋/ADR/코드 코멘트/Slack) 어디에도 `bevy-vrm` 언급 금지.**

허용 표현:
- "prior internal prototype"
- "upstream reference implementation"
- "선행 R&D 코드"

금지:
- `bevy-vrm`, `fbx_animation_importer` crate 경로 직접 참조, GitHub 링크, "이전 프로젝트에서…" 식 식별 가능 표현

근거: `feedback_shotloom_no_private_repo_refs` memory entry. Session-level 방심하면 샘 — 매 커밋 메시지 / PR body 작성 시 의식적으로 체크.

---

## 포팅 계획

### Architecture (STL-78 hybrid 확정, adr-0023 §3 기반)

```
Layer 1: shotloom-fbx-anim-importer (신규 crate)
         — 순수 parser, fbxcel 의존, std::fs 미사용 (bytes 입력), WASM 호환 가능
         — parse(bytes, config) → SourceAsset
Layer 2: shotloom-import에 FBX normalize 경로 추가
         — Layer 1 래핑, 캐시 아티팩트 생성, std::fs로 머티리얼라이즈, native-only
         — sha2 content-hash cache key + Diagnostic 생성
         — 동형 레퍼런스: shotloom-gltf::normalize_vrm
Layer 3: shotloom-retarget이 consumer
         — SourceAsset 그대로 소비, 이미 source_data.rs에 타입 정의 존재
```

### Pre-flight (다음 세션 첫 30분, read-only)

1. **shotloom conventions 재읽기 전량** (rules/conventions.md 요구)
   - `CONTRIBUTING.md`
   - `AGENTS.md` (uncommitted diff 포함해서 봐야 함)
   - `docs/guidelines/pr-guideline.md`
   - `docs/guidelines/commit-guideline.md`
   - `docs/guidelines/review-rust.md`
   - `docs/guidelines/code-review-guideline.md`
   - `docs/adr/adr-0023-retargeter-validation-contract.md` §3
2. **SourceAsset 소비처 grep** — `shotloom-retarget/src/` 전체
3. **`shotloom-gltf::normalize_vrm → shotloom-import` 재독** — Layer 2 템플릿
4. **STL-74 LFS fixture 3개가 이미 shotloom에 있는지 확인** — 재사용 여부
5. **ADR 결정** — adr-0023 §3 extend vs 신규 ADR (어느 쪽이 팀 convention?)
6. **bevy-vrm 상류 재확인** — 혹시 오늘 이후 또 바뀐 게 있는지 (devlog 첫 교훈)

### Layer 1 단계별

1. `crates/shotloom-fbx-anim-importer/` scaffold
   - `Cargo.toml` — fbxcel dep + `#` 주석으로 justification (review-rust.md dep 정책)
   - `MAP.md` 엔트리 등록
   - `README.md` — scope, 의존, public surface 설명
2. **8 modules verbatim port**:
   - `src/lib.rs` (44 LOC)
   - `src/detect.rs` (이미 improved: creator → positive PreRotation heuristic → Auto, 5 inline unit test 포함)
   - `src/math.rs` (이미 improved: 풀 doc + 6 inline unit test)
   - `src/skeleton.rs` (이미 improved: Auto → Maya-style path)
   - `src/types.rs` (이미 renamed + ParseConfig/DEFAULT_SAMPLE_RATE 추가)
   - `src/raw.rs`
   - `src/post_process.rs`
   - `src/parse/{mod,anim_curve,attrs,cluster,model,skip}.rs` (이미 improved: parse + parse_with_config + sample_rate validation, hand inpainting history 주석)
3. **crate 이름만 변경**: `fbx_animation_importer` → `shotloom_fbx_anim_importer`. 내부 타입 이름은 이미 Source* 정렬 완료 (오늘 rename 덕분)
4. **Public surface** (lib.rs re-export 전부):
   ```rust
   pub use math::euler_to_quat;
   pub use parse::{parse, parse_with_config};
   pub use skeleton::{SourceSkeletonFrames, compute_source_skeleton};
   pub use types::{
       DEFAULT_SAMPLE_RATE, Error, ParseConfig,
       SourceAsset, SourceBone, SourceBoneTrack, SourceFormat,
   };
   ```
   **주의**: `compute_source_skeleton_from_raw`(바이트 입력 편의)는 **shotloom에 포팅 X**. shotloom 철학상 parse는 따로, skeleton 계산은 SourceAsset 입력만. Bytes 입력 편의는 bevy-vrm 전용
5. **Golden test 7종 포트**:
   - `golden_basic`, `golden_bind_pose`, `golden_blendshape`, `golden_dcc_detect`, `golden_hierarchy`, `golden_quat_continuity`, `error_cases`
   - fixture 경로를 shotloom 레포 구조로 리디렉션
   - testing.md 예외 #3("verbatim port w/ test in same PR") 적용
6. **LFS fixture check-in** — STL-74 재사용 가능 여부에 따라 새 LFS 추가 판단

### Layer 2 단계별

1. `shotloom-import/Cargo.toml`에 `shotloom-fbx-anim-importer` workspace dep 추가
2. `shotloom-import/src/lib.rs` (또는 적절 위치)에 `normalize_fbx(bytes, config)` 함수
   - `normalize_vrm` pattern 복사해서 FBX로 변형
   - `shotloom_fbx_anim_importer::parse_with_config`로 파싱
   - sha2 content-hash로 cache key
   - `shotloom_common::Diagnostic` 생성
3. Unit test — happy path + cache hit/miss

### Layer 3 단계별

1. `shotloom-retarget`의 `SourceAsset` 타입과 Layer 1 출력 호환성 **확인**. 타입 정의 위치가 다르면 (retarget 쪽에 있고 importer 쪽은 그걸 import) 의존 관계 설정
2. Viewer example 확장 — FBX 로드 → retargeter → VRM playback (**T-pose 탈출 시각 검증** AC 항목)

### ADR

- 신규 ADR 또는 adr-0023 §3 확장 중 택1
- hybrid 3-layer 구조 + crate 경계 근거 기록
- adr README 인덱스 업데이트 (shotloom-git.md rule)
- `validate-doc-paths.mjs` 통과 확인

---

## PR 게이트 (open 전 필수)

```
cargo check --workspace --exclude shotloom-desktop
cargo fmt --check
cargo clippy --workspace -- -D warnings
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
```

**추가 체크:**
- [ ] commit author `tomlim2 <deemo@vonvon.me>` (`git log -1 --format="%an <%ae>"`)
- [ ] gh active account `tomlim2` (`gh auth status`)
- [ ] branch name `feat/fbx-anim-importer` (no stl-NN prefix)
- [ ] commit message conventional (lowercase type+scope, ≤80자 subject, `docs/guidelines/commit-guideline.md`)
- [ ] PR 본문 shotloom 관행 (`## Summary`, `## Test plan` checkbox, `Related to STL-78` footer)
- [ ] privacy scrubbing: `bevy-vrm` 0건 (grep 검증)
- [ ] ADR 변경 시 `docs/adr/README.md` 인덱스 업데이트
- [ ] sample 3-5 recent merged PRs 스타일 참조 (conventions.md rule)

**PR open은 유저 명시 승인 필수** (rules/git.md). `gh pr create` 호출 전 전체 pre-flight checklist 통과 + 유저 OK.

---

## 주의점 (devlog 축적)

1. **Cargo.lock 충돌** — shotloom pull 시 자주 발생. `git stash → pull → stash pop` 경로로 우회. 업스트림이 같은 Cargo.lock 재생성 포함하면 pop 클린
2. **Linear markdown 파서 취약** — 테이블 + backtick 조합 주의. `.rs`/`.md` 확장자 auto-linkify. STL-78 comment 추가 시 plain heading + bullet 구조 권장
3. **상류 변동 매일 재확인** — shotloom main 빠르게 움직임. 포팅 중에도 주기적으로 fetch
4. **testing.md 예외 #3**: verbatim port + 동일 PR test port. 예외 근거를 PR description에 명시 ("verbatim port from upstream reference implementation with ported tests in same commit")
5. **Privacy는 artifact 횡단** — Linear comment, PR body, commit message, ADR, code comment 전부 동일 규칙. 커밋 메시지에 습관적으로 "ported from bevy-vrm" 같은 거 쓰면 안 됨

---

## 다음 세션 즉시 해야 할 것 (순서)

1. **이 파일 + 04-15 planning devlog 읽기** (context 복구)
2. **AGENTS.md 처리 결정** — 별도 브랜치 vs discard vs STL-78 포함. 제 추천: A (별도 `docs/agents-precedence` 브랜치)
3. **Pre-flight 수행**:
   - shotloom conventions 전량 재읽기 (rules/conventions.md 강제사항)
   - shotloom `main` fetch/pull 재확인
   - bevy-vrm `main` 혹시 또 변경됐나 재확인
4. **Layer 1 scaffold 시작** (Cargo.toml → MAP.md → README.md → 모듈 파일들)
5. **2-3 modules 단위로 cargo check 반복** — verbatim port지만 crate 이름 rename + workspace dep 다르므로 한번에 8개 밀어버리지 말고 증분

---

## 열린 질문 (나중에)

- **body/face split 위치** — 현재 (B) 리타게터 레벨 split이 shotloom 방향과 일치 판단. 유저가 최종 확인 후 결정
- **ARP validation at view boundary** — body split 결정 후 진행. `SourceAnimBody::from_source_asset`에서 ARP marker 없으면 `Err(NotArpRig)` 반환 제안 있음
- **`BlendShape_g` Null 필터** — MetaHuman convention으로 이해됨. face scope에서 bones 드롭하면 자동 해결. split 결정 대기
- **bevy-vrm main push 여부** — 6 커밋 앞섬. 유저 명시 요청 시에만 push

---

## 참고 파일

- STL-78 이슈 본문: https://linear.app/cinamon-corp/issue/STL-78/shotloom-fbx-anim-importer
- 전날 devlog: `claude/temp-learnings/devlog-2026-04-15-stl78-fbx-importer-planning.md`
- 오늘 bevy-vrm 리뷰 개선 커밋들: `d5df021..ad990ff` on bevy-vrm main (6 커밋)
- 이 세션 이전 핸드오프 없음 (이 파일이 첫 STL-78 포팅 핸드오프)

#devlog #shotloom #stl-78 #handoff #fbx-importer
