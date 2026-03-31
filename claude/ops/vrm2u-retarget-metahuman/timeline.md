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

*Updated: 2026-03-31*
