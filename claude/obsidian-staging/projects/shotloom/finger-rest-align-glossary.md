---
title: "Shotloom Finger Rest Alignment 용어 정리"
tags:
  - shotloom
  - normalizer
  - retarget
  - finger
  - vrm
  - arp
  - glossary
created: 2026-04-29
source: claude
---

# Shotloom Finger Rest Alignment 용어 정리

ARP(Auto-Rig Pro) FBX 모션을 VRM 캐릭터에 리타겟할 때, 손가락(엄지 제외 four fingers)이 어색하게 보이지 않도록 VRM rest pose 를 사전 정렬하는 로직의 용어 모음. 코드 위치: `crates/shotloom-character-model-normalizer/src/finger_axis_map.rs` + `finger_rest_align.rs`.

> [!info] Scope
> Four fingers (= index, middle, ring, little/pinky) 만 다룸. **Thumb 은 별도 트랙** — `c_thumb*` 본은 multi-axis rest (carpometacarpal coupling) 라 동일 알고리즘 적용 불가.

---

## Bone-internal axis convention

같은 손가락이라도 rig 마다 본 내부 축이 다름. 이 차이가 정렬 알고리즘 존재 이유.

| Rig | Bone length 축 (= 손가락 뻗는 방향) | Curl 축 (= 굽히는 회전축) |
| -- | -- | -- |
| **ARP** (Blender 컨벤션) | `+Y` | `≈ ±X` |
| **VRM** (glTF 컨벤션) | `±X` (left = `+X`, right = `-X`) | `≈ ±Z` (left = `-Z`, right = `+Z`) |

- "손가락 뻗는 방향" 은 두 rig 모두 본 length 축으로 표현 — 다만 알파벳 축이 다름.
- Curl 축은 본 length 축에 **수직** + **손바닥(palm) 방향** 으로 양수 회전.
- 코드: [`vrm_curl_axis_for`](finger_axis_map.rs:102) 함수가 VRM 측 hard-coded 축 반환.

---

## Baseline curl scalar

ARP rig 의 **rest pose 가 이미 가지고 있는 살짝 주먹 쥔 각도**. T-pose 라도 ARP 손가락은 완전히 펴지지 않고 자연스러운 loose-fist 자세를 기본값으로 가짐.

- 단위: **radians (positive scalar)**.
- 추출처: ARP rest local 의 `to_axis_angle()` decomposition 의 magnitude.
- 코드: `FingerAxisEntry::arp_baseline_curl_rad`.
- 의미: "ARP rest 가 0 도가 아니라 약 N 도만큼 굽어 있다" 는 정보.

> [!tip] 0 이 아닌 실수
> "null 값을 박는다" 가 아니라 **0 이 아닌 양의 라디안 각도** 가 박힌다. ARP 의 자연스러운 출발점을 VRM rest 로 옮기는 것.

---

## Stage 1: Axis matching

코드: [`finger_axis_map::compute_axis_map`](finger_axis_map.rs:156).

입력:
- ARP rest pose (RestAlignTrack 형태)
- VRM dst_rest_local / dst_rest_global

출력 per non-thumb bone (`FingerAxisEntry`):
- `arp_axis_local`: ARP curl 축 (FBX 본-local 좌표계)
- `vrm_axis_local`: VRM curl 축 (VRM 본-local 좌표계, hard-coded `vrm_curl_axis_for`)
- `arp_baseline_curl_rad`: 위의 baseline scalar

부산물: Option B 진단 로그 (모든 finger bone 대상 dry-run, thumb 포함).

### Option B (= v5): world-space transport 검산

ARP curl 축을 ARP local → world → VRM local 로 변환해 hard-coded VRM 축과 비교. 두 컨벤션 차이가 *parent chain 의 누적 world 회전* 에 살아있다는 사실을 확인하는 검증 도구.

```text
arp_axis_world  = src_global_rest * arp_axis_local
vrm_local_check = dst_rest_global.inverse() * arp_axis_world
err_deg         = angle_between(hard_axis, vrm_local_check)
```

err_deg 가 작으면 hard-coded 축이 정확하다는 신호.

---

## Stage 2: Rest pose injection

코드: [`finger_rest_align::compute_overrides`](finger_rest_align.rs:73) → [`apply_in_place`](finger_rest_align.rs:132).

핵심 연산:

```rust
new_dst_rest_local = old_dst_rest_local
    × Quat::from_axis_angle(
        entry.vrm_axis_local,         // ← VRM 자기 축
        entry.arp_baseline_curl_rad,  // ← ARP 에서 가져온 스칼라
    );
```

### 스칼라 transport, 축 보존 트릭

