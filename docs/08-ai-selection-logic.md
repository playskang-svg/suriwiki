# 08 · AI 모듈 선택 로직

| 순서 | 처리 | AI 동작 |
|---|---|---|
| 1 | 원천 CASE 확인 | 승인된 지역·문제·판단·공정·결과·사진 읽기 |
| 2 | 검색 의도 정의 | 검색자가 궁금한 질문을 **1문장**으로 정의 |
| 3 | Page Type 결정 | CASE·WIKI·LANDING 등 페이지 역할 선택 |
| 4 | Content Type 선택 | CT1~CT6 중 중심 CT **1개** 선택 |
| 5 | 필수 모듈 배치 | CT 조합표의 필수 모듈로 뼈대 구성 |
| 6 | 옵션 모듈 선택 | 실제 데이터가 있는 모듈 **2~4개** 추가 |
| 7 | 근거·이미지 연결 | CASE·사진·설명형 오버레이·내부링크 연결 |
| 8 | 중복·사실 검수 | 기존 URL과 질문·답·모듈 조합이 겹치는지 확인 |
| 9 | 판정 | **CREATE / UPDATE / MERGE / HOLD** 중 하나 선택 |

---

## 실행 의사코드

```python
def compose_page(case, keyword_node, existing_pages):
    # 1. 원천 CASE
    assert case.status == "approved"

    # 2. 검색 의도 1문장
    search_intent = to_single_question(keyword_node)   # "썩은 문틀은 하부만 수리할 수 있을까?"

    # 3. Page Type
    page_type = decide_page_type(keyword_node)         # CASE | WIKI | LANDING | TOPIC | AREA

    # 4. Content Type (1개)
    ct = pick_ct(search_intent, keyword_node.intent, case)

    # 5. 필수 모듈
    required = CT_MATRIX[ct]["required"]
    if any(case.safety_flags): required += ["M16"]
    if page_type == "AREA":    required += ["M23"]
    if page_type == "LANDING": required += ["M24"]

    for m in required:
        if not evidence_for(m, case):
            alt = fallback_ct(ct, m)                   # 예: CT1 -> CT5
            if alt: return compose_page_with(alt)
            return {"decision": "HOLD", "reason": f"{m} 근거 없음"}

    # 6. 옵션 모듈 2~4개 (근거 점수 상위)
    optional = rank_optional(CT_MATRIX[ct]["optional"], case, search_intent)[:4]
    optional = [m for m in optional if evidence_for(m, case)]
    if len(optional) < 2:
        optional = optional  # 강제로 채우지 않는다. 짧아도 사실만.

    # 7. 근거·이미지
    module_order = order_modules(ct, search_intent, required + optional)
    image_set    = build_image_set(case, search_intent, target=(4, 6))
    links        = pick_internal_links(keyword_node, existing_pages)

    # 8. 중복 검수
    dup = max((diff_score(candidate, p) for p in existing_pages), default=1.0)

    # 9. 판정
    decision = decide(dup, page_type, existing_pages)
    return {...}
```

## 판정 기준

| 판정 | 조건 | 후속 동작 |
|---|---|---|
| **CREATE** | 동일/유사 질문 페이지 없음 (diff_score ≥ 0.45) | 새 URL 생성, 키워드 노드 `CLAIMED` |
| **UPDATE** | 같은 질문의 페이지가 있고 새 CASE 근거가 추가됨 | 기존 페이지에 M19/M20 보강, URL 유지 |
| **MERGE** | 질문·첫 답변·모듈 조합이 실질적으로 같음 (diff_score < 0.25) | 한쪽을 canonical로, 다른 쪽 301 |
| **HOLD** | 필수 모듈 근거 부족, 지역 CASE 없음, 금액 근거 없음 | 생성 보류, 필요한 근거를 사람에게 요청 |

## 옵션 모듈 랭킹 점수

```
score(m) = 0.40 · evidence_strength(m, case)      # 0~1, 근거의 구체성
         + 0.35 · intent_fit(m, search_intent)    # 0~1, 질문과의 관련도
         + 0.15 · uniqueness(m, existing_pages)   # 0~1, 다른 페이지와 덜 겹칠수록 ↑
         + 0.10 · conversion_value(m, page_type)  # 0~1, LANDING이면 M24/M23 가산
```

`evidence_strength < 0.3` 인 모듈은 점수와 무관하게 **선택하지 않습니다**.

## 출력 스키마 (AI가 반환해야 하는 JSON)

```jsonc
{
  "page_type": "LANDING",
  "content_type": "CT5",
  "search_intent": "썩은 문틀은 하부만 수리할 수 있을까?",
  "source_case_id": "case_gangnam_bath_doorframe_01",
  "keyword_node_id": "bath.doorframe.rot#repair-vs-replace",
  "required_modules": ["M01","M03","M05","M06","M07"],
  "selected_modules": ["M19","M20","M14"],
  "module_order": ["M01","M03","M05","M06","M07","M14","M19","M20","M24"],
  "evidence_ids": {
    "M03": ["case.problem"],
    "M06": ["case.judgement"],
    "M20": ["img_001","img_004","img_009"]
  },
  "image_set": ["iv_101","iv_102","iv_103","iv_104"],
  "internal_links": ["/wiki/doorframe-abs", "/case/gangnam-bath-doorframe"],
  "decision": "CREATE",
  "decision_reason": "동일 질문 페이지 없음(diff 0.62), 판단 근거 충분"
}
```

관련: [07 조합 규칙](07-composition-rules.md) · [16 품질 게이트](16-quality-gate.md)
