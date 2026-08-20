# 3차 지시문 — 재작업 + DB 연결 (SURIWIKI)

**이 파일은 AI 코딩 에이전트에게 주는 작업 지시서다.** 끝까지 읽고 순서대로 수행하라.

## 먼저 · 지난 보고에 대해

직전 보고는 **`FIX-INSTRUCTION.md`(1차) 결과를 다시 요약한 것**이고,
`FIX-INSTRUCTION-2.md`(2차)는 수행되지 않았다. 근거:

- `lib/gate/` 파일들의 마지막 수정 시각은 07:57~08:01 인데, `FIX-INSTRUCTION-2.md` 는 10:53 에 생성됐다.
- 2차에서 지적한 R1~R8 이 **8건 전부 코드에 그대로 남아 있다.**

아래 0단계를 직접 실행해 확인하고 시작하라.

## 0단계 · 시작 전 확인

```bash
grep -n "optCount < 2" lib/gate/structure.ts          # R1
grep -n "mockContext" lib/gate/run.ts                  # R2
grep -n "startsWith(areaParts\|cases.length > 0" lib/gate/facts.ts   # R3
grep -n "split('\\\\n')" lib/gate/structure.ts          # R4
grep -n "split('_crop')" lib/gate/dedupe.ts            # R5
grep -n "return 0.5;\|return 0.8;" lib/compose/compose.ts   # R6
grep -n '"Mock M01"' lib/compose/compose.ts            # R7
```

**보고할 것**: 위 7개가 실제로 남아 있는가. 남아 있으면 그렇다고 말하고 시작하라.

## 원칙

1. 고치지 못한 것을 고쳤다고 하지 마라.
2. 테스트를 느슨하게 만들어 통과시키지 마라.
3. `mock` · `simplified` · `we assume` · `naive` · `for now` 주석을 남기고 완료 처리하지 마라.
4. 완료 조건의 명령은 실제로 실행하고 **출력을 붙여라.**
5. **`FIX-INSTRUCTION-2.md` 를 읽어라. R1~R8 의 상세 수정 방법이 거기 있다.** 이 문서는 그 위에 DB 연결을 얹은 것이다.

---

## 1단계 · DB 연결 (새로 추가된 부분)

**Supabase 에 CT·MOD 스키마가 실제로 적용됐다.** 이제 mock 이 아닌 진짜 DB 를 쓸 수 있다.
접속 정보와 적용 내역은 **`SUPABASE-SETUP.md`** 에 있다. 먼저 읽어라.

### 1-1. 환경 변수

`SUPABASE-SETUP.md` 의 `.env.local` 블록을 그대로 `.env.local` 로 만들어라.
`SUPABASE_SERVICE_ROLE_KEY` 와 `REVALIDATE_SECRET` 은 비어 있다 — 사용자에게 채워달라고 요청하고,
없어도 되는 작업은 먼저 진행하라. `.gitignore` 에 `.env.local` 이 있는지 확인하라.

### 1-2. 타입 생성

```bash
npx supabase gen types typescript --project-id rgdejzrlszpesuodjejw > lib/types/db.ts
```

기존 `lib/types/db.ts` 는 수기 작성본이므로 교체된다. 교체 후 타입 에러를 전부 해결하라.

### 1-3. 키워드 트리 적재

```bash
npx tsx scripts/sync-keywords.ts
```

`data/keyword-tree.json` 의 **264개 노드**가 `keyword_nodes` 에 들어가야 한다.
이 스크립트는 아직 한 번도 실행된 적이 없다. **동작하지 않으면 고쳐라.**
주의: `parent_id` FK 때문에 **level 오름차순으로 넣어야** 한다. `status='HOLD'` 는 `hold_reason` 이 반드시 있어야 한다.

적재 후 확인:
```sql
select status, count(*) from keyword_nodes group by status order by 2 desc;
-- 기대: OPEN 151, HOLD 105 (또는 그에 준하는 값)
```

### 1-4. Storage 버킷

`cases-private`(비공개), `public-assets`(공개) 두 개를 만들어라.
**원본 사진은 절대 `public-assets` 로 복사되지 않아야 한다.** 편집본만 올라간다 (사실성 규칙 F6).

---

## 2단계 · R1~R8 수정

`FIX-INSTRUCTION-2.md` 의 R1~R8 을 그대로 수행하라. 우선순위는 **R2 → R1 → 나머지**.

DB 가 생겼으므로 2차 지시문의 다음 항목들이 이제 제대로 구현 가능하다.

- **R2** (게이트 러너): `--source=supabase` 를 기본 경로로 구현하라.
  `pages` 에서 `status IN ('review','published')` 를 읽어 `load-context.ts` 로 `PageContext` 를 조립한다.
  **검사 대상이 0건이면 "검사 대상 0건"을 출력하고 exit 1** 하라. 조용히 통과시키지 마라.
