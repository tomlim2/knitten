---
description: Log devlog entries, learnings, and topic files to project docs/ in Obsidian format
argument-hint: "<devlog|learning|topic> [category|name]"
allowed-tools: Read, Write, Edit, Glob, Grep
---

# dev-log-project

프로젝트 `docs/` 폴더에 옵시디언 형식으로 개발 일지/교훈을 기록. 프로젝트 로컬 임시저장소로 사용하고, 나중에 옵시디언에 옮길 수 있다.

## Purpose

프로젝트 작업 중 발견한 교훈, 일별 진척, 주제별 상세 레퍼런스를 현재 프로젝트의 `docs/` 폴더에 기록한다. 옵시디언 vault와 동일한 형식을 사용하여 나중에 그대로 옮길 수 있다.

---

## Usage

```
/dev-log-project devlog              — 오늘 devlog 엔트리 추가
/dev-log-project learning <category> — learnings-index에 교훈 추가
/dev-log-project topic <name>        — 주제별 상세 파일 생성/편집
```

### Sub-commands

**`devlog`** — 날짜별 개발 일지

`docs/devlog.md`에 오늘 날짜로 엔트리 추가. 이미 오늘 날짜 엔트리가 있으면 그 아래에 append.

**`learning <category>`** — 핵심 교훈

`docs/learnings-index.md`의 해당 카테고리 섹션에 교훈 추가.

카테고리:
- `worked` — 성공한 접근 (반복할 가치 있음)
- `failed` — 실패한 접근 (다시 시도하지 말 것)
- `gotcha` — 비직관적 함정 (알아야 피할 수 있음)

**`topic <name>`** — 주제별 상세 레퍼런스

`docs/<name>.md` 생성 또는 편집. kebab-case 이름 사용.

---

## Obsidian Format Guide

### devlog.md

```markdown
# {프로젝트} 개발일지

{한줄 설명}

---

## YYYY-MM-DD — {제목}

**{서브제목}**
- 불릿 포인트로 기술 내용
- 코드 식별자는 `backtick`

커밋: `abc1234`~`def5678` (N건)

---
```

규칙:
- `## YYYY-MM-DD — 제목` 형식 (H2)
- 최신이 위 (역순)
- 날짜 구분선 `---`
- **볼드**로 서브섹션, 불릿으로 상세

### learnings-index.md

```markdown
# {프로젝트} Learnings

Last updated: YYYY-MM-DD

---

## What Worked

### {개념명}
- **Date**: YYYY-MM-DD
- **Context**: {상황 설명}
- **Problem**: {무엇이 문제였는지}
- **Solution**: {어떻게 해결했는지}
- **Why it worked**: {왜 이 방법이 효과적인지}
- **Rule**: {일반화된 교훈/패턴}

---

## What Failed

### {시도명}
- **Date**: YYYY-MM-DD
- **Context**: {상황}
- **Problem**: {왜 실패했는지}
- **Rule**: {다음에 피해야 할 것}

---

## Gotcha

### {함정명}
- **Date**: YYYY-MM-DD
- **Context**: {상황}
- **Problem**: {비직관적인 동작}
- **Solution**: {우회 방법} (있으면)
- **Rule**: {기억해야 할 것}
```

규칙:
- H2: 카테고리 (`What Worked`, `What Failed`, `Gotcha`)
- H3: 개별 교훈
- 필드: **Date/Context/Problem/Solution/Why/Rule** (볼드+콜론)
- `Last updated` 날짜 갱신

### 개별 주제 파일 ({topic}.md)

```markdown
# {주제 제목}

## {섹션 1: Gotcha/원인/Problem}
{설명}

## {섹션 2: 해결/Solution}
{코드 블록 + 구현 상세}

## {섹션 3: 교훈/Why}
- 불릿 포인트

## 환경
- {프레임워크/엔진 버전}
- {파일 경로}
- {날짜}
```

규칙:
- 파일명: kebab-case (영문)
- H1: 주제 제목
- H2: 섹션 (Problem → Solution → Why → 환경)
- 코드 블록: 언어 태그 포함
- 자기완결적 (다른 파일 참조 없이 이해 가능)

---

## Execution

1. `$ARGUMENTS`에서 sub-command와 인자 파싱
2. 현재 프로젝트의 `docs/` 폴더 확인 (없으면 생성)
3. sub-command별 실행:

### devlog
1. `docs/devlog.md` 읽기 (없으면 템플릿으로 생성)
2. 사용자에게 오늘 작업 내용 질문
3. `## YYYY-MM-DD — {제목}` 엔트리를 `---` 구분선 패턴 뒤, 기존 날짜 엔트리들 앞에 삽입
4. 이미 오늘 날짜 엔트리가 있으면 그 섹션 하단에 내용 append

### learning
1. `docs/learnings-index.md` 읽기 (없으면 템플릿으로 생성)
2. 사용자에게 교훈 내용 질문 (Context, Problem, Solution, Rule)
3. 해당 카테고리 섹션(`What Worked`/`What Failed`/`Gotcha`) 하단에 append
4. `Last updated` 날짜 갱신

### topic
1. `docs/{name}.md` 확인
2. 없으면 템플릿으로 생성, 있으면 읽어서 편집
3. 사용자와 대화하며 내용 작성

---

## Related

- `/learn-add-log` — Obsidian vault에 직접 교훈 기록 (최종 저장소)
- `/dev-log-experiment` — 실험 일지 (hypothesis→measure→conclude 사이클)
