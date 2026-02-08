# art-create-branch

**Version:** 0.3.0

Automated branch creation for CINEV art team.

## Changelog

- **0.3.0** - Fix git flow: fetch → ff develop → branch (no reset --hard)
- **0.2.0** - Use shared config location (`~/.claude/config/`)
- **0.1.0** - Initial release

## Purpose

1. `git fetch --all`
2. `git checkout develop && git pull --ff-only` (fast-forward)
3. `git checkout -b <새브랜치>` (develop에서 분기)
4. 소스 브랜치에서 지정 기간 커밋 체리픽 (선택)
   - 기간: 전주 금요일 08:00 KST ~ 이번주 월요일 08:00 KST
5. 푸시 후 Slack art 채널에 알림

## 사용법

```bash
python create_art_branch.py <새브랜치명> [소스브랜치명]
```

### 예시

```bash
# 체리픽 포함
python create_art_branch.py art/art-main-1.5.0-r1 art/art-main-1.5.0

# 체리픽 없이 브랜치만 생성
python create_art_branch.py art/art-main-1.5.0-r1
```

## 설정

`.env` 파일에 Slack Bot Token 설정 필요:

```
SLACK_BOT_TOKEN=xoxb-your-token-here
```

## 컨플릭트 처리

체리픽 중 컨플릭트 발생 시:
1. 스크립트가 즉시 중단됨
2. 컨플릭트 발생 단계와 커밋 해시 출력
3. 수동으로 해결 후 `git cherry-pick --continue` 또는 `git cherry-pick --abort`

## 파일 구조

```
create-art-branch/
├── SKILL.md              # 이 문서
├── create_art_branch.py  # 메인 스크립트
├── .env.example          # 환경변수 예시
└── .env                  # 실제 환경변수 (gitignore)
```
