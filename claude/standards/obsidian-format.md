# Obsidian Document Format Standard

Obsidian vault 내 모든 문서에 적용하는 형식 표준.

---

## Frontmatter (필수)

모든 .md 파일에 YAML frontmatter 포함:

```yaml
---
title: "문서 제목"
tags:
  - project-name
  - category
date: YYYY-MM-DD
source: notion-export | manual | claude
---
```

- `title`: 문서 제목 (큰따옴표)
- `tags`: 프로젝트명 + 카테고리 (kebab-case)
- `date`: 작성일 또는 원본 작성일
- `source`: 출처 (notion-export, manual, claude)

---

## 구조

```markdown
---
frontmatter
---

# 제목

{개요 1-2문장}

---

## 섹션 1

내용

## 섹션 2

내용
```

### 규칙

1. **H1은 1개만** — frontmatter 직후, 문서 제목과 동일
2. **섹션 구분** — `---` 수평선으로 주요 섹션 분리
3. **빈 줄** — 헤딩 앞뒤 빈 줄 1개씩
4. **리스트** — `-` 사용 (ordered는 `1.`)
5. **코드/경로** — 인라인 `backtick`, 블록은 ````
6. **이미지** — `![[폴더/파일.png]]` wikilink (markdown link 사용 금지)
7. **내부 링크** — `[[노트명]]` wikilink
8. **외부 링크** — `[텍스트](URL)` markdown link
9. **callout** — `> [!tip]`, `> [!warning]`, `> [!info]` 등
10. **태그** — frontmatter `tags` 필드 사용 (인라인 `#tag`는 문서 말미에만)

---

## 카테고리별 태그 컨벤션

| 문서 유형 | 필수 태그 |
|-----------|-----------|
| 회사 작업 기록 | `cinev`, 카테고리 (material, profiling, nanite 등) |
| 프로파일링 | `cinev`, `profiling` |
| 개인 프로젝트 | 프로젝트명 (bevy-vrm, mmd-anju 등) |
| devlog | `devlog`, 프로젝트명 |
| learnings | `learnings`, 프로젝트명 |
| 채용 관련 | `job-search` |
| 이미지/비디오 프롬프트 레퍼런스 | `reference`, `image-prompt` 또는 `video-prompt`, **사용한 도구/모델 전부** (예: `gpt-image-2`, `seedance-2-0`, `midjourney-v7`, `flux-dev`, `gemini-image-3`, `runway-gen-4`) |
| 코드/라이브러리 레퍼런스 | `reference`, **기술 스택** (예: `rust`, `bevy-0-15`, `react-19`, `webgpu`) |

### 기술 스택 태그 규칙

레퍼런스 문서(프롬프트, 코드 스니펫, 워크플로우 등)에는 **사용한 도구·모델·라이브러리를 모두 태그로 명시**한다. 미래에 같은 도구로 다른 작업을 할 때 검색 한 번으로 모이게 하기 위함.

- **kebab-case 강제** — `GPT Image 2` → `gpt-image-2`, `Seedance 2.0` → `seedance-2-0`, `Three.js` → `three-js`
- **버전은 마이너까지** — `bevy-0-15` (`0-15-1`까지 적지 말 것), `react-19`, `gpt-image-2`
- **여러 도구 같이 썼으면 전부** — 프롬프트 1개에 GPT Image 2 + Seedance 2.0 둘 다 썼으면 둘 다 태그
- **카테고리 태그도 같이** — 도구 태그만 있으면 안 됨. `reference` + `image-prompt`도 함께
- **기존 태그 그대로 사용** — 같은 도구 새로 태그하기 전에 vault 검색해서 기존 표기 확인 (`gpt-4o-image` vs `gpt-image-4o` 같은 표기 분기 방지)

---

## Notion 아카이브 정리 기준

notion-export 문서를 Obsidian으로 마이그레이션할 때:

1. frontmatter 추가 (`source: notion-export`, 원본 날짜)
2. H1 중복 제거 (1개만)
3. HTML 잔재 제거 (`<div>`, `<span>` 등)
4. 이미지 경로를 wikilink로 변환 (`![[폴더/파일.png]]`)
5. URL 인코딩된 경로 디코딩
6. 빈 테이블/빈 줄 정리
7. Notion 메타데이터(생성일시, 편집일시 테이블) → frontmatter `date`로 이동 후 본문에서 제거
8. 문서 말미에 카테고리 인라인 태그 제거 (frontmatter tags로 통합)
