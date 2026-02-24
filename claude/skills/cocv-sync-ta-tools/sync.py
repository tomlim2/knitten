"""
TA Tools Sync — Bidirectional file sync between anju and cinev-ta-tools.

Usage:
    python sync.py                          # dry-run preview
    python sync.py --execute                # apply changes
    python sync.py --direction anju         # anju → ta-tools only
    python sync.py --direction ta-tools     # ta-tools → anju only
"""

import argparse
import fnmatch
import json
import os
import shutil
import sys
from pathlib import Path
from datetime import datetime, timezone


def load_config():
    config_path = Path(__file__).parent / "config.json"
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_repo_paths():
    repo_paths_file = Path.home() / ".claude" / "private" / "repo-paths.json"
    with open(repo_paths_file, "r", encoding="utf-8") as f:
        return json.load(f)


def is_excluded(rel_path: str, exclude_patterns: list[str]) -> bool:
    name = os.path.basename(rel_path)
    parts = rel_path.replace("\\", "/").split("/")
    for pattern in exclude_patterns:
        if fnmatch.fnmatch(name, pattern):
            return True
        if any(fnmatch.fnmatch(part, pattern) for part in parts):
            return True
    return False


def collect_files(base_dir: Path, exclude_patterns: list[str]) -> dict[str, float]:
    """Collect files with their mtime, relative to base_dir."""
    files = {}
    if not base_dir.exists():
        return files
    for root, dirs, filenames in os.walk(base_dir):
        # Filter dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if not is_excluded(d, exclude_patterns)]
        for fname in filenames:
            full_path = Path(root) / fname
            rel_path = str(full_path.relative_to(base_dir)).replace("\\", "/")
            if not is_excluded(rel_path, exclude_patterns):
                files[rel_path] = full_path.stat().st_mtime
    return files


def format_time_diff(seconds: float) -> str:
    """Human-readable time difference."""
    abs_sec = abs(seconds)
    if abs_sec < 60:
        return f"{int(abs_sec)}s"
    elif abs_sec < 3600:
        return f"{int(abs_sec // 60)}m"
    elif abs_sec < 86400:
        return f"{abs_sec / 3600:.1f}h"
    else:
        return f"{abs_sec / 86400:.1f}d"


def compute_sync_actions(
    source_files: dict[str, float],
    target_files: dict[str, float],
    direction: str | None,
) -> list[dict]:
    """
    Compare files and decide sync actions.
    Returns list of {rel_path, action, direction_label, reason}.
    """
    all_paths = sorted(set(source_files.keys()) | set(target_files.keys()))
    actions = []

    for rel_path in all_paths:
        in_source = rel_path in source_files
        in_target = rel_path in target_files

        if in_source and in_target:
            diff = source_files[rel_path] - target_files[rel_path]
            if abs(diff) < 1.0:
                actions.append({
                    "rel_path": rel_path,
                    "action": "equal",
                    "direction_label": "",
                    "reason": "",
                })
            elif diff > 0:
                # source (anju) is newer
                if direction == "ta-tools":
                    actions.append({
                        "rel_path": rel_path,
                        "action": "skip",
                        "direction_label": "→",
                        "reason": f"anju is {format_time_diff(diff)} newer, skipped (direction=ta-tools)",
                    })
                else:
                    actions.append({
                        "rel_path": rel_path,
                        "action": "source_to_target",
                        "direction_label": "→",
                        "reason": f"anju is {format_time_diff(diff)} newer",
                    })
            else:
                # target (ta-tools) is newer
                if direction == "anju":
                    actions.append({
                        "rel_path": rel_path,
                        "action": "skip",
                        "direction_label": "←",
                        "reason": f"ta-tools is {format_time_diff(diff)} newer, skipped (direction=anju)",
                    })
                else:
                    actions.append({
                        "rel_path": rel_path,
                        "action": "target_to_source",
                        "direction_label": "←",
                        "reason": f"ta-tools is {format_time_diff(diff)} newer",
                    })
        elif in_source and not in_target:
            if direction == "ta-tools":
                actions.append({
                    "rel_path": rel_path,
                    "action": "skip",
                    "direction_label": "+→",
                    "reason": "only in anju, skipped (direction=ta-tools)",
                })
            else:
                actions.append({
                    "rel_path": rel_path,
                    "action": "source_to_target",
                    "direction_label": "+→",
                    "reason": "only in anju",
                })
        else:
            if direction == "anju":
                actions.append({
                    "rel_path": rel_path,
                    "action": "skip",
                    "direction_label": "+←",
                    "reason": "only in ta-tools, skipped (direction=anju)",
                })
            else:
                actions.append({
                    "rel_path": rel_path,
                    "action": "target_to_source",
                    "direction_label": "+←",
                    "reason": "only in ta-tools",
                })

    return actions


