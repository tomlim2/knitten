---
load: triggered
trigger: writing any doc to vault, staging, private/, or ops/
---

- **Resolve via `caol-resolve-doc-path` first** — never hand-build a doc path by reading `machine-paths.json` directly. The resolver is canonical.
- **Trigger maps** — Any user request mapping to one of `devlog`, `learning`, `topic`, `postmortem`, `consulting`, `research`, `notes`, `experiment`, `tutoring`, `drinks`, `vocab`, `private-data`, `ops` (Korean equivalents included: 개발일지, 회고, 메모, 결정 기록, 학습 로그, 포스트모템) MUST route through the resolver — even ad-hoc one-off writes inside conversation.
- **Prefer the wrapping skill** — For project-bound `devlog` / `learning` / `topic` writes, invoke `/learn-log-day <project> [devlog|learning|topic]`. **Cross-project learnings** (Claude Code, language-level, tool-level lessons that span every project) use `/learn-log-day _cross-project learning <slug>` — same skill, dedicated `_cross-project` route, lands in `agent/learnings/learning-<slug>.md` flat (existing convention). Drop to raw `resolve.sh` only when no skill fits (project-free `notes`, ad-hoc).
- **Decision tree:** project context exists → skill; cross-project learning → skill (`_cross-project`); no project context AND not a learning → raw resolver with `notes` or matching purpose.
- **Vault filename contract** — New day logs MUST resolve to `days/YYYY-MM-DD.md`. Do not encode topic, ticket, PR, `daily`, or `devlog` in day filenames; put that information in `title`, H1, tags, and the lead paragraph. For multiple same-day notes, merge into the day file unless the user explicitly needs separate artifacts; then use `days/YYYY-MM-DD/<slug>.md`.
- **Purpose-first principle** — If a doc destination isn't in `doc-paths.json` yet, ADD the purpose entry there FIRST. NEVER work around with `tool` mode + manual subpath, or hardcode the path in the consumer. Path knowledge belongs to Layer 1 (config), not Layer 2 (skills).
- **`~/.claude/ops/`** — allowed only when `purpose=ops` (transient runtime state). Durable records MUST NOT live there.
- **Folder check** — Before inventing a new project folder name, `ls` the resolved parent to check whether a folder/convention already exists.

Run: `bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh <purpose> [project]`. Read `RESOLVED_PATH` from output.
