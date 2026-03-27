---
description: "Hackathon toolkit — quick-access hub for timed problem solving. Use when starting a hackathon, competition, or timed coding challenge."
argument-hint: "[problem description]"
allowed-tools: Bash(python3:*), Agent, WebSearch, WebFetch, Read, Write, Edit, Glob, Grep
---

# dev-hackathon-toolkit

시간 제한 해커톤/대회용 빠른 문제 해결 허브. 기존 스킬들을 단계별로 안내하고, 시간 추적까지 제공합니다.

## Arguments

- `[problem description]` - 문제 설명 (선택). 없으면 대기 모드로 시작.

## Workflow

### Step 1: 타이머 시작

현재 시간을 기록하고, 남은 시간을 계산할 수 있도록 시작 시간과 종료 시간을 확인합니다.

```
해커톤 시작: {현재시간}
종료 예정: {사용자에게 확인}
```

### Step 2: 문제 분석 (처음 10분)

문제를 받으면:

1. **문제 요약** — 핵심을 3줄로 정리
2. **유형 분류** — 알고리즘 / ML / 프롬프트 엔지니어링 / 데이터 처리 / 시스템 설계 / 기타
3. **필요 도구 판단** — 어떤 API, 라이브러리, 접근법이 필요한지
4. **시간 배분 제안** — 4시간 기준 단계별 시간 배분

### Step 3: 접근법 결정

문제 유형에 따라 적합한 기존 스킬로 안내:

| 상황 | 스킬 | 설명 |
|------|------|------|
| 접근법을 모르겠을 때 | `/dev-decision-start` | Gemini+GPT-4o+Opus 3모델 병렬 상담 |
| 특정 기술 빠른 질문 | `/dev-ask-gemini` | Gemini 단일 모델 빠른 응답 |
| 기술 조사 필요 | `/meta-research-web` | 2개 에이전트 병렬 웹 리서치 |
| 가벼운 조사 | `/meta-research-light` | 단일 에이전트 빠른 리서치 |

### Step 4: 구현

구현 중 사용할 수 있는 스킬:

| 상황 | 스킬 | 설명 |
|------|------|------|
| 전력 구현 모드 | `/meta-work-ultra` | 필수 추적 + 완료까지 진행 |
| 버그 발생 | `/dev-fix-bug` | RED→GREEN→REFACTOR 증명 기반 수정 |
| 실험/반복 추적 | `/dev-log-experiment` | 가설→측정→결론 사이클 기록 |
| 코드베이스 파악 | `/meta-consult-codebase` | 읽기 전용 분석 모드 |

### Step 5: 제출 전 검증 (마지막 15분)

| 상황 | 스킬 | 설명 |
|------|------|------|
| 코드 품질 확인 | `/review-audit-web` | JS/CSS 코딩 표준 체크 |
| 스펙 문서 생성 | `/dev-generate-spec` | 코드에서 스펙 문서 자동 생성 |

---

## 빠른 시작 템플릿

문제를 받으면 바로 이 순서로:

```
1. [2분] 문제 읽고 요약
2. [5분] /dev-decision-start "문제: {요약}. 4시간 안에 풀어야 함. 접근법?"
3. [3분] 접근법 확정, 시간 배분
4. [3시간] 구현 — 막히면 /dev-ask-gemini, 버그면 /dev-fix-bug
5. [30분] 정리 + 검증 + 제출 준비
6. [15분] 제출
```

---

## 직접 사용 가능한 도구

이 스킬 내에서 바로 실행 가능:

- **Python 실행** — `python3` 스크립트 직접 실행
- **웹 검색** — WebSearch로 기술 문서, 논문, 레퍼런스 검색
- **웹 페이지 읽기** — WebFetch로 문서/API 레퍼런스 읽기
- **파일 읽기/쓰기** — 코드 작성, 데이터 파일 처리
- **서브에이전트** — 병렬로 리서치/분석 위임

---

## 프로젝트 레포

작업 시작 전 `~/.claude/private/repo-paths.json`에서 `krafton-hackathon` 경로를 읽고 해당 디렉토리로 이동하여 작업합니다.

---

## 주의사항

- **제출은 1회** — 제출 전 반드시 더블체크
- **시간 관리** — 한 접근법에 1시간 이상 막히면 방향 전환
- **AI 적극 활용** — 공식적으로 허용됨, 도구를 최대한 활용
