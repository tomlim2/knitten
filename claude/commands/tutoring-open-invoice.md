---
description: Open invoice generator via skill server
allowed-tools: Bash(open:*)
---

# tutoring-open-invoice

Open the monthly tuition invoice generator through the skill server.

## Usage

```
/tutoring-open-invoice
```

## Execution

```bash
SERVER_DIR="$HOME/Desktop/www/caol-ila/claude/skills/caol-serve-skills"

if ! curl -s http://localhost:972 > /dev/null 2>&1; then
    cd "$SERVER_DIR"
    [ ! -d node_modules ] && npm install
    nohup node server.js > /tmp/skill-server.log 2>&1 &
    sleep 2
fi

open http://localhost:972/invoice
```

## Output

Confirms the skill server is running and the invoice generator page is opened in the browser.
