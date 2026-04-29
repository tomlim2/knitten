---
description: "Resolve doc storage paths (vault, staging, private/, ops/). All doc-writing skills route here; add new purposes first."
argument-hint: "<purpose> [project]"
allowed-tools: Bash(bash:*)
user-invocable: true
---

# caol-resolve-doc-path

문서 저장 위치를 단일 소스로 결정하는 base 스킬. **Layer 1 (config: `doc-paths.json` + `machine-paths.json`) 가 path 지식의 단일 소유자. Layer 2 (이 resolver를 호출하는 모든 skill/command) 는 path 구조를 재생산하지 않음.**

## Arguments

- `<purpose>` — `doc-paths.json`의 `purposes` 키 중 하나. 현재: `devlog` | `learning` | `learnings` | `topic` | `consulting` | `research` | `notes` | `experiment` | `postmortem` | `vocab` | `drinks` | `tutoring` | `private-data` | `ops`. (실제 목록은 `doc-paths.json` 참조 — 이 markdown에 적힌 목록은 advisory)
- `[project]` — 프로젝트명. purpose path 템플릿에 `{project}` 토큰이 있는 경우 필수 (`devlog`, `learning`, `topic`, `experiment`).

**If no purpose provided, show usage and ask. NEVER auto-execute.**

```
Usage: /caol-resolve-doc-path <purpose> [project]
       /caol-resolve-doc-path doc <purpose> [project]   (explicit doc mode)
       /caol-resolve-doc-path tool <key>                (read machine-paths.json)
       /caol-resolve-doc-path repo <key>                (read repo-paths.json)
```

---

## Resolve

```bash
bash ${CLAUDE_SKILL_DIR}/resolve.sh $ARGUMENTS
```

결과 출력 후 종료. 체이닝 시 caller가 `RESOLVED_PATH`, `FORMAT`, `VAULT_AVAILABLE` 값을 읽어 사용.

## Contract (resolver guarantees)

- Purpose key는 `doc-paths.json` 에 있어야 함 (없으면 ERROR + exit 1).
- Root namespace는 알려진 것만 (`obsidian` / `staging` / `ops` / `private`). 그 외 → ERROR.
- `{project}` 템플릿이 path에 있으면 project arg 필수. 미substituted 토큰 남으면 ERROR.
- BASE 경로가 빈값이면 ERROR (machine-paths.json 누락 신호).
- vault 부재 시 자동 fallback to `staging`. `VAULT_AVAILABLE=false` 출력으로 명시.

이 resolver는 purpose 의미(좋은 이름인지, 합리적 매핑인지)는 **판단하지 않음** — 그건 config authoring의 책임. resolver는 구조적 계약만 강제.

## When you need a NEW destination

Layer 2 스킬에서 새 doc 위치가 필요할 때:
1. `~/.claude/private/caol-config/doc-paths.json`의 `purposes`에 새 entry 추가
2. caller에서 `resolve.sh doc <new-purpose>` 호출
3. **금지:** caller에서 `tool obsidian` + 수동 subpath 조립으로 우회
