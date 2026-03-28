---
description: "Deprecated — use /learn-log-day instead. Redirects to learn-log-day for unified project logging."
allowed-tools: Read
---

# dev-log-project (Deprecated)

이 스킬은 `learn-log-day`에 통합되었습니다.

## Redirect

모든 기능이 `/learn-log-day`로 이전됨:

| 기존 사용법 | 새 사용법 |
|------------|----------|
| `/dev-log-project devlog` | `/learn-log-day <project>` |
| `/dev-log-project learning worked` | `/learn-log-day <project> learning worked` |
| `/dev-log-project topic <name>` | `/learn-log-day <project> topic <name>` |

**변경점:**
- 옵시디언 vault에 직접 기록 (프로젝트 로컬 `docs/` 아닌)
- YAML frontmatter, wikilink, callout, tag 활용
- devlog + learnings-index + topic 통합 관리

**이 스킬을 호출하면 `/learn-log-day`를 안내하세요.**
