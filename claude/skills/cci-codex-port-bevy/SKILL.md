---
description: Codex로 bevy-vrm 파일/모듈을 shotloom-retarget으로 이식 계획. 단계별 PR 분할 + contract surface 제안.
argument-hint: "<bevy-vrm 파일 경로>"
allowed-tools: Bash(codex:*), Bash(bash:*), Read, Glob
---

# cci-codex-port-bevy

`bevy-vrm`의 한 파일/모듈을 `shotloom-retarget` crate로 이식하는 **계획서**를 Codex가 작성. 코드를 직접 옮기지는 않음 — 의사결정 보조용.

핵심 가치: 이식은 범위 폭발 두려움 때문에 자꾸 미루게 됨. Codex가 의존성 그래프 + 단계별 PR 분할 + contract surface까지 제안하면 시작하기 쉬워짐.

## Arguments

- `<bevy-vrm 파일 경로>` (필수) — 예: `crates/cinev_retarget/src/quality/rubric_a.rs`
  - 절대 경로 또는 bevy-vrm 레포 기준 상대 경로 모두 OK

**인자 필수.** 없으면 사용법 출력 후 종료. NEVER auto-execute.

Usage: `/cci-codex-port-bevy crates/cinev_retarget/src/quality/rubric_a.rs`

## Workflow

### Step 1: Validate
- $ARGUMENTS 비었으면 사용법 출력.
- bevy-vrm 레포 위치 확인: `~/.claude/private/repo-paths.json`의 `bevy-vrm` 키.
- 파일 존재 확인. 없으면 안내.
- shotloom-github 위치도 확인 (대상 레포).

### Step 2: Gather context
- Read tool로 대상 파일 전체 읽기
- Glob으로 같은 디렉토리/관련 모듈 파일 목록 수집 (참고용)
- 가능하면 `cargo tree -p cinev_retarget`도 한 번 (Bash)

### Step 3: Build prompt

```
당신은 Rust 워크스페이스 마이그레이션 전문가다. 아래 bevy-vrm 모듈을
shotloom 레포의 shotloom-retarget crate로 이식하는 **계획서**를 작성하라.

**대상 파일**: <인자>
**소스 레포**: bevy-vrm/crates/cinev_retarget/
**대상 레포**: shotloom-github/crates/shotloom-retarget/ (부트스트랩 단계)

**계획서 구조** (반드시 이 순서):

1. **파일 한 줄 요약** — 이 모듈이 시스템에서 하는 역할

2. **의존성 그래프**
   - 이 파일이 의존하는 것 (in-crate, 다른 crate, 외부 crate)
   - 이 파일에 의존하는 것 (역방향)
   - 형식: `A → B → C` 또는 mermaid

3. **이식 순서 (PR 분할)**
   - 부트스트랩 → 타입 → 본체 → 어댑터 → 테스트 → 통합
   - 각 PR이 무엇을 하는지 1-2줄
   - 각 PR이 빌드 통과해야 함 (작은 단위, prove-as-you-go)
   - 최소 3개, 최대 7개 PR

4. **Contract Surface (외부 노출 API)**
   - 이식 후 shotloom-retarget이 외부에 노출할 함수/타입
   - 가능한 작게 — 한 번 노출하면 빼기 어려움
   - 명시적 + 암묵적 계약 (결정론, 멱등성, panic 안 함 등)

5. **이식 시 주의점**
   - bevy-vrm 환경 가정 중 shotloom에서 깨질 수 있는 것
   - import path 변경 (use cinev_retarget → use shotloom_retarget)
   - feature flag, conditional compilation
   - 잠재적 lifetime/소유권 충돌

6. **검증 전략**
   - 이식 직후 어떻게 "옮겨졌다"를 증명할 것인가
   - 기존 bevy-vrm 테스트를 그대로 옮길 수 있는가
   - rubric C 같은 quality gate가 통과해야 하는가

7. **위험도** — 🟢 Low / 🟡 Medium / 🔴 High
   - 추정 작업 시간 (1시간 단위)
   - 가장 큰 unknown

**금지**:
- "그냥 복사하면 됨" 같은 안일한 결론
- 코드를 직접 작성하지 말 것 — 계획만
- 추측성 "may need..." 금지 — 의존성은 grep해서 확인하라

---

## 대상 파일

<여기에 Read한 파일 내용>

## 같은 디렉토리 파일 목록

<Glob 결과>
```

### Step 4: Call wrapper
`bash ~/.claude/lib/cci-codex/run-codex.sh port-bevy "<프롬프트>"`

### Step 5: Show result
- wrapper 출력 그대로
- 사용자가 계획서 보고 첫 PR(보통 부트스트랩 또는 타입 정의)부터 직접 작업 시작
- Claude는 계획서에 손대지 않음 — 사용자가 단계별로 수동 진행
