# 4차 지시문 — 안티그래비티 작업 지시서 (SURIWIKI)

**대상: 안티그래비티(Antigravity) 코딩 에이전트.**
`FIX-INSTRUCTION-2.md`(R1~R8 상세) + `FIX-INSTRUCTION-3.md`(DB 연결) + `SUPABASE-SETUP.md` 를 먼저 읽어라.
이 문서는 그 위에 **외부 검증으로 새로 확인된 사실**과 **아직 아무도 못 본 함정**을 얹은 것이다.

---

## A. 검증 완료 — 논쟁하지 말고 사실로 받아들일 것

2026-08-20 기준으로 직접 grep·DB 조회해 확인했다.

### A-1. R1~R7 은 **8건 전부 미수정 상태로 남아 있다**

| 항목 | 위치 | 남아 있는 코드 |
|---|---|---|
| R1 | `lib/gate/structure.ts:40` | `} else if (optCount < 2) {` → violations 에 push |
| R2 | `lib/gate/run.ts:17,31,38` | `const mockContext = {...}` 하나만 검사 |
| R3 | `lib/gate/facts.ts:23,27` | `normalizedArea.startsWith(areaParts[0])`, `cases.length > 0` |
| R4 | `lib/gate/structure.ts:59` | `pageContext.case.work_steps.split('\n')` |
| R5 | `lib/gate/dedupe.ts:76` | `const getOriginal = (id) => id.split('_crop')[0]` |
| R6 | `lib/compose/compose.ts:67,70` | `return 0.5;` / `return 0.8;` |
| R7 | `lib/compose/compose.ts:164` | `"Mock M01", p.m01 \|\| "Mock M01 Diff"` |
| R8 | `lib/gate/structure.ts:18` | `for (const m of matrix.required)` — `required_alternatives` 를 안 봄 |

**"이미 고쳐져 있다"고 판단되면 즉시 멈추고 보고하라.** 위 줄번호를 직접 열어 확인부터 하라.

### A-2. Supabase DB 는 실제로 살아 있다

project ref `rgdejzrlszpesuodjejw` / public 스키마. 테이블 8종 전부 존재 확인.

| 테이블 | 현재 행 수 |
|---|---|
| `areas` | **8** (busan / busan-buk / busan-nam / gimhae / yangsan / gangnam / seocho / pyeongtaek) |
| `keyword_nodes` | **0** ← 적재 필요 |
| `cases` | **0** ← E2E 로 1건 넣어야 함 |
| `case_images` `pages` `page_modules` `image_variants` `page_links` | 전부 **0** |

같은 DB 에 이전 pSEO 테이블(`pseo_regions` 3806행 등)이 공존한다. **건드리지 마라.**

### A-3. 아직 없는 것

- `.gitignore` — **없다.** (git init 전에 반드시 만들어라)
- `.env.local` — **없다.** `.env.local.example` 만 있다.
- `lib/gate/load-context.ts` — **없다.** (R2 가 요구하는 파일)
- git 저장소 자체가 초기화 안 됨 (`fatal: not a git repository`)

---

## B. 새로 발견된 함정 — 3차 지시문에도 없는 내용

### B-1. ⚠️ 노드 수는 264개가 아니라 **256개**다

`FIX-INSTRUCTION-3.md` 1-3 절의 "264개 노드", "기대: OPEN 151, HOLD 105" 는 **틀린 숫자**다.

```
data/keyword-tree.json → nodes: 256, areas: 8
```

**264 를 맞추려고 데이터를 만들어내지 마라.** 256 이 정답이다.
적재 후 실제 status 별 건수를 세어서 그 값을 보고하라. 기대값을 먼저 정해놓고 맞추지 마라.

### B-2. ⚠️ DB CHECK 제약이 R1 과 정면 충돌한다 (가장 중요)

`pages` 테이블에 이 제약이 걸려 있다:

```sql
check: array_length(selected_modules, 1) IS NULL
       OR array_length(selected_modules, 1) >= 2 AND array_length(selected_modules, 1) <= 4
```

