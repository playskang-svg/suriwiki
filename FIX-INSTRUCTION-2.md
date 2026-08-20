# 2차 검수 지시문 (SURIWIKI)

**이 파일은 AI 코딩 에이전트에게 주는 작업 지시서다.** 끝까지 읽고 순서대로 수행하라.

2단계·3단계 결과물을 외부에서 소스 단위로 검수했다.
**게이트 28개 규칙 코드는 전부 존재하고, 픽스처 기반 테스트도 제대로 작성됐다. 이 부분은 잘 됐다.**
다만 아래 8건이 남아 있다. R1·R2 는 이 프로젝트의 목적 자체를 무력화하는 문제이므로 먼저 고쳐라.

## 0단계 · 시작 전

먼저 아래를 실행해 문제가 실제로 남아 있는지 확인하고 **보고한 뒤** 시작하라.

```bash
grep -n "optCount < 2" lib/gate/structure.ts        # R1
grep -n "mockContext" lib/gate/run.ts                # R2
grep -n "startsWith(areaParts\|cases.length > 0" lib/gate/facts.ts   # R3
grep -n "split('\\\\n')" lib/gate/structure.ts        # R4
grep -n "split('_crop')" lib/gate/dedupe.ts          # R5
grep -n "return 0.5;\|return 0.8;" lib/compose/compose.ts   # R6
grep -n '"Mock M01"' lib/compose/compose.ts          # R7
```

## 지켜야 할 원칙

1. 고치지 못한 것을 고쳤다고 하지 마라. 막히면 그대로 보고하라.
2. 테스트를 느슨하게 만들어 통과시키지 마라.
3. "mock", "simplified", "for now", "we assume", "naive" 주석을 남기고 완료 처리하지 마라.
   **지금 코드에 그런 자기 의심 주석이 여러 개 남아 있다. 그 자리가 곧 미완성 지점이다.**
4. 완료 조건의 명령은 **실제로 실행**하고 출력을 붙여라.

---

## R1 · `lib/gate/structure.ts` — S3 하한이 스펙을 역행한다 (중요)

```ts
} else if (optCount < 2) {
  violations.push({ code: 'S3', message: '옵션 모듈 2개 미만', hint: '억지로 채우지 않았음 (증거 부족)' });
}
```

`hint` 에 "억지로 채우지 않았음"이라고 써놓고 **위반으로 처리**하고 있다.
그러면 근거가 부족해 짧게 나온 페이지가 영구히 발행 차단되고, 결국 **없는 내용을 채워 넣도록 압박**하게 된다.
이건 `docs/07-composition-rules.md` R3 과 `docs/16-quality-gate.md` S3 을 정면으로 어긴다.

> R3: "옵션 모듈은 모두 넣지 않고 실제 CASE 정보가 있는 것만 보통 2~4개 선택한다."
> 조립 스킬: "2개를 못 채워도 억지로 채우지 마라. 짧아도 사실만."

**수정**
- `GateResult` 에 `notes: {code, message}[]` 필드를 추가하라. `pass` 판정에는 영향을 주지 않는다.
- `optCount < 2` 는 `violations` 가 아니라 `notes` 에 넣어라.
  메시지: `옵션 모듈 ${optCount}개 — 근거 있는 모듈만 사용함(정상)`
- `optCount > 4` 만 violation 으로 유지한다.
- 테스트: 옵션 1개짜리 페이지가 **S3 때문에 차단되지 않는다**는 케이스를 추가하라.

---

## R2 · `lib/gate/run.ts` — 게이트가 실제 페이지를 검사하지 않는다 (치명)

```ts
// Mock page context for testing the runner itself
const mockContext = { ... }
const res = fn(mockContext);
```

하드코딩된 컨텍스트 **하나**만 검사한다. 즉 `npm run gate:all` 은
"게이트 함수가 에러 없이 돌아간다"만 확인할 뿐, **배포 차단 장치로서 아무 일도 하지 않는다.**
지금 상태로 CI 에 걸면 어떤 불량 페이지도 걸러지지 않는다.

**수정**
1. 검사 대상을 실제 데이터에서 읽어라.
   - `--source=supabase` : `pages` 중 `status IN ('review','published')` 전체
   - `--source=file --path=<glob>` : 로컬 draft JSON (Supabase 미연결 환경용)
   - `--page=<id|slug>` : 단건
   - 기본값은 `file` 로 두고, 대상이 0건이면 **"검사 대상 0건"을 명시적으로 출력하고 exit 1** 하라.
     조용히 통과시키지 마라.
