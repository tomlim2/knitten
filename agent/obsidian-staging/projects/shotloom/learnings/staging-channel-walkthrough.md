---
title: "Staging channel separation — CI/CD walkthrough"
tags:
  - type/learning
  - project/shotloom
  - area/ci
  - lib/github-actions
date: 2026-05-08
source: agent
---

# Staging channel separation — CI/CD walkthrough

CI/CD 처음 만지는 사람을 위한 마일스톤별 일지. 작업 자체는 staging 채널을 prod 채널에서 분리하는 것이고, 이 노트는 "왜 그렇게 했는지" + "용어가 뭔지"를 마일스톤마다 누적해서 적는다.

작업 컨텍스트: 직전 작업(`PR #253`, web image build 워크플로 신설)의 round 1 리뷰에서 나온 follow-up 중 가장 큰 항목. 자식 묶음 중 PR-A에 해당.

---

## 0. 용어 사전 (작업 시작 시점에 미리 묶음)

새로 등장하는 용어는 마일스톤 본문에서 처음 나올 때 짧게 풀고, 같은 단어가 두 번째 등장할 때부터는 이 사전을 가리킨다.

| 용어 | 한 줄 설명 |
|------|-----------|
| **CI** (Continuous Integration) | 코드 push할 때마다 빌드/테스트가 자동으로 도는 파이프라인. shotloom에서는 `.github/workflows/code.yml`이 그 역할. |
| **CD** (Continuous Deployment) | CI를 통과한 산출물을 자동으로 배포 환경까지 흘려보내는 파이프라인. 이번 작업의 주제. |
| **GitHub Actions** | GitHub 내장 CI/CD 런너 시스템. `.github/workflows/*.yml`에 정의된 워크플로를 트리거에 맞춰 실행. |
| **runner** | 워크플로를 실제로 돌리는 머신. GitHub-hosted 무료 runner(Ubuntu/Mac/Windows VM) 또는 self-hosted runner(우리 서버에 띄운 에이전트)가 있다. shotloom은 `cinev-runner`라는 self-hosted runner를 씀. |
| **trigger** | 워크플로가 시작되는 조건. 예: `push`, `pull_request`, `workflow_dispatch`(수동 버튼), 태그 push. |
| **tag** | 특정 커밋에 붙이는 사람 친화 이름. `git tag v0.1.0 && git push --tags`로 원격에 올림. shotloom은 `v0.1.0` 같은 태그 push가 곧 "릴리즈를 시작하라"는 신호. |
| **prefix** | 태그 이름 앞에 붙는 접두사. `v*` glob은 `v`로 시작하는 모든 태그를 매칭한다. 이번 작업에서 추가하는 게 staging용 prefix. |
| **SemVer** (Semantic Versioning) | `MAJOR.MINOR.PATCH[-prerelease]` 규약. 예: `v1.2.3`, `v0.1.0-rc.1`. prod 후보 의미가 박혀 있어서 staging 용도로 오버로드하면 의미가 깨진다. |
| **workflow_dispatch** | GitHub Actions UI나 API로 사람이 직접 누르는 수동 트리거. 입력 필드(`inputs.*`)를 받을 수 있다. |
| **image** (container image) | 실행 가능한 어플리케이션 + 모든 의존성을 한 덩어리로 묶은 불변 패키지. `docker.cinamon.me/cinamon/shotloom-web:v0.1.0` 같은 형태로 registry에 저장. |
| **registry** | container image를 저장하고 받아가는 서버. shotloom은 `docker.cinamon.me`가 사내 registry. |
| **Containerfile** / Dockerfile | image 빌드 레시피. `apps/editor/Containerfile`이 multi-stage build로 Rust+wasm 빌드 → nginx 런타임 image를 만든다. |
| **BuildKit** | 차세대 Docker build 엔진. multi-stage 병렬화, mount-cache, 분산 build 지원. shotloom은 daemon-less `buildctl`로 호출한다. |
| **multi-stage build** | Containerfile 내부를 `FROM ... AS builder` / `FROM ... AS runtime` 같이 단계로 쪼개는 기법. 빌더 단계의 무거운 도구를 최종 image에서 빼낼 수 있어 image 크기가 작아진다. |
| **GitOps** | 배포 상태(어떤 image 어느 버전이 어디에 떠있어야 하는가)를 별도 git repo의 manifest로 선언해두고, 그 repo가 source of truth가 되는 운영 패턴. 클러스터 쪽 컨트롤러가 manifest를 읽어 desired state로 수렴시킴. |
| **manifest** | 클러스터에 "이 image의 이 버전을 이 namespace에 띄워라"라고 선언하는 YAML 파일. shotloom은 `CINEV/prototype-manifest` repo의 `shotloom/deployment.yaml`이 prod manifest. |
| **manifest 갱신** | 새 image를 빌드/푸시한 뒤 manifest의 image 태그를 새 값으로 바꿔 commit하는 동작. 이게 일어나야 GitOps 컨트롤러가 새 버전을 인식한다. |
| **prod / staging / dev** | 운영 환경 분류. **prod**=실제 사용자가 쓰는 환경. **staging**=prod와 유사하게 구성된 사전 검증 환경(QA 데모 등). **dev**=개발자 본인이 막 굴리는 환경. |
| **paired PR** (cross-repo) | 두 개 이상의 repo에 동시에 PR이 있어야 시스템이 깨지지 않는 변경. 한 쪽만 머지되면 빌드/배포가 망가지므로 양쪽을 같이 review/merge한다. |
| **yq** (mikefarah) | YAML 전용 jq. Go 단일 바이너리. shotloom 워크플로는 manifest의 image 태그를 수정할 때 yq로 안전하게 patch한다. (이전엔 awk였지만 이번 자식 PR-C 묶음에서 yq로 교체됨.) |
| **concurrency group** | 동시에 같은 그룹의 워크플로 run이 여러 개 시작될 때 큐잉 정책. 같은 image 태그를 두 번 빌드하지 않게 막는 안전핀. |

