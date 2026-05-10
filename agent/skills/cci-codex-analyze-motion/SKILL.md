---
description: Codex로 FBX 모션 데이터 분석 — 본 hierarchy, rest pose vs frame 0 diff, jitter, ARP 표준 준수.
argument-hint: "<fbx-dir | fbx-file> [--standard arp|generic] [--focus <bone-name>]"
allowed-tools: Bash(codex:*), Bash(bash:*), Bash(ls:*), Bash(find:*), Read, Glob
---

# cci-codex-analyze-motion

FBX 모션 데이터를 Codex(`gpt-5.4`, high reasoning)에게 분석시킨다. 리타겟 파이프라인에 넣기 전 **sanity check + jitter 탐지 + opening pop 위험 평가** 가 목적.

핵심 검사 항목:
- **본 hierarchy** — 개수, 루트, 깊이
- **클립 메타** — 프레임 수, FPS, 길이
- **ARP 표준 본 누락** — Hips/Spine/Chest/Neck/Head/팔다리 체인
- **Rest pose vs Frame 0 diff** ⭐ — opening pop의 직접적 원인
- **Jitter 후보** — frame-to-frame 회전 spike
- **본 이름 sanity** — 비정상 문자, 음수 프레임, 잘못된 인코딩

## 전제

이 스킬은 **FBX 파서가 있는 워크스페이스**에서 실행해야 한다 (예: bevy-vrm, shotloom).
Codex가 다음 중 하나를 자동 선택:
1. 기존 분석 bin 재사용 (e.g. `analyze_fbx`, `fbx_dump`)
2. 기존 lib API로 임시 bin 작성 (`*_scratch_*.rs` 또는 `*_summary_*.rs`)
3. 둘 다 없으면 그 사실 보고하고 종료 (FBX 파싱 도구 없음)

## Arguments

- `<fbx-dir>` — 디렉토리 (`assets/fbx/` 같은) — 안의 모든 `.fbx` 일괄 분석
- `<fbx-file>` — 단일 `.fbx` 경로 — 한 개 깊게 분석
- `[--standard arp|generic]` (선택, 기본: `arp`) — 본 표준
  - `arp`: Auto-Rig Pro 컨벤션 검사
  - `generic`: 표준 검사 생략, 구조만 덤프
- `[--focus <bone-name>]` (선택, 반복 가능) — 특정 본의 시계열을 더 깊게 분석

**인자 필수.** 없으면 사용법 출력 후 종료. NEVER auto-execute.

Usage:
- `/cci-codex-analyze-motion assets/fbx/`
- `/cci-codex-analyze-motion assets/fbx/18479_F_AILimpRightFR_000000.fbx`
- `/cci-codex-analyze-motion assets/fbx/ --focus foot.r --focus foot.l`
- `/cci-codex-analyze-motion assets/fbx/ --standard generic`

## Workflow

### Step 1: Validate
- $ARGUMENTS 비었으면 사용법 출력 후 종료.
- 인자가 디렉토리면: `find <dir> -iname "*.fbx"` 로 카운트. 0이면 안내 후 종료.
- 인자가 파일이면: 존재 + 확장자 `.fbx` 확인.
- `codex` CLI 존재 확인.
- 현재 cwd가 cargo workspace인지 확인 (`Cargo.toml` 존재). 아니면 경고.

### Step 2: Build prompt

플레이스홀더:
- `<TARGET>` — 디렉토리 또는 파일 경로
- `<TARGET_KIND>` — `directory` 또는 `single file`
- `<FILE_LIST>` — 디렉토리 모드면 발견된 FBX 파일 목록 (find 결과)
- `<STANDARD>` — `arp` (기본) 또는 `generic`
- `<FOCUS_BONES>` — `--focus` 로 넘어온 본 이름들 (없으면 `(none)`)

프롬프트 본문:

