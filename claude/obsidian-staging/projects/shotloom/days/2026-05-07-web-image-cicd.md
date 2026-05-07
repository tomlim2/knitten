---
title: "2026-05-07 — 웹 이미지 CI/CD 첫 구축 round 1"
tags:
  - type/devlog
  - project/shotloom
  - area/ci
  - lib/github-actions
  - status/draft
date: 2026-05-07
source: claude-code
---

# 2026-05-07 — 웹 이미지 CI/CD 첫 구축 round 1

CI/CD를 처음 손대는 사람 기준으로 정리. STL-304, 파생 이슈 STL-306/STL-323, PR #253. 나(`tomlim2`)가 워크플로우 스캐폴드 + 런타임 에셋 vite plugin + concurrency race 수정 + tag-driven 트리거 전환을 만들고, KimGilsu가 그 위에 BuildKit + cinev-runner + nginx + GitOps 매니페스트 갱신까지 끌어올렸다. round 1 리뷰는 `hon454`.

## 무엇이 일감이었나

웹 빌드 산출물을 사용자가 받아볼 수 있는 경로가 아예 없었다. 로컬에서 `pnpm build:web`으로 dist는 만들 수 있지만, "그 빌드를 어디 띄워서 누가 확인" 같은 흐름이 없음. 일감은 그 빌드를 컨테이너 이미지로 만들어 사내 레지스트리(`docker.cinamon.me`)에 올리고, 같은 동작이 GitOps 메니페스트(`CINEV/prototype-manifest`의 `shotloom/deployment.yaml`)도 자동으로 갱신해서 클러스터에 반영되게 만드는 것.

직접 짜야 할 것은 두 갈래:

1. **이미지 빌드**: Containerfile (Rust+Node 멀티스테이지) + nginx 서빙 (COOP/COEP 헤더, VRM/glTF MIME).
2. **CI 워크플로우**: 트리거 → buildctl 빌드 → 레지스트리 push → manifest 갱신.

## 왜 이렇게 했나 — 결정마다의 이유

### 트리거를 처음엔 브랜치 push, 나중에 v* 태그 push로

처음 PR #243에서는 zip/tar.gz를 GitHub Release에 첨부하는 방향이었다. 로컬에서 컨테이너로 검증해보니 Caddy 기반 이미지가 더 직접적이라 #253으로 갈아엎었다. 그때 트리거가 `branches: [chore/ci-web-image-build]`였는데, 머지 시 그 브랜치가 사라지면 트리거도 자연 소멸 → 머지 자체로는 새 이미지 안 만들어짐. 그게 의도였다.

이후 사용자(=architect)가 "태그 push마다로 가시죠"라고 결정. 이유는: 머지가 곧 배포가 아니어야 한다. 릴리즈는 사람이 의도해서 `git tag v0.1.0 && git push --tags`를 칠 때만 일어나야 GitOps 이미지 churn이 의미있는 순간에만 발생.

배운 점: 트리거 정책은 **누가 배포 결정권을 가지는가**를 코드로 표현하는 것. push-on-main이면 머저가 결정하고, tag push면 릴리즈 주도자가 결정한다.

### nginx 헤더 — Caddy에서 옮겨오면서 한 번 망가짐

처음 Caddy로 짰을 때 `Cross-Origin-Resource-Policy: same-origin`을 같이 줬다. nginx로 옮기면서 그 헤더가 빠졌고, 다행히 same-origin 요청만 있는 상태라 동작에 문제는 없었다. 다만 COEP `require-corp`가 켜져있을 때 cross-origin 임베드를 받을 일이 생기면 그쪽 응답에 CORP나 CORS가 있어야 한다. 후속 호스팅에서 문제될 수 있는 잠재 버그.

bevy의 `.meta` 사이드카 probe는 특이했다. asset_server가 `default/checker.png.meta` 같은 사이드카를 매번 fetch하는데, 없으면 404를 받아 default meta로 떨어진다. 그런데 vite dev middleware는 404 + body `"Not Found"` + `Content-Type: text/plain`로 응답하고, 처음 쓴 Caddy는 빈 body로 응답. bevy가 빈 응답을 RON 파싱하다가 deserialize 에러 로그를 뱉었다. 결국 `Not Found` 본문 + plain text MIME으로 dev 동작을 미러링하니 정리됨. 단순한 정적 서버가 아니다.

### 런타임 에셋 dist 포함 (STL-306)

