# Symbol vs TypeScript Interface

## Symbol (심볼)

JavaScript의 7번째 원시 타입 (ES2015). 매번 생성할 때마다 절대 중복되지 않는 고유한 식별자.

```typescript
const a = Symbol('id');
const b = Symbol('id');
a === b; // false — 설명 문자열이 같아도 다른 심볼
```

**주 용도:** 객체 프로퍼티 키로 써서 이름 충돌 방지. 일반 열거(`Object.keys`)에서 안 보임.

**Well-known Symbols:** `Symbol.iterator`, `Symbol.toPrimitive` 등 — 언어 내부 동작 커스터마이즈.

## Symbol vs Interface 차이

| | Symbol | Interface |
|---|---|---|
| **존재 시점** | 런타임 (실제 값) | 컴파일타임 (타입 체크 후 사라짐) |
| **역할** | 고유한 프로퍼티 키 | 객체의 형태(shape) 정의 |
| **JS에 존재?** | Yes | No — 컴파일 후 흔적 없음 |
| **충돌 방지** | 키 이름 충돌 방지 (런타임) | 타입 불일치 방지 (컴파일타임) |

**한 줄 요약:** Interface는 "무엇이 있어야 하는지" 설계도, Symbol은 "절대 겹치지 않는 이름표" 실물.

## 이름이 겹쳐도 충돌 안 함

TypeScript는 **타입 공간**과 **값 공간**을 분리해서 관리하기 때문에 같은 이름이어도 독립적으로 동작.

```typescript
interface Foo { name: string; }  // 타입 공간 — 컴파일 후 사라짐
const Foo = Symbol('Foo');       // 값 공간 — 런타임에 존재

const obj: Foo = {
  name: 'tom',
  [Foo]: 'secret'  // 둘 다 공존 — 충돌 없음
};
```

## Symbol.for() — 전역 레지스트리

`Symbol()`은 절대 안 겹치지만, `Symbol.for()`는 같은 키면 같은 심볼을 반환.

```typescript
Symbol.for('app.userId') === Symbol.for('app.userId'); // true
Symbol('app.userId') === Symbol('app.userId');          // false
```

| 방식 | 겹침 | 용도 |
|------|------|------|
| `Symbol()` | 절대 불가 | 프라이빗 키, 외부 접근 차단 |
| `Symbol.for()` | 같은 키 = 같은 심볼 | 모듈/라이브러리 간 공유 |

키 네이밍에 `'mylib.eventType'`처럼 네임스페이스를 붙이는 게 관례 (서드파티 충돌 방지).

## JS Symbol vs Rust symbol — 완전히 다른 개념

Rust의 "심볼"은 바이너리(`.o`, `.so`, `.exe`)에 들어가는 **링커용 식별자**. 컴파일러가 함수/static/trait impl에 붙이는 이름표.

```
// 소스: fn hello() {}
// 심볼: _ZN7mycrate5hello17h8a3b9c2d1e4f5678E  (name mangling)
```

**Rust에 심볼이 많은 이유:**
- **Monomorphization** — 제네릭이 호출된 타입마다 복제됨 (`process::<i32>`, `process::<String>` → 각각 별도 심볼)
- **Trait impl마다 별도 심볼** — `impl Display`, `impl Debug`, `impl Clone` 각각
- **표준 라이브러리 제네릭** — `HashMap<K,V>` 등이 사용자 타입마다 monomorphize
- `strip` 하면 심볼 테이블 날려서 바이너리 크기 줄어듦

| | JS Symbol | Rust symbol |
|---|---|---|
| **정체** | 런타임 원시값 | 바이너리 내 링커용 이름 |
| **목적** | 프로퍼티 키 충돌 방지 | 함수/변수를 링커가 찾기 위해 |
| **많은 이유** | 개발자가 만든 만큼 | 제네릭 monomorphization으로 폭발적 증가 |

**날짜:** 2026-03-23
