---
title: STL-324 — deploy doc routing in WORKFLOW / MAP / AGENTS
tags:
  - type/devlog
  - project/shotloom
  - area/docs
  - status/done
date: 2026-05-07
source: shotloom
---

# STL-324 — deploy doc routing in WORKFLOW / MAP / AGENTS

## 14:07 — STL-324 closed ([#257](https://github.com/CINEV/shotloom/pull/257))

회고 — STL-323 (web image pipeline staging + polish) 들어가기 전에 deploy 사이클 자체가 repo 어디에도 문서화 안 돼 있어서 그 베이스부터 깐 docs-only PR. 리뷰는 1라운드 APPROVED, 그 사이에 CI 한 번 / 작성 단계 한 번 자잘한 함정 잡힘.

**지적 1 — Linear 본문에 user-private 경로 인용.** 이슈 작성 단계에서 `~/.claude/rules/shotloom.md Obsidian-vault 라우팅 패턴` 줄을 `## 참고`에 박았다가 user가 "개인 정보관련 넣지마요"로 지적. 두 결함이 겹침: (a) 그 파일의 Obsidian 섹션은 vault audience matrix 얘기지 in-repo `MAP.md` 라우팅과 무관 (잘못된 인용), (b) `~/.claude/...` 경로 자체가 author-private dotfile이라 외부에 노출 금지. → memory에 `feedback_no_personal_paths_in_external_artifacts.md` 룰로 박음.

**지적 2 — macOS case-insensitive FS가 `WORKFLOW.md` vs `workflow.md` 진실을 가림.** Linear 본문을 처음 작성할 때 `workflow.md` 소문자로 적었는데, user가 "workflow.md있지 않나요?" 물었을 때 `git ls-files`로 캐노니컬 케이스가 `WORKFLOW.md` (대문자)임을 증명해서 정정. macOS는 두 이름 모두 같은 inode로 보여줌 — 로컬에선 동작해도 Linux CI / GitHub web UI는 case-sensitive라 dead link 위험. → Linear title + 본문 + WORKFLOW.md 작성까지 전부 대문자로 통일.

**지적 3 — CI lychee가 private repo 링크 404로 잡음.** WORKFLOW.md `update-manifest` 단계에 `[shotloom/deployment.yaml](https://github.com/CINEV/prototype-manifest/blob/main/shotloom/deployment.yaml)` 박았는데 첫 push 후 lychee link checker가 404 reject. `prototype-manifest`가 private이라 lychee가 인증 없이는 못 읽음. → `05e296b`에서 markdown 링크 wrapper 제거, `shotloom/deployment.yaml` bare path + 코드 스팬으로 교체.

**지적 4 — hon454 nit, BuildKit 리터럴 버전 prose 박기.** `installs buildctl (BuildKit v0.13.2)` 라고 적었는데 워크플로가 BuildKit 버전을 올릴 때마다 doc도 따라 갱신해야 함 — silent rot. → `b3842f0`에서 `(see workflow for the pinned BuildKit version)`로 교체.

**지적 5 — hon454 nit, 외부 repo 언급 중복.** `update-manifest` 단계 두 줄 위에서 이미 `scoped to the prototype-manifest repository, checks out CINEV/prototype-manifest@main` 라고 했는데, 아래 줄에 `(in the external CINEV/prototype-manifest repository)` 괄호로 또 적음. → `b3842f0`에서 괄호 제거.

> [!tip] 외부 시스템 링크는 "CI가 verify할 수 있나"를 자문해야
> markdown 링크를 박을 때 author 머신에서는 클릭이 되더라도 CI link checker(lychee)가 통과한다는 보장이 없음. 특히 private repo / 인증 필요 endpoint / 일시적 url 은 CI에서 깨짐. 첫 작성 때 "내가 anonymous browser로 이 링크 열 수 있나"를 한 번 더 자문하고, 못 열면 bare path + 코드 스팬 + 산문 설명으로 가는 게 안전. PR #257이 이걸 첫 push에 놓치고 lychee 404로 잡힘.

> [!abstract] Rule
> 외부 artifact(Linear issue / GitHub PR / repo doc / Slack / 어떤 publish 표면이든) 작성 시 author-private 경로 (`~/.claude/...`, `caol-config/...`, `private/...`)는 절대 인용 금지. in-repo equivalent로 라우트하거나, 등가가 없으면 인용 자체를 드롭. 인용된 권위는 audience가 도달 가능해야 한다. `#rule`

> [!warning] macOS case-insensitive FS가 파일명 진실을 가린다
> `ls workflow.md` 와 `ls WORKFLOW.md` 가 둘 다 같은 파일을 열어 보여줘서 캐노니컬 케이스가 어느 쪽인지 코드만 봐선 모름. **교훈:** 파일명 케이스가 의심스러우면 `git ls-files`가 SSOT — 인덱스 등록명만 출력함. Linux CI는 case-sensitive라 잘못 인용하면 PR 들어가기 전엔 안 보이다가 lychee/링크 검증에서 터짐.

> [!warning] Markdown 링크는 anonymous fetch 기준으로 검증
> private repo URL을 in-repo doc에 박으면 author는 인증 토큰 갖고 있어 클릭이 되지만, CI lychee는 anonymous fetch라 401/404로 실패. **교훈:** publish-bound markdown에서 외부 URL은 "anonymous browser로 열리나" 가 통과 기준. 안 열리는 자원은 코드 스팬 + 산문 설명으로 표현.
