---
name: keyword-tree
description: Suriwiki 집수리 키워드 트리를 생성·확장·검증하고 페이지 생성 큐를 뽑습니다. 키워드 선점, 키워드 트리, keyword_tree, 검색 키워드 후보, LANDING 후보 추천, 중복 키워드 판정, 지역 키워드 확장, 콘텐츠 생성 우선순위가 필요할 때 사용합니다. Use when the user asks about keyword strategy, keyword tree, SEO keyword claiming, landing page candidates, or duplicate keyword detection for the Suriwiki project.
---

# keyword-tree

집수리 검색 키워드를 **트리**로 관리해서 (1) 어디가 비어 있는지 (2) 어디에 근거(CASE)가 있는지
(3) 무엇이 중복인지를 판정하고, **콘텐츠 생성 큐**를 출력하는 스킬입니다.

규격 문서: `docs/12-keyword-tree.md` · 데이터: `data/keyword-tree.seed.json`, `data/keyword-tree.json`

---

## 언제 이 스킬을 쓰나

- 새 CASE가 등록되어 **LANDING 후보 6~8개**를 뽑아야 할 때
- 이번 주 **무엇부터 만들지** 우선순위를 정할 때
- 새 키워드가 기존 페이지와 **중복인지** 판정할 때
- **지역 확장**(강남 문틀수리 등)이 가능한지 판정할 때
- 비어 있는 키워드 영역(**선점 기회**)을 찾을 때

## 핵심 개념 (요약)

```
L0 domain → L1 space → L2 target → L3 problem → L4 intent
node id = {space}.{target}[.{problem}][#{intent}]     예: bath.doorframe.rot#judge
AREA는 레벨이 아니라 직교 축. area_expandable=true 인 노드에만 지역을 곱한다.
```

| intent | 추천 CT | 추천 Page Type |
|---|---|---|
| cause | CT1 | LANDING |
| howto | CT2 | WIKI |
| spec | CT3 | WIKI/TOPIC |
| compare | CT4 | WIKI/LANDING |
| judge | CT5 | LANDING |
| case | CT6 | CASE/LANDING |
| cost | CT5(+M14) | LANDING ※ 금액 단정 금지 |
| area | CT6(+M23) | AREA ※ 지역 CASE 필수 |

우선순위:

```
priority_score = 35·volume + 25·evidence + 20·(1-competition) + 12·intent_value + 8·area_bonus
```

**근거(CASE) 가중치가 검색량 다음으로 큽니다.** 근거 없는 고검색량 키워드는 어차피 HOLD 되기 때문입니다.

---

## 작업 절차

### 1) 트리 빌드

```bash
python3 .claude/skills/keyword-tree/scripts/build_tree.py \
  --seed data/keyword-tree.seed.json \
  --out  data/keyword-tree.json \
  [--cases data/cases.json]        # 있으면 evidence_case_ids/status 반영
```

시드의 space×target×problem×intent 를 전개하고, `compare_pairs`·`materials` 로 CT4/CT3 노드를 추가합니다.
`--cases` 를 주면 근거가 있는 노드는 `OPEN`, 근거가 필요한데 없는 노드(`cost`, `area`)는 `HOLD` 로 표시합니다.

### 2) 검증 — **항상 실행**

```bash
python3 .claude/skills/keyword-tree/scripts/validate_tree.py data/keyword-tree.json
```

검사 항목: 스키마, ID 패턴, 고아 parent, 중복 id, dedupe_key 충돌,
`area_expandable` 인데 지역 CASE 없음, `status=MERGED` 인데 `merged_into` 없음, priority 범위.

에러가 하나라도 있으면 **다음 단계로 넘어가지 않습니다.**

### 3) 생성 큐 뽑기

```bash
python3 .claude/skills/keyword-tree/scripts/plan_pages.py data/keyword-tree.json --top 30 [--format md|csv|json]
```

출력: 순위 · node_id · 검색질문 · 추천 CT · 추천 Page Type · 필수 모듈 · 점수 · 상태 · 필요 근거

### 4) 사람에게 제시 (LANDING 후보 6~8개)

한 CASE에서 후보를 뽑을 때는 **서로 다른 intent** 로 6~8개를 만듭니다.
같은 intent 두 개를 넣지 않습니다 (중복 위험).

각 후보에 대해 이렇게 제시합니다:

```
● [82] bath.doorframe.rot#judge
   질문: 썩은 문틀 하부만 수리할 수 있나요?
   CT5 진단·판단형 / LANDING
   필수: M01 M03 M05 M06 M07   근거: ✔ 문제 ✔ 판단 ✔ 사진 6장
   [한 페이지로 사용] [별도 페이지로 분리] [제외]
```

`HOLD` 후보는 **무엇이 있으면 풀리는지**를 함께 씁니다.

```
○ [44] entrance.firedoor.sag#cost   HOLD
   사유: 금액 근거 없음 → M14는 "비용이 달라지는 이유"로만 작성 가능
   해제 조건: 실제 견적 범위 자료 또는 CT5로 전환
```

### 5) 중복 판정

새 후보가 기존 페이지와 겹치는지 확인합니다.

```
dedupe_key = sha1( normalize(query) | normalize(M01답변) | sorted(핵심모듈) )
```

| 조건 | 판정 |
|---|---|
| dedupe_key 일치 | MERGE (늦은 쪽을 MERGED, merged_into 기록) |
| query 유사도 ≥0.85 AND 모듈 Jaccard ≥0.8 | MERGE |
| diff_score < 0.25 | MERGE |
| 0.25 ≤ diff_score < 0.45 | 사람 검토 |
| ≥ 0.45 | CREATE |

### 6) 상태 기록

페이지를 만들기 시작하면 `CLAIMED`, 발행되면 `PUBLISHED` + `target_page_id`.
트리 파일을 직접 수정하지 말고 `update_status.py` 를 쓰거나 Supabase `keyword_nodes` 를 갱신합니다.

---

## 절대 규칙

1. **지역 노드는 해당 지역 실제 CASE가 있을 때만 OPEN.** 없으면 `HOLD`, 삭제하지 않음(CASE가 쌓이면 자동 복귀).
2. **키워드를 만들기 위해 사실을 만들지 않음.** 근거 없는 노드는 HOLD.
3. **노드 id는 불변.** 라벨만 수정.
4. 검색량 추정치는 `volume_hint`(high/mid/low)로만 기록. **구체적 월 검색량 수치를 지어내지 않음.**
5. 한 CASE에서 뽑는 후보는 **intent가 서로 달라야 함.**

## 참고

- `references/taxonomy.md` — 공간·대상·문제 분류 기준과 동의어 정규화 사전
- `references/scoring.md` — 점수·유사도 계산 상세
- `docs/16-quality-gate.md` — HOLD 사유 전체 목록
