# cci-art-branch Reference

Detailed procedures for each sub-command. The orchestrator (SKILL.md) routes here.

---

## Common Setup

### Resolve Repo Path

1. Read `config.json` → get `repo_key`
2. Read `~/.claude/private/caol-config/repo-paths.json` → look up path by key
3. All git commands use `git -C <repo_path>`

### Read State

1. Read `~/.claude/private/art-branches.json`
2. Find the `current` branch entry in `history`
3. Determine `state` (or infer if missing — see SKILL.md State Machine)

---

## `create`

Create a new weekly art branch from `origin/develop`.

### Step 1: Read art-branches.json

```bash
# Read current branch info
cat ~/.claude/private/art-branches.json
```

- Parse `current` branch name
- Auto-suggest next name: increment `-rN` suffix (e.g., `r4` → `r5`)
- Show suggestion, ask user to confirm or override

### Step 2: Fetch

```bash
git -C <repo_path> fetch --all
```

### Step 3: Create branch from remote develop

```bash
git -C <repo_path> checkout -b <new_branch> origin/develop
```

If branch already exists, report error and stop.

### Step 4: Cherry-pick remnant commits

Cherry-pick commits added to the old art branch AFTER the merge branch was created.

**CRITICAL: Use date-based approach, NOT SHA-based.** The merge branch is rebased, so SHAs differ from original art branch commits. SHA-based diff (`merge_branch_head..origin/<art_branch>`) returns ALL commits, not just remnants.

1. Read `merge_created_at` from the old (current) branch's history entry in `art-branches.json`
2. Find remnant commits:

```bash
git -C <repo_path> log origin/<current_branch> --after="<merge_created_at>" --reverse --format=%H
```

3. Cherry-pick each commit in order:

```bash
git -C <repo_path> cherry-pick <commit_hash>
```

**Conflict**: stop immediately, show conflicting commit hash and files, ask user.

**Skip conditions:**
- No `merge_created_at` (branch was never merged) → skip, new branch from develop is clean
- No commits found after the date → skip

### Step 5: Push

```bash
git -C <repo_path> push -u origin <new_branch>
```

### Step 6: Delete previous art branch from remote

**Safety check:** Step 4 should have already cherry-picked all remnants. Verify by re-running the same query:

```bash
git -C <repo_path> log origin/<current_branch> --after="<merge_created_at>" --oneline
```

