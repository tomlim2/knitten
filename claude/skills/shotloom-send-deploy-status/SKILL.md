---
description: Post Shotloom deploy 시작 / 배포 결과 messages to the CINEV team Slack channel via Arnyang in the dry-Korean format used during the v0.1.2 cut. Two phases (start, result) — start returns the message ts for thread-reply pairing.
argument-hint: "<start|result> --version vX.Y.Z [field flags]"
allowed-tools: Read, Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(date:*), Bash(python3:*)
---

# shotloom-send-deploy-status

Templated wrapper around `cci-send-alert` (Arnyang bot, `team_channel` from `~/.claude/config/slack.json` — currently `C09DF8A1ZK4`) that produces the exact dry-Korean format used in the v0.1.2 deploy round-trip:

- **start** — top-level "deploy 시작" notice. Returns the posted `ts` so the caller can pair a thread reply later.
- **result** — thread reply on the start `ts` reporting how the deploy ended (rolled / timed-out / skipped / rolled-back).

Format intentionally drops emoji, marketing adjectives, future-tense filler. One paragraph or one bullet group; no headers; no horizontal rules.

## Arguments

Positional (required):

- `start` | `result` — phase. No positional → show usage and ask, NEVER auto-execute.

Common flags:

- `--version vX.Y.Z` — release tag. Required.
- `--no-confirm` — skip the per-message approval prompt. **Do NOT use** in normal operation; reserved for `/shotloom-deploy-web --for-real` that already collected approval at its own gate. Pass through carefully.

`start`-only flags:

- `--workflow-url URL` — GitHub Actions run URL. Required.
- `--commits N` — commit count in this release (e.g. `git rev-list --count <prev_tag>..HEAD`). Required.
- `--head-sha SHA` — short SHA. Default `git rev-parse --short HEAD`.
- `--target-url URL` — production URL. Default `https://shotloom.cinamon.io`.
- `--duration-estimate STR` — estimated wall time. Default `15-20분 (image build ~13분 + ArgoCD sync ~3분 + pod roll ~1분)`.
- `--first-tag` — append `(첫 SemVer 태그)` to the title line. Use only when the deploy is the very first SemVer tag in the repo (`git tag -l "v*" | wc -l` was 0 before this cut).

`result`-only flags:

- `--thread-ts TS` — Slack ts of the start message. Required.
- `--state rolled|timed-out|skipped|rolled-back` — terminal state from the deploy verification. Required.
- `--etag-from STR` — pre-deploy ETag. Required when `state=rolled`.
- `--etag-to STR` — post-deploy ETag. Required when `state=rolled`.
- `--prev-tag vX.Y.Z` — known-good tag the rollback restored. Required when `state=rolled-back`.
- `--manifest-commit STR` — `<sha + short subject>` of the prototype-manifest commit. Required.
- `--release-url URL` — GitHub Release URL. Optional but recommended.
- `--start-iso ISO` — start timestamp (`date +%H:%M` or full ISO). Default: now − inferred elapsed; if elapsed unknown, omit the elapsed line.

## Binding rules

- **Every send is per-message gated** per `~/.claude/rules/slack.md`. Show the rendered draft + target channel + thread context, wait for explicit `y`. A prior approval does NOT carry over to a new message. `--no-confirm` is the only escape and only for callers that have collected an equivalent approval at their own gate.
- **Never auto-send.** Even programmatic invocations from sibling skills (e.g. `shotloom-deploy-web`) must surface the draft in the conversation.
- **Never include secrets** in any field — registry creds, token fragments, raw kubeconfig.
- **Korean dry tone**: no emoji, no `🚀`, no qualitative adjectives (`successfully`, `seamlessly`, `cleanly`, `nicely`, `huge`, `great`), no future-tense placeholders (`will follow up`, `next steps`, `phase 2`). State what shipped, where, and how it ended. The reviewer-friendly version of the same content already worked once at v0.1.2 — keep that altitude.
- **Channel target is fixed** to the `team_channel` from `~/.claude/config/slack.json`. To post elsewhere (DM, art channel, prototype channel), use `cci-send-alert` directly.

