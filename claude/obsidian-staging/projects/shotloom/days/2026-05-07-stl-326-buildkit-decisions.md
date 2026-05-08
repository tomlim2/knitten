---
title: STL-326 BuildKit cache + Containerfile builder polish — design decisions
tags:
  - type/devlog
  - project/shotloom
  - area/ci
  - status/draft
date: 2026-05-07
source: claude
---

# STL-326 BuildKit cache + Containerfile builder polish — design decisions

Pre-write briefing notes for STL-326 (PR-B of STL-323 umbrella). Captures the four judgment-call decisions and *why* each recommended option wins, so the reasoning is durable past the conversation.

---

## 1. Containerfile builder base

### Options

| Option | What it does | Diff size | Risk |
|--------|--------------|-----------|------|
| **A. Keep `rust:1-bookworm` + 6-path COPY** (recommended) | Replace the wide `COPY --from=node /usr/local /usr/local` with 6 explicit paths (`bin/node`, `bin/npm`, `bin/npx`, `include/node`, `lib/node_modules`, `share/man/man1/node.1`). Stage-0 base image identical to today. | small | low |
| B. Swap to `node:24-bookworm` + install Rust | Base becomes Node, then add rustup + wasm32 target manually with `cargo install`. Drops the cross-stage COPY entirely. | large | medium-high |

### Why A wins

- **The acceptance criterion only asks for the COPY footprint to be safe** — "either narrow the COPY to 6 paths, OR swap base if footprint is lighter." Both satisfy AC #2. With A, the only line that changes for this AC is the COPY line itself. Reviewers can read it in one glance.
- **Future-proofing without proving it.** The hazard the AC is hedging against is "future bookworm rev / `node:24` repackaging adds files outside the 6 paths and clobbers `cargo`/`rustup` in `/usr/local`." Option A neutralizes that hazard directly: only the listed Node paths land, so a re-packaging of the Node image cannot collide with Rust's `/usr/local`. Option B side-steps it by dropping the COPY entirely, but at the cost of changing the rust toolchain provisioning path (`rust:1-bookworm` ships rustup pre-configured; on a Node base we'd reproduce that with curl + rustup-init).
- **Layer-cache continuity.** Stage-0 layer cache shape is unchanged in A, which means the wasm-pack/cargo registry layers above it can keep their cache hits across the upgrade. Option B invalidates every layer that builds on top of the base, which would *fight* item #1 (BuildKit cache export/import) on its first run.
- **Smaller blast radius for the OCI labels / publish path regression check.** AC #6 demands zero regression in OCI labels, concurrency group, publish path. The fewer layers and stages we touch, the more confidently we can claim that.

Option B becomes correct only if a future measurement shows the explicit-COPY footprint is materially heavier than a swapped base. That's a follow-up issue, not this PR.

---

## 2. BuildKit cache backend

### Options

| Option | Where cache lives | Survives | Cost / coupling |
|--------|-------------------|----------|-----------------|
| **A. `type=local,dest=...`** (recommended) | A directory on the cinev-runner's filesystem | runner restarts; lost on disk wipe / runner re-provision | Couples to a specific path on the runner |
| B. `type=registry,ref=docker.cinamon.me/cinamon/shotloom-web:buildcache` | A separate image manifest pushed alongside the build image | runner re-provision; registry GC policy | Adds registry round-trips (push + pull each run); bandwidth |
| C. `type=gha` (GitHub Actions cache) | GitHub's hosted cache backend | GitHub-managed; 10GB cap | Defeats the point of self-hosting; egress/ingress to github.com per run |

### Why A wins

- **AC wording is literal.** Linear scope item #1 says "self-hosted runner는 영속 볼륨 있으니 `--export-cache type=local,dest=...` + `--import-cache type=local,src=...`로 wall time 큰 폭 단축." It names the backend, the flags, and the storage tier. Choosing B or C departs from the AC and would need explicit justification.
- **Fastest read/write.** Local disk on the runner is faster than registry pull or GitHub cache pull. The whole point of the optimization is wall-time reduction; routing cache through the network undermines it.
- **Lowest moving parts.** B requires a registry write per run (extra failure surface — auth, push retries, GC policy). C requires GHA cache config + token plumbing, and GitHub's cache backend treats the self-hosted runner the same as a hosted one (no advantage from being self-hosted).
- **Cinev-runner is described as long-lived with persistent volume.** That is the resource we already paid for. Using `type=local` is the most direct way to spend it.

