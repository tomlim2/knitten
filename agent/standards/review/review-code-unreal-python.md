---
status: accepted
domains: unreal
repo-keys: anju,mega-melange
languages: python
task-types: review
context-profile: unreal-engine
exclude-when: rust,web,obsidian
---
# Unreal Engine Python Coding Standards

**Version:** 0.1.0

## Changelog

- **0.1.0** - Initial release

## Core Review Checklist

### General Code Quality
- ✅ Code is clear and readable
- ✅ Functions and variables are well-named
- ✅ No duplicated code (DRY principle)
- ✅ Proper error handling and edge cases covered
- ✅ Good separation of concerns
- ✅ Comments explain "why", not "what"

### Security (Critical)
- 🔒 No exposed secrets, API keys, or credentials
- 🔒 Input validation implemented properly
- 🔒 No file path injection vulnerabilities
- 🔒 Sensitive data properly encrypted/protected
- 🔒 Asset paths properly validated and sanitized

### Python Specific

#### PEP 8 Style Guide
- **4 spaces** for indentation (no tabs) — PEP 8
- snake_case for functions and variables
- UPPER_CASE for constants
- Classes use PascalCase (but follow UE prefixes for UObjects)
- Maximum line length: 88-120 characters (Black formatter standard)
- Proper import organization (standard lib, third-party, unreal, local)
- Consistent use of single/double quotes (prefer double quotes for consistency)

#### Type Hints
- Type hints for function parameters and return values
- Use typing module (e.g. List, Dict, Optional, Union)
- Be aware: Unreal's type stubs return `→None` for almost everything (limitation)
- Document expected types in docstrings when type hints are insufficient

#### Docstrings
- All public functions/classes have docstrings
- Use Google or NumPy docstring style consistently
- Include: Description, Args, Returns, Raises, Example
- Document UObject types explicitly (e.g., "unreal.StaticMesh")

Example:
```python
def load_asset_by_path(asset_path: str) -> Optional[unreal.Object]:
    """
    Load an asset from the given asset path.

    Args:
        asset_path: Full asset path (e.g., "/Game/Materials/M_Base")

    Returns:
        Loaded asset object, or None if not found.

    Raises:
        ValueError: If asset_path is empty or invalid format.

    Example:
        >>> material = load_asset_by_path("/Game/Materials/M_Base")
        >>> if material:
        ...     print(material.get_name())
    """
    if not asset_path or not asset_path.startswith("/"):
        raise ValueError(f"Invalid asset path: {asset_path}")

    return unreal.EditorAssetLibrary.load_asset(asset_path)
```

#### Error Handling
- Use try/except for expected failures (asset not found, property access)
- Specific exceptions over broad `except Exception`
- Context managers (with statements) for resource management
- Always validate UObject is not None before accessing properties
- Log errors with unreal.log_error() or unreal.log_warning()

#### Import Organization
```python
# Standard library
import os
import sys
from typing import List, Optional

# Third-party packages
import numpy as np

# Unreal Engine
import unreal

# Local modules
from my_module import helper_function
```

### Unreal Engine Python Specific

#### ⚠️ Editor-Only Context (CRITICAL)
- Python is **ONLY** available in Unreal Editor
- Cannot run in PIE, Standalone Game, or cooked builds
- Use for: Asset pipelines, editor automation, batch operations
- Do NOT use for: Gameplay logic, runtime systems, player-facing features
- Always document "Editor-only script" in module docstring

#### Asset Management

##### Asset Loading
- Use `unreal.EditorAssetLibrary.load_asset()` for loading assets
- Use `unreal.load_asset()` for simpler cases
- Always check if loaded asset is None
- Prefer asset paths over object references for reliability

```python
# ✅ Good: Check for None
asset = unreal.EditorAssetLibrary.load_asset("/Game/Materials/M_Base")
if asset is None:
    unreal.log_error(f"Failed to load asset: /Game/Materials/M_Base")
    return

# ❌ Bad: No None check
asset = unreal.EditorAssetLibrary.load_asset("/Game/Materials/M_Base")
asset.get_name()  # Crashes if asset is None
```

##### Asset Saving
- Use `unreal.EditorAssetLibrary.save_asset()` for single assets
- Use `unreal.EditorAssetLibrary.save_loaded_asset()` for already loaded assets
- Use `unreal.EditorAssetLibrary.save_directory()` for batch saves
- Check return value (bool) to verify save success

##### Asset Paths
- **Asset Path**: `/Game/Materials/M_Base` (used for loading)
- **Object Path**: `/Game/Materials/M_Base.M_Base` (includes object name)
- Use `get_path_name()` to get full object path from UObject
- Use `unreal.Paths.get_base_filename()` to extract asset name

#### UObject Handling

