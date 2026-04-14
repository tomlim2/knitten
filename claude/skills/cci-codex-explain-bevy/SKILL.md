---
description: Codex로 Bevy ECS/Plugin/Resource 패턴을 JS 비유로 한국어 설명. 학습 보조.
argument-hint: "<주제 또는 file:line>"
allowed-tools: Bash(codex:*), Bash(bash:*), Read, Grep
---

# cci-codex-explain-bevy

Bevy 코드/패턴을 **JS 개발자 멘탈 모델**로 한국어 풀이. 사용자 배경: 프론트엔드 JS/TS 10년+, Bevy/ECS 신참. JS 비유 + 실제 코드 인용 + 안티패턴 경고.

## Arguments

- `<주제>` — 자유 텍스트. 예: `"Plugin trait이랑 add_systems 흐름"`
- `<file:line>` — 특정 코드 위치. 예: `crates/cinev_retarget/src/lib.rs:1-50`

**인자 필수.** 없으면 사용법 출력 후 종료. NEVER auto-execute.

Usage: `/cci-codex-explain-bevy "Query<&Transform>가 어떻게 매 프레임 ECS에서 컴포넌트를 가져오는지"`

## Workflow

### Step 1: Validate
- $ARGUMENTS 비었으면 사용법 출력 후 종료.
- 인자에 `:`가 있으면 `file:lines` 형식으로 처리 (Read tool로 추출).

### Step 2: Build prompt

```
당신은 Bevy/ECS에 정통한 시니어 graphics engineer다. 학습자에게 아래 주제를
설명하라.

**학습자 배경**:
- 프론트엔드 JavaScript/TypeScript 10년 이상
- React, Node.js, 함수형 패러다임에 능숙
- Bevy/ECS는 신참 — class/inheritance 멘탈 모델로 ECS를 보면 막힘
- 회사에서 graphics engineer로 전환 중, 리타겟/렌더링 도메인

**설명 원칙**:
1. **JS 비유 우선** — 모든 개념은 JS의 무엇과 가장 가까운지 먼저 설명
2. **차이점 명시** — JS 비유가 깨지는 지점을 반드시 짚어라 (ECS는 OOP가 아님)
3. **시간 순서로 설명** — 프레임 1번 시작 → ... → 프레임 끝까지 무엇이 일어나는가
4. **실제 코드 인용** — Bevy 표준 패턴 코드를 1-2개 보여줌
5. **안티패턴 경고** — JS 개발자가 흔히 빠지는 함정 1-2개 (예: "Component 안에 메서드 넣고 싶어진다" → 그러면 안 되는 이유)

**구조**:
1. **한 줄 요약** (JS 비유 하나로)
2. **JS 멘탈 모델 vs Bevy 멘탈 모델** (표 또는 대조)
3. **시간 순서 흐름** (앱 시작 → 프레임 1 → 프레임 N)
4. **실제 코드 예시** (15줄 이하)
5. **JS 개발자가 헷갈리는 지점** (1-2개)
6. **더 알고 싶다면** (관련 개념 1-2개 링크 — Bevy 공식 문서 또는 같은 코드베이스의 다른 파일)

**금지**:
- "Bevy is an ECS framework" 같은 위키피디아식 정의 금지
- 모든 개념을 한 번에 설명 금지 — 주제에 집중
- 영어 jargon 남발 금지 (한 번은 영어, 그 후엔 한국어)

---

## 주제

<여기에 인자 또는 코드>
```

### Step 3: Call wrapper
`bash ~/.claude/lib/cci-codex/run-codex.sh explain-bevy "<프롬프트>"`

### Step 4: Show result
wrapper 출력 그대로. 사용자가 학습용으로 읽음.
