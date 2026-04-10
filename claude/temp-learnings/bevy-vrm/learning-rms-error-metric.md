---
title: "RMS (Root Mean Square) 오차 지표"
tags: [bevy-vrm, retarget, scoring, math]
created: 2026-04-09
---

# RMS (Root Mean Square) 오차 지표

## 개념

리타겟 스코어링에서 뼈별 위치 오차의 평균 크기를 측정하는 지표.

## 계산

```
각 뼈 오차: 0.03m, 0.08m, 0.05m, 0.10m ...
→ 제곱:    0.0009, 0.0064, 0.0025, 0.01
→ 평균:    0.00495
→ 루트:    0.070m
```

단순 평균과 차이: 큰 오차에 더 민감함. 한 뼈가 심하게 틀어지면 RMS가 확 올라감.

## bevy-vrm 스코어링 기준

| Grade | Position RMS | Direction |
|-------|-------------|-----------|
| A | < 0.02m | < 5° |
| B | < 0.05m | < 15° |
| C | < 0.1m | < 30° |
| F | >= 0.1m | >= 30° |

## 현재 상태 (2026-04-09)

- Standing: 0.067m RMS, 2.2° direction → Grade C
- Running: 0.065m RMS, 0.4° direction → Grade C
- Direction은 이미 A급, position이 병목 (체형 비율 차이)

## Why RMS

- "전반적으로 얼마나 틀렸나"를 단일 숫자로 요약
- 큰 오차 하나가 숨겨지지 않음 (제곱 때문에 가중됨)
- per-bone grade와 함께 쓰면 어디가 문제인지도 특정 가능
