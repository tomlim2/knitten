# 2026-04-13 — Real retarget sweep baseline (132 → 209 pairings)

Tier1 세션의 미래 작업 #1 (real sweep 재실행)을 1호기에서 실행. 다음 리팩토링의 regression 기준 스냅샷.

## 명령

```bash
cd crates/humanoid_retarget
cargo run --bin retarget-test --release -- \
  ../../assets/models ../../assets/fbx ../../assets/retarget/arp_body.json
```

## 입력

- 19 VRM × 11 FBX = **209 pairings**
- VRM: vroid (xiao, c_normal, g_small, m_small), zepeto, p2v phainon, Yoya, GhostPumpking, CoolBanana, YouAre, YouAreWho, test, moth, shimaenaga, 0x minjoon, vrm_0x_m_*, hashed UUIDs
- FBX: 11개 (10 body + 1 facial-only `FC_00078_F_SuddenFlutter`)

## 결과

```
Total: 209  Pass: 209  Fail: 0
Hard fail rows: 19  (전부 facial-only FBX × 19 VRM — output_has_bones, 예상된 미스매치)
Graded: 190
```

### Overall grade 분포

| Grade | Count | % |
|-------|-------|---|
| A | 9 | 4.7% |
| B | 75 | 39.5% |
| C | 66 | 34.7% |
| F | 40 | 21.1% |

### Per-VRM (10 graded body FBX)

**Top performers (A 보유):**
- `YouAre.vrm` — A=2 B=5 C=3 F=0
- `vroid_1x_f_xiao.vrm` — A=2 B=5 C=3 F=0
- `vroid_1x_f_m_small` — A=1 B=6 C=3 F=0
- `vroid_1x_m_g_small` — A=1 B=6 C=3 F=0

**Mid:** YouAreWho, vroid_1x_m_c_normal, hashed UUIDs, zepeto — 대부분 B 위주

**Worst:**
- `CoolBanana.vrm` — A=0 B=0 C=2 F=8
- `p2v_0x_m_phainon.vrm` — A=0 B=0 C=3 F=7
- `Yoya / vrm_0x_f_yoya / vroid_0x_f_minjoon` — heavy C 편향 (A=0 B=1 C=7 F=2)
- `vrm_0x_m_moth` — A=0 B=3 C=1 F=6

## 관찰

1. **VRM 1.0 vroid 모델군이 안정적** (xiao, m_small, g_small, c_normal). 1A-2A 보유, F 거의 없음.
2. **VRM 0.x 모델이 C/F 편향** (yoya, minjoon, moth, ghostpumpking, phainon). rest pose 정합성 문제 의심 — vrm0_compat 변환 후의 rest가 ARP delta와 잘 안 맞을 가능성.
3. **CoolBanana / phainon 8-7 F**: 비표준 proportion이거나 finger/foot config 부재로 보임. 별도 조사 필요.
4. **Facial FBX (FC_00078) hard fail 19건**: rubric C가 bone tracks 요구. 정상. body/facial split (devlog 04-13 오후 SourceAnim 안)이 들어오면 깔끔해질 부분.
5. **A grade 단 9건 / 190 (4.7%)**: 채점 기준이 적절히 빡빡함. 리팩토링 시 A 감소를 regression 신호로 사용 가능.

## 다음 작업 기준선

이 분포를 baseline으로 두고 향후 리팩토링 (#2 ArpRetargeterInner 정리, #3 foot.rs 감사, #4 three-axis purity 등) 후 재측정해서:
- A 개수 감소 시 → regression
- F 개수 감소 시 → 개선
- VRM 0.x 모델군 grade 상승 시 → vrm0_compat 개선 효과

raw 결과: `/tmp/sweep-full.txt` (1호기 임시), 영구 보관 필요 시 `private/sweeps/` 추후 정리.
