# TA-154: Project Size Reduction Task

**Issue**: [TA-154](https://linear.app/cinamon-corp/issue/TA-154/프로젝트-용량-반갈죽-태스크)
**Period**: 2024-04-25 ~ 2024-05-08
**Status**: Done
**Owner**: Narr (Decision Maker), Deemo (Script Development)
**Branch**: `deemo/ta-154-프로젝트-용량-반갈죽-태스크`

---

## Summary

Task to reduce project texture size by half. Developed a script to cap texture resolution at 2048, batch-processing 22,848 files and achieving a total reduction of **over 250GB**.

---

## Results

| Item | Reduction | Date | Notes |
|------|-----------|------|-------|
| 1st Texture Optimization | ~200 GB | 05-03 | 22,848 files |
| Character Commit Folder | ~50 GB | 05-08 | Additional textures |
| DDC Cleanup | ~6.8 GB | - | Derived Data Cache |
| **Total** | **~250+ GB** | | |

Script testing showed compression from 949MB to 5MB (~99.5% reduction).

---

## Timeline

| Date | Milestone |
|------|-----------|
| 04-25 | Task created, engine load size reduction deferred in favor of disk size reduction |
| 04-26 | Script reimport complete, resolution cap set to 2048 |
| **05-03** | **22,848 textures merged to main** (announced in art_announce) |
| 05-07 | 200GB reduction confirmed, DDC/NAS discussion |
| **05-08** | **Additional 50GB character texture reduction, task complete** |

---

## Technical Decisions

### Resolution Cap

**Problem**: What resolution limit should be applied?

**Discussion**:
- 1024: Risk of visible quality degradation
- `Value > 1024: Value = Value/2`: 8K would only drop to 4K

**Decision**: `value > 2048 → value = 2048`

**Rationale**: Rendering already caps at 2048, so disk size should match.

### DDC Optimization

- DDC size: ~6.8GB
- Evaluated UE 5.4 cloud DDC feature
- Expected packaging speed improvement when DDC points to NAS in future

---

## Script Improvements

**Export Part**
- VT (Virtual Texture) check
- Build/load section added
- ORM case TAGA/PNG export

**Image Processing Part**
- Resolution cap 2048 applied ✓

---

## References

### Slack

| Channel | Thread | Topic |
|---------|--------|-------|
| cinev-ta | [p1714113404533039](https://cinamonhq.slack.com/archives/C020ZF7RGH5/p1714113404533039) | Script development, resolution decision |
| cinev-ta | [p1715148661659869](https://cinamonhq.slack.com/archives/C020ZF7RGH5/p1715148661659869) | Character texture 50GB reduction |
| art_announce | [p1714704480423839](https://cinamonhq.slack.com/archives/C05CS9N5E69/p1714704480423839) | 22,848 file merge announcement |
| cinnamon-only | [p1715059249164279](https://cinamonhq.slack.com/archives/C06SJBAU8BG/p1715059249164279) | 200GB reduction confirmed, DDC discussion |
| cinnamon-only | [p1715149604148949](https://cinamonhq.slack.com/archives/C06SJBAU8BG/p1715149604148949) | Completion |

### Related Tasks

- **TA-155**: Background-wide percent_triangles change
