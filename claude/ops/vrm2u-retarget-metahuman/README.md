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
