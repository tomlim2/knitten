# Contract Surface / API Surface

**Date:** 2026-04-14

## 핵심

**"외부에 노출돼서 약속(계약)이 걸린 부분의 총 면적".**
모듈/라이브러리/시스템이 바깥 세상과 맞닿는 표면적.

## 비슷한 "surface" 용어들

| 용어 | 뜻 |
|---|---|
| **API surface** | 공개된 API의 총량 (함수, 클래스, 타입 개수) |
| **Contract surface** | 계약이 걸린 인터페이스 총량 |
| **Attack surface** | 공격받을 수 있는 노출 지점 (보안 용어) |
| **Public surface** | `pub` 키워드 붙은 모든 것 (Rust) |

## 핵심 원리

```
모듈 내부 (사적) ──┐
                   ├─→ surface (계약 경계) ─→ 외부 사용자
모듈 내부 (사적) ──┘
```

**Surface 클수록**: 사용자 자유 ↑, 깨지기 쉬움 ↑, 리팩터 자유 ↓
**Surface 작을수록**: 그 반대

격언: **"Surface는 작게, 내부는 크게."**

## JS/TS 예시

```typescript
// surface 큼 (7개 export)
export function parse(...)
export function validate(...)
export class Parser { ... }
// → 7개 다 호환성 유지해야 함

// surface 작음 (1개)
export function process(input: string): Result
// → 내부적으로 위 7개를 다 쓰지만 외부엔 1개만 보임
```

같은 기능이지만 두 번째가 유지보수 부담 1/7.

## Rust 맥락

```rust
pub fn retarget(...) { }       // ← surface (외부 노출)
fn helper(...) { }              // ← surface 아님 (private)
pub(crate) fn internal(...) { } // ← crate 내부에만
```

`pub` 붙은 모든 것의 합 = crate의 public surface. 한 번 pub하면
사용자가 의존하기 시작 → 함부로 못 바꿈.

## "Contract"의 의미 (핵심)

Contract surface ≠ 그냥 API surface. **"약속"** 이 걸렸다는 게 핵심.

- **명시적 계약**: 함수 시그니처, 타입, 에러 종류
- **암묵적 계약**: 성능 보장, 결정론, side effect 없음, panic 안 함, 멱등성

암묵적 계약은 코드에 안 보이지만 사용자는 의존함. **진짜 contract
surface는 시그니처보다 큼.**

## 리타겟/shotloom 맥락

`humanoid_retarget` crate를 shotloom에 옮길 때 결정해야 할 것:

```rust
// surface 큼 — 유연하지만 깨지기 쉬움
pub struct Retargeter { ... }
pub fn pass1_delta(...) { }
pub fn pass2_direction_correction(...) { }
pub fn pass3_ground_contact(...) { }
pub mod quality { ... }

// surface 작음 — 단단함
pub fn retarget(fbx: &Fbx, vrm: &Vrm, config: &Config) -> Result
pub struct Result { pub frames: Vec<Pose>, pub grade: Grade }
```

shotloom 입장에선 두 번째가 좋음. 내부 3-pass 구조가 바뀌어도
shotloom 코드는 안 깨짐.

### 리타겟의 암묵적 계약

- **결정론적** (같은 입력 → 같은 출력) — shotloom 캐싱이 의존
- **panic 안 함** — 에러는 Result로
- **입력 fbx/vrm 수정 안 함** — immutable

## "오염" 원칙과의 연결

Rubric A/B/C가 각자 독립된 surface를 가져야 함. 한 rubric이 다른
rubric 내부에 손대면 surface가 entangle → contradiction 숨김 가능.
그래서 각 rubric을 별도 모듈로 분리한 것.

## 한 줄

**Contract surface = "외부에 약속한 모든 것의 총 면적".** 작을수록
단단하고 자유로움, 클수록 유연하지만 깨지기 쉬움. 좋은 모듈 설계는
**"surface 최소화 + 내부 복잡도 최대화"**. shotloom 이식 시점이
surface 디자인을 가다듬을 좋은 기회 — 한 번 노출하면 빼기 어려움.
