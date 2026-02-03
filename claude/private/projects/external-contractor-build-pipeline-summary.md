# External Contractor Build Pipeline

## Overview

| Field | Value |
|-------|-------|
| **Project** | External Contractor Build Distribution System |
| **Owner** | Deemo (Technical Artist) |
| **Period** | 2026-01-15 ~ 2026-01-30 (~2 weeks) |
| **Purpose** | Automatic package distribution to external partners while maintaining source code security |

---

## Timeline

| Date | Milestone |
|------|-----------|
| 2026-01-15 | Nicole-Husker-Deemo discussion, package build method decided |
| 2026-01-21~22 | Two-button system design, build computer allocated |
| 2026-01-27 | System design and script writing |
| 2026-01-28 | Admin Button A complete (test package took 48 min) |
| 2026-01-29 | Slack bot integration, NAS deployment automation active |
| 2026-01-30 | External contractor Button B testing complete |

---

## Tech Stack

| Field | Value |
|-------|-------|
| **Engine** | Unreal Engine 5.7 |
| **Package Size** | ~70GB |
| **Update Frequency** | 1-3 times per day |
| **Distribution Path** | `\\nas.cinamon.me\CineV\11_Cinema\CINEVPackageCO` |
| **Automation** | PowerShell + BAT scripts |
| **Notifications** | Slack bot (Create Art Branches) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Build Machine (Button A)                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ build_and_deploy.bat                                │   │
│  │ 1. Git Pull (feature branch)                        │   │
│  │ 2. UAT Packaging (~48 min)                          │   │
│  │ 3. ZIP Compression                                  │   │
│  │ 4. NAS Upload                                       │   │
│  │ 5. Slack Notification                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  → Internal admins (Aitch etc.) access remotely to control  │
└─────────────────────────────────────────────────────────────┘
                              ↓ NAS
┌─────────────────────────────────────────────────────────────┐
│                 External Contractor PC (Button B)            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Launcher (Normal Mode)                              │   │
│  │ - Download latest package from NAS                  │   │
│  │ - AccessCode-based asset filtering                  │   │
│  │ - Launch video editor                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Source Code Security
- Package-only distribution without Git repository exposure
- External contractors cannot access source code or original assets

### 2. AccessCode System
Project-based asset access control:

| AccessCode | Project | Included Assets |
|------------|---------|-----------------|
| `NANA_ADV` | Nana's Great Adventure | Nana character, forest/village backgrounds |
| `REMREM_SLEEP` | RemRem Sleep Room | RemRem character, bedroom background |
| `COMMON` | Shared Assets | Common effects, UI elements |

### 3. Slack Bot Integration
- Packaging start notification
- Packaging complete + file path notification
- Branch/commit info auto-included

### 4. One-Click Automation
Single button: Git Pull → Packaging → ZIP → NAS Upload → Slack Notification

---

## Project Background

### Why This Started

**Problem (2026-01-15)**
- External contractor (Unconditional Divorce director) needed CineV Studio access
- Remote access vs package build discussion

**Husker's Opinion**
> "To prevent asset and source code exposure, providing a packaged build seems appropriate"

**Conclusion**
- Remote access method ❌ (security risk)
- Package build installation ✅
- R&R: Deemo manages

---

## Target Projects

| Branch | Project |
|--------|---------|
| `contents/production/divorce-unconditionally-v1.3.11` | Unconditional Divorce |
| `production/divorce-only` | Unconditional Divorce (fork) |

---

## Results

| Metric | Before | After |
|--------|--------|-------|
| Distribution Method | Manual USB delivery | NAS auto-deployment |
| Time Required | Hours (manual) | 48 min (automated) |
| Notifications | None | Slack auto-notification |
| Security | Remote access risk | Package-only |

---

## Portfolio Highlights

### Keywords
- **Security**: External distribution without Git/source code exposure
- **Automation**: Manual work → One-click button
- **Cross-team Collaboration**: Art/directing/engineering bridge role
- **Problem Solving**: Self-defined and solved a role that didn't exist in the organization

### Interview Summary
> "Built a pipeline for auto-distributing 70GB+ packages to external partners while maintaining source code security. Integrated Slack bot so one button handles packaging → NAS upload → notification."

---

## References

### Slack

| Channel | Topic |
|---------|-------|
| `#cinev-ta` | Technical discussion |
| `#cinev-contents-directing` | Directing team collaboration |
| `#ext-contents-unconditional-divorce` | External contractor dedicated channel |

---

*Document created: 2026-01-31*
