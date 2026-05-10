---
description: Codex로 Rust 함수/모듈에 대해 독립 테스트 작성. 검증기 오염 방어 — 다른 모델이 테스트 짠다.
argument-hint: "<file-path> [function-name]"
allowed-tools: Bash(codex:*), Bash(bash:*), Read, Grep
---

# cci-codex-write-rust-tests

Rust 함수/모듈에 대해 **Codex가 독립적으로** 테스트를 작성한다. 핵심 동기: **검증기 오염 방어**. Claude가 짠 코드를 Claude가 테스트하면 같은 가정·실수를 공유한다. 다른 모델이 테스트를 짜야 진짜 버그가 잡힌다.

원칙:
- **구현 코드를 Codex에게 보여주지 않거나, 보여주더라도 contract만 추출하라고 강제**
- 엣지 케이스 우선 (boundary, overflow, empty input, NaN, 음수, 큰 값)
- `#[cfg(test)]` 모듈로 출력
- proptest/quickcheck 가능하면 활용

## Arguments

- `<file-path>` (필수) — 예: `crates/humanoid_retarget/src/quality/fk_evaluate.rs`
- `[function-name]` (선택) — 특정 함수만. 없으면 파일의 pub 함수 전부

**인자 필수.** 없으면 사용법 출력 후 종료. NEVER auto-execute.

Usage: `/cci-codex-write-rust-tests crates/humanoid_retarget/src/quality/fk_evaluate.rs evaluate`

## Workflow

### Step 1: Validate
- $ARGUMENTS 비었으면 사용법 출력 후 종료.
- 파일 존재 확인. 없으면 안내.
- `codex` CLI 확인.

### Step 2: Extract contract (구현 숨김)
- Read tool로 파일을 읽되, **함수 시그니처 + doc comment + struct/enum 정의만** 추출.
- 함수 본문은 잘라낸다 (검증기 독립성 확보).
- 함수명 인자가 있으면 그것만, 없으면 파일의 모든 `pub fn`을 contract로.

추출된 contract 예시:
```rust
/// Evaluates VRM skeleton frames using forward kinematics.
/// Returns world-space pos/rot per frame per bone.
pub fn evaluate(
    skeleton: &VrmSkeleton,
    rotations: &[FrameRotations],
) -> VrmSkeletonFrames {
    // ... body hidden ...
}

pub struct VrmSkeletonFrames {
    pub frames: Vec<Frame>,
}
```

### Step 3: Build prompt

```
당신은 시니어 Rust 테스트 작성자다. 아래 함수의 contract만 보고 테스트를
작성하라. **구현은 보지 않은 상태**라고 가정하라 — 구현이 비공개여야
검증기 독립성이 보장된다.

**작성 원칙**:
1. **엣지 케이스 우선** — 빈 입력, 단일 원소, 매우 큰 값, NaN, 음수, 경계값
2. **happy path는 1개만** — 정상 동작 확인 1개로 충분
3. **각 테스트는 한 가지 사실만** 검증 (one assertion per test 권장)
4. **테스트 이름은 행동을 설명** — `evaluate_returns_empty_for_zero_frames` 형태
5. **proptest 가능하면 활용** — 불변식이 있다면 property test 추가
6. **panic 예상도 명시** — `#[should_panic(expected = "...")]`
7. **fixture는 별도 함수로** — 중복 setup 피함

**형식**:
- 결과는 그대로 `#[cfg(test)] mod tests { ... }` 블록 1개로
- 한국어 주석: 각 테스트가 무엇을 검증하는지 1줄
- 의존성이 필요하면 `Cargo.toml`에 추가할 항목도 명시

**금지**:
- 구현 추측 금지 — contract에 없는 동작 가정 X
- 트리비얼한 테스트 (`assert_eq!(2+2, 4)`) 금지
- "여기 구현 보면 좋겠다" 같은 회피 금지 — contract만으로 못 쓰겠으면 그 이유를 명시

---

## Contract

<여기에 추출한 시그니처/doc/struct만>
```

### Step 4: Call wrapper
`bash ~/.claude/lib/cci-codex/run-codex.sh write-rust-tests "<프롬프트>"`

### Step 5: Show result
- Codex 출력 그대로
- 사용자가 직접 코드를 파일에 붙여넣음 (자동 적용 X — 검증기 독립성 유지)
