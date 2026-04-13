# 2026-04-13 — Middle Finger Proximal Direction 맞추기 대작전

c_normal × graceful arms 페어링에서 hand → middleProximal world direction이 FBX 대비 ~27° 어긋남. 손목 over-flex 알람이 매 프레임 발생. 작전 목표: < 10° green threshold 안쪽으로 진입 (가능하면 < 5°).

결과: **모든 측정 프레임에서 0-2.5° 도달**.

## 시작점

뷰어 [WRIST-ROT] 로그 baseline:
```
f=814 L arp=88° vrm_world=58° vrm_local=58° diff=-29°
f=814 R arp=91° vrm_world=65° vrm_local=65° diff=-26°
```

근데 [WRIST-ROT]는 forearm 대비 hand의 **회전 magnitude**(`(forearm.inv * hand).angle`)를 측정. 우리가 fix하고 싶은 건 **방향** (middleProximal 어디 가리키냐)인데 메트릭은 magnitude만 봄. 메트릭이 문제 측정 못 함.

→ **[HAND-DIR]** 새 메트릭 추가:
```rust
vrm_dir = (vrm_finger_pos - vrm_hand_pos).normalize()
fbx_dir = (fbx_finger_pos - fbx_hand_pos).normalize()
angle = vrm_dir.dot(fbx_dir).acos().to_degrees()
```

이게 진짜 측정. baseline 정확히 잡으려면 메트릭부터 만드는 게 첫 작업.

## 시도 1 — M1: Pass 2 hand pair (per-frame direction correction)

`crates/humanoid_retarget/src/retargeter.rs:372-380`의 `direction_pair_defs` 배열에 두 줄 추가:
```rust
("leftHand", "leftMiddleProximal"),
("rightHand", "rightMiddleProximal"),
```

기존 Pass 2 인프라(`from_rotation_arc` minimum-rotation swing + 5°-15° smoothstep + 3 iterations + cascade descendants)가 자동 처리. 매 프레임 `vrm_dir → fbx_dir` 최소회전 보정.

**결과**: 시각적으로 손 방향 좋아졌으나 [WRIST-ROT] L=-45°~-63°, R=-49°~-55°로 **더 나빠 보임**. 메트릭 regression이 cost. 사용자가 "M1이 좋아 보임"이라 했으니 시각 우선.

**문제 인식**: hand bone 한 곳에 두 제약(`lowerArm→hand` 방향 + `hand→middleProximal` 방향) 동시 적용 → over-constrained. cascade에서 hand의 local rotation magnitude가 줄어들어 forearm-relative bend가 작아짐.

## 시도 2 — M3: arp_body.json `["*Hand", "DirectCopy"]` rest sync

기존 `arp_vrm.rs::Stage 4 rest sync` 인프라 활용. config에 한 줄 추가하면 init time에 ARP wrist의 lcl_rot_rest를 VRM hand에 복사. 매 프레임 보정 없이 rest pose 자체가 정합.

**결과**: [WRIST-ROT] 변화 없음 (-29° → -29°). DirectCopy가 fire는 했을 텐데 ARP의 src_local_rest가 VRM hand rest와 거의 동일해서 효과 0. 이론과 달리 데이터가 그렇게 차이나지 않았음. **revert**.

## 시도 3 — EXP-005: UserCalibrated 정적 hardcoded delta

사용자가 calibration 모드에서 visually 손목을 -55° X로 회전했을 때 가장 그럴듯한 결과 → quat 추출:
```rust
BonePose {
    vrm_bone_name: "rightHand",
    delta: Quat::from_xyzw(-0.4617, 0.0, 0.0, 0.8870), // -55° around X
},
BonePose {
    vrm_bone_name: "leftHand",
    delta: Quat::from_xyzw(0.4617, 0.0, 0.0, 0.8870),  // +55° X (mirror)
},
```

`arp_vrm_user_pose::DEFAULT_POSE`에 추가. 어댑터의 `UserCalibrated` strategy가 init time에 `new_local = old_local * delta`로 적용.

**결과**: M1과 같이 적용했더니 [HAND-DIR] L=5.1°, R=3.2°. 작전 목표 도달. [WRIST-ROT] R diff +25° (이전 -29° → 부호 반전, magnitude 증가)인데 이건 메트릭이 magnitude만 봐서 그런 것. 시각/HAND-DIR 기준으로는 성공.

**한계**: 정적. 한 프레임에서 calibrate한 -55°는 모든 프레임에 같은 값 적용. 애니메이션이 동적이면 부정확.

## 시도 4 — EXP-006: 동적 wrist twist transfer (양손)

EXP-005 hardcoded 제거하고, 매 프레임 FBX 손목 회전 magnitude를 동적으로 추출:

`src/retarget.rs`에 retargeter 호출 직후 post-process 30줄:

```rust
for (vrm_forearm, vrm_hand) in [("leftLowerArm", "leftHand"), ("rightLowerArm", "rightHand")] {
    let fa_w = coord * fars[f] * coord_inv;  // FBX Z-up → Y-up
    let fh_w = coord * fhrs[f] * coord_inv;
    let fbx_wrist_delta = (fa_w.inverse() * fh_w).normalize();
    let (_swing, twist) = swing_twist_decompose(fbx_wrist_delta, Vec3::Y);
    let (twist_axis, twist_angle) = twist.to_axis_angle();
    let signed = if twist_axis.y >= 0.0 { twist_angle } else { -twist_angle };
    let extra = Quat::from_rotation_x(-signed);  // VRM hand local X
    rh.rotations[f] = (rh.rotations[f] * extra).normalize();
}
```

