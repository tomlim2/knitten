# Headless CLI RQ Results — R-009

## RQ Summary Table

| # | VRM | FBX | bones | scale | shoulder | arm | identity | notes |
|---|-----|-----|-------|-------|----------|-----|----------|-------|
| 1 | xiao_vroid (1.0) | t2m_m_walk | 53 | 1.018 | 0.58 | 0.83 | PASS 52/52 | baseline male |
| 2 | xiao_vroid (1.0) | t2m_m_wave | 53 | 1.016 | 0.56 | 0.83 | PASS 52/52 | arm motion |
| 3 | xiao_vroid (1.0) | t2m_f_walk | 53 | 1.016 | 0.67 | 0.94 | PASS 52/52 | female walk |
| 4 | xiao_vroid (1.0) | rush (baseline) | 53 | 1.017 | 0.68 | 0.94 | PASS 52/52 | CINEV baseline |
| 5 | shimaenaga (0.x) | t2m_m_walk | 53→20 | 0.111 | 0.07 | 0.13 | PASS 52/52 | VRM 0.x — tiny model |
| 6 | CuteMoth (0.x) | t2m_f_walk | — | — | — | — | — | ERROR: missing VRMC_vrm (pure 0.x) |
| 7 | zepeto_m_001 (1.0) | t2m_m_wave | 53 | 0.363 | 0.44 | 0.31 | PASS 52/52 | small Zepeto avatar |
| 8 | xiao_vroid (1.0) | flutter (facial) | 1 | — | — | — | — | ABORT: stack overflow in fbxcel parse (6.1MB FBX) |

## Comparison with Bevy Viewer RQ

Bevy viewer reports for xiao + rush: `scale=1.017, shoulder=0.68, arm=0.94`

| Metric | Bevy Viewer | Headless CLI (#4) | Match? |
|--------|-------------|-------------------|--------|
| scale | 1.017 | 1.017 | YES |
| shoulder | 0.68 | 0.68 | YES |
| arm | 0.94 | 0.94 | YES |
| identity | — | PASS 52/52 | — |

**Headless CLI produces identical RQ to Bevy viewer for the baseline combo.**

## Observations

### Male vs Female FBX (same VRM: xiao)
- Male FBX: shoulder=0.56-0.58, arm=0.83 — VRM is significantly narrower/shorter than male MetaHuman
- Female FBX: shoulder=0.67-0.68, arm=0.94 — much closer to VRM proportions
- Scale ratio consistent (~1.016-1.018) — VRM is slightly taller than all MetaHuman skeletons

### VRM 0.x Issues
- **shimaenaga** (#5): Loads but has wrong scale (0.111) and only 20 retargeted bones. The model was not pre-converted from 0.x→1.0, so VRMC_vrm extension exists but the GLB data (node positions) is still in 0.x coordinate space. hips_height=0.104 is ~10cm — the model is 10x smaller than expected.
- **CuteMoth** (#6): Pure VRM 0.x — no VRMC_vrm extension at all. Expected failure.
- **Conclusion:** VRM 0.x files need vrm0_compat conversion before headless CLI. This matches the briefing ("VRM 0.x files must be converted to 1.0 first").

### Zepeto (#7)
- Very small avatar (hips_height=0.341, ~34cm). scale=0.363, shoulder=0.44, arm=0.31.
- Identity test still passes — retarget produces valid output even for non-realistic proportions.

### Facial-only FBX (#8)
- 1 bone track (root only), 0 matched direct bones — facial FBX has no body animation.
- Stack overflow on `compute_fbx_skeleton` — fbxcel crate deep recursion on 6.1MB FBX.
- Not a headless CLI issue — same overflow occurs in debug builds without opt-level workaround.

## Key Findings

1. **Headless CLI matches Bevy viewer** — RQ values are identical for the baseline combo.
2. **All identity tests pass** — no rest-pose mismatch detected in any 1.0 VRM.
3. **Male MetaHuman is proportionally wider/longer** than xiao VRM (shoulder 0.58 vs 0.68, arm 0.83 vs 0.94).
4. **VRM 0.x needs pre-conversion** — headless CLI only supports VRM 1.0 (as documented).
5. **Facial FBX crashes fbxcel** — known stack overflow issue, not related to headless CLI.
