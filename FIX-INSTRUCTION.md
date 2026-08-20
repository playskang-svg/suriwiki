# 재작업 지시문 (SURIWIKI)

**이 파일은 AI 코딩 에이전트에게 주는 작업 지시서다.**
이 문서 전체를 끝까지 읽고, 아래 순서대로 수행하라.

이 워크스페이스(SURIWIKI)의 1차 구현을 외부에서 검증한 결과, 보고된 "완료" 상태와 실제 코드가
다르다는 것이 확인됐다. 아래를 순서대로 고쳐라.

## 0단계 · 시작 전 (코드를 건드리기 전에 반드시)

이 문서를 끝까지 읽은 뒤, 아래를 확인해서 **먼저 보고하고 시작하라.**

```bash
# 문제가 아직 남아 있는지 직접 확인한다
sed -n '21,24p' lib/compose/rules.ts          # BUG-1: content_types[ct] 인덱싱
grep -n "expect(true)" __tests__/*.ts          # BUG-4: 가짜 테스트
grep -n "// violations.push({ code: 'L1'" lib/gate/links.ts   # BUG-3: 주석 처리된 검사
ls -1 components/common/                       # 3개뿐인지
```

보고 내용: **① 이 4가지가 실제로 남아 있는가 ② 아래 작업 목록 중 이번에 어디까지 할 것인가.**
이미 고쳐져 있는 항목이 있으면 그렇다고 말하고 건너뛰어라.

> 참고: 이 문서를 읽는 것만으로 작업이 끝나지 않는다.
> 아래 1~3단계를 실제로 수행하고, 각 단계의 **완료 조건에 적힌 명령을 실행한 출력**을 남겨야 한다.

## 지켜야 할 원칙 (먼저 읽어라)

1. **고치지 못한 것을 고쳤다고 하지 마라.** 막히면 무엇이 왜 막혔는지 그대로 보고하라.
2. **테스트를 느슨하게 만들어 통과시키지 마라.** 기대값이 안 맞으면 구현을 고치거나 보고하라.
   `expect(true).toBe(true)`, 검사 주석 처리, 임계값 완화는 모두 금지다.
3. **"simplified", "mock", "for now" 주석을 남기고 완료 처리하지 마라.**
4. 각 단계 완료 시 **실제 명령 출력**을 붙여라. 추정으로 "통과했을 것"이라고 쓰지 마라.
5. `docs/` 와 `data/` 가 규격의 단일 소스다. 코드에 표를 하드코딩하지 마라.

먼저 다음 문서를 읽어라:
`AGENTS.md`, `docs/03-ct-module-matrix.md`, `docs/07-composition-rules.md`,
`docs/09-derivation-examples.md`, `docs/16-quality-gate.md`,
`.claude/skills/ct-mod-composer/references/checklist.md`,
`.claude/skills/keyword-tree/references/scoring.md`

---

## 1단계 · 치명적 버그

### BUG-1 `lib/compose/rules.ts` — getCTMatrix 가 항상 undefined 를 반환한다

```ts
// 현재 (버그)
export function getCTMatrix(ct: string) {
  const data = getContentTypes();
  return data.content_types[ct];      // content_types 는 배열인데 문자열로 인덱싱
}
```

`data/content-types.json` 의 `content_types` 는 **배열**이다. 따라서 `getCTMatrix('CT1')` 은
`undefined` 이고, `compose.ts` 에서 `required = []` 가 되어 **필수 모듈 근거 검사가 통째로
건너뛰어진다.** 모든 페이지가 빈 모듈로 CREATE 판정된다. 이 프로젝트의 핵심 안전장치가 꺼진 상태다.

**수정**
- `code` 를 키로 하는 Map 을 만들어 조회하라.
- `required`, `required_alternatives`, `optional`, `default_order`, `fallback_ct`,
  `min_compare_items` 를 모두 반환하라.
