---
title: "VRMC_springBone_extended_collider"
tags:
  - type/topic
  - project/shotloom
  - area/vrm
date: 2026-05-11
source: claude-code
---

# VRMC_springBone_extended_collider

> [!info] VRM 1.x 공식 확장. spec: [vrm-c/vrm-specification](https://github.com/vrm-c/vrm-specification/tree/master/specifications/VRMC_springBone_extended_collider-1.0)

## Problem

기본 `VRMC_springBone-1.0` collider는 두 가지뿐 — **sphere** (공)와 **capsule** (캡슐). 이걸로 표현 안 되는 케이스가 있다:

- **무한 평면** 충돌: 바닥에 옷자락이 끌리는데 안 뚫고 들어가게. sphere/capsule로 흉내 내려면 거대한 구를 발 밑에 둬야 함.
- **안쪽에 가두는** 충돌: 소매 안의 손목, 컵 안의 액체 같은 시뮬레이션. sphere/capsule은 바깥에 머물게 강제할 뿐 안쪽에 가두는 의미는 없음.

## Mechanism

확장은 collider entry에 `extensions.VRMC_springBone_extended_collider` 블록을 얹는다. 그 안의 `shape` 는 3 variant 중 하나:

| Shape | 필드 | 의미 |
|---|---|---|
| `sphere` (inside variant) | `offset: vec3`, `radius: f32`, `inside: bool` | `inside=true` 면 구 **안쪽**에 가둠 |
| `capsule` (inside variant) | `offset: vec3`, `tail: vec3`, `radius: f32`, `inside: bool` | `inside=true` 면 캡슐 **안쪽**에 가둠 |
| `plane` | `offset: vec3`, `normal: vec3` | 무한 평면. `normal` 방향이 "위" |

모든 vec3 필드는 collider가 anchor된 node의 **local frame**에 있다 — 본 PR이 이 사실 위에 서 있음.

## Why it works

기본 schema와 같은 `collider.node` 참조를 그대로 쓴다. 즉:

- parity gate 동일: 그 노드가 180Y stack에서 odd면 회전 필요.
- 회전 helper 동일: `[x, y, z] → [-x, y, -z]`.
- semantic 동일: `offset`/`tail`은 위치, `normal`은 방향 — 180Y about origin 하에선 둘 다 같은 변환.

확장이 새 좌표계를 도입하는 게 아니라 **기존 좌표계 위에 새 shape 변종을 얹은 것**이라 normalize 코드는 자연 확장된다.

## Caveats

> [!warning] `plane.normal` default가 180Y-invariant 아님

spec default `[0, 0, -1]`. 180Y 회전 시 `[0, 0, 1]` → 반대 방향. 다른 spring-bone default 들 (`[0, 0, 0]` offsets, `[0, -1, 0]` gravity)은 Y축 회전에 invariant라 presence-only 검사로 충분하지만, `plane.normal` 만 **omitted 상태에서도 명시적으로 rotated default를 materialize 해야** 시뮬레이터가 unrotated default를 silently 쓰는 사고를 피함.

> [!abstract] Rule
> Omitted spec default가 180Y-invariant인지 확인하지 않고 presence-only check만 쓰면, backward-facing rig + 그 필드를 생략한 asset 조합에서 silent off-axis bug가 난다. default 값을 회전 변환에 직접 대입해보고 invariant 여부를 결정하라.

#rule

## See also

- 기본 schema: `VRMC_springBone-1.0` collider sphere/capsule, joint `gravityDir`
- 적용 함수: `shotloom_gltf::normalize_spring_bone_180y` (`crates/shotloom-gltf/src/vrm_normalization.rs`)
- 본 작업의 plan: [[../../../docs/plans/gltf-normalize-extended-collider]] (caol-ila 경로 — vault 외부)
- 관련 PR: [STL-227 fix(gltf): normalize VRMC_springBone_extended_collider vectors for backward VRMs](https://github.com/CINEV/shotloom)