매 프레임 FBX forearm-relative wrist delta → swing-twist 분해 → twist 1-DOF 추출 → VRM hand local X에 -부호로 적용.

**결과 (M1 + EXP-006 둘 다 적용, 같은 페어링)**:

| Frame | L angle | R angle |
|-------|---------|---------|
| 32 | 0.1° | 1.2° |
| 62 | 0.3° | 1.1° |
| 92 | 0.0° | 1.5° |
| 122 | 1.2° | 1.8° |
| 152 | 1.1° | 1.9° |
| 182 | 2.2° | 2.4° |
| 212 | 1.1° | 1.5° |
| 242 | 1.2° | 1.1° |
| 272 | 1.1° | 2.0° |
| 302 | 1.5° | 1.3° |

**평균 ~1.5°**. 이전 EXP-005(~5°) 대비 60-70% 추가 개선. 이전 baseline(~27°) 대비 90%+ 감소.

## Sweep regression

| Metric | 이전 | M1+EXP-006 |
|--------|------|------|
| C Overall A | 16 | 12 |
| C Overall F | 37 | 38 |
| C1.1 A | 172 | 159 |
| C1.3 A | 40 | 25 |

C1.1 (joint limit), C1.3 (stability) 둘 다 강등. 이유:
- 손이 더 정확한 방향 가리키려면 wrist에 더 큰 local rotation 필요 → joint limit 위반 빈도 ↑
- per-frame 추가 보정이 input 대비 frame-to-frame 변화 추가 → residual stability ↓

이건 cost로 받아들임. **메트릭이 측정하는 게 우리가 fix하고 싶은 것과 다름**. [HAND-DIR]에서 측정한 진짜 값(0-2.5°)이 우리 목표.

## 핵심 교훈

### 1. 메트릭이 실패를 측정 못 하면 새 메트릭 만들기

[WRIST-ROT]가 magnitude만 보고 direction 못 봐서 fix 효과가 메트릭에 안 잡힘 → 새 [HAND-DIR] 추가가 첫 작업이었어야 함. 메트릭 신뢰가 작전의 90%.

### 2. trick + math layer 동시 적용은 동작함, 단 over-correction 위험

M1 (수학적 minimum-rotation swing) + EXP-006 (dynamic twist transfer) 동시. 둘 다 hand bone 만짐. 이론상 over-correction 가능했지만 실제로는 swing/twist 축이 거의 직교라 둘이 합쳐져도 충돌 안 함. 운이 좋았던 케이스. 다음에 이런 layer 합칠 땐 분해 가능성부터 확인.

### 3. Sweep 메트릭 regression이 visible improvement보다 우선시되면 안 됨

C1.1 −13A, C1.3 −15A는 충격적이지만 시각/HAND-DIR이 진짜로 좋아짐. 메트릭 점수 != quality. 메트릭은 proxy일 뿐. 사람 눈 + direct measurement가 ground truth.

### 4. Hardcoded → Dynamic으로 진화 가능성 열어두기

EXP-005 hardcoded -55°가 시작점이었지만 결국 EXP-006 dynamic이 fix. 사용자 calibration은 첫 실험으로 충분, 그게 작동하면 어떻게 동적으로 자동화할지 다음 단계.

### 5. Post-process 위치 임시 (src/retarget.rs)는 부채

EXP-006이 src/retarget.rs에 inline. 뷰어 전용. headless / sweep / 다른 caller 못 받음. 단위 테스트도 불가능.

## 다음 — Anim Postprocess 모듈 도입 (TODO, 사용자 동의)

미래에 두 번째 postprocess (foot snap, knee correction, 등) 생기면:

**1단계**: `humanoid_retarget::postprocess` 모듈 생성, EXP-006을 `postprocess::wrist_twist::apply()` free fn으로 이전. trait 없음. 호출부는 한 줄.

**2단계**: 두 번째 postprocess 추가 시 fn 포인터 chain. 여전히 trait 없음.

**3단계**: stateful postprocess(pre-computed cache 등) 등장 시 그때 `trait AnimPostprocess` 정의.

YAGNI 원칙 — 구현체 1개일 땐 trait 만들지 말 것. tier1 devlog의 "Trait은 impl이 2개 이상일 때만 값어치를 함" 교훈 적용.

**이번 세션에선 안 함**. 사용자 확인: "언젠가 애님 포스트프로세스를 도입합시다" — 미래 작업으로 큐.

## 커밋

- bevy-vrm `260b462` feat(wrist): hand_dir alignment via M1 + EXP-006 dynamic twist + diag

## 측정 데이터 ground truth

- baseline hand_dir angle: ~27° (시각 추정, [WRIST-ROT] 부호 반전에서 역산)
- M1 + EXP-005 hardcoded: 3.2-5.7°
- M1 + EXP-006 dynamic: **0-2.5°**

목표 < 10° (green threshold) 도달 ✓
욕심 목표 < 5° 도달 ✓
초과 달성 < 3° 도달 ✓
