---
title: "Selection highlight 구현 Q&A"
tags:
  - type/learning
  - project/shotloom
  - area/rendering
  - lib/bevy
date: 2026-05-06
source: claude-code
---

# Selection highlight 구현 Q&A

selection highlight system 구현 의문점 — 청자/팀원 설명 시 자주 묻는 질문 위주. *기본 설계* 는 `selection-highlight-system.md` 와 `jump-flood-algorithm.md` 참고.

## RenderLayers 는 무엇인가? Bevy 가 제공하나?

**Bevy 가 제공하는 native component**: `bevy::render::view::RenderLayers`.

```rust
commands.spawn((
    Mesh3d(mesh),
    RenderLayers::from_layers(&[0, 1]),  // entity 가 layer 0, 1 둘 다 속함
));

Camera3d {
    render_layers: RenderLayers::layer(1),  // 카메라가 layer 1 만 그림
    ...
}
```

**역할**: entity 와 카메라에 *번호 라벨* 붙이고, 카메라는 자기 layer 와 교차하는 entity 만 렌더. 비유 — 학생 (entity) 에게 색 스티커, 카메라는 자기 색만 봄.

**제공 여부**: ✓ Bevy 0.18 stable. docs `RenderLayers`.

## ID color mask 는 무엇인가? Bevy 가 제공하나?

**Bevy 자체엔 없음** — *우리가 짜는 패턴*.

mask texture 한 장에 픽셀당 정수 ID 박는 컨벤션:

```
픽셀값 0 → 아무 상태 없음
픽셀값 1 → selected
픽셀값 2 → hovered
픽셀값 3 → target
```

R8 unorm (또는 R16) 텍스처에 ID 값 저장 → composite shader 가 픽셀값 보고 *상태별로 다른 색 / 두께 / 효과* 분기.

**왜 이 패턴**:
- binary mask 는 안 / 밖 만 구분 (멀티 상태 표현 못 함)
- ID color mask 는 한 텍스처로 모든 상태 정보 → 카메라 / 패스 / 텍스처 추가 0

**Bevy 가 제공하는 인프라 (위에 우리 패턴 얹음)**:
- `Image` asset + `Assets<Image>` resource — 텍스처 lifetime 관리
- `RenderTarget::Image(handle)` — render-to-texture
- Custom `Material` trait + `FullscreenMaterial` (0.18 새 API) — shader 작성
- `RenderGraph` API — 노드 등록

## Texture 4장 RGBA 채널에 ID 박는 건가?

**아닙니다 — 흔한 오해**.

우리 plugin 이 보유하는 텍스처 4장은 *역할이 다 다름* — 파이프라인 단계별 데이터:

| 텍스처 | 포맷 | 역할 |
|---|---|---|
| `mask` | R8 unorm | selected entity 의 ID 색 기록 (state 인코딩) |
| `jfa_a` | RG16f | JFA 중간 결과 ping |
| `jfa_b` | RG16f | JFA 중간 결과 pong |
| `distance_field` | R16f | JFA 최종 결과 (가장 가까운 edge 까지 거리) |

state 인코딩은 *mask 1장 안* 에서. 두 옵션:

| 옵션 A — 단일 ID color (권장) | 옵션 B — RGBA 채널 비트 |
|---|---|
| R8 unorm 1채널 | RGBA 4채널 |
| 픽셀값 = 정수 ID | R=selected, G=hovered, B=target, A=other |
| 한 픽셀에 *하나의 state* (mutually exclusive) | 한 픽셀에 여러 state 동시 (overlapping) |
| 1 byte/px | 4 byte/px |
| shotloom 의 selection 은 거의 mutually exclusive → A 충분 | overlapping 케이스 필요할 때만 |

→ shotloom 첫 PR 은 옵션 A. 4 채널은 over-engineering.

## Mask texture 는 어디에 저장?

물리적으론 GPU VRAM, Bevy 측은 `Assets<Image>` 리소스 안. Plugin 이 `Handle<Image>` 만 보유.

```rust
#[derive(Resource)]
pub struct SelectionHighlightTextures {
    pub mask: Handle<Image>,
    pub jfa_a: Handle<Image>,
    pub jfa_b: Handle<Image>,
    pub distance_field: Handle<Image>,
}
```

**Lifecycle**:

