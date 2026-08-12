# pseo-site 배포 가이드

`pseo-site`를 실제로 라이브로 띄우기 위해 딱 4가지만 하면 됩니다. 전부 각자 계정으로
직접 하셔야 하는 부분이라(Claude가 대신 로그인하거나 크레덴셜을 다룰 수 없음) 단계별로
자세히 정리했습니다.

---

## 1단계 — Supabase 프로젝트 준비

### 옵션 A: 기존 수리위키 Supabase 프로젝트 재사용 (추천)

`pseo-site`의 테이블은 전부 `pseo_` 접두사가 붙어 있어서(`pseo_keywords`, `pseo_regions` 등)
기존 `keyword_pages`, `company_profiles` 같은 테이블과 절대 겹치지 않습니다. 새 프로젝트를
따로 팔 필요 없이 기존 프로젝트를 그대로 쓰는 게 가장 간단합니다.

1. https://supabase.com/dashboard 접속 → 기존 수리위키 프로젝트 열기
   (HANDOFF.md 기준 프로젝트 URL: `https://rgdejzrlszpesuodjejw.supabase.co`)
2. 왼쪽 메뉴 **Project Settings → API** 이동
3. **Project URL**과 **anon public** 키를 복사해 둔다
   (⚠️ **service_role** 키가 아니라 **anon public** 키입니다 — anon 키는 브라우저에 노출돼도
   되는 읽기 전용 키, service_role은 절대 노출되면 안 되는 관리자 키입니다)

### 옵션 B: 완전히 새 Supabase 프로젝트 생성

pSEO 사이트를 메인 앱과 데이터까지 완전히 분리하고 싶다면:

1. https://supabase.com/dashboard → **New Project**
2. 프로젝트 이름(예: `pseo-site`), 리전(가까운 곳, 예: Northeast Asia (Seoul) 있으면 그걸로),
   DB 비밀번호 설정 후 생성 (1~2분 소요)
3. 생성 완료 후 **Project Settings → API**에서 Project URL / anon public 키 복사

### `.env.local` 채우기

```bash
cd pseo-site
cp .env.local.example .env.local
```

`.env.local`을 열어서:

```
NEXT_PUBLIC_SUPABASE_URL=위에서 복사한 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=위에서 복사한 anon public 키
NEXT_PUBLIC_SITE_URL=아직 모르면 임시로 http://localhost:3100 (3단계 끝나고 실제 도메인으로 교체)
```

---

## 2단계 — DB 스키마 실행

1. Supabase 대시보드 왼쪽 메뉴 **SQL Editor** 클릭
2. **New query** 클릭
3. [`supabase/schema.sql`](../supabase/schema.sql) 파일 내용을 전부 복사해서 붙여넣고 **Run**
   - 성공하면 `pseo_keywords`, `pseo_regions`, `pseo_content_sections`, `pseo_page_listings`
     4개 테이블이 생성됩니다.
4. (선택, 예시 데이터로 먼저 확인해보고 싶다면) 새 쿼리 창에서
   [`supabase/seed.example.sql`](../supabase/seed.example.sql) 내용도 붙여넣고 **Run**
   - 누수탐지 × 충남/천안시/아산시/불당동/백석동/불당아이파크/불당호반써밋 예시 페이지 6~7개가
     바로 만들어집니다.
5. 왼쪽 메뉴 **Table Editor**에서 4개 테이블에 실제로 행이 들어갔는지 눈으로 확인

**실제 서비스 데이터를 넣을 때는** (예시 데이터 대신):
- `pseo_keywords`에 실제 시공 키워드를 한 줄씩 추가 (title/description/H1 템플릿 포함)
- `pseo_regions`에 지역 트리를 SIDO→SIGUNGU→DONG→APT 순서로 추가 (`parent_id`로 계층 연결)
- `pseo_content_sections`에 키워드별 서론/본론(H2·H3)/결론 문구 추가
- `pseo_page_listings`에 **실제로 발행할** (키워드×지역) 조합만 추가 — 여기 없으면 그 조합은
  페이지가 안 만들어집니다

