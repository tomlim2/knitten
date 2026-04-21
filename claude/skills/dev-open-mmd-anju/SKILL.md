---
description: Open MMD Player (Three.js WebGPU viewer). Use when opening or launching the mmd-player-anju web app.
allowed-tools: Bash(npx:*), Bash(open:*), Bash(curl:*), Bash(lsof:*), Read
---

# dev-open-mmd-anju

Open the MikuMikuDance web player for PMX model viewing and VMD animation playback.

ES modules require an HTTP server (file:// blocked by CORS).

## Workflow

### Step 1: Resolve Path
- Read `~/.claude/private/caol-config/repo-paths.json` to get the `mmd-anju` repo path
- Player path: `<mmd-anju>/`

### Step 2: Start Server
- Check if port 3002 is already in use via `lsof -i :3002`
- If not running, start `npx serve -l 3002 .` in background from the player directory
- Wait briefly for server startup

### Step 3: Open Browser
- Open `http://localhost:3002` via `open` (macOS) or `start` (Windows)
- Confirm the webapp opened successfully

## Test Files

For debugging and testing, use these known files from `mmd-archive`:

- **PMX:** `pmx/槿廚屆돛―빻삽/빻삽3.0.pmx`
- **VMD:** `vmd/[MrPolarbear]/When the Moon Reaches Stars/When the Moon Reaches Stars/Mitsuru Solo.vmd`

## Standard Reference Models

`mmd-archive/pmx-standard/` — 리타겟팅 테스트용 표준 모델. 계열별 본셋 차이 분석 기준.

| 계열 | 폴더 | PMX 파일 | 본셋 특징 |
|------|------|----------|-----------|
| **あにまさ式** | `animasa/` | `èââπÉ~ÉN ÉCÉ~ÉeÅ[ÉVÉáÉìÇñ1É~ÉjÉ}ÉÄ2.pmx` 외 7개 | 최소 기본 본셋 (~30). 세미스탠다드 없음 |
| **TDA式** | `tda/` | `TdaéÆèââπÉ~ÉNÅEÉAÉyÉìÉh_Ver1.10.pmx` | 세미스탠다드 (上半身2, 腕捩, 手捩, グルーブ) |
| **YYB式** | `yyb/` | `YYBéÆèââπÉ~ÉNv1.02.pmx` | TDA 기반 + 보조 본 (肩P, 肩C) |
| **にがもん式** | `nigamon/` | `îéóÌóÏñ≤ver100.pmd` | 간결한 본셋. PMD 형식 |
| **つみだんご式** | `tsumidango/` | `É~ÉNÇ≥ÇÒ.pmx`, `É~ÉNÇ≥ÇÒ(ëfë´).pmx` | 고밀도 (325본, 肩P/C, 腕捩/手捩 전부) |
| **Project DIVA** | `diva/` | `snow miku 2019.pmx` | FTDX Snow Miku 2019. ダミー + DIVA 고유 본 (腰2, 腰3, 上半身1, 腰キャンセル) |
| **ミリシタ** | `millishita/` | `3. Haruka.../Haruka Amami Training ver.pmx` | 게임리핑. 영문 로마자 본 (KOSHI, KATA_L 등) |

**참고:** 파일명이 macOS ditto 추출로 인해 garbled ShiftJIS→UTF-8. 실제 내용은 정상.
