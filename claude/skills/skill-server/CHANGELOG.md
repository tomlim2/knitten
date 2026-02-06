# Skill Server Changelog

## [1.5.0] - 2026-02-06

### Added
- Usage tracking system
  - Tracks skill opens and command copies
  - Stores usage stats in `~/.claude/private/usage-stats.json`
  - API endpoints: `/api/usage/track` (POST), `/api/usage/stats` (GET)
- Most Used section on dashboard
  - Shows top 5 most used skills/commands
  - Displays usage count for each item
  - Auto-updates based on usage data

## [1.4.0] - 2026-02-02

### Changed
- Simplified dashboard layout (removed category headers)
- Updated card style: border on skill-meta only
- Adjusted spacing: main padding 32px top, 16px bottom
- Subpages updated to page-hero--single style

## [1.0.0] - 2026-01-31

### Added
- Initial release
- Dashboard with skill discovery from ~/.claude/skills/
- Web skill serving (static HTML/CSS/JS)
- CLI skill support with WebSocket
- File browser for ~/.claude/private/
- Git commit collector integration (simple-git)
- Design System v1.1.0 compliant styling
