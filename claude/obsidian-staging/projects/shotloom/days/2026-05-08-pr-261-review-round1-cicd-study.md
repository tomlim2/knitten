---
title: PR #261 round 1 review — CI/CD 공부 노트
tags:
  - type/devlog
  - project/shotloom
  - area/ci
  - area/learning
  - status/draft
date: 2026-05-08
source: claude
---

# PR #261 round 1 review — CI/CD 공부 노트

PR [#261](https://github.com/CINEV/shotloom/pull/261) (STL-326)에 대한 `hon454` 라운드 1 리뷰. 5개 인라인 + 본문 summary. 모두 *build infrastructure* 영역 — Containerfile과 GitHub Actions workflow YAML. CI/CD가 처음이라 라운드 자체가 공부 거리. 이 노트는 각 피드백이 *왜* 나왔는지 + 거기 등장하는 단어/개념을 풀어쓴 것.

---

## 0. 들어가기 전에 — "build infrastructure"가 뭐길래

지금 이 PR이 손대는 두 파일은 *애플리케이션 코드*가 아님:

- `apps/editor/Containerfile` — Docker가 읽는 *레시피*. "node 이미지 가져와서, 그 위에 Rust 깔고, wasm-pack 설치하고, pnpm으로 웹 번들 빌드해서, nginx에 얹어서 컨테이너 이미지로 만들어라"는 단계별 지시문.
- `.github/workflows/build-web-image.yml` — GitHub Actions가 읽는 *언제/어떻게 자동 실행* 정의. "v로 시작하는 태그가 push되거나 사용자가 workflow_dispatch 누르면 cinev-runner에서 buildctl 돌려서 위 Containerfile로 이미지 만들고 docker.cinamon.me 레지스트리에 push해라."

즉 *프로덕트 코드를 빌드해서 배포 가능한 형태로 만드는 컨베이어 벨트*. 컨베이어 벨트가 망가지면 새 버전을 사용자에게 못 내보냄. 그래서 리뷰 강도가 보통 코드보다 높음 — *모든 빌드*가 이 코드를 거쳐가니까.

용어 빨리 한 번 정리:

| 용어 | 뜻 | 비유 |
|------|----|------|
| **container image** | 운영체제 + 앱이 한 덩어리로 묶인 파일 | 즉석밥 (밥 + 그릇 + 데우는 법까지 한 패키지) |
| **Containerfile / Dockerfile** | 위 즉석밥 만드는 레시피 | 요리책의 한 페이지 |
| **layer** | 이미지의 한 단계 (한 RUN/COPY 명령 결과) | 케이크의 한 층 — 위에 새로 얹을 때 아래는 그대로 재사용 |
| **multi-stage build** | 여러 stage(`FROM ... AS X`)를 거쳐서 최종 이미지 만듦 | 임시 작업실(builder)에서 만든 다음 깔끔한 진열대(nginx)로 옮김 |
| **runner** | workflow를 실행하는 서버 | 식당 주방에서 실제로 요리하는 사람 (cinev-runner는 우리가 운영) |
| **registry** | 만들어진 이미지를 저장/배포하는 서버 | 도서관 — 누구든 가서 빌릴 수 있음 |
| **buildctl** | BuildKit (강력한 Docker 빌드 엔진)을 CLI에서 호출하는 도구 | 주방장에게 주문을 넣는 인터폰 |

---

## 1. Finding #1 — "wasm-pack 다운로드에 무결성 검사 없음" (Blocking)

### 리뷰어가 짚은 것

지금 Containerfile이 wasm-pack을 받는 방식:

```
curl -fsSL https://github.com/.../wasm-pack-v0.13.1-...musl.tar.gz | tar -xz ...
```

`curl`로 받아서 곧바로 `tar`로 풀어서 `/usr/local/bin/wasm-pack`에 설치. **받는 동안 그 파일이 진짜 wasm-pack v0.13.1인지 확인하는 단계가 없음.**

### 왜 이게 위험한가

세 가지 시나리오:

1. **Stealth re-tag** — 업스트림 메인테이너(또는 그 계정을 탈취한 누군가)가 같은 `v0.13.1` 태그에 *다른* 파일을 몰래 올림. 내일부터 우리 빌드가 다른 wasm-pack을 받아서 우리 wasm 번들에 그 결과가 박힘. 우리는 모름.
2. **TLS 우회** — 누군가 GitHub과 우리 runner 사이에 끼어들 수 있다면(거의 불가능하지만 위협 모델에 들어감) 다른 파일 끼워넣을 수 있음.
3. **GitHub 자체 사고** — 업스트림 release 자체가 손상됐는데 모르고 받음.

### 단어 풀이

| 단어 | 뜻 |
|------|----|
| **integrity check** | 받은 파일이 *원래 그 파일인지* 확인. 위·변조 탐지. |
| **checksum** | 파일 내용을 일정한 규칙으로 짧은 문자열로 압축한 값. 같은 입력은 같은 결과. 한 비트만 달라도 결과 완전히 달라짐. |
| **SHA-256** | 가장 흔한 checksum 알고리즘. 어떤 파일이든 64자(256비트) hex 문자열로 압축. 충돌(다른 입력이 같은 결과 내는 경우)이 사실상 불가능한 수준. |
| **digest** | checksum의 결과 값. "파일의 지문" 같은 것. |
| **pin** | 버전이나 digest를 *못 바뀌게 박음*. "이 정확한 값으로 고정". |
| **stealth re-tag** | 같은 버전 이름을 그대로 두고 안의 파일만 몰래 바꾸는 공격 |

### 적용한 fix

```dockerfile
ARG WASM_PACK_VERSION=v0.13.1
ARG WASM_PACK_SHA256=c539d91ccab2591a7e975bcf82c82e1911b03335c80aa83d67ad25ed2ad06539

RUN ... \
    && curl -fsSL -o /tmp/wasm-pack.tar.gz "https://github.com/.../wasm-pack-${WASM_PACK_VERSION}-...musl.tar.gz" \
    && echo "${WASM_PACK_SHA256}  /tmp/wasm-pack.tar.gz" | sha256sum -c -  \
    && tar -xz -C /usr/local/bin --strip-components=1 -f /tmp/wasm-pack.tar.gz ... \
    && rm /tmp/wasm-pack.tar.gz \
    && wasm-pack --version
```

핵심:

1. `curl ... -o /tmp/wasm-pack.tar.gz` — 파이프(`|`)로 바로 tar로 보내지 않고 *파일로 저장*. 검증하려면 일단 받아둬야 하니까.
2. `echo "${SHA256}  /tmp/wasm-pack.tar.gz" | sha256sum -c -` — 우리가 알고 있는 digest와 받은 파일의 digest를 비교. 다르면 non-zero exit → RUN 실패 → 빌드 실패. *틀린 파일이 다음 단계로 안 넘어감.*
3. `tar -xz -f /tmp/wasm-pack.tar.gz` — 검증 통과한 파일만 풀음.
4. 다음 버전 올릴 때 `WASM_PACK_VERSION`만 바꾸고 `WASM_PACK_SHA256` 안 바꾸면 build가 verification step에서 실패 → *digest 갱신을 강제*하는 부수 효과. 새 파일을 다운받아 sha256sum 떠보고 그걸 박아야 함.

### `sha256sum -c -` 문법 살짝

`sha256sum` 명령은 "파일의 sha256 출력" 모드와 "파일의 sha256가 *기대값*과 같은지 검증" 모드 둘 다 가짐. `-c`가 검증 모드. 입력 형식은 한 줄에 `<digest>  <filename>` (공백 두 개). `echo`로 그 형식의 한 줄을 만들고 stdin (`-`)으로 sha256sum에 넘겨주는 패턴.

```
echo "abc...  /tmp/wasm-pack.tar.gz" | sha256sum -c -
```

= "이 파일의 진짜 sha256가 abc...랑 일치하는지 봐라". 일치하면 `OK` + exit 0, 아니면 경고 + exit 1.

---

## 2. Finding #2 — "x86_64 하드코딩됨" (Should)

### 리뷰어가 짚은 것

URL 안에 `x86_64-unknown-linux-musl`이 그대로 박혀있음:

```
https://github.com/.../wasm-pack-v0.13.1-x86_64-unknown-linux-musl.tar.gz
```

cinev-runner가 오늘 x86_64라서 동작. 만약 누가 ARM64 (Apple Silicon, AWS Graviton 등) runner를 cinev-runner 라벨로 추가하면 — 같은 URL이 ARM64에서 다운로드되고, ARM64에서 x86_64 binary는 못 돌림. URL 자체가 404나거나, 받아도 실행 안 됨. 그런데 *이게 왜 깨지는지*를 코드만 보면 모름. 미래의 누가 한참 디버그함.

### 단어 풀이

| 단어 | 뜻 |
|------|----|
| **architecture (arch)** | CPU 명령어 집합. x86_64, arm64, aarch64 등. 다른 arch용으로 컴파일된 binary는 안 돌아감. |
| **musl** | C 표준 라이브러리의 한 구현. Alpine Linux나 정적 binary에서 흔함. 다른 구현(glibc)과 호환되지만 약간 다름. |
| **runner label** | GitHub Actions에서 어떤 runner가 job을 받을지 매칭하는 태그. `runs-on: [cinev-runner]` 처럼. 라벨 같으면 어느 runner든 들어올 수 있음. |
| **silently fail** | 명령은 성공한 것처럼 보이는데 실제로는 잘못된 결과를 낸 경우. 가장 디버그하기 어려운 실패 모드. |
| **fail loud** | 실패할 때 정확히 *어디서, 왜* 실패했는지 명확한 메시지를 남기고 멈춤. 위와 반대. |

### 옵션 두 가지 + 우리가 고른 것

리뷰어 제안:
1. URL을 build-arg나 `$(uname -m)` 매핑으로 파라미터화 → 어떤 arch든 자동 대응.
2. "x86_64-only by design" 한 줄 코멘트 추가 → 미래 누가 다른-arch runner 추가하면 curl이 404로 loud하게 실패. 디버그할 때 코멘트 보고 즉시 원인 알 수 있음.

리뷰어가 "지금은 옵션 2면 충분"이라 권장 → 그대로 따름. 옵션 1은 진짜 다른-arch runner가 들어올 *확실한 계획*이 있을 때 의미. 지금은 추측인지라 over-engineering.

적용:

```dockerfile
# This stage assumes an x86_64 builder by design — the tarball URL is
# hardcoded to `x86_64-unknown-linux-musl`. cinev-runner is x86_64 today;
# adding a non-x86_64 runner without parameterizing the URL will fail
# loudly at the `curl -fsSL` step (404 → non-zero exit, surfaced by the
# `SHELL ["/bin/bash", "-o", "pipefail", "-c"]` directive at the top of
# this stage).
```

### "fail loud vs silent" 패턴

CI/CD에서 *반복되는* 키 원리. 왜 loud을 선호하나:

- Silent failure = 빌드는 통과한 것처럼 보임. 이미지가 만들어짐. 아무도 알아차리기 전에 production에 배포됨. 사용자가 깨진 화면을 봄. 그제서야 알게 됨. 디버깅이 *역방향*으로 일어남.
- Loud failure = 빌드가 명확한 에러 메시지로 멈춤. 누가 봐도 "여기서 깨졌다"는 게 보임. 5분 안에 고침. *고장난 코드가 production에 절대 안 닿음.*

리뷰어가 #2와 #3 모두 이 원리를 적용하고 있음.

---

## 3. Finding #3 — "pipefail 안 켜짐" (Low)

### 리뷰어가 짚은 것

Docker의 RUN 명령은 기본적으로 `/bin/sh -c '...'`로 실행됨. `/bin/sh`는 기본적으로 *pipefail 옵션이 꺼져있음*. 그게 무슨 뜻인지 예시로:

```bash
curl -fsSL https://wrong-url.example/wasm-pack.tar.gz | tar -xz ...
```

만약 URL이 틀려서 `curl`이 실패해도, `tar`는 *빈 stream을 받아서 success로 판단*함. 그러면 RUN 전체의 exit code는 마지막 명령(`tar`)의 exit code 가져감 → 0 (success) → RUN이 통과한 것처럼 보임. 다음 단계로 넘어감. 한참 뒤 `wasm-pack --version` 호출이 *실제로* 실패해서 그제야 멈춤. 에러 메시지는 "wasm-pack: command not found" — 진짜 원인(curl이 다운로드 실패)에 대해 한 마디도 안 함.

### 단어 풀이

| 단어 | 뜻 |
|------|----|
| **pipe (`\|`)** | 한 명령의 출력(stdout)을 다음 명령의 입력(stdin)으로 연결. 예: `curl ... \| tar ...`. |
| **pipefail** | bash 옵션. 켜면 파이프 안 *어느* 명령이라도 실패하면 전체 파이프라인이 실패한 것으로 침. 끄면 마지막 명령만 봄 (위험). |
| **exit code** | 명령이 끝났을 때 OS에 돌려주는 숫자. 0 = 성공, 0이 아니면 실패. |
| **SHELL directive** | Dockerfile에서 RUN 명령이 사용할 셸을 바꾸는 지시문. 한 번 선언하면 그 stage의 모든 RUN에 적용. |

### 적용한 fix

builder stage 상단에 한 줄:

```dockerfile
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
```

= "이 stage의 모든 RUN은 `/bin/bash -o pipefail -c '...'` 로 실행해라". `-o pipefail`이 켜진 bash는 파이프 안 어느 명령이 실패해도 전체 파이프 실패로 침. 그러면 위 시나리오에서 `curl`이 404로 죽으면 `tar`까지 안 가고 *바로 그 자리에서* RUN 실패. 에러 메시지가 "curl: failed with HTTP 404"로 명확.

### 왜 "Low" 우선순위인가

실제로 깨지지는 않음 — 트레일링 `wasm-pack --version`이 잡으니까. 결국 빌드는 실패함. 단지 *실패 메시지가 엉뚱한 곳을 가리킴*. 디버깅 시간만 날리는 결함.

리뷰어가 "Low priority — flagging because the failure mode would be confusing to debug"라 한 정확한 이유.

---

## 4. Finding #4 — "corepack 코멘트 누락" (Nit)

### 리뷰어가 짚은 것

우리가 `COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules`로 lib 트리 통째 복사. 그 안에 `npm/`, `npx/`, **`corepack/`** 디렉토리가 다 들어옴. 우리는 npm과 npx에 대해서만 `RUN ln -s`로 `/usr/local/bin/{npm,npx}` symlink 다시 만들었음. corepack은 안 만듦. 그래서 *corepack은 lib에는 있는데 PATH에서는 안 보이는* 상태.

이게 의도인지 실수인지 코드만 보고 모름. 미래 누가 "어, npm/npx만 있고 corepack 없네? 까먹은 거 아닌가?" → 실수로 추가 → 의도와 다른 동작. 한 줄 코멘트로 *의도임*을 못 박으면 그 혼란 차단.

### 왜 corepack을 안 노출하나

corepack은 Node 24부터 기본 동봉되는 패키지 매니저 프록시. `corepack enable pnpm`이라 하면 corepack이 pnpm을 자동으로 다운받아 활성화해줌. 보통 권장 설치 경로.

그런데 우리는 `npm install --global pnpm@10.0.0`로 *직접* 설치 중. 명시적 버전 핀 + 빌드 재현성. corepack을 안 거치니 corepack 자체를 노출할 필요 없음. 그래서 의도적으로 PATH에서 빠져있는 것.

### 단어 풀이

| 단어 | 뜻 |
|------|----|
| **launcher / shim** | 실제 프로그램은 어딘가에 있고, PATH에는 그걸 호출하는 *작은 프록시 스크립트만* 있는 패턴. `/usr/local/bin/npm`이 lib/node_modules/npm/bin/npm-cli.js를 require하는 게 그 예. |
| **package manager proxy** | corepack처럼 다른 패키지 매니저(npm, pnpm, yarn 등)을 띄워주는 도구. |
| **reproducibility** | 같은 입력으로 빌드하면 *항상 같은 결과* 나오는 성질. 버전 핀이 reproducibility의 가장 기본. |

### 적용한 fix

symlink 코멘트 블록에 한 단락 추가:

```dockerfile
# corepack is intentionally NOT exposed — its lib/node_modules/corepack/
# directory rides along with the COPY but no /usr/local/bin/corepack
# symlink is recreated, because pnpm is installed directly via
# `npm install --global pnpm@10.0.0` below rather than via
# `corepack enable pnpm`.
```

미래 reader가 "corepack이 왜 PATH에 없지?" 의문 가질 때 그 자리에서 답을 봄.

---

## 5. Finding #5 — "no-cache 코멘트에 jump-off 추가" (Nit)

### 리뷰어가 짚은 것

workflow에 캐시를 *왜 안 깔았는지* 설명하는 9줄 코멘트가 있음. 잘 쓰여있음. 다만 "다음에 이걸 revisit할 사람이 *이게 어디서 결정됐고 어떤 측정 데이터에 기반하는지* 빠르게 찾아갈 포인터" 추가하라.

### 왜 jump-off가 필요한가

3개월 뒤 누가 "캐시 다시 시도해볼 만한가?" 의문 들었을 때:
- 코멘트만 보면 "2026-05-07에 cold/warm 같았다" — 하지만 *어떻게* 같았는지, 그 측정 자체가 신뢰할 만한지는 모름.
- run ID(`25480453151` cold, `25481021984` warm)를 박아두면 그 사람이 즉시 GitHub Actions로 가서 진짜 로그를 확인 가능.
- Linear 이슈(STL-326, STL-329)를 박아두면 결정의 *맥락* (인프라 오너 합의, perf 후속 작업 위치)도 즉시 따라갈 수 있음.

### Tension: H8 룰

Claude 쪽 가이드에 "Linear ID(`STL-NN`)는 commit message랑 PR description에만 — 코드/워크플로 코멘트에는 넣지 마라" 룰이 있음. 이유: 트래커는 rot됨 (이슈 renumber, archive, 프로젝트 마이그레이션). 코드는 영원하지만 트래커 링크는 깨짐.

대화에서 사용자가 *그래도 이번엔 리뷰어 의견 우선*으로 결정 → STL-326, STL-329 둘 다 박음. 사용자 판단: 인라인 jump-off의 즉각적 편의성 > 장기 rot 리스크.

### 단어 풀이

| 단어 | 뜻 |
|------|----|
| **jump-off (point)** | "여기서부터 깊이 파고들 수 있는 출발점". 짧은 reference라도 거기서 더 자세한 정보로 갈 수 있는 단서. |
| **tracker rot / link rot** | 시간이 지나면서 외부 트래커/링크가 깨지는 현상. URL이 바뀌거나 이슈가 archive되거나. |
| **git blame** | 어떤 줄이 *어느 commit에서 들어왔는지* 추적하는 도구. `git blame <file>` 또는 GitHub UI에서 한 줄 옆 ⋮ → "View blame". 코드의 *who/why*를 PR로 거꾸로 따라갈 때 필수. |

### 적용한 fix

기존 9줄 코멘트에 한 줄 추가:

```yaml
# verified 2026-05-07 in workflow_dispatch runs
# 25480453151 (cold) and 25481021984 (warm); both took the same
# wall time). ... Linear: STL-326 (this PR) and STL-329 (follow-up
# perf slice that needs the persistent cache surface).
```

---

## 6. 라운드 흐름 자체가 어떻게 굴러갔나 (CI/CD 첫 라운드 메타)

이게 첫 라운드 리뷰 사이클. 흐름:

1. PR open (draft → ready 승격) → CI 자동 트리거 → 모든 check pass → `/claude-review` 코멘트로 GitHub App 리뷰 트리거.
2. 리뷰어 `hon454` (사람? 봇? — 이번엔 사람 같이 정밀함)가 inline 5개 + body summary로 CHANGES_REQUESTED 표시.
3. 리뷰 내용을 *carefully* 읽고 — 각 finding을 두 axis로 분류:
   - **Scope**: 이 PR 영역에 맞나, 다른 PR 거리인가
   - **Justification**: 리뷰어 말이 정말 옳은가, 옳다면 제안한 fix 모양이 정확한가
4. 5개 중 4개는 *reviewer 말 그대로 옳음*, 1개는 사용자 룰(H8)과 충돌 — 사용자에게 surface해서 결정 받음.
5. Containerfile + workflow 수정 → commit → push.
6. 인라인 reply 5개 + suppressed-summary review-level reply 1개 + 재리뷰 요청 — *모두 사용자 batch 승인 후*에 post.
7. 라운드 2 시작 (리뷰어가 다시 봄).

이걸 3-5번 반복해서 결국 APPROVED 받으면 머지 가능. round 수가 적을수록 좋음 — 매 라운드는 사람 시간이니까.

### 라운드 수 줄이는 팁 (이번에 배운 것)

- **리뷰어가 "Must address"라고 한 항목은 무조건 깔끔히 처리.** 협상 없음.
- **"Should address"는 리뷰어가 옵션 제시했으면 그중 가벼운 거 선택해서 적용.** 우리 case: 옵션 2 (코멘트만 추가) 채택.
- **"Nit"도 *대부분* 적용.** 무시하면 round 2에서 "왜 안 했냐" 한 번 더 적힘. 그 과정 자체가 round 늘림.
- **명시적으로 disagree할 때만 미룸.** 그리고 disagree할 때는 *룰을 인용*해서 reply. "아 이거 우리 안 함" 식이면 안 됨.

### 라운드 1에서 *내가* 했어야 할 것 (post-mortem)

이번 라운드 1에서 reviewer가 짚은 것 중 #1 (SHA256)와 #3 (pipefail)는 *PR 만들기 전에* 잡혔어야 함. 둘 다 build infra의 잘 알려진 보안/실패-모드 패턴. 다음에 Containerfile 손볼 때 미리 체크리스트:

- `curl | tar` 패턴 → SHA256 검증 + pipefail 셸 사용
- 외부에서 받는 모든 binary → digest 핀
- arch 하드코딩 → 코멘트로 명시 (또는 파라미터화)
- symlink 재생성 → COPY가 dereference한다는 점 인지하고 어느 launcher들 빠졌는지 점검

이게 review-rust.md에는 없음 (Rust 전용). build-infra 가이드라인을 별도로 만드는 게 자연스러운 후속 작업 — 이번에 한 번 깨진 것들이 다음에 또 안 깨지게.

---

## 7. 한 라운드 끝의 자기 점검

| 질문 | 답 |
|------|---|
| 리뷰어 P0/Must address 항목 다 처리했나? | 예 (#1) |
| Should address 처리했나? | 예 (#2, #3) |
| Nit 처리했나? | 예 (#4, #5) |
| 적용 못 한 항목 있다면 reply에 *기술적 근거* 명시했나? | N/A — 모두 적용 |
| commit message가 reviewer-readable한가? | 예 (`8c8a471`: "address hon454 review on PR #261 — sha256, pipefail, docs") |
| 새 변경이 새 회귀 안 일으키는지 확인했나? | 진행 중 (smoke run 25527059321 — sha256 + pipefail이 깨지면 지금 build 실패할 것) |
| reply 한 줄 한 줄에 commit SHA 박혀있나? | 예 (`Fixed in 8c8a471` 패턴) |
| 재리뷰 요청 보내기 전에 사용자 배치 승인 받았나? | (대기 중) |

### 사이드 노트

- **비유로 정리.** 이 라운드 = 식당에서 손님이 음식 한 입 먹고 "이거 간이 좀..."이라 한 다음, 셰프가 즉석에서 다시 간 맞추고, 깨끗한 새 접시에 내고, "다시 한번 봐주세요"하는 사이클. 음식 자체를 처음부터 다시 만드는 게 아니라 *제기된 부분만 정확히 손봐서* 다시 들임.
- **CI/CD 라운드는 *대화*다.** 리뷰어 코멘트는 비난이 아니라 시스템을 더 robust하게 만들기 위한 input. 받아들이면서 동시에 *왜 그게 필요한지* 이해하는 게 다음 PR에서 같은 지적 안 받게 하는 길.
- **모든 자동화가 사람 손을 거친다.** "CI/CD 자동" = 트리거가 자동인 거지 *결정*은 여전히 사람. PR 머지 결정, draft → ready 승격, `/claude-review` 트리거, 재리뷰 요청 — 다 사람이 누름. 자동화는 *반복되는 로딩 작업*만 가져간 것.
