# CinevNPRCharacterManager - Technical Specification

## Metadata
- **Plugin**: CinevNPRCharacterManager
- **Version**: 1.0 (VersionName from .uplugin)
- **Type**: Editor Module
- **Date**: 2026-02-03
- **Author**: Deemo
- **Created By**: Deemo

---

## 1. Overview

The **CinevNPRCharacterManager** plugin is an Unreal Engine editor utility designed for anime/NPR character asset management and customization. It provides tools for creating character data assets from skeletal meshes, handling PMX/VRM bone mapping compatibility, managing character presets through a lookdev system, and offering editor integration features including actor selection locking and material management. The plugin enables a complete character customization workflow: modular character composition (head, hair, body), material management, save game preset generation, and real-time character preview via the ANPRCharacterLookDev actor.

## 2. Background

### Problem Statement
Managing anime-style character assets in Unreal Engine requires tedious manual configuration of data assets, materials, and bone mappings—especially when supporting PMX/VRM format compatibility.

### Motivation
- Automate data asset creation from skeletal meshes
- Support PMX/VRM bone mapping for anime character pipelines
- Enable modular character composition (head, hair, body, clothing)
- Provide editor tools for efficient character iteration and lookdev

## 3. Architecture

### 3.1 Core Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `FCinevNPRCharacterManagerModule` | CinevNPRCharacterManager.h | Plugin lifecycle, menu extensions |
| `NPRDataAssetHelper` | DataAsset/NPRDataAssetHelper.h | DataAsset creation and material sync |
| `NPRLevelEditorHelper` | LevelEditor/NPRLevelEditorHelper.h | Actor selection locking, viewport menus |
| `FNPRAssetTools` | Tools/NPRAssetTools.h | Material recompilation utilities |
| `NPRSaveGameTools` | Tools/NPRSaveGameTools.h | Preset file management |
| `ANPRCharacterLookDev` | Blueprints/NPRCharacterLookDev.h | Character preview actor |
| `UNPREditorUtilityWidget` | Blueprints/UNPREditorUtilityWidget.h | Blueprint-callable editor utilities |
| `NprPmxUtil` | Pmx/NprPmxUtil.h | PMX/VRM bone mapping |

### 3.2 Data Flow

```
Content Browser Selection (SkeletalMesh)
    ↓
Context Menu → "Create DataAsset"
    ↓
┌─────────────────────────────────────┐
│ NPRDataAssetHelper                  │
│   1. Validate material slots        │
│   2. Prompt for name/gender         │
│   3. Generate save file (.sav)      │
│   4. Create DataAsset via template  │
│   5. Update DataTable row           │
└─────────────────────────────────────┘
    ↓
DataAsset + Preset File Ready
    ↓
ANPRCharacterLookDev (Preview Actor)
    ↓
Modular Composition (Head, Hair, Body)
```

### 3.3 Dependencies

**Plugin Dependencies:**
- `EditorScriptingUtilities`

**Engine Modules:**
- `LevelEditor`, `EditorSubsystem`, `Materials`, `ToolMenus`, `AssetRegistry`, `Slate`

## 4. Implementation Details

### 4.1 Key Subsystems

#### PMX/VRM Bone Mapping
```cpp
// Maps UE4 bone names to PMX/VRM standards
static bool GetReplacedPMXBone(FString& Replaced, const FString& Base);
static void CreatePmxMappingTable(USkeletalMesh*, TMap<FString, FString>& OutMappingTable);
```
- 74-entry lookup tables: `TableUE4toVrm`, `TableUE4toPmx`
- 66 VRM humanoid bones with parent hierarchy
- Full Japanese PMX bone name support (e.g., "左腕" for left arm)

#### Actor Selection Locking
```cpp
static void LockActorSelection(AActor* Actor);    // Adds "CustomEditorActorLock" tag
static void UnlockActorSelection(AActor* Actor);  // Removes tag
static bool IsActorSelectionLocked(AActor* Actor);
```
- Hooks `USelection::SelectObjectEvent` to enforce locks
- Automatically deselects locked actors

#### Preset File Management
```cpp
static TArray<FString> GetPresetSaveFileNameList();
static bool CreateSaveFileForCinev(const FString& SavFileName);
static FString GenerateSaveFileName(const FString& DisplayName, bool bIsFemale);
```
- Directory: `/Project/CustomizePresets/`
- Format: `[CharacterName]_[F/M].sav`

### 4.2 Public API

#### UNPREditorUtilityWidget (Blueprint-Callable)
```cpp
// Asset Creation
static UDataAsset* CreateDataAssetFromSkeletalMesh();

// Preset Management
static TArray<FString> GetCharacterSavNameList();
static bool EditCharacterSavName(const FString& Old, const FString& New, const FString& DataAssetPath);
static bool DeleteCharacterSav(const FString& SavFileName);

// DataTable Operations
static bool DeleteDataTableRow(UDataTable* DataTable, FName RowName);

// Editor Utilities
static void FocusViewportOnSelectedActor(AActor* Actor);
static void CreateUNprPmxMeshInfoFromSkeletalMesh(USkeletalMesh* Mesh);
```

#### ANPRCharacterLookDev
```cpp
void UpdateSelectionOptions();
void RefreshConstructionScripts();
FString GenerateDataAssetBySelectedOptions();
TMap<int32, UMaterialInterface*> GetMaterialIndexesFromMaterialParts(...);
TMap<int32, UMaterialInterface*> GetCustomMaterialPartIndexesByCategories(...);
```

### 4.3 Data Structures

