---
skill: cci-codex-analyze-motion
timestamp: 2026-04-14T11:23:59+09:00
cwd: /Users/deemooooooooo/Desktop/www/bevy-vrm
model: gpt-5.4
reasoning_effort: high
---

## Prompt

```
당신은 3D 애니메이션 데이터 분석가다. 이 bevy-vrm 워크스페이스의 `assets/fbx/` 폴더에 있는 11개 FBX 파일을 분석하라.

## 환경
- 워크스페이스 루트: 현재 디렉토리 (bevy-vrm)
- FBX 위치: assets/fbx/*.fbx (11개)
- 사용 가능한 도구:
  - `crates/fbx_rig/` — 내부 Rust crate, FBX 파싱 로직
  - `crates/cinev_retarget/src/bin/` 에 임시 분석 bin 작성 가능 (파일명에 _scratch_ 또는 _summary_ 포함)
  - cargo build/run 가능
- 모든 본은 ARP (Auto-Rig Pro) 컨벤션 가정

## Phase 1: 도구 정찰
1. `crates/fbx_rig/src/lib.rs` 읽고 노출된 API 파악
2. `crates/cinev_retarget/src/bin/` 에 재사용할 만한 기존 bin 있는지 확인
3. 도구 전략 결정 (기존 bin / 임시 bin 신규 작성 / 빌드 실패 시 대안)

## Phase 2: 파일별 분석
각 FBX:
- 본 개수, 루트 본 이름
- 프레임 수, FPS, 길이(초)
- ARP 표준 본 누락 (Hips/Spine/Chest/Neck/Head/L+R Shoulder/UpperArm/LowerArm/Hand/UpLeg/Leg/Foot)
- **Rest pose vs Frame 0 diff** — 5° 이상 회전 차이 본 목록 ⭐ 핵심
- 잠재 문제: jitter, 비정상 본 이름, 음수 프레임

## Phase 3: 종합
- 11개를 "안전 / 주의 / 위험" 분류
- 문제 top 3 + 이유
- humanoid_retarget 파이프라인이 처리 어려울 케이스 식별

## 출력
- 한국어, 마크다운 표
- 분석 도구 빌드/실행 로그 핵심만 인용
- **결론 굵게**

## 제약
- assets/fbx/ 파일은 read-only (수정/삭제 절대 금지)
- 빌드 실패 2번이면 다른 접근
- FBX 한 개 30초 이상 걸리면 핵심 3~4개만 깊게, 나머지는 표 요약
```

## Response

OpenAI Codex v0.117.0 (research preview)
--------
workdir: /Users/deemooooooooo/Desktop/www/bevy-vrm
model: gpt-5.4
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR, /Users/deemooooooooo/.codex/memories]
reasoning effort: none
reasoning summaries: none
session id: 019d89cd-8510-7b00-873b-3528d7917bf3
--------
user
중요: 모든 답변은 **한국어**로. 코드 블록은 영어로 두되 설명·결론·요약·권장사항은 한국어. 마크다운으로. 결론은 굵게.

---

당신은 3D 애니메이션 데이터 분석가다. 이 bevy-vrm 워크스페이스의 `assets/fbx/` 폴더에 있는 11개 FBX 파일을 분석하라.

## 환경
- 워크스페이스 루트: 현재 디렉토리 (bevy-vrm)
- FBX 위치: assets/fbx/*.fbx (11개)
- 사용 가능한 도구:
  - `crates/fbx_rig/` — 내부 Rust crate, FBX 파싱 로직
  - `crates/cinev_retarget/src/bin/` 에 임시 분석 bin 작성 가능 (파일명에 _scratch_ 또는 _summary_ 포함)
  - cargo build/run 가능
- 모든 본은 ARP (Auto-Rig Pro) 컨벤션 가정

## Phase 1: 도구 정찰
1. `crates/fbx_rig/src/lib.rs` 읽고 노출된 API 파악
2. `crates/cinev_retarget/src/bin/` 에 재사용할 만한 기존 bin 있는지 확인
3. 도구 전략 결정 (기존 bin / 임시 bin 신규 작성 / 빌드 실패 시 대안)

## Phase 2: 파일별 분석
각 FBX:
- 본 개수, 루트 본 이름
- 프레임 수, FPS, 길이(초)
- ARP 표준 본 누락 (Hips/Spine/Chest/Neck/Head/L+R Shoulder/UpperArm/LowerArm/Hand/UpLeg/Leg/Foot)
- **Rest pose vs Frame 0 diff** — 5° 이상 회전 차이 본 목록 ⭐ 핵심
- 잠재 문제: jitter, 비정상 본 이름, 음수 프레임

## Phase 3: 종합
- 11개를 "안전 / 주의 / 위험" 분류
- 문제 top 3 + 이유
- humanoid_retarget 파이프라인이 처리 어려울 케이스 식별

## 출력
- 한국어, 마크다운 표
- 분석 도구 빌드/실행 로그 핵심만 인용
- **결론 굵게**

## 제약
- assets/fbx/ 파일은 read-only (수정/삭제 절대 금지)
- 빌드 실패 2번이면 다른 접근
- FBX 한 개 30초 이상 걸리면 핵심 3~4개만 깊게, 나머지는 표 요약
codex
요청하신 3단계 분석으로 진행하겠습니다. 먼저 `fbx_rig` API와 재사용 가능한 bin들을 확인해서, 11개 FBX를 안정적으로 읽을 수 있는 분석 경로부터 정하겠습니다.
exec
/bin/zsh -lc 'ls -la crates/cinev_retarget/src/bin' in /Users/deemooooooooo/Desktop/www/bevy-vrm
exec
/bin/zsh -lc "sed -n '1,260p' crates/fbx_rig/src/lib.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 exited 1 in 0ms:
ls: crates/cinev_retarget/src/bin: No such file or directory

 succeeded in 0ms:
//! `fbx_rig` — pure-Rust FBX reader specialized for skeletal animation.
//!
//! Wraps `fbxcel`'s low-level binary parser and produces a
//! normalized scene graph ([`SourceAsset`]) with:
//! - Bone hierarchy + rest transforms
//! - Per-bone animation tracks (rotation + translation curves)
//! - Blend-shape weight tracks
//! - Source DCC tool detection ([`FbxSourceType`])
//!
//! This crate was split out of `humanoid_retarget` so that FBX parsing
//! concerns live separately from the retargeting algorithm.

/// Re-export of the underlying `fbxcel` crate for consumers that need
/// raw low-level access (e.g. debug binaries inspecting unusual node
/// types). Most users should use [`parse`] instead.
pub use fbxcel;

use fbxcel::low::v7400::AttributeValue;
use fbxcel::pull_parser::any::AnyParser;
use fbxcel::pull_parser::v7400::Event;
use fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
use glam::{Mat4, Quat, Vec3};
use std::collections::HashMap;
use std::io::Cursor;
use thiserror::Error;

const FBX_TIME_UNIT: f64 = 46186158000.0;
const SAMPLE_RATE: f32 = 30.0;

#[derive(Error, Debug)]
pub enum Error {
    #[error("FBX parse error: {0}")]
    Parse(String),
}

/// Which DCC tool produced this FBX. Detected from the `Creator` header
/// field and a PreRotation-identity heuristic as fallback.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, serde::Deserialize)]
pub enum FbxSourceType {
    #[default]
    Auto,
    Blender,
    Maya,
}

impl std::fmt::Display for FbxSourceType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FbxSourceType::Auto => write!(f, "Auto"),
            FbxSourceType::Blender => write!(f, "Blender"),
            FbxSourceType::Maya => write!(f, "Maya"),
        }
    }
}

#[derive(Debug)]
pub struct SourceAsset {
    pub bones: HashMap<String, FbxBone>,
    pub tracks: HashMap<String, FbxBoneTrack>,
    pub blend_shape_tracks: HashMap<String, Vec<f32>>,
    pub duration: f32,
    pub frame_count: usize,
    pub creator: Option<String>,
    pub detected_source_type: FbxSourceType,
    /// Per-bone bind-pose world transform extracted from
    /// `Deformer::Cluster.TransformLink` — the ground-truth bone→world
    /// matrix used by mesh skinning. Empty if the FBX has no skin
    /// clusters (e.g. facial-only FBX). Column-major 4x4.
    pub bind_world: HashMap<String, Mat4>,
}

#[derive(Debug)]
pub struct FbxBone {
    pub parent: Option<String>,
    pub pre_rotation: Quat,
    pub rest_translation: Vec3,
    pub rest_rotation_euler: Vec3,
    pub rotation_order: u8,
}

#[derive(Debug, Clone)]
pub struct FbxBoneTrack {
    pub rotations: Vec<Quat>,
    pub translations: Vec<Vec3>,
}

/// Computed world-space bone positions per frame for visualization.
#[derive(Debug, Clone)]
pub struct FbxSkeletonFrames {
    pub frame_count: usize,
    pub duration: f32,
    /// bone_name → Vec of world positions per frame (Y-up, meters)
    pub bone_positions: HashMap<String, Vec<[f32; 3]>>,
    /// bone_name → Vec of world rotations per frame (Z-up, FBX native space)
    pub bone_rotations: HashMap<String, Vec<Quat>>,
    /// bone_name → parent_name
    pub hierarchy: HashMap<String, String>,
}

struct RawModel {
    id: i64,
    name: String,
    pre_rotation: Vec3,
    rest_translation: Vec3,
    rest_rotation: Vec3,
    rotation_order: u8,
}

struct RawAnimCurve {
    id: i64,
    key_times: Vec<f64>,
    key_values: Vec<f32>,
}

struct RawAnimCurveNode {
    id: i64,
}

struct RawDeformer {
    id: i64,
    name: String,
}

/// Raw skin-cluster data pulled from `Deformer` nodes of sub-type
/// `"Cluster"`. Each cluster binds one bone to part of a mesh. We only
/// care about `TransformLink` (bone→world bind pose); `Indexes`/`Weights`
/// are mesh skinning data which this crate does not consume.
struct RawCluster {
    id: i64,
    /// Column-major 4x4 bone→world bind pose matrix, as stored in FBX.
    transform_link: Option<Mat4>,
}

#[derive(Clone, Copy)]
enum CurveChannel {
    X,
    Y,
    Z,
}

#[derive(Clone, Copy)]
enum CurveProperty {
    Translation,
    Rotation,
}

pub fn parse(data: &[u8]) -> Result<SourceAsset, Error> {
    let cursor = Cursor::new(data);
    let reader = std::io::BufReader::new(cursor);

    let mut parser = match AnyParser::from_seekable_reader(reader)
        .map_err(|e| Error::Parse(format!("FBX header: {}", e)))?
    {
        AnyParser::V7400(p) => p,
        _ => return Err(Error::Parse("unsupported FBX version".into())),
    };

    let mut models: Vec<RawModel> = Vec::new();
    let mut anim_curves: Vec<RawAnimCurve> = Vec::new();
    let mut anim_curve_nodes: Vec<RawAnimCurveNode> = Vec::new();
    let mut deformers: Vec<RawDeformer> = Vec::new();
    let mut clusters: Vec<RawCluster> = Vec::new();

    let mut oo_connections: Vec<(i64, i64)> = Vec::new();
    let mut op_connections: Vec<(i64, i64, String)> = Vec::new();

    let mut creator: Option<String> = None;

    // Pull parser state
    let mut depth: i32 = 0;
    let mut top_section = String::new(); // "Objects", "Connections", etc.

    loop {
        match parser
            .next_event()
            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
        {
            Event::StartNode(node) => {
                depth += 1;
                let name = node.name().to_string();

                if depth == 1 {
                    // Top-level sections: just read name, auto-skip attrs
                    top_section = name;
                } else if depth == 2 && top_section == "FBXHeaderExtension" && name == "Creator" {
                    // Parse Creator string from FBXHeaderExtension
                    let mut attrs: Vec<AttributeValue> = Vec::new();
                    let mut r = node.attributes();
                    while let Ok(Some(a)) = r.load_next(DirectLoader) {
                        attrs.push(a);
                    }
                    if let Some(s) = attrs.first().and_then(|a| a.get_string()) {
                        creator = Some(s.to_string());
                    }
                } else if depth == 2 && top_section == "Objects" {
                    // Only load attrs for node types we care about
                    match name.as_str() {
                        "Model" | "AnimationCurve" | "AnimationCurveNode" | "Deformer" => {
                            let mut attrs: Vec<AttributeValue> = Vec::new();
                            let mut r = node.attributes();
                            while let Ok(Some(a)) = r.load_next(DirectLoader) {
                                attrs.push(a);
                            }
                            match name.as_str() {
                                "Model" => {
                                    if let Some(model) =
                                        parse_model_pull(&attrs, &mut parser, &mut depth)?
                                    {
                                        models.push(model);
                                    }
                                }
                                "AnimationCurve" => {
                                    if let Some(curve) =
                                        parse_anim_curve_pull(&attrs, &mut parser, &mut depth)?
                                    {
                                        anim_curves.push(curve);
                                    }
                                }
                                "AnimationCurveNode" => {
                                    let id = attrs.first().and_then(|a| a.get_i64()).unwrap_or(0);
                                    if id != 0 {
                                        anim_curve_nodes.push(RawAnimCurveNode { id });
                                    }
                                }
                                "Deformer" => {
                                    let id = attrs.first().and_then(|a| a.get_i64()).unwrap_or(0);
                                    let full_name = attrs
                                        .get(1)
                                        .and_then(|a| a.get_string())
                                        .unwrap_or("")
                                        .to_string();
                                    let obj_type =
                                        attrs.get(2).and_then(|a| a.get_string()).unwrap_or("");
                                    if obj_type == "BlendShapeChannel" && id != 0 {
                                        let short =
                                            full_name.split('\x00').next().unwrap_or(&full_name);
                                        let channel_name = if let Some(pos) = short.rfind('.') {
                                            short[pos + 1..].to_string()
                                        } else {
                                            short.to_string()
                                        };
                                        deformers.push(RawDeformer {
                                            id,
                                            name: channel_name,
                                        });
                                    } else if obj_type == "Cluster" && id != 0 {
                                        let transform_link =
                                            parse_cluster_pull(&mut parser, &mut depth)?;
                                        clusters.push(RawCluster { id, transform_link });
                                    }
                                }
                                _ => {}
                            }
                        }
                        _ => {
                            // Skip: don't load attrs for Geometry, Material, Texture, etc.
                            // fbxcel auto-seeks past unread attrs on next next_event() call
                        }
                    }
                } else if depth == 2 && top_section == "Connections" && name == "C" {

exec
/bin/zsh -lc 'rg --files crates/fbx_rig crates/cinev_retarget/src/bin assets/fbx' in /Users/deemooooooooo/Desktop/www/bevy-vrm
 exited 2 in 0ms:
rg: crates/cinev_retarget/src/bin: No such file or directory (os error 2)
assets/fbx/17857_M_AIStndWide_241204.fbx
assets/fbx/18479_F_AILimpRightFR_000000.fbx
assets/fbx/25_04206_F_AIStndMoveLocalFront25cm0to135_250808.fbx
assets/fbx/18271_F_AIDepressedID_000000.fbx
assets/fbx/18360_F_AIGracefulArmsSR_000000.fbx
assets/fbx/25_04604_M_AIStndMoveLocalFront75cm0to315_250822.fbx
assets/fbx/21353_F_AiHappy03C_241010.fbx
assets/fbx/19586_M_AISupermanSW_000000.fbx
assets/fbx/21566_M_AiFigureEightRun_250108.fbx
assets/fbx/FC_00078_F_SuddenFlutter_Anime.fbx
assets/fbx/21092_M_AiStndGangLegWideElbowBackFirmFace_241226.fbx
crates/fbx_rig/Cargo.toml
crates/fbx_rig/src/lib.rs

codex
`fbx_rig`는 직접 파싱 API를 노출하고 있고, 지정하신 `crates/cinev_retarget/src/bin` 경로는 현재 워크스페이스에 없습니다. 실제 크레이트 구조를 다시 확인해서 분석 bin을 어디에 두는 게 맞는지 좁히겠습니다.
exec
/bin/zsh -lc 'find crates -maxdepth 3 -type d | sort' in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
crates
crates/fbx_rig
crates/fbx_rig/src
crates/humanoid_retarget
crates/humanoid_retarget/examples
crates/humanoid_retarget/src
crates/humanoid_retarget/src/adapters
crates/humanoid_retarget/src/bin
crates/humanoid_retarget/src/postprocess
crates/humanoid_retarget/src/quality
crates/humanoid_retarget/target
crates/humanoid_retarget/target/debug
crates/humanoid_retarget/target/release
crates/humanoid_retarget/target/tmp
crates/humanoid_retarget/tests
crates/humanoid_retarget/tests/fixtures
crates/vrm0_compat
crates/vrm0_compat/src
crates/vrm2u_bevy
crates/vrm2u_bevy/.github
crates/vrm2u_bevy/.github/workflows
crates/vrm2u_bevy/docs
crates/vrm2u_bevy/examples
crates/vrm2u_bevy/src
crates/vrm2u_bevy/src/system_param
crates/vrm2u_bevy/src/vrm
crates/vrm2u_bevy/src/vrma

exec
/bin/zsh -lc "sed -n '1,220p' Cargo.toml" in /Users/deemooooooooo/Desktop/www/bevy-vrm
exec
/bin/zsh -lc "sed -n '261,520p' crates/fbx_rig/src/lib.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
[package]
name = "bevy-vrm"
version = "0.1.0"
edition = "2024"

[[bin]]
name = "bevy-vrm"
path = "src/main.rs"

[[bin]]
name = "analyze-fbx"
path = "src/bin/analyze_fbx.rs"

[[bin]]
name = "dump-vrm-transforms"
path = "src/bin/dump_vrm_transforms.rs"

[dependencies]
bevy = { version = "0.18", features = ["wayland", "bevy_dev_tools"] }
bevy_vrm1 = { path = "crates/vrm2u_bevy", package = "bevy_vrm1" }
bevy_panorbit_camera = "0.34"
bevy_file_dialog = "0.9"
directories = "6.0"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
humanoid_retarget = { path = "crates/humanoid_retarget" }

# Enable optimizations for all crates in dev builds
# (prevents stack overflow from debug-mode frame bloat in fbxcel/miniz_oxide)
[profile.dev]
opt-level = 2

[profile.dev.package."*"]
opt-level = 2

# fbxcel + zlib: opt-level 3 to prevent debug-mode stack frame bloat
# (miniz_oxide DecompressorOxide + fbxcel AttributeValue enums cause stack overflow in debug)
# Stack-heavy crates: opt-level 3 to prevent debug-mode stack frame bloat
# (miniz_oxide DecompressorOxide + fbxcel AttributeValue enums cause stack overflow in debug)
[profile.dev.package.fbxcel]
opt-level = 3
[profile.dev.package.miniz_oxide]
opt-level = 3
[profile.dev.package.flate2]
opt-level = 3
[profile.dev.package.humanoid_retarget]
opt-level = 3

 succeeded in 0ms:
                    let mut attrs: Vec<AttributeValue> = Vec::new();
                    let mut r = node.attributes();
                    while let Ok(Some(a)) = r.load_next(DirectLoader) {
                        attrs.push(a);
                    }
                    let conn_type = attrs.first().and_then(|a| a.get_string()).unwrap_or("");
                    let child_id = attrs.get(1).and_then(|a| a.get_i64()).unwrap_or(0);
                    let parent_id = attrs.get(2).and_then(|a| a.get_i64()).unwrap_or(0);

                    match conn_type {
                        "OO" => oo_connections.push((child_id, parent_id)),
                        "OP" => {
                            let prop = attrs
                                .get(3)
                                .and_then(|a| a.get_string())
                                .unwrap_or("")
                                .to_string();
                            op_connections.push((child_id, parent_id, prop));
                        }
                        _ => {}
                    }
                } else {
                    // All other nodes: auto-skip attrs (fbxcel seeks past on next_event)
                }
            }
            Event::EndNode => {
                depth -= 1;
            }
            Event::EndFbx(_) => break,
        }
    }

    // Build lookups
    let model_id_to_idx: HashMap<i64, usize> =
        models.iter().enumerate().map(|(i, m)| (m.id, i)).collect();

    let curve_id_map: HashMap<i64, usize> = anim_curves
        .iter()
        .enumerate()
        .map(|(i, c)| (c.id, i))
        .collect();

    let curve_node_ids: HashMap<i64, usize> = anim_curve_nodes
        .iter()
        .enumerate()
        .map(|(i, n)| (n.id, i))
        .collect();

    let deformer_id_map: HashMap<i64, usize> = deformers
        .iter()
        .enumerate()
        .map(|(i, d)| (d.id, i))
        .collect();

    // Bone parent hierarchy
    let mut bone_parents: HashMap<String, String> = HashMap::new();
    for &(child_id, parent_id) in &oo_connections {
        if let (Some(&ci), Some(&pi)) = (
            model_id_to_idx.get(&child_id),
            model_id_to_idx.get(&parent_id),
        ) {
            bone_parents.insert(models[ci].name.clone(), models[pi].name.clone());
        }
    }

    // Cluster → Model bind pose mapping.
    // In FBX, each skin Cluster is linked to its target bone (Model) via
    // an OO connection: the Model is the child, the Cluster is the parent.
    let cluster_id_map: HashMap<i64, usize> =
        clusters.iter().enumerate().map(|(i, c)| (c.id, i)).collect();
    let mut bind_world: HashMap<String, Mat4> = HashMap::new();
    for &(child_id, parent_id) in &oo_connections {
        if let (Some(&mi), Some(&ci)) = (
            model_id_to_idx.get(&child_id),
            cluster_id_map.get(&parent_id),
        ) && let Some(m) = clusters[ci].transform_link
        {
            bind_world.insert(models[mi].name.clone(), m);
        }
    }

    // AnimCurve → AnimCurveNode (OP: d|X, d|Y, d|Z, d|DeformPercent)
    let mut cn_curves: HashMap<i64, Vec<(CurveChannel, usize)>> = HashMap::new();
    let mut cn_deform_curves: HashMap<i64, Vec<usize>> = HashMap::new();
    for (child_id, parent_id, prop) in &op_connections {
        if let Some(&curve_idx) = curve_id_map.get(child_id)
            && curve_node_ids.contains_key(parent_id)
        {
            match prop.as_str() {
                "d|X" => {
                    cn_curves
                        .entry(*parent_id)
                        .or_default()
                        .push((CurveChannel::X, curve_idx));
                }
                "d|Y" => {
                    cn_curves
                        .entry(*parent_id)
                        .or_default()
                        .push((CurveChannel::Y, curve_idx));
                }
                "d|Z" => {
                    cn_curves
                        .entry(*parent_id)
                        .or_default()
                        .push((CurveChannel::Z, curve_idx));
                }
                "d|DeformPercent" => {
                    cn_deform_curves
                        .entry(*parent_id)
                        .or_default()
                        .push(curve_idx);
                }
                _ => {}
            }
        }
    }

    // AnimCurveNode → Model (OP: Lcl Translation/Rotation)
    let mut model_cn: HashMap<i64, Vec<(CurveProperty, i64)>> = HashMap::new();
    for (child_id, parent_id, prop) in &op_connections {
        if curve_node_ids.contains_key(child_id) && model_id_to_idx.contains_key(parent_id) {
            let cp = match prop.as_str() {
                "Lcl Translation" => CurveProperty::Translation,
                "Lcl Rotation" => CurveProperty::Rotation,
                _ => continue,
            };
            model_cn
                .entry(*parent_id)
                .or_default()
                .push((cp, *child_id));
        }
    }

    // BlendShape connections: AnimCurveNode → Deformer (OP: DeformPercent)
    // AnimCurve → AnimCurveNode (OO)
    let mut deformer_curve_nodes: HashMap<i64, Vec<i64>> = HashMap::new();
    for (child_id, parent_id, prop) in &op_connections {
        if prop == "DeformPercent"
            && curve_node_ids.contains_key(child_id)
            && deformer_id_map.contains_key(parent_id)
        {
            deformer_curve_nodes
                .entry(*parent_id)
                .or_default()
                .push(*child_id);
        }
    }

    // AnimCurve → AnimCurveNode (OO for blend shapes)
    let mut cn_to_curve_oo: HashMap<i64, Vec<usize>> = HashMap::new();
    for &(child_id, parent_id) in &oo_connections {
        if let Some(&curve_idx) = curve_id_map.get(&child_id)
            && curve_node_ids.contains_key(&parent_id)
        {
            cn_to_curve_oo.entry(parent_id).or_default().push(curve_idx);
        }
    }

    // Find global time range
    let mut min_time = f64::MAX;
    let mut max_time = f64::MIN;
    for curve in &anim_curves {
        for &t in &curve.key_times {
            let secs = t / FBX_TIME_UNIT;
            min_time = min_time.min(secs);
            max_time = max_time.max(secs);
        }
    }

    if min_time >= max_time {
        if deformers.is_empty() {
            return Err(Error::Parse("no animation data found".into()));
        }
        min_time = 0.0;
        max_time = 1.0;
    }

    let duration = (max_time - min_time) as f32;
    let frame_count = (duration * SAMPLE_RATE).ceil() as usize + 1;
    let sample_times: Vec<f64> = (0..frame_count)
        .map(|i| min_time + (i as f64 / SAMPLE_RATE as f64))
        .collect();

    // Build bones
    let mut bones: HashMap<String, FbxBone> = HashMap::new();
    for model in &models {
        bones.insert(
            model.name.clone(),
            FbxBone {
                parent: bone_parents.get(&model.name).cloned(),
                pre_rotation: euler_to_quat_xyz(model.pre_rotation),
                rest_translation: model.rest_translation,
                rest_rotation_euler: model.rest_rotation,
                rotation_order: model.rotation_order,
            },
        );
    }

    // Build animation tracks
    let mut tracks: HashMap<String, FbxBoneTrack> = HashMap::new();

    for model in &models {
        let cns = match model_cn.get(&model.id) {
            Some(cn) => cn,
            None => continue,
        };

        let mut rot_curves: [Option<&RawAnimCurve>; 3] = [None, None, None];
        let mut trans_curves: [Option<&RawAnimCurve>; 3] = [None, None, None];

        for &(cp, cn_id) in cns {
            if let Some(channels) = cn_curves.get(&cn_id) {
                for &(ch, idx) in channels {
                    let slot = match ch {
                        CurveChannel::X => 0,
                        CurveChannel::Y => 1,
                        CurveChannel::Z => 2,
                    };
                    match cp {
                        CurveProperty::Rotation => rot_curves[slot] = Some(&anim_curves[idx]),
                        CurveProperty::Translation => trans_curves[slot] = Some(&anim_curves[idx]),
                    }
                }
            }
        }

        let has_rot = rot_curves.iter().any(|c| c.is_some());
        let has_trans = trans_curves.iter().any(|c| c.is_some());

        if !has_rot && !has_trans {
            continue;
        }

        let mut rotations = Vec::with_capacity(frame_count);
        let mut translations = Vec::with_capacity(frame_count);

        for &t in &sample_times {
            if has_rot {
                let rx = sample_curve(rot_curves[0], t, model.rest_rotation.x as f64);
                let ry = sample_curve(rot_curves[1], t, model.rest_rotation.y as f64);
                let rz = sample_curve(rot_curves[2], t, model.rest_rotation.z as f64);
                rotations.push(euler_to_quat(
                    Vec3::new(rx as f32, ry as f32, rz as f32),
                    model.rotation_order,
                ));
            }

            if has_trans {
                let tx = sample_curve(trans_curves[0], t, model.rest_translation.x as f64);
                let ty = sample_curve(trans_curves[1], t, model.rest_translation.y as f64);
                let tz = sample_curve(trans_curves[2], t, model.rest_translation.z as f64);
                translations.push(Vec3::new(tx as f32, ty as f32, tz as f32));
            }
        }

        if !has_rot {
            let rest = euler_to_quat(model.rest_rotation, model.rotation_order);
            rotations = vec![rest; frame_count];
        }

codex
크레이트 구조상 분석용 bin 후보는 `crates/humanoid_retarget/src/bin` 또는 루트 `src/bin` 쪽입니다. 이제 `fbx_rig`가 프레임 샘플과 스켈레톤 월드 포즈까지 어디까지 계산해주는지, 기존 분석 bin이 재사용 가능한지 확인하겠습니다.
exec
/bin/zsh -lc "sed -n '521,980p' crates/fbx_rig/src/lib.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
        if !has_trans {
            translations = vec![model.rest_translation; frame_count];
        }

        // Quaternion continuity: hemisphere check for all bones,
        // plus adaptive outlier inpainting for hand bones only.
        // Hand bones suffer same-hemisphere gimbal spikes in AI-generated
        // FBX (standing idle: 10-18° spikes over 3-5 frames). Global
        // outlier filter was tried but clips legitimate fast arm motion
        // in other animations. Hand-only targeting avoids that.
        ensure_quat_continuity(&mut rotations);
        let lower_name = model.name.to_lowercase();
        if lower_name.contains("hand") && !lower_name.contains("index")
            && !lower_name.contains("middle") && !lower_name.contains("ring")
            && !lower_name.contains("pinky") && !lower_name.contains("thumb")
        {
            inpaint_outliers(&mut rotations);
        }

        tracks.insert(
            model.name.clone(),
            FbxBoneTrack {
                rotations,
                translations,
            },
        );
    }

    // Build blend shape tracks
    let mut blend_shape_tracks: HashMap<String, Vec<f32>> = HashMap::new();
    for deformer in &deformers {
        let cn_ids = match deformer_curve_nodes.get(&deformer.id) {
            Some(ids) => ids,
            None => continue,
        };

        let mut weight_curve: Option<&RawAnimCurve> = None;
        for &cn_id in cn_ids {
            if let Some(curve_indices) = cn_deform_curves.get(&cn_id)
                && let Some(&idx) = curve_indices.first()
            {
                weight_curve = Some(&anim_curves[idx]);
                break;
            }
            if let Some(curve_indices) = cn_to_curve_oo.get(&cn_id)
                && let Some(&idx) = curve_indices.first()
            {
                weight_curve = Some(&anim_curves[idx]);
                break;
            }
            if let Some(channels) = cn_curves.get(&cn_id) {
                if let Some(&(_, idx)) = channels.iter().next() {
                    weight_curve = Some(&anim_curves[idx]);
                }
                if weight_curve.is_some() {
                    break;
                }
            }
        }

        if let Some(curve) = weight_curve {
            let weights: Vec<f32> = sample_times
                .iter()
                .map(|&t| {
                    let v = sample_curve(Some(curve), t, 0.0) as f32;
                    (v / 100.0).clamp(0.0, 1.0)
                })
                .collect();
            blend_shape_tracks.insert(deformer.name.clone(), weights);
        }
    }

    let detected_source_type = detect_source_type(creator.as_deref(), &bones);

    Ok(SourceAsset {
        bones,
        tracks,
        blend_shape_tracks,
        duration,
        frame_count,
        creator,
        detected_source_type,
        bind_world,
    })
}

fn detect_source_type(
    creator: Option<&str>,
    bones: &HashMap<String, FbxBone>,
) -> FbxSourceType {
    if let Some(c) = creator {
        if c.contains("Blender") {
            return FbxSourceType::Blender;
        }
        if c.contains("Maya") || c.contains("FBX SDK") {
            return FbxSourceType::Maya;
        }
    }
    // Fallback: if all PreRotations are identity → Blender (Blender doesn't use PreRotation)
    let total = bones.len();
    if total == 0 {
        return FbxSourceType::Auto;
    }
    let identity_count = bones
        .values()
        .filter(|b| {
            b.pre_rotation.x.abs() < 0.001
                && b.pre_rotation.y.abs() < 0.001
                && b.pre_rotation.z.abs() < 0.001
                && b.pre_rotation.w.abs() > 0.999
        })
        .count();
    if identity_count == total {
        FbxSourceType::Blender
    } else {
        FbxSourceType::Maya
    }
}

fn parse_model_pull(
    attrs: &[AttributeValue],
    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
    depth: &mut i32,
) -> Result<Option<RawModel>, Error> {
    let id = match attrs.first().and_then(|a| a.get_i64()) {
        Some(id) => id,
        None => {
            skip_children(parser, depth)?;
            return Ok(None);
        }
    };
    let full_name = attrs
        .get(1)
        .and_then(|a| a.get_string())
        .unwrap_or("")
        .to_string();
    let name = full_name
        .split('\x00')
        .next()
        .unwrap_or(&full_name)
        .to_string();

    let mut pre_rotation = Vec3::ZERO;
    let mut rest_translation = Vec3::ZERO;
    let mut rest_rotation = Vec3::ZERO;
    let mut rotation_order: u8 = 0;

    let model_depth = *depth;
    loop {
        match parser
            .next_event()
            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
        {
            Event::StartNode(node) => {
                *depth += 1;
                let child_name = node.name().to_string();
                let mut child_attrs: Vec<AttributeValue> = Vec::new();
                let mut child_reader = node.attributes();
                while let Ok(Some(a)) = child_reader.load_next(DirectLoader) {
                    child_attrs.push(a);
                }

                if child_name == "Properties70" && *depth == model_depth + 1 {
                    parse_properties70(
                        parser,
                        depth,
                        &mut pre_rotation,
                        &mut rest_translation,
                        &mut rest_rotation,
                        &mut rotation_order,
                    )?;
                }
            }
            Event::EndNode => {
                *depth -= 1;
                if *depth < model_depth {
                    break;
                }
            }
            Event::EndFbx(_) => break,
        }
    }

    Ok(Some(RawModel {
        id,
        name,
        pre_rotation,
        rest_translation,
        rest_rotation,
        rotation_order,
    }))
}

/// Parse the children of a `Deformer` of sub-type `"Cluster"`, returning
/// its `TransformLink` matrix if present. Consumes all child nodes until
/// the Cluster's `EndNode`.
///
/// FBX stores the matrix as a 16-element `f64` array on a child node
/// named `TransformLink`. Some files put it as a direct attribute of
/// that node; others nest it under a child named `a`. We probe both.
fn parse_cluster_pull(
    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
    depth: &mut i32,
) -> Result<Option<Mat4>, Error> {
    let cluster_depth = *depth;
    let mut transform_link: Option<Mat4> = None;

    loop {
        match parser
            .next_event()
            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
        {
            Event::StartNode(node) => {
                *depth += 1;
                let child_name = node.name().to_string();
                let mut child_attrs: Vec<AttributeValue> = Vec::new();
                let mut reader = node.attributes();
                while let Ok(Some(a)) = reader.load_next(DirectLoader) {
                    child_attrs.push(a);
                }

                if child_name == "TransformLink" {
                    // Try direct attribute first (some writers put array inline).
                    transform_link = child_attrs
                        .first()
                        .and_then(|a| a.get_arr_f64())
                        .and_then(|arr| mat4_from_f64_slice(arr));
                    // If that fails, fall through and let nested "a" child handle it.
                }
            }
            Event::EndNode => {
                *depth -= 1;
                if *depth < cluster_depth {
                    break;
                }
            }
            Event::EndFbx(_) => break,
        }
    }

    Ok(transform_link)
}

/// Convert a 16-element `f64` slice to a glam `Mat4`. FBX stores matrix
/// arrays in column-major order, matching glam's default layout.
fn mat4_from_f64_slice(arr: &[f64]) -> Option<Mat4> {
    if arr.len() != 16 {
        return None;
    }
    let mut cols = [0.0f32; 16];
    for i in 0..16 {
        cols[i] = arr[i] as f32;
    }
    Some(Mat4::from_cols_array(&cols))
}

fn parse_properties70(
    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
    depth: &mut i32,
    pre_rotation: &mut Vec3,
    rest_translation: &mut Vec3,
    rest_rotation: &mut Vec3,
    rotation_order: &mut u8,
) -> Result<(), Error> {
    let props_depth = *depth;
    loop {
        match parser
            .next_event()
            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
        {
            Event::StartNode(node) => {
                *depth += 1;
                let pname = node.name().to_string();
                if pname == "P" {
                    let mut pa: Vec<AttributeValue> = Vec::new();
                    let mut reader = node.attributes();
                    while let Ok(Some(a)) = reader.load_next(DirectLoader) {
                        pa.push(a);
                    }

                    let prop_name = pa.first().and_then(|a| a.get_string()).unwrap_or("");
                    match prop_name {
                        "PreRotation" => *pre_rotation = extract_vec3(&pa, 4),
                        "Lcl Translation" => *rest_translation = extract_vec3(&pa, 4),
                        "Lcl Rotation" => *rest_rotation = extract_vec3(&pa, 4),
                        "RotationOrder" => {
                            *rotation_order =
                                pa.get(4).and_then(|a| a.get_i32()).unwrap_or(0) as u8;
                        }
                        _ => {}
                    }
                } else {
                    let mut reader = node.attributes();
                    while let Ok(Some(_)) = reader.load_next(DirectLoader) {}
                }
            }
            Event::EndNode => {
                *depth -= 1;
                if *depth < props_depth {
                    break;
                }
            }
            Event::EndFbx(_) => break,
        }
    }
    Ok(())
}

fn parse_anim_curve_pull(
    attrs: &[AttributeValue],
    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
    depth: &mut i32,
) -> Result<Option<RawAnimCurve>, Error> {
    let id = match attrs.first().and_then(|a| a.get_i64()) {
        Some(id) => id,
        None => {
            skip_children(parser, depth)?;
            return Ok(None);
        }
    };

    let mut key_times: Vec<f64> = Vec::new();
    let mut key_values: Vec<f32> = Vec::new();

    let curve_depth = *depth;
    loop {
        match parser
            .next_event()
            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
        {
            Event::StartNode(node) => {
                *depth += 1;
                let child_name = node.name().to_string();
                let mut child_attrs: Vec<AttributeValue> = Vec::new();
                let mut reader = node.attributes();
                while let Ok(Some(a)) = reader.load_next(DirectLoader) {
                    child_attrs.push(a);
                }

                match child_name.as_str() {
                    "KeyTime" => {
                        if let Some(arr) = child_attrs.first().and_then(|a| a.get_arr_i64()) {
                            key_times = arr.iter().map(|&t| t as f64).collect();
                        }
                    }
                    "KeyValueFloat" => {
                        if let Some(arr) = child_attrs.first().and_then(|a| a.get_arr_f32()) {
                            key_values = arr.to_vec();
                        }
                        if key_values.is_empty()
                            && let Some(arr) = child_attrs.first().and_then(|a| a.get_arr_f64())
                        {
                            key_values = arr.iter().map(|&v| v as f32).collect();
                        }
                    }
                    _ => {}
                }
            }
            Event::EndNode => {
                *depth -= 1;
                if *depth < curve_depth {
                    break;
                }
            }
            Event::EndFbx(_) => break,
        }
    }

    if key_times.is_empty() || key_values.is_empty() {
        return Ok(None);
    }

    Ok(Some(RawAnimCurve {
        id,
        key_times,
        key_values,
    }))
}

fn skip_children(
    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
    depth: &mut i32,
) -> Result<(), Error> {
    let target_depth = *depth - 1;
    loop {
        match parser
            .next_event()
            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
        {
            Event::StartNode(node) => {
                *depth += 1;
                let mut reader = node.attributes();
                while let Ok(Some(_)) = reader.load_next(DirectLoader) {}
            }
            Event::EndNode => {
                *depth -= 1;
                if *depth <= target_depth {
                    break;
                }
            }
            Event::EndFbx(_) => break,
        }
    }
    Ok(())
}

fn sample_curve(curve: Option<&RawAnimCurve>, t_secs: f64, default: f64) -> f64 {
    let curve = match curve {
        Some(c) => c,
        None => return default,
    };

    let t = t_secs * FBX_TIME_UNIT;

    if curve.key_times.is_empty() {
        return default;
    }
    if t <= curve.key_times[0] {
        return curve.key_values[0] as f64;
    }
    let last = curve.key_times.len() - 1;
    if t >= curve.key_times[last] {
        return curve.key_values[last] as f64;
    }

    let mut lo = 0;
    let mut hi = last;
    while lo < hi - 1 {
        let mid = (lo + hi) / 2;
        if curve.key_times[mid] <= t {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    let t0 = curve.key_times[lo];
    let t1 = curve.key_times[hi];
    let v0 = curve.key_values[lo] as f64;
    let v1 = curve.key_values[hi] as f64;

    let alpha = if (t1 - t0).abs() > f64::EPSILON {
        (t - t0) / (t1 - t0)
    } else {
        0.0
    };

    v0 + (v1 - v0) * alpha
}

/// Convert FBX Euler angles to quaternion.
///
/// FBX intrinsic XYZ means: apply X rotation first, then Y, then Z.
/// glam's from_euler(XYZ, a, b, c) creates Qx(a)*Qy(b)*Qz(c), which
/// applies Z first, Y second, X last (opposite order).
///
/// Fix: FBX intrinsic XYZ → glam ZYX(z,y,x) to get correct application order.
pub fn euler_to_quat(degrees: Vec3, order: u8) -> Quat {
    let r = degrees * (std::f32::consts::PI / 180.0);
    match order {

exec
/bin/zsh -lc "ls -la src/bin && rg -n \"fbx|analy|rest|frame 0|pre_rotation|bind_world|tracks|parse\\(\" src/bin src -S" in /Users/deemooooooooo/Desktop/www/bevy-vrm
exec
/bin/zsh -lc "ls -la crates/humanoid_retarget/src/bin && rg -n \"fbx|analy|rest|frame 0|pre_rotation|bind_world|tracks|parse\\(\" crates/humanoid_retarget/src/bin crates/humanoid_retarget/src crates/fbx_rig -S" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
total 48
drwxr-xr-x@  4 deemooooooooo  staff    128 Apr 13 08:40 .
drwxr-xr-x@ 18 deemooooooooo  staff    576 Apr 14 08:15 ..
-rw-r--r--@  1 deemooooooooo  staff   8047 Apr 13 08:40 analyze_fbx.rs
-rw-r--r--@  1 deemooooooooo  staff  16143 Apr 13 08:40 dump_vrm_transforms.rs
src/setup.rs:76:    log.push("[INIT] O:VRM F:body-FBX Shift+F:facial-FBX G:bones 1-4:cam F3:stats F4:log F5:retarget-debug F6:pure-fk T:timeline Space:pause ←→:frame");
src/setup.rs:137:    // --- Timeline bar (bottom of screen) — 3 tracks ---
src/setup.rs:254:    // Auto-load VRM and FBX for quick iteration
src/setup.rs:259:                let (bindings, rest_data) = load_vrm_resources(&file_bytes);
src/setup.rs:267:                if let Some(rest_data) = rest_data {
src/setup.rs:268:                    let (l, r) = rest_data.foot_sole_offset;
src/setup.rs:272:                    commands.insert_resource(rest_data);
src/setup.rs:290:pub(crate) fn auto_load_fbx(
src/setup.rs:307:    // --- Auto-load body FBX (bone animation slot) ---
src/setup.rs:308:    let body_fbx_path = &p.auto_load.body_fbx;
src/setup.rs:309:    if !body_fbx_path.is_empty() {
src/setup.rs:310:        if let Ok(fbx_bytes) = fs::read(body_fbx_path) {
src/setup.rs:312:                "[AUTO-BODY] FBX: {} ({:.1} MB)",
src/setup.rs:313:                body_fbx_path,
src/setup.rs:314:                fbx_bytes.len() as f64 / 1048576.0
src/setup.rs:319:                .name("fbx-auto-body".to_string())
src/setup.rs:322:                    let fbx = humanoid_retarget::fbx::parse(&fbx_bytes).map_err(|e| e.to_string())?;
src/setup.rs:325:                    let anim = humanoid_retarget::mapping::retarget(&fbx, &config, vrm_version)
src/setup.rs:327:                    let has_bone_anim = fbx.tracks.values().any(|t| t.rotations.len() > 1);
src/setup.rs:330:                            humanoid_retarget::compute_fbx_skeleton_from_parsed(&fbx)
src/setup.rs:338:                .expect("spawn fbx-auto-body")
src/setup.rs:340:                .expect("fbx-auto-body panicked");
src/setup.rs:344:                    let bone_count = anim.bone_tracks.len();
src/setup.rs:346:                        .bone_tracks
src/setup.rs:351:                        "[AUTO-BODY] {} bone tracks, {:.1}s",
src/setup.rs:356:                    timeline.body_filename = body_fbx_path
src/setup.rs:369:                        commands.insert_resource(FbxSkeletonViz { data: skel });
src/setup.rs:377:                body_fbx_path
src/setup.rs:382:    // --- Auto-load facial FBX (expression animation slot) ---
src/setup.rs:383:    let facial_fbx_path = &p.auto_load.facial_fbx;
src/setup.rs:384:    if !facial_fbx_path.is_empty() {
src/setup.rs:385:        if let Ok(fbx_bytes) = fs::read(facial_fbx_path) {
src/setup.rs:387:                "[AUTO-FACIAL] FBX: {} ({:.1} MB)",
src/setup.rs:388:                facial_fbx_path,
src/setup.rs:389:                fbx_bytes.len() as f64 / 1048576.0
src/setup.rs:394:                .name("fbx-auto-facial".to_string())
src/setup.rs:397:                    let fbx = humanoid_retarget::fbx::parse(&fbx_bytes).map_err(|e| e.to_string())?;
src/setup.rs:400:                    let anim = humanoid_retarget::mapping::retarget(&fbx, &config, vrm_version)
src/setup.rs:404:                .expect("spawn fbx-auto-facial")
src/setup.rs:406:                .expect("fbx-auto-facial panicked");
src/setup.rs:410:                    let expr_count = anim.expression_tracks.len();
src/setup.rs:412:                        .expression_tracks
src/setup.rs:418:                            "[AUTO-FACIAL] {} expression tracks, {:.1}s",
src/setup.rs:422:                            tracks: std::mem::take(&mut anim.expression_tracks),
src/setup.rs:427:                        timeline.facial_filename = facial_fbx_path
src/setup.rs:433:                        log.push("[AUTO-FACIAL] no expression tracks found");
src/setup.rs:441:                facial_fbx_path
src/bin/analyze_fbx.rs:1://! FBX animation analyzer — pelvis, root, arm rotation/translation diagnostics
src/bin/analyze_fbx.rs:8:        eprintln!("Usage: analyze_fbx <path.fbx>");
src/bin/analyze_fbx.rs:12:    let data = fs::read(&path).expect("Failed to read FBX file");
src/bin/analyze_fbx.rs:13:    let fbx_data = humanoid_retarget::fbx::parse(&data).expect("Failed to parse FBX");
src/bin/analyze_fbx.rs:15:    println!("=== FBX Analysis: {} ===", path);
src/bin/analyze_fbx.rs:18:        fbx_data.duration, fbx_data.frame_count
src/bin/analyze_fbx.rs:21:    // Analyze these bones
src/bin/analyze_fbx.rs:28:    for (name, bone) in &fbx_data.bones {
src/bin/analyze_fbx.rs:40:        bones: &std::collections::HashMap<String, humanoid_retarget::fbx::FbxBone>,
src/bin/analyze_fbx.rs:42:        tracks: &std::collections::HashMap<String, humanoid_retarget::fbx::FbxBoneTrack>,
src/bin/analyze_fbx.rs:48:            .map(|b| b.pre_rotation.to_axis_angle().1.to_degrees())
src/bin/analyze_fbx.rs:50:        let lcl_rest = bone
src/bin/analyze_fbx.rs:52:                humanoid_retarget::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order)
src/bin/analyze_fbx.rs:58:        let has_anim = tracks.contains_key(name);
src/bin/analyze_fbx.rs:59:        let trans = bone.map(|b| b.rest_translation).unwrap_or_default();
src/bin/analyze_fbx.rs:61:            "{}{} | PreRot={:.1}° LclRest={:.1}° trans=({:.1},{:.1},{:.1}) {}",
src/bin/analyze_fbx.rs:65:            lcl_rest,
src/bin/analyze_fbx.rs:75:                print_tree(kid, bones, children, tracks, depth + 1);
src/bin/analyze_fbx.rs:80:        print_tree(root, &fbx_data.bones, &children_map, &fbx_data.tracks, 0);
src/bin/analyze_fbx.rs:84:    let targets: Vec<&str> = Vec::new(); // skip per-bone analysis
src/bin/analyze_fbx.rs:87:        let bone = match fbx_data.bones.get(*bone_name) {
src/bin/analyze_fbx.rs:96:            bone.pre_rotation.x,
src/bin/analyze_fbx.rs:97:            bone.pre_rotation.y,
src/bin/analyze_fbx.rs:98:            bone.pre_rotation.z,
src/bin/analyze_fbx.rs:99:            bone.pre_rotation.w,
src/bin/analyze_fbx.rs:100:            bone.pre_rotation.to_axis_angle().1.to_degrees()
src/bin/analyze_fbx.rs:103:            "  rest_rotation_euler: ({:.2},{:.2},{:.2})",
src/bin/analyze_fbx.rs:104:            bone.rest_rotation_euler.x, bone.rest_rotation_euler.y, bone.rest_rotation_euler.z
src/bin/analyze_fbx.rs:107:            "  rest_translation: ({:.2},{:.2},{:.2})",
src/bin/analyze_fbx.rs:108:            bone.rest_translation.x, bone.rest_translation.y, bone.rest_translation.z
src/bin/analyze_fbx.rs:112:        // Compute full local rest = PreRot * euler_to_quat(rest_rotation)
src/bin/analyze_fbx.rs:113:        let lcl_rest =
src/bin/analyze_fbx.rs:114:            humanoid_retarget::fbx::euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
src/bin/analyze_fbx.rs:115:        let full_local = bone.pre_rotation * lcl_rest;
src/bin/analyze_fbx.rs:117:            "  Lcl_Rot_rest(quat): ({:.4},{:.4},{:.4},{:.4}) angle={:.1}°",
src/bin/analyze_fbx.rs:118:            lcl_rest.x,
src/bin/analyze_fbx.rs:119:            lcl_rest.y,
src/bin/analyze_fbx.rs:120:            lcl_rest.z,
src/bin/analyze_fbx.rs:121:            lcl_rest.w,
src/bin/analyze_fbx.rs:122:            lcl_rest.to_axis_angle().1.to_degrees()
src/bin/analyze_fbx.rs:125:            "  full_local_rest: ({:.4},{:.4},{:.4},{:.4}) angle={:.1}°",
src/bin/analyze_fbx.rs:133:        if let Some(track) = fbx_data.tracks.get(*bone_name) {
src/bin/analyze_fbx.rs:140:            // Rotation analysis
src/bin/analyze_fbx.rs:145:            // Delta from rest
src/bin/analyze_fbx.rs:160:                // Delta = difference from rest Lcl Rotation
src/bin/analyze_fbx.rs:161:                let delta_from_rest: Quat = lcl_rest.inverse() * q;
src/bin/analyze_fbx.rs:162:                let d = delta_from_rest.to_axis_angle().1.to_degrees().abs();
src/bin/analyze_fbx.rs:174:                "  Delta from rest range: max={:.1}° (frame {})",
src/bin/analyze_fbx.rs:184:                    let delta_from_rest: Quat = lcl_rest.inverse() * q;
src/bin/analyze_fbx.rs:185:                    let d_angle = delta_from_rest.to_axis_angle().1.to_degrees();
src/bin/analyze_fbx.rs:188:                        "    frame[{}]: angle={:.1}° delta_from_rest={:.1}° axis=({:.3},{:.3},{:.3})",
src/bin/analyze_fbx.rs:194:            // Translation analysis
src/bin/analyze_fbx.rs:195:            let rest_t = bone.rest_translation;
src/bin/analyze_fbx.rs:199:                let delta = (*t - rest_t).length();
src/bin/analyze_fbx.rs:210:                println!("    rest=({:.1},{:.1},{:.1})", rest_t.x, rest_t.y, rest_t.z);
src/calibration.rs:1://! Keyboard-driven per-bone rest calibration.
src/calibration.rs:4://!   - All VRM bones freeze to their RestTransform (T-pose baseline)
src/calibration.rs:56:    /// Freeze to RestTransform (T-pose). User deltas applied on top.
src/calibration.rs:289:/// - `TPose` mode: freeze all bones to RestTransform, compose user
src/calibration.rs:296:    mut q: Query<(&VrmBone, &mut Transform, &RestTransform)>,
src/calibration.rs:301:            for (vb, mut tf, rest) in q.iter_mut() {
src/calibration.rs:307:                tf.rotation = (rest.0.rotation * user_rot).normalize();
src/main.rs:79:                .with_load_file::<FbxLoad>()
src/main.rs:80:                .with_load_file::<FacialFbxLoad>(),
src/main.rs:92:        .add_systems(Startup, (setup::setup, setup::auto_load_fbx))
src/main.rs:105:                    preset::load_preset_fbx,
src/main.rs:107:                    file_loading::handle_fbx_loaded,
src/main.rs:108:                    file_loading::handle_facial_fbx_loaded,
src/main.rs:115:                // Flush deferred commands (entity spawn/despawn, FbxSkeletonViz insert)
src/debug.rs:42:/// Per-frame retarget debug: compare FBX source vs VRM result per bone
src/debug.rs:48:    fbx_viz: Option<Res<FbxSkeletonViz>>,
src/debug.rs:59:    let Some(ref fbx_viz) = fbx_viz else {
src/debug.rs:60:        **text = "[RETARGET-DBG] no FBX skeleton loaded".to_string();
src/debug.rs:63:    let skel = &fbx_viz.data;
src/debug.rs:96:        let fbx_name = retarget_state.vrm_to_fbx.get(vrm_name);
src/debug.rs:98:        let fbx_pos = fbx_name
src/debug.rs:103:        match (vrm_pos, fbx_pos) {
src/debug.rs:126:                    "{}: vrm=({:.3},{:.3},{:.3}) fbx=({:.3},{:.3},{:.3}) delta=({:+.3},{:+.3},{:+.3}) {:.3}m {}",
src/debug.rs:142:    // Compare key bones: FBX world rotation (Y-up) vs VRM world rotation
src/debug.rs:143:    // FBX names resolved from retarget mapping (data-driven)
src/debug.rs:165:        let fbx_name = match retarget_state.vrm_to_fbx.get(vrm_name) {
src/debug.rs:173:        // FBX world rotation (Z-up → Y-up)
src/debug.rs:174:        let fbx_rot = skel
src/debug.rs:176:            .get(fbx_name)
src/debug.rs:180:        // FBX world position (already Y-up)
src/debug.rs:181:        let fbx_pos = skel
src/debug.rs:183:            .get(fbx_name)
src/debug.rs:187:        let rot_diff = match (vrm_rot, fbx_rot) {
src/debug.rs:195:        let pos_diff = match (vrm_pos, fbx_pos) {
src/debug.rs:215:        let fbx_euler = fbx_rot
src/debug.rs:228:            "{:<16} rot_d={:<6} pos_d={:<20} vrm={:<16} fbx={}",
src/debug.rs:229:            vrm_name, rot_diff, pos_diff, vrm_euler, fbx_euler,
src/debug.rs:234:    let fbx_hips_key_dbg = retarget_state
src/debug.rs:235:        .vrm_to_fbx
src/debug.rs:239:    let fbx_hips_h = skel
src/debug.rs:241:        .get(fbx_hips_key_dbg)
src/debug.rs:246:    let scale = if fbx_hips_h > 0.01 {
src/debug.rs:247:        vrm_hips_h / fbx_hips_h
src/debug.rs:252:        "scale={:.3} (vrm_hips_y={:.3} fbx_pelvis_y={:.3})",
src/debug.rs:253:        scale, vrm_hips_h, fbx_hips_h
src/debug.rs:269:            let fbx_name = retarget_state.vrm_to_fbx.get(vrm_name);
src/debug.rs:271:            let fbx_pos = fbx_name
src/debug.rs:275:            if let (Some(vp), Some(fp)) = (vrm_pos, fbx_pos) {
src/paths.rs:27:    pub body_fbx: String,
src/paths.rs:28:    pub facial_fbx: String,
src/paths.rs:41:    pub fbx: String,
src/expression.rs:20:    if expr_state.tracks.is_empty() || expr_state.frame_count == 0 {
src/expression.rs:43:        for track in expr_state.tracks.iter() {
src/expression.rs:99:            for track in expr_state.tracks.iter() {
src/resource.rs:12:pub(crate) struct FbxLoad;
src/resource.rs:13:pub(crate) struct FacialFbxLoad;
src/resource.rs:18:/// Consolidated VRM rest pose data extracted from GLB at load time.
src/resource.rs:19:/// Combines foot sole offset, foot contact data, and VRM rest pose.
src/resource.rs:21:pub(crate) struct VrmRestData {
src/resource.rs:24:    /// VrmRestPose extracted directly from GLB (authoritative source).
src/resource.rs:26:    pub rest_pose: humanoid_retarget::VrmRestPose,
src/resource.rs:29:/// Load VRM expression bindings + rest pose data from VRM file bytes.
src/resource.rs:30:/// For VRM 0.x: converts to 1.0 first, then extracts rest pose from converted bytes.
src/resource.rs:31:/// Returns (expression_bindings, vrm_rest_data) — either may be present independently.
src/resource.rs:34:) -> (Option<VrmExpressionBindings>, Option<VrmRestData>) {
src/resource.rs:46:    // VRM 0.x: convert to 1.0 first, then extract rest pose from converted bytes.
src/resource.rs:47:    // This ensures rest pose matches what bevy_vrm1 loads (same conversion pipeline).
src/resource.rs:49:    let rest_data = if is_vrm0 {
src/resource.rs:53:                humanoid_retarget::vrm_rest::extract_vrm_rest_pose(&converted).ok()
src/resource.rs:55:            .map(|vrm_rest| VrmRestData {
src/resource.rs:56:                foot_sole_offset: vrm_rest.foot_sole_offset,
src/resource.rs:57:                rest_pose: vrm_rest,
src/resource.rs:60:        humanoid_retarget::vrm_rest::extract_vrm_rest_pose(file_bytes)
src/resource.rs:62:            .map(|vrm_rest| VrmRestData {
src/resource.rs:63:                foot_sole_offset: vrm_rest.foot_sole_offset,
src/resource.rs:64:                rest_pose: vrm_rest,
src/resource.rs:68:    (bindings, rest_data)
src/resource.rs:122:    /// VRM bone name → resolved FBX bone name (with prefix)
src/resource.rs:123:    pub vrm_to_fbx: HashMap<String, String>,
src/resource.rs:124:    /// ARP→VRM full-body rest alignment adapter. ON by default for testing.
src/resource.rs:126:    pub arp_vrm_rest_align_adapter: bool,
src/resource.rs:135:            vrm_to_fbx: HashMap::new(),
src/resource.rs:136:            arp_vrm_rest_align_adapter: true,
src/resource.rs:143:    pub tracks: Vec<humanoid_retarget::ExpressionTrack>,
src/resource.rs:249:pub(crate) struct FbxSkeletonViz {
src/resource.rs:250:    pub data: humanoid_retarget::FbxSkeletonFrames,
src/resource.rs:285:/// Pending preset load — VRM path + FBX path to load together
src/resource.rs:287:pub(crate) struct PendingPresetFbx(pub String, pub String); // (fbx_path, config_hint: "female" or "male")
src/component.rs:67:pub(crate) struct FbxBoneLabel {
src/component.rs:68:    pub fbx_bone_name: String,
src/bin/dump_vrm_transforms.rs:7://! `humanoid_retarget::extract_vrm_rest_pose` so the diff is a single output.
src/bin/dump_vrm_transforms.rs:27:use humanoid_retarget::vrm_rest::extract_vrm_rest_pose;
src/bin/dump_vrm_transforms.rs:162:    let rest = match extract_vrm_rest_pose(data) {
src/bin/dump_vrm_transforms.rs:165:            eprintln!("ERROR: extract_vrm_rest_pose failed: {:?}", e);
src/bin/dump_vrm_transforms.rs:173:    let mut source_names: Vec<&String> = rest
src/bin/dump_vrm_transforms.rs:174:        .bone_rest_translation
src/bin/dump_vrm_transforms.rs:180:        let t = rest.bone_rest_translation.get(*name).copied().unwrap_or(Vec3::ZERO);
src/bin/dump_vrm_transforms.rs:181:        let r_local = rest
src/bin/dump_vrm_transforms.rs:182:            .bone_rest_local
src/bin/analyze_fbx.rs:1://! FBX animation analyzer — pelvis, root, arm rotation/translation diagnostics
src/bin/analyze_fbx.rs:8:        eprintln!("Usage: analyze_fbx <path.fbx>");
src/bin/analyze_fbx.rs:12:    let data = fs::read(&path).expect("Failed to read FBX file");
src/bin/analyze_fbx.rs:13:    let fbx_data = humanoid_retarget::fbx::parse(&data).expect("Failed to parse FBX");
src/bin/analyze_fbx.rs:15:    println!("=== FBX Analysis: {} ===", path);
src/bin/analyze_fbx.rs:18:        fbx_data.duration, fbx_data.frame_count
src/bin/analyze_fbx.rs:21:    // Analyze these bones
src/bin/analyze_fbx.rs:28:    for (name, bone) in &fbx_data.bones {
src/bin/analyze_fbx.rs:40:        bones: &std::collections::HashMap<String, humanoid_retarget::fbx::FbxBone>,
src/bin/analyze_fbx.rs:42:        tracks: &std::collections::HashMap<String, humanoid_retarget::fbx::FbxBoneTrack>,
src/bin/analyze_fbx.rs:48:            .map(|b| b.pre_rotation.to_axis_angle().1.to_degrees())
src/bin/analyze_fbx.rs:50:        let lcl_rest = bone
src/bin/analyze_fbx.rs:52:                humanoid_retarget::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order)
src/bin/analyze_fbx.rs:58:        let has_anim = tracks.contains_key(name);
src/bin/analyze_fbx.rs:59:        let trans = bone.map(|b| b.rest_translation).unwrap_or_default();
src/bin/analyze_fbx.rs:61:            "{}{} | PreRot={:.1}° LclRest={:.1}° trans=({:.1},{:.1},{:.1}) {}",
src/bin/analyze_fbx.rs:65:            lcl_rest,
src/bin/analyze_fbx.rs:75:                print_tree(kid, bones, children, tracks, depth + 1);
src/bin/analyze_fbx.rs:80:        print_tree(root, &fbx_data.bones, &children_map, &fbx_data.tracks, 0);
src/bin/analyze_fbx.rs:84:    let targets: Vec<&str> = Vec::new(); // skip per-bone analysis
src/bin/analyze_fbx.rs:87:        let bone = match fbx_data.bones.get(*bone_name) {
src/bin/analyze_fbx.rs:96:            bone.pre_rotation.x,
src/bin/analyze_fbx.rs:97:            bone.pre_rotation.y,
src/bin/analyze_fbx.rs:98:            bone.pre_rotation.z,
src/bin/analyze_fbx.rs:99:            bone.pre_rotation.w,
src/bin/analyze_fbx.rs:100:            bone.pre_rotation.to_axis_angle().1.to_degrees()
src/bin/analyze_fbx.rs:103:            "  rest_rotation_euler: ({:.2},{:.2},{:.2})",
src/bin/analyze_fbx.rs:104:            bone.rest_rotation_euler.x, bone.rest_rotation_euler.y, bone.rest_rotation_euler.z
src/bin/analyze_fbx.rs:107:            "  rest_translation: ({:.2},{:.2},{:.2})",
src/bin/analyze_fbx.rs:108:            bone.rest_translation.x, bone.rest_translation.y, bone.rest_translation.z
src/bin/analyze_fbx.rs:112:        // Compute full local rest = PreRot * euler_to_quat(rest_rotation)
src/bin/analyze_fbx.rs:113:        let lcl_rest =
src/bin/analyze_fbx.rs:114:            humanoid_retarget::fbx::euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
src/bin/analyze_fbx.rs:115:        let full_local = bone.pre_rotation * lcl_rest;
src/bin/analyze_fbx.rs:117:            "  Lcl_Rot_rest(quat): ({:.4},{:.4},{:.4},{:.4}) angle={:.1}°",
src/bin/analyze_fbx.rs:118:            lcl_rest.x,
src/bin/analyze_fbx.rs:119:            lcl_rest.y,
src/bin/analyze_fbx.rs:120:            lcl_rest.z,
src/bin/analyze_fbx.rs:121:            lcl_rest.w,
src/bin/analyze_fbx.rs:122:            lcl_rest.to_axis_angle().1.to_degrees()
src/bin/analyze_fbx.rs:125:            "  full_local_rest: ({:.4},{:.4},{:.4},{:.4}) angle={:.1}°",
src/bin/analyze_fbx.rs:133:        if let Some(track) = fbx_data.tracks.get(*bone_name) {
src/bin/analyze_fbx.rs:140:            // Rotation analysis
src/bin/analyze_fbx.rs:145:            // Delta from rest
src/bin/analyze_fbx.rs:160:                // Delta = difference from rest Lcl Rotation
src/bin/analyze_fbx.rs:161:                let delta_from_rest: Quat = lcl_rest.inverse() * q;
src/bin/analyze_fbx.rs:162:                let d = delta_from_rest.to_axis_angle().1.to_degrees().abs();
src/bin/analyze_fbx.rs:174:                "  Delta from rest range: max={:.1}° (frame {})",
src/bin/analyze_fbx.rs:184:                    let delta_from_rest: Quat = lcl_rest.inverse() * q;
src/bin/analyze_fbx.rs:185:                    let d_angle = delta_from_rest.to_axis_angle().1.to_degrees();
src/bin/analyze_fbx.rs:188:                        "    frame[{}]: angle={:.1}° delta_from_rest={:.1}° axis=({:.3},{:.3},{:.3})",
src/bin/analyze_fbx.rs:194:            // Translation analysis
src/bin/analyze_fbx.rs:195:            let rest_t = bone.rest_translation;
src/bin/analyze_fbx.rs:199:                let delta = (*t - rest_t).length();
src/bin/analyze_fbx.rs:210:                println!("    rest=({:.1},{:.1},{:.1})", rest_t.x, rest_t.y, rest_t.z);
src/retarget_quality.rs:11:    fbx_viz: Option<Res<FbxSkeletonViz>>,
src/retarget_quality.rs:21:    let Some(ref fbx) = fbx_viz else { return };
src/retarget_quality.rs:22:    let skel = &fbx.data;
src/retarget_quality.rs:68:    // --- FBX root + hips world position (data-driven from retarget mapping) ---
src/retarget_quality.rs:69:    let fbx_root_key = retarget_state
src/retarget_quality.rs:70:        .vrm_to_fbx
src/retarget_quality.rs:74:    let fbx_hips_key = retarget_state
src/retarget_quality.rs:75:        .vrm_to_fbx
src/retarget_quality.rs:80:    let fbx_root_pos = skel
src/retarget_quality.rs:82:        .get(fbx_root_key)
src/retarget_quality.rs:86:    let fbx_pelvis_pos = skel
src/retarget_quality.rs:88:        .get(fbx_hips_key)
src/retarget_quality.rs:93:    // FBX rotations
src/retarget_quality.rs:96:    let fbx_root_rot_yup = skel
src/retarget_quality.rs:98:        .get(fbx_root_key)
src/retarget_quality.rs:102:    let fbx_pelvis_rot_yup = skel
src/retarget_quality.rs:104:        .get(fbx_hips_key)
src/retarget_quality.rs:109:    let hips_d = vrm_hips_pos - fbx_pelvis_pos;
src/retarget_quality.rs:121:        let root_rot_diff = (vrm_root_rot * fbx_root_rot_yup.inverse()).to_axis_angle();
src/retarget_quality.rs:122:        let hips_rot_diff = (vrm_hips_rot * fbx_pelvis_rot_yup.inverse()).to_axis_angle();
src/retarget_quality.rs:124:        let fbx_pelvis_local = fbx_root_rot_yup.inverse() * fbx_pelvis_rot_yup;
src/retarget_quality.rs:126:        let local_diff = (vrm_hips_local * fbx_pelvis_local.inverse()).to_axis_angle();
src/retarget_quality.rs:128:        let root_d = vrm_root_pos - fbx_root_pos;
src/retarget_quality.rs:134:            "  root: vrm=({:.3},{:.3},{:.3}) fbx=({:.3},{:.3},{:.3})",
src/retarget_quality.rs:136:            fbx_root_pos.x, fbx_root_pos.y, fbx_root_pos.z,
src/retarget_quality.rs:139:            "  hips: vrm=({:.3},{:.3},{:.3}) fbx=({:.3},{:.3},{:.3})",
src/retarget_quality.rs:141:            fbx_pelvis_pos.x, fbx_pelvis_pos.y, fbx_pelvis_pos.z,
src/retarget_quality.rs:150:            "  VRM hips_local=({:.3},{:.3},{:.3},{:.3}) FBX pelvis_local=({:.3},{:.3},{:.3},{:.3})",
src/retarget_quality.rs:152:            fbx_pelvis_local.x, fbx_pelvis_local.y, fbx_pelvis_local.z, fbx_pelvis_local.w,
src/retarget_quality.rs:163:    // O(1) helper: direction angle between VRM and FBX bone pairs
src/retarget_quality.rs:165:        let fbx_bone = retarget_state.vrm_to_fbx.get(vrm_name)?;
src/retarget_quality.rs:166:        let fbx_child = retarget_state.vrm_to_fbx.get(vrm_child)?;
src/retarget_quality.rs:171:            .get(fbx_bone.as_str())?
src/retarget_quality.rs:176:            .get(fbx_child.as_str())?
src/retarget_quality.rs:185:        let fbx_dir = (fcp - fp).normalize_or_zero();
src/retarget_quality.rs:186:        Some(vrm_dir.dot(fbx_dir).clamp(-1.0, 1.0).acos().to_degrees())
src/retarget_quality.rs:281:        let fbx_forearm_key = retarget_state.vrm_to_fbx.get(forearm).map(|s| s.as_str()).unwrap_or("");
src/retarget_quality.rs:282:        let fbx_hand_key    = retarget_state.vrm_to_fbx.get(hand).map(|s| s.as_str()).unwrap_or("");
src/retarget_quality.rs:283:        let fbx_finger_key  = retarget_state.vrm_to_fbx.get(finger).map(|s| s.as_str()).unwrap_or("");
src/retarget_quality.rs:285:        let fbx_forearm_pos = skel.bone_positions.get(fbx_forearm_key).and_then(|p| p.get(frame)).map(|p| Vec3::new(p[0], p[1], p[2]));
src/retarget_quality.rs:286:        let fbx_hand_pos    = skel.bone_positions.get(fbx_hand_key).and_then(|p| p.get(frame)).map(|p| Vec3::new(p[0], p[1], p[2]));
src/retarget_quality.rs:287:        let fbx_finger_pos  = skel.bone_positions.get(fbx_finger_key).and_then(|p| p.get(frame)).map(|p| Vec3::new(p[0], p[1], p[2]));
src/retarget_quality.rs:295:        let fbx_bend = if let (Some(fa), Some(ha), Some(fi)) = (fbx_forearm_pos, fbx_hand_pos, fbx_finger_pos) {
src/retarget_quality.rs:308:        let bend_diff = vrm_bend - fbx_bend;
src/retarget_quality.rs:310:            "[RQ:WRIST] f={} {} vrm={:.0}° fbx={:.0}° diff={:+.0}° twist={:.0}°",
src/retarget_quality.rs:311:            frame, label, vrm_bend, fbx_bend, bend_diff, vrm_twist,
src/retarget_quality.rs:317:        let arp_forearm_rot = skel.bone_rotations.get(fbx_forearm_key).and_then(|r| r.get(frame).copied()).map(|r| coord_rot_wr * r * coord_rot_wr_inv);
src/retarget_quality.rs:318:        let arp_hand_rot    = skel.bone_rotations.get(fbx_hand_key).and_then(|r| r.get(frame).copied()).map(|r| coord_rot_wr * r * coord_rot_wr_inv);
src/retarget_quality.rs:340:        // Measures angle between VRM and FBX (hand → middleProximal) world
src/retarget_quality.rs:349:        let fbx_hand_dir = match (fbx_hand_pos, fbx_finger_pos) {
src/retarget_quality.rs:353:        if vrm_hand_dir.length_squared() > 0.5 && fbx_hand_dir.length_squared() > 0.5 {
src/retarget_quality.rs:354:            let dot = vrm_hand_dir.dot(fbx_hand_dir).clamp(-1.0, 1.0);
src/retarget_quality.rs:357:                "[HAND-DIR] f={} {} angle={:.1}° vrm=({:+.2},{:+.2},{:+.2}) fbx=({:+.2},{:+.2},{:+.2})",
src/retarget_quality.rs:360:                fbx_hand_dir.x, fbx_hand_dir.y, fbx_hand_dir.z,
src/retarget_quality.rs:366:                "[RQ!] f={} {}wrist OVER-FLEX vrm={:.0}° fbx={:.0}° (+{:.0}°)",
src/retarget_quality.rs:367:                frame, label, vrm_bend, fbx_bend, bend_diff
src/retarget.rs:15:    vrm_rest_data: Option<Res<VrmRestData>>,
src/retarget.rs:16:    bone_query: Query<(&VrmBone, &Name, &RestTransform, &RestGlobalTransform)>,
src/retarget.rs:26:    fbx_viz: Option<Res<FbxSkeletonViz>>,
src/retarget.rs:42:    // Also check rest data: pre-converted 0.x files have 180°Y baked into root rest rotation
src/retarget.rs:43:    let rest_has_180y = vrm_rest_data
src/retarget.rs:46:            let r = d.rest_pose.root_rest_rotation;
src/retarget.rs:50:    let is_vrm0 = version_is_vrm0 || rest_has_180y;
src/retarget.rs:52:    // --- Phase 1: Query Bevy → build VrmRestPose ---
src/retarget.rs:54:    let mut bone_rest_local: HashMap<String, Quat> = HashMap::new();
src/retarget.rs:55:    let mut bone_rest_global: HashMap<String, Quat> = HashMap::new();
src/retarget.rs:56:    let mut bone_rest_translation: HashMap<String, Vec3> = HashMap::new();
src/retarget.rs:60:    for (vrm_bone, name, rest_tf, rest_gtf) in &bone_query {
src/retarget.rs:66:        bone_rest_local.insert(vrm_bone.0.clone(), rest_tf.rotation);
src/retarget.rs:67:        bone_rest_global.insert(vrm_bone.0.clone(), rest_gtf.rotation());
src/retarget.rs:68:        bone_rest_translation.insert(vrm_bone.0.clone(), rest_tf.translation);
src/retarget.rs:69:        bone_world_position.insert(vrm_bone.0.clone(), rest_gtf.translation());
src/retarget.rs:89:    let mut root_rest_local = Quat::IDENTITY;
src/retarget.rs:92:            root_rest_local = tf.rotation;
src/retarget.rs:97:    bone_rest_local.insert("VRMC_vrm.root_bone".to_string(), root_rest_local);
src/retarget.rs:98:    bone_rest_global.insert("VRMC_vrm.root_bone".to_string(), root_rest_local);
src/retarget.rs:103:    let virtual_rest_global = humanoid_retarget::vrm_rest::compute_virtual_rest_global(
src/retarget.rs:104:        &bone_rest_local, &bone_world_position,
src/retarget.rs:110:    let sole_l = vrm_rest_data.as_ref().map(|d| d.foot_sole_offset.0).unwrap_or(0.0);
src/retarget.rs:111:    let sole_r = vrm_rest_data.as_ref().map(|d| d.foot_sole_offset.1).unwrap_or(0.0);
src/retarget.rs:118:    // Use GLB-extracted VrmRestPose for VRM 1.x (authoritative, matches headless).
src/retarget.rs:121:    let vrm_rest = if let Some(ref data) = vrm_rest_data && !is_vrm0 {
src/retarget.rs:122:        log.push("[RETARGET] Using GLB VrmRestPose (VRM 1.x authoritative)".to_string());
src/retarget.rs:123:        data.rest_pose.clone()
src/retarget.rs:125:        log.push(format!("[RETARGET] Using Bevy-entity VrmRestPose ({})", if is_vrm0 { "VRM 0.x" } else { "fallback" }));
src/retarget.rs:126:        humanoid_retarget::VrmRestPose {
src/retarget.rs:127:            bone_rest_local,
src/retarget.rs:128:            bone_rest_global,
src/retarget.rs:129:            bone_rest_translation,
src/retarget.rs:133:            root_rest_rotation: root_rest_local,
src/retarget.rs:134:            virtual_rest_global,
src/retarget.rs:136:            foot_contact: vrm_rest_data.as_ref().and_then(|d| d.rest_pose.foot_contact.clone()),
src/retarget.rs:141:    // Build VRM→FBX name map from bone tracks (data-driven, no hardcoded prefixes)
src/retarget.rs:142:    let vrm_to_fbx: std::collections::HashMap<String, String> = anim
src/retarget.rs:143:        .bone_tracks
src/retarget.rs:148:    let fbx_root_name = vrm_to_fbx
src/retarget.rs:153:    let fbx_hips_name = vrm_to_fbx
src/retarget.rs:159:    let fbx_skeleton = fbx_viz.as_ref().map(|v| v.data.clone());
src/retarget.rs:161:        arp_vrm_rest_align: retarget_state.arp_vrm_rest_align_adapter,
src/retarget.rs:164:        vrm_rest,
src/retarget.rs:165:        fbx_skeleton,
src/retarget.rs:167:        &fbx_root_name,
src/retarget.rs:168:        &fbx_hips_name,
src/retarget.rs:176:    if let Some(viz) = fbx_viz.as_ref() {
src/retarget.rs:178:            &mut result, &viz.data, &vrm_to_fbx,
src/retarget.rs:186:    retarget_state.vrm_to_fbx = vrm_to_fbx;
src/retarget.rs:309:/// F10: toggle ARP→VRM full-body rest alignment adapter, force a retarget rebuild.
src/retarget.rs:316:        retarget_state.arp_vrm_rest_align_adapter =
src/retarget.rs:317:            !retarget_state.arp_vrm_rest_align_adapter;
src/retarget.rs:320:            "[ADAPTER] arp_vrm_rest_align = {}",
src/retarget.rs:321:            retarget_state.arp_vrm_rest_align_adapter
src/retarget.rs:331:    _fbx_viz: Option<Res<FbxSkeletonViz>>,
src/retarget.rs:346:    // Update clip reference only — slot durations already set by handle_fbx_loaded/auto_load_fbx
src/visualization.rs:61:    fbx_labels: Query<Entity, With<FbxBoneLabel>>,
src/visualization.rs:64:    fbx_viz: Option<Res<FbxSkeletonViz>>,
src/visualization.rs:68:    // G: cycle gizmo mode (0=off, 1=all, 2=bones only, 3=bones+labels+FBX labels)
src/visualization.rs:75:            3 => "bones + labels + FBX labels",
src/visualization.rs:80:        // Mode 0: hide all UI panels. Mode 1+: restore them.
src/visualization.rs:132:            let rest = name.trim_start_matches("left").trim_start_matches("right");
src/visualization.rs:133:            let part = match rest {
src/visualization.rs:142:                _ if rest.starts_with("Thumb") => "Thm",
src/visualization.rs:143:                _ if rest.starts_with("Index") => "Idx",
src/visualization.rs:144:                _ if rest.starts_with("Middle") => "Mid",
src/visualization.rs:145:                _ if rest.starts_with("Ring") => "Rng",
src/visualization.rs:146:                _ if rest.starts_with("Little") => "Ltl",
src/visualization.rs:147:                _ => rest,
src/visualization.rs:149:            let seg = if rest.contains("Metacarpal") { ".M" }
src/visualization.rs:150:                else if rest.contains("Proximal") { ".P" }
src/visualization.rs:151:                else if rest.contains("Intermediate") { ".I" }
src/visualization.rs:152:                else if rest.contains("Distal") { ".D" }
src/visualization.rs:192:    // FBX labels: spawn in mode 2 only, despawn otherwise
src/visualization.rs:193:    if state.gizmo_mode == 3 && fbx_labels.is_empty() {
src/visualization.rs:194:        if let Some(ref fbx_viz) = fbx_viz {
src/visualization.rs:195:            let skel = &fbx_viz.data;
src/visualization.rs:196:            let _is_hand_fbx = |name: &str| -> bool {
src/visualization.rs:202:            let short_fbx = |name: &str| -> String {
src/visualization.rs:209:                    FbxBoneLabel { fbx_bone_name: name.clone() },
src/visualization.rs:216:                    Text::new(short_fbx(name)),
src/visualization.rs:221:                    TextColor(Color::srgb(1.0, 0.75, 0.3)), // orange = FBX
src/visualization.rs:227:        for entity in &fbx_labels {
src/visualization.rs:239:    fbx_viz: Option<Res<FbxSkeletonViz>>,
src/visualization.rs:303:    // FBX hand→finger = yellow solid line (same length, from FBX hand position)
src/visualization.rs:311:        let src_color = Color::srgb(1.0, 1.0, 0.0); // yellow = FBX source
src/visualization.rs:341:            // --- FBX source ---
src/visualization.rs:342:            if let Some(ref fbx_skel) = fbx_viz {
src/visualization.rs:344:                let fbx_hand_name = retarget_state.vrm_to_fbx.get(*hand_name);
src/visualization.rs:345:                let fbx_finger_name = retarget_state.vrm_to_fbx.get(*finger_name);
src/visualization.rs:347:                let fbx_hand = fbx_hand_name
src/visualization.rs:348:                    .and_then(|n| fbx_skel.data.bone_positions.get(n.as_str()))
src/visualization.rs:351:                let fbx_finger = fbx_finger_name
src/visualization.rs:352:                    .and_then(|n| fbx_skel.data.bone_positions.get(n.as_str()))
src/visualization.rs:356:                if let (Some(hp), Some(fp)) = (fbx_hand, fbx_finger) {
src/visualization.rs:357:                    let fbx_fwd = (fp - hp).normalize_or_zero();
src/visualization.rs:358:                    if fbx_fwd.length_squared() > 0.5 {
src/visualization.rs:359:                        // Solid yellow line: FBX source direction
src/visualization.rs:360:                        let end = hp + fbx_fwd * arrow_len;
src/visualization.rs:366:                        // Angle between VRM and FBX directions
src/visualization.rs:368:                            let angle = vfwd.dot(fbx_fwd).clamp(-1.0, 1.0).acos().to_degrees();
src/visualization.rs:436:    // --- FBX source skeleton (cyan, overlaid on VRM) ---
src/visualization.rs:437:    let Some(fbx_viz) = fbx_viz else {
src/visualization.rs:440:    let skel = &fbx_viz.data;
src/visualization.rs:445:    // Transform FBX viz into VRM's coordinate space (match root bone rotation)
src/visualization.rs:446:    // If VRM root has 180°Y, FBX viz must also be rotated to overlap correctly
src/visualization.rs:447:    // FBX viz: draw in raw world space (root bone is IDENTITY after loader normalization)
src/visualization.rs:467:                Color::srgb(0.95, 0.62, 0.0), // darker amber = FBX source
src/visualization.rs:484:    mut labels: Query<(&BoneLabel, &mut Node), Without<FbxBoneLabel>>,
src/visualization.rs:485:    mut fbx_labels: Query<(&FbxBoneLabel, &mut Node), Without<BoneLabel>>,
src/visualization.rs:488:    fbx_viz: Option<Res<FbxSkeletonViz>>,
src/visualization.rs:519:    // FBX bone labels (mode 3 only)
src/visualization.rs:520:    if let Some(ref fbx_viz) = fbx_viz {
src/visualization.rs:521:        let skel = &fbx_viz.data;
src/visualization.rs:529:        for (label, mut node) in &mut fbx_labels {
src/visualization.rs:530:            if let Some(positions) = skel.bone_positions.get(&label.fbx_bone_name) {
src/visualization.rs:535:                        node.top = Val::Px(vp.y + seg_offset(&label.fbx_bone_name));
src/bin/dump_vrm_transforms.rs:7://! `humanoid_retarget::extract_vrm_rest_pose` so the diff is a single output.
src/bin/dump_vrm_transforms.rs:27:use humanoid_retarget::vrm_rest::extract_vrm_rest_pose;
src/bin/dump_vrm_transforms.rs:162:    let rest = match extract_vrm_rest_pose(data) {
src/bin/dump_vrm_transforms.rs:165:            eprintln!("ERROR: extract_vrm_rest_pose failed: {:?}", e);
src/bin/dump_vrm_transforms.rs:173:    let mut source_names: Vec<&String> = rest
src/bin/dump_vrm_transforms.rs:174:        .bone_rest_translation
src/bin/dump_vrm_transforms.rs:180:        let t = rest.bone_rest_translation.get(*name).copied().unwrap_or(Vec3::ZERO);
src/bin/dump_vrm_transforms.rs:181:        let r_local = rest
src/bin/dump_vrm_transforms.rs:182:            .bone_rest_local
src/preset.rs:7:/// F7/F8/F9 keyboard shortcuts: load preset VRM + FBX pair directly from assets/
src/preset.rs:33:    let fbx_path = preset.fbx.as_str();
src/preset.rs:37:    // Load VRM expression bindings + rest pose data
src/preset.rs:39:        let (bindings, rest_data) = load_vrm_resources(&file_bytes);
src/preset.rs:43:        if let Some(rest_data) = rest_data {
src/preset.rs:44:            commands.insert_resource(rest_data);
src/preset.rs:63:    // Queue FBX load for next frame
src/preset.rs:65:    commands.insert_resource(PendingPresetFbx(fbx_path.to_string(), config_hint.to_string()));
src/preset.rs:66:    log.push(format!("[PRESET] queued FBX: {}", fbx_path));
src/preset.rs:69:/// System to load preset FBX after VRM is queued
src/preset.rs:70:pub(crate) fn load_preset_fbx(
src/preset.rs:72:    pending: Option<Res<PendingPresetFbx>>,
src/preset.rs:78:    let fbx_path = &pending.0;
src/preset.rs:86:            commands.remove_resource::<PendingPresetFbx>();
src/preset.rs:92:    if let Ok(fbx_bytes) = fs::read(fbx_path) {
src/preset.rs:93:        log.push(format!("[PRESET] FBX: {} ({:.1} MB)", fbx_path, fbx_bytes.len() as f64 / 1048576.0));
src/preset.rs:97:            .name("fbx-preset".to_string())
src/preset.rs:100:                let fbx = humanoid_retarget::fbx::parse(&fbx_bytes).map_err(|e| e.to_string())?;
src/preset.rs:103:                let anim = humanoid_retarget::mapping::retarget(&fbx, &config, vrm_version)
src/preset.rs:105:                let skel = humanoid_retarget::compute_fbx_skeleton_from_parsed(&fbx)
src/preset.rs:109:            .expect("spawn fbx-preset")
src/preset.rs:111:            .expect("fbx-preset panicked");
src/preset.rs:115:                let bone_count = anim.bone_tracks.len();
src/preset.rs:116:                log.push(format!("[PRESET] {} bone tracks, {:.1}s", bone_count, anim.duration_secs));
src/preset.rs:121:                timeline.body_frames = anim.bone_tracks.first()
src/preset.rs:126:                    commands.insert_resource(FbxSkeletonViz { data: skel });
src/preset.rs:130:                log.push(format!("[PRESET] FBX parse error: {}", e));
src/preset.rs:134:        log.push(format!("[PRESET] FBX not found: {}", fbx_path));
src/preset.rs:137:    commands.remove_resource::<PendingPresetFbx>();
src/timeline.rs:99:    // Timeline bar is bottom ~58px (3 tracks)
src/timeline.rs:217:    fbx_viz: Option<Res<FbxSkeletonViz>>,
src/timeline.rs:304:    // Debug info: bone rotations + FBX-VRM position diff (when paused)
src/timeline.rs:320:    // FBX pelvis world at this frame (data-driven)
src/timeline.rs:321:    let fbx_hips_key_ui = retarget_state
src/timeline.rs:322:        .vrm_to_fbx
src/timeline.rs:326:    let fbx_pelvis = fbx_viz.as_ref().and_then(|fbx| {
src/timeline.rs:327:        let pos = fbx
src/timeline.rs:330:            .get(fbx_hips_key_ui)
src/timeline.rs:335:        let rot = fbx
src/timeline.rs:338:            .get(fbx_hips_key_ui)
src/timeline.rs:358:        if let Some((fbx_pos, fbx_rot)) = fbx_pelvis {
src/timeline.rs:359:            let diff = vrm_pos - fbx_pos;
src/timeline.rs:360:            let (fx, fy, fz) = fbx_rot.to_euler(EulerRot::XYZ);
src/timeline.rs:362:                "FBX pelvis pos=({:.3},{:.3},{:.3}) euler=({:.1},{:.1},{:.1})",
src/timeline.rs:363:                fbx_pos.x,
src/timeline.rs:364:                fbx_pos.y,
src/timeline.rs:365:                fbx_pos.z,
src/file_loading.rs:25:            log.push("[DIALOG] opening Facial FBX picker...");
src/file_loading.rs:28:                .set_title("Open Facial FBX (Expression)")
src/file_loading.rs:29:                .add_filter("FBX", &["fbx"])
src/file_loading.rs:30:                .load_file::<FacialFbxLoad>();
src/file_loading.rs:32:            log.push("[DIALOG] opening Body FBX picker...");
src/file_loading.rs:35:                .set_title("Open Body FBX (Bone)")
src/file_loading.rs:36:                .add_filter("FBX", &["fbx"])
src/file_loading.rs:37:                .load_file::<FbxLoad>();
src/file_loading.rs:109:        let (bindings, rest_data) = load_vrm_resources(&ev.contents);
src/file_loading.rs:117:        if let Some(rest_data) = rest_data {
src/file_loading.rs:118:            commands.insert_resource(rest_data);
src/file_loading.rs:144:        // Keep timeline position — FBX hasn't changed, just the character
src/file_loading.rs:161:pub(crate) fn handle_fbx_loaded(
src/file_loading.rs:163:    mut ev_loaded: MessageReader<DialogFileLoaded<FbxLoad>>,
src/file_loading.rs:171:            "[FBX] {} ({:.1} MB)",
src/file_loading.rs:203:        // Run FBX parse + retarget on a thread with large stack
src/file_loading.rs:204:        // (Bevy worker threads have small stacks that overflow with fbxcel)
src/file_loading.rs:207:        let fbx_bytes = ev.contents.clone();
src/file_loading.rs:210:            .name("fbx-parse".to_string())
src/file_loading.rs:213:                let fbx = humanoid_retarget::fbx::parse(&fbx_bytes).map_err(|e| e.to_string())?;
src/file_loading.rs:216:                let anim = humanoid_retarget::mapping::retarget(&fbx, &config, vrm_version)
src/file_loading.rs:218:                let has_bone_anim = fbx.tracks.values().any(|t| t.rotations.len() > 1);
src/file_loading.rs:221:                        humanoid_retarget::compute_fbx_skeleton_from_parsed(&fbx)
src/file_loading.rs:229:            .expect("spawn fbx-parse")
src/file_loading.rs:231:            .expect("fbx-parse panicked");
src/file_loading.rs:236:                log.push(format!("[ERROR] FBX: {}", e));
src/file_loading.rs:242:            "[RETARGET] {} bone tracks, {:.1}s, {} expr tracks",
src/file_loading.rs:243:            anim.bone_tracks.len(),
src/file_loading.rs:245:            anim.expression_tracks.len()
src/file_loading.rs:248:        // Store expression tracks
src/file_loading.rs:249:        let expr_count = anim.expression_tracks.len();
src/file_loading.rs:251:            .expression_tracks
src/file_loading.rs:257:                .expression_tracks
src/file_loading.rs:262:                "[EXPR] {} expression tracks: {:?}",
src/file_loading.rs:266:                tracks: std::mem::take(&mut anim.expression_tracks),
src/file_loading.rs:272:            .bone_tracks
src/file_loading.rs:279:            log.push("[REJECT] This FBX has no bone animation (facial only). Use Shift+F to load as facial.");
src/file_loading.rs:294:                    "[VIZ] FBX skeleton: {} bones, {} frames",
src/file_loading.rs:298:                commands.insert_resource(FbxSkeletonViz { data: skel });
src/file_loading.rs:305:/// Handle Shift+F facial-only FBX load (expression slot only, no bone retarget)
src/file_loading.rs:306:pub(crate) fn handle_facial_fbx_loaded(
src/file_loading.rs:308:    mut ev_loaded: MessageReader<DialogFileLoaded<FacialFbxLoad>>,
src/file_loading.rs:331:        let fbx_bytes = ev.contents.clone();
src/file_loading.rs:335:            .name("fbx-facial".to_string())
src/file_loading.rs:338:                let fbx = humanoid_retarget::fbx::parse(&fbx_bytes).map_err(|e| e.to_string())?;
src/file_loading.rs:341:                let anim = humanoid_retarget::mapping::retarget(&fbx, &config, vrm_version)
src/file_loading.rs:345:            .expect("spawn fbx-facial")
src/file_loading.rs:347:            .expect("fbx-facial panicked");
src/file_loading.rs:352:                log.push(format!("[ERROR] Facial FBX: {}", e));
src/file_loading.rs:357:        let expr_count = anim.expression_tracks.len();
src/file_loading.rs:359:            .expression_tracks
src/file_loading.rs:365:            log.push("[WARN] no expression tracks found in facial FBX");
src/file_loading.rs:370:            .expression_tracks
src/file_loading.rs:375:            "[FACIAL] {} expression tracks: {:?}",
src/file_loading.rs:380:            tracks: std::mem::take(&mut anim.expression_tracks),

 succeeded in 0ms:
total 40
drwxr-xr-x@  5 deemooooooooo  staff   160 Apr 14 08:15 .
drwxr-xr-x@ 18 deemooooooooo  staff   576 Apr 14 09:22 ..
-rw-r--r--@  1 deemooooooooo  staff  2366 Apr 13 10:17 pop_scan.rs
-rw-r--r--@  1 deemooooooooo  staff  8832 Apr 14 08:15 retarget_test.rs
-rw-r--r--@  1 deemooooooooo  staff   801 Apr 13 08:40 validate_pipeline.rs
crates/humanoid_retarget/src/postprocess/mod.rs:12://! - Depends on data outside the retargeter's `apply()` (FBX skeleton,
crates/humanoid_retarget/src/postprocess/mod.rs:17://! - Operates on the already-retargeted output, not on raw FBX or VRM.
crates/humanoid_retarget/src/postprocess/mod.rs:23://! - The fix is at init time on `dst_rest_*` → use the
crates/humanoid_retarget/src/postprocess/mod.rs:24://!   `adapters::arp_vrm` rest sync system.
crates/humanoid_retarget/src/bin/retarget_test.rs:3://! Scans VRM models × FBX animations, runs full pipeline + rubric A/B/C scoring.
crates/humanoid_retarget/src/bin/retarget_test.rs:6://!   retarget-test <models_dir> <fbx_dir> <config_path> [--save output.json] [--baseline baseline.json]
crates/humanoid_retarget/src/bin/retarget_test.rs:17:        eprintln!("Usage: retarget-test <models_dir> <fbx_dir> <config_path> [--save output.json] [--baseline baseline.json]");
crates/humanoid_retarget/src/bin/retarget_test.rs:22:    let fbx_dir = &args[2];
crates/humanoid_retarget/src/bin/retarget_test.rs:34:    let fbx_files = scan_dir(fbx_dir, "fbx");
crates/humanoid_retarget/src/bin/retarget_test.rs:36:    println!("Found {} VRM models, {} FBX animations", vrm_files.len(), fbx_files.len());
crates/humanoid_retarget/src/bin/retarget_test.rs:40:    // Cache results by FBX path so the C loop can gate on hard-fail
crates/humanoid_retarget/src/bin/retarget_test.rs:45:    for fbx_path in &fbx_files {
crates/humanoid_retarget/src/bin/retarget_test.rs:46:        let fbx_name = Path::new(fbx_path).file_name().unwrap().to_str().unwrap();
crates/humanoid_retarget/src/bin/retarget_test.rs:47:        let fbx_bytes = match fs::read(fbx_path) {
crates/humanoid_retarget/src/bin/retarget_test.rs:49:            Err(e) => { println!("{:<42} READ FAIL — {}", truncate(fbx_name, 42), e); continue; }
crates/humanoid_retarget/src/bin/retarget_test.rs:51:        let fbx = match humanoid_retarget::fbx::parse(&fbx_bytes) {
crates/humanoid_retarget/src/bin/retarget_test.rs:53:            Err(e) => { println!("{:<42} PARSE FAIL — {}", truncate(fbx_name, 42), e); continue; }
crates/humanoid_retarget/src/bin/retarget_test.rs:55:        let score_a = rubric_a::evaluate(&fbx);
crates/humanoid_retarget/src/bin/retarget_test.rs:56:        println!("{:<42} {}", truncate(fbx_name, 42), score_a);
crates/humanoid_retarget/src/bin/retarget_test.rs:57:        rubric_a_cache.insert(fbx_path.clone(), score_a);
crates/humanoid_retarget/src/bin/retarget_test.rs:64:    // Parse VRM files and store rest pose + cached B result for the C loop's gating.
crates/humanoid_retarget/src/bin/retarget_test.rs:65:    let mut vrm_data: Vec<(String, Vec<u8>, humanoid_retarget::types::VrmRestPose, VrmVersion, humanoid_retarget::quality::RubricResult)> = Vec::new();
crates/humanoid_retarget/src/bin/retarget_test.rs:89:        let rest = match humanoid_retarget::vrm_rest::extract_vrm_rest_pose(vrm_data_bytes) {
crates/humanoid_retarget/src/bin/retarget_test.rs:91:            Err(e) => { println!("{:<42} REST EXTRACT FAIL — {}", truncate(vrm_name, 42), e); continue; }
crates/humanoid_retarget/src/bin/retarget_test.rs:94:        let score_b = rubric_b::evaluate(&rest);
crates/humanoid_retarget/src/bin/retarget_test.rs:99:        vrm_data.push((vrm_name.to_string(), store_bytes, rest, vrm_version, score_b));
crates/humanoid_retarget/src/bin/retarget_test.rs:111:    for (vrm_name, _vrm_bytes, vrm_rest, vrm_version, score_b) in &vrm_data {
crates/humanoid_retarget/src/bin/retarget_test.rs:112:        for fbx_path in &fbx_files {
crates/humanoid_retarget/src/bin/retarget_test.rs:113:            let fbx_name = Path::new(fbx_path).file_name().unwrap().to_str().unwrap();
crates/humanoid_retarget/src/bin/retarget_test.rs:116:            let label = format!("{} x {}", truncate(vrm_name, 20), truncate(fbx_name, 25));
crates/humanoid_retarget/src/bin/retarget_test.rs:123:            if rubric_a_cache.get(fbx_path).is_none() {
crates/humanoid_retarget/src/bin/retarget_test.rs:137:            let fbx_bytes = match fs::read(fbx_path) {
crates/humanoid_retarget/src/bin/retarget_test.rs:141:            let fbx_parsed = match humanoid_retarget::fbx::parse(&fbx_bytes) {
crates/humanoid_retarget/src/bin/retarget_test.rs:146:            let pipeline = evaluate_pipeline(&fbx_parsed, vrm_rest, &config, *vrm_version);
crates/fbx_rig/src/lib.rs:1://! `fbx_rig` — pure-Rust FBX reader specialized for skeletal animation.
crates/fbx_rig/src/lib.rs:3://! Wraps `fbxcel`'s low-level binary parser and produces a
crates/fbx_rig/src/lib.rs:5://! - Bone hierarchy + rest transforms
crates/fbx_rig/src/lib.rs:6://! - Per-bone animation tracks (rotation + translation curves)
crates/fbx_rig/src/lib.rs:7://! - Blend-shape weight tracks
crates/fbx_rig/src/lib.rs:8://! - Source DCC tool detection ([`FbxSourceType`])
crates/fbx_rig/src/lib.rs:10://! This crate was split out of `humanoid_retarget` so that FBX parsing
crates/fbx_rig/src/lib.rs:13:/// Re-export of the underlying `fbxcel` crate for consumers that need
crates/fbx_rig/src/lib.rs:16:pub use fbxcel;
crates/fbx_rig/src/lib.rs:18:use fbxcel::low::v7400::AttributeValue;
crates/fbx_rig/src/lib.rs:19:use fbxcel::pull_parser::any::AnyParser;
crates/fbx_rig/src/lib.rs:20:use fbxcel::pull_parser::v7400::Event;
crates/fbx_rig/src/lib.rs:21:use fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
crates/fbx_rig/src/lib.rs:27:const FBX_TIME_UNIT: f64 = 46186158000.0;
crates/fbx_rig/src/lib.rs:32:    #[error("FBX parse error: {0}")]
crates/fbx_rig/src/lib.rs:33:    Parse(String),
crates/fbx_rig/src/lib.rs:36:/// Which DCC tool produced this FBX. Detected from the `Creator` header
crates/fbx_rig/src/lib.rs:39:pub enum FbxSourceType {
crates/fbx_rig/src/lib.rs:46:impl std::fmt::Display for FbxSourceType {
crates/fbx_rig/src/lib.rs:49:            FbxSourceType::Auto => write!(f, "Auto"),
crates/fbx_rig/src/lib.rs:50:            FbxSourceType::Blender => write!(f, "Blender"),
crates/fbx_rig/src/lib.rs:51:            FbxSourceType::Maya => write!(f, "Maya"),
crates/fbx_rig/src/lib.rs:58:    pub bones: HashMap<String, FbxBone>,
crates/fbx_rig/src/lib.rs:59:    pub tracks: HashMap<String, FbxBoneTrack>,
crates/fbx_rig/src/lib.rs:60:    pub blend_shape_tracks: HashMap<String, Vec<f32>>,
crates/fbx_rig/src/lib.rs:64:    pub detected_source_type: FbxSourceType,
crates/fbx_rig/src/lib.rs:67:    /// matrix used by mesh skinning. Empty if the FBX has no skin
crates/fbx_rig/src/lib.rs:68:    /// clusters (e.g. facial-only FBX). Column-major 4x4.
crates/fbx_rig/src/lib.rs:69:    pub bind_world: HashMap<String, Mat4>,
crates/fbx_rig/src/lib.rs:73:pub struct FbxBone {
crates/fbx_rig/src/lib.rs:75:    pub pre_rotation: Quat,
crates/fbx_rig/src/lib.rs:76:    pub rest_translation: Vec3,
crates/fbx_rig/src/lib.rs:77:    pub rest_rotation_euler: Vec3,
crates/fbx_rig/src/lib.rs:82:pub struct FbxBoneTrack {
crates/fbx_rig/src/lib.rs:89:pub struct FbxSkeletonFrames {
crates/fbx_rig/src/lib.rs:94:    /// bone_name → Vec of world rotations per frame (Z-up, FBX native space)
crates/fbx_rig/src/lib.rs:103:    pre_rotation: Vec3,
crates/fbx_rig/src/lib.rs:104:    rest_translation: Vec3,
crates/fbx_rig/src/lib.rs:105:    rest_rotation: Vec3,
crates/fbx_rig/src/lib.rs:130:    /// Column-major 4x4 bone→world bind pose matrix, as stored in FBX.
crates/fbx_rig/src/lib.rs:147:pub fn parse(data: &[u8]) -> Result<SourceAsset, Error> {
crates/fbx_rig/src/lib.rs:152:        .map_err(|e| Error::Parse(format!("FBX header: {}", e)))?
crates/fbx_rig/src/lib.rs:155:        _ => return Err(Error::Parse("unsupported FBX version".into())),
crates/fbx_rig/src/lib.rs:176:            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
crates/fbx_rig/src/lib.rs:185:                } else if depth == 2 && top_section == "FBXHeaderExtension" && name == "Creator" {
crates/fbx_rig/src/lib.rs:186:                    // Parse Creator string from FBXHeaderExtension
crates/fbx_rig/src/lib.rs:257:                            // fbxcel auto-seeks past unread attrs on next next_event() call
crates/fbx_rig/src/lib.rs:283:                    // All other nodes: auto-skip attrs (fbxcel seeks past on next_event)
crates/fbx_rig/src/lib.rs:289:            Event::EndFbx(_) => break,
crates/fbx_rig/src/lib.rs:327:    // In FBX, each skin Cluster is linked to its target bone (Model) via
crates/fbx_rig/src/lib.rs:331:    let mut bind_world: HashMap<String, Mat4> = HashMap::new();
crates/fbx_rig/src/lib.rs:338:            bind_world.insert(models[mi].name.clone(), m);
crates/fbx_rig/src/lib.rs:425:            let secs = t / FBX_TIME_UNIT;
crates/fbx_rig/src/lib.rs:433:            return Err(Error::Parse("no animation data found".into()));
crates/fbx_rig/src/lib.rs:446:    let mut bones: HashMap<String, FbxBone> = HashMap::new();
crates/fbx_rig/src/lib.rs:450:            FbxBone {
crates/fbx_rig/src/lib.rs:452:                pre_rotation: euler_to_quat_xyz(model.pre_rotation),
crates/fbx_rig/src/lib.rs:453:                rest_translation: model.rest_translation,
crates/fbx_rig/src/lib.rs:454:                rest_rotation_euler: model.rest_rotation,
crates/fbx_rig/src/lib.rs:460:    // Build animation tracks
crates/fbx_rig/src/lib.rs:461:    let mut tracks: HashMap<String, FbxBoneTrack> = HashMap::new();
crates/fbx_rig/src/lib.rs:500:                let rx = sample_curve(rot_curves[0], t, model.rest_rotation.x as f64);
crates/fbx_rig/src/lib.rs:501:                let ry = sample_curve(rot_curves[1], t, model.rest_rotation.y as f64);
crates/fbx_rig/src/lib.rs:502:                let rz = sample_curve(rot_curves[2], t, model.rest_rotation.z as f64);
crates/fbx_rig/src/lib.rs:510:                let tx = sample_curve(trans_curves[0], t, model.rest_translation.x as f64);
crates/fbx_rig/src/lib.rs:511:                let ty = sample_curve(trans_curves[1], t, model.rest_translation.y as f64);
crates/fbx_rig/src/lib.rs:512:                let tz = sample_curve(trans_curves[2], t, model.rest_translation.z as f64);
crates/fbx_rig/src/lib.rs:518:            let rest = euler_to_quat(model.rest_rotation, model.rotation_order);
crates/fbx_rig/src/lib.rs:519:            rotations = vec![rest; frame_count];
crates/fbx_rig/src/lib.rs:522:            translations = vec![model.rest_translation; frame_count];
crates/fbx_rig/src/lib.rs:528:        // FBX (standing idle: 10-18° spikes over 3-5 frames). Global
crates/fbx_rig/src/lib.rs:540:        tracks.insert(
crates/fbx_rig/src/lib.rs:542:            FbxBoneTrack {
crates/fbx_rig/src/lib.rs:549:    // Build blend shape tracks
crates/fbx_rig/src/lib.rs:550:    let mut blend_shape_tracks: HashMap<String, Vec<f32>> = HashMap::new();
crates/fbx_rig/src/lib.rs:589:            blend_shape_tracks.insert(deformer.name.clone(), weights);
crates/fbx_rig/src/lib.rs:597:        tracks,
crates/fbx_rig/src/lib.rs:598:        blend_shape_tracks,
crates/fbx_rig/src/lib.rs:603:        bind_world,
crates/fbx_rig/src/lib.rs:609:    bones: &HashMap<String, FbxBone>,
crates/fbx_rig/src/lib.rs:610:) -> FbxSourceType {
crates/fbx_rig/src/lib.rs:613:            return FbxSourceType::Blender;
crates/fbx_rig/src/lib.rs:615:        if c.contains("Maya") || c.contains("FBX SDK") {
crates/fbx_rig/src/lib.rs:616:            return FbxSourceType::Maya;
crates/fbx_rig/src/lib.rs:622:        return FbxSourceType::Auto;
crates/fbx_rig/src/lib.rs:627:            b.pre_rotation.x.abs() < 0.001
crates/fbx_rig/src/lib.rs:628:                && b.pre_rotation.y.abs() < 0.001
crates/fbx_rig/src/lib.rs:629:                && b.pre_rotation.z.abs() < 0.001
crates/fbx_rig/src/lib.rs:630:                && b.pre_rotation.w.abs() > 0.999
crates/fbx_rig/src/lib.rs:634:        FbxSourceType::Blender
crates/fbx_rig/src/lib.rs:636:        FbxSourceType::Maya
crates/fbx_rig/src/lib.rs:642:    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
crates/fbx_rig/src/lib.rs:663:    let mut pre_rotation = Vec3::ZERO;
crates/fbx_rig/src/lib.rs:664:    let mut rest_translation = Vec3::ZERO;
crates/fbx_rig/src/lib.rs:665:    let mut rest_rotation = Vec3::ZERO;
crates/fbx_rig/src/lib.rs:672:            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
crates/fbx_rig/src/lib.rs:687:                        &mut pre_rotation,
crates/fbx_rig/src/lib.rs:688:                        &mut rest_translation,
crates/fbx_rig/src/lib.rs:689:                        &mut rest_rotation,
crates/fbx_rig/src/lib.rs:700:            Event::EndFbx(_) => break,
crates/fbx_rig/src/lib.rs:707:        pre_rotation,
crates/fbx_rig/src/lib.rs:708:        rest_translation,
crates/fbx_rig/src/lib.rs:709:        rest_rotation,
crates/fbx_rig/src/lib.rs:718:/// FBX stores the matrix as a 16-element `f64` array on a child node
crates/fbx_rig/src/lib.rs:722:    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
crates/fbx_rig/src/lib.rs:731:            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
crates/fbx_rig/src/lib.rs:757:            Event::EndFbx(_) => break,
crates/fbx_rig/src/lib.rs:764:/// Convert a 16-element `f64` slice to a glam `Mat4`. FBX stores matrix
crates/fbx_rig/src/lib.rs:778:    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
crates/fbx_rig/src/lib.rs:780:    pre_rotation: &mut Vec3,
crates/fbx_rig/src/lib.rs:781:    rest_translation: &mut Vec3,
crates/fbx_rig/src/lib.rs:782:    rest_rotation: &mut Vec3,
crates/fbx_rig/src/lib.rs:789:            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
crates/fbx_rig/src/lib.rs:803:                        "PreRotation" => *pre_rotation = extract_vec3(&pa, 4),
crates/fbx_rig/src/lib.rs:804:                        "Lcl Translation" => *rest_translation = extract_vec3(&pa, 4),
crates/fbx_rig/src/lib.rs:805:                        "Lcl Rotation" => *rest_rotation = extract_vec3(&pa, 4),
crates/fbx_rig/src/lib.rs:823:            Event::EndFbx(_) => break,
crates/fbx_rig/src/lib.rs:831:    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
crates/fbx_rig/src/lib.rs:849:            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
crates/fbx_rig/src/lib.rs:885:            Event::EndFbx(_) => break,
crates/fbx_rig/src/lib.rs:901:    parser: &mut fbxcel::pull_parser::v7400::Parser<std::io::BufReader<Cursor<&[u8]>>>,
crates/fbx_rig/src/lib.rs:908:            .map_err(|e| Error::Parse(format!("FBX parse: {}", e)))?
crates/fbx_rig/src/lib.rs:921:            Event::EndFbx(_) => break,
crates/fbx_rig/src/lib.rs:933:    let t = t_secs * FBX_TIME_UNIT;
crates/fbx_rig/src/lib.rs:971:/// Convert FBX Euler angles to quaternion.
crates/fbx_rig/src/lib.rs:973:/// FBX intrinsic XYZ means: apply X rotation first, then Y, then Z.
crates/fbx_rig/src/lib.rs:977:/// Fix: FBX intrinsic XYZ → glam ZYX(z,y,x) to get correct application order.
crates/fbx_rig/src/lib.rs:1067:/// Compute world-space bone positions for each frame of the FBX animation.
crates/fbx_rig/src/lib.rs:1069:pub fn compute_fbx_skeleton(fbx_data: &[u8]) -> Result<FbxSkeletonFrames, Error> {
crates/fbx_rig/src/lib.rs:1070:    let fbx = parse(fbx_data)?;
crates/fbx_rig/src/lib.rs:1071:    compute_fbx_skeleton_from_parsed(&fbx)
crates/fbx_rig/src/lib.rs:1074:pub fn compute_fbx_skeleton_from_parsed(fbx: &SourceAsset) -> Result<FbxSkeletonFrames, Error> {
crates/fbx_rig/src/lib.rs:1075:    let frame_count = fbx.frame_count;
crates/fbx_rig/src/lib.rs:1076:    let duration = fbx.duration;
crates/fbx_rig/src/lib.rs:1079:    for (name, bone) in &fbx.bones {
crates/fbx_rig/src/lib.rs:1089:    for start in fbx.bones.keys() {
crates/fbx_rig/src/lib.rs:1099:            if let Some(bone) = fbx.bones.get(&current)
crates/fbx_rig/src/lib.rs:1121:            let bone = match fbx.bones.get(name) {
crates/fbx_rig/src/lib.rs:1133:            let pre_rot = bone.pre_rotation;
crates/fbx_rig/src/lib.rs:1135:            let rest_rot = euler_to_quat(
crates/fbx_rig/src/lib.rs:1136:                bone.rest_rotation_euler,
crates/fbx_rig/src/lib.rs:1139:            let anim_rot = fbx
crates/fbx_rig/src/lib.rs:1140:                .tracks
crates/fbx_rig/src/lib.rs:1144:                .unwrap_or(rest_rot);
crates/fbx_rig/src/lib.rs:1146:            let anim_t = fbx
crates/fbx_rig/src/lib.rs:1147:                .tracks
crates/fbx_rig/src/lib.rs:1151:                .unwrap_or(bone.rest_translation);
crates/fbx_rig/src/lib.rs:1162:                // Blender FBX: root -90°X handles Z→Y in FK; positions already Y-up m.
crates/fbx_rig/src/lib.rs:1163:                // UE/Maya FBX: Z-up cm → (x, z, -y) * 0.01
crates/fbx_rig/src/lib.rs:1164:                let is_blender = fbx.detected_source_type == FbxSourceType::Blender;
crates/fbx_rig/src/lib.rs:1181:    Ok(FbxSkeletonFrames {
crates/humanoid_retarget/src/finger_rest_align.rs:1://! Stage 2: Finger rest pose alignment.
crates/humanoid_retarget/src/finger_rest_align.rs:4://! VRM bind pose for non-thumb finger bones, injecting the per-FBX baseline
crates/humanoid_retarget/src/finger_rest_align.rs:5://! curl extracted from ARP rest.
crates/humanoid_retarget/src/finger_rest_align.rs:10://! new_dst_rest_local = old_dst_rest_local × Quat::from_axis_angle(
crates/humanoid_retarget/src/finger_rest_align.rs:16://! Then `dst_rest_global` is recomputed in topological order so child
crates/humanoid_retarget/src/finger_rest_align.rs:17://! finger bones inherit the modified parent rest world correctly.
crates/humanoid_retarget/src/finger_rest_align.rs:21://! v1 tried `dst_rest_local = src_local_rest` (full quaternion copy in SO(3)).
crates/humanoid_retarget/src/finger_rest_align.rs:29://! distinct from `src_local_rest` and outside the tautology range.
crates/humanoid_retarget/src/finger_rest_align.rs:35://! runs unchanged with the modified finger rest baseline embedded.
crates/humanoid_retarget/src/finger_rest_align.rs:45:use crate::adapters::arp_vrm::RestAlignOverride;
crates/humanoid_retarget/src/finger_rest_align.rs:50:pub struct RestOverride {
crates/humanoid_retarget/src/finger_rest_align.rs:59:/// child), build modified local + global rests, return per-bone records.
crates/humanoid_retarget/src/finger_rest_align.rs:63:/// global rest, the parent has already been processed.
crates/humanoid_retarget/src/finger_rest_align.rs:66:/// parent is `leftHand`) read the parent's UNMODIFIED global rest from
crates/humanoid_retarget/src/finger_rest_align.rs:67:/// `vrm_rest_global`, which is correct because we are not modifying the
crates/humanoid_retarget/src/finger_rest_align.rs:71:    vrm_rest_local: &HashMap<String, Quat>,
crates/humanoid_retarget/src/finger_rest_align.rs:72:    vrm_rest_global: &HashMap<String, Quat>,
crates/humanoid_retarget/src/finger_rest_align.rs:74:) -> Vec<RestOverride> {
crates/humanoid_retarget/src/finger_rest_align.rs:75:    let mut overrides: Vec<RestOverride> = Vec::with_capacity(axis_map.len());
crates/humanoid_retarget/src/finger_rest_align.rs:86:        let old_local = vrm_rest_local
crates/humanoid_retarget/src/finger_rest_align.rs:99:        // we already processed it; otherwise from the original VRM rest.
crates/humanoid_retarget/src/finger_rest_align.rs:106:                    .or_else(|| vrm_rest_global.get(p).copied())
crates/humanoid_retarget/src/finger_rest_align.rs:113:        overrides.push(RestOverride {
crates/humanoid_retarget/src/finger_rest_align.rs:125:/// Apply Stage 2 IN PLACE: mutates the VRM rest maps and returns
crates/humanoid_retarget/src/finger_rest_align.rs:126:/// RestAlignOverride entries for the existing adapter logging API.
crates/humanoid_retarget/src/finger_rest_align.rs:133:    vrm_rest_local: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/finger_rest_align.rs:134:    vrm_rest_global: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/finger_rest_align.rs:136:) -> Vec<RestAlignOverride> {
crates/humanoid_retarget/src/finger_rest_align.rs:137:    let overrides = compute_overrides(axis_map, vrm_rest_local, vrm_rest_global, parent_map);
crates/humanoid_retarget/src/finger_rest_align.rs:144:        vrm_rest_local.insert(o.vrm_bone_name.clone(), o.new_local);
crates/humanoid_retarget/src/finger_rest_align.rs:145:        vrm_rest_global.insert(o.vrm_bone_name.clone(), o.new_global);
crates/humanoid_retarget/src/finger_rest_align.rs:147:        log.push(RestAlignOverride {
crates/humanoid_retarget/src/types.rs:24:/// Pure VRM rest pose data — extracted from Bevy entities, no engine dependency.
crates/humanoid_retarget/src/types.rs:26:pub struct VrmRestPose {
crates/humanoid_retarget/src/types.rs:27:    /// vrm_bone_name → local rest rotation
crates/humanoid_retarget/src/types.rs:28:    pub bone_rest_local: HashMap<String, Quat>,
crates/humanoid_retarget/src/types.rs:29:    /// vrm_bone_name → skeleton-space global rest rotation
crates/humanoid_retarget/src/types.rs:30:    pub bone_rest_global: HashMap<String, Quat>,
crates/humanoid_retarget/src/types.rs:31:    /// vrm_bone_name → local rest translation
crates/humanoid_retarget/src/types.rs:32:    pub bone_rest_translation: HashMap<String, Vec3>,
crates/humanoid_retarget/src/types.rs:33:    /// vrm_bone_name → world position at rest (for A-pose detection)
crates/humanoid_retarget/src/types.rs:37:    /// VRM hips world-space Y position at rest
crates/humanoid_retarget/src/types.rs:39:    /// Root bone rest rotation — used to detect 180°Y baked models
crates/humanoid_retarget/src/types.rs:40:    pub root_rest_rotation: Quat,
crates/humanoid_retarget/src/types.rs:41:    /// Virtual global orientation for identity-rest bones (VRM 1.0).
crates/humanoid_retarget/src/types.rs:43:    /// bone_rest_global when dst_rest is identity to fix bone-mesh mismatch.
crates/humanoid_retarget/src/types.rs:44:    pub virtual_rest_global: HashMap<String, Quat>,
crates/humanoid_retarget/src/types.rs:67:    pub expression_tracks: Vec<ExpressionTrack>,
crates/humanoid_retarget/src/types.rs:77:    pub bone_tracks: Vec<BoneTrack>,
crates/humanoid_retarget/src/types.rs:78:    pub expression_tracks: Vec<ExpressionTrack>,
crates/humanoid_retarget/src/types.rs:79:    /// Detected FBX source type (Blender, UE, etc.)
crates/humanoid_retarget/src/types.rs:80:    pub source_detected: crate::config::FbxSourceType,
crates/humanoid_retarget/src/types.rs:82:    pub source_resolved: crate::config::FbxSourceType,
crates/humanoid_retarget/src/types.rs:94:    /// FBX bone name (with prefix, for looking up world rotations)
crates/humanoid_retarget/src/types.rs:100:    /// Source bone LOCAL rest rotation (FBX PreRotation only, for src_local = src_local_rest * delta)
crates/humanoid_retarget/src/types.rs:101:    pub src_local_rest: Quat,
crates/humanoid_retarget/src/types.rs:102:    /// Source bone GLOBAL rest rotation (accumulated PreRotation + Lcl Rotation rest)
crates/humanoid_retarget/src/types.rs:103:    pub src_global_rest: Quat,
crates/humanoid_retarget/src/types.rs:104:    /// Source bone PARENT's global rest rotation
crates/humanoid_retarget/src/types.rs:105:    pub src_parent_global_rest: Quat,
crates/humanoid_retarget/src/types.rs:116:pub use fbx_rig::FbxSkeletonFrames;
crates/humanoid_retarget/src/types.rs:118:pub struct FbxDiagnostics {
crates/humanoid_retarget/src/types.rs:124:    pub source_detected: crate::config::FbxSourceType,
crates/humanoid_retarget/src/types.rs:125:    pub source_resolved: crate::config::FbxSourceType,
crates/humanoid_retarget/src/bin/validate_pipeline.rs:1://! CLI: validate the full FBX→VRM retarget pipeline.
crates/humanoid_retarget/src/bin/validate_pipeline.rs:3://! Usage: validate-pipeline <config.json> <fbx_path> <vrm_path>
crates/humanoid_retarget/src/bin/validate_pipeline.rs:12:        eprintln!("Usage: validate-pipeline <config.json> <fbx_path> <vrm_path>");
crates/humanoid_retarget/src/bin/validate_pipeline.rs:17:    let fbx_bytes = fs::read(&args[2]).expect("read fbx");
crates/humanoid_retarget/src/bin/validate_pipeline.rs:22:        &fbx_bytes,
crates/fbx_rig/Cargo.toml:2:name = "fbx_rig"
crates/fbx_rig/Cargo.toml:5:description = "Pure-Rust FBX reader specialized for skeletal animation and bind pose extraction"
crates/fbx_rig/Cargo.toml:8:fbxcel = "0.9"
crates/humanoid_retarget/src/finger_axis_map.rs:3://! Per-bone correspondence between ARP curl axis (in FBX bone-local frame)
crates/humanoid_retarget/src/finger_axis_map.rs:11://! (`finger_rest_align`) consumes.
crates/humanoid_retarget/src/finger_axis_map.rs:13://! Key insight from Phase 0: ARP loose-fist rest pose IS the curl rotation,
crates/humanoid_retarget/src/finger_axis_map.rs:14://! so `rest_local.to_axis_angle()` gives us the curl axis directly. No need
crates/humanoid_retarget/src/finger_axis_map.rs:18://! rest (carpometacarpal coupling) and need a different approach. They are
crates/humanoid_retarget/src/finger_axis_map.rs:34:    /// ARP curl axis in FBX bone-local frame (unit vector).
crates/humanoid_retarget/src/finger_axis_map.rs:38:    /// Magnitude of ARP rest_local around `arp_axis_local`. This is the
crates/humanoid_retarget/src/finger_axis_map.rs:39:    /// per-FBX baseline curl that Stage 2 injects into the VRM rest.
crates/humanoid_retarget/src/finger_axis_map.rs:45:/// that this module handles. Thumb bones are excluded (multi-axis rest).
crates/humanoid_retarget/src/finger_axis_map.rs:65:/// Derive ARP curl axis + baseline curl from a BoneTrack's rest pose.
crates/humanoid_retarget/src/finger_axis_map.rs:67:/// The full FBX local rest is recoverable from the BoneTrack as
crates/humanoid_retarget/src/finger_axis_map.rs:68:/// `inv(src_parent_global_rest) * src_global_rest`. Its axis-angle
crates/humanoid_retarget/src/finger_axis_map.rs:73:/// If the rest is near-identity (`< 1°`), the axis is undefined; we return
crates/humanoid_retarget/src/finger_axis_map.rs:77:    let full_local_rest = track.src_parent_global_rest.inverse() * track.src_global_rest;
crates/humanoid_retarget/src/finger_axis_map.rs:78:    let (axis, angle) = full_local_rest.to_axis_angle();
crates/humanoid_retarget/src/finger_axis_map.rs:88:///   - Left fingers : bone length axis = +X (rest_local ≈ identity)
crates/humanoid_retarget/src/finger_axis_map.rs:108:/// **world space** using both rigs' global rest rotations.
crates/humanoid_retarget/src/finger_axis_map.rs:111:///   src_global_rest * arp_axis_local  →  ARP curl axis in world frame
crates/humanoid_retarget/src/finger_axis_map.rs:112:///   dst_rest_global.inverse() * (...) →  same physical direction expressed
crates/humanoid_retarget/src/finger_axis_map.rs:115:/// An earlier version used `inv(dst_rest_local) * src_rest_local * arp_axis`,
crates/humanoid_retarget/src/finger_axis_map.rs:116:/// which silently collapsed to `arp_axis` because finger-level local rests
crates/humanoid_retarget/src/finger_axis_map.rs:120:/// rest. This world-space form captures it.
crates/humanoid_retarget/src/finger_axis_map.rs:122:    src_global_rest: Quat,
crates/humanoid_retarget/src/finger_axis_map.rs:123:    dst_rest_global: Quat,
crates/humanoid_retarget/src/finger_axis_map.rs:126:    let arp_axis_world = src_global_rest * arp_axis_local;
crates/humanoid_retarget/src/finger_axis_map.rs:127:    let vrm_local = dst_rest_global.inverse() * arp_axis_world;
crates/humanoid_retarget/src/finger_axis_map.rs:142:/// log that dry-runs Option B (rest-delta axis derivation) on **every**
crates/humanoid_retarget/src/finger_axis_map.rs:143:/// finger bone, including thumbs, for post-session analysis.
crates/humanoid_retarget/src/finger_axis_map.rs:148:    bone_tracks: &[BoneTrack],
crates/humanoid_retarget/src/finger_axis_map.rs:149:    dst_rest_local: &HashMap<String, Quat>,
crates/humanoid_retarget/src/finger_axis_map.rs:150:    dst_rest_global: &HashMap<String, Quat>,
crates/humanoid_retarget/src/finger_axis_map.rs:156:        "[B-DIAG] Option B dry-run: derived = inv(dst_rest_global) * src_global_rest * arp_axis"
crates/humanoid_retarget/src/finger_axis_map.rs:165:    let mut sorted_tracks: Vec<&BoneTrack> = bone_tracks
crates/humanoid_retarget/src/finger_axis_map.rs:169:    sorted_tracks.sort_by(|a, b| a.vrm_bone_name.cmp(&b.vrm_bone_name));
crates/humanoid_retarget/src/finger_axis_map.rs:175:    for track in &sorted_tracks {
crates/humanoid_retarget/src/finger_axis_map.rs:179:        let src_global = track.src_global_rest;
crates/humanoid_retarget/src/finger_axis_map.rs:180:        let dst_global = dst_rest_global.get(name).copied().unwrap_or(Quat::IDENTITY);
crates/humanoid_retarget/src/finger_axis_map.rs:182:        let _ = dst_rest_local; // retained in signature for future hardcode path
crates/humanoid_retarget/src/finger_axis_map.rs:186:        // when Stage H rotates the hand rest, the finger's local frame rotates
crates/humanoid_retarget/src/finger_axis_map.rs:233:    //   - raw   : delta in FBX native frame (Z-up for Maya/UE, Y-up for Blender)
crates/humanoid_retarget/src/finger_axis_map.rs:235:    // If the FBX is Blender-sourced, the two should match.
crates/humanoid_retarget/src/finger_axis_map.rs:240:        "[HAND-DIAG] wrist rest-orientation delta: ARP vs VRM bind".to_string(),
crates/humanoid_retarget/src/finger_axis_map.rs:248:        let dst_g = dst_rest_global
crates/humanoid_retarget/src/finger_axis_map.rs:252:        let src_g = bone_tracks
crates/humanoid_retarget/src/finger_axis_map.rs:255:            .map(|t| t.src_global_rest)
crates/humanoid_retarget/src/finger_axis_map.rs:300:            "[B-DIAG] no non-thumb finger tracks found — cannot evaluate gate".to_string(),
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:3://! Reads each FBX wrist's per-frame forearm-relative rotation, extracts
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:6://! bone. Each side reads its own FBX track.
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:10://! animation. EXP-006 follows the FBX wrist motion frame-by-frame.
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:17://!     fa_w = coord * fbx_forearm_rot[f] * coord_inv          // FBX Z-up → Y-up
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:18://!     fh_w = coord * fbx_hand_rot[f]    * coord_inv
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:19://!     fbx_wrist_delta = fa_w.inverse() * fh_w                // forearm-relative
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:32://! `coord = Quat::from_rotation_x(-π/2)` rotates FBX Z-up axes to glTF
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:34://! applies to FBX bone rotations before measurement.
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:41://! - **Skips when no FBX skeleton** — caller passes
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:42://!   `Option<&FbxSkeletonFrames>`; on `None` the function returns
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:45://!   if both have matching FBX tracks via `vrm_to_fbx`.
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:60:use crate::fbx::FbxSkeletonFrames;
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:63:/// Apply per-frame FBX wrist twist transfer to both hands.
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:65:/// Reads `fbx_forearm` / `fbx_hand` rotation tracks from `fbx_skel`,
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:66:/// resolved through `vrm_to_fbx`. Mutates the matching hand bone tracks
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:70:    fbx_skel: &FbxSkeletonFrames,
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:71:    vrm_to_fbx: &HashMap<String, String>,
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:83:        let Some(fak) = vrm_to_fbx.get(vrm_forearm).map(|s| s.as_str()) else { continue };
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:84:        let Some(fhk) = vrm_to_fbx.get(vrm_hand).map(|s| s.as_str()) else { continue };
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:85:        let Some(fars) = fbx_skel.bone_rotations.get(fak) else { continue };
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:86:        let Some(fhrs) = fbx_skel.bone_rotations.get(fhk) else { continue };
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:94:            let fbx_wrist_delta = (fa_w.inverse() * fh_w).normalize();
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:95:            let (_swing, twist) = crate::types::swing_twist_decompose(fbx_wrist_delta, Vec3::Y);
crates/humanoid_retarget/src/quality/detector.rs:13:/// Tracks below this fall back to the absolute spike threshold.
crates/humanoid_retarget/src/quality/detector.rs:46:/// angular deltas (degrees). Hybrid threshold: static tracks
crates/humanoid_retarget/src/quality/detector.rs:48:/// (STATIC_SPIKE_THRESHOLD_DEG); active tracks use ACTIVE_MULTIPLIER ×
crates/humanoid_retarget/src/orchestrate.rs:36:use crate::fbx::SourceAsset;
crates/humanoid_retarget/src/orchestrate.rs:41:use crate::types::{TargetAnimation, VrmRestPose};
crates/humanoid_retarget/src/orchestrate.rs:81:/// and a target VRM rest pose.
crates/humanoid_retarget/src/orchestrate.rs:84:/// - Parse FBX bytes into a [`SourceAsset`] (FBX-format-level concern,
crates/humanoid_retarget/src/orchestrate.rs:86:/// - Extract / build [`VrmRestPose`] (VRM-format-level concern).
crates/humanoid_retarget/src/orchestrate.rs:90:/// 2. Run [`rubric_b::evaluate`] on the VRM rest.
crates/humanoid_retarget/src/orchestrate.rs:99:    vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/orchestrate.rs:119:    let score_b = rubric_b::evaluate(vrm_rest);
crates/humanoid_retarget/src/orchestrate.rs:142:    // Step 5: Compute FBX skeleton frames for vis + Rubric C C1.4 fidelity
crates/humanoid_retarget/src/orchestrate.rs:143:    let fbx_skeleton = match crate::compute_fbx_skeleton_from_parsed(source_asset) {
crates/humanoid_retarget/src/orchestrate.rs:146:            result.error = Some(format!("compute_fbx_skeleton failed: {}", e));
crates/humanoid_retarget/src/orchestrate.rs:153:    let vrm_to_fbx: HashMap<&str, &str> = mapped
crates/humanoid_retarget/src/orchestrate.rs:154:        .bone_tracks
crates/humanoid_retarget/src/orchestrate.rs:158:    let fbx_root = vrm_to_fbx.get("VRMC_vrm.root_bone").copied().unwrap_or("");
crates/humanoid_retarget/src/orchestrate.rs:159:    let fbx_hips = vrm_to_fbx.get("hips").copied().unwrap_or("");
crates/humanoid_retarget/src/orchestrate.rs:162:        vrm_rest.clone(),
crates/humanoid_retarget/src/orchestrate.rs:163:        Some(fbx_skeleton.clone()),
crates/humanoid_retarget/src/orchestrate.rs:165:        fbx_root,
crates/humanoid_retarget/src/orchestrate.rs:166:        fbx_hips,
crates/humanoid_retarget/src/orchestrate.rs:171:    let vrm_fk = fk_evaluate::evaluate(&retarget_output, vrm_rest);
crates/humanoid_retarget/src/orchestrate.rs:177:    // - vrm_to_fbx_name: per-VRM-bone FBX bone name, used by C1.1 to
crates/humanoid_retarget/src/orchestrate.rs:178:    //   look up FBX-side positions in fbx_skeleton for world-space
crates/humanoid_retarget/src/orchestrate.rs:181:    let mut vrm_to_fbx_name: HashMap<String, String> = HashMap::new();
crates/humanoid_retarget/src/orchestrate.rs:182:    for track in &mapped.bone_tracks {
crates/humanoid_retarget/src/orchestrate.rs:183:        if let Some(bt) = source_asset.tracks.get(&track.src_bone_name) {
crates/humanoid_retarget/src/orchestrate.rs:186:        vrm_to_fbx_name.insert(track.vrm_bone_name.clone(), track.src_bone_name.clone());
crates/humanoid_retarget/src/orchestrate.rs:192:        Some(&fbx_skeleton),
crates/humanoid_retarget/src/orchestrate.rs:194:        vrm_rest,
crates/humanoid_retarget/src/orchestrate.rs:196:        Some(&vrm_to_fbx_name),
crates/humanoid_retarget/src/source_anim.rs:3://! `SourceAsset` (in `fbx_rig`) is the canonical file-format wrapper that
crates/humanoid_retarget/src/source_anim.rs:4://! holds both skeletal animation tracks and blendshape tracks loaded from a
crates/humanoid_retarget/src/source_anim.rs:5://! single FBX. This module exposes two **borrowing views** over a
crates/humanoid_retarget/src/source_anim.rs:9://! - [`SourceAnimBody`] — bones, tracks, bind world, frame timing.
crates/humanoid_retarget/src/source_anim.rs:11://! - [`SourceAnimFacial`] — blendshape tracks, frame timing.
crates/humanoid_retarget/src/source_anim.rs:26://! `SourceFormat` is an enum with one variant today (`Fbx`). When a second
crates/humanoid_retarget/src/source_anim.rs:34:use crate::config::FbxSourceType;
crates/humanoid_retarget/src/source_anim.rs:35:use crate::fbx::{FbxBone, FbxBoneTrack, SourceAsset};
crates/humanoid_retarget/src/source_anim.rs:39:/// One variant today (`Fbx`). The enum exists so future format additions
crates/humanoid_retarget/src/source_anim.rs:44:    Fbx,
crates/humanoid_retarget/src/source_anim.rs:57:    pub bones: &'a HashMap<String, FbxBone>,
crates/humanoid_retarget/src/source_anim.rs:58:    pub tracks: &'a HashMap<String, FbxBoneTrack>,
crates/humanoid_retarget/src/source_anim.rs:59:    pub bind_world: &'a HashMap<String, Mat4>,
crates/humanoid_retarget/src/source_anim.rs:62:    pub detected_source_type: FbxSourceType,
crates/humanoid_retarget/src/source_anim.rs:69:            format: SourceFormat::Fbx,
crates/humanoid_retarget/src/source_anim.rs:71:            tracks: &asset.tracks,
crates/humanoid_retarget/src/source_anim.rs:72:            bind_world: &asset.bind_world,
crates/humanoid_retarget/src/source_anim.rs:79:    /// Returns true when the body slice has no animation tracks (e.g. a
crates/humanoid_retarget/src/source_anim.rs:80:    /// facial-only FBX). Useful for callers that want to skip body
crates/humanoid_retarget/src/source_anim.rs:83:        self.tracks.is_empty()
crates/humanoid_retarget/src/source_anim.rs:89:/// Holds blendshape tracks and frame timing only. No bones, no bind world.
crates/humanoid_retarget/src/source_anim.rs:94:    pub blend_shape_tracks: &'a HashMap<String, Vec<f32>>,
crates/humanoid_retarget/src/source_anim.rs:103:            format: SourceFormat::Fbx,
crates/humanoid_retarget/src/source_anim.rs:104:            blend_shape_tracks: &asset.blend_shape_tracks,
crates/humanoid_retarget/src/source_anim.rs:110:    /// Returns true when the facial slice has no blendshape tracks.
crates/humanoid_retarget/src/source_anim.rs:111:    /// Body-only FBX files (most game animations) hit this case.
crates/humanoid_retarget/src/source_anim.rs:113:        self.blend_shape_tracks.is_empty()
crates/humanoid_retarget/src/retargeter.rs:4:use crate::fbx::SourceAsset;
crates/humanoid_retarget/src/retargeter.rs:7:    ExpressionTrack, FbxSkeletonFrames, TargetAnimation, MappedAnimation,
crates/humanoid_retarget/src/retargeter.rs:8:    RetargetedBone, VrmRestPose,
crates/humanoid_retarget/src/retargeter.rs:27:    dst_rest_local: Quat,
crates/humanoid_retarget/src/retargeter.rs:28:    dst_rest_global_inv: Quat,
crates/humanoid_retarget/src/retargeter.rs:29:    dst_rest_global: Quat,
crates/humanoid_retarget/src/retargeter.rs:30:    parent_rest_yup: Quat,
crates/humanoid_retarget/src/retargeter.rs:31:    bone_rest_yup_inv: Quat,
crates/humanoid_retarget/src/retargeter.rs:32:    src_local_rest: Quat,
crates/humanoid_retarget/src/retargeter.rs:33:    bone_rest_t: Vec3,
crates/humanoid_retarget/src/retargeter.rs:42:    /// FBX bone positions for all frames (pre-sliced reference)
crates/humanoid_retarget/src/retargeter.rs:43:    fbx_bone_key: String,
crates/humanoid_retarget/src/retargeter.rs:44:    fbx_child_key: String,
crates/humanoid_retarget/src/retargeter.rs:59:/// FBX bone position data for a correction pair, for all frames.
crates/humanoid_retarget/src/retargeter.rs:60:struct FbxPairFrameData {
crates/humanoid_retarget/src/retargeter.rs:88:    fbx_skeleton: Option<FbxSkeletonFrames>,
crates/humanoid_retarget/src/retargeter.rs:105:    /// Enable the ARP→VRM full-body rest alignment adapter
crates/humanoid_retarget/src/retargeter.rs:106:    /// (`adapters::arp_vrm::align_full_body_rest`). Off by default.
crates/humanoid_retarget/src/retargeter.rs:108:    /// rest local rotation overridden so the world rest matches ARP.
crates/humanoid_retarget/src/retargeter.rs:109:    pub arp_vrm_rest_align: bool,
crates/humanoid_retarget/src/retargeter.rs:114:        vrm_rest: VrmRestPose,
crates/humanoid_retarget/src/retargeter.rs:115:        fbx_skeleton: Option<FbxSkeletonFrames>,
crates/humanoid_retarget/src/retargeter.rs:117:        _fbx_root_name: &str,
crates/humanoid_retarget/src/retargeter.rs:118:        fbx_hips_name: &str,
crates/humanoid_retarget/src/retargeter.rs:121:            vrm_rest,
crates/humanoid_retarget/src/retargeter.rs:122:            fbx_skeleton,
crates/humanoid_retarget/src/retargeter.rs:124:            _fbx_root_name,
crates/humanoid_retarget/src/retargeter.rs:125:            fbx_hips_name,
crates/humanoid_retarget/src/retargeter.rs:131:        mut vrm_rest: VrmRestPose,
crates/humanoid_retarget/src/retargeter.rs:132:        fbx_skeleton: Option<FbxSkeletonFrames>,
crates/humanoid_retarget/src/retargeter.rs:134:        _fbx_root_name: &str,
crates/humanoid_retarget/src/retargeter.rs:135:        fbx_hips_name: &str,
crates/humanoid_retarget/src/retargeter.rs:140:        // --- Adapters layer (init-time, before any rest map is read) ---
crates/humanoid_retarget/src/retargeter.rs:141:        if options.arp_vrm_rest_align {
crates/humanoid_retarget/src/retargeter.rs:142:            let (overrides, warnings) = crate::adapters::arp_vrm::align_full_body_rest(
crates/humanoid_retarget/src/retargeter.rs:143:                &mut vrm_rest.bone_rest_local,
crates/humanoid_retarget/src/retargeter.rs:144:                &mut vrm_rest.bone_rest_global,
crates/humanoid_retarget/src/retargeter.rs:145:                &vrm_rest.parent_map,
crates/humanoid_retarget/src/retargeter.rs:146:                &anim.bone_tracks,
crates/humanoid_retarget/src/retargeter.rs:166:            let upper = vrm_rest.bone_rest_translation.get("leftUpperLeg")
crates/humanoid_retarget/src/retargeter.rs:167:                .or_else(|| vrm_rest.bone_rest_translation.get("rightUpperLeg"))
crates/humanoid_retarget/src/retargeter.rs:169:            let lower = vrm_rest.bone_rest_translation.get("leftLowerLeg")
crates/humanoid_retarget/src/retargeter.rs:170:                .or_else(|| vrm_rest.bone_rest_translation.get("rightLowerLeg"))
crates/humanoid_retarget/src/retargeter.rs:172:            let foot = vrm_rest.bone_rest_translation.get("leftFoot")
crates/humanoid_retarget/src/retargeter.rs:173:                .or_else(|| vrm_rest.bone_rest_translation.get("rightFoot"))
crates/humanoid_retarget/src/retargeter.rs:177:        let fbx_leg_length = {
crates/humanoid_retarget/src/retargeter.rs:179:                let fbx_name = anim.bone_tracks.iter()
crates/humanoid_retarget/src/retargeter.rs:182:                fbx_skeleton.as_ref()?
crates/humanoid_retarget/src/retargeter.rs:183:                    .bone_positions.get(fbx_name)?.first()
crates/humanoid_retarget/src/retargeter.rs:194:        let fbx_hips_height = fbx_skeleton.as_ref()
crates/humanoid_retarget/src/retargeter.rs:195:            .and_then(|s| s.bone_positions.get(fbx_hips_name))
crates/humanoid_retarget/src/retargeter.rs:197:        let scale_ratio = if vrm_leg_length > 0.1 && fbx_leg_length > 0.1 {
crates/humanoid_retarget/src/retargeter.rs:198:            vrm_leg_length / fbx_leg_length
crates/humanoid_retarget/src/retargeter.rs:199:        } else if fbx_hips_height > 0.01 {
crates/humanoid_retarget/src/retargeter.rs:200:            vrm_rest.hips_height / fbx_hips_height
crates/humanoid_retarget/src/retargeter.rs:204:            "[SCALE] vrm_leg={:.3} fbx_leg={:.3} ratio={:.3}",
crates/humanoid_retarget/src/retargeter.rs:205:            vrm_leg_length, fbx_leg_length, scale_ratio,
crates/humanoid_retarget/src/retargeter.rs:208:        let is_blender = anim.source_resolved == crate::config::FbxSourceType::Blender;
crates/humanoid_retarget/src/retargeter.rs:214:        let root_rot = vrm_rest.root_rest_rotation;
crates/humanoid_retarget/src/retargeter.rs:219:        let topo = crate::topo::build_vrm_topo_order(&vrm_rest.parent_map);
crates/humanoid_retarget/src/retargeter.rs:221:        let track_by_name: HashMap<&str, &crate::types::BoneTrack> = anim.bone_tracks.iter()
crates/humanoid_retarget/src/retargeter.rs:227:                vrm_rest.bone_rest_local.contains_key(name.as_str())
crates/humanoid_retarget/src/retargeter.rs:239:            let dst_rest_local = vrm_rest.bone_rest_local.get(vrm_name).copied().unwrap_or(Quat::IDENTITY);
crates/humanoid_retarget/src/retargeter.rs:240:            let dst_rest_global = vrm_rest.bone_rest_global.get(vrm_name).copied().unwrap_or(Quat::IDENTITY);
crates/humanoid_retarget/src/retargeter.rs:241:            let parent_idx = vrm_rest.parent_map.get(vrm_name)
crates/humanoid_retarget/src/retargeter.rs:246:            let parent_rest_yup = coord_rot * track.src_parent_global_rest * coord_rot_inv;
crates/humanoid_retarget/src/retargeter.rs:247:            let bone_rest_yup_inv = (coord_rot * track.src_global_rest * coord_rot_inv).inverse();
crates/humanoid_retarget/src/retargeter.rs:253:                dst_rest_local,
crates/humanoid_retarget/src/retargeter.rs:254:                dst_rest_global_inv: dst_rest_global.inverse(),
crates/humanoid_retarget/src/retargeter.rs:255:                dst_rest_global,
crates/humanoid_retarget/src/retargeter.rs:256:                parent_rest_yup,
crates/humanoid_retarget/src/retargeter.rs:257:                bone_rest_yup_inv,
crates/humanoid_retarget/src/retargeter.rs:258:                src_local_rest: track.src_local_rest,
crates/humanoid_retarget/src/retargeter.rs:259:                bone_rest_t: vrm_rest.bone_rest_translation.get(vrm_name).copied().unwrap_or(Vec3::ZERO),
crates/humanoid_retarget/src/retargeter.rs:279:        // so its hand → middleProximal direction matches FBX's, fixing wrist
crates/humanoid_retarget/src/retargeter.rs:294:        let vrm_to_fbx: HashMap<&str, &str> = anim.bone_tracks.iter()
crates/humanoid_retarget/src/retargeter.rs:300:                let fbx_bone_key = vrm_to_fbx.get(bone).map(|s| s.to_string()).unwrap_or_default();
crates/humanoid_retarget/src/retargeter.rs:301:                let fbx_child_key = vrm_to_fbx.get(child).map(|s| s.to_string()).unwrap_or_default();
crates/humanoid_retarget/src/retargeter.rs:302:                correction_pairs.push(CorrectionPair { bone_idx: bi, child_idx: ci, fbx_bone_key, fbx_child_key });
crates/humanoid_retarget/src/retargeter.rs:310:        let foot_sole_offset = vrm_rest.foot_sole_offset;
crates/humanoid_retarget/src/retargeter.rs:315:            scale_ratio, bones, descendants, correction_pairs, fbx_skeleton,
crates/humanoid_retarget/src/retargeter.rs:317:            foot_contact: vrm_rest.foot_contact.clone(),
crates/humanoid_retarget/src/retargeter.rs:343:                let full_anim = bd.src_local_rest * anim_rot;
crates/humanoid_retarget/src/retargeter.rs:344:                // coord_rot baked into parent_rest_yup/bone_rest_yup_inv at init
crates/humanoid_retarget/src/retargeter.rs:345:                let normalized = (bd.parent_rest_yup * full_anim * bd.bone_rest_yup_inv).normalize();
crates/humanoid_retarget/src/retargeter.rs:346:                let local = (bd.dst_rest_local * bd.dst_rest_global_inv * normalized * bd.dst_rest_global).normalize();
crates/humanoid_retarget/src/retargeter.rs:357:                        .map(|&delta| bd.bone_rest_t + delta * self.scale_ratio)
crates/humanoid_retarget/src/retargeter.rs:358:                        .unwrap_or(bd.bone_rest_t)
crates/humanoid_retarget/src/retargeter.rs:360:                    bd.bone_rest_t
crates/humanoid_retarget/src/retargeter.rs:377:    /// Reads `pair_fbx_data` (FBX bone positions) and
crates/humanoid_retarget/src/retargeter.rs:384:        pair_fbx_data: &[Option<FbxPairFrameData>],
crates/humanoid_retarget/src/retargeter.rs:387:        if self.fbx_skeleton.is_none() { return; }
crates/humanoid_retarget/src/retargeter.rs:393:                    let Some(ref fdata) = pair_fbx_data[pair_idx] else { continue };
crates/humanoid_retarget/src/retargeter.rs:397:                    let fbx_dir = (Vec3::new(fc[0], fc[1], fc[2]) - Vec3::new(fp[0], fp[1], fp[2])).normalize_or_zero();
crates/humanoid_retarget/src/retargeter.rs:398:                    if fbx_dir.length_squared() < 0.5 { continue; }
crates/humanoid_retarget/src/retargeter.rs:403:                    let angle = vrm_dir.dot(fbx_dir).clamp(-1.0, 1.0).acos();
crates/humanoid_retarget/src/retargeter.rs:410:                    let full_correction = Quat::from_rotation_arc(vrm_dir, fbx_dir);
crates/humanoid_retarget/src/retargeter.rs:429:                        buffers.world_pos[frame][desc_idx] = dp_pos + dp_rot * desc.bone_rest_t;
crates/humanoid_retarget/src/retargeter.rs:439:    /// Post-loop ground contact: FBX toe-based per-frame hips offset.
crates/humanoid_retarget/src/retargeter.rs:499:        // --- Ground contact: FBX toe-based per-frame hips offset ---
crates/humanoid_retarget/src/retargeter.rs:500:        // Uses FBX source toe bone Y to detect contact frames.
crates/humanoid_retarget/src/retargeter.rs:501:        // When FBX toe is at rest height (±threshold) = foot on ground.
crates/humanoid_retarget/src/retargeter.rs:503:        // Sitting/lying: FBX toe Y differs from rest → no correction.
crates/humanoid_retarget/src/retargeter.rs:504:        if let (Some(skel), Some(hips_idx)) = (&self.fbx_skeleton, self.hips_idx) {
crates/humanoid_retarget/src/retargeter.rs:505:            // Find FBX toe bone names
crates/humanoid_retarget/src/retargeter.rs:506:            let fbx_toe_l = anim.bone_tracks.iter()
crates/humanoid_retarget/src/retargeter.rs:509:            let fbx_toe_r = anim.bone_tracks.iter()
crates/humanoid_retarget/src/retargeter.rs:513:            let fbx_toe_l_y: Vec<f32> = fbx_toe_l
crates/humanoid_retarget/src/retargeter.rs:517:            let fbx_toe_r_y: Vec<f32> = fbx_toe_r
crates/humanoid_retarget/src/retargeter.rs:522:            // FBX toe rest Y = frame 0
crates/humanoid_retarget/src/retargeter.rs:523:            let toe_rest_l = fbx_toe_l_y.first().copied().unwrap_or(0.0);
crates/humanoid_retarget/src/retargeter.rs:524:            let toe_rest_r = fbx_toe_r_y.first().copied().unwrap_or(0.0);
crates/humanoid_retarget/src/retargeter.rs:525:            let contact_margin = 0.02; // 2cm — toe within ±2cm of rest = contact
crates/humanoid_retarget/src/retargeter.rs:527:            // VRM sole Y at frame 0 (how much feet are floating)
crates/humanoid_retarget/src/retargeter.rs:528:            // Compute FK once for frame 0 to get sole offset
crates/humanoid_retarget/src/retargeter.rs:530:                // Use stored foot world positions from frame 0
crates/humanoid_retarget/src/retargeter.rs:545:                                .map(|b| b.bone_rest_t).unwrap_or(Vec3::ZERO));
crates/humanoid_retarget/src/retargeter.rs:567:                        let toe_l = fbx_toe_l_y.get(frame).copied().unwrap_or(toe_rest_l);
crates/humanoid_retarget/src/retargeter.rs:568:                        let toe_r = fbx_toe_r_y.get(frame).copied().unwrap_or(toe_rest_r);
crates/humanoid_retarget/src/retargeter.rs:569:                        let l_grounded = (toe_l - toe_rest_l).abs() < contact_margin;
crates/humanoid_retarget/src/retargeter.rs:570:                        let r_grounded = (toe_r - toe_rest_r).abs() < contact_margin;
crates/humanoid_retarget/src/retargeter.rs:589:        let frame_count = anim.bone_tracks.first().map(|t| t.rotations.len()).unwrap_or(0);
crates/humanoid_retarget/src/retargeter.rs:592:        let track_by_name: HashMap<&str, &crate::types::BoneTrack> = anim.bone_tracks.iter()
crates/humanoid_retarget/src/retargeter.rs:595:        // Pre-load FBX positions for correction pairs (fix #2)
crates/humanoid_retarget/src/retargeter.rs:596:        let pair_fbx_data: Vec<Option<FbxPairFrameData>> = self.correction_pairs.iter().map(|pair| {
crates/humanoid_retarget/src/retargeter.rs:597:            let skel = self.fbx_skeleton.as_ref()?;
crates/humanoid_retarget/src/retargeter.rs:598:            let bp = skel.bone_positions.get(&pair.fbx_bone_key)?.clone();
crates/humanoid_retarget/src/retargeter.rs:599:            let cp = skel.bone_positions.get(&pair.fbx_child_key)?.clone();
crates/humanoid_retarget/src/retargeter.rs:600:            Some(FbxPairFrameData { bone_positions: bp, child_positions: cp })
crates/humanoid_retarget/src/retargeter.rs:622:        self.pass2_direction_correction(frame_count, &pair_fbx_data, &mut buffers);
crates/humanoid_retarget/src/retargeter.rs:639:                    let error = first_rot.angle_between(bd.dst_rest_local).to_degrees();
crates/humanoid_retarget/src/retargeter.rs:652:                            trans.iter().map(|&delta| bd.bone_rest_t + delta * self.scale_ratio).collect::<Vec<Vec3>>()
crates/humanoid_retarget/src/retargeter.rs:666:            bone_count: anim.bone_tracks.len(), scale_ratio: self.scale_ratio,
crates/humanoid_retarget/src/retargeter.rs:675:            expression_tracks: anim.expression_tracks.iter()
crates/humanoid_retarget/src/retargeter.rs:683:/// Passthrough retargeter: copies source tracks directly into target VRM
crates/humanoid_retarget/src/retargeter.rs:689:/// transformation step; everything else is a byte-copy of rotation tracks.
crates/humanoid_retarget/src/retargeter.rs:704:    /// Run the identity passthrough on a source asset. `vrm_rest` is
crates/humanoid_retarget/src/retargeter.rs:706:    /// identity ignores rest pose by definition.
crates/humanoid_retarget/src/retargeter.rs:710:        vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/retargeter.rs:717:                .tracks
crates/humanoid_retarget/src/retargeter.rs:739:        let _ = vrm_rest;
crates/humanoid_retarget/src/retargeter.rs:744:            expression_tracks: Vec::new(),
crates/humanoid_retarget/src/quality/score.rs:6:use crate::types::{FbxSkeletonFrames, TargetAnimation, VrmRestPose};
crates/humanoid_retarget/src/quality/score.rs:58:    vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/quality/score.rs:72:    let topo = build_topo_order(&vrm_rest.parent_map, &all_bones);
crates/humanoid_retarget/src/quality/score.rs:81:            // Local rotation: from retarget result, or rest pose
crates/humanoid_retarget/src/quality/score.rs:84:                .unwrap_or_else(|| vrm_rest.bone_rest_local.get(bone_name).copied().unwrap_or(Quat::IDENTITY));
crates/humanoid_retarget/src/quality/score.rs:86:            // Local translation: from retarget result (hips), or rest translation
crates/humanoid_retarget/src/quality/score.rs:90:                .unwrap_or_else(|| vrm_rest.bone_rest_translation.get(bone_name).copied().unwrap_or(Vec3::ZERO));
crates/humanoid_retarget/src/quality/score.rs:93:            let parent_name = vrm_rest.parent_map.get(bone_name);
crates/humanoid_retarget/src/quality/score.rs:137:/// Score retarget result by comparing FK world positions against FBX source.
crates/humanoid_retarget/src/quality/score.rs:140:    vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/quality/score.rs:141:    fbx_skeleton: &FbxSkeletonFrames,
crates/humanoid_retarget/src/quality/score.rs:142:    bone_mapping: &HashMap<String, String>, // vrm_name → fbx_name
crates/humanoid_retarget/src/quality/score.rs:145:    let vrm_world = compute_vrm_world_positions(result, vrm_rest);
crates/humanoid_retarget/src/quality/score.rs:156:        let fbx_bone_name = bone_mapping.get(bone);
crates/humanoid_retarget/src/quality/score.rs:157:        let fbx_child_name = bone_mapping.get(child);
crates/humanoid_retarget/src/quality/score.rs:158:        let fbx_bone_pos = fbx_bone_name.and_then(|n| fbx_skeleton.bone_positions.get(n));
crates/humanoid_retarget/src/quality/score.rs:159:        let fbx_child_pos = fbx_child_name.and_then(|n| fbx_skeleton.bone_positions.get(n));
crates/humanoid_retarget/src/quality/score.rs:161:        if let (Some(vb), Some(vc), Some(fb), Some(fc)) = (vrm_bone_pos, vrm_child_pos, fbx_bone_pos, fbx_child_pos) {
crates/humanoid_retarget/src/quality/score.rs:168:                let fbx_dir = (Vec3::new(fc_p[0], fc_p[1], fc_p[2]) - Vec3::new(fb_p[0], fb_p[1], fb_p[2])).normalize_or_zero();
crates/humanoid_retarget/src/quality/score.rs:169:                if vrm_dir.length_squared() < 0.5 || fbx_dir.length_squared() < 0.5 { return None; }
crates/humanoid_retarget/src/quality/score.rs:170:                Some(vrm_dir.dot(fbx_dir).clamp(-1.0, 1.0).acos().to_degrees())
crates/humanoid_retarget/src/quality/score.rs:178:    let fbx_hips_name = bone_mapping.get("hips");
crates/humanoid_retarget/src/quality/score.rs:179:    let fbx_hips = fbx_hips_name.and_then(|n| fbx_skeleton.bone_positions.get(n));
crates/humanoid_retarget/src/quality/score.rs:183:        let fbx_name = bone_mapping.get(bone);
crates/humanoid_retarget/src/quality/score.rs:184:        let fbx_pos = fbx_name.and_then(|n| fbx_skeleton.bone_positions.get(n));
crates/humanoid_retarget/src/quality/score.rs:186:        let pos_errors: Vec<f32> = if let (Some(vp), Some(fp), Some(vh), Some(fh)) = (vrm_pos, fbx_pos, vrm_hips, fbx_hips) {
crates/humanoid_retarget/src/quality/score.rs:193:                let fbx_rel = (Vec3::new(fraw[0], fraw[1], fraw[2]) - Vec3::new(f_hips[0], f_hips[1], f_hips[2])) * scale_ratio;
crates/humanoid_retarget/src/quality/score.rs:194:                Some((vrm_rel - fbx_rel).length())
crates/humanoid_retarget/src/quality/score.rs:238:// === Finger Rest Pose Scoring ===
crates/humanoid_retarget/src/quality/score.rs:242:    pub rest_error_deg: f32,
crates/humanoid_retarget/src/quality/score.rs:246:pub struct FingerRestScore {
crates/humanoid_retarget/src/quality/score.rs:248:    pub mean_rest_error: f32,
crates/humanoid_retarget/src/quality/score.rs:249:    pub max_rest_error: f32,
crates/humanoid_retarget/src/quality/score.rs:253:/// Score finger retarget: does frame 0 match VRM rest? How much do fingers move?
crates/humanoid_retarget/src/quality/score.rs:256:    vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/quality/score.rs:257:) -> FingerRestScore {
crates/humanoid_retarget/src/quality/score.rs:270:        let rest = vrm_rest.bone_rest_local.get(name).copied().unwrap_or(Quat::IDENTITY);
crates/humanoid_retarget/src/quality/score.rs:272:        // Frame 0 vs rest (rest pose match)
crates/humanoid_retarget/src/quality/score.rs:273:        let rest_error = bone.rotations.first()
crates/humanoid_retarget/src/quality/score.rs:274:            .map(|&r| r.angle_between(rest).to_degrees())
crates/humanoid_retarget/src/quality/score.rs:286:            rest_error_deg: rest_error,
crates/humanoid_retarget/src/quality/score.rs:291:    let mean_rest = if bones.is_empty() { 0.0 }
crates/humanoid_retarget/src/quality/score.rs:292:        else { bones.iter().map(|b| b.rest_error_deg).sum::<f32>() / bones.len() as f32 };
crates/humanoid_retarget/src/quality/score.rs:293:    let max_rest = bones.iter().map(|b| b.rest_error_deg).fold(0.0f32, f32::max);
crates/humanoid_retarget/src/quality/score.rs:296:    let grade = if max_rest < 1.0 { RqGrade::A }
crates/humanoid_retarget/src/quality/score.rs:297:        else if max_rest < 5.0 { RqGrade::B }
crates/humanoid_retarget/src/quality/score.rs:298:        else if max_rest < 15.0 { RqGrade::C }
crates/humanoid_retarget/src/quality/score.rs:301:    FingerRestScore { bones, mean_rest_error: mean_rest, max_rest_error: max_rest, grade }
crates/humanoid_retarget/src/bin/pop_scan.rs:1://! Scan FBX rotation tracks for frame-to-frame pops (angular jumps).
crates/humanoid_retarget/src/bin/pop_scan.rs:4://! Usage: pop_scan <fbx_path> [threshold_deg=5]
crates/humanoid_retarget/src/bin/pop_scan.rs:12:        eprintln!("Usage: pop_scan <fbx_path> [threshold_deg=5]");
crates/humanoid_retarget/src/bin/pop_scan.rs:15:    let threshold: f32 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(5.0);
crates/humanoid_retarget/src/bin/pop_scan.rs:17:    let bytes = fs::read(&args[1]).expect("read fbx");
crates/humanoid_retarget/src/bin/pop_scan.rs:18:    let data = fbx_rig::parse(&bytes).expect("parse");
crates/humanoid_retarget/src/bin/pop_scan.rs:20:    println!("FBX: {}", args[1]);
crates/humanoid_retarget/src/bin/pop_scan.rs:26:    for (name, track) in &data.tracks {
crates/humanoid_retarget/src/quality/fk_evaluate.rs:20:    vrm_rest: &crate::types::VrmRestPose,
crates/humanoid_retarget/src/quality/fk_evaluate.rs:47:    // Collect all bone names from rest pose.
crates/humanoid_retarget/src/quality/fk_evaluate.rs:48:    let all_bones: Vec<String> = vrm_rest.bone_rest_local.keys().cloned().collect();
crates/humanoid_retarget/src/quality/fk_evaluate.rs:51:    // Pattern mirrors compute_fbx_skeleton_from_parsed.
crates/humanoid_retarget/src/quality/fk_evaluate.rs:68:            if let Some(parent) = vrm_rest.parent_map.get(&current) {
crates/humanoid_retarget/src/quality/fk_evaluate.rs:88:            // Local rotation: from retarget track if available, else rest pose.
crates/humanoid_retarget/src/quality/fk_evaluate.rs:96:                        vrm_rest
crates/humanoid_retarget/src/quality/fk_evaluate.rs:97:                            .bone_rest_local
crates/humanoid_retarget/src/quality/fk_evaluate.rs:103:                vrm_rest
crates/humanoid_retarget/src/quality/fk_evaluate.rs:104:                    .bone_rest_local
crates/humanoid_retarget/src/quality/fk_evaluate.rs:111:            // otherwise fall back to rest translation.
crates/humanoid_retarget/src/quality/fk_evaluate.rs:119:                        vrm_rest
crates/humanoid_retarget/src/quality/fk_evaluate.rs:120:                            .bone_rest_translation
crates/humanoid_retarget/src/quality/fk_evaluate.rs:126:                vrm_rest
crates/humanoid_retarget/src/quality/fk_evaluate.rs:127:                    .bone_rest_translation
crates/humanoid_retarget/src/quality/fk_evaluate.rs:134:            let (parent_pos, parent_rot) = vrm_rest
crates/humanoid_retarget/src/bin/retarget_test.rs:3://! Scans VRM models × FBX animations, runs full pipeline + rubric A/B/C scoring.
crates/humanoid_retarget/src/bin/retarget_test.rs:6://!   retarget-test <models_dir> <fbx_dir> <config_path> [--save output.json] [--baseline baseline.json]
crates/humanoid_retarget/src/bin/retarget_test.rs:17:        eprintln!("Usage: retarget-test <models_dir> <fbx_dir> <config_path> [--save output.json] [--baseline baseline.json]");
crates/humanoid_retarget/src/bin/retarget_test.rs:22:    let fbx_dir = &args[2];
crates/humanoid_retarget/src/bin/retarget_test.rs:34:    let fbx_files = scan_dir(fbx_dir, "fbx");
crates/humanoid_retarget/src/bin/retarget_test.rs:36:    println!("Found {} VRM models, {} FBX animations", vrm_files.len(), fbx_files.len());
crates/humanoid_retarget/src/bin/retarget_test.rs:40:    // Cache results by FBX path so the C loop can gate on hard-fail
crates/humanoid_retarget/src/bin/retarget_test.rs:45:    for fbx_path in &fbx_files {
crates/humanoid_retarget/src/bin/retarget_test.rs:46:        let fbx_name = Path::new(fbx_path).file_name().unwrap().to_str().unwrap();
crates/humanoid_retarget/src/bin/retarget_test.rs:47:        let fbx_bytes = match fs::read(fbx_path) {
crates/humanoid_retarget/src/bin/retarget_test.rs:49:            Err(e) => { println!("{:<42} READ FAIL — {}", truncate(fbx_name, 42), e); continue; }
crates/humanoid_retarget/src/bin/retarget_test.rs:51:        let fbx = match humanoid_retarget::fbx::parse(&fbx_bytes) {
crates/humanoid_retarget/src/bin/retarget_test.rs:53:            Err(e) => { println!("{:<42} PARSE FAIL — {}", truncate(fbx_name, 42), e); continue; }
crates/humanoid_retarget/src/bin/retarget_test.rs:55:        let score_a = rubric_a::evaluate(&fbx);
crates/humanoid_retarget/src/bin/retarget_test.rs:56:        println!("{:<42} {}", truncate(fbx_name, 42), score_a);
crates/humanoid_retarget/src/bin/retarget_test.rs:57:        rubric_a_cache.insert(fbx_path.clone(), score_a);
crates/humanoid_retarget/src/bin/retarget_test.rs:64:    // Parse VRM files and store rest pose + cached B result for the C loop's gating.
crates/humanoid_retarget/src/bin/retarget_test.rs:65:    let mut vrm_data: Vec<(String, Vec<u8>, humanoid_retarget::types::VrmRestPose, VrmVersion, humanoid_retarget::quality::RubricResult)> = Vec::new();
crates/humanoid_retarget/src/bin/retarget_test.rs:89:        let rest = match humanoid_retarget::vrm_rest::extract_vrm_rest_pose(vrm_data_bytes) {
crates/humanoid_retarget/src/bin/retarget_test.rs:91:            Err(e) => { println!("{:<42} REST EXTRACT FAIL — {}", truncate(vrm_name, 42), e); continue; }
crates/humanoid_retarget/src/bin/retarget_test.rs:94:        let score_b = rubric_b::evaluate(&rest);
crates/humanoid_retarget/src/bin/retarget_test.rs:99:        vrm_data.push((vrm_name.to_string(), store_bytes, rest, vrm_version, score_b));
crates/humanoid_retarget/src/bin/retarget_test.rs:111:    for (vrm_name, _vrm_bytes, vrm_rest, vrm_version, score_b) in &vrm_data {
crates/humanoid_retarget/src/bin/retarget_test.rs:112:        for fbx_path in &fbx_files {
crates/humanoid_retarget/src/bin/retarget_test.rs:113:            let fbx_name = Path::new(fbx_path).file_name().unwrap().to_str().unwrap();
crates/humanoid_retarget/src/bin/retarget_test.rs:116:            let label = format!("{} x {}", truncate(vrm_name, 20), truncate(fbx_name, 25));
crates/humanoid_retarget/src/bin/retarget_test.rs:123:            if rubric_a_cache.get(fbx_path).is_none() {
crates/humanoid_retarget/src/bin/retarget_test.rs:137:            let fbx_bytes = match fs::read(fbx_path) {
crates/humanoid_retarget/src/bin/retarget_test.rs:141:            let fbx_parsed = match humanoid_retarget::fbx::parse(&fbx_bytes) {
crates/humanoid_retarget/src/bin/retarget_test.rs:146:            let pipeline = evaluate_pipeline(&fbx_parsed, vrm_rest, &config, *vrm_version);
crates/humanoid_retarget/src/quality/rubric_b.rs:55:fn check_hard_fails(vrm_rest: &crate::types::VrmRestPose) -> Vec<HardFailCheck> {
crates/humanoid_retarget/src/quality/rubric_b.rs:59:    let translations = &vrm_rest.bone_rest_translation;
crates/humanoid_retarget/src/quality/rubric_b.rs:76:    // B0.2: No NaN in bone rests
crates/humanoid_retarget/src/quality/rubric_b.rs:84:    for (name, q) in &vrm_rest.bone_rest_local {
crates/humanoid_retarget/src/quality/rubric_b.rs:93:        name: "no_nan_in_rest".to_string(),
crates/humanoid_retarget/src/quality/rubric_b.rs:107:fn metric_completeness(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:108:    let translations = &vrm_rest.bone_rest_translation;
crates/humanoid_retarget/src/quality/rubric_b.rs:130:/// the nearest edge as a fraction of the range midpoint.
crates/humanoid_retarget/src/quality/rubric_b.rs:143:fn metric_proportion(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:144:    let t = &vrm_rest.bone_rest_translation;
crates/humanoid_retarget/src/quality/rubric_b.rs:145:    let w = &vrm_rest.bone_world_position;
crates/humanoid_retarget/src/quality/rubric_b.rs:178:    // on shoulder bones being rest-aligned to the X axis.
crates/humanoid_retarget/src/quality/rubric_b.rs:220:// ─── B1.3 Rest Pose T-Pose Alignment ─────────────────────────────────────────
crates/humanoid_retarget/src/quality/rubric_b.rs:222:/// Given a global rest quaternion, extract the direction the bone points in world space.
crates/humanoid_retarget/src/quality/rubric_b.rs:226:    // Rotate world X by the global rest quat to get the bone's direction.
crates/humanoid_retarget/src/quality/rubric_b.rs:233:    // In rest the lower leg points along -Y (downward).
crates/humanoid_retarget/src/quality/rubric_b.rs:241:fn metric_tpose(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:242:    let g = &vrm_rest.bone_rest_global;
crates/humanoid_retarget/src/quality/rubric_b.rs:264:            detail: "no arm/leg global rest data".to_string(),
crates/humanoid_retarget/src/quality/rubric_b.rs:314:fn metric_sole_offset(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:315:    let (left_offset, right_offset) = vrm_rest.foot_sole_offset;
crates/humanoid_retarget/src/quality/rubric_b.rs:349:pub fn evaluate(vrm_rest: &crate::types::VrmRestPose) -> RubricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:351:    let hard_fails = check_hard_fails(vrm_rest);
crates/humanoid_retarget/src/quality/rubric_b.rs:355:    let completeness = metric_completeness(vrm_rest);
crates/humanoid_retarget/src/quality/rubric_b.rs:356:    let proportion = metric_proportion(vrm_rest);
crates/humanoid_retarget/src/quality/rubric_b.rs:357:    let tpose = metric_tpose(vrm_rest);
crates/humanoid_retarget/src/quality/rubric_b.rs:358:    let sole = metric_sole_offset(vrm_rest);
crates/humanoid_retarget/src/mapping.rs:5:use crate::fbx::{FbxBone, SourceAsset};
crates/humanoid_retarget/src/mapping.rs:13:/// 2단계: 손가락 global_rest를 재계산 (parent × local_rest). 체인 순서 보존 위해 topo.
crates/humanoid_retarget/src/mapping.rs:15:    global_rest: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/mapping.rs:16:    local_rest: &HashMap<String, Quat>,
crates/humanoid_retarget/src/mapping.rs:17:    bones: &HashMap<String, FbxBone>,
crates/humanoid_retarget/src/mapping.rs:43:                .and_then(|p| global_rest.get(p))
crates/humanoid_retarget/src/mapping.rs:46:            let local = local_rest.get(&name).copied().unwrap_or(Quat::IDENTITY);
crates/humanoid_retarget/src/mapping.rs:47:            global_rest.insert(name.clone(), parent_global * local);
crates/humanoid_retarget/src/mapping.rs:54:/// Euler 재구성 결과를 bind pose rotation으로 교체. global_rest는 본별 절대값이라
crates/humanoid_retarget/src/mapping.rs:55:/// 개별 덮어쓰기가 안전 (children도 자신의 bind_world로 독립 해결됨).
crates/humanoid_retarget/src/mapping.rs:57:/// 증상의 근본 원인이 PreRot * LclRest 수동 재구성의 부호/순서 버그로 확정됨.
crates/humanoid_retarget/src/mapping.rs:59:/// 손가락 제외 + 재계산: bind와 rest의 축이 180° 다름 (dump에서 Δ 120°+ 확인).
crates/humanoid_retarget/src/mapping.rs:60:/// 기존 v5 scalar curl + AXIS_CORRECTION이 rest axis 기준으로 튜닝돼 있어
crates/humanoid_retarget/src/mapping.rs:62:/// hand는 bind인데 finger의 global_rest는 옛 Euler hand 기준이라
crates/humanoid_retarget/src/mapping.rs:64:/// 해결: 손가락의 global_rest = bind(parent) * local_rest(finger)로 재계산.
crates/humanoid_retarget/src/mapping.rs:67:    global_rest: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/mapping.rs:68:    local_rest: &HashMap<String, Quat>,
crates/humanoid_retarget/src/mapping.rs:81:    for (name, bind_m) in body.bind_world {
crates/humanoid_retarget/src/mapping.rs:86:        global_rest.insert(name.clone(), bind_rot);
crates/humanoid_retarget/src/mapping.rs:89:    recompute_finger_globals(global_rest, local_rest, body.bones, &is_finger_name);
crates/humanoid_retarget/src/mapping.rs:112:        if body.tracks.contains_key(cfg_bone) || body.bones.contains_key(cfg_bone) {
crates/humanoid_retarget/src/mapping.rs:118:            if body.tracks.contains_key(&prefixed) || body.bones.contains_key(&prefixed) {
crates/humanoid_retarget/src/mapping.rs:128:/// Convert FBX translation to glTF Y-up (meters).
crates/humanoid_retarget/src/mapping.rs:131:fn fbx_to_gltf_translation(v: Vec3, is_blender: bool) -> Vec3 {
crates/humanoid_retarget/src/mapping.rs:133:        // Blender FBX: Z-up meters → Y-up meters (no cm→m needed)
crates/humanoid_retarget/src/mapping.rs:141:/// Body retargeting: produces VRM bone tracks from a [`SourceAnimBody`] view.
crates/humanoid_retarget/src/mapping.rs:158:    let mut result_tracks: Vec<BoneTrack> = Vec::new();
crates/humanoid_retarget/src/mapping.rs:162:    // Blender FBX: PreRotation is identity, bone orientation baked into rest_rotation_euler.
crates/humanoid_retarget/src/mapping.rs:163:    // Use rest_rotation_euler as src_local_rest, convert animation to delta-from-rest.
crates/humanoid_retarget/src/mapping.rs:164:    let is_blender = if config.source_type != crate::config::FbxSourceType::Auto {
crates/humanoid_retarget/src/mapping.rs:165:        config.source_type == crate::config::FbxSourceType::Blender
crates/humanoid_retarget/src/mapping.rs:167:        body.detected_source_type == crate::config::FbxSourceType::Blender
crates/humanoid_retarget/src/mapping.rs:170:    // Compute global rest rotation for each FBX bone
crates/humanoid_retarget/src/mapping.rs:171:    // Full local rest = PreRotation * Lcl_Rotation_rest (both contribute to bind pose)
crates/humanoid_retarget/src/mapping.rs:172:    let mut global_rest: HashMap<String, Quat> = HashMap::new();
crates/humanoid_retarget/src/mapping.rs:173:    let mut local_rest: HashMap<String, Quat> = HashMap::new();
crates/humanoid_retarget/src/mapping.rs:186:                    .and_then(|p| global_rest.get(p))
crates/humanoid_retarget/src/mapping.rs:189:                let lcl_rot_rest =
crates/humanoid_retarget/src/mapping.rs:190:                    crate::fbx::euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
crates/humanoid_retarget/src/mapping.rs:191:                let full_local = bone.pre_rotation * lcl_rot_rest;
crates/humanoid_retarget/src/mapping.rs:192:                local_rest.insert(name.clone(), full_local);
crates/humanoid_retarget/src/mapping.rs:193:                global_rest.insert(name.clone(), parent_global * full_local);
crates/humanoid_retarget/src/mapping.rs:206:    apply_bind_overrides_view(&mut global_rest, &local_rest, body);
crates/humanoid_retarget/src/mapping.rs:210:        && let Some(fbx_name) = resolve(root_name)
crates/humanoid_retarget/src/mapping.rs:211:        && let Some(track) = body.tracks.get(fbx_name)
crates/humanoid_retarget/src/mapping.rs:213:        let bone = body.bones.get(fbx_name);
crates/humanoid_retarget/src/mapping.rs:214:        let lcl_rot_rest = bone
crates/humanoid_retarget/src/mapping.rs:215:            .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
crates/humanoid_retarget/src/mapping.rs:217:        let pre_rot = bone.map(|b| b.pre_rotation).unwrap_or(Quat::IDENTITY);
crates/humanoid_retarget/src/mapping.rs:218:        let src_local_rest = if is_blender {
crates/humanoid_retarget/src/mapping.rs:220:            // Delta uses lcl_rot_rest only, so full_anim = pre_rot * anim.
crates/humanoid_retarget/src/mapping.rs:221:            pre_rot * lcl_rot_rest
crates/humanoid_retarget/src/mapping.rs:226:            let rest_inv = lcl_rot_rest.inverse();
crates/humanoid_retarget/src/mapping.rs:227:            track.rotations.iter().map(|&r| rest_inv * r).collect()
crates/humanoid_retarget/src/mapping.rs:236:            .map(|&t| fbx_to_gltf_translation(t, is_blender))
crates/humanoid_retarget/src/mapping.rs:239:        let src_global_rest = global_rest.get(fbx_name).copied().unwrap_or(src_local_rest);
crates/humanoid_retarget/src/mapping.rs:240:        let src_parent_global_rest = bone
crates/humanoid_retarget/src/mapping.rs:242:            .and_then(|p| global_rest.get(p))
crates/humanoid_retarget/src/mapping.rs:245:        result_tracks.push(BoneTrack {
crates/humanoid_retarget/src/mapping.rs:247:            src_bone_name: fbx_name.clone(),
crates/humanoid_retarget/src/mapping.rs:251:            src_local_rest,
crates/humanoid_retarget/src/mapping.rs:252:            src_global_rest,
crates/humanoid_retarget/src/mapping.rs:253:            src_parent_global_rest,
crates/humanoid_retarget/src/mapping.rs:267:        let fbx_name = match resolve(src_bone) {
crates/humanoid_retarget/src/mapping.rs:272:        if let Some(track) = body.tracks.get(fbx_name) {
crates/humanoid_retarget/src/mapping.rs:273:            let bone = body.bones.get(fbx_name);
crates/humanoid_retarget/src/mapping.rs:274:            let lcl_rot_rest = bone
crates/humanoid_retarget/src/mapping.rs:275:                .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
crates/humanoid_retarget/src/mapping.rs:277:            let pre_rot = bone.map(|b| b.pre_rotation).unwrap_or(Quat::IDENTITY);
crates/humanoid_retarget/src/mapping.rs:278:            let src_local_rest = if is_blender {
crates/humanoid_retarget/src/mapping.rs:279:                pre_rot * lcl_rot_rest
crates/humanoid_retarget/src/mapping.rs:284:                let rest_inv = lcl_rot_rest.inverse();
crates/humanoid_retarget/src/mapping.rs:285:                track.rotations.iter().map(|&r| rest_inv * r).collect()
crates/humanoid_retarget/src/mapping.rs:290:            let src_global_rest = global_rest.get(fbx_name).copied().unwrap_or(src_local_rest);
crates/humanoid_retarget/src/mapping.rs:294:                let bone_rest_t = bone.map(|b| b.rest_translation).unwrap_or(Vec3::ZERO);
crates/humanoid_retarget/src/mapping.rs:300:                            // Delta from rest position, converted to glTF Y-up
crates/humanoid_retarget/src/mapping.rs:301:                            let delta_t = t - bone_rest_t;
crates/humanoid_retarget/src/mapping.rs:302:                            fbx_to_gltf_translation(delta_t, is_blender)
crates/humanoid_retarget/src/mapping.rs:310:            let src_parent_global_rest = bone
crates/humanoid_retarget/src/mapping.rs:312:                .and_then(|p| global_rest.get(p))
crates/humanoid_retarget/src/mapping.rs:315:            result_tracks.push(BoneTrack {
crates/humanoid_retarget/src/mapping.rs:317:                src_bone_name: fbx_name.clone(),
crates/humanoid_retarget/src/mapping.rs:321:                src_local_rest,
crates/humanoid_retarget/src/mapping.rs:322:                src_global_rest,
crates/humanoid_retarget/src/mapping.rs:323:                src_parent_global_rest,
crates/humanoid_retarget/src/mapping.rs:332:        let mut first_src_rest = Quat::IDENTITY;
crates/humanoid_retarget/src/mapping.rs:336:            let fbx_name = match resolve(cfg_name) {
crates/humanoid_retarget/src/mapping.rs:341:            if let Some(track) = body.tracks.get(fbx_name) {
crates/humanoid_retarget/src/mapping.rs:342:                let bone = body.bones.get(fbx_name);
crates/humanoid_retarget/src/mapping.rs:343:                let lcl_rot_rest = bone
crates/humanoid_retarget/src/mapping.rs:344:                    .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
crates/humanoid_retarget/src/mapping.rs:347:                    let pre_rot = bone.map(|b| b.pre_rotation).unwrap_or(Quat::IDENTITY);
crates/humanoid_retarget/src/mapping.rs:348:                    first_src_rest = if is_blender {
crates/humanoid_retarget/src/mapping.rs:349:                        pre_rot * lcl_rot_rest
crates/humanoid_retarget/src/mapping.rs:356:                let rest_inv = lcl_rot_rest.inverse();
crates/humanoid_retarget/src/mapping.rs:359:                        let rot = if is_blender { rest_inv * r } else { r };
crates/humanoid_retarget/src/mapping.rs:370:        // Use LAST bone's global for src_global_rest (accumulated chain endpoint)
crates/humanoid_retarget/src/mapping.rs:371:        // Use FIRST bone's parent for src_parent_global_rest (chain entry point)
crates/humanoid_retarget/src/mapping.rs:372:        let first_fbx = src_bones.first().and_then(|n| resolve(n));
crates/humanoid_retarget/src/mapping.rs:373:        let last_fbx = src_bones.iter().rev().find_map(|n| resolve(n));
crates/humanoid_retarget/src/mapping.rs:374:        let src_global_rest = last_fbx
crates/humanoid_retarget/src/mapping.rs:375:            .and_then(|n| global_rest.get(n))
crates/humanoid_retarget/src/mapping.rs:377:            .unwrap_or(first_src_rest);
crates/humanoid_retarget/src/mapping.rs:378:        let src_parent_global_rest = first_fbx
crates/humanoid_retarget/src/mapping.rs:381:            .and_then(|p| global_rest.get(p))
crates/humanoid_retarget/src/mapping.rs:387:            let last_fbx = last_cfg.and_then(|n| resolve(n));
crates/humanoid_retarget/src/mapping.rs:388:            last_fbx.and_then(|name| {
crates/humanoid_retarget/src/mapping.rs:390:                let track = body.tracks.get(name)?;
crates/humanoid_retarget/src/mapping.rs:391:                let bone_rest_t = bone.rest_translation;
crates/humanoid_retarget/src/mapping.rs:397:                            let delta_t = t - bone_rest_t;
crates/humanoid_retarget/src/mapping.rs:398:                            fbx_to_gltf_translation(delta_t, is_blender)
crates/humanoid_retarget/src/mapping.rs:407:        // Use last resolved FBX bone name for world rotation lookup
crates/humanoid_retarget/src/mapping.rs:408:        let acc_src_name = last_fbx.cloned().unwrap_or_default();
crates/humanoid_retarget/src/mapping.rs:409:        result_tracks.push(BoneTrack {
crates/humanoid_retarget/src/mapping.rs:415:            src_local_rest: first_src_rest,
crates/humanoid_retarget/src/mapping.rs:416:            src_global_rest,
crates/humanoid_retarget/src/mapping.rs:417:            src_parent_global_rest,
crates/humanoid_retarget/src/mapping.rs:421:    Ok(result_tracks)
crates/humanoid_retarget/src/mapping.rs:424:/// Facial retargeting: produces VRM expression tracks from a
crates/humanoid_retarget/src/mapping.rs:434:    let mut expression_tracks: Vec<ExpressionTrack> = Vec::new();
crates/humanoid_retarget/src/mapping.rs:435:    for (fbx_channel, weights) in facial.blend_shape_tracks {
crates/humanoid_retarget/src/mapping.rs:436:        if let Some(vrm_expr) = config.expression_map.get(fbx_channel) {
crates/humanoid_retarget/src/mapping.rs:437:            expression_tracks.push(ExpressionTrack {
crates/humanoid_retarget/src/mapping.rs:443:    expression_tracks
crates/humanoid_retarget/src/mapping.rs:449:/// tracks in one [`MappedAnimation`] use this. Callers that need only
crates/humanoid_retarget/src/mapping.rs:455:    fbx: &SourceAsset,
crates/humanoid_retarget/src/mapping.rs:459:    let body = SourceAnimBody::from_source_asset(fbx);
crates/humanoid_retarget/src/mapping.rs:460:    let facial = SourceAnimFacial::from_source_asset(fbx);
crates/humanoid_retarget/src/mapping.rs:462:    let bone_tracks = retarget_body(&body, config, vrm_version)?;
crates/humanoid_retarget/src/mapping.rs:463:    let expression_tracks = retarget_facial(&facial, config);
crates/humanoid_retarget/src/mapping.rs:465:    let source_resolved = if config.source_type != crate::config::FbxSourceType::Auto {
crates/humanoid_retarget/src/mapping.rs:468:        fbx.detected_source_type
crates/humanoid_retarget/src/mapping.rs:473:        duration_secs: fbx.duration,
crates/humanoid_retarget/src/mapping.rs:474:        bone_tracks,
crates/humanoid_retarget/src/mapping.rs:475:        expression_tracks,
crates/humanoid_retarget/src/mapping.rs:476:        source_detected: fbx.detected_source_type,
crates/humanoid_retarget/src/bin/pop_scan.rs:1://! Scan FBX rotation tracks for frame-to-frame pops (angular jumps).
crates/humanoid_retarget/src/bin/pop_scan.rs:4://! Usage: pop_scan <fbx_path> [threshold_deg=5]
crates/humanoid_retarget/src/bin/pop_scan.rs:12:        eprintln!("Usage: pop_scan <fbx_path> [threshold_deg=5]");
crates/humanoid_retarget/src/bin/pop_scan.rs:15:    let threshold: f32 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(5.0);
crates/humanoid_retarget/src/bin/pop_scan.rs:17:    let bytes = fs::read(&args[1]).expect("read fbx");
crates/humanoid_retarget/src/bin/pop_scan.rs:18:    let data = fbx_rig::parse(&bytes).expect("parse");
crates/humanoid_retarget/src/bin/pop_scan.rs:20:    println!("FBX: {}", args[1]);
crates/humanoid_retarget/src/bin/pop_scan.rs:26:    for (name, track) in &data.tracks {
crates/humanoid_retarget/src/adapters/mod.rs:1://! Rig-pair adapters: pre-retarget rest pose alignment between specific
crates/humanoid_retarget/src/adapters/mod.rs:5://! pure init-time functions that mutate the destination rest pose before
crates/humanoid_retarget/src/quality/validate.rs:1://! Pipeline validator: runs the full FBX→VRM retarget pipeline headlessly
crates/humanoid_retarget/src/quality/validate.rs:4://! Usage: call `validate_pipeline()` with config JSON, FBX bytes, and VRM bytes.
crates/humanoid_retarget/src/quality/validate.rs:10:use crate::fbx::SourceAsset;
crates/humanoid_retarget/src/quality/validate.rs:11:use crate::types::VrmRestPose;
crates/humanoid_retarget/src/quality/validate.rs:52:    fbx_bytes: &[u8],
crates/humanoid_retarget/src/quality/validate.rs:69:    // [2] FBX Parse validation
crates/humanoid_retarget/src/quality/validate.rs:70:    let fbx = match validate_fbx_parse(fbx_bytes) {
crates/humanoid_retarget/src/quality/validate.rs:71:        Ok((fbx, details)) => {
crates/humanoid_retarget/src/quality/validate.rs:72:            stages.push(StageResult { name: "FBX Parse".into(), passed: true, details });
crates/humanoid_retarget/src/quality/validate.rs:73:            fbx
crates/humanoid_retarget/src/quality/validate.rs:76:            stages.push(StageResult { name: "FBX Parse".into(), passed: false, details });
crates/humanoid_retarget/src/quality/validate.rs:82:    let (vrm_rest, vrm_version) = match validate_vrm_load(vrm_bytes) {
crates/humanoid_retarget/src/quality/validate.rs:83:        Ok((rest, ver, details)) => {
crates/humanoid_retarget/src/quality/validate.rs:85:            (rest, ver)
crates/humanoid_retarget/src/quality/validate.rs:94:    let anim = match validate_mapping(&fbx, &config, vrm_version) {
crates/humanoid_retarget/src/quality/validate.rs:106:    let mut vrm_rest_mut = vrm_rest.clone();
crates/humanoid_retarget/src/quality/validate.rs:107:    let adapter_details = validate_adapter(&anim, &mut vrm_rest_mut, &config);
crates/humanoid_retarget/src/quality/validate.rs:115:    let fbx_skel = crate::compute_fbx_skeleton_from_parsed(&fbx).ok();
crates/humanoid_retarget/src/quality/validate.rs:116:    match validate_retarget(&fbx, &anim, vrm_rest_mut, fbx_skel) {
crates/humanoid_retarget/src/quality/validate.rs:139:    details.push(format!("{} rest_sync_rules", config.rest_sync_rules.len()));
crates/humanoid_retarget/src/quality/validate.rs:141:    // Check for unknown strategy names in rest_sync_rules
crates/humanoid_retarget/src/quality/validate.rs:143:    for (pattern, strategy) in &config.rest_sync_rules {
crates/humanoid_retarget/src/quality/validate.rs:155:fn validate_fbx_parse(bytes: &[u8]) -> Result<(SourceAsset, Vec<String>), Vec<String>> {
crates/humanoid_retarget/src/quality/validate.rs:156:    let fbx =
crates/humanoid_retarget/src/quality/validate.rs:157:        crate::fbx::parse(bytes).map_err(|e| vec![format!("FBX parse failed: {}", e)])?;
crates/humanoid_retarget/src/quality/validate.rs:162:        fbx.bones.len(),
crates/humanoid_retarget/src/quality/validate.rs:163:        fbx.frame_count,
crates/humanoid_retarget/src/quality/validate.rs:164:        fbx.duration
crates/humanoid_retarget/src/quality/validate.rs:168:        fbx.bind_world.len(),
crates/humanoid_retarget/src/quality/validate.rs:169:        fbx.bones.len()
crates/humanoid_retarget/src/quality/validate.rs:171:    details.push(format!("source: {:?}", fbx.detected_source_type));
crates/humanoid_retarget/src/quality/validate.rs:173:    if fbx.bones.len() < 20 {
crates/humanoid_retarget/src/quality/validate.rs:176:            fbx.bones.len()
crates/humanoid_retarget/src/quality/validate.rs:179:    if fbx.frame_count < 2 {
crates/humanoid_retarget/src/quality/validate.rs:182:            fbx.frame_count
crates/humanoid_retarget/src/quality/validate.rs:186:    Ok((fbx, details))
crates/humanoid_retarget/src/quality/validate.rs:191:) -> Result<(VrmRestPose, VrmVersion, Vec<String>), Vec<String>> {
crates/humanoid_retarget/src/quality/validate.rs:198:    // Extract rest pose from GLB bytes (VRM 1.0 path)
crates/humanoid_retarget/src/quality/validate.rs:199:    // VRM 0.x detection: extract_vrm_rest_pose may fail for 0.x — handled below
crates/humanoid_retarget/src/quality/validate.rs:200:    let rest = crate::vrm_rest::extract_vrm_rest_pose(bytes).map_err(|e| {
crates/humanoid_retarget/src/quality/validate.rs:201:        vec![format!("failed to extract VRM rest pose: {}", e)]
crates/humanoid_retarget/src/quality/validate.rs:204:    details.push(format!("{} bones in rest", rest.bone_rest_local.len()));
crates/humanoid_retarget/src/quality/validate.rs:217:        .filter(|b| !rest.bone_rest_local.contains_key(**b))
crates/humanoid_retarget/src/quality/validate.rs:224:    // Check for NaN in rest rotations
crates/humanoid_retarget/src/quality/validate.rs:225:    for (name, q) in &rest.bone_rest_local {
crates/humanoid_retarget/src/quality/validate.rs:227:            return Err(vec![format!("NaN in bone rest: {}", name)]);
crates/humanoid_retarget/src/quality/validate.rs:231:    // Forward direction: hips rest world rotation must point forward (-Z).
crates/humanoid_retarget/src/quality/validate.rs:232:    // VRM convention: character faces -Z at rest. A model authored facing +Z
crates/humanoid_retarget/src/quality/validate.rs:235:    if let Some(hips_world) = rest.bone_rest_global.get("hips") {
crates/humanoid_retarget/src/quality/validate.rs:239:                "hips rest faces backward (fwd.z={:.3}, expected <0)",
crates/humanoid_retarget/src/quality/validate.rs:246:    Ok((rest, version, details))
crates/humanoid_retarget/src/quality/validate.rs:250:    fbx: &SourceAsset,
crates/humanoid_retarget/src/quality/validate.rs:254:    let anim = crate::mapping::retarget(fbx, config, version)
crates/humanoid_retarget/src/quality/validate.rs:259:        "{} bone tracks, {} expression tracks",
crates/humanoid_retarget/src/quality/validate.rs:260:        anim.bone_tracks.len(),
crates/humanoid_retarget/src/quality/validate.rs:261:        anim.expression_tracks.len()
crates/humanoid_retarget/src/quality/validate.rs:265:    // Check for NaN in tracks
crates/humanoid_retarget/src/quality/validate.rs:266:    for track in &anim.bone_tracks {
crates/humanoid_retarget/src/quality/validate.rs:277:    if anim.bone_tracks.is_empty() {
crates/humanoid_retarget/src/quality/validate.rs:278:        return Err(vec!["no bone tracks produced".to_string()]);
crates/humanoid_retarget/src/quality/validate.rs:286:    vrm_rest: &mut VrmRestPose,
crates/humanoid_retarget/src/quality/validate.rs:292:        &anim.bone_tracks,
crates/humanoid_retarget/src/quality/validate.rs:293:        &vrm_rest.bone_rest_local,
crates/humanoid_retarget/src/quality/validate.rs:294:        &vrm_rest.bone_rest_global,
crates/humanoid_retarget/src/quality/validate.rs:297:    let (overrides, stage4_log) = crate::adapters::arp_vrm::stage4_sync_rest_to_fbx(
crates/humanoid_retarget/src/quality/validate.rs:298:        &mut vrm_rest.bone_rest_local,
crates/humanoid_retarget/src/quality/validate.rs:299:        &mut vrm_rest.bone_rest_global,
crates/humanoid_retarget/src/quality/validate.rs:300:        &vrm_rest.parent_map,
crates/humanoid_retarget/src/quality/validate.rs:301:        &anim.bone_tracks,
crates/humanoid_retarget/src/quality/validate.rs:307:    details.push(format!("{} rest overrides", overrides.len()));
crates/humanoid_retarget/src/quality/validate.rs:321:    fbx: &SourceAsset,
crates/humanoid_retarget/src/quality/validate.rs:323:    vrm_rest: VrmRestPose,
crates/humanoid_retarget/src/quality/validate.rs:324:    fbx_skel: Option<crate::types::FbxSkeletonFrames>,
crates/humanoid_retarget/src/quality/validate.rs:326:    // Derive fbx_root and fbx_hips from the animation's bone track names
crates/humanoid_retarget/src/quality/validate.rs:328:    // For the validator we use simple heuristics: hips track → fbx_hips,
crates/humanoid_retarget/src/quality/validate.rs:329:    // a root-level bone (no parent in fbx.bones) → fbx_root.
crates/humanoid_retarget/src/quality/validate.rs:330:    let fbx_hips = anim
crates/humanoid_retarget/src/quality/validate.rs:331:        .bone_tracks
crates/humanoid_retarget/src/quality/validate.rs:335:            // Look for the FBX bone that has no parent (scene root under hips)
crates/humanoid_retarget/src/quality/validate.rs:336:            fbx.bones
crates/humanoid_retarget/src/quality/validate.rs:343:    let fbx_root = fbx
crates/humanoid_retarget/src/quality/validate.rs:351:        crate::ArpRetargeterInner::new(vrm_rest, fbx_skel, anim, &fbx_root, &fbx_hips);
crates/humanoid_retarget/src/lib.rs:4:pub mod finger_rest_align;
crates/humanoid_retarget/src/lib.rs:15:pub mod vrm_rest;
crates/humanoid_retarget/src/lib.rs:17:/// Re-export the `fbx_rig` crate under the historical `fbx` module name
crates/humanoid_retarget/src/lib.rs:18:/// so existing call sites (`humanoid_retarget::fbx::parse`, etc.) keep
crates/humanoid_retarget/src/lib.rs:19:/// working without churn. New code should prefer `fbx_rig` directly.
crates/humanoid_retarget/src/lib.rs:20:pub use fbx_rig as fbx;
crates/humanoid_retarget/src/lib.rs:23:pub use config::FbxSourceType;
crates/humanoid_retarget/src/lib.rs:24:pub use fbx_rig::{compute_fbx_skeleton, compute_fbx_skeleton_from_parsed};
crates/humanoid_retarget/src/lib.rs:25:pub use quality::{RetargetQuality, RetargetScore, BoneScore, RqDiagnostic, RqGrade, score_retarget, FingerRestScore, FingerBoneScore, score_fingers};
crates/humanoid_retarget/src/lib.rs:29:    BoneTrack, ExpressionTrack, FbxDiagnostics, FbxSkeletonFrames, TargetAnimation,
crates/humanoid_retarget/src/lib.rs:30:    MappedAnimation, RetargetedBone, VrmRestPose, swing_twist_decompose,
crates/humanoid_retarget/src/lib.rs:40:    #[error("FBX parse error: {0}")]
crates/humanoid_retarget/src/lib.rs:41:    FbxParse(String),
crates/humanoid_retarget/src/lib.rs:54:impl From<fbx_rig::Error> for RetargetError {
crates/humanoid_retarget/src/lib.rs:55:    fn from(e: fbx_rig::Error) -> Self {
crates/humanoid_retarget/src/lib.rs:56:        RetargetError::FbxParse(e.to_string())
crates/humanoid_retarget/src/lib.rs:60:/// Parse FBX once, retarget, and compute skeleton visualization in a single pass.
crates/humanoid_retarget/src/lib.rs:62:    fbx_data: &[u8],
crates/humanoid_retarget/src/lib.rs:65:) -> Result<(MappedAnimation, FbxDiagnostics, FbxSkeletonFrames), RetargetError> {
crates/humanoid_retarget/src/lib.rs:67:    let fbx = fbx::parse(fbx_data)?;
crates/humanoid_retarget/src/lib.rs:69:    let source_resolved = resolve_source_type(&config, &fbx);
crates/humanoid_retarget/src/lib.rs:71:    // Skip heavy skeleton computation if no real bone animation (facial-only FBX)
crates/humanoid_retarget/src/lib.rs:72:    let has_bone_animation = fbx.tracks.values().any(|t| t.rotations.len() > 1);
crates/humanoid_retarget/src/lib.rs:74:        fbx::compute_fbx_skeleton_from_parsed(&fbx)?
crates/humanoid_retarget/src/lib.rs:76:        FbxSkeletonFrames {
crates/humanoid_retarget/src/lib.rs:77:            frame_count: fbx.frame_count,
crates/humanoid_retarget/src/lib.rs:78:            duration: fbx.duration,
crates/humanoid_retarget/src/lib.rs:85:    let mut all_bones: Vec<String> = fbx.bones.keys().cloned().collect();
crates/humanoid_retarget/src/lib.rs:87:    let mut animated_bones: Vec<String> = fbx.tracks.keys().cloned().collect();
crates/humanoid_retarget/src/lib.rs:98:        let found = fbx.tracks.contains_key(src)
crates/humanoid_retarget/src/lib.rs:102:                .any(|p| fbx.tracks.contains_key(&format!("{}{}", p, src)));
crates/humanoid_retarget/src/lib.rs:110:    let mut blend_shape_channels: Vec<String> = fbx.blend_shape_tracks.keys().cloned().collect();
crates/humanoid_retarget/src/lib.rs:113:    let diag = FbxDiagnostics {
crates/humanoid_retarget/src/lib.rs:119:        source_detected: fbx.detected_source_type,
crates/humanoid_retarget/src/lib.rs:121:        creator: fbx.creator.clone(),
crates/humanoid_retarget/src/lib.rs:124:    let anim = mapping::retarget(&fbx, &config, vrm_version)?;
crates/humanoid_retarget/src/lib.rs:129:    fbx_data: &[u8],
crates/humanoid_retarget/src/lib.rs:132:) -> Result<(MappedAnimation, FbxDiagnostics), RetargetError> {
crates/humanoid_retarget/src/lib.rs:133:    let (anim, diag, _skeleton) = retarget_with_skeleton(fbx_data, config_json, vrm_version)?;
crates/humanoid_retarget/src/lib.rs:139:    fbx: &fbx::SourceAsset,
crates/humanoid_retarget/src/lib.rs:140:) -> config::FbxSourceType {
crates/humanoid_retarget/src/lib.rs:141:    if config.source_type == config::FbxSourceType::Auto {
crates/humanoid_retarget/src/lib.rs:142:        fbx.detected_source_type
crates/humanoid_retarget/src/bin/validate_pipeline.rs:1://! CLI: validate the full FBX→VRM retarget pipeline.
crates/humanoid_retarget/src/bin/validate_pipeline.rs:3://! Usage: validate-pipeline <config.json> <fbx_path> <vrm_path>
crates/humanoid_retarget/src/bin/validate_pipeline.rs:12:        eprintln!("Usage: validate-pipeline <config.json> <fbx_path> <vrm_path>");
crates/humanoid_retarget/src/bin/validate_pipeline.rs:17:    let fbx_bytes = fs::read(&args[2]).expect("read fbx");
crates/humanoid_retarget/src/bin/validate_pipeline.rs:22:        &fbx_bytes,
crates/humanoid_retarget/src/quality/mod.rs:2:// Three-tier evaluation: FBX Source (A), VRM Model (B), Retarget Output (C)
crates/humanoid_retarget/src/quality/mod.rs:93:/// bones. Same for facial-only FBX inputs (`FC_00078`) which fail
crates/humanoid_retarget/src/quality/mod.rs:141:pub use score::{BoneScore, RetargetScore, score_retarget, FingerBoneScore, FingerRestScore, score_fingers};
crates/humanoid_retarget/src/quality/mod.rs:186:    pub source_detected: crate::config::FbxSourceType,
crates/humanoid_retarget/src/quality/mod.rs:187:    pub source_config: crate::config::FbxSourceType,
crates/humanoid_retarget/src/quality/mod.rs:200:            d.push(RqDiagnostic { is_error: true, metric: "identity".into(), message: format!("identity FAIL {}/{} — VRM rest pose may not be A-pose/T-pose.", fc, self.identity_total) });
crates/humanoid_retarget/src/quality/mod.rs:202:            d.push(RqDiagnostic { is_error: false, metric: "identity".into(), message: format!("identity FAIL {}/{} — minor rest pose deviations.", fc, self.identity_total) });
crates/humanoid_retarget/src/quality/mod.rs:205:            d.push(RqDiagnostic { is_error: true, metric: "bones".into(), message: format!("bones={} — too few bone tracks. FBX may be facial-only (no body animation).", self.bone_count) });
crates/humanoid_retarget/src/config.rs:4:pub use fbx_rig::FbxSourceType;
crates/humanoid_retarget/src/config.rs:20:    /// FBX blend shape channel name → VRM expression preset name
crates/humanoid_retarget/src/config.rs:24:    pub source_type: FbxSourceType,
crates/humanoid_retarget/src/config.rs:25:    /// Per-bone rest sync strategy overrides. Each entry is a [pattern, strategy]
crates/humanoid_retarget/src/config.rs:32:    pub rest_sync_rules: Vec<(String, String)>,
crates/humanoid_retarget/src/quality/rubric_a.rs:1://! Rubric A: FBX Source Animation Quality
crates/humanoid_retarget/src/quality/rubric_a.rs:2://! Evaluates input FBX before retargeting.
crates/humanoid_retarget/src/quality/rubric_a.rs:46:    // A0.4: Bind pose clusters (skip check for facial FBX: bone_count > 100 proxy)
crates/humanoid_retarget/src/quality/rubric_a.rs:48:    let bind_cluster_count = body.bind_world.len();
crates/humanoid_retarget/src/quality/rubric_a.rs:54:            format!("facial FBX exempt ({} bones > 100)", bone_count)
crates/humanoid_retarget/src/quality/rubric_a.rs:60:    // A0.5: Body skin present — body FBX have skin clusters in bind_world,
crates/humanoid_retarget/src/quality/rubric_a.rs:61:    // facial-only FBX don't (mesh deforms via blendshapes, not joints).
crates/humanoid_retarget/src/quality/rubric_a.rs:65:    // of A0.4 bind_pose (which exempts facial FBX) — A0.5 explicitly
crates/humanoid_retarget/src/quality/rubric_a.rs:67:    let bind_cluster_count = body.bind_world.len();
crates/humanoid_retarget/src/quality/rubric_a.rs:89://      missed isolated spikes in otherwise-static tracks where
crates/humanoid_retarget/src/quality/rubric_a.rs:121:fn metric_angular_velocity_outliers(fbx: &crate::fbx::SourceAsset) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:123:    for (bone_name, track) in &fbx.tracks {
crates/humanoid_retarget/src/quality/rubric_a.rs:177:// ─── A1.2 Bone Symmetry – Rest ────────────────────────────────────────────────
crates/humanoid_retarget/src/quality/rubric_a.rs:190:fn metric_bone_symmetry(fbx: &crate::fbx::SourceAsset) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:193:    let bind = &fbx.bind_world;
crates/humanoid_retarget/src/quality/rubric_a.rs:273:    fbx: &crate::fbx::SourceAsset,
crates/humanoid_retarget/src/quality/rubric_a.rs:274:    skeleton: &crate::types::FbxSkeletonFrames,
crates/humanoid_retarget/src/quality/rubric_a.rs:302:    let _ = fbx; // Not directly needed — skeleton already computed
crates/humanoid_retarget/src/quality/rubric_a.rs:414:fn metric_smoothness(fbx: &crate::fbx::SourceAsset) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:417:    for (bone_name, track) in &fbx.tracks {
crates/humanoid_retarget/src/quality/rubric_a.rs:505:/// Naming note: this rubric was historically called "FBX Source" because
crates/humanoid_retarget/src/quality/rubric_a.rs:506:/// the only supported input format was FBX. The contract is now
crates/humanoid_retarget/src/quality/rubric_a.rs:509:/// FBX file but tomorrow could wrap Glb/Bvh).
crates/humanoid_retarget/src/quality/rubric_a.rs:510:pub fn evaluate(fbx: &crate::fbx::SourceAsset) -> RubricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:511:    let body = crate::source_anim::SourceAnimBody::from_source_asset(fbx);
crates/humanoid_retarget/src/quality/rubric_a.rs:518:    let gimbal = metric_angular_velocity_outliers(fbx);
crates/humanoid_retarget/src/quality/rubric_a.rs:519:    let symmetry = metric_bone_symmetry(fbx);
crates/humanoid_retarget/src/quality/rubric_a.rs:523:        match crate::compute_fbx_skeleton_from_parsed(fbx) {
crates/humanoid_retarget/src/quality/rubric_a.rs:524:            Ok(skeleton) => Some(metric_foot_contact(fbx, &skeleton)),
crates/humanoid_retarget/src/quality/rubric_a.rs:528:    let smoothness = metric_smoothness(fbx);
crates/humanoid_retarget/src/quality/rubric_c.rs:49:/// residuals instead of local-rotation angle-from-rest, so these
crates/humanoid_retarget/src/quality/rubric_c.rs:67:/// Effector bone name pairs: (fbx_candidates, vrm_name)
crates/humanoid_retarget/src/quality/rubric_c.rs:138:// An earlier design tried `angle_between(rot, rest_local)` and even
crates/humanoid_retarget/src/quality/rubric_c.rs:139:// `bend_range = max − min` on local rotations to cancel rest-pose
crates/humanoid_retarget/src/quality/rubric_c.rs:141:// rest-pose compensation does not reduce to a constant local offset
crates/humanoid_retarget/src/quality/rubric_c.rs:144:// direction, which alters the local rotation's angle-from-rest even
crates/humanoid_retarget/src/quality/rubric_c.rs:168:// can be re-added later without restructuring.
crates/humanoid_retarget/src/quality/rubric_c.rs:192:/// Per-bone mapping: VRM bone names → FBX bone names for the current
crates/humanoid_retarget/src/quality/rubric_c.rs:193:/// pipeline. Built by the caller from `MappedAnimation.bone_tracks`.
crates/humanoid_retarget/src/quality/rubric_c.rs:246:    src_fk: Option<&crate::FbxSkeletonFrames>,
crates/humanoid_retarget/src/quality/rubric_c.rs:247:    vrm_to_fbx_name: &HashMap<String, String>,
crates/humanoid_retarget/src/quality/rubric_c.rs:268:        let src_parent = match vrm_to_fbx_name.get(*vrm_parent) {
crates/humanoid_retarget/src/quality/rubric_c.rs:272:        let src_bone = match vrm_to_fbx_name.get(*vrm_bone) {
crates/humanoid_retarget/src/quality/rubric_c.rs:276:        let src_child = match vrm_to_fbx_name.get(*vrm_child) {
crates/humanoid_retarget/src/quality/rubric_c.rs:327:    // 15-30° even on faithful retargets, because rest-pose difference
crates/humanoid_retarget/src/quality/rubric_c.rs:329:    // absolute bend angle offset at rest frames. Tighter thresholds
crates/humanoid_retarget/src/quality/rubric_c.rs:365:// `min_ankle_y + 0.02` tracks the lowest ankle pose, not the actual ground.
crates/humanoid_retarget/src/quality/rubric_c.rs:369:    vrm_rest: &crate::types::VrmRestPose,
crates/humanoid_retarget/src/quality/rubric_c.rs:380:    let (sole_l, sole_r) = vrm_rest.foot_sole_offset;
crates/humanoid_retarget/src/quality/rubric_c.rs:661:    src_fk: Option<&crate::FbxSkeletonFrames>,
crates/humanoid_retarget/src/quality/rubric_c.rs:667:    for (fbx_candidates, vrm_name) in EFFECTOR_MAP {
crates/humanoid_retarget/src/quality/rubric_c.rs:668:        let src_positions: Option<&Vec<[f32; 3]>> = fbx_candidates
crates/humanoid_retarget/src/quality/rubric_c.rs:670:            .find_map(|&fbx_name| src.bone_positions.get(fbx_name));
crates/humanoid_retarget/src/quality/rubric_c.rs:739:/// - `src_rotations_by_vrm` — per-VRM-bone-name source rotation tracks.
crates/humanoid_retarget/src/quality/rubric_c.rs:742:/// - `vrm_to_fbx_name` — per-VRM-bone-name FBX bone name, used by C1.1
crates/humanoid_retarget/src/quality/rubric_c.rs:743:///   to look up FBX-side positions for world-space joint triplets.
crates/humanoid_retarget/src/quality/rubric_c.rs:752:    src_fk: Option<&crate::FbxSkeletonFrames>,
crates/humanoid_retarget/src/quality/rubric_c.rs:754:    vrm_rest: &crate::types::VrmRestPose,
crates/humanoid_retarget/src/quality/rubric_c.rs:756:    vrm_to_fbx_name: Option<&HashMap<String, String>>,
crates/humanoid_retarget/src/quality/rubric_c.rs:764:    let joint_limit = match vrm_to_fbx_name {
crates/humanoid_retarget/src/quality/rubric_c.rs:768:    let ground_contact = metric_ground_contact(vrm_fk, vrm_rest);
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:1://! ARP → VRM user-authored rest pose.
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:3://! Unlike automatic rest sync (which reads ARP source bone rotations
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:17://! By having the user **directly construct the rest pose in VRM frame**
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:34://! Current pose targets an "arms down at sides" natural standing rest.
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:41:/// Per-bone user-authored rest delta. Applied as
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:42:/// `new_dst_rest_local = old_dst_rest_local * delta`.
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:49:/// The default user-authored ARP → VRM rest pose (F8 standing @ 3.7s).
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:80:    // activates authored-offset path per original TODO in rest_sync_strategy.
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:106:    // per-frame FBX right-wrist-delta transfer in src/retarget.rs (EXP-006).
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:107:    // Removing the static entries lets the dynamic pass measure FBX wrist
crates/humanoid_retarget/src/vrm_rest.rs:1://! Extract VrmRestPose from a VRM/GLB file without Bevy.
crates/humanoid_retarget/src/vrm_rest.rs:4://! and computes rest-pose transforms from glTF node TRS data.
crates/humanoid_retarget/src/vrm_rest.rs:9:use crate::VrmRestPose;
crates/humanoid_retarget/src/vrm_rest.rs:12:pub enum VrmRestError {
crates/humanoid_retarget/src/vrm_rest.rs:25:/// Extract VrmRestPose from a VRM 1.0 GLB binary.
crates/humanoid_retarget/src/vrm_rest.rs:28:pub fn extract_vrm_rest_pose(glb_bytes: &[u8]) -> Result<VrmRestPose, VrmRestError> {
crates/humanoid_retarget/src/vrm_rest.rs:29:    let gltf = gltf::Glb::from_slice(glb_bytes).map_err(|_| VrmRestError::NotGlb)?;
crates/humanoid_retarget/src/vrm_rest.rs:31:        serde_json::from_slice(&gltf.json).map_err(|e| VrmRestError::Json(e.to_string()))?;
crates/humanoid_retarget/src/vrm_rest.rs:36:        .ok_or(VrmRestError::MissingVrmcVrm)?;
crates/humanoid_retarget/src/vrm_rest.rs:40:        .ok_or(VrmRestError::MissingHumanoid)?;
crates/humanoid_retarget/src/vrm_rest.rs:54:        .ok_or(VrmRestError::Json("missing nodes".into()))?;
crates/humanoid_retarget/src/vrm_rest.rs:153:    // Build VrmRestPose
crates/humanoid_retarget/src/vrm_rest.rs:154:    let mut bone_rest_local: HashMap<String, Quat> = HashMap::new();
crates/humanoid_retarget/src/vrm_rest.rs:155:    let mut bone_rest_global: HashMap<String, Quat> = HashMap::new();
crates/humanoid_retarget/src/vrm_rest.rs:156:    let mut bone_rest_translation: HashMap<String, Vec3> = HashMap::new();
crates/humanoid_retarget/src/vrm_rest.rs:161:        bone_rest_local.insert(vrm_name.clone(), locals[node_idx].rotation);
crates/humanoid_retarget/src/vrm_rest.rs:162:        bone_rest_translation.insert(vrm_name.clone(), locals[node_idx].translation);
crates/humanoid_retarget/src/vrm_rest.rs:166:        bone_rest_global.insert(vrm_name.clone(), rot);
crates/humanoid_retarget/src/vrm_rest.rs:212:    let root_rest_rotation = root_node_idx
crates/humanoid_retarget/src/vrm_rest.rs:217:    bone_rest_local.insert("VRMC_vrm.root_bone".to_string(), root_rest_rotation);
crates/humanoid_retarget/src/vrm_rest.rs:218:    bone_rest_global.insert("VRMC_vrm.root_bone".to_string(), root_rest_rotation);
crates/humanoid_retarget/src/vrm_rest.rs:231:    let virtual_rest_global = compute_virtual_rest_global(&bone_rest_local, &bone_world_position);
crates/humanoid_retarget/src/vrm_rest.rs:239:    Ok(VrmRestPose {
crates/humanoid_retarget/src/vrm_rest.rs:240:        bone_rest_local,
crates/humanoid_retarget/src/vrm_rest.rs:241:        bone_rest_global,
crates/humanoid_retarget/src/vrm_rest.rs:242:        bone_rest_translation,
crates/humanoid_retarget/src/vrm_rest.rs:246:        root_rest_rotation,
crates/humanoid_retarget/src/vrm_rest.rs:247:        virtual_rest_global,
crates/humanoid_retarget/src/vrm_rest.rs:253:/// Compute virtual global orientation for identity-rest bones.
crates/humanoid_retarget/src/vrm_rest.rs:255:/// VRM 1.0 glTF bones often have identity rest (position-only).
crates/humanoid_retarget/src/vrm_rest.rs:256:/// The retarget formula needs a non-identity dst_rest_global to map
crates/humanoid_retarget/src/vrm_rest.rs:257:/// FBX rotations into VRM bone space. We derive it from bone→child direction.
crates/humanoid_retarget/src/vrm_rest.rs:259:/// Called from both `extract_vrm_rest_pose` (headless) and Bevy viewer.
crates/humanoid_retarget/src/vrm_rest.rs:260:pub fn compute_virtual_rest_global(
crates/humanoid_retarget/src/vrm_rest.rs:261:    bone_rest_local: &HashMap<String, Quat>,
crates/humanoid_retarget/src/vrm_rest.rs:264:    let mut virtual_rest_global: HashMap<String, Quat> = HashMap::new();
crates/humanoid_retarget/src/vrm_rest.rs:322:        // Only compute virtual global for identity-rest bones
crates/humanoid_retarget/src/vrm_rest.rs:323:        let rest_local = bone_rest_local.get(bone.as_str()).copied().unwrap_or(Quat::IDENTITY);
crates/humanoid_retarget/src/vrm_rest.rs:324:        if rest_local.angle_between(Quat::IDENTITY) > 0.01 {
crates/humanoid_retarget/src/vrm_rest.rs:328:        if virtual_rest_global.contains_key(bone.as_str()) {
crates/humanoid_retarget/src/vrm_rest.rs:338:                virtual_rest_global.insert(bone.clone(), virtual_g);
crates/humanoid_retarget/src/vrm_rest.rs:343:    virtual_rest_global
crates/humanoid_retarget/src/adapters/arp_vrm.rs:1://! ARP → VRM full-body rest alignment adapter.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:3://! Problem: VRM rest pose has many bones (notably hands and the entire finger
crates/humanoid_retarget/src/adapters/arp_vrm.rs:4://! chain) in a T-pose / bind orientation that does NOT match ARP's rest. The
crates/humanoid_retarget/src/adapters/arp_vrm.rs:6://! FBX delta from the ARP rest gets applied on top of the VRM rest — and the
crates/humanoid_retarget/src/adapters/arp_vrm.rs:7://! result keeps the VRM bones near the VRM rest, not near the FBX-animated
crates/humanoid_retarget/src/adapters/arp_vrm.rs:14://! skeleton's rest to ARP's rest.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:18://! local rest so that the VRM bone's NEW world rest equals the ARP bone's
crates/humanoid_retarget/src/adapters/arp_vrm.rs:19://! world rest:
crates/humanoid_retarget/src/adapters/arp_vrm.rs:26://! Because we walk parents before children, the parent's `dst_rest_global`
crates/humanoid_retarget/src/adapters/arp_vrm.rs:37://! eye bones, etc.) are skipped silently — their rest stays as the VRM
crates/humanoid_retarget/src/adapters/arp_vrm.rs:52:pub struct RestAlignOverride {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:57:    /// Residual angle between the new `dst_rest_global` and the ARP world
crates/humanoid_retarget/src/adapters/arp_vrm.rs:73:// Stage 4 rest sync — strategy-based dispatch
crates/humanoid_retarget/src/adapters/arp_vrm.rs:76:// Stage 4 modifies VRM `dst_rest_local` / `dst_rest_global` to match the
crates/humanoid_retarget/src/adapters/arp_vrm.rs:77:// loaded FBX's rest pose. Each bone uses ONE of several strategies. This
crates/humanoid_retarget/src/adapters/arp_vrm.rs:78:// is the single source of truth for "which bones get what rest sync
crates/humanoid_retarget/src/adapters/arp_vrm.rs:80:// [`rest_sync_strategy`].
crates/humanoid_retarget/src/adapters/arp_vrm.rs:84:// - **Skip**: bone's rest stays as VRM original. Default for anything
crates/humanoid_retarget/src/adapters/arp_vrm.rs:87:// - **DirectCopy**: `dst_rest_local = src_local_rest` (ARP lcl_rot_rest). Used
crates/humanoid_retarget/src/adapters/arp_vrm.rs:93:// - **ScalarCurl**: axis-angle decompose ARP rest → extract scalar angle
crates/humanoid_retarget/src/adapters/arp_vrm.rs:101:// Adding a new bone: extend [`rest_sync_strategy`] to map its name to
crates/humanoid_retarget/src/adapters/arp_vrm.rs:104:// Adding a new strategy: extend [`RestSyncStrategy`] enum + add an
crates/humanoid_retarget/src/adapters/arp_vrm.rs:105:// `apply_<name>_one` function + dispatch in [`stage4_sync_rest_to_fbx`].
crates/humanoid_retarget/src/adapters/arp_vrm.rs:107:/// Per-bone rest sync strategy at Stage 4.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:109:pub enum RestSyncStrategy {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:110:    /// Do not touch this bone's rest.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:112:    /// Overwrite `dst_rest_local` with ARP `src_local_rest` directly.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:116:    /// User-calibrated quat — composed on top of VRM rest:
crates/humanoid_retarget/src/adapters/arp_vrm.rs:117:    /// `new_dst_rest_local = old_dst_rest_local * delta`.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:122:/// Classify a VRM bone's rest sync strategy.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:127:/// 2. Config-driven rules from `config.rest_sync_rules` when provided and
crates/humanoid_retarget/src/adapters/arp_vrm.rs:131:pub fn rest_sync_strategy(vrm_bone_name: &str, config: Option<&RetargetConfig>) -> RestSyncStrategy {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:134:        return RestSyncStrategy::UserCalibrated(delta);
crates/humanoid_retarget/src/adapters/arp_vrm.rs:139:        if !cfg.rest_sync_rules.is_empty() {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:140:            for (pattern, strategy_name) in &cfg.rest_sync_rules {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:143:                        "ScalarCurl" => RestSyncStrategy::ScalarCurl,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:144:                        "DirectCopy" => RestSyncStrategy::DirectCopy,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:145:                        "Skip" => RestSyncStrategy::Skip,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:146:                        _ => RestSyncStrategy::Skip,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:151:            return RestSyncStrategy::Skip;
crates/humanoid_retarget/src/adapters/arp_vrm.rs:155:    // Hardcoded fallback (backward compatible when rest_sync_rules absent).
crates/humanoid_retarget/src/adapters/arp_vrm.rs:156:    // Thumb: safety fallback — DEFAULT_POSE에 엄지 본이 없으면 VRM 원본 rest 유지.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:160:        return RestSyncStrategy::Skip;
crates/humanoid_retarget/src/adapters/arp_vrm.rs:166:        return RestSyncStrategy::ScalarCurl;
crates/humanoid_retarget/src/adapters/arp_vrm.rs:169:    RestSyncStrategy::Skip
crates/humanoid_retarget/src/adapters/arp_vrm.rs:176:    dst_rest_local: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:177:    dst_rest_global: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:179:    bone_tracks: &[BoneTrack],
crates/humanoid_retarget/src/adapters/arp_vrm.rs:180:) -> Option<RestAlignOverride> {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:181:    let src_local_rest = bone_tracks
crates/humanoid_retarget/src/adapters/arp_vrm.rs:184:        .map(|t| t.src_local_rest)?;
crates/humanoid_retarget/src/adapters/arp_vrm.rs:186:    let old_local = dst_rest_local
crates/humanoid_retarget/src/adapters/arp_vrm.rs:190:    let new_local = canonicalize(src_local_rest.normalize());
crates/humanoid_retarget/src/adapters/arp_vrm.rs:194:        .and_then(|p| dst_rest_global.get(p.as_str()))
crates/humanoid_retarget/src/adapters/arp_vrm.rs:199:    dst_rest_local.insert(bone_name.to_string(), new_local);
crates/humanoid_retarget/src/adapters/arp_vrm.rs:200:    dst_rest_global.insert(bone_name.to_string(), new_global);
crates/humanoid_retarget/src/adapters/arp_vrm.rs:202:    Some(RestAlignOverride {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:214:/// UserCalibrated — compose user delta on top of existing VRM rest.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:220:    dst_rest_local: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:221:    dst_rest_global: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:223:) -> Option<RestAlignOverride> {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:224:    let old_local = dst_rest_local
crates/humanoid_retarget/src/adapters/arp_vrm.rs:232:        .and_then(|p| dst_rest_global.get(p.as_str()))
crates/humanoid_retarget/src/adapters/arp_vrm.rs:237:    dst_rest_local.insert(bone_name.to_string(), new_local);
crates/humanoid_retarget/src/adapters/arp_vrm.rs:238:    dst_rest_global.insert(bone_name.to_string(), new_global);
crates/humanoid_retarget/src/adapters/arp_vrm.rs:240:    Some(RestAlignOverride {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:288:/// specific FBX's pose. Does not mutate `dst_rest_local` beyond any
crates/humanoid_retarget/src/adapters/arp_vrm.rs:292:/// diagnostic lines). The axis map is consumed by Stage 4 to apply per-FBX
crates/humanoid_retarget/src/adapters/arp_vrm.rs:295:    bone_tracks: &[BoneTrack],
crates/humanoid_retarget/src/adapters/arp_vrm.rs:296:    dst_rest_local: &HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:297:    dst_rest_global: &HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:304:        bone_tracks,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:305:        dst_rest_local,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:306:        dst_rest_global,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:316:/// **Stage 4: Sync VRM rest pose to the currently loaded FBX rest pose.**
crates/humanoid_retarget/src/adapters/arp_vrm.rs:319:/// classified via [`rest_sync_strategy`] and routed to the matching
crates/humanoid_retarget/src/adapters/arp_vrm.rs:324:/// `dst_rest_global` updates propagate to children before the child is
crates/humanoid_retarget/src/adapters/arp_vrm.rs:326:pub fn stage4_sync_rest_to_fbx(
crates/humanoid_retarget/src/adapters/arp_vrm.rs:327:    dst_rest_local: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:328:    dst_rest_global: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:330:    bone_tracks: &[BoneTrack],
crates/humanoid_retarget/src/adapters/arp_vrm.rs:333:) -> (Vec<RestAlignOverride>, Vec<String>) {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:334:    let mut warnings = vec!["[STAGE-4] Sync VRM rest to FBX rest pose".to_string()];
crates/humanoid_retarget/src/adapters/arp_vrm.rs:336:    // Classify each ARP-tracked bone by its rest sync strategy.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:340:    for track in bone_tracks {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:341:        match rest_sync_strategy(&track.vrm_bone_name, config) {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:342:            RestSyncStrategy::DirectCopy => direct_bones.push(track.vrm_bone_name.clone()),
crates/humanoid_retarget/src/adapters/arp_vrm.rs:343:            RestSyncStrategy::ScalarCurl => curl_bones.push(track.vrm_bone_name.clone()),
crates/humanoid_retarget/src/adapters/arp_vrm.rs:344:            RestSyncStrategy::UserCalibrated(q) => {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:347:            RestSyncStrategy::Skip => {}
crates/humanoid_retarget/src/adapters/arp_vrm.rs:355:        bone_tracks.len()
crates/humanoid_retarget/src/adapters/arp_vrm.rs:361:    let mut all_overrides: Vec<RestAlignOverride> = Vec::new();
crates/humanoid_retarget/src/adapters/arp_vrm.rs:368:            dst_rest_local,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:369:            dst_rest_global,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:371:            bone_tracks,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:392:            dst_rest_local,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:393:            dst_rest_global,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:405:    // Delegates to v5 finger_rest_align which has its own topo walk
crates/humanoid_retarget/src/adapters/arp_vrm.rs:408:    // bones are leaves of the arm chain — no back-ref to arm rests.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:409:    let curl_overrides = crate::finger_rest_align::apply_in_place(
crates/humanoid_retarget/src/adapters/arp_vrm.rs:411:        dst_rest_local,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:412:        dst_rest_global,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:432:/// `config` is optional. When `Some` and `config.rest_sync_rules` is non-empty,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:435:pub fn align_full_body_rest(
crates/humanoid_retarget/src/adapters/arp_vrm.rs:436:    dst_rest_local: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:437:    dst_rest_global: &mut HashMap<String, Quat>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:439:    bone_tracks: &[BoneTrack],
crates/humanoid_retarget/src/adapters/arp_vrm.rs:441:) -> (Vec<RestAlignOverride>, Vec<String>) {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:446:        stage3_build_adapter_config(bone_tracks, dst_rest_local, dst_rest_global);
crates/humanoid_retarget/src/adapters/arp_vrm.rs:456:    // Stage 4: Sync VRM rest to FBX rest pose
crates/humanoid_retarget/src/adapters/arp_vrm.rs:457:    let (overrides, stage4_warnings) = stage4_sync_rest_to_fbx(
crates/humanoid_retarget/src/adapters/arp_vrm.rs:458:        dst_rest_local,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:459:        dst_rest_global,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:461:        bone_tracks,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:477:pub use align_full_body_rest as align_finger_rest;
crates/humanoid_retarget/src/adapters/arp_vrm.rs:479:pub type FingerRestOverride = RestAlignOverride;

codex
이제 필요한 핵심은 두 가지입니다. `rest pose vs frame 0` 비교는 `fbx_rig`의 `rest_rotation_euler`와 frame 0 rotation track으로 직접 계산 가능하고, 누락 본 판정은 이 저장소가 이미 쓰는 ARP 본 이름 규칙을 재사용하는 게 맞아서 관련 매핑 정의를 찾겠습니다.
exec
/bin/zsh -lc "sed -n '1,240p' src/bin/analyze_fbx.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
exec
/bin/zsh -lc "sed -n '1060,1205p' crates/fbx_rig/src/lib.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
        attrs
            .get(start + 2)
            .and_then(|a| a.get_f64())
            .unwrap_or(0.0) as f32,
    )
}

/// Compute world-space bone positions for each frame of the FBX animation.
/// Used for debug visualization of the source skeleton.
pub fn compute_fbx_skeleton(fbx_data: &[u8]) -> Result<FbxSkeletonFrames, Error> {
    let fbx = parse(fbx_data)?;
    compute_fbx_skeleton_from_parsed(&fbx)
}

pub fn compute_fbx_skeleton_from_parsed(fbx: &SourceAsset) -> Result<FbxSkeletonFrames, Error> {
    let frame_count = fbx.frame_count;
    let duration = fbx.duration;

    let mut hierarchy: HashMap<String, String> = HashMap::new();
    for (name, bone) in &fbx.bones {
        if let Some(ref parent) = bone.parent {
            hierarchy.insert(name.clone(), parent.clone());
        }
    }

    // Topological sort: process parents before children (iterative to avoid stack overflow)
    let mut ordered: Vec<String> = Vec::new();
    let mut visited: std::collections::HashSet<String> = std::collections::HashSet::new();

    for start in fbx.bones.keys() {
        if visited.contains(start.as_str()) {
            continue;
        }
        let mut chain: Vec<String> = Vec::new();
        let mut in_chain: std::collections::HashSet<String> = std::collections::HashSet::new();
        let mut current = start.clone();
        while !visited.contains(current.as_str()) && !in_chain.contains(&current) {
            in_chain.insert(current.clone());
            chain.push(current.clone());
            if let Some(bone) = fbx.bones.get(&current)
                && let Some(ref parent) = bone.parent
            {
                current = parent.clone();
                continue;
            }
            break;
        }
        for name in chain.into_iter().rev() {
            if visited.insert(name.clone()) {
                ordered.push(name);
            }
        }
    }

    let mut bone_positions: HashMap<String, Vec<[f32; 3]>> = HashMap::new();
    let mut bone_rotations: HashMap<String, Vec<Quat>> = HashMap::new();

    for frame in 0..frame_count {
        let mut world_transforms: HashMap<String, (Vec3, Quat)> = HashMap::new();

        for name in &ordered {
            let bone = match fbx.bones.get(name) {
                Some(b) => b,
                None => continue,
            };

            let (parent_pos, parent_rot) = bone
                .parent
                .as_ref()
                .and_then(|p| world_transforms.get(p))
                .copied()
                .unwrap_or((Vec3::ZERO, Quat::IDENTITY));

            let pre_rot = bone.pre_rotation;

            let rest_rot = euler_to_quat(
                bone.rest_rotation_euler,
                bone.rotation_order,
            );
            let anim_rot = fbx
                .tracks
                .get(name)
                .and_then(|t| t.rotations.get(frame))
                .copied()
                .unwrap_or(rest_rot);

            let anim_t = fbx
                .tracks
                .get(name)
                .and_then(|t| t.translations.get(frame))
                .copied()
                .unwrap_or(bone.rest_translation);

            let local_rot = pre_rot * anim_rot;
            let world_pos = parent_pos + parent_rot * anim_t;
            let world_rot = parent_rot * local_rot;

            world_transforms.insert(name.clone(), (world_pos, world_rot));
        }

        for name in &ordered {
            if let Some(&(pos, rot)) = world_transforms.get(name) {
                // Blender FBX: root -90°X handles Z→Y in FK; positions already Y-up m.
                // UE/Maya FBX: Z-up cm → (x, z, -y) * 0.01
                let is_blender = fbx.detected_source_type == FbxSourceType::Blender;
                if is_blender {
                    bone_positions.entry(name.clone()).or_default().push([
                        pos.x, pos.y, pos.z,
                    ]);
                } else {
                    bone_positions.entry(name.clone()).or_default().push([
                        pos.x * 0.01,
                        pos.z * 0.01,
                        -pos.y * 0.01,
                    ]);
                }
                bone_rotations.entry(name.clone()).or_default().push(rot);
            }
        }
    }

    Ok(FbxSkeletonFrames {
        frame_count,
        duration,
        bone_positions,
        bone_rotations,
        hierarchy,
    })
}

 succeeded in 0ms:
//! FBX animation analyzer — pelvis, root, arm rotation/translation diagnostics
use humanoid_retarget::glam::Quat;
use std::env;
use std::fs;

fn main() {
    let path = env::args().nth(1).unwrap_or_else(|| {
        eprintln!("Usage: analyze_fbx <path.fbx>");
        std::process::exit(1);
    });

    let data = fs::read(&path).expect("Failed to read FBX file");
    let fbx_data = humanoid_retarget::fbx::parse(&data).expect("Failed to parse FBX");

    println!("=== FBX Analysis: {} ===", path);
    println!(
        "Duration: {:.1}s, Frames: {}\n",
        fbx_data.duration, fbx_data.frame_count
    );

    // Analyze these bones
    // Print full hierarchy
    println!("=== Full Skeleton Hierarchy ===\n");
    // Build parent→children map
    let mut children_map: std::collections::HashMap<String, Vec<String>> =
        std::collections::HashMap::new();
    let mut roots: Vec<String> = Vec::new();
    for (name, bone) in &fbx_data.bones {
        match &bone.parent {
            Some(p) => children_map
                .entry(p.clone())
                .or_default()
                .push(name.clone()),
            None => roots.push(name.clone()),
        }
    }
    roots.sort();
    fn print_tree(
        name: &str,
        bones: &std::collections::HashMap<String, humanoid_retarget::fbx::FbxBone>,
        children: &std::collections::HashMap<String, Vec<String>>,
        tracks: &std::collections::HashMap<String, humanoid_retarget::fbx::FbxBoneTrack>,
        depth: usize,
    ) {
        let indent = "  ".repeat(depth);
        let bone = bones.get(name);
        let pre_angle = bone
            .map(|b| b.pre_rotation.to_axis_angle().1.to_degrees())
            .unwrap_or(0.0);
        let lcl_rest = bone
            .map(|b| {
                humanoid_retarget::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order)
                    .to_axis_angle()
                    .1
                    .to_degrees()
            })
            .unwrap_or(0.0);
        let has_anim = tracks.contains_key(name);
        let trans = bone.map(|b| b.rest_translation).unwrap_or_default();
        println!(
            "{}{} | PreRot={:.1}° LclRest={:.1}° trans=({:.1},{:.1},{:.1}) {}",
            indent,
            name,
            pre_angle,
            lcl_rest,
            trans.x,
            trans.y,
            trans.z,
            if has_anim { "✓anim" } else { "" }
        );
        if let Some(kids) = children.get(name) {
            let mut sorted = kids.clone();
            sorted.sort();
            for kid in &sorted {
                print_tree(kid, bones, children, tracks, depth + 1);
            }
        }
    }
    for root in &roots {
        print_tree(root, &fbx_data.bones, &children_map, &fbx_data.tracks, 0);
    }
    println!();

    let targets: Vec<&str> = Vec::new(); // skip per-bone analysis

    for bone_name in &targets {
        let bone = match fbx_data.bones.get(*bone_name) {
            Some(b) => b,
            None => continue,
        };

        println!("=== {} ===", bone_name);
        println!("  parent: {:?}", bone.parent);
        println!(
            "  PreRotation: ({:.4},{:.4},{:.4},{:.4}) angle={:.1}°",
            bone.pre_rotation.x,
            bone.pre_rotation.y,
            bone.pre_rotation.z,
            bone.pre_rotation.w,
            bone.pre_rotation.to_axis_angle().1.to_degrees()
        );
        println!(
            "  rest_rotation_euler: ({:.2},{:.2},{:.2})",
            bone.rest_rotation_euler.x, bone.rest_rotation_euler.y, bone.rest_rotation_euler.z
        );
        println!(
            "  rest_translation: ({:.2},{:.2},{:.2})",
            bone.rest_translation.x, bone.rest_translation.y, bone.rest_translation.z
        );
        println!("  rotation_order: {}", bone.rotation_order);

        // Compute full local rest = PreRot * euler_to_quat(rest_rotation)
        let lcl_rest =
            humanoid_retarget::fbx::euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
        let full_local = bone.pre_rotation * lcl_rest;
        println!(
            "  Lcl_Rot_rest(quat): ({:.4},{:.4},{:.4},{:.4}) angle={:.1}°",
            lcl_rest.x,
            lcl_rest.y,
            lcl_rest.z,
            lcl_rest.w,
            lcl_rest.to_axis_angle().1.to_degrees()
        );
        println!(
            "  full_local_rest: ({:.4},{:.4},{:.4},{:.4}) angle={:.1}°",
            full_local.x,
            full_local.y,
            full_local.z,
            full_local.w,
            full_local.to_axis_angle().1.to_degrees()
        );

        if let Some(track) = fbx_data.tracks.get(*bone_name) {
            println!(
                "  Animation: {} rot frames, {} trans frames",
                track.rotations.len(),
                track.translations.len()
            );

            // Rotation analysis
            let mut max_angle = 0.0f32;
            let mut max_frame = 0usize;
            let mut min_angle = f32::MAX;

            // Delta from rest
            let mut max_delta = 0.0f32;
            let mut max_delta_frame = 0usize;

            for (i, q) in track.rotations.iter().enumerate() {
                let q: Quat = *q;
                let angle = q.to_axis_angle().1.to_degrees().abs();
                if angle > max_angle {
                    max_angle = angle;
                    max_frame = i;
                }
                if angle < min_angle {
                    min_angle = angle;
                }

                // Delta = difference from rest Lcl Rotation
                let delta_from_rest: Quat = lcl_rest.inverse() * q;
                let d = delta_from_rest.to_axis_angle().1.to_degrees().abs();
                if d > max_delta {
                    max_delta = d;
                    max_delta_frame = i;
                }
            }

            println!(
                "  Lcl Rotation range: min={:.1}° max={:.1}° (frame {})",
                min_angle, max_angle, max_frame
            );
            println!(
                "  Delta from rest range: max={:.1}° (frame {})",
                max_delta, max_delta_frame
            );

            // Print key frames
            let key_frames: Vec<usize> = vec![0, 1, max_frame, max_delta_frame];
            for &i in &key_frames {
                if let Some(q) = track.rotations.get(i) {
                    let q: Quat = *q;
                    let (axis, angle) = q.to_axis_angle();
                    let delta_from_rest: Quat = lcl_rest.inverse() * q;
                    let d_angle = delta_from_rest.to_axis_angle().1.to_degrees();
                    let angle_deg: f32 = angle.to_degrees();
                    println!(
                        "    frame[{}]: angle={:.1}° delta_from_rest={:.1}° axis=({:.3},{:.3},{:.3})",
                        i, angle_deg, d_angle, axis.x, axis.y, axis.z
                    );
                }
            }

            // Translation analysis
            let rest_t = bone.rest_translation;
            let mut max_t_delta = 0.0f32;
            let mut max_t_frame = 0usize;
            for (i, t) in track.translations.iter().enumerate() {
                let delta = (*t - rest_t).length();
                if delta > max_t_delta {
                    max_t_delta = delta;
                    max_t_frame = i;
                }
            }
            if max_t_delta > 0.01 {
                println!(
                    "  Translation: max delta={:.1}cm (frame {})",
                    max_t_delta, max_t_frame
                );
                println!("    rest=({:.1},{:.1},{:.1})", rest_t.x, rest_t.y, rest_t.z);
                if let Some(t) = track.translations.get(max_t_frame) {
                    println!(
                        "    frame[{}]=({:.1},{:.1},{:.1})",
                        max_t_frame, t.x, t.y, t.z
                    );
                }
            }
        } else {
            println!("  (no animation track)");
        }
        println!();
    }
}

exec
/bin/zsh -lc 'rg -n "c_.*hips|Hips|Spine|Chest|Neck|Head|Shoulder|UpperArm|LowerArm|Hand|UpLeg|Leg|Foot|auto-rig|arp" crates/humanoid_retarget/src crates/humanoid_retarget/tests src -S' in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
src/setup.rs:278:                    VrmHandle(handle),
src/setup.rs:297:    let config_path = &p.configs.arp_body;
crates/humanoid_retarget/src/postprocess/mod.rs:24://!   `adapters::arp_vrm` rest sync system.
crates/humanoid_retarget/src/postprocess/mod.rs:26://!   in `adapters::arp_vrm_user_pose`.
src/debug.rs:93:    // --- Hand position summary (top of panel) ---
src/debug.rs:94:    let hand_bones: &[&str] = &["leftHand", "rightHand"];
src/debug.rs:150:        "leftShoulder",
src/debug.rs:151:        "leftUpperArm",
src/debug.rs:152:        "leftLowerArm",
src/debug.rs:153:        "leftHand",
src/debug.rs:154:        "rightShoulder",
src/debug.rs:155:        "rightUpperArm",
src/debug.rs:156:        "rightLowerArm",
src/debug.rs:157:        "rightHand",
src/debug.rs:158:        "leftUpperLeg",
src/debug.rs:159:        "leftLowerLeg",
src/debug.rs:160:        "rightUpperLeg",
src/debug.rs:161:        "rightLowerLeg",
src/debug.rs:266:    // Hand position delta to stdout every 30 frames
src/debug.rs:268:        for &vrm_name in &["leftHand", "rightHand"] {
src/main.rs:120:                // Phase 3: playback start (needs AnimationGraphHandle from phase 2)
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:44://! - **Both hands by default** — operates on `leftHand` and `rightHand`
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:52://!     [postprocess::wrist_twist] leftHand: 142 frames, max=42.3°
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:53://!     [postprocess::wrist_twist] rightHand: 142 frames, max=51.7°
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:77:        ("leftLowerArm", "leftHand"),
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:78:        ("rightLowerArm", "rightHand"),
src/calibration.rs:34:    "leftShoulder",
src/calibration.rs:35:    "leftUpperArm",
src/calibration.rs:36:    "leftLowerArm",
src/calibration.rs:37:    "leftHand",
src/calibration.rs:38:    "leftThumbMetacarpal",
src/calibration.rs:41:    "rightShoulder",
src/calibration.rs:42:    "rightUpperArm",
src/calibration.rs:43:    "rightLowerArm",
src/calibration.rs:44:    "rightHand",
src/calibration.rs:45:    "rightThumbMetacarpal",
crates/humanoid_retarget/src/retargeter.rs:89:    /// Foot bone indices + sole offsets for ground contact correction.
crates/humanoid_retarget/src/retargeter.rs:93:    /// Hips bone index for Y correction.
crates/humanoid_retarget/src/retargeter.rs:96:    foot_contact: Option<crate::types::FootContactData>,
crates/humanoid_retarget/src/retargeter.rs:106:    /// (`adapters::arp_vrm::align_full_body_rest`). Off by default.
crates/humanoid_retarget/src/retargeter.rs:109:    pub arp_vrm_rest_align: bool,
crates/humanoid_retarget/src/retargeter.rs:141:        if options.arp_vrm_rest_align {
crates/humanoid_retarget/src/retargeter.rs:142:            let (overrides, warnings) = crate::adapters::arp_vrm::align_full_body_rest(
crates/humanoid_retarget/src/retargeter.rs:166:            let upper = vrm_rest.bone_rest_translation.get("leftUpperLeg")
crates/humanoid_retarget/src/retargeter.rs:167:                .or_else(|| vrm_rest.bone_rest_translation.get("rightUpperLeg"))
crates/humanoid_retarget/src/retargeter.rs:169:            let lower = vrm_rest.bone_rest_translation.get("leftLowerLeg")
crates/humanoid_retarget/src/retargeter.rs:170:                .or_else(|| vrm_rest.bone_rest_translation.get("rightLowerLeg"))
crates/humanoid_retarget/src/retargeter.rs:172:            let foot = vrm_rest.bone_rest_translation.get("leftFoot")
crates/humanoid_retarget/src/retargeter.rs:173:                .or_else(|| vrm_rest.bone_rest_translation.get("rightFoot"))
crates/humanoid_retarget/src/retargeter.rs:186:            let upper = get_pos("leftUpperLeg").or_else(|| get_pos("rightUpperLeg"));
crates/humanoid_retarget/src/retargeter.rs:187:            let lower = get_pos("leftLowerLeg").or_else(|| get_pos("rightLowerLeg"));
crates/humanoid_retarget/src/retargeter.rs:188:            let foot = get_pos("leftFoot").or_else(|| get_pos("rightFoot"));
crates/humanoid_retarget/src/retargeter.rs:284:            ("leftShoulder", "leftUpperArm"), ("leftUpperArm", "leftLowerArm"),
crates/humanoid_retarget/src/retargeter.rs:285:            ("leftLowerArm", "leftHand"),
crates/humanoid_retarget/src/retargeter.rs:286:            ("leftHand", "leftMiddleProximal"),
crates/humanoid_retarget/src/retargeter.rs:287:            ("rightShoulder", "rightUpperArm"), ("rightUpperArm", "rightLowerArm"),
crates/humanoid_retarget/src/retargeter.rs:288:            ("rightLowerArm", "rightHand"),
crates/humanoid_retarget/src/retargeter.rs:289:            ("rightHand", "rightMiddleProximal"),
crates/humanoid_retarget/src/retargeter.rs:290:            ("leftUpperLeg", "leftLowerLeg"), ("leftLowerLeg", "leftFoot"),
crates/humanoid_retarget/src/retargeter.rs:291:            ("rightUpperLeg", "rightLowerLeg"), ("rightLowerLeg", "rightFoot"),
crates/humanoid_retarget/src/retargeter.rs:306:        // Foot/hips indices for ground contact correction
crates/humanoid_retarget/src/retargeter.rs:307:        let left_foot_idx = name_to_idx.get("leftFoot").copied();
crates/humanoid_retarget/src/retargeter.rs:308:        let right_foot_idx = name_to_idx.get("rightFoot").copied();
crates/humanoid_retarget/src/retargeter.rs:454:            let foot_sides: [(Option<usize>, &crate::types::FootSideContact); 2] = [
crates/humanoid_retarget/src/retargeter.rs:531:                let left_chain: &[&str] = &["VRMC_vrm.root_bone", "hips", "leftUpperLeg", "leftLowerLeg", "leftFoot"];
crates/humanoid_retarget/src/retargeter.rs:532:                let right_chain: &[&str] = &["VRMC_vrm.root_bone", "hips", "rightUpperLeg", "rightLowerLeg", "rightFoot"];
crates/humanoid_retarget/tests/integration.rs:4:/// Only config available in repo: arp_body.json
crates/humanoid_retarget/tests/integration.rs:5:fn arp_config_json() -> String {
crates/humanoid_retarget/tests/integration.rs:6:    fs::read_to_string("../../assets/retarget/arp_body.json")
crates/humanoid_retarget/tests/integration.rs:7:        .expect("arp_body.json should exist")
crates/humanoid_retarget/tests/integration.rs:27:fn config_parse_arp() {
crates/humanoid_retarget/tests/integration.rs:28:    let json = arp_config_json();
crates/humanoid_retarget/tests/integration.rs:29:    let config = RetargetConfig::from_json(&json).expect("arp config should parse");
crates/humanoid_retarget/tests/integration.rs:30:    assert_eq!(config.name, "arp_body");
crates/humanoid_retarget/tests/integration.rs:36:    let json = arp_config_json();
crates/humanoid_retarget/tests/integration.rs:73:        humanoid_retarget::retarget(&fbx_body(), &arp_config_json(), VrmVersion::V1_0)
crates/humanoid_retarget/tests/integration.rs:83:        humanoid_retarget::retarget(&fbx_body(), &arp_config_json(), VrmVersion::V0x)
crates/humanoid_retarget/tests/integration.rs:94:    let config_json = arp_config_json();
crates/humanoid_retarget/tests/integration.rs:135:        humanoid_retarget::retarget_with_skeleton(&fbx_body(), &arp_config_json(), VrmVersion::V1_0)
crates/humanoid_retarget/tests/integration.rs:147:    let result = humanoid_retarget::retarget(&fbx_flutter(), &arp_config_json(), VrmVersion::V1_0);
crates/humanoid_retarget/tests/integration.rs:157:    let config_json = arp_config_json();
src/file_loading.rs:154:            VrmHandle(handle),
src/file_loading.rs:157:        log.push("[LOAD] VrmHandle spawned — waiting for init...");
src/file_loading.rs:190:            let config_result = fs::read_to_string(&crate::paths::paths().configs.arp_body);
src/file_loading.rs:305:/// Handle Shift+F facial-only FBX load (expression slot only, no bone retarget)
src/file_loading.rs:322:            None => match fs::read_to_string(&crate::paths::paths().configs.arp_body) {
crates/humanoid_retarget/src/finger_axis_map.rs:18://! rest (carpometacarpal coupling) and need a different approach. They are
crates/humanoid_retarget/src/finger_axis_map.rs:28:/// `arp_baseline_curl_rad` is extracted here (not in Stage 2) because it's
crates/humanoid_retarget/src/finger_axis_map.rs:35:    pub arp_axis_local: Vec3,
crates/humanoid_retarget/src/finger_axis_map.rs:38:    /// Magnitude of ARP rest_local around `arp_axis_local`. This is the
crates/humanoid_retarget/src/finger_axis_map.rs:41:    pub arp_baseline_curl_rad: f32,
crates/humanoid_retarget/src/finger_axis_map.rs:76:fn derive_arp_axis_and_baseline(track: &BoneTrack) -> (Vec3, f32) {
crates/humanoid_retarget/src/finger_axis_map.rs:111:///   src_global_rest * arp_axis_local  →  ARP curl axis in world frame
crates/humanoid_retarget/src/finger_axis_map.rs:115:/// An earlier version used `inv(dst_rest_local) * src_rest_local * arp_axis`,
crates/humanoid_retarget/src/finger_axis_map.rs:116:/// which silently collapsed to `arp_axis` because finger-level local rests
crates/humanoid_retarget/src/finger_axis_map.rs:124:    arp_axis_local: Vec3,
crates/humanoid_retarget/src/finger_axis_map.rs:126:    let arp_axis_world = src_global_rest * arp_axis_local;
crates/humanoid_retarget/src/finger_axis_map.rs:127:    let vrm_local = dst_rest_global.inverse() * arp_axis_world;
crates/humanoid_retarget/src/finger_axis_map.rs:156:        "[B-DIAG] Option B dry-run: derived = inv(dst_rest_global) * src_global_rest * arp_axis"
crates/humanoid_retarget/src/finger_axis_map.rs:160:        "[B-DIAG] bone                         arp_axis            hard_axis  derived_axis         err°"
crates/humanoid_retarget/src/finger_axis_map.rs:178:        let (arp_axis, baseline_rad) = derive_arp_axis_and_baseline(track);
crates/humanoid_retarget/src/finger_axis_map.rs:181:        let derived = derive_vrm_axis_option_b(src_global, dst_global, arp_axis);
crates/humanoid_retarget/src/finger_axis_map.rs:203:            arp_axis.x, arp_axis.y, arp_axis.z,
crates/humanoid_retarget/src/finger_axis_map.rs:223:                    arp_axis_local: arp_axis,
crates/humanoid_retarget/src/finger_axis_map.rs:225:                    arp_baseline_curl_rad: baseline_rad,
crates/humanoid_retarget/src/finger_axis_map.rs:231:    // Hand bone diagnostic: measure the ARP vs VRM bind-orientation delta
crates/humanoid_retarget/src/finger_axis_map.rs:232:    // for leftHand/rightHand. Reports BOTH:
crates/humanoid_retarget/src/finger_axis_map.rs:247:    for hand_name in &["leftHand", "rightHand"] {
src/retarget_quality.rs:191:        ("leftUpperLeg", "leftLowerLeg", "lUL"),
src/retarget_quality.rs:192:        ("leftLowerLeg", "leftFoot", "lLL"),
src/retarget_quality.rs:193:        ("leftUpperArm", "leftLowerArm", "lUA"),
src/retarget_quality.rs:194:        ("leftLowerArm", "leftHand", "lLA"),
src/retarget_quality.rs:204:    let vrm_lla_pos = bone_gtf("leftLowerArm").map(|g| g.translation());
src/retarget_quality.rs:205:    let vrm_rla_pos = bone_gtf("rightLowerArm").map(|g| g.translation());
src/retarget_quality.rs:223:            ("leftShoulder", "leftUpperArm", "lSh"),
src/retarget_quality.rs:224:            ("rightShoulder", "rightUpperArm", "rSh"),
src/retarget_quality.rs:225:            ("leftUpperArm", "leftLowerArm", "lUA"),
src/retarget_quality.rs:226:            ("rightUpperArm", "rightLowerArm", "rUA"),
src/retarget_quality.rs:227:            ("leftLowerArm", "leftHand", "lLA"),
src/retarget_quality.rs:228:            ("rightLowerArm", "rightHand", "rLA"),
src/retarget_quality.rs:229:            ("leftUpperLeg", "leftLowerLeg", "lUL"),
src/retarget_quality.rs:230:            ("rightUpperLeg", "rightLowerLeg", "rUL"),
src/retarget_quality.rs:231:            ("leftLowerLeg", "leftFoot", "lLL"),
src/retarget_quality.rs:232:            ("rightLowerLeg", "rightFoot", "rLL"),
src/retarget_quality.rs:245:        ("leftUpperArm", "leftLowerArm", "lUA"),
src/retarget_quality.rs:246:        ("leftLowerArm", "leftHand", "lLA"),
src/retarget_quality.rs:247:        ("rightUpperArm", "rightLowerArm", "rUA"),
src/retarget_quality.rs:248:        ("rightLowerArm", "rightHand", "rLA"),
src/retarget_quality.rs:249:        ("leftUpperLeg", "leftLowerLeg", "lUL"),
src/retarget_quality.rs:250:        ("leftLowerLeg", "leftFoot", "lLL"),
src/retarget_quality.rs:271:        ("leftLowerArm", "leftHand", "leftMiddleProximal", "L"),
src/retarget_quality.rs:272:        ("rightLowerArm", "rightHand", "rightMiddleProximal", "R"),
src/retarget_quality.rs:317:        let arp_forearm_rot = skel.bone_rotations.get(fbx_forearm_key).and_then(|r| r.get(frame).copied()).map(|r| coord_rot_wr * r * coord_rot_wr_inv);
src/retarget_quality.rs:318:        let arp_hand_rot    = skel.bone_rotations.get(fbx_hand_key).and_then(|r| r.get(frame).copied()).map(|r| coord_rot_wr * r * coord_rot_wr_inv);
src/retarget_quality.rs:320:        let arp_wrist_bend = match (arp_forearm_rot, arp_hand_rot) {
src/retarget_quality.rs:334:            "[WRIST-ROT] f={} {} arp={:.0}° vrm_world={:.0}° vrm_local={:.0}° diff={:+.0}°",
src/retarget_quality.rs:335:            frame, label, arp_wrist_bend, vrm_wrist_bend, vrm_hand_local_deg,
src/retarget_quality.rs:336:            vrm_wrist_bend - arp_wrist_bend,
src/paths.rs:21:    pub arp_body: String,
crates/humanoid_retarget/src/adapters/mod.rs:13:pub mod arp_vrm;
crates/humanoid_retarget/src/adapters/mod.rs:14:pub mod arp_vrm_user_pose;
src/retarget.rs:108:    let foot_l_y = bone_world_position.get("leftFoot").map(|p| p.y).unwrap_or(0.0);
src/retarget.rs:109:    let foot_r_y = bone_world_position.get("rightFoot").map(|p| p.y).unwrap_or(0.0);
src/retarget.rs:161:        arp_vrm_rest_align: retarget_state.arp_vrm_rest_align_adapter,
src/retarget.rs:297:            ec.insert(AnimationGraphHandle(graph_handle.clone()));
src/retarget.rs:316:        retarget_state.arp_vrm_rest_align_adapter =
src/retarget.rs:317:            !retarget_state.arp_vrm_rest_align_adapter;
src/retarget.rs:320:            "[ADAPTER] arp_vrm_rest_align = {}",
src/retarget.rs:321:            retarget_state.arp_vrm_rest_align_adapter
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:52:/// **Shoulder intentionally excluded** — adding shoulder over-rotates
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:57:        vrm_bone_name: "leftUpperArm",
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:61:        vrm_bone_name: "leftLowerArm",
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:66:        vrm_bone_name: "rightUpperArm",
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:70:        vrm_bone_name: "rightLowerArm",
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:74:    // via arp_vrm_user_pose::lookup. Left-side values calibrated visually
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:82:        vrm_bone_name: "leftThumbMetacarpal",
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:94:        vrm_bone_name: "rightThumbMetacarpal",
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs:105:    // Hand wrist twist (EXP-005 hardcoded -55°/+55°) was promoted to dynamic
src/timeline.rs:380:    // Spine chain rotations
src/timeline.rs:381:    for bone_name in &["spine", "chest", "upperChest", "neck"] {
crates/humanoid_retarget/tests/fixtures/mod.rs:127:// Expected A1.3 FootContact:
crates/humanoid_retarget/tests/fixtures/mod.rs:142:// Hand-computed A1.1 per-bone:
crates/humanoid_retarget/tests/fixtures/mod.rs:227:// Legs likewise: thigh.l +X, thigh.r −X, 2°/frame. Other bones identity.
crates/humanoid_retarget/tests/fixtures/mod.rs:271:// Hand bones (hand.l, hand.r, finger1.l): static → rate 0 → Grade A.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:11://! canonical bind-delta formula) all failed because the wrist (`leftHand` /
crates/humanoid_retarget/src/adapters/arp_vrm.rs:12://! `rightHand`) is also wrong. Fixing the children while their parent is wrong
crates/humanoid_retarget/src/adapters/arp_vrm.rs:22://!     new_local  = inv(parent_world_after_override) * arp_bone_world
crates/humanoid_retarget/src/adapters/arp_vrm.rs:23://!     new_global = arp_bone_world  (by construction)
crates/humanoid_retarget/src/adapters/arp_vrm.rs:29://! equals arp_bone_world directly.
crates/humanoid_retarget/src/adapters/arp_vrm.rs:125:/// 1. `UserCalibrated` — from `arp_vrm_user_pose::lookup` (carries quat data,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:133:    if let Some(delta) = super::arp_vrm_user_pose::lookup(vrm_bone_name) {
crates/humanoid_retarget/src/vrm_rest.rs:274:    // Spine chain: points UP (+Y)
crates/humanoid_retarget/src/vrm_rest.rs:278:        ("chest", "upperChest"),
crates/humanoid_retarget/src/vrm_rest.rs:279:        ("upperChest", "neck"),
crates/humanoid_retarget/src/vrm_rest.rs:284:    // Fallback: chest→neck if no upperChest
crates/humanoid_retarget/src/vrm_rest.rs:291:        // Shoulder → upper arm: points sideways
crates/humanoid_retarget/src/vrm_rest.rs:292:        pairs.push((format!("{side}Shoulder"), format!("{side}UpperArm"), side_x));
crates/humanoid_retarget/src/vrm_rest.rs:294:        pairs.push((format!("{side}UpperArm"), format!("{side}LowerArm"), side_x));
crates/humanoid_retarget/src/vrm_rest.rs:296:        pairs.push((format!("{side}LowerArm"), format!("{side}Hand"), side_x));
crates/humanoid_retarget/src/vrm_rest.rs:297:        // Hand → middle proximal
crates/humanoid_retarget/src/vrm_rest.rs:298:        pairs.push((format!("{side}Hand"), format!("{side}MiddleProximal"), side_x));
crates/humanoid_retarget/src/vrm_rest.rs:300:        // Leg chain: points DOWN (-Y)
crates/humanoid_retarget/src/vrm_rest.rs:301:        pairs.push((format!("{side}UpperLeg"), format!("{side}LowerLeg"), Vec3::NEG_Y));
crates/humanoid_retarget/src/vrm_rest.rs:302:        pairs.push((format!("{side}LowerLeg"), format!("{side}Foot"), Vec3::NEG_Y));
crates/humanoid_retarget/src/vrm_rest.rs:303:        // Foot → toes: points FORWARD (-Z in glTF)
crates/humanoid_retarget/src/vrm_rest.rs:304:        pairs.push((format!("{side}Foot"), format!("{side}Toes"), Vec3::NEG_Z));
crates/humanoid_retarget/src/vrm_rest.rs:349:/// 1. Find the joint index for leftFoot/rightFoot in the skin
crates/humanoid_retarget/src/vrm_rest.rs:363:            let ly = bone_world_position.get("leftFoot").map(|p| p.y).unwrap_or(0.0);
crates/humanoid_retarget/src/vrm_rest.rs:364:            let ry = bone_world_position.get("rightFoot").map(|p| p.y).unwrap_or(0.0);
crates/humanoid_retarget/src/vrm_rest.rs:390:    // Find node indices for leftFoot, rightFoot, leftToes, rightToes
crates/humanoid_retarget/src/vrm_rest.rs:391:    let foot_bones = ["leftFoot", "rightFoot", "leftToes", "rightToes"];
crates/humanoid_retarget/src/vrm_rest.rs:510:    let left_foot_y = bone_world_position.get("leftFoot").map(|p| p.y).unwrap_or(0.0);
crates/humanoid_retarget/src/vrm_rest.rs:511:    let right_foot_y = bone_world_position.get("rightFoot").map(|p| p.y).unwrap_or(0.0);
crates/humanoid_retarget/src/vrm_rest.rs:513:    let left_offset = foot_min_y.get("leftFoot")
crates/humanoid_retarget/src/vrm_rest.rs:515:    let right_offset = foot_min_y.get("rightFoot")
crates/humanoid_retarget/src/vrm_rest.rs:523:/// - Heel point: lowest Y vertex skinned to foot bone (leftFoot/rightFoot)
crates/humanoid_retarget/src/vrm_rest.rs:530:) -> Option<crate::types::FootContactData> {
crates/humanoid_retarget/src/vrm_rest.rs:547:    let target_bones = ["leftFoot", "rightFoot", "leftToes", "rightToes"];
crates/humanoid_retarget/src/vrm_rest.rs:634:    let build_side = |foot: &str, toes: &str| -> crate::types::FootSideContact {
crates/humanoid_retarget/src/vrm_rest.rs:654:        crate::types::FootSideContact { heel_offset_y, toe_offset_y, heel_local_z, toe_local_z }
crates/humanoid_retarget/src/vrm_rest.rs:657:    let left = build_side("leftFoot", "leftToes");
crates/humanoid_retarget/src/vrm_rest.rs:658:    let right = build_side("rightFoot", "rightToes");
crates/humanoid_retarget/src/vrm_rest.rs:660:    Some(crate::types::FootContactData { left, right })
src/bin/dump_vrm_transforms.rs:48:    is_finger(name) || name == "leftHand" || name == "rightHand"
src/bin/dump_vrm_transforms.rs:56:        "leftThumbMetacarpal" => Some("leftHand"),
src/bin/dump_vrm_transforms.rs:57:        "leftThumbProximal" => Some("leftThumbMetacarpal"),
src/bin/dump_vrm_transforms.rs:59:        "rightThumbMetacarpal" => Some("rightHand"),
src/bin/dump_vrm_transforms.rs:60:        "rightThumbProximal" => Some("rightThumbMetacarpal"),
src/bin/dump_vrm_transforms.rs:63:        "leftIndexProximal" => Some("leftHand"),
src/bin/dump_vrm_transforms.rs:66:        "rightIndexProximal" => Some("rightHand"),
src/bin/dump_vrm_transforms.rs:70:        "leftMiddleProximal" => Some("leftHand"),
src/bin/dump_vrm_transforms.rs:73:        "rightMiddleProximal" => Some("rightHand"),
src/bin/dump_vrm_transforms.rs:77:        "leftRingProximal" => Some("leftHand"),
src/bin/dump_vrm_transforms.rs:80:        "rightRingProximal" => Some("rightHand"),
src/bin/dump_vrm_transforms.rs:84:        "leftLittleProximal" => Some("leftHand"),
src/bin/dump_vrm_transforms.rs:87:        "rightLittleProximal" => Some("rightHand"),
src/bin/dump_vrm_transforms.rs:97:        "leftThumbMetacarpal" => Some("leftThumbProximal"),
src/bin/dump_vrm_transforms.rs:99:        "rightThumbMetacarpal" => Some("rightThumbProximal"),
src/bin/dump_vrm_transforms.rs:251:        VrmHandle(handle),
crates/humanoid_retarget/src/finger_rest_align.rs:12://!     arp_baseline_curl,
crates/humanoid_retarget/src/finger_rest_align.rs:33://! Stage 2 only modifies finger bones (24 non-thumb). The wrist (`leftHand`,
crates/humanoid_retarget/src/finger_rest_align.rs:34://! `rightHand`) is left untouched. The VRM bind-conjugation formula then
crates/humanoid_retarget/src/finger_rest_align.rs:45:use crate::adapters::arp_vrm::RestAlignOverride;
crates/humanoid_retarget/src/finger_rest_align.rs:66:/// parent is `leftHand`) read the parent's UNMODIFIED global rest from
crates/humanoid_retarget/src/finger_rest_align.rs:94:            entry.arp_baseline_curl_rad,
crates/humanoid_retarget/src/finger_rest_align.rs:118:            baseline_deg: entry.arp_baseline_curl_rad.to_degrees(),
crates/humanoid_retarget/src/finger_rest_align.rs:128:/// This is the convenience wrapper used by the `arp_vrm` adapter. It calls
src/preset.rs:59:        VrmHandle(handle),
src/preset.rs:81:    let config_name = &crate::paths::paths().configs.arp_body;
crates/humanoid_retarget/tests/finger_axis_map.rs:11:    assert!(!is_handled_finger("leftHand"));
crates/humanoid_retarget/tests/finger_axis_map.rs:18:    assert!(!is_any_finger("leftHand"));
src/visualization.rs:122:                "hips" => return "Hips".into(),
src/visualization.rs:123:                "spine" => return "Spine".into(),
src/visualization.rs:124:                "chest" => return "Chest".into(),
src/visualization.rs:125:                "upperChest" => return "UChest".into(),
src/visualization.rs:126:                "neck" => return "Neck".into(),
src/visualization.rs:127:                "head" => return "Head".into(),
src/visualization.rs:134:                "Shoulder" => "Shld",
src/visualization.rs:135:                "UpperArm" => "UArm",
src/visualization.rs:136:                "LowerArm" => "LArm",
src/visualization.rs:137:                "Hand" => "Hand",
src/visualization.rs:138:                "UpperLeg" => "ULeg",
src/visualization.rs:139:                "LowerLeg" => "LLeg",
src/visualization.rs:140:                "Foot" => "Foot",
src/visualization.rs:149:            let seg = if rest.contains("Metacarpal") { ".M" }
src/visualization.rs:158:            s.starts_with("Hand") || s.starts_with("Thumb") || s.starts_with("Index")
src/visualization.rs:200:                    || lower.contains("thumb") || lower.contains("metacarpal")
src/visualization.rs:259:                || s.contains("Chest")
src/visualization.rs:260:                || s.contains("Spine") =>
src/visualization.rs:266:                || s.contains("Neck")
src/visualization.rs:267:                || s.contains("Head") =>
src/visualization.rs:301:    // --- Hand direction gizmos (mode 1=all, 3=hand only) ---
src/visualization.rs:307:            ("leftHand", "leftMiddleProximal", "leftLowerArm", "L", Color::srgb(0.0, 1.0, 1.0)),
src/visualization.rs:308:            ("rightHand", "rightMiddleProximal", "rightLowerArm", "R", Color::srgb(1.0, 0.0, 1.0)),
src/visualization.rs:498:        if name.contains("Metacarpal") || name.contains("metacarpal") { -16.0 }
src/resource.rs:22:    /// Foot bone → mesh bottom distance (left, right)
src/resource.rs:126:    pub arp_vrm_rest_align_adapter: bool,
src/resource.rs:136:            arp_vrm_rest_align_adapter: true,
crates/humanoid_retarget/src/quality/rubric_c.rs:53:    ("UpperLeg", 150.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:54:    ("LowerLeg", 150.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:55:    ("UpperArm", 180.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:56:    ("LowerArm", 145.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:57:    ("Hand", 80.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:58:    ("Spine", 45.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:59:    ("Chest", 45.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:60:    ("Neck", 60.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:61:    ("Head", 60.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:65:const FOOT_BONES: &[&str] = &["leftFoot", "rightFoot"];
crates/humanoid_retarget/src/quality/rubric_c.rs:69:    (&["hand.l", "c_hand.l"], "leftHand"),
crates/humanoid_retarget/src/quality/rubric_c.rs:70:    (&["hand.r", "c_hand.r"], "rightHand"),
crates/humanoid_retarget/src/quality/rubric_c.rs:71:    (&["foot.l", "c_foot.l"], "leftFoot"),
crates/humanoid_retarget/src/quality/rubric_c.rs:72:    (&["foot.r", "c_foot.r"], "rightFoot"),
crates/humanoid_retarget/src/quality/rubric_c.rs:179:    ("chest", "leftShoulder", "leftUpperArm", 60.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:180:    ("chest", "rightShoulder", "rightUpperArm", 60.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:181:    ("leftShoulder", "leftUpperArm", "leftLowerArm", 180.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:182:    ("rightShoulder", "rightUpperArm", "rightLowerArm", 180.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:183:    ("leftUpperArm", "leftLowerArm", "leftHand", 160.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:184:    ("rightUpperArm", "rightLowerArm", "rightHand", 160.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:185:    ("hips", "leftUpperLeg", "leftLowerLeg", 150.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:186:    ("hips", "rightUpperLeg", "rightLowerLeg", 150.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:187:    ("leftUpperLeg", "leftLowerLeg", "leftFoot", 150.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:188:    ("rightUpperLeg", "rightLowerLeg", "rightFoot", 150.0),
crates/humanoid_retarget/src/quality/rubric_c.rs:403:        let offset = if foot == "leftFoot" { sole_l } else { sole_r };
crates/humanoid_retarget/src/quality/rubric_c.rs:638:// An earlier attempt divided the raw ratio by `vrm_hips / src_hips` to
crates/humanoid_retarget/src/quality/validate.rs:209:        "leftUpperArm", "leftLowerArm",
crates/humanoid_retarget/src/quality/validate.rs:210:        "rightUpperArm", "rightLowerArm",
crates/humanoid_retarget/src/quality/validate.rs:211:        "leftUpperLeg", "leftLowerLeg",
crates/humanoid_retarget/src/quality/validate.rs:212:        "rightUpperLeg", "rightLowerLeg",
crates/humanoid_retarget/src/quality/validate.rs:213:        "leftFoot", "rightFoot",
crates/humanoid_retarget/src/quality/validate.rs:291:    let (axis_map, stage3_log) = crate::adapters::arp_vrm::stage3_build_adapter_config(
crates/humanoid_retarget/src/quality/validate.rs:297:    let (overrides, stage4_log) = crate::adapters::arp_vrm::stage4_sync_rest_to_fbx(
crates/humanoid_retarget/src/quality/rubric_a.rs:266:// ─── A1.3 Foot Ground Contact ─────────────────────────────────────────────────
crates/humanoid_retarget/src/quality/rubric_a.rs:285:            name: "A1.3_FootContact".to_string(),
crates/humanoid_retarget/src/quality/rubric_a.rs:295:            name: "A1.3_FootContact".to_string(),
crates/humanoid_retarget/src/quality/rubric_a.rs:346:            name: "A1.3_FootContact".to_string(),
crates/humanoid_retarget/src/quality/rubric_a.rs:361:        name: "A1.3_FootContact".to_string(),
crates/humanoid_retarget/src/quality/rubric_a.rs:521:    // Foot contact requires skeleton computation — skip gracefully on failure
crates/humanoid_retarget/src/quality/score.rs:28:/// Bones included in FK propagation (includes root + upperChest for correct chain).
crates/humanoid_retarget/src/quality/score.rs:31:    "hips", "spine", "chest", "upperChest", "neck", "head",
crates/humanoid_retarget/src/quality/score.rs:32:    "leftShoulder", "leftUpperArm", "leftLowerArm", "leftHand",
crates/humanoid_retarget/src/quality/score.rs:33:    "rightShoulder", "rightUpperArm", "rightLowerArm", "rightHand",
crates/humanoid_retarget/src/quality/score.rs:34:    "leftUpperLeg", "leftLowerLeg", "leftFoot",
crates/humanoid_retarget/src/quality/score.rs:35:    "rightUpperLeg", "rightLowerLeg", "rightFoot",
crates/humanoid_retarget/src/quality/score.rs:41:    "leftShoulder", "leftUpperArm", "leftLowerArm", "leftHand",
crates/humanoid_retarget/src/quality/score.rs:42:    "rightShoulder", "rightUpperArm", "rightLowerArm", "rightHand",
crates/humanoid_retarget/src/quality/score.rs:43:    "leftUpperLeg", "leftLowerLeg", "leftFoot",
crates/humanoid_retarget/src/quality/score.rs:44:    "rightUpperLeg", "rightLowerLeg", "rightFoot",
crates/humanoid_retarget/src/quality/score.rs:49:    ("leftShoulder", "leftUpperArm"), ("leftUpperArm", "leftLowerArm"), ("leftLowerArm", "leftHand"),
crates/humanoid_retarget/src/quality/score.rs:50:    ("rightShoulder", "rightUpperArm"), ("rightUpperArm", "rightLowerArm"), ("rightLowerArm", "rightHand"),
crates/humanoid_retarget/src/quality/score.rs:51:    ("leftUpperLeg", "leftLowerLeg"), ("leftLowerLeg", "leftFoot"),
crates/humanoid_retarget/src/quality/score.rs:52:    ("rightUpperLeg", "rightLowerLeg"), ("rightLowerLeg", "rightFoot"),
crates/humanoid_retarget/tests/finger_rest_align.rs:22:        arp_axis_local: Vec3::new(-1.0, 0.0, 0.0),
crates/humanoid_retarget/tests/finger_rest_align.rs:24:        arp_baseline_curl_rad: baseline_deg.to_radians(),
crates/humanoid_retarget/tests/finger_rest_align.rs:49:    rest_local.insert("leftHand".to_string(), Quat::IDENTITY);
crates/humanoid_retarget/tests/finger_rest_align.rs:56:    rest_global.insert("leftHand".to_string(), Quat::IDENTITY);
crates/humanoid_retarget/tests/finger_rest_align.rs:62:    parent_map.insert("leftIndexProximal".to_string(), "leftHand".to_string());
crates/humanoid_retarget/tests/finger_rest_align.rs:147:    // Hand should be unchanged
crates/humanoid_retarget/tests/finger_rest_align.rs:148:    assert_eq!(rest_local["leftHand"], Quat::IDENTITY);
crates/humanoid_retarget/tests/finger_rest_align.rs:161:    rest_local.insert("rightHand".to_string(), Quat::IDENTITY);
crates/humanoid_retarget/tests/finger_rest_align.rs:166:    parent_map.insert("rightIndexProximal".to_string(), "rightHand".to_string());
crates/humanoid_retarget/src/quality/mod.rs:272:            "leftUpperArm" => "lUA".into(),
crates/humanoid_retarget/src/quality/mod.rs:273:            "rightUpperArm" => "rUA".into(),
crates/humanoid_retarget/src/quality/mod.rs:274:            "leftLowerArm" => "lLA".into(),
crates/humanoid_retarget/src/quality/mod.rs:275:            "rightLowerArm" => "rLA".into(),
crates/humanoid_retarget/src/quality/mod.rs:276:            "leftUpperLeg" => "lUL".into(),
crates/humanoid_retarget/src/quality/mod.rs:277:            "rightUpperLeg" => "rUL".into(),
crates/humanoid_retarget/src/quality/mod.rs:278:            "leftLowerLeg" => "lLL".into(),
crates/humanoid_retarget/src/quality/mod.rs:279:            "rightLowerLeg" => "rLL".into(),
crates/humanoid_retarget/src/quality/mod.rs:280:            "leftHand" => "lH".into(),
crates/humanoid_retarget/src/quality/mod.rs:281:            "rightHand" => "rH".into(),
crates/humanoid_retarget/src/quality/mod.rs:282:            "leftFoot" => "lF".into(),
crates/humanoid_retarget/src/quality/mod.rs:283:            "rightFoot" => "rF".into(),
crates/humanoid_retarget/src/quality/mod.rs:284:            "leftShoulder" => "lSh".into(),
crates/humanoid_retarget/src/quality/mod.rs:285:            "rightShoulder" => "rSh".into(),
crates/humanoid_retarget/src/types.rs:6:pub struct FootContactData {
crates/humanoid_retarget/src/types.rs:9:    pub left: FootSideContact,
crates/humanoid_retarget/src/types.rs:11:    pub right: FootSideContact,
crates/humanoid_retarget/src/types.rs:15:pub struct FootSideContact {
crates/humanoid_retarget/src/types.rs:53:    pub foot_contact: Option<FootContactData>,
crates/humanoid_retarget/src/quality/rubric_b.rs:21:    "hips", "spine", "chest", "upperChest", "neck", "head",
crates/humanoid_retarget/src/quality/rubric_b.rs:23:    "leftShoulder", "rightShoulder",
crates/humanoid_retarget/src/quality/rubric_b.rs:24:    "leftUpperArm", "rightUpperArm",
crates/humanoid_retarget/src/quality/rubric_b.rs:25:    "leftLowerArm", "rightLowerArm",
crates/humanoid_retarget/src/quality/rubric_b.rs:26:    "leftHand", "rightHand",
crates/humanoid_retarget/src/quality/rubric_b.rs:27:    "leftUpperLeg", "rightUpperLeg",
crates/humanoid_retarget/src/quality/rubric_b.rs:28:    "leftLowerLeg", "rightLowerLeg",
crates/humanoid_retarget/src/quality/rubric_b.rs:29:    "leftFoot", "rightFoot",
crates/humanoid_retarget/src/quality/rubric_b.rs:31:    "leftThumbMetacarpal", "leftThumbProximal", "leftThumbDistal",
crates/humanoid_retarget/src/quality/rubric_b.rs:36:    "rightThumbMetacarpal", "rightThumbProximal", "rightThumbDistal",
crates/humanoid_retarget/src/quality/rubric_b.rs:46:    "leftUpperArm", "leftLowerArm",
crates/humanoid_retarget/src/quality/rubric_b.rs:47:    "rightUpperArm", "rightLowerArm",
crates/humanoid_retarget/src/quality/rubric_b.rs:48:    "leftUpperLeg", "leftLowerLeg",
crates/humanoid_retarget/src/quality/rubric_b.rs:49:    "rightUpperLeg", "rightLowerLeg",
crates/humanoid_retarget/src/quality/rubric_b.rs:50:    "leftFoot", "rightFoot",
crates/humanoid_retarget/src/quality/rubric_b.rs:149:    // `t["leftLowerArm"]` — the elbow's position in upper arm space.
crates/humanoid_retarget/src/quality/rubric_b.rs:154:    let upper_arm_len = limb_len("leftLowerArm");
crates/humanoid_retarget/src/quality/rubric_b.rs:155:    let lower_arm_len = limb_len("leftHand");
crates/humanoid_retarget/src/quality/rubric_b.rs:156:    let upper_leg_len = limb_len("leftLowerLeg");
crates/humanoid_retarget/src/quality/rubric_b.rs:157:    let lower_leg_len = limb_len("leftFoot");
crates/humanoid_retarget/src/quality/rubric_b.rs:180:        w.get("leftHand"), w.get("rightHand"), w.get("head"),
crates/humanoid_retarget/src/quality/rubric_b.rs:248:        let upper_arm_key = format!("{}UpperArm", capitalize(side));
crates/humanoid_retarget/src/quality/rubric_b.rs:249:        let lower_leg_key = format!("{}LowerLeg", capitalize(side));
crates/humanoid_retarget/src/quality/rubric_b.rs:312:// ─── B1.4 Foot Sole Offset ────────────────────────────────────────────────────
crates/humanoid_retarget/tests/metric_fixtures.rs:199:    ("shoulder.l", "leftShoulder"),
crates/humanoid_retarget/tests/metric_fixtures.rs:200:    ("shoulder.r", "rightShoulder"),
crates/humanoid_retarget/tests/metric_fixtures.rs:201:    ("arm.l", "leftUpperArm"),
crates/humanoid_retarget/tests/metric_fixtures.rs:202:    ("arm.r", "rightUpperArm"),
crates/humanoid_retarget/tests/metric_fixtures.rs:203:    ("forearm.l", "leftLowerArm"),
crates/humanoid_retarget/tests/metric_fixtures.rs:204:    ("forearm.r", "rightLowerArm"),
crates/humanoid_retarget/tests/metric_fixtures.rs:205:    ("hand.l", "leftHand"),
crates/humanoid_retarget/tests/metric_fixtures.rs:206:    ("hand.r", "rightHand"),
crates/humanoid_retarget/tests/metric_fixtures.rs:207:    ("thigh.l", "leftUpperLeg"),
crates/humanoid_retarget/tests/metric_fixtures.rs:208:    ("thigh.r", "rightUpperLeg"),
crates/humanoid_retarget/tests/metric_fixtures.rs:209:    ("leg.l", "leftLowerLeg"),
crates/humanoid_retarget/tests/metric_fixtures.rs:210:    ("leg.r", "rightLowerLeg"),
crates/humanoid_retarget/tests/metric_fixtures.rs:211:    ("foot.l", "leftFoot"),
crates/humanoid_retarget/tests/metric_fixtures.rs:212:    ("foot.r", "rightFoot"),
crates/humanoid_retarget/tests/metric_fixtures.rs:226:    m.insert("leftShoulder", Vec3::new(0.1, 1.4, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:227:    m.insert("rightShoulder", Vec3::new(-0.1, 1.4, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:228:    m.insert("leftUpperArm", Vec3::new(0.2, 1.4, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:229:    m.insert("rightUpperArm", Vec3::new(-0.2, 1.4, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:230:    m.insert("leftLowerArm", Vec3::new(0.45, 1.4, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:231:    m.insert("rightLowerArm", Vec3::new(-0.45, 1.4, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:232:    m.insert("leftHand", Vec3::new(0.65, 1.4, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:233:    m.insert("rightHand", Vec3::new(-0.65, 1.4, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:234:    m.insert("leftUpperLeg", Vec3::new(0.1, 0.9, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:235:    m.insert("rightUpperLeg", Vec3::new(-0.1, 0.9, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:236:    m.insert("leftLowerLeg", Vec3::new(0.1, 0.5, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:237:    m.insert("rightLowerLeg", Vec3::new(-0.1, 0.5, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:238:    m.insert("leftFoot", Vec3::new(0.1, 0.05, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:239:    m.insert("rightFoot", Vec3::new(-0.1, 0.05, 0.0));
crates/humanoid_retarget/tests/metric_fixtures.rs:261:    for (_arp, vrm) in ARP_TO_VRM {
crates/humanoid_retarget/tests/metric_fixtures.rs:276:        ("leftShoulder", "chest"),
crates/humanoid_retarget/tests/metric_fixtures.rs:277:        ("rightShoulder", "chest"),
crates/humanoid_retarget/tests/metric_fixtures.rs:278:        ("leftUpperArm", "leftShoulder"),
crates/humanoid_retarget/tests/metric_fixtures.rs:279:        ("rightUpperArm", "rightShoulder"),
crates/humanoid_retarget/tests/metric_fixtures.rs:280:        ("leftLowerArm", "leftUpperArm"),
crates/humanoid_retarget/tests/metric_fixtures.rs:281:        ("rightLowerArm", "rightUpperArm"),
crates/humanoid_retarget/tests/metric_fixtures.rs:282:        ("leftHand", "leftLowerArm"),
crates/humanoid_retarget/tests/metric_fixtures.rs:283:        ("rightHand", "rightLowerArm"),
crates/humanoid_retarget/tests/metric_fixtures.rs:284:        ("leftUpperLeg", "hips"),
crates/humanoid_retarget/tests/metric_fixtures.rs:285:        ("rightUpperLeg", "hips"),
crates/humanoid_retarget/tests/metric_fixtures.rs:286:        ("leftLowerLeg", "leftUpperLeg"),
crates/humanoid_retarget/tests/metric_fixtures.rs:287:        ("rightLowerLeg", "rightUpperLeg"),
crates/humanoid_retarget/tests/metric_fixtures.rs:288:        ("leftFoot", "leftLowerLeg"),
crates/humanoid_retarget/tests/metric_fixtures.rs:289:        ("rightFoot", "rightLowerLeg"),
crates/humanoid_retarget/tests/metric_fixtures.rs:347:        .map(|(arp, vrm)| ((*arp).to_string(), (*vrm).to_string()))
crates/humanoid_retarget/tests/metric_fixtures.rs:387:    for (arp, vrm) in ARP_TO_VRM {
crates/humanoid_retarget/tests/metric_fixtures.rs:388:        if let Some(track) = fbx.tracks.get(*arp) {
crates/humanoid_retarget/tests/metric_fixtures.rs:391:        vrm_to_fbx_name.insert((*vrm).to_string(), (*arp).to_string());
crates/humanoid_retarget/tests/metric_fixtures.rs:425:    // leftUpperArm reaches only 87°, well under the 180° UpperArm limit.
crates/humanoid_retarget/tests/metric_fixtures.rs:478:    // Arm 87° + Leg 58° — well under joint limits.
crates/humanoid_retarget/tests/metric_fixtures.rs:590:/// src_hips` produced a raw ratio < 1 purely from scale. This test

codex
분석 전략은 거의 정해졌습니다. 기존 `src/bin/analyze_fbx.rs`는 단일 파일용 진단이라 11개 일괄 요약에는 부족하고, 필요한 ARP 명칭 셋은 저장소 내부 테스트/품질 코드에서 이미 표준화되어 있습니다. 이제 그 매핑을 그대로 가져와서 임시 요약 bin 하나로 끝내겠습니다.
exec
/bin/zsh -lc "sed -n '180,260p' crates/humanoid_retarget/tests/metric_fixtures.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
exec
/bin/zsh -lc "sed -n '1,220p' crates/humanoid_retarget/Cargo.toml" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
[package]
name = "humanoid_retarget"
version = "0.1.0"
edition = "2024"

[dependencies]
fbx_rig = { path = "../fbx_rig" }
vrm0_compat = { path = "../vrm0_compat" }
glam = "0.30"
gltf = "1"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"

[[bin]]
name = "retarget-test"
path = "src/bin/retarget_test.rs"

[[bin]]
name = "pop-scan"
path = "src/bin/pop_scan.rs"

[[bin]]
name = "validate-pipeline"
path = "src/bin/validate_pipeline.rs"

 succeeded in 0ms:
}

// ═════════════════════════════════════════════════════════════════════════════
// Rubric C plumbing
// ═════════════════════════════════════════════════════════════════════════════
//
// Rubric C reads per-frame VRM bone positions + rotations. We build
// those directly from each FBX fixture by renaming ARP-style bones to
// VRM-humanoid bones and computing a trivial forward kinematic chain
// that leaves every joint at its rest position (bone_positions static)
// but faithfully propagates the fixture's per-frame local rotations.
// fidelity is skipped (src_fk = None).

const ARP_TO_VRM: &[(&str, &str)] = &[
    ("root.x", "hips"),
    ("spine.x", "spine"),
    ("chest.x", "chest"),
    ("neck.x", "neck"),
    ("head.x", "head"),
    ("shoulder.l", "leftShoulder"),
    ("shoulder.r", "rightShoulder"),
    ("arm.l", "leftUpperArm"),
    ("arm.r", "rightUpperArm"),
    ("forearm.l", "leftLowerArm"),
    ("forearm.r", "rightLowerArm"),
    ("hand.l", "leftHand"),
    ("hand.r", "rightHand"),
    ("thigh.l", "leftUpperLeg"),
    ("thigh.r", "rightUpperLeg"),
    ("leg.l", "leftLowerLeg"),
    ("leg.r", "rightLowerLeg"),
    ("foot.l", "leftFoot"),
    ("foot.r", "rightFoot"),
];

/// Static VRM rest positions (world-space, y-up meters). The actual
/// numeric values don't matter to stability / joint_limit — only ground
/// contact reads them, and it only cares about foot.y which we peg
/// slightly above zero. All positions are constant across frames.
fn vrm_rest_positions() -> HashMap<&'static str, Vec3> {
    let mut m = HashMap::new();
    m.insert("hips", Vec3::new(0.0, 0.9, 0.0));
    m.insert("spine", Vec3::new(0.0, 1.0, 0.0));
    m.insert("chest", Vec3::new(0.0, 1.1, 0.0));
    m.insert("neck", Vec3::new(0.0, 1.45, 0.0));
    m.insert("head", Vec3::new(0.0, 1.6, 0.0));
    m.insert("leftShoulder", Vec3::new(0.1, 1.4, 0.0));
    m.insert("rightShoulder", Vec3::new(-0.1, 1.4, 0.0));
    m.insert("leftUpperArm", Vec3::new(0.2, 1.4, 0.0));
    m.insert("rightUpperArm", Vec3::new(-0.2, 1.4, 0.0));
    m.insert("leftLowerArm", Vec3::new(0.45, 1.4, 0.0));
    m.insert("rightLowerArm", Vec3::new(-0.45, 1.4, 0.0));
    m.insert("leftHand", Vec3::new(0.65, 1.4, 0.0));
    m.insert("rightHand", Vec3::new(-0.65, 1.4, 0.0));
    m.insert("leftUpperLeg", Vec3::new(0.1, 0.9, 0.0));
    m.insert("rightUpperLeg", Vec3::new(-0.1, 0.9, 0.0));
    m.insert("leftLowerLeg", Vec3::new(0.1, 0.5, 0.0));
    m.insert("rightLowerLeg", Vec3::new(-0.1, 0.5, 0.0));
    m.insert("leftFoot", Vec3::new(0.1, 0.05, 0.0));
    m.insert("rightFoot", Vec3::new(-0.1, 0.05, 0.0));
    m
}

struct CInputs {
    vrm_fk: VrmSkeletonFrames,
    result: TargetAnimation,
    vrm_rest: VrmRestPose,
}

/// Build the VRM-side `VrmRestPose` used by rubric C. This is test
/// harness scaffolding: it describes rubric B's "validated target rest"
/// for these synthetic fixtures. Independent of whatever retargeter we
/// plug in via the `Retargeter` trait.
fn build_vrm_rest_for_fixtures() -> VrmRestPose {
    let rests = vrm_rest_positions();
    let mut bone_rest_local: HashMap<String, Quat> = HashMap::new();
    let mut bone_rest_global: HashMap<String, Quat> = HashMap::new();
    let mut bone_rest_translation: HashMap<String, Vec3> = HashMap::new();
    let mut bone_world_position: HashMap<String, Vec3> = HashMap::new();
    let mut virtual_rest_global: HashMap<String, Quat> = HashMap::new();


exec
/bin/zsh -lc "sed -n '1,220p' crates/humanoid_retarget/src/lib.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
pub mod adapters;
pub mod config;
pub mod finger_axis_map;
pub mod finger_rest_align;
pub mod mapping;
pub mod orchestrate;
pub mod postprocess;
pub mod quality;
pub mod retargeter;
pub mod source_anim;
pub mod topo;
pub mod types;
pub use vrm0_compat;
pub mod vrm_compat;
pub mod vrm_rest;

/// Re-export the `fbx_rig` crate under the historical `fbx` module name
/// so existing call sites (`humanoid_retarget::fbx::parse`, etc.) keep
/// working without churn. New code should prefer `fbx_rig` directly.
pub use fbx_rig as fbx;

pub use glam;
pub use config::FbxSourceType;
pub use fbx_rig::{compute_fbx_skeleton, compute_fbx_skeleton_from_parsed};
pub use quality::{RetargetQuality, RetargetScore, BoneScore, RqDiagnostic, RqGrade, score_retarget, FingerRestScore, FingerBoneScore, score_fingers};
pub use retargeter::{ArpRetargeterInner, IdentityRetargeter, RetargeterOptions};
pub use source_anim::{SourceAnimBody, SourceAnimFacial, SourceFormat};
pub use types::{
    BoneTrack, ExpressionTrack, FbxDiagnostics, FbxSkeletonFrames, TargetAnimation,
    MappedAnimation, RetargetedBone, VrmRestPose, swing_twist_decompose,
};

use thiserror::Error;

use config::RetargetConfig;
use vrm_compat::VrmVersion;

#[derive(Error, Debug)]
pub enum RetargetError {
    #[error("FBX parse error: {0}")]
    FbxParse(String),
    #[error("config error: {0}")]
    Config(String),
    #[error("mapping error: {0}")]
    Mapping(String),
}

impl From<serde_json::Error> for RetargetError {
    fn from(e: serde_json::Error) -> Self {
        RetargetError::Config(e.to_string())
    }
}

impl From<fbx_rig::Error> for RetargetError {
    fn from(e: fbx_rig::Error) -> Self {
        RetargetError::FbxParse(e.to_string())
    }
}

/// Parse FBX once, retarget, and compute skeleton visualization in a single pass.
pub fn retarget_with_skeleton(
    fbx_data: &[u8],
    config_json: &str,
    vrm_version: VrmVersion,
) -> Result<(MappedAnimation, FbxDiagnostics, FbxSkeletonFrames), RetargetError> {
    let config = RetargetConfig::from_json(config_json)?;
    let fbx = fbx::parse(fbx_data)?;

    let source_resolved = resolve_source_type(&config, &fbx);

    // Skip heavy skeleton computation if no real bone animation (facial-only FBX)
    let has_bone_animation = fbx.tracks.values().any(|t| t.rotations.len() > 1);
    let skeleton = if has_bone_animation {
        fbx::compute_fbx_skeleton_from_parsed(&fbx)?
    } else {
        FbxSkeletonFrames {
            frame_count: fbx.frame_count,
            duration: fbx.duration,
            bone_positions: std::collections::HashMap::new(),
            bone_rotations: std::collections::HashMap::new(),
            hierarchy: std::collections::HashMap::new(),
        }
    };

    let mut all_bones: Vec<String> = fbx.bones.keys().cloned().collect();
    all_bones.sort();
    let mut animated_bones: Vec<String> = fbx.tracks.keys().cloned().collect();
    animated_bones.sort();

    let version_key = vrm_version.config_key();
    let mut matched_direct = Vec::new();
    let mut unmatched_config = Vec::new();

    for (src, _vrm_default) in &config.direct_map {
        let vrm = config
            .resolve_vrm_bone(src, version_key)
            .unwrap_or_else(|| _vrm_default.clone());
        let found = fbx.tracks.contains_key(src)
            || config
                .source_prefix
                .iter()
                .any(|p| fbx.tracks.contains_key(&format!("{}{}", p, src)));
        if found {
            matched_direct.push((src.clone(), vrm));
        } else {
            unmatched_config.push(src.clone());
        }
    }

    let mut blend_shape_channels: Vec<String> = fbx.blend_shape_tracks.keys().cloned().collect();
    blend_shape_channels.sort();

    let diag = FbxDiagnostics {
        all_bones,
        animated_bones,
        matched_direct,
        unmatched_config,
        blend_shape_channels,
        source_detected: fbx.detected_source_type,
        source_resolved,
        creator: fbx.creator.clone(),
    };

    let anim = mapping::retarget(&fbx, &config, vrm_version)?;
    Ok((anim, diag, skeleton))
}

pub fn retarget(
    fbx_data: &[u8],
    config_json: &str,
    vrm_version: VrmVersion,
) -> Result<(MappedAnimation, FbxDiagnostics), RetargetError> {
    let (anim, diag, _skeleton) = retarget_with_skeleton(fbx_data, config_json, vrm_version)?;
    Ok((anim, diag))
}

fn resolve_source_type(
    config: &RetargetConfig,
    fbx: &fbx::SourceAsset,
) -> config::FbxSourceType {
    if config.source_type == config::FbxSourceType::Auto {
        fbx.detected_source_type
    } else {
        config.source_type
    }
}

codex
편집은 `humanoid_retarget` 쪽에 임시 summary bin 하나를 추가하는 방식으로 하겠습니다. 이 bin이 11개 파일을 일괄 파싱해서 본 누락, frame 0 대비 rest 차이, 기본 jitter/음수 프레임 징후를 한 번에 뽑도록 만들고, 이후 실행 결과를 표로 정리하겠습니다.
FBX 일괄 분석용 임시 bin을 추가하고 실행 결과를 기준으로 분류/요약을 작성합니다.
  ✓ `fbx_rig` API와 기존 bin을 바탕으로 분석 전략 확정
  → 일괄 분석용 scratch bin 추가
  • bin 빌드 및 11개 FBX 실행
  • 결과를 분류/요약 표로 정리
apply patch
patch: completed
/Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget/Cargo.toml
/Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0074199c7a171ba165a75972bf18b32e3744840b
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,415 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine.x", "spine"]),
+    ("Chest", &["chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+    let retarget_risk = retarget_risks(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 2 || rest_critical >= 3 || negative_start_frame.is_some() {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0074199c7a171ba165a75972bf18b32e3744840b
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,415 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine.x", "spine"]),
+    ("Chest", &["chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+    let retarget_risk = retarget_risks(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 2 || rest_critical >= 3 || negative_start_frame.is_some() {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

codex
임시 bin을 추가했습니다. 이제 빌드 1회를 시도하고, 실패하면 바로 컴파일 오류만 수정한 뒤 2회차까지만 쓰겠습니다.
exec
/bin/zsh -lc 'cargo run -p humanoid_retarget --bin fbx-summary-scratch -- ../../assets/fbx' in /Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0074199c7a171ba165a75972bf18b32e3744840b
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,415 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine.x", "spine"]),
+    ("Chest", &["chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+    let retarget_risk = retarget_risks(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 2 || rest_critical >= 3 || negative_start_frame.is_some() {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0074199c7a171ba165a75972bf18b32e3744840b
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,415 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine.x", "spine"]),
+    ("Chest", &["chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+    let retarget_risk = retarget_risks(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 2 || rest_critical >= 3 || negative_start_frame.is_some() {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

 succeeded in 6432ms:
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.78s
     Running `target/debug/fbx-summary-scratch ../../assets/fbx`
# FBX Summary Scratch
dir: ../../assets/fbx
files: 11
---
FILE: 17857_M_AIStndWide_241204.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 226
FPS: 30.00
DURATION: 7.500
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
---
FILE: 18271_F_AIDepressedID_000000.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 712
FPS: 30.00
DURATION: 23.700
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
---
FILE: 18360_F_AIGracefulArmsSR_000000.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 1064
FPS: 30.00
DURATION: 35.433
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
---
FILE: 18479_F_AILimpRightFR_000000.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 2518
FPS: 30.00
DURATION: 83.900
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: leg_stretch.r 23.6°, foot.l 14.4°, thigh_stretch.r 12.4°
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg | jitter 후보: leg_stretch.r 23.6°, foot.l 14.4°, thigh_stretch.r 12.4°
---
FILE: 19586_M_AISupermanSW_000000.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 2341
FPS: 30.00
DURATION: 78.000
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: foot.r 16.4°, foot.l 15.1°
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg | jitter 후보: foot.r 16.4°, foot.l 15.1°
---
FILE: 21092_M_AiStndGangLegWideElbowBackFirmFace_241226.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 419
FPS: 30.00
DURATION: 13.933
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
---
FILE: 21353_F_AiHappy03C_241010.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 1764
FPS: 30.00
DURATION: 58.767
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
---
FILE: 21566_M_AiFigureEightRun_250108.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 787
FPS: 30.00
DURATION: 26.200
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: foot.r 22.1°, forearm_stretch.r 13.6°
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg | jitter 후보: foot.r 22.1°, forearm_stretch.r 13.6°
---
FILE: 25_04206_F_AIStndMoveLocalFront25cm0to135_250808.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 634
FPS: 30.00
DURATION: 21.100
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
---
FILE: 25_04604_M_AIStndMoveLocalFront75cm0to315_250822.fbx
STATUS: OK
SEVERITY: 위험
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 959
FPS: 30.00
DURATION: 31.933
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 표준 본 누락: Spine, Chest, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L UpLeg, R UpLeg, L Leg, R Leg
---
FILE: FC_00078_F_SuddenFlutter_Anime.fbx
STATUS: OK
SEVERITY: 위험
BONES: 114
ROOTS: BlendShape_g, DHIbody:root
FRAMES: 201
FPS: 30.00
DURATION: 6.667
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Hips, Spine, Chest, Neck, Head, L Shoulder, R Shoulder, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L Hand, R Hand, L UpLeg, R UpLeg, L Leg, R Leg, L Foot, R Foot
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: FBX SDK/FBX Plugins version 2020.2.3
SOURCE_TYPE: Maya
RETARGET_RISK: 표준 본 누락: Hips, Spine, Chest, Neck, Head, L Shoulder, R Shoulder, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L Hand, R Hand, L UpLeg, R UpLeg, L Leg, R Leg, L Foot, R Foot

codex
첫 실행은 성공했지만 표준 본 누락이 과하게 잡혔습니다. 실제로는 본 이름 alias 테이블이 현재 파일들의 ARP 변형을 충분히 커버하지 못한 것이어서, 대표 파일의 실제 본 이름을 확인해 alias를 보정하겠습니다.
exec
/bin/zsh -lc "cargo run --bin analyze-fbx -- assets/fbx/17857_M_AIStndWide_241204.fbx | sed -n '1,120p'" in /Users/deemooooooooo/Desktop/www/bevy-vrm
exec
/bin/zsh -lc "cargo run --bin analyze-fbx -- assets/fbx/FC_00078_F_SuddenFlutter_Anime.fbx | sed -n '1,160p'" in /Users/deemooooooooo/Desktop/www/bevy-vrm
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0074199c7a171ba165a75972bf18b32e3744840b
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,415 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine.x", "spine"]),
+    ("Chest", &["chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+    let retarget_risk = retarget_risks(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 2 || rest_critical >= 3 || negative_start_frame.is_some() {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0074199c7a171ba165a75972bf18b32e3744840b
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,415 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine.x", "spine"]),
+    ("Chest", &["chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+    let retarget_risk = retarget_risks(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 2 || rest_critical >= 3 || negative_start_frame.is_some() {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

 succeeded in 3902ms:
   Compiling fbx_rig v0.1.0 (/Users/deemooooooooo/Desktop/www/bevy-vrm/crates/fbx_rig)
   Compiling humanoid_retarget v0.1.0 (/Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget)
   Compiling bevy-vrm v0.1.0 (/Users/deemooooooooo/Desktop/www/bevy-vrm)
    Finished `dev` profile [optimized + debuginfo] target(s) in 3.54s
     Running `target/debug/analyze-fbx assets/fbx/17857_M_AIStndWide_241204.fbx`
=== FBX Analysis: assets/fbx/17857_M_AIStndWide_241204.fbx ===
Duration: 7.5s, Frames: 226

=== Full Skeleton Hierarchy ===

CAS_BaseModel_RootMotion4_Object079 | PreRot=0.0° LclRest=90.0° trans=(-0.0,-0.0,0.0) 
root | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) ✓anim
  root.x | PreRot=0.0° LclRest=88.7° trans=(0.0,-0.0,0.9) ✓anim
    spine_01.x | PreRot=0.0° LclRest=2.6° trans=(-0.0,0.1,-0.0) ✓anim
      spine_02.x | PreRot=0.0° LclRest=1.8° trans=(-0.0,0.1,-0.0) ✓anim
        spine_03.x | PreRot=0.0° LclRest=2.6° trans=(0.0,0.1,-0.0) ✓anim
          neck.x | PreRot=0.0° LclRest=14.8° trans=(0.0,0.1,0.0) ✓anim
            head.x | PreRot=0.0° LclRest=9.6° trans=(0.0,0.1,-0.0) ✓anim
          shoulder.l | PreRot=0.0° LclRest=115.3° trans=(0.0,0.1,-0.0) ✓anim
            arm_stretch.l | PreRot=0.0° LclRest=82.0° trans=(-0.0,0.1,-0.0) ✓anim
              forearm_stretch.l | PreRot=0.0° LclRest=13.0° trans=(-0.0,0.2,-0.0) ✓anim
                hand.l | PreRot=0.0° LclRest=40.1° trans=(-0.0,0.2,0.0) ✓anim
                  c_index1.l | PreRot=0.0° LclRest=49.7° trans=(0.0,0.1,-0.0) ✓anim
                    c_index2.l | PreRot=0.0° LclRest=51.1° trans=(-0.0,0.0,0.0) ✓anim
                      c_index3.l | PreRot=0.0° LclRest=43.1° trans=(-0.0,0.0,-0.0) ✓anim
                  c_middle1.l | PreRot=0.0° LclRest=78.3° trans=(0.0,0.1,-0.0) ✓anim
                    c_middle2.l | PreRot=0.0° LclRest=101.1° trans=(-0.0,0.0,0.0) ✓anim
                      c_middle3.l | PreRot=0.0° LclRest=73.1° trans=(-0.0,0.0,-0.0) ✓anim
                  c_pinky1.l | PreRot=0.0° LclRest=79.4° trans=(-0.0,0.1,-0.0) ✓anim
                    c_pinky2.l | PreRot=0.0° LclRest=105.1° trans=(0.0,0.0,-0.0) ✓anim
                      c_pinky3.l | PreRot=0.0° LclRest=86.4° trans=(-0.0,0.0,0.0) ✓anim
                  c_ring1.l | PreRot=0.0° LclRest=81.5° trans=(-0.0,0.1,0.0) ✓anim
                    c_ring2.l | PreRot=0.0° LclRest=102.1° trans=(-0.0,0.0,0.0) ✓anim
                      c_ring3.l | PreRot=0.0° LclRest=71.4° trans=(-0.0,0.0,-0.0) ✓anim
                  c_thumb1.l | PreRot=0.0° LclRest=91.6° trans=(0.0,0.0,-0.0) ✓anim
                    c_thumb2.l | PreRot=0.0° LclRest=45.0° trans=(0.0,0.0,0.0) ✓anim
                      c_thumb3.l | PreRot=0.0° LclRest=6.0° trans=(0.0,0.0,0.0) ✓anim
          shoulder.r | PreRot=0.0° LclRest=115.3° trans=(-0.0,0.1,-0.0) ✓anim
            arm_stretch.r | PreRot=0.0° LclRest=82.0° trans=(0.0,0.1,0.0) ✓anim
              forearm_stretch.r | PreRot=0.0° LclRest=15.6° trans=(0.0,0.2,0.0) ✓anim
                hand.r | PreRot=0.0° LclRest=34.8° trans=(0.0,0.2,0.0) ✓anim
                  c_index1.r | PreRot=0.0° LclRest=49.7° trans=(-0.0,0.1,-0.0) ✓anim
                    c_index2.r | PreRot=0.0° LclRest=51.1° trans=(0.0,0.0,0.0) ✓anim
                      c_index3.r | PreRot=0.0° LclRest=43.1° trans=(0.0,0.0,0.0) ✓anim
                  c_middle1.r | PreRot=0.0° LclRest=78.3° trans=(0.0,0.1,0.0) ✓anim
                    c_middle2.r | PreRot=0.0° LclRest=101.1° trans=(0.0,0.0,-0.0) ✓anim
                      c_middle3.r | PreRot=0.0° LclRest=73.1° trans=(-0.0,0.0,-0.0) ✓anim
                  c_pinky1.r | PreRot=0.0° LclRest=79.4° trans=(0.0,0.1,-0.0) ✓anim
                    c_pinky2.r | PreRot=0.0° LclRest=105.1° trans=(-0.0,0.0,-0.0) ✓anim
                      c_pinky3.r | PreRot=0.0° LclRest=86.4° trans=(-0.0,0.0,0.0) ✓anim
                  c_ring1.r | PreRot=0.0° LclRest=81.5° trans=(0.0,0.1,0.0) ✓anim
                    c_ring2.r | PreRot=0.0° LclRest=102.1° trans=(0.0,0.0,-0.0) ✓anim
                      c_ring3.r | PreRot=0.0° LclRest=71.4° trans=(0.0,0.0,-0.0) ✓anim
                  c_thumb1.r | PreRot=0.0° LclRest=91.6° trans=(-0.0,0.0,-0.0) ✓anim
                    c_thumb2.r | PreRot=0.0° LclRest=45.0° trans=(0.0,0.0,-0.0) ✓anim
                      c_thumb3.r | PreRot=0.0° LclRest=6.0° trans=(-0.0,0.0,-0.0) ✓anim
    thigh_stretch.l | PreRot=0.0° LclRest=174.2° trans=(0.1,0.0,0.0) ✓anim
      leg_stretch.l | PreRot=0.0° LclRest=21.0° trans=(0.0,0.4,0.0) ✓anim
        foot.l | PreRot=0.0° LclRest=109.5° trans=(-0.0,0.4,-0.0) ✓anim
          toes_01.l | PreRot=0.0° LclRest=180.0° trans=(0.0,0.2,-0.0) ✓anim
    thigh_stretch.r | PreRot=0.0° LclRest=179.0° trans=(-0.1,0.0,0.0) ✓anim
      leg_stretch.r | PreRot=0.0° LclRest=18.6° trans=(-0.0,0.4,0.0) ✓anim
        foot.r | PreRot=0.0° LclRest=111.7° trans=(0.0,0.4,-0.0) ✓anim
          toes_01.r | PreRot=0.0° LclRest=180.0° trans=(-0.0,0.2,0.0) ✓anim


 succeeded in 3902ms:
    Blocking waiting for file lock on artifact directory
    Finished `dev` profile [optimized + debuginfo] target(s) in 3.59s
     Running `target/debug/analyze-fbx assets/fbx/FC_00078_F_SuddenFlutter_Anime.fbx`
=== FBX Analysis: assets/fbx/FC_00078_F_SuddenFlutter_Anime.fbx ===
Duration: 6.7s, Frames: 201

=== Full Skeleton Hierarchy ===

BlendShape_g | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  F_002 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_002_tooth | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  F_002_Mouth_LR | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
    tooth1 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  F_003 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_003_L_Eyelash | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
    F_003_R_Eyelash | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  F_004 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_004_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_005 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_005_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_006 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_006_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
      F_006_Mouth_tongue | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
      F_006_Mouth_toothDown | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
      F_006_Mouth_toothUp | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  F_007 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_007_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_008 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_009 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_009_Line | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
    F_009_Mouth | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
    F_009_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_010 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_010_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_011 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_012 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_013 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_014 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_014_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_015 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_015_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_016 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_016_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_017 | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_017_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_A | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_A_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_E | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_E_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_I | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_I_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_O | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_O_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  F_U | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
    F_U_tooth | PreRot=0.0° LclRest=90.0° trans=(0.0,0.0,0.0) 
  L_eye_blinkD | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
  L_eye_blinkU | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
  L_eye_g_D | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  L_eye_g_L | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  L_eye_g_R | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  L_eye_g_U | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  L_eye_g_scaledown | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  L_eye_g_scaleup | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  R_eye_g_D | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  R_eye_g_L | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  R_eye_g_R | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  R_eye_g_U | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  R_eye_g_scaledown | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  R_eye_g_scaleup | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  down_eye_L | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  down_lip | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
  group327 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
  group328 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
  group329 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
  group330 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
  lip_down | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
    tooth3 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  lip_scaledown | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
    tooth5 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  lip_scaleup | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
    tooth4 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  lip_up | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
    tooth2 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  tooth6 | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
  toothDown_B | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothDown_D | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothDown_F | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothDown_L | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothDown_R | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothDown_U | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothUp_B | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothUp_D | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothUp_F | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothUp_L | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothUp_R | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  toothUp_U | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  up_eye_L | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) 
  up_lip | PreRot=0.0° LclRest=0.0° trans=(0.0,0.2,21.7) 
DHIbody:root | PreRot=0.0° LclRest=0.0° trans=(0.0,0.0,0.0) ✓anim


diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0074199c7a171ba165a75972bf18b32e3744840b
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,415 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine.x", "spine"]),
+    ("Chest", &["chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+    let retarget_risk = retarget_risks(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 2 || rest_critical >= 3 || negative_start_frame.is_some() {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

codex
대표 샘플을 보니 실제 ARP 계열 이름이 `spine_01.x`, `arm_stretch.l`, `thigh_stretch.r` 같은 변형을 쓰고 있습니다. alias를 이 실제 이름들로 보정한 뒤 다시 돌리면, body FBX와 facial-only FBX가 깔끔하게 분리될 겁니다.
exec
/bin/zsh -lc "sed -n '1,240p' assets/retarget/arp_body.json" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
{
  "name": "arp_body",
  "source_prefix": [],
  "root_bone": "root",
  "direct_map": {
    "root.x": "hips",
    "spine_01.x": "spine",
    "spine_02.x": "chest",
    "neck.x": "neck",
    "head.x": "head",
    "shoulder.l": "leftShoulder",
    "shoulder.r": "rightShoulder",
    "arm_stretch.l": "leftUpperArm",
    "arm_stretch.r": "rightUpperArm",
    "forearm_stretch.l": "leftLowerArm",
    "forearm_stretch.r": "rightLowerArm",
    "hand.l": "leftHand",
    "hand.r": "rightHand",
    "thigh_stretch.l": "leftUpperLeg",
    "thigh_stretch.r": "rightUpperLeg",
    "leg_stretch.l": "leftLowerLeg",
    "leg_stretch.r": "rightLowerLeg",
    "foot.l": "leftFoot",
    "foot.r": "rightFoot",
    "toes_01.l": "leftToes",
    "toes_01.r": "rightToes",
    "c_thumb1.l": "leftThumbMetacarpal",
    "c_thumb1.r": "rightThumbMetacarpal",
    "c_thumb2.l": "leftThumbProximal",
    "c_thumb2.r": "rightThumbProximal",
    "c_thumb3.l": "leftThumbDistal",
    "c_thumb3.r": "rightThumbDistal",
    "c_index1.l": "leftIndexProximal",
    "c_index1.r": "rightIndexProximal",
    "c_index2.l": "leftIndexIntermediate",
    "c_index2.r": "rightIndexIntermediate",
    "c_index3.l": "leftIndexDistal",
    "c_index3.r": "rightIndexDistal",
    "c_middle1.l": "leftMiddleProximal",
    "c_middle1.r": "rightMiddleProximal",
    "c_middle2.l": "leftMiddleIntermediate",
    "c_middle2.r": "rightMiddleIntermediate",
    "c_middle3.l": "leftMiddleDistal",
    "c_middle3.r": "rightMiddleDistal",
    "c_ring1.l": "leftRingProximal",
    "c_ring1.r": "rightRingProximal",
    "c_ring2.l": "leftRingIntermediate",
    "c_ring2.r": "rightRingIntermediate",
    "c_ring3.l": "leftRingDistal",
    "c_ring3.r": "rightRingDistal",
    "c_pinky1.l": "leftLittleProximal",
    "c_pinky1.r": "rightLittleProximal",
    "c_pinky2.l": "leftLittleIntermediate",
    "c_pinky2.r": "rightLittleIntermediate",
    "c_pinky3.l": "leftLittleDistal",
    "c_pinky3.r": "rightLittleDistal"
  },
  "rest_pose_offsets": {},
  "rest_pose_preserve": {},
  "accumulate": {
    "upperChest": ["spine_03.x"]
  },
  "twist_fold": {},
  "ignore_patterns": [],
  "expression_map": {
    "F_A_Mouth": "aa",
    "F_I_Mouth": "ih",
    "F_U_Mouth": "ou",
    "F_E_Mouth": "ee",
    "F_O_Mouth": "oh",
    "F_003_L_Eye_down": "blinkLeft|blink",
    "F_003_R_Eye_down": "blinkRight|blink",
    "L_eye_g_U": "lookUp",
    "L_eye_g_D": "lookDown",
    "L_eye_g_L": "lookLeft",
    "L_eye_g_R": "lookRight"
  },
  "shoulder_slerp_factor": 0.0,
  "source_type": "Blender",
  "rest_sync_rules": [
    ["*Thumb*", "Skip"],
    ["*Index*", "ScalarCurl"],
    ["*Middle*", "ScalarCurl"],
    ["*Ring*", "ScalarCurl"],
    ["*Little*", "ScalarCurl"]
  ],
  "vrm_version_overrides": {
    "0.x": {
      "c_thumb1.l": "leftThumbProximal",
      "c_thumb1.r": "rightThumbProximal",
      "c_thumb2.l": "leftThumbIntermediate",
      "c_thumb2.r": "rightThumbIntermediate"
    },
    "1.0": {
      "c_thumb1.l": "leftThumbMetacarpal",
      "c_thumb1.r": "rightThumbMetacarpal"
    }
  }
}

exec
/bin/zsh -lc "rg -n 'arm_stretch|forearm_stretch|thigh_stretch|leg_stretch|spine_01|spine_02|spine_03' assets/retarget crates/humanoid_retarget src -S" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
crates/humanoid_retarget/tests/fixtures/mod.rs:65:    ("arm_stretch.l", Some("arm.l")),
crates/humanoid_retarget/tests/fixtures/mod.rs:66:    ("arm_stretch.r", Some("arm.r")),
crates/humanoid_retarget/tests/fixtures/mod.rs:67:    ("leg_stretch.l", Some("thigh.l")),
crates/humanoid_retarget/tests/fixtures/mod.rs:68:    ("leg_stretch.r", Some("thigh.r")),
crates/humanoid_retarget/tests/fixtures/mod.rs:284:// ARP IK stretch helpers (`arm_stretch.l/r`, `leg_stretch.l/r`) follow
crates/humanoid_retarget/tests/fixtures/mod.rs:313:    for bone in ["arm_stretch.l", "arm_stretch.r", "leg_stretch.l", "leg_stretch.r"] {
assets/retarget/arp_body.json:7:    "spine_01.x": "spine",
assets/retarget/arp_body.json:8:    "spine_02.x": "chest",
assets/retarget/arp_body.json:13:    "arm_stretch.l": "leftUpperArm",
assets/retarget/arp_body.json:14:    "arm_stretch.r": "rightUpperArm",
assets/retarget/arp_body.json:15:    "forearm_stretch.l": "leftLowerArm",
assets/retarget/arp_body.json:16:    "forearm_stretch.r": "rightLowerArm",
assets/retarget/arp_body.json:19:    "thigh_stretch.l": "leftUpperLeg",
assets/retarget/arp_body.json:20:    "thigh_stretch.r": "rightUpperLeg",
assets/retarget/arp_body.json:21:    "leg_stretch.l": "leftLowerLeg",
assets/retarget/arp_body.json:22:    "leg_stretch.r": "rightLowerLeg",
assets/retarget/arp_body.json:61:    "upperChest": ["spine_03.x"]

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0074199c7a171ba165a75972bf18b32e3744840b
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,415 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine.x", "spine"]),
+    ("Chest", &["chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+    let retarget_risk = retarget_risks(&missing_standard, &rest_vs_frame0, &jitter_bones, negative_start_frame);
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 2 || rest_critical >= 3 || negative_start_frame.is_some() {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

codex
alias는 저장소의 실제 `assets/retarget/arp_body.json` 기준으로 맞추겠습니다. 동시에 분류 기준도 조정해서, 표준 본이 다 있고 rest/frame0 차이도 없으면 `안전`, jitter나 구조적 주의점이 있으면 `주의`, body 체인이 없는 facial-only는 `위험`으로 분리하겠습니다.
apply patch
patch: completed
/Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..60ed4c28de3d306bccb0bb9105b85e1d8c697113
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,440 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1
+        || roots.len() > 1
+    {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..60ed4c28de3d306bccb0bb9105b85e1d8c697113
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,440 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1
+        || roots.len() > 1
+    {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

exec
/bin/zsh -lc 'cargo run -p humanoid_retarget --bin fbx-summary-scratch -- ../../assets/fbx' in /Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..60ed4c28de3d306bccb0bb9105b85e1d8c697113
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,440 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1
+        || roots.len() > 1
+    {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

 succeeded in 5162ms:
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.68s
     Running `target/debug/fbx-summary-scratch ../../assets/fbx`
# FBX Summary Scratch
dir: ../../assets/fbx
files: 11
---
FILE: 17857_M_AIStndWide_241204.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 226
FPS: 30.00
DURATION: 7.500
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 18271_F_AIDepressedID_000000.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 712
FPS: 30.00
DURATION: 23.700
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 18360_F_AIGracefulArmsSR_000000.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 1064
FPS: 30.00
DURATION: 35.433
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 18479_F_AILimpRightFR_000000.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 2518
FPS: 30.00
DURATION: 83.900
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: leg_stretch.r 23.6°, foot.l 14.4°, thigh_stretch.r 12.4°
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root | jitter 후보: leg_stretch.r 23.6°, foot.l 14.4°, thigh_stretch.r 12.4°
---
FILE: 19586_M_AISupermanSW_000000.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 2341
FPS: 30.00
DURATION: 78.000
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: foot.r 16.4°, foot.l 15.1°
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root | jitter 후보: foot.r 16.4°, foot.l 15.1°
---
FILE: 21092_M_AiStndGangLegWideElbowBackFirmFace_241226.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 419
FPS: 30.00
DURATION: 13.933
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 21353_F_AiHappy03C_241010.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 1764
FPS: 30.00
DURATION: 58.767
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 21566_M_AiFigureEightRun_250108.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 787
FPS: 30.00
DURATION: 26.200
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: foot.r 22.1°, forearm_stretch.r 13.6°
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root | jitter 후보: foot.r 22.1°, forearm_stretch.r 13.6°
---
FILE: 25_04206_F_AIStndMoveLocalFront25cm0to135_250808.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 634
FPS: 30.00
DURATION: 21.100
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 25_04604_M_AIStndMoveLocalFront75cm0to315_250822.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 959
FPS: 30.00
DURATION: 31.933
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: FC_00078_F_SuddenFlutter_Anime.fbx
STATUS: OK
SEVERITY: 위험
BONES: 114
ROOTS: BlendShape_g, DHIbody:root
FRAMES: 201
FPS: 30.00
DURATION: 6.667
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Hips, Spine, Chest, Neck, Head, L Shoulder, R Shoulder, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L Hand, R Hand, L UpLeg, R UpLeg, L Leg, R Leg, L Foot, R Foot
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: FBX SDK/FBX Plugins version 2020.2.3
SOURCE_TYPE: Maya
RETARGET_RISK: 다중 루트: BlendShape_g, DHIbody:root | 표준 본 누락: Hips, Spine, Chest, Neck, Head, L Shoulder, R Shoulder, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L Hand, R Hand, L UpLeg, R UpLeg, L Leg, R Leg, L Foot, R Foot

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..60ed4c28de3d306bccb0bb9105b85e1d8c697113
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,440 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1
+        || roots.len() > 1
+    {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

codex
`CAS_BaseModel_RootMotion4_Object079`는 실제 body 체인 바깥의 보조 루트로 보이고, 이것만으로 `주의`를 주는 건 과보수적입니다. 분류는 본체 체인/회전차/jitter 중심으로 바꾸고, 다중 루트는 리스크 메모로만 남기겠습니다.
apply patch
patch: completed
/Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..2de20913df29789a205112ebdce79154a84b2ee3
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,438 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..2de20913df29789a205112ebdce79154a84b2ee3
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,438 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

exec
/bin/zsh -lc 'cargo run -p humanoid_retarget --bin fbx-summary-scratch -- ../../assets/fbx' in /Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..2de20913df29789a205112ebdce79154a84b2ee3
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,438 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..2de20913df29789a205112ebdce79154a84b2ee3
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,438 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

 succeeded in 4572ms:
warning: unused variable: `roots`
   --> src/bin/fbx_summary_scratch.rs:227:5
    |
227 |     roots: &[String],
    |     ^^^^^ help: if this is intentional, prefix it with an underscore: `_roots`
    |
    = note: `#[warn(unused_variables)]` (part of `#[warn(unused)]`) on by default

warning: `humanoid_retarget` (bin "fbx-summary-scratch") generated 1 warning (run `cargo fix --bin "fbx-summary-scratch" -p humanoid_retarget` to apply 1 suggestion)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.27s
     Running `target/debug/fbx-summary-scratch ../../assets/fbx`
# FBX Summary Scratch
dir: ../../assets/fbx
files: 11
---
FILE: 17857_M_AIStndWide_241204.fbx
STATUS: OK
SEVERITY: 안전
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 226
FPS: 30.00
DURATION: 7.500
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 18271_F_AIDepressedID_000000.fbx
STATUS: OK
SEVERITY: 안전
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 712
FPS: 30.00
DURATION: 23.700
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 18360_F_AIGracefulArmsSR_000000.fbx
STATUS: OK
SEVERITY: 안전
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 1064
FPS: 30.00
DURATION: 35.433
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 18479_F_AILimpRightFR_000000.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 2518
FPS: 30.00
DURATION: 83.900
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: leg_stretch.r 23.6°, foot.l 14.4°, thigh_stretch.r 12.4°
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root | jitter 후보: leg_stretch.r 23.6°, foot.l 14.4°, thigh_stretch.r 12.4°
---
FILE: 19586_M_AISupermanSW_000000.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 2341
FPS: 30.00
DURATION: 78.000
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: foot.r 16.4°, foot.l 15.1°
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root | jitter 후보: foot.r 16.4°, foot.l 15.1°
---
FILE: 21092_M_AiStndGangLegWideElbowBackFirmFace_241226.fbx
STATUS: OK
SEVERITY: 안전
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 419
FPS: 30.00
DURATION: 13.933
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 21353_F_AiHappy03C_241010.fbx
STATUS: OK
SEVERITY: 안전
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 1764
FPS: 30.00
DURATION: 58.767
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 21566_M_AiFigureEightRun_250108.fbx
STATUS: OK
SEVERITY: 주의
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 787
FPS: 30.00
DURATION: 26.200
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: foot.r 22.1°, forearm_stretch.r 13.6°
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root | jitter 후보: foot.r 22.1°, forearm_stretch.r 13.6°
---
FILE: 25_04206_F_AIStndMoveLocalFront25cm0to135_250808.fbx
STATUS: OK
SEVERITY: 안전
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 634
FPS: 30.00
DURATION: 21.100
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 25_04604_M_AIStndMoveLocalFront75cm0to315_250822.fbx
STATUS: OK
SEVERITY: 안전
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 959
FPS: 30.00
DURATION: 31.933
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: FC_00078_F_SuddenFlutter_Anime.fbx
STATUS: OK
SEVERITY: 위험
BONES: 114
ROOTS: BlendShape_g, DHIbody:root
FRAMES: 201
FPS: 30.00
DURATION: 6.667
NEGATIVE_START_FRAME: none
MISSING_STANDARD: Hips, Spine, Chest, Neck, Head, L Shoulder, R Shoulder, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L Hand, R Hand, L UpLeg, R UpLeg, L Leg, R Leg, L Foot, R Foot
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: FBX SDK/FBX Plugins version 2020.2.3
SOURCE_TYPE: Maya
RETARGET_RISK: 다중 루트: BlendShape_g, DHIbody:root | 표준 본 누락: Hips, Spine, Chest, Neck, Head, L Shoulder, R Shoulder, L UpperArm, R UpperArm, L LowerArm, R LowerArm, L Hand, R Hand, L UpLeg, R UpLeg, L Leg, R Leg, L Foot, R Foot

codex
분석 자체는 끝났고 결과도 안정적입니다. 마지막으로 임시 bin 경고 하나만 정리해서, 빌드 로그 인용을 더 깔끔하게 맞추겠습니다.
apply patch
patch: completed
/Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0334eea38c9411029fbeb5be3f4b7ea2bcd2a9c0
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,438 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    _roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0334eea38c9411029fbeb5be3f4b7ea2bcd2a9c0
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,438 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    _roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

exec
/bin/zsh -lc "cargo run -p humanoid_retarget --bin fbx-summary-scratch -- ../../assets/fbx | sed -n '1,40p'" in /Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0334eea38c9411029fbeb5be3f4b7ea2bcd2a9c0
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,438 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    _roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0334eea38c9411029fbeb5be3f4b7ea2bcd2a9c0
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,438 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    _roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

 succeeded in 4591ms:
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.25s
     Running `target/debug/fbx-summary-scratch ../../assets/fbx`
# FBX Summary Scratch
dir: ../../assets/fbx
files: 11
---
FILE: 17857_M_AIStndWide_241204.fbx
STATUS: OK
SEVERITY: 안전
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 226
FPS: 30.00
DURATION: 7.500
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 18271_F_AIDepressedID_000000.fbx
STATUS: OK
SEVERITY: 안전
BONES: 54
ROOTS: CAS_BaseModel_RootMotion4_Object079, root
FRAMES: 712
FPS: 30.00
DURATION: 23.700
NEGATIVE_START_FRAME: none
MISSING_STANDARD: none
REST_FRAME0_5DEG: none
JITTER: none
WEIRD_NAMES: none
CREATOR: Blender (stable FBX IO) - 4.5.8 LTS - 1.0.0
SOURCE_TYPE: Blender
RETARGET_RISK: 다중 루트: CAS_BaseModel_RootMotion4_Object079, root
---
FILE: 18360_F_AIGracefulArmsSR_000000.fbx
STATUS: OK

codex
**도구 정찰**

`crates/cinev_retarget/src/bin/` 경로는 현재 워크스페이스에 없어서, 실제 존재하는 `crates/humanoid_retarget/src/bin/`에 임시 분석기 [`fbx_summary_scratch.rs`](/Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs) 를 추가해 일괄 분석했습니다.  
`fbx_rig`에서 확인한 핵심 API는 `parse()`, `euler_to_quat()`, `compute_fbx_skeleton_from_parsed()`이며, 노출 데이터는 `bones / tracks / duration / frame_count / creator / detected_source_type / bind_world`입니다. 기존 [`src/bin/analyze_fbx.rs`](/Users/deemooooooooo/Desktop/www/bevy-vrm/src/bin/analyze_fbx.rs)는 단일 파일용이라 11개 일괄 요약에는 부족했습니다.

빌드/실행 핵심 로그:
```text
Compiling humanoid_retarget v0.1.0 (.../crates/humanoid_retarget)
Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.25s
Running `target/debug/fbx-summary-scratch ../../assets/fbx`
```

**파일별 분석**

| FBX | 본 수 | 루트 본 | 프레임 / FPS / 길이 | ARP 표준 본 누락 | Rest vs Frame0 5°+ | 잠재 문제 | 분류 |
|---|---:|---|---|---|---|---|---|
| `17857_M_AIStndWide_241204.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 226 / 30 / 7.500s | 없음 | 없음 | 다중 루트 | 안전 |
| `18271_F_AIDepressedID_000000.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 712 / 30 / 23.700s | 없음 | 없음 | 다중 루트 | 안전 |
| `18360_F_AIGracefulArmsSR_000000.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 1064 / 30 / 35.433s | 없음 | 없음 | 다중 루트 | 안전 |
| `18479_F_AILimpRightFR_000000.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 2518 / 30 / 83.900s | 없음 | 없음 | `leg_stretch.r 23.6°`, `foot.l 14.4°`, `thigh_stretch.r 12.4°` jitter 후보, 다중 루트 | 주의 |
| `19586_M_AISupermanSW_000000.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 2341 / 30 / 78.000s | 없음 | 없음 | `foot.r 16.4°`, `foot.l 15.1°` jitter 후보, 다중 루트 | 주의 |
| `21092_M_AiStndGangLegWideElbowBackFirmFace_241226.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 419 / 30 / 13.933s | 없음 | 없음 | 다중 루트 | 안전 |
| `21353_F_AiHappy03C_241010.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 1764 / 30 / 58.767s | 없음 | 없음 | 다중 루트 | 안전 |
| `21566_M_AiFigureEightRun_250108.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 787 / 30 / 26.200s | 없음 | 없음 | `foot.r 22.1°`, `forearm_stretch.r 13.6°` jitter 후보, 다중 루트 | 주의 |
| `25_04206_F_AIStndMoveLocalFront25cm0to135_250808.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 634 / 30 / 21.100s | 없음 | 없음 | 다중 루트 | 안전 |
| `25_04604_M_AIStndMoveLocalFront75cm0to315_250822.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 959 / 30 / 31.933s | 없음 | 없음 | 다중 루트 | 안전 |
| `FC_00078_F_SuddenFlutter_Anime.fbx` | 114 | `BlendShape_g`, `DHIbody:root` | 201 / 30 / 6.667s | Hips~Foot 전부 누락 | 없음 | body humanoid 체인 부재, Maya/DHI 계열 facial 구조 | 위험 |

추가 공통 관찰:
- 11개 모두 `FPS 30.00`
- 11개 모두 음수 프레임 없음
- 11개 모두 제 휴리스틱 기준 비정상 본 이름 없음
- body 10개는 모두 Blender export, `assets/retarget/arp_body.json`의 alias (`spine_01.x`, `arm_stretch.l`, `thigh_stretch.r` 등)와 일치
- 핵심 항목인 `Rest pose vs Frame 0 diff`는 11개 모두 `5° 이상 본 없음`

**종합**

분류 집계:
- 안전: 7개
- 주의: 3개
- 위험: 1개

문제 Top 3:
1. `FC_00078_F_SuddenFlutter_Anime.fbx`
   body humanoid 체인이 없어서 `humanoid_retarget`의 body retarget 파이프라인 대상이 아닙니다.
2. `18479_F_AILimpRightFR_000000.fbx`
   우측 다리 계열과 좌측 발에 국소 spike가 보여, 보행 안정화와 foot contact 품질 저하 가능성이 큽니다.
3. `21566_M_AiFigureEightRun_250108.fbx`
   우측 발과 우측 전완에 spike가 있어 빠른 러닝 동작에서 손목/발목 계열 떨림이 증폭될 수 있습니다.

`humanoid_retarget` 파이프라인이 처리 어려운 케이스:
- `FC_00078_F_SuddenFlutter_Anime.fbx`: body retarget 사실상 불가. facial/expression 전용 경로로 분리해야 합니다.
- `18479_*`, `19586_*`, `21566_*`: 파싱과 매핑은 되지만, 발/다리/전완 jitter 때문에 ground contact, limb stability, 후처리 품질이 흔들릴 수 있습니다.
- 나머지 7개 body FBX는 현재 저장소의 `arp_body.json` 기준으로는 구조적으로 무난합니다. 다중 루트는 있지만 실제 retarget root는 `root`로 잡으면 됩니다.

**결론: body용 10개 FBX 중 7개는 그대로 써도 안전하고, 3개는 jitter 모니터링이 필요하며, `FC_00078_F_SuddenFlutter_Anime.fbx`는 humanoid body retarget 대상이 아니라 facial 전용으로 분리해야 합니다. 또한 가장 중요한 검사인 `rest pose vs frame 0`에서 11개 전부 5° 이상 차이가 없었습니다.**
diff --git a/crates/humanoid_retarget/Cargo.toml b/crates/humanoid_retarget/Cargo.toml
index a4ab9052ea43b0aef2d2efeb7d9fa750a82f6b1e..bcfc5048723a438f85fc3ad314d30f7a58cbac7d
--- a/crates/humanoid_retarget/Cargo.toml
+++ b/crates/humanoid_retarget/Cargo.toml
@@ -23,3 +23,7 @@
 [[bin]]
 name = "validate-pipeline"
 path = "src/bin/validate_pipeline.rs"
+
+[[bin]]
+name = "fbx-summary-scratch"
+path = "src/bin/fbx_summary_scratch.rs"
diff --git a/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
new file mode 100644
index 0000000000000000000000000000000000000000..0334eea38c9411029fbeb5be3f4b7ea2bcd2a9c0
--- /dev/null
+++ b/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
@@ -0,0 +1,438 @@
+use fbx_rig::fbxcel::low::v7400::AttributeValue;
+use fbx_rig::fbxcel::pull_parser::any::AnyParser;
+use fbx_rig::fbxcel::pull_parser::v7400::Event;
+use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
+use fbx_rig::{SourceAsset, euler_to_quat, parse};
+use glam::Quat;
+use std::collections::{BTreeMap, HashMap};
+use std::fs;
+use std::io::Cursor;
+use std::path::{Path, PathBuf};
+
+const SAMPLE_RATE: f32 = 30.0;
+const FBX_TIME_UNIT: f64 = 46186158000.0;
+
+const STANDARD_BONES: &[(&str, &[&str])] = &[
+    ("Hips", &["root.x", "c_root_master.x", "hips"]),
+    ("Spine", &["spine_01.x", "spine.x", "spine"]),
+    ("Chest", &["spine_02.x", "chest.x", "chest"]),
+    ("Neck", &["neck.x", "neck"]),
+    ("Head", &["head.x", "head"]),
+    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
+    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
+    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
+    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
+    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
+    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
+    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
+    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
+    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
+    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
+    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
+    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
+    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
+    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
+];
+
+#[derive(Debug)]
+struct FileSummary {
+    file: String,
+    bone_count: usize,
+    roots: Vec<String>,
+    frame_count: usize,
+    fps: f32,
+    duration: f32,
+    negative_start_frame: Option<f32>,
+    missing_standard: Vec<&'static str>,
+    rest_vs_frame0: Vec<(String, f32)>,
+    jitter_bones: Vec<(String, f32)>,
+    weird_names: Vec<String>,
+    creator: String,
+    source_type: String,
+    severity: String,
+    retarget_risk: Vec<String>,
+}
+
+fn main() {
+    let dir = std::env::args()
+        .nth(1)
+        .map(PathBuf::from)
+        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));
+
+    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
+        .expect("failed to read fbx dir")
+        .filter_map(|entry| entry.ok().map(|e| e.path()))
+        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
+        .collect();
+    files.sort();
+
+    println!("# FBX Summary Scratch");
+    println!("dir: {}", dir.display());
+    println!("files: {}", files.len());
+
+    for path in files {
+        match analyze_file(&path) {
+            Ok(summary) => print_summary(&summary),
+            Err(err) => {
+                println!("---");
+                println!("FILE: {}", path.display());
+                println!("STATUS: ERROR");
+                println!("ERROR: {}", err);
+            }
+        }
+    }
+}
+
+fn analyze_file(path: &Path) -> Result<FileSummary, String> {
+    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
+    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
+    let min_key_time = scan_min_key_time_secs(&bytes)?;
+
+    let mut roots: Vec<String> = fbx
+        .bones
+        .iter()
+        .filter(|(_, bone)| bone.parent.is_none())
+        .map(|(name, _)| name.clone())
+        .collect();
+    roots.sort();
+
+    let missing_standard = STANDARD_BONES
+        .iter()
+        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
+        .map(|(label, _)| *label)
+        .collect::<Vec<_>>();
+
+    let mut rest_vs_frame0 = Vec::new();
+    for (name, bone) in &fbx.bones {
+        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
+        let frame0 = fbx
+            .tracks
+            .get(name)
+            .and_then(|track| track.rotations.first())
+            .copied()
+            .unwrap_or(rest);
+        let diff = quat_angle_deg(rest, frame0);
+        if diff >= 5.0 {
+            rest_vs_frame0.push((name.clone(), diff));
+        }
+    }
+    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut jitter_bones = detect_jitter(&fbx);
+    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
+
+    let mut weird_names: Vec<String> = fbx
+        .bones
+        .keys()
+        .filter(|name| is_weird_bone_name(name))
+        .cloned()
+        .collect();
+    weird_names.sort();
+
+    let fps = if fbx.duration > 0.0 {
+        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
+    } else {
+        SAMPLE_RATE
+    };
+    let negative_start_frame = min_key_time
+        .filter(|secs| *secs < 0.0)
+        .map(|secs| (secs as f32) * SAMPLE_RATE);
+
+    let severity = classify(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+    let retarget_risk = retarget_risks(
+        &roots,
+        &missing_standard,
+        &rest_vs_frame0,
+        &jitter_bones,
+        negative_start_frame,
+    );
+
+    Ok(FileSummary {
+        file: path.file_name().unwrap().to_string_lossy().into_owned(),
+        bone_count: fbx.bones.len(),
+        roots,
+        frame_count: fbx.frame_count,
+        fps,
+        duration: fbx.duration,
+        negative_start_frame,
+        missing_standard,
+        rest_vs_frame0,
+        jitter_bones,
+        weird_names,
+        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
+        source_type: fbx.detected_source_type.to_string(),
+        severity,
+        retarget_risk,
+    })
+}
+
+fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
+    aliases.iter().any(|name| bones.contains_key(*name))
+}
+
+fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
+    let d = a.inverse() * b;
+    d.to_axis_angle().1.abs().to_degrees()
+}
+
+fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
+    let mut out = Vec::new();
+    for (name, track) in &fbx.tracks {
+        if track.rotations.len() < 5 {
+            continue;
+        }
+
+        let steps: Vec<f32> = track
+            .rotations
+            .windows(2)
+            .map(|w| quat_angle_deg(w[0], w[1]))
+            .collect();
+        if steps.len() < 3 {
+            continue;
+        }
+
+        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
+        let mut spike = 0.0f32;
+        for i in 1..steps.len() - 1 {
+            let prev = steps[i - 1];
+            let cur = steps[i];
+            let next = steps[i + 1];
+            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
+                spike = spike.max(cur);
+            }
+        }
+        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
+            out.push((name.clone(), spike));
+        }
+    }
+    out
+}
+
+fn is_weird_bone_name(name: &str) -> bool {
+    if name.chars().any(|c| c.is_whitespace()) {
+        return true;
+    }
+    !name
+        .chars()
+        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
+}
+
+fn classify(
+    _roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> String {
+    let essential_missing = missing_standard.len();
+    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
+    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
+    let jitter_count = jitter_bones.len();
+
+    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
+        || negative_start_frame.is_some()
+    {
+        "위험".to_string()
+    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
+        "주의".to_string()
+    } else {
+        "안전".to_string()
+    }
+}
+
+fn retarget_risks(
+    roots: &[String],
+    missing_standard: &[&str],
+    rest_vs_frame0: &[(String, f32)],
+    jitter_bones: &[(String, f32)],
+    negative_start_frame: Option<f32>,
+) -> Vec<String> {
+    let mut risks = Vec::new();
+    if roots.len() > 1 {
+        risks.push(format!("다중 루트: {}", roots.join(", ")));
+    }
+    if !missing_standard.is_empty() {
+        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
+    }
+
+    let major_rest: Vec<String> = rest_vs_frame0
+        .iter()
+        .filter(|(_, deg)| *deg >= 20.0)
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !major_rest.is_empty() {
+        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
+    }
+
+    let jitter: Vec<String> = jitter_bones
+        .iter()
+        .take(4)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect();
+    if !jitter.is_empty() {
+        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
+    }
+
+    if let Some(start_frame) = negative_start_frame {
+        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
+    }
+
+    if risks.is_empty() {
+        risks.push("특이 리스크 없음".to_string());
+    }
+    risks
+}
+
+fn has_hips(missing_standard: &[&str]) -> bool {
+    !missing_standard.iter().any(|name| *name == "Hips")
+}
+
+fn print_summary(summary: &FileSummary) {
+    println!("---");
+    println!("FILE: {}", summary.file);
+    println!("STATUS: OK");
+    println!("SEVERITY: {}", summary.severity);
+    println!("BONES: {}", summary.bone_count);
+    println!("ROOTS: {}", summary.roots.join(", "));
+    println!("FRAMES: {}", summary.frame_count);
+    println!("FPS: {:.2}", summary.fps);
+    println!("DURATION: {:.3}", summary.duration);
+    println!(
+        "NEGATIVE_START_FRAME: {}",
+        summary
+            .negative_start_frame
+            .map(|v| format!("{v:.2}"))
+            .unwrap_or_else(|| "none".to_string())
+    );
+    println!(
+        "MISSING_STANDARD: {}",
+        if summary.missing_standard.is_empty() {
+            "none".to_string()
+        } else {
+            summary.missing_standard.join(", ")
+        }
+    );
+    println!(
+        "REST_FRAME0_5DEG: {}",
+        format_pairs(&summary.rest_vs_frame0, 12)
+    );
+    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
+    println!(
+        "WEIRD_NAMES: {}",
+        if summary.weird_names.is_empty() {
+            "none".to_string()
+        } else {
+            summary.weird_names.join(", ")
+        }
+    );
+    println!("CREATOR: {}", summary.creator);
+    println!("SOURCE_TYPE: {}", summary.source_type);
+    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
+}
+
+fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
+    if values.is_empty() {
+        return "none".to_string();
+    }
+    let mut parts = values
+        .iter()
+        .take(limit)
+        .map(|(name, deg)| format!("{name} {:.1}°", deg))
+        .collect::<Vec<_>>();
+    if values.len() > limit {
+        parts.push(format!("... +{}", values.len() - limit));
+    }
+    parts.join(", ")
+}
+
+fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
+    let cursor = Cursor::new(bytes);
+    let reader = std::io::BufReader::new(cursor);
+    let mut parser = match AnyParser::from_seekable_reader(reader)
+        .map_err(|e| format!("FBX header: {e}"))?
+    {
+        AnyParser::V7400(p) => p,
+        _ => return Err("unsupported FBX version".to_string()),
+    };
+
+    let mut top_section = String::new();
+    let mut depth = 0i32;
+    let mut min_key_time = f64::MAX;
+
+    loop {
+        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+            Event::StartNode(node) => {
+                depth += 1;
+                let name = node.name().to_string();
+                if depth == 1 {
+                    top_section = name;
+                    continue;
+                }
+                if top_section == "Objects" && name == "AnimationCurve" {
+                    let mut curve_depth = depth;
+                    loop {
+                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
+                            Event::StartNode(child) => {
+                                curve_depth += 1;
+                                let child_name = child.name().to_string();
+                                let mut attrs: Vec<AttributeValue> = Vec::new();
+                                let mut reader = child.attributes();
+                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
+                                    attrs.push(attr);
+                                }
+                                if child_name == "KeyTime"
+                                    && let Some(arr) =
+                                        attrs.first().and_then(|a| a.get_arr_i64())
+                                    && let Some(local_min) = arr.iter().min()
+                                {
+                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
+                                    min_key_time = min_key_time.min(secs);
+                                }
+                            }
+                            Event::EndNode => {
+                                curve_depth -= 1;
+                                if curve_depth < depth {
+                                    depth -= 1;
+                                    break;
+                                }
+                            }
+                            Event::EndFbx(_) => {
+                                return Ok(if min_key_time == f64::MAX {
+                                    None
+                                } else {
+                                    Some(min_key_time)
+                                });
+                            }
+                        }
+                    }
+                }
+            }
+            Event::EndNode => {
+                depth -= 1;
+            }
+            Event::EndFbx(_) => {
+                return Ok(if min_key_time == f64::MAX {
+                    None
+                } else {
+                    Some(min_key_time)
+                });
+            }
+        }
+    }
+}
+
+#[allow(dead_code)]
+fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
+    let mut out = BTreeMap::new();
+    for item in items {
+        *out.entry(item.severity.as_str()).or_insert(0) += 1;
+    }
+    out
+}

tokens used
87,894
**도구 정찰**

`crates/cinev_retarget/src/bin/` 경로는 현재 워크스페이스에 없어서, 실제 존재하는 `crates/humanoid_retarget/src/bin/`에 임시 분석기 [`fbx_summary_scratch.rs`](/Users/deemooooooooo/Desktop/www/bevy-vrm/crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs) 를 추가해 일괄 분석했습니다.  
`fbx_rig`에서 확인한 핵심 API는 `parse()`, `euler_to_quat()`, `compute_fbx_skeleton_from_parsed()`이며, 노출 데이터는 `bones / tracks / duration / frame_count / creator / detected_source_type / bind_world`입니다. 기존 [`src/bin/analyze_fbx.rs`](/Users/deemooooooooo/Desktop/www/bevy-vrm/src/bin/analyze_fbx.rs)는 단일 파일용이라 11개 일괄 요약에는 부족했습니다.

빌드/실행 핵심 로그:
```text
Compiling humanoid_retarget v0.1.0 (.../crates/humanoid_retarget)
Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.25s
Running `target/debug/fbx-summary-scratch ../../assets/fbx`
```

**파일별 분석**

| FBX | 본 수 | 루트 본 | 프레임 / FPS / 길이 | ARP 표준 본 누락 | Rest vs Frame0 5°+ | 잠재 문제 | 분류 |
|---|---:|---|---|---|---|---|---|
| `17857_M_AIStndWide_241204.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 226 / 30 / 7.500s | 없음 | 없음 | 다중 루트 | 안전 |
| `18271_F_AIDepressedID_000000.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 712 / 30 / 23.700s | 없음 | 없음 | 다중 루트 | 안전 |
| `18360_F_AIGracefulArmsSR_000000.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 1064 / 30 / 35.433s | 없음 | 없음 | 다중 루트 | 안전 |
| `18479_F_AILimpRightFR_000000.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 2518 / 30 / 83.900s | 없음 | 없음 | `leg_stretch.r 23.6°`, `foot.l 14.4°`, `thigh_stretch.r 12.4°` jitter 후보, 다중 루트 | 주의 |
| `19586_M_AISupermanSW_000000.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 2341 / 30 / 78.000s | 없음 | 없음 | `foot.r 16.4°`, `foot.l 15.1°` jitter 후보, 다중 루트 | 주의 |
| `21092_M_AiStndGangLegWideElbowBackFirmFace_241226.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 419 / 30 / 13.933s | 없음 | 없음 | 다중 루트 | 안전 |
| `21353_F_AiHappy03C_241010.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 1764 / 30 / 58.767s | 없음 | 없음 | 다중 루트 | 안전 |
| `21566_M_AiFigureEightRun_250108.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 787 / 30 / 26.200s | 없음 | 없음 | `foot.r 22.1°`, `forearm_stretch.r 13.6°` jitter 후보, 다중 루트 | 주의 |
| `25_04206_F_AIStndMoveLocalFront25cm0to135_250808.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 634 / 30 / 21.100s | 없음 | 없음 | 다중 루트 | 안전 |
| `25_04604_M_AIStndMoveLocalFront75cm0to315_250822.fbx` | 54 | `CAS_BaseModel_RootMotion4_Object079`, `root` | 959 / 30 / 31.933s | 없음 | 없음 | 다중 루트 | 안전 |
| `FC_00078_F_SuddenFlutter_Anime.fbx` | 114 | `BlendShape_g`, `DHIbody:root` | 201 / 30 / 6.667s | Hips~Foot 전부 누락 | 없음 | body humanoid 체인 부재, Maya/DHI 계열 facial 구조 | 위험 |

추가 공통 관찰:
- 11개 모두 `FPS 30.00`
- 11개 모두 음수 프레임 없음
- 11개 모두 제 휴리스틱 기준 비정상 본 이름 없음
- body 10개는 모두 Blender export, `assets/retarget/arp_body.json`의 alias (`spine_01.x`, `arm_stretch.l`, `thigh_stretch.r` 등)와 일치
- 핵심 항목인 `Rest pose vs Frame 0 diff`는 11개 모두 `5° 이상 본 없음`

**종합**

분류 집계:
- 안전: 7개
- 주의: 3개
- 위험: 1개

문제 Top 3:
1. `FC_00078_F_SuddenFlutter_Anime.fbx`
   body humanoid 체인이 없어서 `humanoid_retarget`의 body retarget 파이프라인 대상이 아닙니다.
2. `18479_F_AILimpRightFR_000000.fbx`
   우측 다리 계열과 좌측 발에 국소 spike가 보여, 보행 안정화와 foot contact 품질 저하 가능성이 큽니다.
3. `21566_M_AiFigureEightRun_250108.fbx`
   우측 발과 우측 전완에 spike가 있어 빠른 러닝 동작에서 손목/발목 계열 떨림이 증폭될 수 있습니다.

`humanoid_retarget` 파이프라인이 처리 어려운 케이스:
- `FC_00078_F_SuddenFlutter_Anime.fbx`: body retarget 사실상 불가. facial/expression 전용 경로로 분리해야 합니다.
- `18479_*`, `19586_*`, `21566_*`: 파싱과 매핑은 되지만, 발/다리/전완 jitter 때문에 ground contact, limb stability, 후처리 품질이 흔들릴 수 있습니다.
- 나머지 7개 body FBX는 현재 저장소의 `arp_body.json` 기준으로는 구조적으로 무난합니다. 다중 루트는 있지만 실제 retarget root는 `root`로 잡으면 됩니다.

**결론: body용 10개 FBX 중 7개는 그대로 써도 안전하고, 3개는 jitter 모니터링이 필요하며, `FC_00078_F_SuddenFlutter_Anime.fbx`는 humanoid body retarget 대상이 아니라 facial 전용으로 분리해야 합니다. 또한 가장 중요한 검사인 `rest pose vs frame 0`에서 11개 전부 5° 이상 차이가 없었습니다.**