- 모듈 로드 시 CT1~CT6 여섯 개가 전부 조회되는지 assert 하라. 하나라도 없으면 throw.
- `promotion_rules`, `intent_to_ct`, `diff_score_weights`, `decision_thresholds` 도
  같은 파일에서 읽어 쓰도록 하라. 숫자를 코드에 다시 적지 마라.

**검증**: `getCTMatrix('CT1').required` 가 `["M01","M03","M04","M09"]` 인지 확인한 출력을 보여라.

### BUG-2 `lib/compose/compose.ts`

- `moduleOrder = selectedModules.sort()` — 알파벳 정렬이다.
  → `data/content-types.json` 의 `default_order` 를 기준으로 배치하고,
    `docs/07` §모듈 배치 기본 순서 프리셋을 따르라. 프리셋에 없는 모듈은 그룹 순서
    (답변 → 진단 → 실행 → 정보 → 안전·사후 → 근거 → 연결)에 맞춰 삽입하라.
- `diffScore` 의 텍스트 유사도가 문자열 완전일치(0 또는 1)다.
  → `scoring.md` §3 대로 정규화 후 문자 3-gram Jaccard 로 구현하라.
    정규화는 `.claude/skills/keyword-tree/references/taxonomy.md` §5 동의어 사전을 쓴다.
  → **테스트를 위해 sim 값을 외부에서 주입하는 오버로드를 반드시 함께 제공하라.**
- `optional.slice(0, 4)` — 근거·의도와 무관하게 앞에서 4개를 자른다.
  → `checklist.md` 의 랭킹 점수로 정렬한 뒤 상위 4개를 취하라.
    `score = 0.40·evidenceStrength + 0.35·intentFit + 0.15·uniqueness + 0.10·conversionValue`
  → `evidenceStrength < 0.3` 은 점수와 무관하게 제외. 2개를 못 채워도 **억지로 채우지 마라.**
- 반환값의 `selected_modules` 에 optional 전체가 들어간다. **실제 채택분만** 담아라.
- `fallback_ct` 로직이 "simplified" 주석과 함께 빠져 있다.
  → 필수 모듈 근거가 없으면 `fallback_ct` 로 1회 재시도한 뒤, 그래도 안 되면 HOLD.
  → HOLD 반환에는 `required_evidence`(필요한 근거 목록)와 `alternative` 를 반드시 포함하라.

### BUG-3 `lib/gate/links.ts`

- L1(내부링크 3~8개) 검사가 **주석 처리되어 비활성**이다. 활성화하라.
- L3 이 `relaxed lengths for mock testing` 으로 10~50 자다.
  → `docs/13-seo-rules.md` 규격대로 **title 30~45자, description 70~120자** 로 되돌려라.

### BUG-4 `__tests__/compose.test.ts` — 테스트가 아무것도 검증하지 않는다

22행이 `expect(true).toBe(true)` 다. 주석에 "Why does docs say 0.68?" 이라 적어놓고
계산이 안 맞자 통과 처리했다.

**그 불일치는 문서 쪽 오류였고 이미 수정됐다.** 다시 읽어라:
- `docs/09-derivation-examples.md` 의 차별화 검증표 (페이지별 모듈·이미지 집합이 명시됨)
- `data/difftest.fixtures.json` (결정론적 픽스처, 6케이스)

**테스트를 이렇게 다시 써라.**
`difftest.fixtures.json` 을 로드해 `cases` 6건을 전부 돌리고, 각 건마다:
1. `pages` 정의에서 모듈·이미지 Jaccard 를 재계산해 `jaccard_core_modules`,
   `jaccard_image_set` 와 `tolerance`(1e-9) 이내로 일치하는지
2. `diffScore` 에 `sim_search_intent`, `sim_m01_answer` 를 주입한 결과가
   `expected_diff_score` 와 일치하는지
3. 판정이 `expected_decision`(CREATE/REVIEW/MERGE) 과 같은지

기대값 6건은 각각 0.6823 / 0.6838 / 0.7260 / 0.7299 / 0.8142 / 0.1015 이다.
**안 맞으면 픽스처를 고치지 말고 구현을 고쳐라.** 그래도 안 맞으면 보고하라.

