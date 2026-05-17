---
status: completed
created: 2026-05-12
updated: 2026-05-17
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
를 사용한다. 큰 ground / backdrop mesh 에 placeholder 가 붙으면 (a) mip /
linear 필터링 때문에 checker 가 흐릿한 회색면처럼 보이고 (b) 만약
importer 가 mesh UV 를 1.0 너머로 지정해 두었더라도 default `ClampToEdge`
가 가장자리 색을 늘려 타일링되지 않는다.

본 작업은 두 결함을 각각의 sampler 컴포넌트로 분리해 해결한다.
**`Nearest` 필터 (mag / min / mipmap)** 가 (a) blur 결함을 닫는다 —
어떤 zoom level 에서도 픽셀이 샤프하게 유지됨. **`Repeat` address mode
(u, v)** 는 (b) UV > 1 인 mesh 의 타일링을 가능하게 한다. UV 가 0..1 인
mesh 는 Repeat 가 noop — 그 경우에도 Nearest 가 blur 를 막아 Linear AC
#6 ("crisp checker") 를 충족한다. **Mesh-side UV scale / world-bound 기반
자동 타일링은 본 작업 범위가 아님** — UV scale 이 필요하면 importer /
spawner 가 mesh attribute 에 1.0 너머 UV 를 굽는 게 ownership 분리 의도.

shared `Handle<StandardMaterial>` 패턴, `base_color_texture` /
`double_sided` / `cull_mode: None` invariant, ADR-0031 Decision #4 의
preset 형태는 모두 유지된다. ADR-0031 자체는 Proposed status 라 in-place
편집 가능 (H10).

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

   *Caveat — same-path preload risk:* Bevy `AssetServer::load_with_settings`
   는 같은 path 가 이미 메모리에 로드되어 있으면 기존 handle 을 그대로
   돌려주고 새 settings closure 를 무시한다. 본 작업의 sampler invariant
   가 "한 곳에 모인다" 는 주장은 **`default/checker.png` 가 다른 어디서도
   먼저 로드되지 않는다** 는 조건부. 현재 repo 에는 이 path 를 로드하는
   다른 호출이 없어 blocking 아님 — 구현 시 `rg "default/checker.png"
   crates/` 한 번 더 확인. 미래에 다른 system 이 이 asset 을 로드하면
   load 순서 / settings 합의가 별도 결정 사항.

   *Rejected:* `assets/default/checker.png.meta` sidecar — 동치이지만
   파일이 위치 따로 가게 되고, 다른 placeholder asset 이 추가될 때마다
   sidecar 가 따라야 하는 약한 결합이 생김.

