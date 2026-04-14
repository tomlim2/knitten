"""Send merge result as threaded reply to art branch announcement.

Supports two modes:
  --broadcast: reply visible in channel (for completion notice)
  (default):   thread-only reply (for detailed MR summary)

Message input via --file or stdin (handles long Korean markdown).
"""

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


def send_message(token, channel, thread_ts, text, broadcast=False):
    """Post a threaded reply via Slack API.

    Args:
        broadcast: If True, reply is also visible in the channel.
                   If False, reply stays in thread only.
    """
    payload = json.dumps({
        "channel": channel,
        "thread_ts": thread_ts,
        "reply_broadcast": broadcast,
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

    mode = "broadcast" if broadcast else "thread-only"
    print(f"OK: Message sent [{mode}] (ts: {result['ts']})")
    return result


def read_message(file_path):
    """Read message text from file or stdin."""
    if file_path:
        p = Path(file_path)
        if not p.exists():
            print(f"ERROR: File not found: {file_path}", file=sys.stderr)
            sys.exit(1)
        return p.read_text(encoding="utf-8").strip()
    else:
        if sys.stdin.isatty():
            print("ERROR: No --file provided and stdin is a TTY. Pipe message or use --file.", file=sys.stderr)
            sys.exit(1)
        return sys.stdin.read().strip()


def main():
    parser = argparse.ArgumentParser(description="Send merge result to Slack thread")
    parser.add_argument("branch", nargs="?", help="Branch name (e.g. art/art-main-1.5.0-r3)")
    parser.add_argument("--file", dest="file_path", help="Path to message text file")
    parser.add_argument("--broadcast", action="store_true", help="Also show reply in channel")
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

    message = read_message(args.file_path)
    if not message:
        print("ERROR: Message is empty", file=sys.stderr)
        sys.exit(1)

    thread_info = threads[args.branch]
    mode = "broadcast" if args.broadcast else "thread-only"

    if args.dry_run:
        print("=== DRY RUN ===")
        print(f"Channel: {thread_info['channel']}")
        print(f"Thread:  {thread_info['ts']}")
        print(f"Mode:    {mode}")
        print(f"Message:\n{message}")
        return

    token = load_token()
    send_message(token, thread_info["channel"], thread_info["ts"], message, broadcast=args.broadcast)


if __name__ == "__main__":
    main()