```
당신은 3D 애니메이션 데이터 분석가다. 아래 FBX 데이터를 분석하라.

## 환경
- 워크스페이스 루트: 현재 디렉토리
- 분석 대상: <TARGET> (<TARGET_KIND>)
- 본 표준: <STANDARD>
- 집중 본: <FOCUS_BONES>
- 사용 가능한 도구:
  - Cargo workspace의 기존 FBX 파싱 crate (예: fbx_rig, fbx-direct)
  - 기존 분석 bin (cargo run --bin <name>)
  - 임시 bin 신규 작성 — 파일명에 _scratch_ 또는 _summary_ 포함, lib에 영향 X
- 분석 대상 FBX 파일은 read-only (수정/삭제 절대 금지)

## 분석 대상 파일
<FILE_LIST>

## Phase 1: 도구 정찰 (필수)
1. 워크스페이스의 FBX 파싱 lib 위치 파악 (`crates/*/src/lib.rs` 중 fbx 관련)
2. 노출된 API 요약 (3~5줄)
3. 기존 분석 bin 존재 여부 확인 (`crates/*/src/bin/*.rs`)
4. 도구 전략 결정:
   - 기존 bin이 요구사항을 충족 → 그대로 활용
   - 부족 → 임시 bin 작성 (파일명에 _scratch_/_summary_)
   - lib도 없음 → 그 사실 보고하고 Phase 2로 넘어가지 말 것

## Phase 2: 파일별 분석
각 FBX에 대해:
- **본 개수**, **루트 본 이름** (다중 루트면 모두)
- **프레임 수**, **FPS**, **길이(초)**
- **ARP 표준 본 누락** (`<STANDARD>`가 `arp`일 때만):
  - Hips, Spine, Chest, Neck, Head
  - Left/Right Shoulder, UpperArm, LowerArm, Hand
  - Left/Right UpLeg, Leg, Foot
  - 누락된 본 목록
- **Rest pose vs Frame 0 diff** ⭐:
  - 각 본의 rest 회전과 frame 0 회전 차이를 계산
  - 5° 이상 차이 나는 본 목록 (각도 함께)
  - 이 항목이 비어있으면 "opening pop 위험 0"
- **Jitter 후보**:
  - frame-to-frame 회전/위치 spike 탐지
  - 임계: 회전 10°/frame 또는 위치 5cm/frame 초과
  - 의심 본 목록
- **잠재 문제**: 음수 프레임, 비정상 본 이름 (특수문자, 빈 이름), Maya/DHI 계열 facial-only 구조 등
- **`<FOCUS_BONES>`가 있으면**: 그 본의 시계열을 추가로 출력 (frame, rotation Euler, position)

## Phase 3: 종합
- 분류: ✅ **안전** / ⚠️ **주의** / 🚨 **위험**
  - 안전: 모든 검사 통과
  - 주의: jitter 후보 있음, 또는 ARP 본 일부 누락
  - 위험: humanoid body 체인 자체 부재, opening pop 위험, 다중 root 충돌
- 문제 top 3 + 이유
- humanoid_retarget 파이프라인이 처리 어려운 케이스 식별

## 출력
- **한국어**, 마크다운 표
- 도구 빌드/실행 로그 핵심만 인용
- **결론은 굵게**

## 제약
- 분석 대상 FBX는 절대 수정/삭제 금지
- 빌드 실패 2번이면 다른 접근 (또는 분석 중단 + 사유 보고)
- FBX 한 개 30초 이상 걸리면 가장 흥미로운 3~4개만 깊게, 나머지는 표 요약
- 외부 네트워크 접근 금지 (오프라인 도구만)
```

### Step 3: Call wrapper
`bash ~/.claude/lib/cci-codex/run-codex.sh analyze-motion "<위 프롬프트 전체>"`

(wrapper가 high reasoning + 결과 아카이빙을 자동 처리.
이번 분석은 보통 5~10분, 50k~100k 토큰 소비 예상.)

### Step 4: Show result
- wrapper 출력 그대로 노출
- Codex가 임시 bin을 생성했으면 사용자에게 알림 — 삭제 vs 정식 승격 결정 필요
- 분석 결과는 wrapper가 archived path 출력
- Claude는 추가 해석 금지 — 사용자가 직접 결과 읽음

## Caveats

- **FBX 파서 의존**: 워크스페이스에 FBX 파싱 lib가 없으면 동작 불가. 지원 환경: bevy-vrm, fbx_rig 사용하는 다른 crate.
- **Rest pose 정의**: lib가 노출하는 `rest` 또는 `bind_world` API에 따라 결과 의미가 달라질 수 있음. 현재 fbx_rig는 `compute_fbx_skeleton_from_parsed`의 bind pose를 rest로 사용.
- **임시 bin 파일 방치 위험**: Codex가 작성한 `*_scratch_*.rs` 파일이 working tree에 남음. 분석 후 정리 필요.
- **결정론 X**: 같은 FBX에 대해 Codex가 다른 본을 jitter 후보로 뽑을 수 있음. 임계값(10°/frame, 5cm/frame)은 휴리스틱.