> [!abstract] Rule
> **얼만큼 굽었는지(magnitude)는 ARP→VRM 으로 옮기되, 어느 방향으로(axis)는 각자 rig 의 컨벤션 그대로 둔다.**

이게 v5 의 핵심. 이유:
- v1 시도: `dst_rest_local = src_rest_local` (full quaternion 복사) → 축 컨벤션 차이 무시. 잘못된 방향으로 굽힘.
- v3 증명: SO(3)→SO(3) 가정 하에선 v1 이 canonical bind-delta 와 함께 쓰이면 tautology (= no-op).
- v5: scalar 만 ℝ 통과시키고 (`signed_angle`) 축은 각자 frame → SO(3) 가정 깨짐 → 의미 있게 다른 결과.

### Topological order

`*Proximal → *Intermediate → *Distal` 순으로 처리. 자식 본이 부모의 갱신된 global rest 를 읽도록.

부모가 axis_map 밖이면 (예: `leftIndexProximal` 의 부모 `leftHand`) → 부모의 **수정 전** global rest 사용. Stage 2 는 손목을 안 건드리기 때문에 정확.

---

## Wrist 와의 관계

> [!warning] Stage 2 가 풀지 못하는 문제
> Stage 2 는 24 개 non-thumb finger 본만 수정. **`leftHand` / `rightHand` 는 그대로**. 손목 자체가 어긋나 있으면 Stage 2 로 안 고쳐짐 — 별도 hand-orientation pass 필요.
>
> Stage 2 의 성공 조건: "fingers preserve ARP loose-fist baseline at standing", "whole hand looks correct" 아님.

---

## Runtime pose application

런타임 (retargeter) 에서는 **수정된 VRM rest 를 baseline 으로** ARP 애니메이션이 표준 bind-conjugation 공식으로 적용. "delta 를 null 위에 입력" 이라는 멘탈 모델은 부정확 — rest 자체를 미리 옮겨놓고, 그 다음은 평소대로 모션을 누적.

요약 흐름:
1. **Normalize 단계 (1회):** 위 Stage 1 + Stage 2 → VRM bind pose 의 finger local rest 가 ARP-baseline 만큼 굽은 상태로 변경.
2. **Runtime 단계 (per-frame):** 표준 ARP→VRM 모션 매핑이 새 rest 를 출발점으로 적용 → 손가락 모션 자연스러움.

---

## ❌ 자주 하는 멘탈 모델 오류

| 잘못된 표현 | 정확한 표현 |
| -- | -- |
| "축이 손가락 뻗는 방향이 아닌 다른 방향" | 본 length 축 = 뻗는 방향, curl 축 = 굽히는 회전축 (수직). 두 rig 모두 동일한 분리 구조 |
| "null 값을 박는다" | 0 이 아닌 양의 라디안 (baseline curl scalar) 을 박음 |
| "축은 ARP 에 맞춰 박는다" | **반대.** 축은 VRM 자기 축. ARP 에서 가져오는 건 스칼라뿐 |
| "애니메이션 delta 가 null 위에 입력" | rest 자체를 옮겨놓고, 표준 bind-conjugation 으로 모션 누적 |

---

## 코드 위치 빠른 인덱스

| 개념 | 파일:라인 |
| -- | -- |
| 모듈 doc (전체 흐름) | [finger_axis_map.rs:7-22](finger_axis_map.rs:7), [finger_rest_align.rs:5-44](finger_rest_align.rs:5) |
| `FingerAxisEntry` 정의 | [finger_axis_map.rs:37](finger_axis_map.rs:37) |
| `is_handled_finger` (thumb 제외) | [finger_axis_map.rs:51](finger_axis_map.rs:51) |
| `vrm_curl_axis_for` (hard-coded) | [finger_axis_map.rs:102](finger_axis_map.rs:102) |
| Option B world-transport | [finger_axis_map.rs:126](finger_axis_map.rs:126) |
| `compute_axis_map` (Stage 1 entry) | [finger_axis_map.rs:156](finger_axis_map.rs:156) |
| Stage 2 핵심 연산 | [finger_rest_align.rs:96](finger_rest_align.rs:96) |
| `compute_overrides` (Stage 2 entry) | [finger_rest_align.rs:73](finger_rest_align.rs:73) |
| `apply_in_place` (외부 호출 진입점) | [finger_rest_align.rs:132](finger_rest_align.rs:132) |

---

## Related

- [[shotloom/import-normalize-retarget-pipeline|Shotloom Import → Normalize → Retarget 파이프라인]]
- ADR-0030 (3-normalizer 추출)
- STL-216 (character-model-normalizer 책임 좁힘 — `align/` vs `extract/` 분리)
