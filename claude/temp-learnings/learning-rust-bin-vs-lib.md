# Rust: bin vs lib

**Date:** 2026-04-13

## 핵심

Rust 크레이트는 두 가지 타입:
- **bin** (binary) — 실행 파일, `main()` 함수 있음
- **lib** (library) — 다른 크레이트가 import하는 재사용 모듈

## 구조

```
my-crate/
├── Cargo.toml
├── src/
│   ├── lib.rs          # 라이브러리 엔트리 (재사용 로직)
│   ├── main.rs         # 기본 bin 엔트리
│   └── bin/            # 추가 bin들
│       ├── tool_a.rs   # cargo run --bin tool_a
│       └── tool_b.rs   # cargo run --bin tool_b
```

한 크레이트가 `lib.rs` + `bin/*.rs`를 동시에 가질 수 있음. 그러면
bin들이 자기 크레이트의 lib를 `use my_crate::...`로 import해서 씀.

## JS 비유

| Rust | JS/npm |
|---|---|
| `lib.rs` | `index.js` (모듈 export) |
| `bin/*.rs` | `package.json`의 `"bin"` 필드 (CLI 실행 파일) |
| `cargo run --bin foo` | `npx foo` / `npm run foo` |

## 왜 중요한가

**CLI 검증 우선 원칙**과 직결. 무거운 뷰어(bevy app) 대신 작은 bin을
만들어서 수치/결과를 먼저 찍어보고 맞는지 확인 → 그다음 뷰어로 교차 검증.

### bevy-vrm 실례 (2026-04-13 pull)

`cinev_retarget` 크레이트 = lib + 여러 bin:
- 삭제: `arp2vrm_score.rs`, `diag.rs`, `fbx_dump.rs`, `finger_fbx_dump.rs`,
  `palm_check.rs`, `vrest_cmp.rs`, `scoring/*.rs`
- 추가: `pop_scan.rs`, `retarget_test.rs`, `validate_pipeline.rs`

= 리타겟 품질 검증용 CLI 도구들. 각 bin이 독립 실행 가능해서 "가장 작은
단위부터 테스트" 원칙을 그대로 구현. 뷰어 열기 전에 이 bin들로 먼저 돌려봄.

## Cargo.toml 설정

명시적으로 지정할 수도 있음:
```toml
[[bin]]
name = "tool_a"
path = "src/bin/tool_a.rs"

[lib]
name = "my_crate"
path = "src/lib.rs"
```

하지만 기본 관례(`src/main.rs`, `src/lib.rs`, `src/bin/*.rs`)를 따르면
Cargo가 알아서 인식하므로 보통 생략.

## 실행

```bash
cargo run                    # 기본 bin (src/main.rs)
cargo run --bin tool_a       # 특정 bin 지정
cargo build --bin tool_a     # 빌드만
cargo build --release        # 최적화 빌드 → target/release/
```
