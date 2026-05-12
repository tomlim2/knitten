---
status: open
created: 2026-05-12
load: triggered
trigger: working STL-365 — placeholder checker sampler (Repeat + Nearest)
repo: shotloom
linear: STL-365
---

# Placeholder material checker sampler (Repeat + Nearest)

## Intent

`crates/shotloom-engine/src/materials/placeholder.rs` 의 `PlaceholderMaterial`
은 ADR-0031 Decision #4 가 박은 fallback preset 으로, 현재 Bevy 기본
sampler (default `address_mode = ClampToEdge`, default filter = `Linear`)
를 사용한다. 큰 ground / backdrop mesh 에 placeholder 가 붙으면 checker
texture 가 mesh UV 0..1 안에서 한 번만 깔리며 mip / linear 필터링 때문에
흐릿한 색면처럼 보여 "material not assigned" 의도가 시각적으로 약해진다.

본 작업은 placeholder 의 checker texture 를 명시적인 `Repeat + Nearest`
sampler 로 로드해 (a) mesh UV 가 0..1 너머로 가는 경우 타일링되고
(b) 어느 zoom level 에서도 검은/흰 칸이 픽셀 단위 crisp 하게 유지되도록
보정한다. shared `Handle<StandardMaterial>` 패턴, `base_color_texture` /
`double_sided` / `cull_mode: None` invariant, ADR-0031 Decision #4 의
preset 형태는 모두 유지된다. ADR-0031 자체는 Proposed status 라 in-place
편집 (`H10` 허용). Mesh-side UV scale / world-bound 기반 자동 타일링은
본 작업 범위가 아니다 (Linear AC 에도 명시 안 됨).

## Decisions (locked)

1. **Sampler 설정 위치: code path (asset loader settings), `.meta` sidecar
   아님.** `init_placeholder_material` 안에서
   `asset_server.load_with_settings::<Image, ImageLoaderSettings>(...)` 로
   로드. settings closure 안에서
   `settings.sampler = ImageSampler::Descriptor(ImageSamplerDescriptor {
   address_mode_u: ImageAddressMode::Repeat,
   address_mode_v: ImageAddressMode::Repeat,
   mag_filter: ImageFilterMode::Nearest,
   min_filter: ImageFilterMode::Nearest,
   mipmap_filter: ImageFilterMode::Nearest,
   ..default() })` 지정.
   *Rationale:* invariant 가 코드 한 곳에 모임. 새 placeholder 추가 시
   sidecar 누락 위험 없음. ADR-0031 Decision #4 의 "engine constructs one
   shared handle at startup" 패턴과 동일 위치.
   *Rejected:* `assets/default/checker.png.meta` sidecar — 동치이지만
   파일이 위치 따로 가게 되고, 다른 placeholder asset 이 추가될 때마다
   sidecar 가 따라야 하는 약한 결합이 생김.

2. **Filter mode: `Nearest` (mag / min / mipmap 셋 다).** checker pattern
   의 의도는 픽셀 단위 격자 인지 — `Linear` 는 흐려지고 mipmap 이 켜지면
   먼 거리에서 회색면이 됨. Linear AC #1 도 `Repeat + Nearest` 명시.
   *Rationale:* checker pattern 의 신호가 distance / scale 에 독립.
   *Rejected:* `Linear` mag + `Nearest` min 등 mixed — checker 의 의도는
   샤프 격자, mixed 는 의도된 시각 효과가 아니라 절충이 됨.

3. **Address mode: `Repeat` (u, v 둘 다).** `address_mode_w` 는 2D
   texture 라 상관없음 (default 유지).
   *Rationale:* mesh UV 가 0..1 너머일 때 (importer 가 그렇게 만들면) 타일링됨.
   *Rejected:* `MirrorRepeat` — checker pattern 은 대칭성이 자동이라
   mirror 와 repeat 가 시각상 구분 안 됨. `Repeat` 가 의도 표현이 더
   직접적.

4. **테스트 추가 — startup test 안에서 sampler 검증.** 기존
   `startup_inserts_resource_with_configured_material` 가 이미
   `app.update()` 후 `Assets<StandardMaterial>::get` 으로 invariant 검증.
   동일 패턴 확장 — `Assets<Image>::get(material.base_color_texture)` 로
   image 를 꺼내 `image.sampler` 가 `ImageSampler::Descriptor` 이고
   `address_mode_u == Repeat`, `mag_filter == Nearest` 인지 단정.
   *Rationale:* invariant 추가는 같은 테스트 안에서 검증 위치 모이는 게
   정합. 분리하면 두 테스트가 같은 setup 을 두 번 함.
   *Rejected:* 별 테스트 함수 추가 — 같은 setup, 같은 invariant 클래스라
   분리 이득 없음.

