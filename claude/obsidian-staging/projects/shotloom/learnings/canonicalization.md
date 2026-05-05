---
title: "canonicalization (표준형 정규화)"
tags:
  - type/learning
  - project/shotloom
  - area/vocab
date: 2026-05-06
source: claude-code
---

# canonicalization (표준형 정규화)

같은 의미를 가진 여러 형태 중 *유일한 정답 형태* 로 통일하는 과정.

## 일반 의미

수학적 비유: 같은 분수 `2/4`, `4/8` 을 모두 `1/2` 로 줄이는 것. 같은 의미인데 표현이 여러 개 → 하나로 압축.

## shotloom 에서

VRM rig 마다 본 매핑이 anatomy 기준 vs spec 잔재로 다르게 옴.

| Rig | depth 1 thumb 본 | depth 2 |
|---|---|---|
| xiao / c-normal / zepeto | `*ThumbMetacarpal` (정답) | `*ThumbProximal` |
| yoya / minjoon / vrm0x | `*ThumbProximal` (위반) | `*ThumbMetacarpal` |

**canonicalize 한다** = 어느 rig 든 *같은 표준 매핑* 으로 통일 → 다운스트림은 항상 한 형태만 알면 됨.

기존 예: `canonicalize_thumb_chain_naming` — VrmRestPose 안 dictionary 만 정리. 후속 humanoid bone canonicalization 작업이 같은 일을 *GLB 단계까지* 거슬러 올라가서 함 (single source of truth 도달).

## 비슷한 어휘

- **normalize** — 거의 동의어, 좀 더 일반적 (수치 범위 통일까지 포함)
- **canonical form** — 표준형 자체

## shotloom 의 패턴

`canonicalize_*` 함수들은 모두 "이름 / 구조 / 매핑이 어긋난 것을 표준 형태로 맞춤" 의 동일한 패턴. 만약 새 함수가 그런 일을 한다면 같은 prefix 사용해 일관성 유지하는 게 좋음.

#vocab
