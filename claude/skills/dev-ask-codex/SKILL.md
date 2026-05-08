---
description: Ask OpenAI Codex a question
argument-hint: "<question>"
allowed-tools: Bash(codex:*), Bash(cd:*)
---

# dev-ask-codex

Ask Codex a question via CLI and return the response. Uses locally installed `codex` CLI.

## Arguments

- `<question>` - The question to ask Codex

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/dev-ask-codex <question>`

## Workflow

### Step 1: Validate
- Check `$ARGUMENTS` is provided
- Check `codex` CLI is available (`which codex`)

### Step 2: Phrase the question (CRITICAL)

The single biggest cause of "codex hangs / never responds" is the question shape, not the CLI flags. Codex in `--full-auto` mode autonomously decides whether to read files / grep the project / inspect a specific library version. The more your question signals "this is project-specific code work", the more codex tunnels into file inspection — slow at best, hung at worst.

**Reshape the question before calling**:

| Anti-pattern | Why it hangs codex | Rewrite |
|---|---|---|
| `"In the shotloom project, ..."` | codex tries to find / read shotloom files | Drop project name. State the technical context only. |
| `"With bevy_mod_outline 0.12.0 OutlineMode::FloodFlat, ..."` | codex tries to fetch the specific crate's source | Mention the library generically (`a JFA outline plugin`), or omit the version |
| `"Validate this 6-step plan: 1) ... 2) ... 3) ..."` | codex feels obligated to address each step in depth, often by inspecting code | Reduce to one question with 2-3 sub-bullets max. The ask is "is this idiomatic + 3 pitfalls" |
| Long context dumps (50+ lines) | longer input → longer output → higher chance of CLI timeout / truncation | Trim to ~10-15 lines of context max |
| Mixed code blocks + prose | codex parses code blocks and may try to compile/check | Use prose only when possible |

**Good shape**:

```
{Tech stack and version}, {one specific scenario}.
{Proposed approach in 1-3 sentences}.
{Question: is this idiomatic? better alternative? N pitfalls.}
{Format constraint: English/Korean, terse, line cap.}
```

Example that worked in <1 minute:

> Bevy 0.18, selected mesh silhouette outline. Idiomatic path: RenderLayers + offscreen mask + JFA distance field + composite. Is this standard? Better alternative? 3 pitfalls. English, terse.

### Step 3: Call Codex CLI

Run from a non-project directory with sandbox + git-skip flags so codex can't accidentally tunnel into file inspection:

```bash
cd /tmp && codex exec \
  --full-auto \
  --color never \
  --skip-git-repo-check \
  --sandbox read-only \
  "QUESTION_HERE" 2>&1 | tail -150
```

Flags:
- `--full-auto` — auto-approve actions
- `--color never` — strip ANSI color codes (cleaner output)
- `--skip-git-repo-check` — required when running from /tmp or any non-git dir; without this codex refuses to start
- `--sandbox read-only` — prevents codex from writing files. Pure knowledge / web-search mode.
- `cd /tmp` — moves cwd away from project. codex can still web search but won't grep nearby files.
- `tail -150` — caps output. The reasoning prelude + thinking summaries are useful; the *answer* is commonly the last 30-80 lines. Adjust based on expected answer length.

For longer answers, raise the tail limit (`tail -300`) instead of removing it — keeps the reasoning trace bounded.

### Step 4: Show Response

Display the CLI output directly.

After the response, summarize:
- Direct yes/no on the user's question
- Top 2-3 actionable points
- Any divergence from the user's expectation worth flagging

## Common failures + fixes

| Symptom | Cause | Fix |
|---|---|---|
| `Not inside a trusted directory` | running outside a git repo without `--skip-git-repo-check` | Add the flag |
| `Reading additional input from stdin...` then nothing | codex waiting for interactive prompt | Ensure you passed the question as a CLI arg, not piped |
| Hangs >2min on a simple question | question signaled project-specific work | Strip project / library specifics, retry from /tmp |
| Response 100s of lines, mostly file dumps | codex went into inspection mode | Add `--sandbox read-only`, retry from /tmp, shorten question |
| Empty response | output truncated by `tail -N` | Re-run without tail or with larger N |
| "Login required" | auth expired | `codex login` (interactive) before retry |

## Why these patterns matter

`codex exec --full-auto` is autonomous — codex chooses its own actions based on what the question implies. A question phrased as "validate my project plan" sets a *project-inspection task*. A question phrased as "is X the standard approach in tech Y" sets a *knowledge-retrieval task*. Same factual answer, very different runtime cost.

The user does not need codex's project context — they have it. Codex contributes generic-knowledge / web-search insight. So always reshape the question to be *generic-knowledge-shaped*, even when the underlying motivation is project-specific.