def print_report(mapping_label: str, actions: list[dict]):
    """Print sync report for one mapping."""
    print(f"\n{mapping_label}/")

    sync_count = 0
    for a in actions:
        if a["action"] == "equal":
            print(f"  = {a['rel_path']}")
        elif a["action"] == "skip":
            print(f"  ~ {a['rel_path']}  ({a['reason']})")
        else:
            arrow = "anju → ta-tools" if a["action"] == "source_to_target" else "ta-tools → anju"
            print(f"  {a['direction_label']} {a['rel_path']}    {arrow} ({a['reason']})")
            sync_count += 1

    return sync_count


def execute_sync(
    actions: list[dict],
    source_base: Path,
    target_base: Path,
):
    """Execute file copies."""
    for a in actions:
        if a["action"] == "source_to_target":
            src = source_base / a["rel_path"]
            dst = target_base / a["rel_path"]
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(src), str(dst))
        elif a["action"] == "target_to_source":
            src = target_base / a["rel_path"]
            dst = source_base / a["rel_path"]
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(str(src), str(dst))


def main():
    parser = argparse.ArgumentParser(description="TA Tools Sync")
    parser.add_argument("--execute", action="store_true", help="Apply changes (default: dry-run)")
    parser.add_argument("--direction", choices=["anju", "ta-tools"], help="One-way sync direction")
    args = parser.parse_args()

    config = load_config()
    repo_paths = load_repo_paths()

    source_key = config["repo_key_source"]
    target_key = config["repo_key_target"]

    if source_key not in repo_paths or target_key not in repo_paths:
        print(f"Error: repo keys '{source_key}' or '{target_key}' not found in repo-paths.json")
        sys.exit(1)

    source_root = Path(repo_paths[source_key]["path"])
    target_root = Path(repo_paths[target_key]["path"])
    exclude = config["exclude"]

    mode = "EXECUTE" if args.execute else "DRY-RUN"
    direction_label = f" (direction={args.direction})" if args.direction else ""
    print(f"TA Tools Sync — {mode}{direction_label}")
    print(f"{'─' * 50}")
    print(f"  anju:     {source_root}")
    print(f"  ta-tools: {target_root}")

    total_sync = 0

    for mapping in config["mappings"]:
        source_dir = source_root / mapping["source"]
        target_dir = target_root / mapping["target"]

        source_files = collect_files(source_dir, exclude)
        target_files = collect_files(target_dir, exclude)

        actions = compute_sync_actions(source_files, target_files, args.direction)
        sync_count = print_report(mapping["target"], actions)
        total_sync += sync_count

        if args.execute and sync_count > 0:
            execute_sync(actions, source_dir, target_dir)

    print(f"\n{'─' * 50}")
    if total_sync == 0:
        print("All files in sync.")
    elif args.execute:
        print(f"Synced {total_sync} file(s).")
    else:
        print(f"{total_sync} file(s) to sync. Run with --execute to apply.")


if __name__ == "__main__":
    main()
