---
description: Deploy Shotloom web image to docker.cinamon.me — dry-run by default, --for-real ships a SemVer git tag and lets GitOps roll the cluster.
argument-hint: "[--for-real] [--smoke] [--version vX.Y.Z]"
allowed-tools: Read, Write, Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(pnpm:*), Bash(date:*), Bash(test:*), Bash(grep:*), Bash(sort:*), Bash(awk:*), Bash(sed:*), Bash(curl:*), Bash(sleep:*)
---

# shotloom-deploy-web

Two-mode wrapper around `.github/workflows/build-web-image.yml`:

| Mode | Trigger | Cluster impact |
|---|---|---|
| **dry-run** (default) | `gh workflow run build-web-image.yml -f publish=false` | none — image is built and pushed to `docker.cinamon.me` but `prototype-manifest` is NOT updated |
| **for-real** (`--for-real`) | `git tag vX.Y.Z && git push origin vX.Y.Z` | image build + `prototype-manifest/shotloom/deployment.yaml` rewrite → GitOps watcher rolls the cluster |

The skill never escalates from dry-run to for-real silently — `--for-real` must be explicit on the invocation.

## Arguments

- `--for-real` — flip from dry-run (workflow_dispatch + `publish=false`) to a tag-triggered release. Required for any cluster-affecting deploy.
- `--smoke` — additionally run `pnpm test:web-runtime` locally before triggering the workflow / pushing the tag. Headless Chrome captures a render of the wasm engine and asserts non-trivial pixels. Adds ~1-2 min.
- `--version vX.Y.Z` — override the auto-suggested next version. Format: `v` + SemVer. Without this flag the skill reads the latest `v*` tag, suggests the next patch (or `v0.0.1` if no prior tag), and asks for user confirmation.

If no argument: dry-run, no smoke, suggest next patch.

## Binding rules (CRITICAL)

