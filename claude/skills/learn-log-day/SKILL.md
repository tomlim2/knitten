---
description: "Log daily work, learnings, and topic files to Obsidian project docs. Use when recording implementation progress, learnings, or topic references."
argument-hint: "<project> [devlog|learning|topic] [category|name]"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(date:*), Bash(git:*)
user-invocable: true
---

# learn-log-day

프로젝트 개발 일지, 교훈, 주제별 레퍼런스를 옵시디언에 기록. 옵시디언 기능(frontmatter, wikilink, callout, tag)을 활용한 통합 포맷.

## Arguments

- `<project>` — 프로젝트 폴더명 (예: `bevy-vrm`, `mmd-player-anju`)
- `[sub-command]` — 생략 시 `devlog` (기본값)
  - `devlog` — 오늘 일지 추가 (기본)
  - `learning <worked|failed|gotcha>` — 교훈 추가
  - `topic <name>` — 주제별 상세 파일 생성/편집

**If no project argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage:
  /learn-log-day <project>                        — 오늘 devlog 추가
  /learn-log-day <project> learning worked         — 성공한 접근 기록
  /learn-log-day <project> learning failed         — 실패한 접근 기록
  /learn-log-day <project> learning gotcha         — 비직관적 함정 기록
  /learn-log-day <project> topic <name>            — 주제 파일 생성/편집
```

---

## Step 1: 경로 확인

Doc path: !`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh devlog $0`

`RESOLVED_PATH` 를 프로젝트 베이스 경로로 사용. 없으면 → [프로젝트 초기 셋업](#프로젝트-초기-셋업) 실행

---

## Step 2: Sub-command 실행

### devlog (기본)

hub(`devlog.md`) + 개별 day 파일(`days/day-{NN}.md`) 구조.

#### 대화로 내용 수집

1. **"오늘 뭐 했어?"** — 한 일 목록
2. **"배운 것 / 삽질 / 발견?"** — 러닝 (없으면 스킵)
3. **"커밋 로그 넣을까?"** — Yes면 프로젝트 repo에서 `git log --oneline --since="today"` 추출

#### Day 번호 결정

1. `days/` 폴더의 기존 파일 스캔 (`day-*.md`)
2. 마지막 Day 번호 + 1 = 새 Day 번호
3. 오늘 날짜: `date +%m-%d` 형식

#### day 파일 포맷 (`days/day-{NN}.md`)

@~/.claude/templates/devlog/day.md

**규칙:**
- "왜 이 작업을 했나"는 반드시 포함 (맥락 보존)
- "배운 것"은 **볼드 한줄 요약** + 상세 설명 패턴
- 핵심 발견 → `> [!tip]` callout + learnings-index wikilink
- 실패 → `> [!warning]` callout
- 관련 topic 파일 참조 시 `[[{project}/{topic-name}]]` wikilink
- 커밋 로그와 현재 상태는 선택 (유저가 원하면)

#### hub 파일 포맷 (`devlog.md`)

@~/.claude/templates/devlog/hub.md

**규칙:**
- hub 요약은 day당 3-4줄 이내
- `[[{project}/days/day-{NN}|상세]]` wikilink 필수
- 최신이 아래 (시간순) — hub는 위에서 아래로 읽는 구조
- 프로젝트 개요, 현재 상태, TODO는 hub에서만 관리 (day 파일에는 선택)

---

### learning \<category\>

`learnings-index.md`의 해당 카테고리에 교훈 추가.

카테고리:
- `worked` → `## What Worked`
- `failed` → `## What Failed`
- `gotcha` → `## Gotcha`

#### 대화로 수집

Context, Problem, Solution(worked/gotcha), Why(worked), Rule — 순서대로 질문.

#### learnings-index.md 포맷

@~/.claude/templates/devlog/learnings.md

