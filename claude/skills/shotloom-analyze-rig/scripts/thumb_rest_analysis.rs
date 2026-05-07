//! STL-263 ad-hoc thumb-rest analysis. NOT a regression test.
//! Run with `cargo test -p shotloom-retarget --test thumb_rest_analysis -- --nocapture`
//! to dump:
//!   1. VRM-side thumb local + global rest for xiao + yoya, alongside Index/Middle
//!      as 4-finger reference.
//!   2. ARP source thumb rest from a chosen body FBX (default:
//!      `21566_M_AiFigureEightRun`), with per-bone pre-rotation, euler, and
//!      computed local rest. Also includes 4-finger source rests for comparison.
//!   3. Option B world-transport derivation
//!      (`derive_vrm_axis_option_b` from `finger_axis_map.rs`) for thumb bones,
//!      compared against the hardcoded ±Z VRM curl axis.
//!
//! Delete this file once the analysis is captured (analysis is not a regression
//! test; permanent regression coverage lives in `thumb_retarget_regression.rs`).

use glam::{Quat, Vec3};
use shotloom_common::workspace_root;
use shotloom_fbx_anim::parse as parse_fbx;
use shotloom_retarget::{build_from_bytes, VrmRestPose};
use shotloom_source_anim::{euler_to_quat, SourceAsset};
use std::collections::{HashMap, HashSet};
use std::fs;

const XIAO_VRM: &str = "assets/models/vrm1x-vroid-f-xiao.vrm";
const YOYA_VRM: &str = "assets/models/vrm1x-cmm-f-yoya_backward.vrm";
const RUN_FBX: &str = "assets/anims/body/21566_M_AiFigureEightRun_250108.fbx";

fn read_fixture(relative: &str) -> Vec<u8> {
    let path = workspace_root().join(relative);
    fs::read(&path).unwrap_or_else(|e| panic!("read {} failed: {e}", path.display()))
}

fn build(relative: &str) -> VrmRestPose {
    let (rest, _) = build_from_bytes(&read_fixture(relative))
        .unwrap_or_else(|e| panic!("build_from_bytes {relative} failed: {e:?}"));
    rest
}

fn dump(label: &str, rest: &VrmRestPose) {
    eprintln!("\n=== {label} ===");
    eprintln!("all thumb-related keys present in bone_rest_local:");
    let mut thumb_keys: Vec<_> = rest
        .bone_rest_local
        .keys()
        .filter(|k| k.to_lowercase().contains("thumb"))
        .collect();
    thumb_keys.sort();
    for k in &thumb_keys {
        eprintln!("  {k}");
    }
    eprintln!(
        "\n{:<30} {:<26} {:>8}  {:<26} {:>8}",
        "bone", "local_axis", "local°", "global_axis", "global°"
    );
    for side in ["left", "right"] {
        for (finger, segs) in [
            (
                "Thumb",
                &["Metacarpal", "Proximal", "Intermediate", "Distal"][..],
            ),
            ("Index", &["Proximal", "Intermediate", "Distal"][..]),
            ("Middle", &["Proximal", "Intermediate", "Distal"][..]),
        ] {
            for seg in segs {
                let name = format!("{side}{finger}{seg}");
                let Some(local) = rest.bone_rest_local.get(&name) else {
                    continue;
                };
                let global = rest
                    .bone_rest_global
                    .get(&name)
                    .copied()
                    .unwrap_or(Quat::IDENTITY);
                let (la, lang) = local.to_axis_angle();
                let (ga, gang) = global.to_axis_angle();
                eprintln!(
                    "{:<30} [{:>+5.2},{:>+5.2},{:>+5.2}] {:>8.2}  [{:>+5.2},{:>+5.2},{:>+5.2}] {:>8.2}",
                    name,
                    la.x, la.y, la.z, lang.to_degrees(),
                    ga.x, ga.y, ga.z, gang.to_degrees(),
                );
            }
        }
    }
}

