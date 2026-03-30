# R-011: fbxcel Stack Overflow Analysis

## Root Cause

**Infinite loop in topological sort** — NOT fbxcel itself.

`compute_fbx_skeleton_from_parsed()` (lib.rs) had a recursive `visit()` for topo sort. The `visited.insert()` happened AFTER recursive call, so parent cycles caused infinite recursion:

```
visit("A") → A not in visited
  visit("B") → B not in visited
    visit("A") → A not in visited → INFINITE RECURSION
```

The facial FBX (FC_00078_F_SuddenFlutter_Anime.fbx) has 114 "bones" (many are blend shape geometry nodes parsed as Model objects) with at least one parent cycle in the hierarchy.

### Why body FBX worked

Body FBX (t2m_m_walk, rush, etc.) has ~84 bones with clean tree hierarchy (no cycles). The recursive visit terminates naturally.

### Why 32MB thread didn't help

The 32MB stack thread (headless.rs step 4) called `compute_fbx_skeleton()` which re-parsed the FBX + ran the same buggy recursive sort. The cycle caused infinite recursion regardless of stack size.

## Fixes Applied

### Fix 1: Iterative topo sort with cycle detection (lib.rs)

Replaced recursive `visit()` with iterative chain-walking:
- Walk up parent chain, collecting ancestors
- `in_chain` HashSet detects cycles (breaks on revisit)
- Add chain in reverse (parent-first) order
- O(n) time, O(n) space, no stack risk

### Fix 2: Single-pass FBX parse (headless.rs)

Replaced:
```
retarget() → parse FBX → mapping
compute_fbx_skeleton() → parse FBX AGAIN → skeleton  ← CRASH HERE
```
With:
```
retarget_with_skeleton() → parse FBX ONCE → skeleton + mapping
```

Eliminates double parse. `retarget_with_skeleton()` also skips skeleton computation when `has_bone_animation=false` (no bone tracks with >1 frame).

### Fix 3: Clippy cleanup (cinev_retarget crate)

20 warnings fixed: collapsible_if, assign_op_pattern, never_loop, etc. No logic changes.

## Before/After

| | Before | After |
|---|---|---|
| Facial FBX | ABORT (stack overflow) | OK — 1 bone, 6.7s, RQ output |
| Body FBX | OK | OK (no regression) |
| FBX parse count | 2× (retarget + skeleton) | 1× (retarget_with_skeleton) |
| Topo sort | Recursive, cycle-vulnerable | Iterative, cycle-safe |
| Tests | 20/20 pass | 20/20 pass |
| Clippy | 20 warnings | 0 warnings |

## fbxcel Usage Analysis

| Question | Answer |
|---|---|
| tree API (`load_tree`)? | NO — uses pull parser only |
| Pull parser recursive? | NO — `AnyParser::next_event()` is iterative |
| fbxcel caused overflow? | NO — our topo sort had the bug |
| Large array handling? | OK — fbxcel skips unread attrs via seek |

*Generated: 2026-03-30 by Agent #2*
