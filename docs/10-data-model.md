# 10 · 데이터 모델

## 개발 구현에 필요한 최소 저장값 (원문)

| 필드 | 저장 내용 |
|---|---|
| `page_type` | CATEGORY / TOPIC / CASE / WIKI / AREA / LANDING |
| `content_type` | CT1~CT6 |
| `search_intent` | 검색자가 궁금한 핵심 질문 1문장 |
| `source_case_id` | 근거가 되는 원천 CASE |
| `required_modules` | CT 조합표에 따른 필수 모듈 |
| `selected_modules` | 실제로 선택한 옵션 모듈 |
| `module_order` | 본문에 배치된 모듈 순서 |
| `evidence_ids` | 사진·CASE·참고 근거 ID |
| `image_set` | LANDING별 사용 이미지와 편집본 연결 |
| `decision` | CREATE / UPDATE / MERGE / HOLD |

---

## 전체 엔터티

```
areas ──┐
        ├─< cases ──< case_images ──< image_variants >── pages
targets ┘                                    │
                                             │
keyword_nodes ──< keyword_aliases            │
      │                                      │
      └──────────────< pages >───────────< page_modules
                         │
                         └──< page_links
```

### `cases` — 원천 현장 사실

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid pk | |
| `slug` | text uniq | `gangnam-bath-doorframe-01` |
| `area_id` | fk areas | 시도/시군구/동 |
| `building_type` | text | 아파트/빌라/오피스텔/단독/상가 |
| `space` | text | 욕실/주방/현관/베란다/거실/방/외부 |
| `target` | text | 문틀/문짝/타일/실리콘/수전… |
| `problem` | text | M03 근거 |
| `cause` | text null | M04 근거 (없으면 CT1 불가) |
| `judgement` | text | M06 근거 |
| `work_steps` | jsonb | `[{"order":1,"title":"철거","note":"…"}]` M08 근거 |
| `result` | text | M18 근거 |
| `limit_note` | text null | M18 한계 |
| `materials` | text[] | M11 |
| `tools` | text[] | M12 |
| `duration_note` | text null | M14 |
| `maintenance` | text null | M17 |
| `safety_flags` | text[] | `electric,gas,structure,severe_leak,height` → M16 자동 필수 |
| `status` | enum | `draft/review/approved` |
| `approved_by`, `approved_at` | | 사람 승인 |

### `case_images` — 원본 사진

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid pk | |
| `case_id` | fk cases | |
| `storage_path` | text | Supabase Storage 경로 |
| `role` | enum | BEFORE/PROCESS/AFTER/MATERIAL/TOOL/DETAIL/EXCLUDE |
| `must_use` | bool | 사람이 "반드시 사용" 표시 |
| `is_private` | bool | 사람이 "공개 금지" 표시 → 어떤 페이지에도 사용 금지 |
| `phash` | text | 유사 사진 검출 |
| `quality_score` | numeric | 0~1 |
| `alt_ko` | text | 접근성/SEO |
| `sort_order` | int | |

### `image_variants` — 페이지용 편집본

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid pk | |
| `image_id` | fk case_images | |
| `page_id` | fk pages null | null이면 재사용 가능한 공용 편집본 |
| `crop` | jsonb | `{x,y,w,h}` 0~1 비율 |
| `overlays` | jsonb | `[{type,rect|at,label,text}]` |
| `caption_ko` | text | |
| `output_path` | text | 렌더된 webp |