fn dump_arp(label: &str, fbx_relative: &str) {
    let bytes = read_fixture(fbx_relative);
    let asset: SourceAsset =
        parse_fbx(&bytes).unwrap_or_else(|e| panic!("parse_fbx {fbx_relative} failed: {e:?}"));
    eprintln!("\n=== ARP {label} ({fbx_relative}) ===");
    eprintln!("all thumb-related bones in source:");
    let mut thumb_keys: Vec<_> = asset
        .bones
        .keys()
        .filter(|k| {
            let lk = k.to_lowercase();
            lk.contains("thumb") || lk.starts_with("c_index") || lk.starts_with("c_middle")
        })
        .collect();
    thumb_keys.sort();
    for k in &thumb_keys {
        eprintln!("  {k}");
    }
    eprintln!(
        "\n{:<22} {:>10}  {:<26} {:>8}  {:<28} {:<26} {:>8}",
        "bone", "pre_rot°", "pre_rot_axis", "euler°", "euler_xyz_deg", "local_axis", "local°"
    );
    for k in &thumb_keys {
        let bone = &asset.bones[*k];
        let pre = bone.pre_rotation;
        let euler_q = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
        let local = (pre * euler_q).normalize();
        let (pa, pang) = pre.to_axis_angle();
        let (la, lang) = local.to_axis_angle();
        let euler_deg = bone.rest_rotation_euler;
        let euler_norm = euler_q.angle_between(Quat::IDENTITY).to_degrees();
        eprintln!(
            "{:<22} {:>10.2}  [{:>+5.2},{:>+5.2},{:>+5.2}] {:>8.2}  [{:>+7.1},{:>+7.1},{:>+7.1}] [{:>+5.2},{:>+5.2},{:>+5.2}] {:>8.2}",
            k,
            pang.to_degrees(),
            pa.x, pa.y, pa.z,
            euler_norm,
            euler_deg.x, euler_deg.y, euler_deg.z,
            la.x, la.y, la.z, lang.to_degrees(),
        );
    }
}

/// Walks ARP source bones topologically, returns `name → (full_local_rest, global_rest)`.
/// Mirrors `body-anim-normalizer::mapping` lines 205-239 — no coord conversion on rotation.
fn arp_global_rests(asset: &SourceAsset) -> HashMap<String, (Quat, Quat)> {
    let mut local: HashMap<String, Quat> = HashMap::new();
    let mut global: HashMap<String, Quat> = HashMap::new();
    let mut to_process: Vec<String> = asset.bones.keys().cloned().collect();
    let mut processed: HashSet<String> = HashSet::new();
    loop {
        let mut progress = false;
        to_process.retain(|name| {
            let bone = &asset.bones[name];
            let parent_done = bone.parent.as_ref().is_none_or(|p| processed.contains(p));
            if !parent_done {
                return true;
            }
            let parent_global = bone
                .parent
                .as_ref()
                .and_then(|p| global.get(p))
                .copied()
                .unwrap_or(Quat::IDENTITY);
            let lcl = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
            let full_local = bone.pre_rotation * lcl;
            local.insert(name.clone(), full_local);
            global.insert(name.clone(), parent_global * full_local);
            processed.insert(name.clone());
            progress = true;
            false
        });
        if !progress {
            break;
        }
    }
    local
        .into_iter()
        .map(|(k, v)| (k.clone(), (v, global.get(&k).copied().unwrap_or(v))))
        .collect()
}

/// Mirrors `finger_axis_map::derive_vrm_axis_option_b`.
fn option_b(src_global_rest: Quat, dst_rest_global: Quat, arp_axis_local: Vec3) -> Vec3 {
    let arp_axis_world = src_global_rest * arp_axis_local;
    (dst_rest_global.inverse() * arp_axis_world).normalize_or_zero()
}

/// Mirrors `finger_axis_map::vrm_curl_axis_for` for non-thumb fingers.
fn vrm_curl_axis_hardcode(name: &str) -> Vec3 {
    let lower = name.to_lowercase();
    let is_right = lower.starts_with("right") || lower.contains("right");
    if is_right {
        Vec3::new(0.0, 0.0, 1.0)
    } else {
        Vec3::new(0.0, 0.0, -1.0)
    }
}

