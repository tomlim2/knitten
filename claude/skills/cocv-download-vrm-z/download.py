#!/usr/bin/env python3
"""
Download VRM files from CINEV cloud storage.

Usage:
    python download.py <characterId> [characterId2 ...] [-o OUTPUT_DIR]
"""

import argparse
import sys
import urllib.request
import urllib.error
from pathlib import Path

BASE_URL = "https://storage-cinev-shorts.cinev.com/cinev/characters/vrm"


def download_vrm(character_id: str, output_dir: Path) -> bool:
    url = f"{BASE_URL}/{character_id}/{character_id}.vrm"
    output_dir.mkdir(parents=True, exist_ok=True)
    dest = output_dir / f"{character_id}.vrm"

    print(f"[{character_id}] Downloading: {url}")
    try:
        urllib.request.urlretrieve(url, str(dest))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"[{character_id}] FAILED - not found (404)", file=sys.stderr)
        else:
            print(f"[{character_id}] FAILED - HTTP {e.code} {e.reason}", file=sys.stderr)
        return False
    except urllib.error.URLError as e:
        print(f"[{character_id}] FAILED - {e.reason}", file=sys.stderr)
        return False

    size_mb = dest.stat().st_size / (1024 * 1024)
    print(f"[{character_id}] Saved: {dest} ({size_mb:.1f} MB)")
    return True


def main():
    parser = argparse.ArgumentParser(description="Download VRM from CINEV storage")
    parser.add_argument("character_ids", nargs="+", help="Character ID(s) (e.g. anju_v3 bleue_v1)")
    parser.add_argument("-o", "--output", default=".", help="Output directory (default: current)")

    args = parser.parse_args()
    output_dir = Path(args.output)

    total = len(args.character_ids)
    success = 0
    failed = []

    for i, cid in enumerate(args.character_ids, 1):
        print(f"\n--- [{i}/{total}] ---")
        if download_vrm(cid, output_dir):
            success += 1
        else:
            failed.append(cid)

    print(f"\n=== Done: {success}/{total} succeeded ===")
    if failed:
        print(f"Failed: {', '.join(failed)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
