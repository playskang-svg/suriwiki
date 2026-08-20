---
name: ct-mod-composer
description: Suriwiki CASE와 키워드 노드로부터 Content Type(CT1~CT6)을 고르고 Module(M01~M24)을 조립해 CASE·WIKI·LANDING 원고를 생성하고 CREATE/UPDATE/MERGE/HOLD를 판정합니다. CT 선택, 모듈 조합, 페이지 원고 생성, 콘텐츠 조립, 발행 검수가 필요할 때 사용합니다. Use when composing a Suriwiki page from a case, selecting content type and modules, or reviewing a draft before publishing.
---

# ct-mod-composer

승인된 CASE와 키워드 노드 1개를 받아 **페이지 1개**를 조립합니다.

규격: `docs/01`~`docs/03`, `docs/07`, `docs/08` · 데이터: `data/content-types.json`, `data/modules.json`

---

## 입력

```jsonc
{
  "case": { /* cases 레코드 + case_images */ },
  "node": { /* keyword_nodes 레코드 1개 */ },
  "existing_pages": [ { "slug": "...", "search_intent": "...", "m01": "...", "core_modules": [...], "image_ids": [...] } ]
}
```

CASE의 `status` 가 `approved` 가 아니면 **작업하지 않습니다.**

## 절차 (9단계)

### 1. 원천 CASE 확인
지역·문제·판단·공정·결과·사진을 읽고, 어떤 필드가 비어 있는지 먼저 목록화합니다.

### 2. 검색 의도 1문장
`node.query_ko` 를 **사용자가 실제로 묻는 문장**으로 바꿉니다.
→ `"방화문 처짐 수리 가능한가"` → `"바닥에 끌리는 현관문, 교체 없이 수리할 수 있나요?"`

### 3. Page Type 결정
`node.suggested_page_type` 을 기본으로 하되, CASE 근거가 강하면 CASE, 지역 슬러그가 있으면 AREA.

### 4. Content Type 1개
`data/content-types.json` 의 `intent_to_ct` 매핑을 기본으로 사용합니다. **1개만** 고릅니다.

### 5. 필수 모듈 배치
`content_types[CT].required` + `required_alternatives`(각 그룹에서 최소 1개) 를 놓습니다.
`promotion_rules` 적용: safety_flags → M16, source_case → M19, AREA → M23, LANDING → M24.

**각 필수 모듈에 근거가 있는지 확인합니다. 하나라도 없으면:**
- `fallback_ct` 가 있으면 그 CT로 재시도 (예: CT1 → CT5)
- 없으면 → `decision: "HOLD"` + 무엇이 필요한지 명시. **문장을 지어내지 않습니다.**

### 6. 옵션 모듈 2~4개
`references/checklist.md` 의 랭킹 점수로 정렬해 상위 4개까지. `evidence_strength < 0.3` 은 제외.
2개를 못 채워도 **억지로 채우지 않습니다.** 짧아도 사실만 씁니다.

### 7. 근거·이미지 연결
- 이미지 4~6장. `is_private=true` 는 절대 사용 금지. `must_use=true` 는 반드시 포함.
- 각 이미지에 이 페이지의 질문에 맞는 **오버레이 초점**을 지정 (docs/04).
- 내부링크 3~8개, 전부 실재 URL.

### 8. 중복·사실 검수
`existing_pages` 와 diff_score 계산 (docs/07 R8). `references/checklist.md` 전체 항목 검사.

### 9. 판정
`CREATE` / `UPDATE` / `MERGE` / `HOLD` 중 하나 + 이유 1문장.

---

## 출력 형식

```jsonc
{
  "page_type": "LANDING",
  "content_type": "CT5",
  "search_intent": "바닥에 끌리는 현관문, 교체 없이 수리할 수 있나요?",
  "title": "바닥에 끌리는 현관문, 수리로 해결할 수 있을까 | 수리위키",
  "meta_description": "하부 힌지만 손상됐다면 용접 보강으로 복원되는 경우가 많습니다. 김해 아파트 실제 사례로 판단 기준을 정리했습니다.",
  "source_case_id": "case_gimhae_firedoor_sag_01",
  "keyword_node_id": "entrance.firedoor.sag#judge",
  "required_modules": ["M01","M03","M05","M06","M07"],
  "selected_modules": ["M19","M20","M14"],
  "module_order": ["M01","M03","M05","M06","M07","M14","M19","M20","M24"],
  "modules": {
    "M01": { "answer": "...", "qualifier": "..." },
    "M03": { "items": [...] }
    /* … 각 모듈 body 는 docs/10-data-model.md 의 구조를 따름 */
  },
  "evidence_ids": { "M03": ["case.problem"], "M06": ["case.judgement"], "M20": ["img_..","img_.."] },
  "image_set": [{ "image_id": "img_..", "crop": {...}, "overlays": [...], "caption_ko": "..." }],
  "internal_links": [{ "url": "/case/gimhae-firedoor-sag-01", "anchor": "김해 현관문 처짐 수리 사례", "relation": "related_case" }],
  "decision": "CREATE",
  "decision_reason": "동일 질문 페이지 없음 (diff 0.71), 판단·공정 근거 충분",
  "gate_report": { "facts": "pass", "structure": "pass", "dedupe": "pass", "links": "pass" }
}
```

HOLD일 때:

```jsonc
{
  "decision": "HOLD",
  "decision_reason": "M04 원인 근거 없음 — CT1 불가",
  "required_evidence": ["현장에서 관찰한 부식 시작 지점 또는 습기 경로 기록"],
  "alternative": "CT5(진단·판단형)로 전환하면 즉시 생성 가능"
}
```

---

## 원고 작성 규칙

| 규칙 | 내용 |
|---|---|
| 문장 | 짧고 단정하지 않게. "이 사례에서는 ~했습니다" |
| M01 | 2~3문장. 질문에 **먼저 답하고** 조건을 붙임 |
| M08 | `case.work_steps` 와 **1:1**. 순서를 추가·삭제하지 않음 |
| M14 | 금액 단정 금지. "비용이 달라지는 이유" 리스트로 |
| M18 | 좋아진 점과 **남은 한계를 함께** 씀 (신뢰도) |
| M21 | 이 페이지에서만 의미 있는 질문 2~4개. 다른 페이지와 복제 금지 |
| M24 | 다음 행동 **1개**만 강조. 그룹별 3종 로테이션 |
| 전체 | 글자 수 목표를 위해 늘려 쓰지 않음 |

## 금지 표현

"100% 완벽", "무조건", "절대", "업계 1위", "최저가", "누구나 쉽게"(위험 작업), 타 업체 실명 비방
→ 전체 목록: `docs/16-quality-gate.md` §5

## 참고

- `references/checklist.md` — 발행 전 게이트 체크리스트 (그대로 실행)
- `references/module-templates.md` — 모듈별 body 스키마와 작성 예시
