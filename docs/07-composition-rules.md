# 07 · 모듈 조합 규칙

원문 8개 규칙(R1~R8)과, 구현을 위한 판정식입니다.

## R1. 중심 CT는 1개

페이지마다 중심 CT는 **1개만** 선택합니다. 다른 CT 요소는 **옵션 모듈로만** 보완합니다.

```
count(content_type) == 1
```

## R2. 근거 없으면 만들지 않는다

필수 모듈의 실제 근거가 없으면 문장을 만들어 채우지 않고 **CT를 바꾸거나 HOLD** 처리합니다.

```
∀ m ∈ required_modules(CT) : evidence(m) ≠ ∅
   else → try alternative CT → else decision = HOLD
```

## R3. 옵션 모듈은 2~4개

옵션 모듈은 모두 넣지 않고, 실제 CASE 정보가 있거나 검색자의 질문에 필요한 것만 **보통 2~4개** 선택합니다.

```
2 ≤ |selected_modules| ≤ 4
```

## R4. 위험 작업이면 M16 자동 필수

전기 · 가스 · 구조 · 심한 누수 · 고소작업처럼 위험이 있으면 **M16 안전·중단 기준**을 자동 필수로 올립니다.

```
any(safety_flags) → required_modules += M16
```

## R5. CASE 기반이면 M19·M20 우선

CASE 기반 WIKI와 LANDING은 **M19 실제 CASE 근거**와 **M20 사진·오버레이**를 우선 사용합니다.

```
source_case_id ≠ null → priority(M19) = high, priority(M20) = high
```

## R6. 모듈 순서는 질문에 따라 바꾼다

같은 CT라도 검색 질문에 따라 모듈 순서를 바꿀 수 있습니다.
**모든 페이지에 같은 목차를 반복하지 않습니다.**

```
similarity(module_order_A, module_order_B) < 0.85   # 같은 CT의 다른 페이지 간
```

## R7. 글자 수를 위한 반복 금지

목표 글자 수를 맞추기 위해 **일반론, 비슷한 FAQ, 같은 CTA**를 반복하지 않습니다.

```
FAQ 질문 텍스트 유사도 ≥ 0.85 인 항목이 다른 페이지에 존재 → 제거
CTA 문구는 페이지 그룹별로 최소 3종 로테이션
```

## R8. 같은 CASE에서 여러 LANDING을 만들 때

동일 CASE에서 여러 LANDING을 만들 때는
**검색 질문 · 첫 답변 · 핵심 모듈 조합** 중 **하나 이상이 실질적으로 달라야** 합니다.

```
diff_score = w1·(1 - sim(search_intent))
           + w2·(1 - sim(M01_answer))
           + w3·(1 - jaccard(core_modules))
           + w4·(1 - jaccard(image_set))
diff_score ≥ 0.45  →  CREATE
0.25 ≤ diff_score < 0.45  →  사람 검토
diff_score < 0.25  →  MERGE
가중치 기본값 w = [0.3, 0.25, 0.25, 0.2]
```

## 모듈 배치 기본 순서 (질문 유형별 프리셋)

프리셋은 **출발점**일 뿐이며 R6에 따라 페이지마다 조정합니다.

| 질문 유형 | 기본 순서 |
|---|---|
| 원인이 궁금 (CT1) | M01 → M03 → M04 → M05 → M09 → M19 → M20 → M24 |
| 직접 하고 싶다 (CT2) | M01 → M11/M12 → M10 → M16 → M15 → M17 → M20 |
| 대상을 알고 싶다 (CT3) | M01 → M11 → M13 → M09 → M21 → M22 |
| 뭘 골라야 하나 (CT4) | M01 → M07 → M13 → M06 → M14 → M19 → M20 → M21 |
| 수리? 교체? (CT5) | M01 → M03 → M05 → M06 → M07 → M14 → M19 → M20 → M24 |
| 실제 사례가 보고 싶다 (CT6) | M02 → M03 → M06 → M08 → M18 → M20 → M23 → M24 |

관련: [03 조합표](03-ct-module-matrix.md) · [09 파생 예시](09-derivation-examples.md) · [16 품질 게이트](16-quality-gate.md)