- **`--for-real` is a state-changing PR action equivalent.** It pushes a git tag that triggers cluster deploy. Per `~/.claude/rules/git-defaults.md`, this requires explicit per-invocation user approval shown as the final confirmation gate (Step 7). Even with `--for-real` on the command line, the skill stops one beat before `git push origin vX.Y.Z` and waits for `y`.
- **No silent re-tag.** If a tag with the chosen version already exists (locally or on origin), abort and surface — never `git tag -f` or delete-and-recreate. Tags are immutable in GitOps.
- **`gh` account must be `tomlim2`.** Confirm with `gh auth status` before any `gh workflow run` / `git push`. Fail loudly on `deemotl` or any other active account.
- **Working tree must be clean and on `main`.** Deploy from a feature branch is meaningless (the workflow re-checks out the tag's SHA, but the tag must point at a `main` commit for the GitOps manifest write to make sense).
- **Local `main` must be in sync with `origin/main`.** A stale local main produces a tag pointing at a SHA that's behind what the workflow's runner sees — confusing release notes, wrong image content. Auto-`git fetch` then refuse if `git rev-list --count main..origin/main > 0`.
- **HEAD's CI must be green on origin/main.** A red CI on the SHA we're about to tag means the tag points at code that didn't pass the gates. Refuse to deploy until it's green.

## Workflow

### Step 1: Sanity (cwd, account, branch, sync, tree)

```bash
cd /Users/deemooooooooo/Desktop/www/shotloom-github   # or via repo-paths.json
toplevel=$(git rev-parse --show-toplevel)
remote=$(git -C "$toplevel" remote get-url origin)
case "$remote" in *CINEV/shotloom*|*CINEV/shotloom.git) ;; *) abort ;; esac

gh auth status 2>&1 | grep -q "Active account: true" \
  && gh auth status 2>&1 | grep -q "tomlim2"  || abort "gh account must be tomlim2"

git rev-parse --abbrev-ref HEAD | grep -qx main || abort "must deploy from main, not <branch>"
git status --porcelain | head -1 | grep -q . && abort "working tree not clean"

git fetch origin main --tags
[[ "$(git rev-list --count main..origin/main)" == 0 ]] || abort "local main is behind origin/main; pull first"
```

Resolve the worktree from cwd, not from `repo-paths.json`. The deploy must run against the main checkout's `main` branch — never from a feature worktree.

Snapshot the production page's `ETag` so Step 8b can detect a rolling update by diff:

```bash
PROD_URL="https://shotloom.cinamon.io"
PRE_ETAG=$(curl -sI -m 10 "$PROD_URL/" | awk -F'"' '/^[Ee][Tt][Aa][Gg]:/ {print $2; exit}')
```

If `PRE_ETAG` is empty (URL unreachable, network down, prod cluster ingress failing), surface a warning and ask the user whether to continue without post-deploy verification — do NOT abort, since the deploy itself can still succeed and the user can verify manually later.

### Step 2: HEAD CI must be green

```bash
sha=$(git rev-parse HEAD)
status=$(gh api "repos/CINEV/shotloom/commits/$sha/check-runs" --jq '[.check_runs[] | .conclusion] | unique')
# All non-null conclusions must be in {success, skipped, neutral}.
```

Refuse to proceed if any check is `failure`, `cancelled`, `timed_out`, `action_required`, or still in progress (`null` conclusion). Surface the failing check with a link to its logs.

This is the load-bearing safety check — without it, a tag could ship code that didn't pass gates.

### Step 3: Resolve next version

```bash
latest=$(git tag -l "v*" --sort=-creatordate | head -1)
if [[ -z "$latest" ]]; then
  next="v0.0.1"
else
  # bump patch: v0.1.5 → v0.1.6
  IFS='.' read -r major minor patch <<<"${latest#v}"
  next="v${major}.${minor}.$((patch + 1))"
fi
```

When `--version` is passed, validate the SemVer-with-`v`-prefix format up front. Otherwise propose `next` and ask for confirmation:

> 다음 버전: `v0.0.X` (직전 release: `v0.0.<X-1>`). 이대로 진행할까요? 다른 버전 원하면 답에 적어주세요.

If a tag with the chosen version already exists (`git tag -l "$version"` non-empty OR `gh api repos/CINEV/shotloom/git/refs/tags/$version` returns 200), abort. Never re-tag.

### Step 4: Show the deploy diff

Always print the commit log between the previously-deployed tag (or repo start if none) and the SHA we're about to tag:

```bash
prev_tag=$(git tag -l "v*" --sort=-creatordate | head -1)
if [[ -n "$prev_tag" ]]; then
  range="${prev_tag}..HEAD"
else
  range="HEAD"
fi
git log --oneline "$range"
```

Surface the count + the list. Ask:

> N 개 커밋이 이번 release 에 들어갑니다 (위 목록). 계속할까요?

User can review the scope before any registry / cluster impact.

### Step 5: Optional smoke test (`--smoke`)

When `--smoke` is set:

```bash
pnpm test:web-runtime
```

This runs `pnpm build:wasm` then headless Chrome via Puppeteer, captures a render of the wasm engine, and asserts non-trivial pixels. Adds ~1-2 min. On failure, abort the deploy — local smoke catching a render regression is the cheapest possible save.

Without `--smoke`, document the omission in the user-facing summary so the user knows the local smoke gate did not run.

### Step 6: Dispatch (dry-run path)

When **no `--for-real`**:

```bash
gh workflow run build-web-image.yml \
  -f version="$version" \
  -f publish=false
```

This triggers the build-push job only. Image lands at `docker.cinamon.me/cinamon/shotloom-web:$version`. **`prototype-manifest` is NOT touched, cluster is NOT updated.**

After the workflow_dispatch returns, capture the `run_id`:

```bash
sleep 5  # let GitHub register the run
run_id=$(gh run list -w build-web-image.yml -L 1 --json databaseId --jq '.[0].databaseId')
```

Watch + report:

```bash
gh run watch "$run_id" --exit-status
```

On success, report the registry URL + suggest the next step (`/shotloom-deploy-web --for-real --version $version` to actually ship). On failure, surface the failing job's log link.

Stop here — dry-run never tags, never pushes.

### Step 7: Tag + push (for-real path) — FINAL APPROVAL GATE

When **`--for-real`** is set:

1. Final confirmation prompt (mandatory, no shortcut):

   > 이제 `git tag $version` + `git push origin $version` 실행합니다.
   > Tag push 가 트리거하면 사내 클러스터 배포까지 자동 진행됩니다 (rollback 은 prototype-manifest 의 image SHA 를 되돌려야 함).
   > 정말 진행할까요? (y / 아니오)

   Wait for explicit `y`. Anything else aborts.

2. On `y`:

   ```bash
   git tag "$version"
   git push origin "$version"
   ```

3. Capture the workflow run that the tag push triggered (poll for ~30s, since tag-triggered runs take a moment to register):

   ```bash
   for _ in {1..15}; do
     run_id=$(gh run list -w build-web-image.yml -e push -L 1 --json databaseId,headSha \
       --jq ".[] | select(.headSha==\"$(git rev-parse HEAD)\") | .databaseId" | head -1)
     [[ -n "$run_id" ]] && break
     sleep 2
   done
   ```

4. Watch + report:

   ```bash
   gh run watch "$run_id" --exit-status
   ```

5. On success, also create a GitHub Release with auto-generated notes (covers Q6 — team-visible durable record):

   ```bash
   gh release create "$version" --generate-notes \
     --title "$version" \
     --notes-start-tag "$prev_tag"
   ```

   `--generate-notes` pulls the merged-PR list between `prev_tag..$version` into a structured release body — costs nothing, archives forever, team can find it on GitHub Releases.

### Step 8a: Manifest commit verification

After the workflow run completes (for-real path only), verify the GitOps manifest was actually updated:

```bash
gh api repos/CINEV/prototype-manifest/commits --jq '.[0].sha + " " + .[0].commit.message' | head -1
```

The latest commit on `prototype-manifest@main` should reference the new image tag (the workflow's update-manifest job uses a commit message that includes the tag). Surface it. If the latest commit there does not name the new tag, surface a warning — the workflow may have failed silently in its second job, or the manifest job was skipped.

The cluster Application that watches this manifest is `shotloom-web` in the `argocd` namespace (per `CINEV/prototype-manifest/applications/shotloom-web.yaml`, `syncPolicy.automated.selfHeal: true`). Surface the Application reference so the user can check the ArgoCD UI directly when needed:

```
ArgoCD Application: shotloom-web (namespace: argocd)
  spec.source: CINEV/prototype-manifest @ main, path: shotloom
  spec.destination: namespace internal-service
```

The ArgoCD UI hostname is internal — if the user has it set, it goes in `~/.claude/private/caol-config/machine-paths.json` under `argocd-ui` and the skill includes the link in the report.

### Step 8b: Cluster rolling-update verification (proxy)

Production serves no hard version stamp (no `/version`, no `/healthz`, no `<meta name="app-version">` in `index.html`). The closest available signal is the `ETag` of `/` — Vite emits a content-hashed bundle, nginx serves the index with an `ETag` derived from the file, and ArgoCD's roll restarts the pod with the new bundle. So a fresh ETag on `https://shotloom.cinamon.io/` within a few minutes of our manifest commit is a strong proxy for "our new image is now serving traffic."

Caveat: ETag changes on every rebuild, not specifically on a tag. If another deploy lands in the same window the ETag still flips but it could be theirs. Acceptable for the alpha period given the single-deployer cadence; revisit when the team adds a real version meta tag (and the skill upgrades to a hard version match).

Poll for up to 5 minutes at 15-second intervals:

```bash
PROD_URL="https://shotloom.cinamon.io"
DEADLINE=$(( $(date +%s) + 300 ))
NEW_ETAG=""
while [[ $(date +%s) -lt $DEADLINE ]]; do
  cur=$(curl -sI -m 10 "$PROD_URL/" | awk -F'"' '/^[Ee][Tt][Aa][Gg]:/ {print $2; exit}')
  if [[ -n "$cur" && "$cur" != "$PRE_ETAG" ]]; then
    NEW_ETAG="$cur"
    break
  fi
  sleep 15
done
```

Three terminal states to report:

| State | Meaning | Output |
|---|---|---|
| `NEW_ETAG` non-empty, differs from `PRE_ETAG` | Rolling update detected — strong proxy that our image is live | "Cluster rolled (ETag `$PRE_ETAG` → `$NEW_ETAG`); proxy verification passed." |
| Loop exited at deadline with `NEW_ETAG` empty | ArgoCD hasn't rolled yet, or roll failed | "Cluster ETag unchanged after 5 min; check ArgoCD Application `shotloom-web` in the `argocd` namespace, or inspect `kubectl rollout status deploy/shotloom-web -n internal-service`." |
| `PRE_ETAG` was empty in Step 1 (URL unreachable) | Skill cannot verify | "Pre-deploy ETag was unreachable; skipping post-deploy proxy verification. Manual check: `curl -I $PROD_URL/`." |

This is verification, not approval — the skill does not retry, does not roll back, does not page anyone. It surfaces state and lets the user decide.

### Step 9: Devlog append (Obsidian)

Resolve the devlog path:

```bash
base=$(jq -re '.["obsidian-vault-claude"] // .["obsidian-staging"]' \
  ~/.claude/private/caol-config/machine-paths.json)
devlog="$base/projects/shotloom/days/$(date +%Y-%m-%d).md"
```

Append a deploy entry. For dry-run:

```md
## $(date +%H:%M) — deploy dry-run $version

- Workflow run: <link>
- Image: docker.cinamon.me/cinamon/shotloom-web:$version
- Cluster: not affected (publish=false)
- Diff: N 커밋 (prev_tag..$version)
```

For for-real:

```md
## $(date +%H:%M) — deploy $version (for-real)

- Tag: $version → $(git rev-parse HEAD)
- Workflow run: <link>
- Image: docker.cinamon.me/cinamon/shotloom-web:$version
- prototype-manifest commit: <sha + message>
- GitHub Release: <url>
- Diff: N 커밋 (prev_tag..$version)
- Cluster verification (proxy): ETag `$PRE_ETAG` → `$NEW_ETAG` (rolled at HH:MM)
  | timed out after 5 min — manual check via ArgoCD `shotloom-web`
  | skipped — pre-deploy URL unreachable
```

Korean narrative one paragraph above the bullets is fine; bullets are the audit trail the user can grep later.

### Step 10: Report

One paragraph framing back to the user:

- What was deployed (or built, in dry-run)
- Where it landed (registry URL, manifest commit)
- Proxy verification outcome (Step 8b): rolled / timed out / skipped
- What's still on the user (rollback if needed, or hard verification via ArgoCD UI when the proxy times out)

Do NOT tell the user "deploy succeeded" if Step 8a's manifest verification surfaced a warning OR Step 8b's ETag poll timed out. State the partial state plainly — the user decides whether to escalate to ArgoCD UI / kubectl.

## Common failures + fixes

| Symptom | Fix |
|---|---|
| `tag $version already exists` | The version was already used. Pick the next patch — never `git tag -f`. |
| `local main is behind origin/main` | `git pull --ff-only` then re-run. |
| `HEAD's CI not green` | Wait or fix the check. Never deploy a red SHA. |
| `gh workflow run` returns no run_id within 30s | Workflow trigger may have been throttled. Check `gh run list -L 5` for the run; if absent, re-trigger. |
| `prototype-manifest` latest commit doesn't reference new tag | The workflow's update-manifest job either skipped (publish=false) or failed. Check the workflow's `update-manifest` job log. |
| Cluster shows old version after workflow success | GitOps watcher (ArgoCD/Flux) has its own sync interval. Check the watcher's UI / wait its poll cycle. Out of scope for this skill. |

## Rollback (out-of-band — not done by this skill)

Image tags are immutable in the registry; the rollback surface is the manifest:

1. Find the previous good image SHA in `CINEV/prototype-manifest/shotloom/deployment.yaml`'s git history.
2. Revert that file to the prior image tag (or `git revert` the bad commit).
3. Push to `prototype-manifest@main`. GitOps picks up the change and redeploys.

Tags themselves do NOT get deleted or re-pushed in normal operation.

## Related

- `.github/workflows/build-web-image.yml` (in shotloom repo) — the workflow this skill drives
- `apps/editor/Containerfile` (in shotloom repo) — how the image is built
- `CINEV/prototype-manifest` — GitOps source-of-truth for cluster state
- `~/.claude/rules/shotloom.md` — pre-PR / pre-deploy gates and identity rules
- `~/.claude/rules/git-defaults.md` — per-action approval policy
- `pnpm test:web-runtime` — local smoke test the `--smoke` flag drives
