"""
Motion classifier — infers posture/action class from extracted JSON.

Input: /tmp/motion-audit/<stem>.json (from analyze.py)
Output: classification dict with label, confidence, signals, and filename hints.

Classes:
  - standing      : upright, minimal locomotion
  - locomotion    : walking/running/limping (upright + root traveling + stance alternation)
  - jumping       : has airborne frames (both feet above ground threshold simultaneously)
  - sitting       : hips low, feet at ground, head elevated
  - lying         : head, hips, feet all at similar low height
  - unknown       : can't classify with confidence
"""
import json, math, re, sys
from pathlib import Path

UP = 2  # Z-up (Blender convention)

FILENAME_HINTS = {
    "limp": "locomotion", "walk": "locomotion", "run": "locomotion", "stride": "locomotion",
    "jump": "jumping", "leap": "jumping", "hop": "jumping",
    "sit": "sitting", "seated": "sitting", "kneel": "sitting",
    "lay": "lying", "lie": "lying", "prone": "lying", "supine": "lying",
    "stand": "standing", "stnd": "standing", "idle": "standing", "pose": "standing",
}


def parse_filename_hint(path):
    """Extract motion-class hint from filename tokens."""
    stem = Path(path).stem.lower()
    # Split on underscore and camelcase boundaries
    tokens = re.findall(r"[a-z]+", re.sub(r"([A-Z])", r" \1", Path(path).stem).lower())
    for t in tokens:
        if t in FILENAME_HINTS:
            return {"label": FILENAME_HINTS[t], "token": t}
    # Substring scan as fallback
    for keyword, label in FILENAME_HINTS.items():
        if keyword in stem:
            return {"label": label, "token": keyword}
    return None


def classify_from_data(frames):
    """Infer class from position data."""
    N = len(frames)

    def mean_z(bone):
        ys = [f["positions"].get(bone, [0,0,0])[UP] for f in frames]
        return sum(ys) / len(ys)

    def pos(bone, i):
        return frames[i]["positions"].get(bone)

    head_z = mean_z("head")
    hips_z = mean_z("hips")
    lfoot_z = mean_z("leftFoot")
    rfoot_z = mean_z("rightFoot")
    ground = min(min(f["positions"]["leftFoot"][UP], f["positions"]["rightFoot"][UP]) for f in frames)
    height = abs(frames[0]["positions"]["head"][UP] - frames[0]["positions"]["leftFoot"][UP])

    # Signals
    head_above_feet = head_z - (lfoot_z + rfoot_z) / 2
    hips_above_feet = hips_z - (lfoot_z + rfoot_z) / 2
    head_above_hips = head_z - hips_z

    # Airborne frames: both feet above threshold AND rising
    threshold = ground + 0.1 * height  # 10% of height
    airborne_frames = 0
    for f in frames:
        lf = f["positions"].get("leftFoot"); rf = f["positions"].get("rightFoot")
        if lf and rf and lf[UP] > threshold and rf[UP] > threshold:
            airborne_frames += 1
    airborne_ratio = airborne_frames / N

    # Root travel
    hips_start = frames[0]["positions"]["hips"]
    hips_end = frames[-1]["positions"]["hips"]
    horiz_travel = math.sqrt(
        (hips_end[0] - hips_start[0])**2 + (hips_end[1] - hips_start[1])**2
    )

    # Stance asymmetry
    speed_thresh = 0.005
    def stance_count(bone):
        cnt = 0
        for i in range(1, N):
            p1 = pos(bone, i); p0 = pos(bone, i-1)
            if p1 and p0:
                speed = math.sqrt(sum((p1[k]-p0[k])**2 for k in range(3)))
                if p1[UP] <= ground + 0.05 * height and speed < speed_thresh:
                    cnt += 1
        return cnt
    stance_L = stance_count("leftFoot")
    stance_R = stance_count("rightFoot")
    stance_asym = abs(stance_L - stance_R) / max(1, max(stance_L, stance_R))

    signals = {
        "height_m": round(height, 3),
        "head_above_feet_m": round(head_above_feet, 3),
        "hips_above_feet_m": round(hips_above_feet, 3),
        "head_above_hips_m": round(head_above_hips, 3),
        "horiz_travel_m": round(horiz_travel, 3),
        "airborne_ratio": round(airborne_ratio, 3),
        "stance_L": stance_L,
        "stance_R": stance_R,
        "stance_asymmetry": round(stance_asym, 3),
    }

    # Decision tree (thresholds are heuristic; tune with more data)
    # Lying: head barely above feet, everything near ground
    if head_above_feet < 0.3 * height and head_above_hips < 0.2 * height:
        return {"label": "lying", "confidence": 0.85, "signals": signals}

    # Sitting: head elevated but hips much lower than standing height
    if hips_above_feet < 0.4 * height and head_above_feet > 0.5 * height:
        return {"label": "sitting", "confidence": 0.8, "signals": signals}

    # Jumping: significant airborne fraction
    if airborne_ratio > 0.15:
        return {"label": "jumping", "confidence": 0.85, "signals": signals}

    # Locomotion: upright + root traveling + feet alternating in stance
    if head_above_feet > 0.75 * height and horiz_travel > 0.3 * height and (stance_L > 5 or stance_R > 5):
        label = "locomotion"
        # Sub-type hint
        sub = None
        if stance_asym > 0.2:
            sub = "asymmetric (limp/injury)"
        elif horiz_travel / N * 30 > 2.0:  # ~2 m/s
            sub = "running"
        else:
            sub = "walking"
        return {"label": "locomotion", "sub": sub, "confidence": 0.9, "signals": signals}

    # Standing: upright + minimal travel
    if head_above_feet > 0.75 * height and horiz_travel < 0.2 * height:
        return {"label": "standing", "confidence": 0.8, "signals": signals}

    return {"label": "unknown", "confidence": 0.3, "signals": signals}


def classify(json_path):
    d = json.load(open(json_path))
    data_cls = classify_from_data(d["frames"])
    name_hint = parse_filename_hint(d["file"])
    match = None
    if name_hint:
        match = (name_hint["label"] == data_cls["label"])
    return {
        "file": d["file"],
        "filename_hint": name_hint,
        "inferred": data_cls,
        "hint_matches_data": match,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 classify.py <path/to/extracted.json>")
        sys.exit(1)
    result = classify(sys.argv[1])
    print(json.dumps(result, indent=2))
