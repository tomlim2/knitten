---
title: "Selection highlight 비용 산정 plan (Bevy 0.18, mobile 포함)"
tags:
  - type/learning
  - project/shotloom
  - area/rendering
  - area/performance
  - lib/bevy
date: 2026-05-06
source: claude-code
---

# Selection highlight 비용 산정 plan (Bevy 0.18, mobile 포함)

shotloom selection highlight (outline / fill / glow) 구현의 GPU / CPU / 메모리 / bandwidth 비용을 측정 가능한 4축으로 분해. **모바일 target 포함** — desktop 만 고려한 결정은 mobile 에서 budget 초과 가능.

## Target 플랫폼

| 환경 | 우선순위 | budget 가이드 |
|---|---|---|
| Desktop (Windows / Mac discrete) | high | full feature 가능 |
| Mac M1 / M2 (integrated) | high | half-res 권장 |
| WebGPU on Chrome | high | half-res 필수 |
| Mobile (Snapdragon 8+, Apple A-series 등) | high | half-res 필수, partial mask 권장 |
| iGPU (Intel UHD) | medium | binary edge 만 권장 |

→ 모든 환경에서 selection outline 이 frame budget 의 5-10% 안에 들어와야 함. 60fps target 16.67 ms 기준 *0.8-1.6 ms* ceiling.

## 비용 4축

### 1. GPU 시간 (frame budget)

#### 패스별 분해 (1080p 기준)

| 패스 | 측정 방법 | 예상 |
|---|---|---|
| Mask pass (부캐 카메라) | `GpuTimer`. selected vertex/fragment 비용. partial framebuffer 면 적음 | 0.05-0.2 ms (캐릭터 1-2명) |
| JFA passes (n=11) | 각 pass = fullscreen sample 9개 × 픽셀 수 | full-res ~1 ms / half-res ~0.3 ms |
| Composite pass | scene + mask + distance field 3 sample × 픽셀 수 | <0.1 ms |
| **Total** | | **full-res ~1.2 ms / half-res ~0.5 ms** |

#### Ballpark per platform

| 환경 | full-res JFA | half-res JFA | binary edge only |
|---|---|---|---|
| Desktop RTX | <1 ms | <0.5 ms | <0.2 ms |
| Mac M1 / M2 | 1-2 ms | 0.5-1 ms | <0.3 ms |
| iGPU (Intel UHD) | 3-5 ms | 1-2 ms | 0.5-1 ms |
| WebGPU on Chrome (M1) | 1.5-3 ms | 0.7-1.5 ms | 0.3-0.5 ms |
| Mobile (Snapdragon 8 Gen 3 등) | 3-8 ms | 1.5-4 ms | 0.5-1.5 ms |

→ **모바일 / WebGPU 가 결정적 제약**. desktop 만 보면 full-res JFA OK 지만 모바일에서 budget 초과. 따라서 **half-res 가 default, full-res 는 desktop only opt-in**.

#### 측정 도구

- `bevy_render::diagnostic::RenderDiagnosticsPlugin` — built-in GPU 타이머
- `tracy` profiler 통합 (Bevy 지원)
- Apple Metal: Xcode GPU Frame Capture
- Windows: PIX, RenderDoc
- WebGPU: Chrome devtools GPU panel

#### 변동 요인

- 해상도 — 1080p → 4K 면 픽셀 수 4배. JFA full-res 거의 4배 비용
- selected 캐릭터 수 — mask pass 에 비례 (1명 vs 3명 = 3배). 다른 패스 변함 없음
- GPU 종류 — integrated vs discrete 4-10배 차이
- WebGPU dispatch overhead — JFA pass 수 많으면 누적 가능

### 2. GPU 메모리 (VRAM)