**가장 헷갈렸던 갭.** vite dev mode가 `serveRepoAssets` 미들웨어로 repo의 `assets/`를 `/assets`에 노출한다. 그런데 그 미들웨어는 `configureServer` 안에만 있어서 production build엔 안 따라옴. 즉:

- 로컬 dev: 잘 보임
- 로컬 build (`pnpm build:web` → `apps/editor/dist/`): `dist/assets/`엔 vite 번들 (JS/CSS/WASM)만, 런타임 에셋 (PNG/VRM/FBX) 없음
- production 컨테이너: `/assets/default/checker.png` 404, 화면 깨짐

이걸 처음에 컨테이너 띄우고 콘솔 보면서 발견. 첫 시도는 `vite-plugin-static-copy` 플러그인이었는데 dest 경로가 한 단계 더 깊어지는 버그(`dist/assets/assets/default/...`)로 폐기. 결국 `closeBundle` hook의 inline plugin으로 직접 `cpSync`. 261MB(`assets/models` 236MB가 대부분)를 dist에 박아서 dist 크기가 59MB → 320MB가 됐다.

이게 **scope 영역 문제로 본 PR과 분리**할 만했지만, 분리하면 production 이미지가 동작 안 하므로 같이 묶었다. STL-306은 이 fix를 추적하는 이슈. 나중에 STL-323에서 `readdirSync` 기반 동적 리스트로 발전시킬 수 있다.

### `update-manifest`의 git push race

워크플로우 두 번째 job이 `prototype-manifest` 레포 main으로 직접 push한다. 처음 concurrency 그룹 키가 `github.sha`를 포함하고 있어서 push마다 unique → 같은 브랜치에 빠르게 두 번 push하면 두 워크플로우가 동시에 manifest 갱신 시도 → non-fast-forward 한 명 실패. AI Deep Review 봇(`github-actions[bot]`)이 잡아냈다.

수정 안은 두 갈래:
- (A) concurrency 그룹 키에서 SHA 빼기 → 같은 브랜치 push가 한 그룹으로 큐잉
- (B) `git pull --rebase origin main` 후 push로 race 우아하게 처리

(A)가 race 자체를 차단하고 (B)는 발생 후 복구. (A) 채택. 이후 tag-driven으로 트리거가 바뀌면서 그룹 키 자체를 resolved tag 기준으로 단순화.

### USER nginx — 한 줄짜리가 한 줄이 아니었음

reviewer는 "nginx:alpine은 master를 root로 도니 `USER nginx` 한 줄로 권한 강등 가능, free hardening win"이라고 했다. 그대로 추가하면 PID 파일을 root만 쓸 수 있는 `/var/run/nginx.pid`에 쓰려다가 startup 실패. 권장 그대로 하면 망가짐.

textbook 패턴(`/var/run/nginx.pid` → `/tmp/nginx.pid` 재배치 + `chown -R nginx:nginx /var/cache/nginx /usr/share/nginx/html`)이 진짜 fix. reviewer 권장보다 강한 형태. 이게 **`justified — fix differently`** 케이스에 해당하지만 reviewer 의도(prod에서 root 안 띄움)는 같으므로 surface 후 진행.

## 어떤 리뷰를 받았나

`hon454`가 round 1을 두 surface로 남김:

1. **Main review body** (02:01) — code-review-guideline 기준 통과, P0/P1 0건. P3 nit 14개와 scope 디자인 질문 1개. 반드시 수정 없음, 비-blocking.
2. **Top-level "Suggestion: a non-deploying test-release path"** (02:05) — scope 질문을 구체 제안으로 elaboration. "현재 모든 트리거가 prod 매니페스트 갱신으로 흘러간다. workflow_dispatch에 `publish: bool` 토글 추가 + `update-manifest`에 `if:` 조건. publish=false면 이미지만, manifest 무관"이라는 30분짜리 제안.
3. **Second review body + 11 inline P3 nits** (02:09) — main review의 14개 중 11개를 인라인 thread로 분리해 다시 단 것.

P3 항목 분류:

| 파일 | 항목 |
|---|---|
| workflow | DRY tag, fetch-depth: 1, AWK→yq, BuildKit cache, OCI labels, checkout@v6 toolcache |
| Containerfile | COPY --from=node 좁히기, wasm-pack 사전컴파일, HEALTHCHECK, USER nginx |
| nginx.conf | WASM MIME explicit, hashed asset long-cache |
| vite.config.ts | cpSync async, RUNTIME_ASSET_SUBDIRS 하드코딩 |

