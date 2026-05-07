---
title: "crossOriginIsolated — COOP + COEP 한 짝"
tags:
  - type/learning
  - project/shotloom
  - area/web
  - lib/wasm
  - status/draft
date: 2026-05-07
source: claude-code
---

# crossOriginIsolated — COOP + COEP 한 짝

웹 페이지가 `SharedArrayBuffer` / `Atomics` / 일부 `WebGPU` 동작을 쓸 수 있는 상태. 헤더 두 개가 같이 박혀야만 됨. Shotloom의 Bevy wasm 멀티스레드 + WebGPU 코드 경로가 이 상태에 의존.

## 왜 잠겼나

2018년 Spectre / Meltdown 사이드채널 공격 이후, **고정밀 타이머**(microsecond)가 공격 성공 조건이라 브라우저들이 `SharedArrayBuffer`(공유 메모리 + 빠른 워커 간 통신, 사실상 정밀 타이머 구성 가능)를 일괄 비활성화. 다시 켜려면 페이지가 "내가 외부 origin에 오염될 가능성이 없다"고 두 헤더로 선언해야 됨.

## 두 헤더

### COOP — Cross-Origin-Opener-Policy

페이지의 **window/opener** 관계 격리.
- `same-origin`: 다른 origin이 `window.opener`로 우리 페이지 window 객체에 못 만짐.

비유: 내 식당 주방에 다른 가게 점원이 들어와 그릇 못 만짐.

### COEP — Cross-Origin-Embedder-Policy

페이지가 **임베드하는 리소스**의 출처 검증.
- `require-corp`: 외부 origin 응답이 **CORP**(`Cross-Origin-Resource-Policy`) 또는 **CORS** 헤더로 명시적으로 허용해야만 받음. 없으면 차단.
- `credentialless`: CORP 없어도 받지만 쿠키/credentials 안 보냄.

비유: 내 가게에 다른 가게 메뉴 띄울 때, 그쪽 가게가 "여기서 띄워도 OK"라고 사인 보낸 것만 보여줌.

## 두 개 다 켜져야 → `crossOriginIsolated = true`

페이지의 `window.crossOriginIsolated` 가 `true`가 되어야 잠금 해제. 둘 중 하나라도 빠지면 `false`.

```js
if (!self.crossOriginIsolated) {
  // SharedArrayBuffer === undefined
  // WebGPU 일부 기능 깨짐
}
```

## CORP vs COEP — 헷갈림 주의

| 헤더 | 누가 박나 | 의미 |
|---|---|---|
| **COOP** | 페이지 응답 | "내 window 다른 origin이 못 만짐" |
| **COEP** | 페이지 응답 | "내가 외부 리소스 받을 때 CORP/CORS 있어야만" |
| **CORP** | 리소스 응답 | "이 리소스는 X origin에서만 임베드 가능" |

COEP `require-corp` 페이지가 외부 리소스 받으려면 그 자원이 CORP 또는 CORS 보내야 함. 헤더 두 개가 한 짝(페이지측 COEP + 자원측 CORP).

## Shotloom 적용 지점

- **`apps/editor/vite.config.ts:85-86`** — dev server에 두 헤더 강제. dev에서 wasm/WebGPU가 동작하는 이유.
- **production 컨테이너 (PR #253)** — nginx.conf에서 동일 헤더 박아 dev/prod 패리티. 같은 헤더가 없으면 화면은 뜨지만 wasm 워커 fail.
- **GitHub Pages 후보 탈락 사유** — Pages는 커스텀 응답 헤더 설정 불가. COOP/COEP 못 박으면 wasm 동작 깨짐. STL-304 결정 D10에 명시.
- **Cloudflare Workers Static Assets는 OK** — 헤더 커스터마이즈 가능, 향후 호스팅 후보.

## 진단 — 화면 깨졌을 때 콘솔에 뜨는 것

| 메시지 | 원인 |
|---|---|
| `SharedArrayBuffer is not defined` | 페이지가 isolated 아님. COOP 또는 COEP 빠짐. |
| `ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep` | 외부 리소스가 CORP/CORS 안 줘서 차단됨. |
| `Crashing worker process` (wasm) | isolated 아닌데 SharedArrayBuffer 쓰려다 실패. |

확인:
```js
console.log(self.crossOriginIsolated)  // true면 OK
```

## 호스팅 측 체크리스트

production 호스트가 다음을 만족해야 Bevy wasm + WebGPU 정상 동작:

- [ ] HTTP 응답에 `Cross-Origin-Opener-Policy: same-origin`
- [ ] HTTP 응답에 `Cross-Origin-Embedder-Policy: require-corp`
- [ ] HTTPS 또는 `localhost` (secure context)
- [ ] 외부 origin 리소스 사용 시 그쪽이 `Cross-Origin-Resource-Policy` 또는 `Access-Control-Allow-Origin` 응답

위 4개 중 하나라도 빠지면 wasm 멀티스레드/WebGPU 일부 깨짐.

## 참고

- [MDN: Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
- [MDN: Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy)
- [web.dev: Making your website "cross-origin isolated"](https://web.dev/articles/coop-coep)

---

#gotcha COOP만 박고 COEP 빠뜨리거나 그 반대 — 둘 다 있어야 isolated
#gotcha GitHub Pages는 커스텀 헤더 안 됨 → wasm/WebGPU 페이지에 부적합
#rule production 호스트 결정 시 COOP/COEP 커스텀 헤더 가능 여부가 첫 필터