If any un-cherry-picked commits remain (shouldn't happen), cherry-pick them now before deletion.

Then delete (with user confirmation):

```bash
git -C <repo_path> push origin --delete <current_branch>
```

### Step 7: Slack notification

```bash
# Preview
python ~/.claude/skills/cci-manage-art-branch/scripts/send_create.py <new_branch> --dry-run

# Send (after user confirmation)
python ~/.claude/skills/cci-manage-art-branch/scripts/send_create.py <new_branch>
```

Thread info is auto-saved to `~/.claude/private/slack_threads.json` by the script.

### Step 8: Update art-branches.json

1. Set `current` to new branch name
2. Add new entry to `history`:

```json
{
  "branch": "<new_branch>",
  "created_at": "2026-02-24",
  "state": "created",
  "merge_branch": null,
  "merge_branch_head": null,
  "merge_created_at": null
}
```

3. Update old current branch entry: set `state` to `archived`

---

## `merge-prep`

Prepare the current art branch for merging into develop.

### First merge vs 2nd+ merge

**CRITICAL:** The procedure differs depending on whether this is the first merge or a subsequent merge for the same art branch.

| Merge # | Method | Why |
|---------|--------|-----|
| 1st | Branch from art → rebase onto develop | All commits are new |
| 2nd+ | Branch from develop → cherry-pick new commits only | Previous merge branch was rebased, so commit hashes differ from art branch. Rebasing the full art branch again causes binary conflicts on already-merged .umap files. |

**How to determine merge number:** Check `merges[]` array in `art-branches.json`. If empty or missing, it's the 1st merge.

---

### Step 1: Fetch

```bash
git -C <repo_path> fetch --all
```

### Step 2: Checkout art branch

```bash
git -C <repo_path> checkout <current_branch>
git -C <repo_path> pull origin <current_branch>
```

### Step 3: Create merge branch

Derive name: `art/<versioning>` → `art/merge/<versioning>`

- 1st merge: `art/merge/art-main-1.5.0-r5`
- 2nd merge: `art/merge/art-main-1.5.0-r5-2`
- 3rd merge: `art/merge/art-main-1.5.0-r5-3`

#### For 1st merge (rebase method):

```bash
git -C <repo_path> checkout -b <merge_branch>
```

If branch already exists, ask user: delete and recreate, or abort.

#### For 2nd+ merge (cherry-pick method):

```bash
git -C <repo_path> checkout -b <merge_branch> origin/develop
```

Creates the merge branch directly from `origin/develop`.

### Step 4: Apply commits

#### For 1st merge: Rebase on origin/develop

```bash
git -C <repo_path> rebase origin/develop
```

If conflicts: show conflicting files, ask user, do NOT auto-resolve.

#### For 2nd+ merge: Cherry-pick new commits only

**IMPORTANT:** The previous merge branch was rebased onto develop, so its commit hashes differ from the original art branch commits. You CANNOT use `merge_branch_head` from `art-branches.json` to find new commits via `git log <hash>..<art-branch>` — they are on different lineages and the range will return ALL commits, not just new ones.

**Correct method — use `git cherry` with the local merge branch:**

The previous merge branch should still exist locally. Use it to find commits NOT yet represented:

```bash
# Find the previous local merge branch name from art-branches.json merges[] array
# e.g., art/merge/art-main-1.5.0-r5

# List commits in art branch NOT in the previous merge branch
git -C <repo_path> cherry -v <prev_merge_branch> origin/<current_branch>
```

This outputs `+` for commits not in the merge branch (truly new) and `-` for commits already represented (via rebase). Cherry-pick only the `+` commits:

```bash
git -C <repo_path> cherry-pick <hash1> <hash2> <hash3> ...
```

**Fallback if local merge branch was deleted:**

Match by commit message — find the tip commit message of the merge branch from git reflog or `art-branches.json` notes, locate the corresponding original commit on the art branch, then cherry-pick everything after it.

### Step 5: Push

```bash
# First push
git -C <repo_path> push -u origin <merge_branch>

# After rebase (force needed)
git -C <repo_path> push --force origin <merge_branch>
```

**LFS lock error handling:**

If push fails due to LFS locks:
1. Extract locked file paths from error
2. Unlock: `git -C <repo_path> lfs unlock --force <locked_file_path>`
3. Retry push
4. If still fails, stop and report

### Step 6: Update art-branches.json

Update the current branch entry:

```json
{
  "merge_branch": "<merge_branch>",
  "merge_branch_head": "<HEAD commit hash>",
  "merge_created_at": "<ISO 8601 KST>",
  "state": "merge_prepared"
}
```

Get HEAD hash:

```bash
git -C <repo_path> rev-parse HEAD
```

### Step 7: Validate merge branch

Run five checks before generating MR description.

#### Check 1: Source code changes

```bash
git -C <repo_path> diff origin/develop...<merge_branch> --name-only \
  | grep -E '\.(cpp|h|cs|py|js|ts|ini|cfg|json|xml|yaml|yml|toml|bat|sh|ps1)$'
```

- If any results: **WARN** — list files and ask user to confirm
- Art branches should only contain asset changes (.uasset, .umap, textures)

#### Check 2: Non-whitelist authors

```bash
git -C <repo_path> log origin/develop..<merge_branch> --format="%an" \
  | sort -u
```

Compare against `config.json` → `art_team_whitelist`.
- If unknown authors found: **WARN** — list names and their commits

#### Check 3: Redirectors

Search for `ObjectRedirector` in changed `.uasset` files:

```bash
# List changed .uasset files
git -C <repo_path> diff origin/develop...<merge_branch> --name-only \
  | grep '\.uasset$'

# For each file, binary grep for redirector signature
git -C <repo_path> show <merge_branch>:<file_path> \
  | grep -c "ObjectRedirector" 2>/dev/null
```

- If any redirectors found: **WARN** — list file paths
- Redirectors should be fixed up before merge

#### Check 4: Asset file sizes

Measure local file sizes of changed `.uasset` files. Report total size, file count, and top largest files.

```bash
git -C <repo_path> diff origin/develop...<merge_branch> --name-only \
  | grep '\.uasset$' \
  | while read f; do
      if [ -f "$f" ]; then
        sz=$(stat --printf="%s" "$f" 2>/dev/null)
        echo "$sz $f"
      fi
    done | sort -rn
```

- Show summary: file count, total MB, largest file size
- Show top 10 largest files
- No hard threshold — informational for reviewer awareness

#### Check 5: Asset naming convention

Check changed `.uasset` and `.umap` filenames against UE naming rules (see `standards/unreal/unreal-engine-asset.md`). This is a path-based check — no UE Editor needed.

Rules checked from filename:
- **ASCII_ONLY** (ERROR): No Korean, CJK, emoji, or non-ASCII characters
- **ALLOWED_CHARS** (ERROR): Only `[A-Za-z0-9_]` — no spaces, hyphens, dots
- **NO_DOUBLE_UNDERSCORE** (WARN): No consecutive `__`
- **NO_TRAILING_UNDERSCORE** (WARN): Name must not end with `_`

```bash
git -C <repo_path> diff origin/develop...<merge_branch> --name-only \
  | grep -E '\.(uasset|umap)$' \
  | while read f; do
      name=$(basename "$f" | sed 's/\.\(uasset\|umap\)$//')
      issues=""
      echo "$name" | grep -qP '[^\x00-\x7F]' && issues="${issues}ASCII_ONLY "
      echo "$name" | grep -qP '[^A-Za-z0-9_]' && issues="${issues}ALLOWED_CHARS "
      echo "$name" | grep -q '__' && issues="${issues}DOUBLE_UNDERSCORE "
      echo "$name" | grep -qP '_$' && issues="${issues}TRAILING_UNDERSCORE "
      [ -n "$issues" ] && echo "FAIL|$name|$issues|$f"
    done
```

- If any FAIL: **WARN** — list asset names and their violations
- PREFIX and PASCAL_CASE checks require UE Editor context (asset class), so are not checked here

#### Validation output

```
Merge Branch Validation
───────────────────────
[PASS] Source code changes: none
[WARN] Non-whitelist authors: deemo (2 commits)
[PASS] Redirectors: none
[PASS] Asset size: 334 files, 72.0 MB total (max 5.8 MB)
[PASS] Naming convention: 428 files checked, 0 violations
```

If any WARN, ask user whether to proceed or abort.

### Step 8: Generate MR description

**REQUIRED** — MR 스킬로 생성. Do NOT write manually.

**`/mr` 스킬은 회사에서 관리하는 외부 스킬**이므로 언제든 없어지거나 변경될 수 있다.

```
# 1. cci-make-mr 최신화 (회사 스킬 → 로컬 스킬에 반영)
/caol-update-skills cci-make-mr

# 2. MR 생성
/mr develop
```

**Fallback:** `/mr` 커맨드가 존재하지 않거나 실행 실패 시:
1. ⚠️ WARNING 출력: "`/mr` 스킬을 찾을 수 없습니다. `/cci-make-mr`로 진행합니다."
2. `/cci-make-mr develop`로 폴백 실행

After MR description is generated, override the title:

**MR Title Convention:**

| Case | Title |
|------|-------|
| First merge | `content(art): merge <branch> into develop` |
| 2nd+ merge | `content(art): merge <branch> into develop (#N)` |

- First merge has no suffix (implicit `#1`).
- Second merge onward uses `(#2)`, `(#3)`, etc.
- Count is per art branch (resets each week).

Show result to user for copy-paste into GitLab MR.

### Summary checklist

**All items must be shown. Do NOT skip any.**

```
merge-prep complete
───────────────────
Branch:     <merge_branch>
Based on:   <current_branch>
Rebased on: origin/develop
Pushed to:  origin/<merge_branch>

Validation:
  [PASS/WARN] Source code changes
  [PASS/WARN] Whitelist authors
  [PASS/WARN] Redirectors

MR:
  [ ] /caol-update-skills cci-make-mr → /mr develop 실행 (없으면 /cci-make-mr develop)
  [ ] MR title convention 적용
  [ ] GitLab MR 생성 링크 제공
```

---

## `merge-notice`

Send pre-merge notification as threaded Slack reply.

### Step 1: Load thread info

Read `~/.claude/private/slack_threads.json` for the current branch.

If no thread info found, show error and list available branches.

### Step 2: Confirm merge time

Ask user for the merge time (e.g., "내일 아침 8시 30분", "오늘 오후 3시").

### Step 3: Preview and send

```bash
# Preview
python ~/.claude/skills/cci-manage-art-branch/scripts/send_notice.py <current_branch> --time "<time>" --dry-run

# Show preview to user, get confirmation

# Send
python ~/.claude/skills/cci-manage-art-branch/scripts/send_notice.py <current_branch> --time "<time>"
```

### Step 4: Update state

Update `art-branches.json`: set current branch `state` → `merge_noticed`

---

## `merge-result`

Send post-merge completion notification with Korean summary.

### Step 0: Verify merge completion

Before anything else, confirm the MR was actually merged into develop.

```bash
git -C <repo_path> fetch --all

# Check 1: merge branch no longer exists on remote
git -C <repo_path> branch -r --list "origin/<merge_branch>"

# Check 2: develop log contains merge branch name
git -C <repo_path> log origin/develop --oneline -20 --grep="<merge_branch>"
```

**Decision logic:**
- Remote merge branch **gone** + develop log **contains** merge branch name → **merged**. Proceed directly.
- Remote merge branch **still exists** → MR not yet merged. Stop and inform user.
- Remote merge branch **gone** but develop log **doesn't contain** it → ambiguous. Ask user to confirm.

This step eliminates guesswork. Do NOT ask the user "is it merged?" — verify programmatically.

### Step 1: Load thread info

Read `~/.claude/private/slack_threads.json` for the current branch.

### Step 2: Analyze merged commits

Use the **local** merge branch for comparison (remote was deleted after MR merge).

```bash
# Local merge branch should still exist
git -C <repo_path> log origin/develop..<local_merge_branch> --oneline --no-merges
git -C <repo_path> diff origin/develop...<local_merge_branch> --stat
```

Fallback: if local merge branch was also deleted, use `merge_branch_head` hash from `art-branches.json`:

```bash
git -C <repo_path> log origin/develop..<merge_branch_head> --oneline --no-merges
```

### Step 3: Generate Korean PM summary

Categorize commits:
- **아트**: Asset additions/updates (textures, materials, meshes, maps)
- **수정**: Bug fixes, corrections
- **기타**: Config changes, cleanup

Format:

```
머지 내역

[아트]
- F_CL001 텍스처 및 머티리얼 업데이트
- 캐릭터 프리셋 추가 (5건)

[수정]
- 머티리얼 슬롯 이름 수정

[기타]
- 설정 파일 정리
```

Omit empty categories. No contributor info.

### Step 4: Determine merge type

Ask user or infer from day-of-week:
- **Friday** → `"regular"` (default)
- **Other days** → `"mid-week"` (default)

User can override (e.g. Friday mid-week merge if another follows).

### Step 5: Save merge stats

Calculate merge number from existing `merges[]` array in `art-branches.json`.

Save to `~/.claude/private/art-merge-stats/<branch-slug>.json`:

```json
{
  "branch": "<current_branch>",
  "merged_at": "2026-02-28",
  "merge_number": 1,
  "merge_type": "mid-week",
  "total_commits": 37,
  "changes": {
    "art": ["description 1", "description 2"],
    "fix": ["description"],
    "chore": ["description"]
  }
}
```

Branch slug: replace `/` with `-` (e.g., `art-art-main-1.5.0-r5.json`).

### Step 6: Send broadcast message

Write broadcast message to tmp file:

```
# Regular merge:
`<current_branch>` 디벨롭 머지 완료되었습니다.

# Mid-week merge:
`<current_branch>` 디벨롭 머지 완료되었습니다. (중간 머지 #N)
```

```bash
# Preview
python ~/.claude/skills/cci-manage-art-branch/scripts/send_result.py <current_branch> --broadcast --file tmp_broadcast.txt --dry-run

# Send (after user confirmation)
python ~/.claude/skills/cci-manage-art-branch/scripts/send_result.py <current_branch> --broadcast --file tmp_broadcast.txt
```

### Step 7: Send thread-only detail

Write Korean PM summary from Step 3 to tmp file.

```bash
# Preview
python ~/.claude/skills/cci-manage-art-branch/scripts/send_result.py <current_branch> --file tmp_detail.txt --dry-run

# Send (after user confirmation)
python ~/.claude/skills/cci-manage-art-branch/scripts/send_result.py <current_branch> --file tmp_detail.txt
```

### Step 8: Update state

Append to `merges[]` array in `art-branches.json`:

```json
{
  "number": <N>,
  "type": "mid-week" | "regular",
  "merge_branch": "<merge_branch>",
  "merge_branch_head": "<HEAD hash>",
  "merged_at": "<ISO 8601 KST>"
}
```

Update state based on merge type:
- **mid-week** → state back to `created` (branch stays active)
- **regular** → state to `merged` (cycle ends)

---

## `cleanup`

Cherry-pick remnant commits and delete old branch.

### Step 1: Identify old and current branches

Read `art-branches.json`:
- Current branch = `current`
- Old branch = the one being cleaned up (ask user if ambiguous, or use the previous `current` from history)

### Step 2: Find merge branch tip on the art branch

**IMPORTANT:** `merge_branch_head`는 리베이스/체리픽된 머지 브랜치의 해시이므로, 아트 브랜치와 lineage가 다르다. `merge_branch_head..origin/<art_branch>` 범위를 사용하면 이미 머지된 커밋까지 전부 반환된다.

**올바른 방법:**

```bash
# 1. merge_branch_head의 커밋 메시지 확인
git -C <repo_path> log <merge_branch_head> --oneline -1

# 2. 아트 브랜치에서 같은 메시지의 원본 커밋 찾기
git -C <repo_path> log origin/<old_branch> --oneline --grep="<commit_message>"

# 3. 원본 해시를 사용
```

Fallback sources (in order):
1. `art-branches.json` → `merge_branch_head` → 커밋 메시지로 원본 해시 역추적
2. Local/remote branch: `git branch -a | grep art/merge/`
3. Ask user for commit hash

### Step 3: Find remnant commits

```bash
git -C <repo_path> fetch --all
git -C <repo_path> checkout <current_branch>
git -C <repo_path> pull origin <current_branch>
# <original_hash> = Step 2에서 찾은 아트 브랜치 원본 해시
git -C <repo_path> log <original_hash>..origin/<old_branch> --oneline --no-merges
```

Show list and count. If none, skip to Step 5.

### Step 4: Cherry-pick remnants

Show commits and ask for confirmation:

```
Cherry-pick할 잔여 커밋 N건:
- abc1234 commit message 1
- def5678 commit message 2

진행할까요?
```

Cherry-pick each (oldest first):

```bash
git -C <repo_path> cherry-pick <commit_hash>
```

On conflict: stop, show files, ask user.

After all cherry-picks:

```bash
git -C <repo_path> push origin <current_branch>
```

### Step 5: Delete old branch from remote

Show and confirm:

```
삭제 대상:
- Remote: origin/<old_branch>

진행할까요?
```

```bash
git -C <repo_path> push origin --delete <old_branch>
```

### Step 6: Update state

Update old branch entry in `art-branches.json`: set `state` → `archived`

### Summary output

```
Cleanup complete:
  Remnant commits: N cherry-picked
  Deleted remote:  <old_branch>
  Updated remote:  <current_branch>
  State:           archived
```

---

## `status`

Display current state and suggest next action.

### Step 1: Read state

Read `art-branches.json`, resolve current branch and state.

### Step 2: Show info

```
Art Branch Status
─────────────────
Branch:   <current_branch>
State:    <state> (since <created_at>)
Day:      <day_of_week>
```

### Step 3: Recent commits

```bash
git -C <repo_path> fetch --all 2>/dev/null
git -C <repo_path> log origin/<current_branch> --oneline -5
```

### Step 4: Suggest next action

Use the auto-suggestion matrix from SKILL.md to recommend the next step.

```
→ Suggested: <action> — <reason>

Available actions: create, merge-prep, merge-notice, merge-result, cleanup, status
```

---

## Stabilization Status

> **2026-02-27 — deemo**
>
> 이 프로세스는 아직 불안정합니다. 다음 주(2026-03-02~)에도 계속 돌리면서
> 안정화할 예정입니다.
>
> **목표:** 담당자(deemo) 이직 대비, 비개발자가 아트 브랜치 관리를 운영할 수
> 있도록 프로세스를 견고하게 만드는 것.
>
> **현재 상태:**
> - 수동 판단 포인트 15개 이상 → 자동화 필요
> - 상태 검증 없음 → 잘못된 순서로 명령 실행 가능
> - 에러 복구 절차 미비
> - 비개발자용 가이드(RUNBOOK) 미작성
>
> **계획 (안정화되면 순차 적용):**
> 1. 상태 검증 강제 — 각 명령 실행 전 상태 체크, 잘못된 상태면 올바른 다음 액션 안내
> 2. 자동 판단 강화 — 요일 기반 머지 타입 자동 결정, merges[] 배열로 1st/2nd 자동 감지
> 3. 에러 복구 절차 — cherry-pick/rebase 충돌, push 실패, Slack 전송 실패 시 복구 방법
> 4. 비개발자 RUNBOOK — 주 단위 체크리스트, FAQ, 긴급 상황 대응, 상태 리셋 가이드
> 5. auto-suggest 강화 — 명확한 지시 + 이유 + 예상 다음 단계 표시

---

## Multi-Merge Support — `merges[]` JSON shape

A single art branch can be merged multiple times per week. Merges are tracked in a `merges[]` array on the history entry:

```json
{
  "branch": "art/art-main-1.5.0-r5",
  "state": "created",
  "merges": [
    {
      "number": 1,
      "type": "mid-week",
      "merge_branch": "art/merge/art-main-1.5.0-r5",
      "merge_branch_head": "28ecdab9...",
      "merged_at": "2026-02-26T08:00:00+09:00"
    }
  ]
}
```

- `type`: `"mid-week"` or `"regular"`
- `number`: sequential merge count per branch (1, 2, 3...)
- Merge branch naming for #2+: `art/merge/art-main-1.5.0-r5-2`

### Slack Broadcast Convention

| Type | Broadcast message suffix |
|------|-------------------------|
| Regular | (없음) |
| Mid-week | `(중간 머지 #N)` |

### Legacy Data Inference

If a history entry has no `state` field, infer it:

| Condition | Inferred State |
|-----------|---------------|
| Is `current` AND no `merges` (or empty) | `created` |
| Is `current` AND has `merges` but old format `merge_branch` field | migrate to `merges[]` |
| Is NOT `current` | `archived` |

When inferring state, write it back to `art-branches.json` so future reads are clean.

---

## Status Display Format

```
Art Branch Status
─────────────────
Branch:  art/art-main-1.5.0-r5
State:   created (since 2026-02-24)
Day:     Monday

→ Suggested: status (branch already created this week)

Available actions: create, merge-prep, merge-notice, merge-result, cleanup, status
```

If the user confirms the suggestion, execute the corresponding sub-command.