---

## 마일스톤 ① — 트리거 prefix 결정

### 지금 무슨 상황인가

직전 작업으로 만들어진 워크플로(`build-web-image.yml`)는 트리거가 두 갈래다.

1. `git push --tags`로 `v` 시작하는 태그를 올리면 → 자동으로 image 빌드 + push + manifest 갱신
2. GitHub Actions UI에서 사람이 "Run workflow" 버튼을 누르면 (`workflow_dispatch`) → 같은 일 (단, `publish=false` 옵션으로 manifest 갱신만 건너뛸 수 있음)

문제: **둘 다 prod 경로다.** prod manifest는 `prototype-manifest` repo의 `shotloom/deployment.yaml`이고, 어떤 트리거가 와도 이 파일이 갱신된다. QA 알파 데모용 빌드를 prod 영향 없이 띄우려면 별도 채널이 필요한데, 지금은 "image만 만들고 manifest는 안 건드리는 모드"(`publish=false`)뿐 있고 정식 staging 채널은 없다.

리뷰어 의미론 nit: SemVer pre-release(`v0.1.0-rc.1`)는 spec상 *"prod 후보"* 의미라 "스크래치/staging" 용도로 오버로드하면 의도가 흐려진다. **별도 prefix로 채널을 직교 분리하는 게 정확.**

### 후보 비교

| 후보 | 의미 톤 | 명확성 | 비고 |
|------|--------|--------|------|
| `staging-*` | "staging 환경에 띄울 빌드" | ★★★ | 채널명 그대로 — 가장 직관 |
| `preview-*` | "짧게 살았다 사라지는 QA 미리보기" | ★★ | preview-environment 패턴(vcluster 등)과 친화적 |
| `dev-*` | "개발자 개인 빌드" | ★ | 가장 약함, prod와 분리 의미는 살지만 staging cluster 의미는 약함 |

리뷰어 추천 + 본 이슈 추천: **`staging-*`** (가장 명확). 예: `staging-2026-05-08`, `staging-feature-x`.

### 왜 `staging-*`인가 (선택 근거)

