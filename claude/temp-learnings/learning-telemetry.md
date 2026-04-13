# Telemetry (텔레메트리)

**Date:** 2026-04-13

## 핵심

**원격(tele-) 측정(-metry)** — 시스템이 돌아가는 동안 내부 상태/이벤트를
수집해서 **다른 곳으로 보내 관찰**하는 것.

"프로그램이 지금 뭘 하고 있는지"를 외부에서 볼 수 있게 데이터를 흘려보내는
메커니즘. 디버깅·성능 분석·사용 패턴 파악이 목적.

## 3가지 주요 구성요소 (OpenTelemetry 표준)

| 타입 | 뭘 보내나 | 예시 |
|---|---|---|
| **Metrics** | 수치 (카운터, 게이지) | CPU 사용률, 요청 수/초, 에러율 |
| **Logs** | 이벤트 메시지 | `"user logged in"`, 에러 스택 |
| **Traces** | 요청 흐름 추적 | API 요청이 서비스 A→B→C 거치는 경로+소요시간 |

## JS 비유

- `console.log` = 로컬 로그 (나만 봄)
- **telemetry** = `console.log`를 원격 서버(Datadog, Sentry, Grafana)로
  전송해서 **대시보드로 관찰**

## 맥락별 의미

### 1. 웹/서버 (일반적)
Sentry = 에러, Datadog = 메트릭, Grafana = 트레이스. 운영팀이 대시보드로 봄.

### 2. Claude Code 맥락
`ScheduleWakeup`의 `reason` 필드: "Goes to telemetry and is shown back to
the user". = Anthropic이 agent 동작을 관찰/개선하려고 수집하는 데이터.

### 3. 게임/앱
"유저가 어느 레벨에서 가장 많이 죽는지" 같은 행동 데이터 → 밸런싱.

### 4. 데스크톱 앱 (논란)
VS Code, Windows 등이 "사용 통계"를 보내는 것도 telemetry. 프라이버시
이슈로 보통 opt-out 설정 제공.

## 리타겟/3D 맥락 응용

bevy-vrm에 telemetry를 붙인다면:
- **Metrics**: 프레임당 뼈 개수, FK 계산 ms, 스코어 값
- **Logs**: `"bone X rotation out of range at frame 42"`
- **Traces**: FBX load → retarget → FK → render 파이프라인 각 단계 소요 시간

= 뷰어 열지 않고도 "어디서 느려지는지/어디서 틀어지는지" 파악 가능.
**CLI 검증 원칙의 연장선** — bin들이 stdout으로 찍는 수치도 일종의
로컬 telemetry라고 볼 수 있음.

## 관련 도구/용어

- **OpenTelemetry (OTel)** — 업계 표준 telemetry 수집 프로토콜/SDK
- **Observability (관찰가능성)** — telemetry를 잘 수집해서 "외부에서
  시스템 내부를 추론할 수 있는 상태". telemetry는 수단, observability는 목표.
- **APM (Application Performance Monitoring)** — telemetry 기반 성능 감시 제품군
- **Structured logging** — 문자열 대신 JSON으로 로그 → 기계가 파싱 가능
