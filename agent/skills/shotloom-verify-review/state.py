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
import sys
from pathlib import Path


STATE_DIR = Path.home() / ".claude" / "ops" / "shotloom-verify-review"


def state_path(pr: str, rid: str) -> Path:
    return STATE_DIR / f"pr-{pr}-review-{rid}.json"


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
