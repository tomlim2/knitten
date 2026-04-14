# Scaffold (스캐폴드)

**Date:** 2026-04-14

## 핵심

**"비계 / 발판"** — 건축 현장의 임시 비계에서 온 비유. 소프트웨어에선
**"코드를 채우기 전 먼저 세워둔 빈 골격 구조"**.

어원: 중세 영어 *scaffald* "임시 무대, 발판" → 라틴어 *catafalcum*.

## bootstrap과의 차이 (헷갈리기 쉬움)

거의 동의어지만 미세한 강조점 차이:

| 단어 | 강조점 |
|---|---|
| **scaffold** | "공간/구조" — 빈 폴더, 빈 파일, placeholder가 **공간을 차지** |
| **bootstrap** | "시동/기동" — 빈 골격이 **빌드 시스템에서 굴러감** |

- scaffold = 골격이 *놓여있다*
- bootstrap = 골격이 *돌아간다*

실무에선 거의 같은 의미로 쓰여서 굳이 구분 안 해도 됨.

## 분야별 용법

| 맥락 | 의미 |
|---|---|
| **프레임워크 CLI** | `rails generate scaffold User`, `nest g resource` — 빈 컨트롤러/모델/뷰 자동 생성 |
| **프로젝트 시작** | `npm create vite@latest` 결과 = scaffold된 프로젝트 |
| **Rust** | `cargo new` — `Cargo.toml + src/main.rs` 빈 골격 |
| **테스트** | `it("should ...", () => { /* TODO */ })` 만 채워둔 것 |
| **DB 마이그레이션** | EF Core `Scaffold-DbContext` — DB → 빈 모델 클래스 자동 생성 |

## JS 비유

- `npx create-react-app my-app` 결과물 = React **scaffold**
- `package.json + src/App.js + public/index.html` 빈 구조 자동 생성
- 본인은 그 위에 실제 코드를 채움

## shotloom-retarget 맥락

"shotloom-retarget 부트스트랩" = "shotloom-retarget을 **scaffold**한다".
같은 작업을 다른 단어로 부른 것:

```
crates/shotloom-retarget/
├── Cargo.toml          ← scaffold
├── README.md           ← scaffold
└── src/
    └── lib.rs          ← scaffold (placeholder 한 줄)
```

이게 scaffolded state. 그다음이 진짜 코드 채우기.

## 동사로도 자주 씀

- "Let me **scaffold** the new module first" = 빈 골격부터 만들게요
- "It's **scaffolded**" = 골격 만들어진 상태
- "Don't scaffold yet" = 아직 빈 구조 만들지 마세요 (요구사항 확정 전)

## 비슷한 단어 정리

| 단어 | 강조 | 비유 |
|---|---|---|
| **scaffold** | 빈 구조/공간 | 비계 |
| **bootstrap** | 시동/굴러감 | 부츠 끈 잡아당기기 |
| **stub** | 호출은 되지만 동작 안 함 | 임시 더미 |
| **placeholder** | "여기 뭔가 들어갈 자리" 표시 | 견본 자리 |
| **template** | 복사해서 채울 본 | 양식 |
| **boilerplate** | 매번 똑같이 들어가는 표준 코드 | 상용구 |

## 한 줄

**Scaffold = 코드를 채우기 전 먼저 세워둔 빈 골격.** Bootstrap이랑 거의
같은 개념이지만 "구조가 있다"에 방점, bootstrap은 "시동이 걸린다"에 방점.
실무에선 섞어 써도 무방.
