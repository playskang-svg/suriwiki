---
name: pseo-site-ops
description: 도배장판 pSEO 정적 사이트(pseo-site) 데이터 확장·빌드·검증·배포 런북 — 키워드/지역 추가, 콘텐츠 변경부터 키워드별 분할 Cloudflare Pages 배포까지
---

# pseo-site 운영 가이드

`pseo-site/`는 수리위키 메인 앱과 독립된 pSEO(programmatic SEO) 정적 사이트다.
Next.js 14 App Router, `output: 'export'`, Supabase가 데이터베이스, Cloudflare
Pages가 호스팅이다. 키워드(예: 도배장판) × 전국 지역(시/도~읍/면/동)을 곱한
조합마다 정적 페이지 하나씩을 만든다.

이 문서는 2026-08-14, 전국 읍/면/동 전체(7개 키워드 × 3,800+ 지역 ≈ 53,295
페이지) 발행 + 대규모 UX 개선을 실제로 빌드·배포하면서 겪은 함정과 정답을
정리한 런북이다. 다음에 이 프로젝트를 만지는 세션(나 자신이든 다른 세션이든)이
같은 시행착오를 반복하지 않는 게 목적이다.

## 0. 가장 먼저 알아야 할 것: 이 사이트는 프로젝트 1개가 아니다

**Cloudflare Pages 무료 플랜은 배포 1건당 파일 2만 개 제한이 있다.** 7개
키워드 × 전국 읍/면/동까지 발행하면 페이지당 (html + Next RSC .txt + OG webp)
3개 파일이 붙어서 총 파일 수가 8만 개에 육박한다 — 실제로 2026-08-14에 이
상태로 배포를 시도해서 다음 에러로 막힌 걸 확인했다:

```
✘ Error: Pages only supports up to 20,000 files in a deployment for your current plan.
```

(유료 플랜(Pro 이상)이면 대시보드 환경변수 `PAGES_WRANGLER_MAJOR_VERSION=4`로
10만 개까지 늘릴 수 있다 — 무료 플랜 유지가 확정이라면 이 옵션을 다시 검토해도
된다. 이번엔 "여러 프로젝트로 분할"을 선택해서 아래 구조가 됐다.)

그래서 **키워드마다 별도 Cloudflare Pages 프로젝트에 나눠 배포한다**:

| 키워드 | Cloudflare Pages 프로젝트 | 비고 |
|---|---|---|
| 도배장판 | `suriwiki-pseo` | 루트. 홈페이지(`/`)도 여기 산다 |
| 도배업체 | `suriwiki-pseo-dobae-eopche` | |
| 아파트도배 | `suriwiki-pseo-apateu-dobae` | |
| 벽지 | `suriwiki-pseo-byeokji` | |
| 장판 | `suriwiki-pseo-jangpan` | |
| 도배가격 | `suriwiki-pseo-dobae-gagyeok` | |
| 도배비용 | `suriwiki-pseo-dobae-biyong` | |

이 매핑의 단일 출처(source of truth)는 [`lib/constants.ts`](../../../pseo-site/lib/constants.ts)의
`KEYWORD_SITE_URL`이다. `scripts/generate-sitemap.mjs`와
`scripts/split-by-keyword.mjs`는 순수 node 스크립트라 `@/lib` import 별칭을
못 써서 **같은 내용을 그대로 복사**해 갖고 있다 — 매핑을 바꾸면 이 세 파일을
전부 같이 바꿔야 한다.

이 구조 때문에 TopNav(상단메뉴)·InternalLinks(다른 키워드 섹션)·홈페이지
카드·canonical/OG메타·JSON-LD·사이트맵의 "다른 키워드로 가는 링크"는 전부
**상대경로가 아니라 절대 URL**이어야 한다(`getKeywordSiteUrl()` 헬퍼 사용).
새 키워드를 추가하거나 이 파일들을 건드릴 때는 "이 링크가 다른 키워드를
가리키는가?"를 항상 먼저 물어봐야 한다 — 같은 키워드 내부(하위/인근 지역,
breadcrumb 조상)는 상대경로 그대로 둬도 된다(같은 프로젝트 안에 있으므로).

## 1. 데이터 변경 (키워드/지역/콘텐츠)

- **절대 SQL을 대시보드에 수동으로 붙여넣지 않는다** — `service_role` 키를
  쓰는 독립 Node 스크립트(`scripts/*.mjs`, `node --env-file=.env.local
  scripts/xxx.mjs`)로 자동화한다. `service_role` 키는 `.env.local`에만 있고
  (`NEXT_PUBLIC_` 접두사 금지, 절대 커밋 금지), 앱 코드(anon key, RLS 적용)와
  완전히 분리돼 있다.
