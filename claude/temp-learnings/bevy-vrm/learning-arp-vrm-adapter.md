---
title: "ARP → VRM 어댑터 레이어"
tags: [bevy-vrm, retarget, arp, vrm, architecture, rest-alignment, adapter-pattern]
created: 2026-04-10
---

# ARP → VRM 어댑터 레이어

ARP(Auto-Rig Pro, Blender) rig 에서 온 FBX 애니메이션을 VRM 캐릭터에 리타게팅할 때 **rest pose 불일치** 를 해결하는 전용 어댑터 레이어.

## 문제 정의

두 rig 의 **"0 지점"(rest pose) 정의가 다름**:

| Rig | 손가락 rest 관례 | 예시 |
|-----|------------------|------|
| ARP (Blender) | 살짝 curl 된 "relaxed hand" | 손가락 20-30° 구부림 |
| VRM (VRoid) | 쫙 폄 "straight" | ≈ identity |

두 rig 모두 자기 rest 를 "0" 으로 삼고 애니메이션을 저장. FBX 파일의 animation curve 는 절대값(Lcl_Rotation override) 이지만, 리타게터는 `delta = rest_inv × absolute` 로 변환해서 "rest 대비 얼마나 벗어났나" 를 다룸.

Standing 애니메이션처럼 **rest 에 가까운 포즈** 를 재생하면:
- ARP: `ARP_rest(curl) + delta(≈0) = curl` → 시각적으로 자연스러움
- VRM: `VRM_rest(straight) + delta(≈0) = straight` → 시각적으로 일자, 뭉친 것처럼 보임

Body 본 (팔, 다리) 은 standing 때 델타가 커서 rest 불일치가 묻히지만, **finger 본은 델타가 작아서 불일치가 그대로 드러남**.

## 해결 전략 — Rest Alignment

VRM 의 rest 를 load-time 1회 **ARP rest 로 치환**. 그 뒤 일반 delta retarget 공식을 그대로 쓰면 두 rig 가 같은 "0 지점" 을 공유.

```
[수정 전]
VRM load  : dst_rest_local = VRM_node_rotation (straight)
retarget  : local = VRM_straight × delta
결과       : VRM 이 자기 rest 모양으로 남음

[수정 후]
VRM load  : dst_rest_local = ARP_src_rest (curl)      ← bridge 가 override
retarget  : local = ARP_curl × delta                  ← 공식 그대로
결과       : VRM 이 ARP rest 모양으로 시작, 델타는 정상 적용
```

### Absolute mapping 과의 차이

초기엔 "finger 만 absolute mapping" 을 검토했다가 기각함:

| | Absolute mapping (기각) | Rest alignment (채택) |
|---|---|---|
| 적용 시점 | 매 프레임 | init 1회 |
| 공식 변경 | 본 종류별 분기 | 공식 그대로 |
| body/finger 코드 | 분리 | 통일 |
| delta 의미 | 사라짐 | 그대로 유지 |
| 유지보수 비용 | 높음 | 낮음 |
| 원복 | 어려움 | 쉬움 (init 값 복구) |

같은 시각 결과를 **훨씬 작은 변경** 으로 달성.

## 축 가정 — 어댑터를 단순화하는 핵심 사실

`normalize_vrm_bones_180y` 로 변환된 VRM 과 Blender FBX(Y-up export) 는 **동일 좌표계**:

- Both: Y-up, -Z forward
- `coord_rot = identity` 로 취급 가능

이 경우 rest alignment 가 극단적으로 단순:

```rust
// finger 본에 대해
dst_rest_local_new = src_rest    // FBX 의 local rest 를 그대로 복사
```

복잡한 conjugation 없음. 직접 복사.

**단 bone-internal 축**(본의 "길이 방향" 이 local X/Y/Z 중 어느 축인지) 이 두 rig 에서 같은지는 실측 검증 필요. VRM leftIndexProximal translation `(0.0725, 0.0082, 0.0217)` → X 가 길이 방향. ARP 도 동일하면 직접 복사 OK.

## 아키텍처 위치

```
crates/cinev_retarget/src/
├── retargeter.rs          ← 일반 공식 (불변)
├── mapping.rs             ← FBX 파싱 (불변)
├── vrm_rest.rs            ← VRM 파싱 (불변)
└── adapters/               ← ★ 신규 ★
    ├── mod.rs
    └── arp_vrm.rs         ← ARP rest → VRM rest 정렬
```

**핵심 원칙**: 일반 retarget 은 다른 FBX 소스(Mixamo, Unity HumanIK, 직접 export 등) 도 처리해야 하므로 **절대 불변**. ARP 특화 로직은 반드시 별도 모듈에.

## adapters/arp_vrm.rs 책임

