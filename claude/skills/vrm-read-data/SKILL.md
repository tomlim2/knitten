---
description: "Read and inspect VRM 0.x file data (meta, spring bones, humanoid, materials)"
argument-hint: "<vrm_path> [--spring] [--humanoid] [--materials] [--colliders] [--meta]"
allowed-tools:
  - Read
  - Glob
  - Bash(node:*)
---

# vrm-read-data

Read a VRM 0.x file (.vrm / .glb) and display structured data — metadata, spring bone params, humanoid mapping, materials, and collider groups.

## Arguments

```
$ARGUMENTS
```

Parse the arguments:
- First non-flag argument: path to `.vrm` file
- `--spring`: show spring bone groups (stiffness, drag, gravity, hitRadius, chain info)
- `--humanoid`: show humanoid bone mapping
- `--materials`: show material list
- `--colliders`: show collider groups
- `--meta`: show VRM metadata (title, author, license)
- `--all`: show everything
- If no section flags provided, show **summary + spring** by default

If no arguments provided, show usage and stop:

```
Usage: /vrm-read-data <vrm_path> [--spring] [--humanoid] [--materials] [--colliders] [--meta] [--all]

Examples:
  /vrm-read-data model.vrm
  /vrm-read-data model.vrm --all
  /vrm-read-data model.vrm --humanoid --materials
```

## Execution

VRM files are GLB format. Read the binary, extract the JSON chunk, and parse the VRM extension. Use `node -e` inline script (no dependencies needed).

```bash
node -e "
const fs = require('fs');
const buf = fs.readFileSync('<vrm_path>');
const jsonLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));
const vrm = json.extensions && json.extensions.VRM;

// Output as JSON for parsing
console.log(JSON.stringify({
  nodeCount: (json.nodes || []).length,
  meshCount: (json.meshes || []).length,
  materialCount: (json.materials || []).length,
  textureCount: (json.textures || []).length,
  meta: vrm && vrm.meta,
  humanoid: vrm && vrm.humanoid,
  spring: vrm && vrm.secondaryAnimation,
  materialProperties: vrm && vrm.materialProperties,
  nodes: json.nodes,
  materials: json.materials,
}, null, 2));
"
```

Capture the JSON output and format each requested section.

## Report Sections

### Summary (always shown)

```markdown
## VRM: <filename>

| | |
|---|---|
| Title | <meta.title> |
| Author | <meta.author> |
| Nodes | N |
| Meshes | N |
| Materials | N |
| Textures | N |
| Humanoid bones | N mapped |
| Spring boneGroups | N |
| Spring colliderGroups | N |
```

### --meta

```markdown
### Metadata

| Field | Value |
|-------|-------|
| title | ... |
| author | ... |
| version | ... |
| contactInformation | ... |
| reference | ... |
| allowedUserName | ... |
| licenseName | ... |
```

### --spring (default)

Show a table of all boneGroups:

```markdown
### Spring Bones (N groups, M total bones)

| # | Bones | Stiff | Drag | Grav | HitR | Center | Colliders |
|---|-------|-------|------|------|------|--------|-----------|
| 0 | 2 | 4.0 | 0.8 | 0.0 | 0.01 | node11 | [0,1,5] |
| ... |
```

Also show chain length distribution:
```
Chain length distribution:
  len=1: 3 groups
  len=2: 4 groups
  len=4: 2 groups
  ...
```

For each boneGroup, resolve the `center` and `bones[]` indices to node names from `json.nodes[i].name`.

### --humanoid

```markdown
### Humanoid Bones

| VRM Bone | Node # | Node Name |
|----------|--------|-----------|
| hips | 2 | センター |
| spine | 5 | 上半身 |
| ... |
```

List all entries from `vrm.humanoid.humanBones`. Mark required bones (17 VRM required) vs optional.

### --colliders

```markdown
### Collider Groups (N groups)

| # | Node | Name | Colliders |
|---|------|------|-----------|
| 0 | 11 | 上半身 | 2 spheres |
| ... |
```

For each collider group, show the node name and number of colliders. Optionally list offset/radius for each sphere.

### --materials

```markdown
### Materials (N)

| # | Name | Shader |
|---|------|--------|
| 0 | body | VRM/MToon |
| ... |
```

Use `vrm.materialProperties` for shader info. Fall back to `json.materials` for names.

## Error Handling

- File not found: report path
- Not a valid GLB: check magic bytes (0x46546C67 = "glTF")
- No VRM extension: report "Not a VRM file (no VRM extension found)"
- Node index out of range: show index number instead of name