fn axis_err_deg(a: Vec3, b: Vec3) -> f32 {
    if a.length_squared() < 1e-8 || b.length_squared() < 1e-8 {
        return f32::NAN;
    }
    a.normalize()
        .dot(b.normalize())
        .clamp(-1.0, 1.0)
        .acos()
        .to_degrees()
}

fn run_option_b(label: &str, vrm: &VrmRestPose, fbx_relative: &str) {
    let bytes = read_fixture(fbx_relative);
    let asset: SourceAsset = parse_fbx(&bytes).unwrap();
    let arp_rests = arp_global_rests(&asset);

    eprintln!("\n=== Option B: {label} × {fbx_relative} ===");
    eprintln!(
        "{:<24} {:<26} {:>9}  {:<24} {:>7}  {:<24} {:<24} {:>7}",
        "ARP→VRM",
        "arp_local_axis",
        "arp_local°",
        "vrm_dst_global_axis",
        "vrm°",
        "derived_vrm_local",
        "hardcode±Z",
        "err°"
    );
    let pairs = [
        ("c_thumb1.l", "leftThumbMetacarpal"),
        ("c_thumb2.l", "leftThumbProximal"),
        ("c_thumb3.l", "leftThumbDistal"),
        ("c_thumb1.r", "rightThumbMetacarpal"),
        ("c_thumb2.r", "rightThumbProximal"),
        ("c_thumb3.r", "rightThumbDistal"),
        // 4-finger reference for sanity:
        ("c_index1.l", "leftIndexProximal"),
        ("c_index2.l", "leftIndexIntermediate"),
        ("c_index3.l", "leftIndexDistal"),
        ("c_middle1.l", "leftMiddleProximal"),
    ];
    for (arp_name, vrm_name) in pairs {
        let Some((arp_local, arp_global)) = arp_rests.get(arp_name).copied() else {
            eprintln!("{arp_name:<24} (missing in source)");
            continue;
        };
        let dst_global = vrm
            .bone_rest_global
            .get(vrm_name)
            .copied()
            .unwrap_or(Quat::IDENTITY);

        let (arp_axis, arp_ang) = arp_local.to_axis_angle();
        let (dst_axis, dst_ang) = dst_global.to_axis_angle();

        let arp_axis_n = if arp_ang.abs() < 1.0_f32.to_radians() {
            Vec3::X
        } else {
            arp_axis.normalize_or_zero()
        };

        let derived = option_b(arp_global, dst_global, arp_axis_n);
        let hardcode = vrm_curl_axis_hardcode(vrm_name);
        let err = axis_err_deg(derived, hardcode);

        eprintln!(
            "{:<8}→{:<15} [{:>+5.2},{:>+5.2},{:>+5.2}] {:>9.2}  [{:>+5.2},{:>+5.2},{:>+5.2}] {:>7.1}  [{:>+5.2},{:>+5.2},{:>+5.2}] [{:>+5.2},{:>+5.2},{:>+5.2}] {:>7}",
            arp_name, vrm_name,
            arp_axis_n.x, arp_axis_n.y, arp_axis_n.z,
            arp_ang.to_degrees(),
            dst_axis.x, dst_axis.y, dst_axis.z,
            dst_ang.to_degrees(),
            derived.x, derived.y, derived.z,
            hardcode.x, hardcode.y, hardcode.z,
            if err.is_nan() { "n/a".to_string() } else { format!("{err:.1}") },
        );
    }
}

#[test]
fn dump_thumb_rest_data() {
    let xiao = build(XIAO_VRM);
    let yoya = build(YOYA_VRM);
    dump("xiao", &xiao);
    dump("yoya", &yoya);
    dump_arp("AiFigureEightRun", RUN_FBX);
    run_option_b("xiao", &xiao, RUN_FBX);
    run_option_b("yoya", &yoya, RUN_FBX);
}
