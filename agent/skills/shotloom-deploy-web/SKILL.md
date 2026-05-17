---
description: Deploy, verify, rollback, and diagnose CINEV/shotloom web image through its GitHub Actions image build and the GitOps prototype-manifest rollout. Default mode is dry-run; --for-real ships a SemVer git tag that lets ArgoCD roll the cluster.
argument-hint: "[--for-real] [--smoke] [--version vX.Y.Z]"
allowed-tools: Read, Write, Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(pnpm:*), Bash(date:*), Bash(test:*), Bash(grep:*), Bash(sort:*), Bash(awk:*), Bash(sed:*), Bash(curl:*), Bash(sleep:*), Bash(mktemp:*), Bash(python3:*)
domains: rust,web
repo-keys: shotloom
languages: css,rust,typescript
frameworks: bevy,wgpu
task-types: deploy
context-profile: shotloom-deploy
exclude-when: unreal,obsidian
---

# shotloom-deploy-web

Deploy the Shotloom web editor image built by `CINEV/shotloom` and roll it forward through `CINEV/prototype-manifest`. ArgoCD (`shotloom-web` Application in the `argocd` namespace, `syncPolicy.automated.selfHeal: true`) reconciles the cluster from manifest changes.

| Mode | Trigger | Cluster impact |
|---|---|---|
| **dry-run** (default) | `gh workflow run build-web-image.yml -f publish=false` | none — image lands at `docker.cinamon.me` but `prototype-manifest` is NOT touched |
| **for-real** (`--for-real`) | `git tag vX.Y.Z && git push origin vX.Y.Z` | image build + manifest update → ArgoCD rolls the cluster |

The skill never escalates from dry-run to for-real silently. Do NOT push directly to `CINEV/shotloom@main`; the production path is the workflow above.

## Operating Model

Apply in order, every invocation:

1. **Protect the live site.** A working production trumps a new release. Never deploy a fix that has not landed on `main`.
2. **Reproduce state with direct checks.** Read the remote manifest, hit the live URL, list recent runs/tags before issuing any state change.
3. **PR-before-deploy when code must change.** If the deploy blocker requires a source fix, file the PR (with Linear issue) and merge to `main` first. Do not tag an image built from an unmerged branch.
4. **Build + push the image.** Workflow `build-web-image.yml`.
5. **Update the GitOps manifest.** Workflow does this automatically when healthy; fall through to the workaround path when the known masking issue fires.
6. **Verify the live URL.** Curl the production URL; on `503`, roll back FIRST, then diagnose.
7. **Report exact evidence + handoff.** Slack thread, Obsidian devlog, Linear update if a tracker exists.

## Arguments

- `--for-real` — flip from dry-run (workflow_dispatch + `publish=false`) to a tag-triggered release. Required for any cluster-affecting deploy.
- `--smoke` — additionally run `pnpm test:web-runtime` locally before triggering. Headless Chrome + WebGPU renders the wasm engine and asserts non-trivial pixels. Adds ~1-2 min.
- `--version vX.Y.Z` — override the auto-suggested next version. Format: `v` + SemVer. Without this flag the skill reads the latest `v*` tag and proposes the next patch.

If no argument: dry-run, no smoke, suggest next patch.

## Binding rules (CRITICAL)

- **`--for-real` requires explicit per-invocation final approval.** Per `~/.claude/rules/git-defaults.md`, the skill stops one beat before `git push origin vX.Y.Z` and waits for `y`, even when `--for-real` is on the command line.
- **No silent re-tag.** If a tag with the chosen version already exists locally or on origin, abort. Tags are immutable in GitOps.
- **`gh` account must be `tomlim2`.** Confirm with `gh auth status`. Fail loudly otherwise.
- **Working tree clean and on `main`.** Deploy from a feature branch is meaningless.
- **Local `main` in sync with `origin/main`.** Auto-`git fetch`, then refuse if behind.
- **HEAD's CI must be green.** Refuse to deploy a red SHA.
- **Never claim cluster rollout health without cluster tooling.** ETag-based proxy verification confirms a roll happened — not that pods are healthy. State the partial signal plainly; "GitOps manifest updated" and "live URL returned 200" are the only honest claims this skill earns from `gh` + `curl` alone.
- **Slack sends are per-message gated** per `~/.claude/rules/slack.md`. Draft + show + wait for explicit `y`. No bundled approval covers a second message.

## Workflow

### Step 1: Preflight (cwd, account, branch, sync, tree, baselines)