- **명시적 채널명** — tag 이름만 봐도 어느 manifest를 건드릴지 즉시 식별. `preview-*`나 `dev-*`는 staging cluster를 가리킨다는 약속을 별도로 해야 함.
- **운영 컨벤션 일치** — prototype-manifest repo의 새 manifest 경로가 `shotloom/staging/deployment.yaml`로 합의되어 있어서 prefix와 manifest 디렉토리 이름이 일치.
- **거절한 후보:**
  - `preview-*` — preview-environment(임시 클러스터에 PR마다 잠깐 띄우는 패턴)와 어휘가 겹쳐 미래에 그 패턴을 도입할 때 충돌.
  - `dev-*` — 너무 약함. "개인 환경"인지 "공유 staging"인지 prefix만 보고 결정 불가.

### 결정 보류 — 사용자 확정 필요

다음 항목 확정되면 마일스톤 ② (워크플로 YAML 변경)로 넘어간다.

- [ ] prefix는 `staging-*`로 확정?
- [ ] (선택) `workflow_dispatch.channel` input도 추가? — 수동 실행 시 staging/prod 선택 가능. tag prefix가 우선이고 dispatch input은 fallback.

---

## 마일스톤 ② — 워크플로 YAML 변경

확정사항: prefix는 `staging-*`. `workflow_dispatch.channel` input은 추가 안 함 (지금 양뱡향 분기를 두 군데 두는 비용 > 가끔 ad-hoc staging 필요할 때 tag 한 줄 push하는 비용).

### 손댄 4 곳

1. **`on.push.tags`** — `'staging-*'` 한 줄 추가. trigger glob은 매칭만 할 뿐 패턴 검증을 하지 않으므로(`v1`, `staging-` 단독도 통과시킴) 실제 형태 검증은 다음 단계.
2. **`Validate version` step** — 두 형태 분기.
   - prod: `^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$` (기존)
   - staging: `^staging-[0-9A-Za-z][0-9A-Za-z._-]*$` (신규) — 첫 문자 alnum 강제로 `staging-`이나 `staging-_x` 같은 빈/시작-언더스코어 슬러그 차단.
   - **`staging-*`는 tag-push 전용** — `workflow_dispatch`로 들어오면 거절. 이유: staging 빌드의 durable record는 git tag 자체. UI 버튼으로 임시값 넣으면 "어떤 staging이 떠있나?"가 git log에 남지 않음.
3. **`Resolve channel` step (신규)** — tag prefix 보고 `channel=prod|staging` + `manifest=...` 두 output 산출. 분기 로직을 `update-manifest` job으로 미루지 않고 build-push 안에서 한 번에 결정 → 두 job이 각자 prefix 검사하는 중복 회피. job-level outputs(`channel`, `manifest`)도 동시에 expose.
4. **`Update shotloom deployment image tag` step** — 하드코딩 `manifest="shotloom/deployment.yaml"` 제거, `${MANIFEST}` env로 주입. commit 메시지도 `chore(shotloom): update web image tag (${CHANNEL})`로 채널 표시 → manifest repo의 `git log`에서 prod/staging 구분 즉시 가능.

### 새로 등장한 GitHub Actions 용어

| 용어 | 설명 |
|------|------|
| **job-level outputs** | 한 job의 step에서 산출한 값(`echo "key=v" >> $GITHUB_OUTPUT`)을 다른 job에서 `${{ needs.<job-id>.outputs.<key> }}`로 참조 가능하게 expose하는 구조. 이번에 `channel`/`manifest`를 build-push에서 update-manifest로 넘기는 데 사용. |
| **step output** | `id: foo`가 붙은 step이 `$GITHUB_OUTPUT`에 쓴 값. 같은 job 내에서 `steps.foo.outputs.<key>`로 접근. job-level output은 step output을 다시 이름 붙여 export하는 구조. |
| **trigger glob** | `tags: ['v*', 'staging-*']`처럼 prefix 매칭만 하는 약한 패턴. 정확한 형태(SemVer 등)는 워크플로 안에서 별도 검증 필요. glob은 "워크플로를 시작할까 말까"만 결정. |
| **`set -euo pipefail`** | bash 스크립트 첫 줄 관용구. `-e`=명령 하나라도 실패하면 즉시 종료, `-u`=정의 안 된 변수 참조 시 실패, `pipefail`=파이프 중 하나라도 실패하면 전체 실패. CI 스크립트가 silent하게 부분 실패하는 걸 막는 안전핀. |
| **`::error::` annotation** | GitHub Actions가 인식하는 특수 출력 prefix. job 로그 + PR 요약 위에 빨간 에러 박스로 띄움. 단순 `echo` + `exit 1`보다 가시성 ↑. |

