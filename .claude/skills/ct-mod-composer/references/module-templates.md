# 모듈별 body 스키마와 작성 예시

각 모듈의 `body` 는 아래 구조를 따릅니다. 렌더러(`components/modules/*`)와 1:1 대응합니다.

---

## M01 질문 즉답 · `AnswerBox`

```jsonc
{ "answer": "하부 힌지만 손상됐다면 용접 보강으로 복원되는 경우가 많습니다.",
  "qualifier": "다만 문틀 자체가 변형됐다면 교체 검토가 필요합니다." }
```

- 2~3문장. **질문에 먼저 답하고** 조건을 붙입니다.
- `meta_description` 은 이 문장에서 파생됩니다.

## M02 핵심 요약 · `SummaryCard`

```jsonc
{ "problem": "문이 바닥에 끌려 닫히지 않음",
  "judgement": "하부 피벗힌지 축 부식·탈락, 문짝·문틀은 정상",
  "work": "힌지 절단 → 보강 철판 → 재용접 → 수평 조정",
  "result": "개폐 정상, 끌림 해소" }
```

## M03 문제·증상 · `SymptomList`

```jsonc
{ "items": [ { "text": "문이 바닥에 끌린다", "detail": "하부 3cm 구간 긁힘" },
             { "text": "완전히 닫히지 않는다" } ] }
```

## M04 원인·발생 구조 · `CauseFlow`

```jsonc
{ "steps": [ { "n": 1, "text": "빗물·청소수가 하부에 반복 유입" },
             { "n": 2, "text": "피벗힌지 축 부식 진행" },
             { "n": 3, "text": "축 지지력 상실 → 문짝 처짐" } ],
  "observed": true }
```

`observed: false` 면 일반론입니다. **CT1 필수 근거로 쓸 수 없습니다.**

## M05 상태 구분 · `GradeCards`

```jsonc
{ "grades": [
  { "level": "경미", "desc": "약간의 끌림, 힌지 유격 있음", "action": "조정으로 해결" },
  { "level": "부분손상", "desc": "힌지 축 부식, 문짝은 정상", "action": "힌지 보강·교체" },
  { "level": "심함", "desc": "문틀 변형 동반", "action": "교체 검토" } ],
  "case_grade": "부분손상" }
```

## M06 전문가 판단 · `JudgementCallout`

```jsonc
{ "observed": ["하부 피벗힌지 축이 부식되어 탈락", "문짝 뒤틀림 없음", "문틀 직각 유지"],
  "conclusion": "힌지만 보강하면 복원 가능하다고 판단" }
```

## M07 수리·교체 기준 · `CriteriaTable`

```jsonc
{ "repair_when": ["힌지·부속만 손상", "문틀 직각 유지", "문짝 변형 없음"],
  "replace_when": ["문틀 변형·부식이 넓음", "화재 성능 훼손", "반복 수리 이력"] }
```

## M08 실제 작업 공정 · `ProcessTimeline`

```jsonc
{ "steps": [ { "n": 1, "title": "기존 힌지 절단", "desc": "부식된 축 제거", "image_variant_id": "iv_.." },
             { "n": 2, "title": "보강 철판 부착", "desc": "..." } ] }
```

**`case.work_steps` 와 개수·순서가 정확히 같아야 합니다.** 추가·삭제 금지.

## M09 일반 해결방법 · `SolutionList`

```jsonc
{ "items": [ { "icon": "build", "title": "힌지 보강 용접", "desc": "..." } ] }
```

## M10 셀프시공 절차 · `StepGuide`

```jsonc
{ "prepare": ["실리콘건", "커터", "마스킹테이프"],
  "steps": [ { "n": 1, "title": "기존 실리콘 제거", "desc": "..." } ],
  "stop_if": ["곰팡이가 벽 내부까지 번진 경우", "누수가 계속되는 경우"] }
```

`stop_if` 는 M16과 연동됩니다.

## M11 / M12 재료·공구 · `SpecTable`

```jsonc
{ "kind": "material",
  "items": [ { "name": "ABS", "features": "내수성 강함", "use": "욕실 문틀", "limit": "충격에 깨질 수 있음" } ] }
```

## M13 비교·선택 기준 · `CompareTable`

```jsonc
{ "axes": ["내수성", "비용", "시공성", "수명"],
  "items": [ { "name": "ABS", "values": ["강함", "중", "쉬움", "김"] },
             { "name": "MDF", "values": ["약함", "저", "쉬움", "짧음"] } ],
  "recommendation": "습기 있는 공간은 ABS, 건식 공간은 MDF도 가능" }
```

