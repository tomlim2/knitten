---
description: "Collect and save macOS hardware specs (GPU, RAM, chip) to private/caol-config/hardware.json for capability checks."
allowed-tools: Bash(system_profiler:*), Bash(sw_vers:*), Write, Read
---

# system-save-hardware

Collect macOS hardware specs and save to `~/.claude/private/caol-config/hardware.json`.
---

## Workflow

### Step 1: Collect Hardware Info

Run these commands and parse the output:

```bash
system_profiler SPHardwareDataType SPDisplaysDataType SPStorageDataType
sw_vers
```

### Step 2: Ask for Name and Description

Before saving, ask the user for:

- **`name`** — Machine identifier slug (e.g., `macbook-pro-personal`, `office-workstation-01`)
- **`description`** — Short description of the machine's purpose (e.g., `"개인 MacBook Pro. 자택 개인 작업용."`)

If `hardware.json` already exists, show the current `name` and `description` as defaults.

### Step 3: Extract Fields

From the `system_profiler` and `sw_vers` output, extract:

| Field | Source | Example |
|-------|--------|---------|
| `name` | User input | `"macbook-pro-personal"` |
| `description` | User input | `"개인 MacBook Pro. 자택 개인 작업용."` |
| `model` | SPHardwareDataType → Model Name | `"MacBook Pro"` |
| `model_id` | SPHardwareDataType → Model Identifier | `"Mac14,6"` |
| `chip` | SPHardwareDataType → Chip | `"Apple M2 Max"` |
| `cores.total` | SPHardwareDataType → Total Number of Cores | `12` |
| `cores.performance` | SPHardwareDataType → Number of Performance Cores | `8` |
| `cores.efficiency` | SPHardwareDataType → Number of Efficiency Cores | `4` |
| `memory_gb` | SPHardwareDataType → Memory | `96` (parse number only) |
| `gpu` | SPDisplaysDataType → Chipset Model + Total Number of Cores | `"Apple M2 Max (38-core)"` |
| `os` | sw_vers → ProductName + ProductVersion + BuildVersion | `"macOS 15.5 (24F5061d)"` |
| `storage_gb` | SPStorageDataType → Size of largest volume | `1000` (parse to nearest GB) |
| `updated` | Current date | `"2026-02-18"` |

### Step 4: Preserve non-hardware fields (merge, not clobber)

Before writing, read the existing `~/.claude/private/caol-config/hardware.json` if it exists. Other skills may have added non-hardware machine-local keys (e.g. `aliases`, future policy blocks) that must survive a hardware refresh.

**Hardware-owned keys** (this skill rewrites these, overriding prior values):
`name`, `description`, `model`, `model_id`, `chip`, `cores`, `memory_gb`, `gpu`, `os`, `storage_gb`, `updated`

**Non-hardware keys** (preserve from existing file, do NOT drop):
Any key not in the hardware-owned list above. Currently known: `kind`, `aliases`. Future-extensible.

- `kind` is a manual classification (`work` / `home` / others) and is preserved across refreshes — it's never re-extracted from `system_profiler`. Set it via manual edit on first machine setup, or add a one-off prompt if missing.

Merge rule: start from the existing JSON object, overwrite the hardware-owned keys with the freshly extracted values, keep all other keys untouched. Then write back.

### Step 5: Save JSON

Write the merged JSON to `~/.claude/private/caol-config/hardware.json`:

```json
{
  "name": "macbook-pro-personal",
  "kind": "home",
  "description": "개인 MacBook Pro. 자택 개인 작업용.",
  "model": "MacBook Pro",
  "model_id": "Mac14,5",
  "chip": "Apple M2 Max",
  "cores": { "total": 12, "performance": 8, "efficiency": 4 },
  "memory_gb": 96,
  "gpu": "Apple M2 Max (38-core)",
  "os": "macOS 15.7.3 (24G419)",
  "storage_gb": 2000,
  "updated": "2026-02-18",
  "aliases": { "obsidian": "obsidian-home" }
}
```

The `aliases` block (and any other non-hardware keys) survives refresh because Step 4 merged instead of clobbering.

### Step 6: Confirm

Display the saved JSON content to the user.

---

## Output

- **File:** `~/.claude/private/caol-config/hardware.json`
- **Format:** Flat JSON, no subdirectories
- **Pattern:** Same level as `repo-paths.json`

---

## Usage by Other Skills

Other skills can read hardware info:

```markdown
Read `~/.claude/private/caol-config/hardware.json` to check machine specs.
```

Common use cases:
- Check GPU for local ML/LLM feasibility
- Verify RAM for memory-intensive tasks
- Identify chip architecture (Apple Silicon vs Intel)
