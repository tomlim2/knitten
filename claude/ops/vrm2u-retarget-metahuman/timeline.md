# Timeline: vrm2u retarget MetaHuman

1호기 dispatches. 2·3호기 execute.

## Active
| ID | Task | Agent | Status | Depends |
|----|------|-------|--------|---------|
| R-001 | 테스트 에셋 정리 (FBX→megamelange) | #1 sub | done | — |
| R-002 | 남성 retarget config 작성 | #1 sub | done | — |
| R-003 | cargo test 테스트 케이스 추가 (cinev_retarget) | #3 | done | R-001 |
| R-004 | T2M API에서 male FBX 생성 | #3 | done | — |
| R-005 | male retarget 실행 + RQ diagnostics | #2 | done (partial) | R-002,R-004 |
| R-006 | T2M FBX retarget 품질 검증 + known issues 재현 | #3 | done | R-004 |
| R-007 | bevy-vrm clippy/fmt 정리 | #2 | done | — |
| R-008 | headless retarget CLI (Bevy-free VRM rest pose) | #3 | done | R-003 |
| R-009 | headless CLI 전체 조합 테스트 (8 combos) | #3 | done | R-008 |
| R-010 | headless CLI vrm0_compat + 버전 표시 | #3 | done | R-008 |
| R-011 | fbxcel stack overflow 수정 + 분석 | #2 | done | — |
| R-012 | T2M vs CINEV FBX 스펙 비교 분석 | #3 | done | R-004 |

| R-012 | T2M vs CINEV FBX 스펙 비교 분석 | #3 | done | R-004 |
| R-013 | shoulder slerp T2M 대응 실험 (5 variants) | #3 | done | R-012 |
| R-014 | headless CLI 품질 경고 시스템 | #2 | done | R-008 |
| R-015 | 본 매핑 정합성 검증 | #3 | done | R-012 |
| R-016 | rest pose 충실도 검증 (fidelity metric) | #3 | done | R-013,R-015 |

| R-017 | Blender-specific retarget config (FbxSourceType + slerp factor + detection) | #2 | done | R-012,R-013 |
| R-018 | 전신 rest pose audit + validator 보강 (lowerArm 등 누락 수정) | #2 | done | R-017 |
| R-019 | 보행 관련 본 rest_pose_offsets 추가 (lowerArm/lowerLeg/foot/spine/neck/head) | #2 | done | R-018 |
| R-020 | lowerArm rest pose 검증 — VRM 0.x + 1.0 identity test + formula trace | #2 | done | R-019 |
| R-021 | T2M FBX arm/hand keyframe analysis (arm weakness investigation) | #2 | done | R-020 |
| R-022 | rest_pose_preserve — partial A-pose retention for lowerArm | #2 | done | R-021 |
| R-023 | Hand world position real-time debugger (F5 panel + stdout) | #2 | done | R-022 |
| R-024 | detect_apose VRM 1.0 gate (reverted — wrong diagnosis) | #2→#1 | done | R-023 |
| R-025 | detect_apose arm correction direction fix | #1 | blocked | R-024 |
| R-026 | A-pose correction direction — 10+ hypotheses | #1 | blocked | R-025 |

R-026 blocked: rotation-only correction의 근본 한계 확인.
- **확정된 사실:** three-vrm FK 수식 정확 (identity PASS 52/52), 좌표계 일치 (VRM1.0/FBX 모두 Y-up +Z-forward), bone_positions는 이미 Y-up 변환 완료
- **arcing error:** rotation correction(78°)이 spine X-tilt(23°)과 FK chain에서 결합 → L×sin(78°)×sin(23°)≈7.5cm/segment Z offset
- **translation 보정 불가:** skinned mesh에서 bone position 이동 → mesh 분리
- **다음 후보:** (1) two-bone IK post-correction (2) detect_apose 자체를 다른 원리로 재설계 (3) ~5cm Z error 허용

*Updated: 2026-03-31*
