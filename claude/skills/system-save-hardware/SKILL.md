---
description: "Collect and save hardware specs to private/hardware.json. Use when other skills need to check local machine capabilities (GPU, RAM, chip model) for compatibility decisions."
allowed-tools: Bash(system_profiler:*), Bash(sw_vers:*), Write, Read
---

# system-save-hardware

Collect macOS hardware specs and save to `~/.claude/private/hardware.json`.
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

### Step 4: Save JSON

Write flat JSON to `~/.claude/private/hardware.json`:

```json
{
  "name": "macbook-pro-personal",
  "description": "개인 MacBook Pro. 자택 개인 작업용.",
  "model": "MacBook Pro",
  "model_id": "Mac14,5",
  "chip": "Apple M2 Max",
  "cores": { "total": 12, "performance": 8, "efficiency": 4 },
  "memory_gb": 96,
  "gpu": "Apple M2 Max (38-core)",
  "os": "macOS 15.7.3 (24G419)",
  "storage_gb": 2000,
  "updated": "2026-02-18"
}
```

### Step 5: Confirm

Display the saved JSON content to the user.

---

## Output

- **File:** `~/.claude/private/hardware.json`
- **Format:** Flat JSON, no subdirectories
- **Pattern:** Same level as `repo-paths.json`

---

## Usage by Other Skills

Other skills can read hardware info:

```markdown
Read `~/.claude/private/hardware.json` to check machine specs.
```

Common use cases:
- Check GPU for local ML/LLM feasibility
- Verify RAM for memory-intensive tasks
- Identify chip architecture (Apple Silicon vs Intel)
