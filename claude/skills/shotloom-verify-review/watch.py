#!/usr/bin/env python3
"""Single-tick watcher for shotloom-verify-review.

Two modes (driven by state["auto_mode"]):

PASSIVE (auto_mode=false, default):
  Surface NEW: lines for replies / reactions / new reviews / PR state changes.
  No mutations. Notifications only.

AUTO (auto_mode=true):
  Same passive surfacing PLUS, when ALL these hold simultaneously:
    1. Every one of our inline comments has at least one hon454 (or any non-me)
       reply in its thread.
    2. PR is open and not draft.
    3. CI rollup is GREEN.
    4. We haven't already approved this review (approved_at is null).
  Then: resolve all 7 review threads, submit a single APPROVE review with a
  summary, set approved_at, and emit `NEW: AUTO-APPROVED ...`.

  CI notify discipline: the FIRST time CI is non-green while in auto-mode,
  emit one `NEW: CI not green ...` line and set ci_red_notified=true. While
  the flag is set, stay quiet on every subsequent non-green CI tick — even
  if the rollup re-flips green→red after a push. The flag clears only via
  `state.py reset-ci`.

Usage: watch.py <pr> <review-id>
Exit: always 0 (transient gh failures logged to stderr but not fatal).
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path


REPO = "CINEV/shotloom"
STATE_DIR = Path.home() / ".claude" / "ops" / "shotloom-verify-review"
STALE_DAYS = 7


# ---------------- gh helpers ----------------

def gh_api(path: str) -> object | None:
    try:
        out = subprocess.run(
            ["gh", "api", path],
            check=True, capture_output=True, text=True,
        )
        return json.loads(out.stdout)
    except subprocess.CalledProcessError as e:
        print(f"# gh api {path} failed: {e.stderr.strip() or e}", file=sys.stderr)
        return None


def gh_graphql(query: str, variables: dict | None = None) -> object | None:
    args = ["gh", "api", "graphql", "-f", f"query={query}"]
    if variables:
        for k, v in variables.items():
            if isinstance(v, str):
                args += ["-f", f"{k}={v}"]
            else:
                args += ["-F", f"{k}={v}"]
    try:
        out = subprocess.run(args, check=True, capture_output=True, text=True)
        return json.loads(out.stdout)
    except subprocess.CalledProcessError as e:
        print(f"# gh graphql failed: {e.stderr.strip() or e}", file=sys.stderr)
        return None


def me() -> str | None:
    out = gh_api("user")
    return out.get("login") if isinstance(out, dict) else None


def parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


# ---------------- passive surfacing ----------------

def surface_passive(state: dict, me_login: str) -> tuple[list[str], dict[int, str]]:
    """Returns (NEW: lines for replies/reactions/new reviews, mapping our_cid -> latest_reply_body)."""
    out: list[str] = []
    pr = state["pr"]
    our_ids = set(state["comment_ids"])
    seen_replies = set(state["seen_reply_ids"])
    seen_reactions = {int(k): set(v) for k, v in state["seen_reaction_ids"].items()}
    seen_reviews = set(state["seen_review_ids"])
    latest_reply_per_comment: dict[int, str] = {}

    # 1+2 combined: inline comments page lists both top-level and replies.
    pr_comments = gh_api(f"/repos/{REPO}/pulls/{pr}/comments?per_page=100")
    if isinstance(pr_comments, list):
        for c in pr_comments:
            cid = c["id"]
            author = c.get("user", {}).get("login")
            in_reply = c.get("in_reply_to_id")
            if author == me_login:
                continue
            if in_reply in our_ids:
                latest_reply_per_comment[in_reply] = c["body"]
                if cid not in seen_replies:
                    seen_replies.add(cid)
                    first = c["body"].split("\n", 1)[0][:80]
                    out.append(f"NEW: reply by {author} on comment {in_reply} — {first}  {c['html_url']}")

    # 3. Reactions (only on top-level inline comments, not replies).
    for cid in our_ids:
        reactions = gh_api(f"/repos/{REPO}/pulls/comments/{cid}/reactions")
        if not isinstance(reactions, list):
            continue
        for r in reactions:
            rid_ = r["id"]
            if rid_ in seen_reactions.get(cid, set()):
                continue
            author = r.get("user", {}).get("login")
            seen_reactions.setdefault(cid, set()).add(rid_)
            if author == me_login:
                continue
            content = r.get("content")
            out.append(
                f"NEW: reaction {content!r} by {author} on comment {cid}  "
                f"https://github.com/{REPO}/pull/{pr}#discussion_r{cid}"
            )

    # 4. New reviews by others.
    reviews = gh_api(f"/repos/{REPO}/pulls/{pr}/reviews")
    if isinstance(reviews, list):
        for r in reviews:
            r_id = r["id"]
            if r_id in seen_reviews:
                continue
            seen_reviews.add(r_id)
            author = r.get("user", {}).get("login")
            if author == me_login:
                continue
            r_state = r.get("state")
            body = (r.get("body") or "").split("\n", 1)[0][:80]
            out.append(f"NEW: review by {author} ({r_state}) — {body}  {r.get('html_url')}")

    # Persist passive state.
    state["seen_reply_ids"] = sorted(seen_replies)
    state["seen_reaction_ids"] = {str(k): sorted(v) for k, v in seen_reactions.items()}
    state["seen_review_ids"] = sorted(seen_reviews)

    return out, latest_reply_per_comment


# ---------------- auto-mode actions ----------------

def fetch_pr_meta(pr: int) -> dict | None:
    return gh_api(f"/repos/{REPO}/pulls/{pr}")


def ci_rollup(pr: int, head_sha: str) -> tuple[str, int, int]:
    """Returns (state, total_runs, failing_count). state is one of GREEN, PENDING, RED, UNKNOWN."""
    runs = gh_api(f"/repos/{REPO}/commits/{head_sha}/check-runs?per_page=100")
    if not isinstance(runs, dict):
        return "UNKNOWN", 0, 0
    items = runs.get("check_runs", [])
    if not items:
        return "UNKNOWN", 0, 0
    failing = sum(1 for r in items
                  if r.get("status") == "completed"
                  and r.get("conclusion") in {"failure", "timed_out", "cancelled"})
    pending = sum(1 for r in items if r.get("status") != "completed")
    if failing:
        return "RED", len(items), failing
    if pending:
        return "PENDING", len(items), 0
    return "GREEN", len(items), 0


def fetch_review_threads(pr: int) -> list[dict]:
    """Returns list of {threadId, isResolved, comment_db_ids: [int]}."""
    query = """
    query($owner:String!,$name:String!,$pr:Int!,$cursor:String) {
      repository(owner:$owner, name:$name) {
        pullRequest(number:$pr) {
          reviewThreads(first:100, after:$cursor) {
            pageInfo { endCursor hasNextPage }
            nodes {
              id
              isResolved
              comments(first:100) { nodes { databaseId } }
            }
          }
        }
      }
    }"""
    out: list[dict] = []
    cursor = None
    owner, name = REPO.split("/")
    while True:
        variables = {"owner": owner, "name": name, "pr": pr}
        if cursor is not None:
            variables["cursor"] = cursor
        data = gh_graphql(query, variables)
        if not isinstance(data, dict):
            return out
        rt = (data.get("data", {}) or {}).get("repository", {}).get("pullRequest", {}).get("reviewThreads", {})
        for n in rt.get("nodes", []) or []:
            out.append({
                "thread_id": n["id"],
                "is_resolved": n["isResolved"],
                "comment_db_ids": [c["databaseId"] for c in n.get("comments", {}).get("nodes", [])],
            })
        page = rt.get("pageInfo", {})
        if not page.get("hasNextPage"):
            return out
        cursor = page.get("endCursor")


def resolve_thread(thread_id: str) -> bool:
    query = "mutation($id:ID!){ resolveReviewThread(input:{threadId:$id}){ thread { isResolved } } }"
    data = gh_graphql(query, {"id": thread_id})
    if not isinstance(data, dict):
        return False
    return bool(data.get("data", {}).get("resolveReviewThread"))


def submit_approve_review(pr: int, body: str) -> dict | None:
    payload = {"event": "APPROVE", "body": body}
    args = ["gh", "api", "-X", "POST", f"/repos/{REPO}/pulls/{pr}/reviews",
            "--input", "-"]
    try:
        out = subprocess.run(args, input=json.dumps(payload), check=True,
                             capture_output=True, text=True)
        return json.loads(out.stdout)
    except subprocess.CalledProcessError as e:
        print(f"# submit APPROVE failed: {e.stderr.strip() or e}", file=sys.stderr)
        return None


def kind_label(body: str) -> str:
    for label in ("Blocker", "Question", "Nit"):
        if f"[{label}]" in body:
            return label
    return "—"


def short(text: str, n: int) -> str:
    text = text.replace("\n", " ").strip()
    return text if len(text) <= n else text[:n - 1] + "…"


def build_summary(state: dict, replies: dict[int, str],
                  ci_total: int, head_sha: str) -> str:
    lines = [f"PR #{state['pr']} auto-review 완료:"]
    for i, c in enumerate(state["comments"], 1):
        cid = c["id"]
        kind = kind_label(c.get("first_line", ""))
        reply = replies.get(cid, "(no reply)")
        lines.append(f"  ✓ {kind} #{i} — {short(reply, 90)}")
    lines.append(f"  CI: {ci_total}/{ci_total} green @ {head_sha[:7]}")
    lines.append("")
    lines.append(
        "All blockers resolved (per author replies); questions and nits acknowledged. "
        "Approving per `code-review-guideline.md` §2 — \"Approve when all blocking issues are resolved\"."
    )
    return "\n".join(lines)


def auto_process(state: dict, me_login: str, latest_replies: dict[int, str]) -> list[str]:
    out: list[str] = []
    if not state.get("auto_mode"):
        return out
    if state.get("approved_at"):
        return out  # already approved this round

    pr = state["pr"]
    rid = state["review_id"]
    our_ids = state["comment_ids"]

    # 1. All 7 addressed?
    addressed = all(cid in latest_replies for cid in our_ids)
    if not addressed:
        return out  # batch mode: silent until all replied

    # 2. PR open + non-draft.
    pr_meta = fetch_pr_meta(pr)
    if not isinstance(pr_meta, dict):
        return out
    if pr_meta.get("state") != "open" or pr_meta.get("draft"):
        return out  # silent — wrong state for approval
    head_sha = pr_meta.get("head", {}).get("sha", "")

    # 3. CI rollup.
    ci_state, ci_total, failing = ci_rollup(pr, head_sha)
    if ci_state != "GREEN":
        if not state.get("ci_red_notified"):
            state["ci_red_notified"] = True
            out.append(
                f"NEW: PR #{pr} CI not green (state={ci_state}, "
                f"{failing}/{ci_total} failing). Auto-approve paused. "
                f"Use `state.py reset-ci {pr} {rid}` to re-arm one alert."
            )
        return out  # silent on subsequent ticks

    # 4. Map our comment IDs -> thread IDs.
    threads = fetch_review_threads(pr)
    our_set = set(our_ids)
    target_threads = []
    for t in threads:
        if any(cid in our_set for cid in t["comment_db_ids"]):
            target_threads.append(t)

    if len(target_threads) != len(our_ids):
        out.append(
            f"NEW: thread mapping incomplete ({len(target_threads)}/{len(our_ids)}). "
            f"Skipping auto-approve. Manual intervention needed."
        )
        return out

    # 5. Resolve unresolved threads.
    resolved_now = 0
    for t in target_threads:
        if not t["is_resolved"]:
            if resolve_thread(t["thread_id"]):
                resolved_now += 1

    # 6. Submit APPROVE review.
    body = build_summary(state, latest_replies, ci_total, head_sha)
    review = submit_approve_review(pr, body)
    if not review:
        out.append(f"NEW: APPROVE submission failed for PR #{pr} — see stderr")
        return out

    state["approved_at"] = review.get("submitted_at") or datetime.now(timezone.utc).isoformat()
    out.append(
        f"NEW: AUTO-APPROVED PR #{pr} ({resolved_now} threads resolved, "
        f"summary review {review.get('id')}) {review.get('html_url')}"
    )
    return out


# ---------------- main ----------------

def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print("usage: watch.py <pr> <review-id>", file=sys.stderr)
        return 2
    pr, rid = argv[1], argv[2]
    state_path = STATE_DIR / f"pr-{pr}-review-{rid}.json"
    if not state_path.exists():
        print(f"DONE: no state file at {state_path}; run verify first")
        return 0

    state = json.loads(state_path.read_text())
    me_login = me() or state.get("review_author")
    submitted_at = parse_iso(state["review_submitted_at"])

    # PR-state tick (also works for closed/merged stop).
    pr_view = fetch_pr_meta(int(pr))
    if isinstance(pr_view, dict):
        pr_state = pr_view.get("state")
        merged = pr_view.get("merged_at") is not None
        if state.get("last_pr_state") and pr_state != state["last_pr_state"]:
            print(f"NEW: PR state {state['last_pr_state']} → {pr_state}"
                  f"{' (merged)' if merged else ''}  {pr_view.get('html_url')}")
        state["last_pr_state"] = pr_state
        if pr_state == "closed":
            state_path.write_text(json.dumps(state, indent=2, ensure_ascii=False))
            print(f"DONE: PR #{pr} closed (merged={merged})")
            return 0

    # Passive surfacing.
    passive_lines, latest_replies = surface_passive(state, me_login)
    for line in passive_lines:
        print(line)

    # Auto-mode actions.
    auto_lines = auto_process(state, me_login, latest_replies)
    for line in auto_lines:
        print(line)

    state_path.write_text(json.dumps(state, indent=2, ensure_ascii=False))

    # Stale stop.
    age = datetime.now(timezone.utc) - submitted_at
    if age > timedelta(days=STALE_DAYS):
        print(f"DONE: review {rid} is {age.days}d old — auto-stop")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
