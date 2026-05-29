#!/usr/bin/env python3
"""State helpers for shotloom-verify-review (auto-mode + CI-notify reset).

Subcommands:
  state.py auto-start <pr> <rid>   — flip auto_mode=true; arms auto-resolve
  state.py auto-stop  <pr> <rid>   — flip auto_mode=false; back to passive watch
  state.py reset-ci   <pr> <rid>   — clear ci_red_notified; re-enables one alert
  state.py show       <pr> <rid>   — print current state JSON (debug)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


def repo_root_from_here() -> Path:
    for parent in Path(__file__).resolve().parents:
        if (parent / "SYSTEM.md").exists() and (parent / "agent/config/agent-hub.json").exists():
            return parent
    raise RuntimeError("unable to locate Knitten root from script path")


def knitten_root() -> Path:
    if "KNITTEN_ROOT" in os.environ:
        return Path(os.environ["KNITTEN_ROOT"]).resolve()
    return repo_root_from_here()


def helper_path(helper_id: str) -> Path:
    root = knitten_root()
    resolver = root / "agent/lib/resolve-helper-path.mjs"
    out = subprocess.run(
        ["node", str(resolver), "--root", str(root), helper_id],
        check=True, capture_output=True, text=True,
    )
    return Path(json.loads(out.stdout)["absolutePath"])


def pr_state_dir(pr: str) -> Path:
    resolver = helper_path("resolve-local-artifact-path")
    out = subprocess.run(
        ["node", str(resolver), "--root", str(knitten_root()), "--create", "shotloom", "pr", pr, "log"],
        check=True, capture_output=True, text=True,
    )
    return Path(json.loads(out.stdout)["absoluteCleanupPath"])


def state_path(pr: str, rid: str) -> Path:
    return pr_state_dir(pr) / f"review-{rid}.json"


def load(pr: str, rid: str) -> dict:
    p = state_path(pr, rid)
    if not p.exists():
        sys.exit(f"no state file at {p}; run verify first")
    return json.loads(p.read_text())


def save(pr: str, rid: str, state: dict) -> None:
    state_path(pr, rid).write_text(json.dumps(state, indent=2, ensure_ascii=False))


def main(argv: list[str]) -> int:
    if len(argv) < 4:
        print(__doc__, file=sys.stderr)
        return 2
    cmd, pr, rid = argv[1], argv[2], argv[3]
    state = load(pr, rid)

    if cmd == "auto-start":
        state["auto_mode"] = True
        # Initialize batch-mode tracking fields if absent.
        state.setdefault("ci_red_notified", False)
        state.setdefault("approved_at", None)
        save(pr, rid, state)
        print(f"✓ auto-mode ON for PR #{pr} review {rid}")
        print("  next watch tick will check: all 7 addressed + CI green → APPROVE")
    elif cmd == "auto-stop":
        state["auto_mode"] = False
        save(pr, rid, state)
        print(f"✓ auto-mode OFF for PR #{pr} review {rid} (passive watch only)")
    elif cmd == "reset-ci":
        state["ci_red_notified"] = False
        save(pr, rid, state)
        print(f"✓ CI notify flag reset for PR #{pr} review {rid} (one alert re-armed)")
    elif cmd == "show":
        print(json.dumps(state, indent=2, ensure_ascii=False))
    else:
        print(f"unknown subcommand: {cmd}", file=sys.stderr)
        print(__doc__, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
