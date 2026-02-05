# Unreal Learnings

Last updated: 2026-02-05

---

## Conventions Discovered

Patterns specific to this codebase.

| Pattern | Why It Matters |
|---------|----------------|

---

## What Worked

Approaches worth repeating.

### MF_AdjustTODColor - Time-of-Day color correction via MaterialFunction
- **Date**: 2026-02-05
- **Context**: Materials need to react to time-of-day lighting changes dynamically, adjusting color response based on actual sky illuminance rather than static values.
- **Solution**: MaterialFunction at `/Game/Shader/MF_AdjustTODColor` with a simple interface (Color in → Color out). Internally samples `SkyAtmosphereLightIlluminance` + `WorldPosition`, then applies `Power` → `Clamp` → `Multiply` to modulate the input color. Three scalar parameters control the response curve: `SkyLightIluminanceBais` (bias offset), `SkyLightIluminance_Min` / `SkyLightIluminance_Max` (clamp range).
- **Why it worked**: Using `SkyAtmosphereLightIlluminance` gives real-time illuminance that tracks the sun/moon position automatically. The Power + Clamp chain normalizes the illuminance into a usable 0-1 range, and Multiply applies it as a color modulator. Exposing Min/Max/Bias as parameters lets each material tune its own TOD sensitivity without duplicating the node graph.

---

## What Failed

Approaches that seemed good but weren't.

---

## Gotchas

Non-obvious issues that cause problems.

| Issue | How to Handle |
|-------|---------------|
