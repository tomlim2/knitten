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

### 2026-02-02: VRM 파일 vs VRM4U ModelScale

**핵심**: VRM 파일 자체에는 "ModelScale" 개념이 **없다**.

**VRM/glTF 스펙**:
- glTF 2.0: 모든 선형 거리 단위는 **미터(meters)**
- VRM: 1.00 = 1미터 (glTF 상속), Y-up, -Z forward
- 파일 내 스케일 정보 없음 - 항상 미터 단위로 저장

**데이터 흐름**:
```
┌─────────────────────────────────────────────────────────┐
│ .vrm 파일 (glTF + VRM extensions)                       │
│ - 정점/본 좌표: 미터 단위                                │
│ - 스케일 정보: 없음 (항상 1.0 = 1m)                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Assimp 파싱                                             │
│ - aiScene 구조로 변환                                    │
│ - 좌표 그대로 미터 유지                                  │
│ - 결과: FReturnedData.meshInfo[].Vertices (미터)        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ VRM4U Import UI                                         │
│ - ModelScale: 기본값 1.0f (사용자 설정 가능)            │
│ - 저장: FImportOptionData.ModelScale                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ VrmConvertModel.cpp 변환                                │
│                                                         │
│   vertices * 100.f      ← 미터→센티미터 (하드코딩)      │
│   vertices *= ModelScale ← 사용자 스케일 적용           │
│                                                         │
│ 예시 (키 1.7m 캐릭터):                                  │
│   ModelScale=1.0: 1.7m → 170cm (×100) → 170cm (×1.0)   │
│   ModelScale=2.0: 1.7m → 170cm (×100) → 340cm (×2.0)   │
└─────────────────────────────────────────────────────────┘
```

**ModelScale의 정체**:
| 출처 | 스케일 개념 | 목적 |
|------|-------------|------|
| VRM/glTF 스펙 | 없음 (항상 미터) | 표준화된 단위 |
| VRM4U 플러그인 | `ModelScale` (기본 1.0) | Unreal 환경 맞춤 + 사용자 커스텀 |

**최종 Unreal 좌표** = (VRM 미터) × 100 × ModelScale = 센티미터 × 사용자스케일

