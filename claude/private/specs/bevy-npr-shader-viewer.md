# Bevy NPR Shader Library Viewer — Technical Specification

## Metadata
- **Module**: bevy-npr-viewer (별도 바이너리, bevy-vrm workspace 내)
- **Date**: 2026-03-21
- **Author**: Younsoo Lim
- **Status**: Draft v2
- **Base**: bevy-vrm workspace (Bevy 0.18, wgpu, WGSL)
- **Purpose**: TA 포트폴리오 셰이더 쇼케이스

---

## 1. Overview

NPR 셰이더를 WGSL로 직접 제작하고, VRM 캐릭터 모델 위에서 실시간으로 확인·비교하는 독립 뷰어 앱. bevy-vrm 워크스페이스의 별도 바이너리(`src/bin/npr_viewer.rs`)로 존재하며, 기존 리타겟 뷰어와 독립적으로 동작한다. TA 포트폴리오 셰이더 쇼케이스가 주 용도.

핵심은 **Material 컨셉 제작** — bevy_vrm1의 렌더링을 교체하는 게 아니라, WGSL Custom Material을 처음부터 설계하고 시각적 결과를 확인하는 도구.

---

## 2. Background

### Problem Statement
- 커스텀 NPR Material을 Bevy + WGSL로 만드는 레퍼런스/워크플로우가 없음
- 셰이더 파라미터를 바꿀 때마다 재컴파일 → 이터레이션 느림
- 결과물을 포트폴리오로 보여줄 쇼케이스 형태가 필요

### Motivation
- TA 포트폴리오: "이런 NPR 셰이더를 WGSL로 직접 만들었다"를 보여주는 도구
- Material 컨셉 단계 — 셰이더 자체가 산출물
- WGSL + Bevy Material trait 학습 축적
- 추후 PMX 모델 지원으로 확장 가능 (mmd 프로젝트 PMX 로더 이식, 후순위)

---

## 3. Architecture

### 3.1 Core Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `NprShaderPlugin` | `crates/npr_shaders/src/lib.rs` | 셰이더 등록, Material trait, plugin setup |
| `ToonMaterial` | `crates/npr_shaders/src/toon.rs` | 2-tone/3-tone 셀 셰이딩 + WGSL |
| `OutlinePass` | `crates/npr_shaders/src/outline.rs` | Inverted hull 아웃라인 |
| `ShaderLibrary` | `crates/npr_shaders/src/library.rs` | 셰이더 목록 관리, 프리셋 I/O |
| `NprViewerApp` | `src/bin/npr_viewer.rs` | 뷰어 엔트리, 턴테이블, UI |

후순위 셰이더 (Phase 2+):

| Component | File | Responsibility |
|-----------|------|----------------|
| `MatcapMaterial` | `crates/npr_shaders/src/matcap.rs` | Matcap 텍스처 기반 라이팅 |
| `HalftoneMaterial` | `crates/npr_shaders/src/halftone.rs` | 하프톤 도트 패턴 |
| `SketchMaterial` | `crates/npr_shaders/src/sketch.rs` | 크로스해칭/펜슬 스타일 |
| `PostProcessStack` | `crates/npr_shaders/src/post.rs` | 블룸, CA, 톤매핑 |

### 3.2 Data Flow

```
[VRM File]
  → bevy_vrm1 로딩 (메시 + 본 구조만 사용)
  → bevy_vrm1 MToon Material 제거
  → NprMaterial 부착 (선택된 셰이더)
  → WGSL Render Pipeline (+ OutlinePass)
  → Screen (턴테이블 회전)

[Shader Switch / Param Change]
  → ShaderLibrary 조회
  → Material 교체 or Uniform 업데이트
  → 즉시 반영 (같은 프레임)
```

### 3.3 Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `bevy` | 0.18 | Core engine |
| `bevy_vrm1` | 0.6 | VRM 로딩 (메시 추출용) |
| `bevy_panorbit_camera` | 0.34 | 오빗 카메라 |
| `bevy_egui` | latest | 파라미터 GUI |
| `vrm0_compat` | workspace | VRM 0.x → 1.0 변환 (기존 크레이트) |

후순위:
| `mmd-pmx-loader` | TBD | PMX 모델 로딩 (mmd 프로젝트에서 이식) |

---

## 4. Implementation Details

