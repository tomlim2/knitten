---
title: "Shotloom Finger Retarget: scalar curl approach rationale"
tags:
  - shotloom
  - retarget
  - finger
  - vrm
  - fbx
  - rationale
  - learning
created: 2026-04-30
source: claude
---

# Shotloom Finger Retarget: scalar curl approach rationale

이 문서는 왜 4손가락을 "리맵 전체"가 아니라 "curl 중심의 scalar transfer" 로 다뤘는지 남기는 기록이다.

핵심 결론은 이렇다.

> [!abstract] 왜 이 접근을 택했나
> 4손가락에서 유지하고 싶은 것은 "얼마나 굽었는가"이지, FBX 쪽의 전체 회전 표현이 아니다.  
> 전체 quaternion 리맵은 축 컨벤션 차이와 부모 체인 회전을 같이 끌고 와서 wrist / sideways motion 을 다시 유입시켰다.  
> 그래서 cross-rig 에서 공통으로 안정적인 정보인 curl scalar 만 옮기고, VRM 쪽에서는 VRM local axis 로 다시 굽히는 방식이 맞았다.

---

## 문제 정의

우리가 원하는 건 ARP FBX animation delta 를 VRM 손가락에 그대로 복사하는 것이 아니다.

원하는 결과는 더 단순하다.

- 4손가락이 자연스럽게 curl 한다
- thumb 는 별도 규칙으로 유지한다
- 손목 회전이나 손가락의 좌우 흔들림이 따라오지 않는다
- 비율이 다른 VRM 모델에도 같은 해석이 유지된다

즉, 입력 데이터가 무엇이든 최종적으로 보존해야 할 invariant 는 "손가락 굽힘 정도"다.

---

## 왜 full remap 을 버렸나

처음에 떠오르는 방법은 FBX 손가락 본의 회전을 VRM 손가락 본에 맞춰 옮기는 것이다.  
하지만 이 방식은 실제로는 세 개의 문제를 같이 끌고 왔다.

1. 축 의미가 rig 마다 다르다
2. 부모 체인에 있는 회전이 손가락 본 회전에 섞여 들어온다
3. 손가락 한 개의 회전이 wrist / 옆 방향 움직임으로 해석되기 쉽다

이 때문에 "모양은 비슷해 보이는데 손가락이 옆으로 돈다" 같은 실패가 나왔다.

특히 4손가락 첫 번째 마디가 전체 회전처럼 보이면, 이후 마디들도 그 회전을 상속받아서 전체 손가락이 비틀린다.  
엄지는 구조상 별도 트랙으로 분리되어 있어서 상대적으로 잘 맞았고, 문제는 주로 나머지 4손가락이었다.

---

## 왜 scalar transfer 가 더 맞는가

손가락 리타겟에서 cross-rig 간 공통분모는 회전 행렬 전체가 아니라 "curl의 크기"다.

우리가 실제로 옮기고 싶은 값은 다음 한 가지다.

- ARP 쪽에서 관측된 굽힘량
- VRM 쪽에서는 VRM 자기 local axis 로 다시 적용

이렇게 하면 장점이 분명하다.

- 축 컨벤션 차이를 흡수할 수 있다
- parent chain 회전이 손가락 의미를 망치지 않는다
- 손목이 움직이지 않아야 하는 경우를 분리해서 다룰 수 있다
- 튜닝이 수치적으로 단순해진다

즉, 이 문제는 "정확한 회전 복제" 문제가 아니라 "의미를 보존하는 스칼라 전달" 문제였다.

---

## 실제로 어떤 시도를 했나

### 1. full quaternion remap

가장 먼저 생각한 방식.  
결과는 축 차이와 parent rotation 때문에 손가락이 기대한 방향으로만 안 굽었다.

### 2. wrist 방향 보정 포함

손목과 손가락의 관계를 맞추려고 방향 보정 쌍을 넣는 시도.  
하지만 finger path 에서 이 보정을 다시 걸면 wrist side motion 이 다시 살아났다.

### 3. 손가락을 curl / splay / twist 로 분해

여기서부터 결과가 좋아졌다.

- curl: 메인 신호, VRM local Z 로 처리
- splay: 제한적으로 VRM local Y 로 처리
- twist: 제한적으로 VRM local X 로 처리

이 분해는 "손가락이 어떻게 보이는가"를 각 축별로 분리해서 다룰 수 있게 해준다.

---

## 왜 curl 을 중심축으로 봤나

curl 은 손가락 모션에서 가장 안정적인 semantic 이다.

