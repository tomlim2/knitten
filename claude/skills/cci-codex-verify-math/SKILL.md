---
description: Codex로 쿼터니언/변환 행렬 코드 기호적 검산. 좌표계 가정 명시, 부호·순서 오류 우선.
argument-hint: "<file:line-range | 함수명 | 식 설명> [--ref <path>]... [--phase <text>] [--coord <text>]"
allowed-tools: Bash(codex:*), Bash(bash:*), Read, Grep
---

# cci-codex-verify-math

3D 그래픽스 수학 코드(쿼터니언, 행렬, 변환, 스키닝)의 정확성을 Codex에게 **기호적으로 검산**시킨다. 좌표계 가정을 강제로 명시하게 해서 부호/순서 오류를 잡는 게 목적.

리타겟·스키닝·역운동학에서 가장 디버깅하기 어려운 부분: "수치는 맞아 보이는데 이상한 곳으로 회전"하는 케이스. Codex가 식을 손으로 전개해서 검증.

## Arguments

- `<file:line-range>` — 예: `crates/humanoid_retarget/src/retargeter.rs:296-347`
- `<함수명>` — 예: `compute_delta_local`
- `<식 설명>` — 예: `"q1 * q2.inverse()가 회전 차이인가?"`

**인자 필수.** 없으면 사용법 출력 후 종료. NEVER auto-execute.

Usage: `/cci-codex-verify-math crates/humanoid_retarget/src/retargeter.rs:296-347`

```
/cci-codex-verify-math crates/shotloom-retarget/src/retargeter.rs:296-347 \
  --ref docs/adr/adr-0023-retargeter-validation-contract.md \
  --phase "Phase B Session 2 — retargeter math port" \
  --coord "glTF Y-up right-handed; glam Quat mul is q1*q2 meaning q2 applied first"
```

### Optional flags

- `--ref <path>` — 참조 문서(ADR, spec, 좌표 컨벤션 문서). 반복 사용 가능. 내용은 prompt의 `## Binding references`에 포함되고, 경로 목록은 `<REF_PATHS>`에 치환.
- `--phase <text>` — Scope Context의 `<PHASE>` 치환.
- `--coord <text>` — Scope Context의 `<COORD_CONVENTIONS>` 치환. 알려진 좌표 컨벤션을 미리 고정해 Insufficient evidence 하드 스탑을 불필요하게 트리거하지 않게 함.

## Workflow

### Step 1: Validate
- $ARGUMENTS 비었으면 사용법 안내 후 종료.
- 인자가 `file:lines` 형식이면 Read tool로 해당 범위 추출.
- 인자가 함수명이면 Grep으로 정의 위치 찾고 Read.
- 인자가 자유 텍스트면 그대로 prompt 본문에 넣음.
- `--ref`, `--phase`, `--coord` 플래그를 파싱. `--ref`는 반복 허용, 각 경로는 Read로 내용 로드. 공급되지 않은 플래그는 Step 2에서 해당 placeholder 줄 자체를 **삭제**(리터럴 `<PHASE>` 그대로 두지 말 것).

### Step 2: Build verification prompt

프롬프트에 아래 템플릿을 채울 때:
- `<PHASE>`, `<REF_PATHS>`, `<COORD_CONVENTIONS>`는 Step 1에서 파싱한 플래그 값으로 치환. 해당 플래그가 없으면 그 placeholder **줄 전체를 삭제**한다 (리터럴 `<PHASE>` 같은 문자열을 절대 남기지 말 것).
- `--ref`로 받은 각 파일의 내용은 프롬프트 말미(`## 검증 대상` 직전)에 `## Binding references` 섹션으로 임베드하고, 경로 목록은 `<REF_PATHS>`에 치환한다.

```
당신은 컴퓨터 그래픽스 수학에 정통한 검증자다. 아래 코드/식이 수학적으로
올바른지 검증하라.

## Scope Context (caller-provided)
- Phase: <PHASE>
- Binding references (read these first): <REF_PATHS>
- Known coordinate conventions: <COORD_CONVENTIONS>

---

## Uncertainty Protocol (binding)
- If the coordinate system, handedness, quaternion multiplication
  order, or column-vs-row vector convention cannot be inferred from
  the code alone **and** is not supplied in `Scope Context` above,
  you must **stop verification** and emit an "Insufficient evidence"
  result. Do not proceed to step 2 (symbolic expansion) or step 3
  (counter-example). Continuing under an assumed convention creates
  false confidence.
- If the caller supplied `Binding references`, read them first and
  treat their conventions as ground truth. Do not second-guess them.
- Any ambiguity that is not a coordinate convention (e.g., unclear
  input domain, missing type constraints) is collected in a
  "Questions for author" section at the end, not mixed with the
  verification result.

---

**검증 순서** (이 순서를 반드시 지킬 것):

1. **좌표계 가정 명시**
   - 어떤 좌표계인가? (Y-up vs Z-up, 왼손 vs 오른손)
   - 회전 곱 순서: column-vector 컨벤션인가, row-vector인가?
   - 쿼터니언 곱 순서: `q1 * q2`가 q1을 먼저 적용인가, q2를 먼저 적용인가?
   - 코드에서 추론한 가정을 명시하라. 추론 불가능하면 Uncertainty
     Protocol에 따라 **검증 즉시 중단**하고 "Insufficient evidence"
     결과를 낸다. "ambiguous"로 표시한 채 2단계로 넘어가지 말 것.
   - 좌표계 가정은 코드 근거 또는 Binding reference 근거 중 하나를
     반드시 인용하라. "일반적으로는 ~이다"는 근거가 아니다.

2. **기호적 전개**
   - 식을 손으로 단계별로 전개하라. 변수에 의미를 부여 (q_src, q_dst 등).
   - 각 단계가 무엇을 의미하는지 한국어 한 줄 설명 첨부.
   - 최종 결과가 의도한 양(예: "회전 차이", "좌표 변환")과 일치하는지 검증.

3. **반례 시도**
   - 단순한 입력(예: 항등 회전, 90° X축 회전)을 직접 대입.
   - 결과를 손으로 계산하고 코드 결과와 비교.
   - 부호가 뒤집히거나 축이 바뀌는 경우 즉시 표시.

4. **자주 틀리는 패턴 체크**
   - 쿼터니언 conjugate vs inverse 혼용 (단위 쿼터니언이 아니면 다름)
   - 회전 곱 순서 (글로벌 vs 로컬)
   - degree vs radian
   - left-multiply vs right-multiply
   - row-major vs column-major 행렬

**출력 형식**:
- ✅ **OK** (검증 통과) / ⚠️ **의심** (반례 없지만 우려) / 🚫 **Insufficient evidence** (검증 불가능 — 좌표계 가정 확정 불가) / ❌ **버그** (반례 있음)
- 좌표계 가정 (한 단락)
- 기호적 전개 (LaTeX 또는 ASCII 수식)
- 반례 또는 검증 입력 (실제 수치)
- 결론 (한 줄)
- **Questions for author** (검증과 무관하지만 확인 필요한 항목)

**금지 사항**:
- "보기엔 맞다" 같은 인상 평가 금지. 반드시 식 전개 또는 반례 대입.
- "implementation looks standard" 같은 둘러대기 금지.

---

## 검증 대상

<여기에 코드 블록 또는 자유 텍스트>
```

### Step 3: Call wrapper
`bash ~/.claude/lib/cci-codex/run-codex.sh verify-math "<위 프롬프트 전체>"`

### Step 4: Show result
wrapper 출력 그대로 노출. 추가 해석 금지 — 사용자가 직접 식을 따라가야 학습 효과가 있음.