1. **Detect** — 현재 FBX 가 ARP rig 인지 판별
   - `config.source_type == FbxSourceType::Blender`
   - 또는 본 명명 패턴 (`c_index_01.l` 등)
2. **Align rest** — finger 본(확장 가능한 본 집합) 의 `dst_rest_local` 을 `src_rest` 로 override
3. **Propagate** — 자식 본의 `dst_rest_global` 재계산해서 chain consistency 유지
4. **Validate** — 정렬 후 chain 이 anatomically valid 한지 체크 (자기 부모 넘어서지 않기, 회전량 합리적 범위)
5. **Feature gate** — feature flag 또는 config 로 on/off 가능

## 초기 범위 — 손가락만

MVP 는 **손가락 30본** 에만 적용. 이유:
- 손가락은 rest 불일치가 가장 명확 (standing 에서 델타 0)
- body 는 이미 delta 가 커서 시각적으로 OK → 건드리면 회귀 위험
- 30본 범위 검증 후 다른 본으로 확장 결정

## 확장 가능성

나중에 필요하면 추가:
- **엄지 metacarpal** — VRM 1.0 과 0.x 본 이름 차이 (Proximal↔Metacarpal 한 칸 밀림)
- **허리/척추** — S 곡선 vs 직선 차이
- **발가락** — standing 에서 유사 이슈 가능
- **목/턱** — 포즈 차이 큼

## 구현 단계

### Step 1: 한 본 하드코딩 검증
```rust
// retargeter.rs:Retargeter::new init 루프 안
let dst_rest_local_final = if vrm_name == "leftIndexIntermediate" {
    track.src_rest   // 실험
} else {
    vrm_rest.bone_rest_local.get(vrm_name).copied().unwrap_or(Quat::IDENTITY)
};
```

F8 preset 으로 뷰어 띄우고 leftIndexIntermediate 만 ARP 처럼 굽는지 시각 확인.

### Step 2: 30 본 전체 적용 (adapters/arp_vrm.rs)
Step 1 성공 시:
```rust
pub fn align_arp_finger_rest(
    vrm_rest: &mut VrmRestPose,
    bone_tracks: &[BoneTrack],
) {
    for track in bone_tracks {
        if is_finger(&track.vrm_bone_name) {
            vrm_rest.bone_rest_local.insert(
                track.vrm_bone_name.clone(),
                track.src_rest,
            );
            // TODO: propagate to bone_rest_global
        }
    }
}
```

### Step 3: 스코어링 통합
`arp2vrm-score` 가 어댑터 on/off 둘 다 지원:

```
arp2vrm-score verify <fbx>              # 기본: 어댑터 ON
arp2vrm-score verify <fbx> --no-adapter  # 디버그: 어댑터 OFF
arp2vrm-score score  <fbx> --compare    # 두 모드 비교 (정렬 효과 측정)
```

새 metric:
- `rest_mismatch°` — FBX rest 와 VRM rest 의 각도 차이
- `alignment_delta°` — 어댑터 적용 후 rotation 변화량

### Step 4: 시각 회귀 테스트
`dump-vrm-transforms` CLI 를 확장해서 "어댑터 적용 후 finger GlobalTransform" 을 덤프. 기준 스냅샷과 비교.

## 실패 시나리오 대비

### Step 1 에서 해당 본이 여전히 straight
→ entity Transform 이 AnimationPlayer 에 의해 재설정되는 타이밍 문제. runtime 덤프 필요.

### Step 1 에서 굽는데 방향이 이상
→ bone-internal 축이 다름. conjugation 공식 추가:
```rust
dst_rest_local_new = bone_axis_swap × src_rest × bone_axis_swap.inverse()
```

### Step 2 에서 chain 이 깨짐 (자식 본이 허공 떠다님)
→ `dst_rest_global` propagation 이 빠짐. child 본의 global rest 를 parent_new × child_local 로 재계산 필요.

## 메모리 연결

- [[project_arp_retarget_redesign]] — ARP retarget crate 전체 redesign. 이 어댑터 레이어가 첫 조각.
- [[feedback_ik_retarget_approach]] — IK retarget: layer separation. 이 어댑터도 같은 철학 (generic 공식과 ARP 특화 로직 분리).

## 검증 도구 (이미 존재)

- `finger-fbx-dump` — FBX 의 rest/delta 측정
- `dump-vrm-transforms` — bevy entity Transform 덤프
- `arp2vrm-score verify/score` — 수치 스코어링

어댑터 구현 전후로 이 세 도구의 출력을 기록해두면 회귀 감지 가능.

## 참고

- [[devlog-2026-04-10]] — 이 아키텍처에 도달한 과정
- [[learning-rms-error-metric]] — 스코어링 metric
- [[learning-vrm-humanoid-bones]] — 본 테이블 (30 finger)
- [[learning-skeleton-remap]] — 본 이름 매핑