```cpp
// PMX bone mapping entry
USTRUCT(BlueprintType)
struct FPmxBoneTable {
    FString BoneKey;     // UE4 bone name
    FString BoneValue;   // PMX/VRM target name
};

// Character part data (base struct)
USTRUCT(BlueprintType)
struct FLookDevAnimeAssetData : public FTableRowBase {
    TSoftObjectPtr<USkeletalMesh> SkeletalMesh;
    TArray<TSoftObjectPtr<UMaterialInterface>> CustomMaterials;
};

// Head data (extends base)
struct FLookDevAnimeHeadData : public FLookDevAnimeAssetData {
    bool bIsFemale;
    TSoftObjectPtr<UMaterialInterface> OutlineMaterial;
};

// Body data
struct FLookDevAnimeBodyData : public FLookDevAnimeAssetData {
    TSoftObjectPtr<UTexture2D> OSTexture;
};

// Hair data
struct FLookDevAnimeHairData : public FLookDevAnimeAssetData {
    TSoftObjectPtr<UTexture2D> EyebrowColorTexture;
};
```

### 4.4 Configuration

**ANPRCharacterLookDev Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `LookDevAnimeDataTable` | UDataTable* | Full preset data table |
| `LookDevAnimeHeadDataTable` | UDataTable* | Head options |
| `LookDevAnimeHairDataTable` | UDataTable* | Hair options |
| `LookDevAnimeBodyDataTable` | UDataTable* | Body options |
| `bUseSemiCustomizeMode` | bool | Full preset vs. component selection |
| `bIsFemaleCharacter` | bool | Gender filter for options |
| `HeadCategories` | TArray<FString> | Material category filters |
| `HairCategories` | TArray<FString> | Material category filters |

## 5. File Structure

### Source Files

| File | Lines | Description |
|------|-------|-------------|
| `Public/CinevNPRCharacterManager.h` | - | Module declaration |
| `Public/Data/NprPmxData.h` | - | PMX bone table struct |
| `Public/Data/NprLookDevData.h` | - | LookDev data structs |
| `Public/Data/NprWidgetData.h` | - | Widget spec structs |
| `Public/Pmx/NprPmxMeta.h` | - | PMX metadata class |
| `Public/Pmx/NprPmxUtil.h` | - | PMX utility functions |
| `Public/Tools/NPRAssetTools.h` | - | Asset tool utilities |
| `Public/Tools/NPRSaveGameTools.h` | - | Save game management |
| `Public/LevelEditor/NPRLevelEditorHelper.h` | - | Level editor integration |
| `Public/DataAsset/NPRDataAssetHelper.h` | - | DataAsset creation |
| `Public/Blueprints/NPRCharacterLookDev.h` | - | LookDev actor |
| `Public/Blueprints/UNPREditorUtilityWidget.h` | - | Blueprint utilities |
| `Public/CustomStyle/NPRCharacterManagerStyle.h` | - | Slate styling |
| `Public/Utils/NPRSlate.h` | - | Menu builder utilities |
| `Public/DebugHeader.h` | - | Debug dialog utilities |

### Resource Files

| File | Description |
|------|-------------|
| `Resources/Icons/Icon_AT_001.png` | Content Browser submenu icon |
| `Resources/Icons/Icon_AT_002.png` | SkeletalMesh action icon |
| `Resources/Icons/Icon_Common_001.png` | Lock selection icon |
| `Resources/Icons/Icon_Common_002.png` | Unlock selection icon |
| `Resources/Icons/Icon_Recompile_Material.png` | Material recompile icon |

## 6. Editor Integration

### Context Menu Extensions

**Content Browser:**
- DataAsset → "Update Materials", "Cinev NPR Data Asset Actions"
- SkeletalMesh → "Validate Material Slots"
- Material/MaterialInstance → "Recompile Parent Material"

**Level Editor Viewport:**
- "Lock Actor Selection" - Prevents accidental selection
- "Unlock all actor Selection" - Clears all locks

### Asset Creation Workflow

1. Select SkeletalMesh → Right-click → "Validate Material Slots"
2. Right-click → "Cinev NPR Data Asset Actions"
3. Enter character name (FName dialog)
4. Select gender (Yes/No dialog)
5. Auto-generates: DataAsset, .sav preset file, DataTable row

## 7. Test Plan

### Manual Verification
1. Create DataAsset from SkeletalMesh → Verify all properties populated
2. Lock/unlock actor selection → Verify selection behavior
3. Create preset → Verify .sav file in `/CustomizePresets/`
4. Use ANPRCharacterLookDev → Verify modular composition works
5. Generate PMX mapping → Verify bone table accuracy

### Validation Checks
- Material slot validation reports specific indices with errors
- Preset file operations return success/failure booleans
- DataTable row operations validate before modification

## 8. Limitations & Future Work

### Known Limitations
- PMX bone mapping is static (no runtime remapping)
- Actor selection lock uses tag system (persists with level save)
- Preset files stored outside SaveGames folder (custom path)

### Planned Improvements
- Runtime bone remapping for animation retargeting
- Thumbnail generation for character presets
- Batch material assignment tools
- Integration with VRM4U for combined workflows

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **PMX** | Polygon Model Extended - MikuMikuDance model format |
| **VRM** | Virtual Reality Model - humanoid avatar format |
| **LookDev** | Look Development - real-time material/lighting preview |
| **NPR** | Non-Photorealistic Rendering - anime/toon style |

### B. References

- [VRM Specification](https://vrm.dev/en/)
- [PMX File Format](https://gist.github.com/felixjones/f8a06bd48f9da9a4539f)
- Unreal Engine Editor Scripting Documentation