### 4.1 Phase 1: Toon Material + 뷰어 (MVP)

#### ToonMaterial (WGSL Custom Material)

```wgsl
// toon.wgsl — fragment shader
struct ToonParams {
    base_color: vec4<f32>,
    shadow_color: vec4<f32>,
    bands: u32,
    softness: f32,
    rim_power: f32,
    rim_color: vec4<f32>,
}

@group(2) @binding(0) var<uniform> params: ToonParams;

fn cel_shade(n_dot_l: f32) -> f32 {
    let b = f32(params.bands);
    let stepped = floor(n_dot_l * b + 0.5) / b;
    return mix(stepped, n_dot_l, params.softness);
}

@fragment
fn fragment(in: VertexOutput) -> @location(0) vec4<f32> {
    let n = normalize(in.world_normal);
    let l = normalize(light.direction);
    let n_dot_l = max(dot(n, l), 0.0);

    let shade = cel_shade(n_dot_l);
    let color = mix(params.shadow_color, params.base_color, shade);

    // Rim light
    let v = normalize(camera.position - in.world_position);
    let rim = pow(1.0 - max(dot(n, v), 0.0), params.rim_power);
    let final_color = color + params.rim_color * rim;

    return final_color;
}
```

Rust Material 구현:
```rust
#[derive(Asset, TypePath, AsBindGroup, Clone)]
pub struct ToonMaterial {
    #[uniform(0)]
    pub params: ToonParams,
    #[texture(1)]
    #[sampler(2)]
    pub base_texture: Option<Handle<Image>>,
}

impl Material for ToonMaterial {
    fn fragment_shader() -> ShaderRef {
        "shaders/toon.wgsl".into()
    }
    fn alpha_mode(&self) -> AlphaMode {
        AlphaMode::Opaque
    }
}
```

Parameters:
| Param | Type | Default | Range | Description |
|-------|------|---------|-------|-------------|
| `base_color` | Vec4 | (1,0.9,0.85,1) | color | 밝은 영역 색상 |
| `shadow_color` | Vec4 | (0.3,0.1,0.2,1) | color | 그림자 색상 |
| `bands` | u32 | 2 | 1-5 | 라이팅 단계 수 |
| `softness` | f32 | 0.02 | 0-0.5 | 경계 부드러움 |
| `rim_power` | f32 | 3.0 | 0-10 | 림라이트 강도 |
| `rim_color` | Vec4 | (1,1,1,0.5) | color | 림라이트 색상 |

#### Outline (Inverted Hull)

별도 렌더 패스:
1. 메시를 노멀 방향으로 `outline_width`만큼 확장 (vertex shader)
2. Front face cull (뒷면만 렌더)
3. 단색 `outline_color`로 출력

```wgsl
// outline.wgsl — vertex shader
@vertex
fn vertex(in: Vertex) -> VertexOutput {
    let expanded = in.position + in.normal * params.outline_width;
    // ... project to clip space
}
```

Parameters:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `outline_width` | f32 | 0.003 | 아웃라인 두께 (월드 스페이스) |
| `outline_color` | Vec4 | (0,0,0,1) | 아웃라인 색상 |

#### 턴테이블 뷰어 (`src/bin/npr_viewer.rs`)

```rust
fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_plugins(Vrm1Plugin)
        .add_plugins(PanOrbitCameraPlugin)
        .add_plugins(EguiPlugin)
        .add_plugins(NprShaderPlugin)
        .insert_resource(Turntable { speed: 0.3, enabled: true })
        .add_systems(Startup, setup_scene)
        .add_systems(Update, (
            turntable_rotate,
            shader_ui_panel,
            handle_shader_switch,
            handle_file_drop,
        ))
        .run();
}
```

기능:
- VRM 파일 드래그 앤 드롭 or 파일 다이얼로그 (O키)
- 턴테이블 자동 회전 (T키 토글, 속도 조절)
- 마우스 오빗/줌/팬 (기존 panorbit)
- 셰이더 파라미터 GUI 패널 (S키 토글)
- `[` / `]` 키로 셰이더 전환

#### GUI 레이아웃 (bevy_egui)

