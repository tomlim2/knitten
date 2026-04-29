---
description: "Download VRM from CINEV cloud storage by character ID — for analysis or material inspection."
---

# cci-download-vrm-z

Download VRM file from CINEV cloud storage by character ID.

---

## Purpose

Download character VRM files from CINEV cloud storage for local analysis or material inspection.

URL pattern: `https://storage-cinev-shorts.cinev.com/cinev/characters/vrm/{CharacterId}/{CharacterId}.vrm`

---

## Usage

```
/cci-download-vrm-z <characterId>
/cci-download-vrm-z anju_v3
/cci-download-vrm-z anju_v3 -o ./output
```

---

## Files

- `download.py` - VRM download script
- `count_materials.py` - VRM material prefix count and slot validation
- `dump_all.py` - Bulk VRM data dump script

### count_materials.py

**Count mode** (default): Aggregate counts by prefix
```
python count_materials.py <vrm_file_or_dir>
```

**Check mode** (`--check`): Validate that skin/hair/eye/lens/makeup slots are std/pbr
```
python count_materials.py <vrm_dir> --check
```