```bash
cd "$(bash ~/.claude/skills/ah-resolve-doc-path/resolve.sh repo shotloom | awk -F= '/^RESOLVED_PATH=/{print $2; exit}')"
toplevel=$(git rev-parse --show-toplevel)
remote=$(git -C "$toplevel" remote get-url origin)
case "$remote" in *CINEV/shotloom*|*CINEV/shotloom.git) ;; *) abort ;; esac

gh auth status 2>&1 | grep -q "Active account: true" \
  && gh auth status 2>&1 | grep -q "tomlim2" || abort "gh account must be tomlim2"

git rev-parse --abbrev-ref HEAD | grep -qx main || abort "must deploy from main"
git status --porcelain | head -1 | grep -q . && abort "working tree not clean"

git fetch origin main --tags
[[ "$(git rev-list --count main..origin/main)" == 0 ]] || abort "local main behind origin/main; pull first"
```

Read deploy state (no mutation):

```bash
gh run list --workflow build-web-image.yml --limit 10
git tag --list 'v*' --sort=-version:refname | head -5
git log -1 --oneline --decorate

# Current manifest image (the cluster's canonical state)
gh api repos/CINEV/prototype-manifest/contents/shotloom/deployment.yaml \
  --jq '.content | gsub("\n"; "") | @base64d' | grep "image:"

# Live URL baseline + ETag snapshot for Step 8b proxy check
PROD_URL="https://shotloom.cinamon.io"
curl -i -m 10 "$PROD_URL/" | head -10
PRE_ETAG=$(curl -sI -m 10 "$PROD_URL/" | awk -F'"' '/^[Ee][Tt][Aa][Gg]:/ {print $2; exit}')
```

If `PRE_ETAG` is empty (URL unreachable), surface a warning and ask whether to continue without post-deploy proxy verification — do NOT abort, since the deploy can still succeed.

If `WORKFLOW.md` documents deploy procedure, read it for any repo-specific override:

```bash
[[ -f WORKFLOW.md ]] && sed -n '148,220p' WORKFLOW.md
```

### Step 2: HEAD CI must be green

```bash
sha=$(git rev-parse HEAD)
gh api "repos/CINEV/shotloom/commits/$sha/check-runs" --jq '[.check_runs[] | .conclusion] | unique'
```

All non-null conclusions must be in `{success, skipped, neutral}`. Refuse to proceed otherwise.

### Step 3: Resolve next version

```bash
latest=$(git tag -l "v*" --sort=-version:refname | head -1)
if [[ -z "$latest" ]]; then
  next="v0.0.1"
else
  IFS='.' read -r major minor patch <<<"${latest#v}"
  next="v${major}.${minor}.$((patch + 1))"
fi
```

