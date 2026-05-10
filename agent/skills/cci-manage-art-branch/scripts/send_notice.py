"""Send merge notice as threaded reply to art branch announcement."""

import argparse
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

CONFIG_DIR = Path.home() / ".claude" / "config"
PRIVATE_DIR = Path.home() / ".claude" / "private"

THREADS_FILE = PRIVATE_DIR / "slack_threads.json"
ENV_FILE = CONFIG_DIR / ".env"


def load_token():
    """Load SLACK_BOT_TOKEN from .env file."""
    if not ENV_FILE.exists():
        print(f"ERROR: {ENV_FILE} not found", file=sys.stderr)
        sys.exit(1)
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("SLACK_BOT_TOKEN="):
            return line.split("=", 1)[1]
    print("ERROR: SLACK_BOT_TOKEN not found in .env", file=sys.stderr)
    sys.exit(1)


def load_threads():
    """Load thread info from slack_threads.json."""
    if not THREADS_FILE.exists():
        print(f"ERROR: {THREADS_FILE} not found", file=sys.stderr)
        sys.exit(1)
    return json.loads(THREADS_FILE.read_text(encoding="utf-8"))


def list_branches(threads):
    """Print available branches with thread info."""
    if not threads:
        print("No branches found.")
        return
    print("Available branches:")
    for branch, info in threads.items():
        print(f"  {branch}  (channel: {info['channel']}, ts: {info['ts']})")


def send_message(token, channel, thread_ts, text):
    """Post a threaded reply with reply_broadcast via Slack API."""
    payload = json.dumps({
        "channel": channel,
        "thread_ts": thread_ts,
        "reply_broadcast": True,
        "text": text,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"ERROR: Request failed - {e}", file=sys.stderr)
        sys.exit(1)

    if not result.get("ok"):
        print(f"ERROR: Slack API error - {result.get('error')}", file=sys.stderr)
        sys.exit(1)

    print(f"OK: Message sent (ts: {result['ts']})")
    return result


def build_message(branch_name, merge_time):
    """Build merge notice message."""
    return (
        f"{merge_time}에 `{branch_name}` 브렌치를 디벨롭에 합칠 예정입니다.\n"
        f"\n"
        f"그 전에 아래 작업을 완료해 주세요.\n"
        f"1. 리다이렉터 픽스업 (Fix Up Redirectors)\n"
        f"2. 변경사항 커밋, 푸시\n"
        f"3. 파일 잠금이 있다면 해제 (언락)"
    )


def main():
    parser = argparse.ArgumentParser(description="Send merge notice to Slack thread")
    parser.add_argument("branch", nargs="?", help="Branch name (e.g. art/art-main-1.5.0-r3)")
    parser.add_argument("--time", required=False, help="Merge time reference (e.g. '내일 아침 8시 30분')")
    parser.add_argument("--list", action="store_true", help="List available branches")
    parser.add_argument("--dry-run", action="store_true", help="Preview message without sending")
    args = parser.parse_args()

    threads = load_threads()

    if args.list:
        list_branches(threads)
        return

    if not args.branch:
        parser.error("branch name is required (use --list to see available branches)")

    if args.branch not in threads:
        print(f"ERROR: No thread info for '{args.branch}'", file=sys.stderr)
        print("Available branches:", file=sys.stderr)
        for b in threads:
            print(f"  {b}", file=sys.stderr)
        sys.exit(1)

    if not args.time:
        parser.error("--time is required (e.g. --time '내일 아침 8시 30분')")

    thread_info = threads[args.branch]
    message = build_message(args.branch, args.time)

    if args.dry_run:
        print("=== DRY RUN ===")
        print(f"Channel: {thread_info['channel']}")
        print(f"Thread:  {thread_info['ts']}")
        print(f"Message:\n{message}")
        return

    token = load_token()
    send_message(token, thread_info["channel"], thread_info["ts"], message)


if __name__ == "__main__":
    main()
