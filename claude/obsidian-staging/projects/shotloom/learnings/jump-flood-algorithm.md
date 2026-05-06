---
title: "JFA — Jump Flood Algorithm"
tags:
  - type/learning
  - project/shotloom
  - area/rendering
  - area/algorithm
date: 2026-05-06
source: claude-code
---

# JFA — Jump Flood Algorithm

각 픽셀이 *가장 가까운 mask 픽셀까지의 거리*를 GPU 에서 `log₂(width)` 패스로 계산하는 알고리즘. Rong & Tan 2006 발표 (보로노이 다이어그램 GPU 화). screen-space outline / distance field text / soft shadow / pathfinding heuristic 등 광범위하게 쓰임.

## 직관

mask texture 에 흰 점 몇 개:

```
. . . . . . . . . .
. . . W . . . . . .
. . . . . . . . . .
. . . . . . . W . .
. . . . . . . . . .
```

**목표**: 각 검은 픽셀이 *가장 가까운 흰 픽셀의 좌표*를 알게 만들기.

순진한 방법: 각 픽셀이 모든 흰 픽셀 검사 → O(N²). 1080p 면 2백만² 연산 → 절망.

JFA: **`log₂(width)` 패스만**. 1080p 면 11 패스.

## 동작

각 패스에서 픽셀이 *간격 `k` 떨어진 8 이웃* 을 살펴봄. `k` 는 매 패스 절반:

```
Pass 1: k = width/2   (예: 540)
Pass 2: k = 270
Pass 3: k = 135
...
Pass 11: k = 1
```

각 픽셀이 자기 + 8 이웃 9개가 보유한 "가장 가까운 mask 좌표 후보" 중 *실제로 가장 가까운 것* 만 채택.

비유: 첫 패스는 *대륙급* 으로 멀리 봐서 "어느 대륙 쪽인가" 확정 → 다음 패스는 *국가급* → *도시급* → 마지막 패스는 *옆 픽셀급*. 매번 정밀도 두 배.

```
초기 mask:              Pass 1 (k=대륙):           Pass 11 (k=1):
. . . . . W . . . .    각 픽셀이 "대륙 어디"      각 픽셀이 "정확한
. . . . . . . . . .      만 확정                    가장 가까운 mask 픽셀"
. . . . . . . . . .                                 좌표 보유
. . . . . . . . . .
```

최종 결과: 각 픽셀이 **가장 가까운 mask 픽셀 좌표 (u, v)** 보유. 거리 = 자기 좌표와의 유클리드 차이.

## Pseudocode

```glsl
// JFA pass — 한 패스씩 호출, k 값만 외부에서 변경
uniform int k;            // 현재 jump 거리
uniform sampler2D src;    // 이전 패스 결과 (RG = 가장 가까운 mask 좌표)
out vec2 nearest;         // 이번 픽셀의 가장 가까운 mask 좌표

void main() {
    vec2 self = gl_FragCoord.xy;
    vec2 best = texture(src, self / resolution).rg;
    float best_d2 = dot(self - best, self - best);

    for (int dy = -1; dy <= 1; dy++) {
        for (int dx = -1; dx <= 1; dx++) {
            if (dx == 0 && dy == 0) continue;
            vec2 sample_pos = self + vec2(dx, dy) * k;
            vec2 candidate = texture(src, sample_pos / resolution).rg;
            float d2 = dot(self - candidate, self - candidate);
            if (d2 < best_d2) {
                best = candidate;
                best_d2 = d2;
            }
        }
    }
    nearest = best;
}
```

## Outline 에 활용

```
mask 에 selected 캐릭터 silhouette 있음
   ↓ JFA log₂(width) pass
각 픽셀이 mask edge 까지의 거리 d 보유
   ↓ outline shader
if d == 0:                 캐릭터 안쪽 → 안 그림 (메인 렌더가 이미)
elif d < thickness:        outline 영역
    color = outline_color
    alpha = 1 - d/thickness    // fade out
else:                      outline 밖
    discard
```

장점:

