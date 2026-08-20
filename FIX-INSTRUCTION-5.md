# 5차 통합 지시문 (SURIWIKI)

**이 문서가 유일한 기준이다.** `FIX-INSTRUCTION-2/3/4.md` 는 이력 참고용이며, 내용이 충돌하면 **이 문서를 따른다.**
끝까지 읽고 2절의 순서대로 수행하라.

기준 시각: 2026-08-20. 아래 "검증됨" 표시는 내가 직접 grep·DB 조회로 확인한 것이다.

---

## 0. 지켜야 할 원칙 (전 작업 공통)

1. **고치지 못한 것을 고쳤다고 하지 마라.** 막히면 막힌 지점을 그대로 보고하라.
2. **검사를 끄는 방식으로 통과시키지 마라.** 테스트를 느슨하게 고치거나, 타입을 `any` 로 덮거나, 폴백 기본값으로 때우는 것 전부 해당한다.
   > 지난 라운드에 `lib/types/db.ts` 를 `export type Database = any` 4줄로 만들어 "타입 에러 해소"라고 보고한 일이 있었다. 그건 해소가 아니라 검사를 끈 것이다. 같은 일을 반복하지 마라.
3. **`mock` · `simplified` · `we assume` · `naive` · `for now` · `dummy` 주석을 남기고 완료 처리하지 마라.**
4. **완료 조건의 명령은 실제로 실행하고 출력을 붙여라.** 붙이지 않으면 통과로 치지 않는다.
5. **숫자가 안 맞으면 데이터를 만들어내지 말고 숫자를 보고하라.**
6. **`docs/` 를 임의로 고치지 마라.** 구현과 어긋나면 보고만 하라.
7. **없는 사실을 채우지 마라.** 비용·소요시간·자재 브랜드·지역·자격·통계 전부 해당한다. 근거가 없으면 비워 두고, 그 때문에 무엇이 HOLD 되는지 보고하라. **그게 정상 동작이다.**

---

## 1. 이미 끝난 것 — 다시 하지 마라

| 항목 | 상태 | 비고 |
|---|---|---|
| R1~R7 코드 수정 | **완료 (검증됨)** | R1 은 `notes.push` 로 정상 처리 확인 |
| `lib/gate/load-context.ts` | 생성됨 | |
| `data/intent-fit.json` | 생성됨 | |
| `.gitignore` | 생성됨. `.env.local` 포함 확인 | |
| `.env.local` | **내가 고쳤다** | `SUPABASE_SERVICE_ROLE_KEY` 와 `REVALIDATE_SECRET` 값이 서로 뒤바뀌어 있었다. 정상화 완료. **덮어쓰지 마라.** |
| `lib/types/db.ts` | **내가 실제 스키마에서 생성해 교체했다** | 더미 `any` 아님. **다시 `any` 로 되돌리지 마라.** |
| `keyword_nodes` 적재 | **256행 완료** | OPEN 146 / CLAIMED 5 / HOLD 105. level 1:6 · 2:27 · 3:37 · 4:186 |
| Storage 버킷 | `cases-private`(비공개) · `public-assets`(공개) 생성 완료 | |
| `pages.optional_modules_range` 제약 | **완화 완료** | 하한 제거, 상한 4 유지. 옵션 1개 페이지 INSERT 실제 성공 확인 |

**R8 은 검증 안 됐다.** `lib/gate/structure.ts` 의 S2 가 `matrix.required_alternatives` 를 순회하는지 직접 확인하고 보고하라.

---

## 2. 남은 작업 — 이 순서대로

### A. 타입 에러 해소 + 폴백 제거 (최우선)

`lib/types/db.ts` 가 진짜 타입으로 바뀌었으므로 **`npx tsc --noEmit` 에서 새 에러가 나올 것이다. 그게 원래 있었어야 할 에러다.**

특히 여기서 드러난다:
- `lib/schemas/page-context.ts` 의 `case.work_steps` 가 DB `jsonb` 배열과 맞는지
- `image_variants` 가 행 배열로 제대로 바뀌었는지 (그리고 `facts.ts` 의 F5 가 안 깨졌는지)

**폴백 기본값을 전부 제거하라.** 값이 없으면 **큰 소리로 죽어야 한다.**

```
lib/supabase/client.ts:6   || 'dummy_key'
lib/supabase/server.ts:9   || 'dummy_key'
lib/data/page.ts:6         || 'dummy_key'
app/sitemap.ts:8           || 'dummy_key'
app/robots.ts:4            || 'https://suriwiki.com'
app/sitemap.ts:4           || 'https://suriwiki.com'
lib/seo/index.ts:4         || 'https://suriwiki.com'
```