2. **Filter mode: `Nearest` (mag / min / mipmap 셋 다) — blur 결함 닫음.**
   checker pattern 의 의도는 픽셀 단위 격자 인지 — `Linear` 는 흐려지고
   mipmap 이 켜지면 먼 거리에서 회색면이 됨. Linear AC #1 도 `Repeat +
   Nearest` 명시. **이 컴포넌트가 Linear AC #6 의 "crisp checker" 요건을
   주로 충족** — UV 0..1 인 큰 plane 에서도 Nearest 만으로 픽셀 보존됨.

   *Rationale:* checker pattern 의 신호가 distance / scale 에 독립.
   *Rejected:* `Linear` mag + `Nearest` min 등 mixed — checker 의 의도는
   샤프 격자, mixed 는 의도된 시각 효과가 아니라 절충이 됨.

3. **Address mode: `Repeat` (u, v 둘 다) — UV > 1 일 때만 타일링 효과.**
   `address_mode_w` 는 2D texture 라 상관없음 (default 유지). **UV 가
   0..1 안에 머무는 mesh 에선 Repeat 가 noop** — 타일링은 importer /
   spawner 가 mesh UV 를 1.0 너머로 굽는 경우에만 발동. 본 sampler 설정
   은 그 가능성에 대비한 안전망.

   *Rationale:* placeholder 의 invariant 측면 — UV > 1 fixture 가
   들어왔을 때 default ClampToEdge 가 가장자리 색을 늘려 타일링이 깨지는
   surprise 를 막음.
   *Rejected:* `MirrorRepeat` — checker pattern 은 대칭성이 자동이라
   mirror 와 repeat 가 시각상 구분 안 됨. `Repeat` 가 의도 표현이 더
   직접적.
   *Rejected (out of scope):* mesh attribute UV scale 자동 굽기 — mesh
   ownership 침범, importer / spawner 의 책임.

4. **테스트 추가 — sampler descriptor 를 순수 함수로 분리해 단위 테스트
   하나로 검증, 기존 startup test 는 그대로.** 기존
   `startup_inserts_resource_with_configured_material` 는 `AssetPlugin` +
   `init_asset::<Image>()` + 한 `app.update()` 만 돌리는데, PNG loader 는
   `ImagePlugin` 이 등록하고 `asset_server.load*` 는 비동기라 한 tick 후
   `Assets<Image>::get(...)` 가 `None` 일 가능성이 큼. 자산 검증 경로는
   `ImagePlugin::default()` + `load_state == Loaded` polling 이 필요한데
   startup test 의 scope 가 그만큼 커지면 invariant 검증보다 setup 코드가
   주가 됨.

   대신 sampler descriptor 를 만드는 함수 (예: `fn
   placeholder_sampler_descriptor() -> ImageSamplerDescriptor`) 를
   `placeholder.rs` 안에 분리하고, settings closure 가 그 함수를 호출.
   새 단위 테스트 한 개가 그 함수의 리턴을 직접 단정 — `address_mode_u
   == Repeat`, `address_mode_v == Repeat`, `mag_filter == Nearest`,
   `min_filter == Nearest`, `mipmap_filter == Nearest`. asset / app
   setup 무관.

   기존 startup test 는 변경 없음 — `Handle<StandardMaterial>` + material
   invariant (`base_color_texture: Some`, `double_sided: true`,
   `cull_mode: None`) 만 검증. sampler 검증은 새 단위 테스트가 담당.

   *Rationale:* invariant 클래스 두 개가 다른 setup cost 를 가짐 — material
   는 startup app 한 tick 이면 검증되지만, image sampler 는 async load
   완료까지 polling 필요. 분리가 정합.

   *Rejected:* 기존 startup test 에 image sampler 단정 끼워넣기 — async
   load 미완료로 인한 flake 위험. ImagePlugin + load_state polling 추가도
   가능하지만 invariant 검증 한 가지 추가하려고 setup 가 두 배가 됨.

5. **ADR-0031 Decision #4 in-place 편집 (Proposed status).**
   `~/.claude/rules/shotloom.md` H10: "Proposed ADRs may edit in place."
   따라서 amendment block 없이 Decision #4 본문 코드 블록의
   `asset_server.load(...)` 호출을 `load_with_settings(...)` 로 교체하고,
   sampler 의 의도 (Repeat — UV > 1 타일링 안전망, Nearest — blur 방지)
   를 한 단락 본문에 명시.

   *Rationale:* Amendment block 은 Accepted ADR 의 supersession 도구
   (H10). Proposed 상태의 ADR 은 본문 직접 갱신이 컨벤션.
   *Rejected:* amendment block 추가 — Proposed status 가 풀리기 전엔
   불필요한 변경 기록.

## Acceptance

- [ ] `PlaceholderMaterial` checker texture 가 `Repeat + Nearest` sampler 설정으로 로드된다.
- [ ] 기존 shared `Handle<StandardMaterial>` invariant 가 유지된다.
- [ ] 기존 material invariant (`base_color_texture`, `double_sided`, `cull_mode: None`) 가 유지된다.
- [ ] sampler 설정을 검증하는 테스트가 추가된다 (Decision #4 의 분리된 순수 함수에 대한 단위 테스트).
- [ ] `cargo test -p shotloom-engine` 또는 해당 focused test 가 통과한다.
- [ ] **(a) blur 방지 manual 확인** — UV 0..1 큰 plane (or scale 된 default cube) 에 placeholder 적용 시 checker 가 흐려진 회색면이 아니라 픽셀 단위 crisp 한 큰 격자로 보임.
- [ ] **(b) tiling 동작 manual 확인** — UV 1.0 너머 (예: scale 4.0 적용한 UV mesh) fixture 가 있으면, Repeat sampler 가 checker 를 타일링하는지 확인. fixture 가 없으면 PR body 에 declared gap 으로 명시 — Repeat 는 UV 0..1 mesh 에서 noop 이라 (a) 만으로도 본 PR scope 충족.
- [ ] ADR-0031 Decision #4 가 sampler invariant (`Repeat + Nearest`) 를 반영한다.

## File map

| Path | Kind | Note |
|------|------|------|
| `crates/shotloom-engine/src/materials/placeholder.rs` | modify | (1) `init_placeholder_material` 의 `asset_server.load(...)` → `asset_server.load_with_settings::<Image, ImageLoaderSettings>(...)`. settings closure 가 새 헬퍼 `placeholder_sampler_descriptor()` 호출. (2) `fn placeholder_sampler_descriptor() -> ImageSamplerDescriptor` 추가 — Repeat + Nearest descriptor 리턴. (3) 새 `#[test] fn placeholder_sampler_descriptor_is_repeat_nearest()` 단위 테스트 — descriptor 의 5 필드 단정. (4) 기존 `startup_inserts_resource_with_configured_material` 변경 없음. |
| `docs/adr/adr-0031-bevy-material-usage-rules.md` | modify | Decision #4 본문 코드 블록의 `asset_server.load("default/checker.png")` 를 `asset_server.load_with_settings(...)` 형태로 교체. 코드 블록 위/아래에 sampler 의 의도 (Repeat — UV>1 안전망, Nearest — blur 방지) 를 한 단락 prose 로 추가. |

