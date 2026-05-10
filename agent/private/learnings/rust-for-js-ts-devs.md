# Rust for JS/TS Developers

## 핵심 차이

| | JS/TS | Rust |
|---|---|---|
| **메모리** | GC가 알아서 수거 | 소유권 — 컴파일러가 검증 |
| **실행** | V8 인터프리터 + JIT | 네이티브 바이너리 (C/C++ 급) |
| **에러** | 런타임에 터짐 | 컴파일 안 됨 (대부분) |
| **null** | `null`, `undefined` | 없음. `Option<T>` |

## 변수

- `let x = 5;` → 불변 (JS의 const)
- `let mut y = 5;` → 가변 (JS의 let)
- var 없음

## 소유권 (Ownership) — 가장 핵심

JS: 모든 객체는 공유 소유 → GC가 수거
Rust: 모든 값은 단일 소유자 → 소유자가 스코프 나가면 즉시 해제

```rust
let a = String::from("tom");
let b = a;       // 소유권이 b로 이동 (move)
// a 더 이상 사용 불가 — 컴파일 에러
```

## 빌림 (Borrowing)

소유권 안 넘기고 참조만 빌려줌. 컴파일러가 강제하는 규칙:
- 읽기 참조(`&T`) 여러 개 OK
- 쓰기 참조(`&mut T`) 동시에 1개만
- 읽기 + 쓰기 동시 불가

## struct + impl = 인터페이스 + 클래스

```rust
struct User { name: String, age: u32 }
impl User { fn greet(&self) -> String { format!("Hi, {}", self.name) } }
```

클래스 상속 없음. trait으로 조합.

## trait = 인터페이스 (더 강력)

- 남이 만든 타입에도 구현 가능
- 기본 구현 제공 가능
- 제네릭 제약으로 사용: `fn do_thing<T: Printable>(item: T)`

## enum = 유니온 타입 (데이터 담김)

```rust
enum Result<T, E> { Ok(T), Err(E) }
```
패턴 매칭으로 꺼냄. 모든 케이스 처리 안 하면 컴파일 에러.

## Option = null 대체, Result = try-catch 대체

- `Option<T>` = Some(값) | None — null/undefined 없음
- `Result<T, E>` = Ok(값) | Err(에러) — `?` 연산자로 전파
- 에러가 타입으로 명시됨

## 제네릭

TS: `<T extends Printable>` → Rust: `<T: Printable>` — 거의 1:1

## async/await

문법 같지만 런타임을 직접 고름 (tokio, async-std). JS처럼 이벤트 루프 내장이 아님.

## 패키지

`Cargo.toml` = package.json, `cargo build` = npm install, `crates.io` = npmjs.com

## JS 습관 → Rust 전환

| JS/TS 습관 | Rust |
|-----------|------|
| 객체 자유롭게 복사/공유 | 소유권 이동. 공유하려면 빌림(`&`) |
| `null` 체크 | `Option<T>` + `match` |
| try-catch | `Result<T, E>` + `?` |
| 클래스 상속 | struct + trait 조합 |
| `any` 타입 | 없음. 모든 타입 명시 |
| GC 메모리 관리 | 소유권 + 라이프타임으로 컴파일 시 결정 |

**날짜:** 2026-03-23