```
┌──────────────────────────────────────────┐
│ SHADER: toon-2tone          [◀] [▶]     │
├──────────────────────────────────────────┤
│ Base Color    [■■■■■■■]                  │
│ Shadow Color  [■■■■■■■]                  │
│ Bands         [==●====] 2                │
│ Softness      [●======] 0.02            │
│ Rim Power     [===●===] 3.0             │
│ Rim Color     [■■■■■■■]                  │
├──────────────────────────────────────────┤
│ OUTLINE                                   │
│ ☑ Enabled                                │
│ Width         [==●====] 0.003            │
│ Color         [■■■■■■■]                  │
├──────────────────────────────────────────┤
│ SCENE                                     │
│ ☑ Turntable   Speed [===●===] 0.3       │
│ BG Color      [■■■■■■■]                  │
│ Light Dir     [===●===] [===●===]        │
├──────────────────────────────────────────┤
│ [Save Preset]  [Load Preset]  [Reset]    │
└──────────────────────────────────────────┘
```

### 4.2 Preset System

```json
// assets/presets/anime-classic.json
{
  "name": "Anime Classic",
  "shader": "toon-2tone",
  "params": {
    "base_color": [1.0, 0.9, 0.85, 1.0],
    "shadow_color": [0.4, 0.2, 0.3, 1.0],
    "bands": 2,
    "softness": 0.01,
    "rim_power": 4.0,
    "rim_color": [1.0, 1.0, 1.0, 0.3]
  },
  "outline": {
    "enabled": true,
    "width": 0.003,
    "color": [0.0, 0.0, 0.0, 1.0]
  },
  "scene": {
    "turntable_speed": 0.3,
    "bg_color": [0.15, 0.15, 0.18, 1.0]
  }
}
```

### 4.3 Material Swap (bevy_vrm1 → Custom)

VRM 로드 후 bevy_vrm1이 부착한 Material을 제거하고 커스텀으로 교체:

```rust
fn replace_vrm_materials(
    mut commands: Commands,
    query: Query<Entity, Added<MeshMaterial3d<Vrm1MtoonMaterial>>>,
    library: Res<ShaderLibrary>,
    mut materials: ResMut<Assets<ToonMaterial>>,
) {
    for entity in query.iter() {
        commands.entity(entity)
            .remove::<MeshMaterial3d<Vrm1MtoonMaterial>>()
            .insert(MeshMaterial3d(materials.add(library.get_active_toon())));
    }
}
```

### 4.4 Public API

```rust
// NprShaderPlugin
pub struct NprShaderPlugin;

// ShaderLibrary resource
pub struct ShaderLibrary {
    pub entries: Vec<ShaderEntry>,
    pub active_index: usize,
}

pub struct ShaderEntry {
    pub name: String,
    pub category: ShaderCategory,
    pub default_params: ToonParams,
}

// Turntable resource
pub struct Turntable {
    pub speed: f32,      // rad/sec
    pub enabled: bool,
}
```

---

## 5. File Structure

### New Files

| File | Description |
|------|-------------|
| `src/bin/npr_viewer.rs` | 뷰어 앱 엔트리 (별도 바이너리) |
| `crates/npr_shaders/Cargo.toml` | NPR 셰이더 크레이트 |
| `crates/npr_shaders/src/lib.rs` | Plugin, ShaderLibrary |
| `crates/npr_shaders/src/toon.rs` | ToonMaterial + Rust bindings |
| `crates/npr_shaders/src/outline.rs` | Inverted hull outline |
| `crates/npr_shaders/src/params.rs` | Uniform 파라미터 타입 |
| `assets/shaders/toon.wgsl` | Toon fragment shader |
| `assets/shaders/toon_vert.wgsl` | Toon vertex shader (필요 시) |
| `assets/shaders/outline.wgsl` | Outline vertex + fragment |
| `assets/presets/*.json` | 프리셋 파일 |

### Modified Files

| File | Changes |
|------|---------|
| `Cargo.toml` | workspace member `crates/npr_shaders` 추가, `[[bin]]` 추가 |

### Phase 2+ 추가 파일

| File | Description |
|------|-------------|
| `crates/npr_shaders/src/matcap.rs` | Matcap material |
| `crates/npr_shaders/src/halftone.rs` | Halftone material |
| `crates/npr_shaders/src/sketch.rs` | Sketch/crosshatch material |
| `crates/npr_shaders/src/post.rs` | Post-process stack |
| `assets/shaders/matcap.wgsl` | Matcap shader |
| `assets/shaders/halftone.wgsl` | Halftone shader |
| `assets/shaders/sketch.wgsl` | Sketch shader |
| `assets/matcaps/*.png` | Matcap 텍스처 |

