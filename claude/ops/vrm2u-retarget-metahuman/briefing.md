# Briefing: VRM↔MetaHuman Retargeter

## Repos
| Repo | Path | Branch | Role |
|------|------|--------|------|
| bevy-vrm | ~/Desktop/www/bevy-vrm | feat/metahuman-retarget | Work target |
| StoryPreviz | ~/Desktop/www/StoryPreviz | — | Reference (T2M pipeline, FBX samples) |

## Goal
bevy-vrm의 cinev_retarget 크레이트에 MetaHuman(DHIbody)↔VRM bone mapping + retarget 기능 추가.
T2M API가 출력하는 FBX(MetaHuman skeleton) 애니메이션을 VRM 캐릭터에 적용할 수 있게.

## Existing Code
| What | Path in bevy-vrm |
|------|-----------------|
| cinev_retarget | crates/cinev_retarget/ |
| VRM humanoid bones | crates/vrm2u_bevy/src/vrm/humanoid_bone/ |
| VRM loader | crates/vrm2u_bevy/src/vrm/loader.rs |

## Source Skeleton: MetaHuman DHIbody
- 84 bones, `DHIbody:` prefix
- UE5 MetaHuman body standard
- Full analysis: `../shotloom-vrm-import/storypreviz-skeleton.md`

## Target Skeleton: VRM 1.0 Humanoid
- ~55 bones (22 required + optional fingers/toes)
- No prefix, camelCase naming

## Key Mismatches
| Issue | MetaHuman | VRM | Strategy |
|-------|-----------|-----|----------|
| Spine count | 5 (01-05) | 2-4 (spine,chest,upperChest) | Distribute or skip 02,04 |
| Neck count | 2 (01,02) | 1 (neck) | Sum or use 01 only |
| Root bone | root→pelvis | hips (=root) | Map root translation→hips |
| Metacarpals | index/mid/ring/pinky_metacarpal | None | Skip |
| Toes | 5×2 phalanges | leftToes/rightToes only | Ignore individual |
| Coordinate | FBX Z-up | VRM Y-up (glTF) | Standard conversion |
| Prefix | DHIbody: | None | Strip on match |

## Build
```
cd ~/Desktop/www/bevy-vrm
cargo check -p cinev_retarget
cargo test -p cinev_retarget
```