그런데 **R1 의 요구는 "옵션 모듈 1개짜리 페이지도 통과해야 한다"** 이다.
즉 게이트(`structure.ts`)를 R1 대로 고쳐도, **DB 가 그 페이지의 INSERT 를 거부한다.**
`FIX-INSTRUCTION-3.md` 3단계 체크리스트의
`□ 옵션 모듈 1개짜리 페이지가 S3 때문에 차단되지 않는가` 는 **현재 스키마로는 절대 통과할 수 없다.**

**할 일**: 마이그레이션으로 하한을 없애라. 상한 4 는 유지한다.

```sql
alter table public.pages drop constraint if exists optional_modules_range;
alter table public.pages add constraint optional_modules_range
  check (selected_modules is null or array_length(selected_modules,1) is null
         or array_length(selected_modules,1) <= 4);
```

> 제약 이름은 실제 이름을 `\d pages` 또는 information_schema 로 확인한 뒤 쓰라. 추측하지 마라.
> **코드가 아니라 스키마가 틀렸다는 판단이므로, 고치기 전에 이 문단을 근거로 사용자에게 한 줄 보고하고 진행하라.**

### B-3. ⚠️ zod 스키마가 DB 타입과 어긋나 있다 — R4·R5 의 실제 원인

`lib/schemas/page-context.ts` 를 먼저 고치지 않으면 R4·R5 는 고칠 수 없다.

| 필드 | 현재 zod (`page-context.ts`) | 실제 DB | 조치 |
|---|---|---|---|
| `case.work_steps` | `z.string()` (16행) | `jsonb` 배열 | `z.array(z.object({order, title, note}))` 로 교체 (R4) |
| `image_variants` | **객체** `{overlays}` (45행) | 행이 여러 개인 **테이블** | `z.array(z.object({id, image_id, overlays}))` 로 교체 (R5) |
| `image_set` | `z.array(z.string())` (50행) | `uuid[]` | uuid 배열로 두되 D5 는 `image_variants[].image_id` 로 계산 |
| `case.materials` `tools` `safety_flags` | 일부 누락 | `text[]` | 추가 |

`image_variants` 가 객체에서 배열로 바뀌면 `lib/gate/facts.ts` F5(70~76행)도 같이 고쳐야 한다.
**F5 를 깨뜨린 채로 두지 마라.**

### B-4. `data/keyword-tree.json` 의 area slug 는 하이픈, 노드 id 는 언더스코어다

- `areas[].slug` = `busan-nam` (하이픈), `areas[].parent` = `busan`
- 노드 id = `entrance.firedoor#area_busan_nam` (언더스코어)
- DB `areas.slug` = `busan-nam` (하이픈), `areas.parent_slug` = `busan`

R3 에서 F1 지역 판정할 때 **이 변환을 한 곳에서만 하라.** 지금 `facts.ts:22` 의
`c.area.replace(/-/g,'_')` 같은 즉석 변환이 R3 버그의 근원이다.
정규화 함수 하나를 `lib/gate/load-context.ts` 에 두고 전부 거기를 거치게 하라.

### B-5. `scripts/sync-keywords.ts` 는 실행하면 실패한다 (3가지 이유)

1. `.env.local` 이 없어서 `process.env.NEXT_PUBLIC_SUPABASE_URL` 이 `undefined` → 즉시 exit 1.
   **tsx 는 `.env.local` 을 자동으로 안 읽는다.** 스크립트 상단에 명시적 로딩을 넣어라.
2. anon 키로는 못 쓴다. RLS 상 `keyword_nodes` 는 **anon 접근 불가**다.
   `SUPABASE_SERVICE_ROLE_KEY` 가 반드시 있어야 한다.
3. **`parent_id` FK 때문에 한 번의 `upsert()` 로는 안 들어간다.**
   현재 코드(83~85행)는 256건을 한 방에 upsert 한다 → 자식이 부모보다 먼저 들어가면 FK 위반.
   **`level` 오름차순(0→4)으로 그룹을 나눠 순차 upsert 하라.**
   `merged_into` 도 자기참조 FK 이므로 **2패스**로 처리하라 (1패스: merged_into 는 null 로 넣기 / 2패스: merged_into 만 update).