| 시점 | 동작 |
|---|---|
| plugin 초기화 | texture 4개 생성 (현재 viewport 크기) |
| 매 프레임 | mask 카메라가 mask 에 그림 → JFA 가 distance_field 채움 → composite 가 main color 위에 그림 |
| 윈도우 / viewport 리사이즈 | 텍스처 모두 재생성 (handle 의 image 만 교체) |
| plugin 종료 | handle drop → `Assets<Image>` GC → GPU 메모리 해제 |

**디스크 저장 안 됨** — runtime-only.

## Texture 를 character 에 어떻게 할당?

**Texture 자체는 character 에 안 붙음**. Texture 는 화면 전체 (viewport 크기) 공용. character 엔 *어떤 ID 로 mask 에 그릴지* 알려주는 component 만 부착.

```rust
#[derive(Component)]
struct SelectionMaskId(pub u32);  // 0 = none, 1 = selected, 2 = hovered, ...

fn update_mask_id(
    mut q: Query<(&mut SelectionMaskId, Option<&Selected>, Option<&Hovered>, Option<&Target>)>,
) {
    for (mut id, sel, hov, tar) in &mut q {
        id.0 = if tar.is_some() { 3 }
               else if hov.is_some() { 2 }
               else if sel.is_some() { 1 }
               else { 0 };
    }
}
```

**할당 흐름**:

```
character entity 에 SelectionMaskId(2) 부착
       ↓
mask 카메라가 그 entity 그릴 때 mask shader 가 ID/255 를 R 채널에 출력
       ↓
mask texture 의 그 entity 위치 픽셀에 0.0078 (= 2/255) 저장
       ↓
composite shader 가 픽셀값 0.0078 → 정수 2 복원 → "이건 hovered" 분기
```

texture ↔ character 관계 = *간접*. character → ID component → mask shader → texture 픽셀.

## Mesh 는 어떻게 그리나? MToon 무시?

mask 카메라가 *별도 mask material* 로 mesh 그림. 메인 카메라는 그대로 MToon 사용.

```rust
#[derive(Asset, AsBindGroup, Clone)]
struct SelectionMaskMaterial {
    #[uniform(0)]
    mask_id: f32,
}

// fragment shader 단순:
@fragment fn fragment() -> @location(0) vec4<f32> {
    return vec4(uniforms.mask_id, 0.0, 0.0, 1.0);
}
```

**할당 시점**:

```rust
fn add_mask_material(
    mut commands: Commands,
    q: Query<(Entity, &Mesh3d, &SelectionMaskId), Added<SelectionMaskId>>,
    mut materials: ResMut<Assets<SelectionMaskMaterial>>,
) {
    for (entity, mesh, id) in &q {
        let mat = materials.add(SelectionMaskMaterial { mask_id: id.0 as f32 / 255.0 });
        commands.entity(entity).insert((
            mat,
            RenderLayers::layer(SELECTION_MASK_LAYER),
        ));
    }
}
```

**메인 카메라**: 원래 MToon material 로 그려짐. **부캐 mask 카메라**: mask material 만 사용. 둘이 *완전 별개 패스*.

## 투명 material 은 outline 에서 제외 가능?

가능. 세 가지 방식:

### 방식 a — RenderLayers 필터링 (권장)

투명 / alpha-cutout mesh 자체를 SELECTION_MASK_LAYER 에 *안 넣음*. character 의 *opaque body 만* mask 에 그림.

```rust
fn assign_mask_layers(
    q: Query<(Entity, &MeshAlphaMode), With<Selected>>,
    mut commands: Commands,
) {
    for (entity, alpha_mode) in &q {
        match alpha_mode {
            AlphaMode::Opaque => {
                commands.entity(entity).insert(RenderLayers::layer(MASK_LAYER));
            }
            AlphaMode::Blend | AlphaMode::Mask(_) => {
                // layer 안 넣음 — outline 제외
            }
        }
    }
}
```

→ 깔끔하고 비용 0. 머리카락 fluff / 알파 옷자락 등 자동 제외.

### 방식 b — Mask shader 에서 alpha discard

투명 material 도 layer 에 넣되, mask shader 가 alpha 0 픽셀 discard:

```wgsl
@fragment fn fragment(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let alpha = textureSample(base_color_texture, sampler, uv).a;
    if (alpha < 0.5) { discard; }
    return vec4(uniforms.mask_id, 0.0, 0.0, 1.0);
}
```

→ fragment 단위로 투명 픽셀 제외. opaque 도 알파 있으면 잘못 잘릴 수 있음 (false negative). 덜 권장.

### 방식 c — Mesh whitelist

