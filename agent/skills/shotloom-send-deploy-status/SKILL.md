---
description: Leaf/component Shotloom skill for deploy status notices only. Prefer shotloom-router for full deploy workflows.
argument-hint: "<start|success> --version vX.Y.Z [field flags]"
allowed-tools: Read, Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(date:*), Bash(python3:*)
domains: rust,web
repo-keys: shotloom
languages: css,rust,typescript
frameworks: bevy,wgpu
task-types: deploy
context-profile: shotloom-deploy
context-rules: rules/slack.md
exclude-when: unreal,obsidian
---

# shotloom-send-deploy-status

Two-phase Slack notifier for Shotloom web deploys.

- **start** — two sends: top-level "배포 시작" channel message + thread reply with workflow details. Returns the top-level ts for pairing with `success`.
- **success** — two sends: broadcast "사내망 배포 완료" on the start ts + thread detail reply with ETag and manifest commit.
- **completion-only fallback** — when no start thread exists, send a top-level completion message containing only the live URL and patch-note URL, then put deployment details in a thread reply.

## Arguments

Positional (required): `start` | `success`. No positional → show usage, NEVER auto-execute.

Common flags:

- `--version vX.Y.Z` — release tag. Required for both phases.
- `--no-confirm` — skip approval prompt. Reserved for callers that collected approval at their own gate.

`start`-only flags:

- `--workflow-url URL` — GitHub Actions run URL. Required.
- `--commits N` — commit count (`git rev-list --count <prev_tag>..HEAD`). Required.
- `--head-sha SHA` — short SHA. Default: `git rev-parse --short HEAD`.
- `--duration-estimate STR` — Default: `15-20분 (image build ~13분 + ArgoCD sync ~3분 + pod roll ~1분)`.

`success`-only flags:

- `--thread-ts TS` — Slack ts of the start top-level message. Required.
- `--etag-from STR` — pre-deploy ETag. Required.
- `--etag-to STR` — post-deploy ETag. Required.
- `--manifest-commit STR` — `<sha short-subject>` of prototype-manifest commit. Required.
- `--release-url URL` — patch-note document URL, commonly the generated GitHub Release. Recommended.
- `--target-url URL` — Default: `https://shotloom.cinamon.io`.

## Binding rules

- **Per-message approval** per `~/.claude/rules/slack.md`. Show all drafts in a phase together, get one `y` before sending any. One approval = one phase (covers all messages in that phase).
- **Never auto-send.**
- **Korean dry tone**: no emoji, no qualitative adjectives, no future-tense filler.
- **Channel fixed** to `team_channel` from `~/.claude/config/slack.json`.

## Workflow

### Step 1: Validate

Phase ∈ `{start, success}`. `--version` required for both.

`start`: `--workflow-url`, `--commits` required.

`success`: `--thread-ts`, `--etag-from`, `--etag-to`, `--manifest-commit` required.

Missing required flag → print which one and stop.

### Step 2: Resolve defaults

```bash
# start
HEAD_SHA="${ARG_HEAD_SHA:-$(git rev-parse --short HEAD)}"
DURATION="${ARG_DURATION:-15-20분 (image build ~13분 + ArgoCD sync ~3분 + pod roll ~1분)}"

# success
TARGET_URL="${ARG_TARGET_URL:-https://shotloom.cinamon.io}"
```

### Step 3: Render drafts

`start` — two messages in order:

Message 1 (top-level channel message):
```
Shotloom $VERSION 배포 시작.
```

Message 2 (thread reply under Message 1):
```
- HEAD: $HEAD_SHA
- 워크플로: $WORKFLOW_URL
- 변경: $COMMITS commits
- 예상 소요: $DURATION
```

`success` — two messages in order:

Message A (thread reply + channel broadcast on `--thread-ts`):
```
사내망 배포 완료
- $TARGET_URL
```

Message B (thread reply under A):
```
- ETag: $ETAG_FROM → $ETAG_TO  (rolled — proxy verification passed)
- prototype-manifest commit: $MANIFEST_COMMIT
- 패치노트: $RELEASE_URL
```

Omit `패치노트:` only when `--release-url` is absent. Do not paste long patch notes into Slack; link the generated release or equivalent patch-note document.