`|| 'dummy_key'` 는 **환경변수가 없을 때 에러 대신 쓰레기 키로 조용히 연결을 시도한다.** 가장 위험한 종류의 코드다.

남은 자기의심 주석도 처리하라. 각각 **고치든지, 못 고치면 왜 못 고치는지 보고**하라.

```
lib/compose/ai.ts:62                       default: return { mock: true };
lib/compose/evidence.ts:7                  // ...simple heuristic for mock.
lib/gate/links.ts:30                       // Very naive HTML parsing...
lib/keyword-tree/scoring.ts:41             // ...simplified as 3-gram Jaccard...
app/admin/cases/[id]/analyze/page.tsx:67   // Mark as approved (mock)
app/admin/cases/new/CaseWizard.tsx:29,145  // (mock to local storage for now) / (mock)
```

### B. 테스트

`npm run test` 를 돌리고 **테스트 이름별 통과/실패 전체 목록**을 붙여라. 요약하지 마라.

R1 회귀 테스트(옵션 모듈 1개짜리가 S3 로 차단되지 **않는다**)와 R3 테스트(`canExpandArea` 와 판정 일치)가 실제로 있는지 확인하라. 없으면 추가하라.

### C. ⚠️ 홈에 가짜 시공 사례 사진이 있다 — 긴급

```
app/page.tsx:75   <img alt="싱크대 상판 크랙 보수 사례" src="https://lh3.googleusercontent.com/aida/AP1WRLux…" />
app/page.tsx:90   <img alt="문짝 파손 보수 사례"        src="https://lh3.googleusercontent.com/aida/AP1WRLs8…" />
```

`/aida/` 는 **Stitch 가 생성한 AI 목업 이미지**다. 실제 시공 사진이 아닌데 `alt` 가 "보수 사례"라고 단정한다.
이 프로젝트가 게이트 28개 규칙으로 막으려는 바로 그 위반이 홈에 박혀 있다.

**게이트는 이걸 못 잡는다.** `app/page.tsx` 는 DB 기반 페이지가 아니라 검사 대상 밖이다.

조치:
1. 두 `<img>` 를 **승인된 CASE 사진으로 교체하거나, 사례 섹션 자체를 제거하라.** 다른 자리표시자 사진으로 바꾸지 마라.
2. `app/page.tsx:149` 의 `src={img}` 출처를 추적해 같은 문제가 없는지 확인하라.
3. `next.config.ts` 의 `remotePatterns` 에서 `lh3.googleusercontent.com` 을 제거하라. `*.supabase.co` 도 프로젝트 ref 로 좁혀라.
4. DB 를 안 거치는 정적 페이지(홈·카테고리)도 최소 검사를 받게 하라 — 외부 호스트 이미지 금지, 승인 CASE 출처가 아닌 이미지의 `alt` 에 "사례·시공·전후" 단정 금지.

### D. 교체 가능한 설정 구조 — `docs/17-swappable-config.md` 를 그대로 구현

목표: **키워드 세트·연락처·지역·브랜드 이미지를 코드 수정 없이 갈아끼운다.**

문서 0절에 내가 실측한 현황이 있다 — 브랜드명 6곳 하드코딩, `SITE_URL` 폴백 3곳 중복, 지역 정의가 두 곳으로 갈라짐.

구현 순서:
1. `config/profiles/default.json` 신설. 현재 `config/site.ts` 값을 **그대로 이동**. 값을 바꾸지 마라.
2. `config/site.ts` 를 **로더로 전환**. zod 검증 실패 시 **throw 해서 빌드를 죽여라.**
3. 하드코딩 제거: `app/layout.tsx:22,23,27` · `lib/seo/index.ts:7,105,115` 의 "수리위키" → `siteConfig.brand.name`
4. `SITE_URL` 3곳 통합.
5. **`config/site.ts` 의 `areas: string[]` 삭제.** 지역 SSOT 는 DB `areas` 다. 서비스 지역은 문서 4절 SQL 처럼 **승인 CASE 가 있는 지역만** 도출한다. 손으로 만든 목록을 쓰지 마라 — F1 과 반드시 어긋난다.
6. `scripts/sync-keywords.ts` 가 `SITE_PROFILE` 을 읽어 `data/keyword-tree.<keyword_set>.json` 을 적재하게. 기존 파일은 `keyword-tree.default.json` 으로 rename. **DB 256행을 지우지 마라. upsert 여야 한다.**
7. 이미지는 문서 8절대로. **브랜드 자산(A)만 교체 가능하게 하고, CASE 사진(B)은 절대 교체 경로를 만들지 마라.** 이미지가 없으면 자리표시자를 끼우지 말고 그 영역을 빼라. OG 이미지는 `app/opengraph-image.tsx` 로 브랜드명에서 동적 생성해 교체할 파일을 0개로 만들어라.

