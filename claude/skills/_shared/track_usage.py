#!/usr/bin/env python3
"""Usage tracking helper for Claude Code skills.

This module provides a simple function to track skill and command usage
by sending data to the skill server's tracking API.

Usage:
    from _shared.track_usage import track

    # Track skill usage
    track('skills', 'my-skill-name')

    # Track command usage
    track('commands', 'my-command-name')
"""

import urllib.request
import urllib.error
import json


def track(track_type: str, item_id: str, port: int = 972) -> bool:
    """Track usage of a skill or command.

    Args:
        track_type: Type of item - 'skills' or 'commands'
        item_id: ID of the skill or command (e.g., 'git-make-message')
        port: Port number of skill server (default: 972)

    Returns:
        True if tracking succeeded, False otherwise

    Note:
        This function fails silently to avoid disrupting skill execution
        if the tracking server is not running.
    """
    if track_type not in ['skills', 'commands']:
        return False

    url = f'http://localhost:{port}/api/usage/track'
    data = {
        'type': track_type,
        'id': item_id
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=1) as response:
            return response.status == 200
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        # Fail silently - tracking is optional and shouldn't break skill execution
        return False


if __name__ == '__main__':
    # Test tracking
    print("Testing usage tracking...")
    result = track('skills', 'test-skill')
    print(f"Tracking {'succeeded' if result else 'failed'}")