---

## 3단계 — Cloudflare Pages 연결

1. https://dash.cloudflare.com 접속 (계정 없으면 무료 가입)
2. 왼쪽 메뉴 **Workers & Pages** → **Create application** → **Pages** 탭 → **Connect to Git**
3. GitHub 계정 연동 후 `playskang-svg/suriwiki` 저장소 선택
4. **Set up builds and deployments** 화면에서 아래처럼 설정 (⚠️ 이 저장소는 메인 앱과
   `pseo-site`가 한 저장소에 같이 있는 구조라 **Root directory 지정이 제일 중요**합니다):

   | 항목 | 값 |
   |---|---|
   | Framework preset | Next.js (Static HTML Export) |
   | Build command | `npm run build` |
   | Build output directory | `out` |
   | Root directory (Advanced/고급 설정 안에 있음) | **`pseo-site`** ← 이거 빼먹으면 메인 앱을 빌드하려다 실패합니다 |

5. **Environment variables** 섹션에서 1단계에서 채운 값을 그대로 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → 일단 비워두거나 임시값, 배포 후 실제 발급된 도메인으로 다시 설정
6. **Save and Deploy** 클릭 → 2~3분 후 `https://<프로젝트명>.pages.dev` 형태의 URL이 발급됩니다
7. 발급된 URL을 `NEXT_PUBLIC_SITE_URL` 환경변수에 다시 넣고 **재배포**
   (Cloudflare Pages 대시보드 → 해당 배포 → **Retry deployment**, 또는 커밋 하나 더 푸시)
8. (선택) 커스텀 도메인 쓰고 싶으면 프로젝트 → **Custom domains** → 도메인 추가 후
   `NEXT_PUBLIC_SITE_URL`도 그 도메인으로 갱신

이후로는 `main`에 `pseo-site/` 관련 커밋이 push될 때마다 Cloudflare Pages가 자동으로
재빌드·재배포합니다 (Vercel이 메인 앱을 자동배포하는 것과 동일한 방식).

---

## 4단계 — 배경 이미지 추가

1. `public/bg_images/` 폴더에 실제 시공 현장 사진을 `1.jpg`, `2.jpg`, `3.jpg` ... 형식으로 추가
   (jpg/jpeg/png/webp 지원, 최소 2~3장 권장 — 한 장만 있으면 로테이션 의미가 없음)
2. 반드시 **본인 소유/촬영한 사진**(실제 시공 전후 사진 등)만 사용 — 저작권 문제 없는 이미지인지
   확인
3. 이미지는 자동으로 1200×630 비율로 크롭돼서 썸네일 배경으로 쓰입니다. 너무 어둡거나
   복잡한 사진이어도 텍스트에 검정 외곽선이 있어서 가독성은 유지되지만, 인물 얼굴이 텍스트에
   가려지는 등은 미리 확인해보는 게 좋습니다
4. 추가 후 git commit + push → Cloudflare Pages가 자동 재배포

---

## 완료 후 확인 체크리스트

- [ ] `pseo-site/.env.local`에 실제 Supabase URL/anon key 입력됨
- [ ] Supabase Table Editor에서 4개 `pseo_*` 테이블에 데이터 확인됨
- [ ] Cloudflare Pages 배포 URL 접속 시 홈(`/`)이 정상적으로 뜸
- [ ] 실제 (키워드×지역) 페이지(예: `/leak-detection/cheonan`)가 정상적으로 뜸
- [ ] 페이지 소스보기에서 `<title>`에 이상한 접두사 없이 깔끔하게 나옴
- [ ] OG 이미지(`/api/og/...` 경로)가 WebP로 정상 렌더링됨 (카카오톡/슬랙 등에 링크 공유해서
      미리보기 확인해보면 가장 확실함)
- [ ] `public/bg_images/`에 실제 사진 추가됨
- [ ] `NEXT_PUBLIC_SITE_URL`이 최종 실제 도메인으로 설정됨
