---
name: keyword-tree
description: 키워드 × 지역 트리를 곱해 무한 확장되는 pSEO 정적 사이트를 처음부터 다시 만들 때 쓰는 아키텍처 청사진 — DB 스키마, Next.js 라우팅, 콘텐츠 버전 시스템, 키워드별 분할배포 구조
---

# keyword-tree — 키워드×지역 트리 pSEO 사이트 청사진

**이게 뭔가**: 타깃 키워드 몇 개(예: "도배장판", "이사업체", "정화조청소" 등 무엇이든)를
전국 지역 트리(시/도 → 시/군/구 → 읍/면/동 → 필요하면 그 아래까지)와 곱해서, 조합마다
정적 페이지 하나씩을 만드는 pSEO(programmatic SEO) 사이트 엔진. **데이터(키워드/지역/콘텐츠)만
Supabase에서 갈아끼우면 완전히 다른 주제·완전히 다른 사이트가 된다** — 코드는 그대로.

이 문서는 실제로 이 엔진을 처음부터 끝까지 만들면서(도배장판 사이트, `pseo-site/`) 검증된
구조를 그대로 옮겨 적은 것이다. 새 사이트를 이 패턴으로 다시 만들 때 참고한다.

운영 중인 사이트를 유지보수하는 절차(빌드/검증/배포 명령어, 실제 겪은 버그와 수정)는
[[pseo-site-ops]] 스킬을 따로 참고 — 이 문서는 "왜 이렇게 설계했는가"와 "처음부터 어떻게
다시 짜는가"에 집중한다.

## 0. 기술 스택

- **Next.js 14 App Router**, `output: 'export'` (완전 정적 export — 서버 없음)
- **Supabase Postgres**: anon key(읽기 전용, RLS)로 앱이 읽고, `service_role` 키를 쓰는
  독립 Node 스크립트(`scripts/*.mjs`)로만 쓴다. `service_role` 키는 절대 `NEXT_PUBLIC_`
  접두사를 붙이지 않고, `.env.local`에만 두고, 절대 커밋하지 않는다.
- **Cloudflare Pages**: 정적 파일 호스팅. `wrangler pages deploy`로 배포.
- **Tailwind CSS**, **next/og(Satori) + sharp**: OG 썸네일 이미지를 빌드 시점에 정적 생성.

## 1. 데이터 모델 (5개 테이블, `supabase/schema.sql`)

```
pseo_keywords          — 타깃 키워드 (slug, display_name, phone, menu_group/menu_order)
  └─ pseo_keyword_variants   — 키워드 하나당 여러 "콘텐츠 버전"(제목/H1 템플릿 각도가 다름)
       └─ pseo_content_sections — 버전 하나의 서론/본론(H2 여러 개)/결론
pseo_regions            — 지역 트리 (자기참조 parent_id, SIDO>SIGUNGU>DONG>APT)
pseo_page_listings      — "이 키워드 × 이 지역 조합을 실제로 발행한다"는 교차표
                          (여기 없으면 키워드/지역이 둘 다 있어도 페이지가 안 생김 — 안전장치)
```

**설계 이유**:
- **키워드와 콘텐츠를 분리**(`pseo_keywords` vs `pseo_keyword_variants`)한 이유: 같은
  키워드의 지역 페이지끼리 지역명만 다르고 나머지 문장이 똑같으면 중복 콘텐츠로 SEO에
  불리하다. 버전을 여러 개 두고 `(keyword_id + region_id)`를 해시해 지역마다 결정적으로
  버전 하나를 고르면(`lib/supabase.ts`의 `pickVariant`), 재배포해도 같은 페이지는 항상
  같은 버전을 쓰면서도(안정적) 이웃 지역과는 다른 각도의 글이 나온다.