- 지역 추가 스크립트 예시: `scripts/seed-nationwide-regions.mjs`(시/도·시/군/구),
  `scripts/seed-dong-regions.mjs`(읍/면/동). 새 지역 계층을 추가할 땐
  `pseo_regions.slug` 유니크 제약이 **`(parent_id, slug)` 조합**이지 전역
  유니크가 아님을 기억할 것 — 한국 행정구역은 "중구"·"고성군"처럼 다른
  광역시/도에 동명 지역이 실제로 존재한다.
- 발행 스크립트: `scripts/publish-nationwide-listings.mjs` — 키워드 ×
  지역을 cross-join해서 `pseo_page_listings`를 upsert한다.
- 콘텐츠(본문 4단락) 스크립트: `scripts/expand-content-sections.mjs`.

### ⚠️ 함정: Supabase 1000행 캡

`.select()`는 `.range()` 페이지네이션 없이 쓰면 결과가 조용히 1000행에서
잘린다 — 에러 없이 그냥 잘림. `lib/supabase.ts`의 `fetchAllRows()`가 이미
모든 대량 조회를 페이지네이션 처리하지만, **새 스크립트를 짤 때마다 직접
`.range(from, from+999)` 루프를 다시 확인**해야 한다. 이 버그가 실제 배포된
사이트에서 일부 키워드·지역이 통째로 빠지는 원인이었던 적이 있다.

## 2. 빌드

```bash
cd pseo-site
rm -rf .next out out-*   # 이전 빌드/샤드 잔재 제거 (아래 두 함정 때문에 필수)
npm run build             # = generate-sitemap.mjs 실행 → next build
```

- 페이지 5만 개 이상이면 **50~60분** 걸린다. `SAMPLE_BUILD_LIMIT=200 npm
  run build:sample`(=`build:sample` 스크립트)로 로컬 확인용 소량 빌드를 먼저
  해볼 수 있다 — 단, 이건 **운영 배포용 지름길이 아니다** (Next 정적 export는
  진짜 증분 빌드를 지원하지 않는다).
- 빌드 전 항상 `rm -rf .next`: `.next/cache/fetch-cache`가 이전 Supabase
  조회 결과를 캐싱해서, DB를 바꾼 뒤 빌드해도 새 키워드/지역이 조용히
  빠질 수 있다.
