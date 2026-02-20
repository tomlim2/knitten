# cocv-download-vrm-z

**Version:** 0.1.0

Download VRM file from CINEV cloud storage by character ID.

---

## Changelog

- **0.1.0** - Initial release

---

## Purpose

CINEV 캐릭터 VRM 파일을 클라우드 스토리지에서 다운로드합니다.

URL 패턴: `https://storage-cinev-shorts.cinev.com/cinev/characters/vrm/{CharacterId}/{CharacterId}.vrm`

---

## Usage

```
/cocv-download-vrm-z <characterId>
/cocv-download-vrm-z anju_v3
/cocv-download-vrm-z anju_v3 -o ./output
```

---

## Files

- `download.py` - VRM 다운로드 스크립트
- `count_materials.py` - VRM 머티리얼 접두어 카운트 및 슬롯 검증

### count_materials.py

**카운트 모드** (기본): 접두어별 개수 집계
```
python count_materials.py <vrm_file_or_dir>
```

**체크 모드** (`--check`): skin/hair/eye/lens/makeup 슬롯이 std/pbr인지 검증
```
python count_materials.py <vrm_dir> --check
```