- **`pseo_regions.slug`는 전역 유일이 아니라 `(parent_id, slug)` 조합으로만 유일**해야
  한다. 실제 한국 행정구역에 "중구"(부산·대구·대전·울산·서울 등), "고성군"(강원·경남)처럼
  동명 지역이 흔하기 때문 — 처음에 전역 유니크로 잘못 설계했다가 전국 데이터를 넣으면서
  제약 위반으로 걸려서 고쳤다. URL 경로 해석(`resolveRegionByPath`)도 "형제 범위 안에서만"
  slug를 비교하므로 전역 유일성이 필요 없다.
- **`pseo_page_listings`가 발행 여부의 유일한 진실**: 키워드나 지역을 등록해도 이 표에
  없으면 페이지가 안 생긴다. 지역을 대량으로 미리 넣어두고, 발행은 키워드별로 따로
  통제하고 싶을 때 이 분리가 유용하다.

## 2. Next.js 라우팅 구조

```
app/
  page.tsx                          → / (홈, 키워드 카드 목록)
  layout.tsx                        → 공통 레이아웃(헤더/상단메뉴/푸터)
  not-found.tsx                     → 404
  [keyword]/
    page.tsx                        → /{keyword} (허브: 그 키워드의 전체 지역을 카드로)
    [...path]/
      page.tsx                      → /{keyword}/{시도}/{시군구}/{동}/... (실제 콘텐츠 페이지)
  api/og/[keyword]/[...path]/
    route.tsx                       → /api/og/{keyword}/.../{동}.webp (OG 썸네일, 빌드 시 정적 생성)
```

- `[...path]`(필수 catch-all)로 지역 계층을 슬래시로 전부 펼친다(`/{keyword}/충청남도/천안시/백석동`).
  지역이 하나도 없는 `/{keyword}` 자체는 별도 라우트(허브 페이지)가 담당 — catch-all은
  최소 1단계가 있어야 매치되기 때문.
- `export const dynamicParams = false`를 두 동적 라우트 모두에 선언 — `output:'export'`는
  `generateStaticParams()`가 뱉은 조합만 존재할 수 있고, 그 외 경로는 빌드 단계에서부터
  확실히 404 처리되게 한다.
- OG 이미지 라우트도 페이지와 똑같은 `[...path]` 구조를 그대로 따라간다 — 단, 마지막
  세그먼트에 `.webp` 확장자를 붙인다(`lib/og-url.ts`). 안 붙이면 "충청남도"가 동시에
  페이지 파일이면서 하위 폴더여야 하는 충돌(EISDIR)로 빌드가 깨진다(실제로 겪음).

## 3. 데이터 페칭 전략 (`lib/supabase.ts`)

빌드 시점에 페이지가 수만 개가 되어도 **Supabase 쿼리 횟수는 항상 5번 고정**이다:
`getAllData()`가 5개 테이블을 통째로 한 번씩만 읽어오고(`React.cache()`로 렌더 트리 내
중복 호출 제거), 이후 `getPageData()`/`getStaticParamsList()`는 전부 메모리 안에서
조립한다. 페이지가 10개든 10만 개든 이 부분은 그대로 재사용된다.

**⚠️ 반드시 페이지네이션할 것**: Supabase/PostgREST는 `.range()` 없이 `.select()`만 쓰면
결과가 **에러 없이 조용히 1000행에서 잘린다**. `fetchAllRows()` 헬퍼가 이미 이걸 처리하지만,
새로 짜는 스크립트마다 이 함정을 잊지 말 것 — 실제로 이것 때문에 배포된 사이트에서 일부
지역이 통째로 빠지는 사고가 있었다.

## 4. OG 썸네일 이미지 (`app/api/og/[keyword]/[...path]/route.tsx`)

- `next/og`(Satori)로 PNG 생성 → `sharp`로 WebP 변환. `runtime = 'nodejs'`,
  `dynamic = 'force-static'` (fs로 로컬 폰트/이미지를 읽어야 해서 edge 런타임 불가).