**미리 만들지 말 것**: `keyword_nodes.profile` 컬럼. 한 DB = 한 사이트인 동안 불필요하다.

**우회하지 말 것**: 빌드가 안 된다고 `certifications` · `stats` 에 값을 채우지 마라. 게이트 F3·F7 우회다.

검증: `npm run build` 를 돌려 **전화번호가 `010-0000-0000` 인 상태로 프로덕션 빌드가 통과하는지** 확인하라. **통과하면 안 된다.** 자리표시자를 차단해야 한다.

### E. 키워드 트리 확장 — 샘플 사진에 맞는 노드가 없다

`design/` 에 실제 현장 사진 25장이 있는데, **두 주제 다 트리에 노드가 없다.** (내가 DB 조회로 확인)

- 실외기실·비둘기·방조망: **0건**. `veranda`(베란다·발코니)는 있으나 하위에 실외기실도 방조망도 없다.
- 욕조 트랩 교체·배수구 빠짐: `bath.drain` 아래 `bath.drain.odor`(냄새·역류) **하나뿐**.

`suriwiki:keyword-tree` 스킬로 노드를 신설하라. 기존 노드에 억지로 붙이지 마라.
아래는 **확정이 아니라 출발점**이다. 스킬의 taxonomy 규칙에 맞춰 네가 정하고, 정한 이유를 보고하라.

```
veranda.outdoor_unit            (실외기실)                 level 2
  veranda.outdoor_unit.pigeon   (실외기실 비둘기 유입·배설물)  level 3
    #cause / #judge / #case / #howto                       level 4
bath.drain.trap                 (배수 트랩 빠짐·이탈)        level 3
    #cause / #judge / #case                                level 4
```

### F. 실제 사진으로 CASE 6건 + E2E

**가짜 CASE 를 따로 만들지 말고 이 실제 사진으로 E2E 를 하라.** 그게 더 나은 검증이다.

**사진 내용 (내가 직접 열어서 확인함)**

- `design/비둘기 샘플이미지/` — 19장, **5개 서로 다른 현장**(샘플이미지1~5). 아파트 **에어컨 실외기실**이다. 타공 그릴 개구부로 비둘기가 드나들어 바닥·실외기 상부에 배설물이 쌓였고, AFTER 사진에는 개구부에 **방조망(검정 그물망)을 프레임에 고정 설치**한 상태가 찍혀 있다. **한 CASE 로 뭉치지 마라.**
- `design/욕조트랩 샘플이미지/` — 6장, 1개 현장. 파일명이 작업 순서다: `욕조 트랩교체 배수구 빠짐 점검구 타공1~6`.

**`case-intake` 스킬**로 현장 6건을 각각 CASE 로 만들고, 사진마다 `role` 을 붙여라
(`BEFORE`/`PROCESS`/`AFTER`/`MATERIAL`/`TOOL`/`DETAIL`/`EXCLUDE`).

**⚠️ 사생활 문제가 있는 사진이 실제로 있다.**

| 파일 | 문제 | 조치 |
|---|---|---|
| `샘플이미지1/KakaoTalk_Image_2026-03-12-14-36-32_002.jpeg` | 우측 하단에 **사람 발과 신발, 실내 러그** | 크롭 또는 `is_private=true` |
| `샘플이미지5/KakaoTalk_Image_2026-08-14-11-23-38_017.jpeg` | 방충망에 **동·호수로 보이는 "103" 표기** | 크롭 또는 `is_private=true` |

**나머지 사진도 전부 열어보고** 사람·차량 번호판·동호수·문패·택배 송장이 더 있는지 확인하라. 파일명만 보고 판단하지 마라. 발견 목록을 보고하라.

**원본은 `cases-private` 에만. `public-assets` 에는 편집본만.** 원본을 복사하지 마라 (F6).

**지역을 모른다 — 지어내지 마라.** 사진에 지역 정보가 없다. `cases.area_slug` 를 추측해 채우지 마라. F1 이 이 값에 걸려 있다. **사용자에게 "6개 현장이 각각 어느 지역이냐"고 물어라.** 답이 오기 전까지 `area_slug` 를 비우고 AREA 페이지를 만들지 마라. LANDING·CASE 페이지는 지역 없이도 만들 수 있다.

**`ct-mod-composer` 스킬**로 E 에서 만든 노드에 대해 초안을 뽑고 게이트를 통과시켜 발행하라.