### BUG-5 vitest 가 실행되지 않는다

```
Error: Cannot find native binding ... Cannot find module '@rolldown/binding-wasm32-wasi'
```

`node_modules` 와 `package-lock.json` 을 지우고 `npm install` 을 다시 하라.

**1단계 완료 조건** — 아래를 실제로 실행한 출력을 붙여라.
```
npx tsc --noEmit
npm run test          # 실제 통과 화면
node -e "..."         # getCTMatrix('CT1').required 출력
```

---

## 2단계 · 품질 게이트 완성

`docs/16-quality-gate.md` 의 규칙 중 **현재 8개만 구현**돼 있다.
구현됨: `F1(얕음) F6 / S1 S3(상한만) S4 S5 / D2 D4`

### `lib/gate/facts.ts`

| 코드 | 구현할 검사 |
|---|---|
| F1 | 현재 "simplified" 주석과 함께 얕게 구현됨. `keyword_node.area_slug` 와 실제 CASE 목록을 대조하는 방식으로 다시 구현하라. `keyword-tree` 의 `canExpandArea` 규칙과 동일한 결과가 나와야 한다. |
| F2 | `M14.amounts` 가 null 이 아닌데 `disclaimer` 가 없으면 위반. 본문에 근거 없는 `숫자+원/만원` 패턴이 있으면 위반. |
| F3 | JSON-LD 나 화면에 `AggregateRating`·`Review`·`reviewCount` 가 있으면 위반. `siteConfig.stats` 가 비었는데 수치가 렌더되면 위반. |
| F4 | `M08`/`M11`/`M12`/`M18` 의 항목이 대응하는 case 필드에 없으면 위반. |
| F5 | `image_variants.overlays` 의 type 이 허용 목록 밖이면 위반. 허용: `arrow box dashed callout compare steps` |
| F7 | `siteConfig.certifications` 에 없는 자격·면허·인증 문구가 본문에 있으면 위반. |

### `lib/gate/structure.ts`

| 코드 | 구현할 검사 |
|---|---|
| **S2** | **가장 중요.** `required_modules ⊆ module_order` 이고 각 필수 모듈에 evidence 가 있어야 한다. **지금 이 검사가 통째로 없다.** BUG-1 을 고친 뒤 구현하라. |
| S6 | CT6 이면 `M08.steps` 가 `case.work_steps` 와 **개수·순서까지** 일치 |
| S7 | CT4 이면 `M13.items` 가 2개 이상 (`min_compare_items`) |
| S8 | CT1 이면 `case.cause` 가 있고 `cause_observed === true` |

S3 하한(2개 미만)을 빼놓은 것은 맞다. 다만 "억지로 채우지 않았음"을 판정 사유에 남겨라.

### `lib/gate/dedupe.ts`

| 코드 | 구현할 검사 |
|---|---|
| D1 | `dedupe_key` 충돌 (keyword_nodes 조회) |
| D3 | 같은 CT 다른 페이지와 `module_order` 유사도 < 0.85 (Kendall tau, 공통 모듈 3개 미만이면 skip) |
| D5 | 이미지 세트 Jaccard < 0.6 — **편집본 id 가 아니라 원본 `image_id` 로 비교하라.** 크롭만 바꾼 재사용을 잡기 위한 검사다. |
| D6 | CTA `rotation_key` 가 같은 그룹 안에서 반복되지 않을 것 |

### `lib/gate/links.ts`

| 코드 | 구현할 검사 |
|---|---|
| L2 | 고아 페이지 금지 — 상위 TOPIC/AREA 에서 들어오는 링크가 있어야 함 |
| L4 | h1 1개 |
| L5 | 모든 이미지 alt 존재 |
| L6 | FAQPage JSON-LD 의 Q&A 가 화면에 실제 렌더되는 `M21.items` 와 일치 |
| L7 | `AggregateRating`/`Review` 마크업 없음 |

