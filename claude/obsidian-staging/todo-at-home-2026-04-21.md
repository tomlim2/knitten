---
title: "2026-04-21: 집 맥에서 할 일 — Claude 설정 중앙화 후속"
tags:
  - caol-ila
  - todo
  - home-mac
  - centralization
date: 2026-04-21
source: claude
---

# 2026-04-21: 집 맥에서 할 일 — Claude 설정 중앙화 후속

회사 맥에서 `~/.claude/` 설정 중앙화 1차 작업 완료. 집 맥에는 Obsidian vault가 있어서 vault 경로 중앙화는 거기서만 검증 가능. 집 가서 아래 순서로.

---

## 선행 — 회사 맥에서 간 1차 작업 맥락

- `~/.claude/config/` 역할 명확화: 토큰/서비스 설정 전용 ([[config-readme|README]] + `.env.example` 추가)
- `~/.claude/private/` 역할 명확화: 스킬 읽기용 데이터 전용 (README 추가, private는 gitignored라 vault에 별도 사본은 없음)
- shotloom 7개 스킬의 하드코드 경로 → `jq -r '.shotloom' ~/.claude/private/repo-paths.json`로 치환
- P0 버그: `learn-archive-week/fill_tags_from_name.py` 남의 사용자 홈 경로 → `machine-paths.json` 조회로 변경 (키 없으면 graceful exit)
- 아르니므 Slack 봇 토큰은 아직 안 받음 → 받으면 `~/.claude/config/.env`에 `SLACK_BOT_TOKEN=...`

---

## 집 맥에서 할 일

### 1. pull 먼저

caol-ila repo pull 해서 회사 맥 커밋 받기. 집 맥의 `~/.claude/`는 caol-ila/claude의 symlink이므로 pull만 하면 적용됨.

### 2. 집 맥에만 있는 설정 확인

회사 맥은 Obsidian vault 없음 → `machine-paths.json`에 `obsidian-vault-claude` 키 없음. 집 맥은 있어야 함.

```bash
cat ~/.claude/private/caol-config/machine-paths.json | jq .
```

- `obsidian-vault-claude` 키 존재해야 함 (iCloud Obsidian MyNotes/claude)
- 없으면 키 추가

### 2-a. caol-config/ 경로 마이그레이션 ✅ (2026-04-27 완료)

집 맥에서도 `caol-config/` 서브디렉토리에 이미 정착되어 있었음. 추가로 발견된 드리프트 정리:
- `archive.py`, `tag_consolidate.py`, `fill_tags_from_name.py` — 옛 `private/machine-paths.json` 경로 → `caol-config/machine-paths.json`로 수정
- `lib/cci-codex/run-codex.sh` — 같은 경로 + `obsidian` 키를 repo-paths에서 찾던 버그 → `obsidian-vault-claude` (machine-paths)로 수정
- `cci-sync-ta-tools/sync.py` — `private/repo-paths.json` → `caol-config/repo-paths.json`
- `machine-paths.json`에 `codex-home` 키 추가 (`~/.codex`)
- `obsidian-staging` 키를 실제 데이터 위치(`caol-ila/claude/obsidian-staging`)로 정정 — 빈 `temp-learnings/`를 가리키던 드리프트 해소

### 3. P0 버그 수정 검증 ✅ (2026-04-27 완료)

`fill_tags_from_name.py` 정상 실행 확인 (519 files scanned, 2 changed). vault 경로 정상 해석.

### 4. P1 Obsidian vault 경로 중앙화 (집 맥에서만 검증 가능)

회사 맥에서 코드 수정까지만 하고 미검증 상태로 둔 항목들. 각 스킬이 `machine-paths.json → obsidian-vault-claude` 읽게 바꿔야 하고, 집 맥에서 실제로 돌려서 경로 제대로 해석되는지 확인.

대상 스킬 (감사 결과):
- `tutoring-log-lesson/utils.py` — 하드코드 vault 경로
- `tutoring-log-lesson/SKILL.md`, `commands/tutoring-log-lesson.md`
- `tutoring-make-invoice/SKILL.md` — presets.json vault 경로
- `drink-log-entry/SKILL.md` + 관련 커맨드 6곳
- `consulting-log-session/SKILL.md`
- `dev-log-experiment/SKILL.md` — obsidian-staging/bevy-vrm, obsidian-staging/anju 경로

각각 수정 패턴:
```python
import json
from pathlib import Path
paths = json.loads((Path.home() / ".claude/private/machine-paths.json").read_text())
vault = paths.get("obsidian-vault-claude")
if not vault:
    # graceful fallback to obsidian-staging
    vault = paths.get("obsidian-staging")
```

### 5. P1 Slack API 공유 모듈

파이썬 스크립트 5개에서 토큰 로딩 + Slack API URL 중복:
- `cci-send-alert/send.py`
- `cci-manage-art-branch/scripts/send_{create,notice,result}.py` (3개)
- `cci-serve-mcp/server.py`

공유 모듈 `~/.claude/lib/slack_client.py` 하나 만들어서 `load_token()`, `post_message()` 추출. 각 스크립트는 import만. 회사 맥에서 해도 되지만 토큰 받기 전까진 검증 불가능해서 미뤄둠.

### 6. P2 도메인 config 신설 (집 맥 데이터 기반)

집 맥에 실제 데이터 있는 것들 — 이동하면서 정리:

- `~/.claude/private/tutoring/defaults.json` — 시급 150,000원 상수화
- `~/.claude/private/drinks/config.json` — drinks.json 경로
- `~/.claude/config/server.json` — 스킬 서버 포트 972 (7+ 위치 중복)
- `~/.claude/config/design-system.json` — 버전 단일 출처 (현재 v1.8.1 / v1.9.0 / v1.2.1 불일치!)
- `~/.claude/config/projects.json` — Linear team "Shotloom" + expected_refs 리스트

### 7. 아르니므 토큰 세팅 (받는 즉시)

토큰 받으면 장소 불문:

```bash
cp ~/.claude/config/.env.example ~/.claude/config/.env
# .env 편집해서 SLACK_BOT_TOKEN=xoxb-... 채우기
chmod 600 ~/.claude/config/.env
```

---

## 참고

- 중앙화 감사 결과 전체: 세 개 Explore 서브에이전트 병렬 실행 결과. 회사 맥 세션 로그 참조.
- [[shotloom-devlog-2026-04-21]]에 shotloom 쪽 변경 상세.
- 주의: 회사 맥은 Obsidian vault 없는 게 정상 상태 (machine-paths.json에 `obsidian-vault-claude` 의도적으로 빠짐). 집 맥 작업 후 회사 맥에 영향 주지 않도록 graceful fallback 유지 필수.