비둘기 5개 현장은 내용이 비슷하므로 **D2(diff_score)·D5(이미지 Jaccard)가 걸릴 가능성이 높다. 걸리면 그게 정상이다.** 억지로 5개 다 발행하지 말고, MERGE 판정이 나오면 MERGE 하고 근거를 보고하라.

`FIX-INSTRUCTION-3.md` 3단계 체크리스트 5개를 전부 확인하라:

```
□ is_private=true 사진이 image_set 에 들어가려 하면 DB 트리거가 막는가 (F6)
□ CASE status 를 'review' 로 되돌리면 발행이 막히는가
□ 지역 노드에 CASE 없는 'seocho' 로 만들면 F1 이 걸리는가
□ 옵션 모듈 1개짜리 페이지가 S3 때문에 차단되지 않는가 (R1 — 제약은 이미 풀어놨다)
□ 게이트가 mock 이 아니라 이 실제 페이지를 읽고 있는가 (R2)
```

### G. 배포 — F 가 끝난 뒤에만

**빈 사이트를 올리지 마라.**

- Vercel 프로젝트는 **`13-suriwiki`** 를 쓴다. 새로 만들지 마라. 기존 내용은 갈아엎어도 된다 (사용자 승인함).
- **배포는 `git push origin main` 으로만 한다** (CLAUDE.md 규칙). **Vercel CLI·Netlify CLI 로 직접 배포하지 마라.**
- 그러므로 먼저 **`13-suriwiki` 에 연결된 GitHub 저장소가 무엇인지 확인하라** (Vercel → Settings → Git). 그 저장소에 push 해야 배포가 걸린다. 새 저장소를 만들면 배포가 안 걸린다.
- 환경변수 4개(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET`)를 `13-suriwiki` 에 등록.
- `npm run gate:all` 을 빌드 전 단계에 넣어 **위반 시 배포가 중단되게** 하라.
- **기존 사이트를 갈아엎는 push 이므로, push 직전에 사용자에게 확인받아라.**

---

## 3. 알려진 불일치 — 고치지 말고 보고만 하라

| 항목 | 내용 |
|---|---|
| `keyword_nodes.evidence_case_ids` | 컬럼은 `uuid[]` 인데 `keyword-tree.json` 값은 `case_gimhae_firedoor_sag_01` 같은 **문자열 slug** 다. 타입 불일치로 현재 전부 빈 배열로 적재돼 있다. E2E 에서 실제 CASE 삽입 후 그 uuid 로 채워야 한다. **스키마나 JSON 을 임의로 고치지 말고 처리 방안만 제안하라.** |
| 노드 수 | 3차 지시문의 "264개 / OPEN 151 / HOLD 105" 중 264 는 틀렸다. **실제 256개**다. OPEN 146 + CLAIMED 5 = 151 이므로 나머지는 맞다. |
| area slug 표기 | `areas[].slug` 는 하이픈(`busan-nam`), 노드 id 는 언더스코어(`#area_busan_nam`). 변환을 여러 곳에서 하지 말고 `load-context.ts` 의 정규화 함수 한 곳만 거치게 하라. |

---

## 4. 최종 보고 형식

| 항목 | 명령 | 붙일 것 |
|---|---|---|
| 타입체크 | `npx tsc --noEmit` | 종료 코드 + 에러 전체 |
| 테스트 | `npm run test` | **테스트 이름별 통과/실패 전체 목록** |
| 게이트(불량) | `npm run gate:all` | 슬러그·위반코드 + exit 1 |
| 게이트(정상) | `npm run gate:all` | exit 0 |
| 빌드 | `npm run build` | 라우트 목록 |
| 자리표시자 차단 | `npm run build` (전화번호 `010-0000-0000` 상태) | **실패해야 정상** |
| E2E | 2절 F | 발행 URL + 렌더된 HTML 일부 |

함께 보고할 것:

- **R8** 상태 (고침 / 부분 / 못 고침)
- A 의 폴백 7곳 · 주석 6곳 각각 처리 결과, 못 고쳤으면 이유
- `grep -rn "mock\|simplified\|we assume\|naive\|for now\|dummy" lib/ app/ components/` **전체 출력** (없으면 "없음")
- E 에서 신설한 노드 목록과 정한 이유
- F 의 CASE 6건 필드별 채움/비움 현황과 비운 이유
- 사진 25장의 role 분류표, `is_private=true` 로 표시한 사진과 이유
- HOLD/MERGE 된 페이지와 그 사유
- 문서와 구현이 어긋난다고 판단한 지점 (고치지 말고 보고만)
