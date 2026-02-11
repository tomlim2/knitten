#!/usr/bin/env python3
"""Art MCP Server - Slack integration for CINEV art branch workflows."""

import json
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from fastmcp import FastMCP

ROOT_DIR = Path.home() / ".claude"
KST = ZoneInfo("Asia/Seoul")

# Load config at startup
def _load_env():
    env_path = ROOT_DIR / "config" / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()

def _load_slack_config() -> dict:
    config_path = ROOT_DIR / "config" / "slack.json"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def _load_art_config() -> dict:
    config_path = ROOT_DIR / "skills" / "cocv-art-create-branch" / "config.json"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def _threads_path() -> Path:
    return ROOT_DIR / "private" / "slack_threads.json"

def _load_threads() -> dict:
    path = _threads_path()
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def _save_threads(threads: dict) -> None:
    path = _threads_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(threads, f, indent=2, ensure_ascii=False)

_load_env()
SLACK_CONFIG = _load_slack_config()
ART_CONFIG = _load_art_config()

mcp = FastMCP("cocv")


@mcp.tool()
def slack_post_message(text: str, thread_ts: str = None, broadcast: bool = False) -> dict:
    """Send message to art Slack channel. Returns {ok, ts, channel}."""
    import urllib.request

    token = os.environ.get("SLACK_BOT_TOKEN", "")
    if not token:
        return {"ok": False, "error": "SLACK_BOT_TOKEN not set"}

    channel = SLACK_CONFIG.get("art_channel", "")
    if not channel:
        return {"ok": False, "error": "art_channel not set in slack.json"}

    payload = {
        "channel": channel,
        "text": text,
        "username": SLACK_CONFIG.get("bot_username"),
        "link_names": True,
    }
    if thread_ts:
        payload["thread_ts"] = thread_ts
        payload["reply_broadcast"] = broadcast

    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        if result.get("ok"):
            return {"ok": True, "ts": result.get("ts"), "channel": channel}
        return {"ok": False, "error": result.get("error", "unknown")}


@mcp.tool()
def thread_save(branch_name: str, channel: str, ts: str) -> dict:
    """Save Slack thread metadata for a branch."""
    threads = _load_threads()
    threads[branch_name] = {
        "channel": channel,
        "ts": ts,
        "created_at": datetime.now(KST).isoformat(),
    }
    _save_threads(threads)
    return {"ok": True, "branch": branch_name}


@mcp.tool()
def thread_get(branch_name: str) -> dict:
    """Get saved thread info for a branch. Returns {channel, ts, created_at} or {found: false}."""
    threads = _load_threads()
    info = threads.get(branch_name)
    if info:
        return {"found": True, **info}
    return {"found": False}


@mcp.tool()
def thread_list() -> list:
    """List all branches with saved thread info."""
    threads = _load_threads()
    return [
        {"branch": branch, **info}
        for branch, info in threads.items()
    ]


@mcp.tool()
def get_art_config() -> dict:
    """Return art workflow config: repo_path, channel, bot_username, message templates."""
    return {
        "repo_path": ART_CONFIG.get("repo_path", ""),
        "channel": SLACK_CONFIG.get("art_channel", ""),
        "bot_username": SLACK_CONFIG.get("bot_username", ""),
        "art_notice_message": SLACK_CONFIG.get("art_notice_message", ""),
        "art_merge_notice_message": SLACK_CONFIG.get("art_merge_notice_message", ""),
    }


if __name__ == "__main__":
    mcp.run()