## 어떻게 처리했나

### 분류 → 스코프 결정

reviewer가 "전부 non-blocking"이라고 명시했으니 머지 자체는 안 막힘. 어디까지 본 PR에서 처리할지가 결정. 옵션:
- A. 다 적용 — PR이 부풀음
- B. 작은 것만 (1-3 line짜리), 나머지 follow-up
- C. 거의 다 defer

옵션 B 채택. 이유: 작은 win은 시간 비용 거의 0, 무거운 재구조화(builder COPY refactor, BuildKit cache, AWK→yq, wasm-pack tarball, staging channel)는 measurable 비용이 있고 별도 diff로 다루는 게 builder의 원작자(KimGilsu) 검토에도 깔끔.

### Codex로 한 번 확인

처음 해보는 PR review 응답이라 cross-check 필요했다. `/dev-ask-codex`로 일반화된 질문(프로젝트명/라이브러리 버전 빼고): "전부 non-blocking인 P3 review에 작은 것만 본 PR + 큰 것 follow-up 이슈로 분리하는 shape이 표준 팀 관행인가? Top 3 pitfall."

답:
- shape 표준임
- pitfall 1: over-bundling — 1-3 line이라도 runtime 동작 바꿀 수 있음. **재리뷰 요청 전 smoke test 필수**.
- pitfall 2: defer without closure — 따로 이슈 만들고 명확히 어떤 게 deferred인지 적어둘 것.
- pitfall 3: reply shape mismatch — review-level summary는 좋지만 thread-specific 응답을 대체하지 말 것.

pitfall 1이 진짜 짚어줘서 도움됨. 그 결과 새 워크플로우 dispatch (`workflow_dispatch + publish=false`)로 새 Containerfile + workflow 변경을 풀체인 검증한 후에 reply 게시. publish=false 토글 자체가 reviewer 제안 + smoke test surface 둘 다 됨.

### 직접 처리한 8개 + STL-323 묶은 6개

**`7023575` 한 커밋에 8개 fix:**

1. `inputs.publish` 토글 + `update-manifest` `if:` 조건 (reviewer 제안 그대로)
2. tag resolution을 `build-push.outputs.image`로 승격 → DRY
3. `fetch-depth: 0` → `1`
4. OCI labels (source/revision/version/created)
5. `HEALTHCHECK` (wget 기반, 30s 간격)
6. `USER nginx` + pid 재배치 + chown (reviewer 권장보다 강한 형태)
7. nginx hashed asset long-cache
8. vite.config.ts `RUNTIME_ASSET_SUBDIRS` 위 dev/prod parity 경고 주석

**STL-323 묶은 6개 (defer-with-issue):**

- staging channel 분리 (디자인 + 인프라)
- AWK → yq
- BuildKit cache export/import
- Containerfile builder `COPY --from=node` 타깃 좁히기
- wasm-pack 사전컴파일 tarball + cargo cache mount
- WASM MIME explicit + cpSync async (cosmetic 묶음)

## 한 번 삐끗한 것 — fetch-cache stale

PR #253 round 1 응답 시 한 가지 사고가 있었다.

타임라인:

```
02:01 hon454 main review (body only, 0 inline)
02:05 hon454 top-level suggestion thread
02:09 hon454 second review with 11 INLINE comments  ← 여기서 들어옴
... (긴 갭: smoke test, codex 상의, draft 작성)
02:44 내 review-level summary 게시 (인라인 thread 무시한 채로)
02:46 hon454 → CHANGES_REQUESTED (인라인이 미응답이라)
02:48 인라인 11개 reply 뒤늦게 게시
```

원인: `/shotloom-respond-pr` 스킬의 Step 2 (fetch)와 Step 6 (post) 사이가 실시간으로 30분+ 벌어졌고, 그 사이에 reviewer가 인라인 11개를 추가. 내가 Step 2 캐시(`/tmp/pr253-comments.json`)를 그대로 쓰면서 인라인 thread를 못 봄. Step 2 fetch는 02:05 직후, 인라인 도착은 02:09, 내 reply는 02:44.

review-level summary 자체는 정확했지만 GitHub 모델상 thread는 thread-specific reply가 와야 닫힌다. summary가 11개 thread를 자동으로 닫지는 않음 → reviewer 입장에서 11개 미응답 → CHANGES_REQUESTED.

