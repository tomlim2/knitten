---
status: accepted
---
# CINEV VRM Shading

CINEV VRM character source classification and shading material status.

---

## Status Values

| Value | Meaning |
|-------|---------|
| `ready` | Material and outline policy are usable |
| `substituted` | Use the named fallback material |
| `partial` | Material works, outline policy is incomplete |
| `blocked` | Do not treat as production-ready |
| `not-applicable` | Outline is not needed for the shading type |

## Shading Classification

| Origin | Asset key | Shading | Material status | Outline status | Use rule |
|--------|-----------|---------|-----------------|----------------|----------|
| CINEV in-house | `m-cell` | Toon | `ready` | `ready` | Use CINEV in-house Toon material |
| Zepeto realistic | `cinev-vrm-zo-std` | PBR | `ready` | `not-applicable` | Use PBR material; do not add outline |
| Zepeto toon | `cinev-vrm-zo-toon` | Toon | `substituted` | `blocked` | Use CINEV in-house Toon material as fallback |
| VRoid Studio | `cinev-vrm-vroid` | Toon | `ready` | `ready` | Use VRoid Toon material with outline |
| Booth / community realistic | `cinev-vrm-booth-std` | PBR | `blocked` | `not-applicable` | Do not treat as production-ready |
| Booth / community toon | `cinev-vrm-booth-toon` | Toon | `ready` | `partial` | Use Booth Toon material; inspect outline manually |
| Endfield style | `cinev-endfield` | unknown | `blocked` | `blocked` | Do not treat as production-ready |

---

## Character source classification

| Source | Meaning | Shading rule |
|--------|---------|--------------|
| ZO | Naver Zepeto-only characters | `std` uses PBR with no outline; `toon` uses CINEV in-house Toon material as fallback |
| VRoid | Characters created in VRoid Studio | Toon material with outline |
| Booth | VRMs sourced from Booth or the community | Realistic variants are blocked; Toon variants require manual outline inspection |
| M Cell | CINEV in-house characters | Toon material with outline |
| Endfield | Endfield-style characters | Blocked until material and outline status change |

## Update Rule

When a material or outline implementation changes, edit the `Material status`, `Outline status`, and `Use rule` cells in the same change. Do not add prose-only exceptions below the table.