**참조**:
- [glTF 2.0 Specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
- [VRM Specification](https://github.com/vrm-c/vrm-specification/blob/master/specification/0.0/README.md)

---

## Worked

### GLB 재구성 방식의 extensionUsed 오타 수정
- **Date**: 2026-02-06
- **Context**: 구버전 UniGLTF/UniVRM이 export한 VRM 파일의 `"extensionUsed"` 오타를 Assimp 파싱 전에 수정
- **Solution**: FString 기반 검색/치환 + 전체 GLB 재구성 (헤더 재작성, JSON 청크 패딩, 바이너리 청크 복사)
- **Why it worked**: GLB 포맷의 모든 정합성(청크 길이, 4바이트 정렬, 전체 길이)을 보장하기 때문. `CinevGlbSanitizer`로 분리하여 3개 호출부 코드 단순화.

---

## Failed

### GLB JSON 청크 in-place 바이트 교체
- **Date**: 2026-02-06
- **What we tried**: `"extensionUsed"` (15 bytes) → `"_xtensionUsed"` (15 bytes) 동일 길이 in-place 교체. GLB 재구성 없이 JSON 청크 내 바이트만 교체하여 성능 최적화 시도.
- **Why it failed**: 바이트 교체 후에도 Assimp이 파일 임포트에 실패. 정확한 원인 불명이나, Assimp 내부에서 GLB를 파싱할 때 단순 바이트 교체만으로는 충분하지 않은 것으로 추정. 원래의 GLB 재구성 방식으로 복원하면 즉시 해결됨.
- **Better approach**: FString 검색/치환 + 전체 GLB 재구성. 바이너리 포맷 조작은 통합 테스트 없이 최적화하지 말 것.

---

## Gotcha

### 2026-02-04: UniGLTF-2.35.0 "extensionUsed" 오타 버그

**증상**: VRM 파일 임포트 시 "read failure" 오류 발생. Blender로 import/export하면 정상 작동.

**원인**: UniGLTF-2.35.0이 GLB JSON에 잘못된 필드명 추가
```json
// 버그 있는 VRM (UniGLTF-2.35.0)
{
  "extensionsUsed": ["VRM", "KHR_materials_unlit", ...],  // 정상
  "extensionUsed": ["VRM", "KHR_materials_unlit", ...],   // 오타! (s 누락)
  ...
}
```

**왜 문제인가**:
- Assimp glTF 파서가 중복된 잘못된 키로 인해 파싱 실패
- Blender re-export 시 오타 필드가 제거되어 정상 작동

**해결책**: VRM4U LoaderBPFunctionLibrary.cpp에 GLB 전처리 함수 추가
```cpp
bool FixGlbJsonTypo(const uint8* pData, size_t dataSize, TArray<uint8>& OutFixedData)
{
    // GLB 헤더 검증 후 JSON 청크 추출
    // "extensionUsed" -> "extensionsUsed_fixed" 로 변경
    // GLB 재구성하여 반환
}
```

적용 위치:
- `LoadVRMFileFromMemory()` - 동기 로딩
- `GetVRMMeta()` - 메타데이터 조회
- `VrmAsyncLoadAction` - 비동기 로딩

**영향받는 버전**: UniGLTF-2.35.0 / UniVRM-0.99.0으로 export된 VRM 파일

**업계 대응 현황** (2026-02-06 조사):
- 모든 주요 glTF 임포터(Assimp, three.js, Babylon.js, Blender, Godot)는 `"extensionsUsed"` **정확한 문자열 매칭**으로 검색 → 오타 키는 무시됨
- Assimp: `FindArray(doc, "extensionsUsed")` → null이면 extensions 미감지 (silent failure)
- glTF 스펙: root schema에 `additionalProperties: false`가 없어서 unknown key는 스키마 위반이 아님
- **업계 표준 GLB JSON sanitizer 패턴은 존재하지 않음** — `CinevGlbSanitizer`는 프로젝트 고유 솔루션
- vrm-c/UniVRM 리포에 해당 오타 버그의 공개 이슈 없음 (조용히 수정된 것으로 추정)

**왜 Assimp 내부 수정이 아닌 전처리 방식인가**:
VRM4U는 Assimp을 **프리빌트 DLL**(`assimp-vc141-mt.dll`)로 링크. 소스 코드 없이 헤더 + 바이너리만 포함(`ThirdParty/assimp/`). 따라서 glTF 파서 내부(`glTF2Asset.inl`의 `ReadExtensionsUsed` 등)를 수정할 수 없음. Assimp 소스를 직접 빌드하는 대안은:
- 커스텀 빌드 유지 부담
- VRM4U 업스트림 업데이트 시 충돌 위험
- 플랫폼별(Win/Mac/iOS/Android) 바이너리 재빌드 필요

→ **Assimp 앞단에서 GLB 데이터를 정제하는 전처리 방식이 가장 현실적**

**현재 구현**: `CinevGlbSanitizer` (별도 파일로 분리)
- `CinevGlbSanitizer.h` / `CinevGlbSanitizer.cpp`
- 3개 호출부에서 `CinevGlbSanitizer::SanitizeGlbData()` 사용

**참조**:
- [CinevGlbSanitizer.cpp](Plugins/VRM4U/Source/VRM4ULoader/Private/CinevGlbSanitizer.cpp)
- [Assimp glTF2Asset.inl](https://codebrowser.dev/qt6/qtquick3d/src/3rdparty/assimp/src/code/AssetLib/glTF2/glTF2Asset.inl.html)
- [glTF Issue #695 - Handling unsupported extensions](https://github.com/KhronosGroup/glTF/issues/695)
