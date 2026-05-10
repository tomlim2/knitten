//! Ad-hoc scan of finger animation activity across body FBX fixtures.
//! Delete after STL-263 visual verification fixture is chosen.

use glam::Quat;
use shotloom_common::workspace_root;
use shotloom_fbx_anim::parse as parse_fbx;
use shotloom_source_anim::{euler_to_quat, SourceAsset};
use std::fs;

fn max_delta_from_rest(asset: &SourceAsset, bone: &str) -> Option<f32> {
    let track = asset.tracks.get(bone)?;
    let src_bone = asset.bones.get(bone)?;
    let rest = euler_to_quat(src_bone.rest_rotation_euler, src_bone.rotation_order);
    let rest_inv = rest.inverse();
    let max = track
        .rotations
        .iter()
        .map(|r| {
            (rest_inv * *r)
                .normalize()
                .angle_between(Quat::IDENTITY)
                .to_degrees()
        })
        .fold(0.0_f32, f32::max);
    Some(max)
}

#[test]
fn scan_finger_activity() {
    let dir = workspace_root().join("assets/anims/body");
    let mut entries: Vec<_> = fs::read_dir(&dir)
        .unwrap()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().and_then(|x| x.to_str()) == Some("fbx"))
        .map(|e| e.path())
        .collect();
    entries.sort();

    let bones: Vec<String> = ["thumb", "index", "middle", "ring", "pinky"]
        .iter()
        .flat_map(|f| (1..=3).map(move |n| format!("c_{f}{n}")))
        .flat_map(|stem| ["l", "r"].iter().map(move |s| format!("{stem}.{s}")))
        .collect();

    eprintln!("\n=== Finger animation activity scan (max delta from rest, °) ===");
    eprintln!(
        "{:<60} {:>8} {:>8} {:>8} {:>8} {:>8}    rank",
        "fbx", "thumb", "index", "middle", "ring", "pinky"
    );

    let mut rows: Vec<(String, [f32; 5], f32)> = Vec::new();
    for path in &entries {
        let bytes = match fs::read(path) {
            Ok(b) => b,
            Err(_) => continue,
        };
        let asset: SourceAsset = match parse_fbx(&bytes) {
            Ok(a) => a,
            Err(_) => continue,
        };
        let name = path.file_name().unwrap().to_string_lossy().to_string();
        let mut per_finger = [0.0_f32; 5];
        for bone in &bones {
            let finger_idx = if bone.starts_with("c_thumb") {
                0
            } else if bone.starts_with("c_index") {
                1
            } else if bone.starts_with("c_middle") {
                2
            } else if bone.starts_with("c_ring") {
                3
            } else if bone.starts_with("c_pinky") {
                4
            } else {
                continue;
            };
            if let Some(d) = max_delta_from_rest(&asset, bone) {
                per_finger[finger_idx] = per_finger[finger_idx].max(d);
            }
        }
        let total: f32 = per_finger.iter().sum();
        rows.push((name, per_finger, total));
    }

    rows.sort_by(|a, b| b.2.partial_cmp(&a.2).unwrap());
    for (i, (name, per, total)) in rows.iter().enumerate() {
        eprintln!(
            "{:<60} {:>8.1} {:>8.1} {:>8.1} {:>8.1} {:>8.1}    #{} (Σ={:.1})",
            name, per[0], per[1], per[2], per[3], per[4], i + 1, total
        );
    }
}