When `--version` is passed, validate `^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$` (workflow's own check is identical). Otherwise propose `next` and wait for confirmation.

If a tag with the chosen version already exists (`git tag -l "$version"` non-empty OR `gh api repos/CINEV/shotloom/git/refs/tags/$version` returns 200), abort. Never re-tag.

### Step 4: Show the deploy diff

```bash
prev_tag=$(git tag -l "v*" --sort=-version:refname | head -1)
range="${prev_tag:+${prev_tag}..}HEAD"
git log --oneline "$range" | head -50
git rev-list --count "$range"
```

Surface count + list. Ask user to continue before any registry / cluster impact.

### Step 5: Optional smoke test (`--smoke`)

```bash
pnpm test:web-runtime
```

On failure, abort. Without `--smoke`, document the omission in Step 11 report.

### Step 6: Dispatch

#### Step 6a: dry-run path (no `--for-real`)

```bash
gh workflow run build-web-image.yml \
  --ref main \
  -f version="$version" \
  -f publish=false
sleep 5
run_id=$(gh run list -w build-web-image.yml -L 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$run_id" --exit-status
gh run view "$run_id" --json conclusion,status,url,headSha,createdAt,updatedAt
```

On success, report image URL + suggest the for-real next step. Stop here — dry-run never tags, never pushes.

#### Step 6b: for-real path — FINAL APPROVAL GATE

When `--for-real` is set:

```
이제 git tag $version + git push origin $version 실행합니다.
Tag push 가 트리거하면 이미지 빌드 → 매니페스트 갱신 → ArgoCD 가 사내 클러스터 배포까지 자동 진행됩니다.
Rollback 은 prototype-manifest 의 image SHA 되돌리는 방식입니다.
정말 진행할까요? (y / 아니오)
```

Wait for explicit `y`. On `y`:

```bash
git tag "$version"
git push origin "$version"

# Capture the workflow run that the tag push triggered
for _ in {1..15}; do
  run_id=$(gh run list -w build-web-image.yml -e push -L 1 --json databaseId,headSha \
    --jq ".[] | select(.headSha==\"$(git rev-parse HEAD)\") | .databaseId" | head -1)
  [[ -n "$run_id" ]] && break
  sleep 2
done
workflow_url="https://github.com/CINEV/shotloom/actions/runs/$run_id"
```

### Step 7: Slack 시작 알림 (for-real only)

Delegate to `/shotloom-send-deploy-status start` — that skill owns the canonical Korean template + per-message approval gate. The skill returns `start_ts=<ts>`; capture it for Step 9's thread reply.

```
/shotloom-send-deploy-status start \
  --version $version \
  --workflow-url $workflow_url \
  --commits <commits_count> \
  [--first-tag]                # only when prev_tag is empty
```

Do NOT inline the message string here — the template lives in one place (`shotloom-send-deploy-status/SKILL.md`) so a future tone change updates one file, not two. On send failure, surface and continue — missing notification does not block the release.

### Step 8: Watch + verify

#### Step 8a: Watch the workflow

```bash
gh run watch "$run_id" --exit-status || true
gh run view "$run_id" --json conclusion,status,jobs --jq '{conclusion, status, jobs: [.jobs[] | {name, conclusion}]}'
```

Decision matrix:

| Outcome | Next |
|---|---|
| Both jobs `success` | continue Step 8b (manifest verify) |
| `Build and push web image` success, `Update prototype manifest` failure with `resolved empty image` in logs | known masking issue → Step 8d (workaround path) |
| `Build and push web image` failure | abort, surface failing job log; image is not in registry, nothing to roll back |

#### Step 8b: Manifest commit verification (success path only)

```bash
gh api repos/CINEV/prototype-manifest/contents/shotloom/deployment.yaml \
  --jq '.content | gsub("\n"; "") | @base64d' | grep "image:"
gh api repos/CINEV/prototype-manifest/commits --jq '.[0] | {sha, message: .commit.message, date: .commit.committer.date}'
```

The manifest's `image:` line must point at `docker.cinamon.me/cinamon/shotloom-web:$version`. The latest commit on `prototype-manifest@main` should reference the new tag. Surface mismatch as a warning.

ArgoCD Application reference (for the user's UI escalation):

```
Application: shotloom-web (namespace: argocd)
  source: CINEV/prototype-manifest @ main, path: shotloom
  destination: namespace internal-service
```

#### Step 8c: Live failure triage — 503 = ROLL BACK FIRST, diagnose later

```bash
curl -i -m 10 "$PROD_URL/" | head -10
```

If response is **`503 Service Unavailable`** (Envoy upstream connection refused), treat as upstream pod/container startup failure, not a browser-side issue. Immediate response order:

1. Read current remote manifest (Step 8b query).
2. Roll back to last known good image — see Rollback Path below.
3. Push the rollback manifest commit.
4. Poll the live URL until `200 OK`.
5. THEN diagnose the failed image (see Known Runtime Failures + Step 8d's workaround tooling).

If response is `200 OK`, continue Step 8d (proxy verification).

#### Step 8d: Cluster rolling-update verification (proxy)

Production exposes no hard version stamp (no `/version`, no `/healthz`, no `<meta name="app-version">`). The ETag of `/` is the proxy: it changes when the bundle hash changes, which happens when ArgoCD restarts the pod with the new image. ETag changes on every rebuild, not specifically on a tag — strong proxy during the alpha single-deployer cadence.

```bash
DEADLINE=$(( $(date +%s) + 300 ))
NEW_ETAG=""
while [[ $(date +%s) -lt $DEADLINE ]]; do
  cur=$(curl -sI -m 10 "$PROD_URL/" | awk -F'"' '/^[Ee][Tt][Aa][Gg]:/ {print $2; exit}')
  if [[ -n "$cur" && "$cur" != "$PRE_ETAG" ]]; then NEW_ETAG="$cur"; break; fi
  sleep 15
done
```

Three terminal states:

| State | Output |
|---|---|
| `NEW_ETAG` differs from `PRE_ETAG` | "Cluster rolled (ETag $PRE_ETAG → $NEW_ETAG); proxy verification passed." |
| Loop exited at deadline, `NEW_ETAG` empty | "ETag unchanged after 5 min; check ArgoCD `shotloom-web` (namespace argocd) or `kubectl rollout status deploy/shotloom-web -n internal-service`." |
| `PRE_ETAG` was empty in Step 1 | "Pre-deploy ETag unreachable; skipping post-deploy proxy verification. Manual check: `curl -I $PROD_URL/`." |

This is verification only — no retries, no auto-rollback, no paging. Surfaces state.

#### Step 8e: Workaround path — workflow `outputs.image` masking

When Step 8a hits the known masking issue, the image IS in the registry but the manifest job aborted with `resolved empty image`. Build the image without touching the manifest only if Step 6a/6b workflow run already succeeded for the build-push job. Then update the manifest by hand:

```bash
tmpdir="$(mktemp -d /private/tmp/shotloom-manifest.XXXXXX)"
git clone https://github.com/CINEV/prototype-manifest.git "$tmpdir/prototype-manifest"
cd "$tmpdir/prototype-manifest"

# Edit the single image line. Verify the diff is exactly that line before committing.
sed -i '' "s|image: \"docker.cinamon.me/cinamon/shotloom-web:[^\"]*\"|image: \"docker.cinamon.me/cinamon/shotloom-web:$version\"|" shotloom/deployment.yaml
git diff -- shotloom/deployment.yaml

git add shotloom/deployment.yaml
git commit -m 'chore(shotloom): update web image tag'
git push origin HEAD:main
```

Resume Step 8b (manifest verify) → 8c (live triage) → 8d (proxy poll) on the manual commit.

The structural fix is to change `.github/workflows/build-web-image.yml` so the manifest job derives the image from `IMAGE_WEB` and `needs.build-push.outputs.tag` instead of taking the full `image` as a job output (GitHub may suppress it for secret-leak reasons). Track as a separate PR.

### Step 9: GitHub Release + Slack 결과 알림 (for-real only)

```bash
release_url=$(gh release create "$version" --generate-notes --title "$version" \
  ${prev_tag:+--notes-start-tag "$prev_tag"})
```

Then delegate the thread-reply to `/shotloom-send-deploy-status success` — same canonical template, same per-message approval gate, same `cci-send-alert` underneath. Use this only when Step 7 returned `start_ts`.

```
/shotloom-send-deploy-status success \
  --version $version \
  --thread-ts $start_ts \
  --etag-from "$PRE_ETAG" \
  --etag-to "$NEW_ETAG" \
  --manifest-commit "<sha + short subject>" \
  --release-url "$release_url" \
  --target-url "$PROD_URL"
```

If `start_ts` is empty because Step 7 was skipped or failed, do **not** silently omit Slack. Use the fallback:

1. Draft a top-level message through `/cci-send-alert` with the release tag, source short SHA, workflow URL, image, manifest commit, live URL result, ETag result, and patch-note document URL.
2. Show the full draft and wait for explicit `y` under the per-message Slack gate.
3. Send it as a top-level channel message.
4. In Step 11, state that the normal threaded deploy notification could not be used because no start thread existed.

### Step 10: Devlog append (Obsidian)

```bash
base=$(jq -re '.obsidian // .["obsidian-staging"]' \
  ~/.claude/private/agent-hub-config/machine-paths.json)
devlog="$base/projects/shotloom/days/$(date +%Y-%m-%d).md"
```

Bullets are the audit trail; one Korean paragraph above is fine. For dry-run vs for-real templates see reference (workflow URL, image URL, manifest commit, ETag transition or rollback, Release URL, manual smoke omission).

### Step 11: Report

Summarize in one paragraph + bullets:

- Shotloom source commit deployed (or attempted)
- Image tag and full image name (`docker.cinamon.me/cinamon/shotloom-web:$version`)
- Workflow run URL + per-job conclusion
- PR URL and Linear issue URL when a fix or follow-up exists
- prototype-manifest commit URL (auto OR manual)
- Exact manifest image verified remotely
- Live URL verification result (status code, ETag transition, key error text)
- Rollback events if any
- Any remaining failed runs / checks needing followup

Honesty rules:
- "GitOps manifest updated" — only after the remote `gh api ... contents` returns the new image.
- "Live URL returned 200" — only after `curl -i` confirmed.
- "Cluster rollout healthy" — only with cluster tooling output (`kubectl` or ArgoCD CLI). Never claim it from manifest+HTTP alone.
- If Step 8a/8b warned and Step 8d timed out, report partial state plainly.

## Rollback Path

Use when live traffic is broken or a new image cannot be proven good.

```bash
tmpdir="$(mktemp -d /private/tmp/shotloom-rollback.XXXXXX)"
git clone https://github.com/CINEV/prototype-manifest.git "$tmpdir/prototype-manifest"
cd "$tmpdir/prototype-manifest"

# Restore the last known good tag (e.g. v0.1.1-test). Verify the diff is one line.
sed -i '' "s|image: \"docker.cinamon.me/cinamon/shotloom-web:[^\"]*\"|image: \"docker.cinamon.me/cinamon/shotloom-web:<lastknown>\"|" shotloom/deployment.yaml
git diff -- shotloom/deployment.yaml

git add shotloom/deployment.yaml
git commit -m 'chore(shotloom): roll back web image tag'
git push origin HEAD:main
```

Verify:

```bash
gh api repos/CINEV/prototype-manifest/contents/shotloom/deployment.yaml \
  --jq '.content | gsub("\n"; "") | @base64d' | grep "image:"
curl -i "$PROD_URL/" | head -5
```

Image tags themselves are NOT deleted — only the manifest pointer moves. Bad tag stays in the registry, abandoned.

## PR + Linear gate (when a code fix is needed first)

If the deploy blocker requires a source change in `CINEV/shotloom`:

1. File the Linear issue first (team `STL`, project `Shotloom - alpha`, Korean body, title `type(scope): summary`, sections `문제 정의` / `acceptance criteria` / `영향 모듈/디렉터리`, explicit `P1/P2/P3/P4`).
2. Open the PR. Issue linkage:
   - `Resolves STL-NN` only when the PR fully completes the issue.
   - `Part of STL-NN` when deploy/verify/follow-up remains.
3. Merge to `main`.
4. Then re-enter this skill from Step 1 for the new HEAD.

For deploy-recovery work that includes "merge PR + rebuild image + update manifest + verify URL", a code-only PR is `Part of`, not `Resolves`.

## Known issues

### Workflow `outputs.image` masking

Symptom: `Update prototype manifest` job fails with `##[error]resolved empty image` despite `Build and push web image` succeeding. GitHub may suppress the `image` job output as suspected secret. Trigger so far observed: `push` event on tag (workflow_dispatch with `inputs.version` is unaffected).

Workaround: Step 8e — manual manifest commit. Structural fix: rewrite `.github/workflows/build-web-image.yml` to derive the manifest image inside the update-manifest job (`IMAGE="${IMAGE_WEB}:${{ needs.build-push.outputs.tag }}"`) instead of passing the full `image` URL through job outputs.

### Nonroot nginx pid path

Symptom: pod 503 on every request right after deploy. Container logs show:

```
open() "/run/nginx.pid" failed (13: Permission denied)
```

Cause: `nginx:1.29-alpine` writes its pid to `/run/nginx.pid`, not `/var/run/nginx.pid`. A Containerfile that drops to `USER nginx` after `sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|' /etc/nginx/nginx.conf` only relocates one of the two paths. The remaining `/run/nginx.pid` is unwritable by the `nginx` user, so nginx exits at startup → CrashLoop → ingress 503.

Expected `apps/editor/Containerfile` line:

```dockerfile
RUN sed -i -e 's|/var/run/nginx.pid|/tmp/nginx.pid|' \
           -e 's|/run/nginx.pid|/tmp/nginx.pid|' \
           /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /var/cache/nginx /usr/share/nginx/html
```

When debugging suspected runtime failures, reproduce locally with a minimal `docker build -f apps/editor/Containerfile -t shotloom-web:local .` + `docker run -p 8080:8080 ...` + `curl http://localhost:8080/`. If local nginx exits with the permission-denied signature, the cluster failure is the same root cause.

## Common failures + fixes

| Symptom | Fix |
|---|---|
| `tag $version already exists` | Pick the next patch — never `git tag -f`. |
| `local main behind origin/main` | `git pull --ff-only` then re-run. |
| `HEAD CI not green` | Wait or fix the check. Never deploy a red SHA. |
| `gh workflow run` returns no run_id within 30s | Check `gh run list -L 5`; if absent, re-trigger. |
| `Update prototype manifest` job: `resolved empty image` | Workflow output masking (above). Step 8e workaround. |
| Manifest commit shows new image but `curl /` is 503 | Pod startup failure. Step 8c rollback first, then Known Runtime Failures. |
| ArgoCD shows old image after manifest update | Watcher sync interval. Check ArgoCD UI / wait its poll cycle. Out of scope for this skill. |

## Related

- `.github/workflows/build-web-image.yml` (in shotloom repo)
- `apps/editor/Containerfile`, `apps/editor/nginx.conf`
- `CINEV/prototype-manifest` — GitOps canonical source (`shotloom/deployment.yaml`, `applications/shotloom-web.yaml`)
- `~/.claude/rules/shotloom.md`, `~/.claude/rules/git-defaults.md`, `~/.claude/rules/slack.md`
- `~/.claude/skills/cci-send-alert/` — Slack send tooling (`team_channel` from `~/.claude/config/slack.json`)
