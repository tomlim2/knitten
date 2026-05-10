#!/usr/bin/env python3
"""Build catalog.json + refresh AUTO areas in INDEX/LOOKUP.

- Reads vault path from machine-paths.json (no hardcoded paths)
- Generates `agent/.vault-catalog.json` (deterministic note metadata)
- Updates `<!-- AUTO:START -->` ... `<!-- AUTO:END -->` blocks in:
    - notes/INDEX.md
    - work/INDEX.md
- Never touches content outside AUTO markers (human curation preserved)
- Does NOT write LOOKUP.md (treated as durable, manually maintained)

Usage:
  python3 ~/.claude/skills/obsidian-fix-format/build-catalog.py
"""
import json, re, subprocess
from pathlib import Path
from collections import defaultdict

VAULT = Path(subprocess.check_output(
    ['jq', '-r', '."obsidian"', f"{Path.home()}/.claude/private/caol-config/machine-paths.json"]
).decode().strip())

if not VAULT.is_dir():
    raise SystemExit(f"vault not found: {VAULT}")


def parse_fm(text: str) -> dict:
    if not text.startswith('---\n'):
        return {}
    end = text.find('\n---\n', 4)
    if end == -1:
        return {}
    fm = text[4:end]
    out = {}
    cur = None
    for line in fm.split('\n'):
        m = re.match(r'^([a-z_-]+):\s*(.*)$', line)
        if m:
            k, v = m.group(1), m.group(2).strip().strip('"\'')
            if v:
                out[k] = v
                cur = None
            else:
                out[k] = []
                cur = k
        elif cur and line.startswith('  - '):
            out[cur].append(line[4:].strip())
    return out


def build_catalog():
    notes = []
    by_top = defaultdict(list)
    by_type = defaultdict(int)
    for f in VAULT.rglob('*.md'):
        if any(p in f.parts for p in ('.trash', '.obsidian', 'attachments')):
            continue
        text = f.read_text(encoding='utf-8', errors='replace')
        fm = parse_fm(text)
        rel = str(f.relative_to(VAULT))
        top = rel.split('/', 1)[0] if '/' in rel else rel
        body_start = text.find('\n---\n', 4) + 5 if '\n---\n' in text else 0
        has_h1 = bool(re.search(r'^# ', text[body_start:body_start+1500], re.M))
        n = {
            'path': rel,
            'title': fm.get('title', f.stem),
            'type': fm.get('type', ''),
            'tags': fm.get('tags', []) if isinstance(fm.get('tags'), list) else [],
            'date': fm.get('date', ''),
            'has_h1': has_h1,
        }
        notes.append(n)
        by_top[top].append(rel)
        if n['type']:
            by_type[n['type']] += 1
    return {
        'vault': str(VAULT),
        'notes': notes,
        'by_top': dict(by_top),
        'by_type': dict(by_type),
        'stats': {
            'total': len(notes),
            'with_h1': sum(1 for n in notes if n['has_h1']),
            'with_type': sum(1 for n in notes if n['type']),
        },
    }


AUTO_RE = re.compile(r'(<!-- AUTO:START -->\n)(.*?)(\n<!-- AUTO:END -->)', re.S)


def update_auto_block(path: Path, new_inner: str) -> bool:
    """Replace content between AUTO markers; preserve everything else.

    Returns True if file changed, False if marker not found.
    """
    if not path.exists():
        return False
    text = path.read_text(encoding='utf-8')
    if 'AUTO:START' not in text:
        return False
    new_text = AUTO_RE.sub(lambda m: m.group(1) + new_inner + m.group(3), text, count=1)
    if new_text != text:
        path.write_text(new_text, encoding='utf-8')
        return True
    return False


def index_areas(catalog: dict, prefix: str, depth: int = 1) -> str:
    """Count notes per sub-area under the given path prefix.

    `depth` is how many path segments below `prefix` to group by.
    """
    areas = defaultdict(int)
    for n in catalog['notes']:
        if not n['path'].startswith(prefix + '/'):
            continue
        rest = n['path'][len(prefix) + 1:].split('/')
        if len(rest) > depth:
            areas[rest[depth - 1]] += 1
    lines = [f'- **{k}** ({v})' for k, v in sorted(areas.items(), key=lambda x: -x[1])]
    return '\n'.join(lines)


# (prefix, INDEX.md path relative to VAULT)
INDEX_TARGETS = [
    ('notes', 'notes/INDEX.md'),
    ('notes/work', 'notes/work/INDEX.md'),
]


def main():
    catalog = build_catalog()
    out = VAULT / 'claude' / '.vault-catalog.json'
    out.write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"catalog: {out}  (notes={catalog['stats']['total']})")

    for prefix, rel in INDEX_TARGETS:
        idx = VAULT / rel
        inner = index_areas(catalog, prefix)
        if update_auto_block(idx, inner):
            print(f"refreshed AUTO: {rel}")
        else:
            print(f"skip {rel} (missing AUTO markers or no change)")


if __name__ == '__main__':
    main()
