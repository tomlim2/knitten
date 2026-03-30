# Log: shotloom VRM Import

| Time | Agent | Entry |
|------|-------|-------|
| 2026-03-30 | #1 | Ops initialized. Briefing, timeline, log created. |
| 2026-03-30 | #1 | shotloom + bevy-vrm explored. Phase 1-4 planned (9 tasks). |
| 2026-03-30 | #2 | T-000 complete. Briefing read, shotloom conventions documented (conventions.md), `feat/vrm-import` branch created. |
| 2026-03-30 | #2 | T-000b complete. MR/PR conventions added: CI 6 jobs, pre-commit hooks (fmt+clippy+mdlint), commit-msg validation, review process (P0→P3), 1 issue ≈ 1 PR. |
| 2026-03-30 | #2 | T-011 complete. vrm2u_bevy → shotloom/crates/vrm2u-bevy/ 복사. Cargo.toml workspace화 (name=vrm2u-bevy, edition 2021). let chains 7개소 2021 호환으로 수정 (3파일). .gitattributes에 assets/models/ LFS 패턴 추가. 테스트 모델 2개 복사 (shimaenaga_booth.vrm 781K, CuteMoth.vrm 1.7M). cargo check --workspace 통과. |
| 2026-03-30 | #3 | T-010 complete. vrm0_compat internalized into vrm2u_bevy/src/vrm/vrm0_compat/ module. VrmLoader auto-detects VRM 0.x and converts internally. main.rs manual conversion code removed. 180°Y pipeline verified: flip_root_nodes→normalize_vrm_bones_180y chain intact, no double-apply. cargo check --workspace passes. Branch: refactor/vrm0-compat-internalize |
| 2026-03-30 | #1 | VRM test models (8 files, 0.x+1.0) → megamelange vrm2u/assets/models/ 에 push. .gitignore 예외 추가. |
| 2026-03-30 | #2 | T-013 complete. vrm2u-bevy 정리: 11개 파일/디렉토리 삭제 (.cargo-ok, .cargo_vcs_info.json, .github/, .gitignore, AGENTS.md, CHANGELOG.md, CLAUDE.md, README.md, docs/, examples/, rustfmt.toml). LICENSE-MIT/APACHE2 저작권용 유지. 남은 구조: Cargo.toml + LICENSE x2 + src/. cargo check --workspace 통과. |
| 2026-03-30 | #3 | T-012 complete. shotloom-engine에 vrm2u-bevy 연결. ShotloomVrmPlugin + spawn_vrm() 헬퍼 추가. bevy features 확장 (bevy_gltf, bevy_mesh, bevy_shader, bevy_window). vrm2u-bevy clippy 15개 수정 (map_or→is_some_and, match→let..else, doc backticks). cargo check/clippy --workspace 통과. |
| 2026-03-30 | #1 | Phase 0 완료. feat/vrm-import 브랜치 push. MR 대기. shotloom VRM import 일단 접음. |
| 2026-03-30 | #3 | T-014 complete. StoryPreviz skeleton: UE MetaHuman (DHIbody: prefix), 84 bones (male=female identical). React+Three.js+FBX stack, T2M API→FBX pipeline. VRM↔MetaHuman bone mapping 40+개 작성. 주의: spine 5개↔VRM 2-4개, neck 2개↔1개, metacarpal/toe 차이. storypreviz-skeleton.md에 문서화. |
| 2026-03-30 | #2 | T-016 complete. MR 체크리스트: MAP.md에 vrm2u-bevy/vrm.rs/assets-models 추가. AGENTS.md에 vrm2u-bevy 크레이트+빌드커맨드+assets 추가. tech-debt/vrm2u-bevy-vendored.md 작성 (임시통합→gltf+engine 분리 예정). cargo fmt 자동수정 (vrm2u-bevy 전역), bevy_vrm1→vrm2u_bevy doctest 참조 수정, bevy_test_helper dev-dep 추가. CI 3종 통과 (fmt/clippy/test). |
| 2026-03-30 | #2 | MR 본문 작성 완료. mr-feat-vrm-import.md 저장 + 클립보드 복사. Summary/Changes/Checklist/Limitations 포함. Doc checklist 6항목 전부 답변. |
