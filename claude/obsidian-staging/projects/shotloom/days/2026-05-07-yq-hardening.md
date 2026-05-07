---
title: STL-325 — yq install + pre/post-check hardening
tags:
  - type/devlog
  - project/shotloom
  - area/build
  - lang/typescript
  - status/done
date: 2026-05-07
source: shotloom
---

# STL-325 — yq install + pre/post-check hardening

## 15:36 — STL-325 closed ([#260](https://github.com/CINEV/shotloom/pull/260))

회고 — 같은 워크플로 파일에 PR 두 개 (#257 STL-324, #260 STL-325) 연속으로 들어가면서 "외부 도구를 도입할 때 검증 surface를 함께 옮기지 않으면 워크플로 한 자리에 옛 패턴 잔재가 남는다"는 패턴이 두 번 연속 잡힘.

**지적 1 — 버전 pin은 CDN 바이트를 신뢰함.** hon454: "self-hosted runner에서도 결국 GitHub releases CDN이 워크플로 시점에 서빙하는 바이트를 그대로 실행합니다." 같은 워크플로에 buildctl도 같은 패턴(버전 pin만)으로 들어있는데 둘 다 동일한 supply chain 노출. SHA-256 verify가 정답 — `mikefarah/yq`는 release마다 `checksums` 파일 게시. 추가로 영속 self-hosted runner이므로 `command -v yq && yq --version | grep -qF "${YQ_VERSION}"` idempotency 게이트로 deploy 시점의 GitHub releases 가용성 의존도 제거. → `0ca5dc8`, `.github/workflows/build-web-image.yml` Install yq step.

**지적 2 — selector pre-check가 missing만 잡고 duplicate 안 잡음.** 내가 작성한 `if [[ "$(yq … | .name)" != "shotloom-web" ]]`은 0개 매칭만 큰소리 실패; ≥2개 매칭일 때 yq -i 가 둘 다 같은 image로 조용히 덮어씀. `[…] | length` 표현으로 0 / 1 / ≥2 모두 한 줄에서 정확한 count로 분기. 미래의 매니페스트 리팩터에 대한 방어. → `0ca5dc8`.

**지적 3 — grep post-check가 anchoring 없음 + 두 번째 파서 끌어들임.** 내가 작성한 `grep -Fq "image: \"${IMAGE}\"" || grep -Fq "image: ${IMAGE}"` 두 갈래는 yq의 quoted/unquoted 출력 가변성에 대한 workaround였는데, 두 가지 결함: (a) 매니페스트 어딘가의 코멘트나 무관 문자열에 `image: <IMAGE>`가 있으면 false-positive, (b) yq가 이미 있는데 grep으로 검증하는 건 우회. `yq -e '.spec.template.spec.containers[] | select(.name == "shotloom-web") | select(.image == strenv(IMAGE))' >/dev/null` 한 줄로 구조적 검증 + quoted/unquoted 분기 자체 제거. → `0ca5dc8`.

> [!tip] 가장 중요한 배운 것 — 도구 교체 시 verification surface도 함께 migrate
> awk → yq로 바꾸면서 patch 로직만 yq로 옮기고 post-check는 grep을 그대로 둔 게 문제의 본질. grep은 awk 시대의 잔재였는데 yq 도입 후엔 더 정확한 도구가 이미 손에 있음. "이미 사용 중인 도구가 같은 일을 더 잘 할 수 있을 때 두 번째 파서를 끌어들이지 마라"는 일반화 가능한 위생 규칙. workaround (`grep || grep`) 가 코드에 들어가는 순간이 도구 결함 신호 — 그 시점에 멈추고 도구 자체로 다시 해결할 수 있는지 자문.

> [!abstract] Rule
> CI에서 외부 바이너리를 install 할 때 (1) 버전 pin + (2) SHA-256 verify + (3) idempotency 게이트(영속 runner 한정) 3종을 한 step에 같이 넣는다. 버전 pin 만으론 CDN/미러 변조에 무방비. `#rule`

> [!warning] yq -i 의 selector silent semantics
> `yq -i '… select(…) | .field = value'`는 selector가 0개 매칭이면 silent no-op, ≥2개 매칭이면 모두 덮어씀. 둘 다 verify 없이는 success로 보임. **교훈:** mutating yq 표현식을 쓸 때마다 매칭 카운트 pre-check (`[…] | length` 가 정확히 1) + 결과의 구조적 post-check (`yq -e` 로 expected state assertion) 두 가지를 함께 둔다. 둘 중 하나만 두면 한쪽 실패 모드를 놓침.

> [!warning] 워크플로 파일 한 곳에 후속 PR 셋이 인접 영역
> #260 머지 후 STL-326 (PR-B, builder polish) / STL-327 (PR-A, staging channel) 둘 다 같은 `build-web-image.yml`을 다른 영역에서 건드림. **교훈:** 동일 파일 인접 PR을 평행으로 작업하면 머지 순서에 따라 conflict 가능성 — base 갈아치울 때 조심하거나 stack 으로 묶거나 직렬화한다. 본 케이스는 origin/main 기준 병렬 + 머지 후 rebase로 진행 결정.