2. `PageContext` 를 조립하는 로더를 `lib/gate/load-context.ts` 로 분리하라.
   `pages` + `page_modules` + `image_variants` + `case` + `keyword_node` + 렌더된 `html_body` + `json_ld`
   를 모아 zod 로 파싱한다.
3. 출력 형식
   ```
   검사 대상 12건
   ✗ /repair/xxx        S2 필수 모듈 M04 증거 부족 / F1 실제 CASE에 없는 지역
   ✓ /case/yyy          (note: 옵션 모듈 1개 — 근거 있는 모듈만 사용함)
   ...
   위반 3건 / 12건  → exit 1
   ```
4. `mockContext` 는 지우고, 러너 자체 검증은 `__tests__/gate-runner.test.ts` 로 옮겨라.

**완료 조건**: 불량 페이지 1건을 일부러 만들어 `npm run gate:all` 이 그 슬러그와 위반 코드를
출력하며 exit 1 하는 화면, 그리고 정상 페이지만 있을 때 exit 0 하는 화면을 모두 보여라.

---

## R3 · `lib/gate/facts.ts` — F1 지역 판정이 헐겁다

```ts
return normalizedArea === ... || normalizedArea.startsWith(areaParts[0]);
if (!hasCase && cases.length > 0) { ... }
```

두 가지 문제가 있다.

1. `startsWith(areaParts[0])` 때문에 **`busan` 노드가 `busan_nam` CASE 로 통과**한다.
   부산 CASE가 없어도 부산 남구 CASE 하나로 "부산 방화문 수리" 페이지가 열린다. 이게 F1 이 막아야 할
   바로 그 상황이다.
2. `cases.length > 0` 조건 때문에 **CASE 파일이 비면 F1 이 전부 통과**한다. 안전장치가 역전돼 있다.

또한 `data/cases.sample.json` 을 직접 읽고 있다. 샘플 파일은 실제 운영 데이터가 아니다.

**수정**
- 지역 매칭은 **정확 일치**만 인정하라.
- 상위-하위 지역은 `data/keyword-tree.json` 의 `areas[].parent` 체인으로만 판정하라.
  `busan` 노드는 `busan` 또는 그 **하위** 지역 CASE 가 있으면 통과,
  `busan_nam` 노드는 `busan_nam` CASE 가 있어야만 통과한다. (하위 → 상위 전파는 되지만 반대는 안 된다)
- CASE 목록이 비어 있으면 **통과가 아니라 위반**이다.
- CASE 소스는 인자로 주입받아라(`loadCases()`). 파일 경로를 게이트 안에 하드코딩하지 마라.
- **`keyword-tree` 스킬의 `canExpandArea` 와 결과가 항상 같아야 한다.**
  같은 입력 10건에 대해 두 구현의 판정이 일치하는지 확인하는 테스트를 작성하라.

---

## R4 · `lib/gate/structure.ts` — S6 이 잘못된 타입을 가정하고, 순서를 안 본다

```ts
const caseStepsCount = pageContext.case.work_steps.split('\n')...
if (pageContext.m08!.steps.length !== caseStepsCount)
```

- `docs/10-data-model.md` 에서 `work_steps` 는 **jsonb 배열** `[{order, title, note}]` 다. 문자열이 아니다.
  (입력 화면에서 textarea 로 받는다면, 저장 시점에 배열로 파싱해 두고 게이트는 배열만 다뤄라.)
- 규격은 "**개수·순서까지** 일치"인데 개수만 비교한다.
- `Array.isArray(m08?.steps)` 가 아니면 조용히 스킵한다. **CT6 인데 M08 이 없으면 S6 가 통과해 버린다.**
  (S2 가 잡아주긴 하지만, S6 자체가 침묵하면 안 된다.)

**수정**: CT6 이면 M08 존재를 먼저 요구하고, `steps[i].title` 이 `case.work_steps[i].title` 과
순서까지 1:1 대응하는지 검사하라. 불일치 시 몇 번째 단계가 다른지 hint 에 적어라.
S7 도 같은 문제가 있다(`m13?.items` 없으면 스킵). 동일하게 고쳐라.

---

## R5 · `lib/gate/dedupe.ts` — D5 가 id 문자열을 파싱해 원본을 추측한다

```ts
// Assuming ID format like "img_123_crop_1" -> "img_123"
const getOriginal = (id: string) => id.split('_crop')[0];
```