### 왜 build-push에서 채널을 정하나 (job 분리 vs 안에서 결정)

대안 A: `update-manifest` job에서 `if`로 prefix 분기.
대안 B (선택) : `build-push` 안에서 `Resolve channel` step으로 결정 + outputs로 expose.

**B를 선택한 이유:**
- 같은 prefix를 두 곳에서 따로 정규식으로 검사하면 한 쪽만 고치고 다른 쪽 빼먹는 drift 위험.
- `Validate version` 직후에 채널이 결정되므로 검증과 라우팅이 서로 묶여 있게 됨 — "프록시가 staging인지 prod인지 알기 위해 다시 string match"가 사라짐.
- update-manifest 입장에선 `${MANIFEST}`만 받아 yq에 넘기면 끝. 가독성 ↑.

### Diff 요약

```
.github/workflows/build-web-image.yml | 62 ++++++++++++++++++++++++++++++-----
1 file changed, 53 insertions(+), 9 deletions(-)
```

actionlint 결과: pre-existing `cinev-runner` self-hosted runner label 경고만 남음(main에 이미 있던 노이즈, 본 PR 책임 아님). 신규 syntax 에러 0.

### 다음 단계

- 마일스톤 ③: docs 갱신 (`WORKFLOW.md` Trigger 표 + `MAP.md` Release block)
- 그 후 마일스톤 ④: cross-repo paired PR 초안 (`prototype-manifest`)

## 마일스톤 ③ — Docs 갱신

워크플로 자체를 바꾼 건 마일스톤 ②이지만, 사람이 "어떻게 배포하지?"를 검색했을 때 닿는 진입점은 두 docs 파일이다. 코드와 docs가 어긋나면 다음 사람이 잘못된 가정으로 일을 시작함 → 한 PR에서 같이 갱신.

### `WORKFLOW.md ## Deploying`

세 곳 손댐.

1. **Trigger 표** — 컬럼 `Updates prototype-manifest`(Yes/No)에서 `Manifest updated`(실제 경로)로 의미 강화. staging 행 한 줄 추가.

   | 변경 전 | 변경 후 |
   |---------|---------|
   | "Yes / No"만 표시 | manifest 경로 명시(`shotloom/deployment.yaml` vs `shotloom/staging/deployment.yaml`) |
   | 3행 (v-tag / dispatch publish=true / dispatch publish=false) | 4행 (+ `staging-*` tag) |

   "Yes/No"보다 경로를 직접 보여주는 쪽이 다음 사람이 manifest repo에서 어디를 열어야 할지 1초 컷.

2. **Validation 문단** — 두 형태(`v<SemVer>`, `staging-<slug>`)를 명시 + staging은 tag-push 전용이라는 정책을 prose로 못박음. 문단 끝에 "SemVer pre-release(`v0.1.0-rc.1`)는 prod 후보 의미라 staging이 아니다"는 의미론 nit도 박아둠 — 이게 흐려지면 누군가 미래에 "RC tag도 staging인 줄 알았다"는 오해를 함.

3. **Pipeline stages 2단계** — `update-manifest` job 설명에서 manifest 경로가 채널 분기됨을 짧게 추가. "channel과 manifest는 build-push에서 한 번 결정되고 outputs로 expose된다"는 한 줄도 같이 → 이전 마일스톤의 설계 결정이 docs에도 남도록.

