#!/usr/bin/env python3
"""Send message to Slack art channel."""

import os
import sys
import json
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent
ROOT_DIR = SKILL_DIR.parent.parent

# Load environment variables from shared .env file
def load_env():
    env_path = ROOT_DIR / "config" / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()

def load_slack_config():
    """Load shared Slack config from claude/config/slack.json"""
    config_path = ROOT_DIR / "config" / "slack.json"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

load_env()
SLACK_CONFIG = load_slack_config()
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")
ART_CHANNEL = SLACK_CONFIG.get("art_channel", "")


def send_slack_message(message: str) -> bool:
    """Send message to Slack art channel."""
    if not SLACK_BOT_TOKEN:
        print("[ERROR] SLACK_BOT_TOKEN not set in .env")
        return False

    if not ART_CHANNEL:
        print("[ERROR] art_channel not set in claude/config/slack.json")
        return False

    try:
        import urllib.request

        payload = json.dumps({
            "channel": ART_CHANNEL,
            "text": message,
            "username": SLACK_CONFIG.get("bot_username"),
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
                print(f"[OK] Message sent to art channel")
                return True
            else:
                print(f"[ERROR] Slack API error: {result.get('error')}")
                return False

    except Exception as e:
        print(f"[ERROR] Failed to send message: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: send_notice.py <message>")
        print("Example: send_notice.py '새 빌드가 준비되었습니다!'")
        sys.exit(1)

    message = " ".join(sys.argv[1:])
    print(f"Sending to art channel: {message}")

    if send_slack_message(message):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
