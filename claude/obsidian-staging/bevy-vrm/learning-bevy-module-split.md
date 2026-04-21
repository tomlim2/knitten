---
title: "Bevy 프로젝트 모듈 분리 패턴"
tags: [bevy-vrm, refactor, rust, learnings]
created: 2026-04-09
---

# Bevy 프로젝트 모듈 분리

## Problem

단일 main.rs가 3,400줄 이상으로 비대해짐. 함수 찾기, 변경 영향 파악, 코드 리뷰 전부 어려워진 상태.

---

## 핵심 패턴

### 1. types.rs 먼저 분리

Bevy ECS 특성상 Resource, Component, Enum이 모든 system에서 참조됨. types.rs를 먼저 추출하고 나머지 모듈에서 `use crate::types::*;` 하면 순환 의존 없이 깔끔하게 분리 가능.

```
src/
├── types.rs          ← 모든 타입 정의 (다른 모듈이 의존)
├── setup.rs          ← types만 의존
├── retarget.rs       ← types만 의존
└── main.rs           ← mod 선언 + main()
```

### 2. Bevy system은 함수 시그니처 변경 불가

Bevy system의 파라미터는 각각 별도의 `SystemParam` 이어야 함. 일반적인 "인자 묶기" 리팩토링이 안 됨. 대신 **여러 Resource를 하나로 통합**하면 system param 수를 줄일 수 있음.

```rust
// Before: 3개 Resource → 3개 system param
sole_offset: Option<Res<FootSoleOffset>>,
foot_contact_res: Option<Res<FootContactRes>>,
glb_vrm_rest: Option<Res<GlbVrmRestPose>>,

// After: 1개 Resource → 1개 system param
vrm_rest_data: Option<Res<VrmRestData>>,
```

### 3. pub(crate) fn 패턴

모듈 간 함수 노출에 `pub(crate)` 사용. `pub`은 crate 외부에 노출되므로 불필요.

### 4. cargo build를 단계마다 실행

한 번에 전부 분리하지 말고 types → setup → 나머지 순으로 추출하면서 매 단계 빌드 확인. 컴파일 에러가 쌓이면 원인 추적이 기하급수적으로 어려워짐.

---

## 모듈 분리 기준

| 기준 | 예시 |
|------|------|
| ECS phase 단위 | retarget (phase 2), expression (phase 4) |
| 기능 도메인 | visualization, timeline, debug |
| 의존성 방향 | types → 나머지 (단방향) |

---

## 주의사항

- Bevy system scheduling 순서(`.chain()`, `ApplyDeferred`)는 main.rs에 남겨야 함
- `use std::collections::HashMap` 등 각 모듈에서 필요한 import를 별도로 추가해야 함
- `Local<T>` system param은 해당 system 함수 안에서만 유효 → 모듈 이동해도 문제 없음
