#!/usr/bin/env python3
"""Send merge notification as a thread reply to art branch announcement."""

import os
import sys
import json
from pathlib import Path

# Load environment variables from shared .env file
def load_env():
    env_path = Path(__file__).parent.parent.parent / "config" / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()


def load_slack_config():
    """Load shared Slack config."""
    config_path = Path(__file__).parent.parent.parent / "config" / "slack.json"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_thread_info(branch_name: str) -> dict | None:
    """Load thread info for a branch."""
    threads_path = Path(__file__).parent.parent.parent / "private" / "slack_threads.json"
    if not threads_path.exists():
        return None

    with open(threads_path, "r", encoding="utf-8") as f:
        threads = json.load(f)

    return threads.get(branch_name)


load_env()
SLACK_CONFIG = load_slack_config()
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")

MERGE_MESSAGE = """{branch_name} 아트 브렌치 디벨롭에 머지합니다.

반드시 리다이렉터 업데이트, 커밋, 푸시 및 언락 부탁드립니다!"""


def send_thread_reply(channel: str, thread_ts: str, message: str) -> bool:
    """Send a threaded reply to a Slack message."""
    if not SLACK_BOT_TOKEN:
        print("[ERROR] SLACK_BOT_TOKEN not set in .env")
        return False

    try:
        import urllib.request

        payload = json.dumps({
            "channel": channel,
            "text": message,
            "thread_ts": thread_ts,
            "username": SLACK_CONFIG.get("bot_username", "아트 아르리므"),
            "link_names": True,
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://slack.com/api/chat.postMessage",
            data=payload,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Authorization": f"Bearer {SLACK_BOT_TOKEN}",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            if result.get("ok"):
                print(f"[OK] Thread reply sent")
                return True
            else:
                print(f"[ERROR] Slack API error: {result.get('error')}")
                return False

    except Exception as e:
        print(f"[ERROR] Failed to send thread reply: {e}")
        return False


def list_available_branches() -> None:
    """List all branches with saved thread info."""
    threads_path = Path(__file__).parent.parent.parent / "private" / "slack_threads.json"
    if not threads_path.exists():
        print("No saved threads found.")
        return

    with open(threads_path, "r", encoding="utf-8") as f:
        threads = json.load(f)

    if not threads:
        print("No saved threads found.")
        return

    print("Available branches:")
    for branch, info in threads.items():
        print(f"  - {branch} (created: {info.get('created_at', 'unknown')})")


def main():
    if len(sys.argv) < 2:
        print("Usage: merge_notice.py <branch_name>")
        print("       merge_notice.py --list")
        print()
        print("Example: merge_notice.py art/art-main-1.5.0-r2")
        print()
        list_available_branches()
        sys.exit(1)

    if sys.argv[1] == "--list":
        list_available_branches()
        sys.exit(0)

    branch_name = sys.argv[1]

    # Load thread info
    thread_info = load_thread_info(branch_name)
    if not thread_info:
        print(f"[ERROR] No thread info found for branch: {branch_name}")
        print()
        list_available_branches()
        sys.exit(1)

    channel = thread_info["channel"]
    thread_ts = thread_info["ts"]

    print(f"Sending merge notice for: {branch_name}")
    print(f"Channel: {channel}, Thread: {thread_ts}")

    message = MERGE_MESSAGE.format(branch_name=branch_name)

    if send_thread_reply(channel, thread_ts, message):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