| 텍스처 | 크기 (1080p) | 용도 |
|---|---|---|
| Mask | R8 unorm, ~2 MB | binary or ID color |
| JFA ping-pong A | RG16f or RG16u, ~8 MB | distance field 후보 좌표 A |
| JFA ping-pong B | 동일, ~8 MB | distance field 후보 좌표 B |
| Distance field 결과 | R16f, ~4 MB | 최종 거리값 |
| **Total** | **~22 MB at full-res** | |
| **Total at half-res** | **~5.5 MB** | |

#### 모바일 특이사항

- 모바일은 *unified memory* — 메모리 압박 = 시스템 OOM 위험. 5.5 MB (half-res) 가 안전선
- iOS / Android 모두 백그라운드 앱 메모리 회수 빈번 — 22 MB 면 회수 트리거 가능

#### 변동 요인

- 해상도 — 4K 면 4배 (~88 MB → 모바일 절대 불가)
- 멀티 카메라 / split-screen — 카메라당 사본

### 3. CPU 시간 (시스템 비용)

| 시스템 | 측정 | 예상 |
|---|---|---|
| RenderLayers propagation (selected entity 자식 mesh 까지 layer 박기) | selected 변경 시만 | <50 µs (3 캐릭터, 100 mesh entity) |
| Mask 카메라 transform 동기화 (메인 카메라 추적) | 매 프레임 | <10 µs |
| Spec lookup (mask ID → STYLES uniform 생성) | 매 프레임 | <10 µs |
| **Total** | | **<100 µs** (무시 가능) |

→ CPU 비용 거의 0. *변경 시에만 작동* 으로 짜면 더 줄어듦.

### 4. Bandwidth (메모리 대역폭)

#### JFA 의 bandwidth 부담

```
1080p RG16f = ~8 MB
JFA 11 패스 × (read 9 sample + write 1) ≈ 1080p × 11 × 9 ≈ ~85 MB read + ~22 MB write
                                                          = ~107 MB per frame
```

60fps = ~6.4 GB/s

| 환경 | GPU 메모리 대역폭 | JFA full-res share |
|---|---|---|
| Desktop RTX | 300+ GB/s | 2% (무시 가능) |
| Mac M1 (unified) | 68 GB/s | 9% (주의) |
| Mac M2 Max | 400 GB/s | 1.5% |
| iGPU (Intel UHD) | 30-50 GB/s | 13-21% (큰 부담) |
| Mobile (Snapdragon 8 Gen 3) | 51-77 GB/s | 8-12% |
| WebGPU 추정 (M1 위) | 30-50 GB/s effective | 13-21% |

→ **모바일 / iGPU / WebGPU 에서 bandwidth 부담 무시 못 함**. half-res 로 4배 절약 → 안전선.

## 모바일 우선 default 권고

target 에 모바일 포함되니 *모바일 기준 default* 결정해야 함:

| 결정 | 권장값 | 근거 |
|---|---|---|
| 해상도 | half-res JFA + bilinear upscale | bandwidth / 메모리 / GPU 시간 모두 4배 절약 |
| 첫 land 형태 | binary edge only (JFA 없음) | 모바일에서 0.5-1.5 ms — 안전. JFA 후속 |
| Partial mask | selected entity bounds 기반으로 screen 영역 축소 | mobile 에서 큰 절약 |
| Multi-state | mask ID color (single texture) | 카메라 수 안 늘림 — 메모리 / pass 수 동일 유지 |
| Through-wall | desktop opt-in, mobile default off | 추가 depth read 비용 mobile 에서 회피 |

## 측정 단계 (구현 검증 plan)

### Phase 0 — Budget 결정 (구현 전)

- 디자인팀과 합의: "selected 1-3명 outline 에 모바일 1.5 ms / desktop 0.5 ms ceiling" 같은 명시값
- 60fps / 30fps 환경 각각
- 4K / 1080p / web 환경 각각

### Phase 1 — 1차 PoC 측정 (binary mask + 4-tap edge)