---

## 6. Usage

```bash
# 빌드 & 실행
cargo run --bin npr_viewer

# 특정 VRM 로드
cargo run --bin npr_viewer -- --model assets/models/YouAre.vrm
```

```
Keyboard Shortcuts:
O           → VRM 파일 열기
T           → 턴테이블 토글
S           → 셰이더 패널 토글
[ / ]       → 이전/다음 셰이더
R           → 파라미터 리셋
Ctrl+S      → 프리셋 저장
1-4         → 카메라 프리셋 (Front/Side/Top/Perspective)
```

---

## 7. Test Plan

### Phase 1 Visual Verification
- [ ] VRM 로드 → ToonMaterial 자동 부착 확인
- [ ] 2-tone 셀 셰이딩: 밝은/어두운 2단계 분리 확인
- [ ] bands=3 → 3단계, bands=1 → flat shading 확인
- [ ] shadow_color 변경 → 즉시 반영
- [ ] softness 0→0.5 → 경계 부드러워짐 확인
- [ ] 림라이트: rim_power 조절 → 에지 밝기 변화
- [ ] Inverted hull outline on/off → 아웃라인 표시/숨김
- [ ] outline_width 조절 → 두께 변화
- [ ] 턴테이블 회전 + 마우스 오빗 동시 동작
- [ ] 프리셋 저장 → JSON 파일 생성 확인
- [ ] 프리셋 로드 → 파라미터 복원 확인

### Performance
- [ ] 단일 VRM 60fps 유지
- [ ] 셰이더 파라미터 변경 시 프레임 드롭 없음

---

## 8. Limitations & Future Work

### Phase 1 Scope
- ToonMaterial + Outline만 구현
- VRM 모델만 지원 (PMX 후순위)
- 단일 모델, 단일 뷰포트
- 네이티브 빌드만 (WASM 후순위)

### Phase 2: 셰이더 확장
- MatcapMaterial — matcap 텍스처 기반 라이팅
- HalftoneMaterial — 스크린 스페이스 도트 패턴
- Sobel edge outline — 포스트프로세스 엣지 검출
- Post-process stack (bloom, CA, vignette)

### Phase 3: 기능 확장
- PMX 모델 로딩 (mmd 프로젝트 PMX 로더 이식)
- 분할 뷰포트 A/B 셰이더 비교
- 스크린샷 캡처 (포트폴리오 이미지 자동 생성)
- SketchMaterial — TAM 크로스해칭

### Phase 4: 프로덕션
- WebGPU WASM 빌드 → 브라우저 데모
- bevy_vrm1 MToon 대체 옵션
- 스프링본 + 아웃라인 통합

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| NPR | Non-Photorealistic Rendering — 사실적이지 않은 스타일화된 렌더링 |
| Cel Shading | 라이팅을 이산적 단계로 양자화하는 툰 셰이딩 기법 |
| Inverted Hull | 메시를 노멀 방향으로 확대 + front face cull → 아웃라인 |
| Matcap | Material Capture — 뷰 노멀 기반 환경 라이팅 텍스처 |
| Halftone | 밝기를 도트 크기로 표현하는 인쇄 스타일 패턴 |
| TAM | Tonal Art Map — 밝기별 해칭 패턴 텍스처 세트 |
| WGSL | WebGPU Shading Language |
| Turntable | 모델이 Y축 기준으로 자동 회전하는 프레젠테이션 모드 |

### B. References

- Bevy Custom Material: https://bevyengine.org/examples/shaders/custom-shader-material/
- Bevy AsBindGroup derive: https://docs.rs/bevy/latest/bevy/render/render_resource/trait.AsBindGroup.html
- VRM MToon Spec: https://github.com/vrm-c/vrm-specification/tree/master/specification/VRMC_materials_mtoon-1.0
- "X-Toon: An Extended Toon Shader" (Barla et al., 2006)
- "Real-Time Hatching" (Praun et al., 2001)
- mmd-anju TSL 톤 셰이더 — Three.js WebGPU 구현 경험
