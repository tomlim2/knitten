---
title: "포폴 아이디어: 리타겟 파이프라인 + AI 개발 환경"
tags: [bevy-vrm, portfolio, retarget, ai-dev]
created: 2026-04-09
---

# 포폴 아이디어: 리타겟 파이프라인 + AI 활용 개발 환경

실패하든 성공하든 쓸만한 소재. 두 축으로 구성.

---

## 축 1: 리타겟 파이프라인

- ARP 파이프라인 설계 (MetaHuman 대체, 라이선스 수백만원 → $0)
- FK 스코어링 시스템 (RMS + direction, Grade A/B/C/F 자동 판정)
- CLI/뷰어 데이터 소스 불일치 발견 & 해결 (스코어링이 무의미해지는 구조적 문제)
- foot 접지 알고리즘 (foot+toe 버텍스 최저점 기반, static vs dynamic offset)
- Grade C→A 개선 과정 (direction 0.4°, position RMS 0.065m)

## 축 2: AI 활용 개발 환경 구축

- Claude Code 컨트롤타워 — 전략/리뷰/의사결정
- 에이전트 병렬 실행 — 리펙토링, 접지 수정 동시 진행
- 스코어링 기반 자율 반복 — 에이전트가 Grade A까지 알아서 돌림
- 멀티 AI 검증 — Codex + Opus로 코드리뷰 크로스체크
- 1인 개발자가 TA + 엔진 개발 규모의 파이프라인을 운영하는 실전 사례

## 왜 좋은 소재인가

- 단순 기능 구현이 아니라 문제 발견→삽질→해결 스토리가 있음
- 실패 과정도 가치 있음 (MetaHuman 접근 실패 → ARP 전환 등)
- AI 도구 활용이 "코드 생성"이 아니라 "개발 프로세스 자체의 설계"임을 보여줌