- `RenderDiagnosticsPlugin` 활성화 + 각 pass ms 기록
- 측정 환경 (필수): desktop 1대 + Mac M1 1대 + Android mid-tier 1대 + Chrome WebGPU 1번
- 결과 baseline 으로 README / ADR 에 박아둠
- budget 초과 시 — half-res 또는 partial mask 적용

### Phase 2 — JFA 도입 시 측정 (만약 land 한다면)

- 같은 환경에서 JFA pass × 11 추가 비용 측정
- full-res vs half-res vs quarter-res 비교
- 모바일 fail 면 — quarter-res / mip pyramid / partial mask 옵션
- 모바일 통과 못 하면 *모바일은 binary edge fallback*, desktop 만 JFA 같은 path 분기

### Phase 3 — 회귀 가드

- CI 또는 매뉴얼 벤치 — selection outline 켠 / 끈 비교
- ms 차이가 budget 의 X% 넘으면 fail
- snapshot 형태 또는 GPU profiler trace 보존
- 새 mesh / 새 효과 추가 시 자동 감시

## 측정 결과 보존 형식

PR 본문 또는 별도 doc 에 표 형태로:

```
| 환경 | mask | JFA | composite | total | budget | pass/fail |
|---|---|---|---|---|---|---|
| Desktop RTX 4070 | 0.05 | 0.4 | 0.05 | 0.5 | 0.5 | ✓ |
| Mac M1 | 0.10 | 0.7 | 0.06 | 0.86 | 1.0 | ✓ |
| Pixel 7 | 0.18 | 1.6 | 0.10 | 1.88 | 1.5 | ✗ — partial mask 적용 |
| Pixel 7 (partial) | 0.10 | 0.9 | 0.07 | 1.07 | 1.5 | ✓ |
```

→ 디자인 / 기획이 *어떤 환경에서 어떤 옵션* 활성화 가능한지 즉시 판단.

> [!tip] 모바일 포함 target 이면 *desktop ballpark 무관, 모바일 기준 default*
> desktop 에서 full-res 가 OK 라도 모바일에서 fail 하면 그게 ceiling. 모든 결정이 모바일 통과 여부에 종속됨.

> [!abstract] Rule
> 모바일 target 이 한 번이라도 포함되면 PoC 단계에서 *모바일 측정* 이 budget 결정의 SSOT. desktop only 측정으로 결정하면 후행 모바일 fail 시 redesign 비용 큼. #rule

> [!warning] WebGPU 는 모바일과 비슷한 부담을 desktop 에서도 발생시킴
> Chrome / Safari 의 WebGPU 구현은 native 의 30-70% 성능. 데스크탑 RTX 위에서도 WebGPU 면 모바일급 부담. **교훈:** target 환경마다 측정해야 함, 한 환경 측정으로 다른 환경 비용 추정 금지.

## 비용 산정 자동화

- Bevy 0.18 의 `RenderDiagnosticsPlugin` 을 plugin 의 dev / debug 빌드에 항상 포함
- 측정 결과를 hooks / CI 로 회귀 가드
- 측정 결과 README 또는 ADR 에 baseline 박아 둠 — 미래 변경 시 비교

## 핵심 한 줄

selection outline 비용 산정 = **GPU 시간 + 메모리 + bandwidth + CPU** 4축. **모바일 ceiling 이 SSOT**. 모든 옵션 (half-res / partial mask / binary fallback) 은 *모바일 환경 budget 통과* 가 기준. desktop 측정만으로 결정 절대 금지.

### 사이드 노트

- shotloom 의 cinematic viewer / editor 양쪽 모두 모바일 진출 가능성 있음 — 처음부터 모바일 친화 default 잡으면 redesign 0
- WebGPU 비용은 native 와 다름 — Chrome 의 dawn implementation, Safari 의 WebKit implementation 구현 차이 큼
- mobile 측정은 *물리 device* 필수 — 시뮬레이터 / 에뮬레이터 cost 신뢰 안 됨