- **한글 폰트를 반드시 로컬로 vendoring**한다(`public/fonts/*.ttf`). 네트워크에서 폰트를
  fetch하게 두면, 빌드 중 네트워크가 잠깐이라도 끊길 때 그 페이지들만 한글이 빈 박스(tofu)로
  렌더링되는 사고가 난다 — 실제로 겪었고, 로컬 폰트로 완전히 해결됨.
- Satori는 `-webkit-text-stroke`를 지원하지 않는다(빌드해서 직접 확인) — 같은 글자를
  8방향으로 오프셋해서 쌓는 방식으로 외곽선 효과를 흉내낸다.
- 썸네일 안 지역명은 페이지 본문(H1/breadcrumb)과 달리 **축약형**을 쓴다("서울특별시"→
  "서울") — 정식 명칭을 그대로 쓰면 좁은 이미지 안에서 줄바꿈되며 아래 문구와 겹친다.

## 5. 빌드 & 배포 파이프라인

```bash
npm run build     # scripts/generate-sitemap.mjs → next build (output:'export')
```

- **Next.js 내장 `app/sitemap.ts` + `generateSitemaps()`는 `output:'export'`와 조합하면
  실제로 깨진다**(이 프로젝트의 Next 14.2.35에서 직접 재현·확인함 — 루트 sitemap.xml이
  안 만들어지거나 "id" 타입 빌드 에러. vercel/next.js #77304, #61969 참고). 그래서
  프레임워크 컨벤션을 쓰지 말고 `scripts/generate-sitemap.mjs`로 빌드 전에 정적 파일을
  직접 써낸다.
- **Cloudflare Pages 무료 플랜은 배포 1건당 파일 2만 개 제한**이 있다(유료는 특정 환경변수로
  10만 개까지). 키워드 수 × 지역 수가 커지면 (html + Next RSC .txt + OG webp)로 페이지당
  3개 파일이 붙어서 금방 넘는다 — 실제로 7키워드 × 전국 읍/면/동에서 약 8만 개 파일이
  나와서 배포가 거부됐다. **해결책: 키워드별로 별도 Cloudflare Pages 프로젝트에 나눠
  배포**한다(`lib/constants.ts`의 `KEYWORD_SITE_URL` 맵이 단일 출처, `scripts/split-by-keyword.mjs`가
  통합 out/을 나누고, `scripts/deploy-all.mjs`가 각 프로젝트에 배포).
  - 이 구조를 쓰면 **다른 키워드로 가는 모든 링크(상단메뉴, "다른 키워드" 섹션, 홈 카드,
    canonical/OG메타, 사이트맵)가 상대경로가 아니라 절대 URL**이어야 한다 — 상대경로면
    다른 프로젝트(다른 파일들)에서 그 경로가 아예 존재하지 않아 404가 난다. 같은 키워드
    내부(하위/인근 지역, breadcrumb 조상)는 같은 프로젝트 안에 있으므로 상대경로 그대로
    둬도 된다. `getKeywordSiteUrl(slug)` 헬퍼로 "이 키워드가 실제로 어느 도메인에 사는지"를
    조회해서 절대/상대를 가른다.
- **지역 단위 증분 배포**(`scripts/incremental-deploy.mjs`): 지역 하나(또는 키워드 하나)만
  바뀌었을 때 전체를 다시 굽지 않고, `INCREMENTAL_KEYWORD`/`INCREMENTAL_REGION_PATHS`
  환경변수로 `generateStaticParams()`를 필터링해서 그 페이지들만 빠르게 재생성한 뒤 기존
  배포 폴더에 **병합**하고 그 키워드 프로젝트 하나만 재배포한다.
  - ⚠️ **병합은 반드시 "덮어쓰기 병합"이어야 하고 "폴더 통째로 교체"이면 절대 안 된다** —
    필터링된 빌드에는 지정한 지역만 들어있어서, 폴더를 통째로 바꿔치기하면 필터에 안 걸린
    나머지 지역 페이지가 전부 사라진다(실제로 이 실수로 라이브 샤드 하나가 11,447개
    파일에서 32개로 줄어드는 사고가 났었다 — `fs.cpSync(src, dest, {recursive:true})`가
    기존 목적지 디렉터리 위에 병합하는 동작이라는 걸 직접 테스트로 확인한 뒤 그걸로
    고쳤다).
  - ⚠️ **`_next/` 같은 공용 정적 자산도 페이지와 함께 병합해야 한다** — Next의 JS 청크
    파일명(콘텐츠 해시)이 빌드마다 완전히 안정적이진 않아서(모듈 그래프가 빌드마다 달라짐),
    페이지 HTML만 새로 넣고 `_next/`를 그대로 두면 새 페이지가 존재하지 않는 청크 파일을
    참조해 `ChunkLoadError`로 라이브에서 하얗게 깨질 수 있다(실제로 겪음). 병합 대상에
    `_next/`, `fonts/`, `bg_images/`, `404.html`, `_headers`를 항상 포함시킨다.

## 6. 새 사이트로 복제하기 (다른 니치로 재사용)

1. **바꾸는 것**: `pseo_keywords`/`pseo_keyword_variants`/`pseo_content_sections`/
   `pseo_regions`/`pseo_page_listings` 데이터(다른 Supabase 프로젝트 또는 같은 프로젝트의
   새 행), `lib/constants.ts`의 브랜드 상수(`FALLBACK_SITE_NAME`, `SITE_URL`,
   `KEYWORD_SITE_URL`), `.env.local`의 Supabase 접속 정보, `public/bg_images/`·로고 이모지.
2. **안 바꾸는 것**: `app/`, `components/`, `lib/region-tree.ts`, `lib/supabase.ts`의
   쿼리/타입 구조, `scripts/generate-sitemap.mjs`/`split-by-keyword.mjs`/
   `deploy-all.mjs`/`incremental-deploy.mjs` — 전부 DB 데이터 기준으로 동작해서 코드
   수정 없이 그대로 재사용된다(TopNav 메뉴 구조까지 DB의 `menu_group`/`menu_order`에서
   나온다 — 코드에 하드코딩 없음).
3. Cloudflare Pages 프로젝트를 새로 만들고(`wrangler pages project create`), 키워드
   개수·지역 범위를 가늠해서 파일 수가 2만 개를 넘을 것 같으면 처음부터 섹션 5의 분할
   배포 구조로 설계한다(나중에 붙이기보다 처음부터 하는 게 훨씬 쉽다).

## 7. 알려진 함정 체크리스트 (빠른 참고용)

| 함정 | 증상 | 해결 |
|---|---|---|
| Supabase 1000행 캡 | 일부 데이터가 조용히 누락 | `.range()` 페이지네이션 필수 |
| `pseo_regions.slug` 전역 유니크 | 동명 지역(중구 등) 삽입 실패 | `(parent_id, slug)` 복합 유니크로 설계 |
| OG 라우트에 확장자 없음 | 빌드 EISDIR 에러 | 마지막 세그먼트에 `.webp` 등 확장자 부여 |
| OG 폰트 네트워크 fetch | 일부 페이지 한글 tofu | 폰트 파일 `public/fonts/`에 로컬 vendoring |
| `app/sitemap.ts` + `output:'export'` | sitemap 안 만들어짐/빌드 에러 | 프레임워크 컨벤션 대신 빌드 전 정적 생성 스크립트 |
| `.next/cache` | DB 바꿨는데 빌드에 반영 안 됨 | 빌드 전 `rm -rf .next` |
| Cloudflare Pages 2만 파일/배포 | 배포 자체가 거부됨 | 키워드(또는 다른 기준)별 프로젝트 분할 |
| 증분 배포 시 폴더 통째 교체 | 필터 밖 페이지가 전부 사라짐 | `cpSync` 병합(overwrite-merge), 절대 `rmSync` 후 교체 금지 |
| 증분 배포 시 `_next/` 미포함 | 라이브에서 `ChunkLoadError` | 공용 정적 자산도 항상 같이 병합 |
