# tutoring-log-consultation Reference

Student file format template, full workflow details for all 3 actions, and notes.

---

## Student File Format

```markdown
# {StudentName} - 상담 내역

**학년:** 고2 / 대1 / etc.
**학부모:** 이름
**수업 과목:** 블렌더, UE5, etc.
**상담 횟수:** N

---

## 상담 기록

### 2026-03-01 | 상담 주제 제목

**유형:** 초기 상담 / 진도 상담 / 피드백 / 일정 조율
**방식:** 대면 / 전화 / 카카오톡
**시간:** HH:MM~HH:MM

**상담 내용:**
- 논의된 주요 내용
- 학부모 요청사항
- 학생 현재 상황

**합의 사항:**
- 결정된 내용

**후속 조치:**
- [ ] 다음 할 일

---

### 2026-02-15 | 이전 상담 주제

...
```

---

## Workflow

### Action: Log new consultation

1. **Ask for consultation details** (if not provided inline):
   - 날짜 (default: today)
   - 상담 주제
   - 유형 (초기 상담 / 진도 상담 / 피드백 / 일정 조율 / 기타)
   - 방식 (대면 / 전화 / 카카오톡)
   - 시간 (HH:MM~HH:MM)
   - 상담 내용 (논의 사항, 학부모 요청, 학생 현황)
   - 합의 사항
   - 후속 조치

2. **Check if student file exists:**
   - Exists → Read file, add new consultation at top of 상담 기록 section, increment 상담 횟수
   - New → Ask for student profile (학년, 학부모명, 수업 과목), create file with header + first consultation

3. **Write consultation** in the format above

4. **Confirm** with consultation summary

### Action: `list`

1. Resolve `bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc tutoring`, then glob `consultations/*.md` below it
2. For each file, read 상담 횟수 and latest consultation date
3. Display table:

```
| 학생     | 상담 횟수 | 최근 상담    | 수업 과목       |
|----------|-----------|-------------|----------------|
| 이석민    | 3         | 2026-03-01  | 블렌더, UE5     |
```

### Action: `summary`

1. Read all student files
2. Show:
   - 전체 학생 수
   - 전체 상담 횟수
   - 상담 유형별 분포
   - 타임라인 (최초 → 최근 상담)

---

## Consultation Types

| 유형 | 설명 |
|------|------|
| 초기 상담 | 수업 시작 전 학부모와의 첫 상담 |
| 진도 상담 | 학생 진도 및 학습 상황 공유 |
| 피드백 | 학부모 피드백 수렴 및 대응 |
| 일정 조율 | 수업 일정, 휴강, 보강 등 조율 |
| 기타 | 위에 해당하지 않는 상담 |

## Consultation Methods

| 방식 | 설명 |
|------|------|
| 대면 | 직접 만나서 상담 |
| 전화 | 전화 통화 |
| 카카오톡 | 카카오톡 메시지 |

---

## Notes

- Student filenames: 학생 이름 그대로 사용 (e.g., `이석민.md`)
- All data stored below the configured tutoring destination (`resolve.sh doc tutoring` + `/consultations/`)
- Consultations are append-only — never delete past records
- 상담 내용은 한국어로 작성
