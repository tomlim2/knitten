# ops/vrm2u-retarget-metahuman

Mission: VRM↔MetaHuman(DHIbody) 리타게터 구현 in bevy-vrm(vrm2u).
Control=#1(caol-ila). Work=#2,#3(bevy-vrm).

## Files
- `briefing.md` — agent context
- `timeline.md` — task dispatch board
- `log.md` — status log
- Ref: `../shotloom-vrm-import/storypreviz-skeleton.md` — MetaHuman bone 분석

## Protocol
- Tasks: R-NNN. Status: queued→dispatched→active→done/blocked.
- Commits & MR: #1(지통실)에서만 작성.
- Agents report: timeline.md status update + log.md append.
- All docs: LLM-compact.
- Branch isolation: 같은 레포 병렬 작업 시 각자 별도 브랜치. 명명: `{task-id}/{agent}`. #1이 통합.
- **Dispatch format: JSON only.** No verbose markdown. Keys: `id, title, branch, repo, depends, goal, context, files, tasks, references, validation`.

## Rules
- **소스 애니메이션은 절대 수정하지 않는다.** 증폭, 오버레이, 후처리 금지. retarget은 충실한 전달만 한다.
- **문제가 있으면 무조건 리타게터 문제로 접근한다.** "소스가 약해서"는 변명. 리타게터가 소스를 100% 충실히 전달하고 있는지를 먼저 증명하라.
