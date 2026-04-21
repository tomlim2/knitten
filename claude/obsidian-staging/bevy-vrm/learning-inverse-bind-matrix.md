---
title: "Inverse Bind Matrix (IBM): skinned mesh의 본-정점 변환 핵심"
tags: [bevy-vrm, skinning, ibm, skeleton-remap]
created: 2026-04-08
---

# Inverse Bind Matrix (IBM)

## 개념

IBM = 각 bone의 bind pose world transform의 역행렬.

```
B = bone의 bind pose world transform
IBM = B⁻¹
```

Skinned mesh에서 정점의 최종 위치를 계산할 때 사용:

```
final_vertex = Σ (weight_i × (bone_world_i × IBM_i) × vertex_position)
```

- `bone_world × IBM` = bind pose 대비 현재 bone이 얼마나 변했는지 (delta)
- Bind pose에서는 `bone_world × IBM = I` → 정점 변형 없음
- 런타임에 bone이 움직이면 이 delta가 정점을 변형시킴

## glTF/VRM에서의 위치

`skin.inverseBindMatrices` accessor에 bone 개수만큼 4×4 float32 행렬로 저장.

## Skeleton remap에서 IBM 재계산이 필요한 이유

Skeleton remap은 bone의 rest pose를 변경함 (VRM rest → FBX rest). Rest가 바뀌면 bind pose world transform `B`가 바뀌므로 `IBM = B⁻¹`도 재계산해야 함. 안 하면 mesh가 찌그러짐.

```
new_rest → new_bind_world → new_IBM = new_bind_world⁻¹
```

`vrmsl/convert.rs`에서 rest 수정 후 IBM 재계산 수행.

## JS 비유 (three.js)

Three.js `SkinnedMesh`에서:

```js
skeleton.bones[i].matrixWorld  // = bone_world
skeleton.boneInverses[i]       // = IBM
// GPU shader에서: bone_world × IBM × vertex
```
