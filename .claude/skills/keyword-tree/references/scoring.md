# 점수·유사도 계산 상세

## 1. priority_score (0~100)

```
priority_score =
    35 · volume_w
  + 25 · evidence_w
  + 20 · competition_w
  + 12 · intent_value_w
  +  8 · area_bonus_w
```

| 항목 | 값 |
|---|---|
| `volume_w` | high=1.0, mid=0.6, low=0.3 |
| `evidence_w` | CASE 0건=0.0, 1건=0.6, 2건=0.85, 3건+=1.0 |
| `competition_w` | low=1.0, mid=0.55, high=0.2 |
| `intent_value_w` | judge/compare=1.0, cause=0.8, cost=0.75, case/area=0.7, howto/spec=0.5 |
| `area_bonus_w` | area_expandable & 해당 지역 CASE 보유=1.0, 그 외=0.0 |

### 설계 의도

- **근거(25점)가 검색량(35점) 다음으로 큽니다.** 근거 없는 키워드는 결국 HOLD 되므로 큐 상단에 둘 이유가 없습니다.
- **경쟁도(20점)** 를 낮게 잡은 이유: 집수리 롱테일은 경쟁 추정이 부정확합니다. 근거 여부가 더 신뢰할 만한 신호입니다.
- **cost intent를 0.75로 낮춘 이유**: M14는 금액을 단정할 수 없어(사실성 F2) 전환 가치가 제한적입니다.

### 재계산 시점

- 새 CASE 승인 시 → 해당 space/target/problem/area 노드
- 페이지 발행 시 → 형제 노드 (경쟁 자기잠식 방지)
- 주 1회 전체 재빌드

---

## 2. dedupe_key

```
dedupe_key = sha1( normalize(query_ko) | CT | sorted(required_modules) )[:16]
```

`normalize()`:

```python
def normalize(s: str) -> str:
    s = SYNONYM.sub(s)                 # references/taxonomy.md §5
    s = re.sub(r"(이|가|은|는|을|를|의|에|에서|으로|로)\b", "", s)
    s = re.sub(r"(하는법|하는방법|방법|추천|업체|잘하는곳)", "", s)
    s = re.sub(r"[\s\W_]+", "", s)
    return s
```

키가 같으면 **같은 페이지**입니다. 늦게 만든 쪽을 `MERGED` 처리합니다.

---

## 3. diff_score (파생 페이지 차별화)

```
diff_score = 0.30 · (1 - sim_text(search_intent_A, search_intent_B))
           + 0.25 · (1 - sim_text(M01_answer_A,  M01_answer_B))
           + 0.25 · (1 - jaccard(core_modules_A, core_modules_B))
           + 0.20 · (1 - jaccard(image_set_A,    image_set_B))
```

| diff_score | 판정 |
|---|---|
| ≥ 0.45 | CREATE |
| 0.25 ~ 0.45 | 사람 검토 |
| < 0.25 | MERGE |

- `sim_text`: 임베딩 코사인 유사도. 모델이 없으면 정규화 후 문자 3-gram Jaccard로 대체.
- `core_modules`: `required + selected` (순서 무시)
- `image_set`: 사용된 **원본 image_id** 집합 (편집본 id가 아님 — 크롭만 바꾼 재사용을 잡기 위함)

### 계산 예

```
A: "욕실 문틀은 왜 아래쪽부터 썩나요?"     M01="반복적인 습기 때문입니다"  modules={M01,M03,M04,M09,M19,M20}  imgs={1,2,3,7}
B: "썩은 문틀 하부만 수리할 수 있나요?"    M01="하부만 손상됐다면 가능합니다" modules={M01,M03,M05,M06,M07,M19,M20} imgs={2,4,5,9}

sim_text(intent)   = 0.41  → 0.59
sim_text(M01)      = 0.22  → 0.78
jaccard(modules)   = 4/9 = 0.44 → 0.56
jaccard(imgs)      = 1/7 = 0.14 → 0.86

diff = 0.30·0.59 + 0.25·0.78 + 0.25·0.56 + 0.20·0.86 = 0.68  → CREATE ✔
```

---

## 4. 모듈 순서 유사도 (R6)

```
order_sim(A, B) = 1 - (kendall_tau_distance(A∩B) / max_pairs)
```

같은 CT의 다른 페이지와 `order_sim ≥ 0.85` 이면 순서를 조정합니다.
공통 모듈이 3개 미만이면 검사를 건너뜁니다.

---

## 5. 옵션 모듈 랭킹

```
score(m) = 0.40 · evidence_strength(m)
         + 0.35 · intent_fit(m, search_intent)
         + 0.15 · uniqueness(m, existing_pages)
         + 0.10 · conversion_value(m, page_type)
```

`evidence_strength(m)` 계산:

| 근거 상태 | 값 |
|---|---|
| 해당 CASE 필드가 비어 있음 | 0.0 |
| 한 문장 이하의 단편 | 0.3 |
| 구체적 서술 (수치·부위·조건 포함) | 0.7 |
| 서술 + 사진 근거 | 1.0 |

**`evidence_strength < 0.3` 이면 점수와 무관하게 선택하지 않습니다.**

`conversion_value`: LANDING이면 M24=1.0, M23=0.8, M19=0.7 / WIKI면 M22=0.8, M13=0.7 / 그 외 0.3
