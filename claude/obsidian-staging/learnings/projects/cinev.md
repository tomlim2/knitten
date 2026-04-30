---
title: "CINEV — Learnings"
tags:
  - learnings
  - cinev
  - gotcha
  - unreal-engine
  - commandlet
  - thumbnail
  - gaussian-splatting
  - niagara
  - rendering
date: 2026-04-29
source: claude
---

# CINEV — Learnings

Project wisdom vault for CINEV (character pipeline, UE editor tooling, splat workflows). Each entry captures one durable insight — the kind of thing that would cost an afternoon if the next person had to rediscover it.

> [!info] How to use this file
> - Append dated entries under the right category heading.
> - Categories: `convention` / `worked` / `failed` / `gotcha`.
> - Keep entries specific — symptom, root cause, fix, tripwire for next time.

---

## Convention

> Patterns discovered in the codebase. Include: definition → why it exists → gains → costs → notes on tools/experience.

---

## Worked

> Approaches that succeeded and are worth repeating. Include: goal → what worked → why it worked → when to reuse.

---

## Failed

> Approaches that didn't work. Include: what you tried → why it failed → what you learned → what to try instead.

---

## Gotcha

> Non-obvious issues that bite. Include: symptom → root cause → fix → tripwire for next time.

### 2026-04-29 — 가우시안 스플랫팅 캐릭터는 commandlet 썸네일에서 Niagara 경로 강제 필요

**Symptom.** 캐릭터 commandlet으로 썸네일을 캡처할 때, 가우시안 스플랫(Gaussian Splatting) 기반 캐릭터는 일반 SkeletalMesh / StaticMesh 캐릭터처럼 안 잡히고 빈 프레임(또는 배경만 있는 프레임)이 나온다.

**Root cause.** Gaussian Splatting은 메시가 아니라 **포인트 기반** 표현이다. UE 안에서 splat은 일반적으로 Niagara(파티클) 시스템으로 렌더된다. 그런데 commandlet 썸네일 파이프라인은 보통 SkeletalMesh / StaticMesh의 표준 렌더 경로를 가정하고 짜여 있어서, splat 캐릭터의 Niagara 컴포넌트는 캡처 카메라 / 렌더 패스에서 누락된다.

**Fix.** Splat 캐릭터를 commandlet 썸네일 환경에 등록할 때는 "이 캐릭터는 Niagara 시스템으로 렌더해야 한다"는 것을 등록 메타에 **명시**해야 한다. 썸네일 commandlet 쪽에서도 캐릭터 타입에 따라 렌더 경로를 분기 — splat이면 Niagara 컴포넌트를 기준으로 캡처 — 처리해야 한다.

**Tripwire for next time.** 새로운 캐릭터 표현(neural radiance field, mesh-less avatar 등)이 들어오면 commandlet 썸네일 파이프라인이 그 표현을 렌더할 수 있는지부터 확인할 것. "캐릭터가 등록은 됐는데 썸네일이 비어 있다" → 표현 방식과 렌더 경로 mismatch 의심.
