#!/usr/bin/env python3
"""Check if art branch was merged to develop and send completion notifications."""

import os
import sys
import json
import subprocess
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

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


def load_config():
    """Load local config (repo path from art-create)."""
    config_path = Path(__file__).parent.parent / "art-create" / "config.json"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


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
CONFIG = load_config()
SLACK_CONFIG = load_slack_config()
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")
REPO_PATH = CONFIG.get("repo_path", r"E:\Second\CINEVStudio")
KST = ZoneInfo("Asia/Seoul")


def run_git(args: list[str]) -> subprocess.CompletedProcess:
    """Run a git command in the repo directory."""
    cmd = ["git"] + args
    return subprocess.run(
        cmd,
        cwd=REPO_PATH,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


def check_branch_merged(branch_name: str) -> tuple[bool, str | None]:
    """Check if branch was merged to develop this week. Returns (merged, merge_commit_hash)."""
    # Get this week's Monday
    now = datetime.now(KST)
    days_since_monday = now.weekday()
    this_monday = now - timedelta(days=days_since_monday)
    monday_str = this_monday.strftime("%Y-%m-%d")

    # Fetch latest
    run_git(["fetch", "--all"])

    # Look for merge commits in develop that mention this branch
    result = run_git([
        "log",
        "origin/develop",
        f"--since={monday_str}",
        "--oneline",
        "--grep", branch_name,
    ])

    if result.returncode != 0:
        return False, None

    lines = [l.strip() for l in result.stdout.strip().split("\n") if l.strip()]
    if lines:
        # Found merge commit
        merge_hash = lines[0].split()[0]
        return True, merge_hash

    return False, None


def get_merge_details(branch_name: str) -> str:
    """Get merge request details by comparing branch to develop."""
    # Get commits that are in the branch but not in develop (before merge)
    # Or get the merge commit details
    result = run_git([
        "log",
        f"origin/develop",
        "--oneline",
        "-10",
        "--grep", branch_name,
    ])

    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()

    # Fallback: show recent develop commits
    result = run_git([
        "log",
        "origin/develop",
        "--oneline",
        "-5",
    ])

    return result.stdout.strip() if result.returncode == 0 else "머지 내역을 가져올 수 없습니다."


def send_thread_reply(channel: str, thread_ts: str, message: str, broadcast: bool = False) -> bool:
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
            "reply_broadcast": broadcast,
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
        print("Usage: merge_done.py <branch_name>")
        print("       merge_done.py --list")
        print()
        print("Example: merge_done.py art/art-main-1.5.0-r2")
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

    print(f"Checking merge status for: {branch_name}")
    print(f"Repo: {REPO_PATH}")

    # Check if merged
    merged, merge_hash = check_branch_merged(branch_name)

    if not merged:
        print(f"[INFO] Branch {branch_name} has not been merged to develop yet.")
        sys.exit(0)

    print(f"[OK] Branch merged! Commit: {merge_hash}")

    # Send first message: merge complete
    print("\nSending merge complete notification...")
    msg1 = "디벨롭에 머지 완료되었습니다!"
    if not send_thread_reply(channel, thread_ts, msg1, broadcast=True):
        sys.exit(1)

    # Get merge details and send second message
    print("\nGetting merge details...")
    details = get_merge_details(branch_name)

    # Format as Korean summary
    msg2 = f"**머지 내역:**\n```\n{details}\n```"

    print("Sending merge details...")
    if not send_thread_reply(channel, thread_ts, msg2):
        sys.exit(1)

    print("\n[OK] All notifications sent!")
    sys.exit(0)


if __name__ == "__main__":
    main()
