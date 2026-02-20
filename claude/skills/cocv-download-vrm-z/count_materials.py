#!/usr/bin/env python3
"""
Count material prefixes and categorize by slot type in VRM files.

Usage:
    python count_materials.py <vrm_file_or_dir> [...]
    python count_materials.py <dir> --check
"""

import argparse
import json
import struct
import sys
from pathlib import Path

PREFIXES = ["std", "pbr", "anime", "toon"]
CATEGORIES = ["skin", "hair", "eye", "lens", "makeup"]
CAT_KEYWORDS = {
    "skin": ["skin"],
    "hair": ["hair"],
    "eye": ["eye", "lash"],
    "lens": ["lens"],
    "makeup": ["makeup", "make_up", "cheek", "blush"],
}


def parse_vrm_materials(path: Path) -> list[str]:
    with open(path, "rb") as f:
        f.read(4)  # magic
        f.read(4)  # version
        f.read(4)  # length
        chunk_len = struct.unpack("<I", f.read(4))[0]
        f.read(4)  # chunk type
        json_data = f.read(chunk_len)
    gltf = json.loads(json_data)
    return [m.get("name", "") for m in gltf.get("materials", [])]


def classify_prefix(name: str) -> str:
    lower = name.lower()
    for p in PREFIXES:
        if lower.startswith(p):
            return p
    return "other"


def categorize_slot(name: str) -> list[str]:
    lower = name.lower()
    matched = []
    for cat, keywords in CAT_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            matched.append(cat)
    return matched


def count_file(path: Path) -> dict:
    names = parse_vrm_materials(path)
    counts = {p: 0 for p in PREFIXES + ["other"]}
    for n in names:
        counts[classify_prefix(n)] += 1
    return {"total": len(names), "counts": counts, "names": names}


def check_file(path: Path) -> dict:
    names = parse_vrm_materials(path)
    cats = {c: [] for c in CATEGORIES}
    for i, name in enumerate(names):
        prefix = classify_prefix(name)
        tag = "std/pbr" if prefix in ("std", "pbr") else prefix
        for cat in categorize_slot(name):
            cats[cat].append((i, name, tag))

    results = {}
    for cat in CATEGORIES:
        if cats[cat]:
            results[cat] = all(t == "std/pbr" for _, _, t in cats[cat])
        else:
            results[cat] = None

    all_ok = all(v is True for v in results.values() if v is not None)
    return {"status": "OK" if all_ok else "CHECK", "cats": cats, "results": results}


def run_count(files: list[Path]):
    grand = {p: 0 for p in PREFIXES + ["other"]}
    grand_total = 0

    for f in files:
        result = count_file(f)
        total = result["total"]
        c = result["counts"]
        grand_total += total
        for k in grand:
            grand[k] += c[k]

        parts = [f"{k}={v}" for k, v in c.items() if v > 0]
        print(f"[{f.stem[:8]}] {total} materials: {', '.join(parts)}")

    if len(files) > 1:
        print(f"\n=== Total: {len(files)} files, {grand_total} materials ===")
        for k, v in grand.items():
            if v > 0:
                print(f"  {k}: {v}")


def run_check(files: list[Path]):
    for fp in files:
        r = check_file(fp)
        stem = fp.stem[:8]
        print(f"[{stem}] {r['status']}")
        for cat in CATEGORIES:
            items = r["cats"][cat]
            res = r["results"][cat]
            if res is None:
                label = "NONE"
            elif res:
                label = "OK"
            else:
                label = "CHECK"
            print(f"  {cat}({len(items)}): {label}")
            for i, n, t in items:
                print(f"    [{i}] ({t}) {n}")
        print()


def main():
    parser = argparse.ArgumentParser(description="Count VRM material prefixes")
    parser.add_argument("paths", nargs="+", help="VRM file(s) or directory")
    parser.add_argument("--check", action="store_true", help="Check skin/hair/eye/lens/makeup are std/pbr")
    args = parser.parse_args()

    files = []
    for p in args.paths:
        p = Path(p)
        if p.is_dir():
            files.extend(sorted(p.glob("*.vrm")))
        elif p.is_file():
            files.append(p)

    if not files:
        print("No VRM files found.", file=sys.stderr)
        sys.exit(1)

    if args.check:
        run_check(files)
    else:
        run_count(files)


if __name__ == "__main__":
    main()