Option B becomes attractive only if cinev-runner is replaced or rebuilt frequently — currently no signal of that. Option C is the right choice only on `ubuntu-latest` runners (irrelevant here).

### Why a separate cache mount matters too

Item #4 (`--mount=type=cache,target=/usr/local/cargo/registry`) is *Containerfile-side*, distinct from the workflow-side export/import of item #1. They stack:

- Workflow `--export-cache` / `--import-cache` carries layer-level cache (the whole `pnpm install` layer, the `cargo install wasm-pack` layer if we kept it, etc.) across runs.
- Containerfile `--mount=type=cache` carries *file-level* cache (cargo registry index, downloaded crate sources) inside a single build layer that would otherwise be re-fetched every time the layer rebuilds.

Removing the `cargo install wasm-pack` step (item #3) reduces what the layer-level cache has to carry; adding the cache mount keeps the cargo registry warm for any cargo invocation that happens during `pnpm build:web` (the wasm-pack call still resolves crates).

---

## 3. Cache directory location on cinev-runner

### Options

| Option | What it implies | Risk |
|--------|-----------------|------|
| **A. Ask infra owner first** (recommended) | Pause and confirm canonical persistent path before committing | adds one round-trip; eliminates the silent-no-op risk |
| B. `${RUNNER_TOOL_CACHE}/shotloom-buildkit` | GitHub-native env var; usually persistent on self-hosted, not guaranteed | could be wiped on runner upgrade |
| C. `$HOME/.cache/cinev-runner/buildkit/shotloom-web` | Explicit, survives most upgrades | couples to runner user account; possibly not the intended infra path |

### Why A wins

- **No repo doc names a canonical persistent path on cinev-runner.** Searched: `docs/`, `CONTRIBUTING.md`, `.github/`, README. Nothing. The runner setup is undocumented in this repo, which means whoever set it up (likely CINEV infra) holds the source of truth.
- **Wrong path = silent zero-impact PR.** If the chosen directory is on a tmpfs, container scratch volume, or an auto-cleared path, every run would emit cache to a doomed location, and the next run's import would find nothing. The wall-time numbers would show no improvement and the AC's hard requirement (before/after measurements) would force a redesign anyway. Better to ask once than to ship and discover.
- **Cost of asking is one Slack/Linear message.** Cost of being wrong is one extra wasted PR cycle plus rerunning baselines.
- **B and C are educated guesses.** `${RUNNER_TOOL_CACHE}` is a GitHub-Actions convention, not necessarily honored by self-hosted runner config. `$HOME/.cache/...` works if the runner user's `$HOME` is itself on a persistent volume (often true, sometimes not). Both are *probably* fine. Probably-fine is not a confidence level worth shipping at when the AC includes a measurable target.

If the infra owner says "use `~/.cache/...`" or "use `${RUNNER_TOOL_CACHE}`", we adopt it directly. The question is just *who knows* — not what the answer is.

---

## 4. wasm-pack version pin

### What "pinning" means here

Today the Containerfile runs:

```
cargo install wasm-pack --locked
```

`--locked` only tells cargo to honor the wasm-pack crate's own `Cargo.lock` for *its dependencies*. It does **not** pin the version of `wasm-pack` itself — `cargo install` always resolves to the latest published version on crates.io. So today's image silently picks up new wasm-pack releases the moment they ship.

Item #3 of the AC replaces `cargo install` with downloading a precompiled tarball from GitHub releases:

```
curl -fsSL -o /tmp/wasm-pack.tgz \
  https://github.com/rustwasm/wasm-pack/releases/download/vX.Y.Z/wasm-pack-vX.Y.Z-x86_64-unknown-linux-musl.tar.gz
tar -xzf /tmp/wasm-pack.tgz -C /usr/local/bin --strip-components=1 ...
```

This is much faster (no compile) but the URL contains the version, so we have to commit to a specific number. That commitment is the *first explicit version pin* in the repo for wasm-pack.

### Options

| Option | Implication |
|--------|-------------|
| **A. v0.13.1** (recommended) | Latest stable as of 2026-05-07. Roughly what `cargo install wasm-pack` is grabbing right now, so the implicit version becomes explicit. |
| B. v0.12.1 | Conservative, older. Only justified if v0.13.x has a known issue with the existing build. No such signal. |
| C. Decide at edit time | Re-check the GitHub releases list and pick at the moment of writing. Defers the choice but doesn't change the structure. |

### Why A wins (default)

- **It encodes the current implicit state.** Today's builds are using whatever wasm-pack is latest on crates.io; v0.13.1 is what that resolves to today. So "today's builds" and "first pinned build" produce the same wasm-pack binary, which means the only behavior change is the *install method* (tarball vs cargo install), not the *output*. That keeps the regression surface small.
- **Bumping is cheap once pinned.** A future PR can move v0.13.1 → v0.14.x deliberately, with its own behavior diff. We don't have to guess about future versions now.
- **B is only correct if there's a real regression to dodge.** None has been observed; picking B without cause introduces a *backwards* drift that someone will have to revert later.

### Why this is worth a separate question

Pinning is a policy choice (who owns version bumps?) more than a technical choice. The team should know the pin exists, where the version string lives, and how to update it. PR body will mention it explicitly so it doesn't disappear into the diff.

---

## Final decisions (2026-05-07)

User scoped the PR down to "make it work first, no caching yet."

1. ✅ Builder base — Option A (keep rust + 6-path COPY). **In scope.**
2. ❌ Cache backend — skip. Workflow-side `--export-cache` / `--import-cache` not added.
3. ❌ Cache path — moot (no local cache to place).
4. ❌ Containerfile `--mount=type=cache` — skip. Avoids the `# syntax=docker/dockerfile:1.7` directive bump and any cache mount surface area.
5. ❌ wasm-pack tarball pin — skip. Keep `cargo install wasm-pack --locked` as-is. No version pin introduced.

### What this PR actually does

- Replace `COPY --from=node /usr/local /usr/local` in `apps/editor/Containerfile` with 4 narrow COPY statements covering exactly the 6 Node-owned paths (bin/node, bin/npm, bin/npx, include/node, lib/node_modules, share/man/man1/node.1).
- 1-line comment explaining the future-proofing intent (prevent future Node repackaging from clobbering Rust's `/usr/local`).
- No workflow changes.
- No new dependencies, no cache infra, no version pins.

### What this PR does NOT do

- BuildKit cache export/import (AC #1).
- wasm-pack tarball install with pinned version (AC #3).
- Cargo registry cache mount (AC #4).
- Before/after wall-time measurement (AC #5) — there is no perf change to measure.

### Linear linkage

`Part of STL-326`, **not** `Resolves`. AC #1 / #3 / #4 / #5 remain open. Suggest filing a follow-up issue (or expanding STL-327 / leaving room in STL-323 umbrella) for the perf-cache work once the runner persistent-volume path is confirmed with infra owner.

### Why this scope is reasonable as a first PR

- AC #2 is the *safety* item. The other ACs are perf items. Shipping safety without perf is a coherent unit — the Containerfile becomes more robust against upstream Node base changes regardless of whether caching ever lands.
- Removes the open question (cinev-runner persistent path) from the critical path. That question can be answered async by infra owner without blocking this PR.
- Smallest-diff approach reduces review cycles, gets the safety fix landed faster, and lets the perf work be measured against a stable Containerfile baseline rather than mixed with a large refactor.

---

# PR delivery — 2026-05-07 저녁 (PR #261)

웹 이미지 빌더 stage(`apps/editor/Containerfile`)의 안전성과 wasm-pack 설치 방식을 손본 작업. cinev-runner 빌드 파이프라인의 hardening 슬라이스로, 향후 BuildKit 캐시가 도입될 수 있는 자리(workflow + Containerfile)에 "지금은 의도적으로 비워둠 + 추후 지원 가능"이라는 코멘트만 명시적으로 남김. PR <https://github.com/CINEV/shotloom/pull/261>, Linear STL-326.

## Big picture

STL-323 umbrella(웹 이미지 파이프라인 staging + builder polish) 안에서 PR-B 슬롯. 원래 4개 perf/safety 항목 묶음(BuildKit cache export/import, COPY narrowing, wasm-pack tarball, cargo cache mount)이었는데, 이번 세션 도중 cinev-runner 인프라 오너와 *영속 캐시 표면 없음* 합의가 확인되어 perf 묶음(#1/#3/#4/#5)이 자연스럽게 빠지고 안전성 슬라이스(#2/#6/#7)만 살아남음. STL-329는 향후 인프라가 영속 캐시를 제공하면 다시 꺼내 쓸 stand-alone Backlog 이슈로 둠 (부모/관계 다 풀린 상태).

## Why

- `COPY --from=node /usr/local /usr/local`은 Debian Node 트리 전체를 `rust:1-bookworm`의 `/usr/local`(이미 cargo·rustup 보유)에 통째로 덮어씀. 지금은 안 부딪히지만 미래 bookworm rev / `node:24` 재패키징이 추가 파일을 들고 오면 Rust 툴체인을 silently 깨뜨릴 수 있음.
- `cargo install wasm-pack --locked`는 매번 from-source 빌드 + wasm-pack *자체 버전*은 안 잠금(crate의 `Cargo.lock`만 잠금) → crates.io에서 새 버전이 나올 때마다 조용히 따라 올라감.
- BuildKit 로컬 캐시 backend는 cinev-runner 환경에서는 silent no-op. cold/warm 두 런 모두 `pnpm build:web` ~12m20s로 동일했고, buildctl 로그가 `local cache import ... not found ... index.json: no such file or directory`로 명시적으로 빈손 신호를 남김. `$HOME` 비휘발 + buildkitd 데몬 storage 비휘발 둘 다 확인됨.

## How

1. Containerfile 수정 (`apps/editor/Containerfile`):
   - 와이드 `COPY --from=node /usr/local /usr/local` → 4개 좁은 COPY (`bin/node`, `include/node`, `lib/node_modules`, `share/man/man1/node.1`).
   - npm/npx는 COPY가 plain-file symlink을 dereference 해서 cli.js *내용*이 `/usr/local/bin/npm`에 떨어지면 `require('../lib/cli.js')` 상대 경로가 깨짐 → `RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm` 로 재생성. (첫 cold run 25480313717이 정확히 이 부분에서 실패해서 발견.)
   - `cargo install wasm-pack --locked` → `curl -fsSL ... | tar -xz -C /usr/local/bin --strip-components=1` 로 `x86_64-unknown-linux-musl` precompiled tarball 설치. `ARG WASM_PACK_VERSION=v0.13.1`로 첫 명시 핀.
2. Workflow 코멘트 (`.github/workflows/build-web-image.yml` `Build and push web image` step 위): "BuildKit caching intentionally not configured / `$HOME` + buildkitd cache 둘 다 비휘발 / 추후 영속 표면 생기면 `--export-cache`/`--import-cache`/`--mount=type=cache`를 어디에 어떻게 추가하면 되는지" 9줄.
3. 검증: `workflow_dispatch publish=false` 두 번 (`v0.0.0-stl326-cold2` = run 25480453151, `v0.0.0-stl326-warm` = run 25481021984). 둘 다 success, build step ~12m20s. side effect로 `docker.cinamon.me/cinamon/shotloom-web:v0.0.0-stl326-cold2` / `:v0.0.0-stl326-warm` 두 개 임시 이미지 레지스트리에 남음 — 머지 후 정리.

## What

- 머지된 후 동작: 동일한 final 이미지 (OCI labels, concurrency group, registry publish 경로 unchanged). 빌드 시간은 cargo install wasm-pack 단계가 ~분 → 초 단위로만 줄음, 전체는 여전히 `pnpm build:web` (cargo wasm 빌드)에 dominate.
- 머지 안 된 부분 (STL-329로 보존): BuildKit cache export/import, cargo registry cache mount, wasm-pack tarball perf 측정. cinev-runner에 영속 캐시 표면이 생기면 STL-329가 In Progress로 가고 perf PR 진행.
- 인프라 합의 흔적: workflow 코멘트 9줄. README나 별도 doc은 사용자 결정으로 추가 안 함 (call-site 코멘트로 충분).

### 사이드 노트

- npm/npx symlink 트랩 — COPY가 plain-file symlink을 dereference 한다는 것을 *처음 cold run 실패*로 알게 됨. 미리 알았다면 첫 커밋부터 깔끔했음. 다음에 narrow COPY 패턴 쓸 때 symlink 항목은 `RUN ln -s`로 따로 처리하는 걸 디폴트로.
- `cargo install --locked`의 의미 — `--locked`는 wasm-pack의 자기 `Cargo.lock`만 잠그는 것이지 wasm-pack 자체 버전은 안 잠근다는 점은 일반적으로 오해되기 쉬움. 명시적 tarball + URL 버전 박힘이 진짜 핀.
- `docker/dockerfile:1.7` syntax 디렉티브 — 처음 추가했다가 캐시 mount 빼면서 같이 뺌. cargo cache mount나 secret mount가 필요해지면 다시 추가 + 그 시점의 dockerfile syntax 버전 확인.