## Workflow

### Step 1: Validate phase + required flags

If positional is missing, print:

```
Usage:
  /shotloom-send-deploy-status start --version vX.Y.Z --workflow-url URL --commits N [...]
  /shotloom-send-deploy-status result --version vX.Y.Z --thread-ts TS --state STATE [...]
```

Validate phase ∈ `{start, result}`. Validate the `--version` matches `^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$`.

For `start`: `--workflow-url` and `--commits` required.

For `result`: `--thread-ts`, `--state`, `--manifest-commit` required. State-conditional fields:

| `--state` | Additionally required |
|---|---|
| `rolled` | `--etag-from`, `--etag-to` |
| `timed-out` | (none) |
| `skipped` | (none) |
| `rolled-back` | `--prev-tag` |

Missing required flags → print which one and stop. Do not invent defaults for these.

### Step 2: Resolve defaults

For `start`:

```bash
HEAD_SHA="${ARG_HEAD_SHA:-$(git rev-parse --short HEAD)}"
TARGET_URL="${ARG_TARGET_URL:-https://shotloom.cinamon.io}"
DURATION_ESTIMATE="${ARG_DURATION_ESTIMATE:-15-20분 (image build ~13분 + ArgoCD sync ~3분 + pod roll ~1분)}"
FIRST_TAG_SUFFIX=""
[[ "$ARG_FIRST_TAG" == "1" ]] && FIRST_TAG_SUFFIX=" (첫 SemVer 태그)"
```

For `result`:

```bash
NOW_HM=$(date +%H:%M)
[[ -n "$ARG_START_ISO" ]] && ELAPSED_MIN=$(( ($(date +%s) - $(date -j -f "%H:%M" "$ARG_START_ISO" +%s)) / 60 ))
RELEASE_LINE="${ARG_RELEASE_URL:+- GitHub Release: $ARG_RELEASE_URL}"
```

### Step 3: Render the draft

`start` template (verbatim shape — match v0.1.2 exactly):

```
Shotloom $VERSION 배포 시작$FIRST_TAG_SUFFIX.

- HEAD: $HEAD_SHA
- 워크플로: $WORKFLOW_URL
- 변경: $COMMITS commits
- 예상 소요: $DURATION_ESTIMATE
- URL: $TARGET_URL
```

`result` template — pick exactly one ETag/state line:

```
Shotloom $VERSION 배포 결과: <상태>

- ETag: $ETAG_FROM → $ETAG_TO  (rolled — proxy verification passed)
   | 변하지 않음 — ArgoCD UI 또는 kubectl rollout status deploy/shotloom-web -n internal-service 확인 필요
   | 사전 ETag 없어 verification 스킵
   | 503 발생, $PREV_TAG 로 롤백됨
- 소요: HH:MM → HH:MM (≈X분)        # only if --start-iso provided
- prototype-manifest commit: $MANIFEST_COMMIT
- GitHub Release: $RELEASE_URL       # only if --release-url provided
```

State → terminal-state line mapping:

| `--state` | First bullet line |
|---|---|
| `rolled` | `ETag: $ETAG_FROM → $ETAG_TO  (rolled — proxy verification passed)` |
| `timed-out` | `ETag: 변하지 않음 — ArgoCD UI 또는 kubectl rollout status deploy/shotloom-web -n internal-service 확인 필요` |
| `skipped` | `ETag: 사전 ETag 없어 verification 스킵` |
| `rolled-back` | `ETag: 503 발생, $PREV_TAG 로 롤백됨` |

### Step 4: Approval prompt (skipped when `--no-confirm`)

Render the resolved draft + target context. Prompt:

