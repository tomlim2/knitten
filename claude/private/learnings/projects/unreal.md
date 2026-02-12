# Unreal Learnings

Last updated: 2026-02-12

---

## Conventions Discovered

Patterns specific to this codebase.

| Pattern | Why It Matters |
|---------|----------------|

### ESceneCaptureSource 파이프라인 캡처 시점
- **Date**: 2026-02-12
- **Context**: `FSceneViewFamily::SceneCaptureSource`에 설정하는 `ESceneCaptureSource` enum은 렌더링 파이프라인의 어느 시점에서 픽셀을 캡처할지 결정한다.
- **Pipeline 순서**:
  ```
  Geometry → Lighting → SceneColor(HDR)
                              ↓
                       Post-Processing (Bloom, AO, SSR...)
                              ↓
                         Tone Mapping (HDR → LDR)
                              ↓
                       Color Grading / Gamma
                              ↓
                       Final Color(LDR) ← 화면에 보이는 최종
  ```
- **주요 값**:
  - `SCS_SceneColorHDR` — PP 전, 라이팅만 적용된 날것의 HDR
  - `SCS_FinalColorHDR` — PP 후 + 톤매핑 전, Linear 색공간 HDR
  - `SCS_FinalToneCurveHDR` — 톤커브 적용 후, Linear sRGB (감마 변환 전)
  - `SCS_FinalColorLDR` — 모든 처리 완료, 화면에 보이는 그대로
- **규칙**: Editor 뷰포트와 동일한 결과가 필요하면 `SCS_FinalColorLDR` 사용. Commandlet처럼 temporal 히스토리 없는 환경에서 `SCS_FinalColorHDR`을 쓰면 톤매핑 경로 차이로 어두워질 수 있음.

---

## What Worked

Approaches worth repeating.

### Commandlet 썸네일 색상 매칭: SetEyeAdaptation(true) + SCS_FinalColorLDR
- **Date**: 2026-02-12
- **Context**: `CinevCreateUserCharacter` commandlet에서 캐릭터 썸네일을 찍을 때 에디터 뷰포트와 색/밝기가 달랐음. 애니메 렌더링은 PP+스텐실 기반.
- **Solution**: 두 가지 변경 조합으로 해결
  1. `ShowFlags.SetEyeAdaptation(true)` — 자동 노출 활성화. 워밍업 프레임 동안 노출 히스토리가 쌓이며 수렴.
  2. `SceneCaptureSource = SCS_FinalColorLDR` — 톤매핑+감마 변환까지 완료된 최종 픽셀을 캡처.
- **Why it worked**: Commandlet은 에디터와 달리 Eye Adaptation 히스토리가 없어서 `SetEyeAdaptation(false)` 시 고정 노출 1.0이 적용되어 너무 밝았음. `true`로 켜면 워밍업(3초/90프레임) 동안 노출이 씬에 맞게 수렴. `SCS_FinalColorLDR`은 화면에 보이는 그대로를 캡처하므로 에디터 뷰포트와 동일한 결과.

### MF_AdjustTODColor - Time-of-Day color correction via MaterialFunction
- **Date**: 2026-02-05
- **Context**: Materials need to react to time-of-day lighting changes dynamically, adjusting color response based on actual sky illuminance rather than static values.
- **Solution**: MaterialFunction at `/Game/Shader/MF_AdjustTODColor` with a simple interface (Color in → Color out). Internally samples `SkyAtmosphereLightIlluminance` + `WorldPosition`, then applies `Power` → `Clamp` → `Multiply` to modulate the input color. Three scalar parameters control the response curve: `SkyLightIluminanceBais` (bias offset), `SkyLightIluminance_Min` / `SkyLightIluminance_Max` (clamp range).
- **Why it worked**: Using `SkyAtmosphereLightIlluminance` gives real-time illuminance that tracks the sun/moon position automatically. The Power + Clamp chain normalizes the illuminance into a usable 0-1 range, and Multiply applies it as a color modulator. Exposing Min/Max/Bias as parameters lets each material tune its own TOD sensitivity without duplicating the node graph.

---

## What Failed

Approaches that seemed good but weren't.

### Commandlet 썸네일 색상 매칭 — 시도했으나 실패한 조합들
- **Date**: 2026-02-12
- **Context**: 에디터 뷰포트와 동일한 썸네일 색상을 commandlet에서 재현하려 여러 조합 테스트.
- **시도 1**: `SCS_FinalColorLDR` + `RTF_RGBA8_SRGB` (EyeAdaptation=false) → **너무 밝음**. LDR은 이미 sRGB 감마 적용된 데이터인데, SRGB 렌더타겟이 감마를 한번 더 적용(더블 감마). 게다가 고정 노출 1.0이 씬에 비해 과노출.
- **시도 2**: `SCS_FinalColorLDR` + `RTF_RGBA8` (EyeAdaptation=false) → **너무 어두움**. non-sRGB 타겟에 LDR 쓰기 시 감마 보정 부재.
- **시도 3**: `SCS_FinalColorLDR` + `RTF_RGBA8_SRGB` + `TargetGamma=1.0f` → **너무 어두움**. TargetGamma=1.0은 감마 변환을 건너뛰어서 LDR의 sRGB 데이터가 linear로 해석됨.
- **시도 4**: 소스 월드 직접 사용 (복사 대신) → **크래시**. `bIsWorldInitialized` assertion 실패. 이미 초기화된 월드에 `InitializeActorsForPlay` 재호출 불가.
- **교훈**: 감마 파이프라인은 캡처 소스와 렌더타겟 포맷의 조합으로 결정됨. Eye Adaptation 상태가 밝기에 결정적 영향. 한 변수만 바꾸면 안 되고 전체 파이프라인을 함께 고려해야 함.

---

## Gotchas

Non-obvious issues that cause problems.

| Issue | How to Handle |
|-------|---------------|
| Commandlet 썸네일이 에디터와 색/밝기 다름 | **해결**: `SetEyeAdaptation(true)` + `SCS_FinalColorLDR` 조합. EyeAdaptation=false는 고정노출 1.0(과노출), HDR은 톤매핑 전 캡처(어두움). 두 설정 모두 변경 필요. |
| `SCS_FinalColorLDR` + `RTF_RGBA8_SRGB` 더블 감마 | LDR 출력은 이미 sRGB 감마 적용됨. SRGB 렌더타겟이 감마를 한번 더 적용 → 너무 밝음. EyeAdaptation=true로 노출이 수렴되면 해결됨. |
| Commandlet Eye Adaptation 히스토리 없음 | Commandlet은 에디터와 달리 temporal 히스토리 축적 없음. `SetEyeAdaptation(true)` + 워밍업 프레임(기본 3초/90프레임)으로 노출 수렴 필요. |
