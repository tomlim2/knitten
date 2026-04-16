---
title: "마인크래프트 서버 인프라 구축"
tags:
  - infra
  - server
  - minecraft
date: 2026-04-16
source: claude
---

# 마인크래프트 서버 인프라 구축

서버 관리자 추천 기반 개인 마크 서버 구성 정리.

---

## 구성 요소

| 레이어 | 도구 | 역할 |
|--------|------|------|
| VPN | Tailscale | WireGuard 기반, 접속자 네트워크 관리 |
| 호스팅 | Oracle Cloud | 무료 티어 VM으로 상시 운영 |
| 서버 | itzg/minecraft-server | Docker 이미지, 마크 서버 자동 관리 |

---

## 핵심 포인트

### Tailscale

- WireGuard 프로토콜 위에 올린 메시 VPN
- 포트포워딩/공유기 설정 없이 VPN 안에서만 접속 가능
- 접속자 관리가 간편 — 초대 링크로 추가, 권한 관리 UI 제공

### Oracle Cloud 무료 티어

- ARM 기반 VM (Ampere A1) — 4 OCPU / 24GB RAM까지 무료
- 마크 서버 돌리기에 충분한 스펙
- 상시 무료 (Always Free), 시간 제한 없음

### itzg/minecraft-server

- Docker 컨테이너로 마크 서버 원클릭 배포
- 환경변수로 버전, 모드, 설정 제어
- 자동 업데이트, 백업 스크립트 연동 용이
- GitHub: `itzg/docker-minecraft-server`

---

## 구축 흐름 (요약)

1. Oracle Cloud에서 ARM VM 생성 (Always Free)
2. VM에 Docker + Tailscale 설치
3. `docker run -d itzg/minecraft-server` 로 마크 서버 기동
4. Tailscale 네트워크 안에서만 접속 허용
5. 친구들에게 Tailscale 초대 → VPN IP로 접속
