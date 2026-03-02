# VMD Binary Format Reference

## File Structure

| Section | Description |
|---------|-------------|
| Header | 30 bytes magic + 20 bytes model name |
| Bone keyframes | uint32 count + N × 111 bytes |
| Morph keyframes | uint32 count + N × 23 bytes |
| Camera keyframes | uint32 count + N × 61 bytes |
| Light keyframes | uint32 count + N × 28 bytes |
| Shadow keyframes | uint32 count + N × 9 bytes |
| IK keyframes | uint32 count + variable |

## Header (50 bytes)

| Offset | Size | Type | Description |
|--------|------|------|-------------|
| 0 | 30 | char[] | Magic: `"Vocaloid Motion Data 0002"` (Shift_JIS, null-padded) |
| 30 | 20 | char[] | Model name (Shift_JIS, null-padded) |

## Bone Keyframe (111 bytes each)

| Offset | Size | Type | Description |
|--------|------|------|-------------|
| 0 | 15 | char[] | Bone name (Shift_JIS, null-padded) |
| 15 | 4 | uint32 LE | Frame number |
| 19 | 4 | float32 LE | Position X |
| 23 | 4 | float32 LE | Position Y |
| 27 | 4 | float32 LE | Position Z |
| 31 | 4 | float32 LE | Rotation quaternion X |
| 35 | 4 | float32 LE | Rotation quaternion Y |
| 39 | 4 | float32 LE | Rotation quaternion Z |
| 43 | 4 | float32 LE | Rotation quaternion W |
| 47 | 64 | bytes | Interpolation curves (4 × 4 Bezier control points) |

## Morph Keyframe (23 bytes each)

| Offset | Size | Type | Description |
|--------|------|------|-------------|
| 0 | 15 | char[] | Morph name (Shift_JIS) |
| 15 | 4 | uint32 LE | Frame number |
| 19 | 4 | float32 LE | Weight (0.0–1.0) |

---

## Common MMD Bone Names

### Core
| Japanese | English | Role |
|----------|---------|------|
| センター | Center | Root translation |
| 上半身 | Upper Body | Torso |
| 下半身 | Lower Body | Hips |
| 首 | Neck | Neck |
| 頭 | Head | Head |

### Left Arm
| Japanese | English |
|----------|---------|
| 左肩 | Left Shoulder |
| 左腕 | Left Upper Arm |
| 左ひじ | Left Elbow |
| 左手首 | Left Wrist |

### Right Arm
| Japanese | English |
|----------|---------|
| 右肩 | Right Shoulder |
| 右腕 | Right Upper Arm |
| 右ひじ | Right Elbow |
| 右手首 | Right Wrist |

### Left Leg
| Japanese | English |
|----------|---------|
| 左足 | Left Leg |
| 左ひざ | Left Knee |
| 左足首 | Left Ankle |
| 左つま先 | Left Toe |

### Right Leg
| Japanese | English |
|----------|---------|
| 右足 | Right Leg |
| 右ひざ | Right Knee |
| 右足首 | Right Ankle |
| 右つま先 | Right Toe |

### Fingers (Left — same pattern for 右)
| Japanese | English |
|----------|---------|
| 左親指１/２ | Left Thumb 1/2 |
| 左人指１/２/３ | Left Index 1/2/3 |
| 左中指１/２/３ | Left Middle 1/2/3 |
| 左薬指１/２/３ | Left Ring 1/2/3 |
| 左小指１/２/３ | Left Pinky 1/2/3 |

### IK / Eyes
| Japanese | English |
|----------|---------|
| 左足ＩＫ | Left Leg IK |
| 右足ＩＫ | Right Leg IK |
| 左つま先ＩＫ | Left Toe IK |
| 右つま先ＩＫ | Right Toe IK |
| 両目 | Both Eyes |
| 左目 | Left Eye |
| 右目 | Right Eye |

---

## Analysis Techniques

### Quaternion to Angle
```js
angle_degrees = 2 * Math.acos(Math.min(1, Math.abs(qw))) * (180 / Math.PI);
```
This gives the total rotation angle from rest pose. For elbows, this is the bend angle.

### Angular Velocity (per frame)
```js
// Quaternion delta between frames
const inv = quatConjugate(prev);
const delta = quatMultiply(curr, inv);
const angularDelta = 2 * Math.acos(Math.min(1, Math.abs(delta.qw))) * (180 / Math.PI);
```

### SLERP Interpolation
Used to get smooth values between sparse keyframes:
```js
function slerp(a, b, t) {
  let dot = a.qx*b.qx + a.qy*b.qy + a.qz*b.qz + a.qw*b.qw;
  if (dot < 0) { b = negate(b); dot = -dot; }
  if (dot > 0.9995) return lerp(a, b, t); // nearly identical
  const theta = Math.acos(dot);
  const sinT = Math.sin(theta);
  return weighted(a, Math.sin((1-t)*theta)/sinT, b, Math.sin(t*theta)/sinT);
}
```

### Arm Straightness (world-space, requires skeleton)
```js
const upperDir = elbowPos.sub(shoulderPos).normalize();
const foreDir = wristPos.sub(elbowPos).normalize();
const dot = upperDir.dot(foreDir);
const armStraight = dot > 0.95; // ~18° from straight
```

### Extension Detection Pattern
Track elbow angle and detect bent→straight transitions:
1. Mark `wasBent = true` when elbow angle > threshold (e.g., 40°)
2. Mark extension when angle drops below straight threshold (e.g., 15°)
3. Record peak angle during bent phase for filtering
