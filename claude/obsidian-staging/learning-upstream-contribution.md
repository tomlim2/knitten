---
title: "Upstream Contribution: OSS 버그 수정을 본가로 돌려주기"
tags: [learning, oss, open-source, contribution, git, workflow]
created: 2026-04-18
source: claude
---

# Upstream Contribution

OSS crate 쓰다가 버그 발견했을 때, **fork에만 patch 쌓아두지 말고 원본 레포에 PR 보내서 머지받기**. 오늘 `bevy_vrm1` PR #58 머지되면서 실감.

---

## 용어

```
upstream    = 원본 레포 (not-elm/bevy_vrm1)       ← 본가
  ↑ PR
downstream  = 내 fork (tomlim2/bevy_vrm1)         ← 복제본
  ↑ dependency
내 프로젝트  = anju 등 (crate 사용)
```

| 용어 | 뜻 |
|------|-----|
| Upstream contribution | 내가 쓰는 OSS의 원본 레포에 개선사항 PR |
| Downstream fork-patching | 내 fork에만 수정 쌓아두기 (upstream은 안 건드림) |
| Scratch your own itch | 내가 가려운 데 내가 긁기 (가장 자연스러운 기여 동기) |

---

## 왜 upstream이 낫나

### Fork patching의 비용
- 매 upstream 버전 업그레이드마다 **rebase/cherry-pick 재적용**
- 같은 버그를 팀원/다른 사용자도 밟음 (공동 손해)
- `Cargo.toml`에 git dependency로 fork 경로 박혀서 **빌드 재현성 악화**

### Upstream PR의 이득
- 머지되면 crates.io에 새 버전 → `Cargo.toml`에서 그냥 `cargo update`
- 모든 사용자가 혜택
- Contribution graph + GitHub 프로필에 머지된 PR 남음 (커리어 자산)
- 메인테이너와 관계 형성 → 향후 큰 변경 제안 때 신뢰자본

---

## 오늘 실제 흐름 (bevy_vrm1 PR #58 예시)

1. **발견:** anju 프로젝트에서 VRoid VRM 렌더링할 때 body skin 일부가 어둡게 나옴
2. **진단:** `VrmcMaterialRegistry::try_new`가 material 이름 HashMap으로 저장 → 동일 이름 중복 있으면 덮어씀
3. **Fix 범위 결정:** 버그가 upstream에 있음 → fork에 patch 얹기 vs upstream PR
4. **Upstream PR 선택:** 재사용 가능한 일반 버그라 본가에 기여
5. **PR 열기:** `not-elm/bevy_vrm1#58`
6. **리뷰 대응:** 메인테이너 "변경 OK, CHANGELOG 충돌만 해결" → merge upstream/main + push
7. **머지:** 같은 날 머지됨 (maintainer 반응 빠른 편)

---

## PR 잘 통과시키는 체크리스트

- [ ] **Summary**: 버그 현상 + root cause (코드 스니펫 포함) + fix 방향
- [ ] **Repro**: 재현 조건 구체적으로 (exporter, 버전, 데이터 특성)
- [ ] **Screenshot/diff**: 시각 결과물 있으면 첨부 (MToon처럼 렌더링 버그는 특히)
- [ ] **Test plan**: fmt / clippy / test 전부 통과 체크박스
- [ ] **Notes**: unique name VRM에서 behavior 안 바뀐다 같은 안심 멘트
- [ ] **Regression test 제안**: 메인테이너가 원하면 추가하겠다는 여지 남김
- [ ] 기존 merged PR 스타일 샘플링 후 톤 맞추기

---

## 실전 팁

### Fork 기본 세팅
```bash
# 원본을 upstream으로 추가 (내 fork만 origin으로 clone된 상태)
git remote add upstream https://github.com/OWNER/REPO.git
git fetch upstream main
```

### Merge conflict 해결 플로우 (fork PR)
```
1. git fetch upstream main
2. git checkout feat/my-branch
3. git merge upstream/main       # 충돌 발생
4. 파일 편집
5. git add + git commit --no-edit
6. git push origin feat/my-branch # PR 자동 업데이트
```

> [!tip] Rebase vs Merge
> 열려있는 PR에는 **merge가 안전**. Rebase는 force-push 필요해서 리뷰 코멘트 라인 매핑이 깨질 수 있음.

### Maintainer 톤 맞추기
- 본인 PR에 `@maintainer` 멘션 **생략** (이미 알림 감)
- 감사 표현은 자연스럽게 1회 (매번 x)
- CHANGELOG, CONTRIBUTING, 최근 merged PR 3-5개는 꼭 샘플링

---

## 언제 fork patching이 낫나 (예외)

- Upstream 머지 속도가 느려서 급한 release에 못 맞출 때
- Upstream 방향성과 내 수정이 달라 머지 가능성 낮을 때
- 회사 내부 전용 변경이라 퍼블릭 릴리스 불가능할 때

이때도 **upstream PR은 병행해서 여는 게 이득** (둘 중 빠른 쪽 먹음, 머지되면 fork patch 제거).

---

## 관련

- [[devlog-2026-04-18]] - 첫 OSS 기여 실전 로그
- PR #58, #59, #60 모두 `bevy_vrm1` upstream으로

---

## Release shipped

- **2026-04-20:** [bevy_vrm1 v0.7.1](https://github.com/not-elm/bevy_vrm1/releases/tag/v0.7.1) 릴리스에 PR #58, #60 반영 — crates.io publish 완료, fork patch 제거 가능. 릴리스 노트 `New Contributors`에 `@tomlim2` 등재.
