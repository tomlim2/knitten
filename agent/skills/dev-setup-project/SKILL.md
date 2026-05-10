---
description: "Set up a new project — git, repo-paths, skill linking, and Obsidian docs for hackathons or side projects."
argument-hint: "<project-name> [repo-path]"
allowed-tools: Read, Write, Edit, Bash(git:*), Bash(ls:*), Bash(mkdir:*)
---

# dev-setup-project

새 프로젝트 워크스페이스를 한 번에 셋업합니다. git 초기화, repo-paths 등록, 관련 스킬 연동, Obsidian 문서 폴더 생성까지.

## Arguments

- `<project-name>` - repo-paths.json에 등록할 키 이름 (예: `krafton-hackathon`)
- `[repo-path]` - 프로젝트 디렉토리 경로 (선택. 없으면 물어봄)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-setup-project <project-name> [repo-path]

---

## Workflow

### Step 1: 경로 확인

1. `$ARGUMENTS`에서 project-name과 repo-path 파싱
2. repo-path가 없으면 `~/.claude/private/caol-config/repo-paths.json`에서 `anju` 경로를 읽고, `{anju}/{project-name}/` 을 기본 경로로 사용
3. 디렉토리 존재 여부 확인. 없으면 생성

### Step 2: Git 초기화

1. 대상 디렉토리에 `.git`이 이미 있는지 확인
2. 없으면 `git init` 실행
3. 있으면 "이미 git repo입니다" 안내 후 스킵

### Step 3: repo-paths.json 등록

1. `~/.claude/private/caol-config/repo-paths.json` 읽기
2. project-name 키가 이미 있는지 확인
   - 있으면: 경로가 같으면 스킵, 다르면 업데이트할지 물어봄
   - 없으면: 새 키-값 추가
3. 파일 저장

### Step 4: 관련 스킬 연동 확인

사용자에게 물어봄:
- "이 프로젝트와 연동할 스킬이 있나요?" (예: `dev-hackathon-toolkit`)
- 있으면 해당 스킬의 SKILL.md에 프로젝트 레포 섹션 추가
- 없으면 스킵

### Step 5: Obsidian 문서 폴더 생성

1. `~/.claude/private/caol-config/repo-paths.json`에서 `obsidian` 경로 읽기
2. `{obsidian}/agent/projects/{project-name}/` 디렉토리 생성
3. 기본 파일 생성:
   - `devlog.md` — 개발일지 (빈 템플릿)
   - `learnings-index.md` — 러닝 인덱스 (빈 템플릿)

### Step 6: 결과 요약

```
프로젝트 셋업 완료: {project-name}

- Git: {초기화됨 / 이미 존재}
- repo-paths: {등록됨 / 이미 존재}
- 스킬 연동: {스킬명 / 없음}
- Obsidian: agent/projects/{project-name}/
  ├── devlog.md
  └── learnings-index.md
```

---

## devlog.md 템플릿

```markdown
# {Project Name} 개발일지

{한 줄 설명}

---

```

## learnings-index.md 템플릿

```markdown
# {Project Name} — Learnings Index

{한 줄 설명}

---

```
