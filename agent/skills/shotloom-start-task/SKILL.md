---
description: Start a task from a Linear issue by validating usability, gathering related planning context, and writing a briefing
argument-hint: "STL-NN | linear-url"
allowed-tools: Read, Write, Glob, Grep, Bash(bash:*), Bash(gh:*), Bash(git:*), Bash(ls:*), Bash(mkdir:*), Bash(grep:*), Bash(rg:*), Bash(test:*)
---

# shotloom-start-task

Start-task intake flow. It validates that the skill can run, gathers the Linear
issue body plus related external planning/material context, writes a briefing
file, and returns a small JSON envelope.

Temporary runtime files follow
`agent/standards/policy/temporary-runtime-files.md`.

## Arguments

Requires `STL-NN` or a Linear URL. If no Linear issue key is provided, do not
run this skill; ask for the issue key and stop.

## Workflow

### Step 1: Skill usability gate (MANDATORY — never skip)

Input: current environment plus `$ARGUMENTS`.

Run local gates and detect the Linear issue key:

```bash
knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the agent-hub repo path}"
node "$knitten_root/agent/lib/shotloom-preflight.mjs" --allow-dirty --print-json
node "$knitten_root/agent/lib/shotloom-linear-intake.mjs" detect "$ARGUMENTS"
```

If no Linear `get_issue` tool is visible, discover it with a tool search for
`Linear get_issue`; MCP server names vary by harness and must not be hard-coded.

Fetch the Linear issue body with the currently available Linear connector and
save the exact connector result as `<workDir>/linear-raw.json`.

Output: true/false usability decision plus the fetched Linear body JSON.

```json
{
  "ok": true,
  "environment": {
    "worktree": "<path>",
    "branch": "<branch>",
    "origin": "<remote>",
    "configured-shotloom-root": "<path>",
    "gh-login": "<login>",
    "git-identity": "<name <email>>",
    "dirty": false,
    "dirty-files": [],
    "github": { "ok": true }
  },
  "linear": {
    "ok": true,
    "issueKey": "STL-NN",
    "workDir": "<workDir>",
    "rawPath": "<workDir>/linear-raw.json",
    "intakePath": "<workDir>/intake.json",
    "body": {
      "identifier": "STL-NN",
      "title": "<Linear title>",
      "description": "<Linear description>"
    }
  }
}
```

If either command exits nonzero or returns `ok: false`, output `ok: false` and
stop before repo reads or briefing writes. If Linear `get_issue` fails, output
`ok: false` and stop. `shotloom-preflight.mjs` delegates GitHub login / git
author checks to `shotloom-github-guard.mjs --print-json`; consume `github.ok`
as detail, not as a separate hand-written checklist.
`shotloom-linear-intake.mjs detect` must return `issueKey`; do not infer issues
from branch names, git state, recent commits, or free-form category names.

When `ok: true`, save the raw Linear body JSON and write the intake file:

```bash
node "$knitten_root/agent/lib/shotloom-linear-intake.mjs" get "<issueKey>" \
  --raw "<workDir>/linear-raw.json" \
  --work-dir "<workDir>"
```

Machine contract for this skill: use only `detect` and `get`. `get` is the only
command that stores Linear body content. Do not call `create`, `post`, or
`delete` from this skill. Later steps read the intake file created by `get`
instead of re-fetching Linear.

### Step 1.5: Create task worktree after a clean gate

Run this step only after Step 1 returns `ok: true` for every local and Linear
gate. Start the task in a dedicated non-main Shotloom worktree before gathering
planning context or writing the briefing.

Derive the branch name from the Linear title using the pattern
`<type>/<scope>-<verb>-<subject>`:

- lowercase kebab-case;
- no `STL-NN` prefix in branch or worktree paths;
- keep the branch at or below 50 characters when practical;
- map non-implementation title types such as `test` to the nearest task branch
  type when the implementation touches source.

Use the Shotloom worktree base from `reference.md`:

```bash
knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the agent-hub repo path}"
repo_root="$(node "$knitten_root/agent/lib/resolve-repo-path.mjs" shotloom)"
if grep -qE '^\.worktrees/?$' "$repo_root/.gitignore" 2>/dev/null; then
  worktree_base="$repo_root/.worktrees"
else
  worktree_base="$(dirname "$repo_root")/shotloom-worktrees"
  mkdir -p "$worktree_base"
fi
```

Then create or attach the task worktree:

```bash
cd "$repo_root"
git fetch origin main
git worktree add "$worktree_base/<branch-body>" -b "<branch>" origin/main
# If the branch already exists locally:
git worktree add "$worktree_base/<branch-body>" "<branch>"
```

After creating the worktree, continue Steps 2-3 from that worktree. If a
matching branch or worktree already exists, reuse it only when it is the same
Linear task and the user has not asked for a fresh branch. If worktree creation
fails because the branch is already checked out elsewhere, report that path and
ask whether to continue there or create a differently named follow-up branch.

### Step 2: Gather related planning context

Input: Linear body JSON from Step 1.

Use the related-context helper to extract fetch/search candidates from the
intake file:

```bash
node "$knitten_root/agent/lib/shotloom-linear-context.mjs" discover "<issueKey>" \
  --work-dir "<workDir>"
```

Fetch any `referencedIssueKeys` with Linear `get_issue` when they are relevant
to planning context. Search local planning docs only for `documentHints`,
`searchTerms`, or user-provided keywords. Then gather the fetched materials:

```bash
node "$knitten_root/agent/lib/shotloom-linear-context.mjs" gather \
  "<issueKey>" \
  --work-dir "<workDir>" \
  --related <related-linear-raw.json> \
  --doc <planning-doc.md>
```

Step 3 consumes `<workDir>/context.json`.

Record only planning inputs and open questions:
- linked Linear parent/related issue summaries when available;
- linked docs, specs, design notes, PRDs, or planning artifacts;
- local planning/briefing documents whose slug or content clearly matches;
- unresolved questions the user must answer before the next planning step.

Do not collect codebase implementation context in this skill. If planning
context is ambiguous, ask the user a focused question and stop with `ok: false`.

### Step 3: Write briefing and JSON output

Before writing the briefing, read [`PROMOTED_FINDINGS.md`](PROMOTED_FINDINGS.md)
and apply entries that match the current intake, branch setup, planning, or
handoff. Include concrete handoff instructions when an active entry requires
them.

Resolve a slug from the Linear title. Write a compact briefing markdown file to
the Knitten checkout:

```text
<knitten_root>/docs/briefings/linear/<slug>.md
```

Create the directory before writing.

The briefing file contains:
- Linear issue key, title, URL, state, assignee, labels, and body summary;
- related planning/materials gathered in Step 2;
- open questions;
- suggested next action.

Final chat output is JSON only:

```json
{
  "ok": true,
  "issueKey": "STL-NN",
  "slug": "<slug>",
  "briefingPath": "/absolute/path/docs/briefings/linear/<slug>.md",
  "workDir": "<workDir>",
  "contextPath": "<workDir>/context.json",
  "cleanupPaths": ["<workDir>"],
  "relatedContextCount": 0,
  "openQuestions": [],
  "next": "ask-user"
}
```

Failure output:

```json
{
  "ok": false,
  "stage": "skill-usability-gate | gather-related-context | write-briefing",
  "error": "<reason>",
  "issueKey": "STL-NN|null",
  "openQuestions": []
}
```

This skill (`/shotloom-start-task`) NEVER:
- Mutates Linear.
- Creates, posts, deletes, assigns, or transitions Linear issues.
- Writes a task spec.
- Reads source files for implementation mapping.
- Edits implementation code.

## Binding Rules

| Rule | Source |
|------|--------|
| Run Steps 1-3 in order. | This skill workflow. |
| Read Linear only; do not mutate Linear. | This skill `NEVER` list. |
| Return JSON only in chat. | Step 3 final output contract. |
