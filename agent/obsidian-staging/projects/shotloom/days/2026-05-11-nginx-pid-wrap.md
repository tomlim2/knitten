---
title: 2026-05-11 nginx pid wrap-up
tags:
  - type/devlog
  - project/shotloom
  - area/deploy
  - lib/nginx
date: 2026-05-11
source: STL-357 wrap-up
---

# 2026-05-11 nginx pid 비root 보정 wrap-up

## 00:34 — STL-357 closed ([#278](https://github.com/CINEV/shotloom/pull/278))

회고 — codex가 PR을 올렸고 ryumiel가 3 nit + APPROVED. 모두 reroll 1회로 흡수. 본질은 nit 셋 다 같은 뿌리("Containerfile은 manual repro로만 검증된다") 였다.

**지적 1 — 두 `sed` 호출이 silent-success.** ryumiel: "Both sed expressions silently succeed (exit 0) when their patterns do not match. This is a hardening opportunity, not a regression of the v0.1.3 incident." upstream pid 경로가 또 바뀌면 같은 클래스 결함이 또 ship된다는 지적. 조리법으로 비유하면 소스를 *부어놓고* 간을 안 본 상태. → d33cddf 에서 sed 두 개 → 단일 ERE `s|/(var/)?run/nginx.pid|/tmp/nginx.pid|` 로 통합해서 silent-success 자체를 제거.

**지적 2 — `-e` 순서 invariant가 undocumented.** ryumiel: `/run/nginx.pid`가 `/var/run/nginx.pid`의 suffix라 역순으로 쓰면 `/var/tmp/nginx.pid` 로 부서진다. 주변 RUN 블록은 L35-45, L61-71 처럼 *왜 이 순서인지* 설명을 다는 컨벤션인데 이번 추가만 주석 없음. → d33cddf 같은 commit이 ordering 의존성을 *알고리즘 레벨에서* 제거. 주석으로 가드하는 게 아니라 single-regex 채택으로 가드 자체가 불필요해짐.

**지적 3 — regression guard 부재.** ryumiel: "Per `docs/guidelines/code-review-guideline.md` §2 P2, bug fixes should have regression tests. Manual repro is verification, not a regression guard." `apps/editor/Containerfile`을 *빌드*하는 CI job이 없어서 v0.1.3가 main을 그대로 통과해 deploy 직후 Envoy 503을 봤다. 같은 fix도 같은 guard 부재 상태로 머지된다. → 코드 변경 없음, STL-358 follow-up 등록 (image-build CI smoke step `docker build -f apps/editor/Containerfile` + `docker run` + `wget /` health check).

> [!tip] 가장 중요한 배운 것 — 비-Rust 산출물은 PR diff엔 보이지만 CI 그물엔 안 잡힌다
> rust crate은 fmt/clippy/check/test 4중 그물을 통과해야 main에 들어가는데, `Containerfile`/`nginx.conf` 변경은 *diff로 리뷰만 되고* 빌드/스모크 자동 검증이 없다. v0.1.3 사고가 정확히 그 구멍으로 빠져나왔다. fix PR도 동일한 구멍을 그대로 통과 — guard가 따라붙지 않으면 다음 nginx upgrade 때 같은 클래스 결함이 또 ship된다. PR-level review로 잡으려 하지 말고 image-build smoke를 CI에 두자.

> [!abstract] Rule
> Bug fix가 빌드/런타임 산출물(Containerfile, helm chart, k8s manifest, build-script)을 건드릴 때, regression guard 없이 머지하지 말 것 — manual repro는 verification이지 regression guard가 아니다. follow-up issue로 분리해도 되지만 *반드시* PR description에 링크. `#rule`

> [!warning] 같은 클래스 결함이 *fix*에도 살아있다
> v0.1.3 pid 경로 사고는 "manual repro만으로 검증된 Containerfile 변경이 deploy에서 터진" 사고였다. PR #278 fix 자체도 동일하게 manual repro로만 검증됐고 CI가 빌드를 안 한다. STL-358이 가드를 추가하기 전까진 다음 nginx 베이스 업그레이드 (1.30, 1.31…) 가 같은 깊이로 떨어질 수 있음. **교훈:** 같은 카테고리의 두 번째 결함은 fix 자체에 잠복한다 — fix를 머지하는 순간 가드가 따라오지 않으면 fix가 곧 다음 사고의 채점지가 된다.
