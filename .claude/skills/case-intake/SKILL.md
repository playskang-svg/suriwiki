---
name: case-intake
description: Suriwiki 현장 사실과 원본 사진을 CASE 레코드로 구조화하고, 사진 역할 분류·공개범위 확인·부족한 근거 목록을 만듭니다. CASE 입력, 현장 정보 정리, 사진 분류, 시공 사례 등록이 필요할 때 사용합니다. Use when intaking a repair job's field facts and photos into a structured Suriwiki case record.
---

# case-intake

사람이 준 **거친 현장 메모와 사진**을, 모듈이 소비할 수 있는 **CASE 레코드**로 바꿉니다.
문장을 다듬어 달라고 요구하지 않습니다. 사실만 받고 나머지는 이 스킬이 합니다.

규격: `docs/00`, `docs/04`, `docs/05`, `docs/10`

---

## 절대 규칙

1. **입력에 없는 사실을 채우지 않습니다.** 비어 있으면 비어 있는 채로 두고 "필요한 근거"에 적습니다.
2. **추측을 사실로 기록하지 않습니다.** 원인을 추정했다면 `cause_observed: false` 로 표시합니다.
3. `is_private` 사진은 어떤 페이지에도 나가지 않습니다. 캡션도 생성하지 않습니다.
4. 사람 승인(`status: approved`) 전에는 페이지 생성 스킬로 넘기지 않습니다.

---

## 절차

### 1. 원문에서 필드 추출

| 필드 | 추출 기준 |
|---|---|
| `area_*` | 지역명. 동까지 있으면 동까지. **추정 금지** |
| `building_type` | 아파트/빌라/오피스텔/단독/상가 |
| `space` / `target` | `keyword-tree` 택소노미의 id로 매핑 |
| `problem` | 눈에 보이는 증상만. "왜"는 여기 쓰지 않음 |
| `cause` | **현장에서 관찰한 것만.** 일반 지식 추론이면 `cause_observed: false` |
| `judgement` | "무엇을 보고 무엇을 정했는지" |
| `work_steps` | 실제 수행한 순서. 원문에 없는 단계를 넣지 않음 |
| `result` / `limit_note` | 달라진 점 / 남은 한계 |
| `materials` / `tools` | 언급된 것만 |
| `safety_flags` | 전기·가스·구조·심한 누수·고소작업 신호 감지 |
| `duration_note` / `maintenance` | 언급됐을 때만 |

### 2. 사진 분류

각 사진에 role 을 붙입니다: `BEFORE PROCESS AFTER MATERIAL TOOL DETAIL EXCLUDE`

```
□ 사람이 "반드시 사용" 표시한 사진 → must_use=true (분류와 무관하게 보존)
□ 사람이 "공개 금지" 표시한 사진 → is_private=true, role 무관하게 사용 금지
□ 얼굴·차량번호·문패·주소가 보이면 → 사람에게 확인 요청
□ 초점 불량·중복(pHash 유사도 ≥0.92) → EXCLUDE 후보로 표시 (삭제하지 않음)
□ 각 사진에 alt_ko 초안 작성 — 보이는 것만 서술, 추측 금지
```

### 3. 근거 강도 평가

각 모듈이 쓸 수 있는지 미리 채점합니다.

| 필드 | 근거 강도 |
|---|---|
| 비어 있음 | 0.0 → 해당 모듈 사용 불가 |
| 한 문장 단편 | 0.3 |
| 구체적 (수치·부위·조건) | 0.7 |
| 구체적 + 사진 | 1.0 |

### 4. 출력

```jsonc
{
  "case": {
    "slug": "gimhae-firedoor-sag-01",
    "area": { "sido": "경상남도", "sigungu": "김해시", "dong": null },
    "building_type": "아파트",
    "space": "entrance", "target": "firedoor", "problem_id": "sag",
    "problem": "문이 바닥에 끌려 완전히 닫히지 않음. 하부 3cm 구간 긁힘.",
    "cause": "하부 피벗힌지 축 부식으로 지지력 상실",
    "cause_observed": true,
    "judgement": "힌지 축만 부식, 문짝 뒤틀림 없음, 문틀 직각 유지 → 힌지 보강으로 복원 가능 판단",
    "work_steps": [
      { "order": 1, "title": "기존 하부 힌지 절단" },
      { "order": 2, "title": "보강 철판 부착" },
      { "order": 3, "title": "새 힌지 용접" },
      { "order": 4, "title": "수평 조정 및 개폐 확인" }
    ],
    "result": "개폐 정상, 바닥 끌림 해소",
    "limit_note": "용접부 도장 색상이 미세하게 다름",
    "materials": ["보강 철판", "피벗힌지"],
    "tools": ["용접기", "그라인더"],
    "safety_flags": [],
    "status": "review"
  },
  "images": [
    { "file": "DSC0001.jpg", "role": "BEFORE", "must_use": true, "is_private": false,
      "alt_ko": "바닥에 끌린 자국이 남은 현관문 하부", "quality": 0.86 },
    { "file": "DSC0007.jpg", "role": "EXCLUDE", "reason": "DSC0006과 유사 (pHash 0.95)" }
  ],
  "evidence_strength": {
    "M03": 1.0, "M04": 0.7, "M06": 1.0, "M08": 1.0, "M18": 0.7,
    "M11": 0.3, "M12": 0.3, "M14": 0.0, "M17": 0.0
  },
  "missing_evidence": [
    { "field": "duration_note", "blocks": ["M14"], "ask": "작업에 걸린 시간과 양생 대기가 있었는지" },
    { "field": "maintenance", "blocks": ["M17"], "ask": "고객에게 안내한 관리 방법이 있었는지" }
  ],
  "review_questions": [
    "DSC0003에 세대 호수가 보입니다. 공개해도 될까요?",
    "부식 원인을 '빗물 유입'으로 이해했는데 맞나요? (아니면 cause_observed를 false로 두겠습니다)"
  ],
  "suggested_nodes": ["entrance.firedoor.sag#judge", "entrance.firedoor.sag#case", "entrance.firedoor#area_gimhae"]
}
```

### 5. 사람에게 되묻기

`review_questions` 는 **꼭 필요한 것만 3개 이하**로. 되묻기가 많으면 입력 부담이 커집니다.
답이 없어도 진행 가능한 것은 묻지 말고 `missing_evidence` 에만 남깁니다.

---

## 다음 단계

승인(`status: approved`) 후:

1. `keyword-tree` — `suggested_nodes` 로 LANDING 후보 6~8개 추천
2. `ct-mod-composer` — 선택된 노드로 페이지 조립