4. **Related files** — 마지막 줄의 "Deployed manifest (external repo): … `shotloom/deployment.yaml`"을 두 경로로 확장.

### `MAP.md ## Release and deployment`

L34 한 줄 → 두 줄.

```diff
-- Where does the deployed manifest live? → external repo `CINEV/prototype-manifest`, `shotloom/deployment.yaml`
+- Where does the deployed prod manifest live? → external repo `CINEV/prototype-manifest`, `shotloom/deployment.yaml`
+- Where does the deployed staging manifest live? → external repo `CINEV/prototype-manifest`, `shotloom/staging/deployment.yaml`
```

`MAP.md`는 "Where is X?" 질문/답 사전이므로 prod/staging이 별 row로 노출돼야 grep 한 번에 잡힌다.

### 새로 등장한 문서/검증 용어

| 용어 | 설명 |
|------|------|
| **MAP.md** | shotloom의 "어디 있지?" 검색 가이드. 디렉토리 구조와 책임을 한 줄짜리 Q→A로 나열. CONTRIBUTING.md가 이 형식을 강제. |
| **WORKFLOW.md** | 작업 절차/배포 사이클 가이드. 직전 자식 PR(STL-324)에서 신설된 `## Deploying` 섹션이 본 PR의 표적. |
| **doc paths validator** (`node scripts/validate-doc-paths.mjs`) | repo 안 모든 `.md`에서 `[text](path)` 링크가 실제 파일을 가리키는지 검사. 문서 갱신 시 깨진 링크 prevent. shotloom의 사전-PR gate 중 하나. |

### 검증

```
$ node scripts/validate-doc-paths.mjs
All 1102 path references verified across 160 files.
```

링크 깨짐 0.

### 다음 단계

- 마일스톤 ④: cross-repo paired PR 초안 (`prototype-manifest`)
- 그 후 마일스톤 ⑤: PR 작성 + 리뷰 응답

## 마일스톤 ④ — Cross-repo paired PR 초안 (`prototype-manifest`)

### 왜 cross-repo paired PR인가

shotloom repo의 워크플로 변경(마일스톤 ②)이 머지되면, `staging-*` tag push가 즉시 `shotloom/staging/deployment.yaml`을 읽으려 함. 그런데 manifest repo에 그 파일이 없으면? → `update-manifest` job이 file-not-found로 실패. **두 PR이 동시에 머지돼야 시스템이 깨지지 않음.** 이게 paired PR.

대칭으로 manifest 쪽 PR이 먼저 머지돼도 무해 — 새 staging 파일이 추가될 뿐, 기존 prod 경로는 그대로. 따라서 **manifest PR을 먼저 머지하고, 그 다음 shotloom PR을 머지**하는 순서가 안전.

### 만든 것

`prototype-manifest` 레포 새 브랜치 `shotloom-staging-channel`에 `shotloom/staging/` 디렉토리 신설:

| 파일 | 역할 | prod와의 차이 |
|------|------|--------------|
| `shotloom/staging/deployment.yaml` | Pod 스펙 (어떤 image를 어디 띄울지) | namespace `internal-service` → `internal-service-staging`, image 태그 placeholder `staging-init` |
| `shotloom/staging/service.yaml` | 클러스터 내부 통신용 endpoint | namespace 변경만 |
| `shotloom/staging/ingress.yaml` | 외부 접근 라우팅(Cilium Ingress + TLS) | namespace 변경 + host `shotloom.cinamon.io` → `staging.shotloom.cinamon.io` |

### 새로 등장한 K8s 용어