VRM / PMX 의 sub-mesh 중 "outline 그릴 부분" explicit list. 디자이너가 캐릭터마다 결정 가능. 작업 부담 큼 — 디자인 의도 강할 때만.

### 권장

첫 PR 은 **방식 a**. 디자인이 *fluff 까지 silhouette 에* 원하면 b 로 escalate.

## 머리카락 fluff 가 뭐임?

3D 캐릭터의 *부드러운 / 흩날리는 / 솜털 같은 가장자리 디테일*. alpha-blend 또는 alpha-cutout texture 로 표현되는 *얇은 장식*.

```
딱딱한 머리카락 mesh:               fluff (얇은 alpha 장식):
    ╱──╲                              · · · ╱──╲ · · ·
   ╱    ╲                            · · · ╱    ╲ · · ·
   │    │                            · · ·│    │· · ·
                                      ↑ 흩날리는 잔머리, 솜털
```

- **메인 머리카락**: opaque polygon mesh, 두꺼운 strand
- **Fluff**: alpha texture plane, *얇은 잔머리 / 흩날리는 끝 / 솜털*

VRoid / 애니 스타일 캐릭터 자주 보유. fluff 까지 outline 에 포함시키면 *outline 이 너덜너덜* — 보통 깔끔한 silhouette 위해 fluff 제외.

동의어: 잔머리, 솜털, baby hair, hair wisp.

## 정리 표 — 모든 질문 한 줄 답

| 질문 | 답 |
|---|---|
| RenderLayers? | Bevy native. entity / 카메라에 layer 라벨, 카메라는 자기 layer 만 그림 |
| ID color mask? | 우리 패턴. mask texture 픽셀값에 정수 ID 박아 멀티 상태 분기 |
| 텍스처 4장 = RGBA 인코딩? | ✗ 4장은 파이프라인 단계 데이터. State 인코딩은 mask 1장의 R 채널 |
| Mask texture 위치? | GPU VRAM, Bevy `Assets<Image>` 안. plugin 이 `Handle<Image>` 보유 |
| Texture 를 character 에? | 텍스처는 viewport 공용. character 엔 `SelectionMaskId` component만 |
| Mesh 어떻게? | 부캐 카메라가 *별도 mask material* (단순 ID 색) 로 그림. MToon 은 메인 카메라만 |
| 투명 제외 가능? | ✓ AlphaMode::Opaque mesh 만 SELECTION_MASK_LAYER 에. 비용 0 |
| Fluff? | 얇은 alpha 머리카락 / 솜털. 보통 outline 에서 제외 |

> [!tip] Texture 와 character 의 관계는 *간접*
> Texture 는 viewport 공용 자원. Character 엔 *어떤 ID 로 mask 에 표현될지* 알려주는 component 만 부착. mask shader 가 그 ID 를 픽셀값으로 출력. 직접 texture 가 character 에 붙는다는 mental model 은 오해.

> [!abstract] Rule
> Selection highlight 의 mesh 그리기는 *별도 material* 로. character material (MToon 등) 손대지 않고 mask 카메라가 자기 material 만 사용. character 셰이더 변경 0, art outline 과 직교 보장. #rule

> [!warning] R8 unorm bilinear 시 ID 섞임
> ID color mask 를 R8 unorm 에 박고 bilinear sampling 하면 인접 픽셀 간 ID 가 섞여서 (1.5 같은 값) 잘못된 분기 발생. **교훈:** mask texture 샘플링은 *반드시 nearest filter*, 또는 R8 uint (정수 텍스처) 사용.

## 청자 설명 시 권장 순서

1. *무엇* — selection 시각화 노드 추가
2. *어떻게 거시적* — RenderLayers + mask + composite (Bevy 인프라 위에 우리 패턴)
3. *어떻게 미시적* — character 엔 ID component, mask 카메라가 별도 material 로 mask 그림, composite 가 합성
4. *왜 PP 후* — bloom / DoF / vignette 영향 회피, 색·선명도 보장
5. *Edge case* — 투명 material 은 RenderLayers 필터링으로 제외, fluff 등 디자인 의도 따라

이 순서로 *한 호흡* 에 설명하면 청자가 misconception 없이 이해.

### 사이드 노트

- 본 Q&A 는 *구현 의문점* 위주. 시스템 *설계 / 비용 / 단계 plan* 은 다른 learning 참조
- "Texture 4장 RGBA" 오해는 *흔한 첫 mental model* — 한 번 정정해주면 청자가 이후 이해 빨라짐
- mask material 분리는 review 시 *art outline 과의 충돌 우려* 예방 — 명시 권장