- **두께 control 무료** — thickness uniform 한 줄로 조정
- **두께 무관 비용 일정** — 항상 log 패스
- **gradient / glow / fade 가능** — 거리 정보 그대로 사용
- **둥근 모서리 자연스러움** — distance field 라 stair-step 없음

## 비용 분석

- Ping-pong texture 2개 (서로 읽기 / 쓰기 번갈아)
- `log₂(width)` 회 fullscreen pass
- 각 pass 에서 픽셀당 9 sample (자기 + 8 이웃)

1080p 면 11 × 9 = ~100 samples per pixel. half-res 면 ~50. 모던 GPU 에선 보통 1 ms 이하.

**완화 기법**:

- Half-res / quarter-res mask + bilinear upscale → pass 수 절반-쿼터
- Selected entity bounds 기반 partial mask → screen 일부만 처리
- Mip-mapping 활용 — 일부 변형이 mip pyramid 로 동등 효과

## 어디서 쓰이나

- **Outline** — Unity Quick Outline, Unreal Niagara outline material, Bevy `bevy_mod_outline` `OutlineMode::FloodFlat`
- **Distance field text** — TextMesh Pro / SDF font 의 SDF 텍스처 사전 계산
- **보로노이 / 셀룰러 패턴**
- **Soft shadow approximation** (mask edge → soft penumbra)
- **AI pathfinding heuristic** — 정적 장애물에 대한 distance map
- **지형 erosion 시뮬레이션**

## 다른 distance field 방식과 비교

| 방식 | 정확도 | 비용 | runtime | 용도 |
|---|---|---|---|---|
| **Brute force (모든 점 비교)** | 정확 | O(N²) | 못 씀 | 이론용 |
| **JFA** | 거의 정확 (작은 오차 가능) | O(N log N) | 실시간 가능 | outline / SDF / soft shadow |
| **JFA+1** | 정확 | JFA + 추가 1 pass | 거의 같음 | 정밀 SDF |
| **CPU sweep** (e.g. Felzenszwalb) | 정확 | O(N) | 정적 데이터에 적합 | offline SDF baking |

대부분 outline / soft mask 용도엔 vanilla JFA 면 충분. SDF 텍스트처럼 정확도 critical 하면 JFA+1.

> [!tip] JFA 의 본질은 "절반씩 좁혀가는 정밀화"
> 매 pass 가 정밀도 2배 → 합쳐서 log 회 패스로 끝. 단순한 reduce 패턴이지만 GPU 의 fullscreen pass 친화적이라 빠름. 이 패턴은 다른 문제 (거리 변환, 보로노이, dilation) 에 일반화 가능.

> [!abstract] Rule
> 두께 / fade / glow / 둥근 모서리가 한 번이라도 필요한 outline 작업이면 처음부터 JFA 가 결국 빠르다. 단순 dilation 으로 시작했다 디자인 변경 들어오면 재구현 비용이 더 큼. #rule

> [!warning] Mask 정밀도 = JFA 정밀도
> JFA 는 입력 mask 의 anti-alias / sub-pixel 정확도 이상으로 좋아질 수 없음. mask 가 jagged 면 outline 도 jagged. mask pass 에서 MSAA 또는 alpha-cutout 정책을 먼저 정해야 함. **교훈:** 분리된 패스의 품질이 다음 패스의 상한.

## 참고

- Rong & Tan 2006 — "Jump Flooding in GPU with Applications to Voronoi Diagram and Distance Transform"
- Bevy `bevy_mod_outline 0.12.0` — `OutlineMode::FloodFlat` (experimental)
- Unity Quick Outline 류 패키지
- TextMesh Pro SDF 폰트 — JFA 로 사전 계산된 distance field

### 사이드 노트

- shotloom 의 selected 캐릭터 outline 작업에서 두께 / 색 / fade 디자인 자유도 검토 중 등장. binary mask + boundary detection 으로는 두께 1-2px / 단색만 가능, 디자인 의도가 그 이상이면 JFA 부터 시작이 결국 빠름.
- `log₂(width)` 라 1080p ↔ 4K 패스 수 차이 크지 않음 (11 vs 12). 해상도 sensitive 하지 않은 게 장점.
