---
description: "Read and inspect PMX model data (bones, rigid bodies, joints, spring diagnostics)"
argument-hint: "<pmx_path> [--spring] [--bones] [--rigid] [--materials]"
allowed-tools:
  - Read
  - Glob
  - Bash(python:*)
  - Bash(cd:*)
---

# pmx-read-data

Read a PMX model file and display structured data about its contents — bones, rigid bodies, joints, materials, and spring bone diagnostics.

## Arguments

```
$ARGUMENTS
```

Parse the arguments:
- First non-flag argument: path to `.pmx` file
- `--spring`: show spring bone diagnostics (chain params, collider linkage)
- `--bones`: show full bone list with hierarchy
- `--rigid`: show rigid body details
- `--materials`: show material list
- If no section flags provided, show **summary + spring** by default

If no arguments provided, show usage and stop:

```
Usage: /pmx-read-data <pmx_path> [--spring] [--bones] [--rigid] [--materials]

  <pmx_path>    Path to a .pmx file
  --spring      Show spring bone diagnostics (default if no flags)
  --bones       Show full bone hierarchy
  --rigid       Show rigid body details
  --materials   Show material list

Examples:
  /pmx-read-data model.pmx
  /pmx-read-data model.pmx --bones --rigid
  /pmx-read-data model.pmx --spring
```

## Script Location

Read `~/.claude/private/repo-paths.json` to find the `anju` repo path, then use:
```
<anju_path>/python/pmx2vrm-convert-module/python/
```

Fall back to: `D:/vs/anju/python/pmx2vrm-convert-module/python/`

Required files in that directory:
- `pmx_reader.py` — binary PMX parser
- `spring_converter.py` — physics-to-spring converter
- `bone_mapping.py` — humanoid bone mapping

## Execution

Run inline Python that imports the reader modules. Always `cd` to the Python directory first so imports work.

### Summary (always shown)

```bash
cd "<python_dir>" && python -c "
from pmx_reader import read
from bone_mapping import PMX_TO_VRM_HUMANOID, VRM_REQUIRED_BONES, map_bones

data = read('<pmx_path>')
bones = data['bones']
rbs = data['rigid_bodies']
joints = data['joints_phys']
mats = data['materials']

print(f'Vertices: {len(data[\"positions\"])}')
print(f'Bones: {len(bones)}')
print(f'Materials: {len(mats)}')
print(f'Rigid bodies: {len(rbs)} (static={sum(1 for r in rbs if r[\"mode\"]==0)}, dynamic={sum(1 for r in rbs if r[\"mode\"]!=0)})')
print(f'Joints: {len(joints)}')

mapped = map_bones(bones)
found = [k for k in VRM_REQUIRED_BONES if k in mapped]
print(f'Humanoid mapping: {len(found)}/{len(VRM_REQUIRED_BONES)} required bones')
"
```

### --spring (spring bone diagnostics)

Run the existing diagnostic script:

```bash
cd "<python_dir>" && python tmp_spring_diag.py "<pmx_path>"
```

This outputs:
- Per-group table: stiffiness, gravity, drag, hitRadius, center bone, bone names
- Chain length distribution
- Collider groups summary
- Collider linkage per boneGroup

### --bones (bone hierarchy)

```bash
cd "<python_dir>" && python -c "
from pmx_reader import read
data = read('<pmx_path>')
bones = data['bones']
for i, b in enumerate(bones):
    par = b['parent_index']
    pos = b['position']
    indent = ''
    # Walk up to count depth (max 20)
    cur = par
    depth = 0
    while 0 <= cur < len(bones) and depth < 20:
        depth += 1
        cur = bones[cur]['parent_index']
    indent = '  ' * depth
    print(f'{i:>4} {indent}{b[\"name\"]}  (parent={par}, pos=[{pos[0]:.3f}, {pos[1]:.3f}, {pos[2]:.3f}])')
"
```

### --rigid (rigid bodies)

```bash
cd "<python_dir>" && python -c "
from pmx_reader import read
data = read('<pmx_path>')
bones = data['bones']
rbs = data['rigid_bodies']
modes = {0: 'static', 1: 'dynamic', 2: 'dyn+bone'}
shapes = {0: 'sphere', 1: 'box', 2: 'capsule'}
for i, rb in enumerate(rbs):
    bi = rb['bone_index']
    bname = bones[bi]['name'] if 0 <= bi < len(bones) else '?'
    mode = modes.get(rb['mode'], str(rb['mode']))
    shape = shapes.get(rb['shape_type'], str(rb['shape_type']))
    sz = rb['shape_size']
    print(f'{i:>4} [{mode:>8}] {shape:>7} size=[{sz[0]:.3f},{sz[1]:.3f},{sz[2]:.3f}] mass={rb[\"mass\"]:.2f} bone={bname}')
"
```

### --materials (material list)

```bash
cd "<python_dir>" && python -c "
from pmx_reader import read
data = read('<pmx_path>')
mats = data['materials']
offset = 0
for i, m in enumerate(mats):
    vc = m['vertex_count']
    fc = vc // 3
    tex = m.get('texture_index', -1)
    print(f'{i:>3} {m[\"name\"]:>30}  faces={fc:>5}  tex={tex:>3}  offset={offset}')
    offset += vc
"
```

## Report Format

Present results as structured markdown tables/code blocks. Group each section with a header:

```markdown
## PMX: <filename>

| | |
|---|---|
| Vertices | N |
| Bones | N |
| Materials | N |
| Rigid bodies | N (static: N, dynamic: N) |
| Joints | N |
| Humanoid | N/17 required |

### Spring Bones
[table output from tmp_spring_diag.py]

### Bones / Rigid Bodies / Materials
[if requested]
```

## Error Handling

- PMX file not found: report path
- Import error (numpy/PIL missing): suggest `pip install numpy Pillow`
- Script directory not found: suggest checking repo-paths.json