## Verification

- `cargo test -p shotloom-engine` — 새 `placeholder_sampler_descriptor_is_repeat_nearest` 단위 테스트 + 기존 startup test 통과.
- `pnpm lint:rust` — `cargo clippy --workspace $CARGO_WORKSPACE_EXCLUDES -- -D warnings` clean.
- `cargo fmt --check` — clean.
- `node scripts/validate-doc-paths.mjs` — clean (ADR cross-ref 변경 없음).
- `/shotloom-review-before-pr` after push — 매 push 필수.
- **Manual sanity (a) — blur 방지:** `pnpm dev:web` 으로 viewport 띄우고 large plane / scale 된 default cube 에 placeholder 적용된 mesh 가 있는 scene 확인. 자동 setup 으로 가능한 scene 이 없으면 PR body 에 "manual 단계 declared gap" 으로 명시.
- **Manual sanity (b) — tiling:** UV 1.0 너머 fixture 가 repo 에 없으면 (사전 sweep: `rg "uv.*\\[.*[2-9]\\.[0-9]" assets/ crates/` 등) "Repeat 는 UV 0..1 mesh 에서 noop 이고 본 PR scope 는 (a) 가 메인" 으로 PR body 에 명시. fixture 추가는 follow-up 후보 아님 — 본 PR 와 무관한 importer / sample-scene 작업.
- **Same-path preload sweep:** `rg "default/checker.png" crates/` — `placeholder.rs` 외에 hit 가 있으면 Decision #1 caveat 가 발동, settings 합의가 별도 결정 사항으로 surface.

## Open questions

1. ~~`ImageLoaderSettings` 의 `sampler` 필드 path~~ — codex 리뷰가 Bevy 0.18 에서 `bevy::image::{ImageLoaderSettings, ImageSamplerDescriptor, ImageAddressMode, ImageFilterMode}` 로 확인. 구현 시 첫 `cargo check` 로 재확인.
2. Manual sanity (a) 가 자동 setup 으로 가능한 sample scene 이 repo 에 있는지 — 없으면 PR body 에 declared gap 으로 명시. fixture (b) 도 동일 정책.