**규칙:**
- YAML frontmatter 필수 (`title`, `tags`, `updated`)
- Rule은 `> [!abstract] Rule` callout + `#rule` 태그
- 관련 day 파일 참조 시 `[[{project}/days/day-{NN}]]`
- 관련 topic 파일 참조 시 `See [[{project}/{topic-name}]]`
- `updated` 날짜 갱신

---

### topic \<name\>

`{project}/{name}.md` 생성 또는 편집. 하나의 주제에 대한 자기완결적 레퍼런스.

#### topic 파일 포맷

@~/.claude/templates/devlog/topic.md

**규칙:**
- 파일명: kebab-case (영문)
- YAML frontmatter 필수
- 자기완결적 — 다른 파일 없이 이해 가능
- devlog/learnings에서 `[[{project}/{name}]]`로 참조

---

## Obsidian 기능 사용 규칙

### Frontmatter (Properties)

모든 파일에 YAML frontmatter 필수:

| 파일 | 필수 properties |
|------|----------------|
| devlog.md (hub) | `title`, `tags: [devlog, {project}]` |
| days/day-{NN}.md | `title`, `tags: [devlog, {project}, ...]`, `date`, `day` |
| learnings-index.md | `title`, `tags: [learnings, {project}]`, `updated` |
| topic 파일 | `title`, `tags: [{project}, ...]`, `created` |

### Wikilinks

- **hub → day:** `[[{project}/days/day-{NN}|상세]]`
- **day → learnings:** `[[{project}/learnings-index#{개념명}]]`
- **day → topic:** `[[{project}/{topic-name}]]`
- **프로젝트 간:** `[[bevy-vrm/days/day-03]]` — 관련 프로젝트 참조 시
- **cross-project:** `[[_cross-project/graphics#용어]]` — 공통 레퍼런스

### Callouts

| 용도 | callout type | 사용 위치 |
|------|-------------|----------|
| 핵심 발견/팁 | `> [!tip]` | day 파일 — 성공한 접근 |
| 실패/주의 | `> [!warning]` | day 파일 — 실패한 시도 |
| Rule 추출 | `> [!abstract] Rule` | learnings-index — 일반화된 교훈 |
| 환경/버전 | `> [!info]` | topic 파일 — 환경 정보 |

### Tags

- 프로젝트: `#bevy-vrm`, `#mmd-anju`
- 카테고리: `#rule`, `#failed`, `#gotcha`
- 도메인: `#retarget`, `#vrm`, `#shader`, `#joint-limit`
- frontmatter `tags` 배열 + 본문 인라인 태그 병용

---

## 프로젝트 초기 셋업

프로젝트 폴더가 없으면:

1. `{obsidian}/claude/projects/{project}/` 생성
2. `days/` 디렉토리 생성
3. `devlog.md` hub 파일 생성 (frontmatter + 프로젝트명 + 설명 질문)
4. `learnings-index.md` 생성 (frontmatter + 3개 카테고리 빈 섹션)
5. Day 1부터 시작

---

## 기존 프로젝트 마이그레이션

기존 프로젝트에서 이 포맷을 처음 적용할 때:

1. 기존 파일에 frontmatter 추가 (비파괴적 — 기존 내용 유지)
2. day 파일의 핵심 발견에 callout 추가
3. learnings-index의 Rule에 callout + `#rule` 태그 추가
4. 파일 간 wikilink 연결
5. **한번에 전부 하지 말 것** — 새 엔트리 추가할 때 주변 기존 엔트리도 점진적으로 업데이트

단일 devlog.md → hub + day 파일 분리 시:
1. 기존 devlog.md의 각 날짜 엔트리를 `days/day-{NN}.md`로 분리
2. devlog.md는 hub로 전환 (요약 + wikilink만 남김)

---

## Related

- `obsidian-obsidian-markdown` — 옵시디언 마크다운 문법 레퍼런스
- `dev-log-experiment` — 실험 일지 (hypothesis→measure→conclude 사이클)
- `learn-add-log` — 단일 교훈 빠르게 추가