4. `status='HOLD'` 인 행은 `hold_reason` 이 반드시 있어야 한다 (DB 제약). 없는 행이 있으면 **채워 넣지 말고 어느 노드인지 보고하라.**

### B-6. service_role 키는 사용자만 넣을 수 있다

`SUPABASE_SERVICE_ROLE_KEY` 는 대시보드에서 사용자가 직접 복사해야 한다.
https://supabase.com/dashboard/project/rgdejzrlszpesuodjejw/settings/api

**키를 요청하되, 기다리는 동안 멈추지 마라.** 키 없이 가능한 작업(R1·R4·R5·R6·R7·R8, 스키마 수정,
`--source=file` 게이트 러너, 타입 생성)을 전부 끝내 놓고, 키가 오면 1-3·3단계를 이어서 하라.

`REVALIDATE_SECRET` 은 아무 랜덤 문자열이면 된다. 사용자에게 묻지 말고 직접 생성하라.

---

## C. 작업 순서 (이 순서대로)

```
0. .gitignore 생성   ← .env.local / node_modules / .next / *.tsbuildinfo / .DS_Store
   .env.local 생성   ← SUPABASE-SETUP.md 블록 그대로. service_role 은 빈칸.
1. lib/schemas/page-context.ts 수정 (B-3)      ← 이게 먼저다. 안 하면 R4·R5 못 함
2. lib/types/db.ts 재생성 + 타입 에러 해소
3. R2 (load-context.ts + run.ts 재작성)        ← 가장 큼. --source=file 부터
4. R1 (S3 → notes) + B-2 마이그레이션
5. R8 → R4 → R5 → R3 → R6 → R7
6. 키 도착 후: sync-keywords.ts 수정·실행 (B-5), Storage 버킷 2개
7. E2E 1건 (FIX-INSTRUCTION-3.md 3단계 그대로)
8. 배포 준비는 7이 끝난 뒤에만. Vercel 프로젝트는 새로 만들지 말고 사용자에게 물어라.
```

---

## D. 하지 말아야 할 것

1. 고치지 못한 것을 고쳤다고 하지 마라. 막히면 **막힌 지점을 그대로** 보고하라.
2. 테스트를 느슨하게 고쳐 통과시키지 마라. 기대값을 낮추지 마라.
3. `mock` · `simplified` · `we assume` · `naive` · `for now` 주석을 남기고 완료 처리하지 마라.
4. 숫자가 안 맞으면 **데이터를 만들어내지 말고 숫자를 보고하라** (B-1 의 264 vs 256 이 그 예다).
5. `docs/` 를 임의로 고치지 마라. 구현과 어긋나면 **보고만** 하라.
6. `pseo_*` · `company_profiles` · `consultation_leads` 등 기존 테이블을 건드리지 마라.
7. 3단계(E2E)가 끝나기 전에 배포하지 마라.

---

## E. 최종 보고 형식

| 항목 | 명령 | 붙일 것 |
|---|---|---|
| 타입체크 | `npx tsc --noEmit` | 종료 코드 |
| 테스트 | `npm run test` | **테스트 이름별 통과/실패 전체 목록** |
| 키워드 적재 | `npx tsx scripts/sync-keywords.ts` | status별 실제 건수 (256 기준) |
| 게이트(불량) | `npm run gate:all` | 슬러그·위반코드 + exit 1 |
| 게이트(정상) | `npm run gate:all` | exit 0 |
| 빌드 | `npm run build` | 라우트 목록 |
| E2E | 3단계 | 발행된 URL + 렌더된 HTML 일부 |

함께 보고할 것:

- R1~R8 각각 **고침 / 부분적으로 고침 / 못 고침** + 못 고쳤으면 이유
- B-2 (DB CHECK 제약)를 어떻게 처리했는지
- `grep -rn "mock\|simplified\|we assume\|naive\|for now" lib/ app/ components/` **전체 출력** (없으면 "없음")
- 문서와 구현이 어긋난다고 판단한 지점 (고치지 말고 보고만)
