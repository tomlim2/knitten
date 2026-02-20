"""Send art branch announcement to Slack and save thread info."""

import argparse
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta
from pathlib import Path

CONFIG_DIR = Path.home() / ".claude" / "config"
PRIVATE_DIR = Path.home() / ".claude" / "private"

SLACK_CONFIG = CONFIG_DIR / "slack.json"
ENV_FILE = CONFIG_DIR / ".env"
THREADS_FILE = PRIVATE_DIR / "slack_threads.json"

KST = timezone(timedelta(hours=9))


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


def load_slack_config():
    """Load Slack config (art_channel, art_notice_message)."""
    if not SLACK_CONFIG.exists():
        print(f"ERROR: {SLACK_CONFIG} not found", file=sys.stderr)
        sys.exit(1)
    return json.loads(SLACK_CONFIG.read_text(encoding="utf-8"))


def send_message(token, channel, text):
    """Post a message to Slack channel via API."""
    payload = json.dumps({
        "channel": channel,
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


def save_thread_info(branch_name, channel, ts):
    """Save thread info to slack_threads.json for later thread replies."""
    threads = {}
    if THREADS_FILE.exists():
        threads = json.loads(THREADS_FILE.read_text(encoding="utf-8"))

    threads[branch_name] = {
        "channel": channel,
        "ts": ts,
        "created_at": datetime.now(KST).isoformat(),
    }

    THREADS_FILE.parent.mkdir(parents=True, exist_ok=True)
    THREADS_FILE.write_text(
        json.dumps(threads, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"OK: Thread info saved for '{branch_name}'")


def build_message(branch_name, template):
    """Build announcement message from template."""
    return template.replace("{branch_name}", branch_name)


def main():
    parser = argparse.ArgumentParser(description="Send art branch announcement to Slack")
    parser.add_argument("branch", help="Branch name (e.g. art/art-main-1.5.0-r4)")
    parser.add_argument("--dry-run", action="store_true", help="Preview message without sending")
    args = parser.parse_args()

    config = load_slack_config()
    channel = config["art_channel"]
    template = config.get("art_new_branch_message", "@here\n새 아트 브렌치가 준비되었습니다.\n`{branch_name}`\n\n아래 순서대로 진행해 주세요.\n1. 위 브렌치로 이동 (체크아웃)\n2. 다운로드 바이너리스")
    message = build_message(args.branch, template)

    if args.dry_run:
        print("=== DRY RUN ===")
        print(f"Channel: {channel}")
        print(f"Message:\n{message}")
        return

    token = load_token()
    result = send_message(token, channel, message)
    save_thread_info(args.branch, channel, result["ts"])


if __name__ == "__main__":
    main()
