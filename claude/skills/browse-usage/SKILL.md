# browse-usage

**Version:** 0.1.0

Usage statistics dashboard with infographic-style visualization.

## Features

- Overview stats (Total Uses, Skills, Commands)
- Top 10 most used skills with visual bars
- Top 10 most used commands with visual bars
- Recent activity timeline
- Relative usage visualization (normalized to 100%)

## Usage

Access via skill-server at `/skills/browse-usage` or through the Usage tab in navigation.

## Data Source

Reads from `~/.claude/private/usage-stats.json`

## Design

Minimal infographic style with large numbers, visual bars, and clean tables.
