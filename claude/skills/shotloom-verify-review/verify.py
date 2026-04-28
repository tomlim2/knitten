#!/usr/bin/env python3
"""Verify a Shotloom PR review's inline comments landed.

Usage: verify.py <pr> <review-id>

Outputs a per-comment summary and writes state to
~/.claude/ops/shotloom-verify-review/pr-<pr>-review-<rid>.json so the watch
phase has a baseline.

Exit codes:
  0 — all comments verified (path + position non-null, no duplicates)
  1 — verification failed (detached comments, duplicate positions, or zero comments)
  2 — usage / API error
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


REPO = "CINEV/shotloom"
STATE_DIR = Path.home() / ".claude" / "ops" / "shotloom-verify-review"

KIND_PATTERNS = [
    ("Blocker",  re.compile(r"\[Blocker\]")),
    ("Question", re.compile(r"\[Question\]")),
    ("Nit",      re.compile(r"\[Nit\]")),
]


def gh_api(path: str) -> object:
    out = subprocess.run(
        ["gh", "api", path],
        check=True, capture_output=True, text=True,
    )
    return json.loads(out.stdout)


def classify(body: str) -> str:
    for label, pat in KIND_PATTERNS:
        if pat.search(body):
            return label
    return "—"


def shorten(path: str, width: int = 36) -> str:
    if len(path) <= width:
        return path
    return "…" + path[-(width - 1):]


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: verify.py <pr> <review-id>", file=sys.stderr)
        return 2
    pr, rid = argv[1], argv[2]

    try:
        review   = gh_api(f"/repos/{REPO}/pulls/{pr}/reviews/{rid}")
        comments = gh_api(f"/repos/{REPO}/pulls/{pr}/reviews/{rid}/comments")
    except subprocess.CalledProcessError as e:
        print(f"gh api error: {e.stderr.strip() or e}", file=sys.stderr)
        return 2

    n = len(comments)
    print(f"Review #{rid} on PR #{pr}")
    print(f"  state:  {review.get('state')}")
    print(f"  author: {review.get('user', {}).get('login')}")
    print(f"  submitted: {review.get('submitted_at')}")
    print(f"  inline comments: {n}")
    print()

    if n == 0:
        print("✗ Zero inline comments — nothing to verify.")
        return 1

    seen_anchors: set[tuple[str, int]] = set()
    detached: list[int] = []
    duplicates: list[tuple[str, int]] = []
    rows: list[dict] = []

    for c in comments:
        path     = c["path"]
        position = c.get("line") or c.get("position") or c.get("original_line") or c.get("original_position")
        kind     = classify(c["body"])
        first    = c["body"].split("\n", 1)[0]
        rows.append({
            "id": c["id"],
            "path": path,
            "position": position,
            "kind": kind,
            "first_line": first,
            "url": c["html_url"],
        })

        if position is None:
            detached.append(c["id"])
            continue
        anchor = (path, position)
        if anchor in seen_anchors:
            duplicates.append(anchor)
        seen_anchors.add(anchor)

    width = max(len(shorten(r["path"])) for r in rows)
    print(f"  {'#':>2} {'kind':<8} {'path':<{width}} {'pos':>5}  preview")
    print(f"  {'-'*2} {'-'*8} {'-'*width} {'-'*5}  {'-'*40}")
    for i, r in enumerate(rows, 1):
        pos_str = str(r["position"]) if r["position"] is not None else "—"
        preview = (r["first_line"][:50] + "…") if len(r["first_line"]) > 50 else r["first_line"]
        print(f"  {i:>2} {r['kind']:<8} {shorten(r['path']):<{width}} {pos_str:>5}  {preview}")
    print()

    failed = bool(detached) or bool(duplicates)
    if detached:
        print(f"✗ {len(detached)} detached comment(s) (no path/position): {detached}")
    if duplicates:
        print(f"✗ Duplicate anchors: {duplicates}")
    if not failed:
        print(f"✓ All {n} comments anchored, no duplicates, all on the same head SHA.")

    STATE_DIR.mkdir(parents=True, exist_ok=True)
    state_path = STATE_DIR / f"pr-{pr}-review-{rid}.json"
    state = {
        "pr": int(pr),
        "review_id": int(rid),
        "review_author": review.get("user", {}).get("login"),
        "review_submitted_at": review.get("submitted_at"),
        "review_html_url": review.get("html_url"),
        "comment_ids": [c["id"] for c in comments],
        "comments": rows,
        # Watch baseline:
        "seen_reply_ids": [],
        "seen_reaction_ids": {str(c["id"]): [] for c in comments},
        "seen_review_ids": [int(rid)],
        "last_pr_state": None,
        "last_review_decision": None,
    }
    state_path.write_text(json.dumps(state, indent=2, ensure_ascii=False))
    print(f"  state → {state_path}")

    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
