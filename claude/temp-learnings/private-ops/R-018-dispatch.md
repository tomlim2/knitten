# 작업 지시: R-018 전신 rest pose audit + validator 보강

너는 2호기다. bevy-vrm 레포에서 작업한다.

## 사전 준비
- 브랜치: `feat/blender-source-type` (R-017 작업 브랜치 이어서)
- 레포: ~/Desktop/www/bevy-vrm

## 규칙
- **소스 애니메이션 절대 수정 금지.**
- **커밋하지 마라.** 코드만 작성. 커밋은 1호기(지통실)가 한다.
- **기존 테스트 깨뜨리지 마라.**

## 배경

현재 `rest_pose_offsets`에 6개 본만 수동 입력돼 있다:
```json
"rest_pose_offsets": {
    "leftShoulder": [0.0, 0.0, 0.38],
    "leftUpperArm": [0.0, 0.0, 0.71],
    "rightShoulder": [0.0, 0.0, -0.38],
    "rightUpperArm": [0.0, 0.0, -0.71],
    "leftHand": [-0.67, 0.1, -0.08],
    "rightHand": [0.99, 0.2, -0.05]
}
```

MetaHuman A-pose에서 lowerArm도 전방 굴곡이 있는데 빠져 있다. 다른 본도 누락됐을 수 있다. `direct_map`에 있는 모든 본에 대해 전수 측정이 필요하다.

**중요:** `retargeter.rs:414-418`에서 `rest_pose_offsets`는 **VRM 0.x에서만 적용**된다. VRM 1.0은 three-vrm formula가 dst rest를 처리하므로 수동 offset 불필요. 따라서 이 작업은 **VRM 0.x 리타겟 품질**에 직접 영향.

## 할 일

### 1. 전신 rest pose 측정 도구 작성

headless CLI(`crates/cinev_retarget/src/bin/headless.rs`)에 `--dump-rest-pose` 모드를 추가하거나, 별도 테스트로 작성.

**측정할 것:** MetaHuman FBX(CINEV Rush 또는 T2M)의 `direct_map`에 있는 모든 본에 대해:
- FBX PreRotation (Euler degrees)
- FBX Lcl Rotation rest (Euler degrees)
- 합산 rest quaternion
- VRM T-pose 기준과의 delta angle (degrees)

사용 가능한 FBX 파일:
- `assets/fbx/25_06672_F_DNTSuperSukiShukiRush_260113.fbx` (CINEV Maya)
- `assets/fbx/t2m_f_walk.fbx` (T2M Blender)
- `assets/fbx/t2m_m_walk.fbx` (T2M Blender male)

사용 가능한 config:
- `assets/retarget/cinev_female_body.json`
- `assets/retarget/cinev_male_body.json`
- `assets/retarget/cinev_blender_female.json`
- `assets/retarget/cinev_blender_male.json`

**delta 계산 방법:** VRM T-pose에서 각 본의 기대 rest rotation은 identity(0,0,0). MetaHuman A-pose에서의 실제 rest rotation과의 각도 차이를 계산.

단, FBX 본의 rest = PreRotation * euler_to_quat(Lcl Rotation). 이건 `fbx.rs`의 `FbxBone`에 이미 있다:
- `bone.pre_rotation` — PreRotation as Quat
- `bone.rest_rotation_euler` — Lcl Rotation as Vec3 (degrees)

### 2. 전수 결과 테이블 출력

테스트 또는 CLI 출력으로 다음 테이블을 생성:

```
| FBX bone | VRM bone | PreRot (deg) | LclRot (deg) | Rest Quat | Delta (deg) | Current Offset | Status |
```

- `Delta > 1°`이고 `Current Offset = none`이면 **MISSING**
- `Delta > 1°`이고 `Current Offset != none`이면 offset 적용 후 잔차 계산 → **OK** 또는 **INACCURATE**
- `Delta <= 1°`이면 **OK** (offset 불필요)

이 결과를 `~/.claude/private/ops/R-018-result.md`에 쓸 것.

### 3. rest_pose_offsets 자동 생성

측정 결과에서 `delta > 1°`인 본에 대해 올바른 offset 값을 계산하고, 완성된 `rest_pose_offsets` JSON을 출력.

**주의:** offset은 Euler radians [x, y, z] 형식 (config.rs 참고). 현재 값이 맞는지도 검증.

### 4. fidelity validator에 rest pose 검증 추가

`crates/cinev_retarget/src/retargeter.rs`의 `RetargetQuality` / `diagnostics()`에 추가:

- `rest_pose_missing_offsets: Vec<(String, f32)>` — offset 없는데 delta > 1°인 본 목록 (본이름, delta각도)
- diagnostics()에서 warning 출력: `"rest_pose: {bone} has {delta}° offset but no rest_pose_offset configured"`
- 이건 VRM 0.x일 때만 체크 (VRM 1.0은 three-vrm이 처리)

### 5. 테스트

```rust
// VRM 0.x에서 rest pose offset 완전성 검증
#[test]
fn rest_pose_completeness_check() {
    // CINEV Rush + female config + VRM 0.x
    // diagnostics에 rest_pose_missing_offsets가 있으면 어떤 본이 빠졌는지 확인
}
```

## 완료 조건

1. `cargo test -p cinev_retarget` — 전부 통과
2. `cargo clippy -p cinev_retarget -- -D warnings` — 경고 없음
3. 전신 rest pose 측정 테이블이 `~/.claude/private/ops/R-018-result.md`에 작성됨
4. lowerArm을 포함해 누락된 본이 식별됨
5. 자동 생성된 완전한 rest_pose_offsets JSON이 result에 포함됨
6. validator가 누락된 offset에 대해 warning 출력

## 보고

결과를 `~/.claude/private/ops/R-018-result.md`에 써라. 포함할 내용:
- 전신 rest pose 측정 테이블
- 누락된 본 목록 + delta 각도
- 자동 생성된 rest_pose_offsets JSON (female + male)
- cargo test 결과
- cargo clippy 결과
