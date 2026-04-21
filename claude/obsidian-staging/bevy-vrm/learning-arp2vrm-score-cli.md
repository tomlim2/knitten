---
title: "arp2vrm-score: 검증 게이트 CLI 설계"
tags: [bevy-vrm, retarget, scoring, cli, llm-economy]
created: 2026-04-10
---

# arp2vrm-score: 검증 게이트 CLI 설계

ARP→VRM 휴머노이드 본 리타겟 정확도 검증 전용 CLI. LLM 토큰 절약이 1차 목표.

## 핵심 원칙

**Regression gate, not a flexible runner.** 모든 설정을 Rust 상수로 하드코딩하고, CLI 인자는 FBX 경로 하나만 받는다.

| 항목 | 위치 | 이유 |
|------|------|------|
| VRM 경로 | `const DEFAULT_VRM` | 비교 가능성 — 매번 같은 모델 |
| Retarget config | `const DEFAULT_CONFIG` | 게이트 의미 유지 |
| Threshold (A=0.02, B=0.05, C=0.10) | `const POS_*` | LLM context에서 빼내는 게 핵심 |
| 가중치 (hips×3, spine×2, etc) | `fn region_weight` | 정책 변경 시 코드 리뷰 |
| 본 리스트 (required 15, optional 9) | `const BODY_*` | 동일 |

## 모드 분리

```
arp2vrm-score verify <fbx>            # 게이트, exit 0/1
arp2vrm-score score  <fbx>            # 부위별 표 (history 자동 저장)
arp2vrm-score score  <fbx> --vs-last  # 직전 run과 delta
```

| 서브커맨드 | 출력 형태 | 토큰 (실측) | exit code |
|-----------|-----------|-------------|-----------|
| `verify` PASS (A/B) | 한 줄 | ~10 | 0 |
| `verify` FAIL (C/F) | worst 3 + hint | ~80 | 1 |
| `score` | region 표 + worst | ~250 | 0 |
| `score --vs-last` | 위 + 부위별 delta | ~400 | 0 |

## 등급 판정 (Rust가 진실)

```
weighted_rms = sqrt(Σ(w·e²) / Σw)
grade = A if rms<0.02, B<0.05, C<0.10, F otherwise
```

추가 hard fail 조건:
- `missing_required` 비어있지 않음 → grade C로 강등
- `direction_failures` (≥30°) 존재 → grade C로 강등

LLM은 점수 계산 절대 안 함. 추론(원인 가설, 코드 위치)만.

## History 정책

`scoring-history/` (gitignored)에 매 run JSON 저장. 파일명: `YYYY-MM-DD_HH-MM-SS_<fbx_stem>.json`. 초 단위 포함 — 같은 분 reruns가 baseline 덮어쓰는 걸 방지.

비교는 **opt-in** (`--vs-last` 명시). 기본은 저장만.

JSON 스키마 (hand-rolled, serde_json::Value로 read):
```json
{
  "timestamp": "...",
  "fbx_path": "...",
  "grade": "C",
  "overall_rms": 0.063,
  "weighted_rms": 0.062,
  "per_region": {
    "hips": {"max":..., "p95":..., "mean":..., "bones":1},
    ...
  },
  "worst_bones": [{"bone":"head", "rms":0.091}, ...],
  "missing_required": [],
  "direction_failures": []
}
```

## Region 버킷 (7개)

```rust
fn region_of(bone) -> "hips" | "spine" | "head"
                    | "arm_l" | "arm_r" | "leg_l" | "leg_r" | "other"
```

좌우 분리 이유: 한쪽만 깨지는 케이스 (예: rightLowerLeg만 0.084) 진단 가능.

## 의존성 정책

`chrono` 같은 새 crate 추가 금지. 타임스탬프는 SystemTime + Howard Hinnant civil-from-days 알고리즘으로 직접 계산. JSON 파싱은 이미 들어간 `serde_json` 사용.

## 단계적 회귀 스위트 (다음 단계 — 미구현)

FBX 테스트 케이스만 JSON으로 외부화. VRM/config/threshold는 여전히 하드코딩.

`scoring-fixtures.json` (개념):
```json
{
  "stages": [
    {"id": "01_standing", "fbx": "assets/fbx/17857_M_AIStndWide_241204.fbx"},
    {"id": "02_gang_leg", "fbx": "assets/fbx/21092_M_AiStndGangLegWideElbowBackFirmFace_241226.fbx"},
    {"id": "03_run",      "fbx": "assets/fbx/21566_M_AiFigureEightRun_250108.fbx"}
  ]
}
```

세만틱:
- **Ladder** — 각 stage는 이전이 PASS여야 진행 (early-stop)
- 회귀 시 첫 FAIL이 곧 fix 우선순위
- `verify-all` 서브커맨드: stage 순서대로 verify, 첫 FAIL에서 멈춤
- 진행 상태는 history에서 derive (어떤 stage까지 PASS 본 적 있는지)
- 어떤 게 돌았고/통과했는지 한 곳에서 확인 가능

설계 원칙 유지: VRM/config/threshold는 여전히 Rust 상수. **외부화 대상은 "어떤 입력으로 검증할 것인가" 만**.

## PASS 압축 출력 (ladder의 토큰 절감 핵심)

ladder만 추가하면 토큰 절감 효과 미미. **PASS 케이스 압축**이 진짜 절감 포인트.

### 출력 포맷

전부 통과:
```
PASS 10/10 stages
```
1줄, N에 무관하게 ~12 토큰.

회귀 발생 (예: stage 5에서 FAIL):
```
PASS 4/10 → FAIL at 05_run
rms=0.087 grade=C
worst:
  head rms=0.091 (>0.05)
  rightLowerLeg rms=0.084
hint: check leg length scale + foot sole offset
```
~80 토큰, 어디서 깨졌는지 명확.

### 토큰 비교 (10 stages 기준)

| 케이스 | 단일 verify × N | ladder만 | ladder + PASS 압축 |
|--------|-----------------|---------|-------------------|
| 전부 PASS | ~100 | ~100 | **~12** |
| stage 5 FAIL | ~170 | ~120 | **~95** |
| stage 1 FAIL | ~80 | ~80 | **~85** |

### 구조적 부수 절감

1. **FBX 경로를 LLM context에서 제거** — stage id (`05_run`)만 알면 됨. 경로당 ~30 토큰 × N stages 절약.
2. **"다음 뭐 돌릴까" 추론 0** — ladder가 알아서 다음 stage 잡음.
3. **회귀 위치 = fix 우선순위** — LLM 추론 단계 사라짐. 첫 FAIL이 답.

## 적용 시 주의

- VRM 0.x 는 자동 1.0 변환 후 rest pose 추출 (`vrm0_compat::convert`)
- VRM 0.x rest의 root y 회전 ≈180° 케이스도 `is_vrm0=true` 처리
- `cinev_arp_body.json` 매핑 파일 필수 (없으면 exit 2)

## 참고

- [[devlog-2026-04-10]] — 설계 결정 + 6단계 검증 결과
- [[learning-rms-error-metric]] — 등급 정의
- [[learning-vrm-humanoid-bones]] — 본 54개 테이블
