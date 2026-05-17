# project-add-record Reference

Detailed workflow steps and project record template.

---

## Workflow Details

### Step 1: Resolve Project Path

1. Read `~/.claude/private/agent-hub-config/repo-paths.json`
2. If `$ARGUMENTS[0]` matches a registered repo name, use that path
3. If `$ARGUMENTS[0]` is a path, use it directly
4. If `$ARGUMENTS[1]` exists, append as subfolder
5. Verify the path exists

### Step 2: Explore Codebase

Use Task(Explore) agent to analyze:

| Item | Method |
|------|--------|
| **Project structure** | `ls`, directory tree |
| **LOC & module count** | `wc -l`, file counting by extension |
| **Tech stack** | Package files, imports, file extensions |
| **Key files** | Largest/most important source files |
| **Core techniques** | Search for rendering, shader, algorithm, pattern keywords |
| **Architecture** | Module organization, entry points, data flow |
| **README/docs** | Any existing documentation |
| **Git history** | Commit count, date range, contributors |

### Step 3: Ask Context

코드에서 추출할 수 없는 정보를 사용자에게 질문:

- **동기**: 왜 만들었나? (회사 필요 / 개인 학습 / 문제 해결)
- **타입**: `회사` / `개인 프로젝트` / `개인 + 회사 연계`
- **용도**: 포트폴리오 문서에도 추가할지, 기록만 남길지

### Step 4: Generate Record

아래 템플릿을 채워서 생성. 섹션별로 코드 탐색 결과 + 사용자 컨텍스트를 조합.

템플릿 참고: [MADR](https://adr.github.io/madr/) (Architecture Decision Records) + [Craft Project Post-Mortem](https://www.craft.do/templates/project-post-mortem) + Developer Showcase 패턴 혼합.

### Step 5: Show & Confirm

생성된 기록을 사용자에게 보여주고 확인:
- 내용 정확성
- 추가/수정 사항
- 포트폴리오 문서 추가 여부

### Step 6: Save

**기록 저장:**
```
resolver `postmortem` destination + `/{project-name}.md`
```

**포트폴리오 추가 (사용자가 요청한 경우):**
1. `ta-portfolio-content-design.md` 읽기
2. 기존 포맷에 맞춰 항목 변환
3. 사이트 구조 섹션 업데이트 (프로젝트 count, 번호)
4. 적절한 위치에 삽입
5. 후속 프로젝트 번호 정리

---

## Record Template

```markdown
# [Project Name]

**타입**: 회사 / 개인 프로젝트 / 개인 + 회사 연계
**기간**: YYYY-MM-DD ~ YYYY-MM-DD (N일, N커밋)
**경로**: repo-name/subfolder
**상태**: 완료 / 진행 중 / 유지보수

---

## 한 줄 요약

[프로젝트가 무엇인지 한 문장으로]

## Context: 왜 만들었나

**문제 상황**
- [해결하려는 문제 또는 필요성]

**제약 조건**
- [시간, 기술, 환경 등의 제약]

## Metrics: 규모

| 항목 | 수치 |
|------|------|
| LOC | X,XXX |
| 모듈/파일 수 | N개 |
| 커밋 수 | N개 |
| 개발 기간 | N일 |
| 에셋 수 | N개 (해당 시) |

## Tech Stack

- ...

## Architecture: 구조

**모듈 구성**
- [주요 모듈과 역할]

**데이터 흐름**
- [입력 → 처리 → 출력 파이프라인]

## Key Decisions: 핵심 결정

기술 선택에서 "왜 이걸 골랐는지"가 드러나는 결정들.

| 결정 | 선택지 | 채택 | 근거 |
|------|--------|------|------|
| [결정 1] | A / B / C | B | [이유] |
| [결정 2] | X / Y | X | [이유] |

## Challenges: 어려웠던 점

- **[문제]**: [어떻게 해결했는지]

## Results: 결과

**정량적 성과**
- [Before → After 수치가 있으면 포함]

**정성적 성과**
- [워크플로우 개선, 팀 영향 등]

## What I Learned: 배운 점

면접에서 설명할 수 있어야 할 핵심 개념:

- **[개념 1]**: [한 줄 설명]
- **[개념 2]**: [한 줄 설명]

## What Went Well / What I'd Change

| Well | Change |
|------|--------|
| [잘한 것] | [다시 한다면 바꿀 것] |

## Assets Needed: 포트폴리오용

- [ ] [필요한 스크린샷, GIF, 영상, 다이어그램]
```

---

## Notes

- 기록은 한국어로 작성 (기존 문서와 일치)
- 같은 이름의 기록이 이미 있으면 덮어쓰기 전에 사용자 확인
- 기록만 남기는 것이 기본, 포트폴리오 추가는 사용자 선택

---

## Related Files

- Records: resolver `postmortem` destination
- Portfolio: configured project portfolio topic
- Tech points: configured project portfolio topic
- Repo paths: `~/.claude/private/agent-hub-config/repo-paths.json`
