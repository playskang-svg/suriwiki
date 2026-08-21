# 12 · 키워드 트리 (Keyword Tree)

> **목적**: 집수리 키워드를 **선점**하기 위해, 검색 질문을 트리로 관리하고
> 어떤 노드가 아직 비어 있는지 · 어떤 노드에 근거(CASE)가 있는지 · 어떤 노드가 중복인지를
> 한 곳에서 판정합니다. 이 트리가 **콘텐츠 생성 큐**이자 **중복 방지 레지스트리**입니다.

관련 스킬: [`.claude/skills/keyword-tree/SKILL.md`](../.claude/skills/keyword-tree/SKILL.md)

---

## 1. 5-레벨 구조

```
L0  domain      집수리
 └ L1  space     욕실 · 주방 · 현관 · 베란다 · 거실/방 · 상가/외부
    └ L2  target  문틀 · 문짝 · 강화도어 · 방화문 · 싱크대상판 · 타일 · 실리콘 · 수전 · 힌지 …
       └ L3  problem  썩음 · 처짐 · 끌림 · 크랙 · 들뜸 · 누수 · 소음 · 구멍 · 곰팡이
          └ L4  intent   cause · howto · judge · compare · spec · cost · case
```

**AREA(지역)는 트리의 6번째 레벨이 아니라 직교(orthogonal) 축입니다.**
`area_expandable: true` 인 노드에만 지역을 곱해 페이지를 만들 수 있고,
**해당 지역의 실제 CASE가 있을 때만** 생성됩니다. (없으면 `HOLD`)

```
node = L1.L2.L3#L4              예) bath.doorframe.rot#judge
area page = node × area         예) bath.doorframe.rot#judge × gangnam
```

## 2. 노드 ID 규칙

```
{space}.{target}[.{problem}][#{intent}]

bath                              L1
bath.doorframe                    L2
bath.doorframe.rot                L3
bath.doorframe.rot#cause          L4
```

- 소문자 영문 + `.` + `#`. 한글 금지.
- ID는 **불변**입니다. 라벨만 바꿉니다.
- 슬러그는 ID에서 결정론적으로 생성: `bath.doorframe.rot#cause` → `bathroom-doorframe-rot-cause`

## 3. 의도(intent) 코드

| intent | 검색 질문 형태 | 추천 CT | 추천 Page Type |
|---|---|---|---|
| `cause` | 왜 이런 문제가 생기나 | CT1 | LANDING |
| `howto` | 어떻게 직접 하나 | CT2 | WIKI |
| `spec` | 이건 무엇인가 / 특징 | CT3 | WIKI · TOPIC |
| `compare` | A와 B 중 뭘 고르나 | CT4 | WIKI · LANDING |
| `judge` | 수리? 교체? 가능한가? | CT5 | LANDING |
| `case` | 실제 사례가 궁금 | CT6 | CASE · LANDING |
| `cost` | 비용은 얼마나 | CT5 + M14 | LANDING ※ 금액 단정 금지 |
| `area` | 지역 + 서비스 | CT6 + M23 | AREA ※ 지역 CASE 필수 |

## 4. 노드 스키마

```jsonc
{
  "id": "bath.doorframe.rot#judge",
  "parent_id": "bath.doorframe.rot",
  "level": 4,
  "label": "썩은 문틀 수리 가능 여부",
  "query_ko": "썩은 문틀 하부만 수리할 수 있나요",
  "aliases": ["문틀 부식 부분수리", "화장실 문틀 썩음 교체"],
  "intent": ["judge"],
  "suggested_ct": "CT5",
  "suggested_page_type": "LANDING",
  "area_expandable": true,
  "volume_hint": "mid",          // high | mid | low
  "competition_hint": "low",     // high | mid | low
  "evidence_case_ids": ["case_gangnam_bath_doorframe_01"],
  "priority_score": 82.4,        // 계산값
  "status": "OPEN",              // OPEN | CLAIMED | PUBLISHED | HOLD | MERGED
  "target_page_id": null,
  "merged_into": null,
  "dedupe_key": "sha1(query_norm|answer_norm|core_modules)",
  "notes": ""
}
```

## 5. 우선순위 점수

```
priority_score =
    35 · volume_w          (high=1.0, mid=0.6, low=0.3)
  + 25 · evidence_w        (근거 CASE 수: 0건=0, 1건=0.6, 2건=0.85, 3건+=1.0)
  + 20 · competition_w     (low=1.0, mid=0.55, high=0.2)
  + 12 · intent_value_w    (judge/compare/cost=1.0, cause=0.8, case=0.7, howto/spec=0.5)
  +  8 · area_bonus_w      (area_expandable & 해당 지역 CASE 보유 = 1.0, else 0)
                                                              → 0 ~ 100
```