5. **ADR-0031 Decision #4 in-place 편집 (Proposed status).**
   `~/.claude/rules/shotloom.md` H10: "Proposed ADRs may edit in place."
   따라서 amendment block 없이 Decision #4 본문 코드 블록의
   `asset_server.load(...)` 호출을 `load_with_settings(...)` 로 교체하고,
   sampler 의 의도 (Repeat + Nearest) 를 한 단락 본문에 명시.
   *Rationale:* Amendment block 은 Accepted ADR 의 supersession 도구
   (H10). Proposed 상태의 ADR 은 본문 직접 갱신이 컨벤션.
   *Rejected:* amendment block 추가 — Proposed status 가 풀리기 전엔
   불필요한 변경 기록.

## Acceptance

- [ ] `PlaceholderMaterial` checker texture 가 `Repeat + Nearest` sampler 설정으로 로드된다.
- [ ] 기존 shared `Handle<StandardMaterial>` invariant 가 유지된다.
- [ ] 기존 material invariant (`base_color_texture`, `double_sided`, `cull_mode: None`) 가 유지된다.
- [ ] sampler 설정을 검증하는 테스트가 추가된다.
- [ ] `cargo test -p shotloom-engine` 또는 해당 focused test 가 통과한다.
- [ ] 큰 mesh 에 placeholder material 을 적용했을 때 checker 가 흐릿한 색면이 아니라 crisp 한 checker 로 보이는지 manual 확인한다.
- [ ] ADR-0031 Decision #4 가 sampler invariant (`Repeat + Nearest`) 를 반영한다.

## File map

| Path | Kind | Note |
|------|------|------|
| `crates/shotloom-engine/src/materials/placeholder.rs` | modify | `init_placeholder_material` 의 `asset_server.load(...)` → `asset_server.load_with_settings::<Image, ImageLoaderSettings>(...)`. settings closure 안에서 `sampler = ImageSampler::Descriptor(...)` 로 Repeat + Nearest 지정. 기존 `startup_inserts_resource_with_configured_material` 안에 `Image::sampler` 단정 두 줄 추가 (`address_mode_u == Repeat`, `mag_filter == Nearest`). |
| `docs/adr/adr-0031-bevy-material-usage-rules.md` | modify | Decision #4 본문 코드 블록의 `asset_server.load("default/checker.png")` 를 `asset_server.load_with_settings(...)` 형태로 교체. 코드 블록 위/아래에 sampler 의 의도 (Repeat + Nearest) 를 한 단락 prose 로 추가. |

## Verification

- `cargo test -p shotloom-engine` — `startup_inserts_resource_with_configured_material` 가 새 sampler invariant 단정과 함께 통과.
- `pnpm lint:rust` — `cargo clippy --workspace $CARGO_WORKSPACE_EXCLUDES -- -D warnings` clean.
- `cargo fmt --check` — clean.
- `node scripts/validate-doc-paths.mjs` — clean (ADR 본문 cross-ref 변경 없음).
- `/shotloom-review-before-pr` after push — 매 push 필수.
- Manual sanity: `pnpm dev:web` 으로 viewport 띄우고 큰 plane / sphere 에 placeholder 적용된 mesh 가 있는 scene 로드. checker 가 crisp 격자로 보이는지 시각 확인. (현재 repo 에 그런 sample scene 이 자동 setup 으로 있는지 확인 필요 — 없으면 manual 단계는 declared gap 으로 PR body 에 명시.)

## Open questions

1. `ImageLoaderSettings` 의 `sampler` 필드가 Bevy 0.18.x 에서 정확히 어떤
   path 로 노출되는지 (`bevy::image::ImageSamplerDescriptor` vs
   `bevy::render::texture::ImageSamplerDescriptor`) — 구현 진입 시 첫
   `cargo check` 으로 확인. Bevy 0.18 에서 image 관련 type 이
   `bevy::image` 로 모인 흐름이라 그쪽이 유력하지만 단정 안 함.
2. Manual sanity 단계가 자동 setup 으로 가능한 sample scene 이 repo 에
   있는지 — 없으면 PR body 에 "synthetic-JSON 단위 테스트가 유일한 회귀
   surface" 로 명시. (STL-227 의 fixture 부재 declaration 과 동일 패턴.)
