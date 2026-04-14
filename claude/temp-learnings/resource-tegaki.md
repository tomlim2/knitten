# Resource: Tegaki — Handwriting Animation from Google Fonts

**Date:** 2026-04-14
**Type:** Library / Resource bookmark

## 링크

- **Repo**: https://github.com/KurtGokhan/tegaki
- **Live demo / generator**: https://gkurt.com/tegaki/generator/
- **Author**: Kurt Gokhan
- **License**: MIT

## 한 줄

**Google Fonts 폰트를 그대로 가져와서 한 획씩 손글씨처럼 그려주는 애니메이션 라이브러리.**
수동 SVG path 작업이나 native 의존성 없음.

## 스택

- TypeScript (82%)
- 프레임워크 어댑터: React, Svelte, Vue, SolidJS, Astro, Web Components, Vanilla JS
- Bun 패키지 매니저

## 왜 흥미로운가

- **자동화** — 보통 손글씨 애니메이션은 SVG path를 직접 그리거나 외부 툴 필요. 이건 폰트 → 자동 변환.
- **프레임워크 무관** — 어댑터가 다 있어서 어디든 붙임.
- **Web only** — native 라이브러리 없음 → 가벼움.

## 잠재적 활용 아이디어

- 포트폴리오 hero에 손글씨 인트로
- 작품 타이틀 로딩 애니메이션
- 한글/한자 폰트로 시도 (CJK 지원 여부 확인 필요)
- shotloom 인트로 시퀀스 같은 곳

## 캐비어트 (확인 안 한 부분)

- CJK(한글/한자) 폰트 지원 여부 — 라틴 위주일 가능성
- 획순(stroke order) 정확도 — 폰트 path 순서에 의존
- 성능 (긴 텍스트, 모바일)

만약 한글 지원이 약하면 fork해서 기여하는 게 포트폴리오 거리가 됨.