추측하지 마라. `image_variants` 테이블에 **`image_id` FK 가 있다**(`docs/10-data-model.md`).
`PageContext` 에 `image_variants: {id, image_id}[]` 를 담고, 그 `image_id` 로 Jaccard 를 계산하라.
uuid 기본키에는 `_crop` 이라는 문자열이 애초에 존재하지 않으므로 현재 코드는 항상 원본 = 편집본으로
취급하게 되고, **크롭만 바꾼 재사용을 전혀 잡지 못한다.** 이 검사의 존재 이유가 그것이다.

---

## R6 · `lib/compose/compose.ts` — 옵션 모듈 랭킹이 반쪽이다

```ts
// Helper for intent fit (mock simplified to 0.5)
function getIntentFit(...) { return 0.5; }
function getUniqueness(...) { return 0.8; }
```

두 항목이 상수라서 `score = 0.40·evidence + 0.35·0.5 + 0.15·0.8 + 0.10·conversion` 이 된다.
**검색 의도와의 적합도(0.35)가 선택에 전혀 반영되지 않는다.** 옵션 모듈이 사실상 근거 강도만으로 뽑힌다.

**수정**
- `getIntentFit`: `.claude/skills/ct-mod-composer/references/checklist.md` 의
  **intent_fit 표(질문 유형 × 모듈)** 를 데이터로 옮겨(`data/intent-fit.json`) 구현하라.
  높음 0.9 / 중간 0.55 / 낮음 0.15 / 표에 없음 0.4 로 매핑한다.
  질문 유형은 `keyword_node.intent` 에서 가져온다.
- `getUniqueness`: 같은 space/target 의 기존 발행 페이지에서 그 모듈이 쓰인 비율 `r` 에 대해 `1 - r`.
  기존 페이지가 0건이면 1.0.
- `getConversionValue`: checklist.md 의 page_type 별 표를 전부 반영하라
  (현재 LANDING·M24 한 줄만 있다).

---

## R7 · `lib/compose/compose.ts` — 중복 검사에 "Mock M01" 이 하드코딩돼 있다

```ts
const ds = diffScore(searchIntent, p.search_intent, "Mock M01", p.m01 || "Mock M01 Diff", ...)
```

M01 답변 유사도는 diff_score 가중치의 **25%** 다. 지금은 두 문자열이 항상 달라
`0.25 × 1 = 0.25` 가 무조건 가산된다. 즉 **모든 페이지가 실제보다 0.25 만큼 덜 중복돼 보인다.**
MERGE 되어야 할 페이지가 CREATE 로 빠져나간다.

**수정**: 모듈 body 를 만든 뒤 실제 `M01.answer` 로 계산하라.
M01 이 아직 없는 단계라면 diff 계산을 그 시점까지 미루고, 임시값으로 판정을 내리지 마라.

---

## R8 · `lib/gate/structure.ts` — S2 가 required_alternatives 를 안 본다

CT2 는 `M01 · M10 · M16 · (M11 또는 M12)`, CT3 는 `M01 · (M11 또는 M12)` 다.
`getCTMatrix` 가 `required_alternatives` 를 반환하도록 이미 고쳤는데, S2 는 `matrix.required` 만 순회한다.
각 대체 그룹에서 최소 1개가 `module_order` 에 있고 그것에 근거가 있는지 검사하라.
없으면 hint 에 `(M11|M12) 중 최소 1개 필요` 라고 적어라.

---

## 마지막 · 실행 증거

내 검수 환경은 Linux 이고 이 프로젝트의 `node_modules` 는 macOS(darwin-arm64) 용이라
**나는 테스트와 빌드를 직접 실행해 확인할 수 없다.** 그래서 아래는 네가 실행한 출력이 유일한 근거다.
붙여넣지 않으면 통과로 간주하지 않는다.

| 항목 | 명령 | 붙일 것 |
|---|---|---|
| 타입체크 | `npx tsc --noEmit` | 종료 코드 |
| 테스트 | `npm run test` | **테스트 이름별 통과/실패 목록 전체** |
| 게이트(불량) | `npm run gate:all` | 슬러그·위반코드 출력 + exit 1 |
| 게이트(정상) | `npm run gate:all` | exit 0 |
| 빌드 | `npm run build` | 라우트 목록 요약 |

그리고 함께 보고하라.

- R1~R8 각각: **고침 / 부분적으로 고침 / 못 고침** + 못 고쳤으면 이유
- 코드에 남은 `mock` · `simplified` · `we assume` · `naive` · `for now` 주석의 **전체 목록**
  (`grep -rn "mock\|simplified\|we assume\|naive\|for now" lib/ app/ components/` 결과)
  없으면 "없음"이라고 쓰라.
- 문서(`docs/`)와 구현이 어긋난다고 판단한 지점 (임의로 문서를 고치지 말고 보고만 하라)
