---
description: "Resolve the correct document storage path for any writing task. Use when determining where to save a document — Obsidian vault, temp-learnings, private/, or ops/. Base skill for all doc-writing skill chains."
argument-hint: "<purpose> [project]"
allowed-tools: Bash(bash:*)
user-invocable: true
---

# caol-resolve-doc-path

문서 저장 위치를 단일 소스로 결정하는 base 스킬.

## Arguments

- `<purpose>` — `devlog` | `learning` | `topic` | `consulting` | `research` | `notes` | `ops` | `tutoring` | `private-data`
- `[project]` — 프로젝트명 (`devlog`, `learning`, `topic` 에 필요)

**If no purpose provided, show usage and ask. NEVER auto-execute.**

```
Usage: /caol-resolve-doc-path <purpose> [project]
```

---

## Resolve

```bash
bash ${CLAUDE_SKILL_DIR}/resolve.sh $ARGUMENTS
```

결과 출력 후 종료. 체이닝 시 caller가 `RESOLVED_PATH`, `FORMAT`, `WEEKDAY`, `VAULT_AVAILABLE` 값을 읽어 사용.
