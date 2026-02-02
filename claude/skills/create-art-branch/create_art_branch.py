#!/usr/bin/env python3
"""
CINEV Art Branch Creator

Creates a new art branch from develop and cherry-picks commits from a source branch
within a specific time window (previous Friday 8AM KST to this Monday 8AM KST).
"""

import subprocess
import sys
import os
import json
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

# Load environment variables from shared .env file
def load_env():
    # Load from shared config location
    env_path = Path(__file__).parent.parent.parent / "config" / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ[key.strip()] = value.strip()

load_env()

# Load local config
def load_config():
    config_path = Path(__file__).parent / "config.json"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

# Load shared Slack config
def load_slack_config():
    config_path = Path(__file__).parent.parent.parent / "config" / "slack.json"
    if config_path.exists():
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

CONFIG = load_config()
SLACK_CONFIG = load_slack_config()

# Configuration
REPO_PATH = CONFIG.get("repo_path", r"E:\Second\CINEVStudio")
SLACK_CHANNEL = SLACK_CONFIG.get("art_channel", "")
NOTIFICATION_MESSAGE = SLACK_CONFIG.get("art_notice_message", "@here 아트 새브렌치가 나왔습니다~ {branch_name}")
SLACK_BOT_TOKEN = os.environ.get("SLACK_BOT_TOKEN", "")
KST = ZoneInfo("Asia/Seoul")