**fix:** 스킬 SKILL.md Step 6 앞부분에 "Re-fetch before posting (mandatory)" 섹션 추가. 다음 round부터는 Step 6 직전에 무조건 `gh api .../comments`/`/reviews`/`pr view` 재호출하고, Step 2 캐시와 id set 비교. 새로 추가된 thread가 있으면 그것들도 Step 4 → Step 4.5 → Step 6 큐에 넣고 나서 게시.

규칙 요약: **fetch와 post 사이가 5분 이상 벌어지면 다시 fetch.**

## 배운 것 — CI/CD 처음 손대면서

### 1. 트리거는 정책이다

`on: push: branches: [main]`과 `on: push: tags: ['v*']`는 둘 다 같은 워크플로우를 도는 명령이지만, 의미는 완전히 다르다. 전자는 "main에 들어가는 모든 코드는 빌드/배포된다", 후자는 "사람이 의도적으로 tag를 찍은 순간에만 빌드/배포된다". 배포 권한이 머저(코드 머지하는 사람)에 있느냐, 릴리즈 매니저(태그 찍는 사람)에 있느냐가 거기서 갈라진다. 이 PR에서는 후자 선택.

### 2. 자동화는 multi-surface에서 깨진다

`update-manifest` job이 다른 레포에 push한다는 건 **하나의 워크플로우가 두 개 레포의 git 상태를 만진다**는 뜻. 한쪽 레포의 concurrency가 다른 레포의 race를 보호하지 않는다. AI Deep Review의 "concurrency 그룹 키에 sha 들어있어서 race 가능" 지적이 정확히 이 케이스. 같은 워크플로우 안에서도 외부 시스템을 만지는 step은 별도 멘탈 모델 필요.

### 3. dev/prod 동작 차이는 미묘하다

vite dev middleware가 production build에 안 따라가는 거, 같은 `Cross-Origin-*` 헤더라도 nginx와 Caddy의 처리가 다른 거, 같은 404라도 body가 비었나 `Not Found`였나에 따라 bevy 동작이 달라지는 거. 전부 dev에서는 안 보이고 production에서만 드러남. **로컬 컨테이너로 dev/prod gap을 한 번 만져봐야 안 보이던 게 보인다.**

### 4. reviewer 권장이 항상 정확하지는 않다

`USER nginx`처럼 reviewer가 "free win"이라 한 게 사실 textbook 패턴 없으면 컨테이너 startup 실패하는 케이스. 권장 자체는 옳지만 강도/형태가 미묘하게 다른 일이 있다. `shotloom-respond-pr` 스킬의 Axis 2 (`justified — fix differently`)가 이 패턴을 잡으라고 있는 것. round 1에서 한 번 트리거됨.

### 5. fetch-cache 동기화는 비동기 시스템에서 항상 문제

리뷰 시스템처럼 외부에서 비동기로 상태 바뀌는 surface는 캐시가 stale되는 순간을 잘 모른다. 시간 차가 클 수 있는 두 step 사이에서는 read를 다시 한 번 해야 한다. 일반론으로는 평이하지만 PR 리뷰 컨텍스트에서 처음 부딪혀봄.

## 후속

- STL-323 (staging channel + builder polish): builder 재구성 묶음. 본 PR 머지 후 별도 PR 1~3개로 진행.
- PR #253: round 2 대기 (`hon454` 재리뷰 요청 보냄, 11개 인라인 thread는 reviewer가 resolve 클릭하기 전까지 author 쪽에서는 닫지 않음).

## 참조

- PR #253: web image build + push + GitOps manifest update
- PR #254: basic-ftp 5.3.1 보안 bump (audit fail 분리해서 별도 PR로 머지)
- STL-304: Add manual web image build workflow
- STL-306: Bundle runtime assets into web production build (PR #253에 통합)
- STL-323: Web image pipeline — staging channel + builder polish (follow-up)

---

#rule fetch와 post 사이가 5분 이상이면 다시 fetch
#failed AI Deep Review가 짚은 concurrency race를 처음부터 안 잡고 round 1까지 끌고 옴
#gotcha vite production build는 `configureServer` 미들웨어를 데려가지 않는다
#gotcha `USER nginx`는 nginx:alpine에서 단독으로 못 쓴다 — pid 재배치 + chown 같이 가야
