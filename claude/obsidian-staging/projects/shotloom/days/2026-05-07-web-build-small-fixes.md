---
title: STL-325 — yq + wasm MIME + async asset copy
tags:
  - type/devlog
  - project/shotloom
  - area/build
  - lang/typescript
  - status/in-review
date: 2026-05-07
source: shotloom
---

# STL-325 — yq + wasm MIME + async asset copy

## 14:24 — PR #260 ([link](https://github.com/CINEV/shotloom/pull/260))

웹 이미지 빌드 파이프라인 (PR #253으로 들어온 STL-304 본체)의 작은 robustness/cleanup 항목 묶음. STL-323 umbrella 아래의 PR-C 분할 — 셋 다 설계 결정이나 측정 없는 surgical fix라 한 PR로 묶음. 이 PR이 머지되면 같은 라인 위에서 staging channel(PR-A) / builder polish(PR-B)가 후속으로 들어올 자리가 비워짐.

### Why

PR #253 round 1 리뷰에서 hon454가 명시적으로 deferral 받아준 7개 follow-up 중 (2)/(6)/(7) 세 항목. 머지를 막을 결함은 아니지만 각각 실패 모드가 있음:

- **(2) awk manifest patcher** — `awk` 가 `- name: shotloom-web` 바로 다음 줄에 `image:` 가 있어야 동작. 사이에 `resources:` / `env:` / probes 가 끼면 silently no-op. GitOps 매니페스트 갱신이 조용히 깨지면 같은 이미지가 계속 도는 운영 사고.
- **(6) WASM MIME** — `application/wasm` 어설션이 base image 의 `mime.types` 에 의존. nginx base image 가 바뀌면 `WebAssembly.instantiateStreaming` 깨짐. 컨트랙트가 우리 config 안에 없음.
- **(7) `cpSync`** — `closeBundle` 에서 ~236MB 동기 복사로 Vite worker stall. CI 에선 무관하지만 로컬 dev 응답성에 영향.

### How

**(2) awk → yq.** `mikefarah/yq` (Go single-binary) 로 교체. distro `yq` 는 Python jq wrapper 라 문법 다름 — 잘못 설치되면 silent breakage 라 명시 pin 필수. 같은 워크플로의 buildctl 설치 패턴 (`curl … releases/download/${VERSION}/binary` → `sudo install -m 0755`) 미러링. `yq -i '(.spec.template.spec.containers[] | select(.name == "shotloom-web") | .image) = strenv(IMAGE)'` 한 줄로 awk 50줄 대체. yq 의 silent no-op 위험 보완용으로 patch 전에 `select` 표현식으로 target 존재 여부 explicit check 한 번 더.

**(6) WASM MIME.** 기존 `\.(js|wasm|woff2?|css)$` location 안에 `types {}` 블록 명시. 같은 파일의 `.vrm/.glb/.gltf/.fbx` location 들이 이미 location-scoped `types {}` 패턴을 쓰고 있어서 컨벤션 일관. nginx `types {}` 는 그 scope 에서 inherited table 을 **REPLACE** 하므로 (병합 아님) `js/css/woff2/woff` 까지 같이 enumerate — 빠뜨리면 default_type 으로 fallback 해서 깨짐. 이 부분이 한 줄짜리 fix가 아니었던 이유.

**(7) cpSync → cp.** `node:fs/promises` 의 `cp` import, `closeBundle` async 마킹, 3개 subdir 을 `Promise.all` 로 병렬화. signature 동일 (`{ recursive: true }`), 거동 차이는 sync→async + 병렬뿐.

### What

- `.github/workflows/build-web-image.yml` — `Install yq` step 추가 (`yq v4.44.3` pin), `Update shotloom deployment image tag` step 의 awk → yq 표현식 교체 + explicit pre-check + post-write verify (yq 가 quoted/unquoted 둘 다 가능해서 `grep` 두 패턴 OR)
- `apps/editor/nginx.conf` — `\.(js|wasm|woff2?|css)$` location 에 `types {}` 블록 (5개 MIME + `default_type application/octet-stream`)
- `apps/editor/vite.config.ts` — `cpSync` import 제거, `cp` from `node:fs/promises` import, `closeBundle` async + `Promise.all`

리뷰 게이트: pre-PR self-review 에서 H9 (past-state contrast) 1건 잡혀서 yq pre-check 코멘트의 `the prior awk implementation provided` 표현 → 현재상태 기준으로 재작성 (`2d5576e`). 그 외 패턴 모두 clean. CI 통과 후 PR ready-for-review.

### 사이드 노트

- yq distro 패키지는 절대 안 됨 — Debian/Ubuntu `yq` 는 Python jq wrapper. `mikefarah/yq` 만 정확. CI 설치는 GitHub release 직접 다운로드가 안전한 path.
- nginx `types {}` 블록은 inherited 를 병합 안 하고 REPLACE — 한 location 안에서 일부만 명시하면 나머지가 깨짐. 항상 enumerate or 안 건드림.
- `closeBundle` 같은 Rollup hook 은 promise return 지원함 (Rollup hook spec). async 마킹 가능.
- hon454 가 PR #257 에서 "BuildKit 리터럴 버전 prose 박지 마라" nit 했지만, **CI 바이너리 install pin 은 정반대로 명시 권장** — pin 안 하면 빌드 재현성 깨짐. 두 케이스가 표면적으론 비슷해 보여도 의도가 정반대라 분리해서 판단해야 함.