def run_git(args: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a git command in the repo directory."""
    cmd = ["git"] + args
    print(f"  > git {' '.join(args)}")
    result = subprocess.run(
        cmd,
        cwd=REPO_PATH,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if check and result.returncode != 0:
        raise RuntimeError(f"Git command failed: {result.stderr}")
    return result


def get_time_window() -> tuple[datetime, datetime]:
    """Calculate the time window: previous Friday 8AM KST to this Monday 8AM KST."""
    now = datetime.now(KST)

    # Find this Monday (or today if it's Monday)
    days_since_monday = now.weekday()  # Monday = 0
    this_monday = now - timedelta(days=days_since_monday)
    monday_8am = this_monday.replace(hour=8, minute=0, second=0, microsecond=0)

    # Find previous Friday (3 days before Monday)
    prev_friday = monday_8am - timedelta(days=3)
    friday_8am = prev_friday.replace(hour=8, minute=0, second=0, microsecond=0)

    return friday_8am, monday_8am


def get_commits_in_range(branch: str, since: datetime, until: datetime) -> list[str]:
    """Get commit hashes from a branch within the time range."""
    since_str = since.strftime("%Y-%m-%d %H:%M:%S")
    until_str = until.strftime("%Y-%m-%d %H:%M:%S")

    result = run_git([
        "log",
        f"origin/{branch}",
        f"--since={since_str}",
        f"--until={until_str}",
        "--reverse",
        "--format=%H",
    ])

    commits = [c.strip() for c in result.stdout.strip().split("\n") if c.strip()]
    return commits


def send_slack_notification(branch_name: str, commit_count: int) -> bool:
    """Send Slack notification to the art channel."""
    if not SLACK_BOT_TOKEN:
        print("  [WARN] SLACK_BOT_TOKEN not set, skipping notification")
        return False

    if not SLACK_CHANNEL:
        print("  [WARN] slack_channel not set in config.json, skipping notification")
        return False

    try:
        import urllib.request
        import urllib.error

        message = NOTIFICATION_MESSAGE.format(branch_name=branch_name, commit_count=commit_count)

        payload = json.dumps({
            "channel": SLACK_CHANNEL,
            "text": message,
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
                print(f"  [OK] Slack notification sent")
                return True
            else:
                print(f"  [ERROR] Slack API error: {result.get('error')}")
                return False

    except Exception as e:
        print(f"  [ERROR] Failed to send Slack notification: {e}")
        return False


def main():
    if len(sys.argv) < 2:
        print("Usage: create_art_branch.py <new_branch_name> [source_branch]")
        print("Example: create_art_branch.py art/art-main-1.5.0-r1 art/art-main-1.5.0")
        print("         create_art_branch.py art/art-main-1.5.0-r1  (no cherry-pick)")
        sys.exit(1)

    new_branch = sys.argv[1]
    source_branch = sys.argv[2] if len(sys.argv) >= 3 else None

    print(f"\n{'='*60}")
    print(f"CINEV Art Branch Creator")
    print(f"{'='*60}")
    print(f"New branch: {new_branch}")
    print(f"Source branch: {source_branch or '(none - skip cherry-pick)'}")
    print(f"Repo: {REPO_PATH}")
    print(f"{'='*60}\n")

    # Step 1: Check git works
    print("[1/6] Checking git repository...")
    if not Path(REPO_PATH).exists():
        print(f"  [CONFLICT] Repository path does not exist: {REPO_PATH}")
        sys.exit(1)

    result = run_git(["status"], check=False)
    if result.returncode != 0:
        print(f"  [CONFLICT] Step 1 - Git is not working properly in {REPO_PATH}")
        print(f"  Error: {result.stderr}")
        sys.exit(1)
    print("  [OK] Git repository is working")

    # Step 2: Reset and fetch
    print("\n[2/6] Resetting and fetching...")
    result = run_git(["reset", "--hard"], check=False)
    if result.returncode != 0:
        print(f"  [CONFLICT] Step 2 - git reset --hard failed")
        print(f"  Error: {result.stderr}")
        sys.exit(1)

    result = run_git(["fetch", "--all"], check=False)
    if result.returncode != 0:
        print(f"  [CONFLICT] Step 2 - git fetch --all failed")
        print(f"  Error: {result.stderr}")
        sys.exit(1)
    print("  [OK] Reset and fetch completed")

    # Step 3: Create branch from origin/develop
    print("\n[3/6] Creating branch from origin/develop...")
    result = run_git(["branch", new_branch, "origin/develop"], check=False)
    if result.returncode != 0:
        if "already exists" in result.stderr:
            print(f"  [CONFLICT] Step 3 - Branch '{new_branch}' already exists")
        else:
            print(f"  [CONFLICT] Step 3 - Failed to create branch")
        print(f"  Error: {result.stderr}")
        sys.exit(1)
    print(f"  [OK] Branch '{new_branch}' created from origin/develop")

    # Step 4: Checkout
    print("\n[4/6] Checking out new branch...")
    result = run_git(["checkout", new_branch], check=False)
    if result.returncode != 0:
        print(f"  [CONFLICT] Step 4 - Failed to checkout branch")
        print(f"  Error: {result.stderr}")
        sys.exit(1)
    print(f"  [OK] Checked out '{new_branch}'")

    # Step 5: Cherry-pick commits (optional)
    commits = []
    if source_branch:
        print("\n[5/6] Cherry-picking commits...")
        friday_8am, monday_8am = get_time_window()
        print(f"  Time window: {friday_8am.strftime('%Y-%m-%d %H:%M')} ~ {monday_8am.strftime('%Y-%m-%d %H:%M')} KST")

        commits = get_commits_in_range(source_branch, friday_8am, monday_8am)
        print(f"  Found {len(commits)} commits to cherry-pick")

        if commits:
            for i, commit_hash in enumerate(commits, 1):
                result = run_git(["cherry-pick", commit_hash], check=False)
                if result.returncode != 0:
                    print(f"\n  [CONFLICT] Step 5 - Cherry-pick failed at commit {i}/{len(commits)}")
                    print(f"  Commit: {commit_hash}")
                    print(f"  Error: {result.stderr}")
                    print(f"\n  To resolve:")
                    print(f"    1. cd {REPO_PATH}")
                    print(f"    2. Resolve conflicts manually")
                    print(f"    3. git cherry-pick --continue")
                    print(f"    4. Or: git cherry-pick --abort to cancel")
                    sys.exit(1)
                print(f"    [{i}/{len(commits)}] {commit_hash[:8]} OK")
            print(f"  [OK] All {len(commits)} commits cherry-picked")
        else:
            print("  [OK] No commits to cherry-pick in the time window")
    else:
        print("\n[5/6] Skipping cherry-pick (no source branch specified)")

    # Step 6: Push and notify
    print("\n[6/6] Pushing and sending notification...")
    result = run_git(["push", "-u", "origin", new_branch], check=False)
    if result.returncode != 0:
        print(f"  [CONFLICT] Step 6 - Push failed")
        print(f"  Error: {result.stderr}")
        sys.exit(1)
    print(f"  [OK] Pushed '{new_branch}' to origin")

    send_slack_notification(new_branch, len(commits))

    print(f"\n{'='*60}")
    print(f"SUCCESS!")
    print(f"Branch '{new_branch}' created with {len(commits)} cherry-picked commits")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