`items` 2개 이상 필수 (CT4 게이트 S7).

## M14 비용·시간 요소 · `CostFactors`

```jsonc
{ "factors": [
    { "name": "손상 범위", "effect": "부위가 넓을수록 자재·시간 증가" },
    { "name": "접근성", "effect": "고정 구조물이 있으면 철거 공정 추가" },
    { "name": "자재 종류", "effect": "동일 규격 부속 수급 여부에 따라 달라짐" },
    { "name": "양생 시간", "effect": "접착·용접 후 대기 시간 필요" } ],
  "disclaimer": "실제 비용은 현장 확인 후 안내드립니다.",
  "amounts": null }
```

**`amounts` 는 실제 견적 근거가 있을 때만 채웁니다.** 채울 때도 `"15만원~"` 형태 + `disclaimer` 필수.

## M15 자가 확인 · `Checklist`

```jsonc
{ "items": [ { "text": "문을 반쯤 열었을 때 저절로 움직이는가" },
             { "text": "하부에 긁힌 자국이 있는가" } ],
  "safe": true }
```

## M16 안전·중단 기준 · `SafetyBanner`

```jsonc
{ "level": "warning",
  "stop_conditions": ["전기 배선이 노출된 경우", "구조체 균열이 보이는 경우", "2m 이상 고소 작업"],
  "message": "위 상황에서는 작업을 멈추고 전문가에게 문의하세요." }
```

**접히거나 하단에 묻히지 않게 배치합니다.**

## M17 관리·예방 · `TipList`

```jsonc
{ "items": [ { "text": "청소 후 하부 물기를 닦아냅니다" },
             { "text": "6개월마다 힌지 유격을 확인합니다" } ] }
```

## M18 결과·한계 · `ResultCard`

```jsonc
{ "improved": ["개폐 정상", "바닥 끌림 해소", "소음 감소"],
  "limits": ["용접부 도장 색상이 미세하게 다름"] }
```

`limits` 를 비우지 않습니다. 한계를 함께 쓰는 것이 신뢰를 만듭니다.

## M19 실제 CASE 근거 · `CaseCitation`

```jsonc
{ "case_id": "case_gimhae_firedoor_sag_01",
  "area_label": "김해 아파트",
  "one_line": "하부 피벗힌지 절단 후 재용접으로 수평 복원",
  "url": "/case/gimhae-firedoor-sag-01",
  "thumb_variant_id": "iv_.." }
```

## M20 사진·오버레이 · `EvidenceGallery`

```jsonc
{ "focus": "judgement",
  "items": [ { "image_variant_id": "iv_..", "role": "BEFORE", "caption": "하부 3cm 끌림 자국" },
             { "image_variant_id": "iv_..", "role": "DETAIL", "caption": "피벗힌지 축 부식" } ],
  "compare": { "before": "iv_..", "after": "iv_.." } }
```

`focus` 는 `cause | judgement | process | result` 중 하나. **페이지마다 달라야 합니다** (D5).

## M21 FAQ · `FaqAccordion`

```jsonc
{ "items": [ { "q": "용접 수리하면 얼마나 가나요?", "a": "이 사례에서는 …" } ] }
```

2~4개. 이 페이지에서만 의미 있는 질문만.

## M22 관련 콘텐츠 · `RelatedGrid`

```jsonc
{ "items": [ { "url": "/wiki/pivot-hinge", "title": "피벗힌지란", "relation": "material" } ] }
```

## M23 지역·서비스 정보 · `AreaBlock`

```jsonc
{ "area_slug": "gimhae", "area_label": "김해",
  "case_count": 3,
  "cases": [ { "url": "/case/..", "title": "..", "thumb": "iv_.." } ],
  "coverage_note": "김해·양산·부산 북구 방문 가능" }
```

**`case_count` 가 0이면 이 모듈을 렌더하지 않고 페이지를 HOLD 합니다.**

## M24 CTA · `CtaBlock`

```jsonc
{ "headline": "지금 상태를 사진으로 보내주시면 가능 여부를 먼저 알려드립니다",
  "primary": { "type": "photo_upload", "label": "사진으로 상담하기" },
  "secondary": [ { "type": "tel" } ],
  "rotation_key": "entrance-judge-c" }
```

`rotation_key` 로 그룹 내 문구 중복을 막습니다 (D6).