##### None Checks (MANDATORY)
```python
# ✅ Good: Always check None
actor = unreal.EditorLevelLibrary.get_selected_level_actors()[0]
if actor is None:
    return

component = actor.get_component_by_class(unreal.StaticMeshComponent)
if component is None:
    return

mesh = component.static_mesh
if mesh is not None:
    print(mesh.get_name())
```

##### ObjectIterator Pattern
Use `unreal.ObjectIterator` to find all instances of a type:

```python
# Find all MaterialExpressions inside a MaterialFunction
def get_material_function_expressions(material_function: unreal.MaterialFunction) -> List:
    """
    Get all expressions in a MaterialFunction using ObjectIterator.

    This is necessary because MaterialFunction doesn't expose
    function_expressions as a Python property (unlike Material.expressions).
    """
    if material_function is None:
        return []

    expressions = []
    mf_path = material_function.get_path_name()

    for obj in unreal.ObjectIterator(unreal.MaterialExpression):
        # Filter by outer: only expressions owned by this MaterialFunction
        if obj.get_outer() and obj.get_outer().get_path_name() == mf_path:
            expressions.append(obj)

    return expressions
```

**Why use path comparison?**
- Name-based filtering (`obj.get_outer() == material_function`) can return duplicates due to CDO (Class Default Object)
- Path-based filtering eliminates CDO duplicates

##### UObject Inspection
- `get_outer()`: Get owning object
- `get_path_name()`: Get full object path
- `get_name()`: Get object name only
- `get_class()`: Get UClass type
- `get_editor_property(property_name)`: Get property value
- `set_editor_property(property_name, value)`: Set property value

#### Property Access

```python
# ✅ Good: Use get_editor_property/set_editor_property
material = unreal.load_asset("/Game/Materials/M_Base")
if material:
    blend_mode = material.get_editor_property("blend_mode")
    material.set_editor_property("two_sided", True)

# ⚠️ Caution: Direct attribute access may not work for all properties
# Some properties require get_editor_property()
```

**Property Name Convention:**
- UPROPERTY names in Python use snake_case (not PascalCase)
- Example: `blend_mode` (not `BlendMode`)
- Check Python API docs or use `dir(object)` to list properties

#### Common Pitfalls

##### 1. cast() is Type Hint Only
```python
# ❌ WRONG: cast() does nothing at runtime
from typing import cast
actor = cast(unreal.StaticMeshActor, some_actor)
actor.static_mesh_component  # Will fail if some_actor is not StaticMeshActor

# ✅ CORRECT: Check type explicitly
if isinstance(some_actor, unreal.StaticMeshActor):
    actor = some_actor
    mesh_component = actor.static_mesh_component
```

##### 2. Type Hints Limitations
Unreal's type stubs return `→None` for most methods. Use docstrings and manual verification:

```python
def process_asset(asset_path: str) -> Optional[unreal.Object]:
    """
    Returns: unreal.StaticMesh object (type hint shows None, but actually returns object)
    """
    return unreal.load_asset(asset_path)  # Actually returns object, not None
```

##### 3. Enum Values Must Start at 0
```python
# ✅ CORRECT: Enum starts at 0
class MyEnum(IntEnum):
    NONE = 0
    OPTION_A = 1
    OPTION_B = 2

# ❌ WRONG: Enum doesn't have 0 value
class MyEnum(IntEnum):
    OPTION_A = 1
    OPTION_B = 2
```

##### 4. Struct Inheritance
```python
# ✅ CORRECT: Inherit from unreal.StructBase
@unreal.ustruct()
class MyStruct(unreal.StructBase):
    pass

# ❌ WRONG: No inheritance
@unreal.ustruct()
class MyStruct:
    pass
```

##### 5. Transaction/Undo Support
When modifying assets/actors, wrap in transaction for undo support:

```python
# ✅ Good: Supports undo
with unreal.ScopedEditorTransaction("Rename Actors"):
    for actor in actors:
        actor.set_actor_label("NewName")

# ⚠️ Without transaction: Changes are permanent, no undo
for actor in actors:
    actor.set_actor_label("NewName")
```

#### Performance Considerations

##### Python is Slow
- Python is **significantly slower** than C++/Blueprint
- Acceptable for: Editor automation, batch processing, asset validation
- Avoid for: Real-time operations, frequent Tick(), hot paths

##### Optimize Asset Iteration
```python
# ✅ Good: Filter by class to reduce iteration
for asset in unreal.EditorAssetLibrary.list_assets("/Game/Materials", recursive=True):
    loaded = unreal.load_asset(asset)
    if isinstance(loaded, unreal.Material):
        process_material(loaded)

# ❌ Bad: Load every asset (slow)
for asset in unreal.EditorAssetLibrary.list_assets("/Game", recursive=True):
    loaded = unreal.load_asset(asset)
    process_material(loaded)
```