### `keyword_nodes` — 키워드 트리 (→ [12](12-keyword-tree.md))

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | text pk | `bath.doorframe.rot#repair-vs-replace` |
| `parent_id` | text null | |
| `level` | int | 0~4 |
| `label` | text | 표시명 |
| `query_ko` | text | 대표 검색어 |
| `intent` | text[] | cause/howto/spec/compare/judge/case/area/cost |
| `suggested_ct` | text | CT1~CT6 |
| `suggested_page_type` | text | |
| `area_expandable` | bool | 지역 확장 허용 여부 |
| `volume_hint` | enum | high/mid/low |
| `competition_hint` | enum | high/mid/low |
| `evidence_case_ids` | uuid[] | 근거 CASE |
| `priority_score` | numeric | 0~100 (계산값) |
| `status` | enum | OPEN/CLAIMED/PUBLISHED/HOLD/MERGED |
| `target_page_id` | fk pages null | |
| `merged_into` | text null | MERGED일 때 canonical 노드 |
| `dedupe_key` | text | 질문+첫답변+핵심모듈 해시 |

### `pages` — 생성된 페이지

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid pk | |
| `slug` | text uniq | URL 경로 |
| `page_type` | enum | CATEGORY/TOPIC/CASE/WIKI/AREA/LANDING |
| `content_type` | enum | CT1~CT6 |
| `search_intent` | text | 1문장 |
| `title`, `meta_description` | text | |
| `source_case_id` | fk cases null | |
| `keyword_node_id` | fk keyword_nodes null | |
| `required_modules` | text[] | |
| `selected_modules` | text[] | |
| `module_order` | text[] | |
| `evidence_ids` | jsonb | `{"M03":["case.problem"], "M20":["img_.."]}` |
| `image_set` | uuid[] | image_variants |
| `decision` | enum | CREATE/UPDATE/MERGE/HOLD |
| `decision_reason` | text | |
| `canonical_page_id` | fk pages null | MERGE 시 |
| `status` | enum | draft/review/published/hold |
| `published_at` | timestamptz null | |

### `page_modules` — 모듈별 실제 본문

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `page_id` | fk pages | |
| `module_code` | text | M01~M24 |
| `position` | int | module_order 내 순서 |
| `body` | jsonb | 모듈별 구조 (아래) |
| `evidence` | jsonb | 근거 참조 |
| pk | (page_id, module_code) | |

**모듈 body 구조 예**

```jsonc
"M01": { "answer": "하부만 손상됐다면 부분수리가 가능한 경우도 있습니다.", "qualifier": "단, 경첩부 처짐이 있으면 교체가 필요합니다." }
"M05": { "grades": [{"level":"경미","desc":"표면 변색"},{"level":"부분손상","desc":"하부 30cm 부식"},{"level":"심함","desc":"전체 뒤틀림"}] }
"M08": { "steps": [{"n":1,"title":"철거","desc":"…","image_variant_id":"iv_.."}] }
"M13": { "axes":["내수성","비용","시공성"], "items":[{"name":"ABS","values":["강함","중","쉬움"]},{"name":"MDF","values":["약함","저","쉬움"]}] }
"M21": { "items":[{"q":"하부만 교체할 수 있나요?","a":"…"}] }
"M24": { "headline":"사진으로 먼저 확인해 드립니다","actions":[{"type":"tel"},{"type":"kakao"},{"type":"photo_upload"}] }
```

### `page_links` — 내부링크(M22)

`from_page_id`, `to_page_id`, `anchor_text`, `relation` (`related_case`/`material`/`compare`/`parent_topic`)

---

## Enum 정리

```sql
page_type    : CATEGORY | TOPIC | CASE | WIKI | AREA | LANDING
content_type : CT1 | CT2 | CT3 | CT4 | CT5 | CT6
decision     : CREATE | UPDATE | MERGE | HOLD
page_status  : draft | review | published | hold
kw_status    : OPEN | CLAIMED | PUBLISHED | HOLD | MERGED
image_role   : BEFORE | PROCESS | AFTER | MATERIAL | TOOL | DETAIL | EXCLUDE
```

실제 DDL은 [`supabase/migrations/0001_init.sql`](../supabase/migrations/0001_init.sql) 참조.

관련: [15 개발 사양](15-dev-spec.md) · [12 키워드 트리](12-keyword-tree.md)