| 용어 | 설명 |
|------|------|
| **Deployment** | "이 image를 N개 띄우고, 망가지면 다시 띄워라"는 K8s 객체. spec에 replicas, container image, port 등이 들어감. shotloom-web은 replicas=1. |
| **Service** | 클러스터 *안*에서 Deployment의 Pod들에 접근하는 가상 endpoint. ClusterIP type은 외부에 노출 안 함. |
| **Ingress** | 클러스터 *밖*에서 들어오는 HTTP(S) 트래픽을 어떤 Service로 라우팅할지 정의. host(도메인) + path 매칭으로 동작. |
| **namespace** | K8s 객체들의 논리적 격리 공간. 이름 충돌, RBAC, resource quota 등이 namespace 단위로 적용. staging을 prod와 다른 namespace에 두면 실수로 prod 리소스 건드리는 사고 방지. |
| **ingressClassName** | 어떤 Ingress controller가 이 Ingress를 처리할지 지정. shotloom 클러스터는 `cilium`(eBPF 기반 CNI 겸 Ingress controller). |
| **TLS secret** (`wildcard-cinamon-tls`) | HTTPS 인증서를 들고 있는 K8s Secret 객체. wildcard cert(`*.cinamon.io`)라 staging 서브도메인에도 그대로 적용. |
| **`imagePullSecrets`** | private registry(`docker.cinamon.me`)에서 image 받아올 때 쓸 자격증명. 클러스터에 미리 `cinamon-reg`라는 이름으로 등록되어 있다고 가정. |

### 디자인 결정: namespace 분리 vs 이름 suffix

선택지가 두 개였음.

**A: Namespace로 격리 (선택)** — 같은 이름(`shotloom-web`)을 다른 namespace에 둠.

* shotloom 워크플로의 yq selector(`select(.name == "shotloom-web")`)를 그대로 사용 가능 → workflow 변경 적음.
* K8s 안에서 staging/prod가 namespace 단위로 깔끔하게 격리됨(quota, RBAC, monitoring 라벨 모두 따로).
* 단점: 운영팀이 `internal-service-staging` namespace를 만들어줘야 함(존재 가정).

**B: 이름 suffix(`shotloom-web-staging`)** — 같은 namespace에 다른 이름.

* namespace 추가 작업 불필요.
* 단점: workflow yq selector가 채널별로 분기해야 함 → 마일스톤 ②의 단순함이 깨짐.
* 단점: 같은 namespace에서 prod/staging 라벨 충돌 가능성, monitoring 분리도 약함.

**A 채택 이유:** 워크플로 단순함을 유지(이미 마일스톤 ②에서 채널 출력만 분기, container 선택자는 그대로) + K8s 운영상 격리 강도 ↑. 단, namespace 존재 여부는 ops 확인 필요(아래 placeholder 표 참조).

### Placeholder값 — ops 확인 필요

이 세 파일은 *기능적으로 동작 가능한 fork*지만, 다음 값들은 운영팀 합의 후 확정:

- [ ] namespace 이름 — `internal-service-staging` (prod의 `internal-service`와 평행). 다른 명명 컨벤션 있는지 확인.
- [ ] staging 호스트 — `staging.shotloom.cinamon.io`. 다른 컨벤션(`shotloom-staging.cinamon.io`, `*.staging.cinamon.io`) 있는지 확인.
- [ ] TLS secret(`wildcard-cinamon-tls`)이 새 namespace에서도 접근 가능한지(secret은 namespace-scoped이므로 staging namespace에 별도 복사/sync 필요할 수 있음).
- [ ] `cinamon-reg` imagePullSecret이 staging namespace에 존재하는지.
- [ ] replicas=1 그대로 / resource limits 추가 / liveness probe 추가 등 ops 표준이 있다면 적용.

shotloom PR description에 이 체크리스트를 박아 paired PR과 함께 review에서 합의하는 게 안전.

### 커밋/푸시 보류

prototype-manifest는 shotloom 자동-커밋 exemption 대상 아님. 사용자 승인 받은 뒤 커밋 + push + PR 생성. 현재는 staging area에만 올려둠.

```
$ git -C ../../../../prototype-manifest status
On branch shotloom-staging-channel
Changes to be committed:
  new file:   shotloom/staging/deployment.yaml
  new file:   shotloom/staging/ingress.yaml
  new file:   shotloom/staging/service.yaml
```

### 다음 단계

- 마일스톤 ⑤: PR 작성 — shotloom & prototype-manifest 양쪽, cross-link 포함

## 마일스톤 ⑤ — PR 작성 + 리뷰 응답 (대기 중)

…