##### Cache Results
```python
# ✅ Good: Cache asset library reference
asset_lib = unreal.EditorAssetLibrary
for path in asset_paths:
    asset_lib.save_asset(path)

# ❌ Bad: Repeated module access
for path in asset_paths:
    unreal.EditorAssetLibrary.save_asset(path)
```

##### Use Bulk Operations
```python
# ✅ Good: Bulk save
unreal.EditorAssetLibrary.save_directory("/Game/Materials")

# ❌ Bad: Individual saves
for asset in assets:
    unreal.EditorAssetLibrary.save_asset(asset)
```

#### Editor Utility Libraries

**Common Libraries:**
- `unreal.EditorAssetLibrary`: Asset loading, saving, renaming, deletion
- `unreal.EditorLevelLibrary`: Level actor manipulation
- `unreal.EditorUtilityLibrary`: General editor utilities
- `unreal.MaterialEditingLibrary`: Material/MaterialFunction utilities (limited)
- `unreal.EditorStaticMeshLibrary`: Static mesh utilities

**Example:**
```python
import unreal

# Get selected actors
actors = unreal.EditorLevelLibrary.get_selected_level_actors()

# Get all assets in a folder
asset_paths = unreal.EditorAssetLibrary.list_assets("/Game/Materials", recursive=True)

# Rename asset
success = unreal.EditorAssetLibrary.rename_asset(
    "/Game/Materials/M_Old",
    "/Game/Materials/M_New"
)
```

### Testing & Documentation

#### Docstrings Required
- All public functions must have docstrings
- Include usage examples for complex functions
- Document return types explicitly (Unreal type stubs are incomplete)

#### Error Handling Test Cases
- Test with None inputs
- Test with invalid asset paths
- Test with missing properties
- Test with wrong types

#### Example Code in Comments
```python
def batch_rename_assets(prefix: str, asset_paths: List[str]) -> int:
    """
    Rename multiple assets with a new prefix.

    Args:
        prefix: New prefix to add (e.g., "SM_")
        asset_paths: List of asset paths to rename

    Returns:
        Number of successfully renamed assets.

    Example:
        >>> paths = ["/Game/Meshes/Cube", "/Game/Meshes/Sphere"]
        >>> count = batch_rename_assets("SM_", paths)
        >>> print(f"Renamed {count} assets")
    """
    renamed_count = 0

    for asset_path in asset_paths:
        old_name = unreal.Paths.get_base_filename(asset_path)
        new_name = f"{prefix}{old_name}"
        new_path = asset_path.replace(old_name, new_name)

        if unreal.EditorAssetLibrary.rename_asset(asset_path, new_path):
            renamed_count += 1
        else:
            unreal.log_warning(f"Failed to rename: {asset_path}")

    return renamed_count
```

### Code Review Checklist

**General:**
- [ ] All functions have docstrings with examples?
- [ ] Type hints used where possible?
- [ ] PEP 8 compliance (snake_case, line length, imports)?

**Unreal-Specific:**
- [ ] Editor-only context documented?
- [ ] All UObjects checked for None before use?
- [ ] Asset paths validated (start with `/Game/` or `/Engine/`)?
- [ ] Transactions used for undoable operations?
- [ ] ObjectIterator filtered by path (not name) to avoid CDO duplicates?

**Performance:**
- [ ] No unnecessary asset loading in loops?
- [ ] Bulk operations used where possible?
- [ ] Asset library references cached?

**Error Handling:**
- [ ] Try/except for expected failures (asset not found)?
- [ ] Errors logged with unreal.log_error()?
- [ ] Return values checked (save_asset returns bool)?

---

## Quick Reference

### Essential Unreal Python Patterns

```python
# Load and validate asset
asset = unreal.EditorAssetLibrary.load_asset("/Game/Materials/M_Base")
if asset is None:
    unreal.log_error("Asset not found")
    return

# Get selected actors
actors = unreal.EditorLevelLibrary.get_selected_level_actors()
for actor in actors:
    if actor is not None:
        print(actor.get_actor_label())

# Find all instances using ObjectIterator
for obj in unreal.ObjectIterator(unreal.StaticMesh):
    if obj.get_outer():  # Has an owner
        print(obj.get_path_name())

# Transaction for undo support
with unreal.ScopedEditorTransaction("My Operation"):
    actor.set_actor_label("NewName")

# Property access
value = object.get_editor_property("property_name")
object.set_editor_property("property_name", new_value)

# Batch asset operations
asset_paths = unreal.EditorAssetLibrary.list_assets("/Game/Meshes", recursive=True)
for path in asset_paths:
    asset = unreal.load_asset(path)
    if isinstance(asset, unreal.StaticMesh):
        process_mesh(asset)

unreal.EditorAssetLibrary.save_directory("/Game/Meshes")
```

---

*Python for Unreal Engine: Editor automation and asset pipelines only. Not for runtime gameplay.*
