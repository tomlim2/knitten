# Briefing: T-010 bevy-vrm vrm0_compat internalize

## Current Flow (problem)
```
main.rs: detect_vrm_version() → vrm0_compat::convert() → save .v1.vrm → VrmHandle
VrmLoader: assumes 1.0 → normalize_vrm_bones_180y() → GltfLoader
```
Caller must manually detect+convert. Plugin alone breaks on 0.x.

## Target Flow
```
VrmLoader: detect version → 0.x? internal convert() → normalize_180y → GltfLoader
main.rs: just pass path to VrmHandle. Done.
```

## Code Locations
| File | Role |
|------|------|
| crates/vrm0_compat/src/lib.rs | convert() entry |
| crates/vrm0_compat/src/{humanoid,meta,materials,expressions,spring_bone,glb}.rs | Sub-converters |
| crates/vrm2u_bevy/src/vrm/loader.rs | VrmLoader (merge target) |
| src/main.rs | Manual convert calls (remove target) |

## Steps
1. Move vrm0_compat src → vrm2u_bevy/src/vrm/vrm0_compat/ module
2. VrmLoader::load(): detect version → convert if 0.x → existing normalize
3. Remove manual convert from main.rs
4. Handle/remove vrm0_compat crate

## Watch Out
- vrm0_compat flip_root_nodes() + normalize_vrm_bones_180y() = double 180°Y? Verify.
- vrm0_compat deps (serde, serde_json, thiserror) already in vrm2u_bevy.
- Keep "loader와 retarget 서로 의존 안 함" principle.
