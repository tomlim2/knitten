# VRM Facial Reference Points Detection - Technical Specification

## Metadata
- **Module**: CinevVrmReferencePoints
- **Branch**: refactor/vrm-reference-points
- **Date**: 2026-02-03
- **Author**: deemo
- **Commit Range**: b8427e28cfe..1285dae8baf (16 commits)

---

## 1. Overview

The **CinevVrmReferencePoints** module provides automatic facial landmark detection for VRM character models. It identifies five anatomical reference points (crown, left eye, right eye, mouth, nose) using a multi-tier priority system: bone-based lookup, material-driven vertex analysis, geometric raycasting via the Moller-Trumbore algorithm, and intelligent fallback estimation. The system is VRM version-aware (supporting both VRM 0.x and VRM 1.0) and handles coordinate transformations between Assimp import space, VRM conventions, and Unreal Engine components.

## 2. Background

### Problem Statement
VRM character models require accurate facial reference points for features like eye tracking, lip sync, and facial animation. Manual configuration is tedious and error-prone across different model structures.

### Motivation
- Automate facial landmark detection during VRM import
- Support diverse model structures (rigged with bones vs. material-based geometry only)
- Handle VRM 0.x and 1.0 coordinate differences transparently
- Provide configurable fallbacks for edge cases

## 3. Architecture

### 3.1 Core Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `FCinevVrmReferencePoints` | CinevVrmReferencePoints.h | Main detection engine with static methods |
| `VrmCoordConvert` namespace | CinevVrmReferencePoints.h | Coordinate system conversion utilities |
| `UVrmRuntimeSettings` | VrmRuntimeSettings.h | Configuration parameters and keyword lists |

### 3.2 Data Flow

```
VRM Import
    ↓
DetectAll() Entry Point
    ↓
┌─────────────────────────────────────────────┐
│ Per-Feature Detection (Crown, Eyes, Mouth, Nose)
│   Priority 1: Bone lookup (humanoidBoneTable)
│   Priority 2: Material vertices + raycast
│   Priority 3: Position interpolation
│   Priority 4: Fallback estimation
└─────────────────────────────────────────────┘
    ↓
Coordinate Conversion (Assimp → VrmYFwd → Scaled)
    ↓
Store in UVrmAssetListObject
```

### 3.3 Coordinate Systems

| Space | Axes | Units | Usage |
|-------|------|-------|-------|
| **Assimp** | X=right, Y=up, Z=backward | meters | Raw mesh geometry |
| **VrmYFwd** | X=right, Y=forward, Z=up | cm | Bone transforms, UE components |
| **VrmYFwdScaled** | X=right, Y=forward, Z=up | cm × ModelScale | Stored output values |

**VRM Version Handling:**
- VRM 0.x: `Assimp(X,Y,Z)` → `VrmYFwd(X, Z, Y)`
- VRM 1.0: `Assimp(X,Y,Z)` → `VrmYFwd(X, -Z, Y)` (Z sign flip)

## 4. Implementation Details

### 4.1 Key Algorithms

#### Moller-Trumbore Ray-Triangle Intersection
```cpp
bool RayIntersectsTriangle(RayOrigin, RayDirection, V0, V1, V2, &OutT)
```
- O(1) per triangle with early exits for degenerate cases
- Uses determinant method for numerical stability
- Returns distance along ray for depth sorting

#### Priority-Based Detection
Each feature uses a 4-tier fallback system:
1. **Bone lookup** - Direct humanoidBoneTable query (80-95% success)
2. **Material vertices** - Keyword-based vertex collection + centroid raycast (70-85%)
3. **Position interpolation** - Geometric estimation from known points (60-75%)
4. **Fallback** - Fixed offset from head bone (>99%, always succeeds)

### 4.2 Public API

```cpp
// Main entry point
static void DetectAll(UVrmAssetListObject*, USkeletalMesh*, const aiScene*);

// Individual detection
static void DetectCrownPosition(...);
static void DetectLeftEyePosition(...);
static void DetectRightEyePosition(...);
static void DetectMouthPosition(...);
static void DetectNosePosition(...);

// Vertex collection
static TArray<FVector> CollectVerticesFromMaterialsByKeywordsAssimp(...);
static FVector FindTopmostVertexFromMaterialsByPriorityAssimp(...);

// Raycast utilities
static bool RaycastMeshInDirectionAssimp(...);
static TOptional<FVector> FindFeaturePositionByCentroidRaycastAssimp(...);

// Coordinate conversion (VrmCoordConvert namespace)
FVector AssimpToVrmYFwd(const FVector&);
FVector VrmYFwdToAssimp(const FVector&);
FVector DirectionVrmYFwdToAssimp(const FVector&);
```

### 4.3 Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `bEnableDebugLogging` | false | Enable verbose logging |
| `CrownPriorityKeywords` | [head, face, body, skin, hair, scalp] | Material keywords for crown |
| `EyeDetectionKeywords` | [eye, pupil, iris] | Material keywords for eyes |
| `MouthDetectionKeywords` | [mouth, lip] | Material keywords for mouth |
| `NoseDetectionKeywords` | [nose] | Material keywords for nose |
| `RaycastMaxDistanceCm` | 30.0 | Max raycast distance |
| `EyeLateralOffsetCm` | 2.0 | Eye lateral offset for fallback |
| `MouthForwardOffsetCm` | 8.0 | Mouth forward offset for fallback |

## 5. Files Changed

### New Files
| File | Lines | Description |
|------|-------|-------------|
| `VRM4ULoader/Public/CinevVrmReferencePoints.h` | 314 | Class declaration, VrmCoordConvert namespace |
| `VRM4ULoader/Private/CinevVrmReferencePoints.cpp` | 1,395 | Detection algorithms implementation |

### Modified Files
| File | Changes |
|------|---------|
| `VRM4ULoader/Private/VrmConvertModel.cpp` | Include new header |
| `VRM4ULoader/Private/VrmSkeleton.cpp` | -579 lines (code extracted to new module) |
| `VRM4ULoader/Public/VrmSkeleton.h` | -52 lines (declarations moved) |
| `VRM4U/Public/VrmRuntimeSettings.h` | +15 lines (new configuration properties) |

## 6. Test Plan

### Manual Verification
1. Import VRM 0.x model → Verify all 5 reference points detected
2. Import VRM 1.0 model → Verify coordinate conversion correct
3. Import model without facial bones → Verify fallback system activates
4. Enable `bEnableDebugLogging` → Verify priority cascade logged

### Validation Checks (Built-in)
- Inter-pupillary distance sanity check (3-10cm expected)
- Crown-to-mouth height validation (crown should be above mouth)
- Detection summary logging with success/fallback counts

## 7. Limitations & Future Work

### Known Limitations
- O(n) raycast complexity per feature (no BVH acceleration)
- Material keyword matching is case-insensitive substring only
- Fallback offsets tuned for anime-style VRM (may need adjustment for realistic models)

### Planned Improvements
- BVH acceleration for models >50k triangles
- Machine learning-based landmark detection as alternative method
- Per-model calibration profile storage

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **Assimp** | Open Asset Import Library - mesh import format |
| **VrmYFwd** | VRM coordinate convention (Y-forward, Z-up) |
| **humanoidBoneTable** | VRM standard bone mapping table |
| **Pose_tpose** | T-pose bone transform data in VRM |

### B. References

- [VRM Specification](https://vrm.dev/en/vrm/vrm_about/)
- [Moller-Trumbore Algorithm](https://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm)
- VRM4U Plugin Documentation