> **핵심 설계 의도**: 검색량보다 **근거(CASE) 보유 여부**의 가중치를 높게 둡니다.
> 근거 없는 고검색량 키워드는 결국 HOLD 되므로 상위에 올릴 이유가 없습니다.

## 6. 상태 전이

```
OPEN ──(페이지 생성 시작)──> CLAIMED ──(사람 승인·발행)──> PUBLISHED
  │                              │
  │                              └──(근거 부족)──> HOLD ──(CASE 추가)──> OPEN
  └──(중복 판정)──> MERGED (merged_into = canonical node id)
```

| 상태 | 뜻 | 액션 |
|---|---|---|
| `OPEN` | 아직 페이지 없음, 생성 가능 | 생성 큐에 노출 |
| `CLAIMED` | 생성 중(draft/review) | 다른 생성 차단 |
| `PUBLISHED` | 발행 완료 | `target_page_id` 로 링크 |
| `HOLD` | 근거 부족 — 지역 CASE 없음, 금액 근거 없음, 원인 관찰 없음 | 사람에게 필요한 근거 요청 |
| `MERGED` | 다른 노드로 흡수 | 301 리다이렉트 대상 |

## 7. 중복 판정 (dedupe)

```
dedupe_key = sha1( normalize(query_ko) | normalize(M01_answer) | sorted(core_modules) )
```

`normalize()` = 공백·조사·특수문자 제거 + 동의어 정규화 (`화장실`→`욕실`, `부식`→`썩음`, `문틀`↔`도어프레임`)

| 상황 | 판정 |
|---|---|
| dedupe_key 완전 일치 | **MERGE** — 늦게 만든 쪽을 `MERGED` 처리 |
| query 유사도 ≥ 0.85 & 모듈 조합 Jaccard ≥ 0.8 | **MERGE** |
| 0.25 ≤ diff_score < 0.45 | 사람 검토 |
| diff_score ≥ 0.45 | **CREATE** |

diff_score 공식은 [07 R8](07-composition-rules.md) 참조.

## 8. 지역 확장 규칙 (선점 전략의 핵심 안전장치)

```python
def can_expand_area(node, area, cases):
    if not node.area_expandable:               return False, "노드가 지역 확장 대상 아님"
    if not cases.filter(area=area, target=node.target):
        return False, "해당 지역 실제 CASE 없음 → HOLD"
    if len(cases) < 1:                          return False, "근거 부족"
    return True, None
```

- 지역 페이지는 반드시 **M23 지역·서비스 정보 + M19 실제 CASE 근거 + M20 사진**을 포함합니다.
- 같은 대상의 지역 페이지끼리도 **본문 60% 이상이 달라야** 합니다(각 지역의 실제 CASE로 채우므로 자연히 달라집니다).
- 지역 CASE가 0건이면 노드를 삭제하지 말고 `HOLD` 로 두어, CASE가 쌓이면 자동으로 큐에 복귀시킵니다.

**곱할 지역 목록은 시드가 아니라 DB `areas` 테이블에서 옵니다.**
`scripts/export-areas.ts` 가 프로필의 `area_scope` 범위로 뽑아 `data/areas.json` 에 떨구고,
`build_tree.py --areas` 가 그걸 읽습니다. 자세한 건 [17 교체 가능한 설정 구조 §4-1](17-swappable-config.md) 참조.

## 9. 선점 운영 루프

```
주 1회
 0) export-areas.ts  DB areas → data/areas.json (지역 SSOT)
 1) build_tree.py    시드 + 지역 + 신규 CASE로 트리 재생성
 2) validate_tree.py 스키마·중복·고아·지역규칙 검사
 3) plan_pages.py    priority_score 상위 N개 → 이번 주 생성 큐
 4) ct-mod-composer  큐를 돌며 페이지 초안 생성 (CLAIMED)
 5) 사람 승인        → PUBLISHED, 트리에 target_page_id 기록
 6) HOLD 리포트      부족한 근거 목록을 현장팀에 전달 (예: "서초 문틀 CASE 필요")
```

## 10. 시드 택소노미

[`data/keyword-tree.seed.json`](../data/keyword-tree.seed.json) 참조.
Stitch 디자인의 서비스 구성(싱크대 복원 / 문짝·문틀 / 타일·벽지 / 욕실 수리 / 가구 수리 / 후드·조명, 그리고 강화도어·방화문·자동문)을 L1·L2에 반영했습니다.

관련: [08 AI 선택 로직](08-ai-selection-logic.md) · [16 품질 게이트](16-quality-gate.md)
