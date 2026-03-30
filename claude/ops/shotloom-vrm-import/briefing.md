# Briefing: shotloom VRM Import

Read before any task. Reference only — do not modify.

## Repos
| Repo | Path | Branch | Role |
|------|------|--------|------|
| shotloom | ~/Desktop/www/shotloom | feat/vrm-import | Work target |
| bevy-vrm | ~/Desktop/www/bevy-vrm | refactor/vrm0-compat-internalize (#3) | Reference + refactor |

## shotloom — Target Crates
- `shotloom-gltf` — VRM parsing. NO bevy dep. Serde types + parser.
- `shotloom-engine` — Bevy integration. Consumes gltf output.
- Conventions: see `conventions.md`

## bevy-vrm — Reference Code
| What | Path |
|------|------|
| VRM 0→1 convert | `crates/vrm0_compat/src/` |
| glTF extensions | `crates/vrm2u_bevy/src/vrm/gltf/extensions/` |
| 180°Y normalize + IBM | `crates/vrm2u_bevy/src/vrm/loader.rs` |
| Humanoid bones | `crates/vrm2u_bevy/src/vrm/humanoid_bone/` |
| Spring bone | `crates/vrm2u_bevy/src/vrm/spring_bone.rs` |
| MToon material | `crates/vrm2u_bevy/src/vrm/mtoon/` |
| Expressions | `crates/vrm2u_bevy/src/vrm/expressions.rs` |

## Design Constraint
- shotloom-gltf: no bevy, pure data. serde::Deserialize.
- shotloom-engine: Bevy components from parsed data.
- Asset parsing = untrusted input. No unwrap(). Propagate errors.

## Build
```
cd ~/Desktop/www/shotloom
cargo check -p shotloom-gltf
cargo test -p shotloom-gltf
cargo clippy --workspace
```
