---
description: Open NZ Downloader in browser
allowed-tools: Bash(open:*)
---

# cci-open-zo-downloader

Open the NZ temporary downloader HTML tool in the default browser.
## Usage

```
/cci-open-zo-downloader
```

## Execution

1. Read `~/.claude/private/repo-paths.json` to get the `anju` repo path
2. Open the NZ downloader HTML file:

```bash
open "<anju_path>/api-test/nz-downloader/index.html"
```

Confirm the file was opened in the browser.
