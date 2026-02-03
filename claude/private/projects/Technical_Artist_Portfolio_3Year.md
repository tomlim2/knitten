# Technical Artist Portfolio

**Cinnamon Inc. | 2023 - 2025**

3-Year Comprehensive Technical Achievements

---

## Executive Summary

AI 비디오 크리에이션 스타트업 Cinnamon에서 3년간 Technical Artist로 재직하며 Unreal Engine 기반의 NPR(Non-Photorealistic Rendering) 캐릭터 시스템, 배경 최적화, 파이프라인 자동화를 담당했습니다. 20인 아트팀의 Git 워크플로우 관리부터 C++/Blueprint 플러그인 개발까지 폭넓은 기술 스펙트럼을 다루었습니다.

### Key Achievements

| Category | Metric | Result |
|----------|--------|--------|
| 프로젝트 최적화 | 700GB → 400GB | 43% 용량 절감 |
| 캐릭터 성능 | 30초 → 16초 | 스폰 타임 47% 개선 |
| 에셋 관리 | 269개 프리셋 | 캐릭터 커스터마이제이션 |

---

## 2023: Foundation Building & System Architecture

### 배경 시스템 구축

**레벨 디자인 표준화 및 최적화**
- 월드 레벨 구성 표준 수립: 4km x 4km 메인 레벨 구조 설계
- 배경 크기 가이드 문서화: 플레이어블 영역(20m x 20m), 시야 영역(40m~200m) 규격화
- Brushify 플러그인 도입 및 랜드스케이프 워크플로우 구축
- 랜드 매쉬 저장/가공 방식 표준화 및 팀 공유

**Houdini 연동 파이프라인**
- Houdini 프로시저럴 시스템 정의 및 문서화
- SideFX Houdini Engine 플러그인 워크플로우 구축
- 배경 에셋 자동화를 위한 노드 기반 시스템 연구

### 캐릭터 시스템 기초

**MetaHuman 기반 시스템 분석**
- MetaHuman Animator 신기능 분석 및 팀 공유 (Live Link Face 연동)
- MetaHuman에서 애니메 캐릭터 시스템으로의 전환 방향성 수립
- 베이스모델 머티리얼 폴더 구조 정리 및 표준화

**캐릭터 머티리얼 시스템**
- 캐릭터 커마 메인 머티리얼 정리: 헤어, 옷, 눈, 피부 카테고리별 분류
- 거울 반사 품질 개선 작업 (MI_Real_Mirror_A)
- 스킨톤 텍스처 색보정 및 매칭 이슈 해결
- 커스텀 헤어 그룸 바인딩 에셋 관리 체계 구축

**애니메이션 시스템**
- 페이셜 감정 블렌드 시스템 디버깅 및 최적화
- 의상 모델링 이슈 추적 및 보고 체계 수립
- 캐릭터 커스터마이제이션 초기 프레임워크 설계

---

## 2024: Core System Development & Optimization

### NPR/Toon Rendering System

**렌더링 파이프라인 구축**
- Cel Shading 기반 NPR 렌더링 시스템 설계 및 구현
- 커스텀 Post Process Material 개발
- 아웃라인 셰이더 시스템 구축 (헤어 아웃라인 전용 머티리얼)
- SDF(Signed Distance Field) 기반 라이팅 시스템 연구

### 캐릭터 시스템 고도화

**VRM/Character System**
- VRM 캐릭터 로딩 시스템 개발 (외부 캐릭터 임포트 지원)
- 캐릭터 오브젝트 구조 재설계: 프로프라이어터리 + VRM 이중 지원
- 269개 캐릭터 프리셋 관리 시스템 구축
- 모듈러 바디 파츠 지원: Head, Hair, Body 개별 커스텀 머티리얼

**성능 최적화**
- 캐릭터 스폰 타임 개선: 30초 → 16초 (47% 향상)
- 스켈레탈 메쉬 시스템 리팩토링
- 에셋 로딩 최적화 및 메모리 관리 개선

### Art Branch Management

**Git 워크플로우 관리**
- 20인 아트팀 Git 워크플로우 설계 및 관리
- Perforce → Git 마이그레이션 리드
- 머티리얼 108개, 텍스처 83개 브랜치 관리
- GitLab CI/CD 파이프라인 구축

**프로젝트 최적화**
- 프로젝트 사이즈 최적화: 700GB → 400GB (43% 절감)
- 에셋 정리 및 미사용 리소스 제거 자동화
- 빌드 시간 단축을 위한 에셋 구조 개선

### 맵 개발 (Map Development)

- 신규 맵 3개 제작 지원
- 기존 맵 22개 업데이트 및 최적화
- 레벨 스트리밍 시스템 구현
- 배경 에셋 배치 가이드라인 수립

### 의상 에셋 파이프라인

- 신규 의상 에셋 67개 제작 파이프라인 구축
- 의상 머티리얼 인스턴스 시스템 설계
- Vertex Color 기반 커스터마이제이션 구현 (Blender 연동)

---

## 2025: Pipeline Automation & Scaling

### 엔진 마이그레이션

**Unreal Engine 업그레이드**
- UE 5.3 → 5.4 마이그레이션 진행
- UE 5.7 업그레이드 준비 및 호환성 테스트
- Visual Studio 2022 호환성 이슈 해결
- 팀 개발 브랜치 컴파일 에러 대응

### 빌드/배포 시스템

**외부 협력사 배포 시스템**
- 70GB+ 언리얼 패키지 배포 솔루션 설계
- Git LFS 기반 대용량 에셋 관리 시스템
- 소스 코드 보안 유지하면서 에셋 배포 가능한 파이프라인 구축
- 외부 계약자용 빌드 자동화 시스템

### 문서화 및 표준화

**기술 문서화**
- 시퀀스 다이어그램 표준 수립
- Blueprint 시각화 및 함수 플로우 문서화
- 기술 에러 문서 체계 구축
- 코드베이스 문서화 가이드라인 작성

### CINEVStudio 프로젝트

- 언리얼 패키징 이슈 트러블슈팅
- 에셋 로딩 리팩토링 완료
- 프로덕션 빌드 안정화

---

## Technical Skills

| Category | Skills |
|----------|--------|
| Game Engine | Unreal Engine 5.3/5.4/5.7, Blueprint, C++ Plugin Development |
| Rendering | NPR/Cel Shading, Post Process Materials, SDF Lighting, Outline Shaders |
| DCC Tools | Blender (Vertex Color, Groom), Houdini Engine, 3ds Max Scripts |
| Version Control | Git, Git LFS, GitLab CI/CD, Perforce Migration |
| Programming | C++, Python (Pipeline Tools), JavaScript, HLSL/GLSL |
| Character Systems | VRM Import, MetaHuman, Skeletal Mesh, Facial Animation, Groom |

---

## Career Progression

- **2023**: Foundation building - 기존 시스템 분석, 배경/캐릭터 기초 파이프라인 구축, 팀 워크플로우 표준화
- **2024**: Core development - NPR 렌더링 시스템, VRM 캐릭터 시스템, 대규모 최적화, Git 마이그레이션
- **2025**: Scaling & automation - 엔진 업그레이드, 외부 배포 시스템, 문서화 체계 완성

---

*Generated: January 2025 | Cinnamon Inc. Technical Artist Portfolio*
