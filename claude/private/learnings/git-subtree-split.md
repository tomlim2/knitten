# git subtree split으로 서브디렉토리 히스토리 분리

## 상황
모노레포(anju) 안에 있던 독립 프로젝트(bevy-vrm)를 별도 repo로 분리하면서 git 커밋 히스토리를 보존해야 했음.

## 방법

### 1. 히스토리 추출
```bash
cd /path/to/monorepo
git subtree split -P <subdirectory> -b <temp-branch>
```
- `-P bevy-vrm`: 추출할 서브디렉토리 경로
- `-b bevy-vrm-split`: 추출된 히스토리가 담길 임시 브랜치명
- 모노레포의 전체 커밋(316개)을 스캔해서 해당 디렉토리에 관련된 커밋(33개)만 추출

### 2. 새 repo 생성 및 히스토리 가져오기
```bash
mkdir -p /path/to/new-repo
cd /path/to/new-repo
git init
git pull /path/to/monorepo <temp-branch>
```
- 새 repo에서 원본 repo의 임시 브랜치를 pull
- 파일 경로가 서브디렉토리 기준으로 정리됨 (bevy-vrm/src/main.rs → src/main.rs)

### 3. 원본에서 정리
```bash
cd /path/to/monorepo
git rm -r <subdirectory>
git commit -m "chore: extract <subdirectory> to standalone repo"
git branch -D <temp-branch>
```

## 핵심 포인트
- `git subtree split`은 서브디렉토리 관련 커밋만 골라서 새 히스토리를 만듦
- 커밋 메시지, 날짜, 작성자 모두 보존됨
- 파일 경로는 자동으로 서브디렉토리 기준으로 재작성됨
- `git filter-branch`보다 간단하고 안전함

## 적용 사례
- anju/bevy-vrm → /Users/deemooooooooo/Desktop/www/bevy-vrm (33 commits 보존, 2026-03-23)