- `app/sitemap.ts` + `generateSitemaps()` 같은 Next.js 내장 사이트맵
  컨벤션은 **이 프로젝트(Next 14.2.35 + output:'export')에서 실제로 깨진다**
  (루트 sitemap.xml이 안 만들어지거나 빌드가 "id" 타입 에러로 죽음 — 직접
  재현해서 확인함, vercel/next.js #77304 #61969). 그래서 프레임워크 컨벤션을
  쓰지 말고 `scripts/generate-sitemap.mjs`(빌드 전 정적 파일로 직접 생성)
  방식을 계속 쓸 것 — `app/sitemap.ts`를 다시 추가하고 싶어질 수 있는데, 이미
  시도해봤고 안 된다.
- OG 이미지 한글 폰트는 `public/fonts/BlackHanSans-Regular.ttf`를 로컬에
  두고 쓴다(`lib/og-font.ts`가 네트워크 fetch보다 우선). 이 파일을 지우면
  빌드 중 네트워크 이슈 시 한글이 빈 박스(tofu)로 렌더링되는 문제가 재발한다.

### ⚠️ 빌드 프로세스를 다룰 때

- 절대 `pkill -f <패턴>`처럼 넓은 패턴으로 죽이지 말 것 — 모든 Bash 도구
  호출이 공유하는 shell-snapshot 소싱 라인과 우연히 매치돼 진행 중인 빌드
  자체를 죽인 적이 있다. 죽여야 하면 `ps -eo pid,ppid,...`로 프로세스 트리를
  먼저 확인하고 **정확한 PID로만** kill한다.
- 백그라운드로 오래 도는 빌드는 `run_in_background: true`로 시작하고,
  주기적으로 로그 tail + `ps`로 워커 프로세스가 살아있는지 확인하는 식으로
  기다린다.

## 3. 빌드 후 검증 체크리스트

풀 브라우저 없이도 대부분 터미널에서 빠르게 확인 가능:

```bash
grep "Generating static pages (N/N)" 로그   # N/N 완전 일치 = 완료, 개수 불일치면 실패
grep -i "error\|failed\|ENOTFOUND" 로그      # 비어있어야 정상
find out -name "*.html" | wc -l              # 예상 페이지 수와 대략 일치하는지
ls out/sitemap.xml out/robots.txt            # 둘 다 존재해야 함
```

leaf(최하단, 예: `.../시군구/동`) 페이지 하나를 골라 직접 확인:

- 해시태그: `grep -o '#[가-힣0-9·]*' 그_html` — 단, React SSR이 `#`와 텍스트
  사이에 `<!-- -->` 하이드레이션 마커를 끼워넣으므로 단순 정규식은 잘 안
  잡힌다. Python으로 `<h1` 주변 원문을 그대로 출력해서 눈으로 확인하는 게
  더 정확하다.
- FAQPage JSON-LD: `grep -o '"@type":"FAQPage"'`
- OG 이미지: `out/api/og/{키워드}/{경로}.webp` 파일을 **Read 도구로 직접
  열어서 눈으로 확인** — 한글이 깨지는지(tofu), 지역명 축약이 됐는지는
  텍스트 grep으로는 못 잡는다.
- 여러 키워드 프로젝트로 나뉜 뒤에는: canonical/og:url/사이트맵 URL이
  **그 페이지 자신의 키워드 도메인**을 가리키는지, TopNav의 다른 키워드
  링크가 **절대 URL**인지 확인 (섹션 0 참고).

## 4. 배포 (키워드별 분할)

```bash
npm run split    # out/를 out/(루트=도배장판+홈) + out-*/(나머지 6개 키워드)로 분할
npm run deploy    # 7개를 각자의 Cloudflare Pages 프로젝트에 순서대로 배포
```

- `split`은 **재빌드하지 않는다** — 이미 완성된 `out/`을 파일 이동/복사만
  해서 나눈다. 그래서 cross-keyword 링크·canonical·사이트맵이 **빌드
  시점에(소스 코드 레벨에서) 이미 정확한 절대 URL**이어야 한다(섹션 0).
  사후에 sed로 HTML을 패치하는 방식은 일부러 안 썼다 — Next 하이드레이션이
  RSC payload(.txt)에 남아있는 원래(상대) href로 되돌려버릴 위험이 있어서다.
- 새 Cloudflare Pages 프로젝트가 필요하면: `npx wrangler pages project
  create <이름> --production-branch=main` (한 번만 하면 됨, 이후 배포부터는
  `deploy-all.mjs`가 자동으로 처리).
- 파일 수가 다시 2만 개에 근접하면(키워드 추가, 지역 세분화 등) 섹션 0의
  표 + `lib/constants.ts`/`scripts/generate-sitemap.mjs`/
  `scripts/split-by-keyword.mjs` 세 곳의 `KEYWORD_SITE_URL`에 새 프로젝트를
  추가해야 한다.

## 5. Git

- 이 저장소는 PR을 **squash-merge**한다 — squash-merge 후에는 로컬 브랜치가
  `origin/main`의 스쿼시 커밋과 갈라져서, 같은 브랜치로 또 push하면
  `git merge-tree` 충돌이 난다(내용은 호환돼도). **매번 `origin/main`
  기준으로 새 브랜치를 파고 보류 중인 커밋을 cherry-pick**해서 새 PR을 여는
  방식으로 우회한다.

## 6. 알려진 이슈 / 다음 할 일

- 콘텐츠 분량이 요청한 1500~2000자(공백 제외)보다 짧다(현재 약 900~1200자,
  `scripts/expand-content-sections.mjs` 템플릿 기준) — 더 확장이 필요하면
  이 스크립트의 `CONTENT` 맵을 더 길게 다시 써야 한다.
- 증분(부분) 빌드/배포는 아직 없다 — 지역 하나 추가하려고 매번 53k 페이지
  전체를 다시 빌드해야 한다. "새로 추가된 페이지만 빌드해서 기존 out/에
  병합" 스크립트가 다음 계획으로 논의됐지만 아직 구현 전이다. 이제 배포가
  키워드별로 나뉘어 있으니, 구현한다면 **키워드 샤드 단위**로 증분화하는 게
  자연스럽다(한 키워드만 바뀌었으면 그 샤드만 재빌드+재배포).
- 커스텀 도메인(`dj.adbles.com`)은 아직 루트(`suriwiki-pseo`) 프로젝트에만
  연결 논의 중이었다 — 7개로 나뉜 지금은 서브도메인(`dobae.dj.adbles.com`
  등) 또는 Cloudflare Worker를 이용한 경로 기반 라우팅(`dj.adbles.com/도배업체/*`
  → 다른 프로젝트로 프록시) 중 하나를 다시 정해야 한다. Cloudflare Pages
  "Custom domains" 등록 자체는 대시보드에서만 가능하고 CLI(wrangler)로는
  안 된다 — 사용자가 직접 해야 하는 단계.
- 나중에 관리자용 입력 페이지를 만들 때는 키워드 / 썸네일·연락처·링크 /
  이미지, 이 세 카테고리를 서로 독립적으로 부분 수정 가능하게 설계해야 하고,
  이 엔진을 새 사이트로 복제할 때도 이 구분이 그대로 유지돼야 한다(아직
  설계만 논의, 미구현).