- **R3** (F1 지역 판정): `data/cases.sample.json` 대신 **`cases` 테이블과 `areas` 테이블**을 쓰라.
  `areas.parent_slug` 체인으로 상위-하위를 판정한다.
  DB 에 시드된 `busan` ← `busan-buk` / `busan-nam` 관계로 아래를 테스트하라.

  | 노드 | CASE 보유 | 기대 |
  |---|---|---|
  | `busan-nam` | busan-nam CASE 있음 | 통과 |
  | `busan` | busan-nam CASE만 있음 | **통과** (하위 → 상위 전파) |
  | `busan-buk` | busan-nam CASE만 있음 | **차단** (형제끼리는 전파 안 됨) |
  | `seocho` | CASE 없음 | **차단** |
  | 아무 노드 | cases 테이블이 비어 있음 | **차단** (통과가 아니다) |

- **R5** (D5 이미지): `image_variants.image_id` 컬럼이 실제로 DB 에 있다. 문자열 파싱하지 말고 그 FK 를 쓰라.
- **R4** (S6 work_steps): `cases.work_steps` 는 DB 에서 **jsonb 배열**이다. 문자열이 아니다.

---

## 3단계 · E2E 1건 (이게 진짜 검증이다)

지금까지는 어떤 페이지도 실제로 만들어진 적이 없다. **CASE 1건을 끝까지 통과시켜라.**

1. `cases` 에 CASE 1건 삽입 (`area_slug='gimhae'`, `space='entrance'`, `target='firedoor'`,
   `problem_id='sag'`, `cause_observed=true`, `work_steps` 는 jsonb 배열 4단계, `status='approved'`)
2. `case_images` 에 5장 삽입. **그중 1장은 `is_private=true`** 로 두어라.
3. `composePage()` 로 노드 `entrance.firedoor.sag#judge` 에 대한 페이지 초안 생성
4. `page_modules` 에 모듈 body 저장 (`ai.ts` 경유, zod 통과 필수)
5. `npm run gate:all` 실행 → **위반 목록 출력**
6. 위반을 고치고 `status='published'` 로 발행
7. `npm run build` → 그 페이지가 정적 생성되는지 확인
8. `npm run dev` 로 실제 URL 접속 → **화면 스크린샷 또는 렌더된 HTML 일부**를 보고에 첨부

### 이 과정에서 반드시 확인할 것

```
□ is_private=true 사진이 image_set 에 들어가려 하면 DB 트리거가 막는가 (F6)
□ CASE status 를 'review' 로 되돌리면 발행이 막히는가
□ 지역 노드에 CASE 없는 'seocho' 로 만들면 F1 이 걸리는가
□ 옵션 모듈 1개짜리 페이지가 S3 때문에 차단되지 **않는가** (R1)
□ 게이트가 mock 이 아니라 이 실제 페이지를 읽고 있는가 (R2)
```

---

## 4단계 · 배포 준비 (코드가 통과한 뒤에만)

3단계가 끝나기 전에는 배포하지 마라. 빈 사이트를 올릴 이유가 없다.

1. `git init` 후 GitHub 저장소에 push (`.env.local`, `node_modules`, `.next` 제외 확인)
2. Vercel 프로젝트 연결 (기존 `suriwiki` / `13-suriwiki` 프로젝트가 이미 있으니 **새로 만들지 말고 사용자에게 어느 것을 쓸지 물어라**)
3. 환경 변수 4개를 Vercel 에 등록
4. `npm run gate:all` 을 빌드 전 단계에 넣어 **위반 시 배포가 중단되게** 하라
5. 프리뷰 배포 → URL 보고

---

## 최종 보고

| 항목 | 명령 | 붙일 것 |
|---|---|---|
| 타입체크 | `npx tsc --noEmit` | 종료 코드 |
| 테스트 | `npm run test` | **테스트 이름별 통과/실패 전체 목록** |
| 키워드 적재 | `scripts/sync-keywords.ts` | status별 건수 |
| 게이트(위반 있음) | `npm run gate:all` | 슬러그·위반코드 + exit 1 |
| 게이트(정상) | `npm run gate:all` | exit 0 |
| 빌드 | `npm run build` | 라우트 목록 |
| E2E | 3단계 | 발행된 URL + 렌더 결과 |

함께 보고할 것:

- R1~R8 각각 **고침 / 부분적으로 고침 / 못 고침** + 못 고쳤으면 이유
- `grep -rn "mock\|simplified\|we assume\|naive\|for now" lib/ app/ components/` 결과 **전체**
  (없으면 "없음")
- 문서와 구현이 어긋난다고 판단한 지점 (임의로 문서를 고치지 말고 보고만 하라)
