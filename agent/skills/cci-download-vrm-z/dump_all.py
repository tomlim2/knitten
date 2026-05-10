import json, struct, sys
from pathlib import Path

d = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
files = sorted(d.glob("*.vrm"))
for fp in files:
    with open(fp, "rb") as f:
        f.read(12)
        cl = struct.unpack("<I", f.read(4))[0]
        f.read(4)
        g = json.loads(f.read(cl))
    mats = g.get("materials", [])
    stem = fp.stem[:8]
    print(f"[{stem}] ({len(mats)} mats)")
    for i, m in enumerate(mats):
        name = m.get("name", "")
        lower = name.lower()
        prefix = lower.split("_")[0] if "_" in lower else ""
        tag = "std/pbr" if prefix in ("std", "pbr") else (prefix if prefix else "?")
        print(f"  [{i:2d}] ({tag:7s}) {name}")
    print()