```
대상 채널: <#team_channel from slack.json> (Arnyang)
[start] 또는 [result thread reply on TS=$THREAD_TS]

<rendered message>

이대로 보낼까요? (y / 수정 / 취소)
```

Wait for explicit `y`. `수정` → ask for the changed field, re-render, prompt again. `취소` → exit without send.

### Step 5: Send via cci-send-alert

```bash
if [[ "$PHASE" == "start" ]]; then
  resp=$(python3 ~/.claude/skills/cci-send-alert/send.py "$RENDERED_MESSAGE")
else
  resp=$(python3 ~/.claude/skills/cci-send-alert/send.py "$RENDERED_MESSAGE" --thread-ts "$THREAD_TS")
fi
ok=$(jq -r '.ok' <<<"$resp")
ts=$(jq -r '.ts // empty' <<<"$resp")
```

On `ok=true`:
- `start` → return the `ts` to the caller (print as `start_ts=$ts` line so a calling skill can capture).
- `result` → confirm thread post.

On `ok=false`: surface the Slack API error verbatim. Common errors:

| `error` field | Fix |
|---|---|
| `not_in_channel` | invite `@아르리므` to the channel first |
| `channel_not_found` | wrong channel id in `slack.json` |
| `invalid_auth` / `token_revoked` | `~/.claude/config/.env` `SLACK_BOT_TOKEN` rotated; refresh from 1Password |
| `missing_scope` | bot needs `chat:write` (start) — check `cci-send-alert/SKILL.md` for the canonical scope list |

### Step 6: Report

One line back to the user:

```
Sent: ts=<ts>  channel=<C…>  phase=<start|result>  thread=<ts or n/a>
```

For `start`, also print:

```
start_ts=<ts>     # capture this for the result thread reply
```

## Examples

Full deploy round-trip (mirrors what `/shotloom-deploy-web --for-real` did at v0.1.2):

```bash
# Step 7 of shotloom-deploy-web (start):
/shotloom-send-deploy-status start \
  --version v0.1.2 \
  --workflow-url https://github.com/CINEV/shotloom/actions/runs/25538944802 \
  --commits 601 \
  --first-tag

# captured: start_ts=1778219291.167679

# Step 9 of shotloom-deploy-web (result, after 503 + rollback):
/shotloom-send-deploy-status result \
  --version v0.1.2 \
  --thread-ts 1778219291.167679 \
  --state rolled-back \
  --prev-tag v0.1.1-test \
  --manifest-commit "8b58839 chore(shotloom): rollback web image to v0.1.1-test"
```

Successful rolled deploy (hypothetical):

```bash
/shotloom-send-deploy-status result \
  --version v0.1.3 \
  --thread-ts 1778219291.167679 \
  --state rolled \
  --etag-from "69fbe8a2-32d" \
  --etag-to "abc12345-2e0" \
  --start-iso 14:55 \
  --manifest-commit "9c3a7d1 chore(shotloom): update web image tag" \
  --release-url https://github.com/CINEV/shotloom/releases/tag/v0.1.3
```

## When to use this skill instead of cci-send-alert directly

- This skill: Shotloom deploy round-trip with the canonical templates locked.
- `cci-send-alert` directly: ad-hoc CINEV team-channel messages, art-branch announcements, anything outside the deploy template.

If you're inside `/shotloom-deploy-web --for-real`, prefer this skill — the skill exists so the deploy flow does not embed the literal message string twice in two places.

## Related

- `~/.claude/skills/cci-send-alert/SKILL.md` — underlying send mechanism (`team_channel`, `SLACK_BOT_TOKEN` from `~/.claude/config/.env`)
- `~/.claude/skills/shotloom-deploy-web/SKILL.md` — primary caller (Steps 7 + 9)
- `~/.claude/rules/slack.md` — per-message approval gate
- `~/.claude/config/slack.json` — `team_channel`, `team_bot_username`
