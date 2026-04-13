# Rust: crate란?

**Date:** 2026-04-13

## 핵심

**crate = Rust의 컴파일 단위이자 패키지 단위.** 플러그인 아님. npm 패키지에 가까움.

- **binary crate** — 실행 파일 (bin)
- **library crate** — 재사용 라이브러리 (lib)

## JS 비유

| Rust | JS |
|---|---|
| **crate** | npm 패키지 (`node_modules/lodash/`) |
| **module** (`mod`) | 파일/폴더로 나눈 내부 모듈 |
| **Cargo.toml** | `package.json` |
| **crates.io** | npmjs.com |
| **workspace** | npm workspaces / pnpm monorepo |

## 계층

```
workspace (전체 monorepo)
 └── crate (= 패키지 하나)
      └── module (= 파일 단위 네임스페이스)
           └── function / struct / ...
```

## bevy-vrm 실례

```
bevy-vrm/              ← workspace
├── Cargo.toml         ← workspace 정의
├── src/               ← 루트 crate (bevy-vrm 뷰어 앱)
└── crates/            ← 하위 crate들
    ├── cinev_retarget/  ← 리타겟 로직 (lib + bin들)
    └── fbx_rig/         ← FBX 파싱 (lib)
```

### 2026-04-13 pull에서 본 것

원래 `cinev_retarget/src/fbx.rs` 안에 있던 FBX 파싱 코드를
**`crates/fbx_rig/` 독립 crate로 분리**.

이유: 다른 crate(예: 나중 `arp_rig`)도 FBX 파싱을 재사용할 수 있게.
JS로 치면 `utils/fbx.js`를 따로 npm 패키지로 떼낸 것과 같음.

## 플러그인과 다른 점

- **플러그인**: 런타임에 기존 앱에 끼워넣는 확장 (예: VS Code extension)
- **crate**: 컴파일 타임에 링크되는 의존성. 앱의 일부가 되어 같이 빌드됨.

### 주의: Bevy Plugin과 헷갈리지 말 것

Bevy 프레임워크는 `Plugin` 트레이트라는 **내부 개념**을 따로 씀
(앱에 시스템/리소스를 등록하는 방식). 그건 crate와는 다른 레이어:

- **crate** = 코드 패키징 단위 (빌드 시스템 레벨)
- **Bevy Plugin** = 런타임 조립 단위 (프레임워크 레벨)

하나의 crate가 여러 Bevy Plugin을 export할 수 있고, 반대로 하나의
Plugin이 여러 crate의 기능을 모을 수도 있음.

## Cargo.toml 연결

```toml
# 루트 Cargo.toml (workspace)
[workspace]
members = ["crates/cinev_retarget", "crates/fbx_rig"]

# crates/cinev_retarget/Cargo.toml
[dependencies]
fbx_rig = { path = "../fbx_rig" }  # 로컬 crate 참조
bevy = "0.14"                       # crates.io에서 가져옴
```

## 실행/빌드

```bash
cargo build                          # 전체 workspace 빌드
cargo build -p cinev_retarget        # 특정 crate만 빌드
cargo test -p fbx_rig                # 특정 crate 테스트
cargo run --bin retarget_test        # 특정 bin 실행
```
