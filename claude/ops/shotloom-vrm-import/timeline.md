# Timeline: shotloom VRM Import

1호기 dispatches. 2·3호기 execute. Update log.md on completion.

## Active
| ID | Task | Agent | Status | Depends |
|----|------|-------|--------|---------|
| T-000 | shotloom conventions + branch | #2 | done | — |
| T-010 | bevy-vrm vrm0_compat internalize | #3 | done | — |

## Phase 0: Quick Integration (approach A — prove first, refactor later)
| ID | Task | Agent | Status | Depends |
|----|------|-------|--------|---------|
| T-011 | vrm2u_bevy crate → shotloom workspace | #2 | done | T-000,T-010 |
| T-012 | shotloom-engine에서 vrm plugin 연결 + 모델 로드 | #3 | done | T-011 |
| T-013 | vrm2u-bevy 크레이트 불필요 파일 정리 | #2 | done | T-011 |
| T-016 | MR 체크리스트 완료 (MAP, AGENTS, tech-debt, CI) | #2 | done | T-013 |

## Retarget
| ID | Task | Agent | Status | Depends |
|----|------|-------|--------|---------|
| T-014 | StoryPreviz 애니메이션 스켈레톤 조사 | #3 | done | — |
| T-015 | VRM↔StoryPreviz bone mapping + retargeter | — | queued | T-014 |

## Phase 1: Foundation (deferred — refactor after prove)
| ID | Task | Agent | Status | Depends |
|----|------|-------|--------|---------|
| T-001 | VRM extension types (serde, no bevy) | #2 | queued | T-000 |
| T-002 | VRM 0→1 converter port | #3 | queued | T-010 |

## Phase 2: Loading
| ID | Task | Agent | Status | Depends |
|----|------|-------|--------|---------|
| T-003 | GLB parser + extension extractor | #2 | queued | T-001 |
| T-004 | 180°Y normalize + IBM recompute | #3 | queued | T-001 |

## Phase 3: Bevy Integration
| ID | Task | Agent | Status | Depends |
|----|------|-------|--------|---------|
| T-005 | VrmLoaderPlugin (shotloom-engine) | #2 | queued | T-003,T-004 |
| T-006 | Humanoid bone registry | #3 | queued | T-005 |

## Phase 4: Visual (stretch)
| ID | Task | Agent | Status | Depends |
|----|------|-------|--------|---------|
| T-007 | MToon material | — | queued | T-005 |
| T-008 | Spring bone physics | — | queued | T-005 |
| T-009 | Expressions | — | queued | T-005 |

*Updated: 2026-03-30*
