---
title: "Character Pose Reference Sheet — 4×4 Grid"
tags:
  - reference
  - image-prompt
  - prompt-library
  - character-design
  - pose-sheet
  - gpt-image-2
  - seedance-2-0
date: 2026-04-27
source: manual
---

# Character Pose Reference Sheet — 4×4 Grid

3D-rendered character pose sheet 형식. 같은 캐릭터의 16 포즈를 4×4 셀 그리드로 나열, 각 셀에 번호 + 한글 제목 + 설명 + 모션 화살표. 게임 컨셉 아트 스타일.

- **출처:** [@Kashberg_0 — Twitter/X](https://x.com/Kashberg_0/status/2048437652517716466)
- **사용 도구:** GPT Image 2 + Seedance 2.0
- **용도:** 캐릭터 동작 시퀀스 reference sheet, 댄스/액션 콘티, 풋워크 가이드
- **예시 결과:** 안경 쓴 어린 여자 캐릭터의 16스텝 댄스 포즈 (원업 포즈 → 리듬 타기 → 부드러운 웨이브 → 풋워크 시작 → 힙합 시퀀스 → 웨이브 동작 → 수직별 동작 → 팝리즈 동작 → 풋워크 스텝)

---

## Prompt

```
3D-rendered character, clean reference sheet, white background, comic-style cell grid layout, technical diagram aesthetic

[LAYOUT] 4×4 grid layout, total of 16 panels, each panel separated by thin black border lines, cells numbered from 1 to 16, consistent panel size

[CHARACTER] @image1 (same character in all panels)

[PANEL STRUCTURE – per cell]
Top-left: bold number badge + Korean title text
Center: full-body character pose illustration
Bottom-left: Korean description text (3–4 lines)
Overlay: directional arrows indicating movement flow

[ARROWS / MOTION INDICATORS] Curved arrows, straight arrows, circular rotation indicators, placed around the character to show motion flow and direction

[RENDERING STYLE] High-detail 3D sculpted style, soft studio lighting, subtle shadows, no color, grayscale shading, clean linework, game concept art quality

[NEGATIVE] No background scenery, no color tones, no additional characters, no complex background
```

---

## 응용 메모

- `@image1` 자리에 reference 캐릭터 이미지 1장 붙이면 동일 캐릭터로 16포즈 생성
- 패널 수는 4×4 외에 3×3, 5×4 등으로 조정 가능 (LAYOUT 섹션만 수정)
- 한글 제목/설명 → 영어로 바꾸면 영문 시트
- 컬러 원하면 NEGATIVE의 `no color tones`, RENDERING STYLE의 `grayscale shading` 제거
- 정적 reference sheet → Seedance 2.0으로 동영상화 가능 (트윗 본문에서 언급)

---

## 활용 후보

- `dev-run-t2i` / `dev-run-i2i` 스킬에서 호출
- bevy-vrm / mmd-anju 캐릭터 콘티 출력
- VRM 캐릭터 신규 모션 컨셉 sheet
