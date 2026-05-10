"""
Blender headless script — extract per-frame bone data from FBX for AI motion grading.

Usage:
  blender --background --python analyze.py -- <source.fbx> [retargeted.fbx|.glb]

Output:
  ~/.claude/private/motion-audit/<stem>.json
    {
      "file": "...",
      "fps": 30,
      "frame_count": 120,
      "armature": "Armature",
      "bones": ["Hips", "LeftFoot", "RightFoot", ...],
      "frames": [
        {
          "frame": 0,
          "positions": {"Hips": [x,y,z], "LeftFoot": [x,y,z], ...},
          "rotations": {"Hips": [w,x,y,z], ...}
        },
        ...
      ]
    }

No metric computation here — the calling skill computes metrics from raw data
so thresholds can be tuned without re-running Blender.
"""

import json
import os
import sys
from pathlib import Path

import bpy

# Bones we care about for AI motion grading. Names cover common AI/Mixamo/ARP outputs.
BONE_ALIASES = {
    "hips":        ["Hips", "mixamorig:Hips", "J_Bip_C_Hips", "c_root_master.x", "root.x", "root"],
    "leftFoot":    ["LeftFoot", "mixamorig:LeftFoot", "J_Bip_L_Foot", "c_foot.l", "foot.l"],
    "rightFoot":   ["RightFoot", "mixamorig:RightFoot", "J_Bip_R_Foot", "c_foot.r", "foot.r"],
    "leftToe":     ["LeftToeBase", "LeftToe", "mixamorig:LeftToeBase", "J_Bip_L_ToeBase", "c_toes_end.l", "toes_01.l"],
    "rightToe":    ["RightToeBase", "RightToe", "mixamorig:RightToeBase", "J_Bip_R_ToeBase", "c_toes_end.r", "toes_01.r"],
    "leftLowerLeg":["LeftLeg", "mixamorig:LeftLeg", "J_Bip_L_LowerLeg", "c_leg.l", "leg_stretch.l"],
    "rightLowerLeg":["RightLeg", "mixamorig:RightLeg", "J_Bip_R_LowerLeg", "c_leg.r", "leg_stretch.r"],
    "leftUpperLeg":["LeftUpLeg", "mixamorig:LeftUpLeg", "J_Bip_L_UpperLeg", "c_thigh.l", "thigh_stretch.l"],
    "rightUpperLeg":["RightUpLeg", "mixamorig:RightUpLeg", "J_Bip_R_UpperLeg", "c_thigh.r", "thigh_stretch.r"],
    "spine":       ["Spine", "mixamorig:Spine", "J_Bip_C_Spine", "c_spine_01.x", "spine_01.x"],
    "head":        ["Head", "mixamorig:Head", "J_Bip_C_Head", "c_head.x", "head.x"],
    "leftShoulder":["LeftShoulder", "mixamorig:LeftShoulder", "shoulder.l"],
    "rightShoulder":["RightShoulder", "mixamorig:RightShoulder", "shoulder.r"],
    "leftUpperArm":["LeftArm", "mixamorig:LeftArm", "J_Bip_L_UpperArm", "c_arm.l", "arm_stretch.l"],
    "rightUpperArm":["RightArm", "mixamorig:RightArm", "J_Bip_R_UpperArm", "c_arm.r", "arm_stretch.r"],
    "leftLowerArm":["LeftForeArm", "mixamorig:LeftForeArm", "J_Bip_L_LowerArm", "c_forearm.l", "forearm_stretch.l"],
    "rightLowerArm":["RightForeArm", "mixamorig:RightForeArm", "J_Bip_R_LowerArm", "c_forearm.r", "forearm_stretch.r"],
}


def resolve_bones(armature):
    """Map canonical name → actual bone name in this armature. Unknown → None."""
    names = {b.name for b in armature.pose.bones}
    resolved = {}
    for canonical, candidates in BONE_ALIASES.items():
        for cand in candidates:
            if cand in names:
                resolved[canonical] = cand
                break
        else:
            # Fallback: case-insensitive substring match
            lower = {n.lower(): n for n in names}
            for cand in candidates:
                key = cand.lower().split(":")[-1]
                for low, orig in lower.items():
                    if key in low:
                        resolved[canonical] = orig
                        break
                if canonical in resolved:
                    break
    return resolved


def load_fbx(path):
    """Clear scene and import FBX. Return the armature object."""
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    bpy.ops.import_scene.fbx(filepath=str(path))
    for obj in bpy.data.objects:
        if obj.type == "ARMATURE":
            return obj
    raise RuntimeError(f"No armature found in {path}")


def extract(path):
    armature = load_fbx(path)
    scene = bpy.context.scene
    fps = scene.render.fps / scene.render.fps_base
    f0, f1 = scene.frame_start, scene.frame_end
    resolved = resolve_bones(armature)

    frames = []
    for f in range(f0, f1 + 1):
        scene.frame_set(f)
        positions = {}
        rotations = {}
        for canonical, bone_name in resolved.items():
            pb = armature.pose.bones.get(bone_name)
            if pb is None:
                continue
            # World-space head position
            world_pos = armature.matrix_world @ pb.head
            positions[canonical] = [world_pos.x, world_pos.y, world_pos.z]
            # World-space rotation as quaternion (w,x,y,z)
            world_mat = armature.matrix_world @ pb.matrix
            q = world_mat.to_quaternion()
            rotations[canonical] = [q.w, q.x, q.y, q.z]
        frames.append({"frame": f, "positions": positions, "rotations": rotations})

    return {
        "file": str(path),
        "fps": fps,
        "frame_count": f1 - f0 + 1,
        "frame_start": f0,
        "frame_end": f1,
        "armature": armature.name,
        "bones_resolved": resolved,
        "bones_unresolved": [k for k in BONE_ALIASES if k not in resolved],
        "frames": frames,
    }


def main():
    argv = sys.argv
    if "--" not in argv:
        print("Usage: blender --background --python analyze.py -- <source.fbx> [retargeted.fbx|.glb]")
        sys.exit(1)
    args = argv[argv.index("--") + 1:]
    if not args:
        print("ERROR: no input file")
        sys.exit(1)

    out_dir = Path("/tmp/motion-audit")
    out_dir.mkdir(parents=True, exist_ok=True)

    for path_str in args:
        path = Path(path_str).expanduser().resolve()
        if not path.exists():
            print(f"ERROR: {path} not found")
            continue
        print(f"[analyze] loading {path}")
        data = extract(path)
        out_path = out_dir / f"{path.stem}.json"
        with open(out_path, "w") as f:
            json.dump(data, f)
        print(f"[analyze] wrote {out_path} ({data['frame_count']} frames, {len(data['bones_resolved'])} bones resolved)")


if __name__ == "__main__":
    main()
