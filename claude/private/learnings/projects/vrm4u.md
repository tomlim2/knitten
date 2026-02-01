# VRM4U Learnings

## Convention

### 2026-02-01: ModelScale의 이중적 맥락

**ModelScale이란**: 임포트 시 모델 크기를 조절하는 스케일 팩터

**기본값과 포맷별 설정**:
| 포맷 | ModelScale | 이유 |
|------|------------|------|
| VRM | 1.0f (기본값) | Assimp가 미터 단위로 파싱 |
| PMX | 0.1f | 다른 단위 체계 |
| BVH | 0.01f | 다른 단위 체계 |

**일반적인 적용 위치** (이미 스케일된 데이터):
- `VrmConvertModel.cpp:1269` - SkeletalMesh 정점
- `VrmConvertMorphTarget.cpp:209` - 모프타겟 델타
- `VrmSkeleton.cpp:128-130` - 본 위치

**CinevVrmReferencePoints 특수 처리**:
```cpp
float ModelScale = VRMConverter::Options::Get().GetModelScale();  // 1.0f
if (ModelScale <= 1.0f)
{
    ModelScale = VrmCoordConvert::METERS_TO_CM;  // 100.0f
}
```

`MeshReturnedData`는 Assimp 원본 데이터(미터 단위)이며 ModelScale이 적용되지 않은 상태.
따라서 별도로 미터→센티미터 변환이 필요함.

**우려되는 점**:
1. `<= 1.0f` 조건은 PMX(0.1f), BVH(0.01f) 등 의도적으로 1.0 이하 스케일을 설정한 경우도 100.0f로 덮어씀
2. 현재 CinevVrmReferencePoints는 VRM 전용이라 문제없으나, 향후 PMX 지원 시 이 로직 수정 필요
3. 같은 변수명 `ModelScale`이 맥락에 따라 다른 의미로 사용됨 - 코드 리뷰 시 혼란 유발 가능
4. 호출자가 의도적으로 축소 스케일(< 1.0f)을 적용하려 해도 불가능

**권장 개선안** (PMX 지원 시):
```cpp
if (ModelScale == 1.0f)  // 정확한 기본값 체크
// 또는
if (bIsVRM && ModelScale <= 1.0f)  // 포맷 명시적 체크
```

### 2026-02-01: VRM 좌표계 변환 체계

**3가지 좌표 공간**:

| 공간 | 변수 접미사 | 축 방향 | 단위 | 사용처 |
|------|-------------|---------|------|--------|
| Assimp | `*Assimp` | X=오른쪽, Y=위, Z=뒤 | 미터 | meshInfo.Vertices, 원시 메시 데이터 |
| VrmYFwd | `*VrmYFwd` | X=오른쪽, Y=앞, Z=위 | 센티미터 | Pose_tpose 본 트랜스폼 |
| VrmYFwdScaled | `*VrmYFwdScaled` | VrmYFwd와 동일 | cm × ModelScale | InVrmAssetList 저장값 (CrownPosition 등) |

**주의**: VrmYFwd는 표준 Unreal 좌표계(X=앞)가 **아님**!

**VRM 버전별 차이**:
```
VRM 0.x (UniVRM 레거시):
  Assimp(X,Y,Z) → VrmYFwd(X, Z, Y)
  부호 반전 없음

VRM 1.0 (신규 표준):
  Assimp(X,Y,Z) → VrmYFwd(X, -Z, Y)
  Assimp.Z 부호 반전 필요 (모델이 반대 방향을 향함)
```

버전 감지: `VRMConverter::Options::Get().IsVRM10Model()`

**변환 파이프라인**:
```
기본 변환:
  [Assimp m] --ToVrmYFwd--> [VrmYFwd axes] --×100--> [VrmYFwd cm]
  [VrmYFwd cm] --÷100--> [VrmYFwd axes] --ToAssimp--> [Assimp m]

전체 파이프라인 (CinevVrmReferencePoints):
  [Assimp] --model_root_transform--> [Assimp+root] --ToVrmYFwd--> [VrmYFwd] --×ModelScale--> [VrmYFwdScaled]
```

**변환 함수** (`VrmCoordConvert` 네임스페이스):
- `AssimpToVrmYFwd()` / `VrmYFwdToAssimp()` - 축 스왑만, 단위 변환 없음
- `DirectionAssimpToVrmYFwd()` / `DirectionVrmYFwdToAssimp()` - 방향 벡터용, VRM 버전 인식
- `MetersToUnrealUnits()` / `UnrealUnitsToMeters()` - 단위 변환
- `BoneToAssimp()` / `AssimpToBone()` - 축 스왑 + 단위 변환 통합

**참조**: `CinevVrmReferencePoints.h:12-62`

---

## Worked

(성공한 접근법 기록)

---

## Failed

(실패한 접근법 기록)

---

## Gotcha

(비직관적인 이슈 기록)
