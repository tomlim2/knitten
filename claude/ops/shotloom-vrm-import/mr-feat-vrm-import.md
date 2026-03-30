## Summary

- Vendor `vrm2u-bevy` crate (from `bevy_vrm1`) to enable end-to-end VRM 0.x/1.0 and VRMA loading in Bevy, before investing in a full engine-agnostic port
- Integrate into `shotloom-engine` via `ShotloomVrmPlugin` + `spawn_vrm()` helper
- Add 6 VRM test models (Git LFS tracked) for future rendering validation

## Changes

### `crates/vrm2u-bevy/` (new — vendored)

Full VRM/VRMA loader vendored from `bevy_vrm1`:
- VRM 1.0 glTF extension parsing (vrmc_vrm, vrmc_spring_bone, vrmc_node_constraint)
- VRM 0.x → 1.0 compatibility layer (expressions, humanoid, materials, spring bone, meta)
- MToon toon shader (fragment/vertex WGSL, outline pass, rim lighting, shade, UV animation)
- Spring bone physics simulation (initialize, registry, update)
- Node constraints (aim, roll, rotation)
- Look-at system, expression blending, body tracking
- VRMA animation support (bone rotation/translation, expression tracks, animation graph)
- Removed upstream examples, docs, CI config; retained LICENSE-MIT/APACHE2

### `crates/shotloom-engine/`

- Add `ShotloomVrmPlugin` wrapping `VrmPlugin` in `src/vrm.rs`
- `spawn_vrm()` helper for asset-path-based VRM spawning
- Extended Bevy feature set: gltf, bevy_mesh, bevy_shader, bevy_window

### `assets/models/`

- 6 VRM test models with `source_gender_name` naming convention
- `.gitattributes` updated for LFS tracking

### Docs

- `MAP.md`: added vrm2u-bevy crate, engine vrm.rs, models directory
- `AGENTS.md`: added vrm2u-bevy build commands and crate responsibility
- `docs/tech-debt/vrm2u-bevy-vendored.md`: documents vendoring rationale and cleanup plan

## Checklist

- [x] `cargo check --workspace`
- [x] `cargo clippy --workspace -- -D warnings`
- [x] `cargo test --workspace`
- [x] `cargo fmt --check`
- [x] WASM build (`cargo build -p shotloom-web --target wasm32-unknown-unknown`)
- [x] MAP.md updated
- [x] AGENTS.md updated
- [ ] ADR — not needed (vendoring is documented as tech debt, not an architectural decision)
- [x] tech-debt/ — `vrm2u-bevy-vendored.md` added

### Doc checklist answers

| Question | Answer |
|----------|--------|
| Interface changed? | No — no contracts/ changes (internal Bevy plugin only) |
| Docs/code moved? | Yes → MAP.md updated |
| Root workflow changed? | Yes → AGENTS.md updated (build commands, crate table) |
| Major module added? | Yes → vrm2u-bevy has module-level doc comments; tech-debt doc serves as breadcrumb |
| New design decision? | No — vendoring is temporary, documented as tech debt not ADR |
| New structural debt? | Yes → `docs/tech-debt/vrm2u-bevy-vendored.md` with cleanup trigger and direction |

## Limitations

- 카메라/렌더링 환경 미구현으로 시각적 VRM 로드 테스트 불가
- cargo check + clippy + test 통과만 확인
- 실제 렌더링은 카메라/뷰포트 구현 후 가능
- WASM 빌드 통과 확인됨
