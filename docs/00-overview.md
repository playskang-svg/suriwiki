# 00 · 개요와 생성 전 준비

## 운영 공식

> 사람은 **현장 사실과 원본 사진**을 제공하고,
> AI는 **검색 질문에 맞는 CT와 모듈을 조합**해 CASE·WIKI·LANDING을 생성합니다.
> 글자 수를 맞추기 위해 없는 사실이나 반복 문장을 만들지 않습니다.

## 자료의 두 종류

콘텐츠 생성에 필요한 자료는 "한 번만 세팅하는 기준자료"와 "현장마다 넣는 CASE 자료" 두 종류로 나눕니다.

### A. 한 번만 세팅하는 기준자료

| 자료 | 사용 목적 | 이 저장소 위치 |
|---|---|---|
| Page Type·사이트 구조 가이드 | CATEGORY·TOPIC·CASE·WIKI·AREA·LANDING의 역할과 연결 | `docs/11-site-architecture.md` |
| CT·MOD 가이드 | Content Type, 모듈 사전, 필수·옵션 조합 규칙 | `docs/01`~`docs/03` |
| 사실성·브랜드 규칙 | 없는 지역·가격·후기 생성 금지, 공개범위, CTA·금지표현 | `docs/16-quality-gate.md` |
| 기존 URL·키워드 목록 | 이미 있는 페이지와 키워드를 확인해 중복 생성 방지 | `data/keyword-tree.json` |

### B. CASE마다 입력하는 자료

| 자료 | 내용 |
|---|---|
| 현장 사실 | 지역 · 공간 · 대상 · 문제 · 판단 · 실제 작업 · 결과/한계 |
| 원본 사진 | BEFORE · PROCESS · AFTER, 필요시 재료 · 공구 · 내부상태 사진 |

## 핵심

**완성된 긴 원고를 사람이 먼저 쓸 필요는 없습니다.**
승인된 CASE 사실과 사진이 먼저 있으면 AI가 CASE 원고와 파생 LANDING을 만들 수 있습니다.

## 전체 흐름 한눈에

```
[사람] 현장 사실 + 원본 사진 입력
        ↓
[AI]  CASE 구조화 (case-intake 스킬)
        ↓
[AI]  키워드 묶음 · LANDING 후보 6~8개 추천 (keyword-tree 스킬)
        ↓
[사람] 통합 / 분리 / 제외 / 꼭 공략할 키워드 추가
        ↓
[AI]  Page Type → CT 1개 → 필수 모듈 → 옵션 모듈 2~4개 (ct-mod-composer 스킬)
        ↓
[AI]  이미지 세트 + 설명형 오버레이 + 내부링크 연결
        ↓
[AI]  중복·사실 검수 → CREATE / UPDATE / MERGE / HOLD
        ↓
[사람] 최종 확인 → 발행
```

## 용어

| 용어 | 뜻 |
|---|---|
| Page Type | 페이지의 **역할** (CATEGORY / TOPIC / CASE / WIKI / AREA / LANDING) |
| Content Type (CT) | 페이지가 내용을 **설명하는 방식** (CT1~CT6) |
| Module (M) | 페이지 안에 들어가는 **내용 블록** (M01~M24) |
| Search Intent | 검색자가 궁금한 핵심 질문 **1문장** |
| Evidence | 모듈 서술을 뒷받침하는 CASE 사실 · 사진 ID |

관련: [01 Content Type](01-content-type.md) · [02 모듈 사전](02-module-dictionary.md) · [11 사이트 구조](11-site-architecture.md)