- FBX 쪽에서 표현이 조금 달라도 curl 은 비교적 읽힌다
- VRM 쪽에서도 local axis 하나로 재적용하기 쉽다
- 시각적으로 가장 먼저 눈에 띄는 변화다

반대로 splay 나 twist 는 보조 성격이다.

- splay 가 과하면 손가락이 벌어져 보이고
- twist 가 과하면 손가락이 말리거나 비틀려 보인다

그래서 기본은 curl 로 잡고, splay / twist 는 보수적으로만 섞는 편이 안전했다.

---

## 왜 손목은 따로 멈춰야 했나

손목은 finger motion 의 결과가 아니라 별도 관절이다.

그런데 full remap 계열에서는 손가락 본의 회전이 손목 회전처럼 누적되어 보이는 순간이 있었다.  
이건 손가락 문제인지 손목 문제인지가 화면에서 바로 구분되지 않게 만든다.

그래서 손목은 finger experiment 에서는 일단 정지시키고 봤다.

이렇게 해야 질문이 분리된다.

- 손가락이 제대로 curl 하는가
- 손목 보정이 필요한가

두 문제를 한 번에 해결하려 하면 원인 추적이 어려워진다.

---

## 왜 visual map 이 중요했나

이 작업의 가장 중요한 검증 도구는 `finger_compare` visualizer 였다.

이유는 단순하다.

- 숫자만 보면 "대충 맞음" 으로 착각하기 쉽다
- 손가락 옆회전은 로그보다 화면에서 훨씬 빨리 보인다
- 여러 모델을 나란히 놓으면 모델별 차이가 바로 드러난다

특히 좋은 점은 이 화면이 "retarget 이 성공했는지"가 아니라 "어디서 잘못됐는지"를 알려준다는 점이다.

- curl 은 맞는데 side motion 이 남는지
- thumb 만 정상인지
- 첫 번째 마디가 전체 회전을 끌고 가는지
- VRM 모델마다 같은 문제가 반복되는지

즉, visual map 은 검증 도구이면서 동시에 디버깅 도구였다.

---

## 왜 다른 VRM 모델에도 같은 규칙을 쓰려 했나

모델이 바뀌어도 유지되어야 하는 것은 "이 rig 는 몇 도의 curl 을 어떻게 해석하는가"이지, 특정 모델의 손목 자세가 아니다.

그래서 접근을 모델 특화 보정으로 좁히지 않았다.

- 모델마다 다른 손목/팔 자세를 맞추는 것보다
- 공통 의미인 finger curl 을 먼저 안정화하는 것이 낫다

이렇게 하면 새 VRM 이 들어와도 baseline 이 흔들리지 않는다.

---

## 이 접근의 장점

- 구현이 단순하다
- 튜닝 포인트가 적다
- visual QA 가 쉽다
- thumb / non-thumb 분리가 명확하다
- wrist side effect 를 줄이기 쉽다

---

## 이 접근의 한계

- 이것만으로 IK 문제를 해결하지는 못한다
- twist 와 splay 는 모델별로 민감할 수 있다
- curl scalar 가 좋아도 rest pose 가 틀리면 결과가 어색할 수 있다
- 손목 보정이 필요한 모델은 별도 pass 가 필요하다

즉, 이건 "최종 해법"이라기보다 "손가락 문제를 해석 가능한 최소 단위로 줄인 해법"이다.

---

## follow-up 아이디어

1. first joint / second joint / tip 에 대한 curl 분배 비율을 모델별로 비교
2. splay / twist gain 을 모델군별 preset 으로 나누기
3. thumb 은 별도 문서로 분리해서 multi-axis coupling 을 따로 다루기
4. finger_compare 에 bone name overlay 를 넣어 어떤 마디가 어떤 축을 타는지 직접 보이기
5. 손목 보정은 finger path 와 분리된 다른 pass 로 실험하기

---

## 한 줄 정리

이 작업은 "FBX 회전을 VRM 에 복제"하는 일이 아니라, "손가락 굽힘이라는 의미만 남기고 나머지 회전 잡음을 버리는 일"이었다.

---

## Related

- [[shotloom/finger-rest-align-glossary|Shotloom Finger Rest Alignment 용어 정리]]
- [[shotloom/import-normalize-retarget-pipeline|Shotloom Import → Normalize → Retarget 파이프라인 구조]]
- `crates/shotloom-retarget/examples/finger_compare.rs`
- `crates/shotloom-retarget/src/retargeter.rs`
- `crates/shotloom-character-model-normalizer/src/finger_axis_map.rs`