### 공통

- 각 위반의 `hint` 에 **무엇을 보고 위반이라 판단했는지**를 담아라.
- `any` 를 쓰지 마라. `lib/schemas/page-context.ts` 에 `PageContext` zod 스키마를 정의하고
  그 타입을 게이트 전체에서 써라.
- `lib/gate/run.ts` 는 위반 1건이라도 있으면 **exit 1**.

### 테스트 `__tests__/gate.test.ts`

- 규칙 하나당 **위반 케이스 1건 + 통과 케이스 1건**을 쌍으로 작성하라.
- `docs/09` 의 반례 2건이 실제로 차단되는지:
  1. 지역 CASE 없는 "서초 문틀수리" → F1 위반 + HOLD
  2. 모든 페이지 동일 FAQ 5개 → D4 위반

**2단계 완료 조건**
```
npm run gate:all            # 동작 확인
npm run gate:all            # 위반을 일부러 주입했을 때 exit 1 되는지
npm run test                # 통과 N / 실패 N
```

---

## 3단계 · 누락분 채우기

### 공통 컴포넌트 (현재 Header·BottomNav·StatStrip 3개뿐)

| 컴포넌트 | 참조 |
|---|---|
| `DesktopNav` | `design/stitch_assets/screen5_main_door.html` |
| `Footer` | `screen6_cases_door.html` 하단 (대표자·주소·연락처는 `config/site.ts` 에서 주입) |
| `Breadcrumb` | `docs/13-seo-rules.md` 의 BreadcrumbList JSON-LD 와 연동 |
| `FilterChips` | `screen4_cases.html` |
| `CaseCard` | `screen1_home.html` "최근 시공 사례" + `screen6` 카드 |
| `Container` | `grid-margin-mobile` / `grid-margin-desktop` 토큰 사용 |

색상은 Tailwind 토큰 이름으로만 쓴다. 임의 hex 금지.

### `lib/compose/ai.ts` 가 전부 mock 이다

- `generateMockDataForModule` 이 M01/M03/M08 세 개만 있고 나머지는 `{ mock: true }` 다.
- zod 파싱이 주석 처리돼 있다 — "we bypass actual zod parsing in the mock".

**수정**
1. `lib/schemas/modules.ts` 의 M01~M24 body 스키마가
   `.claude/skills/ct-mod-composer/references/module-templates.md` 와 필드까지 일치하는지 맞춰라.
2. `ModuleBodyMap[moduleCode].safeParse()` 를 **실제로 호출**하라.
   실패 → 재시도 1회 → 그래도 실패하면 저장하지 않고 HOLD 반환.
3. mock 과 실제 LLM 호출을 환경변수로 분기하되, **mock 경로에서도 zod 검증은 통과해야 한다.**
4. 24개 모듈 전부에 대해 "mock 데이터가 zod 스키마를 통과한다"는 테스트를 추가하라.

### `.env.local.example` 이 없다

`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` /
`REVALIDATE_SECRET` / LLM 키 — 각 항목에 용도 주석을 달아 작성하라.

---

## 최종 보고 형식

작업이 끝나면 아래 표를 **실제 명령 출력을 근거로** 채워라.
실행하지 않은 항목은 빈칸으로 두고 이유를 적어라. 추정으로 채우지 마라.

| 항목 | 명령 | 결과 |
|---|---|---|
| 타입체크 | `npx tsc --noEmit` | |
| 테스트 | `npm run test` | 통과 __ / 실패 __ |
| 게이트 | `npm run gate:all` | |
| 빌드 | `npm run build` | |
| BUG-1 확인 | `getCTMatrix('CT1').required` | |

그리고 아래를 함께 보고하라.

- 구현한 게이트 규칙 목록 (F/S/D/L 코드별)
- **아직 구현하지 못한 것과 그 이유**
- 문서(`docs/`)와 구현이 어긋난다고 판단한 지점이 있으면 그 목록
  (임의로 문서를 고치지 말고 보고만 하라)
