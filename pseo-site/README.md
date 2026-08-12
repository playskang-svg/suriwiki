# pseo-site — 템플릿형 pSEO 웹사이트 빌더

타깃 **키워드**와 **지역/아파트 DB**만 Supabase에서 갈아끼우면, `/[키워드]/[지역-slug]` 페이지가
무한대로 자동 생성되는 Next.js 14(App Router) 정적 사이트입니다. `output: 'export'`로 순수 정적
파일(HTML/CSS/JS/이미지)만 빌드하므로 **Cloudflare Pages에 무료로 호스팅**할 수 있습니다.

> 메인 수리위키(suriwiki) 앱과는 완전히 독립된 프로젝트입니다(자체 `package.json`, 자체 배포).
> `../app`, `../lib` 등 상위 프로젝트 파일은 이 프로젝트와 무관하며 건드리지 않습니다.

## 1. 로컬 실행

```bash
cd pseo-site
npm install
cp .env.local.example .env.local   # Supabase URL/키 채우기
npm run dev                        # http://localhost:3100
```

DB에 아직 아무것도 없다면 `supabase/schema.sql` → `supabase/seed.example.sql` 순서로
Supabase SQL Editor에서 실행하면, 예시 페이지(`/leak-detection/cheonan` 등)가 바로 뜹니다.

## 2. 정적 빌드 & 배포 (Cloudflare Pages)

```bash
npm run build     # out/ 폴더에 순수 정적 파일 생성
```

Cloudflare Pages 대시보드에서:
- Framework preset: **Next.js (Static HTML Export)**
- Build command: `npm run build`
- Build output directory: `out`
- 환경변수에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` 등록

DB 내용을 바꾼 뒤에는 **Cloudflare Pages에서 재배포(재빌드)해야** 반영됩니다 — 순수 정적
export라 ISR/실시간 갱신은 없습니다(서버가 없으므로 무료로 호스팅되는 대신 생기는 트레이드오프).

## 3. 데이터 구조 한눈에 보기

| 테이블 | 역할 |
|---|---|
| `pseo_keywords` | 타깃 키워드 (title/description/H1 템플릿, 기본 상담번호 포함) |
| `pseo_regions` | SIDO→SIGUNGU→DONG→APT 4단계 지역 트리 (자기참조) |
| `pseo_content_sections` | 키워드별 서론/본론(H2·H3)/결론 템플릿 |
| `pseo_page_listings` | 실제로 "발행"할 (키워드×지역) 조합. `phone_override`(본문 상담번호)와 `thumbnail_phone`(썸네일 전용 번호)을 이 표에서 조합별로 다르게 줄 수 있다 — 여기 없으면 페이지가 안 생긴다 |

새 지역/아파트를 늘리려면 `pseo_regions`에 행을 추가하고 `pseo_page_listings`에 발행 조합을
추가하면 됩니다. 새 키워드(시공 항목)를 늘리려면 `pseo_keywords` + `pseo_content_sections` +
`pseo_page_listings`만 추가하면 되고, 코드는 한 줄도 바꿀 필요가 없습니다.

## 4. 요구사항 ↔ 파일 대응표

| 요구사항 | 구현 위치 |
|---|---|
| 1. 플랫 동적 라우팅 · SEO 메타 · 정적 export | `app/[keyword]/[slug]/page.tsx`, `next.config.mjs`, `lib/content.ts`(sanitize) |
| 2. 템플릿 변수 치환 · H1/H2/H3 시맨틱 구조 | `lib/content.ts`(renderTemplate), `app/[keyword]/[slug]/page.tsx` |
| 3. 배경 이미지 로테이션 · 동적 OG 썸네일 · 연락처 배너 | `lib/bg-images.ts`, `lib/og-font.ts`, `app/api/og/[keyword]/[slug]/route.tsx`, `components/ContactBanner.tsx` |
| 4. 계층형 내부 링크(거미줄 링크) | `lib/region-tree.ts`, `components/InternalLinks.tsx` |
| 5. 광고 슬롯 레이아웃 고정 | `components/AdSlot.tsx`, `app/layout.tsx`(상/하단), `app/[keyword]/[slug]/page.tsx`(중단), `app/globals.css`(`.ad-container`) |

## 5. 알아두면 좋은 설계 결정

- **OG 이미지 라우트가 `app/api/og/route.tsx`가 아니라 `app/api/og/[keyword]/[slug]/route.tsx`인 이유**:
  `output:'export'`는 요청 시점에 쿼리스트링을 읽는 동적 라우트를 지원하지 않습니다. 페이지와
  동일하게 `generateStaticParams`로 모든 조합을 빌드 시점에 정적 이미지 파일로 미리 구워냅니다.
- **Supabase 쿼리는 항상 4번 고정**: `lib/supabase.ts`의 `getAllData()`가 4개 테이블을 한 번에
  전부 읽어 메모리에서 조립합니다. 페이지가 10개든 10만 개든 쿼리 횟수가 늘지 않습니다.
- **한글 OG 이미지 폰트**: `next/og`(Satori)는 기본 폰트에 한글이 없어 별도 폰트 버퍼가
  필수입니다. `lib/og-font.ts`가 Google Fonts에서 자동으로 받아오되, `public/fonts/`에 폰트
  파일을 넣어두면 그걸 우선 씁니다(오프라인 빌드 대비).
- **`_headers` 파일**: 정적 export된 OG 이미지 경로에 확장자가 없어도 Cloudflare Pages가
  `Content-Type: image/webp`를 정확히 내려주도록 `public/_headers`에 명시했습니다.
- **썸네일 형식은 WebP**: `next/og`(ImageResponse)는 PNG만 만들 수 있어서, `sharp`로 한 번 더
  WebP로 변환해서 응답합니다(같은 화질 대비 용량이 작아 페이지 로딩에도 유리).
- **텍스트 외곽선(stroke)**: `next/og`가 쓰는 렌더러(Satori)는 CSS `-webkit-text-stroke`를
  지원하지 않습니다(실제로 빌드해서 확인). 그래서 같은 글자를 8방향으로 살짝 오프셋해 겹쳐
  그리는 방식으로 외곽선을 흉내냅니다 — `app/api/og/.../route.tsx`의 `StrokedText` 참고.
- **썸네일 전용 전화번호**: `pseo_page_listings.thumbnail_phone`을 채우면 본문 상담번호
  (`phone`/`phone_override`)와 별개로 썸네일 이미지에만 다른 번호를 박을 수 있습니다.
  비워두면 자동으로 본문 상담번호를 그대로 씁니다.
- **목차(TOC)**: 별도 DB 필드 없이 `pseo_content_sections`의 H2/H3 `heading_template`에서
  자동 생성됩니다(`components/TableOfContents.tsx`). 본문 헤딩과 항상 같은 값을 쓰므로
  둘이 어긋날 일이 없습니다.
- **SEO/GEO 구조화 데이터**: 페이지마다 `BreadcrumbList`(지역 계층)와 `Service` JSON-LD를
  삽입합니다. 검색엔진 리치 스니펫뿐 아니라, 생성형 검색(GEO) 크롤러가 "어느 지역의 무슨
  서비스인지"를 텍스트 파싱 없이 구조적으로 읽어갈 수 있게 하기 위함입니다.