Completion-only fallback — use only when a deploy finished but no `start` phase was sent, so `success --thread-ts` cannot be used. The top-level message is audience-facing only; keep workflow, manifest, image, SHA, ETag, and verification details in the thread reply.

Top-level channel message:
```
Shotloom $VERSION 사내망 배포 완료.

- 대상: $TARGET_URL
- 패치노트: $RELEASE_URL
```

If `--target-url` is omitted, render the default URL as `https://shotloom.cinamon.io/` with the trailing slash. Omit `패치노트:` only when `--release-url` is absent.

Thread reply under the top-level message:
```
- HEAD: $HEAD_SHA
- 이미지: $IMAGE
- 워크플로: $WORKFLOW_URL
- prototype-manifest: $MANIFEST_COMMIT
- ETag: $ETAG_FROM → $ETAG_TO
```

Do not put workflow, manifest, image, SHA, or ETag details in the top-level message for this fallback.

### Step 4: Approval prompt (skipped when `--no-confirm`)

Show all messages in the phase before sending any:

```
대상 채널: #team_channel (Arnyang)
[start — 2 sends]
  1: top-level channel message
  2: thread reply under 1

1:
<draft 1>

2:
<draft 2>

이대로 보낼까요? (y / 수정 / 취소)
```

```
대상 채널: #team_channel (Arnyang)
[success — 2 sends]
  A: thread reply + broadcast on TS=$THREAD_TS
  B: thread reply under A

A:
<draft A>

B:
<draft B>

이대로 보낼까요? (y / 수정 / 취소)
```

### Step 5: Send

`start` Message 1 — top-level via send.py (no `--thread-ts`):

```bash
resp=$(python3 ~/.claude/skills/cci-send-alert/send.py "$MSG_1")
START_TS=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['ts'])")
```

`start` Message 2 — thread reply via send.py:

```bash
python3 ~/.claude/skills/cci-send-alert/send.py "$MSG_2" --thread-ts "$START_TS"
```

`success` Message A — direct Slack API with `reply_broadcast: true` (send.py does not support this flag):

```python
payload = {
    "channel": channel,
    "text": MSG_A,
    "username": cfg["team_bot_username"],
    "thread_ts": THREAD_TS,
    "reply_broadcast": True,
    "link_names": True,
}
# POST to https://slack.com/api/chat.postMessage
# capture A_TS = result["ts"]
```

`success` Message B — thread reply under A via send.py:

```bash
python3 ~/.claude/skills/cci-send-alert/send.py "$MSG_B" --thread-ts "$A_TS"
```

On any `ok=false`: surface Slack API error verbatim. Common errors:

| `error` field | Fix |
|---|---|
| `not_in_channel` | invite `@아르리므` to the channel |
| `channel_not_found` | wrong channel id in `slack.json` |
| `invalid_auth` / `token_revoked` | rotate `SLACK_BOT_TOKEN` in `~/.config/cinev/.env` |

### Step 6: Report

```
Sent: phase=start  top_ts=<START_TS>
```
Print `start_ts=$START_TS` on its own line so a calling skill can capture it.

```
Sent: phase=success  broadcast_ts=<A_ts>  detail_ts=<B_ts>  thread=<THREAD_TS>
```

## Examples

```bash
# start
/shotloom-send-deploy-status start \
  --version v0.1.4 \
  --workflow-url https://github.com/CINEV/shotloom/actions/runs/25552506915 \
  --commits 8

# captured: start_ts=1778231639.532389

# success — after ETag confirmed rolled
/shotloom-send-deploy-status success \
  --version v0.1.4 \
  --thread-ts 1778231639.532389 \
  --etag-from "69fbe8a2-32d" \
  --etag-to "69fdc84c-32d" \
  --manifest-commit "8a698b2 chore(shotloom): update web image tag" \
  --release-url "https://github.com/CINEV/shotloom/releases/tag/v0.1.4"
```

## Related

- `~/.claude/skills/cci-send-alert/SKILL.md` — underlying send mechanism (`team_channel`, `SLACK_BOT_TOKEN`)
- `~/.claude/skills/shotloom-deploy-web/SKILL.md` — primary caller
- `~/.claude/rules/slack.md` — per-message approval gate
- `~/.claude/config/slack.json` — `team_channel`, `team_bot_username`
