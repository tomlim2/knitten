# Rust: Traits (트레이트)

**Date:** 2026-04-13

## 핵심

**trait = "타입이 구현해야 하는 동작의 계약서".**
다른 언어의 interface와 비슷하지만 더 강력함.

## JS/TS 비유

| Rust | TypeScript |
|---|---|
| `trait Drawable { fn draw(&self); }` | `interface Drawable { draw(): void; }` |
| `impl Drawable for Circle` | `class Circle implements Drawable` |
| `<T: Drawable>` | `<T extends Drawable>` |

기본 개념은 TS interface와 같음. 차이는 아래.

## 기본 예시

```rust
trait Animal {
    fn name(&self) -> String;
    fn sound(&self) -> String;

    // 기본 구현 (TS interface엔 없음)
    fn introduce(&self) -> String {
        format!("I am {} and I say {}", self.name(), self.sound())
    }
}

struct Dog;
impl Animal for Dog {
    fn name(&self) -> String { "Rex".into() }
    fn sound(&self) -> String { "Woof".into() }
}
```

## TS interface보다 강력한 점

### 1. 남의 타입에 trait 붙이기 가능 (핵심)

```rust
impl Animal for String {
    fn name(&self) -> String { self.clone() }
    fn sound(&self) -> String { "...".into() }
}
```

TS에선 불가능. **"기존 타입에 나중에 능력 추가"** 가능.
단, **orphan rule**: trait이나 타입 둘 중 하나는 내 crate 소유여야 함.

### 2. 기본 구현

trait 자체에 메서드 본문 제공 가능. 구현체는 override만.

### 3. Derive 매크로

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point { x: f32, y: f32 }
```

컴파일러가 자동 구현 생성. `JSON.stringify` / 복사 / `===` 공짜.

### 4. Trait Bounds

```rust
fn print_all<T: Animal>(items: Vec<T>) { ... }
fn process<T: Animal + Clone + Debug>(item: T) { ... }
```

컴파일 타임 monomorphization → 런타임 오버헤드 0.

## Bevy/리타겟 맥락

Bevy는 전부 trait 기반:
- `Component` — ECS 컴포넌트 등록
- `Plugin` — 앱에 기능 등록
- `Resource`, `System`, `Bundle` — 전부 trait
- `Query`, `Res` — trait bound로 시스템 인자 받음

리타겟 코드에서 자주 보는 것:
- `Clone`, `Debug`, `Default` — derive 매크로
- `Serialize`, `Deserialize` — serde JSON 입출력
- `Iterator` — `.iter().map().filter().collect()` 체인
- `Send`, `Sync` — 스레드 안전성 마커

## 특수한 Trait들

| 종류 | 설명 | 예 |
|---|---|---|
| **Marker trait** | 메서드 없음, 속성 표시용 | `Send`, `Sync`, `Copy` |
| **Blanket impl** | 조건 만족하는 모든 타입에 자동 구현 | `ToString` (← `Display`) |
| **Trait object** | 런타임 다형성 (`dyn Trait`) | `Box<dyn Animal>` |
| **Associated type** | trait 내부 타입 정의 | `Iterator::Item` |

## JS 개발자 충격 포인트

1. **클래스 없는데 OOP 됨** — struct + trait 조합
2. **상속 없음** — `extends` 대신 trait 구현
3. **인터페이스 나중에 붙이기** — 외부 타입에 trait 추가 가능
4. **컴파일러가 다 잡음** — trait 미구현 호출 시 런타임 에러 아닌 컴파일 에러

## 한 줄 정리

**Trait = "능력 계약서". TS interface + 외부 타입 확장 + 기본 구현 +
자동 유도 + 컴파일타임 제네릭.** Rust에서 OOP스러운 것은 전부 trait으로
표현됨. struct/enum 중심 언어가 OOP처럼도 쓸 수 있게 하는 핵심 장치.
