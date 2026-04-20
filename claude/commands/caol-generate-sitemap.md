---
description: Generate sitemap of skill server routes
allowed-tools: Bash(node:*), Read, Write
---

# meta-generate-sitemap

Generate a complete sitemap of all skill server routes and pages.
## Current Structure

**Read** the current state:
- Skills: !`node -e "const fs = require('fs'); const path = require('path'); const dir = path.join(require('os').homedir(), '.claude', 'skills'); const skills = fs.readdirSync(dir).filter(d => { const p = path.join(dir, d); return fs.statSync(p).isDirectory() && d !== 'skill-server' && fs.existsSync(path.join(p, 'SKILL.md')); }); console.log(JSON.stringify(skills));"`
- Standards: !`node -e "const fs = require('fs'); const path = require('path'); const dir = path.join(require('os').homedir(), '.claude', 'standards'); if (fs.existsSync(dir)) { const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')); console.log(JSON.stringify(files.map(f => f.replace('.md', '')))); } else { console.log('[]'); }"`

## Generate Sitemap

Create a sitemap file at `~/.claude/private/site-map.txt` with the following structure:

```
SKILL SERVER SITEMAP
====================

## Core Pages
http://localhost:972/                    - Dashboard (Skills)
http://localhost:972/files               - File Browser

## Skills
http://localhost:972/skills/{skill-id}   - Skill detail pages
  - [List all discovered skills with their IDs]

## API Endpoints
http://localhost:972/api/skills          - Skills JSON
http://localhost:972/api/commands        - Commands JSON
http://localhost:972/api/standards       - Standards JSON
http://localhost:972/api/standards/{name} - Standard content
http://localhost:972/api/files?path={path} - File browser API

Generated: [TIMESTAMP]
```

## Output

**Write** the sitemap to `~/.claude/private/site-map.txt` and display a summary to the user.
