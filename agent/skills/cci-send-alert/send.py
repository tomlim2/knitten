#!/usr/bin/env python3
"""Send alert message to CINEV team Slack channel via Arnyang bot."""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

ROOT_DIR = Path.home() / ".claude"


def load_env() -> None:
    """Load SLACK_BOT_TOKEN from ~/.claude/config/.env if present."""
    env_path = ROOT_DIR / "config" / ".env"
    if not env_path.exists():
        return
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip())


def load_slack_config() -> dict:
    path = ROOT_DIR / "config" / "slack.json"
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def post_message(text: str, thread_ts: Optional[str] = None) -> dict:
    load_env()
    cfg = load_slack_config()

    token = os.environ.get("SLACK_BOT_TOKEN", "")
    if not token:
        return {
            "ok": False,
            "error": "SLACK_BOT_TOKEN not set in ~/.claude/config/.env",
        }

    channel = cfg.get("team_channel", "")
    if not channel:
        return {
            "ok": False,
            "error": "team_channel not set in ~/.claude/config/slack.json",
        }

    payload = {
        "channel": channel,
        "text": text,
        "username": cfg.get("team_bot_username", "아르리므"),
        "link_names": True,
    }
    if thread_ts:
        payload["thread_ts"] = thread_ts

    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        return {"ok": False, "error": f"network: {exc}"}

    if result.get("ok"):
        return {"ok": True, "ts": result.get("ts"), "channel": channel}
    return {"ok": False, "error": result.get("error", "unknown")}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Send Slack alert to CINEV team channel via Arnyang.",
    )
    parser.add_argument("message", help="Alert message body")
    parser.add_argument(
        "--thread-ts",
        default=None,
        help="Thread timestamp for threaded reply (optional)",
    )
    args = parser.parse_args()

    result = post_message(args.message, args.thread_ts)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
